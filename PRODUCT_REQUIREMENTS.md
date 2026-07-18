# PACT Product Requirements Specification

**Product name:** PACT  
**Full form:** Proof, Action, Coordination & Tracking  
**Core assurance module:** Proofline  
**Tagline:** From signal to verified outcome.  
**Hackathon:** OpenAI Build Week 2026  
**Proposed submission track:** Work & Productivity  
**Document status:** Implemented MVP baseline; release gates tracked in `docs/VERIFICATION.md`  
**Version:** 0.1  
**Date:** July 17, 2026

## 1. Executive summary

PACT is a governed, multi-agent business outcome system. It converts a consequential business signal into a verified diagnosis, a dependency-aware cross-team response, approved actions, and a measured outcome.

The Build Week demonstration focuses on one manufacturing scenario: On Time In Full (OTIF) performance declines from 84.3% to 72.4%. PACT must determine whether the decline is real, identify its principal operational causes, evaluate recovery strategies, coordinate actions across procurement, manufacturing, logistics, finance, and customer teams, require human approval for material actions, execute those actions through safe simulated tools, and measure whether the organization recovered.

Proofline is the first module in the workflow. It verifies that the business signal represents a real operational change rather than a reporting, data-quality, migration, or calculation defect.

PACT is not intended to replace human accountability or autonomously operate production enterprise systems. Its purpose is to help people move from uncertain signals to coordinated, evidence-backed action without losing visibility or control.

## 2. Product thesis

Businesses increasingly rely on metrics and AI-generated recommendations to make consequential decisions. Existing systems can report what changed, but they rarely provide a continuous, inspectable chain from:

1. signal,
2. evidence,
3. business impact,
4. coordinated decision,
5. approved action, and
6. measured outcome.

PACT is based on the following belief:

> AI should not merely produce business answers. It should earn the right for those answers to influence real decisions.

## 3. Product principles

### 3.1 Evidence before action

Every material conclusion must be linked to an observable source, executed query, test result, contract rule, approved policy, or explicit assumption.

### 3.2 Facts, inferences, simulations, decisions, actions, and outcomes are different

The product must label these states consistently. A predicted result must never be presented as an observed result, and a model inference must never be presented as a verified fact.

### 3.3 Human authority remains visible

Material actions require an explicit approval gate. The user must be able to inspect the proposed plan, assumptions, cost, evidence, dissent, and residual risks before approving it.

### 3.4 Separation of duties

An agent that proposes a diagnosis or plan cannot independently certify it. A separate Auditor must challenge the evidence, plan, and measured outcome.

### 3.5 Outcome over activity

Creating tasks, sending drafts, or updating plans is not success. Success is measured against a declared business target and constraints.

### 3.6 Minimum necessary autonomy

Agents receive only the tools and authority needed for their role. The MVP uses safe simulated tools and does not make changes to external production systems.

### 3.7 Narrow implementation, broad architecture

The Build Week product must execute one end-to-end scenario exceptionally well. Broader use cases are represented through reusable contracts and interfaces, not unfinished workflows.

## 4. Goals and non-goals

### 4.1 MVP goals

- Verify whether an OTIF deterioration is operationally real.
- Explain the most important contributors using inspectable evidence.
- Connect the deterioration to customer, revenue, cost, and operational consequences.
- Generate three bounded recovery strategies.
- Produce a coordinated plan across multiple teams with dependencies and owners.
- Enforce business constraints and human approvals.
- Execute an approved plan using deterministic simulated MCP tools.
- Advance a synthetic operating timeline and measure the resulting outcome.
- Compare projected and observed results.
- Preserve an auditable Outcome Ledger for the complete cycle.
- Demonstrate substantive use of GPT-5.6 and Codex.

### 4.2 Non-goals for Build Week

