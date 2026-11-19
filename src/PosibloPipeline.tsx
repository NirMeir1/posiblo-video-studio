// Reusable, props-driven Posiblo composition used by `npm run pipeline` (stage 7).
// Props: source (file in the public dir or an http(s) URL), captions and approved scenes on the
// edited full-video timeline, clip range on that timeline, and an on-screen title. Duration comes from the clip
// range; captions are rebased onto the clip. Everything here is generated from pipeline data,
// so captions and title are edited through props, not inline in Studio.
import type {Caption} from '@remotion/captions';
import {Video} from '@remotion/media';
import {useMemo} from 'react';
import {AbsoluteFill, Interactive, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import {clamp, ease, palette} from './Motion';
import {pageAt, paginateCaptions, rebaseCaptions} from './pipeline/caption-timeline.mjs';
import {rebaseScenes, type PipelineScene} from './pipeline/scene-timeline.mjs';
import {SceneView, sceneAmount} from './PipelineScenes';

export type PosibloPipelineProps = {
  source: string;
  captions: Caption[];
  clip: {startMs: number; endMs: number};
  title: string;
  scenes?: PipelineScene[];
  width?: number;
  height?: number;
  captionBottom?: number;
  showProgress?: boolean;
};

export const PIPELINE_FPS = 30;

export const pipelineDefaultProps: PosibloPipelineProps = {
  source: 'input/testvideo.mp4',
  captions: [],
  clip: {startMs: 0, endMs: 10000},
  title: '',
  width: 1080,
  height: 1920,
};

export const calculatePipelineMetadata: CalculateMetadataFunction<PosibloPipelineProps> = ({props}) => {
  const {startMs, endMs} = props.clip;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs < 0 || endMs <= startMs) throw new Error(`Invalid clip range ${startMs}-${endMs}`);
  const width = props.width ?? 1080;
  const height = props.height ?? 1920;
  if (Math.abs(width / height - 9 / 16) > 0.001) throw new Error(`Composition must be 9:16; got ${width}x${height}`);
  return {durationInFrames: Math.max(1, Math.round((endMs - startMs) * PIPELINE_FPS / 1000)), fps: PIPELINE_FPS, width, height};
};

const resolveSource = (source: string) => /^https?:\/\//.test(source) ? source : staticFile(source);

