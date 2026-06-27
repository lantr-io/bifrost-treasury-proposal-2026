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
        opSig: Data, // K_op alone
        board1: Data, // AtLeast(1, board)
        board2: Data, // AtLeast(2, board)
        opPlus1: Data, // AllOf[K_op, AtLeast(1, board)]
        opPlus2: Data // AllOf[K_op, AtLeast(2, board)]
    )

    def permissionGroup(r: ResolvedConfig): PermissionGroup = {
        val opSig = sig(r.adminPkhHex)
        val boardSigs = r.boardPkhs.map(sig)
        val board1 = atLeast(1, boardSigs)
        val board2 = atLeast(2, boardSigs)
        PermissionGroup(
          opSig = opSig,
          board1 = board1,
          board2 = board2,
          opPlus1 = allOf(Seq(opSig, board1)),
          opPlus2 = allOf(Seq(opSig, board2))
        )
    }

    // ---- Treasury / Vendor configuration -------------------------------------

    def treasuryConfig(r: ResolvedConfig, registryPolicyHex: String): Data = {
        val g = permissionGroup(r)
        // schema order: reorganize, sweep, fund, disburse
        val perms = Data.Constr(0, PList(g.opSig, g.opPlus1, g.opPlus2, g.opPlus2))
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
        val perms = Data.Constr(0, PList(g.board1, g.board2, g.opPlus2))
        Data.Constr(
          0,
          PList(
            Data.B(bs(registryPolicyHex)),
            perms,
            Data.I(r.vendorExpirationMs)
          )
        )
    }
}
