import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');
const fixturePath = join(dist, 'artifacts', 'fixture', 'strategy-and-audit.json');
const socialPreviewPath = join(dist, 'og.png');
const iconPath = join(dist, 'icon.svg');

if (!existsSync(indexPath)) throw new Error('dist/index.html is missing; run the production build first');
if (!existsSync(fixturePath)) throw new Error('The free judge fixture is missing from the production bundle');
if (!existsSync(socialPreviewPath)) throw new Error('The deployed social preview is missing');
if (!existsSync(iconPath)) throw new Error('The deployed PACT icon is missing');

const html = readFileSync(indexPath, 'utf8');
if (!/(?:src|href)="\.\/assets\//.test(html)) {
  throw new Error('Production assets are not relative; subpath hosting would break');
}
if (/(?:src|href)="\/assets\//.test(html)) {
  throw new Error('Production bundle contains root-absolute asset URLs');
}
if (!html.includes('property="og:image" content="./og.png"')) {
  throw new Error('The deployed page is missing its portable social preview metadata');
}
if (!html.includes('property="og:image:width" content="1200"') || !html.includes('property="og:image:height" content="630"')) {
  throw new Error('The deployed page is missing explicit 1200x630 social preview metadata');
}

const socialPreview = readFileSync(socialPreviewPath);
const pngSignature = '89504e470d0a1a0a';
if (socialPreview.subarray(0, 8).toString('hex') !== pngSignature) {
  throw new Error('The deployed social preview is not a valid PNG');
}
const socialWidth = socialPreview.readUInt32BE(16);
const socialHeight = socialPreview.readUInt32BE(20);
if (socialWidth !== 1200 || socialHeight !== 630) {
  throw new Error(`The deployed social preview must be 1200x630; found ${socialWidth}x${socialHeight}`);
}

const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
if (fixture.scenarioId !== 'northstar-material-recovery-v1' || fixture.provider !== 'Local schema fixture' || fixture.provenance?.kind !== 'fixture') {
  throw new Error('Bundled free artifact must remain transparently labeled as a fixture');
}

const javascript = readdirSync(join(dist, 'assets'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => readFileSync(join(dist, 'assets', file), 'utf8'))
  .join('\n');
for (const requiredBoundary of [
  'GENUINE GPT-5.6 · STRICT SCHEMA',
  'LOCAL SCHEMA FIXTURE · NO API CALL',
  'REJECTED · FAIL-CLOSED',
  'Models propose and challenge. Deterministic policy authorizes and enforces.',
]) {
  if (!javascript.includes(requiredBoundary)) throw new Error(`Production bundle is missing artifact-boundary evidence: ${requiredBoundary}`);
}

console.log('PACT production bundle valid: relative assets, 1200x630 social preview, strict runtime artifact boundary, free fixture, provenance transparent');
