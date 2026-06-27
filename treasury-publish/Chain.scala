package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.address.{Address, Network, ShelleyAddress, ShelleyDelegationPart, ShelleyPaymentPart, StakeAddress, StakePayload}
import scalus.cardano.txbuilder.TransactionSigner
import scalus.cardano.node.{BlockfrostProvider, BlockfrostProviderPlatform}
import scalus.uplc.builtin.ByteString
import scalus.uplc.builtin.Builtins.blake2b_224
import scalus.crypto.ed25519.{JvmEd25519Signer, SigningKey, VerificationKey}

import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration.*
import java.nio.file.{Files, Path}
import java.net.URI
import java.net.http.{HttpClient, HttpRequest, HttpResponse}

// Shared chain plumbing for the Phase-1 tools. Ported from recover-deposits:
// raw-hex ed25519 keys under keys/, addresses DERIVED from them (priv -> pub ->
// blake2b_224 -> address) and cross-checked against the .addr files by KEY HASH
// (network-independent). Blockfrost provider + REST helpers for the few queries
// not covered by the provider (registered flag, gov-action deposit, script cbor).
object Chain {
    private val http = HttpClient.newHttpClient()
    private given ExecutionContext = ExecutionContext.global

    // ---- key material --------------------------------------------------------

    final case class AdminKeys(
        payPriv: ByteString,
        payPub: VerificationKey,
        payKeyHash: AddrKeyHash,
        stakePriv: ByteString,
        stakePub: VerificationKey,
        stakeKeyHash: StakeKeyHash
    )

    /** Read a raw-hex ed25519 keypair; derive the pubkey from the private key, assert it matches
      * the .vkey file.
      */
    private def deriveKey(skPath: Path, vkPath: Path): (ByteString, VerificationKey) = {
        val skHex = Files.readString(skPath).trim
        val vkHex = Files.readString(vkPath).trim
        val sk = SigningKey.unsafeFromByteString(ByteString.fromHex(skHex))
        val pub = JvmEd25519Signer.derivePublicKey(sk)
        require(pub.toHex == vkHex, s"$skPath: derived pubkey ${pub.toHex} != $vkPath ($vkHex)")
        (ByteString.fromHex(skHex), pub)
    }

    def loadAdminKeys(keysDir: String): AdminKeys = {
        val dir = Path.of(keysDir)
        val (payPriv, payPub) = deriveKey(dir.resolve("admin.skey"), dir.resolve("admin.vkey"))
        val (stakePriv, stakePub) =
            deriveKey(dir.resolve("admin.stake.skey"), dir.resolve("admin.stake.vkey"))
        AdminKeys(
          payPriv = payPriv,
          payPub = payPub,
          payKeyHash = AddrKeyHash(blake2b_224(payPub)),
          stakePriv = stakePriv,
          stakePub = stakePub,
          stakeKeyHash = Hash.stakeKeyHash(blake2b_224(stakePub))
        )
    }

    def signer(keys: AdminKeys): TransactionSigner =
        TransactionSigner(
          Set((keys.payPriv, keys.payPub: ByteString), (keys.stakePriv, keys.stakePub: ByteString))
        )

    // ---- networks / addresses ------------------------------------------------

    def ledgerNetwork(net: Net): Network = net match
        case Net.Mainnet => Network.Mainnet
        case _           => Network.Testnet

    def paymentAddress(net: Net, keys: AdminKeys): ShelleyAddress =
        ShelleyAddress(
          ledgerNetwork(net),
          ShelleyPaymentPart.Key(keys.payKeyHash),
          ShelleyDelegationPart.Key(keys.stakeKeyHash)
        )

    def stakeAddress(net: Net, keys: AdminKeys): StakeAddress =
        StakeAddress(ledgerNetwork(net), StakePayload.Stake(keys.stakeKeyHash))

    /** Cross-check a .addr file by KEY HASH (ignores the network byte). */
    def verifyPaymentFile(path: Path, payKeyHash: AddrKeyHash, stakeKeyHash: StakeKeyHash): Unit =
        Address.fromBech32(Files.readString(path).trim) match
            case sh: ShelleyAddress =>
                val p = sh.payment match
                    case ShelleyPaymentPart.Key(h) => h.toHex
                    case _                         => "<script>"
                val d = sh.delegation match
                    case ShelleyDelegationPart.Key(h) => h.toHex
                    case _                            => "<none>"
                require(p == payKeyHash.toHex, s"$path payment hash $p != ${payKeyHash.toHex}")
                require(d == stakeKeyHash.toHex, s"$path stake hash $d != ${stakeKeyHash.toHex}")
            case other => sys.error(s"$path is not a Shelley base address: $other")

