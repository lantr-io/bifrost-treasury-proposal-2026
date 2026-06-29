# Scalus 2026: Maintenance, Dijkstra Readiness, Interoperability & Application Runtime

## Abstract

**Scalus** is an established, open-source Cardano development platform, built by **Lantr Engineering** over three years of continuous delivery. 

It is the integrated, JVM-native toolset for complex protocols and mission-critical applications, such as **Gummiworm L2, Bifrost bridge, SugarRush DEX, Vela stablecoin, DID / DIDComm decentralised identity**, that build on it.

Its components are already reused inside Cardano's most widely used developer tooling: **MeshJS, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit**. Many teams depend on Scalus without ever integrating it directly.

This proposal funds a focused, 9-month continuation across three lines of work: 
- **protect** the existing infrastructure and prepare it for the upcoming **Dijkstra hard fork (maintenance and readiness)**
- **deepen** its reuse across the **JVM and JavaScript ecosystems (interoperability)**
- **expand** Scalus beyond protocol development toward **operating applications (first scoped application runtime)**.

It is a deliberately reduced resubmission. DReps recognised the previous Scalus proposal's vision, technical quality, and delivery record, but found its scope and budget too large. This version answers that directly: the ask is cut to **₳2,464,844** over 9 months, at a conservative **\$0.16/ADA** reference rate and **no contingency**.

Delivery is milestone-based, administered through audited SundaeSwap treasury contracts with an independent oversight board and third-party assurance.

The goal is bounded and concrete: protect prior public investment, keep Scalus and everything built on it working through the next protocol cycle, make it more reusable across the ecosystem, and extend it from building applications to running them. It's a proportionate continuation of proven work.

**At a glance**
  - **Ask:** ₳2,464,844 (~\$394,375 at \$0.16/ADA) · 9 months · no contingency
  - **Scope:** maintenance · Dijkstra hard fork readiness · interoperability (JVM + JS/TS) · a scoped application runtime
  - **Excludes:** standalone L1 node · full L2 integration · broad formal verification
  - **Vs. previous proposal:** reduced from ₳8.5M / 12 months; L1 node and third-party dependencies removed
  - **Team:** Lantr Engineering, three years building Scalus, every prior milestone delivered on time
  - **Governance:** SundaeSwap escrow · independent oversight board · third-party assurance


## Motivation

### The Application Layer Decides the Next Chapter

Cardano has made major progress at the protocol layer. The next bottleneck is application delivery: how fast serious teams can build, test, launch, and operate non-trivial applications.

Cardano 2030 outcomes (TVL, monthly transactions, and active users) are downstream of applications people and businesses actually use. Protocol upgrades, liquidity programmes, critical integrations, and VC capital only compound if teams can turn them into working products.

That is why developer infrastructure still matters. Not as an abstract tooling category, but as the path from protocol capability to real applications.

The application layer is not built from nothing. It relies on infrastructure that has to exist, keep working, and reach the teams who need it. Scalus already sits in that layer. This proposal strengthens that foundation and takes the first step beyond it: from protocol development toward running applications.

---

### What Scalus is today

Scalus is an established development platform, purpose-built for Cardano protocols and mission-critical applications: L2 solutions, cross-chain bridges, DEXs, and other DeFi products where correctness, performance, and control are non-negotiable.

For these systems, the smart contract is rarely the hardest part. The hardest part is everything around it: modelling state, building and testing transactions, simulating edge cases, optimising execution costs, and getting the full system right before it reaches production.

Scalus brings that development journey into one coherent JVM stack: a type-safe smart contract language, transaction building, enterprise-grade testing, advanced optimisations, an in-memory Cardano node emulator and local devnet, a library of advanced data structures, design patterns, and blueprints. 

It covers the protocol development layer in one integrated workflow: write, evaluate, optimise, test, and deploy.

---

### Traction

Scalus has three years of continuous delivery behind it and is in active use across the Cardano ecosystem — both in the systems built directly on it and in the tooling that reuses its components.

#### Protocols & applications built on Scalus

- **Gummiworm L2**: state-channel and custody settlement L2
- **Bifrost**: Bitcoin-Cardano bridge
- **SugarRush**: central limit orderbook DEX (on Gummiworm L2)
- **Vela**: decentralised synthetic stablecoin
- **DID / DIDComm**: decentralised identity & messaging protocol (JVM/JS)

