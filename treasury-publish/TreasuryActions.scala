package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.txbuilder.{Change, TransactionBuilder, TxBuilder}
import scalus.utils.showDetailed

import scala.concurrent.Await
import scala.concurrent.duration.*
import java.time.Instant

// Treasury-contract spends (reorganize / disburse / fund) against the test
// deployment. Each references the registry NFT, attaches the treasury script
// inline, sets the redeemer + validity window, requires the multisig signers,
// and produces the contract's mandated outputs (remainder back to treasury with
// a Void datum). Dry-run by default; `--submit` broadcasts. ADA-only.
object TreasuryActions {

    /** Build → sign with the multisig members (+ K_op for fees) → complete/submit.
      * Signing happens before complete so the fee estimate reserves witness slots
      * for every expected signer. */
    private def run(ctx: Funding.Ctx, submit: Boolean, label: String, required: Seq[Funding.Member])(
        build: TxBuilder => TxBuilder
    ): Unit = {
        val b0 = TxBuilder(ctx.provider.cardanoInfo)
            .references(ctx.registryRef)
            .requireSignatures(ctx.pkhs(required))
        val tx = Await
            .result(build(b0).complete(ctx.provider, ctx.adminAddr), 120.seconds)
            .sign(ctx.signer(required))
            .transaction
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

    private def beforeExpiry: Instant = Instant.now().plusSeconds(3600)

    // ---- reorganize (K_op alone) ---------------------------------------------
    @main def reorganize(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val input = Funding.largest(Funding.treasuryUtxos(ctx))
        val v = Funding.lovelaceOf(input)
        val splits: Seq[Long] = args
            .sliding(2)
            .collectFirst { case Seq("--split", s) =>
                s.split(",").toSeq.map(x => (BigDecimal(x.trim) * 1_000_000).toLong)
            }
            .getOrElse(Seq(v / 2, v - v / 2))
        require(splits.sum == v, s"--split sums to ${splits.sum} but treasury UTxO holds $v lovelace")

        println(s"[info] profile   : ${ctx.d.slug}")
        println(s"[info] spend      : ${input.input.transactionId.toHex}#${input.input.index} ($v lovelace)")
        println(s"[info] split into : ${splits.mkString(", ")} lovelace")

        run(ctx, submit, "reorganize", Seq(ctx.op)) { b =>
            var t = b.spend(input, ContractData.reorganizeRedeemer, ctx.treasuryScript).validTo(beforeExpiry)
            for s <- splits do t = t.payTo(ctx.treasuryAddr, Value(Coin(s)), ContractData.void)
            t
        }
    }

    // ---- disburse (AllOf[Lantr, FluidTokens, 1-of-3 board]) -------------------
    @main def disburse(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val amount = Funding.adaArg(args, default = 1500_000000L).toLong
        val recipient = Funding.addrOrAdmin(args, ctx)
        val input = Funding.largest(Funding.treasuryUtxos(ctx))
        val v = Funding.lovelaceOf(input)
        require(v > amount, s"treasury UTxO holds $v lovelace < disburse $amount")
        val remainder = v - amount
        val required = Seq(ctx.op, ctx.ft, ctx.board(0))

        println(s"[info] profile   : ${ctx.d.slug}")
        println(s"[info] spend      : ${input.input.transactionId.toHex}#${input.input.index} ($v lovelace)")
        println(s"[info] disburse   : $amount lovelace → ${recipient.asInstanceOf[scalus.cardano.address.ShelleyAddress].toBech32.get}")
        println(s"[info] remainder  : $remainder lovelace → treasury")

        run(ctx, submit, "disburse", required) { b =>
            var t = b
                .spend(input, ContractData.disburseRedeemer(ContractData.adaValue(amount)), ctx.treasuryScript)
                .validTo(beforeExpiry)
                .payTo(recipient, Value(Coin(amount)))
            if remainder > 0 then t = t.payTo(ctx.treasuryAddr, Value(Coin(remainder)), ContractData.void)
            t
        }
    }

    // ---- fund vendor (2-of-3 board + vendor consent) -------------------------
    @main def fund(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val nowMs = Instant.now().toEpochMilli
        // --schedule "800@0,700@20" : <ada>@<offsetMinutes> (maturation = now + minutes)
        val sched: Seq[(Long, BigInt)] = args
            .sliding(2)
            .collectFirst { case Seq("--schedule", s) => s }
            .getOrElse("1000@0,1000@20")
            .split(",")
            .toSeq
            .map { entry =>
                entry.split("@") match
                    case Array(ada, mins) =>
                        ((BigDecimal(ada.trim) * 1_000_000).toLong, BigInt(nowMs) + BigInt(mins.trim.toLong) * 60_000)
                    case _ => sys.error(s"bad schedule entry '$entry' (want <ada>@<minutes>)")
            }
        val total = sched.map(_._1).sum
        val input = Funding.largest(Funding.treasuryUtxos(ctx))
        val v = Funding.lovelaceOf(input)
        require(v >= total, s"treasury UTxO holds $v lovelace < fund total $total")
        val remainder = v - total
        val payouts = sched.map { case (amt, matMs) => ContractData.payout(matMs, ContractData.adaValue(amt), active = true) }
        val datum = ContractData.vendorDatum(ctx.vendorClaim, payouts)
        val required = Seq(ctx.board(0), ctx.board(1), ctx.op, ctx.ft)

        println(s"[info] profile   : ${ctx.d.slug}")
        println(s"[info] spend      : ${input.input.transactionId.toHex}#${input.input.index} ($v lovelace)")
        println(s"[info] vendor out : $total lovelace → ${ctx.vendorAddr.toBech32.get}")
        sched.zipWithIndex.foreach { case ((amt, matMs), i) => println(f"[info]   payout M$i%d : $amt lovelace matures ${Instant.ofEpochMilli(matMs.toLong)}") }
        println(s"[info] remainder  : $remainder lovelace → treasury")

        run(ctx, submit, "fund", required) { b =>
            var t = b
                .spend(input, ContractData.fundRedeemer(ContractData.adaValue(total)), ctx.treasuryScript)
                .validTo(beforeExpiry)
                .payTo(ctx.vendorAddr, Value(Coin(total)), datum)
            if remainder > 0 then t = t.payTo(ctx.treasuryAddr, Value(Coin(remainder)), ContractData.void)
            t
        }
    }

    // ---- sweep treasury → Cardano Treasury (1-of-3 board) --------------------
    // Donates a treasury UTxO's ADA to the Cardano Treasury via the Conway
    // `treasury_donation` field. The sweep permission (board) authorises this
    // early; after expiry it is permissionless. scalus's TxBuilder has no
    // donation step, so we assemble the context, inject `donation` onto the body
    // BEFORE balancing (the sweep script does `expect Some(donation)`, evaluated
    // before any diff handler runs), then balance with the standard change
    // handler. ADA-only: the whole UTxO is donated; the operator wallet covers
    // fee + collateral and receives change.
    @main def sweepTreasury(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val env = ctx.provider.cardanoInfo
        val input = Funding.largest(Funding.treasuryUtxos(ctx))
        val donation = Funding.lovelaceOf(input)
        require(input.output.value.assets.isEmpty, "sweepTreasury supports ADA-only UTxOs (native assets must be retained)")

        val wallet = Chain
            .findUtxos(ctx.provider, ctx.adminAddr)
            .collect { case (i, o) if o.value.assets.isEmpty => Utxo(i, o) }
            .toSeq
            .sortBy(Funding.lovelaceOf)
        require(wallet.size >= 2, "need >=2 ada-only operator UTxOs (fee + collateral)")
        val feeUtxo = wallet.head
        val collatUtxo = wallet.last
        val required = Seq(ctx.board(0))

        println(s"[info] profile   : ${ctx.d.slug}")
        println(s"[info] sweep      : ${input.input.transactionId.toHex}#${input.input.index} → donate $donation lovelace to the Cardano Treasury")

        // Assemble steps, then inject donation into the built context before balancing.
        val b = TxBuilder(env)
            .references(ctx.registryRef)
            .spend(input, ContractData.sweepTreasuryRedeemer, ctx.treasuryScript)
            .spend(feeUtxo)
            .collaterals(collatUtxo)
            .requireSignatures(ctx.pkhs(required))
            .validTo(Instant.now().plusSeconds(3600))
            .payTo(ctx.adminAddr, Value.zero) // change output (index 0)

        val built = TransactionBuilder.modify(b.context, b.steps) match
            case Right(c) => c
            case Left(e)  => sys.error(s"failed to assemble sweep tx: $e")
        val withDonation = built.copy(transaction = built.transaction.withBody(_.copy(donation = Some(Coin(donation)))))
        val balanced = withDonation.balanceContext(
          env.protocolParams,
          (diff, tx) => Change.changeOutputDiffHandler(diff, tx, env.protocolParams, 0),
          b.evaluator
        ) match
            case Right(c) => c
            case Left(e)  => sys.error(s"failed to balance sweep tx: $e")
        val tx = ctx.signer(required).sign(balanced.transaction)

        println(s"\n[ok] built sweepTreasury tx ${tx.id.toHex} (${tx.toCbor.length} bytes)")
        println(tx.showDetailed)
        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            return
        }
        println(s"\n[submit] broadcasting ${tx.id.toHex} …")
        Chain.submit(ctx.provider, tx)
        Deployment.save(ctx.d.slug, ctx.state.copy(txs = ctx.state.txs + ("sweepTreasury" -> tx.id.toHex)))
        println(s"[done] submitted; updated ${Deployment.path(ctx.d.slug)}")
    }
}
