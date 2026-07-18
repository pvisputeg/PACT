import { useEffect, useMemo, useState, type ComponentType, type Dispatch, type SetStateAction } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, Boxes, Check, ChevronRight, CircleDollarSign, Clock3,
  Download, FileCheck2, FileText, Fingerprint, GitBranch, History, LockKeyhole, Network, PackageCheck,
  Play, RefreshCw, Route, Scale, ShieldCheck, Sparkles, Target, Truck, Users, Volume2, X, Zap,
} from 'lucide-react';
import {
  appendLedger, auditBalancedPlan, buildBalancedPlan, createApproval, evaluateStrategy, executeNextAction,
  hashContent, initialState, readyActions, scenario, verifySignal,
} from './domain/engine';
import { aiArtifactSchema, type AiArtifact } from './domain/ai-artifact';
import { buildProofReport } from './domain/proof-report';
import type { EvidenceLabel, PactAction, Strategy, WorkflowStage, WorkflowState } from './domain/types';

const STAGES: { id: WorkflowStage; label: string; eyebrow: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'signal', label: 'Signal', eyebrow: 'Define', icon: Activity },
  { id: 'proof', label: 'Proofline', eyebrow: 'Verify', icon: Fingerprint },
  { id: 'impact', label: 'Impact map', eyebrow: 'Understand', icon: Network },
  { id: 'strategy', label: 'Strategies', eyebrow: 'Decide', icon: Route },
  { id: 'approval', label: 'Approval gate', eyebrow: 'Authorize', icon: LockKeyhole },
  { id: 'execution', label: 'Action graph', eyebrow: 'Coordinate', icon: GitBranch },
  { id: 'outcome', label: 'Outcome replay', eyebrow: 'Measure', icon: Target },
];

const teamIcons: Record<string, ComponentType<{ size?: number }>> = {
  Procurement: PackageCheck, Manufacturing: Boxes, Logistics: Truck, Finance: CircleDollarSign, Customer: Users, 'Outcome Office': Sparkles,
};

function isUnlocked(stage: WorkflowStage, state: WorkflowState): boolean {
  if (stage === 'signal') return true;
  if (stage === 'proof') return state.verification !== null;
  if (stage === 'impact' || stage === 'strategy') return state.verification?.classification === 'verified_operational';
  if (stage === 'approval') return state.auditFindings.length > 0;
  if (stage === 'execution') return state.approval?.decision === 'approved';
  if (stage === 'outcome') return state.actions.length > 0 && state.actions.every((action) => action.status === 'complete');
  return false;
}

