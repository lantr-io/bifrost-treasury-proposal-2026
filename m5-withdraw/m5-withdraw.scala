//> using scala 3.3.7
//> using dep org.scalus::scalus-cardano-ledger:0.18.1
//> using mainClass M5Withdraw

// Builds an UNSIGNED Cardano mainnet transaction that withdraws Milestone 5
// (107,788.56 ₳, matured 2026-05-29) from the SundaeSwap treasury-funds vendor
// contract used by the 2025 Scalus treasury withdrawal (Intersect oversight).
//
// It mirrors the on-chain Milestone-4 withdrawal
//   bb3e6cf751a89b73e07d51d0692aa14543c49e97208cbadc3c7467b80852af11
// one step later: spend the current vendor UTxO (e5b0…#0, holding M5+M6),
// pay the matured M5 payout to the owner, recreate the vendor UTxO with M6,
// and return change to the owner. The vendor Plutus script is supplied via a
// reference input, and the registry UTxO is referenced for the config lookup.
//
// Output: m5-withdraw.unsigned.tx (CBOR hex) — load into Eternl and sign with
// the admin key (ee4d5c28…). Nothing is submitted.

import scalus.cardano.ledger.*
import scalus.cardano.address.Address
import scalus.cardano.txbuilder.TxBuilder
import scalus.cardano.node.{BlockfrostProvider, BlockfrostProviderPlatform}
import scalus.uplc.builtin.{Data, ByteString}
import scalus.uplc.builtin.Builtins.serialiseData
import scalus.cardano.onchain.plutus.prelude.List as PList

import scala.collection.immutable.SortedMap
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.concurrent.duration.*
import java.time.Instant
import java.nio.file.{Files, Path}
import java.net.URI
import java.net.http.{HttpClient, HttpRequest, HttpResponse}

object M5Withdraw {

    // ----- Fixed on-chain facts (mainnet) -------------------------------------
    val VendorAddr =
        "addr1xxyzewehw7dh78ea62mkgdnzmcdlcxqt4u39a7pqc0v0at5g9janwaum0u0nm54hvsmx9hsmlsvqhteztmuzps7cl6hq7d35th"
    val OwnerAddr =
        "addr1q8hy6hpgvgxzkpy5dhpjl4sgp4e007s5a2qddcrn9g4v0f280705mn54gt7qvve3jmwykq8shht0kk4464caf2e732nq05zszr"
    // Registry NFT holder address (also holds the vendor reference script UTxO)
    val RefHolderAddr = "addr1wx0xte8d04hasm7ysf7jk3w6d5kxq8aeyr5tl4u5hrkvvxge7q73u"

    val OwnerPkh           = "ee4d5c28620c2b04946dc32fd6080d72f7fa14ea80d6e0732a2ac7a5"
    val VendorScriptHash   = "882cbb37779b7f1f3dd2b7643662de1bfc180baf225ef820c3d8feae"
    val RegistryPolicy     = "9e65e4ed7d6fd86fc4827d2b45da6d2c601fb920e8bfd794b8ecc619"
    val RegistryAssetName  = "5245474953545259" // "REGISTRY"

    // UTxOs
    val VendorInTx   = "e5b0bae1c7944882bc628ea8b8706bb472bc85a3956afc65169e948bd2ba3d90"
    val VendorInIx   = 0
    val RegistryRefTx = "b0b03a35eaf0fe01fd4aecc68a7217ef1f19fea7a10c798461b4c6afacec3de7"
    val RegistryRefIx = 0
    val ScriptRefTx  = "2865e176339cae7b3f14845543b316cc664dce5f1f33d96914059b14f6176b29"
    val ScriptRefIx  = 0

