# PACT UX refactor plan

## Critical

| Change | Class | Why | Status |
|---|---|---|---|
| Replace scroll aliases with real enterprise workspaces | Structural | The current navigation overpromises a platform | Implemented |
| Reset document and rail scroll; restore heading focus on stage change | Quick win | Prevents loss of executive context after the first click | Implemented |
| Remove fixed 1180px body minimum and add graceful shell breakpoints | Structural | Required for 1024px and narrow-window reliability | Implemented |
| Record approval rationale and explicit conditions | Structural | Makes human authority consequential and auditable | Implemented |

## High

| Change | Class | Why | Status |
|---|---|---|---|
| Add portfolio search, attention/stage filters, sorting, and complete card anatomy | Structural | Lets executives find the next consequential decision | Implemented |
| Add distinct Investigations, Approvals, Action Graph, Replay, and Settings views | Structural | Completes the enterprise control-plane story without fake depth | Implemented |
| Add executive and technical Ledger layers with filtering | Structural | Serves decision-makers and auditors without a raw-log first impression | Implemented |
| Raise tiny decision/provenance type and strengthen muted contrast | Quick win | Improves readability without changing the visual identity | Implemented |
| Standardize page/section/status/provenance primitives | Structural | Reduces one-off page grammar | Implemented |

## Medium

| Change | Class | Why | Status |
|---|---|---|---|
| Trap focus inside the contract preview and ledger drawer | Structural | Completes keyboard-modal behavior | Implemented |
| Add richer artifact recovery guidance and safe fallback | Quick win | Makes safe blocked states actionable without weakening governance | Implemented |
| Add play/pause and stage controls to Replay | Optional enhancement | Useful in review, not necessary for the judge path | Implemented |
| Add outcome comparison controls | Optional enhancement | Useful at scale; limited value with six synthetic records | Planned if time permits |

## Low

- Decorative motion variants
- Additional charts
- Mobile-specific navigation drawer
- More illustrative contracts

These remain below workflow clarity, authority, provenance, and responsive reliability.
