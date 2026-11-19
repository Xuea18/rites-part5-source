// B: isolated mouse state machine. The original scroll timeline, dots and hierarchy handlers remain intact.
import {bells} from './bells';
import {createAudioManager} from './audioManager';
import {createTelemetry} from './telemetry';
import './mouse.css';
export const parameters={hold:600,double:280,deadzone:8,hover:0,zoomMs:450,lens:200,magnification:2};
export async function installEnhancedMouse(host){
 const viewport=host.querySelector('.part5-viewport');
 const audio=createAudioManager(),log=createTelemetry(9),listeners=[];
 const on=(el,type,fn,opts)=>{el.addEventListener(type,fn,opts);listeners.push(()=>el.removeEventListener(type,fn,opts));};
 const effects=document.createElement('div');effects.className='b-effects';viewport.append(effects);
 // B: viewport-wide backdrop above navigation; the selected object has its own higher stacking context.
 const backdrop=document.createElement('div');backdrop.className='b-focus-backdrop';backdrop.setAttribute('aria-hidden','true');host.append(backdrop);
 const focusLayer=document.createElement('div');focusLayer.className='b-focus-layer';host.append(focusLayer);
 const info=document.createElement('aside');info.className='b-info';info.setAttribute('role','status');effects.append(info);
 const note=document.createElement('div');note.className='b-touch';note.textContent='请使用电脑浏览器体验';host.append(note);
 const lens=document.createElement('div');lens.className='b-lens';lens.setAttribute('aria-hidden','true');document.body.append(lens);
 const models=[];let dead=false,hover=null,zoom=null,press=null,pending=null,pendingTimer,holdTimer,raf,popupTimer,lensOn=false,drag=false,dragOrder=0,dragSeen=new Set(),pointer={x:-1000,y:-1000},offset={x:0,y:0},desired={x:0,y:0};
 let sustainStop=null,visibleSince=new Map();const zoomTransitions=new Map();
 const opacity=el=>{let result=1;for(let e=el;e&&e!==viewport;e=e.parentElement){const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden')return 0;result*=Number(s.opacity);}return result;};
 for(const data of bells){
  const img=host.querySelector(data.selector);if(!img)throw Error(`Missing bell ${data.id}`);
  await img.decode();
  const [fx,fy,fw,fh]=data.crop,crop=[Math.round(fx*img.naturalWidth),Math.round(fy*img.naturalHeight),Math.round(fw*img.naturalWidth),Math.round(fh*img.naturalHeight)];
  const canvas=document.createElement('canvas');canvas.width=crop[2];canvas.height=crop[3];canvas.getContext('2d').drawImage(img,...crop,0,0,canvas.width,canvas.height);
  const alpha=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  const el=document.createElement('div');el.className='b-bell';el.dataset.bell=data.id;el.setAttribute('aria-hidden','true');
  const solid=document.createElement('div');solid.className='b-solid';el.append(solid);effects.append(el);
  // B: original flat texture, with no extrusion or rotation.
  solid.append(canvas);
  models.push({...data,img,canvas,alpha,el,solid,rect:null,shown:false,swingUntil:0,originalClip:img.style.clipPath});
 }
 const showInfo=b=>{clearTimeout(popupTimer);info.textContent=b.description;info.dataset.target=b.id;info.classList.add('visible');};
 const hideInfo=()=>{clearTimeout(popupTimer);info.classList.remove('visible');};
 const resetMasks=()=>{for(const m of models)m.img.style.clipPath=m.originalClip;};
 const mask=b=>{const [x,y,w,h]=b.crop.map(v=>v*100);b.img.style.clipPath=`polygon(evenodd,0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${x}% ${y}%,${x}% ${y+h}%,${x+w}% ${y+h}%,${x+w}% ${y}%,${x}% ${y}%,0% 0%)`;};
 const stopHold=()=>{clearTimeout(holdTimer);sustainStop?.();sustainStop=null;models.forEach(b=>b.el.classList.remove('listening'));hideInfo();};
 const cancelPending=()=>{clearTimeout(pendingTimer);pending=null;};
 const unzoom=()=>{if(!zoom)return;zoomTransitions.set(zoom.id,{from:zoom.displayRect,start:performance.now()});zoom=null;};
 const toggleZoom=b=>{stopHold();if(zoom===b){unzoom();return;}if(zoom)unzoom();zoom=b;b.swingUntil=0;b.el.getAnimations().forEach(a=>a.cancel());zoomTransitions.set(b.id,{from:b.displayRect||b.rect,start:performance.now()});};
 const strike=(b,soft=false)=>{audio.play(b,{volume:soft?.2:.65});b.swingUntil=performance.now()+800;b.el.animate([{rotate:'0deg'},{rotate:'4deg'},{rotate:'-3deg'},{rotate:'0deg'}],{duration:800,easing:'ease-out'});if(!soft){showInfo(b);popupTimer=setTimeout(hideInfo,3000);}};
 const single=b=>{if(zoom)return;strike(b);log.record('click',b.id);};
 const sample=(b,x,y)=>{const r=b.rect;if(!r||!b.shown)return false;const u=(x-r.x)/r.width,v=(y-r.y)/r.height;if(u<0||u>=1||v<0||v>=1)return false;return b.alpha[(Math.floor(v*b.canvas.height)*b.canvas.width+Math.floor(u*b.canvas.width))*4+3]>45;};
 const inside=(r,x,y)=>r&&x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height;
 const hit=(x,y,near=false)=>{
  if(zoom&&inside(zoom.displayRect,x,y))return zoom;
  const direct=[...models].reverse().find(b=>sample(b,x,y));if(direct)return direct;
  if(!near)return null;
  let best=null,distance=parameters.hover;
  for(const b of models){if(!b.shown)continue;const r=b.rect,d=Math.hypot(Math.max(r.x-x,0,x-r.x-r.width),Math.max(r.y-y,0,y-r.y-r.height));if(d<distance){best=b;distance=d;}}
  return best;
 };
 const isControl=e=>Boolean(e.target.closest('a,button,[role=button],.original-nav,.rites_part5_chime_series'));
 const strum=()=>{if(!drag)return;const b=hit(pointer.x,pointer.y);if(b&&b!==zoom&&!dragSeen.has(b.id)){dragSeen.add(b.id);strike(b,true);log.record('drag',b.id,{phase:'strum',bell:b.id,order:++dragOrder});}};
 const inScene=e=>e.clientY>=0&&e.clientY<innerHeight&&e.clientX>=0&&e.clientX<innerWidth&&!e.target.closest('.original-nav');
 const cancel=()=>{stopHold();cancelPending();press=null;drag=false;desired={x:0,y:0};};
 on(host,'pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.button!==0||isControl(e)||!inScene(e))return;
  // B: suppress native image/text drag and keep receiving release outside a bell.
  e.preventDefault();host.setPointerCapture(e.pointerId);
  audio.unlock();
  const b=hit(e.clientX,e.clientY);press={id:e.pointerId,b,x:e.clientX,y:e.clientY,held:false,cancelled:false};dragSeen.clear();dragOrder=0;
  if(b){e.preventDefault();holdTimer=setTimeout(()=>{if(!press||press.cancelled)return;cancelPending();press.held=true;b.swingUntil=0;b.el.getAnimations().forEach(a=>a.cancel());b.el.classList.add('listening');sustainStop=audio.play(b,{loop:true});showInfo(b);log.record('longpress',b.id);},parameters.hold);}
 });
 on(host,'dragstart',e=>{if(inScene(e))e.preventDefault();});
 on(window,'pointermove',e=>{
  if(e.pointerType!=='mouse')return;pointer={x:e.clientX,y:e.clientY};hover=isControl(e)?null:hit(pointer.x,pointer.y,true);
  if(!press)return;
  const dx=e.clientX-press.x,dy=e.clientY-press.y;
  if(Math.hypot(dx,dy)>parameters.deadzone){press.cancelled=true;clearTimeout(holdTimer);if(press.b){if(press.held)stopHold();return;}if(!drag){drag=true;log.record('drag','scene',{phase:'start'});}desired={x:Math.max(-60,Math.min(60,dx*.15)),y:Math.max(-35,Math.min(35,dy*.1))};}
  strum();
 });
 on(window,'pointerup',e=>{
  if(e.button!==0||!press||press.id!==e.pointerId)return;
  const p=press;press=null;clearTimeout(holdTimer);
  if(p.held){stopHold();return;}
  if(drag){log.record('drag','scene',{phase:'end',count:dragOrder});drag=false;desired={x:0,y:0};return;}
  if(p.cancelled||!p.b||hit(e.clientX,e.clientY)!==p.b)return;
  const b=p.b;if(pending===b){cancelPending();toggleZoom(b);log.record('dblclick',b.id,{action:zoom===b?'enlarge':'restore'});}
  else {if(pending){const old=pending;cancelPending();single(old);}pending=b;pendingTimer=setTimeout(()=>{pending=null;single(b);},parameters.double);}
 });
 on(window,'pointercancel',cancel);on(window,'blur',()=>{cancel();audio.stopAll();});
 on(host,'pointerleave',()=>{if(!press)hover=null;});
 on(document,'visibilitychange',()=>{if(document.hidden){cancel();audio.stopAll();}});
 on(host,'contextmenu',e=>{if(!inScene(e))return;e.preventDefault();pointer={x:e.clientX,y:e.clientY};lensOn=!lensOn;lens.classList.toggle('visible',lensOn);viewport.classList.toggle('b-no-cursor',lensOn);log.record(lensOn?'magnifier_on':'magnifier_off','scene');});
 // B: preserve wheel behavior; one event per wheel gesture rather than one per hardware tick.
 let wheelAt=0;
 on(host,'wheel',()=>{if(performance.now()-wheelAt>180){log.record('wheel','scene',{time:Number(host.dataset.time)});}wheelAt=performance.now();},{passive:true});
 on(window,'keydown',e=>{if(e.key==='Escape'){unzoom();cancel();return;}if(new URLSearchParams(location.search).get('fallback')!=='1')return;
  if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();const direction=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;log.record('key','scene',{key:e.key});scrollBy(0,direction*2000);}
  else if(/^[1-5]$/.test(e.key)){log.record('key','navigation',{key:e.key});location.href='https://tv.cctv.com/bronze/index.html#'+['/Heritage','/Spirit','/Arms','/Rites','/Multiplicity'][Number(e.key)-1];}
 });
 const quotes=[1,2,3,5,6,11,12,13,14].map(i=>host.querySelector(`.rites_part5_text${i}`));
 // B: only substantive quote blocks count; empty original containers are excluded.
 const actualQuotes=quotes.filter(q=>q?.textContent.trim());log.session.totalQuotes=actualQuotes.length;
 let mirror=null,mirrorPairs=[],lastMirror=0,mirrorSignature='';
 const syncLens=now=>{
  if(!lensOn)return;
  lens.style.left=`${pointer.x-parameters.lens/2}px`;lens.style.top=`${pointer.y-parameters.lens/2}px`;
  const signature=models.map(b=>b.el.parentElement.className).join('|')+info.parentElement.className;
  if(!mirror||signature!==mirrorSignature){mirror?.remove();mirrorSignature=signature;mirror=document.createElement('div');mirror.className='b-mirror';mirrorPairs=[];for(const source of [viewport,backdrop,focusLayer]){const clone=source.cloneNode(true);mirror.append(clone);const children=[...clone.querySelectorAll('*')];mirrorPairs.push([source,clone],...[...source.querySelectorAll('*')].map((e,i)=>[e,children[i]]));}mirror.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));mirror.querySelectorAll('[tabindex]').forEach(e=>e.removeAttribute('tabindex'));mirror.inert=true;lens.append(mirror);for(const [src,dst] of mirrorPairs){if(src instanceof HTMLCanvasElement&&dst instanceof HTMLCanvasElement){dst.width=src.width;dst.height=src.height;dst.getContext('2d').drawImage(src,0,0);}}}
  // Textures are immutable. Synchronize their live transforms and effects, not hundreds of identical bitmaps every frame.
  if(now-lastMirror>32){for(const [src,dst] of mirrorPairs){if(!dst)continue;const s=getComputedStyle(src);for(const k of ['position','left','top','right','bottom','width','height','transform','translate','rotate','scale','opacity','display','visibility','filter','clip-path','z-index','transform-origin','perspective'])dst.style.setProperty(k,s.getPropertyValue(k));if(src instanceof HTMLVideoElement&&dst instanceof HTMLVideoElement&&src.readyState>=2){dst.muted=true;if(Math.abs(dst.currentTime-src.currentTime)>.08)dst.currentTime=src.currentTime;}}lastMirror=now;}
  mirror.style.position='absolute';mirror.style.width=innerWidth+'px';mirror.style.height=innerHeight+'px';mirror.style.inset='0 auto auto 0';mirror.style.transformOrigin='0 0';mirror.style.transform=`translate(${parameters.lens/2-pointer.x*2}px,${parameters.lens/2-pointer.y*2}px) scale(2)`;
 };
 const tick=now=>{
  if(dead)return;
  offset.x+=(desired.x-offset.x)*.13;offset.y+=(desired.y-offset.y)*.13;
  resetMasks();const time=Number(host.dataset.time||0);
  backdrop.classList.toggle('active',Boolean(zoom));
  const infoParent=zoom?focusLayer:effects;if(info.parentElement!==infoParent)infoParent.append(info);
  const images=new Set(models.map(b=>b.img));for(const img of images)img.style.translate=`${offset.x}px ${offset.y}px`;
  for(const b of models){const r=b.img.getBoundingClientRect(),[x,y,w,h]=b.crop;b.rect={x:r.x+x*r.width,y:r.y+y*r.height,width:w*r.width,height:h*r.height};b.shown=opacity(b.img)>.1&&time<37.5&&b.rect.y+b.rect.height>0&&b.rect.y<innerHeight;
   let target=b.rect;const enlarging=zoom===b;
   if(enlarging){const scale=Math.min(innerHeight*.68/b.rect.height,innerWidth*.45/b.rect.width,2.2);target={width:b.rect.width*scale,height:b.rect.height*scale,x:innerWidth/2-b.rect.width*scale/2,y:innerHeight/2-b.rect.height*scale/2};}
   const transition=zoomTransitions.get(b.id);
   if(transition){let t=Math.min(1,(now-transition.start)/parameters.zoomMs);t=t*t*(3-2*t);const from=transition.from||target;target=Object.fromEntries(Object.keys(target).map(k=>[k,from[k]+(target[k]-from[k])*t]));if(t===1)zoomTransitions.delete(b.id);}
   b.displayRect=target;const listening=b.el.classList.contains('listening');const active=b.shown&&(b===hover||enlarging||transition||listening||b.swingUntil>now);
   const layer=enlarging||(!zoom&&transition)?focusLayer:effects;if(b.el.parentElement!==layer)layer.append(b.el);
   b.el.style.opacity=active?'1':'0';b.el.style.left=target.x+'px';b.el.style.top=target.y+'px';b.el.style.width=target.width+'px';b.el.style.height=target.height+'px';b.el.classList.toggle('glow',b===hover);b.el.classList.toggle('zoomed',enlarging);b.el.style.zIndex=enlarging?'4':'1';
   if(b.shown&&(enlarging||transition||listening||b.swingUntil>now))mask(b);
  }
  strum();
  if(zoom&&!zoom.shown){unzoom();cancel();}
  actualQuotes.forEach((q,i)=>{const r=q.getBoundingClientRect(),shown=opacity(q)>.7&&r.top>=0&&r.bottom<=innerHeight;if(shown){if(!visibleSince.has(i))visibleSince.set(i,now);if(now-visibleSince.get(i)>300)log.quote(i);}else visibleSince.delete(i);});
  syncLens(now);raf=requestAnimationFrame(tick);
 };
 raf=requestAnimationFrame(tick);
 // B: diagnostics exposed without any experiment UI, also used by the per-bell verification script.
 window.__EXP_B={bells:models,log,parameters,hit,export:log.exportAll,state:()=>({pressed:press?{id:press.b?.id,held:press.held,cancelled:press.cancelled}:null,lensOn,zoom:zoom?.id,drag})};
 return ()=>{dead=true;cancelAnimationFrame(raf);cancel();audio.dispose();log.dispose();listeners.forEach(f=>f());resetMasks();models.forEach(b=>b.img.style.removeProperty('translate'));effects.remove();backdrop.remove();focusLayer.remove();lens.remove();note.remove();delete window.__EXP_B;};
}
