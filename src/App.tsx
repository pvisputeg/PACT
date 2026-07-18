import { useEffect, useMemo, useRef, useState, type ComponentType, type Dispatch, type SetStateAction } from 'react';
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
  { id: 'signal', label: 'Define outcome', eyebrow: '01 · BUSINESS CASE', icon: Activity },
  { id: 'proof', label: 'Verify the KPI', eyebrow: '02 · TRUST', icon: Fingerprint },
  { id: 'impact', label: 'Find value drivers', eyebrow: '03 · IMPACT', icon: Network },
  { id: 'strategy', label: 'Choose response', eyebrow: '04 · DECISION', icon: Route },
  { id: 'approval', label: 'Authorize plan', eyebrow: '05 · GOVERN', icon: LockKeyhole },
  { id: 'execution', label: 'Coordinate teams', eyebrow: '06 · ACTION', icon: GitBranch },
  { id: 'outcome', label: 'Measure result', eyebrow: '07 · LEARNING', icon: Target },
];

const PHASES = [
  { id: 'understand', label: 'UNDERSTAND', caption: 'Trust the signal', stages: STAGES.slice(0, 3) },
  { id: 'mobilize', label: 'DECIDE & MOBILIZE', caption: 'Move the organization', stages: STAGES.slice(3, 6) },
  { id: 'prove', label: 'PROVE', caption: 'Measure the result', stages: STAGES.slice(6) },
];

const STAGE_QUESTIONS: Record<WorkflowStage, string> = {
  signal: 'What business result are we committing to?',
  proof: 'Is the KPI trustworthy enough to act on?',
  impact: 'Where will intervention protect the most value?',
  strategy: 'Which response best balances recovery, cost, and risk?',
  approval: 'Should the organization commit money and people?',
  execution: 'What can each team safely do next?',
  outcome: 'Did the approved response improve the business result?',
};

const STORAGE_KEY = 'pact.workflow.v2';

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    try { return JSON.parse(stored) as WorkflowState; } catch { return initialState; }
  });
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [aiArtifact, setAiArtifact] = useState<AiArtifact | null>(null);
  const ledgerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state]);
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
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setLedgerOpen(false);
  };

  const closeLedger = () => {
    setLedgerOpen(false);
    requestAnimationFrame(() => ledgerButtonRef.current?.focus());
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
    if (state.stage === 'signal') return ['DEFINE SUCCESS', 'Set the target, deadline, budget, and guardrails before investigation begins.'];
    if (state.stage === 'proof') return ['KPI VERIFIED', 'Four independent controls confirm the decline is operational—not a reporting error.'];
    if (state.stage === 'impact') return ['VALUE EXPOSED', 'Connect the decline to customers, revenue, operational bottlenecks, and accountable teams.'];
    if (state.stage === 'strategy') return ['RESPONSE OPTIONS', 'Compare recovery speed, cost, resilience, and residual risk under one contract.'];
    if (state.stage === 'approval') return ['HUMAN DECISION', 'PACT has stopped before any material commitment.'];
    if (state.stage === 'execution') return ['TEAMS MOBILIZING', `${completedActions} of ${state.actions.length} approved commitments completed.`];
    return [state.currentDay === 21 ? 'OUTCOME PROVEN' : 'MEASURING IMPACT', `Observed business state advanced to Day ${state.currentDay}.`];
  }, [state, completedActions]);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark"><span /><span /><span /></div>
          <div><strong>PACT</strong><small>Proof · Action · Coordination · Tracking</small></div>
        </div>
        <div className="room-title"><span>Executive Outcome Room</span><ChevronRight size={14} /><strong>Strategic delivery recovery</strong></div>
        <div className="top-actions">
          <button ref={ledgerButtonRef} className="ghost-button" onClick={() => setLedgerOpen(true)} aria-haspopup="dialog"><History size={15} /> Ledger <span className="count">{state.ledger.length}</span></button>
          <button className="icon-button" onClick={reset} aria-label="Reset scenario" title="Reset scenario"><RefreshCw size={16} /></button>
          <div className="live-pill"><i /> SAFE BUSINESS TWIN</div>
        </div>
      </header>

      <aside className="stage-rail" aria-label="PACT lifecycle">
        {PHASES.map((phase, phaseIndex) => <section className="phase-group" key={phase.id}>
          <div className="phase-heading"><span>0{phaseIndex + 1}</span><div><strong>{phase.label}</strong><small>{phase.caption}</small></div></div>
          <div className="phase-stages">{phase.stages.map((stage) => {
            const Icon = stage.icon;
            const index = STAGES.findIndex((candidate) => candidate.id === stage.id);
            const unlocked = isUnlocked(stage.id, state);
            const complete = index < stageIndex || (stage.id === 'outcome' && state.currentDay === 21);
            return <button key={stage.id} disabled={!unlocked} aria-current={state.stage === stage.id ? 'step' : undefined} className={`stage-button ${state.stage === stage.id ? 'active' : ''} ${complete ? 'complete' : ''}`} onClick={() => setState((current) => ({ ...current, stage: stage.id }))}>
              <span className="stage-node">{complete ? <Check size={14} /> : <Icon size={15} />}</span>
              <span className="stage-copy"><small>{stage.eyebrow}</small><strong>{stage.label}</strong></span>
            </button>;
          })}</div>
        </section>)}
        <div className="rail-footer"><ShieldCheck size={15} /><span>Governed outcome loop<br/><small>PACT · v0.2</small></span></div>
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

      <BusinessRail state={state} observation={observation} systemState={systemState} artifact={aiArtifact} />

      {ledgerOpen && <LedgerDrawer state={state} onClose={closeLedger} />}
    </div>
  );
}

