// Stage 3: remove long silences, hesitation fillers and repeated takes; keep natural and
// deliberate pauses. Writes the edit map and remaps the transcript to the edited timeline.
// Detection uses silencedetect (acoustic) plus Whisper word timing. Audio is cut sample-exactly
// in Node; video is cut frame-exactly with ffmpeg select on a 30 fps grid, so the two stay in sync.
import path from 'node:path';
import {runPaths, rel} from '../lib/paths.mjs';
import {parseSilences} from '../lib/ffmpeg.mjs';
import {planCut} from '../lib/cutplan.mjs';
import {FPS, buildEditMap, remapWords} from '../lib/timeline.mjs';
import {writeWavRanges} from '../lib/wav.mjs';
import {readJson, round, writeJson} from '../lib/util.mjs';

export const SILENCE_DETECT = {noiseDb: -35, minSeconds: 0.35};
const AUDIO_RATE = 48000;

export const selectExpression = keepFrames => keepFrames.map(k => `between(n,${k.startFrame},${k.endFrame - 1})`).join('+');

export const cleanCut = async ({runDir, tools, log}) => {
  const paths = runPaths(runDir);
  const provenance = readJson(paths.ingest.provenance);
  const transcript = readJson(paths.transcribe.transcript);
  const copy = path.join(runDir, provenance.copy.path);
  const probe = readJson(paths.ingest.probe);
  const videoStream = probe.streams.find(s => s.codec_type === 'video');
  const audioStream = probe.streams.find(s => s.codec_type === 'audio');
  const streamSeconds = [videoStream.duration, audioStream.duration].map(Number).filter(n => Number.isFinite(n) && n > 0);
  const usableSeconds = streamSeconds.length ? Math.min(...streamSeconds) : Number(probe.format.duration);
  const totalFrames = Math.floor(usableSeconds * FPS);

  const detect = await tools.ffmpeg(['-i', paths.ingest.wav16k, '-af', `silencedetect=noise=${SILENCE_DETECT.noiseDb}dB:d=${SILENCE_DETECT.minSeconds}`, '-f', 'null', '-']);
  const silences = parseSilences(detect.stderr, usableSeconds * 1000);
  writeJson(paths.cut.silences, {detector: 'ffmpeg silencedetect', ...SILENCE_DETECT, silences});

  const plan = planCut({words: transcript.words, silences, totalFrames});
  const editMap = buildEditMap(plan.keepFrames);
  const removedMs = usableSeconds * 1000 - editMap.editedDurationMs;
  writeJson(paths.cut.editMap, {
    description: 'Kept source ranges in order. Times in ms; frames at 30 fps. Edited time = editedStartMs + (source - sourceStartMs) inside a segment.',
    sourceDurationMs: round(usableSeconds * 1000), editedDurationMs: editMap.editedDurationMs, removedMs: round(removedMs),
    fps: editMap.fps, editedFrames: editMap.editedFrames, segments: editMap.segments,
    removals: plan.removals, contentRemovals: plan.content, options: plan.options,
    review: 'Automatic cut decisions. Watch every cut point; restore any removal that changed meaning (re-run from clean-cut after adjusting options).',
  });
  log(`  ${plan.removals.length} cuts, ${(removedMs / 1000).toFixed(2)} s removed (${plan.content.filter(c => c.reason === 'filler').length} fillers, ${plan.content.filter(c => c.reason === 'repeated take').length} repeated takes)`);

  // Audio: sample-exact concatenation of kept ranges (1600 samples per frame at 48 kHz).
  const channels = Math.min(2, Number(audioStream.channels) || 1);
  await tools.ffmpeg(['-y', '-i', copy, '-map', '0:a:0', '-vn', '-af', 'aresample=first_pts=0', '-ac', String(channels), '-ar', String(AUDIO_RATE), '-c:a', 'pcm_s16le', paths.cut.sourceAudio]);
  const perFrame = AUDIO_RATE / FPS;
  writeWavRanges(paths.cut.sourceAudio, paths.cut.audio, editMap.segments.map(s => ({start: s.sourceStartFrame * perFrame, end: s.sourceEndFrame * perFrame})));

  // Video: constant 30 fps grid, then frame-index selection. Longest side capped at 1920 px.
  // start_time=0 / first_pts=0 align both streams to the container's time zero.
  const vf = [`fps=${FPS}:start_time=0`, `select='${selectExpression(plan.keepFrames)}'`, `setpts=N/(${FPS}*TB)`, "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'", 'format=yuv420p'].join(',');
  if (vf.length > 30000) throw new Error(`Too many cuts (${plan.keepFrames.length}) for one ffmpeg filter argument`);
  await tools.ffmpeg(['-y', '-i', copy, '-map', '0:v:0', '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-r', String(FPS), paths.cut.video]);
  const cutProbe = await tools.probe(paths.cut.video);
  const cutSeconds = Number(cutProbe.streams.find(s => s.codec_type === 'video')?.duration ?? cutProbe.format.duration);
  if (Math.abs(cutSeconds * 1000 - editMap.editedDurationMs) > 2 * (1000 / FPS)) throw new Error(`Cut video is ${cutSeconds.toFixed(3)} s but the edit map expects ${(editMap.editedDurationMs / 1000).toFixed(3)} s`);

  const {words, dropped} = remapWords(transcript.words, editMap);
  writeJson(paths.cut.transcript, {
    ...transcript, timeline: 'edited', durationMs: editMap.editedDurationMs, editMap: rel(runDir, paths.cut.editMap),
    text: words.map(w => w.text).join('').trim(), words, droppedWords: dropped,
  });
  return {
    outputs: [paths.cut.silences, paths.cut.editMap, paths.cut.audio, paths.cut.video, paths.cut.transcript].map(f => rel(runDir, f)),
    summary: {sourceSeconds: round(usableSeconds), editedSeconds: round(editMap.editedDurationMs / 1000), cuts: plan.removals.length, droppedWords: dropped.length},
  };
};
