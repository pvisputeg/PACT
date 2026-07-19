import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Boxes, Building2, CheckCircle2,
  ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Factory, FileCheck2, Fingerprint,
  GitBranch, Gauge, History, Layers3, LockKeyhole, Network, PackageCheck, Pause, Play,
  Radar, Route, SearchCheck, ShieldCheck, Sparkles, Target, Truck, Users, Warehouse, XCircle, Zap,
} from 'lucide-react';
import {
  AUDIT_CONDITION_SET_ID, PLAN_ID, appendLedger, auditBalancedPlan, buildBalancedPlan,
  calculateInventoryDiscrepancy, calculateProtectedValue, calculateUsableCoverage, createApproval, demonstrateUnsafeSupplierAttempt, derivePlantState,
  evaluateStrategy, executeNextAction, executeRemainingActions, getFinalObservation, getStrategy, hashContent, initialState,
  readyActions, scenario, verifySignal,
} from './domain/engine';
import { OUTCOME_DEFINITIONS } from './domain/outcome-definitions';
import {
  artifactSelectionFromSearch, loadAiArtifact,
  type ArtifactLoadResult, type ArtifactSelection,
} from './domain/ai-artifact';
import {
  enterpriseSignals, formatCompactMoney, missionControlHeadline, primarySignal, signalQueueSummary, statusLabel,
  type EnterpriseSignal,
} from './domain/signal-registry';
import { restoreWorkflowState, serializeWorkflowState } from './domain/workflow-storage';
import type { EvidenceLabel, LedgerEvent, Observation, PactAction, WorkflowStage, WorkflowState } from './domain/types';

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;
type AppView = 'command' | 'outcomes' | 'investigations' | 'approvals' | 'graph' | 'ledger' | 'replay' | 'plant' | 'outcome';
type AppRoute = { view: AppView; stage?: WorkflowStage; signalId?: string };
type PlantLayer = 'Production' | 'Machines' | 'People' | 'Inventory' | 'Orders' | 'Suppliers' | 'Logistics' | 'Quality' | 'Financial' | 'Outcome Risk';
type ArtifactUiState = ArtifactLoadResult | {
  status: 'loading';
  selection: ArtifactSelection;
  artifact: null;
  source: null;
  path: null;
  message: string;
};
type WorkflowRecoveryNotice = { title: string; message: string };

const STORAGE_KEY = 'pact.northstar.workflow.v2';
const LEGACY_STORAGE_KEY = 'pact.northstar.workflow.v1';
const SIGNAL_QUEUE_SUMMARY = signalQueueSummary();
const STAGES: Array<{ id: WorkflowStage; label: string; path: string; icon: Icon }> = [
  { id: 'investigation', label: 'Investigate', path: 'investigation', icon: SearchCheck },
  { id: 'define', label: 'Define outcome', path: 'define', icon: Target },
  { id: 'proof', label: 'Verify signal', path: 'verify', icon: ShieldCheck },
  { id: 'impact', label: 'Map impact', path: 'impact', icon: Network },
  { id: 'strategy', label: 'Compare', path: 'strategy', icon: Route },
  { id: 'audit', label: 'Challenge', path: 'audit', icon: FileCheck2 },
  { id: 'approval', label: 'Authorize', path: 'authorize', icon: LockKeyhole },
  { id: 'execution', label: 'Coordinate', path: 'coordinate', icon: GitBranch },
  { id: 'outcome', label: 'Measure', path: 'measure', icon: Gauge },
  { id: 'closeout', label: 'Close', path: 'closeout', icon: BadgeCheck },
];

const NAVIGATION: Array<{ label: string; view: AppView; path: string; icon: Icon }> = [
  { label: 'Command Center', view: 'command', path: '/', icon: Radar },
  { label: 'Plant Digital Twin', view: 'plant', path: '/plants/northstar-7', icon: Factory },
  { label: 'Outcomes', view: 'outcomes', path: '/outcomes', icon: Target },
  { label: 'Investigations', view: 'investigations', path: '/investigations', icon: SearchCheck },
  { label: 'Approvals', view: 'approvals', path: '/approvals', icon: LockKeyhole },
  { label: 'Action Graph', view: 'graph', path: '/action-graph', icon: GitBranch },
  { label: 'Outcome Ledger', view: 'ledger', path: '/ledger', icon: History },
  { label: 'Replay', view: 'replay', path: '/replay', icon: Play },
];

function pathForStage(stage: WorkflowStage) {
  return `/outcomes/northstar/${STAGES.find((item) => item.id === stage)?.path ?? 'investigation'}`;
}

function pathForSignal(signalId: string) {
  return `/investigations/${encodeURIComponent(signalId)}`;
}

