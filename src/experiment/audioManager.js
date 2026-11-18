// B: all music and bell paths resolve through the archived manifest.
import manifest from './audioManifest.json';
const base=import.meta.env.BASE_URL+'assets/audio/';
export const backgroundUrl=base+manifest.background.file;
export function createAudioManager(){
 const playing=new Set();let disposed=false;
 return {
  play(bell,{loop=false,volume=.65}={}){
   if(disposed)return ()=>{};
   const record=manifest.bells.find(b=>b.id===bell.id);
   const a=new Audio(base+record[loop?'sustain':'strike']);a.loop=loop;a.volume=volume;playing.add(a);
   const stop=()=>{a.pause();a.currentTime=0;playing.delete(a);};
   a.addEventListener('ended',()=>playing.delete(a),{once:true});
   a.play().then(()=>{if(disposed||!playing.has(a))stop();}).catch(()=>playing.delete(a));
   return stop;
  },
  stopAll(){for(const a of playing){a.pause();a.currentTime=0;}playing.clear();},
  dispose(){disposed=true;this.stopAll();}
 };
}
