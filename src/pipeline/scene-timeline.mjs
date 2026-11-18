// Shared by the PosibloPipeline composition and scripts/pipeline: places planned scenes
// (edited full-video timeline) onto a clip. Scenes never start under the opening title.

/**
 * @param scenes scenes with startMs/endMs on the edited timeline
 * @param startMs clip start, @param endMs clip end (same timeline)
 * @param titleMs time at the clip start reserved for the opening title (0 if no title)
 * @param minMs scenes left shorter than this inside the clip are dropped
 */
export const rebaseScenes = (scenes, startMs, endMs, titleMs = 3000, minMs = 2000) => {
  const out = [];
  for (const scene of scenes ?? []) {
    const s = Math.max(scene.startMs, startMs) - startMs;
    const e = Math.min(scene.endMs, endMs) - startMs;
    const from = Math.max(s, titleMs);
    if (e - from < minMs) continue;
    out.push({...scene, startMs: Math.round(from), endMs: Math.round(e)});
  }
  return out;
};
