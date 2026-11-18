import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {copySourcePreserving, ingest} from '../../scripts/pipeline/stages/ingest.mjs';
import {sha256File} from '../../scripts/pipeline/lib/util.mjs';
import {tempDir} from './helpers.mjs';

const makeSource = () => {
  const dir = tempDir('src');
  const file = path.join(dir, 'My Recording.MP4');
  fs.writeFileSync(file, Buffer.from(Array.from({length: 4096}, (_, i) => i % 251)));
  const when = new Date('2026-01-02T03:04:05Z');
  fs.utimesSync(file, when, when);
  fs.chmodSync(file, 0o444); // read-only: any write attempt to the original would throw
  return file;
};

const fingerprint = file => ({size: fs.statSync(file).size, mtime: fs.statSync(file).mtimeMs});

test('copySourcePreserving copies byte-identically and leaves the original untouched', async () => {
  const source = makeSource();
  const before = {hash: await sha256File(source), ...fingerprint(source)};
  const dest = path.join(tempDir('run'), '01-ingest', 'source.mp4');
  await copySourcePreserving(source, dest);
  assert.equal(await sha256File(dest), before.hash);
  assert.deepEqual({hash: await sha256File(source), ...fingerprint(source)}, before);
  // Running again with an identical copy is a no-op, not an error.
  await copySourcePreserving(source, dest);
});

test('copySourcePreserving refuses to overwrite a different file or copy onto itself', async () => {
  const source = makeSource();
  const dest = path.join(tempDir('run'), 'source.mp4');
  fs.writeFileSync(dest, 'something else');
  await assert.rejects(copySourcePreserving(source, dest), /refusing to overwrite/);
  assert.equal(fs.readFileSync(dest, 'utf8'), 'something else');
  await assert.rejects(copySourcePreserving(source, source), /onto itself/);
});

test('ingest stage works only on the copy and records provenance', async () => {
  const source = makeSource();
  const sourceHash = await sha256File(source);
  const before = fingerprint(source);
  const runDir = tempDir('run');
  const seen = [];
  const tools = {
    ffmpegPath: 'ffmpeg', ffprobePath: 'ffprobe', ffmpegVersion: 'test',
    probe: async file => { seen.push(['probe', file]); return {format: {duration: '12.5'}, streams: [{codec_type: 'video', codec_name: 'h264', width: 1080, height: 1920, avg_frame_rate: '30/1', pix_fmt: 'yuv420p'}, {codec_type: 'audio', codec_name: 'aac', sample_rate: '48000', channels: 2}]}; },
    ffmpeg: async args => { seen.push(['ffmpeg', ...args]); fs.writeFileSync(args.at(-1), 'wav'); return {stdout: '', stderr: ''}; },
  };
  const result = await ingest({runDir, sourcePath: source, sourceSha256: sourceHash, tools, repoRoot: process.cwd(), log: () => {}});
  const copy = path.join(runDir, '01-ingest', 'source.mp4');
  assert.ok(result.outputs.includes('01-ingest/source.mp4'));
  assert.equal(await sha256File(copy), sourceHash);
  // Every tool invocation reads the copy, never the original.
  assert.ok(seen.every(call => !call.includes(source)), JSON.stringify(seen));
  assert.ok(seen.some(call => call.includes(copy)));
  const provenance = JSON.parse(fs.readFileSync(path.join(runDir, '01-ingest', 'provenance.json'), 'utf8'));
  assert.equal(provenance.original.sha256, sourceHash);
  assert.equal(provenance.original.path, source);
  assert.equal(provenance.media.orientation, 'portrait');
  assert.equal(await sha256File(source), sourceHash);
  assert.deepEqual(fingerprint(source), before);
});

test('ingest rejects a source without audio', async () => {
  const source = makeSource();
  const tools = {probe: async () => ({format: {duration: '3'}, streams: [{codec_type: 'video', width: 720, height: 1280}]}), ffmpeg: async () => ({})};
  await assert.rejects(ingest({runDir: tempDir('run'), sourcePath: source, sourceSha256: await sha256File(source), tools, repoRoot: process.cwd(), log: () => {}}), /no audio stream/);
});
