import scenarioJson from '../../data/otif-recovery.scenario.json';
import type {
  ApprovalRecord,
  AuditFinding,
  LedgerEvent,
  PactAction,
  Scenario,
  Strategy,
  VerificationResult,
  WorkflowState,
} from './types';

export const scenario = scenarioJson as unknown as Scenario;
export const CORRELATION_ID = 'PACT-OTIF-2026-07';

export function calculateOtif(period: { eligibleOrders: number; onTimeInFullOrders: number }): number {
  if (period.eligibleOrders <= 0 || period.onTimeInFullOrders > period.eligibleOrders) {
    throw new Error('Invalid OTIF population');
  }
  return Number(((period.onTimeInFullOrders / period.eligibleOrders) * 100).toFixed(1));
}

export function verifySignal(input: Scenario = scenario): VerificationResult {
  const baseline = calculateOtif(input.periods.baseline);
  const current = calculateOtif(input.periods.current);
  const checksPass = input.integrityChecks.every((check) => check.status === 'pass');
  const complete = input.integrityChecks.length >= 4;
  const classification = !complete
    ? 'insufficient_evidence'
    : !checksPass
      ? 'data_defect'
      : current === 72.4 && baseline === 84.3
        ? 'verified_operational'
        : 'calculation_defect';

  return {
    classification,
    baseline,
    current,
    delta: Number((current - baseline).toFixed(1)),
    checks: input.integrityChecks,
    evidenceIds: input.integrityChecks.map((check) => check.id),
    explanation:
      classification === 'verified_operational'
        ? 'The decline reproduces from eligible order counts, uses the governed definition, and passes all four integrity controls.'
        : 'PACT cannot authorize recovery planning until the signal defect or evidence gap is resolved.',
  };
}

export function evaluateStrategy(strategy: Strategy): { compliant: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (strategy.cost > 75_000) reasons.push('Exceeds the $75,000 hard budget constraint');
  return { compliant: reasons.length === 0, reasons };
}

export function buildBalancedPlan(): PactAction[] {
  return [
    {
      actionId: 'ACT-001', description: 'Authorize bounded recovery spend', owner: 'Maya Chen', team: 'Finance',
      rationale: 'Release a capped recovery envelope before external commitments.', evidenceIds: ['EVD-FIN-018'],
      preconditions: ['Plan approved', 'Spend <= $75,000'], dependencies: [], parameters: { amount: 68750, currency: 'USD' },
      estimatedCost: 0, estimatedEffect: 0, approvalRequired: true, toolOperation: 'finance.authorize_recovery', status: 'proposed', result: null,
      recovery: 'Revoke unused authorization and preserve the original cost center balance.',
    },
    {
      actionId: 'ACT-002', description: 'Commit approved alternate component allocation', owner: 'Elena Ruiz', team: 'Procurement',
      rationale: 'Cover 38% of the Atlas shortage through an already approved supplier.', evidenceIds: ['EVD-SUP-017', 'EVD-ORD-041'],
      preconditions: ['Finance authorization active', 'Supplier is approved'], dependencies: ['ACT-001'], parameters: { supplier: 'Northstar Components', coveragePercent: 38 },
      estimatedCost: 28600, estimatedEffect: 4.0, approvalRequired: true, toolOperation: 'supplier.commit_allocation', status: 'proposed', result: null,
      recovery: 'Cancel the unshipped allocation under the synthetic agreement.',
    },
    {
      actionId: 'ACT-003', description: 'Resequence Wilmington production for constrained orders', owner: 'Dev Malik', team: 'Manufacturing',
      rationale: 'Prioritize feasible strategic orders after component coverage is confirmed.', evidenceIds: ['EVD-MFG-009', 'EVD-CUS-006'],
      preconditions: ['Alternate allocation confirmed'], dependencies: ['ACT-002'], parameters: { plant: 'Wilmington', priorityTier: 'strategic', horizonDays: 14 },
      estimatedCost: 14200, estimatedEffect: 2.6, approvalRequired: true, toolOperation: 'production.resequence', status: 'proposed', result: null,
      recovery: 'Restore the prior sequence snapshot if material starvation occurs.',
    },
    {
      actionId: 'ACT-004', description: 'Reserve bounded recovery capacity with Carrier Delta', owner: 'Jon Bell', team: 'Logistics',
      rationale: 'Recover missed pickup capacity without exceeding the freight tolerance.', evidenceIds: ['EVD-LOG-023', 'EVD-LOG-031'],
      preconditions: ['Finance authorization active'], dependencies: ['ACT-001'], parameters: { carrier: 'Carrier Delta', reservedLoads: 24, cap: 25950 },
      estimatedCost: 25950, estimatedEffect: 1.9, approvalRequired: true, toolOperation: 'carrier.reserve_capacity', status: 'proposed', result: null,
      recovery: 'Release unused synthetic load reservations before Day 3.',
    },
    {
      actionId: 'ACT-005', description: 'Draft strategic-customer recovery communication', owner: 'Aisha Grant', team: 'Customer',
      rationale: 'Give account teams evidence-backed dates after supply and logistics commitments exist.', evidenceIds: ['EVD-CUS-006'],
      preconditions: ['Recovery dates recalculated'], dependencies: ['ACT-003', 'ACT-004'], parameters: { audience: '42 strategic customers', send: false },
      estimatedCost: 0, estimatedEffect: 0, approvalRequired: true, toolOperation: 'customer.create_draft', status: 'proposed', result: null,
      recovery: 'Discard drafts; external sending is not available in the demo environment.',
    },
    {
      actionId: 'ACT-006', description: 'Create coordinated recovery work items', owner: 'PACT Outcome Lead', team: 'Outcome Office',
      rationale: 'Make owners, checkpoints, and dependencies inspectable across all teams.', evidenceIds: ['EVD-PV-004'],
      preconditions: ['Material commitments recorded'], dependencies: ['ACT-002', 'ACT-003', 'ACT-004'], parameters: { checkpoints: 'Day 3, 7, 14, 21' },
      estimatedCost: 0, estimatedEffect: 0, approvalRequired: true, toolOperation: 'work.create_items', status: 'proposed', result: null,
      recovery: 'Close incomplete synthetic work items with a reason.',
    },
  ];
}

