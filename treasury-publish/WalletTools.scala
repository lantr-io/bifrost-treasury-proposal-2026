package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.txbuilder.TxBuilder
import scalus.utils.showDetailed

import scala.concurrent.Await
import scala.concurrent.duration.*

// Split the operator (K_op) wallet into several ada-only UTxOs by paying to
// itself. A single-UTxO wallet cannot run a script tx: the one UTxO gets
// consumed as an input, leaving nothing for the required collateral. This
// creates `--parts` outputs of `--ada` each (change returns the rest), so seed /
// fee / collateral can be drawn from distinct UTxOs.
//
//   run --main-class treasurypublish.splitWallet -- --network preview --parts 4 --ada 300 [--submit]
object WalletTools {
    @main def splitWallet(args: String*): Unit = {
        val net = Cli.net(args)
        val submit = Cli.isSubmit(args)
        val parts = args.sliding(2).collectFirst { case Seq("--parts", v) => v.toInt }.getOrElse(4)
        val perPart = args.sliding(2).collectFirst { case Seq("--ada", v) => (BigDecimal(v) * 1_000_000).toLong }.getOrElse(300_000000L)

        val apiKey = Chain.loadBlockfrostKey(net)
        val provider = Chain.provider(net, apiKey)
        val keys = Chain.loadAdminKeys("keys")
        val adminAddr = Chain.paymentAddress(net, keys)

        var builder = TxBuilder(provider.cardanoInfo)
        for _ <- 1 to parts do builder = builder.payTo(adminAddr, Value(Coin(perPart)))

        val tx = Await
            .result(builder.complete(provider, adminAddr), 120.seconds)
            .sign(Chain.signer(keys))
            .transaction

        println(s"[info] splitting ${adminAddr.toBech32.get} into $parts × ${BigDecimal(perPart) / 1_000_000} ADA + change")
        println(s"[ok] built split tx ${tx.id.toHex} (${tx.toCbor.length} bytes)")
        println(tx.showDetailed)
        if !submit then {
            println("\n--dry-run (default): not submitting. Re-run with --submit to broadcast.")
            return
        }
        println(s"\n[submit] broadcasting ${tx.id.toHex} …")
        Chain.submit(provider, tx)
        println(s"[done] submitted ${tx.id.toHex}")
    }
}
