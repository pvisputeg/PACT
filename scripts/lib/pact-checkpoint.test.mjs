import { describe, expect, it } from 'vitest';
import { assertCheckpointCompatible, createCheckpointIdentity } from './pact-checkpoint.mjs';

const expected = createCheckpointIdentity({
  scenarioId: 'northstar-material-recovery-v1',
  model: 'gpt-5.6',
  planInput: 'immutable northstar packet',
});

describe('Agents SDK checkpoint identity', () => {
  it('accepts only the exact scenario, model, and evidence packet', () => {
    expect(assertCheckpointCompatible(expected, expected)).toBe(true);
  });

  it.each([
    [{ ...expected, scenarioId: 'otif-recovery-v1' }, 'scenarioId'],
    [{ ...expected, model: 'gpt-5.5' }, 'model'],
    [{ ...expected, evidencePacketHash: 'stale' }, 'evidencePacketHash'],
    [{ model: 'gpt-5.6' }, 'scenarioId'],
  ])('rejects a stale or legacy checkpoint before any paid audit call', (checkpoint, mismatch) => {
    expect(() => assertCheckpointCompatible(checkpoint, expected)).toThrow(mismatch);
  });
});