function BusinessRail({ state, observation, systemState, artifact }: { state: WorkflowState; observation: typeof scenario.observations[number]; systemState: string[]; artifact: AiArtifact | null }) {
  const currentOtif = state.stage === 'outcome' ? observation.otif : 72.4;
  const recoveryCost = scenario.strategies.find((strategy) => strategy.id === 'STR-BALANCED')?.cost ?? 68_750;
  const exposureToCost = scenario.impact.delayedRevenueExposure.value / recoveryCost;
  return <aside className="business-rail" aria-label="Executive business context">
    <section className="business-case-card">
      <span className="rail-label">EXECUTIVE VALUE CASE</span>
      <h2>Protect revenue and strategic relationships</h2>
      <p>For COO, supply chain, and transformation leaders coordinating recovery across organizational boundaries.</p>
      <div className="business-stakes">
        <div><strong>$1.24M</strong><span>revenue exposed</span></div>
        <div><strong>{formatMoney(recoveryCost)}</strong><span>bounded response</span></div>
        <div><strong>{exposureToCost.toFixed(1)}×</strong><span>exposure-to-cost</span></div>
        <div><strong>21 days</strong><span>measurable finish</span></div>
      </div>
      <small className="value-caveat">Exposure-to-cost is not ROI. PACT measures protected value at closeout.</small>
    </section>

    <section className="step-brief" role="status" aria-live="polite" aria-atomic="true">
      <span className="rail-label">WHAT PACT IS DOING NOW</span>
      <h3>{systemState[0]}</h3>
      <p>{systemState[1]}</p>
      <div className="decision-question"><span>Business question</span><strong>{STAGE_QUESTIONS[state.stage]}</strong></div>
    </section>

    <section className="success-contract">
      <div className="success-contract-heading"><Target size={17}/><span>SUCCESS CONTRACT</span></div>
      <strong>≥82.0% OTIF by Day 21</strong>
      <div className="contract-progress"><i style={{ width: `${Math.min(100, (currentOtif / 82) * 100)}%` }}/></div>
      <div className="contract-values"><span>Now {currentOtif.toFixed(1)}%</span><span>Budget ≤$75K</span></div>
      <small>No quality degradation · Approved suppliers only</small>
    </section>

    <div className="authority-card"><LockKeyhole size={16}/><div><span>Human authority</span><p>{state.approval?.decision === 'approved' ? 'Synthetic recovery plan approved' : 'Material commitments remain locked'}</p></div></div>
    <p className="model-note">Deterministic controls <span>online</span><br/>Reasoning evidence <span>{artifact ? (artifact.provenance.kind === 'genuine' ? 'GPT‑5.6 verified' : 'local fixture') : 'schema-ready'}</span></p>
  </aside>;
}

