export const RUNTIME_VERSION = '1.0.0';
export const PLAN_ID = 'PLAN-NORTHSTAR-BALANCED-v1';
export const CORRELATION_ID = 'PACT-NORTHSTAR-2026-07';
export const AUDIT_CONDITION_SET_ID = 'AUDIT-COND-NORTHSTAR-v1';
export const MAXIMUM_BUDGET = 420000;

const materialSchema = (properties, required) => ({
  type: 'object',
  required: ['approvedPlanId', 'auditConditionSetId', 'actionId', ...required],
  properties: {
    approvedPlanId: { type: 'string', const: PLAN_ID },
    auditConditionSetId: { type: 'string', const: AUDIT_CONDITION_SET_ID },
    actionId: { type: 'string', pattern: '^ACT-[0-9]{3}$' },
    ...properties,
  },
  additionalProperties: false,
});

const definition = (action, name, description, properties, required) => ({
  action: { ...action, rationale: action.rationale ?? description, approvalRequired: true },
  mcp: { name, description, inputSchema: materialSchema(properties, required) },
});

export const ACTION_GRAPH = [
  definition({
    actionId: 'ACT-001', description: 'Validate alternate supplier capacity', owner: 'Priya Raman', team: 'Procurement', evidenceIds: ['EVD-SUP-119'],
    preconditions: ['Human-approved Action Contract'], dependencies: [], parameters: { supplier: 'Redwood Alloys', capacityDays: 3.4 }, estimatedCost: 0, estimatedEffect: 0,
    toolOperation: 'supplier.validate_capacity', deadline: 'Day 1', recovery: 'Retain primary-supplier-only plan.',
  }, 'pact_validate_supplier', 'Validate bounded capacity with the conditionally approved synthetic supplier.', { supplier: { type: 'string', const: 'Redwood Alloys' }, capacityDays: { type: 'number', const: 3.4 } }, ['supplier', 'capacityDays']),
  definition({
    actionId: 'ACT-002', description: 'Approve alternate supplier sample batch', owner: 'Dr. Lena Ortiz', team: 'Quality', evidenceIds: ['EVD-QLT-115'],
    preconditions: ['Sample batch received', 'NX-400 thresholds unchanged'], dependencies: ['ACT-001'], parameters: { supplier: 'Redwood Alloys', batchId: 'BATCH-C17-R01' }, estimatedCost: 12000, estimatedEffect: 0,
    toolOperation: 'quality.validate_release', deadline: 'Day 2', recovery: 'Reject sample and retain conditional status.',
  }, 'pact_validate_quality_release', 'Record quality authorization for the synthetic sample without lowering NX-400 thresholds.', { supplier: { type: 'string', const: 'Redwood Alloys' }, batchId: { type: 'string', const: 'BATCH-C17-R01' } }, ['supplier', 'batchId']),
  definition({
    actionId: 'ACT-003', description: 'Authorize bounded recovery spend', owner: 'Avery Brooks', team: 'Finance', evidenceIds: ['EVD-FIN-118', 'EVD-POL-114'],
    preconditions: ['Plant COO approval', 'CFO delegate authority'], dependencies: [], parameters: { amount: 420000, currency: 'USD' }, estimatedCost: 0, estimatedEffect: 0,
    toolOperation: 'finance.authorize_recovery', deadline: 'Day 1', recovery: 'Revoke unused authority.',
  }, 'pact_authorize_finance', 'Record the CFO-delegate bounded recovery envelope after Plant COO approval.', { amount: { type: 'number', maximum: MAXIMUM_BUDGET }, currency: { type: 'string', const: 'USD' } }, ['amount', 'currency']),
  definition({
    actionId: 'ACT-004', description: 'Commit approved alternate material', owner: 'Priya Raman', team: 'Procurement', evidenceIds: ['EVD-SUP-119', 'EVD-QLT-115'],
    preconditions: ['Quality authorization', 'Finance authorization', 'Conditionally approved supplier'], dependencies: ['ACT-002', 'ACT-003'], parameters: { supplier: 'Redwood Alloys', amount: 148000, coverageDays: 1.7 }, estimatedCost: 148000, estimatedEffect: 1.7,
    toolOperation: 'supplier.commit_allocation', deadline: 'Day 2', recovery: 'Cancel unshipped allocation.',
  }, 'pact_commit_supplier', 'Commit bounded Copper Alloy C-17 only after quality and finance authorization.', { supplier: { type: 'string', const: 'Redwood Alloys' }, amount: { type: 'number', maximum: 160000 }, coverageDays: { type: 'number', const: 1.7 } }, ['supplier', 'amount', 'coverageDays']),
  definition({
    actionId: 'ACT-005', description: 'Transfer approved inventory from Aurelis Brno', owner: 'Nadia Okafor', team: 'Logistics', evidenceIds: ['EVD-LOG-117', 'EVD-WMS-120'],
    preconditions: ['Inventory confirmed', 'Customs contingency active'], dependencies: ['ACT-003'], parameters: { origin: 'Aurelis Brno', coverageDays: 1.6, customsContingency: true }, estimatedCost: 52000, estimatedEffect: 1.6,
    toolOperation: 'inventory.transfer', deadline: 'Day 3', recovery: 'Return unopened lots to Brno.',
  }, 'pact_transfer_inventory', 'Dispatch confirmed synthetic inventory with a customs contingency.', { origin: { type: 'string', const: 'Aurelis Brno' }, coverageDays: { type: 'number', const: 1.6 }, customsContingency: { type: 'boolean', const: true } }, ['origin', 'coverageDays', 'customsContingency']),
  definition({
    actionId: 'ACT-006', description: 'Confirm bounded overtime and weekend shifts', owner: 'Caleb Young', team: 'Workforce Operations', evidenceIds: ['EVD-LAB-112'],
    preconditions: ['Labor policy respected'], dependencies: [], parameters: { weekendShifts: 2, overtimeHours: 960 }, estimatedCost: 42000, estimatedEffect: 0,
    toolOperation: 'labor.confirm_capacity', deadline: 'Day 2', recovery: 'Return to standard shift plan.',
  }, 'pact_confirm_labor_capacity', 'Confirm bounded synthetic labor capacity within policy.', { weekendShifts: { type: 'integer', maximum: 2 }, overtimeHours: { type: 'integer', maximum: 960 } }, ['weekendShifts', 'overtimeHours']),
  definition({
    actionId: 'ACT-007', description: 'Reserve interplant transfer and limited air freight', owner: 'Nadia Okafor', team: 'Logistics', evidenceIds: ['EVD-LOG-117'],
    preconditions: ['Replacement material confirmed', 'Transfer dispatched'], dependencies: ['ACT-004', 'ACT-005'], parameters: { carrier: 'Aurelis Priority Freight', reservedLoads: 6, cap: 65000 }, estimatedCost: 65000, estimatedEffect: 1.1,
    toolOperation: 'carrier.reserve_capacity', deadline: 'Day 3', recovery: 'Release unused reservations.',
  }, 'pact_reserve_carrier', 'Reserve limited synthetic priority freight after material commitments exist.', { carrier: { type: 'string', const: 'Aurelis Priority Freight' }, reservedLoads: { type: 'integer', maximum: 6 }, cap: { type: 'number', maximum: 65000 } }, ['carrier', 'reservedLoads', 'cap']),
  definition({
    actionId: 'ACT-008', description: 'Resequence Line C by customer criticality', owner: 'Marcus Chen', team: 'Manufacturing', evidenceIds: ['EVD-ORD-113', 'EVD-IOT-110'],
    preconditions: ['Material arrival confirmed', 'Labor confirmed'], dependencies: ['ACT-004', 'ACT-005', 'ACT-006'], parameters: { plant: 'Northstar Plant 7', line: 'Line C', priorityTier: 'strategic' }, estimatedCost: 32000, estimatedEffect: 113,
    toolOperation: 'production.resequence', deadline: 'Day 4', recovery: 'Restore the prior sequence snapshot.',
  }, 'pact_resequence_production', 'Resequence the synthetic Line C plan only after material and labor readiness.', { plant: { type: 'string', const: 'Northstar Plant 7' }, line: { type: 'string', const: 'Line C' }, priorityTier: { type: 'string', const: 'strategic' } }, ['plant', 'line', 'priorityTier']),
  definition({
    actionId: 'ACT-009', description: 'Prepare strategic-customer recovery drafts', owner: 'Sofia Patel', team: 'Customer Operations', evidenceIds: ['EVD-ORD-113'],
    preconditions: ['Recovery dates recalculated', 'Draft-only policy'], dependencies: ['ACT-007', 'ACT-008'], parameters: { audience: '42 strategic customers', send: false }, estimatedCost: 0, estimatedEffect: 0,
    toolOperation: 'customer.create_draft', deadline: 'Day 4', recovery: 'Discard drafts.',
  }, 'pact_create_customer_draft', 'Create synthetic strategic-customer drafts. External sending is unavailable.', { audience: { type: 'string', const: '42 strategic customers' }, send: { type: 'boolean', const: false } }, ['audience', 'send']),
  definition({
    actionId: 'ACT-010', description: 'Ring-fence contingency and monitor outcome variance', owner: 'PACT Outcome Lead', team: 'Outcome Office', evidenceIds: ['EVD-CALC-111', 'EVD-FIN-118'],
    preconditions: ['Material commitments recorded', 'CFO delegate authority retained'], dependencies: ['ACT-003', 'ACT-004', 'ACT-005', 'ACT-006', 'ACT-007', 'ACT-008', 'ACT-009'], parameters: { checkpoints: 'Day 3, 7, 14, 21', compressorRiskDaily: true, contingencyReserve: 35000 }, estimatedCost: 35000, estimatedEffect: 0,
    toolOperation: 'work.create_items', deadline: 'Day 4', recovery: 'Release unused reserve and close incomplete work items with rationale.',
  }, 'pact_create_work_items', 'Ring-fence the synthetic contingency and create cross-functional checkpoints with daily compressor-risk monitoring.', { checkpoints: { type: 'string', const: 'Day 3, 7, 14, 21' }, compressorRiskDaily: { type: 'boolean', const: true }, contingencyReserve: { type: 'number', const: 35000 } }, ['checkpoints', 'compressorRiskDaily', 'contingencyReserve']),
];

