package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.address.{StakeAddress, StakePayload}
import scalus.cardano.txbuilder.{TxBuilder, TwoArgumentPlutusScriptWitness}
import scalus.uplc.builtin.Data
import scalus.utils.showDetailed

import scala.concurrent.Await
import scala.concurrent.duration.*

// 02-register-scripts: register the treasury + vendor script stake credentials
// (vote-delegated to AlwaysAbstain per constitution Art. IV §5) and the admin's
// personal stake key (registered without delegation, so the gov-action deposit
// refund lands in a usable reward account). Admin-stake registration is skipped
// if already on-chain (StakeKeyRegisteredDELEG would otherwise reject the tx).
object RegisterScriptsTool:
    @main def register(args: String*): Unit =
        val net = Cli.net(args)
        val submit = Cli.isSubmit(args)
        val r = Config.resolve(Config.forNetwork(net))
        val state = Deployment
            .load(net)
            .getOrElse(sys.error(s"${Deployment.path(net)} not found — run `init --submit` first"))

        val apiKey = Chain.loadBlockfrostKey(net)
        val base = Chain.blockfrostBase(net)
        val keys = Chain.loadAdminKeys("keys")
        val provider = Chain.provider(net, apiKey)
        val env = provider.cardanoInfo
        val adminAddr = Chain.paymentAddress(net, keys)

        // Recompile treasury/vendor to get the script bytes; cross-check vs deployment.
        val treasuryScript = Scripts.treasuryScript(r, state.registryPolicyHex)
        val vendorScript = Scripts.vendorScript(r, state.registryPolicyHex)
        require(
          treasuryScript.scriptHash.toHex == state.treasuryScriptHashHex,
          s"treasury hash ${treasuryScript.scriptHash.toHex} != deployment ${state.treasuryScriptHashHex}"
        )
        require(
          vendorScript.scriptHash.toHex == state.vendorScriptHashHex,
          s"vendor hash ${vendorScript.scriptHash.toHex} != deployment ${state.vendorScriptHashHex}"
        )

        val ln = Chain.ledgerNetwork(net)
        val treasuryStake = StakeAddress(ln, StakePayload.Script(treasuryScript.scriptHash))
        val vendorStake = StakeAddress(ln, StakePayload.Script(vendorScript.scriptHash))
        val adminStake = Chain.stakeAddress(net, keys)

        val adminAlreadyRegistered =
            Chain.isStakeRegistered(apiKey, base, adminStake.toBech32.get)
        if adminAlreadyRegistered then
            println(s"[info] admin stake ${adminStake.toBech32.get} already registered — skipping its cert")

        val treasuryWitness = TwoArgumentPlutusScriptWitness.attached(treasuryScript, Data.unit)
        val vendorWitness = TwoArgumentPlutusScriptWitness.attached(vendorScript, Data.unit)

        var builder = TxBuilder(env)
            .registerStake(treasuryStake, treasuryWitness)
            .delegateVoteToDRep(treasuryStake, DRep.AlwaysAbstain, treasuryWitness)
            .registerStake(vendorStake, vendorWitness)
            .delegateVoteToDRep(vendorStake, DRep.AlwaysAbstain, vendorWitness)
        if !adminAlreadyRegistered then builder = builder.registerStake(adminStake)
        builder = builder.requireSignature(keys.payKeyHash)

        val tx = Await
            .result(builder.complete(provider, adminAddr), 120.seconds)
            .sign(Chain.signer(keys))
            .transaction

        println(s"[info] network            : ${net.slug}")
        println(s"[info] treasury reward     : ${treasuryStake.toBech32.get}")
        println(s"[info] vendor   reward     : ${vendorStake.toBech32.get}")
        println(s"[info] admin    reward     : ${adminStake.toBech32.get}")
        println(s"\n[ok] built register+delegate tx ${tx.id.toHex} (${tx.toCbor.length} bytes)")
        println(tx.showDetailed)

        if !submit then
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            return

        println(s"\n[submit] broadcasting ${tx.id.toHex} …")
        Chain.submit(provider, tx)
        Deployment.save(net, state.copy(txs = state.txs + ("registerScripts" -> tx.id.toHex)))
        println(s"[done] submitted; updated ${Deployment.path(net)}")