function PageHeading({ eyebrow, title, description, label }: { eyebrow: string; title: string; description: string; label?: string }) {
  return <div className="page-heading"><div><span className="page-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{label && <div className="page-id">{label}</div>}</div>;
}

function SignalView({ state, setState, onConfirm }: { state: WorkflowState; setState: Dispatch<SetStateAction<WorkflowState>>; onConfirm: () => void }) {
  return <section className="view-enter">
    <PageHeading eyebrow="EXECUTIVE DECISION BRIEF · COO / SUPPLY CHAIN / TRANSFORMATION" title="$1.24M is exposed. Five teams need one recovery decision." description="PACT is an AI outcome command center that turns a critical business signal into a trusted decision, coordinated action, and a provable result." label="INC-OTIF-042 · MATERIAL" />
    <div className="executive-brief-grid">
      <article className="incident-brief panel">
        <div className="brief-topline"><span className={labelClass('OBSERVED')}>OBSERVED BUSINESS SIGNAL</span><code>ERP · EVD-ORD-041</code></div>
        <div className="incident-score"><div><small>ON TIME IN FULL</small><strong>72.4%</strong></div><div className="incident-drop"><Activity size={18}/><strong>−11.9 pts</strong><span>vs 13-week control</span></div></div>
        <div className="executive-stakes"><div><span>REVENUE EXPOSED</span><strong>$1.24M</strong></div><div><span>STRATEGIC CUSTOMERS</span><strong>42</strong></div><div><span>ORDERS AT RISK</span><strong>318</strong></div></div>
        <div className="inaction-line"><Clock3 size={16}/><div><span>COST OF DELAY</span><strong>Every planning cycle leaves customer, revenue, and operational risk unresolved.</strong></div></div>
      </article>

      <article className="executive-decision-card panel">
        <div className="decision-card-heading"><div className="decision-icon"><Target size={21}/></div><div><span>DECISION REQUIRED NOW</span><h2>Authorize a governed recovery investigation</h2></div></div>
        <p>Verify the KPI, identify the value drivers, and return with bounded response options before committing money or teams.</p>
        <div className="executive-contract"><div><small>SUCCESS</small><strong>≥82.0% OTIF</strong></div><div><small>DEADLINE</small><strong>21 days</strong></div><div><small>MAXIMUM BUDGET</small><strong>$75K</strong></div></div>
        <div className="decision-safeguards"><ShieldCheck size={16}/><span>No quality degradation · approved suppliers only · human authorization before commitments</span></div>
        <details className="contract-editor"><summary>Review or edit the measurable outcome</summary><label htmlFor="objective">Outcome contract</label><textarea id="objective" value={state.objective} onChange={(event) => setState((current) => ({ ...current, objective: event.target.value }))} /></details>
        <button className="primary-button executive-cta" onClick={onConfirm} disabled={state.objective.trim().length < 20}>Verify the signal & prepare options <ArrowRight size={17} /></button>
      </article>
    </div>

    <div className="operating-model panel">
      <div className="operating-model-heading"><span>THE OPERATING MODEL SHIFT</span><strong>From fragmented response to accountable outcome</strong></div>
      <div className="operating-path today-path"><span>TODAY</span><div>Dashboard alert</div><ArrowRight size={14}/><div>Meetings & spreadsheets</div><ArrowRight size={14}/><div>Fragmented actions</div><ArrowRight size={14}/><div>Outcome unclear</div></div>
      <div className="operating-path pact-path"><span>WITH PACT</span><div>Verify truth</div><ArrowRight size={14}/><div>Choose response</div><ArrowRight size={14}/><div>Coordinate teams</div><ArrowRight size={14}/><div>Prove result</div></div>
    </div>

    <div className="production-path"><span>DESIGNED FOR THE SYSTEMS WHERE WORK ALREADY HAPPENS</span><div>ERP</div><i>→</i><div>Finance</div><i>→</i><div>Procurement</div><i>→</i><div>Manufacturing</div><i>→</i><div>Logistics</div><i>→</i><div>CRM</div><small>Demo uses a safe synthetic twin; enterprise adapters are the production path.</small></div>
  </section>;
}