const TitleCard = ({title, scale}: {title: string; scale: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, 3 * fps - 10, 3 * fps], [0, 1, 1, 0], clamp);
  const lift = interpolate(frame, [0, 18], [24 * scale, 0], {...clamp, easing: ease});
  return <Interactive.Div name="Opening hook (generated title — review)" dir="rtl" lang="he" style={{position: 'absolute', zIndex: 8, top: 150 * scale, left: 48 * scale, right: 48 * scale, opacity, translate: `0px ${lift}px`, textAlign: 'right'}}>
    <div style={{display: 'inline', background: '#0d181bdd', color: palette.white, fontSize: 52 * scale, fontWeight: 700, lineHeight: 1.35, padding: `${8 * scale}px ${18 * scale}px`, borderRadius: 16 * scale, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', borderRight: `${6 * scale}px solid ${palette.lime}`}}>{title}</div>
  </Interactive.Div>;
};

const Captions = ({captions, scale, bottom}: {captions: Caption[]; scale: number; bottom: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const pages = useMemo(() => paginateCaptions(captions), [captions]);
  const page = pageAt(pages, now);
  return <div dir="rtl" lang="he" style={{position: 'absolute', zIndex: 10, bottom, left: 45 * scale, right: 45 * scale, textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: 37 * scale, lineHeight: 1.5, fontWeight: 700}}>
    {page && <div style={{display: 'inline', background: '#0d181bef', padding: `${10 * scale}px ${16 * scale}px`, borderRadius: 13 * scale, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>
      {page.map((word, i) => <span key={`${word.startMs}-${i}`} style={{color: now >= word.startMs && now < word.endMs ? palette.lime : palette.white}}>{word.text.trim()}{i < page.length - 1 ? ' ' : ''}</span>)}
    </div>}
  </div>;
};

const Progress = ({scale}: {scale: number}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 * scale, zIndex: 12, background: '#ffffff14'}}><div style={{height: '100%', background: palette.lime, width: `${frame / Math.max(1, durationInFrames - 1) * 100}%`}}/></div>;
};

const Speaker = ({src, trimBefore, scenes, scale}: {src: string; trimBefore: number; scenes: PipelineScene[]; scale: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Same inset geometry as the v1 reference camera (720x1280 space), scaled.
  const a = sceneAmount(frame, fps, scenes);
  return <div style={{position: 'absolute', zIndex: 2, left: a * 518 * scale, top: a * 112 * scale, width: (720 - a * 566) * scale, height: (1280 - a * 1066) * scale, borderRadius: a * 22 * scale, overflow: 'hidden', boxShadow: a ? '0 14px 35px #0005' : 'none'}}>
    <Video name="Speaker — cleaned edit with processed audio" src={src} trimBefore={trimBefore > 0 ? trimBefore : undefined} objectFit="cover" style={{width: '100%', height: '100%'}}/>
  </div>;
};

export const PosibloPipeline = ({source, captions, clip, title, scenes, captionBottom, showProgress = true}: PosibloPipelineProps) => {
  const {fps, width, height} = useVideoConfig();
  const scale = width / 720;
  const trimBefore = Math.round(clip.startMs * fps / 1000);
  const clipCaptions = useMemo(() => rebaseCaptions(captions, clip.startMs, clip.endMs), [captions, clip.startMs, clip.endMs]);
  const clipScenes = useMemo(() => rebaseScenes(scenes ?? [], clip.startMs, clip.endMs, title.trim() ? 3000 : 0), [scenes, clip.startMs, clip.endMs, title]);
  // Default caption position is higher than the v1 reference (108 px at 720x1280) to leave room
  // for platform UI at the bottom of Reels/TikTok. Not verified against live platform previews.
  const bottom = captionBottom ?? Math.round(height * 0.2);
  return <AbsoluteFill style={{background: palette.ink, fontFamily: 'Arial, sans-serif', color: palette.white}}>
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(ellipse at 10% 70%, #23433a66, transparent 65%)'}}/>
    <Speaker src={resolveSource(source)} trimBefore={trimBefore} scenes={clipScenes} scale={scale}/>
    <div style={{position: 'absolute', left: 0, top: 0, width: 720, height: 1280, zIndex: 6, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      {clipScenes.map(scene => <Sequence key={scene.id} name={`${scene.id} — ${scene.type}: ${scene.heading}`} from={Math.round(scene.startMs * fps / 1000)} durationInFrames={Math.max(1, Math.round((scene.endMs - scene.startMs) * fps / 1000))}><SceneView scene={scene}/></Sequence>)}
    </div>
    <AbsoluteFill style={{zIndex: 3, background: 'linear-gradient(180deg, #07101399 0%, transparent 22%, transparent 70%, #071013aa 100%)', pointerEvents: 'none'}}/>
    <Interactive.Div name="Posiblo brand" style={{position: 'absolute', zIndex: 9, top: 54 * scale, left: 48 * scale, fontSize: 24 * scale, fontWeight: 700, letterSpacing: 1 * scale, color: palette.white}}>posiblo<span style={{color: palette.lime}}>.</span></Interactive.Div>
    {title.trim() ? <Sequence name="Opening hook" durationInFrames={3 * fps}><TitleCard title={title.trim()} scale={scale}/></Sequence> : null}
    <Captions captions={clipCaptions} scale={scale} bottom={bottom}/>
    {showProgress ? <Progress scale={scale}/> : null}
  </AbsoluteFill>;
};
