import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {STAGES} from '../../scripts/pipeline/stages.mjs';
import {STAGE_ORDER, StageFailure, assertStageContracts, newState, resolveRunDirectory, runStages, saveState} from '../../scripts/pipeline/runner.mjs';
import {parseArgs} from '../../scripts/pipeline/run.mjs';
import {tempDir} from './helpers.mjs';

const quiet = () => {};

const fakeStages = (calls, {failAt = null} = {}) => STAGE_ORDER.map((id, i) => ({
  number: i + 1, id, title: id, usesAnthropic: i + 1 === 5 || i + 1 === 8,
  run: async ({runDir}) => {
    calls.push(id);
    if (id === failAt) throw new Error(`boom in ${id}`);
    fs.writeFileSync(path.join(runDir, `${id}.out`), id);
    return {outputs: [`${id}.out`]};
  },
}));

const setup = () => {
  const dir = tempDir('order');
  const state = newState({slug: 's', source: {sha256: 'abc'}, options: {}});
  saveState(dir, state);
  return {dir, state};
};

test('registry has exactly the nine stages in the required order', () => {
  assert.deepEqual(STAGES.map(s => s.id), ['ingest', 'transcribe', 'clean-cut', 'audio', 'clip-selection', 'captions', 'render', 'metadata', 'verify']);
  assert.deepEqual(STAGES.map(s => s.number), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertStageContracts(STAGES);
});

test('only stages 5 and 8 are allowed to use the Anthropic API', () => {
  assert.deepEqual(STAGES.filter(s => s.usesAnthropic).map(s => s.number), [5, 8]);
  const bad = STAGES.map(s => ({...s, usesAnthropic: s.number === 2}));
  assert.throws(() => assertStageContracts(bad), /Only stages 5 and 8/);
});

test('contracts reject reordered or missing stages', () => {
  const swapped = [...STAGES];
  [swapped[2], swapped[3]] = [swapped[3], swapped[2]];
  assert.throws(() => assertStageContracts(swapped), /Stage order/);
  assert.throws(() => assertStageContracts(STAGES.slice(0, 8)), /Stage order/);
});

test('stages run in order and record completion', async () => {
  const {dir, state} = setup();
  const calls = [];
  await runStages({stages: fakeStages(calls), ctx: {runDir: dir}, state, dir, log: quiet});
  assert.deepEqual(calls, STAGE_ORDER);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'pipeline-state.json'), 'utf8'));
  assert.ok(STAGE_ORDER.every(id => saved.stages[id].status === 'complete'));
});

test('a failure stops the run; later stages do not run; state records the failure', async () => {
  const {dir, state} = setup();
  const calls = [];
  await assert.rejects(runStages({stages: fakeStages(calls, {failAt: 'audio'}), ctx: {runDir: dir}, state, dir, log: quiet}), err => err instanceof StageFailure && err.stage.number === 4);
  assert.deepEqual(calls, ['ingest', 'transcribe', 'clean-cut', 'audio']);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'pipeline-state.json'), 'utf8'));
  assert.equal(saved.stages.audio.status, 'failed');
  assert.match(saved.stages.audio.error, /boom in audio/);
  assert.equal(saved.stages['clip-selection'].status, 'pending');
});

test('re-running skips finished stages and resumes at the failed one', async () => {
  const {dir, state} = setup();
  await assert.rejects(runStages({stages: fakeStages([], {failAt: 'captions'}), ctx: {runDir: dir}, state, dir, log: quiet}));
  const calls = [];
  await runStages({stages: fakeStages(calls), ctx: {runDir: dir}, state, dir, log: quiet});
  assert.deepEqual(calls, ['captions', 'render', 'metadata', 'verify']);
});

test('a complete stage whose outputs were deleted runs again, and so does everything after it', async () => {
  const {dir, state} = setup();
  await runStages({stages: fakeStages([]), ctx: {runDir: dir}, state, dir, log: quiet});
  fs.rmSync(path.join(dir, 'render.out'));
  const calls = [];
  await runStages({stages: fakeStages(calls), ctx: {runDir: dir}, state, dir, log: quiet});
  assert.deepEqual(calls, ['render', 'metadata', 'verify']);
});

