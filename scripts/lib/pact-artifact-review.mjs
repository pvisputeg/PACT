import { independentAuditSchema, planSynthesisSchema } from './pact-agent-schemas.mjs';

const REQUIRED_TEAMS = ['Finance', 'Procurement', 'Manufacturing', 'Logistics', 'Customer', 'Outcome Office'];

export function collectEvidenceIds(value, ids = new Set()) {
  if (typeof value === 'string' && /^EVD-[A-Z]+-\d+$/.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectEvidenceIds(item, ids));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectEvidenceIds(item, ids));
  return ids;
}

export function extractCitedEvidenceIds(values) {
  const ids = new Set();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    for (const match of value.matchAll(/EVD-[A-Z]+-\d+/g)) ids.add(match[0]);
  }
  return ids;
}

export function reviewGenuineArtifact(artifact, knownEvidenceIds) {
  const plan = planSynthesisSchema.parse(artifact.plan);
  const audit = independentAuditSchema.parse(artifact.audit);
  const citationFields = [
    ...plan.evidenceCitations,
    ...audit.findings.flatMap((finding) => finding.evidenceIds),
  ];
  const citedEvidence = [...extractCitedEvidenceIds(citationFields)];
  const unknownEvidenceIds = [...new Set(citedEvidence.filter((id) => !knownEvidenceIds.has(id)))];
  const suppliedTeams = new Set(plan.crossTeamPriorities.map((priority) => priority.team));
  const missingTeams = REQUIRED_TEAMS.filter((team) => !suppliedTeams.has(team));
  const blockingFindings = audit.findings.filter((finding) => finding.severity === 'blocking');

  const checks = {
    genuineAgentsSdk: artifact.provider === 'OpenAI Agents SDK'
      && artifact.model === 'gpt-5.6'
      && artifact.provenance?.kind === 'genuine'
      && artifact.provenance?.framework === '@openai/agents'
      && artifact.provenance?.orchestration === 'manager',
    separatedRoles: artifact.provenance?.planAgent === 'PACT Outcome Lead'
      && artifact.provenance?.auditAgent === 'Independent PACT Outcome Auditor',
    responseProvenance: /^resp_/.test(artifact.provenance?.planResponseId ?? '')
      && /^resp_/.test(artifact.provenance?.auditResponseId ?? ''),
    traceProvenance: /^trace_/.test(artifact.provenance?.planTraceId ?? '')
      && /^trace_/.test(artifact.provenance?.auditTraceId ?? ''),
    balancedStrategy: plan.recommendedStrategyId === 'STR-BALANCED',
    crossTeamCoverage: missingTeams.length === 0,
    evidenceIntegrity: plan.evidenceCitations.length > 0
      && citedEvidence.length > 0
      && unknownEvidenceIds.length === 0,
    decisionReadyAudit: audit.verdict === 'approve_with_conditions'
      && blockingFindings.length === 0
      && audit.requiredConditions.length > 0,
    usageProvenance: Number.isInteger(artifact.usage?.requests)
      && artifact.usage.requests >= 2
      && Number.isInteger(artifact.usage?.inputTokens)
      && Number.isInteger(artifact.usage?.outputTokens),
    projectBudget: artifact.usage?.projectBudgetUsd > 0
      && artifact.usage.projectBudgetUsd <= 5
      && artifact.usage.estimatedCostUsd >= 0
      && artifact.usage.estimatedCostUsd <= artifact.usage.projectBudgetUsd
      && artifact.usage.projectCommittedUsd >= artifact.usage.estimatedCostUsd
      && artifact.usage.projectCommittedUsd <= artifact.usage.projectBudgetUsd,
  };

  return {
    ready: Object.values(checks).every(Boolean),
    checks,
    details: { missingTeams, unknownEvidenceIds, blockingFindingTitles: blockingFindings.map((finding) => finding.title) },
  };
}
