import { describe, expect, it } from 'vitest';
import { aiArtifactSchema } from './ai-artifact';

const validArtifact = {
  generatedAt: '2026-07-17T20:00:00.000Z',
  model: 'gpt-5.6',
  provider: 'OpenAI Responses API',
  provenance: { planResponseId: 'resp_plan_001', auditResponseId: 'resp_audit_001' },
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

  it('rejects an unknown strategy or missing provenance', () => {
    expect(() => aiArtifactSchema.parse({ ...validArtifact, plan: { ...validArtifact.plan, recommendedStrategyId: 'STR-UNKNOWN' } })).toThrow();
    const { provenance: _removed, ...withoutProvenance } = validArtifact;
    expect(() => aiArtifactSchema.parse(withoutProvenance)).toThrow();
  });
});
