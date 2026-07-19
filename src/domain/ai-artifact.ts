import { z } from 'zod';

const modelFindingSchema = z.object({
  severity: z.enum(['blocking', 'material', 'advisory']),
  title: z.string().min(1),
  detail: z.string().min(1),
  evidenceIds: z.array(z.string()),
}).strict();

export const aiArtifactSchema = z.object({
  scenarioId: z.literal('northstar-material-recovery-v1'),
  generatedAt: z.string().datetime(),
  model: z.string().min(1),
  provider: z.enum(['OpenAI Agents SDK', 'Local schema fixture']),
  releaseReview: z.object({
    status: z.enum(['unaltered', 'normalized']),
    reviewedAt: z.string().datetime(),
    method: z.string().min(1),
    sourceArtifact: z.string().min(1),
    normalizedFields: z.array(z.string()),
    semanticChanges: z.boolean(),
  }).strict().optional(),
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
    recommendedStrategyId: z.enum(['STR-SPEED', 'STR-COST', 'STR-BALANCED']),
    strategyRationale: z.string().min(1),
    evidenceCitations: z.array(z.string()),
    assumptions: z.array(z.object({
      statement: z.string(),
      evidenceStatus: z.enum(['supported', 'partially_supported', 'unsupported']),
    }).strict()),
    crossTeamPriorities: z.array(z.object({
      team: z.enum(['Finance', 'Procurement', 'Quality', 'Manufacturing', 'Logistics', 'Workforce Operations', 'Customer Operations', 'Outcome Office']),
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

export type ArtifactSelection = 'auto' | 'genuine' | 'fixture' | 'none';
export type ArtifactSource = 'genuine' | 'fixture';

export type ArtifactLoadResult =
  | {
    status: 'ready';
    selection: ArtifactSelection;
    artifact: AiArtifact;
    source: ArtifactSource;
    path: string;
    notice: string | null;
  }
  | {
    status: 'error';
    selection: ArtifactSelection;
    artifact: null;
    source: null;
    path: null;
    message: string;
  }
  | {
    status: 'disabled';
    selection: 'none';
    artifact: null;
    source: null;
    path: null;
    message: string;
  };

export const AI_ARTIFACT_PATHS = {
  genuine: './artifacts/gpt-5.6/strategy-and-audit.json',
  fixture: './artifacts/fixture/strategy-and-audit.json',
} as const;

type ArtifactFetch = (path: string) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

type ArtifactAttempt =
  | { ok: true; artifact: AiArtifact; source: ArtifactSource; path: string }
  | { ok: false; source: ArtifactSource; path: string; problem: string };

export function artifactSelectionFromSearch(search: string): ArtifactSelection {
  const requested = new URLSearchParams(search).get('artifact')?.toLowerCase();
  if (requested === 'fixture') return 'fixture';
  if (requested === 'gpt' || requested === 'genuine') return 'genuine';
  if (requested === 'none' || requested === 'off') return 'none';
  return 'auto';
}

async function attemptArtifact(source: ArtifactSource, fetcher: ArtifactFetch): Promise<ArtifactAttempt> {
  const path = AI_ARTIFACT_PATHS[source];
  try {
    const response = await fetcher(path);
    if (!response.ok) return { ok: false, source, path, problem: `HTTP ${response.status}` };
    const parsed = aiArtifactSchema.safeParse(await response.json());
    if (!parsed.success) return { ok: false, source, path, problem: 'strict schema validation failed' };
    if (parsed.data.provenance.kind !== source) {
      return { ok: false, source, path, problem: `provenance kind is ${parsed.data.provenance.kind}` };
    }
    return { ok: true, artifact: parsed.data, source, path };
  } catch (error) {
    return { ok: false, source, path, problem: error instanceof Error ? error.message : 'unknown load failure' };
  }
}

export async function loadAiArtifact(
  selection: ArtifactSelection,
  fetcher: ArtifactFetch = fetch,
): Promise<ArtifactLoadResult> {
  if (selection === 'none') {
    return {
      status: 'disabled',
      selection,
      artifact: null,
      source: null,
      path: null,
      message: 'Model artifact loading is explicitly disabled. The deterministic workflow remains available without claiming model participation.',
    };
  }

  if (selection === 'fixture' || selection === 'genuine') {
    const attempt = await attemptArtifact(selection, fetcher);
    return attempt.ok
      ? { status: 'ready', selection, artifact: attempt.artifact, source: attempt.source, path: attempt.path, notice: null }
      : {
        status: 'error', selection, artifact: null, source: null, path: null,
        message: `${selection === 'genuine' ? 'Genuine GPT-5.6' : 'Local fixture'} artifact rejected: ${attempt.problem}. No model output was consumed.`,
      };
  }

  const genuine = await attemptArtifact('genuine', fetcher);
  if (genuine.ok) {
    return { status: 'ready', selection, artifact: genuine.artifact, source: genuine.source, path: genuine.path, notice: null };
  }

  const fixture = await attemptArtifact('fixture', fetcher);
  if (fixture.ok) {
    return {
      status: 'ready',
      selection,
      artifact: fixture.artifact,
      source: fixture.source,
      path: fixture.path,
      notice: `Genuine Northstar artifact was rejected (${genuine.problem}). Using the local schema fixture with zero API calls.`,
    };
  }

  return {
    status: 'error',
    selection,
    artifact: null,
    source: null,
    path: null,
    message: `No valid model artifact is available. Genuine: ${genuine.problem}. Fixture: ${fixture.problem}. The deterministic workflow remains locked to non-model evidence.`,
  };
}
