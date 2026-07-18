# Build Week judging matrix

**Verified against the official rules:** July 17, 2026  
**Deadline:** July 21, 2026 at 5:00 PM Pacific Time  
**Track:** Work & Productivity

Official sources:

- https://openai.devpost.com/
- https://openai.devpost.com/rules
- https://openai.com/build-week/

The official rules use a Stage One viability check followed by four equally weighted criteria. Ties are broken beginning with Technological Implementation, making genuine Codex and GPT-5.6 evidence the first release priority.

## Stage One viability

| Gate | PACT evidence | Status |
|---|---|---|
| Fits a challenge track | A cross-team operational recovery product fits Work & Productivity workflow automation, analytics, and back-office operations. | Ready |
| Built with Codex | Repository-wide `AGENTS.md`, dated Codex task, validated Codex plugin, skill, repo marketplace, and MCP server. | Ready |
| Uses GPT-5.6 | Two-role Responses API integration with high reasoning, strict schemas, provenance validation, and reviewed UI loading. | **Release blocker: genuine artifact must be generated** |
| Working project | Full deterministic outcome loop passes domain, MCP, build, and browser checks. | Ready |
| Works as depicted | Demo script uses only verified interactions and labels all synthetic state. | Ready; final video pending |

## Stage Two scorecard

The scores below are an internal readiness estimate on a five-point scale, not an official judging score.

| Criterion | Strongest evidence | Residual risk | Current posture |
|---|---|---|---:|
| Technological Implementation | Non-trivial React product; deterministic domain engine; versioned contracts; nine stateful MCP tools; approval and dependency enforcement; strict GPT-5.6 plan and audit schemas; 18 tests; browser replay; validated Codex plugin. | Genuine GPT-5.6 artifact and `/feedback` session ID are not yet captured. | 4.4 / 5 |
| Design | Seven-stage Outcome Room; consistent semantic labels; explicit authority boundary; strategy comparison; action dependency graph; projection-versus-observation closeout; optional narration and dual proof exports. | Final video must make the complete product legible in under three minutes. | 4.7 / 5 |
| Potential Impact | Specific audience of operations and enterprise leaders; specific OTIF recovery problem; 318 orders, 42 strategic customers, $1.24M exposure, six accountable roles, measurable Day-21 result. | Submission must explain why the operating model generalizes without pretending arbitrary KPI support is already implemented. | 4.4 / 5 |
| Quality of the Idea | Moves beyond dashboard explanation and agent task completion to a governed evidence-to-outcome loop with independent challenge and measured learning. | Novelty must be stated in one memorable sentence rather than buried in architecture. | 4.6 / 5 |

## The winning distinction

Most enterprise AI products end at one of three boundaries:

1. a dashboard detects a signal;
2. a copilot recommends a response; or
3. an automation executes a task.

PACT connects all three while adding the missing control loop:

> **PACT verifies whether the signal deserves action, coordinates bounded commitments across teams, preserves human authority, and measures whether the business outcome actually changed.**

This is the primary novelty claim. It is demonstrated in the product rather than asserted as future architecture.

## Submission requirement audit

| Official requirement | Evidence location | Status |
|---|---|---|
| Working project using Codex and GPT-5.6 | Application, plugin, MCP, `scripts/generate-gpt-artifacts.mjs` | GPT artifact pending |
| Category | Work & Productivity | Ready |
| Project description | `docs/SUBMISSION.md` | Ready except final links and IDs |
| Public YouTube demo under three minutes with audio covering Codex and GPT-5.6 | `docs/DEMO_SCRIPT.md` | Pending recording and upload |
| Repository URL, public with license or privately shared with required addresses | MIT `LICENSE`, repository content | Pending remote and push |
| README with setup, sample data, Codex collaboration, and GPT-5.6 use | `README.md`, `data/`, `AGENTS.md` | Ready |
| `/feedback` Codex Session ID | Devpost placeholder | Pending user action |
| Plugin installation, supported platform, and test path without rebuilding | `plugins/pact/README.md`, `docs/JUDGE_GUIDE.md`, `npm run judge:verify` | Ready |
| Free working-project access through judging | Local deterministic sandbox | Public deployment pending |

## Release priority

1. Generate, inspect, and commit the reviewed public GPT-5.6 artifact.
2. Publish a no-login demo and verify it from a clean browser.
3. Push the licensed repository and verify judge setup from a clean clone.
4. Record the 2:50 script with clear audio; show the product, not setup.
5. Capture `/feedback`, replace every submission placeholder, and submit before the deadline.

No future integration should be represented as implemented. Credibility is part of PACT's design advantage.
