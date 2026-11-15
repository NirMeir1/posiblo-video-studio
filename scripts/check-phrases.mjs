import fs from 'node:fs';
import {loadWhisperModel,transcribe} from '@remotion/whisper-webgpu';
const wav=fs.readFileSync('out/speech.wav');let offset=12;
while(wav.toString('ascii',offset,offset+4)!=='data')offset+=8+wav.readUInt32LE(offset+4);
const size=wav.readUInt32LE(offset+4);offset+=8;
const audio=new Float32Array(size/2);for(let i=0;i<audio.length;i++)audio[i]=wav.readInt16LE(offset+2*i)/32768;
const handle=await loadWhisperModel({model:'large-v3-turbo'});
const results=[];
for(const [start,end] of [[0,2.5],[8.5,14.5],[16,19.5]]){
 const result=await transcribe({channelWaveform:audio.slice(start*16000,end*16000),model:'large-v3-turbo',language:'he',task:'transcribe'});
 results.push({start,end,...result});console.log(JSON.stringify({start,end,text:result.text}));
}
fs.writeFileSync('out/phrase-crosscheck.json',JSON.stringify(results,null,2));
await handle[Symbol.asyncDispose]();
