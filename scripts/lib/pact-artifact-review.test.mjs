import { describe, expect, it } from 'vitest';
import { reviewGenuineArtifact } from './pact-artifact-review.mjs';

const artifact = {
  scenarioId: 'northstar-material-recovery-v1',
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
    executiveSummary: 'Use STR-BALANCED for executive consideration.', recommendedStrategyId: 'STR-BALANCED',
    strategyRationale: 'STR-BALANCED meets the target inside every hard boundary.',
    evidenceCitations: ['EVD-SUP-119 and EVD-LOG-117 support the bounded plan.', 'proposedActionGraph: simulated outcomes and approval pending.'],
    assumptions: [],
    crossTeamPriorities: ['Finance', 'Procurement', 'Quality', 'Manufacturing', 'Logistics', 'Workforce Operations', 'Customer Operations', 'Outcome Office'].map((team) => ({ team, priority: 'Coordinate recovery.', dependency: 'Approved predecessor.' })),
    residualRisks: ['Carrier acceptance may miss the simulated assumption.'],
  },
  audit: {
    verdict: 'approve_with_conditions',
    findings: [{ severity: 'material', title: 'Monitor customs', detail: 'Retain the checkpoint.', evidenceIds: ['EVD-LOG-117', 'STR-BALANCED', 'ACT-001'] }],
    unsupportedClaims: [], requiredConditions: ['Validate customs clearance at the Day 3 checkpoint.'],
    counterfactual: { scenario: 'Compressor supply tightens.', expectedImpact: 'Protected revenue remains below target.' },
  },
};

describe('genuine artifact release review', () => {
  it('accepts a decision-ready, evidence-grounded SDK artifact', () => {
    const result = reviewGenuineArtifact(artifact, new Set(['EVD-SUP-119', 'EVD-LOG-117']));
    expect(result.ready).toBe(true);
  });

  it('rejects unknown evidence, blocked verdicts, and excessive spend', () => {
    const unsafe = {
      ...artifact,
      usage: { ...artifact.usage, projectCommittedUsd: 5.5 },
      plan: { ...artifact.plan, evidenceCitations: ['EVD-FAKE-999'] },
      audit: { ...artifact.audit, verdict: 'block', findings: [{ ...artifact.audit.findings[0], severity: 'blocking' }] },
    };
    const result = reviewGenuineArtifact(unsafe, new Set(['EVD-SUP-119', 'EVD-LOG-117']));
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
    const result = reviewGenuineArtifact(malformed, new Set(['EVD-SUP-119', 'EVD-LOG-117']));
    expect(result.ready).toBe(false);
    expect(result.checks.executiveTextQuality).toBe(false);
  });
});
