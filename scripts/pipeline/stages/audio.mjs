// Stage 4: denoise (afftdn) and two-pass loudness normalization (loudnorm) of the cut audio
// to about -14 LUFS integrated, then mux with the cut video. Saves before/after measurements.
import {runPaths, rel} from '../lib/paths.mjs';
import {parseLoudnormJson} from '../lib/ffmpeg.mjs';
import {round, writeJson} from '../lib/util.mjs';

export const LOUDNESS_TARGET = {integratedLufs: -14, truePeakDbtp: -1.5, lra: 11};
export const DENOISE = 'afftdn=nr=10:nf=-45:tn=1';
const AUDIO_RATE = 48000;

const target = `I=${LOUDNESS_TARGET.integratedLufs}:TP=${LOUDNESS_TARGET.truePeakDbtp}:LRA=${LOUDNESS_TARGET.lra}`;

const measure = async (tools, file, preFilter) => {
  const filter = [preFilter, `loudnorm=${target}:print_format=json`].filter(Boolean).join(',');
  const {stderr} = await tools.ffmpeg(['-i', file, '-af', filter, '-f', 'null', '-']);
  return parseLoudnormJson(stderr);
};

const simplify = m => ({integratedLufs: Number(m.input_i), truePeakDbtp: Number(m.input_tp), lra: Number(m.input_lra), thresholdLufs: Number(m.input_thresh)});

export const audio = async ({runDir, tools, log}) => {
  const paths = runPaths(runDir);
  const before = await measure(tools, paths.cut.audio);
  const denoised = await measure(tools, paths.cut.audio, DENOISE);
  if (!Number.isFinite(Number(denoised.input_i)) || Number(denoised.input_i) < -70) throw new Error(`Audio is silent or too quiet to normalize (integrated ${denoised.input_i} LUFS)`);
  const secondPass = `${DENOISE},loudnorm=${target}:measured_I=${denoised.input_i}:measured_TP=${denoised.input_tp}:measured_LRA=${denoised.input_lra}:measured_thresh=${denoised.input_thresh}:offset=${denoised.target_offset}:linear=true:print_format=json`;
  const {stderr} = await tools.ffmpeg(['-y', '-i', paths.cut.audio, '-af', secondPass, '-ar', String(AUDIO_RATE), '-c:a', 'pcm_s16le', paths.audio.processed]);
  const pass2 = parseLoudnormJson(stderr);
  const after = await measure(tools, paths.audio.processed);

  const afterI = Number(after.input_i);
  const deviation = round(afterI - LOUDNESS_TARGET.integratedLufs, 2);
  const warnings = [];
  if (Math.abs(deviation) > 1) warnings.push(`Integrated loudness is ${afterI} LUFS, ${deviation} LU from the -14 LUFS target.`);
  if (pass2.normalization_type && pass2.normalization_type !== 'linear') warnings.push(`loudnorm used ${pass2.normalization_type} normalization (linear was not possible without exceeding the true-peak limit); listen for pumping.`);

  await tools.ffmpeg(['-y', '-i', paths.cut.video, '-i', paths.audio.processed, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', paths.audio.edited]);

  writeJson(paths.audio.loudness, {
    target: LOUDNESS_TARGET, denoiseFilter: DENOISE, loudnormMode: 'two-pass, linear requested',
    before: {...simplify(before), description: 'cut audio, before denoise and normalization'},
    afterDenoiseBeforeNormalization: simplify(denoised),
    after: {...simplify(after), description: 'processed audio (denoised + normalized)'},
    deviationFromTargetLu: deviation, loudnormSecondPass: pass2, warnings,
    review: 'Automatic processing. Listen to the whole result: denoising can add artifacts to the voice.',
  });
  log(`  loudness ${before.input_i} -> ${after.input_i} LUFS (target -14), true peak ${after.input_tp} dBTP${warnings.length ? `; ${warnings.length} warning(s)` : ''}`);
  return {outputs: [paths.audio.loudness, paths.audio.processed, paths.audio.edited].map(f => rel(runDir, f)), summary: {beforeLufs: Number(before.input_i), afterLufs: afterI, truePeakDbtp: Number(after.input_tp), warnings}};
};
