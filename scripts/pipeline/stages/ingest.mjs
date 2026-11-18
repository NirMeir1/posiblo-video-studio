// Stage 1: copy the source into the run folder (the original is only read), probe it,
// record provenance, and prepare the mono 16 kHz PCM16 WAV used for transcription.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {runPaths, rel} from '../lib/paths.mjs';
import {ensureDir, sha256File, writeJson} from '../lib/util.mjs';

/**
 * Copies `source` to `destination` without ever writing to the source.
 * Refuses to overwrite an existing destination unless it is already an identical copy.
 */
export const copySourcePreserving = async (source, destination, expectedSha256) => {
  if (path.resolve(source) === path.resolve(destination)) throw new Error('Refusing to copy the source onto itself');
  const before = expectedSha256 ?? await sha256File(source);
  ensureDir(path.dirname(destination));
  if (fs.existsSync(destination)) {
    if (await sha256File(destination) !== before) throw new Error(`${destination} exists and differs from the source; refusing to overwrite`);
  } else {
    const tmp = `${destination}.partial`;
    fs.rmSync(tmp, {force: true});
    fs.copyFileSync(source, tmp, fs.constants.COPYFILE_EXCL);
    fs.renameSync(tmp, destination);
  }
  const copy = await sha256File(destination);
  const after = await sha256File(source);
  if (after !== before) throw new Error('The original source changed while it was being copied; stopping');
  if (copy !== before) throw new Error('Copied file hash does not match the original');
  return {sha256: before};
};

const fps = value => { const [n, d = 1] = String(value ?? '0').split('/').map(Number); return d ? n / d : 0; };

export const summarizeProbe = probe => {
  const video = probe.streams?.find(s => s.codec_type === 'video');
  const audio = probe.streams?.find(s => s.codec_type === 'audio');
  if (!video) throw new Error('Source has no video stream');
  if (!audio) throw new Error('Source has no audio stream; the pipeline needs the speaker\'s voice');
  const rotation = Number(video.side_data_list?.find(d => d.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0);
  const rotated = Math.abs(rotation) % 180 === 90;
  const width = rotated ? video.height : video.width;
  const height = rotated ? video.width : video.height;
  const durationSeconds = Number(probe.format?.duration ?? video.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('Could not determine source duration');
  return {
    durationSeconds, displayWidth: width, displayHeight: height, rotation,
    orientation: height > width ? 'portrait' : height === width ? 'square' : 'landscape',
    video: {codec: video.codec_name, width: video.width, height: video.height, avgFrameRate: video.avg_frame_rate, fps: fps(video.avg_frame_rate), pixFmt: video.pix_fmt},
    audio: {codec: audio.codec_name, sampleRate: Number(audio.sample_rate), channels: audio.channels},
    audioStreams: probe.streams.filter(s => s.codec_type === 'audio').length,
  };
};

const gitInfo = repoRoot => {
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repoRoot, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore']}).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], {cwd: repoRoot, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore']}).trim().length > 0;
    return {commit, dirty};
  } catch {
    return {commit: null, dirty: null};
  }
};

export const ingest = async ({runDir, sourcePath, sourceSha256, tools, repoRoot, log}) => {
  const paths = runPaths(runDir);
  const ext = path.extname(sourcePath) || '.mp4';
  const copy = paths.ingest.sourceCopy(ext);
  await copySourcePreserving(sourcePath, copy, sourceSha256);
  log(`  copied source to ${rel(runDir, copy)} (original untouched)`);

  const probe = await tools.probe(copy);
  writeJson(paths.ingest.probe, probe);
  const media = summarizeProbe(probe);
  log(`  ${media.displayWidth}x${media.displayHeight} ${media.orientation}, ${media.durationSeconds.toFixed(2)} s, ${media.video.fps.toFixed(2)} fps, audio ${media.audio.codec} ${media.audio.sampleRate} Hz`);

  await tools.ffmpeg(['-y', '-i', copy, '-map', '0:a:0', '-vn', '-af', 'aresample=first_pts=0', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', paths.ingest.wav16k]);

  const stat = fs.statSync(sourcePath);
  writeJson(paths.ingest.provenance, {
    original: {path: sourcePath, sha256: sourceSha256, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString()},
    copy: {path: rel(runDir, copy), sha256: sourceSha256},
    ingestedAt: new Date().toISOString(),
    media,
    tools: {node: process.version, ffmpeg: tools.ffmpegPath, ffmpegVersion: tools.ffmpegVersion, ffprobe: tools.ffprobePath},
    repository: gitInfo(repoRoot),
    transcriptionInput: {path: rel(runDir, paths.ingest.wav16k), format: 'mono 16 kHz PCM16 WAV', stream: '0:a:0'},
    notes: media.audioStreams > 1 ? [`Source has ${media.audioStreams} audio streams; only the first is used.`] : [],
  });
  return {outputs: [rel(runDir, copy), rel(runDir, paths.ingest.probe), rel(runDir, paths.ingest.provenance), rel(runDir, paths.ingest.wav16k)], summary: media};
};
