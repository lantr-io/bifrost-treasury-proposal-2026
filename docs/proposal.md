# Bifrost: Unlocking Bitcoin DeFi on Cardano — Road to Mainnet (Phase 1 of 2)

**Proposers:** Alex Nemish · Matteo Coppola · Oleksii Khodakivskyi · Raul A. Rosa Padilla
**Organisations:** FluidTokens & Lantr Engineering

---

## Abstract

Bitcoin is the largest pool of capital in crypto, yet most BTC still sits outside DeFi because moving it off the Bitcoin base layer still requires security trade-offs many holders are not willing to accept. Cardano is structurally well suited for Bitcoin DeFi, but it lacks the secure BTC rail needed to compete for that liquidity.

Bifrost is designed to provide that rail: a permissionless Bitcoin-Cardano bridge secured by Cardano’s existing SPO ecosystem that brings BTC onto Cardano as a native Cardano asset that applications can integrate into trading, lending, collateral, and other financial use cases. The bridge is on testnet today under Catalyst Fund 14.

This proposal funds Phase 1 of 2: the work required to take Bifrost from a working testnet to launch readiness. It covers hardening, security audits, formal verification, ecosystem and partner readiness, and the stewardship and economic foundations required for launch. Public rollout and 24 months of operations are intentionally separated into a Phase 2 proposal in Q1 2027, once the bridge has been proven on-chain.

FluidTokens and Lantr Engineering request ₳12,332,031 (approx, \$1,973,125 at 0.16 USD/ADA, including a 10% refundable contingency) from the Cardano Treasury for a 9-month delivery period from July 2026 to March 2027.

By the end of Phase 1, Bifrost will be an audited bridge running on Cardano mainnet in both custody modes (federated and SPO threshold) under controlled access, together with the stewardship structure, hardened economic model, and SPO/dApp partner pipeline required for public launch.

For Cardano, that means a proven secure rail into Bitcoin liquidity, ready to be opened to the public in Phase 2, and a credible position from which to compete for one of the largest pools of capital in crypto.

## Motivation

### Bitcoin Is the Largest Untapped Liquidity Opportunity in DeFi

Bitcoin is the largest pool of capital in crypto, with roughly \$1.6 trillion in value, yet most of that capital still sits outside DeFi. That makes Bitcoin liquidity one of the largest open opportunities for any ecosystem that can attract it credibly.

The constraint is structural. Bitcoin was designed as a secure monetary layer, not as a rich execution environment for lending, trading, and other on-chain financial use cases. As a result, holders who want to make BTC productive usually have to leave the Bitcoin base layer and enter another ecosystem.

For years, ecosystems such as Ethereum, Solana, Sui have tried to attract Bitcoin liquidity into their own DeFi environments. Yet despite those efforts, only around 1% of BTC supply is currently used in DeFi. 

The reason is not a lack of demand. For many Bitcoin holders, the security trade-offs involved in leaving the Bitcoin base layer are still too high. As a result, one of the largest liquidity markets in crypto remains far from fully unlocked. 

---

### Security Remains the Main Barrier to Bitcoin DeFi Adoption

When Bitcoin holders move BTC across chains, they are evaluating a chain of security assumptions: the route that moves BTC, the mechanism that represents it on the destination chain, and the security of the network and application where it will be used.

Who controls the locked BTC? Who can authorise release or minting? Who can upgrade the system? What happens if signers collude, keys are compromised, or coordination breaks down?

These concerns are not theoretical. Cross-chain systems have repeatedly concentrated risk around custody, signer sets, upgrade authority, and operational complexity. DeFiLlama’s historical loss data shows cumulative DeFi losses in the billions, with bridge-related failures accounting for a significant share of that total.

In practice, most existing solutions fall into three categories:

| Solution | What the user gets | Main trade-off |
|---|---|---|
| Custodial or wrapped BTC | BTC-backed token on another chain | Trust in a custodian |
| Bridge or signer-set BTC | BTC moved through a coordinated bridge | Trust in the bridge, signer set, and coordination model |
| Synthetic BTC exposure | Token linked to BTC price | Furthest from holding actual BTC |

Each model solves part of the problem, but none has yet become the standard path for serious Bitcoin capital. Bitcoin DeFi still lacks an access model whose security trade-offs a broad base of BTC holders is willing to accept.

--- 

### Cardano Offers a Secure Destination for Bitcoin Liquidity

Cardano is well positioned to offer a secure destination for Bitcoin liquidity and DeFi. It offers several properties that are structurally closer to Bitcoin’s expectations than those of other smart-contract networks.

- **eUTxO:** Cardano shares a UTxO foundation with Bitcoin, where execution is deterministic and predictable, while extending that model with the programmability needed for DeFi.
- **Native tokens**: Cardano supports native assets at the ledger level, making them first-class citizens alongside ADA rather than assets managed only through application-level token logic. That reduces reliance on approval flows and some of the token-handling risks common in account-based environments.
- **Predictable fees**: Cardano offers low and predictable fees, which matters in DeFi. Highly variable execution costs create additional risk for borrowers, liquidity providers, and users operating under time pressure.
- **Security by design**: Cardano’s architecture and development have been shaped by research, formal methods, and peer-reviewed engineering, while the network itself is secured by a broad and decentralized SPO ecosystem.

The result is a chain that is structurally aligned with Bitcoin, predictable enough for financial applications, and security-oriented enough to serve as a credible destination for Bitcoin liquidity.

---

### Cardano Still Lacks the BTC Rails to Compete

Cardano’s unique properties are not enough on their own. If Cardano is to compete seriously for Bitcoin DeFi, it still needs a path that BTC holders trust enough to use.

That is also where the timing matters. The market for Bitcoin liquidity is still open because no access/security model has yet become the clear standard for serious BTC capital. But that window will narrow once one ecosystem establishes credible rails and begins compounding liquidity, integrations, and user habits around it.

Today, Cardano captures only a negligible share of Bitcoin DeFi activity. Without a secure BTC access path, its applications remain largely cut off from one of the largest pools of capital in crypto.

This is the gap Bifrost is designed to fill, before that opportunity consolidates elsewhere.

## Rationale

### Strategic vision: Bifrost — Cardano is a Credible Destination for Bitcoin DeFi

With Bifrost in production, Cardano becomes a credible destination for Bitcoin DeFi. Bitcoin liquidity flows in through rails built on stronger security assumptions than the routes available today, while Cardano applications gain a path to extend their reach to Bitcoin holders.

Bifrost makes this possible through a permissionless, optimistic Bitcoin-Cardano bridge secured by Cardano’s existing SPO ecosystem and on-chain coordination logic for deposits, withdrawals, and treasury movements.

The outcomes extend beyond the bridge itself:
- Cardano's DeFi gains access to one of the largest pools of capital in crypto. 
- SPOs gain a new economic role in securing BTC custody & access.
- fBTC becomes a native Cardano asset, composable across the ecosystem.
- The same model can extend to the wider UTXO family and beyond, creating a foundation for Cardano to play a broader interoperability role.

This proposal funds the first step toward that outcome; public launch and operations follow in Phase 2.

---

### What Makes Bifrost Different

Bifrost differs from existing BTC rails in three ways:
 
**Custody and bridge security** 

In Bifrost, custody of locked BTC is not held by a company, a foundation, or a fixed signing committee. It is distributed across 400+ Cardano SPOs, weighted by delegation, the same operators that secure Cardano itself.

Moving funds requires a cryptographic threshold of SPOs representing the majority of delegated stake. The SPO set changes as new operators join and stake delegation shifts over time, making coordinated compromise significantly harder.

If SPO coordination fails, a federated mode activates as an operational fallback, giving Bifrost an additional continuity layer rather than the single operational path most bridges rely on.

**Cardano-native composability** 

fBTC arrives on Cardano as a native token (CNT) at the ledger level rather than as a smart-contract-wrapped representation. That allows Cardano applications/wallets to integrate and use it  through the same asset model they already support for other native tokens, without additional bridging complexity.

