import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {groundedShare, maxScenes, validateScenePlan} from '../../scripts/pipeline/lib/scenes.mjs';
import {approvalStatus, approvePlan} from '../../scripts/pipeline/lib/approval.mjs';
import {rebaseScenes} from '../../src/pipeline/scene-timeline.mjs';
import {ApprovalRequired, STAGE_ORDER, newState, runStages, saveState} from '../../scripts/pipeline/runner.mjs';
import {tempDir} from './helpers.mjs';

// 10 sentences of 5 s each (0-5000, 5000-10000, ...), 50 s.
const texts = ['לא כל עסק צריך AI.', 'אתם מעתיקים פרטים ידנית.', 'שוכחים לחזור ללקוחות.', 'אפשר לחבר בין המערכות.', 'ליצור אוטומציה פשוטה.', 'המטרה היא לחסוך זמן.', 'לצמצם טעויות.', 'ולגרום לעסק לעבוד טוב יותר.', 'אז תשאלו את עצמכם.', 'איזו בעיה אני מנסה לפתור?'];
const sentences = texts.map((text, i) => ({index: i, startMs: i * 5000, endMs: i * 5000 + 4800, text}));
const ctx = {sentences, durationMs: 50000, language: 'he'};
const scene = extra => ({type: 'cards', startSentence: 5, endSentence: 7, heading: 'המטרה', items: [{label: 'לחסוך זמן'}, {label: 'לצמצם טעויות'}], reason: 'A list of goals.', ...extra});

test('a valid plan is accepted, sorted, timed from sentences and grounded', () => {
  const {value, problems} = validateScenePlan({decision: 'One list scene.', scenes: [scene(), scene({type: 'comparison', startSentence: 1, endSentence: 4, heading: 'במקום לעבוד ידנית', items: [{label: 'מעתיקים פרטים ידנית'}, {label: 'אוטומציה פשוטה'}]})]}, ctx);
  assert.deepEqual(problems, []);
  assert.deepEqual(value.scenes.map(s => [s.id, s.type, s.startMs, s.endMs]), [['scene-01', 'comparison', 5000, 24800], ['scene-02', 'cards', 25000, 39800]]);
  assert.deepEqual(value.scenes[1].reviewFlags, []);
});

test('zero scenes is valid only with a reason', () => {
  assert.deepEqual(validateScenePlan({decision: 'Speaker carries it.', noSceneReason: 'A personal story; graphics would distract.', scenes: []}, ctx).problems, []);
  assert.ok(validateScenePlan({decision: 'x', scenes: []}, ctx).problems.some(p => /noSceneReason/.test(p)));
});

test('invalid plans are rejected with clear problems', () => {
  const cases = [
    [{decision: 'x', scenes: [scene({type: 'chart'})]}, /type must be one of/],
    [{decision: 'x', scenes: [scene({startSentence: 0, endSentence: 1})]}, /starts at 0 ms/],
    [{decision: 'x', scenes: [scene({startSentence: 1, endSentence: 9})]}, /scenes must last 3-20 s/],
    [{decision: 'x', scenes: [scene({endSentence: 12})]}, /sentence indices/],
    [{decision: 'x', scenes: [scene({items: [{label: 'אחד'}]})]}, /needs 2-3 items/],
    [{decision: 'x', scenes: [scene({type: 'question', items: [{label: 'א'}]})]}, /needs 0 items/],
    [{decision: 'x', scenes: [scene({heading: 'English heading'})]}, /heading must be in Hebrew/],
    [{decision: 'x', scenes: [scene({reason: ''})]}, /reason/],
    [{decision: 'x', scenes: [scene(), scene({startSentence: 6, endSentence: 8})]}, /overlap/],
    [{scenes: []}, /decision/],
    [{decision: 'x', scenes: Array.from({length: 6}, (_, i) => scene({startSentence: i + 1, endSentence: i + 1}))}, /at most 5 scenes/],
  ];
  for (const [json, pattern] of cases) assert.ok(validateScenePlan(json, ctx).problems.some(p => pattern.test(p)), String(pattern));
  assert.equal(maxScenes(20000), 2);
});

