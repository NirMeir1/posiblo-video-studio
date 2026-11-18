import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FRAME_MS, buildEditMap, mapEditedToSource, mapSourceToEdited, remapWords} from '../../scripts/pipeline/lib/timeline.mjs';
import {findFillers, findRepeatedTakes, planCut} from '../../scripts/pipeline/lib/cutplan.mjs';
import {makeWords} from './helpers.mjs';

const near = (actual, expected, tol = 0.01) => assert.ok(Math.abs(actual - expected) <= tol, `${actual} != ${expected}`);

// Keep 0-1 s and 3-5 s of source (frames 0-30 and 90-150): 2 s removed in the middle.
const map = buildEditMap([{startFrame: 0, endFrame: 30}, {startFrame: 90, endFrame: 150}]);

test('edit map accumulates edited time', () => {
  assert.equal(map.editedFrames, 90);
  near(map.editedDurationMs, 3000);
  near(map.segments[1].editedStartMs, 1000);
  near(map.segments[1].sourceStartMs, 3000);
});

test('times after a cut shift back by the removed duration', () => {
  near(mapSourceToEdited(500, map).ms, 500);
  near(mapSourceToEdited(3500, map).ms, 1500);
  near(mapSourceToEdited(4999, map).ms, 2999);
  assert.equal(mapSourceToEdited(3500, map).removed, false);
});

test('times inside removed material snap to the kept boundary', () => {
  const forward = mapSourceToEdited(2000, map, 'forward');
  const backward = mapSourceToEdited(2000, map, 'backward');
  assert.equal(forward.removed, true);
  near(forward.ms, 1000);
  near(backward.ms, 1000);
  near(mapSourceToEdited(9000, map).ms, 3000);
});

test('edited -> source round trip', () => {
  near(mapEditedToSource(1500, map), 3500);
  near(mapSourceToEdited(mapEditedToSource(2200, map), map).ms, 2200);
});

test('remapWords drops removed words, shifts later words, marks words that span a cut', () => {
  const words = [
    {index: 0, text: 'a', startMs: 100, endMs: 400},
    {index: 1, text: ' gone', startMs: 1500, endMs: 2500},  // fully inside the removed 1-3 s
    {index: 2, text: ' b', startMs: 3200, endMs: 3600},
    {index: 3, text: ' edge', startMs: 900, endMs: 3100},   // straddles the cut
  ];
  const {words: kept, dropped} = remapWords(words, map);
  assert.deepEqual(dropped.map(w => w.index), [1]);
  const b = kept.find(w => w.index === 2);
  near(b.startMs, 1200);
  near(b.endMs, 1600);
  assert.equal(b.sourceStartMs, 3200);
  const edge = kept.find(w => w.index === 3);
  assert.equal(edge.spansCut, true);
  near(edge.startMs, 900);
  near(edge.endMs, 1100);
});

test('edit map rejects overlapping or empty segments', () => {
  assert.throws(() => buildEditMap([{startFrame: 0, endFrame: 30}, {startFrame: 20, endFrame: 40}]), /non-overlapping/);
  assert.throws(() => buildEditMap([{startFrame: 10, endFrame: 10}]), /Invalid/);
});

test('fillers and repeated takes are detected, real repetition with distance is not', () => {
  const words = makeWords(['אני', 'רוצה', 'אני', 'רוצה', 'לספר', 'אה', 'לכם', 'משהו.']);
  assert.deepEqual(findFillers(words).map(f => f.text), ['אה']);
  const takes = findRepeatedTakes(words);
  assert.equal(takes.length, 1);
  assert.deepEqual(takes[0].wordIndexes, [0, 1]);
  // "המטרה היא" repeated after many words is rhetoric, not a retake.
  const rhetoric = makeWords(['המטרה', 'היא', 'לא', 'להכניס', 'בכל', 'מחיר', 'AI.', 'המטרה', 'היא', 'לחסוך']);
  assert.equal(findRepeatedTakes(rhetoric).length, 0);
});

test('planCut + remap: long silence is shortened, natural pauses kept, timestamps follow the cut', () => {
  // Two sentences with a 3 s silence between them, and a 0.5 s natural pause inside the first.
  const words = [
    {index: 0, text: 'שלום', startMs: 200, endMs: 600},
    {index: 1, text: ' לכולם.', startMs: 1100, endMs: 1600},
    {index: 2, text: ' היום', startMs: 4600, endMs: 5000},
    {index: 3, text: ' נדבר.', startMs: 5000, endMs: 5500},
  ];
  const silences = [{startMs: 600, endMs: 1100}, {startMs: 1600, endMs: 4600}, {startMs: 5500, endMs: 6000}];
  const plan = planCut({words, silences, totalFrames: 180});
  const editMap = buildEditMap(plan.keepFrames);
  const {words: remapped, dropped} = remapWords(words, editMap);
  assert.equal(dropped.length, 0);
  // The natural 0.5 s pause stays intact.
  near(remapped[1].startMs - remapped[0].endMs, 500, FRAME_MS);
  // The 3 s pause after a sentence end becomes ~450 ms (sentencePauseMs), within one frame.
  near(remapped[2].startMs - remapped[1].endMs, 450, FRAME_MS + 1);
  // Word durations are preserved.
  near(remapped[3].endMs - remapped[3].startMs, 500, 0.01);
  // Every remapped word lies inside the edited duration.
  assert.ok(remapped.every(w => w.endMs <= editMap.editedDurationMs + 0.01));
  assert.ok(plan.removals.every(r => r.reasons.includes('silence')));
});

test('planCut removes a filler with its surrounding pause and never cuts into kept words', () => {
  const words = [
    {index: 0, text: 'אז', startMs: 0, endMs: 300},
    {index: 1, text: ' אממ', startMs: 900, endMs: 1300},
    {index: 2, text: ' בואו', startMs: 1900, endMs: 2300},
  ];
  const plan = planCut({words, silences: [{startMs: 300, endMs: 900}, {startMs: 1300, endMs: 1900}], totalFrames: 75});
  const {words: remapped, dropped} = remapWords(words, buildEditMap(plan.keepFrames));
  assert.deepEqual(dropped.map(w => w.index), [1]);
  near(remapped[1].startMs - remapped[0].endMs, 300, FRAME_MS + 1);
  near(remapped[0].endMs - remapped[0].startMs, 300, 0.01);
  near(remapped[1].endMs - remapped[1].startMs, 400, 0.01);
});
