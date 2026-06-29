package treasurypublish

// Shared CLI conventions: --network preview|preprod|mainnet (or NETWORK env;
// default preview), and --submit (default is dry-run: build + sign + print, do
// not broadcast).
object Cli {
    def net(args: Seq[String]): Net = {
        val v = args
            .sliding(2)
            .collectFirst { case Seq("--network", value) => value }
            .orElse(args.collectFirst {
                case a if a.startsWith("--network=") => a.drop("--network=".length)
            })
            .orElse(sys.env.get("NETWORK").filter(_.nonEmpty))
            .getOrElse("preview")
        v match
            case "preview" => Net.Preview
            case "preprod" => Net.Preprod
            case "mainnet" => Net.Mainnet
            case other     => sys.error(s"unsupported --network $other (preview|preprod|mainnet)")
    }

    def isSubmit(args: Seq[String]): Boolean = args.contains("--submit")

    /** Optional `--seed <txid#ix>` override for the one-shot seed UTxO. When set, init uses exactly
      * this UTxO instead of auto-picking, so a parity run can force the bun and scalus pipelines
      * onto the identical seed (otherwise the oneshot policy and every downstream script hash
      * diverge).
      */
    def seed(args: Seq[String]): Option[(String, Int)] =
        args
            .sliding(2)
            .collectFirst { case Seq("--seed", value) => value }
            .orElse(args.collectFirst {
                case a if a.startsWith("--seed=") => a.drop("--seed=".length)
            })
            .map { ref =>
                ref.split("#") match
                    case Array(tx, ix) => (tx, ix.toInt)
                    case _             => sys.error(s"--seed must be <txid#ix> (got $ref)")
            }
}
