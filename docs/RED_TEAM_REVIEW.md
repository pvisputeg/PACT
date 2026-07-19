# Operation Northstar red-team review

## Executive challenge

The strongest claim is not that PACT predicts supply disruptions. It is that PACT makes the evidence-to-outcome chain governable and inspectable across organizational boundaries.

## Resolved risks

- Dashboard impression: replaced by Mission Control, a spatial twin, Action Contract, live graph, closeout, ledger, and replay.
- Narrow technical value: reframed around $8.7M in strategic revenue and eight accountable functions.
- Autonomous-agent ambiguity: models visibly propose and challenge; a named human authorizes; deterministic code executes.
- Fake safety theater: the same supplier request fails before quality and succeeds after Quality and Finance.
- Simulation ambiguity: target, simulation, and observed synthetic result remain visually and semantically distinct.
- Causality overclaim: the app explicitly limits claims to process and temporal linkage.
- Stale replay provenance: each replay beat now names its expected ledger event, shows `NOT YET LEDGERED` before that event exists, and unlocks the source stage only when governance permits it.
- Scenario drift: Proofline policy, contract values, twin progression, measurement, replay, and the proof report derive from the canonical Northstar scenario. `npm run reset` also rejects drift between the scenario and packaged safe-tool runtime.

## Evidence-based winning scorecard

`Current` is the score at the start of the final remediation pass. `Post-fix` is the score supported by the current local repository. A score below 9 is intentional where evidence is still synthetic, incomplete, or owner-dependent.

