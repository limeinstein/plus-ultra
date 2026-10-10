/* PLUS ULTRA 설치형 게임 — 게임 페이지가 읽을 작은 정보만 넘긴다 (desktop/main.js가 additionalArguments로 준다).
   window.PU_DESKTOP = { version, gifpack }  · gifpack: 깔린 GIF 팩 폴더의 file: 주소 (없으면 null) — app/images/gifpack.js가 읽는다 */
'use strict';
const { contextBridge } = require('electron');
function arg(name) {
  const a = process.argv.find(x => x.startsWith('--' + name + '='));
  return a ? a.slice(name.length + 3) : null;
}
contextBridge.exposeInMainWorld('PU_DESKTOP', { version: arg('pu-version'), gifpack: arg('pu-gifpack') });