test('on-screen text not found in the speech is flagged for review, not silently accepted', () => {
  assert.equal(groundedShare(['לחסוך זמן'], 'המטרה היא לחסוך זמן.'), 1);
  const {value} = validateScenePlan({decision: 'x', scenes: [scene({items: [{label: 'חיסכון של 80%'}, {label: 'לקוחות מרוצים'}]})]}, ctx);
  assert.match(value.scenes[0].reviewFlags[0], /not clearly taken from the speech/);
});

test('rebaseScenes moves scenes onto a clip and keeps them clear of the opening title', () => {
  const scenes = [{id: 'a', startMs: 5000, endMs: 12000}, {id: 'b', startMs: 20000, endMs: 26000}, {id: 'c', startMs: 30000, endMs: 31000}];
  assert.deepEqual(rebaseScenes(scenes, 4000, 25000).map(s => [s.id, s.startMs, s.endMs]), [['a', 3000, 8000], ['b', 16000, 21000]]);
  assert.deepEqual(rebaseScenes(scenes, 4000, 25000, 0).map(s => s.startMs), [1000, 16000]);
  assert.deepEqual(rebaseScenes(undefined, 0, 1000), []);
});

test('approval is tied to the exact plan file', () => {
  const dir = tempDir('approve');
  const plan = path.join(dir, 'scene-plan.json');
  const approval = path.join(dir, 'scene-plan.approval.json');
  assert.equal(approvalStatus(plan, approval).approved, false);
  assert.throws(() => approvePlan(plan, approval), /no scene plan to approve/);
  fs.writeFileSync(plan, JSON.stringify({scenes: [{id: 's', type: 'cards', startMs: 1, endMs: 2, heading: 'h', items: []}]}));
  assert.match(approvalStatus(plan, approval).reason, /not been approved/);
  approvePlan(plan, approval);
  assert.equal(approvalStatus(plan, approval).approved, true);
  fs.writeFileSync(plan, JSON.stringify({scenes: []}));
  assert.match(approvalStatus(plan, approval).reason, /changed after it was approved/);
  fs.writeFileSync(plan, JSON.stringify({scenes: [{type: 'chart'}]}));
  assert.throws(() => approvePlan(plan, approval), /not valid/);
});

test('a stage waiting for approval pauses the run without marking a failure', async () => {
  const dir = tempDir('pause');
  const state = newState({slug: 's', source: {sha256: 'x'}, options: {}});
  saveState(dir, state);
  const calls = [];
  const stages = STAGE_ORDER.map((id, i) => ({number: i + 1, id, title: id, usesAnthropic: i === 4 || i === 7,
    run: async () => { calls.push(id); if (id === 'render') throw new ApprovalRequired('waiting', {scenes: 1}); return {}; }}));
  await assert.rejects(runStages({stages, ctx: {runDir: dir}, state, dir, log: () => {}}), err => err instanceof ApprovalRequired && err.stage.id === 'render');
  assert.equal(calls.at(-1), 'render');
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'pipeline-state.json'), 'utf8'));
  assert.equal(saved.stages.render.status, 'awaiting-approval');
  assert.equal(saved.stages.metadata.status, 'pending');
});

test('the approved reference is given as a worked example, except for its own recording', async () => {
  const {loadSceneExample, buildScenePrompt} = await import('../../scripts/pipeline/lib/scenes.mjs');
  const used = loadSceneExample('another-video');
  assert.equal(used.example.id, 'posiblo-v1');
  const prompt = buildScenePrompt({sentences, durationMs: 50000, language: 'he', example: used.example});
  assert.match(prompt, /WORKED EXAMPLE/);
  assert.match(prompt, /אולי מספיק לחבר בין המערכות/);
  assert.match(prompt, /never copy its text/);
  const own = loadSceneExample(used.example.sourceSha256);
  assert.equal(own.example, null);
  assert.match(own.note, /omitted/);
  assert.doesNotMatch(buildScenePrompt({sentences, durationMs: 50000, language: 'he', example: own.example}), /WORKED EXAMPLE/);
});

test('a long overall decision is accepted, and an over-long one is reported as too long', () => {
  assert.deepEqual(validateScenePlan({decision: 'x'.repeat(650), scenes: [scene()]}, ctx).problems, []);
  assert.ok(validateScenePlan({decision: 'x'.repeat(1600), scenes: [scene()]}, ctx).problems.some(p => /at most 1500 characters/.test(p)));
});
