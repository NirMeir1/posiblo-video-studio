import fs from 'node:fs';
import path from 'node:path';
import {downloadWhisperModel, loadWhisperModel, transcribe, toCaptions} from '@remotion/whisper-webgpu';

// Input must be mono 16 kHz PCM16 WAV. Outputs are isolated per recording/model.
const [wavPath, outputDirectory, language, model = 'large-v3-turbo'] = process.argv.slice(2);
if (!wavPath || !outputDirectory || !language) throw new Error('Usage: node scripts/transcribe-source.mjs <mono-16k-pcm16.wav> <output-directory> <language> [model]');
const destination = path.resolve(outputDirectory);
const relative = path.relative(process.cwd(), destination);
if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).includes('references')) throw new Error('Output must be a new subdirectory inside the workspace, outside references');
const rawPath = path.join(destination, `transcription-${model}.json`);
const captionPath = path.join(destination, `captions-${model}.json`);
if (fs.existsSync(rawPath) || fs.existsSync(captionPath)) throw new Error('Transcription output already exists; choose a distinct destination');
const wav = fs.readFileSync(wavPath);
if (wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Expected RIFF WAV');
let offset = 12;
let format;
let samples;
while (offset + 8 <= wav.length) {
  const id = wav.toString('ascii', offset, offset + 4);
  const size = wav.readUInt32LE(offset + 4);
  const start = offset + 8;
  if (start + size > wav.length) throw new Error('Truncated WAV chunk');
  if (id === 'fmt ') format = {codec: wav.readUInt16LE(start), channels: wav.readUInt16LE(start + 2), rate: wav.readUInt32LE(start + 4), bits: wav.readUInt16LE(start + 14)};
  if (id === 'data') samples = wav.subarray(start, start + size);
  offset = start + size + size % 2;
}
if (!format || format.codec !== 1 || format.channels !== 1 || format.rate !== 16000 || format.bits !== 16 || !samples) throw new Error('Expected mono 16 kHz PCM16 WAV with audio');
const waveform = new Float32Array(samples.length / 2);
for (let i = 0; i < waveform.length; i++) waveform[i] = samples.readInt16LE(i * 2) / 32768;
console.log(`Transcribing ${waveform.length / 16000}s with ${model}, language=${language}; automatic, not human verified`);
await downloadWhisperModel({model});
const handle = await loadWhisperModel({model});
try {
  const result = await transcribe({channelWaveform: waveform, model, language, task: 'transcribe'});
  const {captions} = toCaptions({whisperWebGpuOutput: result});
  fs.mkdirSync(destination, {recursive: true});
  fs.writeFileSync(rawPath, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  fs.writeFileSync(captionPath, JSON.stringify(captions, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({rawPath, captionPath, words: captions.length, text: captions.map(c => c.text).join(' ')}));
} finally {
  await handle[Symbol.asyncDispose]();
}
