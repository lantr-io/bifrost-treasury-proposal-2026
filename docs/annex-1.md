### Annex 1: Detailed Scope and Workstreams

The tables below detail every component this proposal funds, grouped by workstream. By May 2027, "production-ready" across the platform means meeting measurable criteria per workstream. These criteria are tracked quarterly and reported alongside milestone deliveries.

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

#### NOD — L1 Cardano Node (3.0 FTE)

| Code  | Component | Description|
|-------|-----------|------------|
| NOD1  | Networking / mini-protocols | N2N and N2C mini-protocols with peer discovery and management. Lets the node participate in the Cardano P2P network and serve client applications over the standard interfaces. |
| NOD2  | Ledger & conformance | Conway+ ledger rules with an era transition framework. Lets the node validate blocks and maintain ledger state across protocol upgrades. Includes Dijkstra hard fork readiness (Plutus V4, new builtins, updated cost models) and conformance testing aligned with the Node Diversity initiative.  |
| NOD3  | Plutus VM | Scalus CEK machine evaluating UPLC scripts for V1–V4. Lets the node execute and cost smart contracts during validation.|
| NOD4  | Bootstrap | Mithril-based snapshot import for rapid initial synchronisation. Lets operators bring a node online in hours instead of days without full chain replay. |
| NOD5  | Storage | Pluggable on-disk backends for chain history, ledger snapshots, and indices (RocksDB, in-memory, IndexedDB). Lets the node persist state durably across crashes and target multiple deployment environments. |
| NOD6  | Consensus | Ouroboros chain selection, VRF leader checks, and fork resolution. Lets the node maintain the same chain as the rest of the network under Byzantine conditions. |
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
| USE4 | Training program | Training programs for beginners and advanced users. |
| USE5 | LLM/AI readiness | MCP integration; agents; LLM/AI-friendly APIs and documentation. |


#### Operations, Support & Assurance

| Code | Workstream | FTE | Description |
|------|------------|-----|-------------|
| MAN  | Maintenance | 0.5 | Cross-cutting maintenance, bug fixing, and support across all workstreams. |
| PM   | Product management | 1.0 | Product lifecycle management, partner and user coordination. |
| MAR  | Ecosystem Outreach & Adoption | Fixed | Ecosystem communication and outreach, events, adoption support. |
| AUD  | Technical audits & third-party assurance | Fixed | External security and financial audits, independent technical review and assurance, security bounty program. |
