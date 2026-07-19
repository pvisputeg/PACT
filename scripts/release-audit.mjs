import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { collectEvidenceIds, reviewGenuineArtifact } from './lib/pact-artifact-review.mjs';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const requiredFiles = [
  'AGENTS.md',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'PRODUCT_REQUIREMENTS.md',
  'docs/DEMO_SCRIPT.md',
  'docs/FINAL_SUBMISSION_CHECKLIST.md',
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
  'submission-assets/og-card.html',
  'submission-assets/devpost-cover.png',
  'submission-assets/gallery-manifest.json',
  'submission-assets/screenshots/00-enterprise-command-center.png',
  'submission-assets/screenshots/00b-reusable-outcome-contract.png',
  'submission-assets/screenshots/01-signal-contract.png',
  'submission-assets/screenshots/02-proofline-verification.png',
  'submission-assets/screenshots/03-strategy-sandbox.png',
  'submission-assets/screenshots/04-approval-gate.png',
  'submission-assets/screenshots/05-outcome-closeout.png',
  'scripts/verify-dist.mjs',
  'scripts/generate-og-card.ps1',
  'scripts/verify-demo.mjs',
  'scripts/verify-submission.mjs',
  'scripts/verify-gpt-artifact.mjs',
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

function pngDimensions(path) {
  const bytes = readFileSync(path);
  const signature = bytes.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a' || bytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('not a valid PNG');
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length };
}

const missingFiles = requiredFiles.filter((file) => !existsSync(join(root, file)));
let internalSubmissionCompliance = { status: 'BLOCKED', reason: 'internal submission verifier has not run' };
try {
  const output = execFileSync(process.execPath, ['scripts/verify-submission.mjs'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  internalSubmissionCompliance = { status: 'READY', evidence: output };
} catch (error) {
  internalSubmissionCompliance = {
    status: 'BLOCKED',
    reason: error?.stderr?.toString().trim() || error?.message || 'internal submission verifier failed',
  };
}
const publicArtifactPath = join(root, 'public/artifacts/gpt-5.6/strategy-and-audit.json');
let genuineArtifact = false;
let artifactProblem = 'not generated';
let genuineArtifactData = null;

if (existsSync(publicArtifactPath)) {
  try {
    const artifact = JSON.parse(readFileSync(publicArtifactPath, 'utf8'));
    const evidenceSources = ['data/northstar-material-recovery.scenario.json', 'contracts/metric-contract.json', 'contracts/outcome-contract.json']
      .map((path) => JSON.parse(readFileSync(join(root, path), 'utf8')));
    const artifactReview = reviewGenuineArtifact(artifact, collectEvidenceIds(evidenceSources));
    genuineArtifact = artifactReview.ready;
    if (genuineArtifact) genuineArtifactData = artifact;
    artifactProblem = genuineArtifact
      ? ''
      : `artifact acceptance checks failed: ${Object.entries(artifactReview.checks).filter(([, ready]) => !ready).map(([name]) => name).join(', ')}`;
  } catch {
    artifactProblem = 'artifact JSON is invalid';
  }
}

let galleryProvenance = { status: 'BLOCKED', reason: 'gallery provenance has not been evaluated' };
let galleryAssets = { status: 'BLOCKED', reason: 'gallery assets have not been evaluated' };
try {
  const gallery = JSON.parse(readFileSync(join(root, 'submission-assets/gallery-manifest.json'), 'utf8'));
  if (genuineArtifactData) {
    const matchesArtifact = gallery.gptArtifact?.status === 'reviewed'
      && gallery.gptArtifact?.planResponseId === genuineArtifactData.provenance.planResponseId
      && gallery.gptArtifact?.auditResponseId === genuineArtifactData.provenance.auditResponseId;
    galleryProvenance = matchesArtifact
      ? { status: 'READY' }
      : { status: 'BLOCKED', reason: 'gallery was not recaptured with the reviewed GPT-5.6 artifact' };
  } else {
    galleryProvenance = { status: 'BLOCKED', reason: 'genuine Northstar GPT-5.6 artifact must be accepted before final gallery capture' };
  }

  const assetProblems = [];
  const requiredViews = ['mission_control', 'plant_twin', 'proofline', 'independent_audit', 'blocked_guard', 'outcome_closeout'];
  const images = Array.isArray(gallery.images) ? gallery.images : [];
  const capturedViews = new Set(images.map((image) => image.view));
  for (const view of requiredViews) {
    if (!capturedViews.has(view)) assetProblems.push(`required view missing: ${view}`);
  }
  for (const image of images) {
    if (!image.file || !image.view || !image.caption) {
      assetProblems.push(`${image.file ?? 'unnamed image'}: file, view, and caption are required`);
      continue;
    }
    const assetPath = join(root, 'submission-assets/screenshots', image.file);
    if (!existsSync(assetPath)) {
      assetProblems.push(`${image.file}: missing`);
      continue;
    }
    try {
      const actual = pngDimensions(assetPath);
      if (actual.width !== image.width || actual.height !== image.height) {
        assetProblems.push(`${image.file}: manifest ${image.width}x${image.height}, actual ${actual.width}x${actual.height}`);
      }
      if (actual.bytes < 20_000) assetProblems.push(`${image.file}: suspiciously small (${actual.bytes} bytes)`);
    } catch (error) {
      assetProblems.push(`${image.file}: ${error instanceof Error ? error.message : 'invalid PNG'}`);
    }
  }
  galleryAssets = assetProblems.length
    ? { status: 'BLOCKED', problems: assetProblems }
    : { status: 'READY', images: images.length, requiredViews: requiredViews.length };
} catch {
  galleryProvenance = { status: 'BLOCKED', reason: 'gallery manifest JSON is invalid' };
  galleryAssets = { status: 'BLOCKED', reason: 'gallery manifest JSON is invalid' };
}

const submission = readFileSync(join(root, 'docs/SUBMISSION.md'), 'utf8');
const placeholderMatches = [...new Set([...submission.matchAll(/\[(?:ADD|RUN)[^\]]*\]/g)].map((match) => match[0]))];
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
  internalSubmissionCompliance,
  genuineGptArtifact: genuineArtifact ? { status: 'READY' } : { status: 'BLOCKED', reason: artifactProblem, apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY) },
  galleryProvenance,
  galleryAssets,
  submissionPlaceholders: placeholderMatches.length ? { status: 'BLOCKED', values: placeholderMatches } : { status: 'READY' },
  gitOrigin: remoteUrl() ? { status: 'READY', url: remoteUrl() } : { status: 'BLOCKED', reason: 'origin remote not configured' },
  credentialScan: secretFindings.length ? { status: 'BLOCKED', files: [...new Set(secretFindings)] } : { status: 'READY' },
};

console.log(JSON.stringify(audit, null, 2));
const blocked = Object.values(audit).some((item) => item.status === 'BLOCKED');
if (strict && blocked) process.exitCode = 1;
