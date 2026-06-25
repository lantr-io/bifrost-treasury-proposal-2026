# Scalus 2026: Maintenance, Dijkstra Readiness & Application Runtime

## Abstract

Scalus is an established, open-source Cardano development platform, built by **Lantr Engineering** over three years of continuous delivery. 

It is the integrated, JVM-native toolset for the complex protocols and mission-critical applications, such as **Gummiworm L2, Bifrost bridge, SugarRush DEX, Vela stablecoin, DID / DIDComm decentralised identity**, that already build on it.

Its components are already reused inside Cardano's most widely used developer tooling: **MeshJS, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit**. Many teams depend on Scalus without ever integrating it directly.

This proposal funds a focused, 9-month continuation across three lines of work: 
- **protect** the existing infrastructure through the upcoming **Dijkstra hard fork** (maintenance and readiness)
- **deepen** its reuse across the JVM and JavaScript ecosystems (interoperability)
- and take a first **scoped step** into the application runtime that operates the protocols already built with Scalus.

It is a deliberately reduced resubmission. DReps recognised the previous Scalus proposal's vision, technical quality, and delivery record, but found its scope and budget too large. This version answers that directly: the ask is cut to **₳2,991,667** over 9 months, at a conservative **\$0.15/ADA** reference rate and **no contingency**.

Delivery is milestone-based, administered through audited SundaeSwap treasury contracts with an independent oversight board and third-party assurance.

The goal is bounded and concrete: protect prior public investment, keep Scalus and everything built on it working through the next protocol cycle, and make it more reusable across the ecosystem. It's a proportionate continuation of proven work.

**At a glance**
  - **Ask:** ₳2,991,667 (~\$448,750 at \$0.15/ADA) · 9 months · no contingency
  - **Funds:** maintenance · Dijkstra hard-fork readiness · interoperability (JVM + JS/TS) · a scoped application runtime
  - **Excludes:** standalone L1 node · full L2 integration · broad formal verification
  - **Vs. previous proposal:** reduced from ₳8.5M / 12 months; node and 3d party dependencies removed
  - **Team:** Lantr Engineering, three years building Scalus, every prior milestone delivered on time
  - **Governance:** SundaeSwap escrow · independent oversight board · third-party assurance

<!-- Scalus is an established open-source Cardano smart contract and dApp development platform built by Lantr Engineering, with 3 years of continuous delivery, adoption (Gummiworm L2, Bifrost bridge, SugarRush DEX, and others), and ecosystem integrations (MeshJS SDK, Evolution SDK, Cardano Client Lib, Lucid Evolution, YaciDevKit).

This is a reduced resubmission following the previous Scalus Treasury proposal. The earlier proposal was not approved, and DRep feedback was clear: the Scalus vision and team were recognised, but the requested scope and budget were too large relative to demonstrated demand and current Treasury capacity. 

This proposal responds by reducing the ask, removing production L1 node hardening, removing L2 and formal verification dependencies from the critical path, and focusing on immediate maintenance needs and adoption support.

Lantr Engineering requests ₳X,XXX for a 9-month delivery period to fund the next incremental public-good step for Scalus: maintenance of existing infrastructure, Dijkstra hard fork readiness, interoperability with existing Cardano and JVM tooling, and a scoped application runtime MVP.

The goal is to protect prior ecosystem investment, prepare Scalus users and integrations for the next Cardano hard fork, improve reuse across existing Cardano tooling, and validate the first application runtime step before any larger platform expansion is considered. -->

## Motivation

### The Application Layer Decides the Next Chapter

Cardano has made major progress at the protocol layer. The next bottleneck is application delivery: how fast serious teams can build, test, launch, and operate non-trivial applications.

Cardano 2030 outcomes (TVL, monthly transactions, and active users) are downstream of applications people and businesses actually use. Protocol upgrades, liquidity programmes, critical integrations, and VC capital only compound if teams can turn them into working products.

That is why developer infrastructure still matters. Not as an abstract tooling category, but as the path from protocol capability to real applications.

The application layer is not built from nothing. It rests on infrastructure that has to exist, keep working, and reach the teams who need it, and that is exactly where Scalus sits. This proposal strengthens that foundation and takes the first step beyond it.

---

### What Scalus is today

Scalus is an established development platform, purpose-built for the protocols and mission-critical applications Cardano can't afford to get wrong: Layer 2 solutions, cross-chain bridges, DEXs, and other DeFi products where correctness, performance, and control are non-negotiable.

For these systems, the smart contract is rarely the hardest part. The hardest part is everything around it: modelling state, building and testing transactions, simulating edge cases, optimising for cost and getting all of it right before it ever reaches production.

Scalus brings that entire journey into one coherent JVM stack: a type-safe smart contract language, transaction building, enterprise-grade testing, advanced optimisations, an in-memory Cardano node emulator and local devnet, a library of advanced data structures, design patterns and blueprints. Scalus covers the protocol development layer: write, evaluate, optimise, test, and deploy in one integrated workflow.

---

### Traction

Scalus has three years of continuous delivery behind it and is in active use across the Cardano ecosystem — both in the systems built directly on it and in the tooling that reuses its components.

**Protocols & applications built on Scalus:**

- **Gummiworm L2**: state-channel & custody settlement L2
- **Bifrost**: Bitcoin-Cardano bridge
- **SugarRush**: central limit orderbook DEX (on Gummiworm L2)
- **Vela**: decentralised synthetic stablecoin
- **DID / DIDComm**: decentralised identity & messaging protocol (JVM/JS)

These are exactly the complex, high-stakes systems Scalus is built for.

**Reused across the Cardano ecosystem** 

Scalus's script evaluation, cost calculation, and in-memory L1 emulator are embedded in tooling other teams already use:

- JVM: **Cardano Client Lib**, **YaciDevKit**
- JS/TS: **MeshJS SDK**, **Evolution SDK**, **Lucid Evolution**

Through these, many Cardano projects <!-- (Midgard, DeltaDeFi, Vespr, Strike, Indigo, and others)--> rely on Scalus components without ever integrating Scalus directly, as they come built into the tools these teams use every day.

**Sustained Open Source delivery and reach**

Three years of continuous development: 4,595 commits across 32 releases, 12 contributors.

On JS/TS alone, Scalus components reach 20,000+ downloads a month through the SDKs that embed them.

---

### The next step: protect, deepen, expand

This proposal is that next step: focused and disciplined. It builds on the foundation Scalus already is, in three moves: protecting it through the next hard fork, deepening its reach across the stacks teams already run, and taking the first step beyond it, into the application layer itself.

#### Protect

Scalus is already-funded public infrastructure, used directly by protocols and indirectly through developer tooling. Keeping it maintained, compatible, and safe to build on protects every team and tool that depends on it. 

