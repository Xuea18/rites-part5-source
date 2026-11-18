// B: archive original bytes; create NEW explicitly synthetic experimental tones, never replace originals.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {bells} from '../src/experiment/bells.js';
const dir='public/assets/audio';fs.mkdirSync(dir,{recursive:true});
fs.copyFileSync('public/assets/nav/rites_bg.mp3',`${dir}/rites_bg.mp3`);
const notes={C4:261.625565,D4:293.664768,E4:329.627557,G4:391.995436,A4:440};
const rate=44100,duration=3;
for(const [note,hz] of Object.entries(notes)){
 const n=rate*duration,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++){const t=i/rate;let v=0;[1,2.01,2.76,4.07,5.43].forEach((ratio,j)=>v+=Math.sin(2*Math.PI*hz*ratio*t)*Math.exp(-t*(1.7+j*.55))/(j+1));v*=Math.min(1,t/.006)*Math.min(1,(duration-t)/.02)*.42;b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2);}
 fs.writeFileSync(`${dir}/bell_${note}.wav`,b);
}
const sha=name=>crypto.createHash('sha256').update(fs.readFileSync(`${dir}/${name}`)).digest('hex');
fs.writeFileSync(`${dir}/manifest.json`,JSON.stringify({version:1,
 provenance:'Only rites_bg.mp3 existed in the baseline. Bell sounds are newly synthesized experimental stimuli, not recordings of historical bells. Sustain reuses the same unmodified strike file in a loop. No preexisting strike/sustain/UI audio was found.',
 background:{file:'rites_bg.mp3',purpose:'原站礼乐之邦背景音乐',sha256:sha('rites_bg.mp3')},
 tones:Object.fromEntries(Object.entries(notes).map(([note,hz])=>[note,{file:`bell_${note}.wav`,frequencyHz:hz,origin:'synthetic-experiment',sha256:sha(`bell_${note}.wav`)}])),
 bells:bells.map(b=>({id:b.id,label:b.label,note:b.note,strike:`bell_${b.note}.wav`,sustain:`bell_${b.note}.wav`,sustainMode:'loop',pitchMeaning:'assigned experimental pitch, not measured artifact pitch'}))},null,2));
fs.copyFileSync(`${dir}/manifest.json`,'src/experiment/audioManifest.json');
