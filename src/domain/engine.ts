import scenarioJson from '../../data/northstar-material-recovery.scenario.json';
import {
  ACTION_GRAPH,
  AUDIT_CONDITION_SET_ID,
  CORRELATION_ID as SHARED_CORRELATION_ID,
  PLAN_ID,
  RUNTIME_VERSION as SHARED_RUNTIME_VERSION,
  executePactOperation,
} from '../../plugins/pact/runtime/pact-runtime.mjs';
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
import { outcomeContract } from './contracts';

export const scenario = scenarioJson as unknown as Scenario;
export const CORRELATION_ID = SHARED_CORRELATION_ID;
export const RUNTIME_VERSION = SHARED_RUNTIME_VERSION;
export { AUDIT_CONDITION_SET_ID, PLAN_ID };

export function calculateUsableCoverage(inventory: Scenario['inventory'] = scenario.inventory): number {
  const usable = inventory.erpReportedCoverageDays - inventory.qualityHoldDays - inventory.allocatedDays - inventory.incompatibleBatchDays;
  return Number(usable.toFixed(1));
}

export function calculateInventoryDiscrepancy(inventory: Scenario['inventory'] = scenario.inventory): number {
  return Number((inventory.erpReportedCoverageDays - calculateUsableCoverage(inventory)).toFixed(1));
}

export function calculateProtectedValue(percent: number, exposure = scenario.outcomeContract.baselineExposedRevenue): number {
  if (percent < 0 || percent > 100 || exposure < 0) throw new Error('Invalid protected-value input');
  return Number((exposure * percent / 100).toFixed(2));
}

export function getStrategy(strategyId: Strategy['id'], input: Scenario = scenario): Strategy {
  const strategy = input.strategies.find((item) => item.id === strategyId);
  if (!strategy) throw new Error(`Scenario is missing strategy ${strategyId}.`);
  return strategy;
}

export function getObservation(day: number, input: Scenario = scenario) {
  const observation = input.observations.find((item) => item.day === day);
  if (!observation) throw new Error(`Scenario is missing the Day ${day} observation.`);
  return observation;
}

export function getFinalObservation(input: Scenario = scenario) {
  return getObservation(input.outcomeContract.deadlineDays, input);
}

export function verifySignal(input: Scenario = scenario): VerificationResult {
  const checksById = new Map(input.verificationControls.map((check) => [check.id, check]));
  const complete = input.verificationPolicy.requiredControlIds.every((id) => checksById.has(id));
  const checksPass = input.verificationPolicy.requiredControlIds.every((id) => checksById.get(id)?.status === input.verificationPolicy.requiredStatus);
  const reproduced = calculateUsableCoverage(input.inventory);
  const discrepancy = calculateInventoryDiscrepancy(input.inventory);
  const expectedDiscrepancy = Number((input.inventory.erpReportedCoverageDays - input.inventory.usableCoverageDays).toFixed(1));
  const classification = !complete
    ? 'insufficient_evidence'
    : !checksPass
      ? 'data_defect'
      : reproduced !== input.inventory.usableCoverageDays || discrepancy !== expectedDiscrepancy
        ? 'calculation_defect'
        : 'verified_material_risk';

  return {
    classification,
    confidence: classification === 'verified_material_risk' ? 'high' : 'low',
    erpCoverageDays: input.inventory.erpReportedCoverageDays,
    usableCoverageDays: reproduced,
    discrepancyDays: discrepancy,
    checks: input.verificationControls,
    evidenceIds: input.verificationControls.map((check) => check.id),
    explanation: classification === 'verified_material_risk'
      ? `The ${input.shipment.delayDays}-day diversion is independently confirmed and the inventory reconciliation reproduces ${reproduced.toFixed(1)} usable days after removing restricted stock. The signal is eligible for governed recovery planning.`
      : 'PACT cannot authorize recovery planning until the evidence or calculation defect is resolved.',
  };
}

export function evaluateStrategy(strategy: Strategy): { compliant: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const budget = `$${scenario.outcomeContract.maximumBudget.toLocaleString('en-US')}`;
  if (strategy.estimatedCost > scenario.outcomeContract.maximumBudget) reasons.push(`Exceeds the ${budget} response budget`);
  if (strategy.projectedProtectedRevenuePercent < scenario.outcomeContract.targetProtectedRevenuePercent) reasons.push(`Fails the ${scenario.outcomeContract.targetProtectedRevenuePercent}% protected-revenue target`);
  if (strategy.projectedDay14ProtectedRevenuePercent < outcomeContract.interimTarget.value) reasons.push(`Fails the Day ${outcomeContract.interimTarget.deadlineDay} interim target of ${outcomeContract.interimTarget.value}% protected revenue`);
  if (strategy.durationDays > scenario.outcomeContract.deadlineDays) reasons.push(`Exceeds the ${scenario.outcomeContract.deadlineDays}-day outcome deadline`);
  return { compliant: reasons.length === 0, reasons };
}

