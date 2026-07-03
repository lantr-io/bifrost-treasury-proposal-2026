package treasurypublish

import scalus.uplc.builtin.{ByteString, Data}
import scalus.cardano.onchain.plutus.prelude.List as PList

// Plutus `Data` encoders for the SundaeSwap treasury-funds script parameters.
// Constructor indices and field ORDER are taken from the audited blueprint's
// `definitions` (plutus.json), NOT from the TypeScript object-literal order:
//
//   MultisigScript     : Signature=0, AllOf=1, AnyOf=2, AtLeast=3, Before=4, After=5, Script=6
//   OutputReference    : Constr 0 [transaction_id: ByteArray, output_index: Int]
//   TreasuryPermissions: Constr 0 [reorganize, sweep, fund, disburse]   <-- schema order
//   TreasuryConfiguration: Constr 0 [registry_token, permissions, expiration, payout_upperbound]
//   VendorPermissions  : Constr 0 [pause, resume, modify]
//   VendorConfiguration: Constr 0 [registry_token, permissions, expiration]
object ContractData {
    private def bs(hex: String): ByteString = ByteString.fromHex(hex)

    def outputRef(txIdHex: String, outputIndex: Long): Data =
        Data.Constr(0, PList(Data.B(bs(txIdHex)), Data.I(BigInt(outputIndex))))

    // ---- MultisigScript ------------------------------------------------------

    def sig(pkhHex: String): Data = Data.Constr(0, PList(Data.B(bs(pkhHex))))

    def allOf(scripts: Seq[Data]): Data =
        Data.Constr(1, PList(Data.List(PList.from(scripts))))

    def anyOf(scripts: Seq[Data]): Data =
        Data.Constr(2, PList(Data.List(PList.from(scripts))))

    def atLeast(required: Long, scripts: Seq[Data]): Data =
        Data.Constr(3, PList(Data.I(BigInt(required)), Data.List(PList.from(scripts))))

    /** The reusable permission building blocks (mirror preprod.ts permissionGroup). */
    final case class PermissionGroup(
        opSig: Data, // Lantr K_op (operator + Lantr vendor signer)
        ftSig: Data, // FluidTokens vendor
        board1: Data, // AtLeast(1, board)
        board2: Data, // AtLeast(2, board)
        bothVendorsPlus1: Data, // AllOf[Lantr, FluidTokens, AtLeast(1, board)]  (disburse)
        vendorClaim: Data // AllOf[Lantr, FluidTokens]  (2-of-2 vendor claim, set at fund time)
    )

    def permissionGroup(r: ResolvedConfig): PermissionGroup = {
        val opSig = sig(r.adminPkhHex)
        val ftSig = sig(r.fluidTokensPkh)
        val boardSigs = r.boardPkhs.map(sig)
        val board1 = atLeast(1, boardSigs)
        val board2 = atLeast(2, boardSigs)
        PermissionGroup(
          opSig = opSig,
          ftSig = ftSig,
          board1 = board1,
          board2 = board2,
          bothVendorsPlus1 = allOf(Seq(opSig, ftSig, board1)),
          vendorClaim = allOf(Seq(opSig, ftSig))
        )
    }

    // ---- Treasury / Vendor configuration -------------------------------------

    def treasuryConfig(r: ResolvedConfig, registryPolicyHex: String): Data = {
        val g = permissionGroup(r)
        // schema order: reorganize, sweep, fund, disburse
        val perms = Data.Constr(0, PList(g.opSig, g.board1, g.board2, g.bothVendorsPlus1))
        Data.Constr(
          0,
          PList(
            Data.B(bs(registryPolicyHex)),
            perms,
            Data.I(r.treasuryExpirationMs),
            Data.I(r.vendorPayoutUpperboundMs)
          )
        )
    }

    /** ScriptHashRegistry { treasury: {Script:[t]}, vendor: {Script:[v]} } — the inline datum on
      * the registry NFT output. Aiken `Credential.Script` = Constr 1.
      */
    def registryDatum(treasuryHashHex: String, vendorHashHex: String): Data = {
        def scriptCred(h: String): Data = Data.Constr(1, PList(Data.B(bs(h))))
        Data.Constr(0, PList(scriptCred(treasuryHashHex), scriptCred(vendorHashHex)))
    }

    def vendorConfig(r: ResolvedConfig, registryPolicyHex: String): Data = {
        val g = permissionGroup(r)
        // schema order: pause, resume, modify
        val perms = Data.Constr(0, PList(g.board1, g.board2, g.board2))
        Data.Constr(
          0,
          PList(
            Data.B(bs(registryPolicyHex)),
            perms,
            Data.I(r.vendorExpirationMs)
          )
        )
    }