These are exactly the complex, high-stakes systems Scalus is built for.

#### Reused across the Cardano ecosystem 

Scalus's script evaluation, cost calculation, and in-memory Cardano node emulator are embedded in tooling other teams already use:

- JVM: **Cardano Client Lib**, **YaciDevKit**
- JS/TS: **MeshJS SDK**, **Evolution SDK**, **Lucid Evolution**

Through these, many Cardano projects rely on Scalus components without ever integrating Scalus directly, as they come built into the tools these teams use every day.

#### Sustained Open Source delivery and reach

Three years of continuous development: 4,642 commits across 32 releases, 12 contributors.

On JS/TS alone, Scalus.js reaches 20,000+ downloads a month.

---

### The Next Step: Protect, Deepen, Expand

This proposal is that next step: focused and disciplined. It builds on the foundation Scalus already is, in three moves: **protect** it through the next hard fork, **deepen** its reach across the stacks teams already run, and **expand** it from protocol development toward running applications.

#### Protect

Scalus is already-funded public infrastructure, used directly by protocols and indirectly through developer tooling. Keeping it maintained, compatible, and safe to build on protects every team and tool that depends on it. 

Dijkstra hard fork introduces new capabilities and updates that include **Plutus V4 support, nested transactions, guard script types, accounts**. Those changes affect smart contract development, Plutus evaluation, transaction building, ledger rules, testing, and developer workflows. 

Maintenance and Dijkstra readiness keep Scalus, and the tools and projects built on it, working through the hard-fork transition.

#### Deepen

Scalus is JVM-native, and its components already reach the JavaScript and TypeScript ecosystem. This proposal makes them easier to reuse across the stacks teams already run.

- **JS / TS integrations**: improve the interfaces, capabilities, and documentation of the Scalus components already embedded in **MeshJS, Evolution SDK, and Lucid Evolution**, so the teams depending on them transitively get more capability and reliability.
- **JVM interoperability**: make Scalus directly usable from **Java and Kotlin** (Spring Boot, Ktor) and provide cleaner integration paths with the Cardano Java stack.
- **Multiplatform**: one codebase compiled to multiple targets (JVM, JavaScript, native, and WebAssembly), so the same components serve more environments without reimplementation.

#### Expand

Today, Scalus covers the development flow: **write, test, optimise, and deploy** a protocol. The application runtime is the first step into operating it: running the live system around the contract from one integrated stack.

The runtime provides the operating layer applications need after deployment: **following chain data, reacting to on-chain events, scheduling time-based actions, coordinating backend workflows, and recovering from failure**.

This is a bounded first release, scoped to the capabilities needed to move from a working protocol to a running application. It will be validated through reference applications, integration tests, and feedback from early users, including teams already building on Scalus.

---

### Why This Matters for Cardano

Scalus gives Cardano a **JVM-native development platform for mission-critical applications**, while reusing the same core components across **JavaScript and TypeScript tooling**.

That matters because many of the systems Cardano wants to attract (financial applications, protocol backends, bridges, L2 infrastructure, identity systems, enterprise integrations) are built by teams that need strong typing, mature backend tooling, rigorous testing, and operational control. The JVM ecosystem is one of the strongest environments for exactly that kind of software. 

These are not hypothetical systems. They are the kinds of systems already building on Scalus today: **Gummiworm, Bifrost, SugarRush & Vela, and DID/DIDComm**.

This proposal funds the next disciplined step: keeping that foundation maintained, current, and reusable for the teams already depending on it, while extending Scalus from protocol development toward running applications. 

The result is not a new platform bet, but a **compounding investment in infrastructure already used by serious Cardano builders**.

## Rationale

### What changed since the previous proposal

This is a focused resubmission of “Scalus: Cardano’s Application Platform.” In the previous vote, Scalus’s vision, technical quality, and delivery record were widely recognised. At the same time, the scope and budget were considered too large relative to demonstrated demand and current Treasury capacity.

This proposal responds directly to that feedback with a smaller ask, a narrower focus on existing adoption, and a scoped next step for the application layer. The most contested elements have been removed from the funded scope.

