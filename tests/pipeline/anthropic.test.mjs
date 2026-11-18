// Malformed-response handling with a mocked client. No real API calls are made.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MalformedResponseError, extractJson, readAnthropicConfig, requestValidatedJson} from '../../scripts/pipeline/lib/anthropic.mjs';
import {validateClipResponse} from '../../scripts/pipeline/lib/clips.mjs';
import {validateMetadataResponse} from '../../scripts/pipeline/lib/metadata.mjs';
import {mockClient} from './helpers.mjs';

const sentences = Array.from({length: 20}, (_, i) => ({index: i, startMs: i * 8500, endMs: i * 8500 + 8000, text: `משפט ${i}.`}));
const ctx = {sentences, durationMs: 170000, language: 'he'};
const clip = (a, b) => ({startMs: sentences[a].startMs, endMs: sentences[b].endMs, title: 'כותרת', reason: 'Works alone.'});
const goodClips = JSON.stringify({fullVideoTitle: 'כותרת ראשית', clips: [clip(0, 2), clip(3, 5), clip(6, 8), clip(9, 12), clip(13, 15)]});
const request = (client, extra = {}) => requestValidatedJson({client, model: 'test-model', system: 's', prompt: 'p', validate: json => validateClipResponse(json, ctx), ...extra});

test('invalid JSON is retried once, with the problem explained, then accepted', async () => {
  const client = mockClient(['{"fullVideoTitle": "x", "clips": [}', goodClips]);
  const {value, attempts} = await request(client);
  assert.equal(attempts, 2);
  assert.equal(value.clips.length, 5);
  assert.equal(client.requests.length, 2);
  const followUp = client.requests[1].messages;
  assert.equal(followUp.at(-2).role, 'assistant');
  assert.match(followUp.at(-1).content, /did not parse/);
});

test('two invalid responses produce a clear error and exactly two calls', async () => {
  const client = mockClient(['not json at all', 'still not json']);
  await assert.rejects(request(client), err => err instanceof MalformedResponseError && /still invalid after one retry/.test(err.message));
  assert.equal(client.requests.length, 2);
});

test('missing fields are retried and reported', async () => {
  const missing = JSON.stringify({clips: [{startMs: 0}]});
  const client = mockClient([missing, missing]);
  await assert.rejects(request(client), err => /fullVideoTitle/.test(err.message) && /endMs must be a finite number/.test(err.message));
});

test('out-of-range times are retried, and a corrected answer is accepted', async () => {
  const bad = JSON.parse(goodClips);
  bad.clips[0].endMs = 999999;
  const client = mockClient([JSON.stringify(bad), goodClips]);
  const {attempts} = await request(client);
  assert.equal(attempts, 2);
  assert.match(client.requests[1].messages.at(-1).content, /outside the video/);
});

test('JSON in a code fence with surrounding prose is parsed', async () => {
  const client = mockClient([`Here you go:\n\`\`\`json\n${goodClips}\n\`\`\`\nThanks`]);
  const {attempts} = await request(client);
  assert.equal(attempts, 1);
});

test('refusal and max_tokens stop reasons count as malformed and are retried once', async () => {
  const refusal = {stop_reason: 'refusal', stop_details: {category: 'other'}, content: []};
  const client = mockClient([refusal, goodClips]);
  assert.equal((await request(client)).attempts, 2);
  // With no assistant text to echo, the retry resends the original prompt plus the note.
  assert.equal(client.requests[1].messages.length, 1);
  assert.match(client.requests[1].messages[0].content, /declined/);
  const truncated = {stop_reason: 'max_tokens', content: [{type: 'text', text: '{"clips": ['}]};
  await assert.rejects(request(mockClient([truncated, truncated])), /max_tokens/);
});

test('API errors are not treated as malformed output and are not retried by the pipeline', async () => {
  const client = mockClient([new Error('401 authentication_error')]);
  await assert.rejects(request(client), /401/);
  assert.equal(client.requests.length, 1);
});

test('requests use the configured model', async () => {
  const client = mockClient([goodClips]);
  await request(client);
  assert.equal(client.requests[0].model, 'test-model');
});

test('missing environment configuration fails clearly without printing values', () => {
  assert.throws(() => readAnthropicConfig({}), /Missing ANTHROPIC_API_KEY and ANTHROPIC_MODEL/);
  assert.throws(() => readAnthropicConfig({ANTHROPIC_API_KEY: 'secret-value'}), err => /ANTHROPIC_MODEL/.test(err.message) && !err.message.includes('secret-value'));
  assert.deepEqual(readAnthropicConfig({ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: ' m '}), {model: 'm', sceneModel: 'm'});
  assert.deepEqual(readAnthropicConfig({ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'm', ANTHROPIC_SCENE_MODEL: 's'}), {model: 'm', sceneModel: 's'});
});

test('extractJson rejects empty and object-less text', () => {
  assert.throws(() => extractJson(''), MalformedResponseError);
  assert.throws(() => extractJson('no braces here'), /no JSON object/);
});

const platform = (o = {}) => ({title: 'כותרת', caption: 'תיאור קצר בעברית', hashtags: ['#עסקים', '#אוטומציה', '#posiblo'], ...o});
const item = (id, o = {}) => ({id, facebookReels: platform(), instagramReels: platform(), tiktok: platform(), ...o});

test('metadata: valid response accepted; malformed variants rejected', async () => {
  const ids = ['full', 'clip-01'];
  assert.deepEqual(validateMetadataResponse({items: [item('full'), item('clip-01')]}, {ids}).problems, []);
  const cases = [
    [{items: [item('full')]}, /missing items for: clip-01/],
    [{items: [item('full'), item('clip-01'), item('clip-09')]}, /unknown item ids: clip-09/],
    [{items: [item('full'), item('clip-01', {tiktok: undefined})]}, /clip-01.tiktok is missing/],
    [{items: [item('full'), item('clip-01', {tiktok: platform({hashtags: ['no hash', '#ok', '#ok2']})})]}, /invalid entries/],
    [{items: [item('full'), item('clip-01', {tiktok: platform({hashtags: ['#a']})})]}, /3-8 entries/],
    [{items: [item('full'), item('clip-01', {tiktok: platform({title: 'English only'})})]}, /must be in Hebrew/],
    [{items: [item('full'), item('clip-01', {tiktok: platform({caption: 'א'.repeat(3000)})})]}, /maximum 2200/],
    [{nope: true}, /"items" array/],
  ];
  for (const [json, pattern] of cases) assert.ok(validateMetadataResponse(json, {ids}).problems.some(p => pattern.test(p)), String(pattern));
  const client = mockClient(['{"items": []}', JSON.stringify({items: [item('full'), item('clip-01')]})]);
  const {value, attempts} = await requestValidatedJson({client, model: 'm', system: 's', prompt: 'p', validate: json => validateMetadataResponse(json, {ids})});
  assert.equal(attempts, 2);
  assert.deepEqual(value.map(v => v.id), ids);
});
