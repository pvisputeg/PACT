# PACT architecture - Operation Northstar

PACT is the governance and outcome layer above an operating twin. It is not an ERP, a supply-chain dashboard, or an autonomous agent.

```text
Enterprise Mission Control
        |
Northstar Plant 7 Digital Twin
        |
Investigation -> Outcome Contract -> Proofline -> Impact
        |
Outcome Lead proposal -> immutable packet -> independent Auditor
        |
Named human Action Contract
        |
Deterministic policy runtime -> dependency-ordered synthetic tools
        |
Observations -> closeout -> ledger -> replay -> learning
```

## Source-of-truth boundaries

- `data/northstar-material-recovery.scenario.json` contains the fixed-seed enterprise, plant, material, evidence, impact, strategy, audit, action graph, observations, closeout, learning, and replay records.
- `contracts/` defines metric, outcome, action, plan, and audit boundaries independently of React.
- `src/domain/engine.ts` reproduces usable inventory, strategy compliance, immutable audit packets, readiness, plant state, protected value, execution, and ledger events.
- `plugins/pact/runtime/pact-runtime.mjs` is the shared safe runtime used by the React domain and local MCP server.
- `src/domain/ai-artifact.ts` is the runtime artifact boundary. It validates genuine and fixture artifacts with the same strict schema before React can consume them, fails closed in explicit genuine mode, and discloses any automatic fallback.
- `src/domain/workflow-storage.ts` validates a versioned, scenario-bound state envelope before persistence or restore. Corrupt, stale, or policy-impossible browser state is rejected, reset to the governed baseline, and disclosed in the UI and ledger.
- `src/App.tsx` presents the connected executive experience; it does not own a second set of business results.

## Authority model

The Outcome Lead and independent Auditor have no business tools. They produce strict structured output. The Auditor receives a sealed packet and cannot edit the plan. Morgan Ellis, Plant COO, is the named decision authority. Deterministic guards alone unlock and execute synthetic operations.

Agents SDK plan checkpoints are cryptographically bound to the scenario ID, model, and serialized immutable evidence packet. Resume refuses stale or cross-scenario checkpoints before reserving or invoking the Auditor.

Accepted model output is visible on Strategy and Audit as judgment evidence: recommendation, assumptions, counterfactual challenge, response ID, trace ID, provider, and estimated cost. It can add ledger provenance, but it cannot approve a contract, grant scope, execute a tool, or calculate the final observation. Malformed or stale output is never consumed.

Every material request requires:

- verified material risk;
- the exact plan ID;
- all five adopted audit conditions;
- named human approval;
- approved parameters and suppliers;
- completed predecessors; and
- unchanged communication and quality safeguards.

## Evidence model

Material statements carry evidence IDs and a label: `FACT`, `CALCULATED`, `INFERRED`, `ESTIMATED`, `SIMULATED`, or `OBSERVED`. The system never promotes a projection into an observation and never claims exclusive causation from temporal association.

## Deterministic result

The authoritative closeout is 96.1% observed synthetic committed revenue protected, $389,000 final spend, zero strategic customers lost, zero quality incidents, and zero unauthorized customer communications. Target is 95.0%; simulation is 96.4%.
