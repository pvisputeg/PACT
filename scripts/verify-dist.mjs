import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');
const fixturePath = join(dist, 'artifacts', 'fixture', 'strategy-and-audit.json');

if (!existsSync(indexPath)) throw new Error('dist/index.html is missing; run the production build first');
if (!existsSync(fixturePath)) throw new Error('The free judge fixture is missing from the production bundle');

const html = readFileSync(indexPath, 'utf8');
if (!/(?:src|href)="\.\/assets\//.test(html)) {
  throw new Error('Production assets are not relative; subpath hosting would break');
}
if (/(?:src|href)="\/assets\//.test(html)) {
  throw new Error('Production bundle contains root-absolute asset URLs');
}

const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
if (fixture.provider !== 'Local schema fixture' || fixture.provenance?.kind !== 'fixture') {
  throw new Error('Bundled free artifact must remain transparently labeled as a fixture');
}

console.log('PACT production bundle valid: relative assets, free fixture present, provenance transparent');