**Changes summary**

| Area | Previous proposal | This proposal |
|---|---|---|
| **Budget / duration** | ₳8,503,000 / 12 months | ~₳2,464,844 / 9 months |
| **Reference rate** | \$0.25/ADA| \$0.16/ADA |
| **FTE** | 8.25  | 2.25  |
| **FTE-months** | 99 | 20.25 |
| **Contingency** | 10% | 0% | 
| **Focus** | Full application platform expansion: L1 node, L2 integration, application runtime, advanced devnet | Maintenance, Dijkstra readiness, interoperability, and a scoped runtime step | 
| **Application runtime** | Production-grade runtime | Scoped runtime step, validated with real teams |
| **Standalone L1 node** | Hardened standalone & embedded L1 node for production operation | Removed from scope |
| **L2 solution integration** | Gummiworm operator setup and full integration | Removed from scope; runtime designed to support future L2 integration |
| **Integrated local devnet** |  Advanced devnet capabilities | Limited to Dijkstra/emulator needs | 
| **Formal verification** | Broad formal verification track | Out of scope; future integration may follow as IO’s Lean/Blaster framework matures |

The reductions map directly to the concerns raised by DReps: 
- Scale: substantially reduced ask (71%), with no contingency, but a lower \$0.16/ADA reference rate;
- Breadth: one focused continuation package, not a full platform expansion;
- L1 node: standalone JVM L1 node removed from scope;
- Dependency risk: L2 integration and formal verification removed from the critical path.

---

### What makes Scalus different

#### Integrated development platform

Scalus is not only a smart contract language. It is an integrated development platform for complex Cardano protocols and applications.

Scalus is built for the systems where the work does not stop at writing a smart contract, but extends into transaction construction, testing, simulation, protocol emulation, application backends, and production-oriented workflows.

This is why Scalus matters for L2 systems, bridges, DEXs, synthetic assets, identity protocols, and other applications where correctness depends on the whole system around the contract, not only the contract itself.

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

Scalus contributes at the developer infrastructure layer: helping more teams build, test, integrate, and operate serious Cardano applications. 

Its contribution to headline ecosystem KPIs such as TVL, monthly transactions, and active users is enabling rather than direct. Those outcomes come from the protocols and applications built on Scalus, not from this proposal itself.

**Cardano 2030 Pillars**

| Pillar | Focus Area | Our contribution |
|--------|------------|------------------|
| Pillar 2: Adoption & Utility | Developer Experience > Open-source incentives | Maintains and extends open-source infrastructure reused across the ecosystem (MeshJS SDK, Lucid Evolution, Yaci Dev Kit, Cardano Client Lib, and Evolution SDK). |
| | Education & migration | Provides documentation, tutorials, examples, and other materials for Web2 and JVM developers moving to Cardano and the UTxO model. |
| |  Compatibility | Improves interoperability with common Cardano tooling, JVM stacks, JS/TS SDKs, blueprints, and on-chain data structures generated by other Cardano languages. |
| Pillar 4: Community & Ecosystem Growth | Talent Acquisition & Retention | Supports education pathways for new Cardano developers, including Lantr’s collaboration with Cardano Foundation and the UZH Blockchain Summer School at the University of Zurich in 2025 and 2026. |
| | Hands-on Experience | Supports practical developer learning through Scalus Club, Cardano Development Hours, mentorship programmes including Google Summer of Code 2025, and real-world open-source tooling work. | 

---

### Use Case: From Protocol Design to Working Application

Scalus supports Cardano builders across the journey from protocol design to a working application.

For complex protocols, Scalus compresses the path from design to implementation: teams can model, build, test, optimise, emulate, and begin operating the system from one stack instead of assembling that layer themselves.

For newer teams, the same stack shortens the onboarding path from idea to testnet through blueprints, examples, transaction building, emulator support, and local devnet workflows.

| Builder need | What Scalus provides |
|---|---|
| **Model and implement the protocol** | Type-safe smart contracts, reusable data structures, design patterns, and blueprints |
| **Build and evaluate transactions** | JVM/JS/TS transaction building, evaluation, and cost calculation |
| **Test before production** | Enterprise-grade testing, in-memory Cardano emulator, and local devnet |
| **Optimise and adopt Dijkstra features** | Advanced optimisations, Plutus V4, nested transactions, accounts. |
| **Operate the application** | Scoped runtime layer for chain data, events, scheduling, backend workflows |

