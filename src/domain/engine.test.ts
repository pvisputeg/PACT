import { describe, expect, it } from 'vitest';
import {
  AUDIT_CONDITION_SET_ID, PLAN_ID, RUNTIME_VERSION, auditBalancedPlan, buildBalancedPlan,
  calculateInventoryDiscrepancy, calculateProtectedValue, calculateUsableCoverage, createApproval,
  createImmutableAuditPacket, demonstrateUnsafeSupplierAttempt, derivePlantState, evaluateStrategy,
  executeNextAction, executeRemainingActions, initialState, readyActions, scenario, verifySignal,
} from './engine';
import { actionContractSchema, metricContract, outcomeContract } from './contracts';
import type { Scenario, WorkflowState } from './types';
import { createRuntimeState, executePactOperation } from '../../plugins/pact/runtime/pact-runtime.mjs';

function executableState(): WorkflowState {
  return {
    ...initialState,
    stage: 'execution',
    contractConfirmed: true,
    verification: verifySignal(),
    actions: readyActions(buildBalancedPlan()),
    auditFindings: auditBalancedPlan(scenario.strategies[2], buildBalancedPlan()),
    auditConditionAcceptance: {
      conditionSetId: AUDIT_CONDITION_SET_ID,
      sourceResponseId: 'fixture_audit_northstar_001',
      requiredConditionCount: 5,
      adoptedAt: scenario.generatedAt,
      adoptedBy: 'Morgan Ellis · Plant COO',
    },
    approval: createApproval('approved_with_conditions'),
  };
}

describe('Operation Northstar scenario integrity', () => {
  it('parses the governed committed-revenue metric and outcome contracts', () => {
    expect(metricContract.metricId).toBe('manufacturing.committed_revenue_protected');
    expect(outcomeContract.target.value).toBe(95);
    expect(outcomeContract.hardConstraints).toHaveLength(5);
    expect(outcomeContract.permittedActionClasses).toHaveLength(9);
  });

  it('reconciles customer, order, and exposure segments to the flagship totals', () => {
    expect(scenario.impact.orderSegments.reduce((sum, item) => sum + item.orders, 0)).toBe(318);
    expect(scenario.impact.orderSegments.reduce((sum, item) => sum + item.customers, 0)).toBe(42);
    expect(scenario.impact.orderSegments.reduce((sum, item) => sum + item.exposedRevenue, 0)).toBe(8_700_000);
  });

  it('resolves all action dependency IDs and proves the graph is acyclic', () => {
    const ids = new Set(scenario.actionGraph.map((action) => action.actionId));
    scenario.actionGraph.forEach((action) => action.dependencies.forEach((dependency) => expect(ids.has(dependency)).toBe(true)));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const visit = (id: string) => {
      if (visiting.has(id)) throw new Error(`Cycle at ${id}`);
      if (visited.has(id)) return;
      visiting.add(id);
      scenario.actionGraph.find((action) => action.actionId === id)?.dependencies.forEach(visit);
      visiting.delete(id);
      visited.add(id);
    };
    scenario.actionGraph.forEach((action) => visit(action.actionId));
    expect(visited.size).toBe(10);
  });

  it('keeps observations aligned with deterministic closeout', () => {
    const day21 = scenario.observations.find((item) => item.day === 21)!;
    expect(day21.protectedRevenuePercent).toBe(scenario.closeout.observedProtectedRevenuePercent);
    expect(day21.projectedProtectionPercent).toBe(scenario.closeout.projectedProtectedRevenuePercent);
    expect(day21.spend).toBe(scenario.closeout.finalSpend);
    expect(scenario.closeout.qualityIncidents).toBe(0);
    expect(scenario.closeout.unauthorizedCustomerCommunications).toBe(0);
  });
});

