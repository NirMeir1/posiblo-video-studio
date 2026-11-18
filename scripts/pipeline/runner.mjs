// Generic stage runner: one run folder per source, ordered stages, resumable state,
// collision handling and fail-fast behaviour. Contains no media logic, so it is unit-testable.
import fs from 'node:fs';
import path from 'node:path';
import {ensureDir, readJson, writeJson} from './lib/util.mjs';

/** The nine pipeline stages, in the only order they may run. */
export const STAGE_ORDER = ['ingest', 'transcribe', 'clean-cut', 'audio', 'clip-selection', 'captions', 'render', 'metadata', 'verify'];

export const STATE_FILE = 'pipeline-state.json';
const LOCK_FILE = '.pipeline.lock';

export class StageFailure extends Error {
  constructor(stage, cause) {
    super(`Stage ${stage.number} (${stage.id}) failed: ${cause?.message ?? cause}`);
    this.name = 'StageFailure';
    this.stage = stage;
    this.cause = cause;
  }
}

/** Thrown by a stage that must wait for a person (e.g. scene plan approval). Not a failure. */
export class ApprovalRequired extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ApprovalRequired';
    this.details = details;
  }
}

export const stageDirName = stage => `${String(stage.number).padStart(2, '0')}-${stage.id}`;

/** Throws unless `stages` is exactly the nine stages in STAGE_ORDER, numbered 1..9. */
export const assertStageContracts = stages => {
  const ids = stages.map(s => s.id);
  if (ids.length !== STAGE_ORDER.length || ids.some((id, i) => id !== STAGE_ORDER[i])) throw new Error(`Stage order must be ${STAGE_ORDER.join(' -> ')}; got ${ids.join(' -> ')}`);
  stages.forEach((s, i) => {
    if (s.number !== i + 1) throw new Error(`Stage ${s.id} must be number ${i + 1}`);
    if (typeof s.run !== 'function') throw new Error(`Stage ${s.id} has no run()`);
  });
  const apiStages = stages.filter(s => s.usesAnthropic).map(s => s.number);
  if (apiStages.join(',') !== '5,8') throw new Error(`Only stages 5 and 8 may use the Anthropic API; got ${apiStages.join(',') || 'none'}`);
};

/**
 * Picks the run folder for a source. Same slug + same source hash resumes; a folder that
 * belongs to another source (or is not a pipeline run) is never reused: an automatic
 * suffix is chosen, or an explicit --slug fails.
 */
export const resolveRunDirectory = ({outRoot, slug, sourceSha256, explicitSlug = false}) => {
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? slug : `${slug}-${n}`;
    const dir = path.join(outRoot, candidate);
    if (!fs.existsSync(dir)) return {slug: candidate, dir, mode: 'new'};
    const statePath = path.join(dir, STATE_FILE);
    let state = null;
    try { state = readJson(statePath); } catch { state = null; }
    if (state?.source?.sha256 === sourceSha256) {
      const complete = STAGE_ORDER.every(id => state.stages?.[id]?.status === 'complete');
      return {slug: candidate, dir, mode: complete ? 'complete' : 'resume', state};
    }
    if (explicitSlug) throw new Error(`${dir} already exists and ${state ? 'belongs to a different source file' : 'is not a pipeline run folder'}; choose another --slug. Nothing was overwritten.`);
  }
  throw new Error(`Could not find a free run folder for slug ${slug}`);
};

export const newState = ({slug, source, options}) => ({
  schemaVersion: 1, slug, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  source, options, stages: Object.fromEntries(STAGE_ORDER.map(id => [id, {status: 'pending'}])),
});

export const saveState = (dir, state) => {
  state.updatedAt = new Date().toISOString();
  writeJson(path.join(dir, STATE_FILE), state);
};

export const acquireLock = dir => {
  const lock = path.join(dir, LOCK_FILE);
  try {
    fs.writeFileSync(lock, JSON.stringify({pid: process.pid, startedAt: new Date().toISOString()}), {flag: 'wx'});
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    let pid = null;
    try { pid = JSON.parse(fs.readFileSync(lock, 'utf8')).pid; } catch { pid = null; }
    let alive = false;
    if (pid) { try { process.kill(pid, 0); alive = true; } catch { alive = false; } }
    if (alive) throw new Error(`Another pipeline run (pid ${pid}) is using ${dir}. If that is wrong, delete ${lock}.`);
    fs.rmSync(lock, {force: true});
    fs.writeFileSync(lock, JSON.stringify({pid: process.pid, startedAt: new Date().toISOString()}), {flag: 'wx'});
  }
  return () => fs.rmSync(lock, {force: true});
};

const outputsExist = (dir, outputs = []) => outputs.every(rel => fs.existsSync(path.join(dir, rel)));

/**
 * Runs stages in order. A complete stage whose recorded outputs still exist is skipped.
 * Once any stage runs, every later stage runs too (its inputs may have changed).
 * `rerunFrom` (stage id) forces that stage and all later ones to run.
 * The first failure is recorded in the state file and stops the run.
 */
export const runStages = async ({stages, ctx, state, dir, rerunFrom = null, log = console.log}) => {
  assertStageContracts(stages);
  const rerunIndex = rerunFrom ? STAGE_ORDER.indexOf(rerunFrom) : -1;
  if (rerunFrom && rerunIndex < 0) throw new Error(`Unknown stage for --rerun-from: ${rerunFrom}`);
  let mustRun = false;
  const executed = [];
  for (const [index, stage] of stages.entries()) {
    const record = state.stages[stage.id] ?? {status: 'pending'};
    if (index === rerunIndex) mustRun = true;
    if (!mustRun && record.status === 'complete' && outputsExist(dir, record.outputs)) {
      log(`[${stage.number}/9] ${stage.title}: already complete, skipped`);
      continue;
    }
    mustRun = true;
    log(`[${stage.number}/9] ${stage.title}...`);
    state.stages[stage.id] = {status: 'running', startedAt: new Date().toISOString()};
    saveState(dir, state);
    let result;
    try {
      const stageDir = path.join(dir, stageDirName(stage));
      ensureDir(stageDir); // stages may write into their folder from external tools (ffmpeg) first
      result = (await stage.run({...ctx, stage, stageDir})) ?? {};
      const missing = (result.outputs ?? []).filter(rel => !fs.existsSync(path.join(dir, rel)));
      if (missing.length) throw new Error(`stage reported outputs that do not exist: ${missing.join(', ')}`);
    } catch (error) {
      if (error instanceof ApprovalRequired) {
        state.stages[stage.id] = {status: 'awaiting-approval', since: new Date().toISOString(), message: error.message};
        saveState(dir, state);
        error.stage = stage;
        throw error;
      }
      state.stages[stage.id] = {status: 'failed', failedAt: new Date().toISOString(), error: String(error?.message ?? error)};
      saveState(dir, state);
      throw new StageFailure(stage, error);
    }
    state.stages[stage.id] = {status: 'complete', completedAt: new Date().toISOString(), outputs: result.outputs ?? [], summary: result.summary ?? {}};
    saveState(dir, state);
    executed.push(stage.id);
  }
  return executed;
};
