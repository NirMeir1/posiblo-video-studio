// Clean-cut planning: which source ranges to remove (silences, fillers, repeated takes) and
// which to keep. Pure functions; the stage applies the plan with ffmpeg.
import {FRAME_MS} from './timeline.mjs';
import {round} from './util.mjs';

export const DEFAULT_CUT_OPTIONS = {
  maxNaturalPauseMs: 750,   // pauses up to this length are kept untouched (deliberate/natural)
  sentencePauseMs: 450,     // a longer pause after a sentence end is shortened to this
  phrasePauseMs: 250,       // a longer pause mid-sentence is shortened to this
  leadInMs: 150,            // kept before the first word
  tailMs: 300,              // kept after the last word
  wordGuardMs: 60,          // never cut closer than this to a kept word
  contentPadMs: 150,        // pause kept on each side of a removed filler or take
  minCutMs: 120,            // smaller silence cuts are not worth a jump cut
  minKeepFrames: 3,         // keep segments shorter than this with no word are dropped
  maxRetakeNgram: 8,
  maxRetakeGapWords: 3,
};

// Hesitation sounds only. Real words are never listed here.
export const FILLERS = new Set(['אה', 'אהה', 'אההה', 'אמ', 'אממ', 'אממם', 'הממ', 'ממ', 'מממ', 'אמממ', 'uh', 'um', 'umm', 'uhm', 'uhh', 'er', 'erm', 'hmm', 'mm', 'mhm']);

export const normalizeToken = text => String(text).normalize('NFKD').replace(/[֑-ׇ]/g, '').replace(/[\p{P}\p{S}]/gu, '').trim().toLowerCase();

export const endsSentence = text => /[.!?…]["'״”)]*\s*$/.test(String(text).trim());

export const findFillers = words => words.flatMap((w, i) => FILLERS.has(normalizeToken(w.text)) ? [{startMs: w.startMs, endMs: w.endMs, reason: 'filler', wordIndexes: [i], text: w.text.trim()}] : []);

/**
 * Finds restarted phrases: an n-gram that is repeated right away (n >= 2) or after at most
 * `maxGapWords` abandoned words (n >= 3). The earlier attempt is removed; the last take is kept.
 */
export const findRepeatedTakes = (words, {maxRetakeNgram = 8, maxRetakeGapWords = 3} = {}) => {
  const tokens = words.map(w => normalizeToken(w.text));
  const takes = [];
  let i = 0;
  while (i < tokens.length) {
    let match = null;
    for (let n = Math.min(maxRetakeNgram, Math.floor((tokens.length - i) / 2)); n >= 2 && !match; n--) {
      const first = tokens.slice(i, i + n);
      if (first.some(t => !t)) continue;
      for (let j = i + n; j <= i + n + (n >= 3 ? maxRetakeGapWords : 0) && j + n <= tokens.length; j++) {
        if (first.every((t, k) => t === tokens[j + k])) { match = {n, j}; break; }
      }
    }
    if (!match) { i++; continue; }
    const removed = words.slice(i, match.j);
    takes.push({startMs: words[i].startMs, endMs: words[match.j - 1].endMs, reason: 'repeated take', wordIndexes: removed.map((_, k) => i + k), text: removed.map(w => w.text.trim()).join(' ')});
    i = match.j;
  }
  return takes;
};

const mergeIntervals = intervals => {
  const sorted = intervals.filter(r => r.endMs > r.startMs).sort((a, b) => a.startMs - b.startMs);
  const merged = [];
  for (const r of sorted) {
    const last = merged.at(-1);
    if (last && r.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, r.endMs);
      last.reasons = [...new Set([...last.reasons, ...r.reasons])];
      last.removedText = [...last.removedText, ...r.removedText];
    } else merged.push({startMs: r.startMs, endMs: r.endMs, reasons: [...r.reasons], removedText: [...r.removedText]});
  }
  return merged;
};

const subtract = (range, blockers) => {
  let pieces = [range];
  for (const b of blockers) {
    pieces = pieces.flatMap(p => b.endMs <= p.startMs || b.startMs >= p.endMs ? [p] : [
      ...(b.startMs > p.startMs ? [{...p, endMs: b.startMs}] : []),
      ...(b.endMs < p.endMs ? [{...p, startMs: b.endMs}] : []),
    ]);
  }
  return pieces;
};

/**
 * Plans the clean cut.
 * @param words transcript words on the source timeline ({text, startMs, endMs})
 * @param silences detected silences on the source timeline ({startMs, endMs})
 * @param totalFrames usable source length in 30 fps frames
 * @returns {{keepFrames: {startFrame, endFrame}[], removals: object[], content: object[]}}
 */
