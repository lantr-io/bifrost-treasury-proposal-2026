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
// entire balance to the admin payment address.
//
// CONWAY PREREQUISITE (post-Plomin): a reward withdrawal is rejected with
// `ConwayWdrlNotDelegatedToDRep` unless the stake credential is delegated to a
// DRep. The ledger checks this against the delegation state at the START of the
// withdrawal tx (Conway Rules/Ledger.hs: the wdrl check runs BEFORE the CERTS
// sub-rule applies this tx's certificates), so a VoteDelegCert in the SAME tx
// does NOT satisfy it — the delegation must be in a PRIOR confirmed tx. This
// tool therefore: if the account isn't DRep-delegated, first submits a
// delegation tx (to AlwaysAbstain), waits for it to confirm, then submits the
// withdrawal.
//
// Addresses are DERIVED from the private keys (priv -> pub -> blake2b_224 ->
// address) and only cross-checked against keys/admin.addr & keys/admin.stake.addr.
//
// Default is dry-run: build + sign + print (Pretty showDetailed) the withdrawal
// tx and DO NOT submit. Pass --submit to broadcast (delegation first if needed).

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

    val DepositPerProposal = 100_000_000_000L // 100,000 tADA
    val ExpectedProposals  = 3
    val OutPath            = Path.of("recover-deposits.signed.tx")

    private val http = HttpClient.newHttpClient()
    private given ExecutionContext = ExecutionContext.global

    def main(args: Array[String]): Unit = {
        val submit = args.contains("--submit")
        val apiKey = loadBlockfrostKey()

        // --- Derive payment + stake key hashes from the private keys ----------
        val (payHashBs, payVk, paySk)       = deriveKey("../keys/admin.skey", "../keys/admin.vkey")
        val (stakeHashBs, stakeVk, stakeSk) =
            deriveKey("../keys/admin.stake.skey", "../keys/admin.stake.vkey")
        val payKeyHash   = AddrKeyHash(payHashBs)
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

        // --- Query the live account state -------------------------------------
        var acct = fetchAccount(apiKey, stakeBech32)
        require(acct.registered, s"stake account $stakeBech32 is not registered — nothing to withdraw")
        require(acct.withdrawable > 0L, s"reward account is empty (withdrawable=${acct.withdrawable})")
        require(
          acct.withdrawable >= DepositPerProposal,
          s"withdrawable ${acct.withdrawable} < one deposit ($DepositPerProposal) — unexpected"
        )
        val expected = DepositPerProposal * ExpectedProposals
        if acct.withdrawable != expected then
            println(s"[warn] withdrawable (${acct.withdrawable}) != ${ExpectedProposals}x deposit ($expected)")
        println(f"[info] reward balance to recover: ${acct.withdrawable}%d lovelace (${acct.withdrawable / 1e6}%.6f tADA)")
        println(s"[info] DRep-delegated: ${acct.drepDelegated} (drep_id=${acct.drepId.getOrElse("none")})")

        // --- Provider ---------------------------------------------------------
        given sttp.client4.Backend[Future] = BlockfrostProviderPlatform.defaultBackend
        val provider = Await.result(BlockfrostProvider.preview(apiKey), 60.seconds)
        val env = provider.cardanoInfo
        require(env.network == Network.Testnet, s"provider network ${env.network} is not Testnet")
        println(s"[info] network=${env.network}; protocol params loaded")

        val signer = TransactionSigner(
          Set((paySk, payVk: ByteString), (stakeSk, stakeVk: ByteString))
        )

        // --- Phase 1: ensure DRep delegation (separate prior tx) --------------
        if !acct.drepDelegated then {
            println(
              "\n[delegation] account is not delegated to a DRep — a reward withdrawal would be\n" +
                  "             rejected (ConwayWdrlNotDelegatedToDRep). A delegation tx to\n" +
                  "             AlwaysAbstain must be submitted and confirmed FIRST."
            )
            val delegTx = signer.sign(
              TxBuilder(env)
                  .spend(pickFeeUtxo(provider, paymentAddr, Set.empty))
                  .delegateVoteToDRep(stakeAddr, DRep.AlwaysAbstain)
                  .build(paymentAddr)
                  .transaction
            )
            requireWitnesses(delegTx, Set(payKeyHash.toHex, stakeKeyHash.toHex))
            println("\n=== DELEGATION TX (showDetailed) ===")
            println(delegTx.showDetailed)

            if !submit then {
                println("\n--dry-run: not submitting the delegation tx.")
            } else {
                println(s"\n[submit] broadcasting delegation tx ${delegTx.id.toHex}…")
                submitTx(provider, delegTx)
                println("[submit] delegation submitted; waiting for on-chain confirmation…")
                waitForConfirmation(apiKey, delegTx.id.toHex)
                waitForDRepDelegation(apiKey, stakeBech32)
                acct = fetchAccount(apiKey, stakeBech32)
                println(s"[ok] account now DRep-delegated (drep_id=${acct.drepId.getOrElse("?")})")
            }
        }

        // --- Phase 2: the withdrawal tx ---------------------------------------
        val withdrawTx = signer.sign(
          TxBuilder(env)
              .spend(pickFeeUtxo(provider, paymentAddr, Set.empty))
              .withdrawRewards(stakeAddr, Coin(acct.withdrawable))
              .build(paymentAddr)
              .transaction
        )
        requireWitnesses(withdrawTx, Set(payKeyHash.toHex, stakeKeyHash.toHex))
        val body = withdrawTx.body.value
        val wd = body.withdrawals.getOrElse(sys.error("no withdrawals in tx")).withdrawals
        require(wd.size == 1 && wd.values.head.value == acct.withdrawable, "withdrawal amount mismatch")
        val changeToAdmin = body.outputs.map(_.value)
            .filter(_.address == (paymentAddr: Address)).map(_.value.coin.value).sum
        println(
          f"\n[ok] withdrawal=${acct.withdrawable}%d, fee=${body.fee.value}%d, " +
              f"change->admin=$changeToAdmin%d (${changeToAdmin / 1e6}%.6f ADA)"
        )

        println("\n=== WITHDRAWAL TX (showDetailed) ===")
        println(withdrawTx.showDetailed)

        val hex = withdrawTx.toCbor.map(b => f"${b & 0xff}%02x").mkString
        Files.writeString(OutPath, hex)
        println(s"\n[done] wrote signed withdrawal tx CBOR hex -> ${OutPath.toAbsolutePath}")
        println(s"       tx id = ${withdrawTx.id.toHex}; size = ${withdrawTx.toCbor.length} bytes")

        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            if !acct.drepDelegated then
                println("       NOTE: --submit will FIRST delegate to a DRep, wait, then withdraw.")
            sys.exit(0)
        }

        println(s"\n[submit] broadcasting withdrawal tx ${withdrawTx.id.toHex}…")
        submitTx(provider, withdrawTx)
        println(s"[submitted] withdrawal tx hash: ${withdrawTx.id.toHex}")
        sys.exit(0)
    }

    // ---- chain helpers -------------------------------------------------------

    private def pickFeeUtxo(
        provider: BlockfrostProvider,
        paymentAddr: ShelleyAddress,
        exclude: Set[TransactionInput]
    ): Utxo = {
        val utxos: Utxos = Await.result(provider.findUtxos(paymentAddr), 60.seconds) match
            case Right(u) => u
            case Left(e)  => sys.error(s"payment-address UTxO query failed: $e")
        val candidates = utxos.filter { case (i, o) =>
            !exclude.contains(i) && o.value.coin.value >= 2_000_000L && o.value.assets.isEmpty
        }
        require(candidates.nonEmpty, "no ada-only UTxO (>= 2 ADA) at the payment address to pay the fee")
        val (in, out) = candidates.minBy { case (_, o) => o.value.coin.value }
        println(f"[info] fee/change input: ${in.transactionId.toHex}#${in.index} (${out.value.coin.value / 1e6}%.6f ADA)")
        Utxo(in, out)
    }

    private def submitTx(provider: BlockfrostProvider, tx: Transaction): Unit =
        Await.result(provider.submit(tx), 60.seconds) match
            case Right(_) => ()
            case Left(e)  => sys.error(s"submit failed: $e")

    /** Poll Blockfrost until the tx is included in a block (HTTP 200). */
    private def waitForConfirmation(apiKey: String, txHash: String, timeoutSec: Int = 300): Unit = {
        val deadline = System.currentTimeMillis() + timeoutSec * 1000L
        while System.currentTimeMillis() < deadline do {
            val resp = bf(apiKey, s"/txs/$txHash")
            if resp.statusCode() == 200 then { println(s"[ok] tx $txHash confirmed on-chain"); return }
            Thread.sleep(10_000)
        }
        sys.error(s"timed out waiting for tx $txHash to confirm")
    }

    /** Poll until the account reflects a DRep delegation. */
    private def waitForDRepDelegation(apiKey: String, stakeBech32: String, timeoutSec: Int = 180): Unit = {
        val deadline = System.currentTimeMillis() + timeoutSec * 1000L
        while System.currentTimeMillis() < deadline do {
            if fetchAccount(apiKey, stakeBech32).drepDelegated then return
            Thread.sleep(10_000)
        }
        sys.error("timed out waiting for DRep delegation to take effect")
    }

    // ---- account state -------------------------------------------------------

    case class Account(withdrawable: Long, registered: Boolean, drepId: Option[String]) {
        def drepDelegated: Boolean = drepId.isDefined
    }

    /** Blockfrost /accounts/{stake}. `registered` (not `active`) gates withdrawal;
      * `active` only means "delegated to a pool this epoch". `drep_id` present =>
      * vote-delegated to a DRep. */
    private def fetchAccount(apiKey: String, stakeBech32: String): Account = {
        val resp = bf(apiKey, s"/accounts/$stakeBech32")
        require(resp.statusCode() == 200, s"blockfrost account fetch ${resp.statusCode()}: ${resp.body()}")
        val j = ujson.read(resp.body())
        val drep = j("drep_id") match
            case ujson.Str(s) => Some(s)
            case _            => None
        Account(j("withdrawable_amount").str.toLong, j("registered").bool, drep)
    }

    private def bf(apiKey: String, path: String): HttpResponse[String] = {
        val req = HttpRequest.newBuilder()
            .uri(URI.create(s"https://cardano-preview.blockfrost.io/api/v0$path"))
            .header("project_id", apiKey).GET().build()
        http.send(req, HttpResponse.BodyHandlers.ofString())
    }

    // ---- keys ----------------------------------------------------------------

    /** Read a raw-hex ed25519 keypair; derive the pubkey from the private key,
      * assert it matches the .vkey file, return (keyHash28, pubBytes, privBytes). */
    private def deriveKey(skPath: String, vkPath: String): (ByteString, VerificationKey, ByteString) = {
        val skHex = Files.readString(Path.of(skPath)).trim
        val vkHex = Files.readString(Path.of(vkPath)).trim
        val sk    = SigningKey.unsafeFromByteString(ByteString.fromHex(skHex))
        val pub   = JvmEd25519Signer.derivePublicKey(sk)
        require(pub.toHex == vkHex, s"$skPath: derived pubkey ${pub.toHex} != $vkPath ($vkHex)")
        (blake2b_224(pub), pub, ByteString.fromHex(skHex))
    }

    private def verifyAgainstFile(path: String, derived: String, label: String): Unit = {
        val onFile = Files.readString(Path.of(path)).trim
        require(onFile == derived, s"$label mismatch: derived=$derived but $path=$onFile")
    }

    private def requireWitnesses(tx: Transaction, expected: Set[String]): Unit = {
        val got = tx.witnessSet.vkeyWitnesses.toSeq.map(_.vkeyHash.toHex).toSet
        require(got == expected, s"unexpected vkey witnesses: got=$got expected=$expected")
    }

    private def loadBlockfrostKey(): String = {
        sys.env.get("BLOCKFROST_PROJECT_ID").filter(_.nonEmpty).getOrElse {
            Seq(Path.of("../.env"), Path.of(".env")).collectFirst { case p if Files.exists(p) =>
                Files.readString(p).linesIterator.map(_.trim)
                    .find(_.startsWith("BLOCKFROST_PROJECT_ID"))
                    .map(_.dropWhile(_ != '=').drop(1).trim.replaceAll("^\"|\"$", ""))
            }.flatten.getOrElse(sys.error("BLOCKFROST_PROJECT_ID not set (env or ../.env)"))
        }
    }
}
