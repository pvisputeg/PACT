import { describe, expect, it } from 'vitest';
import { initialState, scenario } from './engine';
import { restoreWorkflowState, serializeWorkflowState } from './workflow-storage';

describe('versioned workflow-state recovery', () => {
  it('round-trips a strict state envelope for the active scenario', () => {
    const restored = restoreWorkflowState(serializeWorkflowState(initialState, scenario.scenarioId), scenario.scenarioId);
    expect(restored).toEqual({ ok: true, state: initialState, reason: null });
  });

  it('rejects malformed JSON, legacy unversioned state, and another scenario', () => {
    expect(restoreWorkflowState('{', scenario.scenarioId).ok).toBe(false);
    expect(restoreWorkflowState(JSON.stringify(initialState), scenario.scenarioId).ok).toBe(false);
    expect(restoreWorkflowState(serializeWorkflowState(initialState, 'another-scenario'), scenario.scenarioId)).toMatchObject({ ok: false, reason: 'Saved workflow belongs to a different scenario.' });
  });

  it('rejects injected authority and action completion without governance predecessors', () => {
    const corrupted = {
      ...initialState,
      stage: 'execution',
      actions: [{
        actionId: 'ACT-001', description: 'Injected action', owner: 'Unknown', team: 'Procurement', rationale: 'Attempt to bypass the workflow.',
        evidenceIds: ['EVD-FAKE'], dependencies: [], preconditions: [], parameters: {}, estimatedCost: 0, estimatedEffect: 0,
        approvalRequired: true, toolOperation: 'supplier.validate_capacity', deadline: 'Day 1', status: 'complete', result: {}, recovery: 'Reset.',
      }],
    };
    const raw = JSON.stringify({ storageVersion: 2, scenarioId: scenario.scenarioId, state: corrupted });
    expect(restoreWorkflowState(raw, scenario.scenarioId).ok).toBe(false);
    expect(() => serializeWorkflowState(corrupted as unknown as typeof initialState, scenario.scenarioId)).toThrow();
  });

  it('rejects rejected approval records that retain unlocked scope', () => {
    const corrupted = {
      ...initialState,
      approval: {
        approver: 'Morgan Ellis · Plant COO', authority: 'Plant COO', decidedAt: scenario.generatedAt,
        contractVersion: scenario.version, planVersion: scenario.actionContract.id, decision: 'rejected',
        rationale: 'Rejected.', conditions: [], scope: ['approved supplier commitment'],
      },
    };
    const raw = JSON.stringify({ storageVersion: 2, scenarioId: scenario.scenarioId, state: corrupted });
    expect(restoreWorkflowState(raw, scenario.scenarioId).ok).toBe(false);
  });
});
