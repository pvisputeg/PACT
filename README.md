# PACT - Enterprise Outcome Operating System

PACT turns a consequential business signal into verified evidence, an independently challenged decision, bounded human authority, coordinated action, a measured outcome, and reusable learning.

The core belief is simple: make **AI accountable for the business outcome**, while keeping authority with people and enforcement in deterministic policy.

## Operation Northstar

The end-to-end flagship is a fixed-seed Synthetic disruption at Aurelis Industrial Systems. Copper Alloy C-17 for Northstar Plant 7 is diverted by 12 days, threatening 318 orders, 42 strategic customers, and $8.7M of committed NX-400 revenue.

PACT:

1. verifies the diversion and reconciles 8.1 ERP coverage days to 5.4 usable days;
2. maps the cascade across shipment, inventory, machines, lines, workforce, orders, customers, finance, logistics, and quality;
3. rejects Speed First for exceeding $420K and Cost First for missing the 95% target;
4. routes a strict structured packet to a separate Auditor role—GPT-5.6 when a genuine artifact is loaded, or an explicitly labeled no-API fixture for free local evaluation;
5. requires a named Plant COO to approve a condition-bound Action Contract;
6. rejects premature supplier commitment with `Action blocked: Required quality authorization is missing.`;
7. executes ten local synthetic commitments across eight functions in dependency order; and
8. closes at 96.1% observed synthetic revenue protection for $389K, versus a 95% target and 96.4% simulation.

No production systems are connected. Customer communications are drafts and cannot be sent.

## Product surfaces

- Enterprise Mission Control with a ranked outcome portfolio.
- Northstar Plant 7 Digital Twin with selectable operating layers and a seven-domain cascade.
- Investigation, Outcome Contract, Proofline, impact, strategy, independent audit, authorization, Action Graph, measurement, and closeout.
- Executive Outcome Ledger with progressive technical provenance.
- Twelve-stage guided replay designed for a sub-three-minute demo.
- Local PACT Codex plugin and stateful safe MCP tools.
- Optional OpenAI Agents SDK generator with distinct Outcome Lead and Auditor roles, strict Zod outputs, linked traces, resumable checkpoints, and a project cap below $5.
- Runtime artifact boundary that validates before display, rejects stale or malformed genuine output, exposes response/trace IDs and cost, and permits transparent fixture fallback only in automatic mode.

## Run locally for free

```powershell
npm install
npm run judge:verify
npm run dev
```

Open:

`http://localhost:5173/?scenario=northstar&artifact=fixture&reset=1`

The fixture path is visibly labeled `LOCAL SCHEMA FIXTURE · NO API CALL`. It is never presented as GPT-5.6 evidence.

Artifact modes are explicit:

- `?artifact=fixture`: strict Northstar fixture only; zero API calls.
- `?artifact=genuine`: genuine artifact only; malformed or stale output fails closed with no fallback.
- omit `artifact` or use `?artifact=auto`: prefer a valid genuine Northstar artifact, otherwise disclose the rejection and use the strict fixture.
- `?artifact=none`: disable model-artifact loading and preserve only the deterministic workflow.

## Verification

```powershell
npm run reset
npm test
npm run verify:mcp
npm run validate:plugin
npm run generate:agents:dry-run
npm run verify:gpt-artifact
npm run verify:demo
npm run verify:submission
npm run build
npm run verify:dist
npm run release:audit
```

`npm run reset` verifies the authoritative data in `data/northstar-material-recovery.scenario.json`. Tests reproduce the business math, graph acyclicity, independent audit, human authority, unsafe rejections, versioned saved-state recovery, state transitions, observed closeout, ledger, and replay.

## Optional genuine GPT-5.6 artifact

The checked-in free fixture costs nothing. To intentionally generate a fresh Northstar artifact:

Set `OPENAI_API_KEY` in your current PowerShell session, then intentionally run:

```powershell
npm run generate:agents
```

The generator uses `@openai/agents` with high reasoning, separate proposal and audit calls, strict schemas, no business tools, linked response and trace IDs, checkpoint resume, cost reservations, and a hard project cap under $5. The Strategy and Audit screens consume accepted artifacts through the same strict runtime schema and show their provenance. A historical artifact from the earlier prototype is rejected rather than relabeled as Northstar evidence.

Resume checkpoints are bound to the exact scenario, model, and immutable evidence-packet hash. `npm run generate:agents:resume` fails before making a paid audit call if a checkpoint came from another scenario or an earlier packet revision.

## Repository map

- `data/`: authoritative deterministic Northstar scenario.
- `contracts/`: metric, outcome, action, plan, and audit schemas.
- `src/domain/`: verification, policy, graph, twin-state, ledger, and measurement logic.
- `src/App.tsx`: the connected executive experience.
- `plugins/pact/`: Codex plugin, skill, shared runtime, and safe local MCP server.
- `scripts/`: judge checks, artifact generation, cost controls, and release audit.
- `docs/`: architecture, judge path, demo script, and submission narrative.

## Safety boundary

Models propose and challenge. A named human authorizes. Deterministic guards validate proof, plan identity, audit conditions, scope, spend, suppliers, quality, predecessors, production readiness, and draft-only communication. All identities, business records, observations, and tool results are synthetic.
