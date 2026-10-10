/* PLUS ULTRA 설치형 게임 (Windows) — Electron 껍데기.
   게임 자체는 웹판과 같은 파일(tools/build_desktop.py가 desktop/app에 만든다)을 file://로 연다.
   · 창: 1600×900에서 시작해 화면을 채운다(최대화) · F11 전체 화면 · F12 개발자 도구
   · 저장: 게임이 쓰는 localStorage는 사용자 폴더(%APPDATA%\PLUS ULTRA)에 남아 업데이트·재설치에도 그대로
   · 업데이트: 켤 때 GitHub 릴리스(limeinstein/plus-ultra)에서 새 판을 찾아 뒤에서 받고(바뀐 조각만), 받으면 다시 시작할지 묻는다
   · --smoke: 창을 띄우지 않고 타이틀 화면까지 열어 본 뒤 결과(JSON)를 찍고 끝난다 (GitHub Actions 점검용) */
'use strict';
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');

const SMOKE = process.argv.includes('--smoke');
let updater = null;
try { updater = require('electron-updater').autoUpdater; } catch (e) { updater = null; }

if (!SMOKE && !app.requestSingleInstanceLock()) app.quit();

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 960, minHeight: 540,
    backgroundColor: '#07050a', title: 'PLUS ULTRA — Loop of Good Hope',
    icon: path.join(__dirname, 'icon.png'), show: false, autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false, spellcheck: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.once('ready-to-show', () => { if (!SMOKE) { win.maximize(); win.show(); } });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  // 게임 안의 바깥 링크(자료 출처 등)는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (/^https?:\/\//.test(url)) { e.preventDefault(); shell.openExternal(url); }
  });
  win.on('closed', () => { win = null; });
}

/** 점검: 타이틀 화면이 뜨는지, 그림 목록·콘솔 오류 */
function smoke() {
  const errors = [];
  win.webContents.on('console-message', (e) => {   // Electron 35+: 이벤트 객체에 level('error' …)·message
    const isErr = e.level === 'error' || e.level === 3, msg = String(e.message || '');
    if (isErr && !/fonts\.(googleapis|gstatic)|net::|Failed to load resource/.test(msg)) errors.push(msg);
  });
  win.webContents.on('render-process-gone', (e, d) => errors.push('render-process-gone ' + d.reason));
  const t0 = Date.now();
  const timer = setInterval(async () => {
    let r = null;
    try {
      r = await win.webContents.executeJavaScript('({ scene: window.G && G.Game && G.Game.sceneName, img: window.G && G.Img && G.Img.count ? G.Img.count() : 0, cities: window.G && G.CITY_DATA ? G.CITY_DATA.length : 0 })');
    } catch (e) { errors.push(String(e)); }
    if ((r && r.scene === 'title') || Date.now() - t0 > 120000) {
      clearInterval(timer);
      const ok = !!(r && r.scene === 'title' && r.img > 1000 && !errors.length);
      const line = 'SMOKE ' + JSON.stringify({ ok, result: r, errors, ms: Date.now() - t0, version: app.getVersion() });
      console.log(line);
      const out = (process.argv.find(a => a.startsWith('--smoke-out=')) || '').slice('--smoke-out='.length);
      if (out) { try { require('fs').writeFileSync(out, line + '\n'); } catch (e) { /* 점검 결과를 못 쓰면 콘솔만 */ } }
      app.exit(ok ? 0 : 1);
    }
  }, 1000);
}

function checkUpdates() {
  if (!updater || !app.isPackaged || SMOKE) return;
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on('update-downloaded', async (info) => {
    const r = await dialog.showMessageBox(win, {
      type: 'info', buttons: ['지금 다시 시작', '나중에'], defaultId: 0, cancelId: 1, title: 'PLUS ULTRA 업데이트',
      message: '새 판 ' + info.version + '을(를) 받았습니다.',
      detail: '지금 다시 시작하면 바로 적용됩니다. 「나중에」를 고르면 게임을 끌 때 적용됩니다.\n저장한 항해는 그대로 남습니다 — 다시 시작하기 전에 저장해 두세요.'
    });
    if (r.response === 0) updater.quitAndInstall();
  });
  updater.on('error', (e) => { console.log('업데이트 확인 실패:', e && e.message); });
  updater.checkForUpdates().catch(() => {});
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  createWindow();
  if (SMOKE) smoke(); else checkUpdates();
});
app.on('window-all-closed', () => app.quit());