function routeFromHash(): AppRoute {
  const path = window.location.hash.replace(/^#/, '') || '/';
  if (path.startsWith('/plants/northstar-7')) return { view: 'plant' };
  if (path === '/outcomes') return { view: 'outcomes' };
  if (path.startsWith('/investigations')) {
    const signalId = decodeURIComponent(path.split('/')[2] ?? '');
    return { view: 'investigations', signalId: enterpriseSignals.some((signal) => signal.id === signalId) ? signalId : undefined };
  }
  if (path === '/approvals') return { view: 'approvals' };
  if (path === '/action-graph') return { view: 'graph' };
  if (path === '/ledger') return { view: 'ledger' };
  if (path === '/replay') return { view: 'replay' };
  if (path.startsWith('/outcomes/northstar')) {
    const slug = path.split('/')[3];
    return { view: 'outcome', stage: STAGES.find((item) => item.path === slug)?.id };
  }
  return { view: 'command' };
}

function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function compactMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return money(value);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00.000Z`));
}

function stageUnlocked(stage: WorkflowStage, state: WorkflowState) {
  if (stage === 'investigation' || stage === 'define') return true;
  if (stage === 'proof') return state.contractConfirmed;
  if (stage === 'impact' || stage === 'strategy') return state.verification?.classification === 'verified_material_risk';
  if (stage === 'audit') return state.actions.length > 0;
  if (stage === 'approval') return state.auditConditionAcceptance !== null;
  if (stage === 'execution') return state.approval?.decision === 'approved_with_conditions';
  if (stage === 'outcome') return state.actions.length > 0 && state.actions.every((action) => action.status === 'complete');
  if (stage === 'closeout') return state.currentDay === scenario.outcomeContract.deadlineDays;
  return false;
}

function stateLabel(state: WorkflowState) {
  if (state.stage === 'closeout') return 'OUTCOME ACHIEVED';
  if (state.stage === 'outcome') return `OBSERVING · DAY ${state.currentDay}`;
  if (state.stage === 'execution') return `${state.actions.filter((item) => item.status === 'complete').length}/${state.actions.length} COMMITMENTS`;
  if (state.approval?.decision === 'rejected') return 'PLAN REJECTED · NO AUTHORITY';
  if (state.approval?.decision === 'revision_requested') return 'REVISION REQUESTED';
  if (state.stage === 'approval') return 'HUMAN DECISION';
  if (state.stage === 'audit') return 'AUDITOR CHALLENGE';
  if (state.verification?.classification === 'verified_material_risk') return 'RISK VERIFIED';
  return 'VERIFICATION REQUIRED';
}

export function App() {
  const [route, setRoute] = useState(routeFromHash);
  const artifactSelection = useMemo(() => artifactSelectionFromSearch(window.location.search), []);
  const [artifactState, setArtifactState] = useState<ArtifactUiState>({
    status: 'loading', selection: artifactSelection, artifact: null, source: null, path: null,
    message: 'Validating the selected model artifact against the strict Northstar schema.',
  });
  const restoredWorkflow = useMemo<{ state: WorkflowState; notice: WorkflowRecoveryNotice | null }>(() => {
    if (new URLSearchParams(window.location.search).get('reset') === '1') return { state: initialState, notice: null };
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!stored) return { state: initialState, notice: null };
      const restored = restoreWorkflowState(stored, scenario.scenarioId);
      if (restored.ok) return { state: restored.state, notice: null };
      return {
        state: {
          ...initialState,
          ledger: appendLedger(initialState.ledger, 'workflow.recovered', 'deterministic_state_guard', 'recovered', {
            reason: restored.reason,
            scenarioId: scenario.scenarioId,
            label: 'FACT',
          }),
        },
        notice: { title: 'Saved session rejected · safe baseline restored', message: restored.reason },
      };
    } catch {
      return {
        state: initialState,
        notice: { title: 'Browser storage unavailable', message: 'PACT started from the safe baseline and will keep this session in memory.' },
      };
    }
  }, []);
  const [state, setState] = useState<WorkflowState>(restoredWorkflow.state);
  const [recoveryNotice, setRecoveryNotice] = useState<WorkflowRecoveryNotice | null>(restoredWorkflow.notice);

  useEffect(() => {
    const change = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    let active = true;
    setArtifactState({
      status: 'loading', selection: artifactSelection, artifact: null, source: null, path: null,
      message: 'Validating the selected model artifact against the strict Northstar schema.',
    });
    void loadAiArtifact(artifactSelection).then((result) => { if (active) setArtifactState(result); });
    return () => { active = false; };
  }, [artifactSelection]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeWorkflowState(state, scenario.scenarioId));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      setRecoveryNotice({ title: 'Workflow persistence paused', message: 'The current governed state remains in memory, but it could not be validated and saved for reload.' });
    }
  }, [state]);
  useEffect(() => {
    if (route.view === 'outcome' && route.stage && stageUnlocked(route.stage, state) && state.stage !== route.stage) {
      setState((current) => ({ ...current, stage: route.stage as WorkflowStage }));
    }
  }, [route, state]);

  const setStage = (stage: WorkflowStage) => {
    if (!stageUnlocked(stage, state)) return;
    setState((current) => ({ ...current, stage }));
    navigate(pathForStage(stage));
  };
  const startInvestigation = () => {
    setState((current) => ({ ...current, stage: 'investigation', ledger: appendLedger(current.ledger, 'investigation.opened', 'PACT Proof Investigator', 'open', { signalId: scenario.signal.id, evidenceIds: scenario.shipment.evidenceIds }) }));
    navigate(pathForStage('investigation'));
  };
  const defineOutcome = () => {
    setState((current) => ({ ...current, stage: 'define', ledger: appendLedger(current.ledger, 'investigation.materiality_confirmed', 'PACT Proof Investigator', 'complete', { estimatedExposure: scenario.impact.revenueExposure, label: 'ESTIMATED', evidenceIds: ['EVD-EDI-101', 'EVD-ORD-113'] }) }));
    navigate(pathForStage('define'));
  };
  const confirmContract = async () => {
    const contractHash = await hashContent(scenario.outcomeContract);
    const verification = verifySignal();
    setState((current) => ({
      ...current, stage: 'proof', contractConfirmed: true, contractHash, verification,
      ledger: appendLedger(current.ledger, 'outcome.contract_accepted', scenario.outcomeContract.authorities.humanApprover, 'complete', {
        contractId: scenario.outcomeContract.id,
        contractHash,
        target: scenario.outcomeContract.targetProtectedRevenuePercent,
        deadlineDays: scenario.outcomeContract.deadlineDays,
        budget: scenario.outcomeContract.maximumBudget,
        label: 'FACT',
      }),
    }));
    navigate(pathForStage('proof'));
  };
  const acceptProof = () => {
    setState((current) => ({ ...current, stage: 'impact', ledger: appendLedger(current.ledger, 'signal.verified', 'PACT Proof Investigator', 'complete', { classification: current.verification?.classification, evidenceIds: current.verification?.evidenceIds, usableCoverageDays: current.verification?.usableCoverageDays ?? calculateUsableCoverage(), label: 'CALCULATED' }) }));
    navigate(pathForStage('impact'));
  };
  const compareStrategies = () => {
    setState((current) => ({ ...current, stage: 'strategy', ledger: appendLedger(current.ledger, 'impact.quantified', 'PACT Outcome Lead', 'complete', { revenueExposure: scenario.impact.revenueExposure, ordersAtRisk: scenario.impact.ordersAtRisk, customers: scenario.impact.strategicCustomers, evidenceIds: ['EVD-ORD-113', 'EVD-FIN-118'], label: 'CALCULATED' }) }));
    navigate(pathForStage('strategy'));
  };
  const submitForAudit = () => {
    const actions = buildBalancedPlan();
    const selected = scenario.strategies.find((item) => item.id === state.selectedStrategyId) ?? scenario.strategies[2];
    const findings = auditBalancedPlan(selected, actions);
    const recommended = getStrategy('STR-BALANCED');
    const artifact = artifactState.status === 'ready' ? artifactState.artifact : null;
    let ledger = appendLedger(state.ledger, 'strategies.simulated', 'deterministic_strategy_engine', 'complete', { strategyIds: scenario.strategies.map((item) => item.id), recommendedStrategyId: recommended.id, projection: recommended.projectedProtectedRevenuePercent, label: 'SIMULATED' });
    ledger = artifact
      ? appendLedger(ledger, 'model.plan_proposed', artifact.provenance.planAgent, 'proposed', {
        planId: PLAN_ID,
        agentRole: 'propose_only',
        artifactKind: artifact.provenance.kind,
        model: artifact.model,
        responseId: artifact.provenance.planResponseId,
        traceId: artifact.provenance.planTraceId,
        recommendedStrategyId: artifact.plan.recommendedStrategyId,
        evidenceCitations: artifact.plan.evidenceCitations,
        evidenceIds: scenario.verificationPolicy.requiredControlIds,
        toolCalls: 0,
        label: 'INFERRED',
      })
      : appendLedger(ledger, 'model.artifact_unavailable', 'deterministic_governance_layer', 'not_consumed', {
        selection: artifactState.selection,
        reason: artifactState.status === 'ready' ? 'Artifact became available after the decision boundary was evaluated.' : artifactState.message,
        toolCalls: 0,
        label: 'FACT',
      });
    ledger = appendLedger(ledger, 'audit.packet_sealed', 'deterministic_governance_layer', 'immutable', { packetId: scenario.audit.packetId, actionIds: actions.map((item) => item.actionId) });
    setState((current) => ({ ...current, stage: 'audit', actions, auditFindings: findings, approval: null, ledger }));
    navigate(pathForStage('audit'));
  };
  const acceptAudit = () => {
    const requiredConditionCount = scenario.audit.requiredConditions.length;
    const artifact = artifactState.status === 'ready' ? artifactState.artifact : null;
    const acceptance = { conditionSetId: AUDIT_CONDITION_SET_ID, sourceResponseId: artifact?.provenance.auditResponseId ?? 'deterministic_audit_fixture_northstar_001', requiredConditionCount, adoptedAt: new Date(new Date(scenario.generatedAt).getTime() + 8 * 60000).toISOString(), adoptedBy: scenario.outcomeContract.authorities.humanApprover };
    let ledger = appendLedger(state.ledger, 'audit.completed', artifact?.provenance.auditAgent ?? 'PACT Auditor · deterministic fixture', 'decision_ready_with_conditions', {
      packetId: scenario.audit.packetId,
      findingIds: scenario.audit.findings.map((item) => item.id),
      agentRole: 'independent_challenge',
      artifactKind: artifact?.provenance.kind ?? 'none',
      modelVerdict: artifact?.audit.verdict ?? 'not_consumed',
      responseId: artifact?.provenance.auditResponseId ?? null,
      traceId: artifact?.provenance.auditTraceId ?? null,
      toolCalls: 0,
    });
    ledger = appendLedger(ledger, 'audit.conditions_bound', scenario.outcomeContract.authorities.humanApprover, 'complete', { conditionSetId: AUDIT_CONDITION_SET_ID, requiredConditionCount });
    setState((current) => ({ ...current, stage: 'approval', auditConditionAcceptance: acceptance, ledger }));
    navigate(pathForStage('approval'));
  };
  const authorize = () => {
    const approval = createApproval();
    const approvedBase: WorkflowState = {
      ...state,
      stage: 'execution',
      approval,
      actions: readyActions(state.actions),
      ledger: appendLedger(state.ledger, 'action_contract.approved_with_conditions', approval.approver, 'complete', { planId: PLAN_ID, authority: approval.authority, conditions: approval.conditions, scope: approval.scope, label: 'FACT' }),
    };
    setState(demonstrateUnsafeSupplierAttempt(approvedBase));
    navigate(pathForStage('execution'));
  };
  const requestChanges = () => {
    const decision = createApproval('revision_requested');
    setState((current) => ({
      ...current,
      stage: 'strategy',
      actions: [],
      auditFindings: [],
      auditConditionAcceptance: null,
      approval: decision,
      ledger: appendLedger(current.ledger, 'action_contract.revision_requested', decision.approver, 'revision_requested', { decision: decision.decision, rationale: decision.rationale, unlockedScope: decision.scope, label: 'FACT' }),
    }));
    navigate(pathForStage('strategy'));
  };
  const rejectPlan = () => {
    const decision = createApproval('rejected');
    setState((current) => ({
      ...current,
      stage: 'approval',
      approval: decision,
      ledger: appendLedger(current.ledger, 'action_contract.rejected', decision.approver, 'rejected', { decision: decision.decision, rationale: decision.rationale, unlockedScope: decision.scope, label: 'FACT' }),
    }));
    navigate(pathForStage('approval'));
  };
  const executeNext = () => setState((current) => executeNextAction(current));
  const executeAll = () => setState((current) => executeRemainingActions(current));
  const enterMeasurement = () => {
    setState((current) => ({ ...current, stage: 'outcome', currentDay: scenario.observations[0].day, ledger: appendLedger(current.ledger, 'execution.graph_completed', 'PACT Outcome Lead', 'complete', { completedActionIds: current.actions.map((item) => item.actionId), customerDeliveryState: 'not_sent' }) }));
    navigate(pathForStage('outcome'));
  };
  const observeDay = (day: number) => setState((current) => {
    const observation = scenario.observations.find((item) => item.day === day);
    if (!observation) return current;
    return { ...current, currentDay: day, ledger: appendLedger(current.ledger, `outcome.day_${day}_observed`, 'synthetic_operating_twin', 'observed', { ...observation }) };
  });
  const closeOutcome = () => {
    const finalObservation = getFinalObservation();
    let ledger = appendLedger(state.ledger, 'outcome.closed', scenario.outcomeContract.authorities.humanApprover, 'achieved', { ...scenario.closeout, observedProtectedValue: calculateProtectedValue(finalObservation.protectedRevenuePercent), label: 'OBSERVED' });
    ledger = appendLedger(ledger, 'learning.retained', 'PACT Outcome Office', 'complete', { lessonIds: scenario.lessons.map((item) => item.id), evidenceIds: scenario.lessons.flatMap((item) => item.evidenceIds), reusable: true });
    setState((current) => ({ ...current, stage: 'closeout', ledger }));
    navigate(pathForStage('closeout'));
  };
  const reset = () => {
    let storageNotice: WorkflowRecoveryNotice | null = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      storageNotice = { title: 'Browser storage unavailable', message: 'PACT reset the active session in memory; stored browser data could not be cleared.' };
    }
    setRecoveryNotice(storageNotice);
    setState(initialState);
    navigate('/');
  };

  const activeStage = route.view === 'outcome' && route.stage && stageUnlocked(route.stage, state) ? route.stage : state.stage;
  return <div className="northstar-app">
    <AppSidebar route={route} state={state}/>
    <div className="ns-shell">
      <TopBar state={state} artifactState={artifactState} onReset={reset}/>
      {recoveryNotice && <WorkflowRecoveryBanner notice={recoveryNotice} onDismiss={() => setRecoveryNotice(null)}/>}
      <main className="ns-main">
        {route.view === 'command' && <CommandCenter state={state} onEnter={startInvestigation}/>}
        {route.view === 'plant' && <PlantDigitalTwin state={state}/>}
        {route.view === 'outcomes' && <OutcomePortfolio state={state} onEnter={startInvestigation}/>}
        {route.view === 'investigations' && <Investigations state={state} onEnter={startInvestigation} selectedSignalId={route.signalId}/>}
        {route.view === 'approvals' && <ApprovalQueue state={state} onOpen={() => navigate(pathForStage(state.stage === 'approval' ? 'approval' : 'audit'))}/>}
        {route.view === 'graph' && <ActionGraphPage state={state} onOpen={() => navigate(pathForStage('execution'))}/>}
        {route.view === 'ledger' && <ExecutiveLedgerTimeline events={state.ledger}/>}
        {route.view === 'replay' && <OutcomeReplayController state={state}/>}
        {route.view === 'outcome' && <OutcomeRoom state={state} artifactState={artifactState} stage={activeStage} setState={setState} onStage={setStage} onDefine={defineOutcome} onConfirm={confirmContract} onProof={acceptProof} onImpact={compareStrategies} onAudit={submitForAudit} onAcceptAudit={acceptAudit} onAuthorize={authorize} onRequestChanges={requestChanges} onReject={rejectPlan} onExecuteNext={executeNext} onExecuteAll={executeAll} onMeasure={enterMeasurement} onObserve={observeDay} onClose={closeOutcome}/>}
      </main>
    </div>
  </div>;
}

function WorkflowRecoveryBanner({ notice, onDismiss }: { notice: WorkflowRecoveryNotice; onDismiss: () => void }) {
  return <div className="workflow-recovery" role="status" aria-live="polite">
    <AlertTriangle size={18}/>
    <span><strong>{notice.title}</strong><small>{notice.message}</small></span>
    <button onClick={onDismiss}>Dismiss</button>
  </div>;
}

function AppSidebar({ route, state }: { route: { view: AppView }; state: WorkflowState }) {
  return <aside className="ns-sidebar">
    <button className="ns-brand" onClick={() => navigate('/')} aria-label="PACT Command Center"><i><Zap size={19}/></i><span><strong>PACT</strong><small>OUTCOME OS</small></span></button>
    <nav aria-label="Primary navigation">{NAVIGATION.map(({ label, view, path, icon: NavIcon }) => <button key={path} aria-label={label} className={route.view === view ? 'active' : ''} onClick={() => navigate(path)} title={label}><NavIcon size={18}/><span>{label}</span>{view === 'approvals' && state.auditFindings.length > 0 && !state.approval ? <b aria-hidden="true">1</b> : null}</button>)}</nav>
    <div className="ns-sidebar-foot"><ShieldCheck size={16}/><span><strong>Governed locally</strong><small>Synthetic environment</small></span></div>
  </aside>;
}

function TopBar({ state: _state, artifactState, onReset }: { state: WorkflowState; artifactState: ArtifactUiState; onReset: () => void }) {
  const mode = artifactState.status === 'ready'
    ? artifactState.source === 'genuine' ? 'GENUINE GPT-5.6 · STRICT SCHEMA' : 'LOCAL SCHEMA FIXTURE · NO API CALL'
    : artifactState.status === 'loading' ? 'MODEL ARTIFACT · VALIDATING'
      : artifactState.status === 'disabled' ? 'MODEL ARTIFACT · OFF'
        : 'MODEL ARTIFACT · REJECTED';
  return <header className="ns-topbar">
    <div><span className="ns-live"><i/> SCENARIO LIVE</span><strong>{scenario.enterprise.name}</strong><small>Enterprise Outcome Control Plane</small></div>
    <div className="ns-top-status"><ProvenanceBadge label={mode}/><span><Clock3 size={14}/> {SIGNAL_QUEUE_SUMMARY.scenarioTime}</span><button onClick={onReset}>Reset scenario</button></div>
  </header>;
}

function ProvenanceBadge({ label }: { label: string }) {
  return <span className="provenance-badge"><Fingerprint size={13}/>{label}</span>;
}

function SyntheticDisclosure() {
  return <div className="synthetic-disclosure"><ShieldCheck size={14}/><span><strong>SYNTHETIC OPERATING ENVIRONMENT</strong> · Deterministic scenario data. No production systems or external communications.</span></div>;
}

function DisruptionSignalBanner({ compact = false, signal = primarySignal }: { compact?: boolean; signal?: EnterpriseSignal }) {
  return <section className={`disruption-banner ${compact ? 'compact' : ''} ${signal.severity}`}>
    <div className="signal-pulse"><AlertTriangle size={22}/><i/><b/></div>
    <div><span>{signal.severity.toUpperCase()} · {statusLabel(signal.status)}</span><strong>{signal.title}</strong><p>{signal.summary} · <code>{signal.evidenceIds[0]}</code></p></div>
    <div><small>DECISION WINDOW</small><strong>{signal.decisionWindowDays === 1 ? 'Today' : `${signal.decisionWindowDays} days`}</strong><span>{signal.workflowAvailability === 'end_to_end' ? 'governed outcome available' : 'evidence review only'}</span></div>
  </section>;
}

function PageIntro({ eyebrow, title, description, meta }: { eyebrow: string; title: string; description: string; meta?: string }) {
  return <div className="ns-page-intro"><div><span>{eyebrow}</span><h1 tabIndex={-1}>{title}</h1><p>{description}</p></div>{meta && <b>{meta}</b>}</div>;
}

function CommandCenter({ state, onEnter }: { state: WorkflowState; onEnter: () => void }) {
  const plantState = derivePlantState(state.actions);
  const displaySignal: EnterpriseSignal = state.verification ? { ...primarySignal, status: 'verified_material_risk', confidence: 'high' } : primarySignal;
  return <div className="ns-page command-page">
    <SyntheticDisclosure/>
    <PageIntro eyebrow={`ENTERPRISE MISSION CONTROL · ${SIGNAL_QUEUE_SUMMARY.scenarioTime}`} title={missionControlHeadline(enterpriseSignals, state.verification ? [primarySignal.id] : [])} description={`PACT verifies the risk, makes enterprise dependencies visible, and governs a ${scenario.outcomeContract.deadlineDays}-day cross-functional recovery decision.`} meta={stateLabel(state)}/>
    <DisruptionSignalBanner compact signal={displaySignal}/>
    <SignalRadar/>
    <div className="command-grid">
      <section className="attention-orbit">
        <div className="orbit-visual" aria-hidden="true"><i/><i/><i/><span><strong>{plantState.coverageDays}</strong><small>DAYS<br/>COVERAGE</small></span><b className="orbit-node n1"/><b className="orbit-node n2"/><b className="orbit-node n3"/></div>
        <div className="attention-copy"><span>EXECUTIVE ATTENTION · RANK 01</span><h2>{scenario.outcomeContract.name}</h2><p>{scenario.plant.name} · {scenario.outcomeContract.domain}</p><div className="attention-metrics"><div><small>VALUE EXPOSED</small><strong>{formatCompactMoney(primarySignal.materialityExposure)}</strong></div><div><small>ORDERS AT RISK</small><strong>{scenario.impact.ordersAtRisk}</strong></div><div><small>STRATEGIC CUSTOMERS</small><strong>{scenario.impact.strategicCustomers}</strong></div><div><small>MATERIAL COVERAGE</small><strong>{plantState.coverageDays}d</strong></div></div><div className="decision-line"><LockKeyhole size={16}/><span><strong>Decision required</strong> · Authorize bounded recovery across {new Set(scenario.actionGraph.map((action) => action.team)).size} functions</span></div><button className="ns-primary" onClick={onEnter}>Enter Outcome Room <ArrowRight size={16}/></button></div>
      </section>
      <aside className="mission-stack">
        <div className="mission-stack-head"><span>OUTCOME TELEMETRY</span><b>LIVE TWIN</b></div>
        <HudMetric icon={Factory} label="LINE C RISK" value={plantState.lineCRisk.toUpperCase()} tone={plantState.lineCRisk === 'high' ? 'danger' : 'good'}/>
        <HudMetric icon={CircleDollarSign} label="RECOVERY AUTHORITY" value={state.approval ? `${formatCompactMoney(scenario.actionContract.maximumBudget)} BOUND` : 'LOCKED'} tone={state.approval ? 'good' : 'amber'}/>
        <HudMetric icon={GitBranch} label="COMMITMENTS COMPLETE" value={`${state.actions.filter((item) => item.status === 'complete').length} / ${state.actions.length || 10}`} tone="cyan"/>
        <HudMetric icon={ShieldCheck} label="QUALITY THRESHOLD" value="UNCHANGED" tone="good"/>
        <button className="twin-link" onClick={() => navigate('/plants/northstar-7')}><Layers3 size={16}/> Inspect Northstar digital twin <ChevronRight size={16}/></button>
      </aside>
    </div>
    <PortfolioStrip onEnter={onEnter}/>
  </div>;
}

function SignalRadar() {
  return <section className="signal-radar" aria-label="Enterprise signal radar">
    <header>
      <div><Radar size={16}/><span>ENTERPRISE SIGNAL RADAR</span><small>Versioned synthetic registry · select any signal to inspect its evidence record</small></div>
      <button onClick={() => navigate('/investigations')}>View full queue <ArrowRight size={14}/></button>
    </header>
    <div>{enterpriseSignals.map((signal, index) => <button key={signal.id} className={signal.severity} onClick={() => navigate(pathForSignal(signal.id))} aria-label={`Inspect ${signal.title}`}>
      <i>{String(index + 1).padStart(2, '0')}</i>
      <span><strong>{signal.title}</strong><small>{signal.domain} · {statusLabel(signal.status)}</small></span>
      <em>{formatCompactMoney(signal.materialityExposure)}</em>
      <b>{signal.severity.toUpperCase()}</b>
    </button>)}</div>
  </section>;
}

function HudMetric({ icon: MetricIcon, label, value, tone }: { icon: Icon; label: string; value: string; tone: string }) {
  return <div className={`hud-metric ${tone}`}><i><MetricIcon size={17}/></i><span><small>{label}</small><strong>{value}</strong></span><b><em/></b></div>;
}

function PortfolioStrip({ onEnter }: { onEnter: () => void }) {
  const items = OUTCOME_DEFINITIONS.slice(0, 5);
  return <section className="portfolio-strip"><header><span>ENTERPRISE OUTCOME PORTFOLIO</span><small>Ranked by value, urgency, and authority · synthetic</small></header>{items.map((item, index) => <button key={item.id} onClick={index === 0 ? onEnter : () => navigate('/outcomes')} className={index === 0 ? 'priority' : ''}><i>{String(index + 1).padStart(2, '0')}</i><span><strong>{item.title}</strong><small>{item.domain} · {item.owner}</small></span><b>{item.value}</b><em>{item.status.toUpperCase()}</em><ChevronRight size={15}/></button>)}</section>;
}

function OutcomePortfolio({ state, onEnter }: { state: WorkflowState; onEnter: () => void }) {
  const featured = OUTCOME_DEFINITIONS[0];
  const materialCount = OUTCOME_DEFINITIONS.filter((item) => item.attention === 'critical').length;
  return <div className="ns-page"><SyntheticDisclosure/><PageIntro eyebrow="OUTCOME PORTFOLIO" title="Govern commitments, not dashboards." description="Every outcome carries a target, authority boundary, evidence state, action graph, and closeout measure." meta={`${OUTCOME_DEFINITIONS.length} ACTIVE · ${materialCount} MATERIAL`}/><div className="portfolio-large"><section className="portfolio-feature"><span>PRIORITY 01 · {stateLabel(state)}</span><h2>{featured.title}</h2><p>{featured.contract.objective}</p><div><strong>{formatCompactMoney(scenario.impact.revenueExposure)}<small>EXPOSED</small></strong><strong>{scenario.strategies[2].projectedProtectedRevenuePercent}%<small>SIMULATED PLAN</small></strong><strong>{new Set(scenario.actionGraph.map((action) => action.team)).size}<small>FUNCTIONS</small></strong></div><button className="ns-primary" onClick={onEnter}>Open governed outcome <ArrowRight size={16}/></button></section><PortfolioStrip onEnter={onEnter}/></div></div>;
}

function Investigations({ state, onEnter, selectedSignalId = primarySignal.id }: { state: WorkflowState; onEnter: () => void; selectedSignalId?: string }) {
  const selectedSignal = enterpriseSignals.find((signal) => signal.id === selectedSignalId) ?? primarySignal;
  const isNorthstar = selectedSignal.id === primarySignal.id;
  const selectedStatus = isNorthstar && state.verification ? 'verified_material_risk' : selectedSignal.status;
  const displaySignal: EnterpriseSignal = { ...selectedSignal, status: selectedStatus, confidence: isNorthstar && state.verification ? 'high' : selectedSignal.confidence };
  return <div className="ns-page investigations-page">
    <SyntheticDisclosure/>
    <PageIntro eyebrow="INVESTIGATION QUEUE" title="Verify before the enterprise moves." description="Signals remain hypotheses until source, definition, inventory, and materiality controls reproduce the risk." meta={SIGNAL_QUEUE_SUMMARY.queueLabel}/>
    <DisruptionSignalBanner signal={displaySignal}/>
    <div className="investigations-workspace">
      <section className="signal-queue" aria-label="Enterprise signal queue">
        <header><span>LIVE MOCK SIGNAL REGISTRY</span><b>{enterpriseSignals.length} SIGNALS</b></header>
        {enterpriseSignals.map((signal, index) => <button key={signal.id} className={`${selectedSignal.id === signal.id ? 'active' : ''} ${signal.severity}`} onClick={() => navigate(pathForSignal(signal.id))}>
          <i>{String(index + 1).padStart(2, '0')}</i>
          <span><strong>{signal.title}</strong><small>{signal.domain} · {signal.source}</small></span>
          <em>{formatCompactMoney(signal.materialityExposure)}</em>
          <b>{signal.severity.toUpperCase()}</b>
          <ChevronRight size={15}/>
        </button>)}
      </section>
      <section className="investigation-record">
        <div className={`investigation-radar ${selectedSignal.severity}`}><Radar size={54}/><i/><b/></div>
        <div><span>{selectedSignal.id} · {statusLabel(selectedStatus)}</span><h2>{selectedSignal.title}</h2><p>{selectedSignal.summary}</p><div className="record-grid"><DataPoint label="SOURCE" value={selectedSignal.source}/><DataPoint label="CONFIDENCE" value={isNorthstar && state.verification ? 'High' : selectedSignal.confidence}/><DataPoint label="FRESHNESS" value={`${selectedSignal.freshnessMinutes} minutes`}/><DataPoint label="MATERIALITY" value={`${formatCompactMoney(selectedSignal.materialityExposure)} estimated`}/><DataPoint label="INVESTIGATOR" value={selectedSignal.assignedInvestigator}/><DataPoint label="EVIDENCE" value={`${selectedSignal.evidenceIds.length} linked records`}/></div></div>
        {selectedSignal.workflowAvailability === 'end_to_end' ? <button className="ns-primary" onClick={onEnter}>Open governed investigation <ArrowRight size={16}/></button> : <div className="signal-readiness"><ShieldCheck size={18}/><span><strong>Evidence review only</strong><small>Not yet eligible for governed action</small></span></div>}
      </section>
    </div>
  </div>;
}

function ApprovalQueue({ state, onOpen }: { state: WorkflowState; onOpen: () => void }) {
  const decisionLabel = state.approval?.decision === 'approved_with_conditions' ? 'AUTHORIZED WITH CONDITIONS' : state.approval?.decision === 'rejected' ? 'REJECTED · NO AUTHORITY' : state.approval?.decision === 'revision_requested' ? 'REVISION REQUESTED' : 'DECISION REQUIRED TODAY';
  const queueLabel = state.approval?.decision === 'approved_with_conditions' ? '1 AUTHORIZED' : state.approval?.decision === 'rejected' ? '1 REJECTED' : state.approval?.decision === 'revision_requested' ? '1 REVISION' : '1 DECISION REQUIRED';
  return <div className="ns-page"><SyntheticDisclosure/><PageIntro eyebrow="HUMAN AUTHORITY QUEUE" title="The consequential decision has one named owner." description="PACT may propose, challenge, and prepare. Only a human authority can unlock bounded enterprise commitments." meta={queueLabel}/><section className="approval-queue"><div className="approval-rank">01</div><div><span>{decisionLabel}</span><h2>{scenario.outcomeContract.name}</h2><p>{scenario.outcomeContract.authorities.humanApprover} authority · {scenario.outcomeContract.authorities.finance} co-authority · immutable independent audit</p></div><div className="approval-stakes"><small>VALUE AT STAKE</small><strong>{formatCompactMoney(scenario.impact.revenueExposure)}</strong><small>MAXIMUM AUTHORITY</small><strong>{formatCompactMoney(scenario.actionContract.maximumBudget)}</strong></div><button className="ns-primary" onClick={onOpen}>{state.approval ? 'Inspect decision' : 'Review decision packet'} <ArrowRight size={16}/></button></section></div>;
}

function ActionGraphPage({ state, onOpen }: { state: WorkflowState; onOpen: () => void }) {
  const actions = state.actions.length ? state.actions : buildBalancedPlan();
  return <div className="ns-page"><SyntheticDisclosure/><PageIntro eyebrow="CROSS-FUNCTIONAL ACTION GRAPH" title="See what the enterprise can safely do next." description="Readiness is computed from evidence, human authority, policy, and completed predecessors—not task assignment." meta={`${actions.filter((item) => item.status === 'complete').length}/${actions.length} COMPLETE`}/><ActionDependencyGraph actions={actions}/><button className="ns-primary graph-open" onClick={onOpen}>Open governed execution room <ArrowRight size={16}/></button></div>;
}

function OutcomeRoom(props: {
  state: WorkflowState; artifactState: ArtifactUiState; stage: WorkflowStage; setState: React.Dispatch<React.SetStateAction<WorkflowState>>; onStage: (stage: WorkflowStage) => void;
  onDefine: () => void; onConfirm: () => void; onProof: () => void; onImpact: () => void; onAudit: () => void; onAcceptAudit: () => void; onAuthorize: () => void; onRequestChanges: () => void; onReject: () => void;
  onExecuteNext: () => void; onExecuteAll: () => void; onMeasure: () => void; onObserve: (day: number) => void; onClose: () => void;
}) {
  const { state, stage, setState, onStage } = props;
  return <div className="outcome-room">
    <header className="outcome-room-head"><button onClick={() => navigate('/')}><ArrowLeft size={15}/> Mission Control</button><div><span>{scenario.outcomeContract.id} · {scenario.outcomeContract.name.toUpperCase()}</span><strong>{scenario.plant.name}</strong></div><div><b>{stateLabel(state)}</b><small>{formatCompactMoney(scenario.impact.revenueExposure)} exposed · {scenario.outcomeContract.deadlineDays}-day contract</small></div></header>
    <nav className="stage-rail">{STAGES.map(({ id, label, icon: StageIcon }, index) => { const unlocked = stageUnlocked(id, state); const active = stage === id; const completed = STAGES.findIndex((item) => item.id === state.stage) > index || (id === 'closeout' && state.stage === 'closeout'); return <button key={id} disabled={!unlocked} className={`${active ? 'active' : ''} ${completed ? 'complete' : ''}`} onClick={() => onStage(id)}><i>{completed ? <CheckCircle2 size={14}/> : <StageIcon size={14}/>}</i><span><small>{String(index + 1).padStart(2, '0')}</small>{label}</span></button>; })}</nav>
    <div className="outcome-stage">
      {stage === 'investigation' && <InvestigationStage onContinue={props.onDefine}/>}
      {stage === 'define' && <DefineStage state={state} onContinue={props.onConfirm}/>}
      {stage === 'proof' && <ProofStage state={state} onContinue={props.onProof}/>}
      {stage === 'impact' && <ImpactStage onContinue={props.onImpact}/>}
      {stage === 'strategy' && <StrategyStage state={state} artifactState={props.artifactState} setState={setState} onContinue={props.onAudit}/>}
      {stage === 'audit' && <AuditStage state={state} artifactState={props.artifactState} onContinue={props.onAcceptAudit}/>}
      {stage === 'approval' && <AuthorizationStage state={state} onContinue={props.onAuthorize} onRequestChanges={props.onRequestChanges} onReject={props.onReject}/>}
      {stage === 'execution' && <ExecutionStage state={state} onNext={props.onExecuteNext} onAll={props.onExecuteAll} onContinue={props.onMeasure}/>}
      {stage === 'outcome' && <MeasurementStage state={state} onObserve={props.onObserve} onClose={props.onClose}/>}
      {stage === 'closeout' && <CloseoutStage state={state}/>}
    </div>
  </div>;
}

function StageIntro({ number, eyebrow, title, question, tag }: { number: string; eyebrow: string; title: string; question: string; tag: string }) {
  return <header className="stage-intro"><i>{number}</i><div><span>{eyebrow}</span><h1>{title}</h1><p>{question}</p></div><b>{tag}</b></header>;
}

function InvestigationStage({ onContinue }: { onContinue: () => void }) {
  const evidenceFeeds = scenario.verificationControls.slice(0, 7);
  return <><StageIntro number="01" eyebrow="INVESTIGATION · SIGNAL INTAKE" title="A diversion is a signal—not yet a decision." question="Is the delay real, and is it material enough to become a governed business outcome?" tag="POTENTIALLY MATERIAL"/><DisruptionSignalBanner/><div className="stage-grid two"><section className="ns-panel evidence-source"><header><span>SOURCE CONVERGENCE</span><b>{evidenceFeeds.length} EVIDENCE FEEDS</b></header>{evidenceFeeds.map((feed, index) => <div key={feed.id}><BadgeCheck size={15}/><span><strong>{feed.name}</strong><code>{feed.id}</code></span><b>{index < 2 ? 'OBSERVED' : 'FACT'}</b></div>)}</section><section className="ns-panel investigation-brief"><span>INITIAL ASSESSMENT</span><h2>{scenario.shipment.delayDays} days late</h2><p>The affected material feeds the {scenario.material.usage}. Gross ERP coverage appears sufficient, but restricted inventory has not yet been removed.</p><DataPoint label="PLANT" value={scenario.plant.name}/><DataPoint label="MATERIAL" value={scenario.material.name}/><DataPoint label="INITIAL CONFIDENCE" value={scenario.signal.initialConfidence}/><DataPoint label="ESTIMATED MATERIALITY" value={`${formatCompactMoney(scenario.impact.revenueExposure)} · ESTIMATED`}/><button className="ns-primary" onClick={onContinue}>Define the governed outcome <ArrowRight size={16}/></button></section></div></>;
}

function DefineStage({ state, onContinue }: { state: WorkflowState; onContinue: () => void }) {
  return <><StageIntro number="02" eyebrow="OUTCOME CONTRACT · HUMAN INTENT" title="Define success before asking AI for a plan." question="What measurable business result are we committing to?" tag="AUTHORITY LOCKED"/><OutcomeContractSummary/><div className="contract-footer"><div><Fingerprint size={17}/><span><strong>Contract hash</strong><small>{state.contractHash ?? 'Generated on acceptance'}</small></span></div><button className="ns-primary" onClick={onContinue}>Accept contract and verify signal <ArrowRight size={16}/></button></div></>;
}

function OutcomeContractSummary() {
  const c = scenario.outcomeContract;
  return <section className="outcome-contract"><header><span>{c.name.toUpperCase()}</span><b>{c.id} · v{scenario.version}</b><h2>{c.question}</h2></header><div className="contract-core"><div><small>TARGET</small><strong>≥{c.targetProtectedRevenuePercent.toFixed(1)}%</strong><span>committed revenue protected</span></div><div><small>DEADLINE</small><strong>{c.deadlineDays} days</strong><span>measured closeout</span></div><div><small>HARD BUDGET</small><strong>{formatCompactMoney(c.maximumBudget)}</strong><span>no silent escalation</span></div><div><small>BASELINE EXPOSURE</small><strong>{formatCompactMoney(c.baselineExposedRevenue)}</strong><span>CALCULATED</span></div></div><div className="contract-details"><section><span>NON-NEGOTIABLE CONSTRAINTS</span>{c.constraints.map((item) => <p key={item}><ShieldCheck size={14}/>{item}</p>)}</section><section><span>EXPLICITLY PROHIBITED</span>{c.prohibitedActions.map((item) => <p key={item}><XCircle size={14}/>{item}</p>)}</section><section><span>AUTHORITY MAP</span>{Object.entries(c.authorities).map(([role, person]) => <p key={role}><LockKeyhole size={14}/><b>{role.replace(/([A-Z])/g, ' $1')}</b><strong>{person}</strong></p>)}</section></div></section>;
}

function ProofStage({ state, onContinue }: { state: WorkflowState; onContinue: () => void }) {
  const checks = state.verification?.checks ?? scenario.verificationControls;
  const requiredControls = scenario.verificationPolicy.requiredControlIds.length;
  const passedControls = checks.filter((check) => check.status === scenario.verificationPolicy.requiredStatus && scenario.verificationPolicy.requiredControlIds.includes(check.id)).length;
  return <><StageIntro number="03" eyebrow="PROOFLINE · DETERMINISTIC VERIFICATION" title="The ERP number is true—and still unsafe to act on." question="Is the material-shortage signal trustworthy enough to influence action?" tag="VERIFIED · HIGH CONFIDENCE"/><div className="stage-grid proof-layout"><ProofSequence checks={checks}/><InventoryReconciliation/><section className="verification-verdict"><div className="verdict-ring"><i/><span><ShieldCheck size={28}/><strong>VERIFIED</strong><small>MATERIAL RISK</small></span></div><div><span>DETERMINISTIC CLASSIFICATION</span><h2>Eligible for governed recovery planning</h2><p>{state.verification?.explanation}</p><div><ProvenanceBadge label={`${passedControls}/${requiredControls} CONTROLS PASS`}/><ProvenanceBadge label="NO MODEL AUTHORITY"/></div><button className="ns-primary" onClick={onContinue}>Explore enterprise impact <ArrowRight size={16}/></button></div></section></div></>;
}

function ProofSequence({ checks }: { checks: typeof scenario.verificationControls }) {
  return <section className="ns-panel proof-sequence"><header><span>VERIFICATION SEQUENCE</span><b>{checks.length}/{checks.length} PASS</b></header>{checks.map((check, index) => <div key={check.id}><i>{String(index + 1).padStart(2, '0')}</i><CheckCircle2 size={15}/><span><strong>{check.name}</strong><small>{check.detail}</small></span><code>{check.id}</code></div>)}</section>;
}

function InventoryReconciliation() {
  const inventory = scenario.inventory;
  const discrepancy = calculateInventoryDiscrepancy(inventory);
  const restricted = [
    { label: 'Quality hold', value: inventory.qualityHoldDays },
    { label: 'Already allocated', value: inventory.allocatedDays },
    { label: 'Incompatible batch', value: inventory.incompatibleBatchDays },
  ];
  const telemetryEvidence = scenario.verificationControls.find((check) => check.name.toLowerCase().includes('consumption'))?.id ?? 'Evidence unavailable';
  return <section className="ns-panel inventory-reconciliation"><header><span>INVENTORY RECONCILIATION</span><b>{discrepancy.toFixed(1)} DAYS OVERSTATED</b></header><div className="coverage-versus"><div><small>ERP REPORTED</small><strong>{inventory.erpReportedCoverageDays.toFixed(1)}<em>days</em></strong><span>Gross stock</span></div><ArrowRight size={22}/><div><small>PACT USABLE</small><strong>{calculateUsableCoverage(inventory).toFixed(1)}<em>days</em></strong><span>CALCULATED</span></div></div><div className="reconciliation-bars">{restricted.map((item) => <ReconcileBar key={item.label} label={item.label} value={item.value} width={discrepancy > 0 ? item.value / discrepancy * 100 : 0}/>)}</div><div className="consumption-alert"><Activity size={16}/><span><strong>Consumption +{scenario.material.consumptionIncreasePercent}%</strong><small>Machine telemetry applied to the planning rate · {telemetryEvidence}</small></span></div></section>;
}

function ReconcileBar({ label, value, width }: { label: string; value: number; width: number }) {
  return <div><span>{label}</span><i><b style={{ width: `${width}%` }}/></i><strong>-{value}d</strong></div>;
}

function ImpactStage({ onContinue }: { onContinue: () => void }) {
  return <><StageIntro number="04" eyebrow="ENTERPRISE IMPACT · CONNECTED TWIN" title="One delayed material crosses the entire operating system." question="Where will intervention protect the most value—and what hidden dependency can still break the plan?" tag={`${formatCompactMoney(scenario.impact.revenueExposure)} CALCULATED EXPOSURE`}/><CascadeImpactMap/><div className="impact-layout"><ImpactDriverList/><section className="impact-stakes"><span>VALUE AND SERVICE EXPOSURE</span><div><strong>{scenario.impact.ordersAtRisk}</strong><small>orders potentially affected</small></div><div><strong>{scenario.impact.strategicCustomers}</strong><small>strategic customers</small></div><div><strong>{formatCompactMoney(scenario.impact.penaltyExposure)}</strong><small>potential penalties · ESTIMATED</small></div><div><strong>{scenario.impact.milestoneLinkedCustomers}</strong><small>milestone-linked customers</small></div><button className="ns-primary" onClick={onContinue}>Compare bounded strategies <ArrowRight size={16}/></button></section></div></>;
}

function CascadeImpactMap() {
  const icons: Icon[] = [PackageCheck, Factory, Boxes, FileCheck2, Users, CircleDollarSign, AlertTriangle];
  return <section className="cascade-map"><header><span>PRIMARY CASCADE · SELECTED SIGNAL</span><b>{scenario.impact.cascade.length} CONNECTED DOMAINS</b></header><div>{scenario.impact.cascade.map((item, index) => { const C = icons[index]; return <span key={item} className={index === 0 || index === 5 ? 'hot' : ''}><i><C size={20}/></i><strong>{item}</strong><small>{index === 0 ? 'OBSERVED' : index < 3 ? 'FACT' : index === 5 ? formatCompactMoney(scenario.impact.revenueExposure) : 'INFERRED'}</small>{index < scenario.impact.cascade.length - 1 && <ArrowRight size={18}/>}</span>; })}</div></section>;
}

function ImpactDriverList() {
  return <section className="ns-panel impact-drivers"><header><span>HIDDEN DEPENDENCIES</span><b>EVIDENCE-BOUND</b></header>{scenario.impact.dependencies.map((item) => <div key={item.id}><i>{item.domain.slice(0,2).toUpperCase()}</i><span><strong>{item.domain}</strong><p>{item.detail}</p></span><EvidenceTag label={item.label}/><code>{item.evidenceIds[0]}</code></div>)}</section>;
}

function EvidenceTag({ label }: { label: EvidenceLabel }) {
  return <b className={`evidence-tag ${label.toLowerCase()}`}>{label}</b>;
}

function StrategyStage({ state, artifactState, setState, onContinue }: { state: WorkflowState; artifactState: ArtifactUiState; setState: React.Dispatch<React.SetStateAction<WorkflowState>>; onContinue: () => void }) {
  const artifactLoading = artifactState.status === 'loading';
  return <><StageIntro number="05" eyebrow="STRATEGY LAB · MODEL PROPOSES" title="Three responses. One survives the contract." question="Which response best protects strategic revenue without borrowing authority from the future?" tag="SIMULATED · NOT AUTHORIZED"/><AgentBoundary/><ModelJudgmentPacket artifactState={artifactState} role="plan"/><StrategyComparison selectedId={state.selectedStrategyId} onSelect={(id) => setState((current) => ({ ...current, selectedStrategyId: id }))}/><div className="strategy-submit"><div><ShieldCheck size={18}/><span><strong>Balanced Recovery satisfies deterministic hard constraints.</strong><small>Model judgment is advisory. Recommendation remains provisional until a separate role challenges the immutable packet.</small></span></div><button className="ns-primary" disabled={state.selectedStrategyId !== 'STR-BALANCED' || artifactLoading} onClick={onContinue}>{artifactLoading ? 'Validating model packet…' : 'Submit for independent audit'} {!artifactLoading && <ArrowRight size={16}/>}</button></div></>;
}

function AgentBoundary() {
  return <section className="agent-boundary"><div><Sparkles size={18}/><span><strong>PACT Outcome Lead</strong><small>Evidence synthesis · strategy proposal · 0 business tool calls</small></span><b>PROPOSE</b></div><ArrowRight size={18}/><div><Fingerprint size={18}/><span><strong>Immutable audit packet</strong><small>Schema-validated · evidence IDs · plan version</small></span><b>SEAL</b></div><ArrowRight size={18}/><div><ShieldCheck size={18}/><span><strong>Independent PACT Auditor</strong><small>Separate role · challenges assumptions · 0 business tool calls</small></span><b>CHALLENGE</b></div></section>;
}

function ModelJudgmentPacket({ artifactState, role }: { artifactState: ArtifactUiState; role: 'plan' | 'audit' }) {
  if (artifactState.status !== 'ready') {
    const label = artifactState.status === 'loading' ? 'VALIDATING · NO OUTPUT CONSUMED' : artifactState.status === 'disabled' ? 'DISABLED · NO MODEL CLAIM' : 'REJECTED · FAIL-CLOSED';
    return <section className={`model-judgment-packet ${artifactState.status}`} aria-live="polite"><header><i>{artifactState.status === 'error' ? <XCircle size={20}/> : <Fingerprint size={20}/>}</i><span><small>STRICT MODEL ARTIFACT BOUNDARY</small><strong>{role === 'plan' ? 'Outcome Lead decision packet' : 'Independent Auditor packet'}</strong></span><b>{label}</b></header><p>{artifactState.message}</p><footer><ShieldCheck size={14}/>The deterministic contract, policy guards, and human authority do not depend on unvalidated model output.</footer></section>;
  }

  const artifact = artifactState.artifact;
  const isGenuine = artifactState.source === 'genuine';
  const label = isGenuine ? 'GENUINE GPT-5.6 · STRICT SCHEMA' : 'LOCAL SCHEMA FIXTURE · NO API CALL';
  const agent = role === 'plan' ? artifact.provenance.planAgent : artifact.provenance.auditAgent;
  const responseId = role === 'plan' ? artifact.provenance.planResponseId : artifact.provenance.auditResponseId;
  const traceId = role === 'plan' ? artifact.provenance.planTraceId : artifact.provenance.auditTraceId;
  const summary = role === 'plan'
    ? artifact.plan.executiveSummary
    : `${artifact.audit.counterfactual.scenario} ${artifact.audit.counterfactual.expectedImpact}`;
  return <section className={`model-judgment-packet ready ${artifactState.source}`} aria-live="polite"><header><i>{role === 'plan' ? <Sparkles size={20}/> : <ShieldCheck size={20}/>}</i><span><small>{role === 'plan' ? 'STRUCTURED OUTCOME LEAD JUDGMENT' : 'STRUCTURED INDEPENDENT CHALLENGE'}</small><strong>{agent}</strong></span><b>{label}</b></header>{artifactState.notice && <div className="artifact-notice"><AlertTriangle size={14}/>{artifactState.notice}</div>}<p>{summary}</p><div className="model-packet-metrics">{role === 'plan' ? <><DataPoint label="RECOMMENDATION" value={artifact.plan.recommendedStrategyId}/><DataPoint label="EVIDENCE CITATIONS" value={String(artifact.plan.evidenceCitations.length)}/><DataPoint label="EXPLICIT ASSUMPTIONS" value={String(artifact.plan.assumptions.length)}/><DataPoint label="ESTIMATED MODEL COST" value={`$${artifact.usage.estimatedCostUsd.toFixed(4)}`}/></> : <><DataPoint label="MODEL VERDICT" value={artifact.audit.verdict.replaceAll('_', ' ')}/><DataPoint label="MATERIAL FINDINGS" value={String(artifact.audit.findings.filter((finding) => finding.severity === 'material').length)}/><DataPoint label="UNSUPPORTED CLAIMS" value={String(artifact.audit.unsupportedClaims.length)}/><DataPoint label="REQUIRED CONDITIONS" value={String(artifact.audit.requiredConditions.length)}/></>}</div><div className="model-packet-trace"><span><small>RESPONSE ID</small><code title={responseId}>{responseId}</code></span><span><small>TRACE ID</small><code title={traceId}>{traceId}</code></span><span><small>PROVIDER</small><strong>{artifact.provider}</strong></span></div><footer><LockKeyhole size={14}/>Models propose and challenge. Deterministic policy authorizes and enforces.</footer></section>;
}

function StrategyComparison({ selectedId, onSelect }: { selectedId: WorkflowState['selectedStrategyId']; onSelect: (id: WorkflowState['selectedStrategyId']) => void }) {
  return <section className="strategy-comparison">{scenario.strategies.map((strategy) => { const result = evaluateStrategy(strategy); const selected = selectedId === strategy.id; return <button key={strategy.id} onClick={() => onSelect(strategy.id)} className={`${selected ? 'selected' : ''} ${result.compliant ? 'compliant' : 'rejected'}`}><header><span>{strategy.id === 'STR-SPEED' ? 'A' : strategy.id === 'STR-COST' ? 'B' : 'C'} · {strategy.name.toUpperCase()}</span><b>{result.compliant ? 'RECOMMENDED · SUBJECT TO AUDIT' : `REJECTED · ${result.reasons[0]}`}</b></header><div className="strategy-gauge"><i style={{ '--strategy': `${strategy.projectedProtectedRevenuePercent}%` } as React.CSSProperties}/><strong>{strategy.projectedProtectedRevenuePercent.toFixed(1)}%</strong><small>SIMULATED REVENUE PROTECTED</small></div><div className="strategy-values"><DataPoint label="ESTIMATED COST" value={compactMoney(strategy.estimatedCost)}/><DataPoint label="DURATION" value={`${strategy.durationDays} days`}/><DataPoint label="QUALITY RISK" value={strategy.qualityRisk}/><DataPoint label="RESIDUAL RISK" value={strategy.residualRisk}/></div><section><span>BOUNDED ACTIONS</span>{strategy.actions.map((item) => <p key={item}><CheckCircle2 size={13}/>{item}</p>)}</section><footer><small>DOWNSIDE CASE</small><p>{strategy.downsideCase}</p></footer></button>; })}</section>;
}

function AuditStage({ state, artifactState, onContinue }: { state: WorkflowState; artifactState: ArtifactUiState; onContinue: () => void }) {
  return <><StageIntro number="06" eyebrow="INDEPENDENT AUDIT · SEPARATION OF DUTIES" title="The Auditor changed what decision-ready means." question="Which assumption could make an apparently compliant plan fail—and what condition must bind the authority?" tag="DECISION-READY WITH CONDITIONS"/><ModelJudgmentPacket artifactState={artifactState} role="audit"/><IndependentAuditGate findings={state.auditFindings}/><div className="audit-continue"><div><Fingerprint size={17}/><span><strong>{scenario.audit.packetId}</strong><small>Immutable packet · {scenario.audit.findings.length} material findings · separate role · zero tools</small></span></div><button className="ns-primary" onClick={onContinue}>Bind conditions and review Action Contract <ArrowRight size={16}/></button></div></>;
}

function IndependentAuditGate({ findings }: { findings: typeof initialState.auditFindings }) {
  return <section className="audit-gate"><div className="audit-verdict"><div className="audit-seal"><ShieldCheck size={34}/><i/><b/></div><span>PACT AUDITOR CONCLUSION</span><h2>Decision-ready<br/>with conditions</h2><p>The balanced strategy may proceed to human review only with five controls bound to the Action Contract.</p><ProvenanceBadge label="SEPARATE ROLE · NO TOOL AUTHORITY"/></div><div className="audit-findings"><header><span>MATERIAL CHALLENGE REGISTER</span><b>5/5 REMEDIATED IN PLAN</b></header>{findings.map((finding, index) => <div key={finding.id}><i>{String(index + 1).padStart(2, '0')}</i><span><strong>{finding.title}</strong><p>{finding.detail}</p><code>{finding.evidenceIds.join(' · ')}</code></span><b className={finding.resolved ? 'resolved' : ''}>{finding.resolved ? 'CONDITION ADDED' : 'OPEN'}</b></div>)}</div><aside><span>REQUIRED CONDITIONS</span>{scenario.audit.requiredConditions.map((item) => <p key={item}><LockKeyhole size={14}/>{item}</p>)}</aside></section>;
}

function AuthorizationStage({ state, onContinue, onRequestChanges, onReject }: { state: WorkflowState; onContinue: () => void; onRequestChanges: () => void; onReject: () => void }) {
  const functionCount = new Set(scenario.actionGraph.map((action) => action.team)).size;
  const rejected = state.approval?.decision === 'rejected';
  return <><StageIntro number="07" eyebrow="ACTION CONTRACT · HUMAN AUTHORIZATION" title="A machine cannot make this commitment." question={`Should ${scenario.enterprise.name} bind ${formatCompactMoney(scenario.actionContract.maximumBudget)} and ${functionCount} functions to this audited recovery plan?`} tag={rejected ? 'REJECTED · NO AUTHORITY' : 'PLANT COO DECISION'}/><ActionContractAuthorization state={state}/>{rejected ? <div className="authorization-decision rejected"><div><span>HUMAN DECISION RECORDED</span><strong>Plan rejected · execution remains locked</strong><small>{state.approval?.rationale}</small></div><button className="ns-secondary" onClick={() => navigate('/')}>Return to Mission Control</button></div> : <div className="authorization-decision"><div><span>DETERMINISTIC DEMO DECISION</span><strong>Approve with conditions</strong><small>{scenario.outcomeContract.authorities.humanApprover} · bounded scope only</small></div><button className="ns-secondary" onClick={onRequestChanges}>Request changes</button><button className="ns-secondary danger" onClick={onReject}>Reject</button><button className="ns-primary" onClick={onContinue}>Approve with conditions and activate <LockKeyhole size={16}/></button></div>}</>;
}

function ActionContractAuthorization({ state }: { state: WorkflowState }) {
  const selectedStrategy = scenario.strategies.find((strategy) => strategy.id === state.selectedStrategyId) ?? scenario.strategies[2];
  return <section className="authorization-contract"><header><div><span>REQUESTED ACTION CONTRACT</span><h2>{PLAN_ID}</h2><p>{selectedStrategy.name} · audit conditions bound · {state.auditConditionAcceptance?.requiredConditionCount ?? 0} conditions accepted</p></div><div><small>MAXIMUM AUTHORITY</small><strong>{money(scenario.actionContract.maximumBudget)}</strong><span>hard stop</span></div></header><div className="authorization-grid"><section><span>AUTHORITY REQUESTED</span>{scenario.actionContract.unlockedActionClasses.map((item) => <p key={item}><CheckCircle2 size={14}/>{item}</p>)}</section><section className="prohibited"><span>REMAINS PROHIBITED</span>{scenario.outcomeContract.prohibitedActions.map((item) => <p key={item}><XCircle size={14}/>{item}</p>)}</section><section><span>BOUND CONDITIONS</span>{scenario.actionContract.conditions.map((item) => <p key={item}><LockKeyhole size={14}/>{item}</p>)}</section></div><footer><ShieldCheck size={17}/><p><strong>Models did not authorize this decision.</strong> Deterministic policy will enforce plan ID, scope, predecessors, quality approval, spend, and communication restrictions on every tool request.</p></footer></section>;
}

function ExecutionStage({ state, onNext, onAll, onContinue }: { state: WorkflowState; onNext: () => void; onAll: () => void; onContinue: () => void }) {
  const complete = state.actions.filter((item) => item.status === 'complete').length;
  const next = state.actions.find((item) => item.status === 'ready');
  const allComplete = state.actions.length > 0 && complete === state.actions.length;
  return <><StageIntro number="08" eyebrow="ACTION GRAPH · DETERMINISTIC EXECUTION" title="Authority is not readiness." question="What can each function safely commit now—and which predecessor still blocks the rest?" tag={`${complete}/${state.actions.length} TOOL-CONFIRMED`}/>{state.unsafeAttemptMessage && <GovernedToolResult message={state.unsafeAttemptMessage}/>}<div className="execution-layout"><ActionDependencyGraph actions={state.actions}/><aside className="next-commitment"><span>NEXT EXECUTABLE COMMITMENT</span>{next ? <><i><Activity size={23}/></i><h2>{next.description}</h2><p>{next.team} · {next.owner}</p><div><small>PREDECESSORS</small><strong>{next.dependencies.length ? next.dependencies.join(' · ') : 'None · authority guards pass'}</strong></div><div><small>EXPECTED EFFECT</small><strong>{next.estimatedEffect ? `${next.estimatedEffect} ${next.actionId === 'ACT-008' ? 'orders' : 'coverage days'}` : 'Control unlock'}</strong></div><button className="ns-primary" onClick={onNext}>Execute next commitment <ArrowRight size={16}/></button></> : <><CheckCircle2 size={36}/><h2>Dependency graph complete</h2><p>Ten governed operations are tool-confirmed. Customer output remains draft-only.</p></>}<button className="ns-secondary" disabled={allComplete} onClick={onAll}>Run approved graph</button>{allComplete && <button className="ns-primary" onClick={onContinue}>Measure the outcome <ArrowRight size={16}/></button>}</aside></div><PlantStateTimeline actions={state.actions}/></>;
}

function GovernedToolResult({ message }: { message: string }) {
  return <section className="governed-tool-result"><div><XCircle size={22}/><span><small>REQUIRED REJECTION DEMONSTRATION · TOOL RESULT</small><strong>{message}</strong></span></div><div><DataPoint label="FAILED GUARD" value="Quality authorization"/><DataPoint label="MISSING EVIDENCE" value="EVD-QLT-115"/><DataPoint label="UNLOCKED BY" value="ACT-002 quality release"/></div><p>The exact supplier request is retained in the ledger as blocked. It can succeed only after Quality and Finance complete their predecessors.</p></section>;
}

function ActionDependencyGraph({ actions }: { actions: PactAction[] }) {
  const rows = [actions.slice(0, 3), actions.slice(3, 6), actions.slice(6)];
  const functionCount = new Set(actions.map((action) => action.team)).size;
  return <section className="action-dependency-graph"><header><span>GOVERNED COMMITMENT TOPOLOGY</span><b>{functionCount} FUNCTIONS · {actions.length} ACTIONS</b></header>{rows.map((row, rowIndex) => <div className="graph-row" key={rowIndex}>{row.map((action) => <div key={action.actionId} className={`graph-node ${action.status}`}><header><i>{action.actionId.replace('ACT-', '')}</i><b>{action.status.toUpperCase()}</b></header><strong>{action.description}</strong><small>{action.team} · {action.owner}</small><div><span>DEP</span><code>{action.dependencies.join(' · ') || 'AUTHORITY'}</code></div>{action.result && <em>TOOL CONFIRMED</em>}</div>)}</div>)}</section>;
}

function PlantStateTimeline({ actions }: { actions: PactAction[] }) {
  const completed = new Set(actions.filter((item) => item.status === 'complete').map((item) => item.actionId));
  return <section className="plant-state-timeline"><header><span>DIGITAL TWIN STATE PROGRESSION</span><button onClick={() => navigate('/plants/northstar-7')}>Open spatial twin <ArrowRight size={14}/></button></header><div>{scenario.plantStateProgression.map((item, index) => { const active = item.unlockActionId === null || completed.has(item.unlockActionId); const detail = item.ordersProtected > 0 ? `${item.ordersProtected} orders protected` : item.phase; return <span className={active ? 'active' : ''} key={item.id}><i>{active ? <CheckCircle2 size={14}/> : index + 1}</i><strong>{item.coverageDays.toFixed(1)}d</strong><b>{item.label}</b><small>{detail}</small></span>; })}</div></section>;
}

function MeasurementStage({ state, onObserve, onClose }: { state: WorkflowState; onObserve: (day: number) => void; onClose: () => void }) {
  const observation = scenario.observations.find((item) => item.day === state.currentDay) ?? scenario.observations[0];
  return <><StageIntro number="09" eyebrow="OUTCOME MEASUREMENT · TWIN OBSERVATION" title="Projection is a promise. Observation is the test." question="Did the approved response protect the committed revenue within authority—and what changed versus the simulation?" tag={`DAY ${state.currentDay} · ${observation.label}`}/><OutcomeMeasurement observation={observation}/><div className="checkpoint-controls">{scenario.observations.map((item) => <button key={item.day} className={state.currentDay === item.day ? 'active' : ''} onClick={() => onObserve(item.day)}><i>{item.day === 0 ? 'D0' : `D${item.day}`}</i><span><strong>{item.day === 0 ? 'Baseline' : item.status.split('_').join(' ')}</strong><small>{item.label === 'SIMULATED' ? 'SIMULATED PLAN' : 'OBSERVED SYNTHETIC'}</small></span></button>)}</div>{state.currentDay === scenario.outcomeContract.deadlineDays && <div className="measurement-close"><ShieldCheck size={20}/><span><strong>Target achieved within budget and approved authority.</strong><small>Closeout still requires Plant COO acceptance and learning retention.</small></span><button className="ns-primary" onClick={onClose}>Accept closeout <ArrowRight size={16}/></button></div>}</>;
}

function OutcomeMeasurement({ observation }: { observation: Observation }) {
  const circumference = 2 * Math.PI * 70;
  const target = scenario.outcomeContract.targetProtectedRevenuePercent;
  const projection = scenario.closeout.projectedProtectedRevenuePercent;
  const value = observation.day === 0 ? projection : observation.protectedRevenuePercent;
  return <section className="outcome-measurement"><div className="measurement-orbit"><svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="70"/><circle className="target" cx="90" cy="90" r="70" strokeDasharray={`${circumference * target / 100} ${circumference}`}/><circle className="actual" cx="90" cy="90" r="70" strokeDasharray={`${circumference * value / 100} ${circumference}`}/></svg><span><small>{observation.label}</small><strong>{value.toFixed(1)}%</strong><em>REVENUE PROTECTED</em></span></div><div className="measurement-legend"><div className="target"><i/><span><small>CONTRACT TARGET</small><strong>{target.toFixed(1)}%</strong><em>FACT · HUMAN ACCEPTED</em></span></div><div className="projection"><i/><span><small>SIMULATED PROJECTION</small><strong>{projection.toFixed(1)}%</strong><em>SIMULATED · NOT OBSERVED</em></span></div><div className="observed"><i/><span><small>OBSERVED SYNTHETIC</small><strong>{observation.day === 0 ? 'Pending' : `${observation.protectedRevenuePercent.toFixed(1)}%`}</strong><em>TOOL-CONFIRMED CHECKPOINT</em></span></div></div><div className="measurement-stats"><DataPoint label="INVENTORY COVERAGE" value={`${observation.inventoryCoverageDays} days`}/><DataPoint label="ORDERS PROTECTED" value={String(observation.ordersProtected)}/><DataPoint label="CURRENT SPEND" value={money(observation.spend)}/><DataPoint label="LINE C RISK" value={observation.lineCRisk}/><DataPoint label="QUALITY INCIDENTS" value={String(scenario.closeout.qualityIncidents)}/><DataPoint label="UNAUTHORIZED SENDS" value={String(scenario.closeout.unauthorizedCustomerCommunications)}/></div><p className="causality-note"><ShieldCheck size={14}/>Observed improvement follows the governed intervention sequence; PACT does not claim that any single action exclusively caused the result.</p></section>;
}

function CloseoutStage({ state }: { state: WorkflowState }) {
  return <><StageIntro number="10" eyebrow="OUTCOME CLOSEOUT · ORGANIZATIONAL MEMORY" title="Target achieved within budget and within approved authority." question="What result can the enterprise defend—and what should it never have to relearn?" tag="ACHIEVED · ACCEPTED"/><OutcomeCloseoutSummary/><section className="learning-register"><header><span>RETAINED ORGANIZATIONAL LEARNING</span><b>{scenario.lessons.length} REUSABLE RECORDS</b></header>{scenario.lessons.map((lesson, index) => <div key={lesson.id}><i>{String(index + 1).padStart(2, '0')}</i><span><strong>{lesson.text}</strong><small>{lesson.tags.map((tag) => `#${tag}`).join(' · ')}</small></span><code>{lesson.evidenceIds.join(' · ')}</code><BadgeCheck size={16}/></div>)}</section><div className="closeout-actions"><button className="ns-secondary" onClick={() => navigate('/ledger')}>Inspect complete ledger <History size={15}/></button><button className="ns-primary" onClick={() => navigate('/replay')}>Replay Operation Northstar <Play size={15}/></button></div></>;
}

