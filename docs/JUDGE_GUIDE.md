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

For a free test of the schema-validated plan and audit presentation, open http://localhost:5173/?artifact=fixture&reset=1. The `reset=1` parameter is consumed on load so every walkthrough starts at the Enterprise Outcome Command Center; the bundled input is prominently labeled as a local fixture and is never accepted as GPT-5.6 evidence.

`judge:verify` reproduces the scenario, runs all domain tests, exercises the stateful MCP approval and dependency chain, validates the Codex plugin, checks the GPT-5.6 request boundary without credentials, and creates the production bundle.

## No-login deployment

The checked-in GitHub Pages workflow runs the full judge verification and deploys only `dist`. After Pages is enabled with GitHub Actions as its source, the public judge URL is the Pages root with `?artifact=fixture&reset=1` appended. `npm run verify:dist` proves that production assets are subpath-safe and that the bundled free artifact remains explicitly identified as a fixture.

## Ninety-second product path

1. Read the Enterprise Snapshot, portfolio breadth, executive attention, lifecycle health, and governed outcome loop. PACT should register as a platform before any use case opens.
2. Select **Strategic Delivery Recovery** to enter its Outcome Room. Confirm owner, status, value at risk, teams, target, and timeline appear before OTIF evidence.
3. Click **Verify the signal & prepare options**, then inspect the independently reproduced 72.4% OTIF.
4. Click **Map business impact** and see which value drivers and teams concentrate the loss.
5. Click **Compare recovery options**, compare the three simulations, and keep Balanced recovery selected.
6. Click **Build coordinated plan & audit it**, review independent dissent, then **Approve recovery plan**.
7. Record the six team commitments as each dependency becomes ready. Technical tool proof is available on demand rather than dominating the business view.
8. Click **Measure business outcome**, select Day 7, Day 14, and Day 21, then inspect the observed result, variance lesson, proof report, and Outcome Ledger.

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

The GPT integration is a manager-style OpenAI Agents SDK workflow with two separately instructed GPT-5.6 agents: Outcome Lead synthesis and Independent Auditor challenge. Each agent has a strict typed output and an SDK output guardrail. Linked trace IDs, response IDs, token usage, and estimated cost ship with the reviewed artifact. Model output cannot approve a plan or execute a tool.

The request contract can be inspected without an API key:

```bash
npm run generate:agents:dry-run
```

After genuine generation, the release acceptance gate can be rerun independently:

```bash
npm run verify:gpt-artifact
```

It rejects a schema-valid artifact if it recommends the non-executable strategy, omits a team, cites unknown evidence, returns a blocking verdict, lacks SDK provenance, or exceeds the project budget.

The generator checkpoints a valid Outcome Lead response before calling the Independent Auditor. It disables automatic retries and writes a pre-call cost reservation, so an interrupted call cannot be silently repeated. After inspecting the checkpoint and cost ledger, reuse the paid first response with:

```bash
npm run generate:agents:resume
```

The complete two-agent candidate is also checkpointed before release acceptance. If only a local reviewer rule fails, fix the rule and promote the preserved result without another API call:

```bash
npm run promote:gpt-candidate
```

## Safety and truthfulness

- Every scenario value is synthetic and fixed-seed.
- Fact, calculation, estimate, simulation, decision, action, and observation remain separately labeled.
- Human approval is required before material simulated tools unlock.
- Customer communication is draft-only.
- PACT does not claim formal causal inference or production integration.
