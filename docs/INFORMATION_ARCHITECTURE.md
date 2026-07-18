# PACT product information architecture

PACT has two product levels. The portfolio is the enterprise control plane; an Outcome Room is the governed workspace for one measurable result. The flagship OTIF scenario demonstrates the platform without defining it.

## Page hierarchy and routing

```text
/#/
└── Enterprise Outcome Command Center
    ├── Enterprise Snapshot
    ├── Outcome Portfolio
    ├── Executive Attention
    ├── Outcome Health
    ├── Platform Status
    └── Organizational Learning

/#/outcomes/strategic-delivery-recovery
└── Strategic Delivery Recovery Outcome Room
    ├── Signal
    ├── Proof
    ├── Decision
    ├── Approval
    ├── Execution
    ├── Observation
    ├── Outcome
    └── Learning
```

Routing intentionally uses a small hash boundary rather than a routing dependency. Direct links, back/forward navigation, and static hosting all work without server rewrites. The existing workflow state remains locally persistent across both levels.

## Opening-page wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ PACT              Enterprise Outcome Command Center        Governance online │
├───────────────┬────────────────────────────────────────────┬─────────────────┤
│ Command Center│ Enterprise Outcome Command Center          │ Needs attention │
│ Outcomes      │ Outcome operating-system thesis            │ 5 approvals     │
│ Investigations│ Signal → Proof → Decision → ... → Learning │ 2 behind plan   │
│ Approvals     ├────────────────────────────────────────────┤                 │
│ Action Graph  │ Enterprise Snapshot: value, teams, work,   │ Outcome health  │
│ Outcome Ledger│ approvals, governance                      │ lifecycle mix   │
│ Replay        ├────────────────────────────────────────────┤                 │
│ Settings      │ Outcome Portfolio                          │ Platform status │
│               │ ┌ Strategic Delivery Recovery ──────────┐ │ contracts       │
│ Human-governed│ └────────────────────────────────────────┘ │ authority       │
│               │ ┌ Supplier Cost ┐ ┌ Throughput ─────────┐ │ ledger / replay │
│               │ └───────────────┘ └─────────────────────┘ │                 │
└───────────────┴────────────────────────────────────────────┴─────────────────┘
```

## Component hierarchy

```text
App
├── CommandCenter
│   ├── CommandTopbar
│   ├── PortfolioNavigation
│   ├── EnterpriseSnapshot
│   ├── OutcomePortfolio / OutcomeCard
│   ├── OrganizationalLearning
│   └── ExecutivePortfolioIntelligence
└── OutcomeRoom
    ├── OutcomeTimeline
    ├── existing stage rail
    ├── existing governed workflow views
    ├── BusinessRail
    └── LedgerDrawer
```

`CommandCenter` is isolated in `src/ui/CommandCenter.tsx`. The mature workflow remains in `App.tsx` to minimize migration risk while exposing a clean extraction boundary for later stage-view modules.

## Implementation decisions

- Create: `CommandCenter`, portfolio navigation, enterprise snapshot, outcome cards, executive attention, portfolio health, platform status, organizational learning, and the persistent `OutcomeTimeline`.
- Reuse: brand, topbar, dark executive visual system, semantic colors, panels, ledger drawer, domain engine, workflow stages, approval controls, action graph, proof report, and business rail.
- Replace: the former OTIF-first entry route and giant incident metric on the opening screen.
- Retain inside the Outcome Room: Understand, Decide & Mobilize, Prove, evidence verification, strategy comparison, independent audit, human approval, governed execution, and measured closeout.
- Do not add: chat, avatar, decorative autonomy, production integrations, new animation language, or fabricated cross-outcome execution data.

## Migration plan

1. Introduce a two-level route boundary without changing workflow state or domain contracts.
2. Make the Command Center the default route and represent OTIF as one featured governed outcome.
3. Move the existing experience behind the Strategic Delivery Recovery route.
4. Add outcome-level identity and lifecycle context above every workflow stage.
5. Demote OTIF to supporting evidence in the opening Outcome Room view.
6. Preserve all existing workflow actions, safety controls, persistence, exports, and tests.
7. Verify both route directions, browser console health, deterministic tests, and production build.

The Command Center is visibly labeled as a synthetic enterprise twin. Additional portfolio cards are explicitly illustrative templates demonstrating information-architecture breadth. Only Strategic Delivery Recovery is marked as an implemented synthetic contract and opens the working workflow; this avoids representing future integrations as complete.
