package treasurypublish

import com.apicatalog.jsonld.JsonLd
import com.apicatalog.jsonld.document.JsonDocument
import com.apicatalog.rdf.canon.RdfCanon
import com.apicatalog.rdf.nquads.NQuadsWriter
import jakarta.json.Json

import java.io.{StringReader, StringWriter}
import java.nio.charset.StandardCharsets

import scalus.uplc.builtin.ByteString
import scalus.uplc.builtin.Builtins.blake2b_256
import scalus.crypto.ed25519.{JvmEd25519Signer, SigningKey}

// Scala/scalus port of scripts/sign-anchor.ts — the CIP-100 author-witness
// recipe. Pure (no I/O): canonicalize → hash → sign. Byte-for-byte parity with
// the bun path is enforced offline by sign-anchor.parity.test.scala.
//
// The recipe (CIP-100 §"Authors"): filter the document to {@context, body},
// canonicalize with URDNA2015 (a.k.a. RDFC-1.0) → application/n-quads, ensure a
// trailing newline, blake2b-256 the UTF-8 bytes, then ed25519-sign that 32-byte
// hash directly (the hash IS the signed message — ed25519 does not re-digest it).
//
// URDNA2015 lives in Titanium (titanium-json-ld + titanium-rdfc). The @context
// is inline, so the processor never touches the network. Titanium's canonical
// N-Quads are byte-identical to the JS `jsonld` library the bun script uses
// (verified against both a stress fixture and the real 74 KB anchor).
object AnchorSigning {

    /** The three witness fields written under `authors[i].witness`. */
    final case class Witness(witnessAlgorithm: String, publicKeyHex: String, signatureHex: String)

    /** Steps 1-3: filter to {@context, body}, URDNA2015/RDFC-1.0 → canonical
      * N-Quads, returned as UTF-8 bytes with a single guaranteed trailing
      * newline. The exact bytes we feed Titanium don't matter — canonicalization
      * normalizes them; only the JSON-LD values do.
      */
    def canonicalize(anchor: ujson.Value): Array[Byte] = {
        val obj = anchor.obj
        val ctx = obj.getOrElse("@context", sys.error("anchor missing @context"))
        val body = obj.getOrElse("body", sys.error("anchor missing body"))

        // Round-trip the {@context, body} subset through a string into Jakarta
        // JSON — the model Titanium consumes.
        val subsetJson = ujson.write(ujson.Obj("@context" -> ctx, "body" -> body))
        val subset = Json.createReader(new StringReader(subsetJson)).readObject()
        val doc = JsonDocument.of(subset)

        // JSON-LD → RDF quads → RDFC-1.0 canonicalizer → canonical N-Quads.
        val canon = RdfCanon.create("SHA-256")
        JsonLd.toRdf(doc).provide(canon)
        val sw = new StringWriter()
        canon.provide(new NQuadsWriter(sw))

        val nq = sw.toString
        val payload = if nq.endsWith("\n") then nq else nq + "\n"
        payload.getBytes(StandardCharsets.UTF_8)
    }

    /** Step 4: blake2b-256 of the canonicalized body. */
    def bodyHash(anchor: ujson.Value): ByteString =
        blake2b_256(ByteString.unsafeFromArray(canonicalize(anchor)))

    /** Steps 5-6: ed25519-sign the body hash; return the witness fields for one
      * author. `sk` is a raw 32-byte "normal" ed25519 key (same encoding as the
      * bun side's Ed25519PrivateNormalKeyHex), so identical key + identical body
      * ⇒ identical publicKey + signature.
      */
    def sign(anchor: ujson.Value, sk: SigningKey): Witness = {
        val hash = bodyHash(anchor)
        val pub = JvmEd25519Signer.derivePublicKey(sk)
        val sig = JvmEd25519Signer.sign(sk, hash)
        Witness("ed25519", pub.toHex, sig.toHex)
    }
}
