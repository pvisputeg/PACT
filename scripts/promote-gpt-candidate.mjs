import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { collectEvidenceIds, reviewGenuineArtifact } from './lib/pact-artifact-review.mjs';

const root = new URL('../', import.meta.url);
const candidatePath = 'artifacts/gpt-5.6/candidate-artifact.json';
const [artifact, scenario, metricContract, outcomeContract] = await Promise.all([
  readJson(candidatePath),
  readJson('data/otif-recovery.scenario.json'),
  readJson('contracts/metric-contract.json'),
  readJson('contracts/outcome-contract.json'),
]);
const review = reviewGenuineArtifact(artifact, collectEvidenceIds({ scenario, metricContract, outcomeContract }));
if (!review.ready) throw new Error(`Candidate artifact is not release-ready: ${JSON.stringify(review)}`);

const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
await mkdir(new URL('public/artifacts/gpt-5.6/', root), { recursive: true });
await Promise.all([
  writeFile(new URL('artifacts/gpt-5.6/strategy-and-audit.json', root), serialized, 'utf8'),
  writeFile(new URL('public/artifacts/gpt-5.6/strategy-and-audit.json', root), serialized, 'utf8'),
]);
console.log(`Promoted reviewed candidate ${artifact.provenance.auditResponseId} without an API call.`);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), 'utf8'));
}

