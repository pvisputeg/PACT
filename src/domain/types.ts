export type EvidenceLabel = 'FACT' | 'CALCULATED' | 'INFERRED' | 'ESTIMATED' | 'SIMULATED' | 'OBSERVED';
export type WorkflowStage = 'investigation' | 'define' | 'proof' | 'impact' | 'strategy' | 'audit' | 'approval' | 'execution' | 'outcome' | 'closeout';
export type ActionStatus = 'proposed' | 'blocked' | 'authorized' | 'ready' | 'executing' | 'complete' | 'failed';
export type ActionTeam = 'Finance' | 'Procurement' | 'Quality' | 'Manufacturing' | 'Logistics' | 'Workforce Operations' | 'Customer Operations' | 'Outcome Office';

export interface IntegrityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail';
  detail: string;
}

export interface Strategy {
  id: 'STR-SPEED' | 'STR-COST' | 'STR-BALANCED';
  name: string;
  projectedProtectedRevenuePercent: number;
  projectedDay14ProtectedRevenuePercent: number;
  estimatedCost: number;
  durationDays: number;
  confidence: string;
  customerRisk: string;
  qualityRisk: string;
  residualRisk: string;
  actions: string[];
  assumptions: string[];
  dependencies: string[];
  downsideCase: string;
}

export interface Observation {
  day: number;
  label: 'SIMULATED' | 'OBSERVED';
  revenueExposure: number;
  protectedRevenuePercent: number;
  projectedProtectionPercent: number;
  inventoryCoverageDays: number;
  ordersProtected: number;
  ordersAtRisk: number;
  spend: number;
  lineCRisk: string;
  status: string;
}

export interface ScenarioAction {
  actionId: string;
  description: string;
  owner: string;
  team: ActionTeam;
  evidenceIds: string[];
  dependencies: string[];
  preconditions: string[];
  parameters: Record<string, string | number | boolean>;
  estimatedCost: number;
  estimatedEffect: number;
  toolOperation: string;
  deadline: string;
  recovery: string;
}

export interface Scenario {
  scenarioId: string;
  version: string;
  seed: number;
  generatedAt: string;
  synthetic: boolean;
  enterprise: { id: string; name: string; description: string };
  plant: {
    id: string;
    name: string;
    location: string;
    currentShift: string;
    activeOperators: number;
    activeProductionLines: number;
    autonomousVehicles: number;
    inboundShipmentsDueToday: number;
    committedUnits21Days: number;
    lines: Array<{ id: string; name: string; status: string; utilization: number; product: string; risk: string; coverageDays: number; restartDay?: number; materialDependency?: string }>;
    workCenters: Array<{ id: string; name: string; status: string; criticality: string; dependency: string; forecast: string }>;
    workforce: { shiftsAtRisk: number; weekendShiftsAtRisk: number; laborConfirmationRequired: boolean };
  };
  product: { id: string; name: string; components: string[] };
  signal: { id: string; title: string; receivedAt: string; source: string; classification: string; initialConfidence: string; freshnessMinutes: number; materialId: string; shipmentId: string; expectedDelayDays: number; assignedInvestigator: string };
  material: { id: string; name: string; usage: string; consumptionIncreasePercent: number; approvedSupplierIds: string[]; conditionalSupplierIds: string[] };
  shipment: { id: string; vessel: string; route: string; status: string; delayDays: number; originalArrival: string; revisedArrival: string; evidenceIds: string[] };
  inventory: {
    erpReportedCoverageDays: number;
    qualityHoldDays: number;
    allocatedDays: number;
    incompatibleBatchDays: number;
    usableCoverageDays: number;
    lots: Array<{ id: string; state: string; coverageDays: number; evidenceId: string }>;
  };
  verificationPolicy: {
    requiredControlIds: string[];
    requiredStatus: 'pass';
  };
  verificationControls: IntegrityCheck[];
  outcomeContract: {
    id: string;
    name: string;
    domain: string;
    question: string;
    baselineExposedRevenue: number;
    targetProtectedRevenuePercent: number;
    deadlineDays: number;
    maximumBudget: number;
    constraints: string[];
    prohibitedActions: string[];
    authorities: Record<string, string>;
  };
  impact: {
    ordersAtRisk: number;
    strategicCustomers: number;
    productionCellsExposed: number;
    manufacturingShiftsAtRisk: number;
    logisticsContractsAffected: number;
    revenueExposure: number;
    penaltyExposure: number;
    milestoneLinkedCustomers: number;
    relationshipCriticalCustomers: number;
    orderSegments: Array<{ id: string; orders: number; customers: number; exposedRevenue: number }>;
    cascade: string[];
    dependencies: Array<{ id: string; domain: string; label: EvidenceLabel; detail: string; evidenceIds: string[] }>;
  };
  strategies: Strategy[];
  audit: {
    packetId: string;
    conditionSetId: string;
    verdict: string;
    findings: Array<{ id: string; severity: 'blocking' | 'material' | 'advisory'; title: string; detail: string; evidenceIds: string[] }>;
    requiredConditions: string[];
  };
  actionContract: { id: string; maximumBudget: number; supplierCommitmentLimit: number; decision: string; conditions: string[]; unlockedActionClasses: string[] };
  actionGraph: ScenarioAction[];
  plantStateProgression: Array<{
    id: string;
    label: string;
    coverageDays: number;
    ordersProtected: number;
    lineCRisk: string;
    phase: string;
    unlockActionId: string | null;
  }>;
  observations: Observation[];
  closeout: {
    status: string;
    targetProtectedRevenuePercent: number;
    projectedProtectedRevenuePercent: number;
    observedProtectedRevenuePercent: number;
    finalSpend: number;
    budget: number;
    strategicCustomersLost: number;
    qualityIncidents: number;
    unauthorizedCustomerCommunications: number;
    acceptedBy: string;
    originalExposure: number;
  };
  lessons: Array<{ id: string; text: string; tags: string[]; evidenceIds: string[] }>;
  replay: Array<{
    id: string;
    title: string;
    stage: WorkflowStage;
    coverageDays: number;
    risk: string;
    ledgerEventType: string;
    provenanceLabel: string;
  }>;
}

export interface VerificationResult {
  classification: 'verified_material_risk' | 'data_defect' | 'calculation_defect' | 'insufficient_evidence';
  confidence: 'high' | 'medium' | 'low';
  erpCoverageDays: number;
  usableCoverageDays: number;
  discrepancyDays: number;
  checks: IntegrityCheck[];
  evidenceIds: string[];
  explanation: string;
}

export interface PactAction extends ScenarioAction {
  rationale: string;
  approvalRequired: boolean;
  status: ActionStatus;
  result: Record<string, unknown> | null;
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
  authority: string;
  decidedAt: string;
  contractVersion: string;
  planVersion: string;
  decision: 'approved' | 'approved_with_conditions' | 'rejected' | 'revision_requested';
  rationale: string;
  conditions: string[];
  scope: string[];
}

export interface AuditConditionAcceptance {
  conditionSetId: string;
  sourceResponseId: string;
  requiredConditionCount: number;
  adoptedAt: string;
  adoptedBy: string;
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
  selectedStrategyId: Strategy['id'];
  actions: PactAction[];
  auditFindings: AuditFinding[];
  auditConditionAcceptance: AuditConditionAcceptance | null;
  approval: ApprovalRecord | null;
  unsafeAttemptDemonstrated: boolean;
  unsafeAttemptMessage: string | null;
  currentDay: number;
  ledger: LedgerEvent[];
}
