// Shared by the PosibloPipeline composition and scripts/pipeline (one implementation, so the
// captions a render shows and the captions verification checks are computed identically).

/**
 * Rebases captions from the edited full-video timeline onto a clip that starts at `startMs`
 * and ends at `endMs`. Words outside the range are dropped; words crossing an edge are clamped.
 */
export const rebaseCaptions = (captions, startMs, endMs) => {
  const out = [];
  for (const c of captions) {
    if (c.endMs <= startMs || c.startMs >= endMs) continue;
    const s = Math.max(c.startMs, startMs) - startMs;
    const e = Math.min(c.endMs, endMs) - startMs;
    if (e <= s) continue;
    const startRounded = Math.round(s);
    const endRounded = Math.max(startRounded + 1, Math.round(e));
    out.push({...c, text: out.length === 0 ? c.text.trimStart() : c.text, startMs: startRounded, endMs: endRounded, timestampMs: Math.round((startRounded + endRounded) / 2)});
  }
  for (let i = 1; i < out.length; i++) if (out[i].startMs < out[i - 1].endMs) out[i - 1].endMs = Math.max(out[i - 1].startMs + 1, out[i].startMs);
  return out;
};

/**
 * Groups words into on-screen pages: at most 5 words, about 2.3 s, a new page after a pause
 * longer than 450 ms or after a word marked pageBreakAfter (sentence end).
 */
export const paginateCaptions = captions => {
  const pages = [];
  for (const word of captions) {
    const page = pages[pages.length - 1];
    if (!page || page.length >= 5 || word.endMs - page[0].startMs > 2300 || word.startMs - page[page.length - 1].endMs > 450 || page[page.length - 1].pageBreakAfter) pages.push([word]);
    else page.push(word);
  }
  return pages;
};

/** The page visible at `nowMs`, kept up to 130 ms after its last word unless the next page starts. */
export const pageAt = (pages, nowMs) => pages.find((p, i) => nowMs >= p[0].startMs && nowMs < Math.min(p[p.length - 1].endMs + 130, pages[i + 1]?.[0].startMs ?? Infinity)) ?? null;
