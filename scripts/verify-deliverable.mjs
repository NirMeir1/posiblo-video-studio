import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const options = {output: 'out/not-every-business-needs-ai-posiblo.mp4', source: 'public/input/testvideo.mp4', captions: 'src/captions-final.json'};
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i], key = arg.slice(2);
  if (!arg.startsWith('--') || !['output', 'source', 'captions', 'report'].includes(key) || !process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw new Error(`Unknown option or missing value: ${arg}`);
  options[key] = process.argv[++i];
}
const output = path.resolve(options.output);
const archive = path.resolve('references');
const reportPath = path.resolve(options.report ?? `${options.output}.verification.json`);
if (reportPath === archive || reportPath.startsWith(archive + path.sep)) throw new Error('Reports must not modify the reference archive');
if ([output, path.resolve(options.source), path.resolve(options.captions)].includes(reportPath)) throw new Error('Report path would overwrite input');
const bin = path.resolve('node_modules/@remotion/compositor-win32-x64-msvc');
const ffmpeg = path.join(bin, 'ffmpeg.exe');
const probe = file => JSON.parse(execFileSync(path.join(bin, 'ffprobe.exe'), ['-v', 'quiet', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8'}));
const metadata = probe(output);
const sourceMetadata = probe(options.source);
const video = metadata.streams.find(s => s.codec_type === 'video');
const audio = metadata.streams.find(s => s.codec_type === 'audio');
const duration = Number(video?.duration ?? metadata.format.duration);
const rate = value => { const [n, d = 1] = String(value).split('/').map(Number); return n / d; };
const captions = JSON.parse(fs.readFileSync(options.captions, 'utf8'));
const checks = {
  videoFormat: video?.codec_name === 'h264' && video.width >= 720 && video.height >= 1280 && Math.abs(video.width / video.height - 9 / 16) < 0.001 && Math.abs(rate(video.avg_frame_rate) - 30) < 0.01 && ['yuv420p', 'yuvj420p'].includes(video.pix_fmt),
  audioFormat: audio?.codec_name === 'aac',
  sourceHasVideoAndAudio: sourceMetadata.streams.some(s => s.codec_type === 'video') && sourceMetadata.streams.some(s => s.codec_type === 'audio'),
  durationValid: Number.isFinite(duration) && duration > 0,
  audioDuration: Boolean(audio) && Math.abs(Number(audio?.duration ?? metadata.format.duration) - duration) < 0.15,
  subtitleTimingsValid: Array.isArray(captions) && captions.length > 0 && captions.every((c, i) => typeof c.text === 'string' && c.text.trim().length > 0 && Number.isFinite(c.startMs) && Number.isFinite(c.endMs) && c.startMs >= 0 && c.endMs > c.startMs && c.endMs <= duration * 1000 + 1000 / 30 && (!i || c.startMs >= captions[i - 1].endMs)),
};
execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-xerror', '-i', output, '-c:v', 'rawvideo', '-c:a', 'pcm_s16le', '-f', 'null', '-'], {stdio: 'pipe'});
checks.fullDecodePassed = true;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = {
  checkedAt: new Date().toISOString(), output, source: path.resolve(options.source), captions: path.resolve(options.captions),
  sha256: {output: hash(output), source: hash(options.source), captions: hash(options.captions)},
  automatedPass: Object.values(checks).every(Boolean), checks, duration, subtitleWords: captions.length, metadata,
  humanReview: 'pending: full playback, lip sync, Hebrew accuracy, mobile readability and creative comparison require recorded review',
};
fs.mkdirSync(path.dirname(reportPath), {recursive: true});
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({report: reportPath, automatedPass: report.automatedPass, checks, duration, humanReview: report.humanReview}, null, 2));
if (!report.automatedPass) process.exitCode = 1;