function OutcomeCloseoutSummary() {
  const c = scenario.closeout;
  const observedProtectedValue = calculateProtectedValue(c.observedProtectedRevenuePercent, c.originalExposure);
  const projectionVariance = c.observedProtectedRevenuePercent - c.projectedProtectedRevenuePercent;
  const budgetVariance = c.budget - c.finalSpend;
  return <section className="closeout-summary"><div className="closeout-hero"><div className="success-mark"><CheckCircle2 size={42}/><i/><b/></div><span>OUTCOME STATUS</span><h2>{c.status.toUpperCase()}</h2><p>Accepted by {c.acceptedBy}</p></div><div className="closeout-results"><div><small>CONTRACT TARGET</small><strong>≥{c.targetProtectedRevenuePercent.toFixed(1)}%</strong><span>FACT</span></div><div className="highlight"><small>OBSERVED SYNTHETIC RESULT</small><strong>{c.observedProtectedRevenuePercent.toFixed(1)}%</strong><span>OBSERVED</span></div><div><small>SIMULATED PROJECTION</small><strong>{c.projectedProtectedRevenuePercent.toFixed(1)}%</strong><span>SIMULATED</span></div><div><small>VARIANCE</small><strong>{projectionVariance > 0 ? '+' : ''}{projectionVariance.toFixed(1)}pp</strong><span>CALCULATED</span></div><div><small>FINAL SPEND</small><strong>{money(c.finalSpend)}</strong><span>OBSERVED</span></div><div><small>BUDGET VARIANCE</small><strong>{money(Math.abs(budgetVariance))} {budgetVariance >= 0 ? 'under' : 'over'}</strong><span>CALCULATED</span></div></div><div className="protected-value"><DataPoint label="ORIGINAL EXPOSURE" value={money(c.originalExposure)}/><DataPoint label="OBSERVED PROTECTED VALUE" value={money(observedProtectedValue)}/><DataPoint label="UNRESOLVED EXPOSURE" value={money(c.originalExposure - observedProtectedValue)}/><DataPoint label="RESPONSE COST" value={money(c.finalSpend)}/></div><footer><ShieldCheck size={16}/><span>{c.strategicCustomersLost} strategic customers lost · {c.qualityIncidents} quality incidents · {c.unauthorizedCustomerCommunications} unauthorized communications · no ROI claim</span></footer></section>;
}

