// Stage 2: local transcription. Two engines, both fully local:
// - "ivrit" (default): faster-whisper with ivrit.ai's Hebrew fine-tuned Whisper
//   (scripts/pipeline/python/transcribe_ivrit.py); gives per-word confidence.
// - "whisper-webgpu": the original parameterized scripts/transcribe-source.mjs, unchanged.
// Keeps the raw output and writes a normalized word list.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {runPaths, rel} from '../lib/paths.mjs';
import {readJson, round, writeJson, writeText} from '../lib/util.mjs';
import {venvPython} from '../setup-transcriber.mjs';

export const TRANSCRIBERS = ['ivrit', 'whisper-webgpu'];
export const IVRIT_MODEL = 'ivrit-large-v3-turbo';
export const CONFIDENCE_UNAVAILABLE = '@remotion/whisper-webgpu returns word text and timing only; no per-word probability is available.';

export const runProcess = (command, args, {cwd, env}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {cwd, env: {...process.env, ...env}, stdio: 'inherit', windowsHide: true});
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${path.basename(args[0] ?? command)} exited with code ${code}`)));
});

export const runNode = (args, {cwd}) => runProcess(process.execPath, args, {cwd});

/** Converts transcriber words (seconds) to the pipeline word format (milliseconds, source timeline). */
export const normalizeWords = rawWords => rawWords.map((w, index) => {
  const startMs = round(Number(w.startInSeconds) * 1000, 1);
  const endMs = round(Number(w.endInSeconds) * 1000, 1);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) throw new Error(`Transcribed word ${index} has non-numeric timing`);
  const confidence = Number.isFinite(w.confidence) ? w.confidence : null;
  return {index, text: String(w.text ?? ''), startMs, endMs: Math.max(startMs, endMs), confidence};
}).filter(w => w.text.trim().length > 0);

/** Name used for the raw output file and recorded as the transcript's model. */
export const transcriptionModelName = options => (options.transcriber ?? 'ivrit') === 'ivrit' ? IVRIT_MODEL : options.whisperModel;

const runIvrit = async ({paths, raw, language, repoRoot}) => {
  const python = venvPython(repoRoot);
  if (!fs.existsSync(python)) throw new Error('The Hebrew transcriber is not installed. Run `npm run setup:transcriber` once (free, local), or use --transcriber whisper-webgpu.');
  await runProcess(python, [path.join(repoRoot, 'scripts', 'pipeline', 'python', 'transcribe_ivrit.py'), paths.ingest.wav16k, raw, '--language', language, '--model', IVRIT_MODEL], {cwd: repoRoot, env: {HF_HUB_DISABLE_TELEMETRY: '1', PYTHONIOENCODING: 'utf-8'}});
};

export const transcribeStage = async ({runDir, options, repoRoot, log}) => {
  const paths = runPaths(runDir);
  const {language} = options;
  const transcriber = options.transcriber ?? 'ivrit';
  if (!TRANSCRIBERS.includes(transcriber)) throw new Error(`Unknown transcriber ${transcriber}`);
  const model = transcriptionModelName(options);
  const raw = paths.transcribe.raw(model);
  const whisperCaptions = paths.transcribe.whisperCaptions(model);
  const rawOutputs = transcriber === 'ivrit' ? [raw] : [raw, whisperCaptions];
  // Both engines refuse to overwrite their outputs. Leftovers can only come from an
  // interrupted or earlier attempt of this (unfinished or re-run) stage, so they are removed.
  for (const file of rawOutputs) if (fs.existsSync(file)) { log(`  removing earlier output ${rel(runDir, file)}`); fs.rmSync(file); }
  if (transcriber === 'ivrit') await runIvrit({paths, raw, language, repoRoot});
  else await runNode([path.join(repoRoot, 'scripts', 'transcribe-source.mjs'), paths.ingest.wav16k, paths.transcribe.dir, language, model], {cwd: repoRoot});

  const result = readJson(raw);
  if (!Array.isArray(result.words) || !result.words.length) throw new Error('The transcriber returned no words. Check that the recording contains speech in the selected language.');
  const words = normalizeWords(result.words);
  const provenance = readJson(paths.ingest.provenance);
  const confidenceAvailable = words.some(w => w.confidence !== null);
  writeJson(paths.transcribe.transcript, {
    timeline: 'source', language, transcriber, model, modelSource: result.modelSource ?? null, durationMs: round(provenance.media.durationSeconds * 1000, 1),
    machineGenerated: true, humanReviewed: false,
    confidence: {available: confidenceAvailable, note: confidenceAvailable ? (result.confidenceNote ?? 'Per-word confidence from the transcriber.') : CONFIDENCE_UNAVAILABLE},
    rawOutput: rel(runDir, raw), text: result.text, words,
  });
  writeText(paths.transcribe.text, `AUTOMATIC TRANSCRIPT (${transcriber}: ${model}, language=${language}). Not human-verified; may contain errors.\n\n${String(result.text ?? '').trim()}\n`);
  log(`  ${words.length} words with ${transcriber} (${model}); confidence ${confidenceAvailable ? 'available' : 'unavailable'}`);
  return {outputs: [...rawOutputs, paths.transcribe.transcript, paths.transcribe.text].map(f => rel(runDir, f)), summary: {words: words.length, language, transcriber, model, confidenceAvailable}};
};
