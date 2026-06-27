package treasurypublish

// Shared CLI conventions: --network preview|preprod|mainnet (or NETWORK env;
// default preview), and --submit (default is dry-run: build + sign + print, do
// not broadcast).
object Cli:
    def net(args: Seq[String]): Net =
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

    def isSubmit(args: Seq[String]): Boolean = args.contains("--submit")
