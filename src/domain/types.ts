export type EvidenceLabel = 'FACT' | 'CALCULATED' | 'INFERRED' | 'ESTIMATED' | 'SIMULATED' | 'OBSERVED';
export type WorkflowStage = 'signal' | 'proof' | 'impact' | 'strategy' | 'approval' | 'execution' | 'outcome';
export type ActionStatus = 'proposed' | 'blocked' | 'ready' | 'executing' | 'complete' | 'failed';

export interface IntegrityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail';
  detail: string;
}

export interface Contributor {
  id: string;
  name: string;
  share: number;
  type: 'observed_association';
  team: string;
  affectedEntities: number;
  uncertainty: 'low' | 'medium' | 'high';
  evidenceIds: string[];
}

export interface Strategy {
  id: string;
  name: string;
  cost: number;
  projectedDay14: number;
  projectedDay21: number;
  timeToImpactDays: number;
  risk: string;
  assumptions: string[];
}

export interface Observation {
  day: number;
  otif: number;
  componentCoverage: number;
  scheduleAdherence: number;
  pickupAcceptance: number;
  qualityEscapeDelta: number;
  status: string;
}

export interface Scenario {
  scenarioId: string;
  version: string;
  seed: number;
  generatedAt: string;
  periods: Record<'baseline' | 'current', { eligibleOrders: number; onTimeInFullOrders: number }>;
  integrityChecks: IntegrityCheck[];
  contributors: Contributor[];
  impact: {
    ordersAtRisk: { value: number; label: EvidenceLabel; evidenceIds: string[] };
    strategicCustomers: { value: number; label: EvidenceLabel; evidenceIds: string[] };
    delayedRevenueExposure: { value: number; currency: string; label: EvidenceLabel; assumptions: string[]; evidenceIds: string[] };
    premiumFreightExposure: { value: number; currency: string; label: EvidenceLabel; assumptions: string[]; evidenceIds: string[] };
  };
  strategies: Strategy[];
  observations: Observation[];
}

export interface VerificationResult {
  classification: 'verified_operational' | 'data_defect' | 'calculation_defect' | 'insufficient_evidence';
  baseline: number;
  current: number;
  delta: number;
  checks: IntegrityCheck[];
  evidenceIds: string[];
  explanation: string;
}

export interface PactAction {
  actionId: string;
  description: string;
  owner: string;
  team: 'Finance' | 'Procurement' | 'Manufacturing' | 'Logistics' | 'Customer' | 'Outcome Office';
  rationale: string;
  evidenceIds: string[];
  preconditions: string[];
  dependencies: string[];
  parameters: Record<string, string | number | boolean>;
  estimatedCost: number;
  estimatedEffect: number;
  approvalRequired: boolean;
  toolOperation: string;
  status: ActionStatus;
  result: Record<string, unknown> | null;
  recovery: string;
}

export interface AuditFinding {
  id: string;
  severity: 'blocking' | 'material' | 'advisory';
  title: string;
  detail: string;
  evidenceIds: string[];
  resolved: boolean;
}

export interface ApprovalRecord {
  approver: string;
  decidedAt: string;
  contractVersion: string;
  planVersion: string;
  decision: 'approved' | 'rejected' | 'revision_requested';
}

export interface LedgerEvent {
  eventId: string;
  timestamp: string;
  eventType: string;
  source: string;
  status: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface WorkflowState {
  stage: WorkflowStage;
  objective: string;
  contractConfirmed: boolean;
  contractHash: string | null;
  verification: VerificationResult | null;
  selectedStrategyId: string | null;
  actions: PactAction[];
  auditFindings: AuditFinding[];
  approval: ApprovalRecord | null;
  currentDay: number;
  ledger: LedgerEvent[];
}
