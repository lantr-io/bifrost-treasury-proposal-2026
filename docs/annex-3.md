### Annex 3: 2025 Retrospective

#### Overview

In 2025, Lantr Engineering received its first Cardano Treasury funding through the process facilitated by Intersect for the Scalus - dApps development platform project (EC-0020-25).

The objective was to deliver a Scala-based Cardano development platform that allows developers to write smart contracts, build transactions, and implement application logic using the same language and a familiar development environment.

The project was funded at ₳657,692, based on a reference rate of \$0.65/ADA, for 6 months of development and 4.5 FTE.

This retrospective captures the main lessons from that cycle, what worked, what created friction, and which decisions directly shaped the design of the 2026 Scalus proposal.

#### 1. Budgeting Process

**Observations**

The 2025 budgeting cycle took much longer than the what was assumed in the original proposal.

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

#### 2. Contracting Framework

**Observations**

The contracting and legal support provided during the 2025 cycle was excellent. We would like to explicitly acknowledge the quality of assistance from the Intersect team in helping structure the contractual framework.

At the same time, the milestone-based contract model had several limitations for product-oriented work:
1. Upfront scope drafting forced a project-style execution model that is only partially compatible with product development.
2. Fixed delivery dates had to be defined at start.
3. Fixed disbursement windows: the funds could only be released on pre-defined schedules, typically no sooner than 30 days after the due date, and only after third-party assurance sign-off and additional administrative review.
4. While a change process existed, it was perceived by us as bureaucratically heavy and slow.

One useful feature of the 2025 structure was the kick-off milestone, which allowed initial withdrawal at the start of execution. This effectively funded the first month of operations for the team and enabled a stable start, while still remained refundable if the next milestone was not delivered on time.

**Decisions**

For the 2026 proposal, we decided to preserve what worked and improve what did not:
- Keep: a structure based on 4 milestones per year, rather than 5 milestones over 7 months. This creates more room for adaptation and product learning.
- Keep: an initial kick-off payment, with the next disbursement conditioned on delivery of the first quarterly objectives.
- Improve: milestone flexibility by allowing milestone updates where justified by learning, discovery, or user feedback, while protecting governance through oversight-board sign-off.
- Improve: disbursement timing, targeting a faster release of funds after accepted delivery.
- Keep: future fund unlocks conditioned on delivery evidence, delivery report, and third-party assurer review.

#### 3. Duration and Delivery Window

**Observation**

The original development plan assumed 6 months of execution (end of June-December 2026). Due to the budgeting process drifted significantly, and because the legal framework attached strict consequences to delivery delays, we introduced additional time buffer to cover the vacation periods + additional delivery risk protection.
This extended the contractual delivery window from 6 months to 7.5 months.

In practice, however, the team excelled at execution and completed all planned development work within the original 6-month engineering window.

The limitation was that milestone-based contracting made impossible to close milestones and receive disbursement earlier than the fixed contractual schedule. This created an artificial gap between:
- the point when work was actually completed;
- the formal milestone due date;
- and the further delay required for disbursement.

**Decisions**

For 2026, we decided to:
- Improve: move to quarterly milestones with clearly defined objectives and a flexible feature backlog inside each milestone;
- Keep: clearly defined objectives, technical deliverables, and explicit user-facing outcomes;
- Reduce: unnecessary granularity in milestone splitting, so the team can adapt more actively within a quarter without losing accountability.

#### 4. Financial Overview and ADA Volatility

**Observations**

The 2025 proposal used a reference rate of \$0.65/ADA. During execution, ADA depreciated materially, creating real pressure on delivery capacity. Milestone disbursements were received at approximately:

- 15 Oct 2025 (Milestone 1): \$0.67
- 15 Dec 2025 (Milestone 2): \$0.39
- 15 Feb 2026 (Milestone 3): \$0.28
- 29 Mar 2026 (Milestone 4): \$0.24

Using actual disbursement prices for M1–M4 and assuming \$0.30/ADA for
M5 and M6, the total effective purchasing power of ₳657,692 falls from an expected \$427,499.80 to \$237,950.41, a shortfall of \$189,549.39.

The Intersect 2025 Treasury process did not provide an effective mechanism for hedging against adverse ADA price movement at the process level. Learning from the Amaru experience, where conversion into stablecoins was used effectively, made clear that proactive treasury management is necessary if delivery is to remain protected over long funding windows.

**Decision**
For 2026, we decided to:
- Hedge at least part of the requested ADA into USD-denominated stablecoins to protect delivery against adverse price movement;
- Use concervative ADA/USD rate;
- Return any unused contingency to the Treasury at the end of the delivery period.

This is the direct origin of the conservative ADA pricing and refundable contingency model used in the 2026 Scalus proposal.

#### 5. Administration, Reporting, and Support During Delivery

**Observations**

Administrative support during execution was strong. The teams involved were responsive, helpful, and easy to work with. We encountered no material problems in administration during the delivery phase.

On our side, we provided detailed progress reports, delivery reports, and outcome summaries. These were shared with Intersect, made available through the Treasury dashboard, and communicated publicly through the Lantr and Scalus channels on X.

**Decisions**

For 2026, we decided to:
- Keep: the same transparency level;
- Keep: detailed public reporting;
- Keep: active communication of delivery progress and outcomes to the community.
  
#### 6. Third-Party Assurance

**Observations**

The third-party assurance process worked well. No.Witness Labs demonstrated strong responsiveness and took a serious, technically informed look at the delivered work.

**Decisions**

For 2026, we decided to continue with No.Witness Labs as our third-party assurance partner.

#### 7. Delivery Milestones vs Actual Delivery

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
- JS/TS toolset integration with MeshJS SDK and Evolution SDK;
- experimental boundary testing and scenario exploration testing;
- advanced data structure performance benchmarking;
- experimental Scalus JIT Plutus VM;
- ledger rules and conformance testing;
- in-memory Cardano node emulator for JVM/JS/TS;
- broader performance optimisations.

This confirmed a pattern that is important for product development: developers do not consume milestone structures, they consume outcomes. A proposal structure that is too fine-grained can overfit to reporting convenience while under-serving real product evolution.

**Decisions**

For 2026, we decided to:
- Improve: Increase milestone cadence to a quarterly rhythm;
- Improve: Refocus milestones on outcomes, not only technical sub-deliverables;
- Improve: Create space for active re-prioritisation within milestone objectives;
- Keep: Preserve room for R&D and adoption assistance inside the delivery window.


#### 8. Product Development Method

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
