const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
const b=await chromium.launch({headless:true,...(process.env.CHITON_BROWSER_CHANNEL?{channel:process.env.CHITON_BROWSER_CHANNEL}:{})});
try {
 const p=await b.newPage(); const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+path.join(__dirname,'index.html'));
 const set=async(obj)=>{await p.evaluate(obj=>{for(const [k,v] of Object.entries(obj)){const e=document.querySelector(`[data-key="${k}"]`);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},obj);await p.waitForTimeout(100);};
 const state=()=>p.evaluate(()=>document.querySelector('#chiton-lab').__optics);
 const image=()=>p.evaluate(()=>document.querySelector('[data-canvas="image"]').toDataURL());
 await set({model:'dual',medium:'water',depth:12.5});assert.deepEqual((await state()).metrics.foci,[64.25,26.67]);
 const a=await image();await set({medium:'air'});assert.deepEqual((await state()).metrics.foci,[3.42,-2.85]);assert.notEqual(await image(),a);
 const c=await image();await set({depth:40});assert.notEqual(await image(),c);
 const d=await image();await set({pattern:'checker'});assert.notEqual(await image(),d);
 await set({model:'snell',medium:'water',index:1.68,depth:27,aperture:4});const narrow=(await state()).metrics.rms[0];
 await set({aperture:28});assert.ok((await state()).metrics.rms[0]>narrow);
 assert.deepEqual(errors,[]);console.log('PASS: focus benchmarks, controls, image updates and aperture response');
} finally {await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
