# Submission image set

`devpost-cover.png` is the current Operation Northstar cover and is reproducibly generated with `npm run generate:og`.

The existing files under `screenshots/` were captured from the earlier prototype and are retained only as historical design evidence. Do not upload them as Operation Northstar.

After `npm run verify:gpt-artifact` accepts a fresh Northstar artifact, recapture the six views defined in `gallery-manifest.json` from `?artifact=genuine&reset=1`. Use a 1440×1000 viewport and preserve the visible labels **SYNTHETIC OPERATING ENVIRONMENT** and **GENUINE GPT-5.6 · STRICT SCHEMA**. Preserve **SIMULATED**, **OBSERVED SYNTHETIC**, **HUMAN AUTHORITY**, and the deterministic rejection message wherever those labels apply.

Do not update `gptArtifact.status` to `reviewed` until the manifest contains the exact accepted `planResponseId` and `auditResponseId`. Do not add an image to `images` until its PNG dimensions and caption match the final file.

## Final gallery order and captions

1. `devpost-cover.png` — PACT: Proof, Action, Coordination & Tracking.
2. `10-mission-control.png` — Mission Control ranks a critical enterprise signal, exposes $8.7M of potential value, and makes the governed decision explicit.
3. `20-plant-digital-twin.png` — The synthetic operating twin connects material, inventory, production, orders, customers, and financial exposure.
4. `30-proofline-verification.png` — Proofline deterministically reconciles 8.1 ERP days to 5.4 usable days before planning can begin.
5. `40-independent-audit.png` — A separate GPT-5.6 Auditor challenges the structured plan and binds five conditions without tool authority.
6. `50-blocked-quality-guard.png` — Deterministic policy rejects a premature supplier commitment even after human approval because quality authorization is missing.
7. `60-outcome-closeout.png` — PACT closes the loop at 96.1% observed synthetic protection, $389K cost, and zero quality or authority violations.
