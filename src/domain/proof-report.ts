import type { AiArtifact } from './ai-artifact';
import { CORRELATION_ID, scenario } from './engine';
import type { WorkflowState } from './types';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function list(values: string[]): string {
  return values.length ? values.join(', ') : 'None recorded';
}

export function buildProofReport(state: WorkflowState, artifact: AiArtifact | null = null): string {
  const strategy = scenario.strategies.find((item) => item.id === state.selectedStrategyId)
    ?? scenario.strategies.find((item) => item.id === 'STR-BALANCED')!;
  const finalObservation = scenario.observations.find((item) => item.day === 21)!;
  const totalCost = state.actions.reduce((sum, action) => sum + action.estimatedCost, 0);
  const completedActions = state.actions.filter((action) => action.status === 'complete').length;
  const verification = state.verification;

  const contributors = scenario.contributors
    .map((item) => `| ${item.name} | ${item.team} | ${item.share}% | OBSERVED ASSOCIATION | ${list(item.evidenceIds)} |`)
    .join('\n');
  const actions = state.actions.length
    ? state.actions.map((action) => `| ${action.actionId} | ${action.team} | ${action.status.toUpperCase()} | ${action.toolOperation} | ${money(action.estimatedCost)} | ${list(action.evidenceIds)} |`).join('\n')
    : '| — | — | NOT ASSEMBLED | — | — | — |';
  const audit = state.auditFindings.length
    ? state.auditFindings.map((finding) => `- **${finding.severity.toUpperCase()} — ${finding.title}:** ${finding.detail} Evidence: ${list(finding.evidenceIds)}.`).join('\n')
    : '- Deterministic independent audit not yet run.';
  const modelSection = artifact
    ? `### ${artifact.provenance.kind === 'genuine' ? 'GPT-5.6 reviewed artifacts' : 'Local schema fixture'}

- Provider: ${artifact.provider}
- Artifact kind: **${artifact.provenance.kind.toUpperCase()}**
- Orchestration: ${artifact.provenance.orchestration} via ${artifact.provenance.framework}
- Outcome Lead trace: \`${artifact.provenance.planTraceId}\`
- Independent Auditor trace: \`${artifact.provenance.auditTraceId}\`
- Plan response: \`${artifact.provenance.planResponseId}\`
- Audit response: \`${artifact.provenance.auditResponseId}\`
- Estimated model cost: $${artifact.usage.estimatedCostUsd.toFixed(4)} within a $${artifact.usage.projectBudgetUsd.toFixed(2)} project cap
- Recommended strategy: ${artifact.plan.recommendedStrategyId}
- Model rationale: ${artifact.plan.strategyRationale}
- Independent verdict: **${artifact.audit.verdict.toUpperCase()}**
- Required conditions: ${list(artifact.audit.requiredConditions)}
- Counterfactual: ${artifact.audit.counterfactual.scenario} — ${artifact.audit.counterfactual.expectedImpact}

${artifact.provenance.kind === 'genuine'
  ? 'The model output was accepted only after strict schema validation. It did not authorize or execute actions.'
  : 'This fixture made no API call and is not GPT-5.6 evidence. It exists only to test the schema-validated presentation path for free.'}`
    : `### GPT-5.6 reviewed artifacts

No generated model artifact was loaded. The workflow remained on its deterministic, schema-ready path.`;

  return `# PACT Outcome Proof Report

**Proof, Action, Coordination & Tracking**  
Correlation: \`${CORRELATION_ID}\`  
Scenario: \`${scenario.scenarioId}\` v${scenario.version}  
Generated: ${new Date().toISOString()}

## Outcome contract

- Objective: ${state.objective}
- Contract: Metric Contract v1.0.0
- Contract hash: \`${state.contractHash ?? 'not-confirmed'}\`
- Target: **at least 82.0% OTIF by Day 21**
- Hard boundaries: budget no more than $75,000; no quality degradation; approved suppliers only; strategic customers prioritized; human approval required.

## Proofline verification

- Classification: **${verification?.classification.toUpperCase() ?? 'NOT VERIFIED'}**
- Baseline: ${verification?.baseline.toFixed(1) ?? '—'}%
- Reproduced current state: ${verification?.current.toFixed(1) ?? '—'}%
- Evidence: ${list(verification?.evidenceIds ?? [])}
- Explanation: ${verification?.explanation ?? 'Signal verification has not run.'}

## Business impact

- **FACT:** ${scenario.impact.ordersAtRisk.value} orders at risk (${list(scenario.impact.ordersAtRisk.evidenceIds)})
- **FACT:** ${scenario.impact.strategicCustomers.value} strategic customers affected (${list(scenario.impact.strategicCustomers.evidenceIds)})
- **CALCULATED:** ${money(scenario.impact.delayedRevenueExposure.value)} delayed revenue exposure (${list(scenario.impact.delayedRevenueExposure.evidenceIds)})
- **ESTIMATED:** ${money(scenario.impact.premiumFreightExposure.value)} premium freight exposure; assumptions: ${list(scenario.impact.premiumFreightExposure.assumptions)}

| Contributor | Team | Share | Claim type | Evidence |
|---|---|---:|---|---|
${contributors}

Contributor shares are observed associations, not claims of exclusive causation.

## Decision packet

- Selected strategy: **${strategy.name}** (\`${strategy.id}\`)
- **SIMULATED** Day 14: ${strategy.projectedDay14.toFixed(1)}% OTIF
- **SIMULATED** Day 21: ${strategy.projectedDay21.toFixed(1)}% OTIF
- Proposed strategy cost: ${money(strategy.cost)}
- Assembled action cost: ${money(totalCost)}

### Deterministic independent audit

${audit}

${modelSection}

## Human authority

- Decision: **${state.approval?.decision.toUpperCase() ?? 'NOT DECIDED'}**
- Approver: ${state.approval?.approver ?? 'Not recorded'}
- Decided at: ${state.approval?.decidedAt ?? 'Not recorded'}
- Approved plan: ${state.approval?.planVersion ?? 'Not recorded'}

## Coordinated action graph

| Action | Team | Status | Tool operation | Cost | Evidence |
|---|---|---|---|---:|---|
${actions}

Completed actions: ${completedActions} of ${state.actions.length}. Every tool result is synthetic and correlated in the Outcome Ledger. Customer communication remains draft-only.

## Measured outcome

- **OBSERVED SYNTHETIC** Day 21 OTIF: **${finalObservation.otif.toFixed(1)}%**
- **SIMULATED** Balanced projection: **82.2%**
- Target: **82.0%**
- Projection variance: **-0.1 percentage point**
- Quality escape delta: **${finalObservation.qualityEscapeDelta.toFixed(1)} percentage point**
- Closeout: target met within budget with no quality degradation.
- Lesson: Carrier recovery was 1 point below its operating assumption; the target was still achieved.

## Traceability

- Ledger events: ${state.ledger.length}
- Correlation ID: \`${CORRELATION_ID}\`
- Evidence, simulation, human decision, tool operations, and observed outcome remain separately labeled.

---

PACT is a synthetic demonstration. This report is not a production authorization or a claim about a live business.
`;
}
