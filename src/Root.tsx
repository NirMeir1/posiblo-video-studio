import {Composition} from 'remotion';
import {PosibloVideo} from './Composition';
import {FounderIntroduction} from './FounderIntroduction';
import {PosibloIntro40} from './PosibloIntro40';
import {PosibloPipeline, calculatePipelineMetadata, pipelineDefaultProps} from './PosibloPipeline';

export const RemotionRoot=()=> <>
  <Composition id="PosibloFirstTest" component={PosibloVideo} durationInFrames={1282} fps={30} width={720} height={1280}/>
  <Composition id="FounderIntroduction" component={FounderIntroduction} durationInFrames={2470} fps={30} width={720} height={1280}/>
  <Composition id="PosibloIntro40" component={PosibloIntro40} durationInFrames={1200} fps={30} width={1080} height={1920}/>
  <Composition id="PosibloPipeline" component={PosibloPipeline} durationInFrames={300} fps={30} width={1080} height={1920} defaultProps={pipelineDefaultProps} calculateMetadata={calculatePipelineMetadata}/>
</>;
