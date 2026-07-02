//> using scala 3.3.8
//> using dep org.scalus::scalus-cardano-ledger:0.18.2
//> using mainClass RecoverDeposits

// Recovers expired governance-action deposits from treasury-withdrawal
// proposals into the admin payment address, on any of the three Cardano
// networks (preview / preprod / mainnet).
//
// When a TreasuryWithdrawals proposal expires/drops, the ledger refunds its
// gov-action deposit (100,000 ADA) to the proposal's deposit-return reward
// account — the admin stake key. This tool drains that reward account to the
// admin payment address. A reward withdrawal is all-or-nothing: one withdrawal
// tx takes the entire balance.
//
// CONWAY PREREQUISITE (post-Plomin): a reward withdrawal is rejected with
// `ConwayWdrlNotDelegatedToDRep` unless the stake credential is delegated to a
// DRep, and the ledger checks this against the delegation state at the START of
// the withdrawal tx (Conway Rules/Ledger.hs runs the wdrl check BEFORE the
// CERTS sub-rule applies this tx's certs), so a VoteDelegCert in the SAME tx
// does NOT satisfy it. So: if the account isn't DRep-delegated, this first
// submits a delegation tx (to AlwaysAbstain), waits for confirmation, then the
// withdrawal.
//
// Network: --network <preview|preprod|mainnet> (or NETWORK env; default
// preview). BLOCKFROST_PROJECT_ID must be the matching network-scoped key (its
// prefix is checked). Keys are the network-agnostic raw-hex ed25519 keys in
// keys/admin.{skey,vkey} + keys/admin.stake.{skey,vkey}; addresses are DERIVED
// from them (priv -> pub -> blake2b_224 -> address) and cross-checked against
// keys/admin.addr & keys/admin.stake.addr by KEY HASH (network-independent).
//
// Default is dry-run: build + sign + print (Pretty showDetailed) the withdrawal
// tx, no submit. Pass --submit to broadcast (delegation first if needed).

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

    val DepositPerProposal = 100_000_000_000L // 100,000 ADA — same on all 3 networks
    val OutPath            = Path.of("recover-deposits.signed.tx")

    private val http = HttpClient.newHttpClient()
    private given ExecutionContext = ExecutionContext.global
    private var bfBase: String = "" // set once network is known

    def main(args: Array[String]): Unit = {
        val submit  = args.contains("--submit")
        // --delegate-only: do just the Phase-1 DRep delegation (Tx 1) and stop
        // before building/submitting the withdrawal (Tx 2). Lets the operator
        // broadcast and confirm the delegation first, then review Tx 2
        // separately before withdrawing.
        val delegateOnly = args.contains("--delegate-only")
        val network = resolveNetwork(args)
        val net     = if network == "mainnet" then Network.Mainnet else Network.Testnet
        bfBase = s"https://cardano-$network.blockfrost.io/api/v0"
        val apiKey = loadBlockfrostKey()
        require(
          apiKey.startsWith(network),
          s"BLOCKFROST_PROJECT_ID prefix does not match --network $network " +
              "(keys are network-scoped: preview*/preprod*/mainnet*)"
        )
        println(s"[info] network=$network")

        // --- Derive payment + stake key hashes from the private keys ----------
        val (payHashBs, payVk, paySk)       = deriveKey("../keys/admin.skey", "../keys/admin.vkey")
        val (stakeHashBs, stakeVk, stakeSk) =
            deriveKey("../keys/admin.stake.skey", "../keys/admin.stake.vkey")
        val payKeyHash   = AddrKeyHash(payHashBs)
        val stakeKeyHash = Hash.stakeKeyHash(stakeHashBs)
        println(s"[ok] derived payment key hash : ${payKeyHash.toHex}")
        println(s"[ok] derived stake   key hash : ${stakeKeyHash.toHex}")

        // --- Build addresses for this network; cross-check files by key hash --
        val paymentAddr = ShelleyAddress(
          net,
          ShelleyPaymentPart.Key(payKeyHash),
          ShelleyDelegationPart.Key(stakeKeyHash)
        )
        val stakeAddr = StakeAddress(net, StakePayload.Stake(stakeKeyHash))
        verifyPaymentFile("../keys/admin.addr", payKeyHash, stakeKeyHash)
        verifyStakeFile("../keys/admin.stake.addr", stakeKeyHash)
        println(s"[ok] payment address (${network}) : ${paymentAddr.toBech32.get}")
        println(s"[ok] stake   address (${network}) : ${stakeAddr.toBech32.get}")

        // --- Query the live account state -------------------------------------
        val stakeBech32 = stakeAddr.toBech32.get
        var acct = fetchAccount(apiKey, stakeBech32)
        require(acct.registered, s"stake account $stakeBech32 is not registered — nothing to withdraw")
        require(acct.withdrawable > 0L, s"reward account is empty (withdrawable=${acct.withdrawable})")
        val deposits = acct.withdrawable.toDouble / DepositPerProposal
        println(f"[info] reward balance to recover: ${acct.withdrawable}%d lovelace " +
          f"(${acct.withdrawable / 1e6}%.6f ADA ≈ $deposits%.2f deposits)")
        println(s"[info] DRep-delegated: ${acct.drepDelegated} (drep_id=${acct.drepId.getOrElse("none")})")

        // --- Provider ---------------------------------------------------------
        given sttp.client4.Backend[Future] = BlockfrostProviderPlatform.defaultBackend
        val provider = Await.result(network match {
            case "mainnet" => BlockfrostProvider.mainnet(apiKey)
            case "preprod" => BlockfrostProvider.preprod(apiKey)
            case _         => BlockfrostProvider.preview(apiKey)
        }, 60.seconds)
        val env = provider.cardanoInfo
        require(env.network == net, s"provider network ${env.network} != selected $net")
        println(s"[info] protocol params loaded for ${env.network}")

        val signer = TransactionSigner(
          Set((paySk, payVk: ByteString), (stakeSk, stakeVk: ByteString))
        )

        // --- Phase 1: ensure DRep delegation (a separate, PRIOR tx) -----------
        if !acct.drepDelegated then {
            println(
              "\n[delegation] account is not delegated to a DRep — a reward withdrawal would be\n" +
                  "             rejected (ConwayWdrlNotDelegatedToDRep). Delegating to AlwaysAbstain\n" +
                  "             in a separate tx FIRST."
            )
            val delegTx = signer.sign(
              TxBuilder(env)
                  .spend(pickFeeUtxo(provider, paymentAddr))
                  .delegateVoteToDRep(stakeAddr, DRep.AlwaysAbstain)
                  .build(paymentAddr)
                  .transaction
            )
            requireWitnesses(delegTx, Set(payKeyHash.toHex, stakeKeyHash.toHex))
            println("\n=== DELEGATION TX (showDetailed) ===")
            println(delegTx.showDetailed)

            if !submit then println("\n--dry-run: not submitting the delegation tx.")
            else {
                println(s"\n[submit] broadcasting delegation tx ${delegTx.id.toHex}…")
                submitTx(provider, delegTx)
                println("[submit] delegation submitted; waiting for on-chain confirmation…")
                waitForConfirmation(apiKey, delegTx.id.toHex)
                waitForDRepDelegation(apiKey, stakeBech32)
                acct = fetchAccount(apiKey, stakeBech32)
                println(s"[ok] account now DRep-delegated (drep_id=${acct.drepId.getOrElse("?")})")
            }
        }

        if delegateOnly then {
            if submit then
                println(
                  "\n[delegate-only] delegation (Tx 1) submitted + confirmed; stopping before the\n" +
                      "                withdrawal (Tx 2). Re-run without --delegate-only to withdraw."
                )
            else
                println(
                  "\n[delegate-only] dry-run: built the delegation (Tx 1) only; not submitting,\n" +
                      "                and not building the withdrawal (Tx 2)."
                )
            sys.exit(0)
        }

        // --- Phase 2: the withdrawal tx ---------------------------------------
        val withdrawTx = signer.sign(
          TxBuilder(env)
              .spend(pickFeeUtxo(provider, paymentAddr))
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

    private def resolveNetwork(args: Array[String]): String = {
        val n = args.sliding(2).collectFirst { case Array("--network", v) => v }
            .orElse(args.collectFirst { case a if a.startsWith("--network=") => a.drop("--network=".length) })
            .orElse(sys.env.get("NETWORK").filter(_.nonEmpty))
            .getOrElse("preview")
        require(Set("preview", "preprod", "mainnet")(n), s"unsupported --network $n")
        n
    }

    // ---- chain helpers -------------------------------------------------------

    private def pickFeeUtxo(provider: BlockfrostProvider, paymentAddr: ShelleyAddress): Utxo = {
        val utxos: Utxos = Await.result(provider.findUtxos(paymentAddr), 60.seconds) match
            case Right(u) => u
            case Left(e)  => sys.error(s"payment-address UTxO query failed: $e")
        val candidates = utxos.filter { case (_, o) =>
            o.value.coin.value >= 2_000_000L && o.value.assets.isEmpty
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
            if bf(apiKey, s"/txs/$txHash").statusCode() == 200 then {
                println(s"[ok] tx $txHash confirmed on-chain"); return
            }
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
            .uri(URI.create(s"$bfBase$path"))
            .header("project_id", apiKey).GET().build()
        http.send(req, HttpResponse.BodyHandlers.ofString())
    }

    // ---- keys + address cross-check -----------------------------------------

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

    /** Cross-check the .addr file by KEY HASH (ignores the network byte, so it
      * works whether the file is a testnet or mainnet address form). */
    private def verifyPaymentFile(path: String, payKeyHash: AddrKeyHash, stakeKeyHash: StakeKeyHash): Unit =
        Address.fromBech32(Files.readString(Path.of(path)).trim) match
            case sh: ShelleyAddress =>
                val p = sh.payment match { case ShelleyPaymentPart.Key(h) => h.toHex; case _ => "<script>" }
                val d = sh.delegation match { case ShelleyDelegationPart.Key(h) => h.toHex; case _ => "<none>" }
                require(p == payKeyHash.toHex, s"$path payment hash $p != ${payKeyHash.toHex}")
                require(d == stakeKeyHash.toHex, s"$path stake hash $d != ${stakeKeyHash.toHex}")
            case other => sys.error(s"$path is not a Shelley base address: $other")

    private def verifyStakeFile(path: String, stakeKeyHash: StakeKeyHash): Unit =
        Address.fromBech32(Files.readString(Path.of(path)).trim) match
            case st: StakeAddress =>
                val h = st.payload match { case StakePayload.Stake(x) => x.toHex; case _ => "<script>" }
                require(h == stakeKeyHash.toHex, s"$path stake hash $h != ${stakeKeyHash.toHex}")
            case other => sys.error(s"$path is not a stake address: $other")

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