function PlantDigitalTwin({ state }: { state: WorkflowState }) {
  const [layers, setLayers] = useState<PlantLayer[]>(['Production', 'Inventory', 'Logistics', 'Outcome Risk']);
  const [selected, setSelected] = useState('shipment');
  const plantState = derivePlantState(state.actions);
  const lineA = scenario.plant.lines.find((line) => line.id === 'LINE-A') ?? scenario.plant.lines[0];
  const lineB = scenario.plant.lines.find((line) => line.id === 'LINE-B') ?? scenario.plant.lines[1];
  const lineC = scenario.plant.lines.find((line) => line.id === 'LINE-C') ?? scenario.plant.lines[2];
  const heatExchanger = scenario.plant.workCenters.find((center) => center.id === 'CELL-HEX') ?? scenario.plant.workCenters[0];
  const usableCoverage = calculateUsableCoverage();
  const discrepancy = calculateInventoryDiscrepancy();
  return <div className="ns-page twin-page"><SyntheticDisclosure/><PageIntro eyebrow={`${scenario.plant.name.toUpperCase()} · LIVE SYNTHETIC OPERATING TWIN`} title="See the physical system behind the outcome." description="PACT connects plant state to evidence, authority, cross-functional commitments, and measurable business consequence." meta={`${plantState.coverageDays} DAYS COVERAGE · ${plantState.lineCRisk.toUpperCase()} RISK`}/><PlantLayerToggle active={layers} onChange={setLayers}/><div className="twin-workspace"><section className="plant-canvas"><header><span>{scenario.plant.location.toUpperCase()} · {scenario.plant.currentShift.toUpperCase()} · {scenario.plant.activeOperators} ACTIVE OPERATORS</span><b>{plantState.phase.toUpperCase()}</b></header><div className="plant-grid" data-risk={plantState.lineCRisk}><div className="grid-lines"/><button className="plant-object line-a" onClick={() => setSelected('line-a')}><i><Factory size={20}/></i><span><strong>{lineA.name.toUpperCase()}</strong><small>{lineA.status.toUpperCase()} · {lineA.utilization}%</small></span><b>{lineA.risk.toUpperCase()}</b></button><button className="plant-object line-b" onClick={() => setSelected('line-b')}><i><Factory size={20}/></i><span><strong>{lineB.name.toUpperCase()}</strong><small>{lineB.status.replaceAll('_', ' ').toUpperCase()} · D{lineB.restartDay}</small></span><b>{lineB.risk.toUpperCase()}</b></button><button className="plant-object line-c hot" onClick={() => setSelected('line-c')}><i><Factory size={20}/></i><span><strong>{lineC.name.toUpperCase()} · {lineC.product}</strong><small>{lineC.status.toUpperCase()} · {plantState.coverageDays}D COVERAGE</small></span><b>{plantState.lineCRisk.toUpperCase()}</b></button><button className="plant-object hex hot" onClick={() => setSelected('cell')}><i><Gauge size={20}/></i><span><strong>{heatExchanger.name.toUpperCase()}</strong><small>{heatExchanger.criticality.toUpperCase()} DEPENDENCY</small></span><b>{scenario.material.id.replace('MAT-', '')}</b></button><button className="plant-object warehouse" onClick={() => setSelected('warehouse')}><i><Warehouse size={20}/></i><span><strong>WAREHOUSE</strong><small>{scenario.inventory.erpReportedCoverageDays}D ERP / {usableCoverage}D USABLE</small></span><b>-{discrepancy}D</b></button><button className="plant-object shipment selected" onClick={() => setSelected('shipment')}><i><Truck size={20}/></i><span><strong>{scenario.shipment.vessel.toUpperCase()}</strong><small>{scenario.shipment.status.toUpperCase()} · +{scenario.shipment.delayDays} DAYS</small></span><b>ALERT</b></button><div className="flow-path p1"/><div className="flow-path p2"/><div className="flow-path p3"/><div className="vehicle v1">{scenario.plant.autonomousVehicles}</div><div className="operator-cluster"><Users size={16}/><span>{scenario.plant.activeOperators}</span></div></div><div className="twin-kpis"><DataPoint label="ACTIVE LINES" value={String(scenario.plant.activeProductionLines)}/><DataPoint label="AUTONOMOUS VEHICLES" value={String(scenario.plant.autonomousVehicles)}/><DataPoint label="INBOUND TODAY" value={String(scenario.plant.inboundShipmentsDueToday)}/><DataPoint label={`${scenario.outcomeContract.deadlineDays}-DAY UNITS`} value={scenario.plant.committedUnits21Days.toLocaleString('en-US')}/><DataPoint label="ORDERS AT RISK" value={String(scenario.impact.ordersAtRisk)}/><DataPoint label="FINANCIAL EXPOSURE" value={formatCompactMoney(scenario.impact.revenueExposure)}/></div></section><PlantObjectInspector selected={selected} plantState={plantState}/></div><CascadeImpactMap/><PlantStateTimeline actions={state.actions.length ? state.actions : buildBalancedPlan()}/></div>;
}

