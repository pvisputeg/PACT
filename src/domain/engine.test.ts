import { describe, expect, it } from 'vitest';
import {
  auditBalancedPlan, buildBalancedPlan, calculateOtif, createApproval, evaluateStrategy, executeNextAction,
  initialState, readyActions, scenario, verifySignal,
} from './engine';
import { actionContractSchema, metricContract, outcomeContract } from './contracts';
import type { Scenario, WorkflowState } from './types';

describe('PACT contracts and Proofline', () => {
  it('parses the governed metric and outcome contracts', () => {
    expect(metricContract.metricId).toBe('supply-chain.otif');
    expect(outcomeContract.target.value).toBe(82);
    expect(outcomeContract.hardConstraints).toHaveLength(4);
  });

  it('reproduces the governed baseline and current OTIF', () => {
    expect(calculateOtif(scenario.periods.baseline)).toBe(84.3);
    expect(calculateOtif(scenario.periods.current)).toBe(72.4);
    expect(verifySignal().classification).toBe('verified_operational');
  });

  it('detects an intentionally corrupted integrity control', () => {
    const corrupted: Scenario = {
      ...scenario,
      integrityChecks: scenario.integrityChecks.map((check, index) => index === 1 ? { ...check, status: 'fail' } : check),
    };
    expect(verifySignal(corrupted).classification).toBe('data_defect');
  });

  it('rejects invalid OTIF populations', () => {
    expect(() => calculateOtif({ eligibleOrders: 10, onTimeInFullOrders: 11 })).toThrow('Invalid OTIF population');
  });
});

describe('strategies, challenge, and Action Graph', () => {
  it('keeps every proposed strategy inside the hard budget constraint', () => {
    for (const strategy of scenario.strategies) {
      expect(evaluateStrategy(strategy).compliant).toBe(true);
      expect(strategy.cost).toBeLessThanOrEqual(75_000);
    }
    const balanced = scenario.strategies.find((item) => item.id === 'STR-BALANCED')!;
    expect(balanced.projectedDay21).toBe(82.2);
  });

  it('validates every action against the explicit action schema', () => {
    for (const action of buildBalancedPlan()) expect(() => actionContractSchema.parse(action)).not.toThrow();
  });

  it('creates a separate Auditor challenge with no unresolved blocker', () => {
    const strategy = scenario.strategies.find((item) => item.id === 'STR-BALANCED')!;
    const findings = auditBalancedPlan(strategy, buildBalancedPlan());
    expect(findings.some((finding) => finding.severity === 'material')).toBe(true);
    expect(findings.some((finding) => finding.severity === 'blocking' && !finding.resolved)).toBe(false);
  });

  it('does not make dependent actions ready before predecessors', () => {
    const actions = readyActions(buildBalancedPlan());
    expect(actions.find((action) => action.actionId === 'ACT-001')?.status).toBe('ready');
    expect(actions.find((action) => action.actionId === 'ACT-002')?.status).toBe('blocked');
    expect(actions.find((action) => action.actionId === 'ACT-005')?.status).toBe('blocked');
  });

  it('recomputes readiness immediately after a predecessor completes', () => {
    const initial = readyActions(buildBalancedPlan());
    const afterFinance = readyActions(initial.map((action) => action.actionId === 'ACT-001' ? { ...action, status: 'complete' as const } : action));
    expect(afterFinance.find((action) => action.actionId === 'ACT-002')?.status).toBe('ready');
    expect(afterFinance.find((action) => action.actionId === 'ACT-004')?.status).toBe('ready');
    expect(afterFinance.find((action) => action.actionId === 'ACT-003')?.status).toBe('blocked');
  });
});

describe('governed execution and measured outcome', () => {
  function executableState(): WorkflowState {
    return {
      ...initialState,
      stage: 'execution',
      actions: readyActions(buildBalancedPlan()),
      approval: createApproval('approved'),
    };
  }

  it('blocks material tools without explicit approval', () => {
    const state: WorkflowState = { ...executableState(), approval: null };
    expect(() => executeNextAction(state)).toThrow('Material actions require an approved plan');
  });

  it('executes the complete graph in dependency order and keeps communication draft-only', () => {
    let state = executableState();
    const order: string[] = [];
    for (let index = 0; index < 6; index += 1) {
      const before = new Set(state.actions.filter((action) => action.status === 'complete').map((action) => action.actionId));
      state = executeNextAction(state);
      const completed = state.actions.find((action) => action.status === 'complete' && !before.has(action.actionId));
      if (completed) order.push(completed.actionId);
    }
    expect(order).toEqual(['ACT-001', 'ACT-002', 'ACT-003', 'ACT-004', 'ACT-005', 'ACT-006']);
    const customerDraft = state.actions.find((action) => action.actionId === 'ACT-005');
    expect(customerDraft?.result?.deliveryState).toBe('not_sent');
    expect(state.ledger.filter((event) => event.source === 'simulated_business_tool')).toHaveLength(6);
  });

  it('reaches the deterministic interim and final observed outcomes', () => {
    expect(scenario.observations.find((item) => item.day === 14)?.otif).toBe(81.5);
    expect(scenario.observations.find((item) => item.day === 21)?.otif).toBe(82.1);
    expect(scenario.observations.find((item) => item.day === 21)?.qualityEscapeDelta).toBeLessThanOrEqual(0);
  });
});
