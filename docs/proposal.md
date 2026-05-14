# Scalus: Cardano’s Application Platform for Building, Launching, and Scaling

> [!NOTE]
> This document is a review draft of Lantr Engineering’s proposal for the Scalus application platform and the 2026 Cardano Treasury withdrawal process.
>
> We welcome comments, questions, and critical feedback, and will use them to improve the proposal.
>
> It is meant as a starting point for discussing our Cardano treasury withdrawal.

## Abstract

Cardano is moving. Protocol upgrades, critical integrations, DeFi liquidity, and VC capital are aligning. But the next bottleneck is no longer core infrastructure, it is application delivery.

Teams still struggle to ship non-trivial applications because they must master and assemble too many moving parts themselves: smart contracts, formal verification, chain access, operations, and scaling. The ecosystem does not lack tools. It lacks an integrated application platform that has it all and just works.

[Scalus](https://scalus.org/) was built to address exactly this bottleneck. It is an established Cardano smart contract and dApp development platform built by [Lantr Engineering](https://lantr.io/), with three years of continuous delivery, ecosystem adoption, and integrations. Hydrozoa and Bifrost build on it. MeshJS SDK, Cardano Client Lib, and Evolution SDK integrate it. 

This proposal extends Scalus from a development environment into a full application platform: one coherent stack to build, verify, launch, and scale Cardano applications, with its own L1 node, native L2 integration, formal verification, and production-grade runtime capabilities.

Lantr Engineering requests ₳8,503,000 (including 10% contingency) from the Cardano Treasury for a 12-month delivery period (July 2026 to June 2027).

By the end of this period, both existing Cardano builders and new Java, Scala, and Kotlin teams entering the ecosystem will be able to develop and operate mission-critical and scalable applications on a unified JVM-native platform, reducing setup complexity while improving self-sovereignty and time to market.

For Cardano, that means a stronger application layer: more serious teams shipping, more resilient infrastructure in production, and a faster path to the applications that drive transactions, users, and TVL.

## Motivation

### The Application Layer Decides the Next Chapter

Cardano has shipped the protocol foundations. The question is no longer "can Cardano do X?" but "how fast can builders ship X?". Cardano 2030 measures success by three KPIs: TVL, monthly transactions, and monthly active users. Every one of them is downstream of application usage.

Every lever the ecosystem can pull is pointing in the same direction: more applications. Protocol upgrades are progressing. Critical integrations are advancing. DeFi liquidity is being allocated. VC fund is backing Cardano-native and integrated companies. Protocol, liquidity, and capital are aligning, and waiting for the application layer to catch up.

The ingredients are there: smart contracts, SDKs, and infrastructure. Yet teams still struggle to ship non-trivial applications. Without resolving this, the gains at the protocol, liquidity, and capital layers slip away instead of compounding.

This is where technical progress turns into ecosystem outcomes: applications create transactions, attract users, lock value, and generate real network activity.

The next chapter of Cardano is won at the application layer, and 2026 is the window to invest there.

---

### The Gap: The Assembly Problem

Pick a non-trivial use case: a prediction market, a perpetuals exchange, an AI agent marketplace. To ship it on Cardano today, a team has to solve four problems at once:

* **Design it well**: correct UTxO modeling, composable contracts, right design patterns.
* **Verify it's correct**: debugging, formal verification, enterprise-grade testing, security.
* **Launch it**: without relying on operational shortcuts or external providers that weaken user trust, resilience, or self-sovereignty.
* **Scale it**: with throughput and costs beyond what L1 alone can offer.

Each problem has partial solutions. Smart contract languages, off-chain SDKs, chain-access services, testing tools, and scaling solutions have all seen real progress from excellent teams.

But the solutions exist separately. They speak different languages, live in different repositories, ship on different schedules, and only connect where the builder wires them together. That is the gap.

Product teams that should be building business logic spend months mastering & assembling infrastructure instead: stitching together tooling, setting up L2 environments, integrating services. The assembly is the work. The assembly is the bottleneck. 

Teams without runway take shortcuts. Teams with budget hire specialists. Some never launch. Either way, time-to-market, operating complexity, and delivery budget all pay the price.

Builders don't need another tool. They need an integrated application platform that has it all, and just works.

## Rationale

### Strategic vision: Scalus - Cardano's application platform

Scalus is an integrated application platform for Cardano, built in Scala 3. It supports builders across the product journey from idea to production at scale, with one coherent stack: one codebase, one language, one development experience.

The platform combines four pillars:

1. **Smart contract development**. A type-safe Scala-native smart contract language compiling to Plutus Core, with enterprise-grade testing, an in-memory Cardano emulator, local devnet, formal verification integration, and early access to Dijkstra features. **This is the protocol layer: write, verify, optimise, test, and deploy**.

2. **Reactive application runtime**. The framework that runs the application's off-chain logic. Listen to chain events, manage workflows, schedule time-based actions, submit transactions reliably, and integrate with Cardano DeFi protocols through pre-built connectors. **This is the application layer that turns smart contracts and chain access into running applications.**

3. **Sovereign chain access**. A JVM-native **Cardano L1 node embedded directly inside the application or run as a standalone service**. Applications own their chain access end to end: reading state, following events, validating transactions, and submitting them without third-party dependencies. **This is the security and resilience layer**.

4. **L2 scaling, out of the box**. Native integration with **Hydrozoa / Gummiworm state-channels L2**. Applications that need higher throughput and lower operating overhead can scale beyond what L1 alone offers, without stepping outside the same platform. **This is the scaling layer.**

What makes Scalus different is not any one pillar taken in isolation. Cardano already has strong teams working on smart contracts, off-chain tooling, node implementations, and scaling. The gap is that these pieces still have to be assembled by the builder.

**Scalus brings them together into one product experience**. One stack to build with. One stack to test and verify with. One stack to launch with. One stack to scale with. 

And it does this in the JVM ecosystem, opening a path into one of the world’s largest developer ecosystems, with roughly 26 million developers, and the software environments where much of finance and fintech enterprises already operates.

---

### What makes Scalus different

#### Bringing the JVM Ecosystem to Cardano

Scalus is built around a simple adoption principle: enterprises adopt technologies that fit the systems, talent, and operational environments they already have.

For a large share of finance, fintech, and enterprise software, that environment is the JVM. Java, Kotlin, and Scala power backend systems, integration layers, and business-critical infrastructure across the industries Cardano ultimately wants to reach.

This pattern is well established across enterprise blockchain as well:
* **Ethereum / Besu (Java)**: an enterprise-grade Ethereum client (~8-10% mainnet usage).
* **R3 Corda (Kotlin)**: used across regulated financial networks and institutional workflows, \$10B+ on-chain RWA.
* **Canton Network (Scala)**: institutional digital asset stack adopted by firms like Goldman Sachs, Deutsche Borse, and DTCC.

Scalus (built in Scala) gives Cardano a native path into the JVM ecosystem: one coherent application platform for Scala, Java, and Kotlin teams, built to fit the environments where finance and fintech already live.

**What about the existing Cardano Java toolset?**

Cardano’s JVM ecosystem is not a blank slate. Projects such as CCL and Yaci (DevKit, Store) already provide important building blocks for JVM developers, and Scalus interoperates with that ecosystem. What remains missing is an integrated product experience: one stack that brings smart contracts, application runtime, L1 node capabilities, and L2 scaling together.

Scalus builds on the existing JVM toolset, where it already covers the need, and pushes further where the goal is a more complete developer experience, especially around advanced smart contract capabilities, a JS/TS toolset generated from the same codebase, and the one-node-across-the-lifecycle model described below.

#### Mission-critical applications need their own chain access

Cardano has funded several node implementations: reference node in Haskell, Amaru in Rust, Dingo in Go. They primarily optimise for SPOs and block production. Scalus targets a different audience: mission-critical applications and protocols that need their own chain access and cannot afford to depend on third-party providers for reading chain state or submitting transactions.

If a bridge, oracle, market-making system, or L2 operator depends on external providers, then part of its security and resilience depends on infrastructure it does not control. That may be acceptable for simpler applications. It is not enough for systems that need strong guarantees around availability, correctness, censorship resistance, and recovery under failure.

Recent exploits across the industry have shown the same pattern: the protocol may be sound, but dependence on external infrastructure can still become a critical weakness.

Scalus addresses this by bringing Cardano chain access inside the application boundary through an embedded or standalone L1 node. That gives application developers a deployment model better suited to their needs: tighter integration, a better development experience, and less dependence on external chain-access services.

#### Same node across the product lifecycle

Building with Scalus means using the same node across the product lifecycle. Switch the configuration, and it serves the current need:

* Prototyping protocol? In-memory node for fast iterations (seconds), with no external dependencies.
* Developing application? Fully configurable devnet with fast blocks, custom genesis, and mainnet forking.
* Launching testnet? The same node connects to Preview or Preprod, bootstrap from Mithril, and launch in minutes.
* Releasing to production? Run the same node against mainnet with security, resilience, and observability built in.
* Need scaling? Activate Hydrozoa L2. Plus, the same L1 node as the rest of your application.

The same node model follows the product from local development to production operation. No parallel infrastructure. No environment drift. One integrated stack.

#### Extending beyond JVM: JavaScript and TypeScript

While JVM is Scalus’s primary target, its architecture extends beyond a single ecosystem. Scalus already exports core node capabilities into JavaScript and TypeScript.

Today, Scalus.js is integrated into MeshJS SDK and Evolution SDK, providing script evaluation, cost calculation, and rapid testing capabilities. This proposal extends that path further with advanced devnet capabilities, and, where practical, data access and more node functionality directly in pure JS/TS.

Scalus becomes the application platform for the JVM, while enabling JS/TS-native solutions to build similar application-platform experiences in the second-largest developer ecosystem: JavaScript.

Scalus also explores extra deployment possibilities through Scala’s experimental WebAssembly backend.

A more detailed competitive landscape is provided in the Reference documents.

---

### Benefits for the ecosystem

**A stronger application layer**

Cardano’s long-term success (TVL, transactions, users) depends on applications people and businesses actually use. Scalus contributes directly by reducing the complexity of building and operating serious applications on Cardano, helping more teams move from idea to production. 

**More resilient application infrastructure**

By bringing an embedded or standalone L1 node and runtime capabilities closer to the application itself, Scalus reduces the need to depend on external centralized providers. That creates a more practical path toward self-hosted, censorship-resistant, and operationally resilient applications.

**A broader builder base**

Scalus creates a native path for JVM developers into Cardano, opening the ecosystem to experienced backend, enterprise, and financial software teams that already build in Scala, Java, and Kotlin.

**Reusable public goods and long-term sustainability**

Scalus is open-source infrastructure for Cardano. The capabilities funded through this proposal are designed to be reused across many teams and products, reducing repeated assembly work and strengthening the ecosystem as a whole.

This is the kind of work the treasury is well placed to fund: shared application infrastructure that benefits the ecosystem beyond a single vendor or product team.

Over time, we expect maintenance to be supported by a broader mix of sources rather than Treasury alone (more details in the Future Maintenance Costs section).

---

### Cardano 2030 Alignment

This translates into more applications reaching production and contributes directly to Cardano 2030’s goals around Adoption & Utility, Ecosystem Growth, and core usage KPIs such as Monthly Active Users (MAU), transactions, and TVL.

**Core Cardano 2030 KPIs**

| KPI | Alignment | Our contribution |
|-----|-----------|------------------|
| **TVL** | Yes | Applications built on Scalus lock value directly on Cardano. Bifrost brings BTC liquidity into Cardano DeFi, while Hydrozoa-based applications lock funds on L1 and directly increase TVL. |
| **Monthly Transactions** | Yes | More applications in production means more on-chain activity. Applications using L2s expand effective transaction capacity and contribute to higher total ecosystem transaction volume. |
| **Monthly Active Users (MAU)** | Yes | More reliable and self-sovereign applications improve user trust and retention. Scalus also enables more non-trivial applications, such as prediction markets and perpetuals, that can attract new users to Cardano. |

**Additional Cardano 2030 KPIs**

| KPI | Alignment | Our contribution |
|-----|-----------|---------------------|
| Reliability: Monthly Uptime (6 epochs) | Yes, partially | Application operators gain tighter control over chain following, local state derivation, and transaction submission when they can run their own L1 node instead of depending on third-party providers.|
| Operational Resilience: Alternative Full Node Clients | Yes | Scalus contributes an alternative application-facing Scala-based node implementation for JVM and native environments, optimised for mission-critical applications and protocols, and developed in ongoing collaboration with the Node Diversity initiative. |
| Revenue / Adoption: Annual Protocol Revenue | Yes | More applications increase L1 transaction demand and fee generation. L2 fee accrual flows back to Cardano rather than to competing ecosystems. |
| Scalability: Throughput Capacity per day | Yes | Hydrozoa/Gummiworm support enables L2 deployments that expand Cardano's effective throughput capacity by orders of magnitude. |

**Cardano 2030 Pillars**

| Pillar | Focus Area | Our contribution |
|--------|------------|------------------|
| Pillar 1: Infrastructure & Research Excellence | Scalability & Interoperability > L2 integration | Hydrozoa, a Cardano L2 state-channel solution, is built on Scalus platform. This proposal includes explicit support for Hydrozoa operators with embedded L1 access and application-level integration for scalable Cardano applications. |
| | Security & Resilience > Client diversity | This proposal explicitly references the further development and maintenance of an application-focused Cardano node implementation in Scala 3, supporting multi-platform deployment on JVM and native environments. Scalus's ledger rules framework already conforms to existing conformance tests developed through the Node Diversity initiative (maintained by the Amaru project). We will continue engaging with Node Diversity teams to develop, improve, and comply with conformance tests throughout this proposal. |
| Pillar 2: Adoption & Utility | Developer Experience > Open-source incentives | Scalus is an open-source application platform with reusable tooling, starter kits, blueprints, and ecosystem integrations. The Scalus toolset is already used in MeshJS SDK, Cardano Client Lib, and Evolution SDK. |
| | Education & migration | Scalus supports education and migration through documentation, tutorials, and training materials for Web2 developers and JVM developers moving to Cardano and the UTxO model. |
| |  Compatibility | Scalus aligns with common Cardano off-chain tooling, technical interfaces and enables the use of smart contract blueprints and on-chain data structures generated by other Cardano languages within Scalus applications. |
| Pillar 4: Community & Ecosystem Growth | Talent Acquisition & Retention | This proposal explicitly references the development of training materials that can align with blockchain education in schools and university curricula. Lantr contributes to this direction through its collaboration with Cardano Foundation and the UZH Blockchain Summer School at the University of Zurich (2025). |
| | Hands-on Experience | The Lantr team hosts learning sessions at Scalus Club and participates in mentorship programmes, including Google Summer of Code 2025, attracting new developers and providing practical experience in Cardano tooling and real-world problem-solving. | 

---

### Use cases

Scalus is built for three categories of applications on Cardano.

| Use case | Description | Examples |
|----------|-------------|----------|
| **New Cardano applications** | Teams moving from idea to first working application on Cardano with one coherent stack: scaffolding, starter kits, smart contract blueprints, in-memory emulator, configurable devnet, and testnet launch. | Lending protocol, auction, AMM starter kit |
| **Mission-critical applications and protocols** | Production-grade DeFi protocols, bridges, oracles, and other solutions that need rigorous testing, formal verification, sovereign chain access, and operational resilience. | Hydrozoa/Gummiworm L2, Binocular (decentralised Bitcoin oracle), DeFi Kernel SDK, market-making and arbitrage bots |
| **Applications with native L2 scaling** | Applications that need higher throughput, lower operational overhead, or custom business logic through Hydrozoa/Gummiworm L2 integration. | Sugar Rush DEX, prediction market, perpetuals platform |

These three use cases follow the same product journey with Scalus: build, verify, launch, and scale. 

For new applications, Scalus reduces the setup burden and shortens the path from idea to testnet. For mission-critical systems, it brings chain access, runtime, and verification closer to the application itself. For L2-based applications, it provides a native path to scaling without stepping outside the same platform.

This is the practical value of Scalus as an application platform: one stack that supports the product journey from first prototype to production-grade, scalable systems.

---

### Traction & Current State

Scalus is already in active use across the Cardano ecosystem. This proposal extends components that exist today; it does not create them from zero.

Scalus has three years of continuous delivery behind it, with ecosystem integrations, active adoption by partner teams, and repeated community funding support.

**Building on Scalus**

- Hydrozoa/Gummiworm L2: Cardano state-channel L2 scaling solution
- Bifrost: Bitcoin-Cardano bridge
- SugarRush: central limit orderbook DEX (with Hydrozoa/Gummiworm)
- Vela: decentralised synthetic stablecoin

**Integrating Scalus capabilities**

- MeshJS SDK, Cardano Client Lib, and Evolution SDK: integrations of core Scalus capabilities, including the in-memory L1 node emulator.

**Open Source**
- Scalus: 4466 commits, 29 releases, 102 stars, 15 forks, 12 contributors
- Scalus JS: 5k weekly downloads

This proposal builds on an existing platform with real integrations, active partner adoption, and delivery history.

**Component maturity**

| Pillar | Today | This proposal extends with |
|--------|-------|----------------------------|
| **Smart contract development** | Scala-native smart contract language compiling to Plutus Core, transaction builder, in-memory Cardano emulator, property-based testing, local devnet, blueprints, and design patterns | Formal verification integration, advanced devnet with mainnet forking, enterprise-grade testing, and early Dijkstra support |
| **L1 node** | Limited data-node capabilities, including chain following, UTxO indexing, and bootstrapping support | Embedded and standalone application-focused L1 node capabilities: broader chain access, mempool visibility, production hardening, and JVM/native deployment |
| **Application runtime** | Prototype stage | Reactive workers framework, chain event stream, mempool watcher, production runtime, observability, and DeFi connectors |
| **L2 scaling** | Hydrozoa integration in active development | Native Hydrozoa/Gummiworm integration, embedded L1 node for L2 operators, and custom ledger support |

Prior development of Scalus has been supported through multiple Catalyst projects and the 2025 Treasury Budget (more details in the Administration section).

Today, Scalus helps teams build complex Cardano protocols and solutions. This proposal extends it beyond development by adding the runtime, chain access, and scaling capabilities needed to launch, operate, and scale them in production.

---


### Lantr Engineering Team

Lantr Engineering is a blockchain R&D and product development company focused on decentralised infrastructure and mission-critical applications. Within Cardano, we work on the infrastructure and application layer for the next generation of digital economies: development platforms, interoperability and scaling solutions, and financial products.

The core team combines deep technical expertise in blockchain infrastructure, smart contracts, compilers, and distributed systems with product and execution leadership.

* **Alexander Nemish** — Founder & CTO. Senior software engineer specialising in functional programming, type theory, metaprogramming, compilers, and blockchain systems (Scala, Haskell, Rust). Former IOG engineer, contributed to the design and implementation of Marlowe, Cardano’s financial smart contract language. Previously Deutsche Bank and UBS. Leads Scalus technical direction.
* **Oleksii Khodakivskyi** — Co-Founder & CEO. 10+ years in product development, business agility, and organisational design. Previously scaled product organisations in communications, real estate, and fintech across Europe. At Lantr, leads business execution, operations, and product management.

Beyond the core team, Lantr has access to a broader network of trusted senior Scala engineers and domain specialists who can support delivery where additional capacity or specialist expertise is needed. This allows the proposal to scale delivery capacity where needed while keeping execution ownership and accountability within Lantr.

**Ecosystem participation**. Technical working groups (Plutus, Ledger, Layer 2). Knowledge sharing through Scalus Club and Cardano Development Hours. Education collaborations, including the UZH Blockchain Summer School at the University of Zurich (2025). Open-source contributions across the Cardano toolchain.

**Skin in the game**. We build products ourselves, including (Scalus, Binocular, and Cosmex) and work closely with ecosystem partners building mission-critical systems (Bifrost, Hydrozoa and others). Scalus solves the pain points we and other builders hit in practice, not the ones that only look good on paper.

**Execution and public accountability.** Lantr's track record is quality & delivery: products, integrations, community impact. For treasury-funded work, we commit to public reporting, open community sessions showcasing what we've shipped, and on-time milestone delivery.

---

### Lessons from the 2025 cycle

The 2025 Scalus Treasury cycle facilitated by Intersect provided several practical lessons that directly shaped this proposal:

- The path from draft proposal to treasury withdrawal took more than 6 months, creating a significant delay to execution.
- The fine-grained milestone structure required too much detail upfront, making the work more delivery-oriented and reducing flexibility to adapt the roadmap based on user feedback and product learning.
- The administration process provided limited protection against adverse ADA price movement.
- Third-party assurance and detailed reporting worked well and should be preserved.

As a result, the 2026 Scalus proposal uses direct on-chain submission, quarterly milestones, more outcome-focused delivery, conservative ADA budgeting, refundable contingency, continued third-party assurance, and the same commitment to public reporting.

A full retrospective of the 2025 Scalus Treasury cycle is provided in the Reference documents.

---

### Milestones & Deliverables

The proposal delivers four milestones over 12 months (July 2026 to June 2027). 

Each milestone advances various parts of the application platform while moving the three target use cases forward: new Cardano applications, mission-critical applications, and applications with native L2 scaling.

#### M1 (Q3 2026): Applications with sovereign chain access 

**Objective**: Establish the foundation for self-sovereign applications: an embedded application-focused L1 node and a reactive runtime.

**Key deliverables**:

* Reactive application runtime: event streaming and handling, application lifecycle management, persistence, UTxO indexing
* Embedded L1 node: networking, ledger conformance, Mithril snapshot bootstrap, storage backends
* Application and node observability

**What builders can do**: 

* Bootstrap a new application from a starter kit
* Build backend services that own their chain access (batchers)
* Run indexers that derive custom state from chain history (registers/archives)
* Build reactive applications (liquidation bots, arbitrage bots, bridge/L2 watchers)

#### M2 (Q4 2026): Applications with native L2 scaling

**Objective**: Unlock L2 application scaling through native Hydrozoa/Gummiworm* integration and embedded L1 access.

**Key deliverables**:

* Native Hydrozoa/Gummiworm* L2 integration with platform & embedded L1 node
* In-memory node emulator for L2 testing
* JVM interoperability with Java/Spring Boot and Kotlin/Ktor
* Early experiments with browser-native applications in JavaScript/TypeScript

**What builders can do**:

* Build scaled DeFi applications anchored to L1 through Scalus’s own node (L2 orderbook, prediction market, perpetuals, auction)
* Use Java and Kotlin application frameworks to integrate Cardano into production systems

#### M3 (Q1 2027): Formal verification + advanced devnet

**Objective**: Support mission-critical application development with formal verification and a more realistic development environment.

**Key deliverables**:

* Formal verification integration with Blaster*
* Custom L2 ledgers for Hydrozoa/Gummiworm*
* Early access to Dijkstra features
* Advanced devnet with mainnet forking for JVM, JavaScript & TypeScript
* Ledger conformance testing
* Native binary compilation

**What builders can do**:

* Develop and verify higher-assurance contracts and protocols with Blaster*
* Test complex applications against realistic mainnet state
* Native binary applications and CLI tools 
* Create custom business applications on top of state-channel L2 (gaming, account-based DEX, oracle)

#### M4 (Q2 2027): Censorship-resistant application operations

**Objective**: Deliver production-grade reliability and complete the censorship-resistance path for application operators.

**Key deliverables**:

- Finalisation** and hardening of the standalone and embedded L1 node for production operation
- Mempool watcher for pre-confirmation events
- Event-sourced transaction submission
- Typed DeFi connectors (in collaboration with 3-4 Cardano protocols)
- Standalone deployment modes, Docker images
- Performance tuning & optimisations

**What builders can do**: 

* Operate production-grade DeFi protocols with reliable local ledger state, fork management and transaction submission (bridge, optimistic roll-up)
* Build MEV-aware systems (market makers, arbitrage bots via mempool watcher)
* Launch standalone JVM/native chain-access services for production applications and supporting tools

By June 2027, Scalus brings its four pillars together into one integrated platform for the next generation of Cardano applications.

(\*) Hydrozoa/Gummiworm L2 and the Blaster formal verification framework are third-party projects. Milestones M2 and M3 depend on those integrations, and Lantr will work closely with those teams to manage that dependency risk.

(\*\*) Milestones M1-M3 progressively deliver the key node components required for production standalone operation. M4 is intended to finalise and harden those capabilities.

---

### Adoption targets and ecosystem impact indicators

To track ecosystem uptake beyond technical delivery, we will monitor the following indicators during the delivery period.

#### Platform adoption

Shows whether external teams are actually using Scalus to move serious applications closer to production:

* At least **1 demonstrated application or product** in each of the three use cases
* At least **5 product teams building with Scalus**, excluding Lantr Engineering
* At least **2 demonstrated deployments using Scalus-owned chain access** in a production or production-like environment
* At least **2 ecosystem integrations extended or deepened**

#### Indicative ecosystem impact

The value of Scalus is not tied to a single dApp. This proposal funds an application platform: a shared open-source layer intended to reduce the cost, complexity, and time-to-production for multiple serious applications on Cardano.

Representative examples already building on the platform include:

- **Bifrost**: Bitcoin-Cardano bridge, introducing external BTC-denominated liquidity to Cardano.
- **Sugar Rush**: L2 orderbook exchange, creating scaled trading activity, deeper liquidity, and locked value on L1.
- **Vela**: synthetic stablecoin protocol, allowing collateral to be locked and issued stablecoin liquidity to circulate in the ecosystem.

Using DeFiLlama as a public reference point, Cardano DeFi TVL stood at approximately $130M on May 5, 2026. At that scale, every new application built on Scalus that reaches production with a conservative \$5M TVL would represent roughly 4% of Cardano’s current DeFi baseline.

In the same logic, if 3 serious applications reach production, each contributing \$3M-$5M in first-year TVL, that would imply an approximate 8%-11% increase in Cardano’s current DeFi TVL.

We will monitor and report indicative ecosystem impact through the applications built on Scalus, including their contribution to TVL, liquidity, and transaction-generating activity where publicly measurable.

---

### Budget

**Total Treasury ask**: ₳8,503,000 (approximately \$2,125,750 at \$0.25/ADA reference rate), including a 10% refundable contingency reserved to protect delivery.

This proposal funds 12 months of milestone-based delivery across the four pillars of the Scalus application platform: smart contract development, embedded and standalone L1 node infrastructure, reactive application runtime, and native L2 integration. 

It is structured as an investment in an open-source, reusable application platform for Cardano.

Lantr commits to delivering the announced objectives within the current budget ask.

**Pricing principles** 

* Funding is requested in ADA; USD figures are provided as a reference.
* The base budget is intentionally structured on a financially lean basis, with the aim of delivering the planned platform scope within a disciplined ask.
* The \$0.25/ADA reference rate reflects conservative market conditions. 
* A limited 10% refundable contingency is included to protect delivery continuity from technical uncertainty, integration risk, audit findings, and delivery risk across a 12-month roadmap. Unspent contingency returns to the Cardano Treasury.
* A portion of the funding is tied to demonstrating measurable impact on Cardano 2030 KPIs and pillars.

**Methodology**

Funding allocations are derived from effort estimates across the core workstreams, valued at a market rate of $210,000 per FTE-year (average \$100/hour rate) for senior software engineers and senior product leadership with deep DLT (Distributed Ledger Technology) expertise. 

The budgeted engineering capacity extends beyond the current permanent team and assumes selective hiring, contracting, and specialist contributors where needed during execution.

**Funding Distribution**

| Category | USD | ADA | % |
|----------|-----|------------|------|
| Development & Engineering | \$1,470,000 | ₳5,880,000 | 76.1%  |
| Product Management & Delivery | \$210,000 | ₳840,000 | 10.9%  |
| Security & Audits | \$150,000  | ₳600,000  | 7.8% |
| Documentation, Training & Developer Enablement | $52,500 | ₳210,000 | 2.7% |
| Ecosystem Outreach & Adoption | \$50,000 | ₳200,000 | 2.6%  |
| **Subtotal** | **\$1,932,500** | **₳7,730,000** | **100%** |
| Contingency (10%, refundable)| \$193,250 | ₳773,000 | - |
| **Total** | **\$2,125,750** | **₳8,503,000** | - | 

**Development & Engineering Breakdown**

| Workstream | FTE | USD | ADA |
|------------|-----|-----|-----|
| Smart contract development | 1.0 | \$210,000 | ₳840,000 |
| Cardano L1 node infrastructure | 3.0 | \$630,000 | ₳2,520,000 |
| Application runtime | 1.5 | \$315,000 | ₳1,260,000 |
| L2 integrations | 1.0 | \$210,000 | ₳840,000 |
| Maintenance | 0.5 | \$105,000 | ₳420,000 |
| **Total** | **7.0** | **\$1,470,000** | **₳5,880,000** |

**Category Detail**

**Development & Engineering (76.1%)** 

Core platform engineering across five workstreams: 
* Smart contracts development (including formal verification integration, enterprise testing, advanced devnet, and Dijkstra readiness, R&D)
* Cardano L1 node and infrastructure (embedded and standalone deployment, broader chain access, mempool and client APIs, production hardening, and JVM/native targets)
* Application runtime (reactive workers, indexing, event handling, transaction submission service, observability, and DeFi connectors)
* L2 integrations (integration with Hydrozoa/Gummiworm L2, custom business-applications)
* Ongoing maintenance across the platform during delivery

**Product Management & Delivery (10.9%)** 

Product lifecycle management, milestone execution, user and partner coordination, and delivery oversight across the proposal.

**Security & Audits (7.8%, Fixed)**

* External security audits of smart contracts platform and critical node components (\$100,000)
* Independent financial audit, technical review and assurance (\$25,000)
* Security bounty program (\$25,000).

**Documentation, Training & Developer Enablement (2.7%)** 

Developer documentation, learning materials, migration guides, smart contract and dApp blueprints, pilot use-case materials, training programs (developers & auditors), and work that improves AI-assisted development readiness around the Scalus platform.

**Ecosystem Outreach & Adoption (2.6%, Fixed)**

Ecosystem communication, conference participation across Cardano and JVM events, demos, and light-touch support for teams evaluating Scalus for integration or adoption, across both Cardano-native and JVM-facing audiences.

**Contingency (10%, refundable)**

A limited delivery buffer for technical uncertainty, integration risk, audit findings, and delivery continuity across a 12-month platform roadmap. The proposal already uses a conservative ADA reference rate and a financially lean base estimate. The contingency is therefore not intended as a separate expansion of scope. Unspent contingency is returned to the Cardano Treasury.

---

### Future Maintenance Costs (Projection)

In the 2025 Treasury Budget proposal, Scalus 2026 maintenance was projected at roughly 0.5-1 FTE for the Smart contract development platform.

For the 2027 cycle, we expect maintenance needs to increase to roughly 2-2.5 FTE, reflecting the broader scope of the full application platform: smart contracts, L1 node, application runtime, L2 integration, and a broader ecosystem integration surface.

That 2027 estimate should not be read as a permanent steady-state maintenance level. It includes the first full year of post-delivery hardening across the expanded platform. We expect maintenance requirements in 2028 to normalize below that level.

What maintenance would cover next year:
- supporting early production usage
- compatibility with Cardano protocol upgrades (inter-era hard forks)
- security patches and audit follow-up
- bug fixes, issue triage, and community support
- dependency management across Scala, JVM, and key libraries
- integration and conformance testing across supported targets
- performance monitoring and optimisation
- documentation upkeep

Over time, we also expect maintenance to be supported by a broader mix of sources rather than Treasury alone. That can include direct contributions from teams building on Scalus, commercial implementation or support work around products that depend on the platform.

---

### Administration
**Smart Contract Escrow**

Funds are held and released through the SundaeSwap treasury-contracts framework (https://github.com/SundaeSwap-finance/treasury-contracts), a proven escrow system with two validators:

- treasury.ak — holds all ADA withdrawn from the Cardano Treasury. Everything is locked here when the governance action enacts.
- vendor.ak — manages milestone-based vesting: payment schedule, payout dates, release conditions.

Both contracts have been independently audited (TxPipe, MLabs) and are in production use on mainnet.

**Lantr Engineering as Sole Vendor**

Lantr Engineering is the sole vendor. All delivery comes from Lantr. Single point of accountability across the 12-month execution.

Integration partners, specifically Hydrozoa / Gummiworm / Blaster teams, don't receive funding through this proposal.

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

An external financial auditor will scrutinize Scalus's finances and treasury management, with the goal to publish a resulting report in Q3 2027. It will be remunerated with funds explicitly allocated in this proposal for that purpose.

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

In accordance with Article II — Section 7.2 of the Constitution, Lantr Engineering discloses prior work funded by the Cardano community. Prior support for Scalus has come through three Project Catalyst rounds and the 2025 Treasury Budget process.

Total prior allocation (over 3 years period): ₳1,085,692. To date, withdrawn: ₳888,384 (approximately 82%).

| Workstream | Allocation | Received | Reference |
|------------|------------|----------|-----------|
| Catalyst F11 — Scalus: Multiplatform Scala implementation of Cardano Plutus    | ₳200,000   | 100% | Project ID: 1100252 |
| Catalyst F11 — Multiplatform Plutus Script Cost & Evaluation Library (JS/JVM/LLVM) | ₳128,000   | 100%  | Project ID: 1100198 |
| Catalyst F13 — Scalus: Multiplatform Tx Builder — same code for front & backend    | ₳100,000   | 100% |  Project ID: 1300009 |
| 2025 Treasury Budget — Lantr: Scalus DApps Development Platform               | ₳657,692   | 70% (in execution) | Governance Action ID: 8ad3d454f3496a35cb0d07b0fd32f687f66338b7d60e787fc0a22939e5d8833e#17 |

All completed milestones were delivered and publicly reported. The 2025 Treasury Budget allocation is currently in finalisation, reporting is under preparation for the review of the third-party assurer; with remaining disbursements follow the report delivery.

---

### Reporting

**Release updates**. For every Scalus release, a public status update will be published through the Scalus and Lantr channels, covering key features, new capabilities, and what comes next.
  
**Quarterly reports**. Each quarter, we will publish a full delivery report covering milestone progress, new releases, use case coverage, risks and mitigations, measurable outcomes, and next steps. These reports will be shared alongside disbursement requests to the oversight board and published in the proposal repository (https://github.com/lantr-io/scalus-treasury-proposal-2026).

**Public transaction journal**. Every on-chain transaction (disbursements, claims, sweeps, reorganisations) is recorded in a public journal (https://github.com/lantr-io/scalus-treasury-proposal-2026/tree/main/journal): transaction hash, action type, amount, signers, justification, on-chain metadata hash. This follows the SundaeSwap metadata standard and can be independently verified on-chain.

**Community engagement** via Scalus Club. Every 1.5 months, open sessions with experienced Cardano developers: progress review, new features, Q&A. Announced on X/Twitter; sessions recorded for later viewing.

---

### Risks & Mitigations

No serious proposal is risk-free. The risks below are the ones most likely to affect delivery, with likelihood and impact assessed and concrete mitigations already in place.

| Type | Description  | Likelihood | Severity / Impact | Mitigation | 
|------|--------------|------------|-------------------|--------|
| Delivery   | Four milestones across 12 months is an aggressive delivery plan for platform-scale work. | Medium | Medium: milestone delays would postpone disbursements and slow dependent use cases. | This proposal extends components that already exist; it is not greenfield. The roadmap is structured around quarterly milestones with clearly defined objectives and more flexible internal sequencing, reducing planning rigidity while preserving accountability. Milestone-based disbursement and quarterly third-party assurance provide early warning if slippage occurs.  |
| Technical  | Delivering a production-grade application-focused Cardano L1 node is non-trivial. | Medium | High: failure to deliver M4 would leave the self-sovereignty thesis structurally incomplete and weaken the node-resilience thesis. | Core building blocks already exist, including ledger rules, mini-protocol communication, and node bootstrapping. Critical capabilities are delivered progressively across the earlier milestones, so the final production hardening is an extension of shipped components rather than a last-minute integration effort. Security audits are budgeted for the most critical components. |
| Market | The budget is referenced in USD but paid in ADA. | Medium | Medium: a further ADA price decline below the reference rate would compress the real delivery budget.| The proposal uses a conservative \$0.25/ADA reference rate and a financially lean base estimate. Lantr will manage receipts conservatively, including partial conversion into stable assets where appropriate. The refundable contingency is intended to preserve delivery continuity under uncertainty, rather than to function as a hedge against ADA price movement.| 
| Dependency | Parts of the roadmap depend on third-party projects (Hydrozoa/Gummiworm, Blaster, Amaru conformance). | Medium | Medium: partner slippage could delay specific capabilities, especially L2 scaling and formal verification, without blocking the full platform. | The core Scalus platform remains independently valuable: smart contracts, L1 node, application runtime, and development environment do not depend on any single partner project. Lantr will work closely with partner teams to manage integration risk and adjust sequencing where needed.|
| Adoption | JVM developer and enterprise uptake may be slower than projected. | Medium | Medium: slower adoption would reduce near-term ecosystem impact, even if technical delivery succeeds. | Adoption is supported through documentation, training, ecosystem integrations, community sessions, and targeted outreach to JVM and enterprise audiences. Further collaboration with Cardano Foundation and other ecosystem partners to increase the demonstation/implementation of the solution with the enterprises interested in Scalus platform. |
| Team | The team is relatively small for the breadth of the roadmap. | Low | Medium: loss of key personnel during execution would disrupt delivery. | The engineering team is senior, distributed across workstreams, and shares knowledge across the platform. Lantr also has access to a broader network of experienced Scala engineers in Cardano and beyond, enabling hiring or contracting if needed. |

Risks will be monitored throughout execution and reported quarterly alongside delivery progress. Material changes will trigger immediate board review.

---

### Conclusion / From us

The Scalus application platform provides a faster path from prototype to production for mission-critical and scalable Cardano applications. It is designed for the kinds of systems Cardano needs more of next: DeFi protocols, bridges, oracles, and other non-trivial applications.

It also strengthens Cardano’s JVM ecosystem, opening a native path for finance, fintech, and enterprise software teams. Scalus contributes to Cardano 2030 both to application-layer growth and to broader resilience through node diversity initiative.

Builders do not need another tool. They need an integrated application platform that has it all and just works. This proposal expands Scalus in exactly that direction, adding the runtime, chain access, and scaling capabilities required to launch, operate, and scale serious applications on Cardano.

Lantr commits to delivering the announced objectives within the current budget ask, with milestone-based accountability, public reporting, and independent oversight. 

The goal is straightforward: help more teams build, launch, and operate serious applications on Cardano and as a result drive Cardano's transactions, users, and TVL.

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

- [x] **a clear withdrawal purpose**: funding the development of Scalus application platform for the 12 months period;
- [x] **a period for delivery of proposed activities which the withdrawal shall be used for**: July 2026 - June 2027, with a milestone breakdown and detailed scope provided;
- [x] **relevant costs and expenses of the proposed activities**: clear separation between fixed costs and variable costs, modelled as FTE (Full-Time Equivalent) in addition to a contingency to protect delivery. 
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

The tables below detail every component this proposal funds, grouped by workstream. By June 2027, "production-ready" across the platform means meeting measurable criteria per workstream. These criteria are tracked quarterly and reported alongside milestone deliveries.

#### ARS — Application Runtime (1.5 FTE)

| Code  | Component  | Description |
|-------|------------|-------------|
| ARS1  | Application runtime  | Event driven dApp runtime with embedded node APIs. Lets applications run their own end-to-end lifecycle without external dependencies. |
| ARS2  | Reactive workers  | Typed, durable event handling. Lets applications react to events with composable, type-safe logic that survives restarts and recovers cleanly from failure.|
| ARS3  | Chain event stream  | Typed, ordered, replayable stream of L1 and L2 events. Gives applications a unified, replayable view of everything happening on L1 and L2, observed through their own node. |
| ARS4  | UTxO indexing | Chain follower with pub/sub typed selective UTxO indexing. Lets applications derive and query their own state from chain history, fully reproducible from the event log.  |
| ARS5  | Mempool watcher | Event source over the local node's mempool. Lets applications see and act on transactions before confirmation — arbitrage, MEV-aware submission, counterparty awareness. |
 | ARS6  | Transaction submission service | Event-sourced submission with retry, fee bumping, and conflict resolution. Lets applications submit transactions to L1 and L2 reliably under partial failure, with crash recovery built in.| 
 | ARS7  | Persistence layer | Pluggable, crash-consistent storage for event log, projections, snapshots, and checkpoints. Lets applications store state durably across crashes, on whichever backend fits the deployment target. |
| ARS8  | Job / task scheduler | Durable time-driven event source for slots, epochs, cron, and deadlines. Lets applications drive logic from time as well as from chain events, through the same reactive model. |
| ARS9  | Cardano DeFi connectors | Typed integrations for 3-4 selected Cardano DeFi protocols, reducing the need for custom low-level integration work such as manual CBOR or datum decoding. |
| ARS10 | JVM interoperability | Java/Spring Boot and Kotlin/Ktor |
| ARS11 | Monitoring, observability & logging | Prometheus metrics; OpenTelemetry distributed tracing; structured logging; worker health and metrics dashboards. Lets operators run applications themselves at production quality, with real visibility into what's happening. |

**Production-readiness criteria**

1. Replay determinism: any projection state is reproducible from the event log; full replay and replay-from-snapshot produce byte-identical results to live state.
2. Submission resilience: retry, fee bumping, and conflict resolution hold under partial failure; verified end-to-end against devnet and mainnet with adversarial scenarios (peer drops, fork rollbacks, mempool eviction).
3. Self-operability: full observability stack (Prometheus, OpenTelemetry, structured logs) usable without external SaaS; reference Grafana dashboards published.
4. Comprehensive set of integration tests validating reproducibility, rollbacks handling, retries, durability, connectors and other functionality.

#### L2H — L2 Scaling Integrations (1.0 FTE)

| Code | Component | Description  |
|------|-----------|--------------|
| L2H1 | Hydrozoa L2 integration | Integration with Hydrozoa (Gummiworm) L2 state channels. Lets applications scale through Hydrozoa/Gummiworm state channels, anchored to L1 through Scalus. |
| L2H2 | Censorship-resistant infrastructure | Embedded / standalone Hydrozoa setup with Scalus L1 node. Lets L2 operators run L1 node embedded in the application or in a stand-alone way, simplifying operations. |
| L2H3 | Ledger rules framework | Custom ledger rule sets for L2 solutions. Enables custom business applications on top of state channels. |

**Production-readiness criteria**

1. End-to-end deployment: at least one demonstration of a Hydrozoa/Gummiworm state channel running end-to-end on Scalus's L1 node layer in a representative environment.
2. Custom ledger rules: at least one demonstration of L2 ledger rule sets implemented and functional.
3. L1 integrity: L2 state anchoring and dispute resolution verified under adversarial conditions.
4. Documentation: full operator runbook including bring-up, monitoring, and recovery procedures.
5. Demonstration of a custom application running on multiple  Hydrozoa and Scalus L1 nodes with adversarial/availability scenarios (wrong transactions, non-participation)

#### NOD — Application-Focused L1 Cardano Node (3.0 FTE)

| Code  | Component | Description|
|-------|-----------|------------|
| NOD1  | Networking / mini-protocols | N2N and N2C mini-protocols with peer discovery and management. Lets the node follow the Cardano P2P network correctly and serve client applications over the standard interfaces. |
| NOD2  | Ledger & conformance | Conway+ ledger rules with an era transition framework. Lets the node validate blocks and maintain ledger state across protocol upgrades. Includes Dijkstra hard fork readiness (Plutus V4, new builtins, updated cost models) and conformance testing aligned with the Node Diversity initiative.  |
| NOD3  | Plutus VM | Scalus CEK machine evaluating UPLC scripts for V1–V4. Lets the node execute and cost smart contracts during validation.|
| NOD4  | Bootstrap | Mithril-based snapshot import for rapid initial synchronisation. Lets operators bring a node online in hours instead of days without full chain replay. |
| NOD5  | Storage | Pluggable on-disk backends for chain history, ledger snapshots, and indices (RocksDB, in-memory, IndexedDB). Lets the node persist state durably across crashes and target multiple deployment environments. |
| NOD6  | Consensus | Ouroboros chain selection and fork resolution. Lets the node maintain the same chain as the rest of the network under Byzantine conditions. |
| NOD7  | Mempool | In-memory store of pending transactions with validation, eviction, and ordering. Lets the node accept, validate, and propagate user transactions while exposing pre-confirmation events to applications. |
| NOD8  | Client API / common interfaces | In-process and socket-based interfaces for chain-sync, transaction submission, and ledger queries. Includes UTxO RPC (gRPC), Blockfrost-compatible REST API, and local socket support for cardano-cli / cardano-db-sync compatibility. Lets applications consume the node directly while remaining interoperable with existing Cardano tooling. |
| NOD9  | Standalone & embedded setups | Node-as-library (embed in your application); standalone binary mode with external APIs and Docker images. Lets teams choose between in-process embedding and containerised standalone deployment. |
| NOD10 | Multiplatform optimisations | JVM (server-side) and native |
| NOD11 | Node telemetry, monitoring & logging | Node-level Prometheus metrics and structured tracing; health checks and operational dashboards. |

**Production-readiness criteria**

Protocol conformance & interoperability
- Consensus and Networking: node is able to sync with Haskell node and successfully validate the chain starting from Conway.
- Plutus VM conformance: Scalus CEK machine passes 100% of official Plutus Core conformance test suites for V1–V4.
- Ledger conformance: 100% pass rate on available conformance test suites (Amaru, Haskell node).

Performance & scalability
- Sync speed: initial block download and synchronisation speed on par with the Haskell node on equivalent hardware.
- Memory footprint: JVM heap usage optimised to run on standard cloud instances (8–16 GB RAM) without excessive GC pauses.
- Transaction throughput: mempool validation and propagation handle peak mainnet load (80 KB blocks every 20 seconds).
- Benchmarks showing sync speed, memory usage, throughput and latency numbers in comparison to Haskell node.

Operational resilience & security

- Security audit: external security audit of the networking stack (DoS prevention) and ledger validation logic.
- Telemetry: integration with Prometheus/Grafana for real-time monitoring of block height, peer count, and resource usage.

Deployment flexibility
- Node-as-library: embedding the node directly into JVM applications without a standalone process.
- GraalVM compatibility: native image compilation for reduced startup time and memory overhead.

#### SCP — Smart Contracts Development (1.0 FTE)

| Code | Component | Description |
|------|-----------|-------------|
| SCP1 | Enterprise testing capabilities | Boundary and scenario invariant scanning for smart contracts.|
| SCP2 | Formal verification | Integration with Blaster verification framework; contract invariant checking. |
| SCP3 | In-memory emulator & local devnet | Full in-memory Cardano node with ledger validation; UTxO state tracking and block processing; transaction simulation. |
| SCP4 | Dijkstra hard fork & early access | Plutus V4 support; nested transactions; accounts; early integration ahead of hard fork. |
| SCP5 | Exploratory R&D | Exploratory research into potential platform improvements, including VM performance, optimisation techniques, zk tooling, and on-chain data structures. |

**Production-readiness criteria**

- Smart contract language conformance: generated UPLC code passes 100% of official Plutus Core conformance test suites for V1–V4.
- External security audit: completion of a professional technical audit of the Scala Compiler Plugin and the core Standard Library primitives, with audit results published.
- Benchmarking & optimisation: generated UPLC code size and execution costs (CPU and memory) on par with Aiken or hand-written UPLC, measured through the UPLC-CAPE benchmarking framework.
- Formal verification: stable integration with the Lean4 and Blaster verification frameworks for contract invariant checking. Demonstration of at least two non-trivial theorems about smart contracts.
- Documentation & blueprints: at least three production-grade application blueprints with 100% documentation coverage.

#### USE — Documentation, Training & Developer Enablement (0.25 FTE)

| Code | Component | Description  |
|------|-----------|--------------|
| USE1 | Documentation & learning materials | Continuous documentation of platform capabilities.|
| USE2 | Smart contract & dApp blueprint catalogue | Evolution of the blueprint catalogue with advanced cases and examples. |
| USE3 | Use case development | Development of pilot use cases, partner identification, iteration. |
| USE4 | Training program | Training programs for developers and auditors. |
| USE5 | LLM/AI readiness | MCP integration; agents; LLM/AI-friendly APIs and documentation. |

#### Operations, Support & Assurance

| Code | Workstream | FTE | Description |
|------|------------|-----|-------------|
| MAN  | Maintenance | 0.5 | Cross-cutting maintenance, bug fixing, and support across all workstreams. |
| PM   | Product management | 1.0 | Product lifecycle management, partner and user coordination. |
| MAR  | Ecosystem Outreach & Adoption | Fixed | Ecosystem communication and outreach, events, adoption support. |
| AUD  | Technical audits & third-party assurance | Fixed | External security and financial audits, independent technical review and assurance, security bounty program. |

---

### Annex 2: Product Development Methodology

Scalus is a product, not a project. 

The distinction matters: a product evolves continuously, shaped by the people using it, through repeated cycles of ship, learn, adjust. The milestones are the initial high-level plan, what the platform delivers and when. Within those milestones, specific feature priorities, implementation choices, and component sequencing adapt based on what we learn from real users. 

That said, larger course corrections at the milestone level remain possible, particularly within Milestones 3 and 4, where the longer horizon makes adaptation more likely. We will reprioritise when user feedback, new opportunities and use-cases, or R&D findings warrant it.

**Working from user feedback.** Lantr's product decisions are shaped by direct conversations with the teams building on Scalus today and the wider Cardano builder community (facilitated by Scalus Club). Pain points reported by users can override speculative roadmap choices.

**Early testable versions**. Each capability ships first as a working preview: usable, but not yet polished. Users build with it, report what works and what doesn't, and the team folds the learning back into subsequent iterations.

**Monthly iterations.** We practice trunk-based development (on average 45-50 commits/week), so new code reaches the main line daily. New features are activated for users every month, not at quarter-end, this compresses feedback loops and prevents large-batch failures.

Three years of continuous Scalus delivery have run on this methodology. Quarterly reports make the reprioritisations visible to the oversight board and the public.

---

### Annex 3: Competitive Landscape

#### Smart contract development

Scalus is already one of the most complete and actively developed smart contract platforms on Cardano. It combines a Scala-native contract language, integrated transaction building, advanced optimisation paths, rich documentation, design patterns, a blueprint catalogue, and an enterprise-grade development experience in one stack.

That matters because teams are not only choosing a language. They are choosing how quickly they can write, understand, optimise, test, and maintain non-trivial protocols over time. In that regard, Scalus is positioned as a full smart contract development platform rather than only a contract DSL.

The next iteration extends that further with formal verification integration and early access to features from the next Cardano hard fork.

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

This proposal extends that foundation further in M2-M3 with advanced devnet capabilities, mainnet forking, and stronger production-parity testing.

| Capability | Scalus | Yaci Dev Kit | Hardhat (Ethereum ref) | Foundry (Ethereum ref) |
|---|---|---|---|---|
| In-memory blockchain | Yes (in-process Cardano node) | No (Yaci Devnet via Docker) | Yes (Hardhat Network) | Yes (Anvil) |
| Mainnet forking | Yes (M3) | Limited | Yes (signature feature) | Yes (fast) |
| Local devnet | Yes (fully configurable, custom genesis) | Yes (configurable) | Yes | Yes |
| Block production control | Yes (slot/epoch manipulation) | Yes | Yes | Yes |
| Test language | Scala (native types) | Java | JavaScript / TypeScript | Solidity (native) |
| Same code: test = production | Yes (M4) | No (devnet) | Yes | Yes |
| Property-based testing | Yes | Limited | Yes (Solidity fuzz) | Yes (Forge fuzz) |
| Snapshot / replay determinism | Yes (M3) | Yes | Yes | Yes |
| Multi-party / wallet testing | Native | Yes | Yes | Yes |
| Smart contract debugging | Source-position stack traces | tx-level logs | Console.log, stack traces | Stack traces |
| Test execution speed | Fast (in-process) | Medium (node communication overhead) | Fast | Very fast (Rust-based) |

* Yaci Dev Kit: https://devkit.yaci.xyz/ 
* Hardhat: https://hardhat.org/ 
* Foundry: https://www.getfoundry.sh/ 

#### Application framework

The next layer is the application framework itself. In the Cardano landscape, the closest comparison is Balius in the Rust ecosystem. Most other widely used tools, including MeshJS and Evolution SDK, are primarily SDKs for transaction building and protocol interaction rather than full application runtimes.

Scalus goes further by combining smart contracts, transaction building, reactive workers, event streaming, persistence, scheduling, observability, and typed protocol integrations into one application platform. The goal is not just to help teams assemble transactions, but to help them build complete dApps and protocol backends on one stack.

This is where Scalus moves from tooling into an application platform: it complements contract development and chain access with the runtime layer needed to launch, operate, and evolve real applications.

| Capability | Scalus | Balius |
|---|---|---|
| Primary focus | Application runtime + embedded node | Headless dApps / workers (WASM) |
| Reactive workers | Yes (typed, durable) (M1-M2) | Yes (WASM-based) |
| Typed event streaming (L1 + L2) | Yes (M1-M2) | Yes (UTxORPC) |
| Persistence layer | Pluggable, crash-consistent | Yes |
| Job / time scheduling | Yes | Yes |
| Transaction submission | Event-sourced  | Yes |
| Mempool watcher | Yes | Limited |
| DeFi connectors | Yes (typed clients) | Limited |
| Observability | Yes (M3) | Yes |
| Crash recovery | Yes (event log replay) | Yes |
| L1 node access | Yes (in-process or standalone Scalus node) | No (uses external node, Dolos) |
| Source language / runtime | Scala (JVM) | Rust + WASM |
| Multi-platform deployment | JVM, native, JS/TS, WASM | WASM (cross-platform) |
| Production maturity | In development | In development |

* Balius: https://docs.txpipe.io/balius 

#### L1 node and chain access

In the node landscape, Scalus is differentiated by its application focus. Existing node implementations primarily optimise for block production, relay operation, or data access as standalone infrastructure roles. Scalus targets a different need: application-owned chain access embedded directly into the application lifecycle.

That means the same node model can accompany a builder from local development, to testnet, to production, in embedded or standalone mode, with selective data access, typed indexing, mempool visibility, and production-ready standalone operation. 

The emphasis is operational simplicity and composability: applications configure the chain-access profile they need, in the same language and on the same stack as the rest of the system.

By June 2027, the target is a platform that offers chain following, ledger validation, local data access, mempool visibility, and reliable transaction submission for application operators, while remaining optimised for application use rather than generic network infrastructure.

| Capability | Scalus | Haskell node | Amaru | Dolos | Yaci Store | Dingo |
|---|---|---|---|---|---|---|
| Primary focus | Application use (embedded) | Block production / relay | Block production / relay | Data access | Data access | Block production / relay |
| Block production | Path to (post-2027) | Yes (production) | In development | No | No | In development |
| Data access | Yes (M1) | Yes | In development | Yes | Yes | In development |
| Ledger validation | Yes (M3-M4) | Yes | Yes | Limited | Limited | Yes |
| Chain following / sync | Yes (M1) | Yes | Yes | Yes | Yes | Yes |
| UTxO indexing | Yes (typed, selective) | Via db-sync | Yes | Yes | Yes | Yes |
| Mempool access for apps | Yes (watcher) | Yes (socket) | In development | Limited | Via Yaci library | In development |
| Transaction submission | June 2027 (M4) | Yes | Yes | Limited | Via external tooling | In development |
| Plutus VM (V1-V3) | Yes (Scalus CEK) | Yes | Yes (Rust) | Limited | Limited | In development |
| Source language / runtime | Scala (JVM) | Haskell (GHC) | Rust | Rust | Java (JVM) | Go |
| Embedded mode (node-as-library) | Yes | No (separate process) | No | Partial (Rust crate) | Yes (Java library) | No |
| Multi-platform compilation | JVM, Native, JS/TS, WASM | Native | Native | Native | JVM, Native | Native |
| Node Diversity conformance | Yes (M3) | Reference implementation | In progress | - | - | In progress |
| Standard APIs | UTxO RPC, REST, sockets, in-process | Socket, cardano-db-sync | Sockets | UTxO RPC, REST | REST | Standard |
| Storage backends | RocksDB, in-memory, IndexedDB (M1) | LSM-tree | Multiple | Multiple | Multiple | Multiple |
| Production maturity | In development (data node prototype; relay June 2027) | Production (mainnet, years) | In development | Production (data role) | Production (data role) | In development |

* Haskell node: https://github.com/IntersectMBO/cardano-node 
* Amaru: https://amaru.global/ 
* Dolos: https://docs.txpipe.io/dolos 
* Yaci Store: https://store.yaci.xyz/ 
* Dingo: https://github.com/blinklabs-io/dingo 

#### Native L2 scaling

Scalus also stands out by making L2 scaling part of the same platform rather than a separate integration burden. Hydrozoa/Gummiworm is already being developed on Scalus today, and this proposal extends that path into native operator support and custom ledger support.

The result is that launching an L2-scaled application becomes much simpler. Instead of assembling a separate scaling environment, node layer, and application framework, builders can use the same platform and configuration model to move from L1 development into L2-enabled operation.

That reduces the barrier to shipping more scalable Cardano applications and makes L2 support feel like an extension of the platform, not a parallel system.

| Capability | Hydrozoa/Gummiworm (integrated with Scalus) | Hydra | Midgard |
|---|---|---|---|
| Type | Application platform with native L2 integration | L2 state channel protocol | L2 optimistic rollup |
| L2 architecture | State channels + custody settlement protocol | State channels (isomorphic ledger) | Optimistic rollup |
| Custom L2 ledger rules | Yes (via Gummiworm) | No (isomorphic = same as L1) | Rollup semantics (fixed) |
| Multi-party participants | Yes | Yes (limited per head) | Open participation |
| Configurable setup | Yes (Scalus framework provides operator scaffolding) | Moderate | In development |
| Source language / runtime | Scala (JVM) | Haskell | Aiken/Plutarch (onchain) + Haskell/TypeScript (offchain) |
| L1 node dependency | Embedded (own Scalus node) or external node | External Cardano node | External Cardano node |
| Production maturity | In development, Hydrozoa runs on Scalus today; full operator framework Q4 2026 (M2) | Production (Hydra Head) | In development |

* Hydrozoa: https://github.com/cardano-hydrozoa/hydrozoa 
* Hydra: https://hydra.family/head-protocol/ 
* Midgard: https://github.com/Anastasia-Labs/midgard 

#### Conclusion

Taken together, these layers make Scalus unusual in the Cardano landscape. It is not only a smart contract language, not only a testing environment, not only an application runtime, not only a node, and not only an L2 integration. It is a coherent application platform that brings those pieces together into one stack.

That is the core difference. Scalus is designed to reduce assembly work, compress time-to-production, and give builders one integrated platform to build, test, launch, operate, and scale serious Cardano applications.

This is also why Scalus maps directly to Cardano’s next growth bottleneck. As protocol, liquidity, and capital continue to advance, the ecosystem needs an application layer that helps more teams ship faster,
operate more sovereignly, and scale more easily. Scalus is designed to be that layer.

---

### Annex 4: 2025 Retrospective

#### Overview

In 2025, Lantr Engineering received its first Cardano Treasury funding through the process facilitated by Intersect for the Scalus - dApps development platform project (EC-0020-25).

The objective was to deliver a Scala-based Cardano development platform that allows developers to write smart contracts, build transactions, and implement application logic using the same language and a familiar development environment.

The project was funded at ₳657,692, based on a reference rate of $0.65/ADA, for 6 months of development and 4.5 FTE.

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

The 2025 proposal used a reference rate of $0.65/ADA. During execution, ADA depreciated materially, creating real pressure on delivery capacity. Milestone disbursements were received at approximately:

- 15 Oct 2025 (Milestone 1): $0.67
- 15 Dec 2025 (Milestone 2): $0.39
- 15 Feb 2026 (Milestone 3): $0.28
- 29 Mar 2026 (Milestone 4): $0.24

Using actual disbursement prices for M1–M4 and assuming $0.30/ADA for
M5 and M6, the total effective purchasing power of ₳657,692 falls from an expected $427,499.80 to $237,950.41, a shortfall of $189,549.39.

The Intersect 2025 Treasury process did not provide an effective mechanism for hedging against adverse ADA price movement at the process level. Learning from the Amaru experience, where conversion into stablecoins was used effectively, made clear that proactive treasury management is necessary if delivery is to remain protected over long funding windows.

**Decisions**

For 2026, we decided to:
- Hedge at least part of the requested ADA into USD-denominated stablecoins to protect delivery against adverse price movement;
- Use concervative ADA/USD rate;
- Return any unused contingency to the Treasury at the end of the delivery period.

This is the direct origin of the conservative ADA pricing and refundable contingency model used in the 2026 Scalus proposal.

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
- (Done, Reporting) Milestone 5 – Advanced UPLC Optimisations
- (Done, Reporting) Milestone 6 – Accelerated E2E Development Cycle

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
- include a refundable contingency to protect delivery under uncertainty;
- focus milestones on outcomes and product utility, not only technical line items;
- preserve flexibility for R&D, adoption support, and reprioritisation within milestone scope.

The 2026 Scalus proposal is built directly on these observations and decisions.

---

## Supporting links

* Full proposal (PDF): https://ipfs.io/ipfs/QmcCjBYA8zrx5Khqbh6xraXQ23zrgaZxuzNewr1Ni6fck7
* Annex 1: Detailed Scope and Workstreams (PDF): https://ipfs.io/ipfs/QmQ6RiAPBZfuRqSh2bCS1HBBxSUoVoGob55bM43vimHxfJ
* Annex 2: Product Development Methodology (PDF): https://ipfs.io/ipfs/QmUzumqPk8YGNiwWMjnLrhsaLva6ya2Hsyr9YiRoEqAzQp
* Annex 3: Competitive Landscape (PDF): https://ipfs.io/ipfs/QmZ7acinH6gMtTSbmahvEKR61fWeLoeMPTuwxWHkwYzNDh
* Annex 4: 2025 Retrospective (PDF): https://ipfs.io/ipfs/QmaVmFXvbFnS5vjVtb9uuQugDU8tbqiWCe2QrZijbMCP6r
* Scalus website: https://scalus.org/ 
* Scalus repository: https://github.com/scalus3 
* Scalus js repository: https://www.npmjs.com/package/scalus 
* Scalus Club: https://luma.com/scalus 
* Lantr website: https://lantr.io/ 
* Hydrozoa repository: https://github.com/cardano-hydrozoa/hydrozoa 
* Hydrozoa technical specification: https://cardano-hydrozoa.github.io/hydrozoa/hydrozoa.pdf 
* Lean Blaster: https://input-output-hk.github.io/Lean-blaster/ 
* Lean Blaster repository: https://github.com/input-output-hk/Lean-blaster
* Proposal repository: https://github.com/lantr-io/scalus-treasury-proposal-2026
* Treasury-contracts framework - Sundae Swap: https://github.com/SundaeSwap-finance/treasury-contracts