function ProofView({ state, onContinue }: { state: WorkflowState; onContinue: () => void }) {
  const verification = state.verification!;
  return <section className="view-enter">
    <PageHeading eyebrow="02 · VERIFY BEFORE ACTING" title="The decline is real—not a reporting error." description="Before mobilizing five teams or spending recovery budget, PACT independently reproduces the KPI and challenges its integrity." label={state.contractHash?.slice(0, 20)} />
    <div className="verdict-panel panel verified-glow">
      <div className="verdict-icon"><BadgeCheck size={32} /></div><div><span className={labelClass('VERIFIED')}>VERIFIED OPERATIONAL</span><h2>72.4% reproduced independently</h2><p>{verification.explanation}</p></div>
      <div className="reproduction"><small>INDEPENDENT REPRODUCTION</small><code>1,810 compliant ÷ 2,500 eligible</code><strong>= 72.4%</strong></div>
    </div>
    <div className="check-grid">{verification.checks.map((check, index) => <article className="check-card panel" key={check.id}><div className="check-order">0{index + 1}</div><div className="check-icon"><Check size={16} /></div><h3>{check.name}</h3><p>{check.detail}</p><code>{check.id}</code></article>)}</div>
    <div className="evidence-bar panel"><div><Fingerprint size={18} /><span>Metric Contract v1.0.0</span></div><div><FileCheck2 size={18} /><span>All invariants pass</span></div><div><Scale size={18} /><span>Definition consistent</span></div><button className="secondary-button compact narration-button" onClick={() => speakBriefing('Proofline verified the operational signal. OTIF declined from 84.3 percent to 72.4 percent. Four independent controls passed, so PACT can now map business impact.')}><Volume2 size={15}/> Executive brief</button><button className="primary-button compact" onClick={onContinue}>Map business impact <ArrowRight size={16} /></button></div>
  </section>;
}

function ImpactView({ onContinue }: { onContinue: () => void }) {
  return <section className="view-enter">
    <PageHeading eyebrow="03 · CONNECT OPERATIONS TO BUSINESS VALUE" title="Three bottlenecks concentrate the recoverable loss." description="PACT connects operational evidence to exposed customers, revenue, cost, and the teams with power to change the result." label="318 ORDERS AT RISK" />
    <div className="executive-insight panel"><span>EXECUTIVE INTERPRETATION</span><strong>68% of the decline concentrates in supplier availability and production sequencing.</strong><p>The response must coordinate Procurement and Manufacturing first, then secure Logistics capacity and protect strategic customers.</p></div>
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
    <div className="team-strip panel"><span>TEAMS THAT MUST MOVE TOGETHER</span>{['Procurement','Manufacturing','Logistics','Finance','Customer'].map((team) => { const Icon = teamIcons[team]; return <div key={team}><Icon size={16} />{team}</div>; })}<button className="primary-button compact" onClick={onContinue}>Compare recovery options <ArrowRight size={16} /></button></div>
  </section>;
}