export function buildBalancedPlan(): PactAction[] {
  return ACTION_GRAPH.map(({ action }) => ({
    ...action,
    evidenceIds: [...action.evidenceIds],
    preconditions: [...action.preconditions],
    dependencies: [...action.dependencies],
    parameters: { ...action.parameters },
    status: 'proposed',
    result: null,
  }));
}

export function auditBalancedPlan(_strategy: Strategy, actions: PactAction[]): AuditFinding[] {
  const graphIds = new Set(actions.map((action) => action.actionId));
  const transfer = actions.find((action) => action.actionId === 'ACT-005');
  const logisticsGate = actions.find((action) => action.actionId === 'ACT-007');
  return scenario.audit.findings.map((finding) => ({
    ...finding,
    resolved: finding.id === 'AUD-001'
      ? graphIds.has('ACT-002') && actions.find((action) => action.actionId === 'ACT-004')?.dependencies.includes('ACT-002') === true
      : finding.id === 'AUD-002'
        ? transfer?.dependencies.includes('ACT-007') === true
          && transfer.parameters.customsContingency === true
          && logisticsGate?.parameters.customsRouteValidated === true
        : finding.id === 'AUD-003'
          ? graphIds.has('ACT-006')
          : finding.id === 'AUD-004'
            ? actions.find((action) => action.actionId === 'ACT-010')?.parameters.compressorRiskDaily === true
            : actions.find((action) => action.actionId === 'ACT-010')?.parameters.contingencyReserve === 35000,
  }));
}

export function createImmutableAuditPacket(actions: PactAction[]) {
  const packet = {
    packetId: scenario.audit.packetId,
    planId: PLAN_ID,
    contractId: scenario.outcomeContract.id,
    strategyId: 'STR-BALANCED' as const,
    actionIds: actions.map((action) => action.actionId),
    evidenceIds: [...new Set(actions.flatMap((action) => action.evidenceIds))],
    sealedAt: new Date(new Date(scenario.generatedAt).getTime() + 7 * 60000).toISOString(),
  };
  Object.freeze(packet.actionIds);
  Object.freeze(packet.evidenceIds);
  return Object.freeze(packet);
}

export function readyActions(actions: PactAction[]): PactAction[] {
  const completed = new Set(actions.filter((action) => action.status === 'complete').map((action) => action.actionId));
  return actions.map((action) => {
    if (action.status === 'complete' || action.status === 'executing' || action.status === 'failed') return action;
    const ready = action.dependencies.every((dependency) => completed.has(dependency));
    return { ...action, status: ready ? 'ready' : 'blocked' };
  });
}

function runtimeStateFor(state: WorkflowState) {
  return {
    verified: state.verification?.classification === 'verified_material_risk',
    auditConditionsAdopted: state.auditConditionAcceptance?.conditionSetId === AUDIT_CONDITION_SET_ID,
    humanApproved: state.approval?.decision === 'approved_with_conditions' || state.approval?.decision === 'approved',
    completedActionIds: state.actions.filter((action) => action.status === 'complete').map((action) => action.actionId),
  };
}

export function demonstrateUnsafeSupplierAttempt(state: WorkflowState): WorkflowState {
  if (!state.approval || state.approval.decision !== 'approved_with_conditions') throw new Error('Human approval must exist before demonstrating the quality guard.');
  const supplierAction = state.actions.find((action) => action.actionId === 'ACT-004');
  if (!supplierAction) throw new Error('Supplier commitment is missing from the Action Graph.');
  try {
    executePactOperation(runtimeStateFor(state), supplierAction.toolOperation, {
      approvedPlanId: PLAN_ID,
      auditConditionSetId: AUDIT_CONDITION_SET_ID,
      actionId: supplierAction.actionId,
      ...supplierAction.parameters,
    });
    throw new Error('Unsafe supplier attempt unexpectedly succeeded.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Unsafe supplier attempt unexpectedly succeeded.') throw error;
    return {
      ...state,
      unsafeAttemptDemonstrated: true,
      unsafeAttemptMessage: message,
      actions: readyActions(state.actions),
      ledger: appendLedger(state.ledger, 'tool.supplier_commitment', 'deterministic_policy_guard', 'blocked', {
        actionId: supplierAction.actionId,
        guard: 'quality_authorization_required',
        missingEvidenceId: 'EVD-QLT-115',
        message,
        synthetic: true,
      }),
    };
  }
}

