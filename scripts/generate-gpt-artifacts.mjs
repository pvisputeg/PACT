import { mkdir, readFile, writeFile } from 'node:fs/promises';

const dryRun = process.argv.includes('--dry-run');
const resume = process.argv.includes('--resume');
const model = process.env.PACT_OPENAI_MODEL || 'gpt-5.6';
const apiKey = process.env.OPENAI_API_KEY;
const root = new URL('../', import.meta.url);
const checkpointUrl = new URL('artifacts/gpt-5.6/plan-checkpoint.json', root);

const [scenario, metricContract, outcomeContract, planSchema, auditSchema] = await Promise.all([
  readJson('data/otif-recovery.scenario.json'),
  readJson('contracts/metric-contract.json'),
  readJson('contracts/outcome-contract.json'),
  readJson('contracts/schemas/plan-synthesis.schema.json'),
  readJson('contracts/schemas/independent-audit.schema.json'),
]);

const evidencePacket = {
  reviewScope: 'Fixed-seed synthetic demonstration. Treat the supplied contracts, evidence identifiers, deterministic calculations, and policy guards as authoritative within this demo; assess readiness for a human decision, not completed production execution.',
  metricContract,
  outcomeContract,
  periods: scenario.periods,
  integrityChecks: scenario.integrityChecks,
  contributors: scenario.contributors,
  impact: scenario.impact,
  strategies: scenario.strategies,
  proposedActionGraph: {
    planId: 'PLAN-BALANCED-v1',
    selectedStrategyId: 'STR-BALANCED',
    proposedCost: 68750,
    budgetHeadroom: 6250,
    humanApprovalStatus: 'pending',
    actions: [
      { actionId: 'ACT-001', team: 'Finance', owner: 'Maya Chen', cost: 0, dependencies: [], operation: 'authorize bounded recovery spend' },
      { actionId: 'ACT-002', team: 'Procurement', owner: 'Elena Ruiz', cost: 28600, dependencies: ['ACT-001'], operation: 'commit approved alternate component allocation' },
      { actionId: 'ACT-003', team: 'Manufacturing', owner: 'Dev Malik', cost: 14200, dependencies: ['ACT-002'], operation: 'resequence Wilmington production' },
      { actionId: 'ACT-004', team: 'Logistics', owner: 'Jon Bell', cost: 25950, dependencies: ['ACT-001'], operation: 'reserve bounded Carrier Delta capacity' },
      { actionId: 'ACT-005', team: 'Customer', owner: 'Aisha Grant', cost: 0, dependencies: ['ACT-003', 'ACT-004'], operation: 'create draft-only customer communication' },
      { actionId: 'ACT-006', team: 'Outcome Office', owner: 'PACT Outcome Lead', cost: 0, dependencies: ['ACT-002', 'ACT-003', 'ACT-004'], operation: 'create coordinated recovery work items' },
    ],
    deterministicGuards: ['human approval required', 'spend <= 75000', 'approved supplier only', 'dependencies enforced', 'customer communication draft-only', 'quality delta monitored at checkpoints'],
  },
  note: 'Contributor shares are observed associations, not exclusive causal proof. Projections are SIMULATED.',
};

const planRequest = {
  model,
  reasoning: { effort: 'high' },
  max_output_tokens: 3500,
  input: [
    {
      role: 'system',
      content: 'You are the PACT Outcome Lead. Synthesize an evidence-cited, cross-team recovery recommendation. Preserve facts, estimates, simulations, and assumptions as distinct categories. Enforce the Outcome Contract. Do not approve or execute the plan.',
    },
    { role: 'user', content: JSON.stringify(evidencePacket) },
  ],
  text: { format: { type: 'json_schema', name: 'pact_plan_synthesis', strict: true, schema: planSchema } },
};

if (dryRun) {
  console.log(JSON.stringify({ mode: 'dry-run', endpoint: 'POST /v1/responses', model, reasoningEffort: 'high', resumable: true, schema: planRequest.text.format.name, evidenceBytes: JSON.stringify(evidencePacket).length }, null, 2));
  process.exit(0);
}

if (!apiKey) {
  console.error('OPENAI_API_KEY is not configured. Run with --dry-run or copy .env.example to .env and export the key in your shell.');
  process.exit(1);
}

