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
