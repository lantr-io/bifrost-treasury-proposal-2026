package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.address.{StakeAddress, StakePayload}
import scalus.cardano.txbuilder.{TransactionBuilderStep, TwoArgumentPlutusScriptWitness, TxBuilder}
import scalus.uplc.builtin.{ByteString, Data}
import scalus.uplc.builtin.Builtins.blake2b_256
import scalus.utils.showDetailed

import scala.concurrent.Await
import scala.concurrent.duration.*
import java.nio.file.{Files, Path}

// 03-build-gov-action: build/submit the Conway `treasuryWithdrawal` governance
// action that pulls `amountLovelace` from the Cardano treasury into the treasury
// contract's reward account. The constitution's guardrails script (policyHash)
// is provided as a TwoArgumentPlutusScriptWitness; Scalus auto-wires the
// Proposing redeemer + script witness. The anchor JSON + CID come from the bun
// anchor pipeline (gov/anchor.<net>.json + gov/pinned.json).
object BuildGovActionTool {
    // Constitution guardrails script hash — genesis default on preprod/preview/mainnet.
    private val GuardrailsScriptHash = "fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64"

    // CIP-108 caps body.title at 80 characters. The anchor pipeline (bun) is
    // the source of truth and schema-validates this already; this is a
    // last-line guard before scalus submits the irreversible proposal tx.
    private[treasurypublish] def assertTitleLength(title: String): Unit =
        require(
          title.length <= 80,
          s"anchor body.title is ${title.length} chars (CIP-108 caps title at 80): \"$title\""
        )

    @main def gov(args: String*): Unit = {
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
        val ln = Chain.ledgerNetwork(net)

        // Withdrawal target = treasury contract reward account; deposit return =
        // admin personal stake key (rebuilt for this network; never read from a
        // testnet .addr file into a mainnet tx).
        val treasuryReward = RewardAccount(
          StakeAddress(ln, StakePayload.Script(ScriptHash.fromHex(state.treasuryScriptHashHex)))
        )
        val depositReturn = RewardAccount(Chain.stakeAddress(net, keys))

        // Anchor: bytes -> blake2b-256 = dataHash; URL = ipfs://<pinned anchor CID>.
        val anchorPath = Path.of(s"gov/anchor.${net.slug}.json")
        require(
          Files.exists(anchorPath),
          s"$anchorPath not found — run the bun anchor pipeline (build-anchor/sign-anchor/pin) first"
        )
        val anchorBytes = Files.readAllBytes(anchorPath)
        assertTitleLength(ujson.read(new String(anchorBytes, java.nio.charset.StandardCharsets.UTF_8))("body")("title").str)
        val anchorHash =
            DataHash.fromByteString(blake2b_256(ByteString.unsafeFromArray(anchorBytes)))
        val pinned = ujson.read(Files.readString(Path.of("gov/pinned.json")))
        val cid = pinned.obj
            .get("anchor")
            .map(_("cid").str)
            .getOrElse(sys.error("gov/pinned.json has no `anchor` entry — pin the anchor first"))
        val anchorUrl = s"ipfs://$cid"
        val anchor = Anchor(anchorUrl, anchorHash)

        val govAction = GovAction.TreasuryWithdrawals(
          Map(treasuryReward -> Coin(r.amountLovelace.toLong)),
          Some(ScriptHash.fromHex(GuardrailsScriptHash))
        )

        // Always emit the human-readable summary JSON (parity with bun 03).
        val summary = ujson.Obj(
          "type" -> "treasuryWithdrawal",
          "network" -> net.slug,
          "amountLovelace" -> r.amountLovelace.toString,
          "rewardAccount" -> treasuryReward.address.toBech32.get,
          "anchor" -> ujson.Obj("url" -> anchorUrl, "dataHash" -> anchorHash.toHex),
          "returnAddress" -> r.adminAddress
        )
        val outPath = Path.of(s"gov/${net.slug}-withdrawal.json")
        Files.createDirectories(outPath.getParent)
        Files.writeString(outPath, ujson.write(summary, indent = 2) + "\n")
        println(s"Wrote $outPath")
        println(s"[info] anchor url  : $anchorUrl")
        println(s"[info] anchor hash : ${anchorHash.toHex}")
        println(s"[info] withdraw to : ${treasuryReward.address.toBech32.get}")
        println(s"[info] amount      : ${r.amountLovelace} lovelace")

        val deposit = Chain.fetchGovActionDeposit(apiKey, base)
        println(s"[info] gov_action_deposit (live): $deposit lovelace")

        val guardrailsScript =
            Script.PlutusV3(
              ByteString.fromHex(Chain.fetchScriptCborHex(apiKey, base, GuardrailsScriptHash))
            )
        require(
          guardrailsScript.scriptHash.toHex == GuardrailsScriptHash,
          s"fetched guardrails hash ${guardrailsScript.scriptHash.toHex} != $GuardrailsScriptHash"
        )

        val proposal = ProposalProcedure(
          deposit = Coin(deposit.toLong),
          rewardAccount = depositReturn,
          govAction = govAction,
          anchor = anchor
        )
        val witness = TwoArgumentPlutusScriptWitness.attached(guardrailsScript, Data.unit)

        val builder = TxBuilder(env)
            .addSteps(TransactionBuilderStep.SubmitProposal(proposal, witness))
            .requireSignature(keys.payKeyHash)

        val tx = Await
            .result(builder.complete(provider, adminAddr), 120.seconds)
            .sign(Chain.signer(keys))
            .transaction

        println(s"\n[ok] built gov-action tx ${tx.id.toHex} (${tx.toCbor.length} bytes)")
        println(tx.showDetailed)

        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            return
        }

        println(s"\n[submit] broadcasting ${tx.id.toHex} …")
        Chain.submit(provider, tx)
        Deployment.save(net, state.copy(txs = state.txs + ("govAction" -> tx.id.toHex)))
        println(s"[done] submitted; updated ${Deployment.path(net)}")
    }
}
