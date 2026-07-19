import watchlistJson from '../../data/enterprise-signal-watchlist.json';
import { z } from 'zod';
import { scenario } from './engine';

export type SignalSeverity = 'critical' | 'watch';
export type SignalStatus = 'verification_required' | 'monitoring' | 'verified_material_risk';
export type WorkflowAvailability = 'end_to_end' | 'evidence_review';

export interface EnterpriseSignal {
  id: string;
  title: string;
  summary: string;
  receivedAt: string;
  source: string;
  domain: string;
  location: string;
  severity: SignalSeverity;
  status: SignalStatus;
  confidence: 'low' | 'medium' | 'high';
  freshnessMinutes: number;
  materialityExposure: number;
  materialityLabel: string;
  decisionWindowDays: number;
  assignedInvestigator: string;
  evidenceIds: string[];
  workflowAvailability: WorkflowAvailability;
}

const enterpriseSignalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  receivedAt: z.iso.datetime(),
  source: z.string().min(1),
  domain: z.string().min(1),
  location: z.string().min(1),
  severity: z.enum(['critical', 'watch']),
  status: z.enum(['verification_required', 'monitoring', 'verified_material_risk']),
  confidence: z.enum(['low', 'medium', 'high']),
  freshnessMinutes: z.number().int().nonnegative(),
  materialityExposure: z.number().nonnegative(),
  materialityLabel: z.string().min(1),
  decisionWindowDays: z.number().int().positive(),
  assignedInvestigator: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
  workflowAvailability: z.enum(['end_to_end', 'evidence_review']),
}).strict();

const northstarSignal: EnterpriseSignal = {
  id: scenario.signal.id,
  title: scenario.signal.title,
  summary: `${scenario.shipment.vessel} was diverted near the ${scenario.shipment.route}, delaying ${scenario.material.name} by ${scenario.shipment.delayDays} days.`,
  receivedAt: scenario.signal.receivedAt,
  source: scenario.signal.source,
  domain: scenario.outcomeContract.domain,
  location: scenario.plant.name,
  severity: 'critical',
  status: 'verification_required',
  confidence: scenario.signal.initialConfidence as EnterpriseSignal['confidence'],
  freshnessMinutes: scenario.signal.freshnessMinutes,
  materialityExposure: scenario.impact.revenueExposure,
  materialityLabel: `${scenario.impact.ordersAtRisk} orders · ${scenario.impact.strategicCustomers} strategic customers`,
  decisionWindowDays: scenario.outcomeContract.deadlineDays,
  assignedInvestigator: scenario.signal.assignedInvestigator,
  evidenceIds: [...scenario.shipment.evidenceIds],
  workflowAvailability: 'end_to_end',
};

const watchSignals = z.array(enterpriseSignalSchema).parse(watchlistJson);

export const enterpriseSignals: readonly EnterpriseSignal[] = [
  northstarSignal,
  ...watchSignals,
];

export const primarySignal = enterpriseSignals[0];

export function formatCompactMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatSignalTime(receivedAt: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(new Date(receivedAt));
}

export function signalQueueSummary(signals: readonly EnterpriseSignal[] = enterpriseSignals) {
  const critical = signals.filter((signal) => signal.severity === 'critical');
  const watch = signals.filter((signal) => signal.severity === 'watch');
  const materialExposure = critical.reduce((total, signal) => total + signal.materialityExposure, 0);
  return {
    criticalCount: critical.length,
    watchCount: watch.length,
    materialExposure,
    queueLabel: `${critical.length} CRITICAL · ${watch.length} WATCH`,
    headline: missionControlHeadline(signals),
    scenarioTime: formatSignalTime(primarySignal.receivedAt),
  };
}

export function missionControlHeadline(signals: readonly EnterpriseSignal[] = enterpriseSignals, verifiedSignalIds: readonly string[] = []): string {
  const critical = signals.filter((signal) => signal.severity === 'critical');
  const exposure = critical.reduce((total, signal) => total + signal.materialityExposure, 0);
  const allCriticalVerified = critical.length > 0 && critical.every((signal) => verifiedSignalIds.includes(signal.id));
  if (allCriticalVerified) {
    return `${critical.length === 1 ? 'One verified material disruption threatens' : `${critical.length} verified material disruptions threaten`} ${formatCompactMoney(exposure)} in committed revenue.`;
  }
  return `${critical.length === 1 ? 'One critical signal may threaten' : `${critical.length} critical signals may threaten`} ${formatCompactMoney(exposure)} in committed revenue.`;
}

export function statusLabel(status: SignalStatus): string {
  return status.replaceAll('_', ' ').toUpperCase();
}
