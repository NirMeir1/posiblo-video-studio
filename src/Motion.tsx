import React from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const palette = {ink: '#0d181b', panel: '#18292e', line: '#375057', lime: '#d5fb72', white: '#f5f5eb', muted: '#a6babd', coral: '#ff9d8c'};
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = {extrapolateLeft:'clamp', extrapolateRight:'clamp'} as const;

export const Icon: React.FC<{kind: 'chat'|'web'|'people'|'list'|'link'|'check'|'clock'|'alert'|'spark';size?:number;color?:string}> = ({kind,size=36,color=palette.lime}) => <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  {kind==='chat' && <path d="M8 7h24v20H19l-9 7v-7H8z M14 14h12 M14 20h8"/>}
  {kind==='web' && <><circle cx="20" cy="20" r="15"/><ellipse cx="20" cy="20" rx="7" ry="15"/><path d="M5 20h30 M8 12h24 M8 28h24"/></>}
  {kind==='people' && <><circle cx="16" cy="13" r="6"/><path d="M5 33v-5c0-10 22-10 22 0v5 M28 8c8 0 8 12 0 12 M31 24c5 1 5 5 5 9"/></>}
  {kind==='list' && <><rect x="7" y="5" width="26" height="31" rx="4"/><path d="M14 14h13 M14 21h13 M14 28h8"/></>}
  {kind==='link' && <><path d="M16 14l5-5c9-9 20 2 11 11l-5 5 M24 26l-5 5C10 40-1 29 8 20l5-5 M14 26l12-12"/></>}
  {kind==='check' && <><circle cx="20" cy="20" r="15"/><path d="m12 20 6 6 11-13"/></>}
  {kind==='clock' && <><circle cx="20" cy="20" r="15"/><path d="M20 10v11l7 4"/></>}
  {kind==='alert' && <><path d="M20 5 37 34H3z M20 15v9 M20 29v1"/></>}
  {kind==='spark' && <path d="m20 3 4 12 13 5-13 5-4 12-4-12-13-5 13-5z"/>}
</svg>;

export const SceneShell: React.FC<{number:string;eyebrow:string;title:React.ReactNode;children:React.ReactNode}> = ({number,eyebrow,title,children}) => {
 const f=useCurrentFrame(); const {durationInFrames}=useVideoConfig();
 return <AbsoluteFill style={{color:palette.white,opacity:interpolate(f,[0,10,durationInFrames-10,durationInFrames],[0,1,1,0],clamp),translate:interpolate(f,[0,20],['0px 25px','0px 0px'],{...clamp,easing:ease})}}>
   <div style={{position:'absolute',left:48,top:138,fontSize:18,color:palette.lime,letterSpacing:2}}>{number} / {eyebrow}</div>
   <div dir="rtl" lang="he" style={{position:'absolute',right:246,left:48,top:190,fontSize:49,lineHeight:1.15,fontWeight:700,textAlign:'right'}}>{title}</div>
   {children}
 </AbsoluteFill>;
};

export const WorkflowNode:React.FC<{label:string;detail?:string;kind:React.ComponentProps<typeof Icon>['kind'];x:number;y:number;width?:number;delay?:number;accent?:boolean;warning?:boolean}> = ({label,detail,kind,x,y,width=180,delay=0,accent=false,warning=false}) => {
 const f=useCurrentFrame();
 return <div dir="rtl" style={{position:'absolute',left:x,top:y,width,padding:'22px 16px',boxSizing:'border-box',borderRadius:20,background:accent?palette.lime:palette.panel,color:accent?palette.ink:palette.white,border:`1px solid ${warning?palette.coral:accent?palette.lime:palette.line}`,opacity:interpolate(f,[delay,delay+12],[0,1],clamp),translate:interpolate(f,[delay,delay+22],['0px 25px','0px 0px'],{...clamp,easing:ease}),boxShadow:'0 16px 40px #0002',textAlign:'center'}}>
   <Icon kind={kind} color={accent?palette.ink:warning?palette.coral:palette.lime}/>
   <div style={{fontSize:27,fontWeight:700,marginTop:10}}>{label}</div>
   {detail&&<div style={{fontSize:19,lineHeight:1.4,marginTop:8,color:accent?'#3a501e':palette.muted}}>{detail}</div>}
 </div>;
};

export const Connector:React.FC<{d:string;delay?:number;warning?:boolean}> = ({d,delay=0,warning=false}) => {
 const f=useCurrentFrame(); const p=interpolate(f,[delay,delay+28],[0,1],clamp);
 return <svg width="720" height="1280" viewBox="0 0 720 1280" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
   <defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="none" stroke={palette.lime} strokeWidth="1.5"/></marker></defs>
   <path d={d} fill="none" stroke={palette.line} strokeWidth={3}/>
   <path d={d} fill="none" stroke={warning?palette.coral:palette.lime} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1-p} markerEnd={p===1?'url(#flow-arrow)':undefined}/>
 </svg>;
};

