export interface PactRuntimeState {
  verified: boolean;
  auditConditionsAdopted: boolean;
  humanApproved: boolean;
  completedActionIds: string[];
}

export interface SharedAction {
  actionId: string;
  description: string;
  owner: string;
  team: 'Finance' | 'Procurement' | 'Quality' | 'Manufacturing' | 'Logistics' | 'Workforce Operations' | 'Customer Operations' | 'Outcome Office';
  rationale: string;
  evidenceIds: string[];
  preconditions: string[];
  dependencies: string[];
  parameters: Record<string, string | number | boolean>;
  estimatedCost: number;
  estimatedEffect: number;
  approvalRequired: boolean;
  toolOperation: string;
  deadline: string;
  recovery: string;
}

export interface SharedActionDefinition {
  action: SharedAction;
  mcp: { name: string; description: string; inputSchema: Record<string, unknown> };
}

export const RUNTIME_VERSION: string;
export const PLAN_ID: string;
export const CORRELATION_ID: string;
export const AUDIT_CONDITION_SET_ID: string;
export const MAXIMUM_BUDGET: number;
export const ACTION_GRAPH: SharedActionDefinition[];
export const OBSERVATIONS: Record<number, Record<string, string | number>>;
export const MCP_TOOL_DEFINITIONS: Array<{ operation: string; name: string; description: string; inputSchema: Record<string, unknown> }>;
export function createRuntimeState(): PactRuntimeState;
export function executePactOperation(state: PactRuntimeState, operation: string, args?: Record<string, unknown>): { state: PactRuntimeState; result: Record<string, unknown> };
