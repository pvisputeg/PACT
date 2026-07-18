# Verification evidence

**Last updated:** July 17, 2026

## Automated evidence

| Requirement | Command | Current evidence |
|---|---|---|
| Scenario determinism | `npm run reset` | 84.3% baseline, 72.4% current, 100% contributor allocation, 82.1% Day 21 verified. |
| Domain and workflow | `npm test` | 18 tests passing across contracts, Proofline, workflow safety, genuine/fixture artifact validation, and proof-report generation. |
| MCP safety | `npm run verify:mcp` | Initialization, 9 tools, missing-approval rejection, dependency chain, draft-only communication, and 82.1% outcome pass. |
| GPT-5.6 agent boundary | `npm run generate:agents:dry-run` | Agents SDK dry run reports both agents, typed outputs, guardrails, traces, retry policy, and worst-case cost without making an API call. |
| Production bundle | `npm run build` | TypeScript passes; 1,598 modules transform; production bundle builds successfully. |
| Plugin manifest and repo marketplace | `npm run validate:plugin` | Local manifest, source path, and PACT Build Week marketplace checks pass. |
| Official plugin contract | `validate_plugin.py plugins/pact` | Official Codex plugin validator passes. |

## Browser evidence

An in-app browser walkthrough completed the full prepared workflow on July 17, 2026:

- Contract confirmation: unique control found and activated.
- Proofline to Impact Map: unique controls found and activated.
- Strategy to Approval Gate: unique controls found and activated.
- Strategy fidelity guard: non-Balanced comparison selected; plan assembly was disabled with an explicit MVP boundary, then Balanced was selected and enabled.
- Human approval: unique control found and activated.
- `ACT-001` through `ACT-006`: all six controls became ready in dependency order and executed exactly once.
- Outcome checkpoints Day 3, 7, 14, and 21: all unique controls activated.
- Day-21 UI showed observed OTIF 82.1%, target met, projection 82.2%, and the carrier variance lesson.
- Day-21 UI exposed optional spoken briefing, human-readable proof report, and Ledger JSON controls without horizontal overflow.
- Browser console errors: zero.

The walkthrough discovered one defect: dependent actions did not become visually ready immediately after `ACT-001`. `readyActions` was corrected to recompute blocked nodes after every tool result, and a regression test was added.

A second in-app browser walkthrough verified the no-cost artifact path on July 17, 2026:

- `?artifact=fixture&reset=1` discarded inherited workflow state, consumed the reset parameter, and loaded the bundled strict-schema fixture without a network API call.
- Strategy displayed `LOCAL SCHEMA FIXTURE · NO API CALL` and `fixture_plan_001`.
- Approval displayed `FIXTURE AUDITOR` and `fixture_audit_001` while preserving human authority.
- Balanced recovery remained selectable and assembled the same six-action decision packet.
- Browser console errors: zero.

An accessibility interaction pass verified:

- The active lifecycle step uses `aria-current`, while strategy and outcome selections use `aria-pressed`.
- PACT state changes are exposed through a polite live status region.
- Outcome Ledger opens as a named modal dialog with an immediately focused close control.
- Escape closes the Ledger and restores focus to its trigger.
- Ledger payloads can be revealed with keyboard focus as well as pointer hover.
- Browser console errors: zero.

## P0 coverage audit

| P0 area | Evidence | Status |
|---|---|---|
| Outcome Contract and hash | Editable objective, confirmed version, Web Crypto SHA-256 | Implemented |
| Proofline classification | Four controls, reproduction, corrupted fixture | Implemented |
| Cause and impact | Ranked contributors, evidence IDs, semantic labels, team ownership | Implemented |
| Strategies | Three deterministic bounded strategies with assumptions and risk | Implemented |
| Coordination | Six roles, dependencies, explicit cross-team constraints | Implemented |
| Independent challenge | Separate Auditor findings with material dissent | Implemented |
| Human authority | Approve, reject, revision interactions and approval artifact | Implemented |
| Simulated execution | Explicit UI tool boundary plus stateful local MCP server | Implemented |
| Outcome monitoring | Days 0/3/7/14/21 and projection-versus-observation | Implemented |
| Outcome Ledger | Correlated JSON events and export | Implemented |
| Human-readable proof | Tested Markdown report with semantic labels, approval, actions, provenance, and variance | Implemented |
| Optional speech | Click-to-play visible-text executive briefings at verification and closeout | Implemented |
| Codex-native | AGENTS, validated plugin, skill, MCP, schemas | Implemented |
| GPT-5.6 | Guardrailed two-agent SDK workflow | Implemented; genuine artifact must be generated before recording |

## Remaining release gates

- Generate and inspect one genuine GPT-5.6 plan-and-audit artifact.
- Recapture the final submission gallery with the reviewed response IDs and update its provenance manifest.
- Record and edit a public video under three minutes with audio.
- Capture the required `/feedback` session ID.
- Publish the repository and complete its public URL.
- Complete Devpost fields without representing future integrations as implemented.
- Run a secret scan before publishing.