function AgentDecisionLineage({ artifact }: { artifact: AiArtifact | null }) {
  const isFixture = artifact?.provenance.kind === 'fixture';
  const verdict = artifact?.audit.verdict.replaceAll('_', ' ') ?? 'awaiting plan';
  const planTrace = artifact?.provenance.planTraceId.slice(0, 18) ?? 'trace pending';
  const auditTrace = artifact?.provenance.auditTraceId.slice(0, 18) ?? 'trace pending';

  return <section className={`agent-lineage panel ${isFixture ? 'agent-lineage-fixture' : ''}`} aria-label="Agent decision lineage">
    <div className="agent-lineage-heading">
      <div><span>GOVERNED DECISION LINEAGE</span><strong>Two agents challenge one plan. A human owns the decision.</strong></div>
      <div className="agent-runtime"><i />{artifact ? (isFixture ? 'OFFLINE REHEARSAL' : 'OPENAI AGENTS SDK') : 'SDK READY'}</div>
    </div>
    <div className="agent-lineage-flow">
      <article className="agent-role-card">
        <div className="agent-role-icon"><Sparkles size={17}/></div>
        <div><small>01 · SYNTHESIZE</small><strong>{artifact?.provenance.planAgent ?? 'PACT Outcome Lead'}</strong><p>Turns verified evidence, constraints, and business impact into one cross-team recommendation.</p><code>{planTrace}</code></div>
      </article>
      <div className="agent-handoff"><ArrowRight size={15}/><span>TYPED PLAN</span><small>immutable</small></div>
      <article className="agent-role-card agent-role-audit">
        <div className="agent-role-icon"><Scale size={17}/></div>
        <div><small>02 · CHALLENGE</small><strong>{artifact?.provenance.auditAgent ?? 'Independent Outcome Auditor'}</strong><p>Tests evidence, dependencies, unsupported claims, and counterfactual risk without editing the plan.</p><code>{auditTrace}</code></div>
      </article>
      <div className="agent-handoff"><ArrowRight size={15}/><span>VERDICT</span><small>{verdict}</small></div>
      <article className="agent-role-card agent-role-human">
        <div className="agent-role-icon"><LockKeyhole size={17}/></div>
        <div><small>03 · AUTHORIZE</small><strong>Executive decision owner</strong><p>Sees recommendation and dissent together. Only the human can release budget or mobilize teams.</p><code>{artifact ? `$${artifact.usage.estimatedCostUsd.toFixed(4)} model cost` : 'authority locked'}</code></div>
      </article>
    </div>
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
    <PageHeading eyebrow="04 · CHOOSE THE RESPONSE" title="Three recovery paths. One responsible recommendation." description="Compare business tradeoffs—not just model scores. Every projection remains simulated, bounded by the same outcome contract." label="REPRODUCIBLE · SEED 56021" />
    <div className="simulation-banner"><Zap size={16} /><span>SIMULATION, NOT FORECAST</span><p>Same contract + scenario + parameters will always reproduce these results.</p></div>
    {artifact && <div className={`model-provenance panel ${artifact.provenance.kind === 'fixture' ? 'model-fixture' : ''}`}><Sparkles size={17}/><div><span>{artifact.provenance.kind === 'genuine' ? 'REVIEWED GPT‑5.6 ARTIFACT' : 'LOCAL SCHEMA FIXTURE · NO API CALL'}</span><strong>{artifact.plan.executiveSummary}</strong></div><code>{artifact.provenance.planResponseId.slice(0, 20)}</code></div>}
    <AgentDecisionLineage artifact={artifact} />
    <div className="strategy-grid">{scenario.strategies.map((strategy) => {
      const evaluation = evaluateStrategy(strategy); const selected = state.selectedStrategyId === strategy.id; const recommended = strategy.id === (artifact?.plan.recommendedStrategyId ?? 'STR-BALANCED');
      return <button key={strategy.id} aria-pressed={selected} className={`strategy-card panel ${selected ? 'selected' : ''}`} onClick={() => setState((current) => ({ ...current, selectedStrategyId: strategy.id }))}>
        <div className="strategy-top"><span className={labelClass('SIMULATED')}>SIMULATED</span>{recommended && <span className="recommended">PACT RECOMMENDS</span>}</div><h3>{strategy.name}</h3>
        <div className="strategy-outcome"><small>PROJECTED DAY 21</small><strong>{strategy.projectedDay21.toFixed(1)}%</strong><span className={strategy.projectedDay21 >= 82 ? 'meets' : 'misses'}>{strategy.projectedDay21 >= 82 ? 'Target met' : 'Target gap'}</span></div>
        <div className="strategy-stats"><div><small>COST</small><strong>{formatMoney(strategy.cost)}</strong></div><div><small>IMPACT</small><strong>Day {strategy.timeToImpactDays}</strong></div><div><small>DAY 14</small><strong>{strategy.projectedDay14}%</strong></div></div>
        <p className="risk-copy"><span>Residual risk</span>{strategy.risk}</p>
        <div className="compliance"><ShieldCheck size={15} /><span>{evaluation.compliant ? 'Hard constraints pass' : evaluation.reasons[0]}</span></div>
      </button>;
    })}</div>
    <div className="decision-bar panel"><div><span>RECOMMENDED BUSINESS RESPONSE</span><strong>{selected.name}</strong><p>{decisionRationale}</p></div><button className="primary-button" disabled={!executable} onClick={onContinue}>Build coordinated plan & audit it <ArrowRight size={17} /></button></div>
  </section>;
}

