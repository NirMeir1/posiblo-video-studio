import fs from 'node:fs';

// This recording only. Keep the raw automatic transcripts and correction evidence.
const input = 'out/founder-introduction/captions-large-v3-turbo.json';
const captions = JSON.parse(fs.readFileSync(input, 'utf8'));
const corrections = [
  {startMs: 3960, text: ' יודעים', evidence: 'medium transcript and embedded source subtitle at 4s'},
  {startMs: 25940, text: ' שלא', evidence: 'embedded source subtitle at 26s'},
  {startMs: 26060, text: ' עובדות', evidence: 'embedded source subtitle at 26s'},
  {startMs: 60140, text: ' ללוות', evidence: 'embedded source subtitle at 60s'},
  {startMs: 69700, text: ' היכרות', evidence: 'embedded source subtitle at 70s'},
  {startMs: 70000, text: ' ומיפוי', evidence: 'embedded source subtitle at 70s'},
];
for (const correction of corrections) {
  const word = captions.find(c => c.startMs === correction.startMs);
  if (!word) throw new Error(`Missing correction word at ${correction.startMs}`);
  correction.original = word.text;
  word.text = correction.text;
}
for (const word of captions) if (/[.!?]$/.test(word.text.trim())) word.pageBreakAfter = true;
const output = 'src/founder-introduction-captions.json';
fs.writeFileSync(output, JSON.stringify(captions, null, 2) + '\n', {flag: 'wx'});
fs.writeFileSync('out/founder-introduction/caption-corrections.json', JSON.stringify({humanReview: 'pending', source: input, corrections}, null, 2) + '\n', {flag: 'wx'});
const groups = [];
for (const word of captions) {
  const page = groups.at(-1);
  if (!page || page.length >= 5 || word.endMs - page[0].startMs > 2300 || word.startMs - page.at(-1).endMs > 450 || page.at(-1).pageBreakAfter) groups.push([word]);
  else page.push(word);
}
const stamp = ms => new Date(ms).toISOString().slice(11, 23).replace('.', ',');
fs.writeFileSync('out/founder-introduction/founder-introduction.srt', groups.map((g, i) => `${i + 1}\n${stamp(g[0].startMs)} --> ${stamp(g.at(-1).endMs)}\n${g.map(c => c.text.trim()).join(' ')}\n`).join('\n'), {flag: 'wx'});
fs.writeFileSync('out/founder-introduction/transcript.txt', 'AUTOMATIC TRANSCRIPT WITH EMBEDDED-TEXT CORRECTIONS; HUMAN LISTENING REVIEW PENDING\n\n' + groups.map(g => `[${stamp(g[0].startMs)}] ${g.map(c => c.text.trim()).join(' ')}`).join('\n') + '\n', {flag: 'wx'});
fs.writeFileSync('src/FounderCaptionTrack.tsx', `// Generated for this recording by scripts/prepare-founder-captions.mjs.\n// Automatic transcript; human Hebrew review pending. Edit the inline array in Studio.\nimport {FounderCaptions} from './FounderCaptions';\n\nexport const FounderCaptionTrack = () => <FounderCaptions\n  name="Hebrew captions — original source timing"\n  style={{position: 'absolute', zIndex: 10, left: 60, top: 864, width: 568, fontSize: 37}}\n  captions={${JSON.stringify(captions, null, 2)}}\n/>;\n`, {flag: 'wx'});
console.log(`Prepared ${captions.length} words, ${groups.length} caption pages; no omitted source intervals; human review pending`);