- Real Oracle Fusion, SAP, Snowflake, ERP, CRM, email, Teams, or carrier integrations.
- Autonomous production deployment or irreversible external action.
- Authentication, enterprise RBAC, tenant administration, or billing.
- General support for arbitrary KPIs or industries.
- A complete data observability, BI, workflow, or digital-twin platform.
- Causal claims that cannot be supported by the synthetic scenario.
- A photorealistic avatar or continuous voice conversation.
- Mobile-native applications.
- Training or fine-tuning a proprietary model.

## 5. Success criteria

The MVP is successful when a judge can complete the flagship scenario and understand, within three minutes:

1. what business signal changed,
2. whether the signal is trustworthy,
3. why the change matters,
4. which teams must respond,
5. what response options exist,
6. why a human must approve the selected plan,
7. what actions were executed, and
8. whether those actions produced the intended outcome.

The product must end with a measurable result, not merely a recommendation.

## 6. Personas

### 6.1 Executive outcome owner

**Example:** Chief Operating Officer or Vice President of Supply Chain.  
**Needs:** A clear verdict, business impact, response options, constraints, residual risks, and measured outcome.  
**Must not need:** SQL, dbt, or implementation knowledge.

### 6.2 Operations leader

**Example:** Plant manager or supply-chain director.  
**Needs:** Root contributors, affected orders, operational levers, dependencies, owners, and recovery progress.

### 6.3 Functional team owner

**Examples:** Procurement lead, logistics lead, finance controller, customer-success lead.  
**Needs:** Proposed action, rationale, required input, dependency, approval state, and expected contribution.

### 6.4 Data and analytics owner

**Needs:** Metric contract, lineage, validation results, source evidence, queries, and proof that the signal is not a data or calculation defect.

### 6.5 Auditor or AI governance reviewer

**Needs:** Complete evidence chain, assumptions, dissent, approvals, tool actions, predicted-versus-observed comparison, and immutable identifiers.

## 7. Flagship scenario

### 7.1 Scenario statement

The organization observes that OTIF declined from a historical baseline of 84.3% to 72.4%. Leadership asks:

> Is the decline real, what is causing it, what should we do, and did our actions work?

### 7.2 Verified contributors

The synthetic scenario must support the following evidence-backed contribution model:

- 41%: component shortages associated with Supplier Atlas.
- 27%: production sequencing delays at the Wilmington plant.
- 19%: missed pickups associated with Carrier Delta.
- 13%: other distributed causes.

These values are properties of the deterministic synthetic dataset. The application must derive or retrieve them through tools rather than place them only in presentation text.

### 7.3 Business impact

The scenario must include:

- 318 customer orders at risk.
- 42 strategic customers affected.
- Increased premium-freight exposure.
- Potential delayed-revenue exposure.
- Increased customer-escalation risk.

Financial values displayed in the UI must be marked as observed, calculated, or estimated. Estimates must show their assumptions.

### 7.4 Outcome target

- Baseline OTIF: 84.3%.
- Current OTIF: 72.4%.
- Interim recovery target: at least 81.0% by simulated Day 14.
- Final recovery target: at least 82.0% by simulated Day 21.
- Recovery period: 21 simulated days.
- Maximum incremental recovery budget: $75,000.
- Quality escape rate must not increase.
- Strategic customer orders must be prioritized.
- Unapproved suppliers must not be used.

## 8. Priority definitions

- **P0:** Required for the working submission and primary demo.
- **P1:** Important if P0 is stable; may materially improve judging.
- **P2:** Post-hackathon or optional enhancement.

## 9. End-to-end workflow

PACT must implement the following lifecycle:

1. Signal intake.
2. Objective confirmation.
3. Signal verification through Proofline.
4. Cause and impact analysis.
5. Strategy generation.
6. Cross-team plan construction.
7. Independent challenge.
8. Human approval.
9. Simulated execution.
10. Outcome monitoring.
11. Predicted-versus-observed review.
12. Learning and closeout.

The UI must preserve the state of each stage and prevent later stages from appearing complete before required predecessors are satisfied.

## 10. Functional requirements

### 10.1 Signal intake and objective definition

