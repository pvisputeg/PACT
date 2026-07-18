# Judge guide

PACT is a Work & Productivity submission for OpenAI Build Week. It runs as a deterministic synthetic sandbox without enterprise credentials or paid services.

## Fastest verification

Requirements: Node.js 20 or later and npm.

```bash
npm ci
npm run judge:verify
npm run dev
```

Open http://localhost:5173.

For a free test of the schema-validated plan and audit presentation, open http://localhost:5173/?artifact=fixture. The bundled input is prominently labeled as a local fixture and is never accepted as GPT-5.6 evidence.

`judge:verify` reproduces the scenario, runs all domain tests, exercises the stateful MCP approval and dependency chain, validates the Codex plugin, checks the GPT-5.6 request boundary without credentials, and creates the production bundle.

## Ninety-second product path

1. Confirm the Outcome Contract.
2. Inspect Proofline's four controls and reproduced 72.4% OTIF.
3. Map the operational and financial impact.
4. Compare all three simulations and keep Balanced recovery selected.
5. Review independent audit findings and approve the synthetic plan.
6. Execute `ACT-001` through `ACT-006` as each dependency becomes ready.
7. Observe the outcome, then select Day 7, Day 14, and Day 21.
8. Inspect the 82.1% observed synthetic result, 82.2% simulated projection, variance lesson, proof report, and Outcome Ledger.

No control in this path connects to a live ERP, supplier, carrier, customer, or financial system.

## Codex plugin

Supported platform: Codex desktop with Node.js 20 or later.

The repository includes a repo-scoped marketplace at `.agents/plugins/marketplace.json`. Restart Codex with the repository open, install **PACT** from **PACT Build Week**, then invoke the `investigate-and-recover-outcome` skill. The zero-dependency MCP server uses the bundled synthetic scenario.

The plugin can also be tested directly without installation or rebuilding:

```bash
npm run validate:plugin
npm run verify:mcp
```

## GPT-5.6 boundary

The GPT integration uses two separate GPT-5.6 Responses API calls: Outcome Lead synthesis and Independent Auditor challenge. Before submission, the generated artifact must pass the strict local schema and release audit; the reviewed public artifact then ships with response IDs for provenance. Model output cannot approve a plan or execute a tool.

The request contract can be inspected without an API key:

```bash
npm run generate:agents:dry-run
```

## Safety and truthfulness

- Every scenario value is synthetic and fixed-seed.
- Fact, calculation, estimate, simulation, decision, action, and observation remain separately labeled.
- Human approval is required before material simulated tools unlock.
- Customer communication is draft-only.
- PACT does not claim formal causal inference or production integration.
