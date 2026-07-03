package treasurypublish

import scalus.cardano.ledger.*
import scalus.uplc.builtin.ByteString
import scalus.uplc.builtin.Builtins.blake2b_224
import scalus.crypto.ed25519.{JvmEd25519Signer, SigningKey}

import java.nio.file.{Files, Path}
import java.nio.file.attribute.PosixFilePermissions
import java.security.SecureRandom

// Generate throwaway PREVIEW-ONLY stand-in signing keys for the funding-flow
// test: FluidTokens + the three board members. These stand in for parties whose
// real private keys we do not hold, so the test deployment (Config.previewTest /
// previewTestSweep) can actually satisfy every multisig path (disburse, fund,
// vendor-withdraw, pause/resume, modify, sweep).
//
// Payment keys only (no stake) — they only ever appear as required signers.
// Written to keys/test/<name>.{skey,vkey} in the same raw-hex ed25519 format as
// the operator keys. Idempotent: existing keys are kept. keys/ is gitignored.
//
// After (re)generating, paste the printed pkhs into Config.previewTest.
object GenTestKeysTool {
    private val rng = new SecureRandom()
    private val names = Seq("ft", "board1", "board2", "board3")

    private def randomSeed(): ByteString = {
        val b = new Array[Byte](32)
        rng.nextBytes(b)
        ByteString.unsafeFromArray(b)
    }

    @main def genTestKeys(args: String*): Unit = {
        val dir = Path.of("keys/test")
        Files.createDirectories(dir)
        println("[test stand-in keys] (payment pkhs — paste into Config.previewTest)")
        for name <- names do {
            val skPath = dir.resolve(s"$name.skey")
            val (pkh, note) =
                if Files.exists(skPath) then {
                    val sk = SigningKey.unsafeFromByteString(
                      ByteString.fromHex(Files.readString(skPath).trim)
                    )
                    (AddrKeyHash(blake2b_224(JvmEd25519Signer.derivePublicKey(sk))).toHex, "kept")
                } else {
                    val seed = randomSeed()
                    val sk = SigningKey.unsafeFromByteString(seed)
                    val pub = JvmEd25519Signer.derivePublicKey(sk)
                    Files.writeString(skPath, seed.toHex + "\n")
                    try Files.setPosixFilePermissions(skPath, PosixFilePermissions.fromString("rw-------"))
                    catch case _: UnsupportedOperationException => ()
                    Files.writeString(dir.resolve(s"$name.vkey"), pub.toHex + "\n")
                    (AddrKeyHash(blake2b_224(pub)).toHex, "new")
                }
            println(f"  $name%-7s : $pkh  ($note)")
        }
    }
}
