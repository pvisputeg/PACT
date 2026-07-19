import { z } from 'zod';

const conciseText = z.string().min(1).max(500);
const atomicClaim = z.string().min(10).max(220);
const atomicCondition = z.string().min(10).max(260);

export const planSynthesisSchema = z.strictObject({
  executiveSummary: conciseText,
  recommendedStrategyId: z.enum(['STR-SPEED', 'STR-COST', 'STR-BALANCED']),
  strategyRationale: conciseText,
  evidenceCitations: z.array(z.string().min(1).max(180)).min(1).max(12),
  assumptions: z.array(z.strictObject({
    statement: conciseText,
    evidenceStatus: z.enum(['supported', 'partially_supported', 'unsupported']),
  })).max(4),
  crossTeamPriorities: z.array(z.strictObject({
    team: z.enum(['Finance', 'Procurement', 'Quality', 'Manufacturing', 'Logistics', 'Workforce Operations', 'Customer Operations', 'Outcome Office']),
    priority: conciseText,
    dependency: conciseText,
  })).min(1).max(8),
  residualRisks: z.array(conciseText).max(4),
});

export const independentAuditSchema = z.strictObject({
  verdict: z.enum(['approve_with_conditions', 'block']),
  findings: z.array(z.strictObject({
    severity: z.enum(['blocking', 'material', 'advisory']),
    title: z.string().min(1).max(100),
    detail: conciseText,
    evidenceIds: z.array(z.string().min(1).max(120)).max(8),
  })).max(5),
  unsupportedClaims: z.array(atomicClaim).max(5),
  requiredConditions: z.array(atomicCondition).min(1).max(5),
  counterfactual: z.strictObject({
    scenario: conciseText,
    expectedImpact: conciseText,
  }),
});
