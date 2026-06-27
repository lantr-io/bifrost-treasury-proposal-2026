package treasurypublish

import java.nio.file.{Files, Path}

// Read/write deployment/<network>.json in the SAME on-disk schema as the bun
// scripts/lib/deployment.ts, so bun and Scala tooling interoperate. The
// machine-written file is gitignored; never hand-edit.
final case class DeploymentState(
    network: String,
    seedTxId: String,
    seedOutputIndex: Int,
    registryPolicyHex: String,
    registryAssetNameHex: String,
    treasuryScriptHashHex: String,
    vendorScriptHashHex: String,
    treasuryExpirationMs: BigInt,
    txs: Map[String, String]
)

object Deployment {
    def path(net: Net): Path = Path.of(s"deployment/${net.slug}.json")

    def load(net: Net): Option[DeploymentState] = {
        val p = path(net)
        if !Files.exists(p) then None
        else {
            val j = ujson.read(Files.readString(p))
            Some(
              DeploymentState(
                network = j("network").str,
                seedTxId = j("seedUtxo")("txId").str,
                seedOutputIndex = j("seedUtxo")("outputIndex").num.toInt,
                registryPolicyHex = j("registryPolicyHex").str,
                registryAssetNameHex = j("registryAssetNameHex").str,
                treasuryScriptHashHex = j("treasuryScriptHashHex").str,
                vendorScriptHashHex = j("vendorScriptHashHex").str,
                treasuryExpirationMs = BigInt(j("treasuryExpirationMs").str),
                txs = j("txs").obj.map((k, v) => k -> v.str).toMap
              )
            )
        }
    }

    def save(net: Net, state: DeploymentState): Unit = {
        val obj = ujson.Obj(
          "network" -> state.network,
          "seedUtxo" -> ujson.Obj(
            "txId" -> state.seedTxId,
            "outputIndex" -> ujson.Num(state.seedOutputIndex.toDouble)
          ),
          "registryPolicyHex" -> state.registryPolicyHex,
          "registryAssetNameHex" -> state.registryAssetNameHex,
          "treasuryScriptHashHex" -> state.treasuryScriptHashHex,
          "vendorScriptHashHex" -> state.vendorScriptHashHex,
          "treasuryExpirationMs" -> state.treasuryExpirationMs.toString,
          "txs" -> ujson.Obj.from(state.txs.map((k, v) => k -> ujson.Str(v)))
        )
        val p = path(net)
        Files.createDirectories(p.getParent)
        Files.writeString(p, ujson.write(obj, indent = 2) + "\n")
    }
}
