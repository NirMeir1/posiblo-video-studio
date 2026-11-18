// Single source of truth for where each stage writes inside out/<slug>/.
import path from 'node:path';

export const runPaths = runDir => {
  const p = (...parts) => path.join(runDir, ...parts);
  return {
    runDir,
    ingest: {
      dir: p('01-ingest'),
      provenance: p('01-ingest', 'provenance.json'),
      probe: p('01-ingest', 'probe.json'),
      wav16k: p('01-ingest', 'audio-16k-mono.wav'),
      sourceCopy: ext => p('01-ingest', `source${ext.toLowerCase()}`),
    },
    transcribe: {
      dir: p('02-transcribe'),
      raw: model => p('02-transcribe', `transcription-${model}.json`),
      whisperCaptions: model => p('02-transcribe', `captions-${model}.json`),
      transcript: p('02-transcribe', 'transcript.json'),
      text: p('02-transcribe', 'transcript.txt'),
    },
    cut: {
      dir: p('03-clean-cut'),
      silences: p('03-clean-cut', 'silences.json'),
      editMap: p('03-clean-cut', 'edit-map.json'),
      sourceAudio: p('03-clean-cut', 'source-audio-48k.wav'),
      audio: p('03-clean-cut', 'cut-audio.wav'),
      video: p('03-clean-cut', 'cut-video.mp4'),
      transcript: p('03-clean-cut', 'transcript-edited.json'),
    },
    audio: {
      dir: p('04-audio'),
      loudness: p('04-audio', 'loudness.json'),
      processed: p('04-audio', 'audio-processed.wav'),
      edited: p('04-audio', 'edited.mp4'),
    },
    clips: {
      dir: p('05-clip-selection'),
      sentences: p('05-clip-selection', 'sentences.json'),
      clips: p('05-clip-selection', 'clips.json'),
      attempts: p('05-clip-selection', 'api-attempts.json'),
      scenePlan: p('05-clip-selection', 'scene-plan.json'),
      scenePlanMd: p('05-clip-selection', 'scene-plan.md'),
      sceneAttempts: p('05-clip-selection', 'scene-api-attempts.json'),
      sceneApproval: p('05-clip-selection', 'scene-plan.approval.json'),
    },
    captions: {
      dir: p('06-captions'),
      captions: p('06-captions', 'captions.json'),
      srt: p('06-captions', 'captions.srt'),
      flags: p('06-captions', 'review-flags.json'),
    },
    render: {
      dir: p('07-render'),
      publicDir: p('07-render', 'public'),
      publicSource: p('07-render', 'public', 'edited.mp4'),
      bundle: p('07-render', 'bundle'),
      props: name => p('07-render', 'props', `${name}.json`),
      captions: name => p('07-render', 'captions', `${name}.json`),
      exportFile: (slug, name) => p('07-render', 'exports', `${slug}-${name}.mp4`),
      manifest: p('07-render', 'renders.json'),
    },
    metadata: {
      dir: p('08-metadata'),
      attempts: p('08-metadata', 'api-attempts.json'),
      file: p('metadata.json'),
    },
    verify: {
      dir: p('09-verify'),
      report: name => p('09-verify', `${name}.verification.json`),
      summaryJson: p('09-verify', 'summary.json'),
      summaryMd: p('summary.md'),
      brief: slug => p('review', `${slug}-brief.md`),
      review: slug => p('review', `${slug}-review.md`),
    },
  };
};

export const rel = (runDir, file) => path.relative(runDir, file).split(path.sep).join('/');
