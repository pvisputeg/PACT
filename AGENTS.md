# PACT repository guidance

PACT turns a verified business signal into governed, coordinated action and a measured outcome. Preserve that complete loop in every change.

## Repository map

- `contracts/`: versioned business contracts and schemas; keep these independent of UI code.
- `data/`: deterministic synthetic scenario inputs.
- `src/domain/`: calculation, workflow, authorization, simulation, and ledger logic.
- `src/ui/`: React presentation components.
- `plugins/pact/`: local Codex plugin, skill, and safe simulated MCP tools.
- `docs/`: architecture, demo, and submission documentation.

## Commands

- `npm install`: install dependencies.
- `npm run dev`: run the local application.
- `npm test`: run deterministic domain and workflow tests.
- `npm run build`: type-check and build the production application.
- `npm run reset`: regenerate or verify the deterministic scenario artifacts.
- `npm run validate:plugin`: validate the local PACT plugin manifest.
- `npm run verify:mcp`: verify MCP approval, dependency, and safety guards.
- `npm run generate:agents -- --dry-run`: inspect the GPT-5.6 request boundary without credentials.
- `npm run generate:agents`: generate genuine schema-validated GPT-5.6 artifacts when `OPENAI_API_KEY` is configured.

## Evidence rules

- Label information as `FACT`, `CALCULATED`, `INFERRED`, `ESTIMATED`, `SIMULATED`, or `OBSERVED`.
- Never present a projection as an observed result.
- Every material conclusion must cite evidence IDs present in the scenario or ledger.
- Derive flagship numbers from version-controlled data and domain functions; do not maintain a second set of presentation-only values.
- Agent output consumed by the application must pass an explicit schema.
- The Auditor must be separate from the role proposing the plan.
- Do not display hidden chain-of-thought. Show concise conclusions, evidence, assumptions, dissent, and tool results.

## Safety and authority

- No material tool may run without an approved plan ID and satisfied predecessors.
- Customer communications remain drafts and are never sent externally.
- The MVP may only use the included synthetic environment; never connect to production systems.
- Never commit credentials. Optional OpenAI access must use `OPENAI_API_KEY`.
- Preserve visible human approval and separation of duties.

## Completion rules

A change is complete only when relevant tests pass, displayed numbers are reproducible, failure states remain visible, and the end-to-end story still reaches a measured outcome. The Build Week submission is not complete at a recommendation or task list.
