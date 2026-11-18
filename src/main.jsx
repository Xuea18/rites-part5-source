import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import originalMarkup from './generated/part5.html?raw';
import { createPart5Timeline } from './generated/part5-timeline';
import './generated/part5.css';
import './styles.css';
gsap.registerPlugin(ScrollTrigger,ScrollSmoother);

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
  return()=>{disposed=true;cancelAnimationFrame(frame);jump?.kill();cleanups.forEach(f=>f());removeEventListener('resize',resize);smoother.kill();ctx.revert();};
 },[]);
 return <main ref={root} className="part5-scroll" aria-label="礼乐之邦：编钟与乐悬制度">
  <div className="smooth-wrapper"><div className="smooth-content" /></div>
  <div className="part5-viewport" dangerouslySetInnerHTML={{__html:originalMarkup}} />
  <p className="media-error" role="status">编钟影像加载失败，请刷新页面重试。</p>
 </main>;
}
createRoot(document.getElementById('root')).render(<Part5/>);
