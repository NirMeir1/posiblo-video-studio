// Prompt and validation for per-export Hebrew platform metadata (stage 8).
export const PLATFORMS = ['facebookReels', 'instagramReels', 'tiktok'];
// Local validation limits chosen by this project, not verified platform requirements.
export const METADATA_LIMITS = {titleMax: 100, captionMax: 2200, hashtagsMin: 3, hashtagsMax: 8, hashtagMax: 50};
const HEBREW = /[֐-׿]/;
const HASHTAG = /^#[\p{L}\p{N}_]+$/u;

export const validateMetadataResponse = (json, {ids, language = 'he', limits = METADATA_LIMITS}) => {
  const problems = [];
  if (!json || typeof json !== 'object' || !Array.isArray(json.items)) return {value: null, problems: ['top level must be an object with an "items" array']};
  const got = json.items.map(i => i?.id);
  const missing = ids.filter(id => !got.includes(id));
  const extra = got.filter(id => !ids.includes(id));
  const dupes = got.filter((id, i) => got.indexOf(id) !== i);
  if (missing.length) problems.push(`missing items for: ${missing.join(', ')}`);
  if (extra.length) problems.push(`unknown item ids: ${extra.join(', ')}`);
  if (dupes.length) problems.push(`duplicate item ids: ${[...new Set(dupes)].join(', ')}`);
  for (const item of json.items) {
    if (!item || typeof item !== 'object') { problems.push('every item must be an object'); continue; }
    for (const platform of PLATFORMS) {
      const at = `${item.id}.${platform}`;
      const p = item[platform];
      if (!p || typeof p !== 'object') { problems.push(`${at} is missing`); continue; }
      for (const [field, max] of [['title', limits.titleMax], ['caption', limits.captionMax]]) {
        const v = p[field];
        if (typeof v !== 'string' || !v.trim()) problems.push(`${at}.${field} must be a non-empty string`);
        else if (v.length > max) problems.push(`${at}.${field} is ${v.length} characters; maximum ${max}`);
        else if (language === 'he' && !HEBREW.test(v)) problems.push(`${at}.${field} must be in Hebrew`);
      }
      const tags = p.hashtags;
      if (!Array.isArray(tags)) { problems.push(`${at}.hashtags must be an array`); continue; }
      if (tags.length < limits.hashtagsMin || tags.length > limits.hashtagsMax) problems.push(`${at}.hashtags must have ${limits.hashtagsMin}-${limits.hashtagsMax} entries; got ${tags.length}`);
      const bad = tags.filter(t => typeof t !== 'string' || !HASHTAG.test(t) || t.length > limits.hashtagMax);
      if (bad.length) problems.push(`${at}.hashtags has invalid entries (each must be "#" followed by letters, digits or _ with no spaces): ${bad.map(String).join(', ')}`);
      if (new Set(tags.map(t => String(t).toLowerCase())).size !== tags.length) problems.push(`${at}.hashtags has duplicates`);
    }
  }
  if (problems.length) return {value: null, problems};
  const byId = Object.fromEntries(json.items.map(i => [i.id, Object.fromEntries(PLATFORMS.map(p => [p, {title: i[p].title.trim(), caption: i[p].caption.trim(), hashtags: i[p].hashtags}]))]));
  return {value: ids.map(id => ({id, platforms: byId[id]})), problems};
};

export const METADATA_SYSTEM = 'You write organic social-media post metadata in Hebrew for Posiblo, strictly based on the provided transcript. You return valid JSON only.';

export const buildMetadataPrompt = items => `Write post metadata for each video below, for three organic placements: Facebook Reels, Instagram Reels and TikTok.

For every video and every placement give:
- "title": a short Hebrew title (at most ${METADATA_LIMITS.titleMax} characters).
- "caption": the Hebrew post text (at most ${METADATA_LIMITS.captionMax} characters; keep it concise and natural for that platform).
- "hashtags": ${METADATA_LIMITS.hashtagsMin}-${METADATA_LIMITS.hashtagsMax} relevant hashtags, each "#" followed by letters, digits or underscores, no spaces.

Rules:
- Use only what the speaker actually says. Do not invent offers, prices, statistics, results, testimonials or contact details.
- The transcript is machine-generated and may contain recognition errors; paraphrase rather than quote words that look garbled.
- No engagement bait ("comment X to get Y") and no hashtag stuffing.

Return only a JSON object in exactly this shape:
{"items": [{"id": "<video id>", "facebookReels": {"title": "", "caption": "", "hashtags": []}, "instagramReels": {"title": "", "caption": "", "hashtags": []}, "tiktok": {"title": "", "caption": "", "hashtags": []}}]}

Videos (ids: ${items.map(i => i.id).join(', ')}):
${items.map(i => `--- id: ${i.id} (${(i.durationMs / 1000).toFixed(1)} s)${i.title ? `, on-screen title: ${i.title}` : ''}\n${i.text}`).join('\n\n')}`;