export const planCut = ({words, silences, totalFrames, options = {}}) => {
  const o = {...DEFAULT_CUT_OPTIONS, ...options};
  const durationMs = totalFrames * FRAME_MS;
  const content = [...findFillers(words), ...findRepeatedTakes(words, o)];
  const removedIdx = new Set(content.flatMap(c => c.wordIndexes));
  const kept = words.map((w, i) => ({...w, i})).filter(w => !removedIdx.has(w.i));

  const candidates = [];
  // Content removals take the surrounding pause with them, leaving a short natural gap.
  for (const c of content) {
    const prev = [...kept].reverse().find(w => w.endMs <= c.startMs);
    const next = kept.find(w => w.startMs >= c.endMs);
    const start = prev ? Math.max(prev.endMs, Math.min(c.startMs, prev.endMs + o.contentPadMs)) : Math.min(c.startMs, Math.max(0, (next?.startMs ?? c.endMs) - o.leadInMs));
    const end = next ? Math.min(next.startMs, Math.max(c.endMs, next.startMs - o.contentPadMs)) : Math.max(c.endMs, Math.min(durationMs, (prev?.endMs ?? c.startMs) + o.tailMs));
    candidates.push({startMs: start, endMs: end, reasons: [c.reason], removedText: [c.text], content: true});
  }
  // Long silences are shortened, never removed outright between words.
  const firstStart = kept[0]?.startMs ?? 0;
  const lastEnd = kept.at(-1)?.endMs ?? durationMs;
  for (const s of silences) {
    const startMs = Math.max(0, s.startMs);
    const endMs = Math.min(durationMs, s.endMs);
    if (endMs - startMs <= o.maxNaturalPauseMs && startMs > 0 && endMs < durationMs) continue;
    let range;
    if (endMs <= firstStart + o.wordGuardMs) range = {startMs: 0, endMs: Math.min(endMs, firstStart) - o.leadInMs};
    else if (startMs >= lastEnd - o.wordGuardMs) range = {startMs: Math.max(startMs, lastEnd) + o.tailMs, endMs: durationMs};
    else {
      const before = [...kept].reverse().find(w => w.endMs <= startMs + o.wordGuardMs);
      const keep = before && endsSentence(before.text) ? o.sentencePauseMs : o.phrasePauseMs;
      range = {startMs: startMs + keep / 2, endMs: endMs - keep / 2};
    }
    if (range.endMs - range.startMs > 0) candidates.push({...range, reasons: ['silence'], removedText: []});
  }
  // Acoustic silence detection and Whisper timing can disagree: kept speech always wins.
  const guards = kept.map(w => ({startMs: w.startMs - o.wordGuardMs, endMs: w.endMs + o.wordGuardMs}));
  const guarded = candidates.flatMap(c => c.content ? [c] : subtract(c, guards).filter(p => p.endMs - p.startMs >= o.minCutMs));
  const removals = mergeIntervals(guarded).map(r => ({...r, startMs: Math.max(0, r.startMs), endMs: Math.min(durationMs, r.endMs)}));

  // Complement -> keep ranges, snapped to the frame grid.
  const keepFrames = [];
  let cursor = 0;
  for (const r of [...removals, {startMs: durationMs, endMs: durationMs}]) {
    const startFrame = Math.round(cursor / FRAME_MS);
    const endFrame = Math.min(totalFrames, Math.round(r.startMs / FRAME_MS));
    if (endFrame > startFrame) {
      const hasWord = kept.some(w => w.endMs > startFrame * FRAME_MS && w.startMs < endFrame * FRAME_MS);
      if (endFrame - startFrame >= o.minKeepFrames || hasWord) keepFrames.push({startFrame, endFrame});
    }
    cursor = Math.max(cursor, r.endMs);
  }
  // Merge keep ranges that touch after snapping.
  const merged = [];
  for (const k of keepFrames) {
    if (merged.length && k.startFrame <= merged.at(-1).endFrame) merged.at(-1).endFrame = Math.max(merged.at(-1).endFrame, k.endFrame);
    else merged.push({...k});
  }
  if (!merged.length) throw new Error('Clean cut would remove the whole recording; no speech was kept');
  return {
    keepFrames: merged,
    removals: removals.map(r => ({startMs: round(r.startMs), endMs: round(r.endMs), durationMs: round(r.endMs - r.startMs), reasons: r.reasons, removedText: r.removedText.filter(Boolean)})),
    content: content.map(c => ({...c, startMs: round(c.startMs), endMs: round(c.endMs)})),
    options: o,
  };
};
