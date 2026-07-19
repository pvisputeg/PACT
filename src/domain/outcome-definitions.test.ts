import { describe, expect, it } from 'vitest';
import { OUTCOME_DEFINITIONS } from './outcome-definitions';

describe('outcome definitions', () => {
  it('models a reusable contract across distinct enterprise domains', () => {
    expect(OUTCOME_DEFINITIONS).toHaveLength(6);
    expect(new Set(OUTCOME_DEFINITIONS.map((outcome) => outcome.id)).size).toBe(6);
    expect(new Set(OUTCOME_DEFINITIONS.map((outcome) => outcome.domain)).size).toBeGreaterThanOrEqual(5);

    for (const outcome of OUTCOME_DEFINITIONS) {
      expect(outcome.contract.objective.length).toBeGreaterThan(20);
      expect(outcome.contract.metric.length).toBeGreaterThan(4);
      expect(outcome.contract.target.length).toBeGreaterThan(4);
      expect(outcome.contract.deadline.length).toBeGreaterThan(4);
      expect(outcome.contract.constraints.length).toBeGreaterThanOrEqual(3);
      expect(outcome.contract.decisionAuthority).toBe(outcome.owner);
    }
  });

  it('keeps implementation boundaries explicit', () => {
    const implemented = OUTCOME_DEFINITIONS.filter((outcome) => outcome.implementation === 'end-to-end synthetic workflow');
    const illustrative = OUTCOME_DEFINITIONS.filter((outcome) => outcome.implementation === 'illustrative typed contract');

    expect(implemented.map((outcome) => outcome.id)).toEqual(['northstar-material-recovery']);
    expect(illustrative).toHaveLength(5);
  });
});
