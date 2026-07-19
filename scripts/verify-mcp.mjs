import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const serverPath = process.env.PACT_MCP_SERVER_PATH ?? 'plugins/pact/scripts/pact-mcp-server.mjs';
const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });
const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
const pending = new Map();
let id = 0;
const planId = 'PLAN-NORTHSTAR-BALANCED-v1';
const conditionSetId = 'AUDIT-COND-NORTHSTAR-v1';
const common = { approvedPlanId: planId, auditConditionSetId: conditionSetId };

lines.on('line', (line) => {
  const message = JSON.parse(line);
  pending.get(message.id)?.(message);
  pending.delete(message.id);
});

function request(method, params = {}) {
  id += 1;
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`MCP timeout for ${method}`)), 3000);
    pending.set(id, (value) => { clearTimeout(timer); resolve(value); });
  });
}
function assert(condition, message) { if (!condition) throw new Error(message); }
const call = (name, arguments_) => request('tools/call', { name, arguments: arguments_ });

try {
  const initialized = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'pact-verifier', version: '1.0.0' } });
  assert(initialized.result.serverInfo.name === 'pact-business-tools', 'MCP initialization failed');
  assert(initialized.result.serverInfo.version === '1.0.0', 'MCP did not load the Northstar runtime');
  const listed = await request('tools/list');
  assert(listed.result.tools.length === 15, 'Expected fifteen governed Northstar tools');

  const missingHuman = await call('pact_authorize_finance', { ...common, actionId: 'ACT-003', amount: 420000, currency: 'USD' });
  assert(missingHuman.result.isError === true && missingHuman.result.content[0].text.includes('human authorization'), 'Finance must reject missing human approval');
  await call('pact_verify_signal', {});
  const prematureApproval = await call('pact_record_human_approval', { planId, decision: 'approved_with_conditions', approver: 'Morgan Ellis · Plant COO' });
  assert(prematureApproval.result.isError === true, 'Human authorization must wait for audit conditions');
  const wrongAudit = await call('pact_adopt_audit_conditions', { planId, conditionSetId, requiredConditionCount: 4, authorizedBy: 'plant_coo' });
  assert(wrongAudit.result.isError === true, 'Audit adoption must bind all five conditions');
  const adopted = await call('pact_adopt_audit_conditions', { planId, conditionSetId, requiredConditionCount: 5, authorizedBy: 'plant_coo' });
  assert(adopted.result.structuredContent.decisionReadiness === 'conditional_ready', 'Audit conditions did not change readiness');
  await call('pact_record_human_approval', { planId, decision: 'approved_with_conditions', approver: 'Morgan Ellis · Plant COO' });

  const qualityBlocked = await call('pact_commit_supplier', { ...common, actionId: 'ACT-004', supplier: 'Redwood Alloys', amount: 148000, coverageDays: 1.7 });
  assert(qualityBlocked.result.isError === true && qualityBlocked.result.content[0].text === 'Action blocked: Required quality authorization is missing.', 'Required exact quality rejection did not fire');
  const excessiveSpend = await call('pact_authorize_finance', { ...common, actionId: 'ACT-003', amount: 420001, currency: 'USD' });
  assert(excessiveSpend.result.isError === true, 'Spend above the contract limit must be rejected');
  const unapprovedSupplier = await call('pact_validate_supplier', { ...common, actionId: 'ACT-001', supplier: 'Unknown Metals', capacityDays: 3.4 });
  assert(unapprovedSupplier.result.isError === true, 'Unapproved supplier must be rejected');

  await call('pact_validate_supplier', { ...common, actionId: 'ACT-001', supplier: 'Redwood Alloys', capacityDays: 3.4 });
  await call('pact_validate_quality_release', { ...common, actionId: 'ACT-002', supplier: 'Redwood Alloys', batchId: 'BATCH-C17-R01' });
  const financeMissing = await call('pact_commit_supplier', { ...common, actionId: 'ACT-004', supplier: 'Redwood Alloys', amount: 148000, coverageDays: 1.7 });
  assert(financeMissing.result.isError === true && financeMissing.result.content[0].text.includes('finance authorization'), 'Supplier commitment must also require Finance');
  await call('pact_authorize_finance', { ...common, actionId: 'ACT-003', amount: 420000, currency: 'USD' });
  const supplier = await call('pact_commit_supplier', { ...common, actionId: 'ACT-004', supplier: 'Redwood Alloys', amount: 148000, coverageDays: 1.7 });
  assert(supplier.result.structuredContent.projectedCoverageDays === 7.1, 'Supplier commitment did not update the twin');
  await call('pact_transfer_inventory', { ...common, actionId: 'ACT-005', origin: 'Aurelis Brno', coverageDays: 1.6, customsContingency: true });
  const prematureProduction = await call('pact_resequence_production', { ...common, actionId: 'ACT-008', plant: 'Northstar Plant 7', line: 'Line C', priorityTier: 'strategic' });
  assert(prematureProduction.result.isError === true, 'Production must wait for labor confirmation');
  await call('pact_confirm_labor_capacity', { ...common, actionId: 'ACT-006', weekendShifts: 2, overtimeHours: 960 });
  await call('pact_reserve_carrier', { ...common, actionId: 'ACT-007', carrier: 'Aurelis Priority Freight', reservedLoads: 6, cap: 65000 });
  await call('pact_resequence_production', { ...common, actionId: 'ACT-008', plant: 'Northstar Plant 7', line: 'Line C', priorityTier: 'strategic' });
  const sendBlocked = await call('pact_create_customer_draft', { ...common, actionId: 'ACT-009', audience: '42 strategic customers', send: true });
  assert(sendBlocked.result.isError === true, 'Direct external sending must be rejected');
  const draft = await call('pact_create_customer_draft', { ...common, actionId: 'ACT-009', audience: '42 strategic customers', send: false });
  assert(draft.result.structuredContent.deliveryState === 'not_sent', 'Customer communication must remain draft-only');
  await call('pact_create_work_items', { ...common, actionId: 'ACT-010', checkpoints: 'Day 3, 7, 14, 21', compressorRiskDaily: true, contingencyReserve: 35000 });
  const outcome = await call('pact_observe_outcome', { day: 21 });
  assert(outcome.result.structuredContent.protectedRevenuePercent === 96.1, 'Unexpected Day-21 protected revenue');
  assert(outcome.result.structuredContent.spend === 389000, 'Unexpected Day-21 spend');
  assert(outcome.result.structuredContent.qualityIncidents === 0, 'Quality safeguard failed');
  assert(outcome.result.structuredContent.runtimeVersion === '1.0.0', 'Result is not from the Northstar runtime');
  console.log('PACT Northstar MCP verified: proof, five-condition audit, human authority, exact quality rejection, spend/supplier/dependency/send guards, twin transitions, and 96.1% closeout pass');
} finally {
  child.kill();
}
