// B: all music and bell paths resolve through the archived manifest.
import manifest from './audioManifest.json';
import {createBellVoice,bellEnvelope} from './bellVoice';
const base=import.meta.env.BASE_URL+'assets/audio/';
export const backgroundUrl=base+manifest.background.file;
export function createAudioManager(){
 const playing=new Set();let disposed=false,context;
 return {
  play(bell,{loop=false,volume=.65}={}){
   if(disposed)return ()=>{};
   context??=new AudioContext();
   context.resume().catch(()=>{});
   const voice=createBellVoice(context,manifest.tones[bell.note].frequencyHz,{sustain:loop,volume,onEnded:()=>playing.delete(voice)});
   playing.add(voice);return ()=>voice.release();
  },
  unlock(){if(disposed)return;context??=new AudioContext();context.resume().catch(()=>{});},
  stopAll(){for(const voice of playing)voice.release();},
  dispose(){disposed=true;this.stopAll();if(context)setTimeout(()=>context.close().catch(()=>{}),(bellEnvelope.release+.1)*1000);}
 };
}
