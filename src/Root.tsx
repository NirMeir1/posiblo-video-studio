import {Composition} from 'remotion';
import {PosibloVideo} from './Composition';
import {FounderIntroduction} from './FounderIntroduction';

export const RemotionRoot=()=> <>
  <Composition id="PosibloFirstTest" component={PosibloVideo} durationInFrames={1282} fps={30} width={720} height={1280}/>
  <Composition id="FounderIntroduction" component={FounderIntroduction} durationInFrames={2470} fps={30} width={720} height={1280}/>
</>;
