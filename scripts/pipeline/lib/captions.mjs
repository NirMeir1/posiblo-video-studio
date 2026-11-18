// Generic caption building from the edited-timeline transcript (stage 6).
// No recording-specific corrections or omissions: text is exactly what the transcriber produced.
import {endsSentence, normalizeToken} from './cutplan.mjs';
import {paginateCaptions} from '../../../src/pipeline/caption-timeline.mjs';

export const LOW_CONFIDENCE = 0.6;

/**
 * Converts words to Remotion Caption objects with strictly ordered, positive-length timing,
 * and returns per-word review flags.
 */
export const buildCaptions = (words, durationMs) => {
  const captions = [];
  const flagged = [];
  let prevEnd = 0;
  let prevToken = null;
  for (const w of words) {
    const flags = [];
    const trimmed = w.text.trim();
    if (!trimmed) continue;
    if (w.confidence === null || w.confidence === undefined) flags.push('confidence-unavailable');
    else if (w.confidence < LOW_CONFIDENCE) flags.push('low-confidence');
    const rawDuration = w.endMs - w.startMs;
    if (rawDuration < 60) flags.push('very-short-timing');
    if (rawDuration > 1500) flags.push('very-long-timing');
    if (/[A-Za-z0-9]/.test(trimmed)) flags.push('latin-or-digits-check-rtl-order');
    if (w.spansCut) flags.push('spans-a-cut');
    const token = normalizeToken(trimmed);
    if (token && token === prevToken) flags.push('repeated-word');
    prevToken = token;

    let startMs = Math.max(Math.round(w.startMs), prevEnd);
    let endMs = Math.min(Math.round(w.endMs), Math.round(durationMs));
    if (startMs >= Math.round(durationMs)) { flagged.push({text: trimmed, startMs, endMs, flags: [...flags, 'dropped-after-end-of-video']}); continue; }
    if (endMs <= startMs) endMs = Math.min(Math.round(durationMs), startMs + 80);
    if (endMs <= startMs) { flagged.push({text: trimmed, startMs, endMs, flags: [...flags, 'dropped-no-room-for-timing']}); continue; }
    if (Math.abs(startMs - w.startMs) > 30 || Math.abs(endMs - w.endMs) > 30) flags.push('timing-adjusted');
    const caption = {text: captions.length ? ` ${trimmed}` : trimmed, startMs, endMs, timestampMs: Math.round((startMs + endMs) / 2), confidence: w.confidence ?? null};
    if (endsSentence(trimmed)) caption.pageBreakAfter = true;
    captions.push(caption);
    flagged.push({index: captions.length - 1, text: trimmed, startMs, endMs, sourceStartMs: w.sourceStartMs ?? null, flags});
    prevEnd = endMs;
  }
  return {captions, flagged};
};

const stamp = ms => {
  const t = Math.max(0, Math.round(ms));
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(t / 3600000))}:${p(Math.floor(t / 60000) % 60)}:${p(Math.floor(t / 1000) % 60)},${p(t % 1000, 3)}`;
};

/** SRT for human review, using the same pages as the on-screen captions. */
export const toSrt = captions => paginateCaptions(captions).map((page, i) => `${i + 1}\n${stamp(page[0].startMs)} --> ${stamp(page.at(-1).endMs + 90)}\n${page.map(c => c.text).join('').trim()}\n`).join('\n');