---

### Long-term sustainability through Open Source

Scalus is open-source infrastructure for Cardano (Apache 2.0 license). The capabilities funded through this proposal are designed to be reused across many teams, tools, and products, reducing repeated assembly work and strengthening the ecosystem as a whole.

This is the kind of work the Treasury is well placed to fund: shared application infrastructure that benefits the ecosystem beyond a single vendor or product team.

---

### Lantr Engineering Team

Lantr Engineering is a blockchain R&D and product development company focused on decentralised infrastructure and mission-critical applications.

Lantr’s core team includes **6 senior engineers**, combining deep technical expertise in blockchain infrastructure, smart contracts, compilers, formal methods, and distributed systems with product and execution leadership. The two accountable leads are:

* **Alexander Nemish** — Founder & CTO. Functional programming, type theory, metaprogramming, compilers, and blockchain systems (Scala, Haskell, Rust). Former IOG engineer, contributed to the design and implementation of Marlowe. Previously Deutsche Bank and UBS. Leads Scalus's technical direction.
* **Oleksii Khodakivskyi** — Co-Founder & CEO. 10+ years in product development, business agility, and organisational design. Previously scaled product organisations across fintech and other sectors. Leads business execution, operations, and product management.

**Ecosystem participation**. Technical working groups across Plutus, Ledger, and Layer 2; knowledge sharing through Scalus Club and Cardano Development Hours; education collaborations including the UZH Blockchain Summer School at the University of Zurich (2025, 2026); and open-source contributions across the Cardano toolchain.

**Skin in the game**. We build products ourselves (Scalus, Binocular, and Cosmex) and work closely with ecosystem partners building mission-critical systems (Bifrost, Gummiworm and others). Scalus addresses pain points encountered in real protocol and application delivery.

**Execution and accountability.** Lantr's track record is quality & delivery: products, integrations, community impact. For treasury-funded work, we commit to public reporting, open community sessions showcasing what we've shipped, and on-time milestone delivery.

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
- **Maintenance** of the existing Scalus stack and supported export targets;
- **Dijkstra hard-fork readiness** across smart contracts, transaction building, emulation, and testing;
- **Improved interoperability** with existing Cardano tooling and the broader JVM ecosystem;
- **Application runtime**: a first scoped step, validated through reference applications, integration tests, and feedback from early users.

The proposal **excludes** the production-grade JVM L1 node, full Gummiworm L2 integration, broad formal verification, advanced devnet expansion.

---

### Milestones & Deliverables

This proposal delivers three quarterly milestones over 9 months (July 2026 - March 2027).

Maintenance runs continuously across all milestones. Dijkstra readiness, interoperability, and the runtime are phased below.

#### M1 (Q3 2026): Continuity & Dijkstra Preview

**Objective**: Keep the stack current and ship the first Dijkstra developer preview.

**Key deliverables:**
- Ongoing maintenance: bug fixes, dependency upkeep, security patches, releases
- Dijkstra developer preview: initial Plutus V4 support in the compiler and standard library
- Interoperability: improved interfaces and documentation for the JS/TS components embedded in MeshJS, Evolution SDK, and Lucid Evolution
- Runtime: foundational components, reactive workers.

**What builders can do**: keep building on a maintained, current Scalus; experiment with early Dijkstra features; begin building against the foundational runtime.

#### M2 (Q4 2026): Interoperability & Dijkstra Conformance

**Objective**: Deepen reuse across the JVM and JS/TS stacks; advance Dijkstra toward conformance.

**Key deliverables:**
- Dijkstra: ledger rules and transaction-builder updates (new builtins, cost models, nested transactions, accounts, guard scripts); conformance testing
- Interoperability: Java/Kotlin integration (Spring Boot, Ktor examples); cleaner integration paths with the Cardano Java stack (CCL, Yaci)
- Runtime: chain follower, task scheduler

**What builders can do**: use Scalus from Java/Kotlin and alongside CCL/Yaci; test contracts against Dijkstra changes with conformance coverage; move more application logic onto the runtime.

