import {Video} from '@remotion/media';
import type {Caption} from '@remotion/captions';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, Interactive} from 'remotion';
import {AutomationFlow, Benefits, Closing, LeadFlow, Opening, palette, clamp, ease} from './Motion';
import captionsData from './captions-final.json';

const windows = [[4.8,14.3],[19.5,25],[31.1,35.9]];

const Camera=()=>{
 const frame=useCurrentFrame(); const {fps}=useVideoConfig();
 const amount=Math.max(...windows.map(([s,e])=>interpolate(frame,[s*fps,s*fps+12,e*fps-12,e*fps],[0,1,1,0],{...clamp,easing:ease})));
 return <div style={{position:'absolute',left:amount*518,top:amount*112,width:720-amount*566,height:1280-amount*1066,borderRadius:amount*22,overflow:'hidden',zIndex:2,boxShadow:amount?'0 14px 35px #0005':'none'}}>
  <Video name="Original camera and original voice" src={staticFile('input/testvideo.mp4')} style={{width:'100%',height:'100%'}} objectFit="cover"/>
 </div>;
};

const Subtitles=()=>{
 const frame=useCurrentFrame(); const {fps}=useVideoConfig();
 const now=frame/fps*1000;
 const captions:Caption[]=captionsData;
 const groups:Caption[][]=[];
 for(const word of captions){
  const group=groups[groups.length-1];
  if(!group||group.length>=5||word.startMs-group[0].startMs>2100||group[group.length-1].endMs+500<word.startMs)groups.push([word]);
  else group.push(word);
 }
 const group=groups.find(g=>now>=g[0].startMs&&now<g[g.length-1].endMs+90);
 if(!group)return null;
 return <div dir="rtl" lang="he" style={{position:'absolute',zIndex:10,bottom:108,left:45,right:45,textAlign:'center',fontSize:37,lineHeight:1.5,fontWeight:700}}>
  <div style={{display:'inline',background:'#0d181bef',padding:'10px 16px',borderRadius:13,boxDecorationBreak:'clone'}}>
   {group.map((word,i)=><span key={i} style={{color:now>=word.startMs&&now<word.endMs?palette.lime:palette.white}}>{word.text.trim()}{i<group.length-1?' ':''}</span>)}
  </div>
 </div>;
};

const Progress=()=>{
 const f=useCurrentFrame(); const {durationInFrames}=useVideoConfig();
 return <div style={{position:'absolute',bottom:0,left:0,right:0,height:4,zIndex:12,background:'#ffffff14'}}><div style={{height:'100%',background:palette.lime,width:`${f/(durationInFrames-1)*100}%`}}/></div>;
};

export const PosibloVideo=()=>{
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{background:palette.ink,fontFamily:'Arial, sans-serif',color:palette.white}}>
  <AbsoluteFill style={{backgroundImage:'radial-gradient(ellipse at 10% 70%, #23433a66, transparent 65%)'}}/>
  <Camera/>
  <AbsoluteFill style={{zIndex:3,background:'linear-gradient(180deg, #07101380 0%, transparent 28%, transparent 72%, #071013bb 100%)',pointerEvents:'none'}}/>
  <Interactive.Div name="Posiblo brand" style={{position:'absolute',zIndex:8,top:54,left:48,fontSize:24,fontWeight:700,letterSpacing:1,color:palette.white}}>posiblo<span style={{color:palette.lime}}>.</span></Interactive.Div>
  <div style={{position:'absolute',inset:0,zIndex:4}}>
   <Sequence name="Opening hook" durationInFrames={3*fps}><Opening/></Sequence>
   <Sequence name="Lead channels and manual bottleneck" from={4.8*fps} durationInFrames={9.5*fps}><LeadFlow/></Sequence>
   <Sequence name="Connected automation workflow" from={19.5*fps} durationInFrames={5.5*fps}><AutomationFlow/></Sequence>
   <Sequence name="Business outcomes" from={31.1*fps} durationInFrames={4.8*fps}><Benefits/></Sequence>
   <Sequence name="Question to take away" from={38.2*fps} durationInFrames={4.5*fps}><Closing/></Sequence>
  </div>
  <Subtitles/>
  <Progress/>
 </AbsoluteFill>;
};
