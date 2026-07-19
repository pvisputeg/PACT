import { createHash } from 'node:crypto';

export function createCheckpointIdentity({ scenarioId, model, planInput }) {
  if (!scenarioId || !model || !planInput) throw new Error('Checkpoint identity requires scenarioId, model, and planInput.');
  return {
    scenarioId,
    model,
    evidencePacketHash: createHash('sha256').update(planInput, 'utf8').digest('hex'),
  };
}

export function assertCheckpointCompatible(checkpoint, expected) {
  const actual = {
    scenarioId: checkpoint?.scenarioId,
    model: checkpoint?.model,
    evidencePacketHash: checkpoint?.evidencePacketHash,
  };
  const mismatches = Object.entries(expected)
    .filter(([key, value]) => actual[key] !== value)
    .map(([key]) => key);

  if (mismatches.length) {
    throw new Error(
      `Saved Outcome Lead checkpoint is stale or belongs to another evidence packet (${mismatches.join(', ')} mismatch). `
      + 'Run npm run generate:agents without --resume to create a fresh Operation Northstar plan.',
    );
  }
  return true;
}
