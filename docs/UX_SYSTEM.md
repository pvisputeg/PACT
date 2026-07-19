# PACT UX system

## Product levels

- **Enterprise Control Plane:** portfolio attention, outcomes, investigations, approvals, organizational action, ledger, replay, and governance settings.
- **Outcome Room:** one governed consequence chain from a signal to measured learning.

The global shell always answers “where in the enterprise am I?” The Outcome Room always answers “what stage, evidence, authority state, and next decision apply now?”

## Page anatomy

1. Scope / provenance eyebrow
2. Decision-oriented page title
3. One-sentence consequence or task
4. Governance state and bounded next action
5. Primary evidence or work surface
6. Progressive-disclosure audit detail

## Component grammar

- **Page header:** eyebrow, task title, concise supporting copy, optional status/action.
- **Section header:** category, descriptive title, optional single helper sentence.
- **Outcome card:** outcome/domain/owner, stage, value type and amount, target, deadline, attention state, next decision, exception, entry action.
- **Status pill:** text plus icon/dot; never color alone.
- **Metric value:** value, unit/type, period/date, and provenance.
- **Decision panel:** decision requested, consequence, authority, blocking conditions, rationale, and action.
- **Governance panel:** policy, current authority state, allowed actions, prohibited actions, and ledger result.
- **Evidence card:** what was tested, what it proves, source/period, result, and limitation.

## Vocabulary

### Lifecycle

Signal → Proof → Impact → Strategy → Challenge → Approval → Execution → Observation → Outcome → Learning.

Leadership grouping may remain Understand / Decide & Mobilize / Prove.

### Provenance

- Observed
- Reproduced
- Deterministic
- Simulated
- AI Proposed
- Independently Challenged
- Human Authorized
- Tool Confirmed
- Observed Synthetic
- Closed and Measured

### Action state

Proposed, challenged, blocked, authorized, ready, executing, completed, failed, observed.

### Value taxonomy

Revenue exposed, response cost, projected savings, avoided loss, protected value, realized value, and ROI are separate types. Exposure-to-cost is never labeled ROI.

## CTA conventions

Use verb + governed object: “Reproduce the KPI,” “Compare recovery strategies,” “Adopt auditor conditions,” “Authorize the Action Contract,” “Release approved commitments,” and “Record Day-14 observation.” Avoid Continue, Proceed, and View more.

## Typography and spacing

- Executive body copy: 12–14px desktop; never below 11px for decision-critical content.
- Metadata/provenance: 9–11px; 8px only for nonessential machine identifiers.
- Display headings: 30–52px, responsive.
- Use a 4px base spacing rhythm with primary gaps of 8, 12, 16, 24, 32, and 48px.
- Dense panels may be compact, but equal visual weight is avoided.

## Responsive rules

- **≥1440:** full three-column executive shell.
- **1180–1439:** compact rails; preserve the decision surface.
- **900–1179:** collapse enterprise left navigation to icons, remove the persistent right rail, and surface critical context within the primary page.
- **<900:** use a single primary content column; hide nonessential shell context; preserve every critical CTA and never force page-level horizontal scrolling.
- Tables and graphs may scroll inside a labeled region. The page itself must not clip horizontally.

## Accessibility

- Visible `:focus-visible` treatment on every action.
- Stage transitions restore scroll and focus to the new `h1`.
- Dialogs identify title, modal state, close action, and Escape behavior.
- Status always includes text; essential information is never hover-only.
- Reduced-motion preferences suppress decorative transitions.
