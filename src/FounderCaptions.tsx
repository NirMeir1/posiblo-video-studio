import type {Caption} from '@remotion/captions';
import {useMemo, type CSSProperties} from 'react';
import {Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {palette} from './Motion';

type Props = {captions: Caption[]; style?: CSSProperties};

const CaptionsInner = ({captions, style}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const pages = useMemo(() => {
    const groups: Caption[][] = [];
    for (const word of captions) {
      const page = groups[groups.length - 1];
      if (!page || page.length >= 5 || word.endMs - page[0].startMs > 2300 || word.startMs - page[page.length - 1].endMs > 450 || page[page.length - 1].pageBreakAfter) groups.push([word]);
      else page.push(word);
    }
    return groups;
  }, [captions]);
  const page = pages.find((p, i) => now >= p[0].startMs && now < Math.min(p[p.length - 1].endMs + 130, pages[i + 1]?.[0].startMs ?? Infinity));
  return <div dir="rtl" lang="he" style={{...style, textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 700, lineHeight: 1.42}}>
    {page && <div style={{display: 'inline', padding: '8px 14px', background: '#0d181bf5', borderRadius: 12, boxDecorationBreak: 'clone'}}>
      {page.map((word, index) => <span key={`${word.startMs}-${index}`} style={{color: now >= word.startMs && now < word.endMs ? palette.lime : palette.white}}>{word.text.trim()}{index < page.length - 1 ? ' ' : ''}</span>)}
    </div>}
  </div>;
};

// The inline caption array at the call site remains editable in Studio.
export const FounderCaptions = Interactive.create({
  Component: CaptionsInner,
  layout: 'none',
  schema: {...Interactive.textSchema, ...Interactive.captionsSchema},
});
