package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.txbuilder.TxBuilder
import scalus.utils.showDetailed

import scala.concurrent.Await
import scala.concurrent.duration.*

// Seed the TEST treasury contract by paying ADA straight to the treasury script
// address with a Void datum. This simulates a ratified Cardano-treasury
// withdrawal (which will never happen on preview): treasury.ak ignores the input
// datum, so reorganize/disburse/fund spend these UTxOs regardless of how the
// funds arrived. Default 5000 tADA; override with `--ada <n>`.
//
//   run --main-class treasurypublish.seedTreasury -- --profile preview-test --ada 5000 [--submit]
object SeedTreasuryTool {
    @main def seedTreasury(args: String*): Unit = {
        val ctx = Funding.load(args)
        val submit = Cli.isSubmit(args)
        val lovelace = Funding.adaArg(args, default = 5000_000000L)

        println(s"[info] profile        : ${ctx.d.slug}")
        println(s"[info] treasury addr   : ${ctx.treasuryAddr.toBech32.get}")
        println(s"[info] seeding         : ${lovelace} lovelace (${BigDecimal(lovelace) / 1_000_000} ADA)")

        val built = Await
            .result(
              TxBuilder(ctx.provider.cardanoInfo)
                  .payTo(ctx.treasuryAddr, Value(Coin(lovelace.toLong)), ContractData.void)
                  .complete(ctx.provider, ctx.adminAddr),
              120.seconds
            )
            .sign(ctx.signer(Seq.empty))
            .transaction

        println(s"\n[ok] built seed tx ${built.id.toHex} (${built.toCbor.length} bytes)")
        println(built.showDetailed)

        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            return
        }
        println(s"\n[submit] broadcasting ${built.id.toHex} …")
        Chain.submit(ctx.provider, built)
        Deployment.save(ctx.d.slug, ctx.state.copy(txs = ctx.state.txs + ("seedTreasury" -> built.id.toHex)))
        println(s"[done] submitted; updated ${Deployment.path(ctx.d.slug)}")
    }
}
