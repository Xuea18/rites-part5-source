const fs=require('fs');const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Asus/AppData/Local/Programs/nodejs-v26.13.1/node_modules/rea-agents/node_modules/playwright-core');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];fs.mkdirSync('docs/local-focus',{recursive:true});try{
for(const [width,height] of [[1366,768],[1440,900],[1920,1080]]){
const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5175/b/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__EXP_B?.bells.length===3);await page.evaluate(()=>scrollTo(0,(document.body.scrollHeight-innerHeight)*8/52.5));await page.waitForTimeout(2500);await page.evaluate(()=>scrollBy(0,-10));await page.waitForTimeout(700);
const point=async(id,display=false)=>page.evaluate(({id,display})=>{const b=__EXP_B.bells.find(b=>b.id===id),r=display?b.displayRect:b.rect;return{x:r.x+r.width/2,y:r.y+r.height*.6};},{id,display});
const dbl=async(id,display=false)=>{const p=await point(id,display);await page.mouse.click(p.x,p.y,{clickCount:2,delay:70});await page.waitForTimeout(750);};
await dbl('bell-5-1');
const focused=await page.evaluate(()=>{const b=__EXP_B.bells[0],s=getComputedStyle(document.querySelector('.b-focus-backdrop')),r=document.querySelector('.b-focus-backdrop').getBoundingClientRect();return{zoom:__EXP_B.state().zoom,blur:s.backdropFilter,background:s.backgroundColor,opacity:s.opacity,rect:[r.x,r.y,r.width,r.height],layer:b.el.parentElement.className,canvases:b.solid.children.length,transform:getComputedStyle(b.solid).transform,animations:b.solid.getAnimations().length};});
assert.equal(focused.zoom,'bell-5-1');assert.equal(focused.blur,'blur(12px)');assert.equal(focused.opacity,'1');assert.deepEqual(focused.rect,[0,0,width,height]);assert.equal(focused.layer,'b-focus-layer');assert.equal(focused.canvases,1);assert.equal(focused.transform,'none');assert.equal(focused.animations,0);
const p=await point('bell-5-1',true);const count=await page.evaluate(()=>__EXP_B.log.session.events.length);await page.mouse.click(p.x,p.y);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>__EXP_B.log.session.events.length),count);assert.equal(await page.locator('.b-info').evaluate(e=>e.classList.contains('visible')),false);
await page.mouse.move(p.x,p.y);assert.equal(await page.locator('[data-bell="bell-5-1"]').evaluate(e=>e.classList.contains('glow')),true);
await page.mouse.down();await page.waitForTimeout(750);assert.equal(await page.locator('.b-info').evaluate(e=>e.classList.contains('visible')),true);await page.mouse.up();assert.equal(await page.locator('.b-info').evaluate(e=>e.classList.contains('visible')),false);
await page.mouse.move(10,height-10);await page.screenshot({path:`docs/local-focus/focus-${width}x${height}.png`});
await dbl('bell-7-1');assert.equal(await page.evaluate(()=>__EXP_B.state().zoom),'bell-7-1');assert.equal(await page.locator('.b-focus-layer .b-bell').count(),1);
await dbl('bell-7-1',true);assert.equal(await page.evaluate(()=>__EXP_B.state().zoom),undefined);assert.equal(await page.locator('.b-focus-backdrop').evaluate(e=>getComputedStyle(e).opacity),'0');
const restored=await page.evaluate(()=>__EXP_B.bells.every(b=>Object.keys(b.rect).every(k=>Math.abs(b.rect[k]-b.displayRect[k])<1)));assert.ok(restored);assert.deepEqual(errors,[]);
results.push({width,height,focused,singleClickInert:true,longPress:true,crossSelection:true,restored,errors});await page.close();}
fs.writeFileSync('docs/local-focus/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