**FR-SI-001 — P0:** The user must be able to start the flagship scenario from a prepared incident card.  
**FR-SI-002 — P0:** The user must be able to enter a natural-language objective.  
**FR-SI-003 — P0:** The system must convert the request into a structured Outcome Contract containing objective, target, deadline, constraints, leading indicators, lagging indicators, and required approvals.  
**FR-SI-004 — P0:** The user must confirm or edit the Outcome Contract before investigation begins.  
**FR-SI-005 — P1:** The user may provide the objective through push-to-talk speech input.  
**FR-SI-006 — P0:** The system must preserve the confirmed contract version and calculate a content hash.

### 10.2 Proofline signal verification

**FR-PV-001 — P0:** Proofline must validate the OTIF metric definition against a checked-in metric contract.  
**FR-PV-002 — P0:** Proofline must evaluate data completeness, calculation grain, definition consistency, and historical-control reconciliation.  
**FR-PV-003 — P0:** Proofline must execute queries or tests that reproduce the current 72.4% value.  
**FR-PV-004 — P0:** Proofline must classify the signal as `verified_operational`, `data_defect`, `calculation_defect`, or `insufficient_evidence`.  
**FR-PV-005 — P0:** The flagship scenario must return `verified_operational`.  
**FR-PV-006 — P0:** Each verification result must include evidence identifiers and a human-readable explanation.  
**FR-PV-007 — P0:** The system must block recovery-plan approval if signal verification is incomplete or insufficient.  
**FR-PV-008 — P1:** A hidden evaluation fixture must verify that Proofline can recognize at least one intentionally corrupted metric scenario.

### 10.3 Cause analysis

**FR-CA-001 — P0:** The system must decompose the verified deterioration into ranked contributors.  
**FR-CA-002 — P0:** Each contributor must include affected entities, evidence, magnitude, owner, and uncertainty.  
**FR-CA-003 — P0:** The system must distinguish an observed association from a causal conclusion.  
**FR-CA-004 — P0:** The system must provide a minimal evidence path from source events to the OTIF effect.  
**FR-CA-005 — P1:** Specialist agents may investigate procurement, manufacturing, and logistics evidence in parallel.  
**FR-CA-006 — P0:** Agent summaries must return structured output and must not rely on free-form chat as the system of record.

### 10.4 Impact analysis

**FR-IA-001 — P0:** The system must identify affected orders, strategic customers, cost exposure, and service risk.  
**FR-IA-002 — P0:** Each impact must be labeled `fact`, `calculated`, `inferred`, or `estimated`.  
**FR-IA-003 — P0:** Estimated impacts must expose their underlying assumptions.  
**FR-IA-004 — P0:** The system must map each impact to a responsible or affected business team.  
**FR-IA-005 — P1:** The user must be able to filter impact by plant, supplier, carrier, customer tier, and order segment.

### 10.5 Strategy generation and simulation

**FR-SG-001 — P0:** PACT must generate three recovery strategies: margin-protecting, fastest-recovery, and balanced.  
**FR-SG-002 — P0:** Each strategy must include proposed actions, dependencies, cost, projected OTIF, time to impact, assumptions, and residual risks.  
**FR-SG-003 — P0:** Projected values must always be labeled `SIMULATED`.  
**FR-SG-004 — P0:** No strategy may violate hard Outcome Contract constraints.  
**FR-SG-005 — P0:** The Balanced strategy must remain within the $75,000 budget and project an OTIF result near 82.2% by Day 21.  
**FR-SG-006 — P0:** The simulation must be deterministic for a given dataset, strategy, and input parameter set.  
**FR-SG-007 — P1:** The user may adjust bounded parameters such as recovery budget, strategic-customer priority, premium-freight tolerance, and recovery deadline.  
**FR-SG-008 — P1:** Changes to strategy parameters must update the projected result and action graph without implying that the result is observed.

### 10.6 Cross-team coordination

