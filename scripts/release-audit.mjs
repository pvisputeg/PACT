import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const requiredFiles = [
  'AGENTS.md',
  'README.md',
  'PRODUCT_REQUIREMENTS.md',
  'docs/DEMO_SCRIPT.md',
  'docs/JUDGE_GUIDE.md',
  'docs/JUDGING_MATRIX.md',
  'docs/SUBMISSION.md',
  'docs/VERIFICATION.md',
  '.github/workflows/deploy-pages.yml',
  'plugins/pact/.codex-plugin/plugin.json',
  'plugins/pact/.mcp.json',
  'plugins/pact/skills/investigate-and-recover-outcome/SKILL.md',
  'plugins/pact/scripts/pact-mcp-server.mjs',
  'public/artifacts/gpt-5.6/README.md',
  'public/artifacts/fixture/README.md',
  'public/artifacts/fixture/strategy-and-audit.json',
  'public/icon.svg',
  'public/og.png',
  'submission-assets/README.md',
  'submission-assets/gallery-manifest.json',
  'submission-assets/screenshots/01-signal-contract.png',
  'submission-assets/screenshots/02-proofline-verification.png',
  'submission-assets/screenshots/03-strategy-sandbox.png',
  'submission-assets/screenshots/04-approval-gate.png',
  'submission-assets/screenshots/05-outcome-closeout.png',
  'scripts/verify-dist.mjs',
];

function walk(directory, output = []) {
  for (const entry of readdirSync(directory)) {
    if (['.git', 'node_modules', 'dist', 'coverage'].includes(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path, output);
    else output.push(path);
  }
  return output;
}

function remoteUrl() {
  try {
    return execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const missingFiles = requiredFiles.filter((file) => !existsSync(join(root, file)));
const publicArtifactPath = join(root, 'public/artifacts/gpt-5.6/strategy-and-audit.json');
let genuineArtifact = false;
let artifactProblem = 'not generated';
let genuineArtifactData = null;

if (existsSync(publicArtifactPath)) {
  try {
    const artifact = JSON.parse(readFileSync(publicArtifactPath, 'utf8'));
    genuineArtifact = artifact.provider === 'OpenAI Agents SDK'
      && artifact.model === 'gpt-5.6'
      && artifact.provenance?.kind === 'genuine'
      && artifact.provenance?.framework === '@openai/agents'
      && artifact.provenance?.orchestration === 'manager'
      && /^resp_/.test(artifact.provenance?.planResponseId ?? '')
      && /^resp_/.test(artifact.provenance?.auditResponseId ?? '')
      && /^trace_/.test(artifact.provenance?.planTraceId ?? '')
      && /^trace_/.test(artifact.provenance?.auditTraceId ?? '')
      && artifact.usage?.projectBudgetUsd <= 5;
    if (genuineArtifact) genuineArtifactData = artifact;
    artifactProblem = genuineArtifact ? '' : 'artifact provenance is incomplete';
  } catch {
    artifactProblem = 'artifact JSON is invalid';
  }
}

let galleryProvenance = { status: 'BLOCKED', reason: 'genuine GPT-5.6 artifact pending' };
if (genuineArtifactData) {
  try {
    const gallery = JSON.parse(readFileSync(join(root, 'submission-assets/gallery-manifest.json'), 'utf8'));
    const matchesArtifact = gallery.gptArtifact?.status === 'reviewed'
      && gallery.gptArtifact?.planResponseId === genuineArtifactData.provenance.planResponseId
      && gallery.gptArtifact?.auditResponseId === genuineArtifactData.provenance.auditResponseId;
    galleryProvenance = matchesArtifact
      ? { status: 'READY' }
      : { status: 'BLOCKED', reason: 'gallery was not recaptured with the reviewed GPT-5.6 artifact' };
  } catch {
    galleryProvenance = { status: 'BLOCKED', reason: 'gallery manifest JSON is invalid' };
  }
}

const submission = readFileSync(join(root, 'docs/SUBMISSION.md'), 'utf8');
const placeholderMatches = [...submission.matchAll(/\[ADD[^\]]*\]/g)].map((match) => match[0]);
const sensitivePatterns = [
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  /OPENAI_API_KEY\s*=\s*[^\s#][^\r\n]*/g,
];
const secretFindings = [];

for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/');
  if (rel === '.env.example' || /\.(?:woff2?|png|jpe?g|gif|ico)$/i.test(rel)) continue;
  const content = readFileSync(file, 'utf8');
  for (const pattern of sensitivePatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) secretFindings.push(rel);
  }
}

const audit = {
  requiredFiles: missingFiles.length ? { status: 'BLOCKED', missing: missingFiles } : { status: 'READY' },
  automatedVerification: { status: 'RUN_SEPARATELY', commands: ['npm run judge:verify'] },
  genuineGptArtifact: genuineArtifact ? { status: 'READY' } : { status: 'BLOCKED', reason: artifactProblem, apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY) },
  galleryProvenance,
  submissionPlaceholders: placeholderMatches.length ? { status: 'BLOCKED', values: placeholderMatches } : { status: 'READY' },
  gitOrigin: remoteUrl() ? { status: 'READY', url: remoteUrl() } : { status: 'BLOCKED', reason: 'origin remote not configured' },
  credentialScan: secretFindings.length ? { status: 'BLOCKED', files: [...new Set(secretFindings)] } : { status: 'READY' },
};

console.log(JSON.stringify(audit, null, 2));
const blocked = Object.values(audit).some((item) => item.status === 'BLOCKED');
if (strict && blocked) process.exitCode = 1;