Dijkstra hard-fork introduces new capabilities and updates that include Plutus V4 support, nested transactions, guard script types, accounts. Those changes affect smart contract development, Plutus evaluation, transaction building, ledger rules, testing, and developer workflows. 

Maintenance and Dijkstra readiness keep Scalus, and the tools and projects built on it, working through the hard-fork transition.

#### Deepen

Scalus is JVM-native, and its components already reach JavaScript and TypeScript ecosystem. This proposal makes them easier to reuse across the stacks teams already run.

- **JS / TS integrations**: improve the interfaces, capabilities, and documentation of the Scalus components already embedded in MeshJS, Evolution SDK, and Lucid Evolution, so the teams depending on them transitively get more capability and reliably.
- **JVM interoperability**: advance direct interoperability with Java and Kotlin (Spring Boot, Ktor) and provide cleaner integration paths with the Cardano Java stack.
- **Multiplatform**: one codebase compiled to multiple targets (JVM, JavaScript, native, and WebAssembly), so the same components serve more environments without reimplementation.

#### Expand

Today, Scalus covers development flow: writing, testing, and deploying a protocol. The application runtime is the first step into operating it: running the live system around the contract, from one integrated stack.

This scoped step gives applications a way to consume chain data streams, schedule time-based actions, react to on-chain events and state changes, and coordinate backend workflows.

It is a minimal but useful increment, built and validated with teams already working on Scalus, so the work stays pulled by real demand rather than built ahead of it.

---

### What this secures for Cardano

Scalus brings Cardano into the JVM ecosystem with a production-grade development platform for mission-critical applications, while reusing the same core components across JavaScript and TypeScript tooling.

That matters because many of the systems Cardano wants to attract (financial applications, protocol backends, bridges, L2 infrastructure, identity systems, enterprise integrations) are built by teams that need strong typing, mature backend tooling, rigorous testing, and operational control. The JVM ecosystem is one of the strongest environments for exactly that kind of software. 

These are not hypothetical systems — they are the ones already building on Scalus today: Gummiworm (L2), Bifrost (bridge), SugarRush &  Vela (financial).

This proposal funds the next disciplined step: keeping that foundation maintained, current, and reusable for the team already depending on it, and and taking the first step beyond it, into the application layer.

---

## Rationale

### What changed since the previous proposal

This is a focused resubmission of “Scalus: Cardano’s Application Platform.” In the previous vote, Scalus’s vision, technical quality, and delivery record were widely recognised. At the same time, the scope and budget were considered too large relative to demonstrated demand and current Treasury capacity.

This proposal responds directly to that feedback with a smaller ask, a narrower focus on existing adoption, and a scoped next step for the application layer. The most contested elements have been removed from the funded scope.

**Changes summary**

| Area | Previous proposal | This proposal |
|---|---|---|
| Budget / duration | ₳8,503,000 / 12 months | ~₳2,991,667 / 9 months |
| Reference rate | \$0.25/ADA| \$0.15/ADA |
| FTE | 8  | 2.5  |
| FTE-months | 99 | 22.5 |
| Contingency | 10% | 0% | 
| Focus | Full application platform expansion: L1 node, L2 integration, application runtime, advanced devnet | Maintenance, Dijkstra readiness, interoperability, adoption, and a scoped runtime step | 
| Application runtime | Production-grade runtime | Scoped runtime step, ready for adoption |
| Standalone L1 node | Hardened standalone & embedded L1 node for production operation | Removed from scope |
| L2 solution integration | Gummiworm operator setup and full integration | Removed from scope; runtime designed to support future L2 integration |
| Integrated local devnet & R&D |  Advanced devnet capabilities + exploratory R&D | Limited to Dijkstra/emulator needs; broader R&D deferred | 
| Formal verification | Broad formal verification track | Out of scope; future integration may follow as IO’s Lean/Blaster framework matures |

The reductions map directly to the concerns raised by DReps: 
- Scale: substantially reduced ask (65%), with no contingency and a lower \$0.15/ADA reference rate
- Breadth: one focused continuation package, not a full platform expansion
- L1 node: standalone JVM L1 node removed from scope
- Dependency risk: L2 integration and formal verification removed from the critical path.

---

### What makes Scalus different

#### Integrated development platform

Scalus is not only a smart contract language. It is an integrated development platform for complex Cardano protocols and applications.

Scalus is built for the systems where the work does not stop at writing a validator, but extends into transaction construction, testing, simulation, protocol emulation, application backends, and production-oriented workflows.

This is why Scalus matters for Layer 2 systems, bridges, DEXs, synthetic assets, identity protocols, and other applications where correctness depends on the whole system around the contract, not only the contract itself.

#### JVM-native

Scalus is built in Scala for the JVM, the environment that runs much of finance, fintech, and enterprise backend software. This pattern is well established across enterprise blockchain as well:
- Besu (Java): enterprise-grade Ethereum client (~8-10% mainnet usage).
- R3 Corda (Kotlin): regulated financial networks, \$10B+ in on-chain RWA.
- Canton (Scala): institutional digital-asset network adopted by Goldman Sachs, Deutsche Borse, and DTCC.

Scalus gives Cardano a native path into that ecosystem. It complements existing Cardano JVM tooling such as Cardano Client Lib and Yaci by adding a smart contract language, enterprise testing, advanced optimisations, node emulation, and application-development layer, while improving interoperability with Java and Kotlin stacks.

#### Multiplatform reuse

Scalus is JVM-native, but not JVM-only. One of its core strengths is maintaining shared Cardano logic in one codebase and exporting selected components across multiple targets. 

Today, Scalus components such as script evaluation, cost calculation, and the in-memory node emulator are exported to JavaScript and TypeScript, which is how they already reach MeshJS, Lucid Evolution, and Evolution SDK.

This proposal continues that direction: make Scalus components easier to reuse from the environments builders already use. And keeps native and WebAssembly backends as longer-term technical targets.

A more detailed competitive landscape is provided in the reference documents.

---

### Cardano 2030 Alignment

Scalus contributes at the developer and infrastructure layer, under Adoption & Utility. It does not claim direct credit for ecosystem KPIs like TVL, transactions, or MAU, those are downstream outcomes of the protocols & applications built on Scalus, not deliverables of this proposal.

**Cardano 2030 Pillars**

| Pillar | Focus Area | Our contribution |
|--------|------------|------------------|
| Pillar 2: Adoption & Utility | Developer Experience > Open-source incentives | Open-source infrastructure reused across the ecosystem (MeshJS SDK, Lucid Evolution, Yaci Dev Kit, Cardano Client Lib, and Evolution SDK). |
| | Education & migration | Documentation, tutorials, and training materials for Web2 developers and JVM developers moving to Cardano and the UTxO model. |
| |  Compatibility | Interoperates with common Cardano tooling; supports blueprints and on-chain data structures generated by other Cardano languages. |
| Pillar 4: Community & Ecosystem Growth | Talent Acquisition & Retention | Training materials that can align with blockchain education in schools and university curricula. Lantr contributes to this direction through its collaboration with Cardano Foundation and the UZH Blockchain Summer School at the University of Zurich (2025, 2026). |
| | Hands-on Experience | The Lantr team hosts learning sessions at Scalus Club and participates in mentorship programmes, including Google Summer of Code 2025, attracting new developers and providing practical experience in Cardano tooling and real-world problem-solving. | 

