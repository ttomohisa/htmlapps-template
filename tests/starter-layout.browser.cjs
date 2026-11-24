'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const config=require('../app.config.json');
(async()=>{
  if(config.slug!=='single-html-app-starter'){console.log('Starter-only UI checks skipped; replace with app-specific checks.');return;}
  const {chromium}=require('playwright');
  const browser=await chromium.launch();
  try {
    for(const [width,height] of [[320,568],[390,844],[1360,900]]){
      const context=await browser.newContext({viewport:{width,height},locale:'ja-JP',hasTouch:width<820});
      try{
        const page=await context.newPage();
        const errors=[],requests=[];
        page.on('pageerror',e=>errors.push(String(e)));
        page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url());});
        await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);
        await page.locator('#editor').waitFor();
        const font=await page.locator('.brand-name').evaluate(e=>getComputedStyle(e).fontSize);
        await page.locator('#editor').fill('');
        for(let i=0;i<2;i++){
          await page.locator('#languageButton').click();
          assert.equal(await page.locator('#editor').inputValue(),'');
          assert.equal(await page.locator('.brand-name').evaluate(e=>getComputedStyle(e).fontSize),font);
          assert.equal(await page.locator('.local-badge').isVisible(),width>820);
          assert.equal(await page.locator('body > footer').isVisible(),width>820);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
          await page.locator('#helpButton').click();
          assert.ok(await page.locator('#helpDialog').isVisible());
          await page.locator('[data-i18n="helpLicenseBody"]').scrollIntoViewIfNeeded();
          assert.ok(await page.locator('[data-i18n="helpLicenseBody"]').isVisible());
          await page.keyboard.press('Escape');
          assert.ok(!(await page.locator('#helpDialog').isVisible()));
        }
        await page.reload();assert.equal(await page.locator('#editor').inputValue(),'');
        assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
        await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.self-extract.html')).href);
        await page.locator('#editor').waitFor({timeout:20000});
        assert.ok(await page.locator('#editor').isVisible());
        assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
      }finally{await context.close();}
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
