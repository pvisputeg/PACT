import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { ACTION_GRAPH, AUDIT_CONDITION_SET_ID, MAXIMUM_BUDGET, PLAN_ID } from '../plugins/pact/runtime/pact-runtime.mjs';

const [scenario, outcomeContract] = await Promise.all([
  readFile(new URL('../data/northstar-material-recovery.scenario.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../contracts/outcome-contract.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const usable = Number((scenario.inventory.erpReportedCoverageDays - scenario.inventory.qualityHoldDays - scenario.inventory.allocatedDays - scenario.inventory.incompatibleBatchDays).toFixed(1));
const orderCount = scenario.impact.orderSegments.reduce((sum, item) => sum + item.orders, 0);
const customerCount = scenario.impact.orderSegments.reduce((sum, item) => sum + item.customers, 0);
const exposure = scenario.impact.orderSegments.reduce((sum, item) => sum + item.exposedRevenue, 0);
const balanced = scenario.strategies.find((item) => item.id === 'STR-BALANCED');
const proposedCost = scenario.actionGraph.reduce((sum, item) => sum + item.estimatedCost, 0);
const day21 = scenario.observations.find((item) => item.day === 21);
const ids = new Set(scenario.actionGraph.map((item) => item.actionId));
const dependenciesResolve = scenario.actionGraph.every((item) => item.dependencies.every((dependency) => ids.has(dependency)));
const unresolved = new Set(ids);
while (unresolved.size) {
  const completed = new Set([...ids].filter((id) => !unresolved.has(id)));
  const ready = scenario.actionGraph.filter((item) => unresolved.has(item.actionId) && item.dependencies.every((dependency) => completed.has(dependency)));
  if (!ready.length) break;
  ready.forEach((item) => unresolved.delete(item.actionId));
}
const graphIsAcyclic = unresolved.size === 0;
const signalReceivedAt = new Date(scenario.signal.receivedAt).getTime();
const originalArrival = new Date(`${scenario.shipment.originalArrival}T00:00:00.000Z`).getTime();
const revisedArrival = new Date(`${scenario.shipment.revisedArrival}T00:00:00.000Z`).getTime();
const chronologyIsConsistent = originalArrival >= signalReceivedAt
  && (revisedArrival - originalArrival) / 86_400_000 === scenario.shipment.delayDays;
const transfer = scenario.actionGraph.find((item) => item.actionId === 'ACT-005');
const logisticsGate = scenario.actionGraph.find((item) => item.actionId === 'ACT-007');
const transferIsCustomsGated = transfer.dependencies.includes('ACT-007')
  && logisticsGate.parameters.customsRouteValidated === true;
const verificationIds = new Set(scenario.verificationControls.map((control) => control.id));
const verificationPolicyResolves = scenario.verificationPolicy.requiredControlIds.every((id) => verificationIds.has(id));
const progressionResolves = scenario.plantStateProgression.every((item) => item.unlockActionId === null || ids.has(item.unlockActionId));
const baselineTwin = scenario.plantStateProgression[0];
const finalTwin = scenario.plantStateProgression.at(-1);
const runtimeActions = ACTION_GRAPH.map(({ action }) => {
  const { rationale: _rationale, approvalRequired: _approvalRequired, ...scenarioShape } = action;
  return scenarioShape;
});
const runtimeMatchesScenario = isDeepStrictEqual(runtimeActions, scenario.actionGraph)
  && MAXIMUM_BUDGET === scenario.actionContract.maximumBudget
  && PLAN_ID === scenario.actionContract.id
  && AUDIT_CONDITION_SET_ID === scenario.audit.conditionSetId;

if (
  scenario.scenarioId !== 'northstar-material-recovery-v1'
  || scenario.seed !== 56021
  || usable !== 5.4
  || orderCount !== 318
  || customerCount !== 42
  || exposure !== 8_700_000
  || balanced.projectedProtectedRevenuePercent !== 96.4
  || balanced.projectedDay14ProtectedRevenuePercent < outcomeContract.interimTarget.value
  || balanced.estimatedCost !== 386_000
  || proposedCost !== 386_000
  || day21.protectedRevenuePercent !== 96.1
  || day21.spend !== 389_000
  || !dependenciesResolve
  || !graphIsAcyclic
  || !chronologyIsConsistent
  || !transferIsCustomsGated
  || !verificationPolicyResolves
  || !progressionResolves
  || baselineTwin.coverageDays !== usable
  || finalTwin.coverageDays !== day21.inventoryCoverageDays
  || !runtimeMatchesScenario
  || scenario.replay.length !== 12
) throw new Error('Operation Northstar scenario verification failed');

console.log(`Operation Northstar verified: ${usable} usable days, ${orderCount} orders, ${customerCount} customers, $${(exposure / 1_000_000).toFixed(1)}M exposed, Day 21 ${day21.protectedRevenuePercent}% at $${(day21.spend / 1000).toFixed(0)}K`);