export function executeNextAction(state: WorkflowState): WorkflowState {
  if (!state.approval || !['approved', 'approved_with_conditions'].includes(state.approval.decision)) throw new Error('Material actions require an approved Action Contract.');
  const normalized = readyActions(state.actions);
  const next = normalized.find((action) => action.status === 'ready');
  if (!next) return { ...state, actions: normalized };
  const executed = executePactOperation(runtimeStateFor({ ...state, actions: normalized }), next.toolOperation, {
    approvedPlanId: PLAN_ID,
    auditConditionSetId: AUDIT_CONDITION_SET_ID,
    actionId: next.actionId,
    ...next.parameters,
  });
  const completed = normalized.map((action) => action.actionId === next.actionId ? { ...action, status: 'complete' as const, result: executed.result } : action);
  return {
    ...state,
    actions: readyActions(completed),
    ledger: appendLedger(state.ledger, next.toolOperation, 'simulated_business_tool', 'complete', {
      actionId: next.actionId,
      approvedPlanId: PLAN_ID,
      evidenceIds: next.evidenceIds,
      toolResult: executed.result,
      guardResult: 'pass',
      synthetic: true,
    }),
  };
}

export function executeRemainingActions(state: WorkflowState): WorkflowState {
  let next = state;
  for (let index = 0; index < state.actions.length; index += 1) {
    const completedBefore = next.actions.filter((action) => action.status === 'complete').length;
    next = executeNextAction(next);
    if (next.actions.filter((action) => action.status === 'complete').length === completedBefore) break;
  }
  return next;
}

export function derivePlantState(actions: PactAction[]) {
  const completed = new Set(actions.filter((action) => action.status === 'complete').map((action) => action.actionId));
  const current = scenario.plantStateProgression.reduce((latest, candidate) => (
    candidate.unlockActionId === null || completed.has(candidate.unlockActionId) ? candidate : latest
  ), scenario.plantStateProgression[0]);
  return {
    coverageDays: current.coverageDays,
    lineCRisk: current.lineCRisk,
    ordersProtected: current.ordersProtected,
    phase: current.phase.toLowerCase(),
  };
}

export function appendLedger(events: LedgerEvent[], eventType: string, source: string, status: string, payload: Record<string, unknown>): LedgerEvent[] {
  const base = new Date(scenario.generatedAt).getTime();
  const timestamp = new Date(base + events.length * 60000).toISOString();
  return [...events, {
    eventId: `EVT-${String(events.length + 1).padStart(3, '0')}`,
    timestamp,
    eventType,
    source,
    status,
    correlationId: CORRELATION_ID,
    payload: { contractId: scenario.outcomeContract.id, outcomeId: scenario.outcomeContract.id, synthetic: true, ...payload },
  }];
}

export function createApproval(decision: ApprovalRecord['decision'] = 'approved_with_conditions'): ApprovalRecord {
  const grantsAuthority = decision === 'approved' || decision === 'approved_with_conditions';
  const rationale = decision === 'revision_requested'
    ? 'The decision packet requires revision before any enterprise commitment can be authorized.'
    : decision === 'rejected'
      ? 'The proposed recovery plan is rejected; no action class or spend authority is unlocked.'
      : 'Protect strategic commitments through a bounded, audited response while preserving quality and customer authority.';
  return {
    approver: scenario.outcomeContract.authorities.humanApprover,
    authority: 'Plant COO',
    decidedAt: new Date(new Date(scenario.generatedAt).getTime() + 9 * 60000).toISOString(),
    contractVersion: scenario.version,
    planVersion: PLAN_ID,
    decision,
    rationale,
    conditions: decision === 'approved_with_conditions' ? [...scenario.actionContract.conditions] : [],
    scope: grantsAuthority ? [...scenario.actionContract.unlockedActionClasses] : [],
  };
}

export async function hashContent(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export const initialState: WorkflowState = {
  stage: 'investigation',
  objective: scenario.outcomeContract.question,
  contractConfirmed: false,
  contractHash: null,
  verification: null,
  selectedStrategyId: 'STR-BALANCED',
  actions: [],
  auditFindings: [],
  auditConditionAcceptance: null,
  approval: null,
  unsafeAttemptDemonstrated: false,
  unsafeAttemptMessage: null,
  currentDay: 0,
  ledger: [{
    eventId: 'EVT-001',
    timestamp: scenario.generatedAt,
    eventType: 'disruption.signal_received',
    source: 'supplier_edi_notice',
    status: 'verification_required',
    correlationId: CORRELATION_ID,
    payload: {
      signalId: scenario.signal.id,
      shipmentId: scenario.shipment.id,
      expectedDelayDays: scenario.signal.expectedDelayDays,
      evidenceIds: ['EVD-EDI-101'],
      label: 'OBSERVED',
      contractId: null,
      outcomeId: null,
      synthetic: true,
    },
  }],
};
