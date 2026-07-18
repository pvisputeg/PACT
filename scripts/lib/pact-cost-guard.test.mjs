import { describe, expect, it } from 'vitest';
import {
  acknowledgeUnsettledCall,
  estimateCostUsd,
  reconcileCall,
  reserveCall,
  resolveBudget,
  totalCommittedUsd,
} from './pact-cost-guard.mjs';

describe('PACT API cost guard', () => {
  it('enforces the hard project cap', () => {
    expect(resolveBudget('4.50')).toBe(4.5);
    expect(() => resolveBudget('5.01')).toThrow('no more than $5.00');
    expect(() => resolveBudget('not-a-number')).toThrow();
  });

  it('prices GPT-5.6 input and output conservatively', () => {
    expect(estimateCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000 })).toBe(35);
    expect(estimateCostUsd({ inputTokens: 10_000, outputTokens: 5_000 })).toBe(0.2);
  });

  it('reserves before a call and reconciles to actual usage', () => {
    const ledger = { version: 1, budgetCapUsd: 1, entries: [] };
    reserveCall(ledger, { id: 'trace:lead', agent: 'lead', costUsd: 0.4 });
    expect(totalCommittedUsd(ledger)).toBe(0.4);

    reconcileCall(ledger, 'trace:lead', { requests: 1, inputTokens: 10_000, outputTokens: 5_000 });
    expect(totalCommittedUsd(ledger)).toBe(0.2);
    expect(ledger.entries[0]).toMatchObject({ status: 'settled', requests: 1 });
  });

  it('blocks excess spend and an unresolved repeat', () => {
    const ledger = { version: 1, budgetCapUsd: 0.5, entries: [] };
    reserveCall(ledger, { id: 'trace:auditor', agent: 'auditor', costUsd: 0.4 });
    expect(() => reserveCall(ledger, { id: 'trace-2:auditor', agent: 'auditor', costUsd: 0.05 })).toThrow('unsettled');
    expect(() => reserveCall(ledger, { id: 'trace:lead', agent: 'lead', costUsd: 0.2 })).toThrow('exceed');
  });

  it('keeps an explicitly acknowledged interrupted call in the spend total', () => {
    const ledger = { version: 1, budgetCapUsd: 1, entries: [] };
    reserveCall(ledger, { id: 'trace:auditor', agent: 'auditor', costUsd: 0.3 });
    expect(acknowledgeUnsettledCall(ledger, 'auditor')).toMatchObject({ status: 'charged-uncertain', costUsd: 0.3 });
    reserveCall(ledger, { id: 'trace-2:auditor', agent: 'auditor', costUsd: 0.3 });
    expect(totalCommittedUsd(ledger)).toBe(0.6);
  });
});
