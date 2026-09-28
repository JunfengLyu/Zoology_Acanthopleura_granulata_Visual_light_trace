const fs = require('fs');
const {chromium} = require('playwright');
const path = require('path');
const dir = __dirname;
(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.CHITON_BROWSER_CHANNEL ? {channel:process.env.CHITON_BROWSER_CHANNEL} : {})});
  const page = await browser.newPage({viewport:{width:932,height:1100},deviceScaleFactor:2});
  await page.goto('file://'+dir+'/index.html');
  const frame = page.mainFrame();
  await frame.waitForSelector('#chiton-lab');
  const views = [];
  for (const medium of ['water','air']) {
    await frame.evaluate(medium => {
      for (const [key,value] of Object.entries({model:'dual',medium,pattern:'fish',index:1.53,depth:12.5,angle:0,aperture:12,pitch:4})) {
        const e=document.querySelector(`[data-key="${key}"]`);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }, medium);
    await page.waitForTimeout(200);
    views.push(await frame.evaluate(() => {
      const svg=document.querySelector('.rayview').cloneNode(true);
      const original=document.querySelector('.rayview');
      const nodes=[svg,...svg.querySelectorAll('*')], originals=[original,...original.querySelectorAll('*')];
      nodes.forEach((node,i)=>{
        const style=getComputedStyle(originals[i]);
        for(const attr of ['fill','stroke'])if(node.hasAttribute(attr))node.setAttribute(attr,style.getPropertyValue(attr));
        if(node.tagName.toLowerCase()==='text'){node.setAttribute('font-size','12');node.setAttribute('font-family','Arial, PingFang SC, sans-serif');}
      });
      return {images:['source','image','sample'].map(k=>{const src=document.querySelector(`[data-canvas="${k}"]`),c=document.createElement('canvas');c.width=src.width;c.height=src.height;const ctx=c.getContext('2d');ctx.drawImage(src,0,0);if(k!=='source')ctx.clearRect(136,185,56,7);return c.toDataURL();}),metrics:document.querySelector('#chiton-lab').__optics.metrics};
    }));
  }
  const text=(x,y,s,size=17,anchor='start',color='#242a30')=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${color}">${s}</text>`;
  function rayDiagram(ne){
    const X=x=>24+(x+30)*4.48,Y=y=>140-y*4.48;
    let s=`<rect x="${X(48)}" y="60" width="112" height="160" fill="#ebf7ef"/>`;
    let pts=[];for(let y=-17.5;y<=17.5;y+=.5)pts.push([18-Math.sqrt(324-y*y),y]);for(let y=17.5;y>=-17.5;y-=.5)pts.push([5+Math.sqrt(1849-y*y),y]);
    s+=`<path d="${pts.map((p,i)=>(i?'L':'M')+X(p[0])+','+Y(p[1])).join(' ')}Z" fill="#e8e8ea" stroke="#d9dade"/>`;
    s+=`<path d="M${X(-30)},140H${X(155)}" stroke="#e5e5e5"/>`;
    [1.53,1.68].forEach((n,c)=>{const p1=(n-ne)/18,p2=(1.336-n)/-43,A=1-48/n*p1,C=-p2*A-p1;
      for(let i=-3;i<=3;i++){const y=i*2,y2=A*y,ye=y2+(155-48)/1.336*C*y;
        s+=`<path d="M${X(-30)},${Y(y)}L${X(0)},${Y(y)}L${X(48)},${Y(y2)}L${X(155)},${Y(ye)}" stroke="${c?'#fc8534':'#359bff'}" stroke-width="1.4" ${c?'stroke-dasharray="5 4"':''} fill="none"/>`;
      }
    });
    return s+text(X(24),28,'Lens',17,'middle')+text(X(60.5),48,'Photoreceptive region',17,'middle');
  }
  let body='';
  for(let k=0;k<2;k++){
    const v=views[k],top=24+k*506,label=k?'Air (n = 1.000)':'Seawater (n = 1.336)';
    body+=text(32,top+12,label,19);
    body+=`<svg x="16" y="${top+26}" width="900" height="250" viewBox="0 0 900 250">${rayDiagram(k?1:1.336)}</svg>`;
    for(let i=0;i<3;i++){
      const x=66+i*302;
      body+=`<image x="${x}" y="${top+282}" width="196" height="196" href="${v.images[i]}"/>`;
    }
  }
  const font=process.env.CHITON_APTOS_FILE ? fs.readFileSync(process.env.CHITON_APTOS_FILE).toString('base64') : ''; 
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="932" height="1032" viewBox="0 0 932 1032" font-family="Aptos, Arial, sans-serif"><defs><style>@font-face{font-family:Aptos;src:url(data:font/ttf;base64,${font}) format('truetype');font-weight:400}</style></defs><rect width="932" height="1032" fill="white"/>${body}</svg>`;
  fs.writeFileSync(dir+'/chiton-water-air-plate.svg',svg);
  await page.setViewportSize({width:932,height:1032});
  await page.goto('about:blank');
  await page.setContent('<html><body style="margin:0">'+svg+'</body></html>');
  await page.screenshot({path:dir+'/chiton-water-air-plate.png',fullPage:true});
  console.log(JSON.stringify(views.map(v=>v.metrics)));
  await browser.close();
})();
