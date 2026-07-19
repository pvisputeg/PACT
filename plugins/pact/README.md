# PACT Codex plugin - Operation Northstar

This local plugin brings the PACT operating model into Codex through:

- `investigate-and-recover-outcome`, an evidence-to-outcome skill;
- `pact-business-tools`, a stateful local MCP server; and
- fifteen safe synthetic tools covering proof, independent-audit conditions, human approval, quality, finance, procurement, inventory transfer, labor, manufacturing, logistics, draft-only customer preparation, coordination, observation, and reset.

The zero-dependency MCP server speaks JSON-RPC over stdio and uses the same governed runtime imported by the React product. Operation Northstar therefore has one Action Graph, parameter boundary, Proofline prerequisite, five-condition audit gate, human authority state, predecessor state, draft-only communication policy, observation set, correlation ID, and tool-result contract.

## Supported platform

- Codex desktop with this repository open.
- Node.js 20 or later.
- The included fixed-seed Northstar scenario is synthetic and requires no enterprise credentials or paid runtime call.

## Installation

1. Open this repository in Codex desktop.
2. Restart Codex after changing the plugin so the repository marketplace refreshes.
3. Open **Plugins**, select **PACT Build Week**, and install **PACT**.
4. Start a new Codex task and invoke `investigate-and-recover-outcome`.

## Test without rebuilding

```bash
npm run validate:plugin
npm run verify:mcp
```

`verify:mcp` launches the packaged server directly. It proves the exact quality rejection, five-condition Auditor boundary, named Plant COO authorization, $420,000 hard stop, approved-supplier restriction, predecessor enforcement, production readiness, customer draft safeguard, digital-twin transitions, and 96.1% Day-21 closeout.

The plugin only operates on the included synthetic environment and never connects to production systems.
