import { z } from 'zod';

const modelFindingSchema = z.object({
  severity: z.enum(['blocking', 'material', 'advisory']),
  title: z.string().min(1),
  detail: z.string().min(1),
  evidenceIds: z.array(z.string()),
}).strict();

export const aiArtifactSchema = z.object({
  generatedAt: z.string().datetime(),
  model: z.string().min(1),
  provider: z.enum(['OpenAI Agents SDK', 'Local schema fixture']),
  provenance: z.object({
    kind: z.enum(['genuine', 'fixture']),
    framework: z.enum(['@openai/agents', 'offline-fixture']),
    orchestration: z.literal('manager'),
    planAgent: z.string().min(1),
    auditAgent: z.string().min(1),
    planResponseId: z.string().min(1),
    auditResponseId: z.string().min(1),
    planTraceId: z.string().min(1),
    auditTraceId: z.string().min(1),
  }).strict(),
  usage: z.object({
    requests: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    estimatedCostUsd: z.number().nonnegative(),
    projectCommittedUsd: z.number().nonnegative(),
    projectBudgetUsd: z.number().positive().max(5),
  }).strict(),
  plan: z.object({
    executiveSummary: z.string().min(1),
    recommendedStrategyId: z.enum(['STR-MARGIN', 'STR-SPEED', 'STR-BALANCED']),
    strategyRationale: z.string().min(1),
    evidenceCitations: z.array(z.string()),
    assumptions: z.array(z.object({
      statement: z.string(),
      evidenceStatus: z.enum(['supported', 'partially_supported', 'unsupported']),
    }).strict()),
    crossTeamPriorities: z.array(z.object({
      team: z.enum(['Finance', 'Procurement', 'Manufacturing', 'Logistics', 'Customer', 'Outcome Office']),
      priority: z.string(),
      dependency: z.string(),
    }).strict()),
    residualRisks: z.array(z.string()),
  }).strict(),
  audit: z.object({
    verdict: z.enum(['approve_with_conditions', 'block']),
    findings: z.array(modelFindingSchema),
    unsupportedClaims: z.array(z.string()),
    requiredConditions: z.array(z.string()),
    counterfactual: z.object({ scenario: z.string(), expectedImpact: z.string() }).strict(),
  }).strict(),
}).strict();

export type AiArtifact = z.infer<typeof aiArtifactSchema>;