function ApprovalView({ state, strategy, artifact, onDecide }: { state: WorkflowState; strategy: Strategy; artifact: AiArtifact | null; onDecide: (decision: 'approved' | 'rejected' | 'revision_requested') => void }) {
  const blocking = state.auditFindings.some((finding) => finding.severity === 'blocking' && !finding.resolved) || artifact?.audit.verdict === 'block';
  return <section className="view-enter">
    <PageHeading eyebrow="05 · HUMAN AUTHORITY" title="Authorize one coordinated business response." description="Review the outcome, cost, owners, dependencies, and independent dissent. PACT cannot commit money or mobilize teams without you." label="DECISION REQUIRED" />
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
    <div className="approval-gate panel"><div className="white-ring"><LockKeyhole size={19}/></div><div><span>YOUR DECISION</span><strong>Authorize the $68,750 cross-team recovery plan?</strong></div><div className="decision-buttons"><button className="secondary-button danger" onClick={() => onDecide('rejected')}><X size={16}/> Reject</button><button className="secondary-button" onClick={() => onDecide('revision_requested')}><RefreshCw size={16}/> Request revision</button><button className="approval-button" disabled={blocking} onClick={() => onDecide('approved')}><Check size={17}/> Approve recovery plan</button></div></div>
  </section>;
}