    // Inline datums (CBOR hex) as currently on-chain
    val CurVendorDatumHex =
        "d8799fd8799f581cee4d5c28620c2b04946dc32fd6080d72f7fa14ea80d6e0732a2ac7a5ff9f" +
        "d8799f1b0000019e75f74580a140a1401b0000001918b2e680d87980ff" + // payout M5
        "d8799f1b0000019f159c6980a140a1401b00000014d7bfd7e0d87980ff" + // payout M6
        "ffff"
    val RegistryDatumHex =
        "d8799fd87a9f581c8583857e4a12ffe1e6f641a1785a0f2f036c565cfbe6ff9db8e5a469ff" +
        "d87a9f581c882cbb37779b7f1f3dd2b7643662de1bfc180baf225ef820c3d8feaeffff"
    // Expected datum AFTER the withdrawal (drops M5, keeps M6) — verified below.
    val NewVendorDatumExpectedHex =
        "d8799fd8799f581cee4d5c28620c2b04946dc32fd6080d72f7fa14ea80d6e0732a2ac7a5ff9f" +
        "d8799f1b0000019f159c6980a140a1401b00000014d7bfd7e0d87980ff" +
        "ffff"

    // Amounts (lovelace)
    val VendorInLovelace   = 197_307_580_000L
    val MaturedM5          = 107_788_560_000L
    val VendorOutLovelace  =  89_519_020_000L // == VendorInLovelace - MaturedM5
    val RegistryLovelace   =   1_383_510L
    val ScriptRefLovelace  =  41_738_040L
    val M6MaturationMs     = 1_782_774_000_000L
    val FeeInputMinLovelace = 40_000_000L // pick a >= 40 ADA owner UTxO to pay fees

