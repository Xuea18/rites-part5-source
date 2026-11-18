// B verification: real pointer events in a fresh, unsigned-in Chromium context.
const fs=require('fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.B_TEST_URL||'http://127.0.0.1:5175/b/';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,...(process.env.B_TEST_PROXY?{proxy:{server:process.env.B_TEST_PROXY}}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();page.setDefaultNavigationTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const results={base,errors,bells:[],checks:{}};
 try{
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__EXP_B?.bells.length===27);await page.evaluate(()=>document.fonts.ready);
  const seek=async t=>{await page.evaluate(t=>scrollTo(0,(document.body.scrollHeight-innerHeight)*t/52.5),t);await page.waitForTimeout(2400);};
  const available={};
  for(const t of [2,4,6,8,16,24,32]){
   await seek(t);
   const found=await page.evaluate(()=>{const out={};for(const b of __EXP_B.bells){if(!b.shown)continue;const r=b.rect;for(let y=Math.max(70,r.y+5);y<Math.min(innerHeight-10,r.y+r.height);y+=6){for(let x=Math.max(5,r.x+5);x<Math.min(innerWidth-10,r.x+r.width);x+=6){if(__EXP_B.hit(x,y)?.id===b.id){out[b.id]={x,y};break;}}if(out[b.id])break;}}return out;});
   for(const [id,p] of Object.entries(found))if(!available[id])available[id]={...p,t};
  }
  results.available=available;
  for(const [id,p] of Object.entries(available)){
   await seek(p.t);await page.mouse.move(p.x,p.y);await page.waitForTimeout(100);
   const row={id,hover:await page.locator(`[data-bell="${id}"]`).evaluate(e=>e.classList.contains('glow'))};
   await page.mouse.down();await page.waitForTimeout(650);row.longpress=await page.locator('.b-info').evaluate(e=>e.classList.contains('visible'));await page.mouse.up();
   row.release=await page.locator('.b-info').evaluate(e=>!e.classList.contains('visible'));
   await page.mouse.click(p.x,p.y,{clickCount:2,delay:70});await page.waitForTimeout(550);
   row.enlarged=await page.locator(`[data-bell="${id}"]`).evaluate(e=>e.classList.contains('zoomed'));
   await page.mouse.click(720,450);await page.waitForTimeout(360);
   row.rotate=await page.evaluate(id=>__EXP_B.log.session.events.some(e=>e.type==='rotate'&&e.target===id),id);
   await page.mouse.click(720,450,{clickCount:2,delay:70});await page.waitForTimeout(500);
   row.restored=await page.locator(`[data-bell="${id}"]`).evaluate(e=>!e.classList.contains('zoomed'));
   results.bells.push(row);
  }
  await seek(8);await page.mouse.move(700,700);await page.mouse.click(700,700,{button:'right'});await page.waitForTimeout(300);
  results.checks.lensOn=await page.locator('.b-lens').evaluate(e=>e.classList.contains('visible'));
  await page.screenshot({path:'verification-lens.png'});
  await page.mouse.click(700,700,{button:'right'});results.checks.lensOff=await page.locator('.b-lens').evaluate(e=>!e.classList.contains('visible'));
  await page.mouse.click(700,700,{button:'right'});await page.mouse.click(700,700,{button:'right'});results.checks.lensStable=await page.locator('.b-lens').evaluate(e=>!e.classList.contains('visible'));
  results.events=await page.evaluate(()=>__EXP_B.log.session);
  results.checks.noErrors=errors.length===0;
  results.checks.all27=results.bells.length===27;
  await page.screenshot({path:'verification-scene.png'});
 }finally{fs.writeFileSync('verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify({checks:results.checks,bells:results.bells,errors}));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
