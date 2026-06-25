//> using scala 3.3.8
//> using dep org.scalus::scalus-cardano-ledger:0.18.2
//> using mainClass RecoverDeposits

// Recovers the governance-action deposits from the expired Scalus treasury
// withdrawal proposals submitted on the Cardano *preview* testnet.
//
// Three TreasuryWithdrawals proposals were submitted from the admin stake
// account, each posting a 100,000 tADA gov-action deposit. All three expired
// and were dropped, so the ledger has already refunded every deposit to the
// proposal's deposit-return reward account (the admin stake key). The reward
// account therefore now holds 3 x 100,000 = 300,000 tADA withdrawable.
//
// A Cardano reward withdrawal is all-or-nothing: one withdrawal tx drains the
// entire balance. So this builds a single reward-withdrawal tx that moves the
// whole reward balance to the admin payment address, signs it with the admin
// payment + stake keys, and (with --submit) broadcasts it via Blockfrost.
//
// Addresses are DERIVED from the private keys (priv -> pub -> blake2b_224 ->
// address) and only cross-checked against keys/admin.addr & keys/admin.stake.addr;
// the .addr files are never the source of truth.
//
// Default is dry-run: build + sign, print the tx (Pretty showDetailed), write
// the signed CBOR to recover-deposits.signed.tx, but DO NOT submit.
// Pass --submit to broadcast.

import scalus.cardano.ledger.*
import scalus.cardano.address.{
    Address,
    Network,
    ShelleyAddress,
    ShelleyPaymentPart,
    ShelleyDelegationPart,
    StakeAddress,
    StakePayload
}
import scalus.cardano.txbuilder.{TxBuilder, TransactionSigner}
import scalus.cardano.node.{BlockfrostProvider, BlockfrostProviderPlatform}
import scalus.uplc.builtin.ByteString
import scalus.uplc.builtin.Builtins.blake2b_224
import scalus.crypto.ed25519.{JvmEd25519Signer, SigningKey, VerificationKey}
import scalus.utils.showDetailed

import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration.*
import java.nio.file.{Files, Path}
import java.net.URI
import java.net.http.{HttpClient, HttpRequest, HttpResponse}

object RecoverDeposits {

    // Expected gov-action deposit per proposal and how many we submitted, used
    // only as a sanity bound on the live reward balance (see assertion below).
    val DepositPerProposal = 100_000_000_000L // 100,000 tADA
    val ExpectedProposals  = 3

    val OutPath = Path.of("recover-deposits.signed.tx")

