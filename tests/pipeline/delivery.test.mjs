import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {DEFAULT_DELIVERY_DIR, deliver, deliveryDir} from '../../scripts/pipeline/lib/delivery.mjs';
import {tempDir} from './helpers.mjs';

const setup = () => {
  const run = tempDir('deliver-run');
  const out = path.join(tempDir('deliver-out'), 'Edit Videos');
  const full = path.join(run, 'take-full.mp4');
  const clip = path.join(run, 'take-clip-01.mp4');
  const meta = path.join(run, 'metadata.json');
  fs.writeFileSync(full, 'full video');
  fs.writeFileSync(clip, 'clip video');
  fs.writeFileSync(meta, '{}');
  return {run, out, full, clip, meta};
};

test('the delivery folder defaults to C:\\Edit Videos and can be overridden', () => {
  assert.equal(DEFAULT_DELIVERY_DIR, 'C:\\Edit Videos');
  assert.equal(deliveryDir({}), 'C:\\Edit Videos');
  assert.equal(deliveryDir({POSIBLO_DELIVERY_DIR: '  '}), 'C:\\Edit Videos');
  assert.equal(deliveryDir({POSIBLO_DELIVERY_DIR: 'D:\\Out'}), 'D:\\Out');
});

test('verified exports and metadata are delivered; failed exports are not', async () => {
  const {out, full, clip, meta} = setup();
  const result = await deliver({dir: out, sourcePreserved: true,
    exports: [{name: 'full', file: full, automatedPass: true}, {name: 'clip-01', file: clip, automatedPass: false}],
    extras: [{file: meta, as: 'take-metadata.json'}]});
  assert.deepEqual(fs.readdirSync(out).sort(), ['take-full.mp4', 'take-metadata.json']);
  assert.equal(fs.readFileSync(path.join(out, 'take-full.mp4'), 'utf8'), 'full video');
  assert.deepEqual(result.skipped, [{name: 'clip-01', reason: 'automated checks failed'}]);
  assert.equal(result.delivered[0].result, 'copied');
});

test('re-delivery skips identical files and reports replaced ones; no .partial file is left', async () => {
  const {out, full} = setup();
  const exports = [{name: 'full', file: full, automatedPass: true}];
  await deliver({dir: out, sourcePreserved: true, exports});
  assert.equal((await deliver({dir: out, sourcePreserved: true, exports})).delivered[0].result, 'unchanged');
  fs.writeFileSync(full, 'new render');
  assert.equal((await deliver({dir: out, sourcePreserved: true, exports})).delivered[0].result, 'replaced');
  assert.equal(fs.readFileSync(path.join(out, 'take-full.mp4'), 'utf8'), 'new render');
  assert.deepEqual(fs.readdirSync(out), ['take-full.mp4']);
});

test('nothing is delivered when the source is not verified as preserved', async () => {
  const {out, full} = setup();
  const result = await deliver({dir: out, sourcePreserved: false, exports: [{name: 'full', file: full, automatedPass: true}]});
  assert.equal(result.delivered.length, 0);
  assert.equal(fs.existsSync(out), false);
});
