package treasurypublish

import scalus.uplc.Program
import scalus.uplc.builtin.Data
import scalus.cardano.ledger.{Script, ScriptHash}
import java.nio.file.{Files, Path}

// Loads the vendored audited blueprint and applies parameters with Scalus's
// UPLC engine to reproduce the registry / treasury / vendor script identities.
//
//   registry policy = oneshot.oneshot.mint  applied with OutputReference(seed)
//   treasury script = treasury.treasury.spend applied with TreasuryConfiguration
//   vendor   script = vendor.vendor.spend     applied with VendorConfiguration
object Scripts {
    val RegistryAssetNameHex: String = "5245474953545259" // "REGISTRY"

    private def findPlutusJson(): String =
        Seq("treasury-publish/plutus.json", "plutus.json", "../plutus.json")
            .map(Path.of(_))
            .find(Files.exists(_))
            .map(p => Files.readString(p))
            .getOrElse(sys.error("plutus.json not found (looked in ./ and treasury-publish/)"))

    private lazy val blueprint = ujson.read(findPlutusJson())

    private def compiledCode(title: String): String =
        blueprint("validators").arr
            .collectFirst { case v if v("title").str == title => v("compiledCode").str }
            .getOrElse(sys.error(s"validator '$title' not found in plutus.json"))

    lazy val oneshotProgram: Program = Program.fromCborHex(compiledCode("oneshot.oneshot.mint"))
    lazy val treasuryProgram: Program = Program.fromCborHex(compiledCode("treasury.treasury.spend"))
    lazy val vendorProgram: Program = Program.fromCborHex(compiledCode("vendor.vendor.spend"))

    /** Apply a single `Data` parameter and produce the applied PlutusV3 script. */
    private def applied(program: Program, arg: Data): Script.PlutusV3 =
        Script.PlutusV3((program $ arg).cborByteString)

    def oneshotScript(seedTxIdHex: String, seedIx: Long): Script.PlutusV3 =
        applied(oneshotProgram, ContractData.outputRef(seedTxIdHex, seedIx))

    def registryPolicy(seedTxIdHex: String, seedIx: Long): ScriptHash =
        oneshotScript(seedTxIdHex, seedIx).scriptHash

    def treasuryScript(r: ResolvedConfig, registryPolicyHex: String): Script.PlutusV3 =
        applied(treasuryProgram, ContractData.treasuryConfig(r, registryPolicyHex))

    def vendorScript(r: ResolvedConfig, registryPolicyHex: String): Script.PlutusV3 =
        applied(vendorProgram, ContractData.vendorConfig(r, registryPolicyHex))
}
