import { z } from 'zod';

const conciseText = z.string().min(1).max(500);

export const planSynthesisSchema = z.strictObject({
  executiveSummary: conciseText,
  recommendedStrategyId: z.enum(['STR-MARGIN', 'STR-SPEED', 'STR-BALANCED']),
  strategyRationale: conciseText,
  evidenceCitations: z.array(z.string().min(1).max(120)).min(1).max(12),
  assumptions: z.array(z.strictObject({
    statement: conciseText,
    evidenceStatus: z.enum(['supported', 'partially_supported', 'unsupported']),
  })).max(4),
  crossTeamPriorities: z.array(z.strictObject({
    team: z.enum(['Finance', 'Procurement', 'Manufacturing', 'Logistics', 'Customer', 'Outcome Office']),
    priority: conciseText,
    dependency: conciseText,
  })).min(1).max(6),
  residualRisks: z.array(conciseText).max(4),
});

export const independentAuditSchema = z.strictObject({
  verdict: z.enum(['approve_with_conditions', 'block']),
  findings: z.array(z.strictObject({
    severity: z.enum(['blocking', 'material', 'advisory']),
    title: z.string().min(1).max(100),
    detail: conciseText,
    evidenceIds: z.array(z.string().min(1).max(120)).max(8),
  })).max(3),
  unsupportedClaims: z.array(conciseText).max(3),
  requiredConditions: z.array(conciseText).max(3),
  counterfactual: z.strictObject({
    scenario: conciseText,
    expectedImpact: conciseText,
  }),
});