**FR-CT-001 — P0:** The selected strategy must produce a dependency-aware Action Graph.  
**FR-CT-002 — P0:** Every action must include owner, rationale, required inputs, predecessor dependencies, approval requirement, expected contribution, and status.  
**FR-CT-003 — P0:** The flagship plan must coordinate procurement, manufacturing, logistics, finance, and customer teams.  
**FR-CT-004 — P0:** A dependent action must not execute before required predecessor conditions are satisfied.  
**FR-CT-005 — P0:** The system must identify and display cross-team conflicts or resource constraints.  
**FR-CT-006 — P1:** Team agents may express structured dissent or propose a bounded revision.  
**FR-CT-007 — P0:** The Outcome Lead must consolidate team actions into a single plan without hiding unresolved dissent.

### 10.7 Independent challenge

**FR-CH-001 — P0:** An Auditor distinct from proposing agents must challenge the signal evidence and selected strategy.  
**FR-CH-002 — P0:** The Auditor must test contract compliance, unsupported assumptions, dependency completeness, cost bounds, and optimistic projections.  
**FR-CH-003 — P0:** Auditor findings must be categorized as blocking, material, or advisory.  
**FR-CH-004 — P0:** Blocking findings must prevent approval.  
**FR-CH-005 — P0:** The UI must display both the proposed plan and the Auditor's dissent before approval.  
**FR-CH-006 — P1:** The Auditor should generate at least one counterfactual scenario that tests the plan under reduced supplier or carrier performance.

### 10.8 Human approval

**FR-AP-001 — P0:** Material action execution must require an explicit approval interaction.  
**FR-AP-002 — P0:** The approval view must show objective, actions, dependencies, projected outcome, cost, assumptions, residual risks, and Auditor findings.  
**FR-AP-003 — P0:** The user must be able to approve, reject, or request revision.  
**FR-AP-004 — P0:** Approval must record approver display identity, timestamp, contract version, plan version, and decision.  
**FR-AP-005 — P0:** The MVP must clearly state that approval operates in a synthetic demonstration environment.  
**FR-AP-006 — P1:** The approval artifact should be included in the final Outcome Ledger.

### 10.9 Simulated execution

**FR-EX-001 — P0:** Approved actions must execute through explicit simulated business tools rather than by directly mutating UI state.  
**FR-EX-002 — P0:** Simulated tools must expose stable, inspectable request and response schemas.  
**FR-EX-003 — P0:** The minimum tool set must support finance authorization, alternate-supplier commitment, production resequencing, carrier reservation, customer-communication drafting, and work-item creation.  
**FR-EX-004 — P0:** Every tool call must produce a correlated Action Ledger event.  
**FR-EX-005 — P0:** Tools must reject calls that lack required approval or predecessor state.  
**FR-EX-006 — P0:** Customer communication must remain a draft and must not be sent externally.  
**FR-EX-007 — P1:** Simulated tools should be exposed through a local MCP server.  
**FR-EX-008 — P1:** The user may inspect the tool request and response associated with an action.

### 10.10 Outcome monitoring and learning

**FR-OM-001 — P0:** The user must be able to advance the synthetic scenario through Day 3, Day 7, Day 14, and Day 21.  
**FR-OM-002 — P0:** Each time point must update leading indicators, action status, and measured OTIF using deterministic synthetic events.  
**FR-OM-003 — P0:** The product must show projected and observed values side-by-side.  
**FR-OM-004 — P0:** After the Balanced plan is executed, the flagship scenario must reach approximately 81.5% observed OTIF by Day 14 and 82.1% by Day 21.  
**FR-OM-005 — P0:** The system must explain material differences between projected and observed outcomes.  
**FR-OM-006 — P0:** The Auditor must evaluate whether the target was met and which assumptions held or failed.  
**FR-OM-007 — P0:** The system must generate a closeout containing outcome, variance, lessons, unresolved risks, and recommended next action.  
**FR-OM-008 — P1:** The user must be able to scrub through the outcome timeline and inspect state at each checkpoint.

