# Devpost submission draft

## Project title

PACT — Proof, Action, Coordination & Tracking

## Tagline

From a disputed business signal to governed action and a measured outcome.

## Proposed track

Work & Productivity

## Short description

PACT is a governed multi-agent outcome system that verifies a consequential KPI, maps business impact, coordinates a cross-team recovery plan, requires human approval, executes safe business tools, and measures whether the intervention worked.

## Inspiration

Businesses are surrounded by dashboards and AI recommendations, yet leaders still struggle with the distance between “a metric changed” and “the organization produced a better outcome.” In enterprise operations, the hard part is not generating another explanation. It is establishing trust in the signal, aligning multiple teams, enforcing policy and authority, and learning whether the actions actually worked.

PACT reflects years of experience across enterprise AI, analytics, ERP, manufacturing, governance, and agentic systems. Its premise is simple: AI should earn the right for its answers to influence real decisions.

## What it does

The flagship scenario begins when On Time In Full performance falls from 84.3% to 72.4%.

PACT:

1. converts the objective into a versioned Outcome Contract;
2. uses Proofline to reproduce and classify the signal;
3. ranks evidence-backed operational contributors;
4. maps customer, revenue, cost, service, and team impact;
5. compares three bounded recovery strategies;
6. constructs a dependency-aware Action Graph across finance, procurement, manufacturing, logistics, customer, and outcome roles;
7. asks a separate Auditor to challenge the plan;
8. stops for explicit human approval;
9. executes six safe simulated business tools;
10. advances a deterministic operating timeline; and
11. compares the 82.2% simulated projection with the 82.1% observed synthetic result.

The product ends with a measurable outcome, a machine-readable Outcome Ledger, and a human-readable proof report—not a recommendation.

## How we built it

- React 19, TypeScript, and Vite for the Outcome Room.
- Versioned Metric, Outcome, Action, plan-synthesis, and independent-audit contracts.
- A fixed-seed deterministic domain engine and synthetic operating twin.
- A governed workflow state machine with local persistence.
- A stateful local MCP server with nine business tools and authorization guards.
- A local Codex plugin containing the `investigate-and-recover-outcome` skill.
- GPT-5.6 through the OpenAI Agents SDK with high reasoning, typed outputs, output guardrails, linked traces, and separate Outcome Lead and Auditor agents.
- Vitest domain and workflow coverage, a standalone MCP protocol verifier, production build verification, and browser-based end-to-end interaction testing.

## How Codex was used

Codex was the core development environment for product strategy, requirements, architecture, implementation, debugging, testing, browser verification, and submission preparation. The repository contains `AGENTS.md` with evidence, safety, build, and completion rules. PACT is also packaged as a Codex plugin with a focused skill and local MCP tool server, so the product operating model can be invoked from Codex rather than existing only as a standalone UI.

Required `/feedback` session ID: **[ADD BEFORE SUBMISSION]**

## How GPT-5.6 was used

PACT sends the deterministic evidence packet and Outcome Contract through an explicit manager-style OpenAI Agents SDK workflow. The Outcome Lead agent synthesizes a typed, evidence-cited cross-team recommendation. The Independent Auditor agent receives a frozen packet and challenges unsupported claims, constraints, dependencies, and optimistic projections without mutating the plan. SDK traces and response IDs preserve provenance. Output guardrails enforce cross-team coverage, authority boundaries, and verdict consistency. Model output cannot approve or execute tools; deterministic guards and human authority remain in control.

Genuine artifact generation status: **[RUN `npm run generate:agents` AND CONFIRM BEFORE SUBMISSION]**

## Challenges

The hardest design problem was making multi-agent behavior substantive rather than theatrical. PACT separates facts, associations, assumptions, simulations, decisions, actions, and observations; gives agents different authority; and makes tool execution depend on approval and predecessor state. A browser walkthrough exposed a readiness bug after the first tool completed, which was fixed and protected with a regression test.

## Accomplishments

- One complete outcome loop works from a clean reset.
- Every flagship number is reproducible from version-controlled data.
- The signal is challenged before action.
- The plan is challenged by a separate role before approval.
- Material tools enforce approval and dependencies independently of the UI.
- Customer communication cannot be sent.
- The final observed result differs from the projection, and PACT explains the variance.
- The futuristic interface remains understandable to an executive without requiring SQL or engineering knowledge.
- Optional spoken executive briefings improve accessibility without interrupting the primary workflow.

## What we learned

The most valuable distinction in enterprise AI is not agent versus workflow; it is judgment versus authority. Models are excellent at synthesis and challenge, while contracts, deterministic policy, explicit approval, and tool boundaries should control consequential action. Measuring the outcome also changes the product: it forces the system to expose assumptions and learn from variance.

## What is next

The same contract and ledger model can extend to margin, forecast, procurement risk, quality, maintenance, financial close, customer retention, and portfolio delivery. Future adapters can connect ERP, data platforms, work management, communication, and approval systems behind enterprise authentication. These are future directions, not implemented Build Week claims.

## Links to complete

- Public repository: **[ADD URL]**
- Public YouTube demo under three minutes: **[ADD URL]**
- Live deployment, if used: **[ADD URL]**
- Codex feedback session ID: **[ADD ID]**

## Accurate implementation statement

Implemented: complete synthetic OTIF recovery loop, deterministic contracts and simulation, Outcome Room, Auditor, approval, Action Graph, safe MCP tools, Outcome Ledger, Markdown proof report, optional executive briefings, Codex plugin and skill, GPT-5.6 structured-call generator, tests, and local build.

Optional or future: push-to-talk objective input, live enterprise integrations, production identity and RBAC, arbitrary KPIs, formal causal inference, and autonomous production execution.