#### M3 (Q1 2027): Dijkstra Readiness & Runtime Consolidation

**Objective**: Reach Dijkstra readiness and consolidate the runtime release.

**Key deliverables**:

- Dijkstra: final readiness aligned to the hard-fork timeline, conformance tests finalised
- Interoperability: published reuse guides 
- Runtime: foundational runtime release with persistence and reliability improvements
- Documentation, examples, and blueprints across all workstreams

**What builders can do**: prepare Dijkstra-ready contracts and transactions for the hard fork or developer preview; reuse Scalus components across JVM and JS/TS; run applications on the foundational runtime.

---

### Measurable Adoption Indicators

To give visibility into both delivery and ecosystem uptake, we commit to tracking and reporting the following metrics quarterly. 

| Metric | 9-Month Target | Measurement Method |
|---|---|---|
| **Dijkstra readiness** | Developer-preview ahead of the hard fork; final readiness tracked to the timeline | Plutus Core, ledger conformance tests |
| **JVM Interoperability** | ≥2 working example each for Spring Boot/ Ktor | Published examples and guides |
| **Ecosystem reuse** |  ≥1 extra integration / reuse over baseline (5 third-party integrations) | Public repos, SDK dependency, self-reporting |
| **Developer reach** | x1.5 the baseline (150+/mo Scalus JVM downloads; 20k+/mo Scalus JS downloads) | Maven/npm downloads, GitHub activity, contributors |
| **Application runtime** | Foundational runtime meeting its readiness criteria; ≥2 reference applications; ≥2 early users/teams providing feedback | Integration tests, reference applications, demo, public reports |
| **Documentation & blueprints** | 100% coverage of new features; ≥3 new dApp blueprints | Published docs and blueprint catalogue |

---

### Budget

**Total Treasury ask**: ₳2,464,844 (\$394,375 at a conservative \$0.16/ADA reference rate) for 9 months of milestone-based delivery, with no contingency.

**Pricing principles** 

* Funding is requested in ADA; USD figures are provided as a reference.
* The base budget is intentionally structured on a financially lean basis.
* The \$0.16/ADA reference rate reflects conservative market conditions. 
* A portion of the funding is tied to demonstrating measurable impact.

**Methodology**

Funding allocations are derived from effort estimates across the workstreams, valued at a market rate of \$210,000 per FTE-year (approx. \$100/hour) for senior software engineers and senior product leadership with deep DLT expertise. 

**Funding Distribution**

| Category | USD | ADA | % |
|----------|-----|------------|------|
| Development & Engineering | \$315,000 | ₳1,968,750 | 79.9%  |
| Product Management & Delivery | \$39,375 | ₳246,094 | 10.0%  |
| Documentation & Developer Enablement | \$25,000 | ₳156,250 | 6.3% |
| Audits & Assurance | \$15,000  | ₳93,750  | 3.8% |
| **Total** | **\$394,375** | **₳2,464,844** | **100%** |

**Development & Engineering Breakdown**

| Workstream | FTE | USD | ADA |
|------------|-----|-----|-----|
| Maintenance | 0.5 | \$78,750 | ₳492,188 |
| Smart-contract platform & Dijkstra readiness | 0.75 | \$118,125 | ₳738,280 |
| Interoperability | 0.25 | \$39,375 | ₳246,094 |
| Application runtime (bounded scope) | 0.5 | \$78,750 | ₳492,188 |
| **Total** | **2.0** | **\$315,000** | **₳1,968,750** |

With Product Management & Delivery (0.25 FTE), total staffing is 2.25 FTE over 9 months.

**Category Detail**

**Development & Engineering (79.9%)**: The four workstreams detailed in Annex 1: Detailed Scope and Workstreams.

**Product Management & Delivery (10.0%)**: Product lifecycle management, milestone execution, partner and user coordination, and delivery oversight.

**Documentation & Developer Enablement (6.3%, fixed)**: Developer documentation, smart-contract and dApp blueprints, learning materials, and work that improves AI-assisted development readiness around the Scalus platform.

**Audits & Assurance (3.8%, fixed)**: Independent financial audit, technical review and assurance.

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
| 2025 Treasury Budget — Lantr: Scalus DApps Development Platform               | ₳657,692  | 100% | Governance Action ID: 8ad3d454f3496a35cb0d07b0fd32f687f66338b7d60e787fc0a22939e5d8833e#17 |