let planResponseId;
let plan;
if (resume) {
  const checkpoint = await readJson('artifacts/gpt-5.6/plan-checkpoint.json');
  if (checkpoint.model !== model || !checkpoint.responseId || !checkpoint.plan) throw new Error(`Plan checkpoint does not match model ${model}`);
  planResponseId = checkpoint.responseId;
  plan = checkpoint.plan;
  console.log(`Resuming from saved Outcome Lead response ${planResponseId}.`);
} else {
  const planResponse = await createResponse(planRequest);
  plan = extractStructuredOutput(planResponse, 'Outcome Lead');
  planResponseId = planResponse.id;
  await mkdir(new URL('artifacts/gpt-5.6/', root), { recursive: true });
  await writeFile(checkpointUrl, `${JSON.stringify({ generatedAt: new Date().toISOString(), model, responseId: planResponseId, plan }, null, 2)}\n`, 'utf8');
  console.log(`Saved Outcome Lead checkpoint ${planResponseId} before independent audit.`);
}

const auditRequest = {
  model,
  reasoning: { effort: 'high' },
  max_output_tokens: 4500,
  input: [
    {
      role: 'system',
      content: 'You are the Independent PACT Outcome Auditor. You did not propose this plan. Review readiness for a human decision inside the supplied fixed-seed synthetic demonstration. Treat supplied evidence records and deterministic guards as authoritative within that boundary. Human approval being pending is expected: preserve it as a required condition, not a blocking defect. A simulated projection may be challenged as a material assumption without demanding production-grade confidence intervals. Block only an internal contradiction, hard-constraint violation, or unsafe dependency that cannot be handled by the stated guards. Return at most 3 prioritized findings, 3 unsupported claims, and 3 required conditions. Keep every title under 10 words and every detail, claim, condition, and counterfactual field under 35 words. You may not modify, approve on behalf of a human, or execute the plan.',
    },
    { role: 'user', content: JSON.stringify({ evidencePacket, proposedPlan: plan }) },
  ],
  text: { format: { type: 'json_schema', name: 'pact_independent_audit', strict: true, schema: auditSchema } },
};

const auditResponse = await createResponse(auditRequest);
const audit = extractStructuredOutput(auditResponse, 'Independent Auditor');
const artifact = {
  generatedAt: new Date().toISOString(),
  model,
  provider: 'OpenAI Responses API',
  provenance: { kind: 'genuine', planResponseId, auditResponseId: auditResponse.id },
  plan,
  audit,
};

const serializedArtifact = `${JSON.stringify(artifact, null, 2)}\n`;
await Promise.all([
  mkdir(new URL('artifacts/gpt-5.6/', root), { recursive: true }),
  mkdir(new URL('public/artifacts/gpt-5.6/', root), { recursive: true }),
]);
await Promise.all([
  writeFile(new URL('artifacts/gpt-5.6/strategy-and-audit.json', root), serializedArtifact, 'utf8'),
  writeFile(new URL('public/artifacts/gpt-5.6/strategy-and-audit.json', root), serializedArtifact, 'utf8'),
]);
console.log(`Generated genuine ${model} PACT artifact and staged its reviewed UI copy.`);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

async function createResponse(body) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`OpenAI Responses API returned ${response.status}: ${await response.text()}`);
  return response.json();
}

function extractStructuredOutput(response, roleName) {
  if (response.status === 'incomplete') {
    const reason = response.incomplete_details?.reason ?? 'unknown reason';
    const recovery = roleName === 'Independent Auditor'
      ? 'The valid Outcome Lead checkpoint can be reused with npm run generate:agents:resume.'
      : 'No checkpoint was created; adjust the Outcome Lead response boundary before retrying.';
    throw new Error(`${roleName} response ${response.id ?? '(no id)'} was incomplete: ${reason}. ${recovery}`);
  }
  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue;
    for (const content of item.content ?? []) {
      if (content.type === 'output_text') {
        try { return JSON.parse(content.text); }
        catch (error) {
          const recovery = roleName === 'Independent Auditor' ? ' Reuse the saved plan with npm run generate:agents:resume.' : '';
          throw new Error(`${roleName} response ${response.id ?? '(no id)'} returned invalid structured JSON: ${error instanceof Error ? error.message : String(error)}.${recovery}`);
        }
      }
      if (content.type === 'refusal') throw new Error(`Model refusal: ${content.refusal}`);
    }
  }
  throw new Error('Responses API returned no structured output_text');
}