    def main(args: Array[String]): Unit = {
        val submit = args.contains("--submit")
        val apiKey = loadBlockfrostKey()

        // --- Derive payment + stake key hashes from the private keys ----------
        val (payHash, payVk, paySk)     = deriveKey("../keys/admin.skey", "../keys/admin.vkey")
        val (stakeHashBs, stakeVk, stakeSk) =
            deriveKey("../keys/admin.stake.skey", "../keys/admin.stake.vkey")

        val payKeyHash   = AddrKeyHash(payHash)
        val stakeKeyHash = Hash.stakeKeyHash(stakeHashBs)
        println(s"[ok] derived payment key hash : ${payKeyHash.toHex}")
        println(s"[ok] derived stake   key hash : ${stakeKeyHash.toHex}")

        // --- Build addresses from the derived hashes, verify vs .addr files ---
        val paymentAddr = ShelleyAddress(
          Network.Testnet,
          ShelleyPaymentPart.Key(payKeyHash),
          ShelleyDelegationPart.Key(stakeKeyHash)
        )
        val stakeAddr = StakeAddress(Network.Testnet, StakePayload.Stake(stakeKeyHash))

        val paymentBech32 = paymentAddr.toBech32.get
        val stakeBech32   = stakeAddr.toBech32.get
        verifyAgainstFile("../keys/admin.addr", paymentBech32, "payment address")
        verifyAgainstFile("../keys/admin.stake.addr", stakeBech32, "stake address")
        println(s"[ok] payment address verified : $paymentBech32")
        println(s"[ok] stake   address verified : $stakeBech32")

        // --- Query the live reward balance ------------------------------------
        // Withdrawals only require the account be *registered*. Blockfrost's
        // `active` flag instead means "delegated to a pool this epoch" — it is
        // false for an undelegated account, which is irrelevant here.
        val (withdrawable, registered) = fetchAccount(apiKey, stakeBech32)
        require(registered, s"stake account $stakeBech32 is not registered — nothing to withdraw")
        require(withdrawable > 0L, s"reward account is empty (withdrawable=$withdrawable)")
        val expected = DepositPerProposal.toLong * ExpectedProposals
        require(
          withdrawable >= DepositPerProposal,
          s"withdrawable $withdrawable < one deposit ($DepositPerProposal) — unexpected"
        )
        if withdrawable != expected then
            println(
              s"[warn] withdrawable ($withdrawable) != ${ExpectedProposals}x deposit ($expected); " +
                  "proceeding with the live balance"
            )
        println(
          f"[info] reward balance to recover: $withdrawable%d lovelace (${withdrawable / 1e6}%.6f tADA)"
        )

        // --- Provider (live preview protocol params + admin UTxO lookup) ------
        given ExecutionContext = ExecutionContext.global
        given sttp.client4.Backend[Future] = BlockfrostProviderPlatform.defaultBackend
        val provider = Await.result(BlockfrostProvider.preview(apiKey), 60.seconds)
        val env = provider.cardanoInfo
        require(
          env.network == Network.Testnet,
          s"provider network ${env.network} is not Testnet — refusing to mix networks"
        )
        println(s"[info] network=${env.network}; protocol params loaded")

        // --- Pick one ada-only fee/change input at the payment address --------
        val utxos: Utxos = Await.result(provider.findUtxos(paymentAddr), 60.seconds) match
            case Right(u) => u
            case Left(e)  => sys.error(s"payment-address UTxO query failed: $e")
        val candidates = utxos.filter { case (_, o) =>
            o.value.coin.value >= 2_000_000L && o.value.assets.isEmpty
        }
        require(
          candidates.nonEmpty,
          "no ada-only UTxO (>= 2 ADA) at the payment address to pay the fee"
        )
        // Smallest input that clears the threshold; the 300k withdrawal funds the rest.
        val (feeIn, feeOut) = candidates.minBy { case (_, o) => o.value.coin.value }
        val feeUtxo = Utxo(feeIn, feeOut)
        println(
          f"[info] fee/change input: ${feeIn.transactionId.toHex}#${feeIn.index} " +
              f"(${feeOut.value.coin.value / 1e6}%.6f ADA)"
        )

        // --- Build + sign -----------------------------------------------------
        val built = TxBuilder(env)
            .spend(feeUtxo)
            .withdrawRewards(stakeAddr, Coin(withdrawable))
            .build(paymentAddr)
        val signer = TransactionSigner(
          Set((paySk, payVk: ByteString), (stakeSk, stakeVk: ByteString))
        )
        val tx = built.sign(signer).transaction

        // --- Verify the built/signed tx ---------------------------------------
        val body = tx.body.value
        val wd = body.withdrawals.getOrElse(sys.error("no withdrawals in tx")).withdrawals
        require(wd.size == 1, s"expected exactly 1 withdrawal, got ${wd.size}")
        require(
          wd.values.head.value == withdrawable,
          s"withdrawal amount ${wd.values.head.value} != $withdrawable"
        )
        val witHashes = tx.witnessSet.vkeyWitnesses.toSeq.map(_.vkeyHash.toHex).toSet
        require(
          witHashes == Set(payKeyHash.toHex, stakeKeyHash.toHex),
          s"unexpected vkey witnesses: $witHashes"
        )
        val changeToAdmin =
            body.outputs.map(_.value).filter(_.address == (paymentAddr: Address))
                .map(_.value.coin.value).sum
        println(
          f"[ok] withdrawal=$withdrawable%d, fee=${body.fee.value}%d, " +
              f"change->admin=$changeToAdmin%d (${changeToAdmin / 1e6}%.6f ADA), " +
              s"witnesses=${witHashes.size}"
        )

        // --- Pretty-print the resulting transaction ---------------------------
        println("\n=== TRANSACTION (showDetailed) ===")
        println(tx.showDetailed)

        // --- Write signed CBOR hex --------------------------------------------
        val hex = tx.toCbor.map(b => f"${b & 0xff}%02x").mkString
        Files.writeString(OutPath, hex)
        println(s"\n[done] wrote signed tx CBOR hex -> ${OutPath.toAbsolutePath}")
        println(s"       tx id = ${tx.id.toHex}; size = ${tx.toCbor.length} bytes")

        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            sys.exit(0)
        }

