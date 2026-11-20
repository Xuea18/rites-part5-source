import './xuan.css';
export function installXuan(series){
 const pics=[...series.querySelectorAll('.rites_part5_chime_series_pic')],signs=[...series.querySelectorAll('.rites_part5_chime_series_text')];
 const names=['gong','xuan','pan','te'],labels=['宫悬','轩悬','判悬','特悬'],ratios=['768/353','716/270','685/291','531/377'];
 const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 const constrained=matchMedia('(max-width: 767px)').matches||connection?.saveData||/2g/.test(connection?.effectiveType||'');
 let disposed=false,selected=0,active=null,timer,version=0;const cleanup=[];
 const on=(el,type,fn,options)=>{el.addEventListener(type,fn,options);cleanup.push(()=>el.removeEventListener(type,fn,options));};
 const slots=names.map((name,i)=>{
  const base=import.meta.env.BASE_URL+`assets/xuan/${name}-xuan`,poster=new Image(),anim=new Image(),audio=new Audio(base+'.m4a'),pic=pics[i];
  poster.src=base+'-poster-lite.webp';poster.alt=labels[i]+'编钟与舞人';poster.className='xuan-poster';anim.alt='';anim.className='xuan-animation';audio.preload='auto';audio.load();
  const slot={name,pic,poster,anim,audio,base,blob:null,ready:null,url:null,state:'idle',started:0};pic.style.aspectRatio=ratios[i];pic.setAttribute('role','button');pic.setAttribute('aria-label',`播放${labels[i]}舞蹈和编钟音乐`);pic.classList.add('xuan-art');
  poster.decode().then(()=>{if(disposed)return;pic.replaceChildren(poster,anim);}).catch(()=>{pic.dataset.mediaError='poster';});
  return slot;
 });
 const ensureReady=s=>{
  if(s.blob)return Promise.resolve(s.blob);if(s.ready)return s.ready;
  s.ready=fetch(s.base+(constrained?'-anim-mobile-v2.webp':'-anim-lite.webp')).then(r=>{if(!r.ok)throw Error('动画加载失败');return r.blob();}).then(async blob=>{const url=URL.createObjectURL(blob),preload=new Image();try{preload.src=url;await preload.decode();s.blob=blob;return blob;}finally{URL.revokeObjectURL(url);}}).catch(error=>{s.ready=null;s.pic.dataset.mediaError='animation';throw error;});
  return s.ready;
 };
 const reset=()=>{version++;clearTimeout(timer);active=null;for(const s of slots){s.audio.pause();try{s.audio.currentTime=0;}catch{}s.audio.muted=false;s.state='idle';s.pic.classList.remove('xuan-playing','xuan-pending');s.pic.setAttribute('aria-busy','false');s.anim.onload=null;s.anim.onerror=null;s.anim.removeAttribute('src');if(s.url){URL.revokeObjectURL(s.url);s.url=null;}}};
 const begin=s=>{
  if(disposed||document.hidden)return;const ticket=version;s.state='playing';s.pic.classList.remove('xuan-pending');s.pic.setAttribute('aria-busy','false');s.audio.muted=false;s.audio.currentTime=0;
  s.url=URL.createObjectURL(s.blob);s.anim.onload=()=>{if(ticket===version&&active===s)s.pic.classList.add('xuan-playing');};s.anim.onerror=()=>{if(ticket===version){reset();s.pic.dataset.mediaError='animation';}};
  s.started=performance.now();s.anim.src=s.url;
  s.audio.play().catch(()=>{if(ticket===version){reset();s.pic.dataset.mediaError='audio';}});
  // All four supplied files contain 81 ANMF frames, totalling 5062 ms, loop count 1.
  const finish=()=>{if(ticket!==version)return;const remaining=5062-(performance.now()-s.started);if(remaining>0)timer=setTimeout(finish,remaining);else reset();};timer=setTimeout(finish,5062);
 };
 const play=s=>{if(disposed||series.inert||document.hidden||active===s)return;reset();active=s;delete s.pic.dataset.mediaError;
  if(s.blob){begin(s);return;}
  s.state='pending';s.pic.classList.add('xuan-pending');s.pic.setAttribute('aria-busy','true');const ticket=version;
  s.audio.muted=true;const unlock=s.audio.play().then(()=>{if(ticket===version){s.audio.pause();s.audio.currentTime=0;}});
  Promise.all([ensureReady(s),unlock]).then(()=>{if(ticket===version&&active===s)begin(s);}).catch(()=>{if(ticket===version){reset();s.pic.dataset.mediaError='load';}});
 };
 const select=i=>{reset();selected=i;signs.forEach((s,n)=>s.classList.toggle('xuan-selected',n===i));slots.forEach((s,n)=>{s.pic.classList.toggle('xuan-current',n===i);s.pic.tabIndex=n===i?0:-1;s.pic.setAttribute('aria-hidden',String(n!==i));});if(!series.inert)ensureReady(slots[i]).catch(()=>{});};select(0);series.classList.add('xuan-ready');
 signs.forEach((sign,i)=>{on(sign,'pointerenter',()=>{if(selected!==i)sign.querySelector('[role=button]')?.click();});on(sign,'click',()=>select(i),true);});
 slots.forEach(s=>{on(s.pic,'click',()=>play(s));on(s.pic,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play(s);}});});
 on(document,'visibilitychange',()=>{if(document.hidden)reset();});on(window,'pagehide',reset);
 const observer=new MutationObserver(()=>{if(series.inert&&active)reset();else if(!series.inert)ensureReady(slots[selected]).catch(()=>{});});observer.observe(series,{attributes:true,attributeFilter:['inert']});
 window.__XUAN={slots,reset};
 return()=>{disposed=true;reset();observer.disconnect();cleanup.forEach(fn=>fn());slots.forEach(s=>{s.audio.removeAttribute('src');s.audio.load();});delete window.__XUAN;};
}