function ExecutionView({ state, onExecute, onContinue }: { state: WorkflowState; onExecute: () => void; onContinue: () => void }) {
  const complete = state.actions.every((action) => action.status === 'complete');
  const ready = state.actions.find((action) => action.status === 'ready');
  const ReadyTeamIcon = ready ? teamIcons[ready.team] : null;
  return <section className="view-enter">
    <PageHeading eyebrow="06 · COORDINATE THE ORGANIZATION" title={complete ? 'Five teams are aligned around one outcome.' : 'Each team receives the next safe commitment.'} description="PACT translates the approved plan into owned, dependency-aware business actions. No team can jump the sequence or exceed its authority." label={`${state.actions.filter((a) => a.status === 'complete').length} / ${state.actions.length} COMMITMENTS`} />
    <div className="execution-layout">
      <article className="action-graph panel"><div className="graph-spine" />{state.actions.map((action) => <ActionNode key={action.actionId} action={action} />)}</article>
      <article className="tool-console panel"><div className="panel-title"><div><Zap size={18}/><span>Next business commitment</span></div><span className="live-pill"><i/> SAFE SIMULATION</span></div>
        {ready ? <><span className="next-label">READY NOW</span><div className="commitment-owner"><div className="commitment-team-icon">{ReadyTeamIcon && <ReadyTeamIcon size={20}/>}</div><div><small>{ready.team} · {ready.owner}</small><strong>{ready.description}</strong></div></div><div className="commitment-impact"><div><span>Business purpose</span><strong>{ready.team === 'Finance' ? 'Unlock the bounded recovery budget' : ready.team === 'Procurement' ? 'Restore constrained component supply' : ready.team === 'Manufacturing' ? 'Protect the production sequence' : ready.team === 'Logistics' ? 'Secure pickup capacity' : ready.team === 'Customer' ? 'Protect strategic relationships' : 'Coordinate the recovery work'}</strong></div><div><span>Authorized cost</span><strong>{formatMoney(ready.estimatedCost)}</strong></div></div><div className="tool-guards"><div><Check size={14}/> Human approval valid</div><div><Check size={14}/> Predecessors complete</div><div><Check size={14}/> Policy checks pass</div></div><details className="technical-proof"><summary>Inspect technical execution proof</summary><code className="tool-name">{ready.toolOperation}</code><div className="tool-request"><span>SCHEMA-VALIDATED REQUEST</span><pre>{JSON.stringify({ approvedPlanId: 'PLAN-BALANCED-v1', actionId: ready.actionId, ...ready.parameters }, null, 2)}</pre></div></details><button className="primary-button execute-button" onClick={onExecute}><Play size={16}/> Record {ready.team} commitment</button></> : complete ? <div className="all-complete"><BadgeCheck size={38}/><h3>All commitments recorded</h3><p>Six governed commitments are correlated in the Outcome Ledger. The operating timeline can advance.</p><button className="primary-button" onClick={onContinue}>Measure business outcome <ArrowRight size={16}/></button></div> : <div className="waiting-tools"><Clock3 size={30}/><h3>Resolving dependencies</h3></div>}
        <div className="synthetic-warning"><ShieldCheck size={15}/><span>No live money, supplier, carrier, or customer system is changed.</span></div>
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
    <PageHeading eyebrow="07 · MEASURE THE BUSINESS RESULT" title={closed ? 'The target was met—and PACT can prove what changed.' : 'Track the outcome, not task completion.'} description="Observed performance stays separate from the plan projection, so leaders see both the result and the assumptions that held or failed." label={closed ? 'OUTCOME CLOSED · TARGET MET' : `MEASURING · DAY ${state.currentDay}`} />
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
        <div className="timeline-controls" aria-label="Outcome checkpoints">{scenario.observations.map((item) => <button key={item.day} aria-pressed={state.currentDay === item.day} className={state.currentDay === item.day ? 'active' : ''} onClick={() => onAdvance(item.day)}><span>{item.day <= state.currentDay ? <Check size={12}/> : null}</span>Day {item.day}</button>)}</div>
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
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="ledger-drawer" role="dialog" aria-modal="true" aria-labelledby="ledger-title" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-heading"><div><span>OUTCOME LEDGER</span><h2 id="ledger-title">Trace every consequential state.</h2></div><button className="icon-button" onClick={onClose} aria-label="Close Outcome Ledger" autoFocus><X size={18}/></button></div><div className="ledger-meta"><div><span>CORRELATION</span><code>PACT-OTIF-2026-07</code></div><div><span>EVENTS</span><strong>{state.ledger.length}</strong></div></div><div className="ledger-events">{[...state.ledger].reverse().map((event) => <article key={event.eventId} tabIndex={0}><div className="event-line"><span className="event-dot"/><i/></div><div><div className="event-top"><code>{event.eventId}</code><span>{new Date(event.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span></div><strong>{event.eventType}</strong><p>{event.source} · {event.status}</p><pre>{JSON.stringify(event.payload, null, 2)}</pre></div></article>)}</div><button className="primary-button drawer-export" onClick={() => downloadJson('pact-outcome-ledger.json', state.ledger)}><Download size={16}/> Export machine-readable JSON</button></aside></div>;
}