function PlantLayerToggle({ active, onChange }: { active: PlantLayer[]; onChange: (layers: PlantLayer[]) => void }) {
  const layers: PlantLayer[] = ['Production','Machines','People','Inventory','Orders','Suppliers','Logistics','Quality','Financial','Outcome Risk'];
  return <div className="plant-layer-toggle"><span><Layers3 size={15}/> TWIN LAYERS</span>{layers.map((layer) => <button key={layer} className={active.includes(layer) ? 'active' : ''} onClick={() => onChange(active.includes(layer) ? active.filter((item) => item !== layer) : [...active, layer])}>{layer}</button>)}</div>;
}

function PlantObjectInspector({ selected, plantState }: { selected: string; plantState: ReturnType<typeof derivePlantState> }) {
  const lineA = scenario.plant.lines.find((line) => line.id === 'LINE-A') ?? scenario.plant.lines[0];
  const lineB = scenario.plant.lines.find((line) => line.id === 'LINE-B') ?? scenario.plant.lines[1];
  const lineC = scenario.plant.lines.find((line) => line.id === 'LINE-C') ?? scenario.plant.lines[2];
  const heatExchanger = scenario.plant.workCenters.find((center) => center.id === 'CELL-HEX') ?? scenario.plant.workCenters[0];
  const downstream = scenario.plant.workCenters.find((center) => center.id === 'CELL-TEST') ?? scenario.plant.workCenters[1];
  const records: Record<string, { eyebrow: string; title: string; status: string; facts: Array<[string,string]>; evidence: string }> = {
    shipment: { eyebrow: 'INBOUND LOGISTICS · SELECTED', title: scenario.shipment.vessel, status: scenario.shipment.status.toUpperCase(), facts: [['Material',scenario.material.name],['Route',scenario.shipment.route],['Delay',`${scenario.shipment.delayDays} days`],['Original arrival',shortDate(scenario.shipment.originalArrival)],['Revised arrival',shortDate(scenario.shipment.revisedArrival)]], evidence: scenario.shipment.evidenceIds[1] },
    warehouse: { eyebrow: 'INVENTORY · SELECTED', title: `${scenario.material.id.replace('MAT-', '')} Warehouse Stock`, status: 'DISCREPANCY', facts: [['ERP coverage',`${scenario.inventory.erpReportedCoverageDays} days`],['Usable coverage',`${calculateUsableCoverage()} days`],['Quality hold',`${scenario.inventory.qualityHoldDays} days`],['Allocated',`${scenario.inventory.allocatedDays} days`],['Incompatible',`${scenario.inventory.incompatibleBatchDays} days`]], evidence: scenario.verificationControls.at(-1)?.id ?? 'EVD-CALC-111' },
    'line-c': { eyebrow: 'PRODUCTION · SELECTED', title: `${lineC.product} ${lineC.name}`, status: plantState.lineCRisk.toUpperCase(), facts: [['State',lineC.status.replaceAll('_', ' ')],['Utilization',`${lineC.utilization}%`],['Coverage',`${plantState.coverageDays} days`],['Orders protected',String(plantState.ordersProtected)],['Dependency',scenario.material.name]], evidence: scenario.verificationControls.find((control) => control.id === 'EVD-IOT-110')?.id ?? 'EVD-IOT-110' },
    'line-a': { eyebrow: 'PRODUCTION · SELECTED', title: `${lineA.product} ${lineA.name}`, status: `${lineA.risk.toUpperCase()} RISK`, facts: [['State',lineA.status.replaceAll('_', ' ')],['Utilization',`${lineA.utilization}%`],['Coverage',`${lineA.coverageDays} days`]], evidence: scenario.verificationControls.find((control) => control.id === 'EVD-IOT-110')?.id ?? 'EVD-IOT-110' },
    'line-b': { eyebrow: 'PRODUCTION · SELECTED', title: `${lineB.product} ${lineB.name}`, status: lineB.status.replaceAll('_', ' ').toUpperCase(), facts: [['State',lineB.status.replaceAll('_', ' ')],['Restart',`Day ${lineB.restartDay}`],['Utilization',`${lineB.utilization}%`]], evidence: scenario.verificationControls.find((control) => control.id === 'EVD-IOT-110')?.id ?? 'EVD-IOT-110' },
    cell: { eyebrow: 'WORK CENTER · SELECTED', title: heatExchanger.name, status: heatExchanger.criticality.toUpperCase(), facts: [['Dependency',scenario.material.name],['Forecast',heatExchanger.forecast],['Downstream',downstream.name]], evidence: scenario.verificationControls.find((control) => control.id === 'EVD-BOM-108')?.id ?? 'EVD-BOM-108' },
  };
  const item = records[selected] ?? records.shipment;
  return <aside className="plant-inspector"><header><span>{item.eyebrow}</span><b>{item.status}</b></header><div className="inspector-orbit"><i/><b/><span><Factory size={28}/></span></div><h2>{item.title}</h2>{item.facts.map(([label,value]) => <DataPoint key={label} label={label} value={value}/>)}<div className="inspector-evidence"><Fingerprint size={15}/><span><small>EVIDENCE ANCHOR</small><code>{item.evidence}</code></span></div><button className="ns-primary" onClick={() => navigate(pathForStage('impact'))}>Open governed impact <ArrowRight size={15}/></button></aside>;
}

