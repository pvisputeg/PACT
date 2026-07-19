# Verification evidence

| Boundary | Command | Expected evidence |
|---|---|---|
| Scenario | `npm run reset` | 5.4 usable days, 318 orders, 42 customers, $8.7M exposure, 96.1% Day 21 at $389K. |
| Domain | `npm test` | Business math, evidence corruption, strategy constraints, immutable audit, authorization, safe rejection, graph, measurement, ledger, and replay pass. |
| Safe tools | `npm run verify:mcp` | Fifteen tools; exact quality rejection; finance, supplier, predecessor, production, and direct-send guards; 96.1% observation. |
| Agent boundary | `npm run generate:agents:dry-run` | Two separate GPT-5.6 Agents SDK roles, strict schemas, high reasoning, no tools, cost cap below $5. |
| Artifact | `npm test && npm run verify:gpt-artifact` | Runtime loader accepts strict genuine/fixture artifacts, explicit genuine mode fails closed, auto fallback is disclosed, and the historical artifact is never relabeled. |
| Plugin | `npm run validate:plugin` | PACT manifest and repository marketplace entry resolve. |
| Demo | `npm run verify:demo` | Contiguous 175-second path and every named product control. |
| Bundle | `npm run build && npm run verify:dist` | Type-safe production bundle, relative assets, fixture provenance, portable social metadata. |

No check connects to production systems or sends external communication.
