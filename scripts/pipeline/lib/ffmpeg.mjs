// Full FFmpeg / FFprobe from PATH. Remotion's bundled binaries are a restricted build
// (no silenceremove/afftdn) and are deliberately not used by the pipeline's media stages.
import {execFile, execFileSync} from 'node:child_process';
import path from 'node:path';

export const REQUIRED_FILTERS = ['silenceremove', 'loudnorm', 'afftdn', 'silencedetect'];
export const REQUIRED_ENCODERS = ['libx264', 'aac'];

/** Runs a binary with an argument array (never a shell string). Resolves {stdout, stderr}. */
export const run = (binary, args, {maxBuffer = 256 * 1024 * 1024, cwd} = {}) => new Promise((resolve, reject) => {
  execFile(binary, args, {maxBuffer, windowsHide: true, cwd}, (error, stdout, stderr) => {
    if (error) {
      const tail = String(stderr || '').trim().split(/\r?\n/).slice(-12).join('\n');
      reject(new Error(`${path.basename(binary)} exited with ${error.code ?? error.signal}: ${tail || error.message}`));
    } else resolve({stdout: String(stdout), stderr: String(stderr)});
  });
});

const which = name => {
  try {
    const finder = process.platform === 'win32' ? 'where.exe' : 'which';
    return execFileSync(finder, [name], {encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore']}).split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0] ?? null;
  } catch {
    return null;
  }
};

/** Parses the names column of `ffmpeg -filters` / `-encoders` output. */
export const parseCapabilityList = text => new Set(text.split(/\r?\n/).map(line => line.trim().match(/^[A-Z.|]{2,8}\s+(\S+)/)?.[1]).filter(Boolean));

/**
 * Locates ffmpeg/ffprobe on PATH and checks the filters and encoders the pipeline needs.
 * Throws a clear, actionable error if anything is missing.
 */
export const checkFfmpeg = () => {
  const ffmpeg = which('ffmpeg');
  const ffprobe = which('ffprobe');
  const install = 'Install a full FFmpeg build and put ffmpeg/ffprobe on PATH (for example `winget install Gyan.FFmpeg`, then open a new terminal).';
  if (!ffmpeg || !ffprobe) throw new Error(`ffmpeg and ffprobe must be on PATH (found ffmpeg: ${ffmpeg ?? 'no'}, ffprobe: ${ffprobe ?? 'no'}). ${install}`);
  for (const binary of [ffmpeg, ffprobe]) {
    if (binary.toLowerCase().includes(`${path.sep}@remotion${path.sep}`.toLowerCase())) throw new Error(`${binary} is Remotion's restricted bundled binary; the pipeline needs a full build. ${install}`);
  }
  const filters = parseCapabilityList(execFileSync(ffmpeg, ['-hide_banner', '-filters'], {encoding: 'utf8', windowsHide: true}));
  const encoders = parseCapabilityList(execFileSync(ffmpeg, ['-hide_banner', '-encoders'], {encoding: 'utf8', windowsHide: true}));
  const missingFilters = REQUIRED_FILTERS.filter(f => !filters.has(f));
  const missingEncoders = REQUIRED_ENCODERS.filter(e => !encoders.has(e));
  if (missingFilters.length || missingEncoders.length) throw new Error(`${ffmpeg} is missing ${[...missingFilters.map(f => `filter ${f}`), ...missingEncoders.map(e => `encoder ${e}`)].join(', ')}. ${install}`);
  const version = execFileSync(ffmpeg, ['-hide_banner', '-version'], {encoding: 'utf8', windowsHide: true}).split(/\r?\n/)[0];
  return {ffmpeg, ffprobe, version};
};

export const makeTools = ({ffmpeg, ffprobe, version}) => ({
  ffmpegPath: ffmpeg,
  ffprobePath: ffprobe,
  ffmpegVersion: version,
  ffmpeg: args => run(ffmpeg, ['-hide_banner', '-nostdin', ...args]),
  probe: async file => JSON.parse((await run(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file])).stdout),
});

/** Extracts the last JSON object printed by loudnorm (print_format=json) from ffmpeg stderr. */
export const parseLoudnormJson = stderr => {
  const end = stderr.lastIndexOf('}');
  const start = stderr.lastIndexOf('{', end);
  if (start < 0 || end < 0) throw new Error('loudnorm did not print a measurement');
  return JSON.parse(stderr.slice(start, end + 1));
};

/** Parses silencedetect output into [{startMs, endMs}]. An unterminated silence runs to `durationMs`. */
export const parseSilences = (stderr, durationMs) => {
  const silences = [];
  let open = null;
  for (const line of stderr.split(/\r?\n/)) {
    const s = line.match(/silence_start:\s*(-?[\d.]+)/);
    if (s) open = Math.max(0, Number(s[1]) * 1000);
    const e = line.match(/silence_end:\s*(-?[\d.]+)/);
    if (e && open !== null) { silences.push({startMs: open, endMs: Number(e[1]) * 1000}); open = null; }
  }
  if (open !== null) silences.push({startMs: open, endMs: durationMs});
  return silences.filter(s => s.endMs > s.startMs);
};
