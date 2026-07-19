import { z } from 'zod';
import metricContractJson from '../../contracts/metric-contract.json';
import outcomeContractJson from '../../contracts/outcome-contract.json';

const measurementSchema = z.object({
  value: z.number(),
  unit: z.string().min(1),
  label: z.enum(['OBSERVED', 'CALCULATED']),
});

const targetSchema = z.object({
  value: z.number(),
  unit: z.string().min(1),
  deadlineDay: z.number().int().positive(),
});

export const metricContractSchema = z.object({
  $schema: z.string().optional(),
  metricId: z.string().min(1),
  name: z.string().min(1),
  abbreviation: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  businessPurpose: z.string().min(1),
  owner: z.string().min(1),
  entityGrain: z.literal('committed_revenue'),
  numerator: z.string().min(1),
  denominator: z.string().min(1),
  exclusions: z.array(z.string()),
  dimensions: z.array(z.string()),
  invariants: z.array(z.string()).min(1),
  historicalControl: z.object({
    period: z.string(),
    expectedValue: z.number().min(0).max(100),
    tolerancePercentagePoints: z.number().nonnegative(),
  }),
  contentHash: z.string(),
});

export const outcomeContractSchema = z.object({
  $schema: z.string().optional(),
  outcomeId: z.string().min(1),
  version: z.string(),
  status: z.enum(['draft', 'confirmed', 'approved', 'closed']),
  objective: z.string().min(20),
  businessSignal: z.string().min(10),
  baseline: measurementSchema,
  current: measurementSchema,
  target: targetSchema,
  interimTarget: targetSchema,
  hardConstraints: z.array(z.object({
    id: z.string(),
    rule: z.string(),
    value: z.unknown(),
    unit: z.string().optional(),
  })).min(1),
  softConstraints: z.array(z.string()),
  leadingIndicators: z.array(z.string()),
  laggingIndicators: z.array(z.string()),
  businessConsequences: z.array(z.string()),
  requiredEvidence: z.array(z.string()),
  requiredApprovals: z.array(z.string()).min(1),
  permittedActionClasses: z.array(z.string()).min(1),
  contentHash: z.string(),
});

export const actionContractSchema = z.object({
  actionId: z.string().regex(/^ACT-\d{3}$/),
  description: z.string().min(5),
  owner: z.string().min(1),
  team: z.enum(['Finance', 'Procurement', 'Quality', 'Manufacturing', 'Logistics', 'Workforce Operations', 'Customer Operations', 'Outcome Office']),
  rationale: z.string().min(10),
  evidenceIds: z.array(z.string()).min(1),
  preconditions: z.array(z.string()),
  dependencies: z.array(z.string().regex(/^ACT-\d{3}$/)),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  estimatedCost: z.number().nonnegative(),
  estimatedEffect: z.number(),
  approvalRequired: z.boolean(),
  toolOperation: z.string().min(1),
  deadline: z.string().min(1),
  status: z.enum(['proposed', 'blocked', 'authorized', 'ready', 'executing', 'complete', 'failed']),
  result: z.record(z.string(), z.unknown()).nullable(),
  recovery: z.string().min(1),
});

export const metricContract = metricContractSchema.parse(metricContractJson);
export const outcomeContract = outcomeContractSchema.parse(outcomeContractJson);
