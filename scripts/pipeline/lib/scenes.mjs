// Scene planning (stage 5, second API call): decide where an animated explanation helps and
// where the speaker alone is better. Pure prompt/validation code; the stage does the I/O.
import {normalizeToken} from './cutplan.mjs';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {round} from './util.mjs';

export const EXAMPLE_FILE = fileURLToPath(new URL('../examples/posiblo-v1-scenes.json', import.meta.url));

/** The approved-reference worked example, unless the input is that same recording (it would just be copied). */
export const loadSceneExample = (sourceSha256, file = EXAMPLE_FILE) => {
  const example = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (example.sourceSha256 === sourceSha256) return {example: null, note: `Worked example ${example.id} omitted: the input is the example's own recording.`};
  return {example, note: `Worked example ${example.id} included.`};
};

export const formatExample = ex => [
  "WORKED EXAMPLE - Posiblo's approved reference video (a different recording; learn the judgment, never copy its text):",
  '', 'Sentences:',
  ...ex.sentences.map(s => `${s.index}. [${s.startMs}-${s.endMs}] ${s.text}`),
  '', `Its decision: ${ex.decision}`,
  '', 'Its scenes:',
  ...ex.scenes.flatMap((s, i) => [
    `${i + 1}. ${s.type}, sentences ${s.startSentence}-${s.endSentence} (${s.actualTiming})`,
    `   heading: ${s.heading}`,
    `   items: ${s.items.map(it => it.label + (it.detail ? ` (${it.detail})` : '')).join(' | ') || 'none'}`,
    `   drawn as: ${s.drawnAs}`,
    `   why: ${s.why}`,
  ]),
  '', 'No scene:',
  ...ex.noScene.map(n => `- sentences ${n.sentences.join(', ')}: ${n.why}`),
  '', 'Lessons:',
  ...ex.lessons.map(l => `- ${l}`),
].join('\n');

export const SCENE_TYPES = {
  flow: {min: 2, max: 4, use: 'a process or chain of 2-4 steps that happen in order'},
  cards: {min: 2, max: 3, use: 'a short list of 2-3 concrete, parallel items'},
  comparison: {min: 2, max: 2, use: 'a problem/solution or before/after contrast: item 1 = problem/before, item 2 = solution/after'},
  question: {min: 0, max: 0, use: 'a key question or takeaway the viewer should keep (heading only)'},
};
export const SCENE_ICONS = ['chat', 'web', 'people', 'list', 'link', 'check', 'clock', 'alert', 'spark'];
export const SCENE_RULES = {minMs: 3000, maxMs: 20000, notBeforeMs: 3000, headingMax: 40, labelMax: 28, detailMax: 48, msPerScene: 12000, maxScenes: 5};
const HEBREW = /[֐-׿]/;

export const maxScenes = (durationMs, rules = SCENE_RULES) => Math.min(rules.maxScenes, Math.floor(durationMs / rules.msPerScene) + 1);

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

/** Fraction of on-screen words that appear in the spoken text (Hebrew one-letter prefixes ignored). */
export const groundedShare = (texts, spoken) => {
  const source = normalizeToken(spoken).replace(/\s+/g, ' ');
  const tokens = texts.join(' ').split(/\s+/).map(normalizeToken).filter(t => t.length >= 2);
  if (!tokens.length) return 1;
  const found = tokens.filter(t => source.includes(t) || (t.length >= 3 && /^[והבלמשכ]/.test(t) && source.includes(t.slice(1))));
  return found.length / tokens.length;
};

/**
 * Validates {decision, noSceneReason?, scenes: [{type, startSentence, endSentence, heading, items, reason}]}.
 * Returns {value, problems}. Ungrounded on-screen text is not rejected but marked for review.
 */