test('--rerun-from forces that stage and all later stages', async () => {
  const {dir, state} = setup();
  await runStages({stages: fakeStages([]), ctx: {runDir: dir}, state, dir, log: quiet});
  const calls = [];
  await runStages({stages: fakeStages(calls), ctx: {runDir: dir}, state, dir, rerunFrom: 'clip-selection', log: quiet});
  assert.deepEqual(calls, ['clip-selection', 'captions', 'render', 'metadata', 'verify']);
});

test('each stage gets its numbered folder created before it runs', async () => {
  const {dir, state} = setup();
  const seen = [];
  const stages = fakeStages([]).map(s => ({...s, run: async ctx => { seen.push(fs.existsSync(ctx.stageDir) && path.basename(ctx.stageDir)); return {}; }}));
  await runStages({stages, ctx: {runDir: dir}, state, dir, log: quiet});
  assert.deepEqual(seen, ['01-ingest', '02-transcribe', '03-clean-cut', '04-audio', '05-clip-selection', '06-captions', '07-render', '08-metadata', '09-verify']);
});

test('a stage that reports a missing output fails', async () => {
  const {dir, state} = setup();
  const stages = fakeStages([]);
  stages[0] = {...stages[0], run: async () => ({outputs: ['nope.json']})};
  await assert.rejects(runStages({stages, ctx: {runDir: dir}, state, dir, log: quiet}), /do not exist: nope.json/);
});

test('run folder collisions: resume same source, never reuse a different one', () => {
  const outRoot = tempDir('collide');
  assert.deepEqual(resolveRunDirectory({outRoot, slug: 'talk', sourceSha256: 'aaa'}).mode, 'new');
  const first = path.join(outRoot, 'talk');
  fs.mkdirSync(first);
  const state = newState({slug: 'talk', source: {sha256: 'aaa'}, options: {}});
  saveState(first, state);
  assert.equal(resolveRunDirectory({outRoot, slug: 'talk', sourceSha256: 'aaa'}).mode, 'resume');
  // Different source with the same name -> new suffixed folder, original untouched.
  const other = resolveRunDirectory({outRoot, slug: 'talk', sourceSha256: 'bbb'});
  assert.equal(other.slug, 'talk-2');
  assert.equal(other.mode, 'new');
  // Explicit slug never silently falls back.
  assert.throws(() => resolveRunDirectory({outRoot, slug: 'talk', sourceSha256: 'bbb', explicitSlug: true}), /different source file.*Nothing was overwritten/);
  // A non-pipeline folder (e.g. older manual outputs) is never reused.
  fs.mkdirSync(path.join(outRoot, 'manual'));
  assert.equal(resolveRunDirectory({outRoot, slug: 'manual', sourceSha256: 'aaa'}).slug, 'manual-2');
  // Finished run is reported as complete, so the entry point refuses to overwrite it.
  for (const id of STAGE_ORDER) state.stages[id] = {status: 'complete', outputs: []};
  saveState(first, state);
  assert.equal(resolveRunDirectory({outRoot, slug: 'talk', sourceSha256: 'aaa'}).mode, 'complete');
});

test('argument parsing', () => {
  assert.deepEqual(parseArgs(['C:\\a b\\v.mp4']).language, 'he');
  assert.equal(parseArgs(['v.mp4', '--rerun-from', '5']).rerunFrom, 'clip-selection');
  assert.equal(parseArgs(['v.mp4', '--rerun-from=render']).rerunFrom, 'render');
  assert.throws(() => parseArgs(['v.mp4', '--bogus']), /Unknown option/);
  assert.throws(() => parseArgs(['v.mp4', '--slug', 'Bad Slug']), /--slug/);
  assert.throws(() => parseArgs(['v.mp4', '--rerun-from', 'nope']), /--rerun-from/);
  assert.equal(parseArgs(['v.mp4']).transcriber, 'ivrit');
  assert.equal(parseArgs(['v.mp4', '--transcriber', 'whisper-webgpu']).transcriber, 'whisper-webgpu');
  assert.throws(() => parseArgs(['v.mp4', '--transcriber', 'cloud']), /--transcriber/);
});
