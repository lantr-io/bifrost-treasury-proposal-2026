package treasurypublish

import scalus.cardano.address.{Address, ShelleyAddress, ShelleyPaymentPart}
import java.time.Instant

// Port of params/common.ts + params/preprod.ts (+ preview re-export). Pure
// functions of static input — every call returns identical bytes, so script
// hashes are stable across init and every subsequent invocation.

enum Net {
    case Preview, Preprod, Mainnet

    /** Blockfrost URL prefix / project-id prefix (network-scoped). */
    def slug: String = this match
        case Preview => "preview"
        case Preprod => "preprod"
        case Mainnet => "mainnet"
}

final case class RawConfig(
    network: Net,
    adminAddress: String,
    boardPkhs: Seq[String], // exactly 3, hex pkhs (K_1, K_2, K_3)
    amountLovelace: BigInt,
    treasuryExpirationISO: String,
    vendorExpirationGraceDays: Int
)

final case class ResolvedConfig(
    network: Net,
    adminAddress: String,
    adminPkhHex: String,
    boardPkhs: Seq[String],
    amountLovelace: BigInt,
    treasuryExpirationMs: BigInt,
    vendorExpirationMs: BigInt,
    vendorPayoutUpperboundMs: BigInt
)

object Config {
    private val MsPerDay: Long = 24L * 60 * 60 * 1000

    /** Payment key hash (hex, 56 chars) from a Shelley base/enterprise address. */
    def addressPaymentKeyHash(addr: String): String = Address.fromBech32(addr) match
        case sh: ShelleyAddress =>
            sh.payment match
                case ShelleyPaymentPart.Key(h) => h.toHex
                case _ => sys.error(s"$addr payment part is a script hash, not a key hash")
        case other => sys.error(s"$addr is not a Shelley payment address: $other")

    def resolve(raw: RawConfig): ResolvedConfig = {
        require(raw.boardPkhs.size == 3, s"expected 3 board pkhs, got ${raw.boardPkhs.size}")
        raw.boardPkhs.zipWithIndex.foreach { (p, i) =>
            require(p.matches("[0-9a-f]{56}"), s"boardPkhs[$i] is not a 56-char hex pkh: \"$p\"")
        }
        val tMs = BigInt(Instant.parse(raw.treasuryExpirationISO).toEpochMilli)
        val vMs = tMs + BigInt(raw.vendorExpirationGraceDays) * MsPerDay
        ResolvedConfig(
          network = raw.network,
          adminAddress = raw.adminAddress,
          adminPkhHex = addressPaymentKeyHash(raw.adminAddress),
          boardPkhs = raw.boardPkhs,
          amountLovelace = raw.amountLovelace,
          treasuryExpirationMs = tMs,
          vendorExpirationMs = vMs,
          vendorPayoutUpperboundMs = tMs
        )
    }

    // ---- Concrete network configs (mirror params/preprod.ts) -----------------

    /** Reduced resubmission "Scalus 2026" — ₳2,991,667, T_max 2027-07-01, vendor grace +30d. Board =
      * production K_1..K_3. Preview re-uses these.
      */
    val preprod: RawConfig = RawConfig(
      network = Net.Preprod,
      adminAddress =
          "addr_test1qqhvk2xna6s7wglqx09k87l4my9uq74gaxrwqn3yqr2zzp97em0a23l90d0nw30feg6gahelyhk5cl5080uzxszrtcdspa5c55",
      boardPkhs = Seq(
        "7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb", // K_1 — Matthias Benkort (CF)
        "058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe", // K_2 — Chris Gianelloni (Blink Labs)
        "fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef" // K_3 — Riley Kilgore (IOG)
      ),
      amountLovelace = BigInt("2991667000000"),
      treasuryExpirationISO = "2027-07-01T00:00:00Z",
      vendorExpirationGraceDays = 30
    )

    val preview: RawConfig = preprod.copy(network = Net.Preview)

    /** Mainnet is intentionally a not-runnable placeholder. */
    def mainnet: RawConfig =
        sys.error("mainnet params not filled in — see params/mainnet.ts before any mainnet run")

    def forNetwork(net: Net): RawConfig = net match
        case Net.Preview => preview
        case Net.Preprod => preprod
        case Net.Mainnet => mainnet
}