function ExecutiveLedgerTimeline({ events }: { events: LedgerEvent[] }) {
  const [technical, setTechnical] = useState(false);
  return <div className="ns-page ledger-page"><SyntheticDisclosure/><PageIntro eyebrow="OUTCOME LEDGER · GOVERNED MEMORY" title="Every claim, challenge, decision, guard, and result stays connected." description="The executive view explains consequence. Technical provenance reveals evidence, authority, tool results, correlation, and synthetic status." meta={`${events.length} IMMUTABLE EVENTS`}/><div className="ledger-toolbar"><div><button className={!technical ? 'active' : ''} onClick={() => setTechnical(false)}>Executive timeline</button><button className={technical ? 'active' : ''} onClick={() => setTechnical(true)}>Technical provenance</button></div><ProvenanceBadge label="PACT-NORTHSTAR-2026-07"/></div><section className="ledger-timeline">{events.map((event, index) => <article key={event.eventId}><div className="ledger-axis"><i>{index + 1}</i><b/></div><div><header><span>{event.eventType.split('.').join(' ').toUpperCase()}</span><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></header><h2>{ledgerMeaning(event)}</h2><p>{event.source} · <b>{event.status}</b></p>{technical && <pre>{JSON.stringify({ eventId: event.eventId, correlationId: event.correlationId, ...event.payload }, null, 2)}</pre>}</div></article>)}</section></div>;
}