---

### Use cases

Scalus serves two kinds of builders on Cardano:

| Use case | What Scalus provides | Examples |
|----------|-------------|----------|
| **Mission-critical applications and protocols** | Rigorous testing and verification, an in-memory emulator, and a reliable application layer to orchestrate the system around the contracts. | Gummiworm L2, Binocular (decentralised Bitcoin oracle), DeFi protocols, market-making and arbitrage bots |
| **New Cardano applications** | A fast path from idea to testnet: scaffolding, starter kits, smart-contract blueprints, the emulator, and a configurable devnet. | Lending protocol, auction, AMM starter kit |

For mission-critical systems, Scalus brings enterprise-grade testing and the application runtime to operate them. For new teams, it shortens the path from idea to a testnet.

This is the practical value of Scalus: one stack that supports the product journey from first prototype to production-grade, scalable systems.

---

### Long-term sustainability through Open Source

Scalus is open-source infrastructure for Cardano (Apache 2 license). The capabilities funded through this proposal are designed to be reused across many teams and products, reducing repeated assembly work and strengthening the ecosystem as a whole.

This is the kind of work the Treasury is well placed to fund: shared application infrastructure that benefits the ecosystem beyond a single vendor or product team.

Over time, we expect maintenance to be supported by a broader mix of sources rather than Treasury alone.

---

### Lantr Engineering Team

Lantr Engineering is a blockchain R&D and product development company focused on decentralised infrastructure and mission-critical applications. 

The Lantr's core team of 6 senior engineers, combining deep technical expertise in blockchain infrastructure, smart contracts, compilers, formal methods, and distributed systems with product and execution leadership. The two accountable leads are:

* **Alexander Nemish** — Founder & CTO. Functional programming, type theory, metaprogramming, compilers, and blockchain systems (Scala, Haskell, Rust). Former IOG engineer, contributed to the design and implementation of Marlowe. Previously Deutsche Bank and UBS. Leads Scalus's technical direction.
* **Oleksii Khodakivskyi** — Co-Founder & CEO. 10+ years in product development, business agility, and organisational design. Previously scaled product organisations across fintech and other sectors. At Lantr, leads business execution, operations, and product management.

**Ecosystem participation**. Technical working groups (Plutus, Ledger, Layer 2). Knowledge sharing through Scalus Club and Cardano Development Hours. Education collaborations, including the UZH Blockchain Summer School at the University of Zurich (2025, 2026). Open-source contributions across the Cardano toolchain.

**Skin in the game**. We build products ourselves, including (Scalus, Binocular, and Cosmex) and work closely with ecosystem partners building mission-critical systems (Bifrost, Gummiworm and others). Scalus solves the pain points we and other builders hit in practice, not the ones that only look good on paper.

**Execution and public accountability.** Lantr's track record is quality & delivery: products, integrations, community impact. For treasury-funded work, we commit to public reporting, open community sessions showcasing what we've shipped, and on-time milestone delivery.

---

### Lessons from the 2025 cycle

The 2025 Scalus Treasury cycle facilitated by Intersect provided several practical lessons that directly shaped this proposal:

- The path from draft proposal to treasury withdrawal took more than 6 months, creating a significant delay to execution.
- The fine-grained milestone structure required too much detail upfront, making the work more delivery-oriented and reducing flexibility to adapt the roadmap based on user feedback and product learning.
- The administration process provided limited protection against adverse ADA price movement.
- Third-party assurance and detailed reporting worked well and should be preserved.

As a result, the 2026 Scalus proposal uses direct on-chain submission, quarterly milestones, more outcome-focused delivery, conservative ADA budgeting, continued third-party assurance, and the same commitment to public reporting.

A full retrospective of the 2025 Scalus Treasury cycle is provided in the Reference documents.

---

### Scope / What Treasury Funds
 
This proposal funds a focused continuation of Scalus as shared Cardano infrastructure:
- **Maintenance** of the existing Scalus stack and JVM/JS/TS/Native export targets
- **Dijkstra hard-fork readiness**
- **Improved interoperability** with existing Cardano tooling and the broader JVM ecosystem
- **Application runtime**: a first scoped step, validated with real teams

The proposal **excludes** the production-grade JVM L1 node, full Gummiworm L2 integration, broad formal verification, advanced devnet expansion, and exploratory R&D.

---

### Milestones & Deliverables

This proposal delivers a kickoff plus three quarterly milestones over 9 months (July 2026 - March 2027).

Maintenance runs continuously across all of them; Dijkstra readiness, interoperability, and the runtime are phased below.


#### M1 (Q3 2026): Continuity & Dijkstra preview

**Objective**: Keep the stack current and ship the first Dijkstra developer preview.

**Key deliverables:**
- Ongoing maintenance: bug fixes, dependency upkeep, security patches, releases
- Dijkstra developer preview: initial Plutus V4 support in the compiler and standard library
- Interoperability: improved interfaces and documentation for the JS/TS components embedded in MeshJS, Evolution SDK, and Lucid Evolution
- Runtime: foundational components, reactive workers.

**What builders can do**: keep building on a maintained, current Scalus; experiment with early Dijkstra features; begin building against the foundational runtime.

#### M2 (Q4 2026): Interoperability & Dijkstra conformance

**Objective**: Deepen reuse across the JVM and JS/TS stacks; advance Dijkstra toward conformance.

**Key deliverables:**
- Dijkstra: ledger rules and transaction-builder updates (new builtins, cost models, nested transactions, accounts, guard scripts); conformance testing
- Interoperability: Java/Kotlin integration (Spring Boot, Ktor examples); cleaner integration paths with the Cardano Java stack (CCL, Yaci)
- Runtime: chain follower, task scheduler

**What builders can do**: use Scalus from Java/Kotlin and alongside CCL/Yaci; test contracts against Dijkstra changes with conformance coverage; move more application logic onto the runtime.

#### M3 (Q1 2027): Dijkstra readiness & consolidation

**Objective**: Reach Dijkstra readiness and consolidate the runtime release

**Key deliverables**:

- Dijkstra: final readiness aligned to the hard-fork timeline, conformance tests finalised
- Interoperability: published reuse guides 
- Runtime: foundational runtime release, persistance, reliability
- Documentation, examples, and blueprints across all workstreams

**What builders can do**: ship Dijkstra-ready contracts and transactions safely through the hard fork or dev preview; reuse Scalus components across JVM and JS/TS; run applications on the foundational runtime.

