#!/usr/bin/env node
// Entry point: npm run pipeline -- <video-path> [options]
// Produces local files in out/<slug>/ only. Contains no upload or publishing code.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {STAGES} from './stages.mjs';
import {ApprovalRequired, STAGE_ORDER, StageFailure, acquireLock, newState, resolveRunDirectory, runStages, saveState} from './runner.mjs';
import {checkFfmpeg, makeTools} from './lib/ffmpeg.mjs';
import {createClient, readAnthropicConfig} from './lib/anthropic.mjs';
import {REPO_ROOT, sha256File, slugify} from './lib/util.mjs';
import {approvePlan} from './lib/approval.mjs';
import {runPaths} from './lib/paths.mjs';

const USAGE = `Usage: npm run pipeline -- <video-path> [options]

Options:
  --slug <name>          Run folder name under out/ (default: from the file name)
  --language <code>      Transcription language (default: he)
  --transcriber <name>   ivrit (default: Hebrew fine-tuned Whisper via faster-whisper;
                         needs npm run setup:transcriber once) or whisper-webgpu
  --whisper-model <id>   Model for --transcriber whisper-webgpu (default: large-v3-turbo)
  --rerun-from <stage>   Re-run this stage and all later ones (id or number 1-9):
                         ${STAGE_ORDER.map((id, i) => `${i + 1}=${id}`).join(', ')}
  --approve-scenes       Approve the current scene plan (after previewing it in Studio)
                         and continue rendering
  --help                 Show this help

The run pauses before rendering until you approve the scene plan.
Outputs stay in out/<slug>/. Nothing is uploaded or published.`;

export const parseArgs = argv => {
  const options = {language: 'he', transcriber: 'ivrit', whisperModel: 'large-v3-turbo', slug: null, rerunFrom: null, approveScenes: false, input: null};
  const flags = {'--slug': 'slug', '--language': 'language', '--transcriber': 'transcriber', '--whisper-model': 'whisperModel', '--rerun-from': 'rerunFrom'};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return {...options, help: true};
    if (arg === '--approve-scenes') { options.approveScenes = true; continue; }
    if (arg.startsWith('--')) {
      const [flag, inline] = arg.split(/=(.*)/s);
      if (!flags[flag]) throw new Error(`Unknown option ${flag}\n\n${USAGE}`);
      const value = inline ?? argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      options[flags[flag]] = value;
    } else if (!options.input) options.input = arg;
    else throw new Error(`Unexpected argument ${arg}. Quote paths that contain spaces.`);
  }
  if (options.rerunFrom && /^\d$/.test(options.rerunFrom)) options.rerunFrom = STAGE_ORDER[Number(options.rerunFrom) - 1] ?? options.rerunFrom;
  if (options.rerunFrom && !STAGE_ORDER.includes(options.rerunFrom)) throw new Error(`--rerun-from must be one of ${STAGE_ORDER.join(', ')} or 1-9`);
  if (options.slug && !/^[a-z0-9][a-z0-9-]{0,79}$/.test(options.slug)) throw new Error('--slug may contain only lowercase letters, digits and hyphens');
  if (!/^[a-z]{2,3}$/.test(options.language)) throw new Error('--language must be a 2-3 letter language code such as he');
  if (!['ivrit', 'whisper-webgpu'].includes(options.transcriber)) throw new Error('--transcriber must be ivrit or whisper-webgpu');
  if (!/^[a-z0-9.-]+$/i.test(options.whisperModel)) throw new Error('--whisper-model contains unsupported characters');
  return options;
};