function labelClass(label: EvidenceLabel | 'VERIFIED' | 'MATERIAL' | 'ADVISORY') {
  return `semantic-label label-${label.toLowerCase()}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadText(name: string, value: string, type = 'text/plain') {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function speakBriefing(value: string) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.rate = 0.96;
  utterance.pitch = 0.92;
  window.speechSynthesis.speak(utterance);
}

export function App() {
  const [state, setState] = useState<WorkflowState>(() => {
    if (new URLSearchParams(window.location.search).get('reset') === '1') return initialState;
    const stored = localStorage.getItem('pact.workflow.v1');
    if (!stored) return initialState;
    try { return JSON.parse(stored) as WorkflowState; } catch { return initialState; }
  });
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [aiArtifact, setAiArtifact] = useState<AiArtifact | null>(null);

  useEffect(() => localStorage.setItem('pact.workflow.v1', JSON.stringify(state)), [state]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('reset') !== '1') return;
    url.searchParams.delete('reset');
    window.history.replaceState({}, '', url);
  }, []);
  useEffect(() => {
    let active = true;
    const baseUrl = import.meta.env.BASE_URL;
    const artifactPath = new URLSearchParams(window.location.search).get('artifact') === 'fixture'
      ? `${baseUrl}artifacts/fixture/strategy-and-audit.json`
      : `${baseUrl}artifacts/gpt-5.6/strategy-and-audit.json`;
    fetch(artifactPath, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
        const parsed = aiArtifactSchema.safeParse(await response.json());
        if (!active || !parsed.success) return;
        setAiArtifact(parsed.data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const selectedStrategy = scenario.strategies.find((strategy) => strategy.id === state.selectedStrategyId) ?? scenario.strategies[2];
  const observation = scenario.observations.find((item) => item.day === state.currentDay) ?? scenario.observations[0];
  const stageIndex = STAGES.findIndex((stage) => stage.id === state.stage);
  const completedActions = state.actions.filter((action) => action.status === 'complete').length;

  const reset = () => {
    localStorage.removeItem('pact.workflow.v1');
    setState(initialState);
    setLedgerOpen(false);
  };

  const confirmContract = async () => {
    const contractHash = await hashContent({ objective: state.objective, version: '1.0.0', constraints: ['budget <= 75000', 'quality delta <= 0', 'approved suppliers only'] });
    const verification = verifySignal();
    setState((current) => ({
      ...current, stage: 'proof', contractConfirmed: true, contractHash, verification,
      ledger: appendLedger(current.ledger, 'contract.confirmed', 'executive_outcome_owner', 'complete', { contractVersion: '1.0.0', contractHash, objective: current.objective }),
    }));
  };

  const acceptProof = () => setState((current) => ({
    ...current, stage: 'impact',
    ledger: appendLedger(current.ledger, 'signal.verified', 'proof_investigator', 'complete', { classification: current.verification?.classification, evidenceIds: current.verification?.evidenceIds }),
  }));

  const prepareDecision = () => {
    if (selectedStrategy.id !== 'STR-BALANCED') return;
    const actions = buildBalancedPlan();
    const findings = auditBalancedPlan(selectedStrategy, actions);
    setState((current) => {
      const simulated = appendLedger(current.ledger, 'strategy.simulated', 'deterministic_strategy_engine', 'complete', {
        strategyIds: scenario.strategies.map((strategy) => strategy.id), selectedStrategyId: selectedStrategy.id, label: 'SIMULATED',
      });
      let planned = appendLedger(simulated, 'plan.created', 'outcome_lead', 'proposed', {
        planId: 'PLAN-BALANCED-v1', actionIds: actions.map((action) => action.actionId), teamCount: 6,
      });
      if (aiArtifact) {
        planned = appendLedger(planned, 'model.plan_synthesized', aiArtifact.model, 'validated', {
          responseId: aiArtifact.provenance.planResponseId,
          recommendedStrategyId: aiArtifact.plan.recommendedStrategyId,
          evidenceCitations: aiArtifact.plan.evidenceCitations,
        });
        planned = appendLedger(planned, 'model.audit_completed', `${aiArtifact.model}:independent_auditor`, aiArtifact.audit.verdict, {
          responseId: aiArtifact.provenance.auditResponseId,
          verdict: aiArtifact.audit.verdict,
          findingCount: aiArtifact.audit.findings.length,
        });
      }
      return {
        ...current, stage: 'approval', actions, auditFindings: findings,
        ledger: appendLedger(planned, 'plan.challenged', 'independent_outcome_auditor', findings.some((finding) => finding.severity === 'blocking') ? 'blocked' : 'complete', {
          planId: 'PLAN-BALANCED-v1', findingIds: findings.map((finding) => finding.id), proposedCost: selectedStrategy.cost,
        }),
      };
    });
  };

  const decide = (decision: 'approved' | 'rejected' | 'revision_requested') => {
    const approval = createApproval(decision);
    setState((current) => ({
      ...current,
      stage: decision === 'approved' ? 'execution' : 'approval',
      approval,
      actions: decision === 'approved' ? readyActions(current.actions) : current.actions,
      ledger: appendLedger(current.ledger, `plan.${decision}`, 'executive_outcome_owner', 'complete', { ...approval, syntheticEnvironment: true }),
    }));
  };

  const execute = () => setState((current) => executeNextAction(current));

  const enterOutcome = () => setState((current) => ({
    ...current, stage: 'outcome', currentDay: 0,
    ledger: appendLedger(current.ledger, 'execution.completed', 'outcome_lead', 'complete', { actionCount: current.actions.length }),
  }));

  const advanceDay = (day: number) => {
    const nextObservation = scenario.observations.find((item) => item.day === day)!;
    setState((current) => ({
      ...current, currentDay: day,
      ledger: appendLedger(current.ledger, day === 21 ? 'outcome.closed' : 'outcome.observed', day === 21 ? 'independent_outcome_auditor' : 'synthetic_operating_twin', 'complete', {
        day, otif: nextObservation.otif, label: 'OBSERVED', targetMet: day === 21 ? nextObservation.otif >= 82 : undefined,
      }),
    }));
  };

  const systemState = useMemo(() => {
    if (state.stage === 'signal') return ['AWAITING OBJECTIVE', 'Define the outcome before investigating the metric.'];
    if (state.stage === 'proof') return ['SIGNAL VERIFIED', 'Four independent controls reproduce the operational decline.'];
    if (state.stage === 'approval') return ['HUMAN AUTHORITY', 'PACT has stopped before material commitments.'];
    if (state.stage === 'execution') return ['COORDINATING', `${completedActions} of ${state.actions.length} approved actions executed.`];
    if (state.stage === 'outcome') return [state.currentDay === 21 ? 'OUTCOME CLOSED' : 'MONITORING', `Synthetic operating state advanced to Day ${state.currentDay}.`];
    return ['OUTCOME ASSEMBLY', 'Evidence, teams, and constraints are being connected.'];
  }, [state, completedActions]);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><strong>PACT</strong><small>Proof · Action · Coordination · Tracking</small></div>
        </div>
        <div className="room-title"><span>Outcome Room</span><ChevronRight size={14} /><strong>OTIF recovery</strong></div>
        <div className="top-actions">
          <button className="ghost-button" onClick={() => setLedgerOpen(true)}><History size={15} /> Ledger <span className="count">{state.ledger.length}</span></button>
          <button className="icon-button" onClick={reset} aria-label="Reset scenario" title="Reset scenario"><RefreshCw size={16} /></button>
          <div className="live-pill"><i /> SYNTHETIC TWIN</div>
        </div>
      </header>

      <aside className="stage-rail" aria-label="PACT lifecycle">
        <div className="stage-line" />
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const unlocked = isUnlocked(stage.id, state);
          const complete = index < stageIndex || (stage.id === 'outcome' && state.currentDay === 21);
          return (
            <button key={stage.id} disabled={!unlocked} className={`stage-button ${state.stage === stage.id ? 'active' : ''} ${complete ? 'complete' : ''}`} onClick={() => setState((current) => ({ ...current, stage: stage.id }))}>
              <span className="stage-node">{complete ? <Check size={14} /> : <Icon size={15} />}</span>
              <span className="stage-copy"><small>{stage.eyebrow}</small><strong>{stage.label}</strong></span>
            </button>
          );
        })}
        <div className="rail-footer"><ShieldCheck size={15} /><span>Governed demo<br/><small>PACT · v0.1</small></span></div>
      </aside>

      <main className="workspace">
        {state.stage === 'signal' && <SignalView state={state} setState={setState} onConfirm={confirmContract} />}
        {state.stage === 'proof' && <ProofView state={state} onContinue={acceptProof} />}
        {state.stage === 'impact' && <ImpactView onContinue={() => setState((current) => ({
          ...current,
          stage: 'strategy',
          ledger: appendLedger(current.ledger, 'impact.analyzed', 'cross_functional_specialists', 'complete', {
            contributorIds: scenario.contributors.map((item) => item.id), ordersAtRisk: 318, strategicCustomers: 42,
          }),
        }))} />}
        {state.stage === 'strategy' && <StrategyView state={state} setState={setState} artifact={aiArtifact} onContinue={prepareDecision} />}
        {state.stage === 'approval' && <ApprovalView state={state} strategy={selectedStrategy} artifact={aiArtifact} onDecide={decide} />}
        {state.stage === 'execution' && <ExecutionView state={state} onExecute={execute} onContinue={enterOutcome} />}
        {state.stage === 'outcome' && <OutcomeView state={state} observation={observation} artifact={aiArtifact} onAdvance={advanceDay} />}
      </main>

      <aside className="intelligence-rail">
        <div className={`intelligence-core core-${state.stage}`}>
          <div className="core-orbit orbit-one" /><div className="core-orbit orbit-two" /><div className="core-center"><Sparkles size={22} /></div>
        </div>
        <p className="system-kicker">PACT STATE</p><h3>{systemState[0]}</h3><p>{systemState[1]}</p>
        <div className="mini-rule" />
        <div className="target-mini"><div><span>OUTCOME TARGET</span><strong>≥82.0%</strong></div><Target size={18} /></div>
        <div className="target-mini"><div><span>CURRENT STATE</span><strong>{state.stage === 'outcome' ? `${observation.otif.toFixed(1)}%` : '72.4%'}</strong></div><Activity size={18} /></div>
        <div className="authority-card"><LockKeyhole size={16} /><div><span>Authority boundary</span><p>{state.approval?.decision === 'approved' ? 'Synthetic plan approved' : 'Material actions locked'}</p></div></div>
        <p className="model-note">Deterministic engine <span>online</span><br/>Reasoning artifact <span>{aiArtifact ? (aiArtifact.provenance.kind === 'genuine' ? 'GPT‑5.6 verified' : 'local fixture') : 'schema-ready'}</span></p>
      </aside>

      {ledgerOpen && <LedgerDrawer state={state} onClose={() => setLedgerOpen(false)} />}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, label }: { eyebrow: string; title: string; description: string; label?: string }) {
  return <div className="page-heading"><div><span className="page-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{label && <div className="page-id">{label}</div>}</div>;
}

function SignalView({ state, setState, onConfirm }: { state: WorkflowState; setState: Dispatch<SetStateAction<WorkflowState>>; onConfirm: () => void }) {
  return <section className="view-enter">
    <PageHeading eyebrow="01 · SIGNAL INTAKE" title="A metric moved. Is the business moving with it?" description="Turn a disputed KPI into a bounded outcome before PACT earns the right to act." label="INC-OTIF-042" />
    <div className="signal-grid">
      <article className="hero-metric panel">
        <div className="panel-top"><span className={labelClass('OBSERVED')}>OBSERVED</span><span className="source-ref">ERP fulfillment snapshot · EVD-ORD-041</span></div>
        <div className="metric-name">ON TIME IN FULL</div><div className="metric-value">72.4<span>%</span></div>
        <div className="metric-delta"><Activity size={18} /> −11.9 <span>percentage points vs 13-week control</span></div>
        <div className="metric-baseline"><span>CONTROL</span><div><i style={{ width: '84.3%' }} /></div><strong>84.3%</strong></div>
        <div className="signal-stakes"><div><strong>318</strong><span>orders at risk</span></div><div><strong>42</strong><span>strategic customers</span></div><div><strong>$1.24M</strong><span>revenue exposure</span></div></div>
      </article>
      <article className="objective-card panel">
        <div className="panel-title"><div><Target size={18} /><span>Outcome contract</span></div><span className="draft-pill">DRAFT · v1.0</span></div>
        <label htmlFor="objective">What must be true when this pact closes?</label>
        <textarea id="objective" value={state.objective} onChange={(event) => setState((current) => ({ ...current, objective: event.target.value }))} />
        <div className="contract-grid"><div><small>TARGET</small><strong>≥82.0% OTIF</strong></div><div><small>DEADLINE</small><strong>Day 21</strong></div><div><small>BUDGET CAP</small><strong>$75,000</strong></div><div><small>AUTHORITY</small><strong>Human approval</strong></div></div>
        <div className="constraint-line"><ShieldCheck size={15} /><span>No quality degradation · Strategic customers first · Approved suppliers only</span></div>
        <button className="primary-button" onClick={onConfirm} disabled={state.objective.trim().length < 20}>Confirm pact & investigate <ArrowRight size={17} /></button>
      </article>
    </div>
    <div className="belief-line"><Sparkles size={16} /><span>AI should earn the right for its answers to influence real decisions.</span></div>
  </section>;
}

function ProofView({ state, onContinue }: { state: WorkflowState; onContinue: () => void }) {
  const verification = state.verification!;
  return <section className="view-enter">
    <PageHeading eyebrow="02 · PROOFLINE" title="The signal is real." description="PACT reproduced the metric from governed counts and challenged four ways the decline could be misleading." label={state.contractHash?.slice(0, 20)} />
    <div className="verdict-panel panel verified-glow">
      <div className="verdict-icon"><BadgeCheck size={32} /></div><div><span className={labelClass('VERIFIED')}>VERIFIED OPERATIONAL</span><h2>72.4% reproduced independently</h2><p>{verification.explanation}</p></div>
      <div className="reproduction"><small>CALCULATION</small><code>1,810 ÷ 2,500</code><strong>= 72.4%</strong></div>
    </div>
    <div className="check-grid">{verification.checks.map((check, index) => <article className="check-card panel" key={check.id}><div className="check-order">0{index + 1}</div><div className="check-icon"><Check size={16} /></div><h3>{check.name}</h3><p>{check.detail}</p><code>{check.id}</code></article>)}</div>
    <div className="evidence-bar panel"><div><Fingerprint size={18} /><span>Metric Contract v1.0.0</span></div><div><FileCheck2 size={18} /><span>All invariants pass</span></div><div><Scale size={18} /><span>Definition consistent</span></div><button className="secondary-button compact narration-button" onClick={() => speakBriefing('Proofline verified the operational signal. OTIF declined from 84.3 percent to 72.4 percent. Four independent controls passed, so PACT can now map business impact.')}><Volume2 size={15}/> Executive brief</button><button className="primary-button compact" onClick={onContinue}>Map business impact <ArrowRight size={16} /></button></div>
  </section>;
}

function ImpactView({ onContinue }: { onContinue: () => void }) {
  return <section className="view-enter">
    <PageHeading eyebrow="03 · IMPACT MAP" title="One signal. Five teams. A connected response." description="Observed associations explain where the deterioration concentrates; they are not presented as exclusive causation." label="318 ORDERS AT RISK" />
    <div className="impact-layout">
      <article className="contribution-panel panel"><div className="panel-title"><div><Network size={18} /><span>Contribution model</span></div><span className={labelClass('CALCULATED')}>CALCULATED</span></div>
        <div className="contribution-bar">{scenario.contributors.map((item) => <span key={item.id} style={{ width: `${item.share}%` }} className={`cause-${item.id.toLowerCase()}`}><b>{item.share}%</b></span>)}</div>
        <div className="cause-list">{scenario.contributors.map((item, index) => { const Icon = teamIcons[item.team] ?? Sparkles; return <div className="cause-row" key={item.id}><span className={`cause-dot dot-${index}`} /><Icon size={18} /><div><strong>{item.name}</strong><small>{item.affectedEntities} affected orders · {item.uncertainty} uncertainty</small></div><div className="cause-share">{item.share}%<code>{item.evidenceIds[0]}</code></div></div>; })}</div>
      </article>
      <div className="impact-side">
        <article className="risk-card panel"><span className={labelClass('FACT')}>FACT</span><strong>42</strong><p>strategic customers affected</p><code>EVD-CUS-006</code></article>
        <article className="risk-card panel"><span className={labelClass('CALCULATED')}>CALCULATED</span><strong>$1.24M</strong><p>delayed revenue exposure</p><code>EVD-FIN-018</code></article>
        <article className="risk-card panel"><span className={labelClass('ESTIMATED')}>ESTIMATED</span><strong>$186K</strong><p>premium freight exposure</p><code>2 assumptions · EVD-LOG-031</code></article>
      </div>
    </div>
    <div className="team-strip panel"><span>CROSS-TEAM RESPONSE</span>{['Procurement','Manufacturing','Logistics','Finance','Customer'].map((team) => { const Icon = teamIcons[team]; return <div key={team}><Icon size={16} />{team}</div>; })}<button className="primary-button compact" onClick={onContinue}>Simulate responses <ArrowRight size={16} /></button></div>
  </section>;
}

function StrategyView({ state, setState, artifact, onContinue }: { state: WorkflowState; setState: Dispatch<SetStateAction<WorkflowState>>; artifact: AiArtifact | null; onContinue: () => void }) {
  const selected = scenario.strategies.find((item) => item.id === state.selectedStrategyId) ?? scenario.strategies[2];
  const executable = selected.id === 'STR-BALANCED';
  const recommendationAligned = artifact?.plan.recommendedStrategyId === selected.id;
  const decisionRationale = !executable
    ? 'Comparison profile only in this MVP. Select Balanced recovery to assemble the governed action contract.'
    : artifact && recommendationAligned
      ? artifact.plan.strategyRationale
      : artifact
        ? `The reviewed model recommends ${artifact.plan.recommendedStrategyId}; human control keeps the executable MVP on the bounded Balanced contract.`
        : 'Independent challenge is required before approval.';
  return <section className="view-enter">
    <PageHeading eyebrow="04 · STRATEGY SANDBOX" title="Choose the shape of recovery." description="Three bounded strategies trade margin, speed, and resilience. Every projected number remains explicitly simulated." label="DETERMINISTIC · SEED 56021" />
    <div className="simulation-banner"><Zap size={16} /><span>SIMULATION, NOT FORECAST</span><p>Same contract + scenario + parameters will always reproduce these results.</p></div>
    {artifact && <div className={`model-provenance panel ${artifact.provenance.kind === 'fixture' ? 'model-fixture' : ''}`}><Sparkles size={17}/><div><span>{artifact.provenance.kind === 'genuine' ? 'REVIEWED GPT‑5.6 ARTIFACT' : 'LOCAL SCHEMA FIXTURE · NO API CALL'}</span><strong>{artifact.plan.executiveSummary}</strong></div><code>{artifact.provenance.planResponseId.slice(0, 20)}</code></div>}
    <div className="strategy-grid">{scenario.strategies.map((strategy) => {
      const evaluation = evaluateStrategy(strategy); const selected = state.selectedStrategyId === strategy.id; const recommended = strategy.id === (artifact?.plan.recommendedStrategyId ?? 'STR-BALANCED');
      return <button key={strategy.id} className={`strategy-card panel ${selected ? 'selected' : ''}`} onClick={() => setState((current) => ({ ...current, selectedStrategyId: strategy.id }))}>
        <div className="strategy-top"><span className={labelClass('SIMULATED')}>SIMULATED</span>{recommended && <span className="recommended">PACT RECOMMENDS</span>}</div><h3>{strategy.name}</h3>
        <div className="strategy-outcome"><small>PROJECTED DAY 21</small><strong>{strategy.projectedDay21.toFixed(1)}%</strong><span className={strategy.projectedDay21 >= 82 ? 'meets' : 'misses'}>{strategy.projectedDay21 >= 82 ? 'Target met' : 'Target gap'}</span></div>
        <div className="strategy-stats"><div><small>COST</small><strong>{formatMoney(strategy.cost)}</strong></div><div><small>IMPACT</small><strong>Day {strategy.timeToImpactDays}</strong></div><div><small>DAY 14</small><strong>{strategy.projectedDay14}%</strong></div></div>
        <p className="risk-copy"><span>Residual risk</span>{strategy.risk}</p>
        <div className="compliance"><ShieldCheck size={15} /><span>{evaluation.compliant ? 'Hard constraints pass' : evaluation.reasons[0]}</span></div>
      </button>;
    })}</div>
    <div className="decision-bar panel"><div><span>SELECTED PACT</span><strong>{selected.name}</strong><p>{decisionRationale}</p></div><button className="primary-button" disabled={!executable} onClick={onContinue}>Assemble & challenge plan <ArrowRight size={17} /></button></div>
  </section>;
}

function ApprovalView({ state, strategy, artifact, onDecide }: { state: WorkflowState; strategy: Strategy; artifact: AiArtifact | null; onDecide: (decision: 'approved' | 'rejected' | 'revision_requested') => void }) {
  const blocking = state.auditFindings.some((finding) => finding.severity === 'blocking' && !finding.resolved) || artifact?.audit.verdict === 'block';
  return <section className="view-enter">
    <PageHeading eyebrow="05 · APPROVAL GATE" title="PACT stops here. You decide." description="Review the complete decision packet. This approval controls synthetic actions only and does not represent a production authorization." label="HUMAN AUTHORITY REQUIRED" />
    <div className="approval-grid">
      <article className="decision-packet panel"><div className="panel-title"><div><LockKeyhole size={18} /><span>Decision packet</span></div><span className="draft-pill">PLAN-BALANCED-v1</span></div>
        <div className="packet-outcome"><div><small>PROJECTED OUTCOME</small><strong>{strategy.projectedDay21}%</strong><span className={labelClass('SIMULATED')}>SIMULATED · DAY 21</span></div><div><small>AUTHORIZED CAP</small><strong>{formatMoney(strategy.cost)}</strong><span>$6,250 headroom</span></div></div>
        <div className="packet-actions">{state.actions.map((action) => { const Icon = teamIcons[action.team]; return <div key={action.actionId}><span className="action-id">{action.actionId}</span><Icon size={16}/><div><strong>{action.description}</strong><small>{action.team} · {action.owner}</small></div><span>{formatMoney(action.estimatedCost)}</span></div>; })}</div>
        <div className="coordination-conflicts"><span>CROSS-TEAM CONSTRAINTS</span><p><b>Procurement → Manufacturing</b> · schedule lock waits for allocation confirmation</p><p><b>Finance × Logistics</b> · carrier reservation consumes 37.7% of the bounded envelope</p></div>
        <div className="constraint-line"><ShieldCheck size={15}/><span>Budget · quality · supplier · customer constraints pass</span></div>
      </article>
      <article className="audit-panel panel"><div className="auditor-heading"><div className="auditor-mark"><Scale size={20}/></div><div><small>SEPARATION OF DUTIES</small><h3>Independent Auditor</h3></div></div>
        <p className="audit-intro">The proposing roles cannot certify their own plan. These findings remain visible at decision time.</p>
        {artifact && <div className={`model-audit model-audit-${artifact.audit.verdict} ${artifact.provenance.kind === 'fixture' ? 'model-fixture' : ''}`}><div><span>{artifact.provenance.kind === 'genuine' ? 'GPT‑5.6' : 'FIXTURE AUDITOR'} · {artifact.audit.verdict.replaceAll('_', ' ').toUpperCase()}</span><code>{artifact.provenance.auditResponseId.slice(0, 18)}</code></div><strong>{artifact.audit.findings[0]?.title ?? 'Independent model challenge complete'}</strong><p>{artifact.audit.findings[0]?.detail ?? artifact.audit.requiredConditions.join(' ')}</p></div>}
        <div className="finding-list">{state.auditFindings.map((finding) => <div className={`finding finding-${finding.severity}`} key={finding.id}><div><span>{finding.severity.toUpperCase()}</span><code>{finding.id}</code></div><strong>{finding.title}</strong><p>{finding.detail}</p></div>)}</div>
      </article>
    </div>
    <div className="approval-gate panel"><div className="white-ring"><LockKeyhole size={19}/></div><div><span>YOUR DECISION</span><strong>Authorize six governed actions in the synthetic operating twin?</strong></div><div className="decision-buttons"><button className="secondary-button danger" onClick={() => onDecide('rejected')}><X size={16}/> Reject</button><button className="secondary-button" onClick={() => onDecide('revision_requested')}><RefreshCw size={16}/> Request revision</button><button className="approval-button" disabled={blocking} onClick={() => onDecide('approved')}><Check size={17}/> Approve pact</button></div></div>
  </section>;
}

function ExecutionView({ state, onExecute, onContinue }: { state: WorkflowState; onExecute: () => void; onContinue: () => void }) {
  const complete = state.actions.every((action) => action.status === 'complete');
  const ready = state.actions.find((action) => action.status === 'ready');
  return <section className="view-enter">
    <PageHeading eyebrow="06 · ACTION GRAPH" title={complete ? 'The organization is mobilized.' : 'Commitments move in dependency order.'} description="The UI changes only when an approved simulated business tool returns a correlated result." label={`${state.actions.filter((a) => a.status === 'complete').length} / ${state.actions.length} EXECUTED`} />
    <div className="execution-layout">
      <article className="action-graph panel"><div className="graph-spine" />{state.actions.map((action) => <ActionNode key={action.actionId} action={action} />)}</article>
      <article className="tool-console panel"><div className="panel-title"><div><Zap size={18}/><span>Safe tool boundary</span></div><span className="live-pill"><i/> LOCAL MCP</span></div>
        {ready ? <><span className="next-label">NEXT AUTHORIZED OPERATION</span><code className="tool-name">{ready.toolOperation}</code><div className="tool-request"><span>REQUEST</span><pre>{JSON.stringify({ approvedPlanId: 'PLAN-BALANCED-v1', actionId: ready.actionId, ...ready.parameters }, null, 2)}</pre></div><div className="tool-guards"><div><Check size={14}/> Approval valid</div><div><Check size={14}/> Dependencies satisfied</div><div><Check size={14}/> Schema valid</div></div><button className="primary-button execute-button" onClick={onExecute}><Play size={16}/> Execute {ready.actionId}</button></> : complete ? <div className="all-complete"><BadgeCheck size={38}/><h3>All commitments recorded</h3><p>Six tool results are now correlated in the Outcome Ledger. The operating timeline can advance.</p><button className="primary-button" onClick={onContinue}>Observe the outcome <ArrowRight size={16}/></button></div> : <div className="waiting-tools"><Clock3 size={30}/><h3>Resolving dependencies</h3></div>}
        <div className="synthetic-warning"><ShieldCheck size={15}/><span>Every operation is local, deterministic, and synthetic.</span></div>
      </article>
    </div>
  </section>;
}

function ActionNode({ action }: { action: PactAction }) {
  const Icon = teamIcons[action.team];
  return <div className={`action-node status-${action.status}`}><div className="node-status">{action.status === 'complete' ? <Check size={14}/> : action.status === 'ready' ? <Play size={12}/> : <LockKeyhole size={12}/>}</div><div className="node-team"><Icon size={18}/></div><div className="node-copy"><div><code>{action.actionId}</code><span>{action.team}</span></div><strong>{action.description}</strong><small>{action.dependencies.length ? `After ${action.dependencies.join(' + ')}` : 'No action predecessor'}</small></div><div className="node-result"><span>{action.status.toUpperCase()}</span>{action.result && <code>{String(action.result.operationId ?? action.result.draftId)}</code>}</div></div>;
}

function OutcomeView({ state, observation, artifact, onAdvance }: { state: WorkflowState; observation: typeof scenario.observations[number]; artifact: AiArtifact | null; onAdvance: (day: number) => void }) {
  const closed = state.currentDay === 21;
  const points = scenario.observations.map((item, index) => ({ x: 48 + index * 145, y: 210 - (item.otif - 70) * 9.4, ...item }));
  const projected = [{x:48,y:187.4},{x:193,y:160},{x:338,y:120},{x:483,y:104.7},{x:628,y:95.3}];
  return <section className="view-enter">
    <PageHeading eyebrow="07 · OUTCOME REPLAY" title={closed ? 'The target was met. The variance still matters.' : 'Watch the business—not the activity.'} description="Projected and observed values remain separate as the synthetic operating twin advances through controlled checkpoints." label={closed ? 'PACT CLOSED · TARGET MET' : `OBSERVING · DAY ${state.currentDay}`} />
    <div className="outcome-grid">
      <article className="outcome-chart panel"><div className="chart-heading"><div><span className={labelClass('OBSERVED')}>OBSERVED</span><strong>{observation.otif.toFixed(1)}%</strong><small>OTIF · Day {state.currentDay}</small></div><div className="chart-legend"><span className="legend-observed">Observed synthetic</span><span className="legend-simulated">Simulated projection</span><span className="legend-target">Target 82.0%</span></div></div>
        <svg viewBox="0 0 680 250" className="line-chart" role="img" aria-label="Projected and observed OTIF recovery"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#43ead1" stopOpacity=".24"/><stop offset="1" stopColor="#43ead1" stopOpacity="0"/></linearGradient></defs>
          {[72,76,80,84].map((value) => <g key={value}><line x1="48" x2="628" y1={210-(value-70)*9.4} y2={210-(value-70)*9.4}/><text x="8" y={214-(value-70)*9.4}>{value}%</text></g>)}
          <line className="target-line" x1="48" x2="628" y1={97.2} y2={97.2}/>
          <path className="projected-line" d={`M ${projected.map((p) => `${p.x} ${p.y}`).join(' L ')}`} />
          <path className="observed-area" d={`M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L 628 220 L 48 220 Z`} />
          <path className="observed-line" d={`M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`} />
          {points.map((point) => <circle key={point.day} cx={point.x} cy={point.y} r={point.day <= state.currentDay ? 5 : 3} className={point.day <= state.currentDay ? 'point-active' : 'point-future'}/>) }
          {points.map((point) => <text key={`d${point.day}`} x={point.x} y="242" textAnchor="middle">D{point.day}</text>)}
        </svg>
        <div className="timeline-controls">{scenario.observations.map((item) => <button key={item.day} className={state.currentDay === item.day ? 'active' : ''} onClick={() => onAdvance(item.day)}><span>{item.day <= state.currentDay ? <Check size={12}/> : null}</span>Day {item.day}</button>)}</div>
      </article>
      <div className="outcome-side">
        <article className="indicator-panel panel"><span>LEADING INDICATORS</span>{[['Component coverage',observation.componentCoverage],['Schedule adherence',observation.scheduleAdherence],['Pickup acceptance',observation.pickupAcceptance]].map(([name,value]) => <div className="indicator" key={String(name)}><div><span>{name}</span><strong>{value}%</strong></div><i><b style={{width:`${value}%`}}/></i></div>)}</article>
        <article className={`closeout-card panel ${closed ? 'closed' : ''}`}><div className="closeout-icon">{closed ? <BadgeCheck size={26}/> : <Clock3 size={24}/>}</div><span>{closed ? 'INDEPENDENT CLOSEOUT' : 'OUTCOME MONITOR'}</span><h3>{closed ? 'Target achieved' : 'Recovery in progress'}</h3><p>{closed ? 'Observed OTIF reached 82.1%, 0.1 point below the balanced projection and 0.1 point above the target.' : 'Advance the synthetic timeline to distinguish activity from measurable recovery.'}</p>{closed && <div className="variance"><span>PROJECTION</span><strong>82.2%</strong><ArrowRight size={14}/><span>OBSERVED</span><strong>82.1%</strong></div>}</article>
      </div>
    </div>
    {closed && <div className="closeout-strip panel"><BadgeCheck size={22}/><div><span>PACT OUTCOME</span><strong>Recovered within budget, with no quality degradation.</strong></div><div><span>LESSON</span><strong>Carrier recovery was 1 point below assumption.</strong></div><div className="artifact-actions"><button className="secondary-button compact" onClick={() => speakBriefing('PACT closed the outcome at 82.1 percent OTIF, above the 82 percent target and 0.1 point below the simulation. Recovery stayed within budget with no quality degradation.')}><Volume2 size={15}/> Brief</button><button className="secondary-button compact" onClick={() => downloadText('pact-outcome-proof-report.md', buildProofReport(state, artifact), 'text/markdown')}><FileText size={15}/> Proof report</button><button className="primary-button compact" onClick={() => downloadJson('pact-outcome-ledger.json', state.ledger)}><Download size={16}/> Ledger JSON</button></div></div>}
  </section>;
}

function LedgerDrawer({ state, onClose }: { state: WorkflowState; onClose: () => void }) {
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="ledger-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-heading"><div><span>OUTCOME LEDGER</span><h2>Trace every consequential state.</h2></div><button className="icon-button" onClick={onClose}><X size={18}/></button></div><div className="ledger-meta"><div><span>CORRELATION</span><code>PACT-OTIF-2026-07</code></div><div><span>EVENTS</span><strong>{state.ledger.length}</strong></div></div><div className="ledger-events">{[...state.ledger].reverse().map((event) => <article key={event.eventId}><div className="event-line"><span className="event-dot"/><i/></div><div><div className="event-top"><code>{event.eventId}</code><span>{new Date(event.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span></div><strong>{event.eventType}</strong><p>{event.source} · {event.status}</p><pre>{JSON.stringify(event.payload, null, 2)}</pre></div></article>)}</div><button className="primary-button drawer-export" onClick={() => downloadJson('pact-outcome-ledger.json', state.ledger)}><Download size={16}/> Export machine-readable JSON</button></aside></div>;
}