export const validateScenePlan = (json, {sentences, durationMs, language = 'he', rules = SCENE_RULES}) => {
  const problems = [];
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {value: null, problems: ['top level must be a JSON object']};
  if (!isText(json.decision, 1500)) problems.push('decision must be a non-empty string of at most 1500 characters (the overall judgment)');
  if (!Array.isArray(json.scenes)) return {value: null, problems: [...problems, 'scenes must be an array (it may be empty)']};
  if (!json.scenes.length && !isText(json.noSceneReason, 1500)) problems.push('noSceneReason (at most 1500 characters) is required when scenes is empty');
  const limit = maxScenes(durationMs, rules);
  if (json.scenes.length > limit) problems.push(`at most ${limit} scenes for a ${(durationMs / 1000).toFixed(0)} s video; got ${json.scenes.length}`);
  const scenes = [];
  json.scenes.forEach((scene, i) => {
    const at = `scenes[${i}]`;
    if (!scene || typeof scene !== 'object') { problems.push(`${at} must be an object`); return; }
    const spec = SCENE_TYPES[scene.type];
    if (!spec) { problems.push(`${at}.type must be one of ${Object.keys(SCENE_TYPES).join(', ')}`); return; }
    const {startSentence: a, endSentence: b} = scene;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b >= sentences.length || b < a) { problems.push(`${at} startSentence/endSentence must be sentence indices 0-${sentences.length - 1} with start <= end`); return; }
    const startMs = sentences[a].startMs;
    const endMs = sentences[b].endMs;
    if (startMs < rules.notBeforeMs) problems.push(`${at} starts at ${startMs} ms; scenes must start at or after ${rules.notBeforeMs} ms (opening title)`);
    if (endMs - startMs < rules.minMs || endMs - startMs > rules.maxMs) problems.push(`${at} lasts ${((endMs - startMs) / 1000).toFixed(1)} s; scenes must last 3-20 s`);
    if (!isText(scene.heading, rules.headingMax)) problems.push(`${at}.heading must be a non-empty string of at most ${rules.headingMax} characters`);
    else if (language === 'he' && !HEBREW.test(scene.heading)) problems.push(`${at}.heading must be in Hebrew`);
    if (!isText(scene.reason, 1000)) problems.push(`${at}.reason must explain why this scene helps (at most 1000 characters)`);
    const items = Array.isArray(scene.items) ? scene.items : [];
    if (items.length < spec.min || items.length > spec.max) problems.push(`${at} (${scene.type}) needs ${spec.min === spec.max ? spec.min : `${spec.min}-${spec.max}`} items; got ${items.length}`);
    const cleanItems = items.map((item, k) => {
      if (!item || !isText(item.label, rules.labelMax)) problems.push(`${at}.items[${k}].label must be a non-empty string of at most ${rules.labelMax} characters`);
      else if (language === 'he' && !HEBREW.test(item.label)) problems.push(`${at}.items[${k}].label must be in Hebrew`);
      if (item?.detail !== undefined && item.detail !== '' && !isText(item.detail, rules.detailMax)) problems.push(`${at}.items[${k}].detail must be at most ${rules.detailMax} characters`);
      return {label: String(item?.label ?? '').trim(), detail: typeof item?.detail === 'string' ? item.detail.trim() : '', icon: SCENE_ICONS.includes(item?.icon) ? item.icon : 'check'};
    });
    const spoken = sentences.slice(a, b + 1).map(s => s.text).join(' ');
    const share = groundedShare([scene.heading ?? '', ...cleanItems.flatMap(x => [x.label, x.detail])], spoken);
    scenes.push({type: scene.type, startSentence: a, endSentence: b, startMs: round(startMs), endMs: round(endMs), heading: String(scene.heading ?? '').trim(), items: cleanItems, reason: String(scene.reason ?? '').trim(), spoken,
      groundedShare: round(share, 2), reviewFlags: share < 0.5 ? ['on-screen text is not clearly taken from the speech - check it'] : []});
  });
  const sorted = [...scenes].sort((x, y) => x.startMs - y.startMs);
  for (let i = 1; i < sorted.length; i++) if (sorted[i].startMs < sorted[i - 1].endMs) problems.push(`scenes overlap at sentence ${sorted[i].startSentence}`);
  if (problems.length) return {value: null, problems};
  return {value: {decision: json.decision.trim(), noSceneReason: sorted.length ? null : json.noSceneReason.trim(), scenes: sorted.map((s, i) => ({id: `scene-${String(i + 1).padStart(2, '0')}`, ...s}))}, problems};
};

