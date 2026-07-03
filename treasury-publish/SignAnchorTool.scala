package treasurypublish

import scalus.uplc.builtin.ByteString
import scalus.crypto.ed25519.SigningKey

import java.nio.file.{Files, Path}

// Scala/scalus equivalent of `bun run sign-anchor`. Signs a CIP-100 governance
// anchor JSON in place: fills authors[0].witness with an ed25519 witness over
// the URDNA2015-canonicalized {@context, body}. Idempotent — re-running with the
// same key reproduces the same signature. Only authors[0] is signed (extra
// authors need their own signing pass with their own keys, as in the bun script).
//
//   scala-cli run treasury-publish --main-class treasurypublish.signAnchor -- \
//     gov/anchor.preview.json [--key keys/admin.skey]
//
// Full CIP-108 JSON-schema validation stays in the bun pipeline (the schema
// source of truth); this does the same structural preconditions the bun script
// asserts, then writes the witness.
object SignAnchorTool {

    private final case class Args(anchorPath: String, keyPath: String)

    private def parseArgs(argv: Seq[String]): Args = {
        val positional = scala.collection.mutable.ListBuffer.empty[String]
        var keyPath = "keys/admin.skey"
        var i = 0
        val a = argv.toArray
        while i < a.length do {
            a(i) match
                case "--key" =>
                    i += 1
                    if i >= a.length then sys.error("--key requires a path")
                    keyPath = a(i)
                case flag if flag.startsWith("--key=") => keyPath = flag.drop("--key=".length)
                case flag if flag.startsWith("--")     => sys.error(s"unknown flag: $flag")
                case p                                 => positional += p
            i += 1
        }
        if positional.length != 1 then
            sys.error("usage: signAnchor <anchor.json> [--key keys/admin.skey]")
        Args(positional.head, keyPath)
    }

    @main def signAnchor(args: String*): Unit = {
        val Args(anchorPath, keyPath) = parseArgs(args)

        val anchor = ujson.read(Files.readString(Path.of(anchorPath)))
        val obj = anchor.obj
        require(obj.contains("@context") && obj.contains("body"), s"$anchorPath missing @context or body")
        val authors = obj.get("authors").map(_.arr).getOrElse(sys.error(
          s"$anchorPath has no authors[] to sign — build-anchor should emit at least one placeholder"
        ))
        require(authors.nonEmpty, s"$anchorPath has an empty authors[]")

        val skHex = Files.readString(Path.of(keyPath)).trim
        val sk = SigningKey.unsafeFromByteString(ByteString.fromHex(skHex))

        val w = AnchorSigning.sign(anchor, sk)
        val hashHex = AnchorSigning.bodyHash(anchor).toHex
        val canonBytes = AnchorSigning.canonicalize(anchor).length

        authors(0).obj("witness") = ujson.Obj(
          "witnessAlgorithm" -> w.witnessAlgorithm,
          "publicKey" -> w.publicKeyHex,
          "signature" -> w.signatureHex
        )

        Files.writeString(Path.of(anchorPath), ujson.write(anchor, indent = 2) + "\n")
        println(s"Signed $anchorPath")
        println(s"  canonicalized body: $canonBytes bytes")
        println(s"  body blake2b-256  : $hashHex")
        println(s"  author            : ${authors(0).obj.get("name").map(_.str).getOrElse("?")}")
        println(s"  publicKey         : ${w.publicKeyHex}")
        println(s"  signature         : ${w.signatureHex.take(32)}…")
    }
}
