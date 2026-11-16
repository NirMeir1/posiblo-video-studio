import type {CSSProperties, ReactNode} from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, Easing, Interactive, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon, clamp, palette} from './Motion';
import {FounderCaptionTrack} from './FounderCaptionTrack';

const Speaker = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inset = Math.max(
    interpolate(frame, [22.4 * fps, 22.8 * fps, 30.6 * fps, 31 * fps], [0, 1, 1, 0], {...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1)}),
    interpolate(frame, [37.4 * fps, 37.8 * fps, 54.7 * fps, 55.1 * fps], [0, 1, 1, 0], {...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1)}),
    interpolate(frame, [68.4 * fps, 68.8 * fps], [0, 1], {...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1)}),
  );
  return <Interactive.Div name="Clean speaker crop — original continuous voice" style={{position: 'absolute', zIndex: 3, left: 56 + inset * 418, top: 332 - inset * 188, width: 584 - inset * 414, aspectRatio: '720 / 610', overflow: 'hidden', borderRadius: 24, boxShadow: '0 24px 70px #0005', border: '1px solid #375057'}}>
    {/* Fixed source crop y=270..880 excludes embedded subtitles and Descript watermark. */}
    <Video name="Founder source — no cuts or speed changes" src={staticFile('input/founder-introduction-edited-8.mp4')} objectFit="fill" style={{position: 'absolute', left: 0, top: '-44.262295%', width: '100%', height: '209.836066%'}} />
  </Interactive.Div>;
};

const Scene = ({children, duration, inset = false, immediate = false, holdEnd = false}: {children: ReactNode; duration: number; inset?: boolean; immediate?: boolean; holdEnd?: boolean}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: holdEnd
    ? interpolate(frame, [12, 20], [0, 1], clamp)
    : immediate
    ? interpolate(frame, [0, duration - 10, duration], [1, 1, 0], clamp)
    : interpolate(frame, inset ? [12, 20, duration - 20, duration - 12] : [0, 10, duration - 10, duration], [0, 1, 1, 0], clamp)}}>{children}</AbsoluteFill>;
};

type CardProps = {label: string; detail: string; kind: 'clock' | 'link' | 'web' | 'chat' | 'list' | 'check' | 'spark'; accent: boolean; style?: CSSProperties};
const CardInner = ({label, detail, kind, accent, style}: CardProps) => <div dir="rtl" lang="he" style={{...style, display: 'flex', alignItems: 'center', gap: 22, padding: '20px 26px', boxSizing: 'border-box', borderRadius: 20, background: accent ? palette.lime : palette.panel, color: accent ? palette.ink : palette.white, border: `1px solid ${accent ? palette.lime : palette.line}`, boxShadow: '0 14px 36px #0002'}}>
  <div style={{flexShrink: 0}}><Icon kind={kind} size={40} color={accent ? palette.ink : palette.lime}/></div>
  <div style={{textAlign: 'right'}}><div style={{fontSize: 33, fontWeight: 700, lineHeight: 1.15}}>{label}</div><div style={{fontSize: 24, marginTop: 8, lineHeight: 1.25, color: accent ? '#344321' : palette.muted}}>{detail}</div></div>
</div>;

const Card = Interactive.create({
  Component: CardInner,
  layout: 'none',
  schema: {
    ...Interactive.backgroundSchema,
    label: {type: 'string', default: '', description: 'Headline'},
    detail: {type: 'string', default: '', description: 'Supporting text'},
    accent: {type: 'boolean', default: false, description: 'Lime emphasis'},
    kind: {type: 'enum', default: 'chat', description: 'Icon', variants: {clock: {}, link: {}, web: {}, chat: {}, list: {}, check: {}, spark: {}}},
  },
});

const Opening = () => <Scene duration={183} immediate>
  <Interactive.Div name="Hook — what fits your business" dir="rtl" lang="he" style={{position: 'absolute', top: 168, left: 56, right: 80, fontSize: 53, fontWeight: 700, lineHeight: 1.12}}>מה באמת מתאים<br/><span style={{color: palette.lime}}>לעסק שלכם?</span></Interactive.Div>
