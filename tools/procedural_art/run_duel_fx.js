/* node tools/procedural_art/run_duel_fx.js — 실제 Chromium 캔버스에서 투명 PNG를 굽는다. */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '../..');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || process.env.CHROME_PATH,
    args: ['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ path: path.join(root,'js/data/duelart.js') });
    await page.addScriptTag({ path: path.join(__dirname,'fx/duel_fx.js') });
    const out = path.join(root,'images/duel/fx');
    fs.mkdirSync(out,{ recursive:true });
    const ids = await page.evaluate(() => Object.keys(G.DUEL_ART.fx));
    for (const id of ids.filter(k => !/^(dust_|ink_)/.test(k))) {
      const png = await page.evaluate(id => {
        const spec=G.DUEL_ART.fx[id], [w,h]=spec.cell;
        const canvas=document.createElement('canvas'); canvas.width=w*spec.frames; canvas.height=h;
        const ctx=canvas.getContext('2d');
        for (let i=0;i<spec.frames;i++) {
          ctx.save();ctx.translate(i*w,0);ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
          ctx.translate(...spec.pivot);window.bakeDuelEffect(ctx,id,i,spec);ctx.restore();
        }
        return canvas.toDataURL().split(',')[1];
      },id);
      fs.writeFileSync(path.join(out,id+'.png'),Buffer.from(png,'base64'));
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