### 10.11 Outcome Ledger

**FR-OL-001 — P0:** The system must maintain a correlated record of contract versions, evidence, findings, strategies, actions, approvals, tool calls, simulations, observations, and closeout.  
**FR-OL-002 — P0:** Every ledger entry must include event ID, timestamp, event type, source, status, and correlation ID.  
**FR-OL-003 — P0:** The system must export a machine-readable JSON artifact.  
**FR-OL-004 — P1:** The system should export a human-readable Markdown proof report.  
**FR-OL-005 — P1:** Exported artifacts should include hashes for the Outcome Contract, source dataset version, and plan version.  
**FR-OL-006 — P0:** The product must describe the artifacts as traceable or tamper-evident only when technically supported; it must not claim formal certification.

### 10.12 Voice and briefing

**FR-VO-001 — P1:** The user may start an objective using push-to-talk input.  
**FR-VO-002 — P1:** The system may provide a 15-to-20-second spoken executive briefing after verification.  
**FR-VO-003 — P1:** The system may provide a spoken outcome briefing after closeout.  
**FR-VO-004 — P1:** All spoken output must have synchronized visible text.  
**FR-VO-005 — P1:** Speech must be optional, muteable, and must not block the primary workflow.  
**FR-VO-006 — P0:** A photorealistic or human talking avatar is excluded from the MVP.

### 10.13 Codex-native extension

**FR-CX-001 — P0:** The repository must include an `AGENTS.md` defining build, test, evidence, safety, and completion rules.  
**FR-CX-002 — P0:** The primary Build Week development session must use Codex for core implementation and preserve the required `/feedback` session ID.  
**FR-CX-003 — P0:** GPT-5.6 must be used for substantive reasoning in the product or demonstrated development workflow.  
**FR-CX-004 — P1:** PACT should be packaged as a local Codex plugin.  
**FR-CX-005 — P1:** The plugin should include an `investigate-and-recover-outcome` skill.  
**FR-CX-006 — P1:** The plugin should expose safe simulated business tools through MCP.  
**FR-CX-007 — P1:** Specialist investigation or review work may use Codex subagents where tasks are independent.  
**FR-CX-008 — P0:** Agent outputs consumed by the application must conform to explicit schemas.  
**FR-CX-009 — P0:** Agent implementation must not depend on fabricated terminal activity or prewritten chat transcripts.  
**FR-CX-010 — P0:** The README must explain precisely where Codex and GPT-5.6 are used.

## 11. Agent roles and authority

### 11.1 Outcome Lead

**Responsibilities:** Maintain the Outcome Contract, coordinate specialists, consolidate the plan, expose conflicts, and track completion.  
**May:** Read evidence, invoke analysis tools, request specialist work, and propose a consolidated plan.  
**May not:** Approve the plan, execute material actions, or certify success.

### 11.2 Proof Investigator

**Responsibilities:** Verify the metric and distinguish operational change from reporting or calculation defects.  
**May:** Read contracts, data, code, lineage, and tests; execute read-only validation.  
**May not:** Change source data, repair production code, or approve a conclusion.

### 11.3 Procurement Specialist

**Responsibilities:** Analyze supplier evidence and propose component-recovery options.  
**May not:** Commit spend or select an unapproved supplier.

### 11.4 Manufacturing Specialist

**Responsibilities:** Analyze production adherence, capacity, and sequencing options.  
**May not:** change the simulated schedule before plan approval.

### 11.5 Logistics Specialist

**Responsibilities:** Analyze missed pickups, capacity, and carrier alternatives.  
**May not:** reserve capacity before plan approval and prerequisite confirmation.

### 11.6 Finance and Policy Specialist

**Responsibilities:** Evaluate cost, constraints, approval thresholds, and financial assumptions.  
**May:** block plans that violate hard constraints.  
**May not:** approve its own proposed financial action.

### 11.7 Customer Impact Specialist

**Responsibilities:** Identify affected customers and draft communication actions.  
**May not:** send external communication.

