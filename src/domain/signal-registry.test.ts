import { describe, expect, it } from 'vitest';
import { enterpriseSignals, formatCompactMoney, formatSignalTime, missionControlHeadline, primarySignal, signalQueueSummary } from './signal-registry';
import { scenario } from './engine';

describe('enterprise signal registry', () => {
  it('derives the material Northstar signal from the canonical scenario', () => {
    expect(primarySignal.id).toBe(scenario.signal.id);
    expect(primarySignal.materialityExposure).toBe(scenario.impact.revenueExposure);
    expect(primarySignal.evidenceIds).toEqual(scenario.shipment.evidenceIds);
  });

  it('exposes the complete critical and watch queue', () => {
    const summary = signalQueueSummary();
    expect(enterpriseSignals).toHaveLength(4);
    expect(summary).toMatchObject({ criticalCount: 1, watchCount: 3, materialExposure: 8_700_000 });
    expect(summary.headline).toBe('One critical signal may threaten $8.7M in committed revenue.');
  });

  it('recomputes the executive headline when the mock registry changes', () => {
    const escalatedSignals = enterpriseSignals.map((signal, index) => index === 1
      ? { ...signal, severity: 'critical' as const }
      : signal);
    const summary = signalQueueSummary(escalatedSignals);

    expect(summary).toMatchObject({ criticalCount: 2, watchCount: 2, materialExposure: 9_340_000 });
    expect(summary.headline).toBe('2 critical signals may threaten $9.3M in committed revenue.');
  });

  it('upgrades the headline only after every critical signal is verified', () => {
    expect(missionControlHeadline(enterpriseSignals, [primarySignal.id]))
      .toBe('One verified material disruption threatens $8.7M in committed revenue.');
  });

  it('derives deterministic scenario presentation values', () => {
    expect(formatCompactMoney(8_700_000)).toBe('$8.7M');
    expect(formatSignalTime(scenario.signal.receivedAt)).toBe('09:12 EDT');
  });
});
