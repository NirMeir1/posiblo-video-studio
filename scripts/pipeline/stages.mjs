// Stage registry: exactly nine stages, in order. Only stages 5 and 8 use the Anthropic API.
import {ingest} from './stages/ingest.mjs';
import {transcribeStage} from './stages/transcribe.mjs';
import {cleanCut} from './stages/clean-cut.mjs';
import {audio} from './stages/audio.mjs';
import {clipSelection} from './stages/clip-selection.mjs';
import {captions} from './stages/captions.mjs';
import {render} from './stages/render.mjs';
import {metadata} from './stages/metadata.mjs';
import {verify} from './stages/verify.mjs';

export const STAGES = [
  {number: 1, id: 'ingest', title: 'Ingest and probe', usesAnthropic: false, run: ingest},
  {number: 2, id: 'transcribe', title: 'Transcribe (local Whisper)', usesAnthropic: false, run: transcribeStage},
  {number: 3, id: 'clean-cut', title: 'Clean cut', usesAnthropic: false, run: cleanCut},
  {number: 4, id: 'audio', title: 'Audio denoise and loudness', usesAnthropic: false, run: audio},
  {number: 5, id: 'clip-selection', title: 'Clip selection and scene plan (Anthropic API)', usesAnthropic: true, run: clipSelection},
  {number: 6, id: 'captions', title: 'Hebrew captions', usesAnthropic: false, run: captions},
  {number: 7, id: 'render', title: 'Remotion render (full + clips, 9:16)', usesAnthropic: false, run: render},
  {number: 8, id: 'metadata', title: 'Platform metadata (Anthropic API)', usesAnthropic: true, run: metadata},
  {number: 9, id: 'verify', title: 'Verify exports and summary', usesAnthropic: false, run: verify},
];
