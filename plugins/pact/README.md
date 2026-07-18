# PACT Codex plugin

This local plugin brings the PACT operating model into Codex through:

- `investigate-and-recover-outcome`: an evidence-to-outcome skill;
- `pact-business-tools`: a stateful local MCP server; and
- nine safe synthetic tools covering proof, finance, procurement, manufacturing, logistics, customer drafting, coordination, observation, and reset.

The MCP server is zero-dependency Node.js and speaks JSON-RPC over stdio. It independently enforces the approved plan ID, bounded spend, approved supplier, predecessor state, and draft-only communication.

From the repository root:

```bash
npm run validate:plugin
npm run verify:mcp
```

The repository includes `.agents/plugins/marketplace.json`. Restart the Codex desktop app with this repository open, open **Plugins**, choose **PACT Build Week**, and install **PACT**. The plugin only operates on the included synthetic scenario and does not require enterprise credentials.
