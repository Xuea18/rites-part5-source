// Continuous modal synthesis: one onset, never a loop containing repeated strikes.
export const bellEnvelope={strike:1.2,release:3,sustainLevel:.78,breathingHz:.18};
export function createBellVoice(context,frequency,{sustain=false,volume=.65,onEnded=()=>{}}={}){
 const start=context.currentTime,output=context.createGain(),breath=context.createOscillator(),depth=context.createGain();
 const modes=[[1,.45],[2.01,.2],[2.76,.12],[4.07,.07],[5.43,.04],[.5,.12]];
 const nodes=[];let released=false;
 output.connect(context.destination);
 output.gain.setValueAtTime(.0001,start);
 output.gain.exponentialRampToValueAtTime(volume*(sustain?bellEnvelope.sustainLevel:1),start+.012);
 if(!sustain)output.gain.exponentialRampToValueAtTime(.0001,start+bellEnvelope.strike);
 breath.frequency.value=bellEnvelope.breathingHz;depth.gain.value=sustain?volume*.025:0;
 breath.connect(depth).connect(output.gain);breath.start(start);
 for(const [ratio,weight] of modes){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.frequency.value=frequency*ratio;gain.gain.value=weight;oscillator.connect(gain).connect(output);oscillator.start(start);nodes.push({oscillator,gain});}
 const finish=()=>{nodes.forEach(({oscillator,gain})=>{oscillator.disconnect();gain.disconnect();});breath.disconnect();depth.disconnect();output.disconnect();onEnded();};
 nodes[0].oscillator.onended=finish;
 const endAt=time=>{nodes.forEach(({oscillator})=>oscillator.stop(time));breath.stop(time);};
 if(!sustain)endAt(start+bellEnvelope.strike+.02);
 return {release(at=context.currentTime){if(released)return;released=true;
  // Hold the current envelope; fade both its body and the breathing modulation.
  const level=sustain?volume*bellEnvelope.sustainLevel:volume*Math.pow(.0001/volume,Math.min(1,Math.max(0,(at-start-.012)/(bellEnvelope.strike-.012))));
  output.gain.cancelAndHoldAtTime(at);output.gain.setValueAtTime(Math.max(.0001,level),at);output.gain.exponentialRampToValueAtTime(.0001,at+bellEnvelope.release);
  depth.gain.cancelAndHoldAtTime(at);depth.gain.setValueAtTime(sustain?volume*.025:0,at);
  // The breathing follows the same decay, so it cannot overpower the fading body.
  if(sustain)depth.gain.exponentialRampToValueAtTime(.0001*.025/bellEnvelope.sustainLevel,at+bellEnvelope.release);
  endAt(at+bellEnvelope.release+.02);
 }};
}
