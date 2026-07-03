package treasurypublish

// A deployment target: an identity `slug` (⇒ deployment/<slug>.json), the
// Blockfrost `net` it runs on, and the `raw` config that parameterizes its
// scripts. For production the slug IS the network slug (preview/preprod/mainnet).
// The funding-flow TEST profiles run on the preview Blockfrost network but with
// stand-in keys and a distinct slug, so they get their own scripts + deployment
// file, fully isolated from the live preview proposal deployment.
final case class Deploy(slug: String, net: Net, raw: RawConfig)

object Deploy {
    def prod(net: Net): Deploy = Deploy(net.slug, net, Config.forNetwork(net))

    val previewTest: Deploy = Deploy("preview-test", Net.Preview, Config.previewTest)
    val previewTestSweep: Deploy = Deploy("preview-test-sweep", Net.Preview, Config.previewTestSweep)

    /** `--profile <slug>` selects a test deployment; otherwise `--network` (or
      * NETWORK env, default preview) selects the production deployment. */
    def select(args: Seq[String]): Deploy =
        Cli.profile(args) match
            case None                       => prod(Cli.net(args))
            case Some("preview-test")       => previewTest
            case Some("preview-test-sweep") => previewTestSweep
            case Some(other) =>
                sys.error(s"unknown --profile $other (preview-test|preview-test-sweep)")
}
