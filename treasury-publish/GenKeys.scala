package treasurypublish

import scalus.cardano.ledger.*
import scalus.cardano.address.{
    Network,
    ShelleyAddress,
    ShelleyPaymentPart,
    ShelleyDelegationPart,
    StakeAddress,
    StakePayload
}
import scalus.uplc.builtin.ByteString
import scalus.uplc.builtin.Builtins.blake2b_224
import scalus.crypto.ed25519.{JvmEd25519Signer, SigningKey}

import java.nio.file.{Files, Path}
import java.nio.file.attribute.PosixFilePermissions
import java.security.SecureRandom

// Generate the operator (K_op) payment + stake keypairs in the raw-hex ed25519
// format consumed by Chain.loadAdminKeys and the bun scripts:
//   keys/admin.{skey,vkey,addr}, keys/admin.stake.{skey,vkey,addr}
//
// Board keys are NOT generated: the active config (Config.preprod) bakes the
// production board members' hardware pkhs, and the Phase-1 tools only ever sign
// with K_op. Idempotent: existing admin.skey is kept.
//
// Addresses are written in testnet form (addr_test1.../stake_test1...); they are
// re-derived per network at use time and cross-checked by key hash, so the
// network byte in the file is irrelevant.
object GenKeysTool:
    private val rng = new SecureRandom()

    private def randomSeed(): ByteString =
        val b = new Array[Byte](32)
        rng.nextBytes(b)
        ByteString.unsafeFromArray(b)

    private def writeKey(path: Path, hex: String, secret: Boolean): Unit =
        Files.writeString(path, hex + "\n")
        if secret then
            try Files.setPosixFilePermissions(path, PosixFilePermissions.fromString("rw-------"))
            catch case _: UnsupportedOperationException => ()

    @main def genKeys(args: String*): Unit =
        val keysDir = Path.of("keys")
        Files.createDirectories(keysDir)

        val skPath = keysDir.resolve("admin.skey")
        if Files.exists(skPath) then
            println(s"$skPath exists — keeping existing operator keys")
            return

        val paySeed = randomSeed()
        val paySk = SigningKey.unsafeFromByteString(paySeed)
        val payPub = JvmEd25519Signer.derivePublicKey(paySk)
        val payKeyHash = AddrKeyHash(blake2b_224(payPub))

        val stakeSeed = randomSeed()
        val stakeSk = SigningKey.unsafeFromByteString(stakeSeed)
        val stakePub = JvmEd25519Signer.derivePublicKey(stakeSk)
        val stakeKeyHash = Hash.stakeKeyHash(blake2b_224(stakePub))

        val net = Network.Testnet
        val baseAddr = ShelleyAddress(
          net,
          ShelleyPaymentPart.Key(payKeyHash),
          ShelleyDelegationPart.Key(stakeKeyHash)
        )
        val stakeAddr = StakeAddress(net, StakePayload.Stake(stakeKeyHash))

        writeKey(skPath, paySeed.toHex, secret = true)
        writeKey(keysDir.resolve("admin.vkey"), payPub.toHex, secret = false)
        writeKey(keysDir.resolve("admin.addr"), baseAddr.toBech32.get, secret = false)
        writeKey(keysDir.resolve("admin.stake.skey"), stakeSeed.toHex, secret = true)
        writeKey(keysDir.resolve("admin.stake.vkey"), stakePub.toHex, secret = false)
        writeKey(keysDir.resolve("admin.stake.addr"), stakeAddr.toBech32.get, secret = false)

        println(s"Wrote operator payment + stake keys to ${keysDir.toAbsolutePath}")
        println(s"  payment pkh : ${payKeyHash.toHex}")
        println(s"  stake   pkh : ${stakeKeyHash.toHex}")
        println(s"  base  addr  : ${baseAddr.toBech32.get}")
        println(s"  stake addr  : ${stakeAddr.toBech32.get}")
        println("")
        println("Fund the base address on the testnet faucet before running init:")
        println("  https://docs.cardano.org/cardano-testnets/tools/faucet")
