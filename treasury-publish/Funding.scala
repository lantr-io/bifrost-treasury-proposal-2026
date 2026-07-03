package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.address.{Address, Network, ShelleyAddress, ShelleyDelegationPart, ShelleyPaymentPart}
import scalus.cardano.node.BlockfrostProvider
import scalus.cardano.txbuilder.TransactionSigner
import scalus.uplc.builtin.{ByteString, Data}
import scalus.uplc.builtin.Builtins.blake2b_224
import scalus.crypto.ed25519.{JvmEd25519Signer, SigningKey, VerificationKey}

import java.nio.file.{Files, Path}

// Shared plumbing for the funding-execution tools (seed / reorganize / disburse
// / fund / vendor-withdraw / adjudicate / modify / sweep). Loads the test
// deployment, recompiles + cross-checks the treasury/vendor scripts, derives the
// script addresses (BasePaymentScriptStakeScript — payment == stake == script
// hash, matching the audited SundaeSwap package), and finds the registry NFT
// reference UTxO. Also loads the multisig signers (real K_op + the stand-in
// FluidTokens/board keys under keys/test/).
object Funding {

    /** A signing party: raw ed25519 key material + payment key hash. */
    final case class Member(name: String, priv: ByteString, pub: VerificationKey, pkh: AddrKeyHash)

    private def loadMember(name: String, skPath: Path): Member = {
        val priv = ByteString.fromHex(Files.readString(skPath).trim)
        val pub = JvmEd25519Signer.derivePublicKey(SigningKey.unsafeFromByteString(priv))
        Member(name, priv, pub, AddrKeyHash(blake2b_224(pub)))
    }

    final case class Ctx(
        d: Deploy,
        r: ResolvedConfig,
        provider: BlockfrostProvider,
        state: DeploymentState,
        op: Member, // K_op (Lantr) — also the fee-paying wallet
        ft: Member,
        board: Seq[Member], // board1, board2, board3 (stand-ins)
        treasuryScript: Script.PlutusV3,
        vendorScript: Script.PlutusV3,
        treasuryAddr: ShelleyAddress,
        vendorAddr: ShelleyAddress,
        adminAddr: ShelleyAddress,
        registryRef: Utxo
    ) {
        /** The 2-of-2 vendor claim multisig (AllOf[Lantr, FluidTokens]) baked
          * into the VendorDatum at fund time. */
        def vendorClaim: Data = ContractData.permissionGroup(r).vendorClaim

        /** Required-signer key hashes for a multisig action. */
        def pkhs(members: Seq[Member]): Set[AddrKeyHash] = members.map(_.pkh).toSet

        /** Signer over the given multisig members PLUS K_op (who always signs the
          * fee/collateral inputs drawn from the operator wallet). TxBuilder.sign
          * filters down to the expected signers, so extra keys are harmless. */
        def signer(members: Seq[Member]): TransactionSigner =
            TransactionSigner((op +: members).map(m => (m.priv, m.pub: ByteString)).toSet)
    }

    def scriptBase(ln: Network, h: ScriptHash): ShelleyAddress =
        ShelleyAddress(ln, ShelleyPaymentPart.Script(h), ShelleyDelegationPart.Script(h))

    def load(args: Seq[String]): Ctx = {
        val d = Deploy.select(args)
        require(
          d.slug.startsWith("preview-test"),
          s"funding tools only run against test deployments, got --profile ${d.slug}"
        )
        val r = Config.resolve(d.raw)
        val state = Deployment
            .load(d.slug)
            .getOrElse(sys.error(s"${Deployment.path(d.slug)} not found — run `init --profile ${d.slug} --submit` first"))

        val apiKey = Chain.loadBlockfrostKey(d.net)
        val provider = Chain.provider(d.net, apiKey)
        val keys = Chain.loadAdminKeys("keys")
        val ln = Chain.ledgerNetwork(d.net)

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

        val registryPolicy = Scripts.registryPolicy(state.seedTxId, state.seedOutputIndex)
        val registryAddr =
            ShelleyAddress(ln, ShelleyPaymentPart.Script(registryPolicy), ShelleyDelegationPart.Null)
        val regUtxos = Chain.findUtxos(provider, registryAddr)
        require(regUtxos.nonEmpty, s"no registry UTxO at ${registryAddr.toBech32.get}")
        val (regIn, regOut) = regUtxos.head
        val registryRef = Utxo(regIn, regOut)

        val testDir = Path.of("keys/test")
        Ctx(
          d = d,
          r = r,
          provider = provider,
          state = state,
          op = Member("op", keys.payPriv, keys.payPub, keys.payKeyHash),
          ft = loadMember("ft", testDir.resolve("ft.skey")),
          board = Seq("board1", "board2", "board3").map(n => loadMember(n, testDir.resolve(s"$n.skey"))),
          treasuryScript = treasuryScript,
          vendorScript = vendorScript,
          treasuryAddr = scriptBase(ln, treasuryScript.scriptHash),
          vendorAddr = scriptBase(ln, vendorScript.scriptHash),
          adminAddr = Chain.paymentAddress(d.net, keys),
          registryRef = registryRef
        )
    }

