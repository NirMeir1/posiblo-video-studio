// Stage 8 (Anthropic API): Hebrew title, caption and hashtags per export for Facebook Reels,
// Instagram Reels and TikTok. Validated, then saved to out/<slug>/metadata.json.
import {runPaths, rel} from '../lib/paths.mjs';
import {METADATA_LIMITS, METADATA_SYSTEM, buildMetadataPrompt, validateMetadataResponse} from '../lib/metadata.mjs';
import {requestValidatedJson} from '../lib/anthropic.mjs';
import {readJson, writeJson} from '../lib/util.mjs';
import path from 'node:path';

export const metadata = async ({runDir, options, anthropic, log}) => {
  if (!anthropic) throw new Error('Anthropic configuration was not loaded');
  const paths = runPaths(runDir);
  const manifest = readJson(paths.render.manifest);
  const items = manifest.exports.map(e => ({
    id: e.name, output: e.output, title: e.title, durationMs: e.range.endMs - e.range.startMs,
    text: readJson(path.join(runDir, e.captions)).map(c => c.text).join('').trim(),
  }));
  const attempts = [];
  const {value, attempts: used} = await requestValidatedJson({
    client: anthropic.client(), model: anthropic.model, system: METADATA_SYSTEM, prompt: buildMetadataPrompt(items),
    validate: json => validateMetadataResponse(json, {ids: items.map(i => i.id), language: options.language}),
    onAttempt: a => { attempts.push(a); writeJson(paths.metadata.attempts, {model: anthropic.model, attempts}); },
  }).catch(error => { writeJson(paths.metadata.attempts, {model: anthropic.model, attempts, error: error.message}); throw error; });
  writeJson(paths.metadata.file, {
    generatedAt: new Date().toISOString(), model: anthropic.model, language: options.language, machineGenerated: true, humanReviewed: false,
    note: 'Generated text. Check every title, caption and hashtag against the speech before posting. Length limits here are local checks, not verified current platform requirements.',
    limits: METADATA_LIMITS,
    items: value.map(v => ({...v, export: items.find(i => i.id === v.id).output, durationMs: Math.round(items.find(i => i.id === v.id).durationMs)})),
  });
  log(`  metadata for ${value.length} export(s) after ${used} API call(s)`);
  return {outputs: [paths.metadata.file, paths.metadata.attempts].map(f => rel(runDir, f)), summary: {items: value.length}};
};
