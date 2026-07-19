import { z } from 'zod';
import type { WorkflowState } from './types';

export const WORKFLOW_STORAGE_VERSION = 2 as const;

const workflowStageSchema = z.enum(['investigation', 'define', 'proof', 'impact', 'strategy', 'audit', 'approval', 'execution', 'outcome', 'closeout']);
const actionStatusSchema = z.enum(['proposed', 'blocked', 'authorized', 'ready', 'executing', 'complete', 'failed']);
const actionTeamSchema = z.enum(['Finance', 'Procurement', 'Quality', 'Manufacturing', 'Logistics', 'Workforce Operations', 'Customer Operations', 'Outcome Office']);
const decisionSchema = z.enum(['approved', 'approved_with_conditions', 'rejected', 'revision_requested']);

const integrityCheckSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(['pass', 'fail']),
  detail: z.string().min(1),
}).strict();

const verificationSchema = z.object({
  classification: z.enum(['verified_material_risk', 'data_defect', 'calculation_defect', 'insufficient_evidence']),
  confidence: z.enum(['high', 'medium', 'low']),
  erpCoverageDays: z.number().nonnegative(),
  usableCoverageDays: z.number().nonnegative(),
  discrepancyDays: z.number().nonnegative(),
  checks: z.array(integrityCheckSchema),
  evidenceIds: z.array(z.string().min(1)),
  explanation: z.string().min(1),
}).strict();

const pactActionSchema = z.object({
  actionId: z.string().regex(/^ACT-\d{3}$/),
  description: z.string().min(1),
  owner: z.string().min(1),
  team: actionTeamSchema,
  rationale: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)),
  dependencies: z.array(z.string().regex(/^ACT-\d{3}$/)),
  preconditions: z.array(z.string()),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  estimatedCost: z.number().nonnegative(),
  estimatedEffect: z.number(),
  approvalRequired: z.boolean(),
  toolOperation: z.string().min(1),
  deadline: z.string().min(1),
  status: actionStatusSchema,
  result: z.record(z.string(), z.unknown()).nullable(),
  recovery: z.string().min(1),
}).strict();

const auditFindingSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(['blocking', 'material', 'advisory']),
  title: z.string().min(1),
  detail: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)),
  resolved: z.boolean(),
}).strict();

const approvalSchema = z.object({
  approver: z.string().min(1),
  authority: z.string().min(1),
  decidedAt: z.string().datetime(),
  contractVersion: z.string().min(1),
  planVersion: z.string().min(1),
  decision: decisionSchema,
  rationale: z.string().min(1),
  conditions: z.array(z.string()),
  scope: z.array(z.string()),
}).strict();

const auditAcceptanceSchema = z.object({
  conditionSetId: z.string().min(1),
  sourceResponseId: z.string().min(1),
  requiredConditionCount: z.number().int().nonnegative(),
  adoptedAt: z.string().datetime(),
  adoptedBy: z.string().min(1),
}).strict();

const ledgerEventSchema = z.object({
  eventId: z.string().regex(/^EVT-\d{3}$/),
  timestamp: z.string().datetime(),
  eventType: z.string().min(1),
  source: z.string().min(1),
  status: z.string().min(1),
  correlationId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
}).strict();

export const workflowStateSchema = z.object({
  stage: workflowStageSchema,
  objective: z.string().min(1),
  contractConfirmed: z.boolean(),
  contractHash: z.string().nullable(),
  verification: verificationSchema.nullable(),
  selectedStrategyId: z.enum(['STR-SPEED', 'STR-COST', 'STR-BALANCED']),
  actions: z.array(pactActionSchema),
  auditFindings: z.array(auditFindingSchema),
  auditConditionAcceptance: auditAcceptanceSchema.nullable(),
  approval: approvalSchema.nullable(),
  unsafeAttemptDemonstrated: z.boolean(),
  unsafeAttemptMessage: z.string().nullable(),
  currentDay: z.number().int().nonnegative(),
  ledger: z.array(ledgerEventSchema).min(1),
}).strict().superRefine((state, context) => {
  const actionIds = new Set(state.actions.map((action) => action.actionId));
  for (const action of state.actions) {
    for (const dependency of action.dependencies) {
      if (!actionIds.has(dependency)) context.addIssue({ code: 'custom', message: `${action.actionId} references unknown dependency ${dependency}` });
    }
  }

  const authorized = state.approval?.decision === 'approved' || state.approval?.decision === 'approved_with_conditions';
  const materialStage = ['execution', 'outcome', 'closeout'].includes(state.stage);
  if (materialStage && !authorized) context.addIssue({ code: 'custom', message: `${state.stage} requires an approved Action Contract` });
  if (authorized && (!state.contractConfirmed || state.verification?.classification !== 'verified_material_risk' || !state.auditConditionAcceptance)) {
    context.addIssue({ code: 'custom', message: 'Approved authority requires contract, verified signal, and adopted audit conditions' });
  }
  if (state.actions.some((action) => action.status === 'complete') && !authorized) {
    context.addIssue({ code: 'custom', message: 'Completed material actions require approved authority' });
  }
  if ((state.approval?.decision === 'rejected' || state.approval?.decision === 'revision_requested') && state.approval.scope.length > 0) {
    context.addIssue({ code: 'custom', message: 'Rejected or revision-requested decisions cannot retain scope' });
  }
});

const envelopeSchema = z.object({
  storageVersion: z.literal(WORKFLOW_STORAGE_VERSION),
  scenarioId: z.string().min(1),
  state: workflowStateSchema,
}).strict();

export type WorkflowRestoreResult =
  | { ok: true; state: WorkflowState; reason: null }
  | { ok: false; state: null; reason: string };

export function serializeWorkflowState(state: WorkflowState, scenarioId: string): string {
  return JSON.stringify(envelopeSchema.parse({ storageVersion: WORKFLOW_STORAGE_VERSION, scenarioId, state }));
}

export function restoreWorkflowState(raw: string, expectedScenarioId: string): WorkflowRestoreResult {
  try {
    const parsed = envelopeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ok: false, state: null, reason: 'Saved workflow failed strict schema or policy validation.' };
    if (parsed.data.scenarioId !== expectedScenarioId) return { ok: false, state: null, reason: 'Saved workflow belongs to a different scenario.' };
    return { ok: true, state: parsed.data.state as WorkflowState, reason: null };
  } catch {
    return { ok: false, state: null, reason: 'Saved workflow JSON is unreadable.' };
  }
}
