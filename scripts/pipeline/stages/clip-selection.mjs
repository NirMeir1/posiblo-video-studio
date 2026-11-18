// Stage 5 (Anthropic API):
//   call 1 - 5-6 candidate clips of 20-60 s on sentence boundaries, with reasons;
//   call 2 - the scene plan: where an animated explanation helps and where it does not
//            (zero scenes is a valid answer). The plan is shown in Studio and must be
//            approved before stage 7 renders.
import {runPaths, rel} from '../lib/paths.mjs';
import {CLIP_RULES, CLIP_SYSTEM, buildClipPrompt, candidateWindows, requiredCount, toSentences, validateClipResponse} from '../lib/clips.mjs';
import {SCENE_SYSTEM, buildScenePrompt, loadSceneExample, scenePlanMarkdown, validateScenePlan} from '../lib/scenes.mjs';
import {requestValidatedJson} from '../lib/anthropic.mjs';
import {readJson, writeJson, writeText} from '../lib/util.mjs';
import fs from 'node:fs';

const ask = async ({client, model, system, prompt, validate, attemptsFile}) => {
  const attempts = [];
  try {
    return await requestValidatedJson({client, model, system, prompt, validate, onAttempt: a => { attempts.push(a); writeJson(attemptsFile, {model, attempts}); }});
  } catch (error) {
    writeJson(attemptsFile, {model, attempts, error: error.message});
    throw error;
  }
};

export const clipSelection = async ({runDir, slug, options, anthropic, sourceSha256, log}) => {
  if (!anthropic) throw new Error('Anthropic configuration was not loaded');
  const paths = runPaths(runDir);
  const transcript = readJson(paths.cut.transcript);
  const sentences = toSentences(transcript.words);
  writeJson(paths.clips.sentences, {timeline: 'edited', sentences});
  const durationMs = transcript.durationMs;
  const windows = candidateWindows(sentences);
  const count = requiredCount(windows.length);
  let result = {fullVideoTitle: null, clips: []};
  let note = null;
  const outputs = [paths.clips.sentences, paths.clips.clips, paths.clips.scenePlan, paths.clips.scenePlanMd, paths.clips.sceneAttempts];

  if (!windows.length) {
    note = `No sentence-bounded range of 20-60 s exists in the ${(durationMs / 1000).toFixed(1)} s edited video, so no clips were requested. Only the full video will be rendered.`;
    log(`  ${note}`);
  } else {
    const {value, attempts} = await ask({client: anthropic.client(), model: anthropic.model, system: CLIP_SYSTEM,
      prompt: buildClipPrompt({sentences, durationMs, count, language: options.language}),
      validate: json => validateClipResponse(json, {sentences, durationMs, language: options.language}), attemptsFile: paths.clips.attempts});
    result = value;
    outputs.push(paths.clips.attempts);
    log(`  ${result.clips.length} clips accepted after ${attempts} API call(s) (${anthropic.model})`);
    if (windows.length < CLIP_RULES.minCount) note = `Only ${windows.length} distinct sentence-bounded 20-60 s ranges exist, so ${count.min} clip(s) were requested instead of 5-6.`;
  }
  writeJson(paths.clips.clips, {
    timeline: 'edited', model: anthropic.model, createdAt: new Date().toISOString(), machineGenerated: true,
    editedDurationMs: durationMs, sentences: sentences.length, windowsAvailable: windows.length, requested: count, rules: CLIP_RULES, note,
    fullVideoTitle: result.fullVideoTitle, clips: result.clips,
    review: 'Machine-selected. Titles are generated text shown on screen: check them against the speech before posting.',
  });

  const {example, note: exampleNote} = loadSceneExample(sourceSha256);
  log(`  ${exampleNote}`);
  const {value: plan, attempts: sceneAttempts} = await ask({client: anthropic.client(), model: anthropic.sceneModel, system: SCENE_SYSTEM,
    prompt: buildScenePrompt({sentences, durationMs, language: options.language, example}),
    validate: json => validateScenePlan(json, {sentences, durationMs, language: options.language}), attemptsFile: paths.clips.sceneAttempts});
  // A new plan always needs a new approval.
  fs.rmSync(paths.clips.sceneApproval, {force: true});
  writeJson(paths.clips.scenePlan, {timeline: 'edited', model: anthropic.sceneModel, createdAt: new Date().toISOString(), machineGenerated: true, workedExample: exampleNote, ...plan,
    review: 'Machine judgment. Preview in Studio, edit or delete scenes here if needed, then approve with --approve-scenes.'});
  writeText(paths.clips.scenePlanMd, scenePlanMarkdown({plan, model: anthropic.sceneModel, slug}));
  log(`  scene plan: ${plan.scenes.length ? plan.scenes.map(s => `${s.type} ${(s.startMs / 1000).toFixed(1)}-${(s.endMs / 1000).toFixed(1)} s`).join(', ') : 'no scenes'} after ${sceneAttempts} API call(s) (${anthropic.sceneModel})`);
  return {outputs: outputs.map(f => rel(runDir, f)), summary: {clips: result.clips.length, windowsAvailable: windows.length, note, scenes: plan.scenes.length}};
};