export const SCENE_SYSTEM = 'You are the motion-graphics editor for Posiblo short videos. You decide, with restraint, whether an animated explanation helps the viewer, and you return valid JSON only.';

export const buildScenePrompt = ({sentences, durationMs, language, example = null}) => {
  const lang = language === 'he' ? 'Hebrew' : `the transcript's language (${language})`;
  return `Below is the automatic transcript of a vertical talking-head video (${(durationMs / 1000).toFixed(1)} s), split into numbered sentences with times in ms.

Decide where, if anywhere, an animated explanatory scene should appear. During a scene the speaker shrinks to a small corner window and a simple diagram explains what they are saying; captions stay on screen.

Add a scene ONLY where the speaker explains something that is clearer as a picture:
${Object.entries(SCENE_TYPES).map(([type, s]) => `- "${type}": ${s.use}`).join('\n')}

Do NOT add a scene for personal introductions, stories, opinions, emotion, humour, short punchy lines, or moments where the speaker's face and delivery carry the message. Graphics must explain something specific; never add motion just to fill the frame. A few excellent scenes beat many. Zero scenes is the right answer for many videos - say so and explain why.

Rules:
- Use sentence indices: a scene covers sentences startSentence..endSentence. It lasts 3-20 s, starts at or after 3000 ms (the opening title is on screen before that), and scenes do not overlap.
- At most ${maxScenes(durationMs)} scenes.
- All on-screen text in ${lang}, taken from what the speaker actually says (shortened). A heading may frame the idea in a few words, for example as a question, but adds no facts. No invented numbers, tools, claims or examples. The transcript may contain recognition errors; do not put garbled words on screen.
- "heading": at most ${SCENE_RULES.headingMax} characters. Item "label": at most ${SCENE_RULES.labelMax}; optional "detail": at most ${SCENE_RULES.detailMax}. Optional "icon": one of ${SCENE_ICONS.join(', ')}.
- "reason" (English is fine): why this moment benefits from a scene.
- "decision" (English is fine): your overall judgment for this video, including why other parts get no scene.

${example ? `${formatExample(example)}

Now plan the video below with the same judgment. Its content is different, so its scenes will be different; it may need more, fewer or no scenes.

` : ''}Return only a JSON object in exactly this shape:
{"decision": "...", "noSceneReason": "... (required only if scenes is empty)", "scenes": [{"type": "flow", "startSentence": 0, "endSentence": 0, "heading": "...", "items": [{"label": "...", "detail": "...", "icon": "check"}], "reason": "..."}]}

Sentences:
${sentences.map(s => `${s.index}. [${s.startMs}-${s.endMs}] ${s.text}`).join('\n')}`;
};

/** Human-readable plan for review (the JSON file is what the render uses). */
export const scenePlanMarkdown = ({plan, model, slug}) => [
  `# Scene plan: ${slug}`, '',
  `Machine-generated by ${model}. Review it in Studio before approving. Edit or delete scenes in \`05-clip-selection/scene-plan.json\`, then approve with \`npm run pipeline -- <video> --approve-scenes\`.`, '',
  `**Overall decision:** ${plan.decision}`, '',
  ...(plan.scenes.length ? plan.scenes.flatMap(s => [
    `## ${s.id}: ${s.type}, ${(s.startMs / 1000).toFixed(1)}-${(s.endMs / 1000).toFixed(1)} s`, '',
    `- Heading: ${s.heading}`,
    ...s.items.map((it, i) => `- Item ${i + 1}: ${it.label}${it.detail ? ` - ${it.detail}` : ''}`),
    `- Why: ${s.reason}`,
    `- Speech: ${s.spoken}`,
    ...(s.reviewFlags.length ? [`- REVIEW: ${s.reviewFlags.join('; ')}`] : []), '',
  ]) : [`**No scenes.** ${plan.noSceneReason}`, '']),
].join('\n');
