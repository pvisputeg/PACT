# Devpost submission draft

## Project title

PACT — Proof, Action, Coordination & Tracking

## Tagline

The enterprise operating system for measurable outcomes.

## Proposed track

Work & Productivity

## Short description

PACT is an Enterprise Outcome Command Center that governs a portfolio of measurable outcomes, then gives each outcome an evidence-backed, human-authorized room from signal through proven result.

## Inspiration

Businesses are surrounded by dashboards and AI recommendations, yet leaders still struggle with the distance between “a metric changed” and “the organization produced a better outcome.” In enterprise operations, the hard part is not generating another explanation. It is establishing trust in the signal, aligning multiple teams, enforcing policy and authority, and learning whether the actions actually worked.

PACT reflects years of experience across enterprise AI, analytics, ERP, manufacturing, governance, and agentic systems. Its premise is simple: AI should earn the right for its answers to influence real decisions.

## Why it matters

PACT is built for COO, supply-chain, transformation, and functional leaders who must act on consequential operating signals. In the flagship case, the decision is concrete: should six teams spend **$68,750** to recover delivery performance when **318 orders, 42 strategic customers, and $1.24M of delayed revenue** are exposed?

Today, that decision is fragmented across a dashboard, data-quality investigation, analyst deck, approval meeting, task tracker, and later status review. Each system can be locally correct while nobody owns the complete outcome. PACT makes the chain inspectable and accountable in one place.

## What it does

PACT opens on a clearly labeled synthetic enterprise twin showing active outcomes, business value at stake, coordinating teams, commitments, approvals, governance health, and organizational learning. Illustrative outcome templates establish platform breadth without claiming execution. The implemented flagship Outcome Room begins when On Time In Full performance falls from 84.3% to 72.4%.

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

## What makes it different

- A dashboard can detect the signal; PACT first proves whether it deserves action.
- A copilot can recommend a response; PACT exposes competing strategies, dissent, constraints, owners, and human authority.
- An automation can complete tasks; PACT enforces cross-team dependencies and measures whether the business outcome changed.
- An agent swarm can look sophisticated; PACT uses only two reasoning agents with genuinely different duties, while deterministic controls retain authority.

The novel unit of work is not a chat, answer, or task. It is an **Outcome Contract** that survives from disputed signal through observed result.

## How we built it

- React 19, TypeScript, and Vite for Enterprise Mission Control and the routed Outcome Room.
- Versioned Metric, Outcome, Action, plan-synthesis, and independent-audit contracts.
- A fixed-seed deterministic domain engine and synthetic operating twin.
- A governed workflow state machine with local persistence.
- A stateful local MCP server with nine business tools and authorization guards.
- A local Codex plugin containing the `investigate-and-recover-outcome` skill.
- GPT-5.6 through the OpenAI Agents SDK with high reasoning, typed outputs, output guardrails, linked traces, and separate Outcome Lead and Auditor agents.
- Vitest domain and workflow coverage, a standalone MCP protocol verifier, production build verification, and browser-based end-to-end interaction testing.

## How Codex was used

Codex was the core collaboration environment for product strategy, architecture, implementation, debugging, design iteration, verification, and submission preparation. It helped reveal that the original Proofline-only idea was too narrow; compare broader executive concepts; redesign the app around business stakes; implement the deterministic workflow and Agents SDK orchestration; diagnose workflow and configuration defects; and turn those defects into regression tests and release gates.

The key human decisions were equally important: choosing the outcome-accountability thesis, grounding it in enterprise operating experience, rejecting decorative autonomy, keeping approval human, and refusing to represent simulations or fixtures as genuine evidence. The repository captures this collaboration through `AGENTS.md`, dated commits, strict contracts, verification artifacts, and the required `/feedback` session.

PACT is also packaged as a validated Codex plugin with the `investigate-and-recover-outcome` skill and nine stateful MCP business tools, so its operating model can be invoked from Codex rather than existing only as a standalone UI.

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

Implemented: Enterprise Outcome Command Center, six-outcome portfolio architecture, routed flagship Outcome Room, complete synthetic OTIF recovery loop, deterministic contracts and simulation, Auditor, approval, Action Graph, safe MCP tools, Outcome Ledger, Markdown proof report, optional executive briefings, Codex plugin and skill, GPT-5.6 structured-call generator, tests, and local build.

Optional or future: push-to-talk objective input, live enterprise integrations, production identity and RBAC, arbitrary KPIs, formal causal inference, and autonomous production execution.
