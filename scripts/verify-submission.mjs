import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = ['LICENSE','THIRD_PARTY_NOTICES.md','README.md','docs/DEMO_SCRIPT.md','docs/FINAL_SUBMISSION_CHECKLIST.md','docs/JUDGE_GUIDE.md','docs/SUBMISSION.md','data/northstar-material-recovery.scenario.json','plugins/pact/README.md'];
requiredFiles.forEach((file) => { if (!existsSync(file)) throw new Error(`Submission evidence is missing: ${file}`); });

const readme = readFileSync('README.md', 'utf8');
const submission = readFileSync('docs/SUBMISSION.md', 'utf8');
const demo = readFileSync('docs/DEMO_SCRIPT.md', 'utf8');
const checklist = readFileSync('docs/FINAL_SUBMISSION_CHECKLIST.md', 'utf8');
const pluginReadme = readFileSync('plugins/pact/README.md', 'utf8');
const license = readFileSync('LICENSE', 'utf8');
function requireEvery(name, content, values) { values.forEach((value) => { if (!content.includes(value)) throw new Error(`${name} is missing required submission evidence: ${value}`); }); }

requireEvery('README', readme, ['AI accountable for the business outcome','Operation Northstar','npm run judge:verify','GPT-5.6','Codex','data/','Synthetic']);
requireEvery('submission draft', submission, ['## Proposed track','Work & Productivity','Operation Northstar','## How Codex was used','## How GPT-5.6 was used','## Accurate implementation statement']);
requireEvery('demo narration', demo, ['# PACT demo script - 2 minutes 55 seconds','Operation Northstar','separate Auditor role','no-API schema fixture','GPT-5.6 response and trace IDs','copyrighted music']);
requireEvery('final checklist', checklist, ['July 21, 2026 at 5:00 PM Pacific Time','August 5, 2026 at 5:00 PM PT','testing@devpost.com','build-week-event@openai.com','visibility is **Public**']);
requireEvery('plugin judge path', pluginReadme, ['Supported platform','Installation','npm run verify:mcp']);
if (!/^MIT License/m.test(license)) throw new Error('Repository license is not clearly MIT.');

let buildWeekCommitCount = 0;
try {
  buildWeekCommitCount = Number(execFileSync('git', ['rev-list','--count','--since=2026-07-13T09:00:00-07:00','HEAD'], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim());
} catch { throw new Error('Unable to verify dated Build Week repository history.'); }
if (!Number.isInteger(buildWeekCommitCount) || buildWeekCommitCount < 1) throw new Error('No dated repository commits were found during the Build Week submission period.');
console.log(`PACT internal submission compliance verified: Northstar narrative, license, deterministic data, plugin path, video disclosures, judging access checklist, and ${buildWeekCommitCount} Build Week commits`);