        println("\n[submit] broadcasting via Blockfrost…")
        Await.result(provider.submit(tx), 60.seconds) match
            case Right(h) => println(s"[submitted] tx hash: ${h.toHex}")
            case Left(e)  => sys.error(s"submit failed: $e")
        sys.exit(0)
    }

    /** Read a raw-hex ed25519 keypair; derive the pubkey from the private key,
      * assert it matches the .vkey file, and return (keyHash28, pubBytes, privBytes).
      */
    private def deriveKey(
        skPath: String,
        vkPath: String
    ): (ByteString, VerificationKey, ByteString) = {
        val skHex = Files.readString(Path.of(skPath)).trim
        val vkHex = Files.readString(Path.of(vkPath)).trim
        val sk    = SigningKey.unsafeFromByteString(ByteString.fromHex(skHex))
        val pub   = JvmEd25519Signer.derivePublicKey(sk)
        require(
          pub.toHex == vkHex,
          s"$skPath: derived pubkey ${pub.toHex} != $vkPath ($vkHex)"
        )
        val keyHash = blake2b_224(pub)
        (keyHash, pub, ByteString.fromHex(skHex))
    }

    private def verifyAgainstFile(path: String, derived: String, label: String): Unit = {
        val onFile = Files.readString(Path.of(path)).trim
        require(
          onFile == derived,
          s"$label mismatch: derived=$derived but $path=$onFile"
        )
    }

    /** Blockfrost /accounts/{stake} -> (withdrawable_amount, registered). */
    private def fetchAccount(apiKey: String, stakeBech32: String): (Long, Boolean) = {
        val client = HttpClient.newHttpClient()
        val req = HttpRequest.newBuilder()
            .uri(URI.create(
              s"https://cardano-preview.blockfrost.io/api/v0/accounts/$stakeBech32"))
            .header("project_id", apiKey)
            .GET().build()
        val resp = client.send(req, HttpResponse.BodyHandlers.ofString())
        require(
          resp.statusCode() == 200,
          s"blockfrost account fetch ${resp.statusCode()}: ${resp.body()}"
        )
        val j = ujson.read(resp.body())
        (j("withdrawable_amount").str.toLong, j("registered").bool)
    }

    private def loadBlockfrostKey(): String = {
        sys.env.get("BLOCKFROST_PROJECT_ID").filter(_.nonEmpty).getOrElse {
            val candidates = Seq(Path.of("../.env"), Path.of(".env"))
            candidates.collectFirst { case p if Files.exists(p) =>
                Files.readString(p).linesIterator
                    .map(_.trim)
                    .find(_.startsWith("BLOCKFROST_PROJECT_ID"))
                    .map(_.dropWhile(_ != '=').drop(1).trim.replaceAll("^\"|\"$", ""))
            }.flatten.getOrElse(sys.error("BLOCKFROST_PROJECT_ID not set (env or ../.env)"))
        }
    }
}