function ledgerMeaning(event: LedgerEvent) {
  const meanings: Record<string,string> = {
    'disruption.signal_received': `A ${scenario.shipment.delayDays}-day ${scenario.material.name} delay entered verification.`,
    'investigation.opened': 'PACT opened a governed investigation before recommending action.',
    'investigation.materiality_confirmed': `Initial impact connected the disruption to ${formatCompactMoney(scenario.impact.revenueExposure)} of exposure.`,
    'outcome.contract_accepted': 'The Plant COO fixed target, deadline, budget, and prohibited actions.',
    'signal.verified': `${scenario.verificationControls.length} controls reproduced ${calculateUsableCoverage()} usable inventory days.`,
    'impact.quantified': `The twin connected ${scenario.impact.ordersAtRisk} orders and ${scenario.impact.strategicCustomers} strategic customers.`,
    'strategies.simulated': `${scenario.strategies.length} bounded options were compared under one contract.`,
    'model.plan_proposed': `${event.payload.artifactKind === 'genuine' ? 'Genuine GPT-5.6' : 'The local schema fixture'} proposed Balanced Recovery without tool authority.`,
    'model.artifact_unavailable': 'No model artifact was consumed; the workflow retained deterministic evidence and authority boundaries.',
    'workflow.recovered': 'PACT rejected untrusted saved state and restored the governed baseline.',
    'audit.packet_sealed': 'The plan and evidence packet became immutable for independent review.',
    'audit.completed': `A separate Auditor challenged ${scenario.audit.findings.length} material assumptions.`,
    'audit.conditions_bound': `${scenario.audit.requiredConditions.length} conditions changed decision readiness.`,
    'action_contract.approved_with_conditions': 'The Plant COO unlocked bounded action classes.',
    'action_contract.revision_requested': 'The Plant COO returned the plan for revision without unlocking authority.',
    'action_contract.rejected': 'The Plant COO rejected the plan; no action class or spend authority was unlocked.',
    'tool.supplier_commitment': 'The quality guard rejected premature supplier commitment.',
    'execution.graph_completed': `All ${scenario.actionGraph.length} commitments completed in dependency order.`,
    'outcome.closed': `Observed synthetic protection reached ${scenario.closeout.observedProtectedRevenuePercent.toFixed(1)}% for ${formatCompactMoney(scenario.closeout.finalSpend)}.`,
    'learning.retained': `${scenario.lessons.length} evidence-linked lessons entered organizational memory.`,
  };
  return meanings[event.eventType] ?? (event.eventType.startsWith('outcome.day_') ? `The synthetic operating twin recorded ${String(event.payload.day)}-day results.` : `${event.eventType.split('.').join(' ')} completed under governed authority.`);
}

