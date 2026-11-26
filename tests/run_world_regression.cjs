/* 기존 검사를 설치된 Playwright Core·작업 전 원본과 함께 실행한다. 기존 테스트 파일은 고치지 않는다. */
const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'..'),test=path.resolve(__dirname,process.argv[2]||'plant_climate_ledger_smoke.js');let src=fs.readFileSync(test,'utf8');
src=src.replaceAll("require('playwright')","require("+JSON.stringify(path.join(root,'tools/procedural_art/node_modules/playwright-core'))+")");
process.env.BROWSER_EXE='C:/Program Files/Google/Chrome/Application/chrome.exe';
const m=new Module(test,module);m.filename=test;m.paths=Module._nodeModulePaths(path.dirname(test));m._compile(src,test);