Deposits and withdrawals are also granular. A holder who brings 1 BTC onto Cardano can split that liquidity across multiple addresses, applications, or smart contracts, and later withdraw only the amount no longer needed on Cardano rather than the full original deposit.

This makes BTC liquidity easier to use across trading, lending, and other DeFi flows in the same way Cardano-native assets already are.

**A shared BTC access layer** 

Bifrost is a shared BTC rail that can be used directly through its own interface or embedded inside other Cardano applications.

Wallets, DEXs, and lending markets can integrate Bifrost through an SDK or white-label portal, offering BTC onboarding inside their own product while Bifrost handles the bridge underneath. Applications can also sponsor bridge and network fees to facilitate BTC inflow.

This makes Bifrost shared infrastructure rather than a standalone interface. Cardano applications stop being passive recipients of bridged liquidity and become active distribution channels for it.

---

### Public infrastructure 

Bifrost is structured as public infrastructure. The value the bridge creates flows to the Cardano ecosystem and BTC holders rather than to a proprietary token, a founder allocation, or a controlling company.

**No bridge token**. All value flows through ADA and fBTC. There is no separate Bifrost token sitting between users and the bridge to capture rent, governance rights, or speculative premium. The native economic units of the system are the asset being bridged (BTC) and the chain's gas asset (ADA).

**No founder allocation**. The FluidTokens and Lantr Engineering teams who built Bifrost do not hold a token allocation, a treasury share, or any built-in revenue claim on the protocol. Their compensation comes from delivery against this proposal, not from ongoing protocol rents.

**Open source**. Bifrost’s smart contracts, off-chain tooling, and SDK are released under Apache 2. Anyone can audit, fork, run, or build on top of the bridge without permission.

**Public accountability**. Operations, milestone progress, treasury disbursements, and on-chain activity are reported publicly to the Cardano community by default. Detailed cadence described in the Reporting section.

**Independent stewardship**. The bridge will be held by an independent stewardship structure (a foundation or equivalent independent form), determined in Phase 1, sitting outside the founding teams. See Ownership & Stewardship section.

---

### How Bifrost works

At its core, Bifrost performs two operations: it moves Bitcoin from Bitcoin to Cardano (a deposit, or peg-in), and back (a withdrawal, or peg-out). Everything else in the system, cryptography, coordination, and asset issuance, exists to make those two operations safe at scale.

#### The actors

Three roles operate the bridge:

- **Users:** anyone holding BTC on Bitcoin or fBTC on Cardano.
- **Watchtowers:** permissionless operators that observe the Bitcoin network and post confirmed block headers to Cardano. Anyone can run one; no whitelist or approval is required.
- **Stake Pool Operators (SPOs):** the 400+ SPOs that secure locked BTC and authorise bridge operations through threshold signing.

#### Deposit (Bitcoin → Cardano)

A holder sends BTC to a Bifrost address: a Taproot script secured by the SPO threshold. Once the deposit is confirmed on Bitcoin and posted to Cardano by a Watchtower, the holder claims the equivalent fBTC on Cardano in a self-service transaction. No operator approval is required.

