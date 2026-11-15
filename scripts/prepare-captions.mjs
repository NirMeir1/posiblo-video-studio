import fs from 'node:fs';
const raw=JSON.parse(fs.readFileSync('out/transcription-large-v3-turbo.json','utf8'));
const corrections=new Map([['שיתפל','שיטפל'],['שתם','שאתם']]);
const captions=raw.words.filter(w=>w.startInSeconds<12.26||w.startInSeconds>=13.69).map(w=>({text:corrections.get(w.text.trim())||w.text.trim(),startMs:Math.round(w.startInSeconds*1000),endMs:Math.round(w.endInSeconds*1000),timestampMs:Math.round((w.startInSeconds+w.endInSeconds)*500),confidence:null}));
captions.find(c=>c.text==='AI.').endMs=1640;
fs.writeFileSync('src/captions-final.json',JSON.stringify(captions,null,2));
const stamp=ms=>new Date(ms).toISOString().slice(11,23).replace('.',',');
let groups=[];
for(const word of captions){const last=groups.at(-1);if(!last||last.length>=5||word.startMs-last[0].startMs>2100||last.at(-1).endMs+500<word.startMs)groups.push([word]);else last.push(word);}
fs.writeFileSync('out/posiblo-first-test.srt',groups.map((g,i)=>`${i+1}\n${stamp(g[0].startMs)} --> ${stamp(g.at(-1).endMs+90)}\n${g.map(w=>w.text).join(' ')}\n`).join('\n'));
fs.writeFileSync('out/transcript.txt','LOCAL AUTOMATIC HEBREW TRANSCRIPT\nWhisper large-v3-turbo, cross-checked with small, medium and targeted retranscription. Not human listening-verified.\n12.26–13.68s: uncertain phrase omitted from subtitles rather than guessed. Original audio retained.\nOrthographic normalization: שיתפל → שיטפל; שתם → שאתם (confirmed by medium).\n\n'+groups.map(g=>`[${stamp(g[0].startMs)}] ${g.map(w=>w.text).join(' ')}`).join('\n'));
console.log('Prepared '+captions.length+' subtitle words; one uncertain clause omitted.');