export const LeadFlow=()=>{
 const f=useCurrentFrame();
 return <SceneShell number="01" eyebrow="THE BOTTLENECK" title={<>הפניות מגיעות.<br/>מה קורה אחר כך?</>}>
  <Connector d="M146 535 V584 Q146 604 166 604 H340 Q360 604 360 624 V650" delay={20}/>
  <Connector d="M360 535 V650" delay={30}/>
  <Connector d="M574 535 V584 Q574 604 554 604 H380 Q360 604 360 624 V650" delay={40}/>
  <WorkflowNode label="וואטסאפ" kind="chat" x={54} y={400} width={184} delay={5}/>
  <WorkflowNode label="אתר" kind="web" x={268} y={400} width={184} delay={15}/>
  <WorkflowNode label="פייסבוק" kind="people" x={482} y={400} width={184} delay={25}/>
  <WorkflowNode label="טיפול ידני" detail="העתקה · חזרה ללקוחות · מעקב" kind="list" x={130} y={650} width={460} delay={115}/>
  <div dir="rtl" style={{position:'absolute',left:60,right:60,top:890,display:'flex',gap:16,opacity:interpolate(f,[180,200],[0,1],clamp)}}>
    <div style={{flex:1,padding:20,borderRadius:16,background:'#ff9d8c12',color:palette.coral,fontSize:25,textAlign:'center'}}>פניות נשכחות</div>
    <div style={{flex:1,padding:20,borderRadius:16,background:'#ff9d8c12',color:palette.coral,fontSize:25,textAlign:'center'}}>זמן על מעקב</div>
  </div>
 </SceneShell>;
};

export const AutomationFlow=()=> <SceneShell number="02" eyebrow="A SIMPLER WORKFLOW" title={<>אולי מספיק<br/><span style={{color:palette.lime}}>לחבר בין המערכות.</span></>}>
 <Connector d="M360 526 V607" delay={65}/>
 <Connector d="M360 755 V842" delay={105}/>
 <WorkflowNode label="פנייה חדשה" detail="מכל ערוצי הפנייה" kind="chat" x={140} y={380} width={440} delay={0}/>
 <WorkflowNode label="אוטומציה פשוטה" detail="המערכות מחוברות זו לזו" kind="link" x={108} y={607} width={504} delay={85} accent/>
 <WorkflowNode label="המשך טיפול ומעקב" kind="check" x={140} y={842} width={440} delay={115}/>
 </SceneShell>;

export const Benefits=()=> <SceneShell number="03" eyebrow="THE REAL GOAL" title={<>טכנולוגיה עם<br/><span style={{color:palette.lime}}>תוצאה עסקית.</span></>}>
 <WorkflowNode label="לחסוך זמן" kind="clock" x={68} y={400} width={584} delay={0}/>
 <WorkflowNode label="לצמצם טעויות" kind="check" x={68} y={588} width={584} delay={35}/>
 <WorkflowNode label="עסק שעובד טוב יותר" kind="spark" x={68} y={776} width={584} delay={75} accent/>
 </SceneShell>;

export const Opening=()=>{
 const f=useCurrentFrame();
 return <Interactive.Div name="Opening question" dir="rtl" lang="he" style={{position:'absolute',top:136,left:48,right:48,fontSize:57,fontWeight:700,lineHeight:1.1,textAlign:'right',opacity:interpolate(f,[0,10,64,80],[0,1,1,0],clamp),translate:interpolate(f,[0,18],['0px 18px','0px 0px'],{...clamp,easing:ease})}}>
  <span style={{background:palette.ink,color:palette.white,padding:'8px 16px',boxDecorationBreak:'clone'}}>לא כל עסק<br/>צריך <b dir="ltr" style={{color:palette.lime}}>AI</b>.</span>
 </Interactive.Div>;
};

export const Closing=()=>{
 const f=useCurrentFrame();
 return <Interactive.Div name="Closing problem question" dir="rtl" lang="he" style={{position:'absolute',top:130,left:48,right:48,fontSize:47,fontWeight:700,lineHeight:1.18,textAlign:'right',opacity:interpolate(f,[0,15],[0,1],clamp),translate:interpolate(f,[0,22],['0px 18px','0px 0px'],{...clamp,easing:ease})}}>
 <span style={{background:palette.ink,color:palette.white,padding:'8px 16px',boxDecorationBreak:'clone'}}>איזו בעיה אני<br/><span style={{color:palette.lime}}>מנסה לפתור?</span></span>
 </Interactive.Div>;
};
