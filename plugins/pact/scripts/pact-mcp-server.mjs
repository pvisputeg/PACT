import { createInterface } from 'node:readline';

const PLAN_ID = 'PLAN-BALANCED-v1';
const state = {
  verified: false,
  financeAuthorized: false,
  supplierCommitted: false,
  productionResequenced: false,
  carrierReserved: false,
  customerDrafted: false,
  workItemsCreated: false,
};

const tools = [
  {
    name: 'pact_verify_signal',
    description: 'Reproduce the synthetic OTIF signal and return the Proofline classification with evidence IDs.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'pact_authorize_finance',
    description: 'Record the already-human-approved synthetic recovery envelope. Requires the approved plan ID.',
    inputSchema: materialSchema({ amount: { type: 'number', maximum: 75000 }, currency: { type: 'string', const: 'USD' } }, ['amount', 'currency']),
  },
  {
    name: 'pact_commit_supplier',
    description: 'Commit synthetic allocation with the approved alternate supplier after finance authorization.',
    inputSchema: materialSchema({ supplier: { type: 'string', const: 'Northstar Components' }, coveragePercent: { type: 'number', maximum: 38 } }, ['supplier', 'coveragePercent']),
  },
  {
    name: 'pact_resequence_production',
    description: 'Resequence the synthetic Wilmington schedule after alternate allocation is confirmed.',
    inputSchema: materialSchema({ plant: { type: 'string', const: 'Wilmington' }, priorityTier: { type: 'string', const: 'strategic' } }, ['plant', 'priorityTier']),
  },
  {
    name: 'pact_reserve_carrier',
    description: 'Reserve bounded synthetic Carrier Delta capacity after finance authorization.',
    inputSchema: materialSchema({ carrier: { type: 'string', const: 'Carrier Delta' }, reservedLoads: { type: 'integer', maximum: 24 } }, ['carrier', 'reservedLoads']),
  },
  {
    name: 'pact_create_customer_draft',
    description: 'Create a synthetic strategic-customer communication draft. This tool cannot send externally.',
    inputSchema: materialSchema({ audience: { type: 'string' } }, ['audience']),
  },
  {
    name: 'pact_create_work_items',
    description: 'Create synthetic cross-team recovery work items after material commitments are recorded.',
    inputSchema: materialSchema({ checkpoints: { type: 'string' } }, ['checkpoints']),
  },
  {
    name: 'pact_observe_outcome',
    description: 'Read an observed synthetic checkpoint after all recovery actions complete.',
    inputSchema: { type: 'object', required: ['day'], properties: { day: { type: 'integer', enum: [0, 3, 7, 14, 21] } }, additionalProperties: false },
  },
  {
    name: 'pact_reset_demo',
    description: 'Reset only this in-memory synthetic MCP demonstration state.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

const observations = {
  0: { otif: 72.4, componentCoverage: 61, scheduleAdherence: 73, pickupAcceptance: 76 },
  3: { otif: 74.8, componentCoverage: 70, scheduleAdherence: 78, pickupAcceptance: 82 },
  7: { otif: 78.9, componentCoverage: 82, scheduleAdherence: 88, pickupAcceptance: 90 },
  14: { otif: 81.5, componentCoverage: 91, scheduleAdherence: 92, pickupAcceptance: 91 },
  21: { otif: 82.1, componentCoverage: 94, scheduleAdherence: 94, pickupAcceptance: 91 },
};

function materialSchema(properties, required) {
  return {
    type: 'object',
    required: ['approvedPlanId', 'actionId', ...required],
    properties: {
      approvedPlanId: { type: 'string', const: PLAN_ID },
      actionId: { type: 'string', pattern: '^ACT-[0-9]{3}$' },
      ...properties,
    },
    additionalProperties: false,
  };
}

function requireApproval(args) {
  if (args?.approvedPlanId !== PLAN_ID) throw new Error(`Material tool requires approvedPlanId=${PLAN_ID}`);
}

function requireState(key, message) {
  if (!state[key]) throw new Error(message);
}

function result(payload) {
  const structured = { ...payload, correlationId: 'PACT-OTIF-2026-07', synthetic: true };
  return { content: [{ type: 'text', text: JSON.stringify(structured) }], structuredContent: structured };
}

function callTool(name, args = {}) {
  if (name === 'pact_reset_demo') {
    for (const key of Object.keys(state)) state[key] = false;
    return result({ status: 'reset' });
  }
  if (name === 'pact_verify_signal') {
    state.verified = true;
    return result({ classification: 'verified_operational', baseline: 84.3, current: 72.4, evidenceIds: ['EVD-PV-001', 'EVD-PV-002', 'EVD-PV-003', 'EVD-PV-004'] });
  }
  if (name === 'pact_observe_outcome') {
    requireState('workItemsCreated', 'Outcome observation requires the approved Action Graph to complete');
    const observed = observations[args.day];
    if (!observed) throw new Error('day must be one of 0, 3, 7, 14, or 21');
    return result({ day: args.day, ...observed, label: 'OBSERVED', qualityEscapeDelta: args.day >= 7 ? -0.1 : 0 });
  }

  requireApproval(args);
  requireState('verified', 'Proofline verification must complete before material action');

  switch (name) {
    case 'pact_authorize_finance':
      if (args.amount > 75000) throw new Error('Recovery amount exceeds the $75,000 hard constraint');
      state.financeAuthorized = true;
      return result({ operationId: 'OP-001', actionId: args.actionId, accepted: true, amount: args.amount });
    case 'pact_commit_supplier':
      requireState('financeAuthorized', 'Supplier commitment requires finance authorization');
      if (args.supplier !== 'Northstar Components') throw new Error('Supplier is not approved for this Outcome Contract');
      state.supplierCommitted = true;
      return result({ operationId: 'OP-002', actionId: args.actionId, accepted: true, supplier: args.supplier });
    case 'pact_resequence_production':
      requireState('supplierCommitted', 'Production resequencing requires confirmed component allocation');
      state.productionResequenced = true;
      return result({ operationId: 'OP-003', actionId: args.actionId, accepted: true, plant: args.plant });
    case 'pact_reserve_carrier':
      requireState('financeAuthorized', 'Carrier reservation requires finance authorization');
      state.carrierReserved = true;
      return result({ operationId: 'OP-004', actionId: args.actionId, accepted: true, reservedLoads: args.reservedLoads });
    case 'pact_create_customer_draft':
      requireState('productionResequenced', 'Customer draft requires recalculated production dates');
      requireState('carrierReserved', 'Customer draft requires confirmed carrier capacity');
      state.customerDrafted = true;
      return result({ draftId: 'DRAFT-042', actionId: args.actionId, deliveryState: 'not_sent', safeguard: 'external send unavailable' });
    case 'pact_create_work_items':
      requireState('supplierCommitted', 'Work items require supplier commitment');
      requireState('productionResequenced', 'Work items require production commitment');
      requireState('carrierReserved', 'Work items require logistics commitment');
      state.workItemsCreated = true;
      return result({ operationId: 'OP-006', actionId: args.actionId, accepted: true, itemCount: 11 });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function respond(id, body) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...body })}\n`);
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', (line) => {
  if (!line.trim()) return;
  let message;
  try { message = JSON.parse(line); } catch { return; }
  if (message.id === undefined) return;
  try {
    if (message.method === 'initialize') {
      respond(message.id, { result: { protocolVersion: message.params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'pact-business-tools', version: '0.1.0' } } });
    } else if (message.method === 'ping') {
      respond(message.id, { result: {} });
    } else if (message.method === 'tools/list') {
      respond(message.id, { result: { tools } });
    } else if (message.method === 'tools/call') {
      respond(message.id, { result: callTool(message.params?.name, message.params?.arguments ?? {}) });
    } else {
      respond(message.id, { error: { code: -32601, message: `Method not found: ${message.method}` } });
    }
  } catch (error) {
    respond(message.id, { result: { content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }], isError: true } });
  }
});