### 11.8 Independent Outcome Auditor

**Responsibilities:** Challenge signal verification, strategy assumptions, policy compliance, dependencies, projections, and measured results.  
**May:** issue blocking, material, or advisory findings.  
**May not:** modify the proposed plan directly, execute actions, or approve the plan.

## 12. Contract requirements

### 12.1 Metric Contract

The metric contract must contain:

- Metric identifier and name.
- Business purpose.
- Owner.
- Entity grain.
- Numerator and denominator definitions.
- Exclusions.
- Dimensions.
- Invariants.
- Historical control.
- Tolerance.
- Version and hash.

### 12.2 Outcome Contract

The Outcome Contract must contain:

- Outcome identifier.
- Objective.
- Business claim or signal.
- Baseline, current value, target, and deadline.
- Hard and soft constraints.
- Leading and lagging indicators.
- Business consequences.
- Required evidence.
- Required approvals.
- Permitted tools or action classes.
- Version, status, and hash.

### 12.3 Action Contract

Every material action must contain:

- Action identifier.
- Description and owner.
- Rationale and supporting evidence.
- Preconditions and dependencies.
- Input parameters.
- Estimated cost and effect.
- Approval requirement.
- Tool operation.
- Execution status and result.
- Rollback or recovery description where applicable.

## 13. UI and UX requirements

### 13.1 Experience model

The product must feel like an Outcome Room rather than a chatbot or conventional dashboard. The organization and outcome should visibly change state as evidence, decisions, and actions progress.

### 13.2 Primary surfaces

#### Surface A: Signal and objective

- Show the disputed or deteriorating KPI.
- Accept natural-language or optional voice input.
- Present the structured Outcome Contract for confirmation.

#### Surface B: Proof Canvas

- Show metric-integrity checks and their status.
- Allow evidence drill-down.
- Display the verification verdict prominently.

#### Surface C: Impact Map

- Connect the KPI to causes, customers, teams, cost, and service consequences.
- Allow selection of an impact path to inspect evidence and ownership.

#### Surface D: Strategy Sandbox

- Compare three strategies.
- Clearly label simulated results.
- Allow bounded parameter changes if P1 is implemented.

#### Surface E: Approval Gate

- Pause the experience visually.
- Show the complete decision packet and Auditor dissent.
- Support approve, reject, and request-revision actions.

#### Surface F: Action Graph

- Display action dependencies, owners, status, and blockers.
- Animate state change only when real simulated tool events occur.

#### Surface G: Outcome Replay

- Provide Day 0, 3, 7, 14, and 21 checkpoints.
- Compare projected and observed values.
- Show lessons and unresolved risks.

### 13.3 Visual language

- Near-black graphite background and deep navy surfaces.
- Cyan for observed evidence.
- Violet for reasoning or inference.
- Amber for assumptions, simulation, and unresolved uncertainty.
- Emerald for independent verification.
- Red for failure, policy violation, or blocking risk.
- White decision ring for human approval.
- Monospaced numerals for KPIs, evidence identifiers, hashes, and tool operations.
- Motion must communicate state, causality, dependency, or progress.
- Avoid cartoon robots, human agent portraits, generic chat bubbles, decorative terminal output, excessive particles, and gratuitous 3D scenes.

### 13.4 Intelligence Core

**P1:** The UI may include a non-human abstract visual presence. Its animation must correspond to system state such as listening, investigating, simulating, awaiting approval, executing, or monitoring. It must not obscure evidence or controls.

### 13.5 Accessibility

- All essential information must be available without color alone.
- All motion must respect reduced-motion preferences.
- Keyboard navigation must support the primary demo workflow.
- Spoken content must have text equivalents.
- Contrast must meet WCAG AA targets where practical.
- Interactive graph content must have a readable list or detail alternative.

## 14. Synthetic data and simulation

### 14.1 Required entities

The synthetic environment should include:

