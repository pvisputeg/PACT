import { readFile } from 'node:fs/promises';

const scenario = JSON.parse(await readFile(new URL('../data/otif-recovery.scenario.json', import.meta.url), 'utf8'));
const baseline = Number((scenario.periods.baseline.onTimeInFullOrders / scenario.periods.baseline.eligibleOrders * 100).toFixed(1));
const current = Number((scenario.periods.current.onTimeInFullOrders / scenario.periods.current.eligibleOrders * 100).toFixed(1));
const shares = scenario.contributors.reduce((sum, item) => sum + item.share, 0);
const balanced = scenario.strategies.find((item) => item.id === 'STR-BALANCED');
const day21 = scenario.observations.find((item) => item.day === 21);

if (baseline !== 84.3 || current !== 72.4 || shares !== 100 || balanced.cost > 75000 || day21.otif !== 82.1) {
  throw new Error('Scenario verification failed');
}

console.log(`PACT scenario verified: ${baseline}% -> ${current}%, ${shares}% contributors, Day 21 ${day21.otif}%`);