describe('Proofline signal verification', () => {
  it('reproduces 5.4 usable days and the 2.7-day ERP discrepancy', () => {
    expect(calculateUsableCoverage()).toBe(5.4);
    expect(calculateInventoryDiscrepancy()).toBe(2.7);
    const result = verifySignal();
    expect(result.classification).toBe('verified_material_risk');
    expect(result.confidence).toBe('high');
    expect(result.checks).toHaveLength(10);
  });

  it('confirms supplier, carrier, schedule, BOM, inventory, and telemetry evidence', () => {
    const names = verifySignal().checks.map((check) => check.name);
    expect(names).toContain('Supplier delay confirmed');
    expect(names).toContain('Carrier diversion confirmed');
    expect(names).toContain('Purchase-order schedule matched');
    expect(names).toContain('Bill-of-material dependency verified');
    expect(names).toContain('Current consumption rate applied');
  });

  it('fails when an evidence control is intentionally corrupted', () => {
    const corrupted: Scenario = {
      ...scenario,
      verificationControls: scenario.verificationControls.map((check, index) => index === 1 ? { ...check, status: 'fail' } : check),
    };
    expect(verifySignal(corrupted).classification).toBe('data_defect');
  });

  it('uses the scenario verification policy instead of a hard-coded control count', () => {
    const missingRequiredControl: Scenario = {
      ...scenario,
      verificationControls: scenario.verificationControls.filter((check) => check.id !== scenario.verificationPolicy.requiredControlIds[0]),
    };
    expect(verifySignal(missingRequiredControl).classification).toBe('insufficient_evidence');

    const recalibratedInventory: Scenario = {
      ...scenario,
      inventory: {
        ...scenario.inventory,
        erpReportedCoverageDays: 9.2,
        qualityHoldDays: 1.4,
        allocatedDays: 1.2,
        incompatibleBatchDays: 0.5,
        usableCoverageDays: 6.1,
      },
    };
    const result = verifySignal(recalibratedInventory);
    expect(result.classification).toBe('verified_material_risk');
    expect(result.usableCoverageDays).toBe(6.1);
    expect(result.discrepancyDays).toBe(3.1);
    expect(result.explanation).toContain('6.1 usable days');
  });
});

describe('bounded strategies and independent audit', () => {
  it('rejects Speed First for budget, Cost First for target, and accepts Balanced Recovery', () => {
    const speed = scenario.strategies.find((item) => item.id === 'STR-SPEED')!;
    const cost = scenario.strategies.find((item) => item.id === 'STR-COST')!;
    const balanced = scenario.strategies.find((item) => item.id === 'STR-BALANCED')!;
    expect(evaluateStrategy(speed).reasons).toContain('Exceeds the $420,000 response budget');
    expect(evaluateStrategy(cost).reasons).toContain('Fails the 95% protected-revenue target');
    expect(evaluateStrategy(balanced)).toEqual({ compliant: true, reasons: [] });
    expect(balanced.projectedProtectedRevenuePercent).toBe(96.4);
    expect(balanced.estimatedCost).toBe(386_000);
  });

  it('covers all eight required functions with schema-valid actions', () => {
    const actions = buildBalancedPlan();
    actions.forEach((action) => expect(() => actionContractSchema.parse(action)).not.toThrow());
    expect(new Set(actions.map((action) => action.team))).toEqual(new Set(['Procurement', 'Quality', 'Finance', 'Logistics', 'Workforce Operations', 'Manufacturing', 'Customer Operations', 'Outcome Office']));
    expect(actions.reduce((sum, action) => sum + action.estimatedCost, 0)).toBe(386_000);
  });

  it('creates five material findings and remediates them in the proposed plan', () => {
    const findings = auditBalancedPlan(scenario.strategies[2], buildBalancedPlan());
    expect(findings).toHaveLength(5);
    expect(findings.every((finding) => finding.severity === 'material')).toBe(true);
    expect(findings.every((finding) => finding.resolved)).toBe(true);
  });

  it('seals an immutable packet for the separate Auditor role', () => {
    const packet = createImmutableAuditPacket(buildBalancedPlan());
    expect(packet.packetId).toBe('AUDIT-PACKET-NORTHSTAR-v1');
    expect(Object.isFrozen(packet)).toBe(true);
    expect(Object.isFrozen(packet.actionIds)).toBe(true);
    expect(() => packet.actionIds.push('ACT-999')).toThrow();
  });
});

