import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Agent, Runner, generateTraceId, withTrace } from '@openai/agents';
import { independentAuditSchema, planSynthesisSchema } from './lib/pact-agent-schemas.mjs';
import { collectEvidenceIds, reviewGenuineArtifact } from './lib/pact-artifact-review.mjs';
import {
  acknowledgeUnsettledCall,
  estimateCostUsd,
  estimateTokens,
  readLedger,
  reconcileCall,
  reserveCall,
  resolveBudget,
  totalCommittedUsd,
  writeLedger,
} from './lib/pact-cost-guard.mjs';

const dryRun = process.argv.includes('--dry-run');
const resume = process.argv.includes('--resume');
const model = process.env.PACT_OPENAI_MODEL || 'gpt-5.6';
const apiKey = process.env.OPENAI_API_KEY;
const root = new URL('../', import.meta.url);
const artifactDirectoryUrl = new URL('artifacts/gpt-5.6/', root);
const checkpointUrl = new URL('artifacts/gpt-5.6/plan-checkpoint.json', root);
const ledgerUrl = new URL('artifacts/gpt-5.6/cost-ledger.json', root);
const projectBudgetUsd = resolveBudget();
const workflowGroupId = 'pact-otif-recovery-demo';

const [scenario, metricContract, outcomeContract] = await Promise.all([
  readJson('data/otif-recovery.scenario.json'),
  readJson('contracts/metric-contract.json'),
  readJson('contracts/outcome-contract.json'),
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

const outcomeLead = new Agent({
  name: 'PACT Outcome Lead',
  handoffDescription: 'Synthesizes evidence into a coordinated, cross-team outcome recommendation.',
  model,
  modelSettings: {
    reasoning: { effort: 'high' },
    maxTokens: 3500,
    text: { verbosity: 'low' },
    store: true,
    retry: { maxRetries: 0, policy: async () => false },
  },
  instructions: [
    'You are the PACT Outcome Lead.',
    'Synthesize an evidence-cited, cross-team recovery recommendation from the immutable packet.',
    'Preserve facts, estimates, simulations, and assumptions as distinct categories.',
    'Cover Finance, Procurement, Manufacturing, Logistics, Customer, and Outcome Office.',
    'Enforce the Outcome Contract. Do not approve, claim execution, or invoke actions.',
    'Be concise enough for an executive decision packet.',
  ].join(' '),
  outputType: planSynthesisSchema,
  outputGuardrails: [{
    name: 'Cross-team authority boundary',
    execute: async ({ agentOutput }) => {
      const expectedTeams = ['Finance', 'Procurement', 'Manufacturing', 'Logistics', 'Customer', 'Outcome Office'];
      const suppliedTeams = new Set(agentOutput.crossTeamPriorities.map((priority) => priority.team));
      const missingTeams = expectedTeams.filter((team) => !suppliedTeams.has(team));
      const authorityClaim = /\b(plan|action|recovery)\s+(has been|is)\s+(approved|executed)\b/i.test(`${agentOutput.executiveSummary} ${agentOutput.strategyRationale}`);
      return {
        tripwireTriggered: missingTeams.length > 0 || authorityClaim,
        outputInfo: { missingTeams, authorityClaim },
      };
    },
  }],
});

const independentAuditor = new Agent({
  name: 'Independent PACT Outcome Auditor',
  handoffDescription: 'Challenges a proposed plan without editing, approving, or executing it.',
  model,
  modelSettings: {
    reasoning: { effort: 'high' },
    maxTokens: 6500,
    text: { verbosity: 'low' },
    store: true,
    retry: { maxRetries: 0, policy: async () => false },
  },
  instructions: [
    'You are the Independent PACT Outcome Auditor. You did not propose this plan.',
    'Review readiness for a human decision inside the supplied fixed-seed synthetic demonstration.',
    'Treat supplied evidence records and deterministic guards as authoritative within that boundary.',
    'Human approval being pending is expected: preserve it as a required condition, not a blocking defect.',
    'A simulated projection may be challenged as a material assumption without demanding production-grade confidence intervals.',
    'Block only an internal contradiction, hard-constraint violation, or unsafe dependency not handled by the stated guards.',
    'Return at most 3 prioritized findings, unsupported claims, and required conditions.',
    'You may not modify, approve, or execute the plan.',
  ].join(' '),
  outputType: independentAuditSchema,
  outputGuardrails: [{
    name: 'Verdict consistency',
    execute: async ({ agentOutput }) => {
      const hasBlockingFinding = agentOutput.findings.some((finding) => finding.severity === 'blocking');
      const inconsistent = agentOutput.verdict === 'block' ? !hasBlockingFinding : hasBlockingFinding;
      return { tripwireTriggered: inconsistent, outputInfo: { hasBlockingFinding, verdict: agentOutput.verdict } };
    },
  }],
});

const planInput = JSON.stringify({ packetType: 'PACT_EVIDENCE_PACKET_V1', evidencePacket });
const planWorstCase = estimateCostUsd({ inputTokens: estimateTokens(planInput) + 1200, outputTokens: 3500 });
const auditWorstCase = estimateCostUsd({ inputTokens: estimateTokens(JSON.stringify({ evidencePacket, proposedPlan: 'bounded structured plan' })) + 3000, outputTokens: 6500 });

if (dryRun) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    framework: '@openai/agents',
    model,
    orchestration: 'explicit manager-style sequence',
    agents: [
      { name: outcomeLead.name, outputSchema: 'planSynthesisSchema', guardrail: 'Cross-team authority boundary', maxOutputTokens: 3500 },
      { name: independentAuditor.name, outputSchema: 'independentAuditSchema', guardrail: 'Verdict consistency', maxOutputTokens: 6500 },
    ],
    boundaries: ['immutable evidence packet', 'independent audit', 'no model tools', 'human approval remains external'],
    tracing: 'linked SDK stage traces grouped as one governed workflow; response IDs retained',
    resumable: true,
    automaticRetries: false,
    costGuard: { projectBudgetUsd, hardCapUsd: 5, estimatedWorstCaseUsd: Number((planWorstCase + auditWorstCase).toFixed(6)) },
    evidenceBytes: planInput.length,
  }, null, 2));
  process.exit(0);
}