- Orders and order lines.
- Customers and customer tiers.
- Products and components.
- Suppliers and agreements.
- Plants, work centers, and production orders.
- Shipments, carriers, and pickups.
- Calendar and promise dates.
- Team ownership.
- Recovery actions and approvals.

### 14.2 Determinism

- Data generation must accept a fixed seed.
- The same seed, contract, and strategy must return the same result.
- Demonstration numbers must be reproducible from a clean setup.
- The repository must include setup and reset commands.

### 14.3 Simulation boundaries

- The simulation must be described as a model of the scenario, not a production prediction engine.
- Projected impact must remain separate from observed synthetic outcome.
- Time advancement must be user-controlled.
- The simulation must expose at least one variance between projection and observation for the Auditor to explain.

## 15. Technical constraints

- The solution must run locally from a clean clone using documented commands.
- The primary demo must work without external enterprise credentials.
- Synthetic data and mock tools must be included in the repository.
- External model or speech credentials must be configured through environment variables and never committed.
- The application must provide a deterministic demonstration mode if optional speech services are unavailable.
- Core application state must be persisted or reproducibly reconstructed for the complete demo flow.
- Agent prompts, contracts, schemas, and evidence rules must be version-controlled.
- The system must favor a deterministic workflow over an unconstrained autonomous loop.

## 16. Non-functional requirements

### 16.1 Performance

- Initial scenario load should complete within 5 seconds on the target demo machine.
- Each primary UI transition should provide visible state feedback within 500 milliseconds.
- The complete prepared investigation should finish within 60 seconds under normal demo conditions, or provide an accelerated deterministic replay mode based on artifacts from a genuine run.
- Strategy comparison should render within 3 seconds after results are available.

### 16.2 Reliability

- The primary demo must be repeatable from a reset state.
- Agent or tool failure must produce a visible error state and recovery option.
- A failed specialist must not be silently treated as successful.
- Approval and execution state must survive a page refresh where practical.
- The repository must include automated tests for contracts, dependencies, tool authorization, and scenario results.

### 16.3 Security and governance

- Material tools must require an approved plan identifier.
- Tools must validate inputs against schemas.
- Tool calls must be logged without exposing secrets.
- Agents must not receive unrestricted arbitrary database or filesystem access through business MCP tools.
- The Auditor must use read-only access.
- External communication must remain draft-only.
- The UI must clearly distinguish demonstration identities and simulated approvals from production controls.

### 16.4 Observability

- Every agent run and tool call must have a correlation ID.
- The application must log stage start, completion, failure, duration, and outcome.
- Agent output validation failures must be observable.
- The UI should expose a concise execution timeline without presenting fabricated reasoning traces.

### 16.5 Maintainability

- Contracts and schemas must be separate from application code.
- Specialist roles must have focused instructions.
- Synthetic adapters must implement stable interfaces that can later be replaced by real connectors.
- Business logic used to calculate scenario outcomes must be testable without the UI.

## 17. Evaluation requirements

### 17.1 Deterministic tests

The automated test suite must cover:

- Metric-contract parsing and validation.
- Outcome-contract parsing and validation.
- OTIF baseline and current-value reproduction.
- Strategy constraint enforcement.
- Action dependency ordering.
- Approval required before material tool execution.
- Customer communication remains draft-only.
- Outcome timeline reaches expected deterministic checkpoints.
- Outcome Ledger contains all required event types.

### 17.2 Agent evaluation

The evaluation set should measure:

- Correct classification of operational versus metric defects.
- Evidence citation completeness.
- Unsupported factual claims.
- Hard-constraint compliance.
- Action dependency completeness.
- Agreement between agent output and structured schemas.
- Auditor detection of a deliberately optimistic or non-compliant plan.

### 17.3 Demo verification

Before recording, the team must:

- Run from a clean clone.
- Reset and regenerate the synthetic scenario.
- Complete the primary workflow without manual database changes.
- Verify every displayed number against the deterministic scenario.
- Run automated tests.
- Verify optional speech failure does not block the demo.
- Confirm the public repository contains no secrets.