describe('bounded human authorization and safe tool execution', () => {
  it('blocks material execution without human approval', () => {
    expect(() => executeNextAction({ ...executableState(), approval: null })).toThrow('Material actions require an approved Action Contract');
  });

  it.each(['revision_requested', 'rejected'] as const)('grants no scope when the human decision is %s', (decision) => {
    const approval = createApproval(decision);
    expect(approval.scope).toEqual([]);
    expect(approval.conditions).toEqual([]);
    expect(() => executeNextAction({ ...executableState(), approval })).toThrow('Material actions require an approved Action Contract');
  });

  it('demonstrates the exact required quality rejection and records it in the ledger', () => {
    const state = demonstrateUnsafeSupplierAttempt(executableState());
    expect(state.unsafeAttemptMessage).toBe('Action blocked: Required quality authorization is missing.');
    expect(state.ledger.at(-1)?.status).toBe('blocked');
    expect(state.ledger.at(-1)?.payload.missingEvidenceId).toBe('EVD-QLT-115');
  });

  it('blocks supplier commitment before quality and finance, then succeeds after both', () => {
    let runtime = executePactOperation(createRuntimeState(), 'proof.verify_signal').state;
    runtime = executePactOperation(runtime, 'audit.adopt_conditions', { planId: PLAN_ID, conditionSetId: AUDIT_CONDITION_SET_ID, requiredConditionCount: 5, authorizedBy: 'plant_coo' }).state;
    runtime = executePactOperation(runtime, 'approval.record', { planId: PLAN_ID, decision: 'approved_with_conditions', approver: 'Morgan Ellis · Plant COO' }).state;
    const supplierArgs = { approvedPlanId: PLAN_ID, auditConditionSetId: AUDIT_CONDITION_SET_ID, actionId: 'ACT-004', supplier: 'Redwood Alloys', amount: 148000, coverageDays: 1.7 };
    expect(() => executePactOperation(runtime, 'supplier.commit_allocation', supplierArgs)).toThrow('Action blocked: Required quality authorization is missing.');
    runtime = executePactOperation(runtime, 'supplier.validate_capacity', { approvedPlanId: PLAN_ID, auditConditionSetId: AUDIT_CONDITION_SET_ID, actionId: 'ACT-001', supplier: 'Redwood Alloys', capacityDays: 3.4 }).state;
    runtime = executePactOperation(runtime, 'quality.validate_release', { approvedPlanId: PLAN_ID, auditConditionSetId: AUDIT_CONDITION_SET_ID, actionId: 'ACT-002', supplier: 'Redwood Alloys', batchId: 'BATCH-C17-R01' }).state;
    expect(() => executePactOperation(runtime, 'supplier.commit_allocation', supplierArgs)).toThrow('Action blocked: Required finance authorization is missing.');
    runtime = executePactOperation(runtime, 'finance.authorize_recovery', { approvedPlanId: PLAN_ID, auditConditionSetId: AUDIT_CONDITION_SET_ID, actionId: 'ACT-003', amount: 420000, currency: 'USD' }).state;
    const result = executePactOperation(runtime, 'supplier.commit_allocation', supplierArgs);
    expect(result.result.accepted).toBe(true);
    expect(result.result.projectedCoverageDays).toBe(7.1);
  });

  it('rejects excessive spend, unapproved suppliers, premature production, and direct sends', () => {
    const base = executableState();
    const common = { approvedPlanId: PLAN_ID, auditConditionSetId: AUDIT_CONDITION_SET_ID };
    const runtime = { verified: true, auditConditionsAdopted: true, humanApproved: true, completedActionIds: [] };
    expect(() => executePactOperation(runtime, 'finance.authorize_recovery', { ...common, actionId: 'ACT-003', amount: 420001, currency: 'USD' })).toThrow('approved $420,000 USD envelope');
    expect(() => executePactOperation(runtime, 'supplier.validate_capacity', { ...common, actionId: 'ACT-001', supplier: 'Unknown Metals', capacityDays: 3.4 })).toThrow('Supplier is not approved');
    expect(() => executePactOperation(runtime, 'production.resequence', { ...common, actionId: 'ACT-008', plant: 'Northstar Plant 7', line: 'Line C', priorityTier: 'strategic' })).toThrow('Required predecessor');
    const customer = base.actions.find((action) => action.actionId === 'ACT-009')!;
    expect(customer.parameters.send).toBe(false);
  });

  it('executes the ten-node graph in deterministic dependency order and keeps drafts unsent', () => {
    let state = executableState();
    const order: string[] = [];
    for (let index = 0; index < 10; index += 1) {
      const before = new Set(state.actions.filter((action) => action.status === 'complete').map((action) => action.actionId));
      state = executeNextAction(state);
      const completed = state.actions.find((action) => action.status === 'complete' && !before.has(action.actionId));
      if (completed) order.push(completed.actionId);
    }
    expect(order).toEqual(['ACT-001','ACT-002','ACT-003','ACT-004','ACT-005','ACT-006','ACT-007','ACT-008','ACT-009','ACT-010']);
    expect(state.actions.find((action) => action.actionId === 'ACT-009')?.result?.deliveryState).toBe('not_sent');
    expect(state.actions.find((action) => action.actionId === 'ACT-010')?.result?.runtimeVersion).toBe(RUNTIME_VERSION);
    expect(state.ledger.filter((event) => event.source === 'simulated_business_tool')).toHaveLength(10);
  });

  it('fast-forwards without bypassing dependencies and moves the plant twin', () => {
    const state = executeRemainingActions(executableState());
    expect(state.actions.every((action) => action.status === 'complete')).toBe(true);
    const finalTwinState = scenario.plantStateProgression.at(-1)!;
    expect(derivePlantState(state.actions)).toEqual({
      coverageDays: finalTwinState.coverageDays,
      lineCRisk: finalTwinState.lineCRisk,
      ordersProtected: finalTwinState.ordersProtected,
      phase: finalTwinState.phase.toLowerCase(),
    });
  });
});

