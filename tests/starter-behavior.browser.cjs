'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const config=require('../app.config.json');
const url=pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href;
(async()=>{
 if(config.slug!=='single-html-app-starter')return;
 const browser=await require('playwright')[process.env.BK_BROWSER||'chromium'].launch();
 try {
  for(const mode of ['normal','storage-denied','invalid-language','clipboard-denied']){
   const context=await browser.newContext({locale:'ja-JP',acceptDownloads:true,viewport:{width:390,height:844}});
   try {
    if(mode==='storage-denied')await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('QuotaExceededError');};});
    if(mode==='invalid-language')await context.addInitScript(slug=>{try{localStorage.setItem(slug+':language','corrupt-value');}catch{}},config.slug);
    if(mode==='clipboard-denied')await context.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}});document.execCommand=()=>{throw new Error('denied');};});
    const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url());});
    await page.goto(url);const editor=page.locator('#editor'),status=page.locator('#saveStatus'),undo=page.locator('#appToastAction');await editor.waitFor();
    await editor.fill('日本語 test 🐈');assert.equal(await page.locator('#characterCount').textContent(),'10');
    if(mode==='storage-denied'){assert.match(await status.textContent(),/保存できません|unavailable/i);await page.locator('#languageButton').click();assert.match(await status.textContent(),/保存できません|unavailable/i);}
    if(mode==='invalid-language')assert.ok(['ja','en'].includes(await page.locator('html').getAttribute('lang')));
    if(mode==='clipboard-denied'){await page.locator('#copyButton').click();assert.match(await page.locator('#appToastMessage').textContent(),/コピーできません|could not copy/i);}
    if(mode==='normal'){
     await page.locator('#clearButton').click();assert.equal(await editor.inputValue(),'');await undo.click();assert.equal(await editor.inputValue(),'日本語 test 🐈');
     await page.locator('#clearButton').click();await editor.fill('newer edit');assert.ok(!(await undo.isVisible()));assert.equal(await editor.inputValue(),'newer edit');
     await page.locator('#sampleButton').click();await editor.fill('latest');assert.ok(!(await undo.isVisible()));
     const filename=page.locator('#outputFilename');await filename.fill('CON.bad:report.txt');
     const waiting=page.waitForEvent('download');await page.locator('#downloadButton').click();const download=await waiting;
     assert.equal(download.suggestedFilename(),'CON-file.bad-report.txt');assert.equal(await fs.readFile(await download.path(),'utf8'),'latest');
     await page.reload();assert.equal(await editor.inputValue(),'latest');
     await page.locator('#helpButton').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#helpDialog').isVisible());await page.keyboard.press('Escape');assert.ok(!(await page.locator('#helpDialog').isVisible()));
     await editor.fill('x'.repeat(100000));assert.equal((await page.locator('#characterCount').textContent()).replace(/[^0-9]/g,''),'100000');
    }
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
