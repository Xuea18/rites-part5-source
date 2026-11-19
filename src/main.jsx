import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import originalMarkup from './generated/part5.html?raw';
import { createPart5Timeline } from './generated/part5-timeline';
import './generated/part5.css';
import './styles.css';
// B additions are contained in experiment/*; the original timeline is reused.
import {installEnhancedMouse} from './experiment/enhancedMouse';
import {backgroundUrl} from './experiment/audioManager';
import {installRackGlissando} from './experiment/rackGlissando';
import {installXuan} from './experiment/xuan';
gsap.registerPlugin(ScrollTrigger,ScrollSmoother);

function OriginalNav() {
 const [visible,setVisible]=useState(true);
 const [sound,setSound]=useState(false);
 const audio=useRef(null);
 useEffect(()=>{
  const music=audio.current,normalVolume=music.volume;
  let frame,target=normalVolume,from=normalVolume,started=performance.now();
  const tick=now=>{
   const next=window.__RACK?.enabled()?0:normalVolume;
   if(next!==target){from=music.volume;target=next;started=now;}
   const t=Math.min(1,(now-started)/600),ease=t*t*(3-2*t);
   music.volume=from+(target-from)*ease;
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  // Only adjust gain; never override the user's play/pause choice.
  return()=>{cancelAnimationFrame(frame);music.volume=normalVolume;};
 },[]);
 useEffect(()=>{
  let previous=scrollY;
  const onScroll=()=>{const next=scrollY;if(Math.abs(next-previous)>3){setVisible(next<previous||next<80);previous=next;}};
  addEventListener('scroll',onScroll,{passive:true});
  return()=>removeEventListener('scroll',onScroll);
 },[]);
 const toggleSound=async()=>{
  if(sound){audio.current.pause();setSound(false);return;}
  try{await audio.current.play();setSound(true);}catch{setSound(false);}
 };
 const icon=(name)=>`${import.meta.env.BASE_URL}assets/nav/${name}`;
 const items=[
  ['观知','/Marvels','nav-guanzhi-02.png','nav-guanzhi-on-02.png'],
  ['论道','/Topics','nav-lundao-02.png','nav-lundao-on-02.png'],
  ['讲解','/Guides','nav-jiangjie-02.png','nav-jiangjie-on-02.png']
 ];
 return <nav className={`original-nav${visible?'':' hidden'}`} aria-label="青铜文明导航">
  <a className="original-nav-logo" href="https://tv.cctv.com/bronze/index.html#/" aria-label="青铜文明首页"><img src={icon('nav-logo.avif')} alt="青铜文明" /></a>
  <div className="original-nav-right">
   <ul className="original-nav-links">{items.map(([label,path,normal,hover])=><li key={path}><a href={`https://tv.cctv.com/bronze/index.html#${path}`} target="_blank" rel="noopener noreferrer" aria-label={label}><img src={icon(normal)} alt="" /><img className="hover" src={icon(hover)} alt="" /></a></li>)}</ul>
   <div className="original-nav-languages" aria-label="语言"><span className="active" aria-current="true">中</span><a href="https://tv.cctv.com/bronze/index.html#/Rites" lang="en" aria-label="Open original site for English language">EN</a></div>
   <button className="original-nav-sound" type="button" aria-label={sound?'关闭背景音乐':'开启背景音乐'} aria-pressed={sound} onClick={toggleSound}><img src={icon(sound?'nav-sound.avif':'nav-muted.avif')} alt="" /></button>
  </div>
  <audio ref={audio} src={backgroundUrl} loop preload="none" onEnded={()=>setSound(false)} onError={()=>setSound(false)} />
 </nav>;
}

function Part5() {
 const root=useRef(null);
 useEffect(()=>{
  const host=root.current,video=host.querySelector('video');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const resize=()=>{
   document.documentElement.style.fontSize=`${innerWidth/25.6}px`;
   host.querySelector('.smooth-content').style.height=`${innerHeight + 119*innerHeight*52.5/230.6}px`;
  };
  resize();
  let timeline;
  const ctx=gsap.context(()=>{timeline=createPart5Timeline(gsap,video);},host);
  const smoother=ScrollSmoother.create({wrapper:host.querySelector('.smooth-wrapper'),content:host.querySelector('.smooth-content'),smooth:reduced.matches?0:2,effects:true,normalizeScroll:true});
  // Standalone entry opens on the first fully revealed frame, without the preceding chapter.
  if(scrollY===0)smoother.scrollTop(2/52.5*(host.querySelector('.smooth-content').offsetHeight-innerHeight));
  let frame,disposed=false;
  const series=host.querySelector('.rites_part5_chime_series');
  const controls=[...host.querySelectorAll('.rites_part5_chime_series_text_light')];
  const dots=[1,2,3].map(i=>host.querySelector('.rites_part5_dot'+i));
  const activate=(element,label,handler)=>{
   element.setAttribute('role','button');element.setAttribute('aria-label',label);element.tabIndex=0;
   const click=e=>{e.stopPropagation();handler();};
   const key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click(e);}};
   element.addEventListener('click',click);element.addEventListener('keydown',key);
   return ()=>{element.removeEventListener('click',click);element.removeEventListener('keydown',key);};
  };
  const cleanups=controls.map((el,i)=>activate(el,['王宫悬，四面悬挂','诸侯轩悬，三面悬挂','卿大夫判悬，两面悬挂','士特悬，一面悬挂'][i],()=>{
   controls.forEach((e,index)=>{e.style.opacity=index===i?'1':'0';e.setAttribute('aria-pressed',String(index===i));});
   host.querySelectorAll('.rites_part5_chime_series_pic').forEach((e,index)=>{e.style.opacity=index===i?'1':'0';});
  }));
  let jump;
  cleanups.push(installXuan(series));
  dots.forEach((el,i)=>cleanups.push(activate(el,'继续探索，第'+(i+1)+'个提示点',()=>{
   jump?.kill();const state={y:scrollY};
   jump=gsap.to(state,{y:Math.min(scrollY+2000,host.querySelector('.smooth-content').offsetHeight-innerHeight),duration:reduced.matches?0:1,ease:'sine.inOut',onUpdate:()=>scrollTo(0,state.y)});
  })));
  const tick=()=>{
   if(disposed)return;
   const current=smoother.scrollTop();
   const length=host.querySelector('.smooth-content').offsetHeight-innerHeight;
   const time=Math.max(0,Math.min(52.5,current/length*52.5));
   timeline.time(time,false);
   // Reconcile seeks skipped while the video decoder was busy.
   if(video.readyState>=1&&!video.seeking){const wanted=Math.max(0,Math.min(29,(time-37.5)/15*29));if(Math.abs(video.currentTime-wanted)>.035)video.currentTime=wanted;}
   const visible=getComputedStyle(series).display!=='none'&&+getComputedStyle(series).opacity>.05;
   series.inert=!visible;
   dots.forEach(e=>{e.inert=getComputedStyle(e).display==='none'||+getComputedStyle(e).opacity<.05;});
   host.dataset.time=time.toFixed(4);
   frame=requestAnimationFrame(tick);
  };
  video.muted=true;
  video.addEventListener('error',()=>{host.dataset.mediaError='true';},{once:true});
  frame=requestAnimationFrame(tick);
  addEventListener('resize',resize);
  let cleanB;installEnhancedMouse(host).then(clean=>{if(disposed)clean();else cleanB=clean;}).catch(console.error);
  const cleanRack=installRackGlissando(host);
  return()=>{disposed=true;cleanRack();cleanB?.();cancelAnimationFrame(frame);jump?.kill();cleanups.forEach(f=>f());removeEventListener('resize',resize);smoother.kill();ctx.revert();};
 },[]);
 return <main ref={root} className="part5-scroll" aria-label="礼乐之邦：编钟与乐悬制度">
  <div className="smooth-wrapper"><div className="smooth-content" /></div>
  <div className="part5-viewport" dangerouslySetInnerHTML={{__html:originalMarkup.replaceAll('/assets/',`${import.meta.env.BASE_URL}assets/`)}} />
  <OriginalNav />
  <p className="media-error" role="status">编钟影像加载失败，请刷新页面重试。</p>
 </main>;
}
createRoot(document.getElementById('root')).render(<Part5/>);