function OutcomeReplayController({ state }: { state: WorkflowState }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [narration, setNarration] = useState(true);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => setIndex((current) => current >= scenario.replay.length - 1 ? 0 : current + 1), 1800);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [playing]);
  const item = scenario.replay[index];
  const replayEvent = [...state.ledger].reverse().find((event) => event.eventType === item.ledgerEventType);
  const stageAvailable = stageUnlocked(item.stage, state);
  const finalIndex = scenario.replay.length - 1;
  const provenance = replayEvent ? `${item.provenanceLabel} · LEDGERED` : 'PREPARED REPLAY · NOT YET LEDGERED';
  return <div className="ns-page replay-page"><SyntheticDisclosure/><PageIntro eyebrow="OPERATION NORTHSTAR · 3-MINUTE GUIDED REPLAY" title="Replay how a signal became a defensible result." description="Move through evidence, dissent, authority, a blocked unsafe action, dependency execution, observation, and retained learning. Future stages remain clearly marked until their ledger events exist." meta={`STAGE ${index + 1} OF ${scenario.replay.length}`}/><section className="replay-controller"><div className="replay-orbit" aria-hidden="true"><i/><i/><i/><span><strong>{item.coverageDays}</strong><small>DAYS COVERAGE</small><b>{item.risk.toUpperCase()} RISK</b></span></div><div className="replay-story" aria-live="polite" aria-atomic="true"><span>{item.id} · {item.stage.toUpperCase()}</span><h2>{item.title}</h2><p>{replayNarration(index)}</p><div><ProvenanceBadge label={provenance}/><button disabled={!stageAvailable} onClick={() => navigate(pathForStage(item.stage))}>{stageAvailable ? 'Open stage' : 'Stage locked'} <ArrowRight size={14}/></button></div></div><aside><span>PLANT SNAPSHOT</span><DataPoint label="C-17 COVERAGE" value={`${item.coverageDays} days`}/><DataPoint label="LINE C RISK" value={item.risk}/><DataPoint label="EXPECTED EVENT" value={item.ledgerEventType}/><DataPoint label="LEDGER EVENT" value={replayEvent?.eventId ?? 'Not yet recorded'}/><DataPoint label="NARRATION" value={narration ? 'On' : 'Off'}/></aside></section><div className="replay-controls"><button aria-label="Previous replay stage" onClick={() => setIndex((i) => Math.max(0,i-1))} disabled={index === 0}><ChevronLeft size={17}/></button><button className="play" aria-label={playing ? 'Pause replay' : 'Play replay'} aria-pressed={playing} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button><button aria-label="Next replay stage" onClick={() => setIndex((i) => Math.min(finalIndex,i+1))} disabled={index === finalIndex}><ChevronRight size={17}/></button><i aria-hidden="true"><b style={{ width: `${((index + 1) / scenario.replay.length) * 100}%` }}/></i><button className={narration ? 'active' : ''} aria-pressed={narration} onClick={() => setNarration((value) => !value)}>Narration {narration ? 'on' : 'off'}</button></div><div className="replay-rail">{scenario.replay.map((stage, i) => <button key={stage.id} className={i === index ? 'active' : i < index ? 'complete' : ''} aria-current={i === index ? 'step' : undefined} onClick={() => { setIndex(i); setPlaying(false); }}><i>{i < index ? <CheckCircle2 size={12}/> : i + 1}</i><span>{stage.title}</span></button>)}</div></div>;
}

function replayNarration(index: number) {
  const balanced = scenario.strategies.find((strategy) => strategy.id === 'STR-BALANCED') ?? scenario.strategies[2];
  const finalObservation = scenario.observations.at(-1) ?? scenario.observations[0];
  return [
    `A supplier EDI notice reports a ${scenario.shipment.delayDays}-day delay. PACT opens an investigation instead of recommending action.`,
    'Carrier, purchase order, bill of material, warehouse, and telemetry evidence converge on a material risk.',
    `PACT finds that ${scenario.inventory.erpReportedCoverageDays} ERP days include ${calculateInventoryDiscrepancy()} days of restricted inventory, leaving only ${calculateUsableCoverage()} usable days.`,
    `The plant twin traces the constraint through Line C, ${scenario.impact.ordersAtRisk} orders, ${scenario.impact.strategicCustomers} customers, and ${formatCompactMoney(scenario.impact.revenueExposure)} of exposure.`,
    `Speed First violates budget. Cost First misses target. ${balanced.name} projects ${balanced.projectedProtectedRevenuePercent.toFixed(1)}% protection for ${formatCompactMoney(balanced.estimatedCost)}.`,
    'A separate Auditor challenges quality timing, customs, labor, compressor supply, and contingency.',
    `${scenario.outcomeContract.authorities.humanApprover} approves a bounded Action Contract with conditions; models never receive authority.`,
    'The supplier tool is deliberately called too early and rejects the request because quality authorization is missing.',
    'Quality, Finance, Procurement, Logistics, Workforce, Manufacturing, Customer Operations, and Outcome Office complete predecessors.',
    `The twin moves from ${calculateUsableCoverage()} to ${finalObservation.inventoryCoverageDays} coverage days while Line C stays operational.`,
    `Day ${scenario.outcomeContract.deadlineDays} closes at ${scenario.closeout.observedProtectedRevenuePercent.toFixed(1)}% observed synthetic revenue protection and ${formatCompactMoney(scenario.closeout.finalSpend)} final spend.`,
    `${scenario.lessons.length} evidence-linked lessons become reusable organizational memory.`,
  ][index];
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return <div className="data-point"><small>{label}</small><strong>{value}</strong></div>;
}
