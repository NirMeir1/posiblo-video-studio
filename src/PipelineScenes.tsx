// Animated explanatory scenes for the PosibloPipeline composition, in the v1 visual language
// (palette, icons, easing from Motion.tsx). Laid out in the 720x1280 reference space and
// scaled to the composition size. Content comes from the approved scene plan (props).
import type {CSSProperties} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon, clamp, ease, palette} from './Motion';
import type {PipelineScene, PipelineSceneItem} from './pipeline/scene-timeline.mjs';

/** 0 -> 1 while any scene is on screen (12-frame ramps), for shrinking the speaker. */
export const sceneAmount = (frame: number, fps: number, scenes: PipelineScene[]) => Math.max(0, ...scenes.map(s => {
  const a = s.startMs / 1000 * fps;
  const b = s.endMs / 1000 * fps;
  return interpolate(frame, [a, a + 12, b - 12, b], [0, 1, 1, 0], {...clamp, easing: ease});
}));

/** Item k appears in order across the first 60% of the scene. */
const useReveal = (index: number, count: number) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const step = Math.min(1.2 * fps, durationInFrames * 0.6 / Math.max(1, count));
  const start = 8 + index * step;
  return {opacity: interpolate(frame, [start, start + 10], [0, 1], clamp), translate: `0px ${interpolate(frame, [start, start + 18], [20, 0], {...clamp, easing: ease})}px`};
};

const Shell = ({heading, children, big = false}: {heading: string; children?: React.ReactNode; big?: boolean}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{opacity}}>
    <div dir="rtl" lang="he" style={{position: 'absolute', top: big ? 380 : 150, left: 48, right: big ? 48 : 230, fontSize: big ? 54 : 44, fontWeight: 700, lineHeight: 1.18, color: palette.white, textAlign: 'right', translate: `0px ${interpolate(frame, [0, 18], [22, 0], {...clamp, easing: ease})}px`}}>
      {heading}
      {big ? <div style={{width: 90, height: 6, borderRadius: 3, background: palette.lime, marginTop: 26, marginRight: 0}}/> : null}
    </div>
    {children}
  </AbsoluteFill>;
};

const Row = ({item, accent = false, warning = false, style}: {item: PipelineSceneItem; accent?: boolean; warning?: boolean; style: CSSProperties}) => <div dir="rtl" lang="he" style={{...style, position: 'absolute', display: 'flex', alignItems: 'center', gap: 20, padding: '0 26px', boxSizing: 'border-box', borderRadius: 20, background: accent ? palette.lime : palette.panel, color: accent ? palette.ink : palette.white, border: `1px solid ${warning ? palette.coral : accent ? palette.lime : palette.line}`, boxShadow: '0 14px 36px #0003'}}>
  <div style={{flexShrink: 0}}><Icon kind={item.icon ?? 'check'} size={38} color={accent ? palette.ink : warning ? palette.coral : palette.lime}/></div>
  <div style={{textAlign: 'right'}}>
    <div style={{fontSize: 31, fontWeight: 700, lineHeight: 1.15}}>{item.label}</div>
    {item.detail ? <div style={{fontSize: 21, marginTop: 6, lineHeight: 1.25, color: accent ? '#344321' : palette.muted}}>{item.detail}</div> : null}
  </div>
</div>;

const FlowStep = ({item, index, count, top}: {item: PipelineSceneItem; index: number; count: number; top: number}) => {
  const reveal = useReveal(index, count);
  return <>
    {index > 0 ? <div style={{position: 'absolute', left: 357, top: top - 26, width: 6, height: 22, borderRadius: 3, background: palette.line, opacity: reveal.opacity}}/> : null}
    <Row item={item} accent={index === count - 1} style={{left: 96, top, width: 528, height: 96, ...reveal}}/>
  </>;
};

const Flow = ({scene}: {scene: PipelineScene}) => {
  const n = scene.items.length;
  return <Shell heading={scene.heading}>{scene.items.map((item, i) => <FlowStep key={i} item={item} index={i} count={n} top={392 + i * 122}/>)}</Shell>;
};

const Card = ({item, index, count}: {item: PipelineSceneItem; index: number; count: number}) => {
  const reveal = useReveal(index, count);
  return <Row item={item} style={{left: 68, top: 392 + index * 138, width: 584, height: 116, ...reveal}}/>;
};

const Cards = ({scene}: {scene: PipelineScene}) => <Shell heading={scene.heading}>{scene.items.map((item, i) => <Card key={i} item={item} index={i} count={scene.items.length}/>)}</Shell>;

const Side = ({item, index}: {item: PipelineSceneItem; index: number}) => {
  const reveal = useReveal(index, 2);
  const solution = index === 1;
  return <>
    {solution ? <div style={{position: 'absolute', left: 340, top: 548, fontSize: 40, color: palette.lime, opacity: reveal.opacity}}>↓</div> : null}
    <Row item={{...item, icon: item.icon ?? (solution ? 'check' : 'alert')}} accent={solution} warning={!solution} style={{left: 68, top: solution ? 608 : 392, width: 584, height: 140, ...reveal}}/>
  </>;
};

const Comparison = ({scene}: {scene: PipelineScene}) => <Shell heading={scene.heading}>{scene.items.slice(0, 2).map((item, i) => <Side key={i} item={item} index={i}/>)}</Shell>;

export const SceneView = ({scene}: {scene: PipelineScene}) => {
  if (scene.type === 'flow') return <Flow scene={scene}/>;
  if (scene.type === 'cards') return <Cards scene={scene}/>;
  if (scene.type === 'comparison') return <Comparison scene={scene}/>;
  return <Shell heading={scene.heading} big/>;
};