</Scene>;

const Identity = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene duration={333}>
    <Interactive.Div name="Founder name" dir="rtl" lang="he" style={{position: 'absolute', top: 164, left: 56, right: 80, fontSize: 60, fontWeight: 700, lineHeight: 1.05}}>ניר<span style={{color: palette.lime}}> / </span>מפתח תוכנה</Interactive.Div>
    <Interactive.Div name="Experience from the speaker's introduction" dir="rtl" lang="he" style={{position: 'absolute', top: 244, left: 56, right: 80, fontSize: 27, color: palette.muted, opacity: interpolate(frame, [2.7 * fps, 3 * fps], [0, 1], clamp)}}>8 שנות ניסיון בהייטק</Interactive.Div>
  </Scene>;
};

const ProblemFirst = () => <Scene duration={156}>
  <Interactive.Div name="Technology as a means" dir="rtl" lang="he" style={{position: 'absolute', top: 163, left: 56, right: 80, fontSize: 49, fontWeight: 700, lineHeight: 1.17}}>הטכנולוגיה היא הדרך.<br/><span style={{color: palette.lime}}>הבעיה שלכם במרכז.</span></Interactive.Div>
</Scene>;

const Problems = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene duration={258} inset>
    <Interactive.Div name="Business problems heading" dir="rtl" lang="he" style={{position: 'absolute', left: 56, right: 265, top: 180, fontSize: 47, fontWeight: 700, lineHeight: 1.15}}>מה תרצו<br/><span style={{color: palette.lime}}>לפתור?</span></Interactive.Div>
    <Card name="Time-consuming process" label="תהליך שגוזל זמן" detail="משימות שחוזרות שוב ושוב" kind="clock" accent={false} style={{position: 'absolute', left: 56, top: 363, width: 584, height: 121, opacity: interpolate(frame, [0.2 * fps, 0.6 * fps], [0, 1], clamp), translate: interpolate(frame, [0.2 * fps, 0.7 * fps], ['0px 20px', '0px 0px'], clamp)}}/>
    <Card name="Disconnected systems" label="מערכות שלא עובדות יחד" detail="המידע קיים. החיבור חסר." kind="link" accent={false} style={{position: 'absolute', left: 56, top: 514, width: 584, height: 121, opacity: interpolate(frame, [2.9 * fps, 3.3 * fps], [0, 1], clamp), translate: interpolate(frame, [2.9 * fps, 3.4 * fps], ['0px 20px', '0px 0px'], clamp)}}/>
    <Card name="An idea to build" label="רעיון שרוצים לממש" detail="אתר, מערכת או אפליקציה" kind="web" accent={false} style={{position: 'absolute', left: 56, top: 665, width: 584, height: 121, opacity: interpolate(frame, [5.3 * fps, 5.7 * fps], [0, 1], clamp), translate: interpolate(frame, [5.3 * fps, 5.8 * fps], ['0px 20px', '0px 0px'], clamp)}}/>
  </Scene>;
};

const Reassurance = () => <Scene duration={192}>
  <Interactive.Div name="No ready-made solution needed" dir="rtl" lang="he" style={{position: 'absolute', top: 166, left: 56, right: 80, fontSize: 52, fontWeight: 700, lineHeight: 1.14}}>לא צריך להגיע<br/><span style={{color: palette.lime}}>עם פתרון מוכן.</span></Interactive.Div>
</Scene>;

