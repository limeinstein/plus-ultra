/* 생성된 그림을 바꾸지 않고 브라우저에 나열해 검수용 화면을 찍는다. */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const plan = require('../docs/art/npc-knee-production.json');
const extensionFile = path.join(root, 'docs', 'art', 'portrait-knee-extension.json');
const extension = fs.existsSync(extensionFile) ? require(extensionFile) : null;
const group = process.argv[2] || 'roles';
const source = process.argv.includes('--source');
const extGroup = extension && extension.categories[group];
const keys = extGroup ? (source ? extGroup.base : extGroup.base.filter(k => !extGroup.missing.includes(k)))
  : group === 'roles' ? plan.roleSources : group === 'sponsors' ? plan.sourceGroups.map(x => x.key) : plan.newSponsors.map(x => 'portraits/sponsors/' + x.id);
const out = path.join(root, 'artifacts', 'npc-knee-check');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1536 } });
  try {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    for (let i = 0; i < keys.length; i += 12) {
      const chunk = keys.slice(i, i + 12).map(x => typeof x === 'string' ? x : x.key);
      const cards = chunk.map(k => {
        const suffix = source ? '' : '_half';
        const f = ['png', 'webp', 'jpg', 'jpeg'].map(ext => path.join(root, 'images', k + suffix + '.' + ext)).find(f => fs.existsSync(f));
        if (!f) throw new Error('아직 없음: ' + k);
        return '<figure><img src="' + pathToFileURL(f).href + '"><figcaption>' + k.replace('portraits/', '') + '</figcaption></figure>';
      });
      await page.setContent('<style>body{margin:0;background:#d5d4d1;display:grid;grid-template-columns:repeat(4,1fr);font:14px sans-serif}figure{margin:0;display:flex;flex-direction:column;align-items:center;height:512px}img{height:480px;width:320px;object-fit:contain}figcaption{height:32px}</style>' + cards.join(''));
      await page.evaluate(() => Promise.all([...document.images].map(x => x.decode())));
      const dest = path.join(out, 'sheet-' + group + (source ? '-source' : '') + '-' + String(i / 12 + 1).padStart(2, '0') + '.png');
      await page.screenshot({ path: dest }); console.log(dest);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
