package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.address.{ShelleyAddress, ShelleyDelegationPart, ShelleyPaymentPart}
import scalus.cardano.txbuilder.TxBuilder
import scalus.uplc.builtin.{ByteString, Data}
import scalus.utils.showDetailed

import scala.collection.immutable.SortedMap
import scala.concurrent.Await
import scala.concurrent.duration.*
import java.nio.file.Path

// 01-init-registry: mint the one-shot REGISTRY NFT (oneshot policy parameterized
// by a seed UTxO) and lock it at the policy's enterprise-script address with the
// ScriptHashRegistry datum carrying the treasury + vendor script hashes.
object InitRegistryTool {
    @main def init(args: String*): Unit = {
        val net = Cli.net(args)
        val submit = Cli.isSubmit(args)
        val r = Config.resolve(Config.forNetwork(net))

        if Deployment.load(net).isDefined then {
            println(s"${Deployment.path(net)} already exists — init already ran. Skipping.")
            return
        }

        val apiKey = Chain.loadBlockfrostKey(net)
        val keys = Chain.loadAdminKeys("keys")
        require(
          keys.payKeyHash.toHex == r.adminPkhHex,
          s"keys/admin payment pkh ${keys.payKeyHash.toHex} != config adminPkh ${r.adminPkhHex}"
        )
        Chain.verifyPaymentFile(Path.of("keys/admin.addr"), keys.payKeyHash, keys.stakeKeyHash)

        val provider = Chain.provider(net, apiKey)
        val env = provider.cardanoInfo
        val adminAddr = Chain.paymentAddress(net, keys)

        // Pick the one-shot seed: either an explicit `--seed <txid#ix>` (parity
        // runs, so bun and scalus share the identical seed) or, by default, the
        // smallest ada-only admin UTxO clearing the fee headroom.
        val utxos = Chain.findUtxos(provider, adminAddr)
        val seed = Cli.seed(args) match
            case Some((txId, ix)) =>
                utxos
                    .find { case (in, _) => in.transactionId.toHex == txId && in.index.toInt == ix }
                    .map { case (in, out) => Utxo(in, out) }
                    .getOrElse(sys.error(s"--seed $txId#$ix not found among admin wallet UTxOs"))
            case None => Chain.pickAdaOnlyUtxo(utxos, 5_000_000)
        val seedTxId = seed.input.transactionId.toHex
        val seedIx = seed.input.index

        val oneshot = Scripts.oneshotScript(seedTxId, seedIx)
        val registryPolicy = oneshot.scriptHash
        val treasuryHash = Scripts.treasuryScript(r, registryPolicy.toHex).scriptHash
        val vendorHash = Scripts.vendorScript(r, registryPolicy.toHex).scriptHash

        val assetName = AssetName(ByteString.fromHex(Scripts.RegistryAssetNameHex))
        val registryAddr = ShelleyAddress(
          Chain.ledgerNetwork(net),
          ShelleyPaymentPart.Script(registryPolicy),
          ShelleyDelegationPart.Null
        )
        val nftValue = Value(
          Coin(2_000_000),
          MultiAsset(SortedMap((registryPolicy: ScriptHash) -> SortedMap(assetName -> 1L)))
        )
        val datum = ContractData.registryDatum(treasuryHash.toHex, vendorHash.toHex)

        println(s"[info] network        : ${net.slug}")
        println(s"[info] seed UTxO       : $seedTxId#$seedIx")
        println(s"[info] registry policy : ${registryPolicy.toHex}")
        println(s"[info] treasury script : ${treasuryHash.toHex}")
        println(s"[info] vendor   script : ${vendorHash.toHex}")

        val builder = TxBuilder(env)
            .spend(seed)
            .mint(oneshot, Map(assetName -> 1L), Data.unit)
            .payTo(registryAddr, nftValue, datum)
            .requireSignature(keys.payKeyHash)

        val tx = Await
            .result(builder.complete(provider, adminAddr), 120.seconds)
            .sign(Chain.signer(keys))
            .transaction

        println(s"\n[ok] built registry-init tx ${tx.id.toHex} (${tx.toCbor.length} bytes)")
        println(tx.showDetailed)

        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            return
        }

        println(s"\n[submit] broadcasting ${tx.id.toHex} …")
        Chain.submit(provider, tx)
        Deployment.save(
          net,
          DeploymentState(
            network = net.slug,
            seedTxId = seedTxId,
            seedOutputIndex = seedIx.toInt,
            registryPolicyHex = registryPolicy.toHex,
            registryAssetNameHex = Scripts.RegistryAssetNameHex,
            treasuryScriptHashHex = treasuryHash.toHex,
            vendorScriptHashHex = vendorHash.toHex,
            treasuryExpirationMs = r.treasuryExpirationMs,
            txs = Map("initRegistry" -> tx.id.toHex)
          )
        )
        println(s"[done] submitted; wrote ${Deployment.path(net)}")
    }
}
