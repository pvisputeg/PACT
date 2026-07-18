import { describe, expect, it } from 'vitest';
import { aiArtifactSchema } from './ai-artifact';

const validArtifact = {
  generatedAt: '2026-07-17T20:00:00.000Z',
  model: 'gpt-5.6',
  provider: 'OpenAI Agents SDK',
  provenance: {
    kind: 'genuine', framework: '@openai/agents', orchestration: 'manager',
    planAgent: 'PACT Outcome Lead', auditAgent: 'Independent PACT Outcome Auditor',
    planResponseId: 'resp_plan_001', auditResponseId: 'resp_audit_001',
    planTraceId: 'trace_plan_001', auditTraceId: 'trace_audit_001',
  },
  usage: { requests: 2, inputTokens: 12000, outputTokens: 4000, estimatedCostUsd: 0.18, projectCommittedUsd: 0.18, projectBudgetUsd: 4.5 },
  plan: {
    executiveSummary: 'Use the balanced recovery strategy.',
    recommendedStrategyId: 'STR-BALANCED',
    strategyRationale: 'It meets the target within the governed budget.',
    evidenceCitations: ['EVD-SUP-017'],
    assumptions: [{ statement: 'Allocation arrives by Day 4.', evidenceStatus: 'partially_supported' }],
    crossTeamPriorities: [{ team: 'Procurement', priority: 'Confirm allocation.', dependency: 'Finance authorization.' }],
    residualRisks: ['Carrier acceptance may remain below projection.'],
  },
  audit: {
    verdict: 'approve_with_conditions',
    findings: [{ severity: 'material', title: 'Carrier assumption', detail: 'Acceptance evidence supports 91%, not 92%.', evidenceIds: ['EVD-LOG-023'] }],
    unsupportedClaims: [],
    requiredConditions: ['Monitor pickup acceptance.'],
    counterfactual: { scenario: 'Carrier acceptance remains at 88%.', expectedImpact: 'Day-21 OTIF falls below target.' },
  },
};

describe('GPT-5.6 artifact boundary', () => {
  it('accepts the complete schema-constrained two-role artifact', () => {
    expect(aiArtifactSchema.parse(validArtifact).audit.verdict).toBe('approve_with_conditions');
  });

  it('accepts a clearly identified local fixture without treating it as API output', () => {
    const fixture = {
      ...validArtifact,
      model: 'fixture:pact-v1',
      provider: 'Local schema fixture',
      provenance: {
        ...validArtifact.provenance,
        kind: 'fixture', framework: 'offline-fixture',
        planResponseId: 'fixture_plan_001', auditResponseId: 'fixture_audit_001',
        planTraceId: 'fixture_trace_plan_001', auditTraceId: 'fixture_trace_audit_001',
      },
      usage: { requests: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, projectCommittedUsd: 0, projectBudgetUsd: 4.5 },
    };
    expect(aiArtifactSchema.parse(fixture).provenance.kind).toBe('fixture');
  });

  it('rejects an unknown strategy or missing provenance', () => {
    expect(() => aiArtifactSchema.parse({ ...validArtifact, plan: { ...validArtifact.plan, recommendedStrategyId: 'STR-UNKNOWN' } })).toThrow();
    const { provenance: _removed, ...withoutProvenance } = validArtifact;
    expect(() => aiArtifactSchema.parse(withoutProvenance)).toThrow();
  });
});
