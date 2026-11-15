import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const bin=path.resolve('node_modules/@remotion/compositor-win32-x64-msvc');
const ffmpeg=path.join(bin,'ffmpeg.exe');
const output='out/posiblo-first-test.mp4';
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',output,'-vn','-ar','16000','-ac','1','-c:a','pcm_s16le','out/final-audio.wav']);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-xerror','-i',output,'-c:v','rawvideo','-c:a','pcm_s16le','-f','null','-'],{stdio:'pipe'});
const pcm=file=>{const b=fs.readFileSync(file);let p=12;while(b.toString('ascii',p,p+4)!=='data')p+=8+b.readUInt32LE(p+4);const n=b.readUInt32LE(p+4);p+=8;const a=new Float32Array(n/2);for(let i=0;i<a.length;i++)a[i]=b.readInt16LE(p+i*2)/32768;return a;};
const a=pcm('out/speech.wav'),b=pcm('out/final-audio.wav');
const checks=[5,20,39].map(second=>{
 const start=second*16000,count=16000;
 const corr=lag=>{let dot=0,aa=0,bb=0;for(let j=0;j<count;j+=4){const x=a[start+j],y=b[start+j+lag];dot+=x*y;aa+=x*x;bb+=y*y;}return dot/Math.sqrt(aa*bb);};
 let best=-Infinity,shift=0;
 for(let lag=-3200;lag<=3200;lag+=8){const c=corr(lag);if(c>best){best=c;shift=lag;}}
 const coarse=shift;for(let lag=coarse-8;lag<=coarse+8;lag++){const c=corr(lag);if(c>best){best=c;shift=lag;}}
 return {second,lagMs:shift/16,correlation:Number(best.toFixed(6)),pass:Math.abs(shift/16)<33.34&&best>0.8};
});
const metadata=JSON.parse(execFileSync(path.join(bin,'ffprobe.exe'),['-v','quiet','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceUnchanged=hash('C:/Users/meirn/Downloads/testvideo.mp4')===hash('public/input/testvideo.mp4');
const captions=JSON.parse(fs.readFileSync('src/captions-final.json','utf8'));
const report={output:path.resolve(output),sourceUnchanged,fullDecodePassed:true,audioSynchronization:checks,subtitleWords:captions.length,subtitleTimingsValid:captions.every((c,i)=>c.endMs>=c.startMs&&c.endMs<=42734&&(!i||c.startMs>=captions[i-1].endMs)),limitations:['Source footage is 480×854, upscaled to 720×1280.','Automatic Hebrew transcription, not human listening-verified. Unclear clause at 12.26–13.68 seconds deliberately omitted from subtitles.'],metadata};
fs.writeFileSync('out/verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,metadata:{duration:metadata.format.duration,streams:metadata.streams.map(s=>({codec:s.codec_name,width:s.width,height:s.height,sampleRate:s.sample_rate,frameRate:s.r_frame_rate,duration:s.duration}))}},null,2));
if(!sourceUnchanged||!report.subtitleTimingsValid||checks.some(c=>!c.pass))process.exitCode=1;
