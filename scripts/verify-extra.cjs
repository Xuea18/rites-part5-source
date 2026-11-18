const fs=require('fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const url=process.env.B_TEST_URL||'http://127.0.0.1:5175/b/';
 const browser=await chromium.launch({channel:'chrome',headless:true,...(process.env.B_TEST_PROXY?{proxy:{server:process.env.B_TEST_PROXY}}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
 await context.addInitScript(()=>{window.audioTests=[];const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const el=this;window.audioTests.push(el);return original.apply(this,arguments);};});
 const page=await context.newPage(),errors=[];page.setDefaultNavigationTimeout(120000);page.on('pageerror',e=>errors.push(e.message));const result={url,errors,bells:[]};
 try{
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__EXP_B);
 const points=JSON.parse(fs.readFileSync('verification.json')).available;
 for(const [id,p] of Object.entries(points)){
  await page.evaluate(t=>scrollTo(0,(document.body.scrollHeight-innerHeight)*t/52.5),p.t);await page.waitForTimeout(2400);
  const before=await page.evaluate(()=>__EXP_B.log.session.events.length);
  await page.mouse.click(p.x,p.y);await page.waitForTimeout(900);await page.waitForFunction(()=>audioTests.some(a=>!a.paused&&a.currentTime>0),{},{timeout:5000}).catch(()=>{});
  const row={id,click:await page.evaluate(id=>__EXP_B.log.session.events.some(e=>e.type==='click'&&e.target===id),id),audio:await page.evaluate(()=>audioTests.some(a=>!a.paused&&a.currentTime>0))};
  await page.mouse.move(720,880);await page.mouse.down();await page.mouse.move(p.x,p.y,{steps:30});await page.waitForTimeout(200);
  // Follow the moved bell using real hit coordinates; scene movement can move tiny background bells away from the initial endpoint.
  for(let retry=0;retry<3;retry++){const point=await page.evaluate(id=>{const b=__EXP_B.bells.find(b=>b.id===id),r=b.rect;let best=null,score=Infinity;for(let y=Math.max(70,r.y+3);y<Math.min(innerHeight-5,r.y+r.height);y+=4)for(let x=Math.max(3,r.x+3);x<Math.min(innerWidth-5,r.x+r.width);x+=4)if(__EXP_B.hit(x,y)?.id===id){const d=Math.hypot(x-r.x-r.width/2,y-r.y-r.height*.6);if(d<score){score=d;best={x,y};}}return best;},id);
  if(point)await page.mouse.move(point.x,point.y,{steps:5});await page.waitForTimeout(250);}
  await page.mouse.up();await page.waitForTimeout(300);
  row.strum=await page.evaluate(({id,before})=>__EXP_B.log.session.events.slice(before).some(e=>e.target===id&&e.type==='drag'&&e.extra.phase==='strum'),{id,before});result.bells.push(row);
 }
 await page.evaluate(()=>scrollTo(0,(document.body.scrollHeight-innerHeight)*8/52.5));await page.waitForTimeout(2400);
 const p=await page.evaluate(()=>{const b=__EXP_B.bells.find(b=>b.id==='bell-5-1'),r=b.rect;return {x:r.x+r.width/2,y:r.y+r.height*.6};});
 await page.mouse.click(p.x,p.y,{clickCount:2,delay:60});await page.waitForTimeout(8500);
 result.autoStops=await page.locator('[data-bell="bell-5-1"] .b-solid').evaluate(e=>e.getAnimations().every(a=>a.playState==='finished'));
 await page.mouse.click(720,450,{button:'right'});await page.mouse.down();await page.waitForTimeout(700);
 result.lensLongpress=await page.evaluate(()=>__EXP_B.log.session.events.some(e=>e.type==='longpress'&&e.target==='bell-5-1'));
 await page.mouse.up();await page.waitForTimeout(100);result.holdStops=await page.evaluate(()=>audioTests.every(a=>!a.loop||a.paused));
 await page.screenshot({path:'verification-hover.png'});
 const download=page.waitForEvent('download');await page.goto(url+'?export=1');const d=await download;await d.saveAs('verification-export.json');result.export=JSON.parse(fs.readFileSync('verification-export.json')).length>0;
 result.storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('exp_b_events')).length>0);
 }finally{fs.writeFileSync('verification-extra.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