    def main(args: Array[String]): Unit = {
        require(VendorOutLovelace == VendorInLovelace - MaturedM5, "vendor-out math")
        val apiKey = loadBlockfrostKey()

        // --- Build the new vendor datum and verify it byte-for-byte ----------
        val newDatum = buildNewVendorDatum()
        val newDatumHex = serialiseData(newDatum).toHex
        require(
          newDatumHex == NewVendorDatumExpectedHex,
          s"new datum mismatch:\n got=$newDatumHex\n exp=$NewVendorDatumExpectedHex"
        )
        println(s"[ok] new vendor datum CBOR matches expected (drops M5, keeps M6)")

        // --- Resolve the three fixed UTxOs (in memory) -----------------------
        val vendorAddr = Address.fromBech32(VendorAddr)
        val ownerAddr  = Address.fromBech32(OwnerAddr)
        val refHolder  = Address.fromBech32(RefHolderAddr)

        val vendorScript = Script.PlutusV3(ByteString.fromHex(fetchScriptCborHex(apiKey)))
        require(
          vendorScript.scriptHash.toHex == VendorScriptHash,
          s"vendor script hash mismatch: ${vendorScript.scriptHash.toHex}"
        )
        println(s"[ok] vendor reference script hash = ${vendorScript.scriptHash.toHex}")

        val vendorUtxo = Utxo(
          TransactionInput(TransactionHash.fromHex(VendorInTx), VendorInIx),
          TransactionOutput(
            vendorAddr,
            Value(Coin(VendorInLovelace)),
            Data.fromCbor(ByteString.fromHex(CurVendorDatumHex))
          )
        )

        val registryNft: MultiAsset = MultiAsset(
          SortedMap(
            (ScriptHash.fromHex(RegistryPolicy): ScriptHash) ->
                SortedMap((AssetName(ByteString.fromHex(RegistryAssetName)): AssetName) -> 1L)
          )
        )
        val registryUtxo = Utxo(
          TransactionInput(TransactionHash.fromHex(RegistryRefTx), RegistryRefIx),
          TransactionOutput(
            refHolder,
            Value(Coin(RegistryLovelace), registryNft),
            Some(DatumOption.Inline(Data.fromCbor(ByteString.fromHex(RegistryDatumHex)))),
            None
          )
        )

        val scriptRefUtxo = Utxo(
          TransactionInput(TransactionHash.fromHex(ScriptRefTx), ScriptRefIx),
          TransactionOutput(
            refHolder,
            Value(Coin(ScriptRefLovelace)),
            None,
            Some(ScriptRef(vendorScript))
          )
        )

        // --- Provider (live mainnet protocol params + owner UTxO lookup) -----
        given ExecutionContext = ExecutionContext.global
        given sttp.client4.Backend[Future] = BlockfrostProviderPlatform.defaultBackend
        val provider = Await.result(BlockfrostProvider.mainnet(apiKey), 60.seconds)
        val env = provider.cardanoInfo
        println(s"[info] network=${env.network} protocol params loaded; " +
          s"priceMem=${env.protocolParams.executionUnitPrices.priceMemory}")

        // --- Explicitly pick the fee/change input (>= 40 ADA) + collateral ---
        val ownerUtxos: Utxos = Await.result(provider.findUtxos(ownerAddr), 60.seconds) match
            case Right(u) => u
            case Left(e)  => sys.error(s"owner UTxO query failed: $e")

        val feeCandidates = ownerUtxos.filter { case (_, o) =>
            o.value.coin.value >= FeeInputMinLovelace && o.value.assets.isEmpty
        }
        require(feeCandidates.nonEmpty,
          s"no ada-only owner UTxO with >= ${FeeInputMinLovelace / 1_000_000} ADA to pay fees")
        // smallest UTxO that still clears the threshold (don't lock more than needed)
        val (feeIn, feeOut) = feeCandidates.minBy { case (_, o) => o.value.coin.value }
        val feeUtxo = Utxo(feeIn, feeOut)

        val collCandidates = ownerUtxos.filter { case (i, o) =>
            i != feeIn && o.value.coin.value >= 5_000_000L && o.value.assets.isEmpty
        }
        require(collCandidates.nonEmpty, "no separate ada-only owner UTxO (>= 5 ADA) for collateral")
        val (collIn, collOut) = collCandidates.minBy { case (_, o) => o.value.coin.value }
        val collateralUtxo = Utxo(collIn, collOut)

        println(s"[info] fee/change input  : ${feeIn.transactionId.toHex}#${feeIn.index} " +
          s"(${feeOut.value.coin.value / 1e6} ADA)")
        println(s"[info] collateral input  : ${collIn.transactionId.toHex}#${collIn.index} " +
          s"(${collOut.value.coin.value / 1e6} ADA)")

        val withdrawRedeemer: Data = Data.unit // Withdraw = Constr(0, [])
        val now = Instant.now()

        val tx = TxBuilder(env)
            .references(registryUtxo, scriptRefUtxo)
            .spend(vendorUtxo, withdrawRedeemer)
            .spend(feeUtxo)
            .collaterals(collateralUtxo)
            .payTo(vendorAddr, Value(Coin(VendorOutLovelace)), newDatum)
            .payTo(ownerAddr, Value(Coin(MaturedM5)))
            .requireSignature(AddrKeyHash.fromHex(OwnerPkh))
            .validFrom(now.minusSeconds(120))
            .validTo(now.plusSeconds(6 * 3600)) // 6h window to sign+submit in Eternl
            .build(ownerAddr)
            .transaction

        printSummary(tx, vendorAddr, ownerAddr)

        // --- Verify the recreated vendor output ------------------------------
        val outs = tx.body.value.outputs.map(_.value)
        val vendorOut = outs.find(_.address == vendorAddr).getOrElse(
          sys.error("no vendor output produced!"))
        require(vendorOut.value.coin.value == VendorOutLovelace,
          s"vendor out coin ${vendorOut.value.coin.value} != $VendorOutLovelace")
        vendorOut.datumOption match
            case Some(DatumOption.Inline(d)) =>
                require(serialiseData(d).toHex == NewVendorDatumExpectedHex, "vendor out datum")
            case other => sys.error(s"vendor out datum not inline: $other")
        println("[ok] vendor output value & datum verified")

        // --- Write unsigned CBOR hex -----------------------------------------
        val hex = tx.toCbor.map(b => f"${b & 0xff}%02x").mkString
        val outPath = Path.of("m5-withdraw.unsigned.tx")
        Files.writeString(outPath, hex)
        println(s"\n[done] wrote unsigned tx CBOR hex -> ${outPath.toAbsolutePath}")
        println(s"       tx size = ${tx.toCbor.length} bytes; load into Eternl and sign.")

        sys.exit(0)
    }