export const OBSERVATIONS = {
  0: { protectedRevenuePercent: 0, projectedProtectionPercent: 96.4, inventoryCoverageDays: 5.4, ordersProtected: 0, ordersAtRisk: 318, spend: 0, lineCRisk: 'high' },
  3: { protectedRevenuePercent: 48.6, projectedProtectionPercent: 96.4, inventoryCoverageDays: 7.1, ordersProtected: 71, ordersAtRisk: 247, spend: 230000, lineCRisk: 'medium' },
  7: { protectedRevenuePercent: 72.8, projectedProtectionPercent: 96.4, inventoryCoverageDays: 8.7, ordersProtected: 184, ordersAtRisk: 134, spend: 328000, lineCRisk: 'medium' },
  14: { protectedRevenuePercent: 93, projectedProtectionPercent: 96.4, inventoryCoverageDays: 9.8, ordersProtected: 296, ordersAtRisk: 1, spend: 351000, lineCRisk: 'low' },
  21: { protectedRevenuePercent: 96.1, projectedProtectionPercent: 96.4, inventoryCoverageDays: 9.8, ordersProtected: 317, ordersAtRisk: 0, spend: 389000, lineCRisk: 'low' },
};

const specialTools = [
  { operation: 'proof.verify_signal', name: 'pact_verify_signal', description: 'Reproduce the synthetic Northstar material risk and inventory discrepancy.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  {
    operation: 'audit.adopt_conditions', name: 'pact_adopt_audit_conditions', description: 'Bind the five immutable Auditor conditions to the Northstar plan.',
    inputSchema: { type: 'object', required: ['planId', 'conditionSetId', 'requiredConditionCount', 'authorizedBy'], properties: { planId: { type: 'string', const: PLAN_ID }, conditionSetId: { type: 'string', const: AUDIT_CONDITION_SET_ID }, requiredConditionCount: { type: 'integer', const: 5 }, authorizedBy: { type: 'string', const: 'plant_coo' } }, additionalProperties: false },
  },
  {
    operation: 'approval.record', name: 'pact_record_human_approval', description: 'Record the Plant COO approve-with-conditions decision. No business action executes here.',
    inputSchema: { type: 'object', required: ['planId', 'decision', 'approver'], properties: { planId: { type: 'string', const: PLAN_ID }, decision: { type: 'string', const: 'approved_with_conditions' }, approver: { type: 'string', const: 'Morgan Ellis · Plant COO' } }, additionalProperties: false },
  },
  { operation: 'outcome.observe', name: 'pact_observe_outcome', description: 'Read a deterministic synthetic Northstar checkpoint after governed execution.', inputSchema: { type: 'object', required: ['day'], properties: { day: { type: 'integer', enum: [0, 3, 7, 14, 21] } }, additionalProperties: false } },
  { operation: 'runtime.reset', name: 'pact_reset_demo', description: 'Reset only the in-memory synthetic Northstar demonstration state.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
];

export const MCP_TOOL_DEFINITIONS = [specialTools[0], specialTools[1], specialTools[2], ...ACTION_GRAPH.map(({ action, mcp }) => ({ operation: action.toolOperation, ...mcp })), specialTools[3], specialTools[4]];

export function createRuntimeState() {
  return { verified: false, auditConditionsAdopted: false, humanApproved: false, completedActionIds: [] };
}

const actionByOperation = new Map(ACTION_GRAPH.map((item) => [item.action.toolOperation, item.action]));
const complete = (state, actionId) => state.completedActionIds.includes(actionId);

function assertMaterialRequest(state, action, args) {
  if (args?.approvedPlanId !== PLAN_ID || !state.humanApproved) throw new Error('Action blocked: Required human authorization is missing.');
  if (!state.verified) throw new Error('Action blocked: Signal verification is incomplete.');
  if (!state.auditConditionsAdopted || args?.auditConditionSetId !== AUDIT_CONDITION_SET_ID) throw new Error('Action blocked: Independent audit conditions are not bound to the plan.');
  if (args?.actionId !== action.actionId) throw new Error(`${action.toolOperation} requires actionId=${action.actionId}`);
  if (complete(state, action.actionId)) throw new Error(`${action.actionId} is already complete`);
  if (action.actionId === 'ACT-004' && !complete(state, 'ACT-002')) throw new Error('Action blocked: Required quality authorization is missing.');
  if (action.actionId === 'ACT-004' && !complete(state, 'ACT-003')) throw new Error('Action blocked: Required finance authorization is missing.');
  const missing = action.dependencies.filter((dependency) => !complete(state, dependency));
  if (missing.length) throw new Error(`Action blocked: Required predecessor ${missing.join(', ')} is incomplete.`);
}

function assertApprovedParameters(operation, args) {
  if (operation === 'finance.authorize_recovery' && (args.amount !== MAXIMUM_BUDGET || args.currency !== 'USD')) throw new Error('Action blocked: Finance request exceeds or differs from the approved $420,000 USD envelope.');
  if ((operation === 'supplier.validate_capacity' || operation === 'quality.validate_release' || operation === 'supplier.commit_allocation') && args.supplier !== 'Redwood Alloys') throw new Error('Action blocked: Supplier is not approved for this Action Contract.');
  if (operation === 'supplier.commit_allocation' && (args.amount !== 148000 || args.coverageDays !== 1.7)) throw new Error('Action blocked: Supplier commitment differs from the authorized scope.');
  if (operation === 'inventory.transfer' && args.customsContingency !== true) throw new Error('Action blocked: Customs contingency is required.');
  if (operation === 'customer.create_draft' && args.send !== false) throw new Error('Action blocked: Direct customer-message sending is prohibited.');
  if (operation === 'production.resequence' && (args.plant !== 'Northstar Plant 7' || args.line !== 'Line C')) throw new Error('Action blocked: Production request differs from the approved plan.');
  if (operation === 'work.create_items' && args.contingencyReserve !== 35000) throw new Error('Action blocked: The $35,000 contingency reserve is not ring-fenced.');
}

function actionResult(operation, args) {
  const base = { operationId: `OP-${args.actionId.slice(-3)}`, actionId: args.actionId, accepted: true };
  if (operation === 'quality.validate_release') return { ...base, qualityAuthorization: 'approved', qualityThresholdsChanged: false, supplierState: 'conditionally_cleared' };
  if (operation === 'supplier.commit_allocation') return { ...base, replacementMaterial: 'confirmed', projectedCoverageDays: 7.1, lineCRisk: 'medium' };
  if (operation === 'inventory.transfer') return { ...base, transferState: 'dispatched', projectedCoverageDays: 8.7, ordersProtected: 71 };
  if (operation === 'production.resequence') return { ...base, sequenceState: 'published', ordersProtected: 184, lineCState: 'operational' };
  if (operation === 'carrier.reserve_capacity') return { ...base, reservationState: 'confirmed', projectedCoverageDays: 9.8 };
  if (operation === 'customer.create_draft') return { ...base, draftId: 'DRAFT-NORTHSTAR-042', deliveryState: 'not_sent', safeguard: 'External send unavailable' };
  if (operation === 'work.create_items') return { ...base, itemCount: 14, checkpoints: [3, 7, 14, 21], compressorRiskDaily: true, contingencyReserve: 35000, reserveState: 'ring_fenced' };
  return base;
}

function governedResult(payload) {
  return { ...payload, correlationId: CORRELATION_ID, runtimeVersion: RUNTIME_VERSION, synthetic: true };
}

export function executePactOperation(state, operation, args = {}) {
  if (operation === 'runtime.reset') return { state: createRuntimeState(), result: governedResult({ status: 'reset' }) };
  if (operation === 'proof.verify_signal') return { state: { ...state, verified: true }, result: governedResult({ classification: 'verified_material_risk', confidence: 'high', erpCoverageDays: 8.1, usableCoverageDays: 5.4, discrepancyDays: 2.7, evidenceIds: ['EVD-EDI-101', 'EVD-CAR-102', 'EVD-PO-104', 'EVD-BOM-108', 'EVD-WMS-105', 'EVD-ALLOC-107', 'EVD-QLT-106', 'EVD-BATCH-109', 'EVD-IOT-110', 'EVD-CALC-111'] }) };
  if (operation === 'audit.adopt_conditions') {
    if (!state.verified) throw new Error('Signal verification must complete before Auditor conditions can be adopted.');
    if (args.planId !== PLAN_ID || args.conditionSetId !== AUDIT_CONDITION_SET_ID || args.requiredConditionCount !== 5 || args.authorizedBy !== 'plant_coo') throw new Error('Condition adoption does not match the immutable Northstar audit packet.');
    return { state: { ...state, auditConditionsAdopted: true }, result: governedResult({ conditionSetId: AUDIT_CONDITION_SET_ID, status: 'bound_to_plan', decisionReadiness: 'conditional_ready', requiredConditionCount: 5 }) };
  }
  if (operation === 'approval.record') {
    if (!state.verified || !state.auditConditionsAdopted) throw new Error('Human authorization is blocked until proof and audit conditions are complete.');
    if (args.planId !== PLAN_ID || args.decision !== 'approved_with_conditions' || args.approver !== 'Morgan Ellis · Plant COO') throw new Error('Approval record does not match the bounded Northstar Action Contract.');
    return { state: { ...state, humanApproved: true }, result: governedResult({ planId: PLAN_ID, decision: args.decision, approver: args.approver, actionClassesUnlocked: 9 }) };
  }
  if (operation === 'outcome.observe') {
    if (!complete(state, 'ACT-010')) throw new Error('Outcome observation requires the approved Action Graph to complete.');
    const observed = OBSERVATIONS[args.day];
    if (!observed) throw new Error('day must be one of 0, 3, 7, 14, or 21');
    return { state, result: governedResult({ day: args.day, ...observed, label: args.day === 0 ? 'SIMULATED' : 'OBSERVED', qualityIncidents: 0, unauthorizedCustomerCommunications: 0 }) };
  }

  const action = actionByOperation.get(operation);
  if (!action) throw new Error(`Unknown governed operation: ${operation}`);
  assertMaterialRequest(state, action, args);
  assertApprovedParameters(operation, args);
  return { state: { ...state, completedActionIds: [...state.completedActionIds, action.actionId] }, result: governedResult(actionResult(operation, args)) };
}
