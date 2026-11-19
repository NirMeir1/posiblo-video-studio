import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {PosibloPipeline, type PosibloPipelineProps} from './PosibloPipeline';
import data from './intro40-data.json';

const footage = data as PosibloPipelineProps;

const Progress = () => {
  const frame = useCurrentFrame();
  return <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, zIndex: 20, background: '#ffffff14'}}>
    <div style={{height: '100%', background: '#d5fb72', width: `${frame / 1199 * 100}%`}}/>
  </div>;
};

// Six independent speech selections, at original speed. Source frames refer to
// the processed 30 fps pipeline timeline, not the uncut original recording.
// The unapproved diagram stays a preview proposal; no approval record is written.
export const PosibloIntro40 = () => <AbsoluteFill>
  <Sequence name="Opening question" durationInFrames={178}>
    <PosibloPipeline {...footage} showProgress={false} clip={{startMs: 4 * 1000 / 30, endMs: 182 * 1000 / 30}}/>
  </Sequence>
  <Sequence name="Nir and eight years of experience" from={178} durationInFrames={146}>
    <PosibloPipeline {...footage} title="" showProgress={false} clip={{startMs: 186 * 1000 / 30, endMs: 332 * 1000 / 30}}/>
  </Sequence>
  <Sequence name="Technology serves the problem" from={324} durationInFrames={152}>
    <PosibloPipeline {...footage} title="" showProgress={false} clip={{startMs: 519 * 1000 / 30, endMs: 671 * 1000 / 30}}/>
  </Sequence>
  <Sequence name="Listen, understand, choose a solution" from={476} durationInFrames={353}>
    <PosibloPipeline {...footage} title="" showProgress={false} clip={{startMs: 1123 * 1000 / 30, endMs: 1476 * 1000 / 30}}/>
  </Sequence>
  <Sequence name="Free introductory mapping meeting" from={829} durationInFrames={247}>
    <PosibloPipeline {...footage} title="" showProgress={false} clip={{startMs: 1935 * 1000 / 30, endMs: 2182 * 1000 / 30}}/>
  </Sequence>
  <Sequence name="Closing invitation" from={1076} durationInFrames={124}>
    <PosibloPipeline {...footage} title="" showProgress={false} clip={{startMs: 2387 * 1000 / 30, endMs: 2511 * 1000 / 30}}/>
  </Sequence>
  <Progress/>
</AbsoluteFill>;
