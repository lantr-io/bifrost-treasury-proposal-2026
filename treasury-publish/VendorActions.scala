package treasurypublish

import scalus.cardano.ledger.*
import scalus.uplc.builtin.Data

import java.time.Instant

// Vendor-contract spends against the test deployment: withdraw matured payouts,
// pause/resume (adjudicate), modify the schedule, and sweep after expiry. Each
// reads the on-chain VendorDatum, computes the new datum/outputs, and requires
// the appropriate multisig. Dry-run by default; `--submit` broadcasts. ADA-only.
object VendorActions {

    // validTo must stay within the node's slot→time forecast horizon (~7h on
    // preview) or submit fails with TimeTranslationPastHorizon. 1h is safely
    // inside it and well under adjudicate's 36h interval-length cap.
    private def soon: Instant = Instant.now().plusSeconds(3600)

    // validFrom must sit at/behind the chain tip (which lags wall-clock by a
    // block), else the node rejects with OutsideValidityInterval. 90s back is
    // safely behind the tip yet still after any already-matured payout.
    private def justPast: Instant = Instant.now().minusSeconds(90)

    // ---- vendor withdraw (AllOf[Lantr, FluidTokens]) -------------------------
    // Pays out every Active payout whose maturation is before `now`; relocks the
    // rest with an updated datum.
    @main def vendorWithdraw(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val destination = Funding.addrOrAdmin(args, ctx)
        val now = Instant.now()
        val nowMs = now.toEpochMilli
        val inputs = Funding.vendorUtxos(ctx)
        require(inputs.nonEmpty, "no vendor UTxO to withdraw from")

        // Negative test: --force-all claims EVERY payout regardless of maturation
        // or status, relocking nothing. The contract must reject this (unmatured /
        // paused funds may not be withdrawn) — a deliberate on-chain rejection.
        val forceAll = args.contains("--force-all")

        var payToDest = 0L
        val plans = inputs.map { vu =>
            val (vendor, payouts) = ContractData.decodeVendorDatum(Funding.inlineDatum(vu))
            val (matured, remaining) =
                if forceAll then (payouts, Seq.empty[ContractData.DecodedPayout])
                else payouts.partition(p => p.active && p.maturationMs < nowMs)
            val maturedSum = matured.map(_.lovelace).sum
            payToDest += maturedSum
            (vu, vendor, remaining, Funding.lovelaceOf(vu) - maturedSum, maturedSum)
        }
        require(payToDest > 0, "no matured payouts to withdraw yet (all still immature or paused)")
        if forceAll then println("[warn] --force-all: claiming ALL payouts; the contract is expected to REJECT this")

        println(s"[info] profile     : ${ctx.d.slug}")
        plans.foreach { case (vu, _, remaining, relock, maturedSum) =>
            println(s"[info] vendor UTxO  : ${vu.input.transactionId.toHex}#${vu.input.index} — claim $maturedSum, relock $relock (${remaining.size} payout(s) left)")
        }
        println(s"[info] destination  : ${payToDest} lovelace → ${destination}")

        Funding.runSpend(ctx, submit, "vendorWithdraw", Seq(ctx.op, ctx.ft)) { b0 =>
            var b = b0.validFrom(justPast)
            for (vu, vendor, remaining, relock, _) <- plans do {
                b = b.spend(vu, ContractData.withdrawRedeemer, ctx.vendorScript)
                if remaining.nonEmpty || relock > 0 then
                    b = b.payTo(ctx.vendorAddr, Value(Coin(relock)), ContractData.vendorDatum(vendor, remaining.map(_.raw)))
            }
            b.payTo(destination, Value(Coin(payToDest)))
        }
    }

    // ---- adjudicate: pause (1-of-3 board) / resume (2-of-3 board) -------------
    private def adjudicate(args: Seq[String], target: Boolean, label: String, required: Funding.Ctx => Seq[Funding.Member]): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val vu = Funding.largest(Funding.vendorUtxos(ctx))
        val (vendor, payouts) = ContractData.decodeVendorDatum(Funding.inlineDatum(vu))
        val statuses = Seq.fill(payouts.size)(target)
        val newPayouts = payouts.map(p => ContractData.payout(p.maturationMs, ContractData.adaValue(p.lovelace), target))
        val newDatum = ContractData.vendorDatum(vendor, newPayouts)

        println(s"[info] profile   : ${ctx.d.slug}")
        println(s"[info] vendor UTxO: ${vu.input.transactionId.toHex}#${vu.input.index} (${payouts.size} payout(s))")
        println(s"[info] set all → ${if target then "Active" else "Paused"}")

