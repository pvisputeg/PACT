import { mkdir, readFile, writeFile } from 'node:fs/promises';

const dryRun = process.argv.includes('--dry-run');
const model = process.env.PACT_OPENAI_MODEL || 'gpt-5.6';
const apiKey = process.env.OPENAI_API_KEY;
const root = new URL('../', import.meta.url);

const [scenario, outcomeContract, planSchema, auditSchema] = await Promise.all([
  readJson('data/otif-recovery.scenario.json'),
  readJson('contracts/outcome-contract.json'),
  readJson('contracts/schemas/plan-synthesis.schema.json'),
  readJson('contracts/schemas/independent-audit.schema.json'),
]);

const evidencePacket = {
  outcomeContract,
  contributors: scenario.contributors,
  impact: scenario.impact,
  strategies: scenario.strategies,
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
  console.log(JSON.stringify({ mode: 'dry-run', endpoint: 'POST /v1/responses', model, reasoningEffort: 'high', schema: planRequest.text.format.name, evidenceBytes: JSON.stringify(evidencePacket).length }, null, 2));
  process.exit(0);
}

if (!apiKey) {
  console.error('OPENAI_API_KEY is not configured. Run with --dry-run or copy .env.example to .env and export the key in your shell.');
  process.exit(1);
}

const planResponse = await createResponse(planRequest);
const plan = extractStructuredOutput(planResponse);

const auditRequest = {
  model,
  reasoning: { effort: 'high' },
  max_output_tokens: 3000,
  input: [
    {
      role: 'system',
      content: 'You are the Independent PACT Outcome Auditor. You did not propose this plan. Challenge unsupported claims, hard-constraint compliance, dependency completeness, optimistic projections, and evidence quality. You may block or approve with conditions, but you may not modify, approve on behalf of a human, or execute the plan.',
    },
    { role: 'user', content: JSON.stringify({ evidencePacket, proposedPlan: plan }) },
  ],
  text: { format: { type: 'json_schema', name: 'pact_independent_audit', strict: true, schema: auditSchema } },
};

const auditResponse = await createResponse(auditRequest);
const audit = extractStructuredOutput(auditResponse);
const artifact = {
  generatedAt: new Date().toISOString(),
  model,
  provider: 'OpenAI Responses API',
  provenance: { kind: 'genuine', planResponseId: planResponse.id, auditResponseId: auditResponse.id },
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

function extractStructuredOutput(response) {
  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue;
    for (const content of item.content ?? []) {
      if (content.type === 'output_text') return JSON.parse(content.text);
      if (content.type === 'refusal') throw new Error(`Model refusal: ${content.refusal}`);
    }
  }
  throw new Error('Responses API returned no structured output_text');
}
