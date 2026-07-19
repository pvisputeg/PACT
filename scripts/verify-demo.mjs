import { readFileSync } from 'node:fs';

const demo = readFileSync('docs/DEMO_SCRIPT.md', 'utf8');
const judgeGuide = readFileSync('docs/JUDGE_GUIDE.md', 'utf8');
const productSource = readFileSync('src/App.tsx', 'utf8');
const beats = [...demo.matchAll(/^## (\d+):(\d{2})-(\d+):(\d{2}) - /gm)].map((match) => ({
  start: Number(match[1]) * 60 + Number(match[2]),
  end: Number(match[3]) * 60 + Number(match[4]),
}));
if (!beats.length || beats[0].start !== 0) throw new Error('Demo script must begin at 0:00 with timed beats.');
for (let index = 1; index < beats.length; index += 1) {
  if (beats[index].start !== beats[index - 1].end) throw new Error(`Demo timing gap or overlap before beat ${index + 1}.`);
}
const finalSecond = beats.at(-1).end;
if (finalSecond >= 180) throw new Error(`Demo ends at ${finalSecond} seconds; it must stay under three minutes.`);
const declared = demo.match(/^# PACT demo script - (\d+) minutes (\d+) seconds/m);
if (!declared || Number(declared[1]) * 60 + Number(declared[2]) !== finalSecond) throw new Error('Declared demo duration does not match the timed beats.');

const sections = [...demo.matchAll(/^## (\d+):(\d{2})-(\d+):(\d{2}) - ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map((match) => {
  const seconds = Number(match[3]) * 60 + Number(match[4]) - (Number(match[1]) * 60 + Number(match[2]));
  const narration = match[6].split(/\r?\n/).filter((line) => line.startsWith('>')).join(' ');
  const words = narration.match(/[\p{L}\p{N}'-]+/gu)?.length ?? 0;
  return { title: match[5].trim(), wordsPerMinute: Math.round(words * 60 / seconds) };
});
sections.forEach((section) => { if (section.wordsPerMinute > 150) throw new Error(`Narration is too fast in "${section.title}": ${section.wordsPerMinute} WPM.`); });

const controls = ['Enter Outcome Room','Define the governed outcome','Accept contract and verify signal','Explore enterprise impact','Compare bounded strategies','Submit for independent audit','Approve with conditions and activate','Run approved graph','Measure the outcome','Accept closeout'];
controls.forEach((control) => { if (!productSource.includes(control)) throw new Error(`Demo control is missing from the product: ${control}`); });
const cues = ['Operation Northstar','5.4 usable days','96.4%','Decision-ready with conditions','Action blocked: Required quality authorization is missing.','96.1%','LOCAL SCHEMA FIXTURE · NO API CALL','do not show setup or installation'];
cues.forEach((cue) => { if (!demo.includes(cue)) throw new Error(`Required demo cue is missing: ${cue}`); });
const auditIndex = judgeGuide.indexOf('Bind all 5 Auditor conditions');
const approvalIndex = judgeGuide.indexOf('Approve with conditions and activate');
if (auditIndex < 0 || approvalIndex < 0 || auditIndex > approvalIndex) throw new Error('Judge path must bind Auditor conditions before human approval.');
console.log(`PACT Northstar demo verified: ${beats.length} contiguous beats, ${finalSecond} seconds, ${Math.max(...sections.map((item) => item.wordsPerMinute))} peak WPM, and all judge controls present`);