const loadDotEnv = () => {
  const envFile = path.join(REPO_ROOT, '.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.input) {
    console.log(USAGE);
    if (!options.help) process.exitCode = 1;
    return;
  }
  const input = path.resolve(options.input);
  let stat;
  try { stat = fs.statSync(input); } catch { throw new Error(`Input video not found or not accessible: ${input}`); }
  if (!stat.isFile()) throw new Error(`Input is not a file: ${input}`);
  if (input.toLowerCase().startsWith(path.join(REPO_ROOT, 'references').toLowerCase() + path.sep)) console.log('Note: input is inside references/. It is only read and hashed; the archive is never modified.');

  loadDotEnv();
  const tools = makeTools(checkFfmpeg());
  console.log(`Using ${tools.ffmpegPath} (${tools.ffmpegVersion})`);

  console.log('Hashing source...');
  const sourceSha256 = await sha256File(input);
  const outRoot = path.join(REPO_ROOT, 'out');
  const resolved = resolveRunDirectory({outRoot, slug: options.slug ?? slugify(input), sourceSha256, explicitSlug: Boolean(options.slug)});
  const {dir, slug} = resolved;
  const runOptions = {language: options.language, transcriber: options.transcriber, whisperModel: options.whisperModel};

  if (resolved.mode === 'complete' && !options.rerunFrom) {
    console.log(`This source already has a finished run in ${dir}. Nothing was changed or overwritten.\nUse --rerun-from <stage> to redo stages there, or --slug <new-name> for a separate run.`);
    return;
  }
  let state = resolved.state;
  if (state) {
    const changed = Object.entries(runOptions).filter(([key, value]) => state.options?.[key] !== value);
    if (changed.length && !options.rerunFrom) throw new Error(`${dir} was started with ${changed.map(([k]) => `${k}=${state.options?.[k]}`).join(', ')}; got ${changed.map(([k, v]) => `${k}=${v}`).join(', ')}. Use --rerun-from transcribe or a new --slug.`);
    state.options = runOptions;
    console.log(`Resuming ${dir} (finished stages are skipped)`);
    if (options.approveScenes) {
      const paths = runPaths(dir);
      const record = approvePlan(paths.clips.scenePlan, paths.clips.sceneApproval);
      console.log(`Scene plan approved (${record.approvedAt}); continuing.`);
    }
  } else {
    if (options.approveScenes) throw new Error('--approve-scenes needs an existing run with a scene plan; run the pipeline without it first.');
    fs.mkdirSync(dir, {recursive: true});
    state = newState({slug, source: {originalPath: input, sha256: sourceSha256, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString()}, options: runOptions});
    saveState(dir, state);
    console.log(`New run in ${dir}`);
  }

  // Fail before any slow stage if the API configuration needed later is missing.
  const apiStillNeeded = ['clip-selection', 'metadata'].some(id => state.stages[id]?.status !== 'complete') || options.rerunFrom;
  let anthropic = null;
  if (apiStillNeeded) {
    const {model, sceneModel} = readAnthropicConfig();
    let client = null;
    anthropic = {model, sceneModel, client: () => (client ??= createClient())};
    console.log(`Anthropic model for stages 5 and 8: ${model}${sceneModel !== model ? `; scene plan: ${sceneModel}` : ''}`);
  }

  const release = acquireLock(dir);
  try {
    await runStages({stages: STAGES, dir, state, rerunFrom: options.rerunFrom, ctx: {runDir: dir, slug, state, sourcePath: input, sourceSha256, options: runOptions, tools, anthropic, repoRoot: REPO_ROOT, log: console.log}});
  } finally {
    release();
  }
};

const isEntry = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  main().catch(error => {
    if (error instanceof ApprovalRequired) {
      const d = error.details;
      console.log(`
PAUSED at stage ${error.stage.number} (${error.stage.id}): ${error.message}

The plan has ${d.scenes} animated scene(s). Read why in: ${d.planMd}

1. Preview it in Studio (open the PosibloPipeline composition):
   ${d.studio}
2. Optional: edit or delete scenes in ${d.planJson}
3. Approve and render:
   npm run pipeline -- "${process.argv[2]}" --approve-scenes${process.argv.slice(3).filter(a => a !== '--approve-scenes').map(a => ` ${a}`).join('')}`);
      return;
    }
    if (error instanceof StageFailure) {
      console.error(`\nPIPELINE STOPPED at stage ${error.stage.number} (${error.stage.id}).\n${error.cause?.message ?? error.message}\nLater stages did not run. Fix the problem and run the same command again; finished stages are skipped.`);
    } else console.error(`\nPIPELINE ERROR: ${error.message}`);
    process.exitCode = 1;
  });
}