describe('measurement, ledger, and replay', () => {
  it('keeps target, projection, observations, spend, and safeguards distinct', () => {
    expect(scenario.closeout.targetProtectedRevenuePercent).toBe(95);
    expect(scenario.closeout.projectedProtectedRevenuePercent).toBe(96.4);
    expect(scenario.closeout.observedProtectedRevenuePercent).toBe(96.1);
    expect(scenario.closeout.finalSpend).toBe(389_000);
    expect(calculateProtectedValue(96.1)).toBe(8_360_700);
  });

  it('contains all required Day 3, 7, 14, and 21 checkpoints', () => {
    expect(scenario.observations.find((item) => item.day === 3)?.ordersProtected).toBe(71);
    expect(scenario.observations.find((item) => item.day === 7)?.inventoryCoverageDays).toBe(8.7);
    expect(scenario.observations.find((item) => item.day === 14)?.protectedRevenuePercent).toBe(93);
    expect(scenario.observations.find((item) => item.day === 21)?.protectedRevenuePercent).toBe(96.1);
  });

  it('provides the complete twelve-stage three-minute replay in order', () => {
    expect(scenario.replay).toHaveLength(12);
    expect(scenario.replay.map((item) => item.title)).toEqual([
      'Signal detected','Signal verified','Inventory discrepancy found','Cascading impact mapped','Strategies compared','Independent audit challenged the plan','Human authorization recorded','Unsafe action blocked','Dependencies completed','Plant state recovered','Day-21 outcome observed','Lessons retained',
    ]);
  });
});
