/* 저장소의 Playwright Core와 Chrome으로 기존 사건 시험을 실행한다. */
'use strict';
const path=require('path'),Module=require('module'),pw=require('../procedural_art/node_modules/playwright-core');
const launch=pw.chromium.launch.bind(pw.chromium),oldLoad=Module._load;
process.env.BROWSER_EXE='C:/Program Files/Google/Chrome/Application/chrome.exe';
Module._load=function(id,parent,main){return id==='playwright'?pw:oldLoad.call(this,id,parent,main);};
pw.chromium.launch=async opts=>{
 const b=await launch({...opts,executablePath:process.env.BROWSER_EXE,args:[...new Set([...(opts?.args||[]),'--use-gl=swiftshader','--enable-unsafe-swiftshader'])]});
 const newPage=b.newPage.bind(b);
 b.newPage=async opts=>{
  const p=await newPage(opts);p.setDefaultNavigationTimeout(120000);
  const go=p.goto.bind(p),reload=p.reload.bind(p);
  // 게임 자료 검사는 그림·음악의 load 완료 대신 스크립트 준비를 기다린다.
  p.goto=(url,o={})=>go(url,{waitUntil:'domcontentloaded',timeout:120000,...o});
  p.reload=(o={})=>reload({waitUntil:'domcontentloaded',timeout:120000,...o});
  await p.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));return p;
 };
 return b;
};
const name=process.argv[2];if(!/^(colonvoy|pirimap|europe_relations)_smoke\.js$/.test(name||''))throw Error('허용한 사건 시험 이름이 필요합니다.');
require(path.resolve(__dirname,'../../tests',name));
