import { access, readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../plugins/pact/.codex-plugin/plugin.json', import.meta.url), 'utf8'));
const required = ['name', 'version', 'description', 'author', 'interface'];
for (const key of required) {
  if (!manifest[key]) throw new Error(`Plugin manifest missing ${key}`);
}
if (manifest.name !== 'pact') throw new Error('Plugin name must be pact');
if (!manifest.skills) throw new Error('Plugin must expose its PACT skill');

const marketplace = JSON.parse(await readFile(new URL('../.agents/plugins/marketplace.json', import.meta.url), 'utf8'));
const pactEntry = marketplace.plugins?.find((plugin) => plugin.name === 'pact');
if (!pactEntry) throw new Error('Repo marketplace must expose PACT');
if (pactEntry.source?.path !== './plugins/pact') throw new Error('PACT marketplace path must be ./plugins/pact');
await access(new URL('../plugins/pact/.codex-plugin/plugin.json', import.meta.url));

console.log(`PACT plugin valid: ${manifest.interface.displayName} ${manifest.version}; marketplace ${marketplace.interface.displayName}`);
