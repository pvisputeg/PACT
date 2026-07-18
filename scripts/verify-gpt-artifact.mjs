import { readFile } from 'node:fs/promises';
import { collectEvidenceIds, reviewGenuineArtifact } from './lib/pact-artifact-review.mjs';

const root = new URL('../', import.meta.url);
const artifactPath = process.argv[2] || 'public/artifacts/gpt-5.6/strategy-and-audit.json';

const [artifact, scenario, metricContract, outcomeContract] = await Promise.all([
  readJson(artifactPath),
  readJson('data/otif-recovery.scenario.json'),
  readJson('contracts/metric-contract.json'),
  readJson('contracts/outcome-contract.json'),
]);
const knownEvidenceIds = collectEvidenceIds({ scenario, metricContract, outcomeContract });
const review = reviewGenuineArtifact(artifact, knownEvidenceIds);

console.log(JSON.stringify({ artifactPath, ...review }, null, 2));
if (!review.ready) process.exitCode = 1;

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

