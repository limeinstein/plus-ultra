/* 기존 옛이야기 진행 검사를 저장소의 Playwright Core와 Chrome으로 실행한다. */
'use strict';
const path=require('path'),Module=require('module'),pw=require('../procedural_art/node_modules/playwright-core');
const original=Module._load,launch=pw.chromium.launch.bind(pw.chromium);
process.env.BROWSER_EXE='C:/Program Files/Google/Chrome/Application/chrome.exe';
Module._load=function(id,parent,main){return id==='playwright'?pw:original.call(this,id,parent,main);};
pw.chromium.launch=async opts=>{
 const browser=await launch({...opts,executablePath:process.env.BROWSER_EXE});
 const newPage=browser.newPage.bind(browser);
 browser.newPage=async opts=>{const p=await newPage(opts);await p.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));return p;};
 return browser;
};
require(path.resolve(__dirname,'../../tests/folktales_smoke.js'));