---

### Measurable Adoption Indicators

To give visibility into both delivery and ecosystem uptake, we commit to tracking and reporting the following metrics quarterly. 

**Delivery metrics are within our control and tied to disbursement; uptake metrics are tracked and reported**, since adoption depends on the wider ecosystem as well as on delivery.

| Metric | 9-Month Target | Measurement Method |
|---|---|---|
| Dijkstra readiness | Developer-preview ahead of the hard fork; final readiness tracked to the timeline | Plutus Core, ledger conformance tests |
| Existing integrations maintained | 5 SDKs kept Dijkstra-compatible | Integration tests; compatibility status |
| Interoperability | ≥1 working example each for Spring Boot and Ktor + reuse guide | Published examples and guide |
| Documentation & blueprints | 100% coverage of new features; ≥3 new dApp blueprints | Published docs and blueprint catalogue |
| Application runtime | Foundational runtime meeting its readiness criteria | Integration tests |
| Developer reach | Tracked (baseline: 20k+/mo Scalus JS downloads) | maven/npm downloads, GitHub activity, contributors |
| Ecosystem reuse | Tracked (baseline: 5 SDK integrations, >5 projects) | Public repos, SDK dependency, self-reporting |

---

### Budget

**Total Treasury ask**: ₳2,991,667 ($448,750 at a conservative $0.15/ADA reference rate) for 9 months of milestone-based delivery, with no contingency.

**Pricing principles** 

* Funding is requested in ADA; USD figures are provided as a reference.
* The base budget is intentionally structured on a financially lean basis.
* The \$0.15/ADA reference rate reflects conservative market conditions. 
* A portion of the funding is tied to demonstrating measurable impact.

**Methodology**

Funding allocations are derived from effort estimates across the workstreams, valued at a market rate of $210,000 per FTE-year (approx. $100/hour) for senior software engineers and senior product leadership with deep DLT expertise. 

**Funding Distribution**

| Category | USD | ADA | % |
|----------|-----|------------|------|
| Development & Engineering | \$354,375 | ₳2,362,500 | 79.0%  |
| Product Management & Delivery | \$39,375 | ₳262,500 | 8.8%  |
| Documentation & Developer Enablement | \$20,000 | ₳133,333 | 4.4% |
| Ecosystem Outreach & Adoption | \$10,000 | ₳66,667 | 2.2%  |
| Audits & Assurance | \$25,000  | ₳166,667  | 5.6% |
| **Total** | **\$448,750** | **₳2,991,667** | **100%** |

**Development & Engineering Breakdown**

| Workstream | FTE | USD | ADA |
|------------|-----|-----|-----|
| Maintenance | 0.5 | \$78,750 | ₳525,000 |
| Smart-contract platform & Dijkstra readiness | 0.75 | \$118,125 | ₳787,500 |
| Interoperability | 0.5 | \$78,750 | ₳525,000 |
| Application runtime (bounded scope) | 0.5 | \$78,750 | ₳525,000 |
| **Total** | **2.25** | **\$354,375** | **₳2,362,500** |

With Product Management & Delivery (0.25 FTE), total staffing is 2.5 FTE over 9 months.

**Category Detail**

**Development & Engineering (79.0%)**: The four workstreams detailed in Annex 1: Detailed Scope and Workstreams.

**Product Management & Delivery (8.8%)**: Product lifecycle management, milestone execution, partner and user coordination, and delivery oversight.

**Documentation & Developer Enablement (4.4%, fixed)**: Developer documentation, smart-contract and dApp blueprints, learning materials, and work that improves AI-assisted development readiness around the Scalus platform.

**Ecosystem Outreach & Adoption (2.2%, fixed)**: Ecosystem communication, demos, and light-touch support for teams evaluating Scalus for integration or adoption.

**Audits & Assurance (5.6%, fixed)**: Independent financial audit, technical review and assurance.

---

### Administration

**Smart Contract Escrow**