    // ---- provider ------------------------------------------------------------

    def provider(net: Net, apiKey: String): BlockfrostProvider = {
        given sttp.client4.Backend[Future] = BlockfrostProviderPlatform.defaultBackend
        Await.result(
          net match
              case Net.Mainnet => BlockfrostProvider.mainnet(apiKey)
              case Net.Preprod => BlockfrostProvider.preprod(apiKey)
              case Net.Preview => BlockfrostProvider.preview(apiKey)
          ,
          60.seconds
        )
    }

    def findUtxos(provider: BlockfrostProvider, addr: ShelleyAddress): Utxos =
        Await.result(provider.findUtxos(addr), 60.seconds) match
            case Right(u) => u
            case Left(e)  => sys.error(s"UTxO query failed for $addr: $e")

    /** Smallest ada-only UTxO clearing `minLovelace`, for an explicit fee/seed input. */
    def pickAdaOnlyUtxo(utxos: Utxos, minLovelace: Long): Utxo = {
        val candidates = utxos.filter { case (_, o) =>
            o.value.coin.value >= minLovelace && o.value.assets.isEmpty
        }
        require(candidates.nonEmpty, s"no ada-only UTxO >= ${minLovelace / 1e6} ADA available")
        val (in, out) = candidates.minBy { case (_, o) => o.value.coin.value }
        Utxo(in, out)
    }

    def submit(provider: BlockfrostProvider, tx: Transaction): Unit =
        Await.result(provider.submit(tx), 60.seconds) match
            case Right(_) => ()
            case Left(e)  => sys.error(s"submit failed: $e")

    // ---- Blockfrost REST (queries not exposed by the provider) ---------------

    def blockfrostBase(net: Net): String = s"https://cardano-${net.slug}.blockfrost.io/api/v0"

    def loadBlockfrostKey(net: Net): String = {
        val key = sys.env.get("BLOCKFROST_PROJECT_ID").filter(_.nonEmpty).getOrElse {
            Seq(Path.of(".env"), Path.of("../.env"))
                .collectFirst {
                    case p if Files.exists(p) =>
                        Files
                            .readString(p)
                            .linesIterator
                            .map(_.trim)
                            .find(_.startsWith("BLOCKFROST_PROJECT_ID"))
                            .map(_.dropWhile(_ != '=').drop(1).trim.replaceAll("^\"|\"$", ""))
                }
                .flatten
                .getOrElse(sys.error("BLOCKFROST_PROJECT_ID not set (env or .env)"))
        }
        require(
          key.startsWith(net.slug),
          s"BLOCKFROST_PROJECT_ID prefix does not match network ${net.slug} (keys are network-scoped)"
        )
        key
    }

    private def bf(apiKey: String, base: String, path: String): HttpResponse[String] = {
        val req = HttpRequest
            .newBuilder()
            .uri(URI.create(s"$base$path"))
            .header("project_id", apiKey)
            .GET()
            .build()
        http.send(req, HttpResponse.BodyHandlers.ofString())
    }

    /** Conway: a stake account is "registered" once and persists across proposal cycles; a fresh
      * deployment must not re-register it. 404 => never seen.
      */
    def isStakeRegistered(apiKey: String, base: String, stakeBech32: String): Boolean = {
        val resp = bf(apiKey, base, s"/accounts/$stakeBech32")
        if resp.statusCode() == 404 then false
        else {
            require(resp.statusCode() == 200, s"account fetch ${resp.statusCode()}: ${resp.body()}")
            val j = ujson.read(resp.body())
            j.obj.get("registered").exists(_.bool) || j.obj.get("active").exists(_.bool)
        }
    }

    def fetchGovActionDeposit(apiKey: String, base: String): BigInt = {
        val resp = bf(apiKey, base, "/epochs/latest/parameters")
        require(resp.statusCode() == 200, s"params fetch ${resp.statusCode()}: ${resp.body()}")
        BigInt(ujson.read(resp.body())("gov_action_deposit").str)
    }

    /** Blockfrost serves script CBOR single-wrapped (`bytes(flat)`), which is exactly what
      * Script.PlutusV3 expects.
      */
    def fetchScriptCborHex(apiKey: String, base: String, scriptHash: String): String = {
        val resp = bf(apiKey, base, s"/scripts/$scriptHash/cbor")
        require(resp.statusCode() == 200, s"script fetch ${resp.statusCode()}: ${resp.body()}")
        ujson.read(resp.body())("cbor").str
    }
}