    /** VendorDatum{ vendor: Signature(OwnerPkh), payouts: [ M6 ] }. */
    private def buildNewVendorDatum(): Data = {
        val signature = Data.Constr(0, PList(Data.B(ByteString.fromHex(OwnerPkh))))
        val empty     = Data.B(ByteString.empty)
        val value     = Data.Map(PList((empty, Data.Map(PList((empty, Data.I(BigInt(VendorOutLovelace))))))))
        val active    = Data.Constr(0, PList.empty)
        val payoutM6  = Data.Constr(0, PList(Data.I(BigInt(M6MaturationMs)), value, active))
        Data.Constr(0, PList(signature, Data.List(PList(payoutM6))))
    }

    private def printSummary(tx: Transaction, vendorAddr: Address, ownerAddr: Address): Unit = {
        val body = tx.body.value
        println("\n=== UNSIGNED TX SUMMARY ===")
        println(s"fee                 : ${body.fee.value} lovelace (${body.fee.value / 1e6} ADA)")
        println(s"inputs              : ${body.inputs.toSeq.size}")
        println(s"reference inputs    : ${body.referenceInputs.toSeq.size}")
        println(s"collateral inputs   : ${body.collateralInputs.toSeq.size}")
        println(s"required signers    : ${body.requiredSigners.toSeq.map(_.toHex).mkString(", ")}")
        println(s"validity            : [${body.validityStartSlot}, ${body.ttl}]")
        body.outputs.map(_.value).zipWithIndex.foreach { case (o, i) =>
            val who =
                if o.address == vendorAddr then "VENDOR" else if o.address == ownerAddr then "owner" else "?"
            println(f"output[$i] $who%-6s : ${o.value.coin.value}%15d lovelace (${o.value.coin.value / 1e6}%.6f ADA)")
        }
        tx.witnessSet.redeemers.foreach { rs =>
            rs.value.toSeq.foreach { r =>
                println(s"redeemer ${r.tag} idx=${r.index} exUnits=mem ${r.exUnits.memory}, steps ${r.exUnits.steps}")
            }
        }
    }

    private def fetchScriptCborHex(apiKey: String): String = {
        val client = HttpClient.newHttpClient()
        val req = HttpRequest.newBuilder()
            .uri(URI.create(
              s"https://cardano-mainnet.blockfrost.io/api/v0/scripts/$VendorScriptHash/cbor"))
            .header("project_id", apiKey)
            .GET().build()
        val resp = client.send(req, HttpResponse.BodyHandlers.ofString())
        require(resp.statusCode() == 200, s"blockfrost script fetch ${resp.statusCode()}: ${resp.body()}")
        ujson.read(resp.body())("cbor").str
    }

    private def loadBlockfrostKey(): String = {
        sys.env.get("BLOCKFROST_PROJECT_ID").filter(_.nonEmpty).getOrElse {
            val candidates = Seq(Path.of("../.env"), Path.of(".env"))
            candidates.collectFirst { case p if Files.exists(p) =>
                Files.readString(p).linesIterator
                    .map(_.trim)
                    .find(_.startsWith("BLOCKFROST_PROJECT_ID"))
                    .map(_.dropWhile(_ != '=').drop(1).trim.replaceAll("^\"|\"$", ""))
            }.flatten.getOrElse(sys.error("BLOCKFROST_PROJECT_ID not set (env or ../.env)"))
        }
    }
}