const Approach = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene duration={357} inset>
    <Interactive.Div name="Listen before choosing heading" dir="rtl" lang="he" style={{position: 'absolute', left: 56, right: 265, top: 169, fontSize: 44, fontWeight: 700, lineHeight: 1.2}}>קודם מקשיבים.<br/><span style={{color: palette.lime}}>אחר כך בוחרים.</span></Interactive.Div>
    <div style={{position: 'absolute', left: 345, top: 431, width: 2, height: 298, background: palette.line}}/>
    <Card name="Step 1 — listen" label="01  מקשיבים" detail="מכירים את העסק שלכם" kind="chat" accent={false} style={{position: 'absolute', left: 56, top: 358, width: 584, height: 121, opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp)}}/>
    <Card name="Step 2 — understand" label="02  מבינים את האתגר" detail="מה מפריע? מה רוצים לשנות?" kind="list" accent={false} style={{position: 'absolute', left: 56, top: 509, width: 584, height: 121, opacity: interpolate(frame, [1.8 * fps, 2.2 * fps], [0, 1], clamp)}}/>
    <Card name="Step 3 — choose a fitting solution" label="03  בוחרים פתרון" detail="רק אחרי שמבינים את הצורך" kind="check" accent={true} style={{position: 'absolute', left: 56, top: 660, width: 584, height: 121, opacity: interpolate(frame, [7.7 * fps, 8.1 * fps], [0, 1], clamp)}}/>
  </Scene>;
};

const Solutions = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene duration={174} inset>
    <Interactive.Div name="Right solution heading" dir="rtl" lang="he" style={{position: 'absolute', left: 56, right: 265, top: 173, fontSize: 46, fontWeight: 700, lineHeight: 1.17}}>הפתרון<br/><span style={{color: palette.lime}}>שמתאים לכם.</span></Interactive.Div>
    <Card name="Automation option" label="אוטומציה" detail="לתהליך שצריך לייעל" kind="link" accent={false} style={{position: 'absolute', left: 56, top: 363, width: 584, height: 121, opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], clamp)}}/>
    <Card name="Software option" label="מערכת או אפליקציה" detail="כשצריך לבנות פתרון" kind="web" accent={false} style={{position: 'absolute', left: 56, top: 514, width: 584, height: 121, opacity: interpolate(frame, [1.8 * fps, 2.1 * fps], [0, 1], clamp)}}/>
    <Card name="Simpler option" label="ולפעמים, משהו פשוט" detail="הצורך קובע את הכלי" kind="spark" accent={true} style={{position: 'absolute', left: 56, top: 665, width: 584, height: 121, opacity: interpolate(frame, [3.9 * fps, 4.2 * fps], [0, 1], clamp)}}/>
  </Scene>;
};

const Personal = () => <Scene duration={147}>
  <Interactive.Div name="Personal accompaniment" dir="rtl" lang="he" style={{position: 'absolute', top: 166, left: 56, right: 80, fontSize: 51, fontWeight: 700, lineHeight: 1.15}}>ליווי אישי.<br/><span style={{color: palette.lime}}>עד שהפתרון עובד.</span></Interactive.Div>
</Scene>;

const Fit = () => <Scene duration={129}>
  <Interactive.Div name="Solution fit before accompaniment" dir="rtl" lang="he" style={{position: 'absolute', top: 166, left: 56, right: 80, fontSize: 53, fontWeight: 700, lineHeight: 1.15}}>פתרון שבאמת<br/><span style={{color: palette.lime}}>מתאים לכם.</span></Interactive.Div>
</Scene>;

const Invitation = () => <Scene duration={123}>
  <Interactive.Div name="Problem or idea invitation" dir="rtl" lang="he" style={{position: 'absolute', top: 166, left: 56, right: 80, fontSize: 53, fontWeight: 700, lineHeight: 1.13}}>יש בעיה או רעיון?<br/><span style={{color: palette.lime}}>בואו נדבר.</span></Interactive.Div>
</Scene>;