        Funding.runSpend(ctx, submit, label, required(ctx)) { b0 =>
            b0.spend(vu, ContractData.adjudicateRedeemer(statuses), ctx.vendorScript)
                .validFrom(justPast)
                .validTo(soon)
                .payTo(ctx.vendorAddr, Value(Coin(Funding.lovelaceOf(vu))), newDatum)
        }
    }

    @main def vendorPause(args: String*): Unit =
        adjudicate(args, target = false, "vendorPause", ctx => Seq(ctx.board(0)))

    @main def vendorResume(args: String*): Unit =
        adjudicate(args, target = true, "vendorResume", ctx => Seq(ctx.board(0), ctx.board(1)))

    // ---- modify (2-of-3 board + vendor consent) ------------------------------
    @main def vendorModify(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val nowMs = Instant.now().toEpochMilli
        val vu = Funding.largest(Funding.vendorUtxos(ctx))
        val v = Funding.lovelaceOf(vu)
        val sched: Seq[(Long, BigInt)] = args
            .sliding(2)
            .collectFirst { case Seq("--schedule", s) => s }
            .getOrElse("500@5")
            .split(",")
            .toSeq
            .map { e =>
                e.split("@") match
                    case Array(ada, mins) => ((BigDecimal(ada.trim) * 1_000_000).toLong, BigInt(nowMs) + BigInt(mins.trim.toLong) * 60_000)
                    case _                => sys.error(s"bad schedule entry '$e'")
            }
        val newTotal = sched.map(_._1).sum
        require(newTotal <= v, s"new schedule total $newTotal > vendor UTxO $v (modify cannot add funds)")
        val remainder = v - newTotal
        val payouts = sched.map { case (amt, m) => ContractData.payout(m, ContractData.adaValue(amt), active = true) }
        val newDatum = ContractData.vendorDatum(ctx.vendorClaim, payouts)
        val required = Seq(ctx.board(0), ctx.board(1), ctx.op, ctx.ft)

        println(s"[info] profile   : ${ctx.d.slug}")
        println(s"[info] vendor UTxO: ${vu.input.transactionId.toHex}#${vu.input.index} ($v lovelace)")
        println(s"[info] new vendor : $newTotal lovelace; remainder $remainder → treasury")

        Funding.runSpend(ctx, submit, "vendorModify", required) { b0 =>
            var b = b0
                .spend(vu, ContractData.modifyRedeemer, ctx.vendorScript)
                .validFrom(justPast)
                .validTo(soon)
                .payTo(ctx.vendorAddr, Value(Coin(newTotal)), newDatum)
            if remainder > 0 then b = b.payTo(ctx.treasuryAddr, Value(Coin(remainder)), ContractData.void)
            b
        }
    }

    // ---- sweep vendor (after expiry) -----------------------------------------
    // Carries matured+active payouts through; returns everything else to the
    // treasury. Only valid once the tx is entirely after the vendor expiration.
    @main def vendorSweep(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val nowMs = Instant.now().toEpochMilli
        val expMs = ctx.r.vendorExpirationMs
        val inputs = Funding.vendorUtxos(ctx)
        require(inputs.nonEmpty, "no vendor UTxO to sweep")
        require(nowMs > expMs, s"vendor not yet expired (now $nowMs <= expiration $expMs)")

        var toTreasury = 0L
        val plans = inputs.map { vu =>
            val (vendor, payouts) = ContractData.decodeVendorDatum(Funding.inlineDatum(vu))
            val carry = payouts.filter(p => p.active && p.maturationMs < nowMs)
            val carrySum = carry.map(_.lovelace).sum
            toTreasury += (Funding.lovelaceOf(vu) - carrySum)
            (vu, vendor, carry, carrySum)
        }

        println(s"[info] profile   : ${ctx.d.slug}")
        println(s"[info] → treasury : $toTreasury lovelace")

        Funding.runSpend(ctx, submit, "vendorSweep", Seq.empty) { b0 =>
            var b = b0.validFrom(Instant.ofEpochMilli((expMs + 1000).toLong)).validTo(soon)
            for (vu, vendor, carry, carrySum) <- plans do {
                b = b.spend(vu, ContractData.sweepVendorRedeemer, ctx.vendorScript)
                if carry.nonEmpty then
                    b = b.payTo(ctx.vendorAddr, Value(Coin(carrySum)), ContractData.vendorDatum(vendor, carry.map(_.raw)))
            }
            if toTreasury > 0 then b = b.payTo(ctx.treasuryAddr, Value(Coin(toTreasury)), ContractData.void)
            b
        }
    }
}