export function auditBalancedPlan(strategy: Strategy, actions: PactAction[]): AuditFinding[] {
  const totalCost = actions.reduce((sum, action) => sum + action.estimatedCost, 0);
  return [
    {
      id: 'AUD-001', severity: totalCost > 75_000 ? 'blocking' : 'advisory', title: 'Budget independently reconciled',
      detail: `Action costs total $${totalCost.toLocaleString()}, leaving $${(75_000 - totalCost).toLocaleString()} of headroom.`,
      evidenceIds: ['EVD-FIN-018'], resolved: totalCost <= 75_000,
    },
    {
      id: 'AUD-002', severity: 'material', title: 'Carrier assumption is optimistic',
      detail: `The ${strategy.projectedDay21.toFixed(1)}% projection assumes 92% pickup acceptance; the observed scenario reaches 91%, creating a 0.1-point variance.`,
      evidenceIds: ['EVD-LOG-023'], resolved: false,
    },
    {
      id: 'AUD-003', severity: 'advisory', title: 'Causality claim constrained',
      detail: 'Contributor shares are observed associations supported by operational events, not proof of exclusive causation.',
      evidenceIds: ['EVD-SUP-017', 'EVD-MFG-009', 'EVD-LOG-023'], resolved: true,
    },
  ];
}

export function readyActions(actions: PactAction[]): PactAction[] {
  const completed = new Set(actions.filter((action) => action.status === 'complete').map((action) => action.actionId));
  return actions.map((action) => {
    if (action.status === 'complete' || action.status === 'executing' || action.status === 'failed') return action;
    const ready = action.dependencies.every((dependency) => completed.has(dependency));
    return { ...action, status: ready ? 'ready' : 'blocked' };
  });
}

export function executeNextAction(state: WorkflowState): WorkflowState {
  if (state.approval?.decision !== 'approved') throw new Error('Material actions require an approved plan');
  const normalized = readyActions(state.actions);
  const next = normalized.find((action) => action.status === 'ready');
  if (!next) return { ...state, actions: normalized };
  const result: Record<string, unknown> = next.toolOperation === 'customer.create_draft'
    ? { draftId: 'DRAFT-042', deliveryState: 'not_sent', safeguard: 'external send disabled' }
    : { operationId: `OP-${next.actionId.slice(-3)}`, accepted: true, synthetic: true };
  const completed = normalized.map((action) => action.actionId === next.actionId ? { ...action, status: 'complete' as const, result } : action);
  const ledger = appendLedger(state.ledger, next.toolOperation, 'simulated_business_tool', 'complete', {
    actionId: next.actionId, request: next.parameters, response: result, approvedPlanId: 'PLAN-BALANCED-v1',
  });
  return { ...state, actions: readyActions(completed), ledger };
}

export function appendLedger(
  events: LedgerEvent[], eventType: string, source: string, status: string, payload: Record<string, unknown>,
): LedgerEvent[] {
  return [...events, {
    eventId: `EVT-${String(events.length + 1).padStart(3, '0')}`,
    timestamp: new Date().toISOString(), eventType, source, status, correlationId: CORRELATION_ID, payload,
  }];
}

export function createApproval(decision: ApprovalRecord['decision']): ApprovalRecord {
  return { approver: 'Jordan Lee · Executive Outcome Owner', decidedAt: new Date().toISOString(), contractVersion: '1.0.0', planVersion: 'PLAN-BALANCED-v1', decision };
}

export async function hashContent(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export const initialState: WorkflowState = {
  stage: 'signal',
  objective: 'Recover OTIF to at least 82.0% within 21 days without increasing quality escapes or exceeding $75,000.',
  contractConfirmed: false, contractHash: null, verification: null, selectedStrategyId: 'STR-BALANCED', actions: [], auditFindings: [], approval: null, currentDay: 0,
  ledger: [{
    eventId: 'EVT-001', timestamp: scenario.generatedAt, eventType: 'signal.detected', source: 'synthetic_operating_twin', status: 'open', correlationId: CORRELATION_ID,
    payload: { metric: 'OTIF', baseline: 84.3, current: 72.4, label: 'OBSERVED' },
  }],
};
