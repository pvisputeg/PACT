import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const child = spawn(process.execPath, ['plugins/pact/scripts/pact-mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'inherit'] });
const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
const pending = new Map();
let id = 0;

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const initialized = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'pact-verifier', version: '0.1.0' } });
  assert(initialized.result.serverInfo.name === 'pact-business-tools', 'MCP initialization failed');
  const listed = await request('tools/list');
  assert(listed.result.tools.length === 9, 'Expected nine PACT tools');

  const blocked = await request('tools/call', { name: 'pact_authorize_finance', arguments: { actionId: 'ACT-001', amount: 68750, currency: 'USD' } });
  assert(blocked.result.isError === true, 'Finance tool must reject missing approval');

  await request('tools/call', { name: 'pact_verify_signal', arguments: {} });
  await request('tools/call', { name: 'pact_authorize_finance', arguments: { approvedPlanId: 'PLAN-BALANCED-v1', actionId: 'ACT-001', amount: 68750, currency: 'USD' } });
  const supplier = await request('tools/call', { name: 'pact_commit_supplier', arguments: { approvedPlanId: 'PLAN-BALANCED-v1', actionId: 'ACT-002', supplier: 'Northstar Components', coveragePercent: 38 } });
  assert(supplier.result.structuredContent.accepted === true, 'Approved supplier commitment failed');
  await request('tools/call', { name: 'pact_resequence_production', arguments: { approvedPlanId: 'PLAN-BALANCED-v1', actionId: 'ACT-003', plant: 'Wilmington', priorityTier: 'strategic' } });
  await request('tools/call', { name: 'pact_reserve_carrier', arguments: { approvedPlanId: 'PLAN-BALANCED-v1', actionId: 'ACT-004', carrier: 'Carrier Delta', reservedLoads: 24 } });
  const draft = await request('tools/call', { name: 'pact_create_customer_draft', arguments: { approvedPlanId: 'PLAN-BALANCED-v1', actionId: 'ACT-005', audience: '42 strategic customers' } });
  assert(draft.result.structuredContent.deliveryState === 'not_sent', 'Customer tool must remain draft-only');
  await request('tools/call', { name: 'pact_create_work_items', arguments: { approvedPlanId: 'PLAN-BALANCED-v1', actionId: 'ACT-006', checkpoints: 'Day 3, 7, 14, 21' } });
  const outcome = await request('tools/call', { name: 'pact_observe_outcome', arguments: { day: 21 } });
  assert(outcome.result.structuredContent.otif === 82.1, 'Unexpected Day-21 outcome');
  console.log('PACT MCP verified: approval gate, dependencies, draft safeguard, and Day-21 outcome pass');
} finally {
  child.kill();
}
