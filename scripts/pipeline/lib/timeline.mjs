// Edit map and timestamp remapping between the source timeline and the edited (cut) timeline.
// Cuts are on a 30 fps frame grid so video frames and audio samples stay exactly in sync.
import {round} from './util.mjs';

export const FPS = 30;
export const FRAME_MS = 1000 / FPS;
export const frameToMs = frame => frame * FRAME_MS;

/** Builds the edit map from kept source frame ranges [startFrame, endFrame). */
export const buildEditMap = keepFrames => {
  let edited = 0;
  const segments = [];
  for (const [index, {startFrame, endFrame}] of keepFrames.entries()) {
    if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || endFrame <= startFrame) throw new Error(`Invalid keep segment ${index}: ${startFrame}-${endFrame}`);
    if (segments.length && startFrame < segments.at(-1).sourceEndFrame) throw new Error('Keep segments must be ordered and non-overlapping');
    const frames = endFrame - startFrame;
    segments.push({
      index, sourceStartFrame: startFrame, sourceEndFrame: endFrame, editedStartFrame: edited, editedEndFrame: edited + frames,
      sourceStartMs: round(frameToMs(startFrame)), sourceEndMs: round(frameToMs(endFrame)),
      editedStartMs: round(frameToMs(edited)), editedEndMs: round(frameToMs(edited + frames)),
    });
    edited += frames;
  }
  return {fps: FPS, segments, editedFrames: edited, editedDurationMs: round(frameToMs(edited))};
};

/**
 * Maps a source time to the edited timeline. Times inside removed material snap to the
 * nearest kept boundary: `bias: 'forward'` -> start of the next kept segment,
 * `'backward'` -> end of the previous kept segment.
 */
export const mapSourceToEdited = (sourceMs, editMap, bias = 'forward') => {
  const {segments} = editMap;
  if (!segments.length) return {ms: 0, removed: true};
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (sourceMs >= s.sourceStartMs && sourceMs <= s.sourceEndMs) return {ms: round(s.editedStartMs + (sourceMs - s.sourceStartMs)), removed: false};
    if (sourceMs < s.sourceStartMs) {
      if (bias === 'forward' || i === 0) return {ms: s.editedStartMs, removed: true};
      return {ms: segments[i - 1].editedEndMs, removed: true};
    }
  }
  return {ms: segments.at(-1).editedEndMs, removed: true};
};

/** Maps an edited time back to the source timeline (always inside a kept segment). */
export const mapEditedToSource = (editedMs, editMap) => {
  const s = editMap.segments.find(seg => editedMs >= seg.editedStartMs && editedMs <= seg.editedEndMs) ?? editMap.segments.at(-1);
  return round(s.sourceStartMs + Math.min(editedMs, s.editedEndMs) - s.editedStartMs);
};

/**
 * Remaps transcript words to the edited timeline. Words whose audio was entirely removed
 * are returned in `dropped`; words that straddle a cut are kept and marked `spansCut`.
 */
export const remapWords = (words, editMap) => {
  const kept = [];
  const dropped = [];
  for (const word of words) {
    const start = mapSourceToEdited(word.startMs, editMap, 'forward');
    const end = mapSourceToEdited(word.endMs, editMap, 'backward');
    const zeroLength = word.endMs <= word.startMs;
    if ((zeroLength && start.removed) || (!zeroLength && end.ms <= start.ms)) {
      dropped.push({...word, reason: 'audio removed by clean cut'});
      continue;
    }
    const spansCut = start.removed || end.removed || editMap.segments.some(s => word.startMs < s.sourceStartMs && word.endMs > s.sourceStartMs && s.index > 0);
    kept.push({...word, sourceStartMs: word.startMs, sourceEndMs: word.endMs, startMs: start.ms, endMs: zeroLength ? start.ms : end.ms, spansCut});
  }
  return {words: kept, dropped};
};