    /** Parse a bech32 address arg, defaulting to the operator wallet. */
    def addrOrAdmin(args: Seq[String], ctx: Ctx): Address =
        args
            .sliding(2)
            .collectFirst { case Seq("--to", v) => v }
            .map(Address.fromBech32)
            .getOrElse(ctx.adminAddr)

    /** `--ada <n>` in whole ADA → lovelace; falls back to `default`. */
    def adaArg(args: Seq[String], default: BigInt): BigInt =
        args
            .sliding(2)
            .collectFirst { case Seq("--ada", v) => (BigDecimal(v) * 1_000_000).toBigInt }
            .getOrElse(default)

    def treasuryUtxos(ctx: Ctx): Seq[Utxo] =
        Chain.findUtxos(ctx.provider, ctx.treasuryAddr).map { case (i, o) => Utxo(i, o) }.toSeq

    def vendorUtxos(ctx: Ctx): Seq[Utxo] =
        Chain.findUtxos(ctx.provider, ctx.vendorAddr).map { case (i, o) => Utxo(i, o) }.toSeq

    def largest(us: Seq[Utxo]): Utxo = {
        require(us.nonEmpty, "no UTxO available at the requested script address")
        us.maxBy(_.output.value.coin.value)
    }

    /** Pick a vendor UTxO: `--utxo <txhash-prefix>` if given, else the largest. */
    def vendorPick(ctx: Ctx, args: Seq[String]): Utxo = {
        val us = vendorUtxos(ctx)
        args.sliding(2).collectFirst { case Seq("--utxo", h) => h } match
            case Some(h) =>
                us.find(_.input.transactionId.toHex.startsWith(h))
                    .getOrElse(sys.error(s"no vendor UTxO matching --utxo $h"))
            case None => largest(us)
    }

    /** ADA-only lovelace held by a UTxO. */
    def lovelaceOf(u: Utxo): Long = u.output.value.coin.value

    /** Inline datum `Data` of a UTxO (script UTxOs carry inline datums). */
    def inlineDatum(u: Utxo): Data =
        u.output.datumOption
            .flatMap(_.dataOption)
            .getOrElse(sys.error(s"UTxO ${u.input.transactionId.toHex}#${u.input.index} has no inline datum"))

    /** Build (with registry ref + required signers pre-added) → sign with the
      * multisig members (+ K_op for fees) → complete → print → optionally submit,
      * recording the tx under `label` in the deployment file. */
    def runSpend(ctx: Ctx, submit: Boolean, label: String, required: Seq[Member])(
        build: scalus.cardano.txbuilder.TxBuilder => scalus.cardano.txbuilder.TxBuilder
    ): Unit = {
        import scalus.cardano.txbuilder.TxBuilder
        import scalus.utils.showDetailed
        import scala.concurrent.Await
        import scala.concurrent.duration.*
        val b0 = TxBuilder(ctx.provider.cardanoInfo).references(ctx.registryRef).requireSignatures(ctx.pkhs(required))
        val tx = Await.result(build(b0).complete(ctx.provider, ctx.adminAddr), 120.seconds).sign(ctx.signer(required)).transaction
        println(s"\n[ok] built $label tx ${tx.id.toHex} (${tx.toCbor.length} bytes)")
        println(tx.showDetailed)
        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            return
        }
        println(s"\n[submit] broadcasting ${tx.id.toHex} …")
        Chain.submit(ctx.provider, tx)
        Deployment.save(ctx.d.slug, ctx.state.copy(txs = ctx.state.txs + (label -> tx.id.toHex)))
        println(s"[done] submitted; updated ${Deployment.path(ctx.d.slug)}")
    }
}
