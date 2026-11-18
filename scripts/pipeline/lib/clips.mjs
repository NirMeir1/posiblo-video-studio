// Sentence segmentation and validation of model-proposed clip candidates (stage 5).
import {endsSentence} from './cutplan.mjs';
import {round} from './util.mjs';

export const CLIP_RULES = {minMs: 20000, maxMs: 60000, minCount: 5, maxCount: 6, toleranceMs: 1, leadInMs: 120, tailMs: 300};
const HEBREW = /[֐-׿]/;

/** Groups edited-timeline words into sentences at . ! ? … or at pauses longer than `gapMs`. */
export const toSentences = (words, gapMs = 1200) => {
  const sentences = [];
  let current = [];
  words.forEach((w, i) => {
    current.push(w);
    const next = words[i + 1];
    if (!next || endsSentence(w.text) || next.startMs - w.endMs > gapMs) {
      sentences.push({index: sentences.length, startMs: round(current[0].startMs), endMs: round(current.at(-1).endMs), text: current.map(x => x.text).join('').trim(), firstWord: current[0].index, lastWord: current.at(-1).index});
      current = [];
    }
  });
  return sentences;
};

/** Every sentence-bounded window whose length is within the clip limits. */
export const candidateWindows = (sentences, rules = CLIP_RULES) => {
  const windows = [];
  for (let a = 0; a < sentences.length; a++) for (let b = a; b < sentences.length; b++) {
    const ms = sentences[b].endMs - sentences[a].startMs;
    if (ms > rules.maxMs) break;
    if (ms >= rules.minMs) windows.push({startSentence: a, endSentence: b, durationMs: ms});
  }
  return windows;
};

export const requiredCount = (windowCount, rules = CLIP_RULES) => ({min: Math.min(rules.minCount, windowCount), max: Math.min(rules.maxCount, windowCount)});

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

/**
 * Validates the model JSON {fullVideoTitle, clips: [{startMs, endMs, title, reason}]}.
 * Returns {value, problems}. `value` is only meaningful when `problems` is empty.
 */
export const validateClipResponse = (json, {sentences, durationMs, language = 'he', rules = CLIP_RULES}) => {
  const problems = [];
  const count = requiredCount(candidateWindows(sentences, rules).length, rules);
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {value: null, problems: ['top level must be a JSON object']};
  if (!isText(json.fullVideoTitle, 60)) problems.push('fullVideoTitle must be a non-empty string of at most 60 characters');
  else if (language === 'he' && !HEBREW.test(json.fullVideoTitle)) problems.push('fullVideoTitle must be in Hebrew');
  if (!Array.isArray(json.clips)) return {value: null, problems: [...problems, 'clips must be an array']};
  if (json.clips.length < count.min || json.clips.length > count.max) problems.push(`clips must contain ${count.min === count.max ? count.min : `${count.min}-${count.max}`} items; got ${json.clips.length}`);
  const findStart = ms => sentences.find(s => Math.abs(s.startMs - ms) <= rules.toleranceMs);
  const findEnd = ms => sentences.find(s => Math.abs(s.endMs - ms) <= rules.toleranceMs);
  const seen = new Set();
  const clips = [];
  json.clips.forEach((clip, i) => {
    const at = `clips[${i}]`;
    if (!clip || typeof clip !== 'object') { problems.push(`${at} must be an object`); return; }
    const {startMs, endMs} = clip;
    if (typeof startMs !== 'number' || !Number.isFinite(startMs)) { problems.push(`${at}.startMs must be a finite number`); return; }
    if (typeof endMs !== 'number' || !Number.isFinite(endMs)) { problems.push(`${at}.endMs must be a finite number`); return; }
    if (startMs < 0 || endMs > durationMs + rules.toleranceMs || endMs <= startMs) { problems.push(`${at} range ${startMs}-${endMs} ms is outside the video (0-${durationMs} ms) or reversed`); return; }
    const s = findStart(startMs);
    const e = findEnd(endMs);
    if (!s) problems.push(`${at}.startMs ${startMs} is not the startMs of any sentence`);
    if (!e) problems.push(`${at}.endMs ${endMs} is not the endMs of any sentence`);
    if (s && e && e.index < s.index) problems.push(`${at} ends before it starts`);
    if (!isText(clip.title, 60)) problems.push(`${at}.title must be a non-empty string of at most 60 characters`);
    else if (language === 'he' && !HEBREW.test(clip.title)) problems.push(`${at}.title must be in Hebrew`);
    if (!isText(clip.reason, 600)) problems.push(`${at}.reason must be a non-empty string of at most 600 characters`);
    if (!s || !e || e.index < s.index || !isText(clip.title, 60) || !isText(clip.reason, 600)) return;
    const length = e.endMs - s.startMs;
    if (length < rules.minMs || length > rules.maxMs) { problems.push(`${at} is ${(length / 1000).toFixed(1)} s; clips must be 20-60 s`); return; }
    const key = `${s.index}-${e.index}`;
    if (seen.has(key)) { problems.push(`${at} duplicates another clip`); return; }
    seen.add(key);
    const prev = sentences[s.index - 1];
    const next = sentences[e.index + 1];
    clips.push({
      startMs: s.startMs, endMs: e.endMs, durationMs: round(length), startSentence: s.index, endSentence: e.index,
      renderStartMs: round(Math.max(0, s.startMs - rules.leadInMs, prev?.endMs ?? 0)),
      renderEndMs: round(Math.min(durationMs, e.endMs + rules.tailMs, next?.startMs ?? durationMs)),
      title: clip.title.trim(), reason: clip.reason.trim(),
      text: sentences.slice(s.index, e.index + 1).map(x => x.text).join(' '),
    });
  });
  return {value: problems.length ? null : {fullVideoTitle: json.fullVideoTitle.trim(), clips: clips.map((c, i) => ({id: `clip-${String(i + 1).padStart(2, '0')}`, ...c}))}, problems};
};

export const buildClipPrompt = ({sentences, durationMs, count, language}) => {
  const lang = language === 'he' ? 'Hebrew' : `the transcript's language (${language})`;
  return `Below is the automatic transcript of a talking-head video for Posiblo, split into numbered sentences with times in milliseconds on the edited timeline (total ${Math.round(durationMs)} ms).

Pick ${count.min === count.max ? count.min : `${count.min} to ${count.max}`} candidate short clips for organic Facebook Reels, Instagram Reels and TikTok.

Rules:
- Each clip is a continuous range that starts at the startMs of one sentence and ends at the endMs of the same or a later sentence. Copy those numbers exactly from the list.
- Each clip lasts between 20000 and 60000 ms (endMs - startMs).
- Each clip should make sense on its own: a clear opening line, one idea, a natural ending.
- Clips may overlap but must not be identical.
- "title": a short on-screen hook in ${lang}, at most 60 characters, based only on what the speaker actually says. Do not invent claims, numbers, offers or results.
- "reason": one or two sentences (English is fine) explaining why this range works as a standalone clip.
- "fullVideoTitle": a short on-screen hook in ${lang} for the full video, same rules as "title".
- The transcript is machine-generated and may contain recognition errors; do not quote words that look garbled in titles.

Return only a JSON object, no prose, in exactly this shape:
{"fullVideoTitle": "...", "clips": [{"startMs": 0, "endMs": 0, "title": "...", "reason": "..."}]}

Sentences:
${sentences.map(s => `${s.index}. [${s.startMs}-${s.endMs}] ${s.text}`).join('\n')}`;
};

export const CLIP_SYSTEM = 'You are an experienced short-form video editor. You select clips strictly from the provided transcript and return valid JSON only.';
