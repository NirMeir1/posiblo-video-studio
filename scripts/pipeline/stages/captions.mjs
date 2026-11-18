// Stage 6: timed Hebrew RTL caption JSON (Remotion Caption format) on the edited timeline,
// an SRT for review, and review flags for low/missing-confidence and suspicious words.
import {runPaths, rel} from '../lib/paths.mjs';
import {buildCaptions, toSrt} from '../lib/captions.mjs';
import {readJson, writeJson, writeText} from '../lib/util.mjs';

export const captions = async ({runDir, options, log}) => {
  const paths = runPaths(runDir);
  const transcript = readJson(paths.cut.transcript);
  const {captions: list, flagged} = buildCaptions(transcript.words, transcript.durationMs);
  if (!list.length) throw new Error('No caption words remain after the clean cut');
  writeJson(paths.captions.captions, list);
  writeText(paths.captions.srt, toSrt(list));
  const priority = flagged.filter(f => f.flags.some(flag => flag !== 'confidence-unavailable'));
  const missingConfidence = flagged.filter(f => f.flags.includes('confidence-unavailable')).length;
  writeJson(paths.captions.flags, {
    timeline: 'edited', language: options.language, direction: options.language === 'he' ? 'rtl' : 'auto',
    machineGenerated: true, humanReviewed: false,
    summary: {
      captionWords: list.length, missingConfidence, lowConfidence: flagged.filter(f => f.flags.includes('low-confidence')).length,
      priorityFlags: priority.length, wordsRemovedByCleanCut: transcript.droppedWords?.length ?? 0,
      note: missingConfidence === list.length
        ? 'The transcriber reports no confidence for any word, so every caption word is unverified. A fluent Hebrew listener must review the whole track against the audio; start with the priority list.'
        : 'Review all low-confidence and priority words against the audio.',
    },
    priority, removedByCleanCut: transcript.droppedWords ?? [], words: flagged,
  });
  log(`  ${list.length} caption words, ${priority.length} priority review flags, ${missingConfidence} without confidence`);
  return {outputs: [paths.captions.captions, paths.captions.srt, paths.captions.flags].map(f => rel(runDir, f)), summary: {captionWords: list.length, priorityFlags: priority.length, missingConfidence}};
};