if (!apiKey) {
  console.error('OPENAI_API_KEY is not configured. Run with --dry-run to verify the full Agents SDK configuration without an API call.');
  process.exit(1);
}

await mkdir(artifactDirectoryUrl, { recursive: true });
let ledger = await readLedger(ledgerUrl, projectBudgetUsd);
const runner = new Runner({
  tracingDisabled: false,
  traceIncludeSensitiveData: false,
  workflowName: 'PACT Governed Outcome Review',
  groupId: workflowGroupId,
  traceMetadata: { application: 'PACT', scenario: 'otif-recovery', orchestration: 'manager' },
});

let plan;
let planResponseId;
let planTraceId;
let planUsage;

if (resume) {
  const checkpoint = await readJson('artifacts/gpt-5.6/plan-checkpoint.json');
  if (checkpoint.framework !== '@openai/agents' || checkpoint.model !== model || !checkpoint.responseId || !checkpoint.traceId || !checkpoint.plan || !checkpoint.usage) {
    throw new Error(`Agents SDK plan checkpoint does not match model ${model}.`);
  }
  plan = checkpoint.plan;
  planResponseId = checkpoint.responseId;
  planTraceId = checkpoint.traceId;
  planUsage = checkpoint.usage;
  const acknowledgedAudit = acknowledgeUnsettledCall(ledger, independentAuditor.name);
  if (acknowledgedAudit) {
    await writeLedger(ledgerUrl, ledger);
    console.log(`Counted interrupted Auditor reservation ${acknowledgedAudit.id} as charged-uncertain before explicit resume.`);
  }
  console.log(`Resuming from saved Outcome Lead SDK response ${planResponseId}.`);
} else {
  planTraceId = generateTraceId();
  const planReservationId = `${planTraceId}:outcome-lead`;
  ledger = reserveCall(ledger, { id: planReservationId, agent: outcomeLead.name, costUsd: planWorstCase });
  await writeLedger(ledgerUrl, ledger);

  const planResult = await withTrace('PACT Governed Outcome Review',
    async () => runner.run(outcomeLead, planInput, { maxTurns: 1 }),
    { traceId: planTraceId, groupId: workflowGroupId, metadata: { stage: 'plan', model } },
  );
  if (!planResult.finalOutput || !planResult.lastResponseId) throw new Error('Outcome Lead SDK run returned no typed output or response ID. The cost reservation remains for manual review.');

  plan = planSynthesisSchema.parse(planResult.finalOutput);
  planResponseId = planResult.lastResponseId;
  planUsage = summarizeUsage(planResult.runContext.usage);
  ledger = reconcileCall(ledger, planReservationId, planUsage);
  await writeLedger(ledgerUrl, ledger);
  await writeFile(checkpointUrl, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    framework: '@openai/agents',
    model,
    traceId: planTraceId,
    responseId: planResponseId,
    usage: planUsage,
    plan,
  }, null, 2)}\n`, 'utf8');
  console.log(`Saved Outcome Lead SDK checkpoint ${planResponseId} before independent audit.`);
}

const auditInput = JSON.stringify({
  packetType: 'PACT_INDEPENDENT_AUDIT_PACKET_V1',
  separationOfDuties: 'The auditor receives a frozen copy and cannot mutate the Outcome Lead plan.',
  evidencePacket,
  proposedPlan: plan,
});
const auditTraceId = generateTraceId();
const auditReservationId = `${auditTraceId}:independent-auditor`;
const boundedAuditWorstCase = estimateCostUsd({ inputTokens: estimateTokens(auditInput) + 1200, outputTokens: 6500 });
ledger = reserveCall(ledger, { id: auditReservationId, agent: independentAuditor.name, costUsd: boundedAuditWorstCase });
await writeLedger(ledgerUrl, ledger);

const auditResult = await withTrace('PACT Independent Outcome Audit',
  async () => runner.run(independentAuditor, auditInput, { maxTurns: 1 }),
  { traceId: auditTraceId, groupId: workflowGroupId, metadata: { stage: 'audit', model, planResponseId } },
);
if (!auditResult.finalOutput || !auditResult.lastResponseId) throw new Error('Independent Auditor SDK run returned no typed output or response ID. Resume the plan only after inspecting the cost ledger.');

const audit = independentAuditSchema.parse(auditResult.finalOutput);
const auditResponseId = auditResult.lastResponseId;
const auditUsage = summarizeUsage(auditResult.runContext.usage);
ledger = reconcileCall(ledger, auditReservationId, auditUsage);
await writeLedger(ledgerUrl, ledger);

const artifactCostUsd = estimateCostUsd({
  inputTokens: planUsage.inputTokens + auditUsage.inputTokens,
  outputTokens: planUsage.outputTokens + auditUsage.outputTokens,
});
const artifact = {
  generatedAt: new Date().toISOString(),
  model,
  provider: 'OpenAI Agents SDK',
  provenance: {
    kind: 'genuine',
    framework: '@openai/agents',
    orchestration: 'manager',
    planAgent: outcomeLead.name,
    auditAgent: independentAuditor.name,
    planResponseId,
    auditResponseId,
    planTraceId,
    auditTraceId,
  },
  usage: {
    requests: planUsage.requests + auditUsage.requests,
    inputTokens: planUsage.inputTokens + auditUsage.inputTokens,
    outputTokens: planUsage.outputTokens + auditUsage.outputTokens,
    estimatedCostUsd: artifactCostUsd,
    projectCommittedUsd: totalCommittedUsd(ledger),
    projectBudgetUsd,
  },
  plan,
  audit,
};

const serializedArtifact = `${JSON.stringify(artifact, null, 2)}\n`;
const candidateArtifactUrl = new URL('artifacts/gpt-5.6/candidate-artifact.json', root);
await writeFile(candidateArtifactUrl, serializedArtifact, 'utf8');
console.log(`Saved complete two-agent candidate ${auditResponseId} before release acceptance review.`);

const artifactReview = reviewGenuineArtifact(artifact, collectEvidenceIds(evidencePacket));
if (!artifactReview.ready) {
  throw new Error(`Genuine artifact failed the release acceptance gate. The paid candidate is preserved at artifacts/gpt-5.6/candidate-artifact.json: ${JSON.stringify(artifactReview)}`);
}

await mkdir(new URL('public/artifacts/gpt-5.6/', root), { recursive: true });
await Promise.all([
  writeFile(new URL('artifacts/gpt-5.6/strategy-and-audit.json', root), serializedArtifact, 'utf8'),
  writeFile(new URL('public/artifacts/gpt-5.6/strategy-and-audit.json', root), serializedArtifact, 'utf8'),
]);
console.log(`Generated release-ready ${model} PACT artifact with OpenAI Agents SDK. Estimated artifact cost: $${artifactCostUsd.toFixed(4)}; project ledger: $${totalCommittedUsd(ledger).toFixed(4)} / $${projectBudgetUsd.toFixed(2)}.`);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

function summarizeUsage(usage) {
  return {
    requests: usage.requests,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  };
}
