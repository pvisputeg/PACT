import { describe, expect, it } from 'vitest';
import type { AiArtifact } from './ai-artifact';
import { auditBalancedPlan, buildBalancedPlan, createApproval, initialState, scenario, verifySignal } from './engine';
import { buildProofReport } from './proof-report';

const artifact: AiArtifact = {
  scenarioId: 'northstar-material-recovery-v1',
  generatedAt: '2026-07-17T13:00:00.000Z',
  model: 'gpt-5.6',
  provider: 'OpenAI Agents SDK',
  provenance: {
    kind: 'genuine', framework: '@openai/agents', orchestration: 'manager',
    planAgent: 'PACT Outcome Lead', auditAgent: 'Independent PACT Outcome Auditor',
    planResponseId: 'resp_plan_123', auditResponseId: 'resp_audit_456',
    planTraceId: 'trace_plan_123', auditTraceId: 'trace_audit_456',
  },
  usage: { requests: 2, inputTokens: 12000, outputTokens: 4000, estimatedCostUsd: 0.18, projectCommittedUsd: 0.18, projectBudgetUsd: 4.5 },
  plan: {
    executiveSummary: 'Use the balanced recovery strategy.',
    recommendedStrategyId: 'STR-BALANCED',
    strategyRationale: 'It meets the target with bounded headroom.',
    evidenceCitations: ['EVD-SUP-017'],
    assumptions: [{ statement: 'Pickup acceptance reaches 92%.', evidenceStatus: 'partially_supported' }],
    crossTeamPriorities: [{ team: 'Procurement', priority: 'Confirm allocation.', dependency: 'Finance approval.' }],
    residualRisks: ['Carrier acceptance may miss assumption.'],
  },
  audit: {
    verdict: 'approve_with_conditions',
    findings: [{ severity: 'material', title: 'Carrier sensitivity', detail: 'Monitor pickup acceptance.', evidenceIds: ['EVD-LOG-023'] }],
    unsupportedClaims: [],
    requiredConditions: ['Retain human approval.'],
    counterfactual: { scenario: 'Compressor supply tightens.', expectedImpact: 'Protected revenue closes below projection.' },
  },
};

describe('human-readable outcome proof report', () => {
  it('keeps claims and outcome states explicitly labeled', () => {
    const actions = buildBalancedPlan().map((action) => ({ ...action, status: 'complete' as const }));
    const balanced = scenario.strategies.find((item) => item.id === 'STR-BALANCED')!;
    const state = {
      ...initialState,
      contractHash: 'sha256:proof',
      verification: verifySignal(),
      selectedStrategyId: 'STR-BALANCED' as const,
      actions,
      auditFindings: auditBalancedPlan(balanced, actions),
      approval: createApproval('approved'),
    };

    const report = buildProofReport(state, artifact);
    expect(report).toContain('SIMULATED');
    expect(report).toContain('OBSERVED SYNTHETIC');
    expect(report).toContain('sha256:proof');
    expect(report).toContain('finance.authorize_recovery');
    expect(report).toContain('resp_plan_123');
    expect(report).toContain('resp_audit_456');
    expect(report).toContain('Customer communication remains draft-only');
  });

  it('is transparent when no GPT artifact is present', () => {
    expect(buildProofReport(initialState)).toContain('deterministic, schema-ready path');
  });

  it('never represents the free local fixture as GPT-5.6 evidence', () => {
    const fixture: AiArtifact = {
      ...artifact,
      model: 'fixture:pact-v1',
      provider: 'Local schema fixture',
      provenance: {
        ...artifact.provenance,
        kind: 'fixture', framework: 'offline-fixture',
        planResponseId: 'fixture_plan_001', auditResponseId: 'fixture_audit_001',
        planTraceId: 'fixture_trace_plan_001', auditTraceId: 'fixture_trace_audit_001',
      },
      usage: { requests: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, projectCommittedUsd: 0, projectBudgetUsd: 4.5 },
    };
    const report = buildProofReport(initialState, fixture);
    expect(report).toContain('Local schema fixture');
    expect(report).toContain('made no API call');
    expect(report).toContain('not GPT-5.6 evidence');
  });
});