![bifrost-deposit](https://gateway.pinata.cloud/ipfs/QmRkMZAJJDcAxHvKgiGotKHYXbpvDU7CmFKDC4KGPYkSEv)

#### Withdrawal (Cardano → Bitcoin) 

A holder returns fBTC on Cardano. A cryptographic threshold of SPOs co-signs the release transaction, which is then broadcast to Bitcoin so BTC arrives at the holder’s address. Withdrawals can be partial: a holder does not need to return the full original deposit.

![bifrost-withdrawal](https://gateway.pinata.cloud/ipfs/QmQPXn5r67P9vTWhAZ6cUPMEZdhiThKgkkY3j4TMq2Bz4J)

#### Atomic swaps fast lane

For users who prioritize speed over the standard confirmation window, Bifrost includes a non-custodial atomic-swap fast lane.

The swap happens directly between two parties: a Bitcoin holder entering Cardano and an fBTC holder willing to provide instant liquidity in exchange for a small premium. 

Both sides of the swap are cryptographically locked, so neither party can claim the asset without completing their side. The exchange settles in a few Bitcoin block confirmations, significantly faster than the standard deposit path.

![bifrost-atomic-swaps](https://gateway.pinata.cloud/ipfs/QmY9sXBLDvNPGQaCgEvnBXyU2ytY9rKrJxipK5vxB7eZYd)

#### Embedded integration

Cardano applications can integrate Bifrost through an SDK or white-label portal. That allows wallets, DEXs, lending markets, and other dApps to expose BTC onboarding inside the products users already trust.

Applications can also sponsor bridge fees, reducing or in some flows removing the need for users to acquire ADA before interacting.

#### fBTC on Cardano

fBTC is a native Cardano token, issued and burned in 1:1 correspondence with BTC locked in the Bifrost custody script on Bitcoin. 
 
Because it is native, Cardano dApps can handle it through the same asset model they already support for other native tokens.
  
---

### Use cases

Bifrost creates value in two stages: first by bringing BTC onto Cardano, and then by making that BTC usable across Cardano DeFi as fBTC.
 
#### Access paths

- **Secure transfer for larger holders.** Treasury managers, funds, or high-value BTC holders want to deploy their BTC into yield strategies without compromising security. They can use the standard deposit path to move BTC onto Cardano while preserving custody, then deploy fBTC across Cardano DeFi.
- **Fast lane for time-sensitive users.** Users who prioritise speed can enter through the atomic-swap path, reaching Cardano in a few Bitcoin block confirmations rather than waiting for the full deposit flow.
- **Embedded access through Cardano applications.** Wallets, DEXs, lending markets, and other dApps can integrate Bifrost through an SDK or white-label portal, allowing users to hold, trade, borrow against, or earn yield on BTC inside products they already trust.

#### DeFi opportunities on Cardano

Once on Cardano, fBTC becomes composable across Cardano’s DeFi ecosystem.

- **Atomic-swap liquidity provision.** fBTC holders can provide liquidity to the fast lane and earn premium fees from users entering Cardano quickly.
- **DEX liquidity.** fBTC can be paired with ADA, stablecoins, or other BTC representations to deepen Cardano trading liquidity.
- **Lending and collateral.** Holders can supply fBTC into lending protocols or borrow stablecoins against BTC without selling the underlying asset.
- **Derivatives, RWA and structured products.** Once on Cardano, fBTC can serve as the BTC leg for perpetuals, synthetic assets, and other higher-order DeFi products. 

Together, these venues create a range of yield and risk profiles suited to different types of BTC holders, from conservative collateral use to more active trading and liquidity strategies.
 
--- 
 
### Benefits for the ecosystem

Bifrost creates value across four stakeholder groups in the Cardano ecosystem, each benefiting from the same public infrastructure in a different way. These benefits are the result of the full two-phase rollout.

**Cardano ecosystem.** Direct contribution to TVL, transactions, and active users. Every BTC bridged into Cardano becomes new TVL for Cardano DeFi. Every deposit, withdrawal, and downstream DeFi transaction adds to on-chain activity. Bitcoin holders arriving on Cardano represent a net-new user segment rather than a transfer from elsewhere. These outcomes map directly to Cardano 2030 growth targets across TVL, MAU, and transaction volume.

**Cardano applications**. A larger addressable market and a direct distribution channel. fBTC arrives as a native Cardano asset that can plug into the existing DeFi asset model. Applications integrating Bifrost through the SDK or white-label portal gain a path to Bitcoin holders themselves, not just to liquidity that happens to arrive elsewhere.

**Cardano Stake Pool Operators**. A new economic role. Beyond block production, SPOs gain a new economic role in securing BTC access and bridge operations. That creates a new revenue stream linked to Bitcoin activity, broadening the economic base that supports long-term SPO participation.

**Bitcoin holders and institutions**. Access to DeFi without the same custody compromises common in existing routes. Retail users gain access to Cardano DeFi through a more security-oriented path. Treasury managers and institutional holders gain a route into on-chain liquidity and yield strategies without relying on a centralised custodian.

--- 

### Cardano 2030 alignment

Bifrost directly contributes to Cardano 2030 by feeding into headline ecosystem KPIs, and aligning with its strategic pillars.

Bifrost opens to the public in Phase 2, thus most of this contribution activates then (see *Phase 2 — Adoption plan*); Phase 1 funds the audited bridge & launch preparation that makes it possible.

**Core KPI Contribution** 

| Vision 2030 KPI | Ecosystem Target by 2030 | Bifrost Target (Base, Q2 2029) | How Bifrost Contributes |
|---|---|---|---|
| **TVL** | \$3B | 1,200 BTC | Net-new Bitcoin liquidity locked into Cardano DeFi as fBTC, capital that would otherwise sit outside the ecosystem entirely. |
| **Annual Transactions** | 324M | ~600K/yr (50K/mo) | Peg-ins, peg-outs, atomic-swap fast-lane, and downstream fBTC DeFi activity. |
| **Monthly Active Users** | 1M | 3,000 fBTC-holding wallets | A net-new Bitcoin-holder segment onboarded to Cardano. |
| **Protocol Revenue** | - | Fee-funded; surplus to Treasury | Bridge fees (in fBTC) fund operations; surplus splits to SPOs and the Cardano Treasury (see *Revenue Model & Sustainability*). |

**Cardano 2030 Pillars**

| Pillar | Focus Area | Our contribution |
|---|---|---|
| **Pillar 1: Infrastructure & Research Excellence** | Scalability & Interoperability › Cross-chain interoperability | A standardised, secure Bitcoin-Cardano bridge (FROST/Taproot); the same SPO-secured model extends to the wider UTXO family, positioning Cardano as an interoperability hub. |
| **Pillar 2: Adoption & Utility** | High-Value Verticals › DeFi |  Bifrost is the secure, institutional-grade BTC liquidity onramp onto Cardano; fBTC is then a native, composable asset across Cardano DeFi (trading, lending, collateral, and structured products gain a Bitcoin leg). |
| | Experience (Business & Consumer) › Invisible technology | SDK and white-label portal let wallets and dApps embed BTC onboarding invisibly; sponsored transactions remove the need for users to hold ADA first. |
| | Developer Experience › Open-source incentives | Bifrost ships as open-source public infrastructure (Apache 2.0) with an integration SDK any Cardano app can build on without permission. |
| **Pillar 4: Community & Ecosystem Growth** | Global Engagement & Market Adoption › Proactively Demonstrate Ecosystem Value | A high-assurance flagship that demonstrates Cardano's architectural strengths (eUTxO, SPO-secured custody, formal verification) to the Bitcoin community, building external confidence with holders, institutions, and partners (see *Ecosystem readiness & partnerships*). |
| **Pillar 5: Ecosystem Sustainability & Resilience** | Financial Stewardship & Tokenomics › Multi-Asset Treasury |  Bridge fee surplus returns to the Cardano Treasury in fBTC, creating a long-lasting return to the Cardano community aligned with the public infrastructure's success. |
| | SPO Incentives › Diversified SPO roles |  400+ SPOs gain a new economic role beyond block production: securing BTC custody and authorising bridge operations. Rewards are paid in fBTC, aligning SPOs with the success of the bridge they secure. |

--- 

### Traction & current state

Bifrost is not a paper proposal. The bridge is already live on testnet, shipping against an active Catalyst grant, with working peg-ins/outs and participating SPOs.

#### Catalyst Fund 14

Bifrost is currently funded through Catalyst Fund 14, with a specific goal: prove the architecture works end-to-end on testnet. By August 2026, the bridge will be operational on Bitcoin Testnet4 + Cardano Preprod, with Watchtowers, SPO coordination protocols, smart contracts, and a usable frontend — all open source and documented.

| Field | Value |
|---|---|
| Proposal | Bifrost: Bitcoin-Cardano bridge secured by Cardano SPOs |
| Fund | Fund 14 - Cardano Use Cases: Partners and Products |
| Amount Funded | ₳739,000 |
| Voting Result | 585 votes - Approved |
| Deliverables | Architecture, Testnet MVP, Documentation |
| Timeline | Dec 2025 - Aug 2026 (on track) |

#### Catalyst milestone status

| Milestone | Title | Status |
|-----------|-------|--------|
| M1 | Bridge Architecture Design | Done, approved |
| M2 | Minimal Testable Version: Smart contracts & Watchtower happy paths | Done, approved |
| M3 | Minimal Usable Version: SPOs coordination protocol & Watchtower challenging | Submitted, awaiting Catalyst signoff |
| M4 | Minimal Loveable Version: Unhappy paths, edge cases and Performance | On track, submitting in July 2026 |
| M5 | Documentation | On track, submitting in July 2026 |
| Final | Reporting and full end-to-end execution | On track, submitting in August 2026 |

#### Testnet live today

The bridge is live and operational on testnet. Peg-in between Bitcoin Testnet4 and Cardano Preprod is fully working and open to anyone.

- Testnet: [bifrost.fluidtokens.com](https://bifrost.fluidtokens.com/)
- Proof of transaction on Cardano Preprod: a43ce4586939509d0845bb9cf1e5a9b6242faca2b977d31b484d225b9c9ae6db

Real users have joined the testnet and are actively bridging BTC. 

#### Working with SPOs

The following SPOs volunteered to participate in the Testnet release of the Bifrost product: BTBF, ADA North Pool, BCSH, EASY1, DAVE. They will help us by trying the software, sharing feedback, and providing practical insights on setup, reliability, and operator concerns.

#### Cardano dApps engagement

The following Cardano applications have expressed an interest in integrating Bifrost or fBTC into their workflows: Minswap, SundaeSwap, Masumi, Gravity, DeltaDefi, Liqwid, FluidTokens, Vela Finance.

#### Component maturity

| Component | At end of Catalyst | Required for mainnet | Funding |
|---|---|---|---|
| **Protocol / smart contracts** | Testnet-ready, in audit prep | External audit, formal verification for the critical paths, mainnet deployment | Catalyst → Phase 1 |
| **Watchtowers** | Core protocol working | Production infrastructure, hardening, security audits | Catalyst → Phase 1 |
| **SPO coordination software** | Core protocol working | Production readiness, security audits, both modes proven on mainnet | Catalyst → Phase 1 |
| **Frontend / SDK / whitelabel** | Working testnet UI | Production UX, SDK polish, whitelabel for dApps, security audit | Phase 1 |
| **Treasury, fees, operations management** | Out of Catalyst scope | Economic model hardened; ops tooling built & audited | Phase 1 |
| **Transparency portal** | Out of Catalyst scope | Built, audited and operational | Phase 1 |

#### Why this proposal now

Catalyst funded the path to a working testnet. What it did not fund is the path from testnet to an audited mainnet bridge. 

This proposal covers that next step: hardening, audits, formal verification, and deployment to a private mainnet running in both custody modes (federated and SPO threshold) under controlled access. Public launch and operations follow in Phase 2.

Submitting Phase 1 now means mainnet hardening and audits begin as Catalyst milestones close — with no pause in delivery between the two.

---

### FluidTokens + Lantr Engineering Teams

Bifrost is a joint initiative by **FluidTokens** and **Lantr Engineering**, two teams with complementary expertise across Bitcoin, Cardano, and UTxO-based infrastructure.

FluidTokens brings a live product footprint across Cardano and Bitcoin, while Lantr brings infrastructure R&D depth across interoperability, scalability, and cryptography. The two teams have already moved Bifrost from concept to a working public testnet within the scope of Catalyst Fund 14.

Together, the two teams cover the full delivery surface Bifrost depends on: Bitcoin scripting, Cardano smart contracts, threshold cryptography, watchtower infrastructure, frontend and SDK development, and production operations.

#### Track record

**FluidTokens** — building DeFi primitives & products on Cardano and Bitcoin since 2022.
- **Products:** FluidTokens - pool-based and P2P lending (margin and non-margin loans), asset renting, Bitcoin token staking, account abstraction.
- **Audits:** protocols and major versions audited by Vacuumlabs, Anastasia Labs, and No.Witness Labs.
- **Ecosystem collaborations:** Minswap (CIP-113), Finest.

**Lantr Engineering** — blockchain R&D and product development for decentralized infrastructure and mission-critical systems.
- **Products**: Scalus, Binocular, Cosmex.
- **Infrastructure collaborations**: Bifrost, Hydrozoa L2, MeshJS, Evolution SDK, and other ecosystem tooling.
- **Ecosystem participation**: technical working groups (Plutus, Ledger, Layer 2); education collaborations including University of Zurich in 2025 & 2026; and open-source contributions across the Cardano toolchain.
  
Both teams have successfully delivered Catalyst-funded work across multiple funding rounds. 

#### Leadership

| Name | Role | Organisation | Domain expertise |
|---|---|---|---|
| Matteo Coppola | Technical co-lead | FluidTokens | Smart contracts, cloud architecture, original bridge design |
| Raul A. Rosa Padilla | Integrations lead | FluidTokens | Full-stack Cardano/Bitcoin development, dApp integrations |
| Alex Nemish | Technical co-lead | Lantr Engineering | Bitcoin-Cardano bridging research, threshold cryptography, protocol design |
| Oleksii Khodakivskyi | Product lead | Lantr Engineering | Product strategy, Watchtower design |

#### Team capacity

The proposal is backed by two engineering teams: 8 senior engineers at FluidTokens and 6 senior engineers at Lantr Engineering, spanning Aiken/Scalus, TypeScript/JavaScript, Bitcoin and Cardano smart contracts, Scala, Java, Haskell, Rust, compilers, functional programming, and cryptography.

Beyond the core teams, both organizations can draw on a broader network of trusted senior engineers and domain specialists where additional capacity or specialist review is required.

---

### Roadmap & Budget overview

Bifrost reaches public mainnet in two phases.

This proposal (Phase 1) covers the first three milestones (M1–M3) over nine months, delivering an audited bridge running on Cardano mainnet under controlled access. The staged public launch (M4) and 24 months of operations follow in the Phase 2 proposal (Q1 2027). The full journey is shown below.

![bifrost-phases1_2](https://gateway.pinata.cloud/ipfs/QmNxxaqJMcWV1STDfKnqdBxDT2QZSrKAiAqdsMpfroGPhr)

The phases are separated deliberately. This proposal asks the Treasury to fund audited mainnet readiness first, then returns with on-chain proof before requesting funding for public launch and operations. Separating the asks also lets Phase 2 be priced closer to launch, rather than against today’s exchange rate.

#### Phase 1: Path to Mainnet 

Phase 1 runs across three parallel workstreams:

**1. Bridge hardening & Security**

This track turns the Catalyst-funded testnet into a production-ready bridge. 

It covers core bridge development & hardening (including smart contracts, watchtowers, SPO coordination, frontend, SDK, and transparency tooling), together with the security & QA work needed for mainnet: audits, formal verification, penetration testing, bug bounty, and product management.

**Purpose**: deliver the bridge itself, hardened and secure to the standard required to run on mainnet and to open publicly in Phase 2.

**2. Ecosystem readiness & partnerships**

This track builds the conditions for a successful public launch, so Phase 2 opens into a ready ecosystem rather than a standing start.

It covers SPO onboarding, dApp integration support, and ecosystem & partnership development.

**Purpose**: ensure that Bifrost does not launch into a vacuum, but into an ecosystem with operators, integrations, and an initial user/partner base already in place.

**3. Legal, stewardship & economy**

This track sets up the institutional and economic foundation the launch depends on.

It covers determining and standing up the long-term stewardship structure, hardening the economic model, and the regulatory, compliance, and grant-administration work.

**Purpose**: deliver a stewardship structure and a hardened economic model, the two foundations the public launch and operations proposal builds on.

#### Phase 2: Launch & Operations (funded separately, Q1 2027)

Phase 2 covers the staged public rollout (federated → full SPO threshold mode) and a 24-month window to operate the bridge and grow adoption.

**Purpose**: deliver Bifrost as maintained public infrastructure that reaches self-sustainability at Year 3, rather than a one-time launch event.

Shown above for the complete picture; not part of this ask.


#### Budget overview (Phase 1)

| Track | Total, USD | Total, ADA | % |
|---|---:|---:|---:|
| 1. Bridge hardening & Security | \$1,363,750 | ₳8,523,438 | 76.0% |
| 2. Ecosystem readiness & partnerships | \$177,500 | ₳1,109,375 | 9.9% |
| 3. Legal, stewardship & economy | \$252,500 | ₳1,578,125 | 14.1% |
| **Subtotal** | **\$1,793,750** | **₳11,210,938** | **100%** |
| Refundable contingency (10%) | \$179,375 | ₳1,121,094 | — |
| **Total** | **\$1,973,125** | **₳12,332,031** | — |

Funding requested in ADA at a conservative \$0.16/ADA reference rate.

For reference, Phase 2 (Launch & Operations) is estimated at \$1.3M and will be requested in Q1 2027.

Per-workstream breakdown and details are in the Detailed Budget section.

---

### Milestones and deliverables

Phase 1 delivers across three milestones (M1–M3). Each milestone gates the next; the public launch (M4) and operations begin in the Phase 2 proposal. 

#### M1 (Q3 2026): Hardening & Audit Readiness

**Objective**: Turn the Catalyst-funded testnet prototype into a mainnet release candidate ready for external auditing.

**Deliverables**:
- Architecture and protocol frozen
- Mainnet-oriented release candidate (smart contracts, Bitcoin scripts, watchtowers, and SPO coordination software)
- Test coverage materially expanded
- Evidence package prepared for external auditors
- Security model and operating assumptions documented
- Stewardship options and regulatory analysis initiated

**Acceptance criteria / Evidence of completion**:
- Release candidate tagged on a public commit
- Documentation baseline complete and published
- Pre-audit architecture review and threat model delivered
- Test coverage report public

#### M2 (Q4 2026): Security Audits & Mainnet Preparation

**Objective**: Subject the hardened system to external scrutiny, remediate critical findings, and prepare a private mainnet launch.

**Deliverables**:
- Mainnet-oriented release candidate ready (front-end, SDK, transparency portal)
- Protocol smart contract audits completed by an external firm
- Cryptographic protocol review completed (Bitcoin Tapscript, FROST/Schnorr, DKG ceremony)
- Watchtower smart-contracts and software audited
- Formal verification of critical paths delivered
- Both custody modes (federated fallback and SPO threshold signing) defined and tested on testnet
- Mainnet deployment runbook complete
- Stewardship structure decided; regulatory review delivered
- dApp integration support underway; partnership pipeline building

**Acceptance criteria / Evidence of completion**:
- Audit reports published (smart contracts, cryptographic, off-chain, pentest, formal verification)
- Critical findings remediated or formally accepted
- Both custody modes operational on testnet
- Mainnet deployment plan public

#### M3 (Q1 2027): Private Mainnet — Audited & Running

**Objective**: Deploy the bridge to Cardano mainnet, complete the off-chain audit sweep, and demonstrate both custody modes end-to-end with real BTC under controlled, private access, proving the system works before any public launch. Deliver the stewardship structure and hardened economic model the Phase 2 launch builds on.

**Deliverables**:

Audits & security:
- Off-chain components audited (SPO coordination software, frontend, SDK)
- Penetration testing completed across infrastructure and protocol layers
- Bug bounty program launched

Private mainnet - both modes:
- Smart contracts deployed to Cardano mainnet; Bitcoin Taproot custody live on Bitcoin mainnet
- Federated mode demonstrated with real BTC
- SPO threshold mode demonstrated with a live SPO set, with real BTC
- First private mainnet peg-in & peg-out executed and verified
- Monitoring and observability infrastructure live
- Transparency portal operational
- Maintenance procedures & IR drill tested

Foundations for Phase 2:
- Stewardship structure determined and stood up (foundation or equivalent independent form)
- Economic model hardened: fee structure, distribution, reserve targets, and SPO incentives finalised
- Ecosystem readiness documented — SPO participation pledges, dApp integration commitments, BTC-holder interest

**Acceptance criteria / Evidence of completion**:

- Off-chain audit reports + pentest report published; critical findings remediated
- Bug bounty live on a public platform
- Mainnet contract addresses verified and published
- Successful private mainnet peg-in and peg-out in both federated and SPO threshold modes (transaction hashes public)
- Transparency portal publicly accessible
- Stewardship structure established and charter published
- Hardened economic model published
- Partnership pipeline documented (SPO pledges, dApp commitments)

M3 closes Phase 1 with an audited bridge running on mainnet in both custody modes, plus the two foundations the launch depends on: a determined stewardship structure and a hardened economic model. These feed directly into the Phase 2 Launch & Operations proposal.

---

### Phase 2 - Adoption plan

The adoption plan below is part of the Phase 2 launch and operations proposal, shown here to give a complete picture of the bridge’s intended path to self-sustainability.

The 24 months following public mainnet launch are structured in two phases: Bootstrap (Year 1) and Growth (Year 2), followed by a Year 3 self-sustainability transition, where Bifrost moves from Treasury-subsidised to fee-self-sustaining operation.

#### Bootstrap (Year 1: Q3 2027 - Q2 2028)

Goal: Reach minimum viable adoption thresholds. The bridge operates reliably under real conditions. First wave of dApp integrations is live. Initial SPO and Bitcoin-holder bases are established.

Activity mix:
- SPO onboarding program runs at peak rate
- First dApp integrations go live; atomic swaps fast lane activation
- Marketing concentrated on early-adopter audiences and BTC community channels
- Fees prioritise user acquisition (low or zero peg-in to maximise inflow)
- All fee revenue accumulates into the operational reserve

#### Growth (Year 2: Q3 2028 - Q2 2029)

Goal: Scale TVL and transaction volume beyond the Bootstrap baseline. Validate that Mode 2 distribution (embedded dApp integrations) is delivering BTC liquidity through partner products at scale. Build operational reserve toward the Year 3 self-sustainability target.

Activity mix:
- SPO program transitions to sustain rate (participation threshold met)
- Deeper integrations with onboarded dApp partners
- Marketing shifts to embedded use cases; outreach expands to institutional channels
- Fee structure begins to ramp; fee revenue contributes meaningfully to reserve

#### Self-sustainability transition (Year 3: Q3 2029 - onwards)

Treasury subsidy ends at the close of Growth. Year 3 is the projected period during which Bifrost operates on fee revenue alone, with the operational reserve  accumulated during Bootstrap and Growth serving as buffer. 
  
Projections (Year 3+):

- Bridge fee revenue covers operational baseline under Base case adoption
- Operational reserve consolidates toward target
- Cardano Treasury outflows in fBTC begin during Year 3 or early Year 4 once reserves reach target

If adoption tracks below Base case for two consecutive quarters, stewardship governance triggers a course-correction review.

#### Adoption targets (projections)

These are provisional planning targets, hardened in Phase 1 and finalised in Phase 2. 

**TVL (projection)**

| Case | Description | Month 6 (mid-Bootstrap) | Month 12 (end of Bootstrap) | Month 24 (end of Growth) |
|---|---|---:|---:|---:|
| Bear | Slow uptake: limited dApp integration, weak BTC-holder demand | 50 BTC | 200 BTC | 500 BTC |
| **Base** | the Phase-1 partnership pipeline converts; steady, sustained adoption| **100 BTC** | **500 BTC** | **1,200 BTC** |
| Bull | Strong demand with several major dApp integrations driving inflow |200 BTC | 1,000 BTC | 3,000 BTC |

**Adoption KPI (projection)**

| KPI | Month 6 (mid-Bootstrap) | Month 12 (end of Bootstrap) | Month 24 (end of Growth) |
|---|:---:|:---:|:---:|
| **Active SPOs participating** | 400 | 450 | 500 |
| **dApp integrations with fBTC** | 3 | 10 | 20 |
| **Cardano wallets holding fBTC** | 500 | 1,500 | 3,000 |
| **fBTC transactions (monthly)** | 5,000 | 15,000 | 50,000 |
| **Peg-ins via dApps integration** | 5% | 15% | 30% |

---

### Revenue Model & Sustainability

The model below describes the intended Phase 2 operating economics. Phase 1 funds the work needed to harden this model against real mainnet data, finalize governance parameters, and prepare it for launch.

It sets out the bridge’s economic design at a high level: what it costs to run, how it earns, and how revenue is distributed.

Bifrost is designed to become self-sustaining beyond the Treasury-subsidized buildout: bridge fees cover operations as adoption grows, and surplus eventually returns value to the Cardano Treasury. The model is conservative, peer-aligned, and governance-tunable.

#### Cost structure: what the bridge needs to run

Operational costs split into three layers:

- **Mechanism**: chain-level operations, such as Bitcoin transaction fees, Cardano transaction fees, watchtower block submission rewards, SPO coordination rewards. Continuous, predictable, tied to bridge protocol parameters.
- **Maintenance**: operations team, infrastructure, incident response, bug-fixing, user support. 
- **Governance**: stewardship overhead, board operation, legal administration, independent audits, public reporting.

#### Fee structure: how the bridge earns

Bifrost charges fees in four contexts, all denominated in **fBTC** (never ADA, users pay in the asset they hold):

- **Peg-in fee**: initially low or zero during the Treasury-subsidised buildout (acquisition-led pricing); ramps to peer-comparable rates as the bridge approaches self-sustainability
- **Peg-out fee**: Bifrost adopts the industry-converged asymmetric two-sided model, peg-out at higher rate than peg-in
- **Atomic-swap fast-lane fee**: a small protocol premium fee on user-initiated fast-lane swaps
- **Sponsored transactions**: dApps integrating via the SDK can sponsor user fees and gas; covered by the dApp, not by the end user

Fee rate schedule is provisional. Specific peg-in and peg-out rates by phase are set by the Stewardship structure and may be adjusted in response to peer competitive landscape, actual operational costs, and adoption pace. 

#### Revenue distribution: where the money flows

Each epoch's fBTC fee revenue flows through a four-level priority waterfall:

1. **Mechanism reserve**: covers chain-level operating costs
2. **Maintenance reserve**: funds operations team and infrastructure
3. **Governance reserve**: funds governance and administration
4. **Surplus**: split between an SPO retainer pool and the Cardano Treasury (indicative default 35% / 65%, both in fBTC)

**Reserves**:
- Indicative reserve target: 12 months of mandatory operations + 1 SPO retainer pool cycle. 
- Governance adjusts this target annually based on observed operational variance.
- If reserves fall below a 6-month safety floor, surplus distribution pauses until reserves recover.

The exact target is set during Phase 1 hardening.

**Why proportional surplus split?**

- **SPOs are aligned with bridge success.** No cap on per-SPO income. As bridge volume grows, SPO pool grows.
- **Treasury outflows also scale.** No fixed cap. As bridge succeeds, Cardano Treasury outflow grows.
- **Both share BTC appreciation.** All denominated in fBTC; USD value grows as BTC appreciates.

Note: The 35% / 65% surplus split is provisional and adjustable by governance within bounds.

---

### Detailed Budget

**Total Treasury ask**: ₳12,332,031 (approximately \$1,973,125 at 0.16 USD/ADA reference rate), including a 10% refundable contingency reserved to protect delivery.

This proposal (Phase 1) funds nine months of milestone-based delivery (M1–M3, Q3 2026 – Q1 2027):

- Bridge hardening, external security audits, and formal verification
- Ecosystem readiness and partnership development
- Stewardship-structure and economic-model hardening, the foundations the Phase 2 launch builds on

It does not fund the public launch or operations; those are deferred to the Phase 2 proposal (Q1 2027).

Funding is requested in ADA; USD figures are provided as a reference. Unspent contingency is returned to the Cardano Treasury at the end of the term.

**Pricing principles**
- Funding requested in ADA at a conservative \$0.16/ADA reference rate
- Engineering and product capacity priced at \$210,000 per FTE-year (\$100/hour blended rate for senior DLT engineers and product leadership)
- 10% refundable contingency included to protect delivery against technical uncertainty, audit findings, integration risk; unspent contingency returns to the Treasury
- A portion of the requested ADA will be hedged into stable assets shortly after disbursement to protect the delivery and security audits budget against adverse price movement. 

#### Budget by workstream (detail)

| Workstream | FTE-months | Fixed, USD | Total, USD | Total, ADA | % |
|---|---:|---:|---:|---:|---:|
| Core development  | 36 | — | \$630,000 | ₳3,937,500 | 35.1% |
| Security & Quality Assurance | 1.5 | \$550,000 | \$576,250 | ₳3,601,563 | 32.1% |
| Product management | 9 | — | \$157,500 | ₳984,375 | 8.8% |
| Ecosystem readiness & partnerships | 3 | \$125,000 | \$177,500 | ₳1,109,375 | 9.9% |
| Legal, stewardship & economy | 3 | \$200,000 | \$252,500 | ₳1,578,125 | 14.1% |
| **Subtotal** | **52.5** | **\$875,000** | **\$1,793,750** | **₳11,210,938** | **100%** |
| Refundable contingency | — | — | \$179,375 | ₳1,121,094 | — |
| **Total**| **52.5** | | **\$1,973,125** | **₳12,332,031** | — |

Detailed scope and workstreams are described in Annex 1.

---

### Ownership & stewardship

Bifrost is built and operated as public infrastructure. This section describes how the bridge will be owned and governed for the long term and what Phase 1 commits to put in place.

#### Long-term stewardship

Bifrost will be owned and operated by an independent stewardship structure (a dedicated foundation or an equivalent independent legal form), established to hold the bridge from public launch onward and to outlast both the founding teams and the term of this proposal.

The stewardship structure will:
- hold legal ownership of the bridge 
- manage operational treasury (reserves, fee revenue, operations team contracts)
- govern fee parameters and distribution within bounded ranges
- contract vendors and service providers as needed
- report quarterly to the Cardano community

**Phase 1 commitment**

Determining and standing up this structure is a Phase 1 deliverable (M3).  We will engage established ecosystem bodies (such as the Cardano Foundation and Intersect) to identify the stewardship form best suited to a non-custodial bridge and to ensure its long-term success.

Within this proposal's term, we will:
- Evaluate and select the structure's form and jurisdiction, for regulatory clarity on non-custodial bridge operation
- Stand up the legal entity and publish its governance charter
- Complete this before the Phase 2 Launch & Operations proposal

The structure takes ownership of the bridge at public launch (Phase 2). Until then, the bridge runs under controlled, private access and the vendors remain the delivery counterparty (see Administration).

#### The vendors and their role

FluidTokens and Lantr Engineering are the joint vendors who build Bifrost through Phase 1 and the delivery counterparty for this grant. Their role is deliberately limited to delivery, they do not own the bridge, hold custody, or control its treasury. At public launch (Phase 2), ownership passes to the stewardship structure, and the vendors continue under its contract as technical service providers for operations and maintenance.

#### Governance of the bridge (intended model)

Defining the bridge's long-term governance is part of standing up the stewardship structure. Our aim is a model that keeps Bifrost accountable to the Cardano community and prevents unilateral control by any single party, including the founding teams.

We intend governance to operate across two independent layers: a stewardship body responsible for organisational and operational decisions, with material, structural changes subject to Cardano's on-chain governance. 

The detailed model is published alongside the structure's charter and the hardened economic model, before the Phase 2 proposal.

---

### Administration

The previous section described stewardship of the **bridge**. This section describes administration of **this grant**: how Treasury funds are held, released against milestones, overseen, and returned. The two are deliberately separate: the entity that will own and operate the bridge (the future stewardship structure) is *not* the entity that controls disbursement of these funds. Grant administration rests with the two vendors and an independent oversight board, keeping funding control independent of the asset being funded.

**Smart Contract Escrow**

Funds are held and released through the SundaeSwap treasury-contracts framework (https://github.com/SundaeSwap-finance/treasury-contracts), a proven escrow system with two validators:

- treasury.ak — holds all ADA withdrawn from the Cardano Treasury. Everything is locked here when the governance action enacts.
- vendor.ak — manages milestone-based vesting: payment schedule, payout dates, release conditions.

Both contracts have been independently audited (TxPipe, MLabs) and are in production use on mainnet.

**FluidTokens & Lantr Engineering are Two Vendors**

FluidTokens & Lantr Engineering are the two vendors. All Phase 1 delivery comes from them.

The long-term stewardship structure is determined and stood up during Phase 1 (an M3 deliverable; see Ownership & Stewardship), but takes ownership of the bridge only at public launch in Phase 2. 

Throughout Phase 1 the vendors remain the delivery counterparty; grant administration does not depend on the stewardship structure being operational.

**Independent Oversight Board**

An independent, multi-party board provides third-party governance. Board members have no stake in Lantr Engineering / FluidTokens. They co-sign disbursements, review milestones, and can halt funding if delivery falters.

| Member | Organisations | Projects |
|--------------|--------|----------|
| Chris Gianelloni | Blink Labs | Dingo, Adder, Bursa | 
| Matthias Benkort | Cardano Foundation | Amaru, Aiken, Ogmios, Konduit |
| Riley Kilgore | IOG | Aiken, Blaster integration |

*(This board is distinct from the future stewardship board: the oversight board governs **this grant** and exists for its term; the stewardship board governs the **bridge** and is established for the long term.)* 

**Independent Technical Assurer**

Periodic third-party audits are performed by No.Witness Labs. Quarterly technical reviews are published to the Cardano community. No.Witness Labs holds no stake in Lantr Engineering / FluidTokens and is remunerated with funds explicitly allocated in this proposal for that purpose.

**Independent Financial Audit**

An external financial auditor will review Phase 1 treasury management and fund use, with a report published at the close in Q2 2027. The auditor holds no stake in FluidTokens / Lantr Engineering and is remunerated from funds allocated in this proposal.

**Permission Scheme**

Actions on the escrow contract require the following signatures:
| Action | Signatures required |
|------|-----------------------|
| Disburse| Lantr + FluidTokens + any 1 board member |
| Sweep early (return unused funds)| Lantr + FluidTokens + any 1 board member |
| Reorganise | Lantr + FluidTokens only |
| Fund (initial vendor setup) | Lantr + FluidTokens + board majority |
| Pause milestone | Any 1 board member         |
| Resume milestone | Board majority |
| Modify project | Lantr + FluidTokens + board majority |

**Delegation Policy**

The treasury contract enforces auto-abstain DRep delegation and no SPO delegation for all funds in escrow. Treasury funds do not influence governance votes or staking rewards during execution.

**Failsafe Sweep**

Funds remaining in the contract after expiration sweep back to the Cardano Treasury automatically. Enforced at the contract level; cannot be overridden.

**Prior Treasury Funding Disclosure**

In accordance with Article II — Section 7.2 of the Constitution, Lantr Engineering discloses prior Treasury withdrawals. We also disclose earlier Project Catalyst support for Bifrost to provide a complete picture of prior Cardano community funding.

| Team | Workstream | Allocation | Received | Reference |
|------|------|------------|----------|-----------|
| Lantr Engineering | 2025 Treasury Budget: Scalus DApps Development Platform  | ₳657,692  | 100% | Governance Action ID: 8ad3d454f3496a35cb0d07b0fd32f687f66338b7d60e787fc0a22939e5d8833e#17 |
| FluidTokens, Lantr Engineering | Catalyst F14: Bifrost: Bitcoin-Cardano bridge secured by Cardano SPOs  | ₳739,000  | 33% | Project ID: 1400012 |

---

### Reporting

**Milestone reports**. Each milestone, we will publish a full delivery report covering milestone progress, adoption progress, risks and mitigations, measurable outcomes, and next steps. These reports will be shared alongside disbursement requests to the oversight board and published in the proposal repository (https://github.com/lantr-io/bifrost-treasury-proposal-2026).

**Public transaction journal**. Every on-chain transaction (disbursements, claims, sweeps, reorganisations) is recorded in a public journal (https://github.com/lantr-io/bifrost-treasury-proposal-2026/tree/main/journal): transaction hash, action type, amount, signers, justification, on-chain metadata hash. This follows the SundaeSwap metadata standard and can be independently verified on-chain.

**Community engagement**. Monthly updates at Cardano Forum, Bifrost/Lantr/FluidTokens X channels, Discord announcement channels.

---

### Risks & mitigations 

Bifrost's design is driven by one principle: user assets must remain safe on both sides of the bridge — under adversarial conditions and operational failure alike. For each risk, we state not only the mitigation but the **residual exposure** that remains after it, including where that exposure is material. 

| Risk | Likelihood | Impact | Mitigation | Residual risk |
|---|---|---|---|---|
| **Delivery slip / critical audit finding**: hardening or audit remediation delays launch | Medium | Medium | External audits and remediation start as early as M1, progressively reducing the risk. Audits are an explicit M2 deliverable *before* any mainnet exposure. M2/M3 schedules absorb audit-driven rework (backed by 10% refundable contingency), and the staged private→public rollout limits the cost of a late-discovered issue. | **Low–moderate.** Private mainnet release schedule may happen later at M3; milestone gating and the refund clause protect Treasury funds against non-delivery. |
| **Smart-contract or cryptographic exploit**: a flaw in contracts or crypto primitives is exploited | Low | Critical | Full external audits (protocol contracts, cryptographic protocol, off-chain components) and formal verification of the critical paths. FROST and Taproot are well-studied primitives with reference implementations. A bug bounty runs from private mainnet, and a staged rollout with a TVL cap bounds exposure during the highest-risk early window. A successful exploit would need to defeat both the audit and the formal verification of the critical paths. | **Low.** Non-zero, as with any contract system; bounded early by the TVL cap and continuously by the bug bounty. |
| **Custody during private mainnet**: real BTC locked on mainnet while the custody model is validated | Low | High | M3 deploys to Cardano mainnet and demonstrates both custody modes (federated fallback and full SPO threshold signing) with real BTC, under controlled, private access that bounds exposure. Both modes are independently audited and proven end-to-end before any public launch. Phase 2 adds public access and SPO scale, not a first trial of the custody model. | **Bounded.** The decentralised custody model is exercised on mainnet under limited exposure; what Phase 2 changes is reach and scale, not whether the model works. |

---

### Conclusion

Bitcoin holds the largest pool of idle capital in crypto, and the ecosystem that earns its trust will shape the next phase of on-chain finance. Cardano is structurally suited to compete for that role: a UTxO foundation aligned with Bitcoin, native assets, predictable fees, and a security-oriented architecture backed by a broad SPO ecosystem. What it has lacked is the one thing that turns suitability into adoption: a BTC access path holders are willing to use.

Bifrost is that path. It secures custody through Cardano's own SPO set rather than a custodian or a narrow external committee, and brings BTC onto Cardano as a native asset that can be used across the DeFi ecosystem.

This is not a concept. The bridge is live on testnet today, with active users and participating SPOs, and is already delivering against an active Catalyst grant. Catalyst funded the architecture and the testnet. This proposal funds the next stage: mainnet hardening, external audits, formal verification, and deployment to an audited private mainnet running under controlled access. The public launch and operations follow in Phase 2.

What the Treasury funds is public infrastructure, not a private protocol. There is no bridge token and no founder allocation; value flows to Bitcoin holders, SPOs, and the Cardano ecosystem. Funding is milestone-gated, independently overseen, and refundable. The long-term economic model, detailed in the Phase 2 proposal, is designed to turn the Treasury's role from initial funder into long-term beneficiary through fee-backed ecosystem returns.

We are asking the Cardano community to fund the road to a secure, audited Bitcoin bridge running on mainnet: the foundation for infrastructure that, once operating, lets Cardano compete for Bitcoin liquidity and pays the ecosystem back.

---

### Constitutionality Checklist

**Article II - Section 3.1: use of smart contracts**

- [x] We leverage multiple (open source and audited) smart contracts as detailed in the Administration section to administer the requested budget.

**Article II - Section 6.1: format**

- [x] We have submitted this proposal in a standardised, legible format, which includes a URL and hash of all documented off-chain content. Moreover, the proposal metadata and appendix documents are hosted on immutable storage and content-addressed.

**Article II - Section 6.2: relevance**

- [x] We believe our rationale is detailed and sufficient. The proposal contains a title, abstract, reason for the proposal and relevant supporting materials.

**Article II - Section 7.1: terms of withdrawal**

This proposal includes:

- [x] **a clear withdrawal purpose**: funding hardening, security audits and launch preparation of Bifrost bridge for the 9 months period;
- [x] **a period for delivery of proposed activities which the withdrawal shall be used for**: July 2026 - March 2027, with a milestone breakdown and detailed scope provided;
- [x] **relevant costs and expenses of the proposed activities**: clear separation between fixed costs and variable costs, modelled as FTE (Full-Time Equivalent).
- [x] **circumstances under which the withdrawal might be refunded to the Cardano Treasury**

**Article II - Section 7.2: past withdrawal(s) disclosure**

- [x] We have disclosed that this is Lantr Engineering second withdrawal in the last 24 months. The previous was submitted in July 2025, and enacted in August 2025.

**Article II - Section 7.3: net-change limit**

- [x] This proposal follows a recently established net-change limit. At the moment of submission, this proposal is well within its boundaries.

**Article II - Section 7.4: periodic audits**

This proposal makes provisions for:

- [x] periodic independent audits are explicitly detailed in the Budget & Administration section; 
- [x] quarterly reports submitted as a part of the milestone disbursements.

**Article II - Section 7.5: administration**

- [x] This proposal specifies an administrator in accordance with this provision. 

**Article II - Section 7.6: treasury oversight**

- [x] This proposal withdraws funds in a separate script account which each provides a public oversight of all operations, and ensures that funds cannot be delegated to an SPO and can only be delegated to the always-abstain drep. In addition to the on-chain guarantees provided by the smart contracts, we also commit to an off-chain financial journaling.

**Guardrails**

- [x] In accordance with the guardrail TREASURY-02a, this withdrawal does not exceed the NCL at the moment of submission.
- [x] In accordance with the guardrail TREASURY-03a, this proposal is ultimately denominated in ada.
- [x] TREASURY-04a — We acknowledge this action requires greater than 50% of DRep active voting stake to be ratified.

## Annexes

### Annex 1: Detailed scope and workstreams 

#### Core development (35.1%, 36 FTE/mo)

Path from the Catalyst-funded testnet to an audited mainnet bridge across the stack:

- Bifrost protocol & smart contracts (Cardano contracts, Bitcoin Taproot scripting)
- Atomic swaps router and LP management
- Treasury, operations & fees management (layered fee logic)
- Watchtowers (trustless Bitcoin oracle, fork management)
- SPO coordination & key management (DKG ceremony, peg-in/peg-out auth, federation fallback)
- Front-end, SDK, and whitelabel portal
- Transparency portal (real-time monitoring, proof of reserves, KPI analytics)
- Monitoring & observability infrastructure
- Documentation, extensive testing coverage (property-based, fuzz, integration, edge cases)

#### Security & Quality Assurance (32.1%, 1.5 FTE/mo + fixed 550k USD)

External audits and security validation across the protocol surface:
- Architecture review & threat model
- Formal verification of critical paths
- Protocol smart contract audits
- Cryptographic protocol audits: Bitcoin Tapscript, FROST/Schnorr, DKG ceremony
- Off-chain components audits: watchtowers, SPO coordination, frontend, SDK
- Penetration testing across infrastructure and protocol layers
- Bug bounty program

#### Product management (8.8%, 9 FTE/mo)

Product lifecycle management, milestone execution, partner and user coordination, and delivery oversight across the proposal.

#### Ecosystem readiness & partnerships (9.9%, 6 FTE/mo + fixed 125k USD)

Builds the conditions and partner pipeline for a successful public launch in Phase 2:

  - SPO onboarding — phased onboarding and community management (incentivisation at scale is Phase 2)
  - dApp integration support — hands-on support for teams integrating Bifrost and fBTC
  - Educational content & awareness — explainer content, technical education, channel presence
  - Conferences & partner recruitment — Bitcoin Amsterdam, PlanB, Cardano Summit, and similar
  - BTC holder & institutional partnership development — family-office and institutional outreach, Bitcoin podcast circuit

#### Legal, stewardship & economy (14.1%, 6 FTE/mo + fixed 200k USD)

- Economic model hardening — finalise fee, distribution, reserve, and SPO-incentive parameters against real mainnet operating data
- Stewardship structure determination & setup — evaluate and stand up the long-term structure (foundation or equivalent independent form); governance charter
- Regulatory & compliance advisory — bridge regulatory exposure review, supporting the stewardship determination
- Administration & third-party audits — grant administration, technical assurance, financial audit

---

### Annex 2: Competitive landscape

There are three meaningful ways to secure a Bitcoin bridge today. The trade-offs between them explain the design choices behind Bifrost.

#### Multisig

The simplest model. A fixed set of signers each sign the spending transaction on-chain, and anyone can verify those signatures.

The limitation is cost. Every signer adds weight and therefore fee to the Bitcoin transaction. A 5-of-7 multisig carries five signatures; a hundred-signer set would be prohibitively expensive to spend.

This is why most multisig bridges keep their signer set small, typically 5 to 21 — which reintroduces exactly the trust concentration a bridge should avoid.

Multisig is transparent, but it cannot scale to a large decentralised validator set without becoming economically unviable.

#### Threshold ECDSA (tBTC)

tBTC, the most established decentralised Bitcoin bridge, is the closest peer to Bifrost's approach: it also distributes custody across a signer set rather than a single custodian, using a **threshold ECDSA** scheme. For each deposit, a randomly selected group of operators (51-of-100) jointly generates a key and co-signs releases, with no operator holding the full key.

The difference is the signature scheme. Threshold ECDSA predates Taproot, and ECDSA is not natively friendly to threshold signing — it requires heavier multi-party computation to produce each signature, and the result is a standard ECDSA spend rather than a Taproot one. FROST, by contrast, produces a single Schnorr signature that settles as an ordinary Taproot spend: cheaper on-chain, simpler to coordinate, and indistinguishable from a single-key transaction.

The two share a security philosophy: distributed, threshold-based custody with no central party, but Bifrost's Schnorr/Taproot foundation is more efficient on Bitcoin, and its stake-weighted set ties custody directly to Cardano's own consensus rather than to a separately-bootstrapped operator pool.

#### FROST (Flexible Round-Optimized Schnorr Threshold)

FROST is the mechanism Bifrost uses. It is a threshold signature scheme that outputs a single Schnorr signature, no matter how many participants contributed to it. On Bitcoin, a FROST-signed Taproot spend is indistinguishable from an ordinary single-key spend: small, cheap, and revealing nothing about the signing structure behind it.

All coordination happens off-chain. Signers run several communication rounds to jointly compute the signature, and no individual ever holds the full private key. Once the threshold is met, one compact signature is broadcast to Bitcoin.

The trade-off is that off-chain coordination: signers must be online and reachable during the signing rounds, and if that layer stalls, signing stalls with it. Bifrost mitigates this two ways — the SPO network already runs persistent infrastructure, and the federated fallback mode activates if coordination fails.

Because on-chain cost does not grow with the number of signers, FROST scales to hundreds of participants. That is precisely what makes Bifrost's SPO-weighted custody model feasible.

#### BitVM (Citrea)

BitVM takes a different approach. Citrea, the first ZK-rollup on Bitcoin, uses a BitVM-based bridge. Instead of having signers cooperate on every transaction, BitVM is optimistic: in the happy case, funds unlock with no on-chain proof. If someone attempts an invalid withdrawal, a challenge-response protocol plays out on Bitcoin and the fraud is provably punished.

Its security model is 1-of-N: the bridge holds as long as a single honest operator exists and is willing to challenge. In adversarial conditions this is actually stronger than a threshold model — even if every other operator is compromised, one honest party can block the fraud.

The trade-off is complexity and capital. Operators must pre-sign large numbers of challenge transactions and lock bonded capital during challenge windows, and the verification circuits are computationally heavy. BitVM is an important innovation, but it is at an earlier stage of production maturity than threshold signing.

#### Comparison

| Property | Multisig | FROST (Bifrost) | Threshold ECDSA (tBTC) | BitVM (Citrea) |
|----------|----------|-----------------|------------------------|----------------|
| On-chain cost per transaction | High (scales with signer count) | Low (single Schnorr signature) | Moderate (single ECDSA signature) | Low (optimistic; no proof in happy case) |
| Off-chain coordination required | No | Yes (multi-round signing) | Yes (heavier MPC per signature) | Yes (pre-signing + relayer infrastructure) |
| Security model | k-of-n signers | Stake-weighted threshold | k-of-n threshold (51-of-100 per deposit) | 1-of-N honest operator |
| Signer set size | Small (typically 5–21) | Large (hundreds of SPOs) | Medium (100-operator groups) | Small to medium operator set |
| Operator basis | Fixed committee | Cardano SPOs (stake-weighted) | Bonded staking operators | Bonded operators |
| Implementation maturity | Fully mature | Mature cryptography, novel application to SPOs | Production since 2023 | Emerging; earliest deployments 2024–2025 |
| Bitcoin transaction visibility | All signatures visible on-chain | Standard Taproot spend; no structure exposed | Standard ECDSA spend | Taproot with optional challenge path |
| User BTC recovery if bridge fails | Depends on signers being reachable | Timeout reclaim path in Bitcoin script | Depends on signer group liveness | Timeout reclaim path in Bitcoin script |

Bifrost's choice of FROST comes down to one priority: making decentralised custody economically viable at the scale of Cardano's SPO network. Threshold schemes like tBTC's prove the model works in production; FROST advances it: a 400-SPO signing set costs the same on Bitcoin as a single-key transaction, and custody is anchored to Cardano's SPOs set. That combination of on-chain efficiency and stake-weighted decentralisation is what makes the security model work.

## Supporting links

- FluidTokens: https://fluidtokens.com/ 
- Lantr Engineering: https://lantr.io/ 
- Bifrost Github: https://github.com/FluidTokens/ft-bifrost-bridge/
- Bifrost Whitepaper: https://github.com/FluidTokens/ft-bifrost-bridge/blob/main/documentation/whitepaperV1.pdf 
- Bifrost Testnet: https://bifrost.fluidtokens.com/ 
- Scalus development platform: https://scalus.org/
- Proposal repository: https://github.com/lantr-io/bifrost-treasury-proposal-2026
- Treasury-contracts framework - Sundae Swap: https://github.com/SundaeSwap-finance/treasury-contracts