---
name: investigate-and-recover-outcome
description: Investigate a consequential business KPI, verify the signal, coordinate a governed cross-team recovery plan, execute only approved safe actions, and measure the resulting outcome. Use when the user asks whether a KPI is real, why it changed, what teams should do, or whether corrective action worked.
---

# Investigate and recover an outcome

Use PACT as an evidence-to-outcome workflow, not as a general chat persona.

## Operating sequence

1. Establish an Outcome Contract containing the signal, target, deadline, constraints, indicators, and required approvals.
2. Confirm the contract with the user before material investigation or action.
3. Run Proofline checks against the Metric Contract and classify the signal as `verified_operational`, `data_defect`, `calculation_defect`, or `insufficient_evidence`.
4. If the signal is not verified, stop recovery planning and explain the missing or defective evidence.
5. Rank contributors and impacts. Label every statement as fact, calculated, inferred, estimated, simulated, or observed.
6. Generate margin-protecting, fastest-recovery, and balanced strategies. Enforce hard constraints deterministically.
7. Build a cross-team Action Graph with owners, dependencies, approvals, costs, expected contributions, and recovery paths.
8. Ask an independent Auditor to challenge unsupported assumptions, missing dependencies, policy violations, and optimistic projections.
9. Present the complete decision packet and require explicit human approval before material tool calls.
10. Execute safe tools in dependency order, recording correlated ledger events.
11. Advance the synthetic timeline only when requested and compare simulated projections with observed synthetic outcomes.
12. Close with the target result, variance, lessons, residual risks, and next action.

## Evidence discipline

- Cite evidence IDs for material conclusions.
- Never present association as proven causation.
- Never present a simulated projection as an observed result.
- Do not reveal hidden reasoning. Provide concise rationale, assumptions, evidence, dissent, and results.
- Treat all included business actions and identities as synthetic demonstrations.

## Authority limits

- Do not approve a plan on the user's behalf.
- Do not execute a material action without an approved plan identifier.
- Do not use unapproved suppliers.
- Do not send customer communication; create a draft only.
- The Auditor may block or challenge but may not modify, approve, or execute the plan.