| Category | Current | Evidence | Weakness found | Exact improvement | Status | Post-fix |
|---|---:|---|---|---|---|---:|
| Problem importance | 8 | $8.7M committed revenue, 318 orders, 42 strategic customers | Initially read as a supply-chain dashboard | Lead with the governed enterprise outcome and value exposure | Fixed | 9 |
| Product originality | 8 | Proofline → Action Contract → Action Graph → Outcome Ledger | Individual primitives are familiar | Make the complete evidence-to-outcome loop the product thesis | Fixed | 9 |
| Executive relevance | 7 | Named Plant COO decision, budget, customer and penalty exposure | Technical framing obscured the decision | Mission Control now leads with value, urgency, authority, and decision | Fixed | 9 |
| Market potential | 7 | Six typed outcome contracts across five enterprise domains | Only Northstar is end-to-end | Keep breadth visible while labeling non-Northstar outcomes illustrative | Partial | 8 |
| Product clarity | 6 | First frame and ten-stage Outcome Room | Earlier navigation resembled a dense dashboard | One dominant question and CTA per stage | Fixed | 9 |
| First-60-second impact | 6 | Mission Control headline, signal banner, outcome telemetry | Strongest facts were previously below dense UI | Put $8.7M, 5.4 days, decision, governance, and entry CTA above the fold | Fixed | 9 |
| Operation Northstar story | 8 | Canonical scenario and verified three-minute script | Values were duplicated in event handlers | Bind contract, verification, twin, measurement, and replay to scenario data | Fixed | 9 |
| Digital-twin usefulness | 7 | Selectable plant objects, inspector, layers, cascade, state progression | Some progression labels were UI constants | Move progression into versioned scenario data | Fixed | 9 |
| Cascading-impact reasoning | 8 | C-17 → cell → Line C → orders → customers → exposure | Causality could be overread | Separate FACT, CALCULATED, INFERRED, ESTIMATED, and SIMULATED evidence | Fixed | 9 |
| GPT-5.6 necessity | 6 | Two strict-schema judgment roles, runtime decision packets, and genuine-generation path | Accepted checked-in genuine artifact is not yet Northstar | Integrate strict rendered consumption, then generate fresh Northstar response and trace IDs | Partial | 8 |
| Agent architecture | 8 | Outcome Lead proposes; independent Auditor challenges; zero tools | Resume could pair a stale plan checkpoint with new evidence | Bind checkpoint to scenario, model, and evidence-packet hash | Fixed | 9 |
| Independent audit quality | 8 | Five material findings alter Action Contract conditions | Fixture could be mistaken for live GPT evidence | Preserve explicit fixture/genuine provenance and immutable packet | Partial | 8 |
| Human-approval quality | 6 | Approve with conditions, Request changes, Reject | Request and Reject were formerly decorative | Implement all decisions and prove rejected/revision paths unlock no authority | Fixed | 9 |
| Deterministic safeguards | 9 | Approval, spend, supplier, quality, predecessor, production, send guards | UI alone was not sufficient proof | Verify direct domain and MCP bypass attempts | Fixed | 9 |
| MCP tool quality | 8 | Fifteen narrow synthetic tools; no generic command surface | Runtime duplicates bounded fixture parameters | Reject scenario/runtime drift in `npm run reset` | Fixed | 9 |
| Outcome Ledger | 8 | Correlated signal-to-learning events with executive meanings | Replay could show the latest unrelated event ID | Bind replay beats to explicit event types | Fixed | 9 |
| Action Graph | 8 | Ten acyclic actions across eight functions | Counts and twin milestones were repeated in UI | Derive counts and progression from action/scenario data | Fixed | 9 |
| Measurement credibility | 8 | Target 95.0%, simulation 96.4%, observed synthetic 96.1% | Some closeout calculations used literal percentages | Calculate closeout and proof report from the final scenario observation | Fixed | 9 |
| Codex-native development | 8 | `AGENTS.md`, plugin, skill, MCP runtime, verifiers, release gates | Final `/feedback` Session ID remains owner action | Preserve task evidence and add Session ID at submission | Partial | 8 |
| UX quality | 6 | Full local browser walkthrough | Earlier fixed shell overflow and dense route hierarchy | Responsive shell, dominant stage question, decision-focused flows | Fixed | 9 |
| Visual polish | 7 | Cohesive mission-control visual system | Final current-screen gallery is not captured | Recapture six required views after genuine artifact acceptance | Open | 8 |
| Accessibility | 6 | Semantic controls, labels, focus trap helper, reduced-motion CSS | No complete keyboard and screen-reader audit evidence | Complete final keyboard, focus, contrast, and announcement audit | Partial | 7 |
| Performance | 8 | Production JS 333 kB / 97 kB gzip; CSS 120 kB / 27 kB gzip | Monolithic `App.tsx` limits future route splitting | Keep current stable bundle; avoid risky late refactor | Accepted | 8 |
| Code quality | 7 | Typed domain, Zod contracts, 49 tests | Scenario values and replay bounds were duplicated | Add selectors, data-driven policies, progression, and replay metadata | Fixed | 9 |
| Test quality | 8 | 9 files / 49 tests plus scenario, MCP, plugin, artifact, demo, dist checks | Browser provenance state was not covered by unit tests | Manually verify pre-completion and post-closeout replay states | Fixed | 9 |
| Demo reliability | 8 | Nine contiguous beats, 175 seconds, peak 130 WPM | Replay could open locked stages or show stale IDs | Lock unavailable stages and show expected versus actual ledger event | Fixed | 9 |
| Documentation | 8 | README, architecture, judge guide, demo, submission, verification | No evidence-based 30-category remediation table | Add this scorecard and preserve open gates | Fixed | 9 |
| Claim discipline | 8 | Synthetic disclosure, no ROI or exclusive-causality claim | Historical genuine output risked accidental reuse | Reject stale checkpoints and label fallback as no-API fixture | Fixed | 9 |
| Memorability | 8 | “Authority is not readiness” and exact unsafe-action rejection | Could still be remembered as a manufacturing demo | Frame PACT as the reusable outcome operating layer | Fixed | 9 |
| Overall winning probability | 7 | Distinct thesis, strong governed demo, green local checks | Genuine artifact, final gallery, public URL, video, and owner submission remain | Close release gates without weakening provenance | Partial | 8 |

### Verification evidence

- `npm run judge:verify`: passes scenario, 49 tests, MCP guard suite, plugin validation, agent dry run, fixture-provenance check, 2:55 demo check, submission compliance, production build, and distribution audit.
- Manual local browser path: Mission Control → Proofline → impact → strategies → independent audit → human authorization → exact quality rejection → approved graph → Day 14 → Day 21 → closeout → ledger-bound replay.
- `npm run release:audit`: intentionally remains blocked for the fresh Northstar GPT artifact, six final gallery views, and repository origin.

## Remaining honest boundaries

- synthetic data and tools;
- no production connector;
- fresh genuine Northstar GPT output must be intentionally generated;
- historical genuine output is not reused as Northstar evidence;
- portfolio breadth beyond Northstar is illustrative.
- final gallery, public repository/URL, video upload, and Devpost submission remain owner-controlled release actions;
- a complete assistive-technology audit is not yet evidenced.
