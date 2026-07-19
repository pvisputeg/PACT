import { describe, expect, it } from 'vitest';
import {
  AI_ARTIFACT_PATHS, aiArtifactSchema, artifactSelectionFromSearch, loadAiArtifact,
} from './ai-artifact';

const validArtifact = {
  scenarioId: 'northstar-material-recovery-v1',
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
    evidenceCitations: ['EVD-SUP-119'],
    assumptions: [{ statement: 'Allocation arrives by Day 4.', evidenceStatus: 'partially_supported' }],
    crossTeamPriorities: [{ team: 'Procurement', priority: 'Confirm allocation.', dependency: 'Finance authorization.' }],
    residualRisks: ['Carrier acceptance may remain below projection.'],
  },
  audit: {
    verdict: 'approve_with_conditions',
    findings: [{ severity: 'material', title: 'Customs assumption', detail: 'Interplant transfer requires a customs contingency.', evidenceIds: ['EVD-LOG-117'] }],
    unsupportedClaims: [],
    requiredConditions: ['Validate customs clearance at the Day 3 checkpoint.'],
    counterfactual: { scenario: 'Compressor supply tightens.', expectedImpact: 'Protected revenue falls below target.' },
  },
};

const fixtureArtifact = {
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

function fakeFetch(responses: Record<string, { status?: number; body: unknown }>, calls: string[] = []) {
  return async (path: string) => {
    calls.push(path);
    const response = responses[path];
    if (!response) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: (response.status ?? 200) < 400, status: response.status ?? 200, json: async () => response.body };
  };
}

describe('GPT-5.6 artifact boundary', () => {
  it('accepts the complete schema-constrained two-role artifact', () => {
    expect(aiArtifactSchema.parse(validArtifact).audit.verdict).toBe('approve_with_conditions');
  });

  it('accepts a clearly identified local fixture without treating it as API output', () => {
    expect(aiArtifactSchema.parse(fixtureArtifact).provenance.kind).toBe('fixture');
  });

  it('rejects an unknown strategy or missing provenance', () => {
    expect(() => aiArtifactSchema.parse({ ...validArtifact, plan: { ...validArtifact.plan, recommendedStrategyId: 'STR-UNKNOWN' } })).toThrow();
    const { provenance: _removed, ...withoutProvenance } = validArtifact;
    expect(() => aiArtifactSchema.parse(withoutProvenance)).toThrow();
  });

  it('maps URL selection without silently treating unknown values as genuine', () => {
    expect(artifactSelectionFromSearch('?artifact=fixture')).toBe('fixture');
    expect(artifactSelectionFromSearch('?artifact=gpt')).toBe('genuine');
    expect(artifactSelectionFromSearch('?artifact=none')).toBe('none');
    expect(artifactSelectionFromSearch('?artifact=unexpected')).toBe('auto');
    expect(artifactSelectionFromSearch('')).toBe('auto');
  });

  it('loads a strict genuine artifact in auto mode when it is valid', async () => {
    const calls: string[] = [];
    const result = await loadAiArtifact('auto', fakeFetch({
      [AI_ARTIFACT_PATHS.genuine]: { body: validArtifact },
      [AI_ARTIFACT_PATHS.fixture]: { body: fixtureArtifact },
    }, calls));
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('expected artifact');
    expect(result.source).toBe('genuine');
    expect(result.notice).toBeNull();
    expect(calls).toEqual([AI_ARTIFACT_PATHS.genuine]);
  });

  it('falls back transparently to the fixture only in auto mode', async () => {
    const invalidGenuine = { ...validArtifact, scenarioId: 'stale-otif-scenario' };
    const calls: string[] = [];
    const result = await loadAiArtifact('auto', fakeFetch({
      [AI_ARTIFACT_PATHS.genuine]: { body: invalidGenuine },
      [AI_ARTIFACT_PATHS.fixture]: { body: fixtureArtifact },
    }, calls));
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('expected fixture');
    expect(result.source).toBe('fixture');
    expect(result.notice).toContain('Genuine Northstar artifact was rejected');
    expect(calls).toEqual([AI_ARTIFACT_PATHS.genuine, AI_ARTIFACT_PATHS.fixture]);
  });

  it('fails closed when genuine mode is explicitly selected', async () => {
    const calls: string[] = [];
    const result = await loadAiArtifact('genuine', fakeFetch({
      [AI_ARTIFACT_PATHS.genuine]: { body: { ...validArtifact, scenarioId: 'stale-otif-scenario' } },
      [AI_ARTIFACT_PATHS.fixture]: { body: fixtureArtifact },
    }, calls));
    expect(result.status).toBe('error');
    if (result.status !== 'error') throw new Error('expected rejection');
    expect(result.message).toContain('No model output was consumed');
    expect(calls).toEqual([AI_ARTIFACT_PATHS.genuine]);
  });
});
