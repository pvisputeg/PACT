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
  'docs/SUBMISSION.md',
  'docs/VERIFICATION.md',
  'plugins/pact/.codex-plugin/plugin.json',
  'plugins/pact/.mcp.json',
  'plugins/pact/skills/investigate-and-recover-outcome/SKILL.md',
  'plugins/pact/scripts/pact-mcp-server.mjs',
  'public/artifacts/gpt-5.6/README.md',
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
const generatedArtifactPath = join(root, 'artifacts/gpt-5.6/strategy-and-audit.json');
const publicArtifactPath = join(root, 'public/artifacts/gpt-5.6/strategy-and-audit.json');
let genuineArtifact = false;
let artifactProblem = 'not generated';

if (existsSync(generatedArtifactPath) && existsSync(publicArtifactPath)) {
  try {
    const artifact = JSON.parse(readFileSync(generatedArtifactPath, 'utf8'));
    genuineArtifact = artifact.provider === 'OpenAI Responses API'
      && artifact.model === 'gpt-5.6'
      && /^resp_/.test(artifact.provenance?.planResponseId ?? '')
      && /^resp_/.test(artifact.provenance?.auditResponseId ?? '');
    artifactProblem = genuineArtifact ? '' : 'artifact provenance is incomplete';
  } catch {
    artifactProblem = 'artifact JSON is invalid';
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
  automatedVerification: { status: 'RUN_SEPARATELY', commands: ['npm test', 'npm run build', 'npm run verify:mcp', 'npm run validate:plugin', 'npm run generate:agents:dry-run'] },
  genuineGptArtifact: genuineArtifact ? { status: 'READY' } : { status: 'BLOCKED', reason: artifactProblem, apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY) },
  submissionPlaceholders: placeholderMatches.length ? { status: 'BLOCKED', values: placeholderMatches } : { status: 'READY' },
  gitOrigin: remoteUrl() ? { status: 'READY', url: remoteUrl() } : { status: 'BLOCKED', reason: 'origin remote not configured' },
  credentialScan: secretFindings.length ? { status: 'BLOCKED', files: [...new Set(secretFindings)] } : { status: 'READY' },
};

console.log(JSON.stringify(audit, null, 2));
const blocked = Object.values(audit).some((item) => item.status === 'BLOCKED');
if (strict && blocked) process.exitCode = 1;