## 18. Demo acceptance criteria

The recorded demonstration must show:

1. OTIF deterioration and business stakes.
2. Structured Outcome Contract.
3. Proofline verification that the deterioration is real.
4. Ranked operational contributors and impact.
5. Three recovery strategies.
6. Cross-team Action Graph.
7. Independent Auditor challenge.
8. Human approval.
9. Simulated tool execution.
10. Time advancement.
11. Projected-versus-observed outcome.
12. Outcome Ledger or proof report.

The video must explain where Codex and GPT-5.6 perform substantive work. The primary story must remain understandable without reading source code.

## 19. Definition of done for Build Week

The submission is done when:

- The P0 end-to-end workflow is operational.
- The scenario is deterministic and resettable.
- All P0 automated tests pass.
- The UI provides executive and evidence views.
- Agent outputs use validated schemas.
- Material execution is approval-gated.
- The Auditor is implemented separately from proposing roles.
- The repository contains setup instructions, architecture overview, contracts, sample data, limitations, and testing guidance.
- Installation and judge-testing instructions are complete.
- The public demo video is under three minutes.
- The repository is public with appropriate licensing, or private access is granted as required by the challenge.
- The Codex `/feedback` session ID is captured.
- The Devpost submission accurately describes implemented versus future capabilities.

## 20. Major risks and mitigations

| Risk | Consequence | Mitigation |
|---|---|---|
| Scope expands into a general enterprise platform | Incomplete core demo | Enforce one KPI, one scenario, and one outcome loop |
| Multi-agent behavior becomes theatrical | Low technical credibility | Require structured evidence, tools, and distinct authority |
| Model output is inconsistent | Demo failure | Use schemas, deterministic tools, bounded prompts, and replay artifacts |
| Synthetic scenario appears hard-coded | Weak technical score | Derive numbers through executable data and include hidden evaluation fixtures |
| Simulation is mistaken for prediction | Trust problem | Label all projections and state assumptions visibly |
| Voice or animation consumes schedule | Core workflow remains incomplete | Treat speech and Intelligence Core as P1 |
| UI becomes a dense dashboard | Weak product experience | Organize around the Outcome Twin and progressive disclosure |
| Real integrations create authentication failures | Judge cannot run project | Use local simulated MCP adapters with stable contracts |
| Product claim is too broad | Credibility loss | Present broad vision but explicitly state the implemented boundary |

## 21. Future product direction

After Build Week, the same contract and ledger model may support:

- Revenue, margin, forecast, and financial-close assurance.
- Procurement and supplier-risk decisions.
- Quality, maintenance, and production recovery.
- Product-delivery and portfolio decisions.
- Compliance and policy-driven actions.
- Customer-retention and service-recovery workflows.
- Real ERP, data-platform, work-management, communication, and approval connectors.
- Reusable organizational outcome playbooks.
- Longitudinal learning across projected and observed outcomes.

These capabilities are vision items and must not be represented as implemented in the Build Week submission.

## 22. Initial decision log

| Decision | Status | Rationale |
|---|---|---|
| PACT is the product name | Accepted for MVP | Captures Proof, Action, Coordination, and Tracking |
| Proofline is the verification module | Accepted for MVP | Preserves the evidence-first concept |
| Submit to Work & Productivity | Proposed | Business outcome focus is broader than a pure developer tool |
| Use OTIF manufacturing recovery | Accepted for MVP | Authentic to domain expertise and easy to demonstrate visually |
| Use a synthetic deterministic environment | Accepted for MVP | Reliable, safe, and judge-testable |
| Require human approval | Accepted for MVP | Core governance belief and product differentiator |
| No human avatar | Accepted for MVP | Avoids distraction and integration risk |
| Speech is optional P1 | Accepted for MVP | Adds executive accessibility without blocking the core |
| Build one complete outcome loop | Accepted for MVP | Maximizes quality within the available time |
