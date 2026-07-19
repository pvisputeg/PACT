import type { AiArtifact } from './ai-artifact';
import { CORRELATION_ID, calculateProtectedValue, getFinalObservation, scenario } from './engine';
import type { WorkflowState } from './types';

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const list = (values: string[]) => values.length ? values.join(', ') : 'None recorded';

export function buildProofReport(state: WorkflowState, artifact: AiArtifact | null = null): string {
  const strategy = scenario.strategies.find((item) => item.id === state.selectedStrategyId) ?? scenario.strategies[2];
  const finalObservation = getFinalObservation();
  const projectionVariance = finalObservation.protectedRevenuePercent - finalObservation.projectedProtectionPercent;
  const estimatedActionCost = state.actions.reduce((sum, action) => sum + action.estimatedCost, 0);
  const completedActions = state.actions.filter((action) => action.status === 'complete').length;
  const actions = state.actions.length
    ? state.actions.map((action) => `| ${action.actionId} | ${action.team} | ${action.status.toUpperCase()} | ${action.toolOperation} | ${money(action.estimatedCost)} | ${list(action.evidenceIds)} |`).join('\n')
    : '| — | — | NOT ASSEMBLED | — | — | — |';
  const audit = state.auditFindings.length
    ? state.auditFindings.map((finding) => `- **${finding.severity.toUpperCase()} — ${finding.title}:** ${finding.detail} Evidence: ${list(finding.evidenceIds)}. Remediation in plan: ${finding.resolved ? 'yes' : 'no'}.`).join('\n')
    : '- Independent audit not yet run.';
  const modelSection = artifact
    ? `### ${artifact.provenance.kind === 'genuine' ? 'GPT-5.6 reviewed artifacts' : 'Local schema fixture'}

- Provider: ${artifact.provider}
- Artifact kind: **${artifact.provenance.kind.toUpperCase()}**
- Framework: ${artifact.provenance.framework}; orchestration: ${artifact.provenance.orchestration}
- Outcome Lead trace: \`${artifact.provenance.planTraceId}\`; response: \`${artifact.provenance.planResponseId}\`
- Independent Auditor trace: \`${artifact.provenance.auditTraceId}\`; response: \`${artifact.provenance.auditResponseId}\`
- Estimated model cost: $${artifact.usage.estimatedCostUsd.toFixed(4)} within a $${artifact.usage.projectBudgetUsd.toFixed(2)} project cap
- Recommended strategy: ${artifact.plan.recommendedStrategyId}
- Independent verdict: **${artifact.audit.verdict.toUpperCase()}**
- Required conditions: ${list(artifact.audit.requiredConditions)}

${artifact.provenance.kind === 'genuine'
  ? 'The model output was accepted only after strict schema validation. It proposed and challenged; it did not authorize or execute actions.'
  : 'This Local schema fixture made no API call and is not GPT-5.6 evidence. It exists only to exercise the schema-validated presentation path for free.'}`
    : `### GPT-5.6 reviewed artifacts

No generated model artifact was loaded. The workflow remained on its deterministic, schema-ready path.`;

  return `# PACT Outcome Proof Report — Operation Northstar

**Enterprise Outcome Operating System**
Correlation: \`${CORRELATION_ID}\`
Scenario: \`${scenario.scenarioId}\` v${scenario.version}
Provenance: **SYNTHETIC DETERMINISTIC DEMONSTRATION**

## Outcome contract

- Objective: ${state.objective}
- Contract ID: \`${scenario.outcomeContract.id}\`
- Contract hash: \`${state.contractHash ?? 'not-confirmed'}\`
- Target: **protect at least ${scenario.outcomeContract.targetProtectedRevenuePercent.toFixed(1)}% of committed revenue by Day ${scenario.outcomeContract.deadlineDays}**
- Baseline exposure: **${money(scenario.outcomeContract.baselineExposedRevenue)} — CALCULATED**
- Hard boundaries: ${scenario.outcomeContract.constraints.join('; ')}.

## Proofline verification

- Classification: **${state.verification?.classification.toUpperCase() ?? 'NOT VERIFIED'}**
- Confidence: **${state.verification?.confidence.toUpperCase() ?? 'NOT ASSESSED'}**
- ERP reported coverage: ${state.verification?.erpCoverageDays.toFixed(1) ?? '—'} days — FACT
- Reproduced usable coverage: ${state.verification?.usableCoverageDays.toFixed(1) ?? '—'} days — CALCULATED
- Inventory discrepancy: ${state.verification?.discrepancyDays.toFixed(1) ?? '—'} days — CALCULATED
- Evidence: ${list(state.verification?.evidenceIds ?? [])}
- Explanation: ${state.verification?.explanation ?? 'Signal verification has not run.'}

## Cascading business impact

- **FACT:** ${scenario.impact.ordersAtRisk} orders and ${scenario.impact.strategicCustomers} strategic customers are exposed (EVD-ORD-113).
- **CALCULATED:** ${money(scenario.impact.revenueExposure)} committed revenue exposure (EVD-FIN-118).
- **ESTIMATED:** ${money(scenario.impact.penaltyExposure)} potential penalty exposure.
- **INFERRED:** downstream testing, workforce, work-in-progress, and compressor dependencies remain bounded hypotheses.

## Decision packet

- Selected strategy: **${strategy.name}** (\`${strategy.id}\`)
- **SIMULATED** protected revenue: ${strategy.projectedProtectedRevenuePercent.toFixed(1)}%
- **SIMULATED Day 14** protected revenue: ${strategy.projectedDay14ProtectedRevenuePercent.toFixed(1)}% against the 93.0% interim contract
- Estimated strategy cost: ${money(strategy.estimatedCost)}
- Estimated action cost: ${money(estimatedActionCost)}
- Duration: ${strategy.durationDays} days
- Downside case: ${strategy.downsideCase}

### Independent audit

${audit}

${modelSection}

## Human authority

- Decision: **${state.approval?.decision.toUpperCase() ?? 'NOT DECIDED'}**
- Approver: ${state.approval?.approver ?? 'Not recorded'}
- Authority: ${state.approval?.authority ?? 'Not recorded'}
- Approved plan: ${state.approval?.planVersion ?? 'Not recorded'}
- Conditions: ${list(state.approval?.conditions ?? [])}

## Coordinated action graph

| Action | Team | Status | Tool operation | Estimated cost | Evidence |
|---|---|---|---|---:|---|
${actions}

Completed actions: ${completedActions} of ${state.actions.length}. Every tool result is synthetic and correlated in the Outcome Ledger. Customer communication remains draft-only.

## Measured outcome

- Target: **${scenario.outcomeContract.targetProtectedRevenuePercent.toFixed(1)}% — HUMAN-ACCEPTED FACT**
- **SIMULATED** Balanced projection: **${finalObservation.projectedProtectionPercent.toFixed(1)}%**
- **OBSERVED SYNTHETIC** Day ${finalObservation.day} protected revenue: **${finalObservation.protectedRevenuePercent.toFixed(1)}%**
- Projection variance: **${projectionVariance > 0 ? '+' : ''}${projectionVariance.toFixed(1)} percentage points — CALCULATED**
- Observed protected value: **${money(calculateProtectedValue(finalObservation.protectedRevenuePercent, finalObservation.revenueExposure))} — CALCULATED FROM OBSERVATION**
- Final response spend: **${money(finalObservation.spend)} — OBSERVED SYNTHETIC**
- Budget variance: **${money(scenario.closeout.budget - finalObservation.spend)} under budget — CALCULATED**
- Quality incidents: **${scenario.closeout.qualityIncidents}**; strategic customers lost: **${scenario.closeout.strategicCustomersLost}**; unauthorized customer communications: **${scenario.closeout.unauthorizedCustomerCommunications}**.
- PACT records temporal and process linkage; it does not claim that one action exclusively caused the result.

## Traceability and learning

- Ledger events: ${state.ledger.length}
- Correlation ID: \`${CORRELATION_ID}\`
- Retained lessons: ${scenario.lessons.length}
- Evidence, simulation, independent dissent, human decision, policy guards, tool operations, and observed outcome remain separately labeled.

---

PACT is a synthetic demonstration. This report is not a production authorization or a claim about a live business.
`;
}