    // ---- Redeemers, datums, and value encodings for funding execution --------
    //
    // Constructor indices match the audited blueprint (lib/types.ak). Verified
    // against the SundaeSwap TS package's `Data.serialize(...)` calls per endpoint.

    private val nil: PList[Data] = PList.from(Seq.empty[Data])

    /** Treasury / vendor output datum = Void (Constr 0 []). The treasury spend
      * ignores its input datum; outputs carry Void by convention. */
    val void: Data = Data.Constr(0, nil)

    /** Value as `Pairs<PolicyId, Pairs<AssetName, Int>>` (Plutus Map of Maps).
      * `assets` maps policyHex -> (assetNameHex -> quantity). ADA is the empty
      * policy + empty asset name; pass it in `assets` under key "" -> ("" -> n). */
    def value(assets: Seq[(String, Seq[(String, BigInt)])]): Data =
        Data.Map(PList.from(assets.map { (policyHex, toks) =>
            Data.B(bs(policyHex)) -> Data.Map(
              PList.from(toks.map { (nameHex, qty) => Data.B(bs(nameHex)) -> Data.I(qty) })
            )
        }))

    /** Pure-ADA value of `lovelace` (empty policy, empty asset name). */
    def adaValue(lovelace: BigInt): Data = value(Seq("" -> Seq("" -> lovelace)))

    // TreasurySpendRedeemer: Reorganize=0, SweepTreasury=1, Fund=2, Disburse=3
    val reorganizeRedeemer: Data = Data.Constr(0, nil)
    val sweepTreasuryRedeemer: Data = Data.Constr(1, nil)
    def fundRedeemer(amount: Data): Data = Data.Constr(2, PList(amount))
    def disburseRedeemer(amount: Data): Data = Data.Constr(3, PList(amount))

    // VendorSpendRedeemer: Withdraw=0, Adjudicate=1, Modify=2, SweepVendor=3, Malformed=4
    val withdrawRedeemer: Data = Data.Constr(0, nil)
    def adjudicateRedeemer(statuses: Seq[Boolean]): Data =
        Data.Constr(1, PList(Data.List(PList.from(statuses.map(payoutStatus)))))
    val modifyRedeemer: Data = Data.Constr(2, nil)
    val sweepVendorRedeemer: Data = Data.Constr(3, nil)

    /** PayoutStatus: Active=Constr 0 [], Paused=Constr 1 []. */
    def payoutStatus(active: Boolean): Data = Data.Constr(if active then 0 else 1, nil)

    /** Payout { maturation: Int, value: Pairs, status: PayoutStatus }. */
    def payout(maturationMs: BigInt, value: Data, active: Boolean): Data =
        Data.Constr(0, PList(Data.I(maturationMs), value, payoutStatus(active)))

    /** VendorDatum { vendor: MultisigScript, payouts: List<Payout> }. */
    def vendorDatum(vendor: Data, payouts: Seq[Data]): Data =
        Data.Constr(0, PList(vendor, Data.List(PList.from(payouts))))

    // ---- Decoders (read on-chain VendorDatum for withdraw/adjudicate/modify) --

    final case class DecodedPayout(maturationMs: BigInt, lovelace: Long, active: Boolean, raw: Data)

    /** Lovelace held under the ADA key of a `Pairs<PolicyId, Pairs<AssetName,Int>>`
      * value (ADA-only). */
    def decodeAdaLovelace(v: Data): Long = v match
        case Data.Map(policies) =>
            policies.toScalaList
                .collectFirst { case (Data.B(p), Data.Map(toks)) if p.toHex.isEmpty =>
                    toks.toScalaList.collectFirst { case (Data.B(a), Data.I(n)) if a.toHex.isEmpty => n.toLong }.getOrElse(0L)
                }
                .getOrElse(0L)
        case _ => 0L

    /** Decode a VendorDatum into (vendor multisig Data, payouts). Each payout
      * keeps its `raw` Data so it can be re-locked unchanged. */
    def decodeVendorDatum(d: Data): (Data, Seq[DecodedPayout]) = d match
        case Data.Constr(c, args) if c == 0L =>
            args.toScalaList match
                case vendor :: payoutsD :: Nil =>
                    val ps = payoutsD match
                        case Data.List(xs) => xs.toScalaList
                        case _             => sys.error("VendorDatum.payouts is not a List")
                    val payouts = ps.map {
                        case p @ Data.Constr(pc, pargs) if pc == 0L =>
                            pargs.toScalaList match
                                case Data.I(mat) :: value :: Data.Constr(st, _) :: Nil =>
                                    DecodedPayout(mat, decodeAdaLovelace(value), st == 0L, p)
                                case _ => sys.error("unexpected Payout shape")
                        case _ => sys.error("unexpected Payout constructor")
                    }
                    (vendor, payouts)
                case _ => sys.error("unexpected VendorDatum shape")
        case _ => sys.error("not a VendorDatum Constr")
}
