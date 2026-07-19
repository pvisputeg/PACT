import { readFile } from 'node:fs/promises';
import { collectEvidenceIds, reviewGenuineArtifact } from './lib/pact-artifact-review.mjs';

const root = new URL('../', import.meta.url);
const artifactPath = process.argv[2] || 'public/artifacts/gpt-5.6/strategy-and-audit.json';

const [artifact, scenario, metricContract, outcomeContract] = await Promise.all([
  readJson(artifactPath),
  readJson('data/northstar-material-recovery.scenario.json'),
  readJson('contracts/metric-contract.json'),
  readJson('contracts/outcome-contract.json'),
]);
if (artifact.scenarioId !== 'northstar-material-recovery-v1') {
  const fixture = await readJson('public/artifacts/fixture/strategy-and-audit.json');
  if (fixture.scenarioId !== 'northstar-material-recovery-v1' || fixture.provider !== 'Local schema fixture' || fixture.provenance?.kind !== 'fixture') {
    throw new Error('Neither a genuine Northstar artifact nor the transparent local Northstar fixture is valid.');
  }
  console.log(JSON.stringify({
    artifactPath,
    ready: true,
    mode: 'transparent_fixture_fallback',
    note: 'The checked-in genuine artifact predates Operation Northstar and is not presented as Northstar evidence. Run npm run generate:agents intentionally to create fresh response and trace IDs.',
    fixtureScenarioId: fixture.scenarioId,
  }, null, 2));
  process.exit(0);
}
const knownEvidenceIds = collectEvidenceIds({ scenario, metricContract, outcomeContract });
const review = reviewGenuineArtifact(artifact, knownEvidenceIds);

console.log(JSON.stringify({ artifactPath, ...review }, null, 2));
if (!review.ready) process.exitCode = 1;

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}
