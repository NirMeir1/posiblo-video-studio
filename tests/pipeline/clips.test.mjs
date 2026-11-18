import {test} from 'node:test';
import assert from 'node:assert/strict';
import {candidateWindows, requiredCount, toSentences, validateClipResponse} from '../../scripts/pipeline/lib/clips.mjs';

// 20 sentences of 8 s each (0-8000, 8500-16500, ...), 170 s total.
const sentences = Array.from({length: 20}, (_, i) => ({index: i, startMs: i * 8500, endMs: i * 8500 + 8000, text: `משפט ${i}.`}));
const durationMs = 170000;
const ctx = {sentences, durationMs, language: 'he'};
const clip = (a, b, extra = {}) => ({startMs: sentences[a].startMs, endMs: sentences[b].endMs, title: 'כותרת קצרה', reason: 'Standalone idea.', ...extra});
const valid = () => ({fullVideoTitle: 'כותרת לסרטון', clips: [clip(0, 2), clip(3, 5), clip(6, 8), clip(9, 12), clip(13, 15)]});

test('sentences split at sentence punctuation and long pauses', () => {
  const words = [
    {index: 0, text: 'שלום', startMs: 0, endMs: 300}, {index: 1, text: ' לכולם.', startMs: 300, endMs: 700},
    {index: 2, text: ' היום', startMs: 800, endMs: 1000}, {index: 3, text: ' נדבר', startMs: 1000, endMs: 1300},
    {index: 4, text: ' אחרי', startMs: 3000, endMs: 3300}, {index: 5, text: ' הפסקה?', startMs: 3300, endMs: 3700},
  ];
  const s = toSentences(words);
  assert.deepEqual(s.map(x => [x.startMs, x.endMs]), [[0, 700], [800, 1300], [3000, 3700]]);
  assert.equal(s[0].text, 'שלום לכולם.');
});

test('a valid response is accepted with sentence-aligned ranges and render padding', () => {
  const {value, problems} = validateClipResponse(valid(), ctx);
  assert.deepEqual(problems, []);
  assert.equal(value.clips.length, 5);
  assert.equal(value.clips[0].id, 'clip-01');
  assert.equal(value.clips[1].renderStartMs, sentences[3].startMs - 120);
  assert.equal(value.clips[1].renderEndMs, sentences[5].endMs + 300);
});

test('start or end not on a sentence boundary is rejected', () => {
  const r = valid();
  r.clips[0].startMs += 400;
  r.clips[1].endMs -= 1000;
  const {problems} = validateClipResponse(r, ctx);
  assert.ok(problems.some(p => /clips\[0\]\.startMs .* not the startMs of any sentence/.test(p)));
  assert.ok(problems.some(p => /clips\[1\]\.endMs .* not the endMs of any sentence/.test(p)));
});

test('out-of-range, reversed and non-finite times are rejected', () => {
  for (const bad of [{startMs: -5}, {endMs: durationMs + 5000}, {startMs: 50000, endMs: 10000}, {startMs: Number.NaN}, {endMs: Infinity}, {startMs: '0'}, {endMs: null}]) {
    const r = valid();
    Object.assign(r.clips[0], bad);
    assert.ok(validateClipResponse(r, ctx).problems.some(p => /clips\[0\]/.test(p)), JSON.stringify(bad));
  }
});

test('clips shorter than 20 s or longer than 60 s are rejected', () => {
  const r = valid();
  r.clips[0] = clip(0, 1);   // 16.5 s
  r.clips[1] = clip(3, 11);  // 76.0 s
  const {problems} = validateClipResponse(r, ctx);
  assert.ok(problems.some(p => /clips\[0\] is 16\.5 s/.test(p)));
  assert.ok(problems.some(p => /clips\[1\] is 76\.0 s/.test(p)));
});

test('wrong count, duplicates, missing fields and non-Hebrew titles are rejected', () => {
  assert.ok(validateClipResponse({...valid(), clips: valid().clips.slice(0, 3)}, ctx).problems.some(p => /5-6 items/.test(p)));
  const dup = valid();
  dup.clips[4] = clip(0, 2);
  assert.ok(validateClipResponse(dup, ctx).problems.some(p => /duplicates/.test(p)));
  const missing = valid();
  delete missing.clips[2].reason;
  delete missing.fullVideoTitle;
  const mp = validateClipResponse(missing, ctx).problems;
  assert.ok(mp.some(p => /clips\[2\]\.reason/.test(p)));
  assert.ok(mp.some(p => /fullVideoTitle/.test(p)));
  const english = valid();
  english.clips[0].title = 'English title';
  assert.ok(validateClipResponse(english, ctx).problems.some(p => /must be in Hebrew/.test(p)));
  assert.ok(validateClipResponse([], ctx).problems.length > 0);
  assert.ok(validateClipResponse({fullVideoTitle: 'כותרת'}, ctx).problems.some(p => /clips must be an array/.test(p)));
});

test('short videos: required count adapts to the windows that exist', () => {
  const few = sentences.slice(0, 3); // 0-25 s
  const windows = candidateWindows(few);
  assert.ok(windows.length > 0 && windows.length < 5);
  assert.deepEqual(requiredCount(windows.length), {min: windows.length, max: windows.length});
  assert.equal(candidateWindows(sentences.slice(0, 2)).length, 0);
});