All completed milestones were delivered and publicly reported. The 2025 Treasury Budget allocation is completed.

**In USD terms, this request is slightly below the single 2025 Treasury grant (~\$427K at \$0.65/ADA), a steady continuation.**

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
| Market | The budget is referenced in USD but paid in ADA | Medium | Medium: a further ADA price decline below the reference rate would compress the real delivery budget. | Conservative \$0.16/ADA reference rate; partial or full conversion to stable assets on receipt; no contingency keeps the ask lean. | 
| Adoption | Adoption may not grow much in 9 months | Medium | Medium: slower adoption would reduce near-term ecosystem impact | The funded floor (maintenance, Dijkstra readiness, interoperability) is valuable regardless of new adoption. The runtime step is validated through reference applications, integration tests, and feedback from early users |
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
| SCP3 | Dijkstra hard fork & early access | Plutus V4 support; nested transactions; accounts; early integration ahead of hard fork; full conformance testing. |

**Hard-fork readiness criteria**

- Smart contract language conformance: generated UPLC code passes 100% of official Plutus Core conformance test suites for V1–V4.
- Benchmarking & optimisation: generated UPLC code size and execution costs (CPU and memory) on par with Aiken or hand-written UPLC, measured through the UPLC-CAPE benchmarking framework.
- Documentation & blueprints: 100% documentation coverage of all functionality.

#### IOP - Interoperability (0.25 FTE)

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
| ARS1  | Application runtime  | Event driven dApp runtime. Lets applications coordinate application workflows around smart contracts using chain data, events, scheduling, and persistence. |
| ARS2  | Reactive workers  | Typed, durable event handling. Lets applications react to events with composable, type-safe logic that survives restarts and recovers cleanly from failure.|
| ARS3  | UTxO indexing | Chain follower with pub/sub typed selective UTxO indexing. Lets applications derive and query their own state from chain history, reproducible from the event log.  |
| ARS4  | Persistence layer | Crash-consistent storage for event log, snapshots, and checkpoints. Lets applications store state durably across crashes. |
| ARS5  | Job / task scheduler | Durable time-driven event source for slots, epochs, cron, and deadlines. Lets applications drive logic from time as well as from chain events, through the same reactive model. |

**Adoption-readiness criteria**

1. Comprehensive set of integration tests validating reproducibility, rollbacks handling, retries, durability, and other functionality.

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
| AUD  | Financial audits & third-party assurance | Fixed | External financial audits, independent technical review and assurance. |

---

### Annex 2: Competitive Landscape

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
- 31 May 2026 (Milestone 5): \$0.24
- 28 June 2026 (Milestone 5): \$0.145

The total effective purchasing power of ₳657,692 falls from an expected \$427,499.80 to \$214,000, a shortfall of \$213,500.

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
- Keep: Preserve room adoption assistance inside the delivery window.


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

* Full proposal: https://ipfs.io/ipfs/QmcxVb3ZKX4NBNqk1rHJuNf7LevB2iAY39sGUiKMGnPEeB
* Annex 1: Detailed Scope and Workstreams: https://ipfs.io/ipfs/QmXmA7iGezVzHHNXZZdHRVkEMdNT5qfjX3R6bsjYsn7LUn
* Annex 2: Competitive Landscape: https://ipfs.io/ipfs/QmZxgZMk9tjLkV39b3ppXWxHhFdyHqShmuLgrfAH6bQiTa
* Annex 3: 2025 Retrospective: https://ipfs.io/ipfs/QmdxcAZoSy2hAhNmmGsH6A9HyiuJDJM5jeH8BVHkBkeMMk
* Scalus website: https://scalus.org/ 
* Scalus repository: https://github.com/scalus3 
* Scalus js repository: https://www.npmjs.com/package/scalus 
* Scalus Club: https://luma.com/scalus 
* Lantr website: https://lantr.io/ 
* Proposal repository: https://github.com/lantr-io/scalus-treasury-proposal-2026
* Treasury-contracts framework - Sundae Swap: https://github.com/SundaeSwap-finance/treasury-contracts