const Closing = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Scene duration={418} inset holdEnd>
    <Interactive.Div name="Meeting invitation heading" dir="rtl" lang="he" style={{position: 'absolute', left: 56, right: 265, top: 170, fontSize: 46, fontWeight: 700, lineHeight: 1.17}}>הצעד הראשון:<br/><span style={{color: palette.lime}}>שיחה.</span></Interactive.Div>
    <Interactive.Div name="Free initial meeting offer — spoken in source" dir="rtl" lang="he" style={{position: 'absolute', left: 56, top: 366, width: 584, height: 282, background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 24, boxSizing: 'border-box', padding: '30px 32px', textAlign: 'right', translate: interpolate(frame, [0, 0.6 * fps], ['0px 18px', '0px 0px'], clamp)}}>
      <div style={{marginBottom: 24}}><Icon kind="chat" size={44}/></div>
      <div style={{fontSize: 43, fontWeight: 700, lineHeight: 1.15}}>פגישת היכרות<br/>ומיפוי ראשוני</div>
      <div style={{display: 'inline-block', marginTop: 22, padding: '8px 18px', borderRadius: 10, background: palette.lime, color: palette.ink, fontSize: 27, fontWeight: 700, opacity: interpolate(frame, [2.5 * fps, 2.9 * fps], [0, 1], clamp)}}>לגמרי בחינם</div>
    </Interactive.Div>
    <Interactive.Div name="Explore directions together" dir="rtl" lang="he" style={{position: 'absolute', left: 64, right: 88, top: 690, fontSize: 30, lineHeight: 1.45, color: palette.muted, textAlign: 'right', opacity: interpolate(frame, [4.4 * fps, 4.8 * fps], [0, 1], clamp)}}>נבין את האתגר שלכם.<br/>נבחן יחד כיוונים לפתרון.</Interactive.Div>
    <Interactive.Div name="Closing action" dir="rtl" lang="he" style={{position: 'absolute', left: 64, right: 88, top: 792, fontSize: 31, fontWeight: 700, color: palette.lime, textAlign: 'right', opacity: interpolate(frame, [9.7 * fps, 10.1 * fps], [0, 1], clamp)}}>בואו נדבר.</Interactive.Div>
  </Scene>;
};

const Progress = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <div style={{position: 'absolute', left: 56, right: 80, top: 1032, height: 3, background: '#ffffff14', borderRadius: 3}}><div style={{height: 3, background: palette.lime, width: `${frame / (durationInFrames - 1) * 100}%`, borderRadius: 3}}/></div>;
};

export const FounderIntroduction = () => <AbsoluteFill style={{fontFamily: 'Arial, sans-serif', color: palette.white, background: palette.ink}}>
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(ellipse at 0% 65%, #24483b65, transparent 65%)'}}/>
  <Interactive.Div name="Posiblo wordmark" style={{position: 'absolute', top: 83, left: 56, fontSize: 28, fontWeight: 700, letterSpacing: 0.5}}>posiblo<span style={{color: palette.lime}}>.</span></Interactive.Div>
  <Interactive.Div name="Founder introduction label" style={{position: 'absolute', top: 96, right: 80, fontSize: 13, color: palette.muted, letterSpacing: 2}}>MEET THE FOUNDER</Interactive.Div>
  <Speaker/>
  <Track name="Speech-aligned explanation">
    <Sequence name="01 — What fits your business?" durationInFrames={183}><Opening/></Sequence>
    <Sequence name="02 — Meet Nir" from={183} durationInFrames={333}><Identity/></Sequence>
    <Sequence name="03 — Problem before technology" from={516} durationInFrames={156}><ProblemFirst/></Sequence>
    <Sequence name="04 — Three business needs" from={672} durationInFrames={258}><Problems/></Sequence>
    <Sequence name="05 — No solution needed upfront" from={930} durationInFrames={192}><Reassurance/></Sequence>
    <Sequence name="06 — Listen, understand, choose" from={1122} durationInFrames={357}><Approach/></Sequence>
    <Sequence name="07 — Choose the simplest fitting tool" from={1479} durationInFrames={174}><Solutions/></Sequence>
    <Sequence name="08 — A solution that fits" from={1653} durationInFrames={129}><Fit/></Sequence>
    <Sequence name="09 — Personal accompaniment" from={1782} durationInFrames={147}><Personal/></Sequence>
    <Sequence name="10 — Bring a problem or idea" from={1929} durationInFrames={123}><Invitation/></Sequence>
    <Sequence name="11 — Free introductory meeting" from={2052} durationInFrames={418}><Closing/></Sequence>
  </Track>
  <FounderCaptionTrack/>
  <Progress/>
</AbsoluteFill>;
