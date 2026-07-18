import { describe, expect, it } from 'vitest';
import { reviewGenuineArtifact } from './pact-artifact-review.mjs';

const artifact = {
  model: 'gpt-5.6',
  provider: 'OpenAI Agents SDK',
  provenance: {
    kind: 'genuine', framework: '@openai/agents', orchestration: 'manager',
    planAgent: 'PACT Outcome Lead', auditAgent: 'Independent PACT Outcome Auditor',
    planResponseId: 'resp_plan_1', auditResponseId: 'resp_audit_1',
    planTraceId: 'trace_plan_1', auditTraceId: 'trace_audit_1',
  },
  usage: { requests: 2, inputTokens: 12000, outputTokens: 4000, estimatedCostUsd: 0.18, projectCommittedUsd: 0.18, projectBudgetUsd: 4.5 },
  plan: {
    executiveSummary: 'Use the balanced recovery.', recommendedStrategyId: 'STR-BALANCED',
    strategyRationale: 'It meets the target inside every hard boundary.',
    evidenceCitations: ['EVD-SUP-017 and EVD-LOG-023 support the observed associations.', 'proposedActionGraph: simulated outcomes and approval pending.'],
    assumptions: [],
    crossTeamPriorities: ['Finance', 'Procurement', 'Manufacturing', 'Logistics', 'Customer', 'Outcome Office'].map((team) => ({ team, priority: 'Coordinate recovery.', dependency: 'Approved predecessor.' })),
    residualRisks: [],
  },
  audit: {
    verdict: 'approve_with_conditions',
    findings: [{ severity: 'material', title: 'Monitor carrier', detail: 'Retain the checkpoint.', evidenceIds: ['EVD-LOG-023', 'STR-BALANCED', 'ACT-001'] }],
    unsupportedClaims: [], requiredConditions: ['Human approval remains required.'],
    counterfactual: { scenario: 'Carrier recovery stalls.', expectedImpact: 'OTIF remains below target.' },
  },
};

describe('genuine artifact release review', () => {
  it('accepts a decision-ready, evidence-grounded SDK artifact', () => {
    const result = reviewGenuineArtifact(artifact, new Set(['EVD-SUP-017', 'EVD-LOG-023']));
    expect(result.ready).toBe(true);
  });

  it('rejects unknown evidence, blocked verdicts, and excessive spend', () => {
    const unsafe = {
      ...artifact,
      usage: { ...artifact.usage, projectCommittedUsd: 5.5 },
      plan: { ...artifact.plan, evidenceCitations: ['EVD-FAKE-999'] },
      audit: { ...artifact.audit, verdict: 'block', findings: [{ ...artifact.audit.findings[0], severity: 'blocking' }] },
    };
    const result = reviewGenuineArtifact(unsafe, new Set(['EVD-SUP-017', 'EVD-LOG-023']));
    expect(result.ready).toBe(false);
    expect(result.checks).toMatchObject({ evidenceIntegrity: false, decisionReadyAudit: false, projectBudget: false });
  });

  it('rejects fused or incomplete executive statements', () => {
    const malformed = {
      ...artifact,
      plan: { ...artifact.plan, evidenceCitations: [...artifact.plan.evidenceCitations, 'approval pending.'] },
      audit: {
        ...artifact.audit,
        unsupportedClaims: ['Supplier recovery is unsupported,'],
        requiredConditions: ['Validate recovery. except as agreed under the guards.'],
      },
    };
    const result = reviewGenuineArtifact(malformed, new Set(['EVD-SUP-017', 'EVD-LOG-023']));
    expect(result.ready).toBe(false);
    expect(result.checks.executiveTextQuality).toBe(false);
  });
});