Funds are held and released through the SundaeSwap treasury-contracts framework (https://github.com/SundaeSwap-finance/treasury-contracts), a proven escrow system with two validators:

- treasury.ak — holds all ADA withdrawn from the Cardano Treasury. Everything is locked here when the governance action enacts.
- vendor.ak — manages milestone-based vesting: payment schedule, payout dates, release conditions.

Both contracts have been independently audited (TxPipe, MLabs) and are in production use on mainnet.

**Lantr Engineering as Sole Vendor**

Lantr Engineering is the sole vendor. All delivery comes from Lantr. Single point of accountability across the 9-month execution.

**Independent Oversight Board**

An independent, multi-party board provides third-party governance. Board members have no stake in Lantr Engineering. They co-sign disbursements, review milestones, and can halt funding if delivery falters.

| Member | Organisations | Projects |
|--------------|--------|----------|
| Chris Gianelloni | Blink Labs | Dingo, Adder, Bursa | 
| Matthias Benkort | Cardano Foundation | Amaru, Aiken, Ogmios, Konduit |
| Riley Kilgore | IOG | Aiken, Blaster integration |

**Independent Technical Assurer**

Periodic third-party audits are performed by No.Witness Labs. Quarterly technical reviews are published to the Cardano community. No.Witness Labs holds no stake in Lantr Engineering and is remunerated with funds explicitly allocated in this proposal for that purpose.

**Independent Financial Audit**

An external financial auditor will scrutinize Scalus's finances and treasury management, with the goal to publish a resulting report in Q2 2027. It will be remunerated with funds explicitly allocated in this proposal for that purpose.

**Permission Scheme**

Actions on the escrow contract require the following signatures:

| Action | Signatures required |
|------|-----------------------|
| Disburse| Lantr + board majority |
| Sweep early (return unused funds)| Lantr + any 1 board member |
| Reorganise | Lantr only |
| Fund (initial vendor setup) | Lantr + board majority |
| Pause milestone | Any 1 board member         |
| Resume milestone | Board majority |
| Modify project | Lantr + board majority |

**Delegation Policy**

The treasury contract enforces auto-abstain DRep delegation and no SPO delegation for all funds in escrow. Treasury funds do not influence governance votes or staking rewards during execution.

**Failsafe Sweep**

Funds remaining in the contract after expiration sweep back to the Cardano Treasury automatically. Enforced at the contract level; cannot be overridden.

**Prior Treasury Funding Disclosure**

In accordance with Article II — Section 7.2 of the Constitution, Lantr Engineering discloses prior Treasury withdrawals. We also disclose earlier Project Catalyst support for Scalus to provide a complete picture of prior Cardano community funding.

| Workstream | Allocation | Received | Reference |
|------------|------------|----------|-----------|
| Catalyst F11 — Scalus: Multiplatform Scala implementation of Cardano Plutus    | ₳200,000   | 100% | Project ID: 1100252 |
| Catalyst F11 — Multiplatform Plutus Script Cost & Evaluation Library (JS/JVM/LLVM) | ₳128,000   | 100%  | Project ID: 1100198 |
| Catalyst F13 — Scalus: Multiplatform Tx Builder — same code for front & backend    | ₳100,000   | 100% |  Project ID: 1300009 |
| 2025 Treasury Budget — Lantr: Scalus DApps Development Platform               | ₳657,692   | 100% (final report) | Governance Action ID: 8ad3d454f3496a35cb0d07b0fd32f687f66338b7d60e787fc0a22939e5d8833e#17 |

All completed milestones were delivered and publicly reported. The 2025 Treasury Budget allocation is completed, reporting is in review of the third-party assurer; with remaining disbursement follow the report delivery.

In USD terms, this request it is comparable to the single 2025 Treasury grant at its reference rate — a proportionate continuation.

---

### Reporting

**Release updates**. For every Scalus release, a public status update will be published through the Scalus and Lantr channels, covering key features, new capabilities, and what comes next.
  
**Quarterly reports**. Each quarter, we will publish a full delivery report covering milestone progress, new releases, use case coverage, risks and mitigations, measurable outcomes, and next steps. These reports will be shared alongside disbursement requests to the oversight board and published in the proposal repository (https://github.com/lantr-io/scalus-treasury-proposal-2026).

**Public transaction journal**. Every on-chain transaction (disbursements, claims, sweeps, reorganisations) is recorded in a public journal (https://github.com/lantr-io/scalus-treasury-proposal-2026/tree/main/journal): transaction hash, action type, amount, signers, justification, on-chain metadata hash. This follows the SundaeSwap metadata standard and can be independently verified on-chain.

**Community engagement** via Scalus Club. Every 1.5 months, open sessions with experienced Cardano developers: progress review, new features, Q&A. Announced on X/Twitter; sessions recorded for later viewing.

---

### Risks & Mitigations

This proposal’s narrower scope removes the largest risks from the previous version: there is no production L1 node to deliver, and no critical-path dependency on third-party L2 or formal-verification projects. The remaining risks are more bounded and openly stated.

| Type | Description  | Likelihood | Severity / Impact | Mitigation | 
|------|--------------|------------|-------------------|--------|
| Market | The budget is referenced in USD but paid in ADA | Medium | Medium: a further ADA price decline below the reference rate would compress the real delivery budget. | Conservative \$0.15/ADA reference rate; partial or full conversion to stable assets on receipt; no contingency keeps the ask lean. | 
| Adoption | Adoption may not grow much in 9 months | Medium | Medium: slower adoption would reduce near-term ecosystem impact | The funded floor (maintenance, Dijkstra readiness, interoperability) is valuable regardless of new adoption. The runtime step is validated against real use, so expansion remains tied to real demand. |
| Technical | Dijkstra specifications land late or change during delivery | Medium | Medium: final compatibility work could shift later in the delivery window. | Where final specs are unavailable, deliver developer-preview support, test coverage, conformance and documented upgrade paths rather than claiming production support ahead of the protocol timeline. |
| Team | Lean team for the scope | Low | Medium: loss of key personnel during execution would disrupt delivery. | The engineering team is senior and shares knowledge across the platform. Lantr has access to a broader network of experienced Scala engineers in Cardano and beyond, enabling hiring or contracting if needed. | 

---

### Conclusion

This proposal funds the next disciplined step for Scalus: keep it maintained, prepare it for Dijkstra, deepen reuse across JVM and JavaScript ecosystems, and validate a scoped application-runtime layer with teams already building on it.

Scalus is already part of Cardano’s developer infrastructure. It supports complex protocols directly, and its components reach many more teams through the tools they already use. This proposal keeps that infrastructure current and makes it more reusable across the ecosystem.

The ask is intentionally bounded: no production JVM L1 node, no full L2 integration, no broad formal-verification track, and no platform-scale expansion. It is a continuation of proven work, sized to the current moment, with milestone-based accountability, public reporting, and independent oversight.

Lantr Engineering commits to delivering the announced objectives within the requested budget.

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

- [x] **a clear withdrawal purpose**: funding the maintenance & development of Scalus platform for the 9 months period;
- [x] **a period for delivery of proposed activities which the withdrawal shall be used for**: July 2026 - March 2027, with a milestone breakdown and detailed scope provided;
- [x] **relevant costs and expenses of the proposed activities**: clear separation between fixed costs and variable costs, modelled as FTE (Full-Time Equivalent).
- [x] **circumstances under which the withdrawal might be refunded to the Cardano Treasury**

**Article II - Section 7.2: past withdrawal(s) disclosure**

- [x] We have disclosed that this is our second withdrawal in the last 24 months. The previous was submitted in July 2025, and enacted in August 2025.

**Article II - Section 7.3: net-change limit**

- [x] This proposal follows a recently established net-change limit of 350M. At the moment of submission, this proposal is well within the boundaries.

**Article II - Section 7.4: periodic audits**

This proposal makes provisions for:

- [x] periodic independent audits are explicitly detailed in the Budget section; 
- [x] quarterly reports submitted as a part of the milestone disbursements.

**Article II - Section 7.5: administration**

- [x] This proposal specifies an administrator in accordance with this provision. 

**Article II - Section 7.6: treasury oversight**

- [x] This proposal withdraws funds in a separate script account which each provides a public oversight of all operations, and ensures that funds cannot be delegated to an SPO and can only be delegated to the always-abstain drep. In addition to the on-chain guarantees provided by the smart contracts, we also commit to an off-chain financial journaling.

**Guardrails**

- [x] In accordance with the guardrail TREASURY-02a, this withdrawal does not exceed the NCL at the moment of submission.
- [x] In accordance with the guardrail TREASURY-03a, this proposal is ultimately denominated in ada.
- [x] TREASURY-04a — We acknowledge this action requires greater than 50% of DRep active voting stake to be ratified.

---

## Reference documents (IPFS)

### Annex 1: Detailed Scope and Workstreams

The tables below detail every component this proposal funds, grouped by workstream. By March 2027, "readiness criteria" across the platform means meeting measurable criteria per workstream. These criteria are tracked quarterly and reported alongside milestone deliveries.

#### SCP — Smart Contracts & Dijkstra readiness (0.75 FTE)

| Code | Component | Description |
|------|-----------|-------------|
| SCP1 | Enterprise testing capabilities | Boundary and scenario invariant scanning for smart contracts.|
| SCP2 | In-memory emulator | Full in-memory Cardano node with ledger validation; UTxO state tracking and block processing; transaction simulation. |
| SCP3 | Dijkstra hard fork & early access | Plutus V4 support; nested transactions; accounts; early integration ahead of hard fork. |

**Hard-fork readiness criteria**

- Smart contract language conformance: generated UPLC code passes 100% of official Plutus Core conformance test suites for V1–V4.
- Benchmarking & optimisation: generated UPLC code size and execution costs (CPU and memory) on par with Aiken or hand-written UPLC, measured through the UPLC-CAPE benchmarking framework.
- Documentation & blueprints: 100% documentation coverage of all functionality.

#### IOP - Interoperability (0.5 FTE)

| Code | Component | Description |
|------|-----------|-------------|
| IOP1 | Cardano JS/TS ecosystem reuse | Improved interfaces and documentation for the components embedded in MeshJS, Evolution SDK, and Lucid Evolution |
| IOP2 | Cardano Java stack interoperability | Cleaner integration paths with the Cardano Java stack (Cardano Client Lib, Yaci) |
| IOP3 | JVM interoperability | Java/Spring Boot and Kotlin/Ktor templates |

**Adoption readiness criteria**

- At least one working integration example each for Spring Boot and Ktor
- Documentation covers the interoperability specifics

#### ARS — Application Runtime (0.5 FTE)

| Code  | Component  | Description |
|-------|------------|-------------|
| ARS1  | Application runtime  | Event driven dApp runtime. Lets applications run their own end-to-end lifecycle without external dependencies. |
| ARS2  | Reactive workers  | Typed, durable event handling. Lets applications react to events with composable, type-safe logic that survives restarts and recovers cleanly from failure.|
| ARS3  | UTxO indexing | Chain follower with pub/sub typed selective UTxO indexing. Lets applications derive and query their own state from chain history, reproducible from the event log.  |
| ARS4  | Persistence layer | Crash-consistent storage for event log, snapshots, and checkpoints. Lets applications store state durably across crashes. |
| ARS5  | Job / task scheduler | Durable time-driven event source for slots, epochs, cron, and deadlines. Lets applications drive logic from time as well as from chain events, through the same reactive model. |

**Adoption-readiness criteria**

1. Replay determinism: any projection state is reproducible from the event log; full replay and replay-from-snapshot produce byte-identical results to live state.
2. Comprehensive set of integration tests validating reproducibility, rollbacks handling, retries, durability, and other functionality.

#### USE — Documentation, Training & Developer Enablement (Fixed)

| Code | Component | Description  |
|------|-----------|--------------|
| USE1 | Documentation & learning materials | Continuous documentation of platform capabilities.|
| USE2 | Smart contract & dApp blueprint catalogue | Evolution of the blueprint catalogue with advanced cases and examples. |
| USE3 | LLM/AI readiness | MCP integration; agents; LLM/AI-friendly APIs and documentation. |

#### Operations, Support & Assurance

| Code | Workstream | FTE | Description |
|------|------------|-----|-------------|
| MAN  | Maintenance | 0.5 | Cross-cutting maintenance, bug fixing, and support across all workstreams. |
| PM   | Product management | 0.25 | Product lifecycle management, partner and user coordination. |
| MAR  | Ecosystem Outreach & Adoption | Fixed | Ecosystem communication and outreach, adoption support. |
| AUD  | Financial audits & third-party assurance | Fixed | External financial audits, independent technical review and assurance. |

---

### Annex 2: Competitive Landscape
<!--
#### Smart contract development

Scalus is already one of the most complete and actively developed smart contract platforms on Cardano. It combines a Scala-native contract language, integrated transaction building, advanced optimisation paths, rich documentation, design patterns, a blueprint catalogue, and an enterprise-grade development experience in one stack.

That matters because teams are not only choosing a language. They are choosing how quickly they can write, understand, optimise, test, and maintain non-trivial protocols over time. In that regard, Scalus is positioned as a full smart contract development platform rather than only a contract DSL.

The next iteration extends that further with early access to features from the next Cardano hard fork.

| Capability | Scalus | Aiken | Plutarch |
|---|---|---|---|
| Easy to write contracts | Yes | Yes | No |
| Plutus support | V1, V2, V3 | V3 | V1, V2, V3 |
| Standard library | Yes | Yes | Yes |
| Low-level UPLC control | Yes | No | Yes |
| Custom optimisations | Yes | Limited (Compiler-driven) | Possible (manual) |
| Off-chain type/code reuse | Native | Code generator | Code generator |
| Developer pool | Large (JVM) | Growing (Cardano-native) | Small (Haskell) |
| Custom data representation | Annotations | Limited | Manual |
| Debugging | Enterprise-level / Native IDE | Third-party | Third-party |
| Error handling | Stack traces with source position | Debug logs | Debug logs |
| Transaction building | Native (JVM), JS/TS | External (Lucid, MeshJS) | External (Cardano-transaction-lib, etc) |
| Testing framework | Integrated (property, scenario, state-machine, emulator) | Built-in (aiken test, property) | Haskell ecosystem tooling |

* Aiken: https://aiken-lang.org/ 
* Plutarch: https://plutarch-plutus.org/ 

#### Development environment and testing

Scalus's development environment is optimised to accelerate development/testing cycles. The key differentiator is the in-memory node emulator: a fast, in-process Cardano execution environment available natively on the JVM and exportable into JavaScript and TypeScript.

This gives Cardano something much closer to what Hardhat and Foundry provide in Ethereum: a local environment where testing, debugging, scenario execution, and application logic can run against the same integrated stack. Rather than stitching together contract code, off-chain code, emulators, and external devnets, builders can work inside one coherent toolchain.

| Capability | Scalus | Yaci Dev Kit | Hardhat (Ethereum ref) | Foundry (Ethereum ref) |
|---|---|---|---|---|
| In-memory blockchain | Yes (in-process Cardano node) | No (Yaci Devnet via Docker) | Yes (Hardhat Network) | Yes (Anvil) |
| Local devnet | Yes (via Yaci Dev Kit) | Yes (configurable) | Yes | Yes |
| Block production control | Yes (slot/epoch manipulation) | Yes | Yes | Yes |
| Test language | Scala (native types) | Java | JavaScript / TypeScript | Solidity (native) |
| Property-based testing | Yes | Limited | Yes (Solidity fuzz) | Yes (Forge fuzz) |
| Multi-party / wallet testing | Native | Yes | Yes | Yes |
| Smart contract debugging | Source-position stack traces | tx-level logs | Console.log, stack traces | Stack traces |
| Test execution speed | Fast (in-process) | Medium (node communication overhead) | Fast | Very fast (Rust-based) |

* Yaci Dev Kit: https://devkit.yaci.xyz/ 
* Hardhat: https://hardhat.org/ 
* Foundry: https://www.getfoundry.sh/ 

-->

#### Application framework

The next layer is the application framework itself. In the Cardano landscape, the closest comparison is Balius in the Rust ecosystem. Most other widely used tools, including MeshJS and Evolution SDK, are primarily SDKs for transaction building and protocol interaction rather than full application runtimes.

Scalus goes further by combining smart contracts, transaction building, reactive workers, persistence, scheduling into one application platform. The goal is not just to help teams assemble transactions, but to help them build complete dApps and protocol backends on one stack.

This is where Scalus moves from tooling into an application platform: it complements contract development with the runtime layer needed to launch, operate, and evolve real applications.

| Capability | Scalus | Balius |
|---|---|---|
| Primary focus | Application runtime + embedded node | Headless dApps / workers (WASM) |
| Reactive workers | Yes (typed, durable) | Yes (WASM-based) |
| Persistence layer | Crash-consistent | Yes |
| Job / time scheduling | Yes | Yes |
| Crash recovery | Yes (event log replay) | Yes |
| L1 node access | No (uses external node) | No (uses external node, Dolos) |
| Source language / runtime | Scala/Kotlin/Java (JVM), Native | Rust, WASM |
| Production maturity | In development | In development |

* Balius: https://docs.txpipe.io/balius 

#### Conclusion

Taken together, these layers make Scalus unusual in the Cardano landscape. It is not only a smart contract language, not only a testing environment, not only an application runtime. It is a coherent application platform that brings those pieces together into one stack.

That is the core difference. Scalus is designed to reduce assembly work, compress time-to-production, and give builders one integrated platform to build, test, launch serious Cardano applications.

---

### Annex 3: 2025 Retrospective

#### Overview

In 2025, Lantr Engineering received its first Cardano Treasury funding through the process facilitated by Intersect for the Scalus - dApps development platform project (EC-0020-25).

The objective was to deliver a Scala-based Cardano development platform that allows developers to write smart contracts, build transactions, and implement application logic using the same language and a familiar development environment.

The project was funded at ₳657,692, based on a reference rate of \$0.65/ADA, for 6 months of development and 4.5 FTE.

This retrospective captures the main lessons from that cycle, what worked, what created friction, and which decisions directly shaped the design of the 2026 Scalus proposal.

#### Budgeting Process

**Observations**

The 2025 budgeting cycle took much longer than was assumed in the original proposal.

The Scalus proposal entered the process in March 2025 through gov.tools. Updates followed in April 2025, community voting through Eklesia took place in April-May 2025, debates about the process continued through June-July 2025, and final on-chain voting only happened in August 2025. In practice, the path from submission to final result took close to 6 months.

For 2026, Intersect has made clear improvements in the organisation and facilitation of the budgeting cycle. That progress should be acknowledged. At the same time, the expected timeline still stretches from April to late July / early August, with first disbursements likely only at the end of August or beginning of September. In practical terms, this still means roughly 5 months from proposal preparation to the end of voting, and close to 6 months from initial work to first payment.

A second limitation was that the proposal became effectively fixed very early in the process. That reduced the ability to incorporate learning from community discussion, user feedback, or new information discovered during review.

A third issue is structural: the bundled budget action remains a source of governance risk. Despite strong pushback from DReps during the 2025 cycle, bundling remains part of the suggested framework in 2026. The risk of rejection of a bundled action therefore remains medium to high.

**Decisions**

We acknowledge the crucial role Intersect played in organising and facilitating the 2025 cycle, as well as the improvements introduced for 2026.

At the same time, we concluded that:
- a 5-6 month path from proposal to first payment is too long for initiatives that can be socialised upfront and voted on within 1 month;
- the bundling mechanism still introduces uncertainty & governance risk.

For 2026, we therefore decided to submit independently, building on the practical experience of proposals such as Amaru and Dingo in the 2025/2026 Treasury cycles.

#### Contracting Framework

**Observations**

The contracting and legal support provided during the 2025 cycle was excellent. We would like to explicitly acknowledge the quality of assistance from the Intersect team in helping structure the contractual framework.

At the same time, the milestone-based contract model had several limitations for product-oriented work:
- Upfront scope drafting forced a project-style execution model that is only partially compatible with product development.
- Fixed delivery dates had to be defined at start.
- Fixed disbursement windows: the funds could only be released on pre-defined schedules, typically no sooner than 30 days after the due date, and only after third-party assurance sign-off and additional administrative review.
- While a change process existed, it was perceived by us as bureaucratically heavy and slow.

One useful feature of the 2025 structure was the kick-off milestone, which allowed initial withdrawal at the start of execution. This effectively funded the first month of operations for the team and enabled a stable start, while still remained refundable if the next milestone was not delivered on time.

**Decisions**

For the 2026 proposal, we decided to preserve what worked and improve what did not:
- Keep: a structure based on 4 milestones per year, rather than 5 milestones over 7 months. This creates more room for adaptation and product learning.
- Keep: an initial kick-off payment, with the next disbursement conditioned on delivery of the first quarterly objectives.
- Improve: milestone flexibility by allowing milestone updates where justified by learning, discovery, or user feedback, while protecting governance through oversight-board sign-off.
- Improve: disbursement timing, targeting a faster release of funds after accepted delivery.
- Keep: future fund unlocks conditioned on delivery evidence, delivery report, and third-party assurer review.

#### Duration and Delivery Window

**Observation**

The original development plan assumed 6 months of execution (end of June-December 2026). Because the budgeting process drifted significantly, and because the legal framework attached strict consequences to delivery delays, we introduced additional time buffer to cover the vacation periods + additional delivery risk protection.
This extended the contractual delivery window from 6 months to 7.5 months.

In practice, however, the team excelled at execution and completed all planned development work within the original 6-month engineering window.

The limitation was that milestone-based contracting made it impossible to close milestones and receive disbursement earlier than the fixed contractual schedule. This created an artificial gap between:
- the point when work was actually completed;
- the formal milestone due date;
- and the further delay required for disbursement.

**Decisions**

For 2026, we decided to:
- Improve: move to quarterly milestones with clearly defined objectives and a flexible feature backlog inside each milestone;
- Keep: clearly defined objectives, technical deliverables, and explicit user-facing outcomes;
- Reduce: unnecessary granularity in milestone splitting, so the team can adapt more actively within a quarter without losing accountability.

#### Financial Overview and ADA Volatility

**Observations**

The 2025 proposal used a reference rate of \$0.65/ADA. During execution, ADA depreciated materially, creating real pressure on delivery capacity. Milestone disbursements were received at approximately:

- 15 Oct 2025 (Milestone 1): \$0.67
- 15 Dec 2025 (Milestone 2): \$0.39
- 15 Feb 2026 (Milestone 3): \$0.28
- 29 Mar 2026 (Milestone 4): \$0.24

Using actual disbursement prices for M1–M4 and assuming \$0.30/ADA for
M5 and M6, the total effective purchasing power of ₳657,692 falls from an expected \$427,499.80 to \$237,950.41, a shortfall of \$189,549.39.

The Intersect 2025 Treasury process did not provide an effective mechanism for hedging against adverse ADA price movement at the process level. Learning from the Amaru experience, where conversion into stablecoins was used effectively, made clear that proactive treasury management is necessary if delivery is to remain protected over long funding windows.

**Decisions**

For 2026, we decided to:
- Hedge at least part of the requested ADA into USD-denominated stablecoins to protect delivery against adverse price movement;
- Use conservative ADA/USD rate;

This is the direct origin of the conservative ADA pricing used in the 2026 Scalus proposal.

#### Administration, Reporting, and Support During Delivery

**Observations**

Administrative support during execution was strong. The teams involved were responsive, helpful, and easy to work with. We encountered no material problems in administration during the delivery phase.

On our side, we provided detailed progress reports, delivery reports, and outcome summaries. These were shared with Intersect, made available through the Treasury dashboard, and communicated publicly through the Lantr and Scalus channels on X.

**Decisions**

For 2026, we decided to:
- Keep: the same transparency level;
- Keep: detailed public reporting;
- Keep: active communication of delivery progress and outcomes to the community.
  
#### Third-Party Assurance

**Observations**

The third-party assurance process worked well. No.Witness Labs demonstrated strong responsiveness and took a serious, technically informed look at the delivered work.

**Decisions**

For 2026, we decided to continue with No.Witness Labs as our third-party assurance partner.

#### Delivery Milestones vs Actual Delivery

**Observations**

All funded milestones were delivered on time. The planned milestone structure included:

- (Closed) Milestone 2 – Adoption and Onboarding
- (Closed) Milestone 3 – Off-chain Libraries
- (Closed) Milestone 4 – Testing Capabilities
- (Closed) Milestone 5 – Advanced UPLC Optimisations
- (Closed) Milestone 6 – Accelerated E2E Development Cycle

At the same time, one of the strongest lessons from delivery was that the roadmap was split too finely. The combination of:
- narrow milestone segmentation;
- strong focus on technical deliverables;
- and limited flexibility inside milestones
reduced our ability to adapt from user feedback and re-prioritise around what developers actually needed most.

Despite that constraint, we were still able to deliver additional capabilities and R&D outputs beyond the strictly committed scope, including:

- full van Rossem intra-era hard fork support ahead of time;
- experimental boundary testing and scenario exploration testing;
- advanced data structure performance benchmarking;
- experimental Scalus JIT Plutus VM;
- in-memory Cardano node emulator for JVM/JS/TS;
- broader performance optimisations.

This confirmed a pattern that is important for product development: developers do not consume milestone structures, they consume outcomes. A proposal structure that is too fine-grained can overfit to reporting convenience while under-serving real product evolution.

**Decisions**

For 2026, we decided to:
- Improve: Increase milestone cadence to a quarterly rhythm;
- Improve: Refocus milestones on outcomes, not only technical sub-deliverables;
- Improve: Create space for active re-prioritisation within milestone objectives;
- Keep: Preserve room for R&D and adoption assistance inside the delivery window.


#### Product Development Method

**Observations**

Scalus is a product, not a fixed-scope implementation project. The 2025 cycle reinforced that distinction. Real product development requires:
- direct user feedback;
- reprioritisation based on adoption and implementation pain points;
- room for experimentation and discovery;
- stable objectives, but flexible sequencing inside those objectives.
A milestone framework can support that, but only if it is not over-specified too early.

**Decisions**

For 2026, we decided to design the proposal around:
- clearly defined milestone objectives;
- user-facing outcomes and benefits;
- quarterly planning windows;
- and enough internal flexibility to learn, adapt, and re-prioritise without undermining accountability.

#### Conclusion / Register of Decisions

The 2025 Scalus Treasury cycle produced a clear set of operational lessons.

We concluded that the next proposal should:

- be submitted independently, without relying on the bundled budgeting structure and reduce the funding period;
- use quarterly milestones, not overly granular milestone splits;
- preserve an initial kick-off payment to stabilise execution;
- allow controlled milestone updates where learning justifies them;
- target faster disbursement timing after accepted delivery;
- retain third-party assurer and public reporting;
- hedge (at least part of) the requested ADA into stable assets;
- focus milestones on outcomes and product utility, not only technical line items;
- preserve flexibility for R&D, adoption support, and reprioritisation within milestone scope.

The 2026 Scalus proposal is built directly on these observations and decisions.

---

## Supporting links

* Full proposal: https://ipfs.io/ipfs/QmcCjBYA8zrx5Khqbh6xraXQ23zrgaZxuzNewr1Ni6fck7
* Annex 1: Detailed Scope and Workstreams: https://ipfs.io/ipfs/QmQ6RiAPBZfuRqSh2bCS1HBBxSUoVoGob55bM43vimHxfJ
* Annex 2: Competitive Landscape: https://ipfs.io/ipfs/QmSEhgYGnfVHmc432P7cZmWq2ocNrS1FhTsz3GqY2zJv84
* Annex 3: 2025 Retrospective: https://ipfs.io/ipfs/QmaVmFXvbFnS5vjVtb9uuQugDU8tbqiWCe2QrZijbMCP6r
* Scalus website: https://scalus.org/ 
* Scalus repository: https://github.com/scalus3 
* Scalus js repository: https://www.npmjs.com/package/scalus 
* Scalus Club: https://luma.com/scalus 
* Lantr website: https://lantr.io/ 
* Proposal repository: https://github.com/lantr-io/scalus-treasury-proposal-2026
* Treasury-contracts framework - Sundae Swap: https://github.com/SundaeSwap-finance/treasury-contracts

<!--
#### DRep feedback

The DRep feedback was clear and useful: many voters recognised the importance of improving Cardano’s application layer, the vision and technical quality of Scalus, and Lantr Engineering’s delivery record. At the same time, the requested scope and budget were considered too large relative to demonstrated demand and Treasury capacity in the current cycle.

The main concerns raised were:

- the request was too large relative to previous Scalus funding rounds;
- the previous proposal attempted to fund too much at once: application runtime, L1 node, L2 integration, formal verification, maintenance and adoption;
- the standalone JVM L1 node scope overlapped with other Cardano node initiatives already funded or in progress;
- third-party dependencies (Blaster and L2 integration) were too close to the critical path;
- the full JVM application-platform thesis needs stronger adoption validation before platform-scale Treasury funding.

#### The Incremental Step Funded Here

This proposal is structured as a direct response to the DRep feedback. The scope has been reduced from a full application-platform expansion to the next incremental public-good step for Scalus:

1. maintain the existing Scalus infrastructure;
2. prepare it for the Dijkstra hard fork;
3. improve interoperability with existing Cardano tooling and the broader JVM ecosystem, with a focus on adoption;
4. validate a first application runtime MVP with real users.

Treasury and Catalyst have already funded parts of Scalus. Those outputs are open-source, used by ecosystem projects, and integrated into other Cardano tooling. Keeping them maintained and compatible through the next protocol cycle protects prior public investment and avoids letting already-funded infrastructure fall behind.

-->