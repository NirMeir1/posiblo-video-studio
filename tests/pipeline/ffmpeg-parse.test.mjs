import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCapabilityList, parseLoudnormJson, parseSilences} from '../../scripts/pipeline/lib/ffmpeg.mjs';
import {selectExpression} from '../../scripts/pipeline/stages/clean-cut.mjs';
import {chooseResolution} from '../../scripts/pipeline/stages/render.mjs';

test('filter list parsing finds required filters and reports missing ones', () => {
  const sample = `Filters:\n  T.. = Timeline support\n ... afftdn            A->A       Denoise audio samples.\n T.C loudnorm          A->A       EBU R128 loudness normalization\n ... silencedetect     A->A       Detect silence.\n V....D libx264       libx264 H.264`;
  const set = parseCapabilityList(sample);
  assert.ok(set.has('afftdn') && set.has('loudnorm') && set.has('silencedetect') && set.has('libx264'));
  assert.ok(!set.has('silenceremove'));
});

test('silencedetect output parsing, including an unterminated final silence', () => {
  const stderr = '[silencedetect @ 0x1] silence_start: 1.25\n[silencedetect @ 0x1] silence_end: 2.5 | silence_duration: 1.25\n[silencedetect @ 0x1] silence_start: 9.9\n';
  assert.deepEqual(parseSilences(stderr, 12000), [{startMs: 1250, endMs: 2500}, {startMs: 9900, endMs: 12000}]);
});

test('loudnorm JSON is taken from the end of stderr', () => {
  const stderr = 'noise {not json}\n[Parsed_loudnorm_0 @ 0x2]\n{\n\t"input_i" : "-23.10",\n\t"input_tp" : "-4.00"\n}\n';
  assert.equal(parseLoudnormJson(stderr).input_i, '-23.10');
  assert.throws(() => parseLoudnormJson('nothing'), /did not print/);
});

test('video select expression uses inclusive frame indexes', () => {
  assert.equal(selectExpression([{startFrame: 0, endFrame: 30}, {startFrame: 90, endFrame: 150}]), 'between(n,0,29)+between(n,90,149)');
});

test('output resolution follows the source short side', () => {
  assert.deepEqual(chooseResolution({width: 1080, height: 1920}), {width: 1080, height: 1920});
  assert.deepEqual(chooseResolution({width: 1920, height: 1080}), {width: 1080, height: 1920});
  assert.deepEqual(chooseResolution({width: 480, height: 854}), {width: 720, height: 1280});
});
