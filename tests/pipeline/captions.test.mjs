import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildCaptions, toSrt} from '../../scripts/pipeline/lib/captions.mjs';
import {rebaseCaptions, paginateCaptions} from '../../src/pipeline/caption-timeline.mjs';
import {planExports, snapRange} from '../../scripts/pipeline/stages/render.mjs';
import {FRAME_MS} from '../../scripts/pipeline/lib/timeline.mjs';

const verifyRule = (captions, durationMs) => captions.length > 0 && captions.every((c, i) => c.text.trim() && c.startMs >= 0 && c.endMs > c.startMs && c.endMs <= durationMs + 1000 / 30 && (!i || c.startMs >= captions[i - 1].endMs));

test('captions are strictly ordered with positive durations and flags for review', () => {
  const words = [
    {text: 'שלום', startMs: 0, endMs: 300, confidence: null},
    {text: ' AI', startMs: 250, endMs: 250, confidence: null},       // overlaps and zero-length
    {text: ' לכולם.', startMs: 400, endMs: 900, confidence: 0.4, spansCut: true},
    {text: ' לכולם', startMs: 950, endMs: 1300, confidence: 0.9},
  ];
  const {captions, flagged} = buildCaptions(words, 1300);
  assert.ok(verifyRule(captions, 1300));
  assert.equal(captions[0].text, 'שלום');
  assert.equal(captions[1].text, ' AI');
  assert.equal(captions[2].pageBreakAfter, true);
  const flagsOf = text => flagged.find(f => f.text === text).flags;
  assert.ok(flagsOf('שלום').includes('confidence-unavailable'));
  assert.ok(flagsOf('AI').includes('latin-or-digits-check-rtl-order'));
  assert.ok(flagsOf('AI').includes('very-short-timing'));
  assert.ok(flagsOf('לכולם.').includes('low-confidence'));
  assert.ok(flagsOf('לכולם.').includes('spans-a-cut'));
  assert.ok(flagsOf('לכולם').includes('repeated-word'));
  assert.ok(!flagsOf('לכולם').includes('confidence-unavailable'));
});

test('no recording-specific corrections: text is passed through unchanged', () => {
  const words = [{text: 'שיתפל', startMs: 0, endMs: 400, confidence: null}, {text: ' שתם', startMs: 400, endMs: 800, confidence: null}];
  assert.deepEqual(buildCaptions(words, 800).captions.map(c => c.text.trim()), ['שיתפל', 'שתם']);
});

test('rebaseCaptions shifts to the clip, drops outside words and clamps edges', () => {
  const captions = [
    {text: 'a', startMs: 0, endMs: 500, timestampMs: 250, confidence: null},
    {text: ' b', startMs: 900, endMs: 1200, timestampMs: 1050, confidence: null},
    {text: ' c', startMs: 1500, endMs: 2100, timestampMs: 1800, confidence: null},
    {text: ' d', startMs: 2500, endMs: 2800, timestampMs: 2650, confidence: null},
  ];
  const r = rebaseCaptions(captions, 1000, 2000);
  assert.deepEqual(r.map(c => [c.text, c.startMs, c.endMs]), [['b', 0, 200], [' c', 500, 1000]]);
  assert.ok(verifyRule(r, 1000));
});

test('export plan: full + clips on the frame grid, rebased captions pass the verify rule', () => {
  const captions = buildCaptions(Array.from({length: 120}, (_, i) => ({text: `${i ? ' ' : ''}מילה${i % 7 === 6 ? '.' : ''}`, startMs: i * 500, endMs: i * 500 + 400, confidence: null})), 60000).captions;
  const clipsFile = {fullVideoTitle: 'כותרת', clips: [{id: 'clip-01', title: 'א', startMs: 3000, endMs: 27400, renderStartMs: 2880, renderEndMs: 27500}]};
  const plan = planExports({slug: 's', clipsFile, captions, editedDurationMs: 60000, resolution: {width: 1080, height: 1920}});
  assert.deepEqual(plan.map(p => p.name), ['full', 'clip-01']);
  for (const p of plan) {
    assert.ok(Number.isInteger(Math.round(p.range.startMs / FRAME_MS)));
    assert.ok(Math.abs(p.range.startMs / FRAME_MS - Math.round(p.range.startMs / FRAME_MS)) < 1e-9);
    assert.ok(verifyRule(p.rebased, p.range.endMs - p.range.startMs), p.name);
    assert.equal(p.props.width / p.props.height, 9 / 16);
  }
  assert.equal(plan[0].rebased.length, captions.length);
  assert.throws(() => snapRange(100, 110, 60000), /Empty render range/);
});

test('pagination and SRT', () => {
  const captions = [
    {text: 'א', startMs: 0, endMs: 200}, {text: ' ב.', startMs: 200, endMs: 400, pageBreakAfter: true},
    {text: ' ג', startMs: 500, endMs: 700}, {text: ' ד', startMs: 2000, endMs: 2200},
  ];
  assert.equal(paginateCaptions(captions).length, 3);
  assert.match(toSrt(captions), /^1\n00:00:00,000 --> 00:00:00,490\nא ב\./);
});
