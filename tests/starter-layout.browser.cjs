'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const config=require('../app.config.json');
(async()=>{
  if(config.slug!=='single-html-app-starter'){console.log('Starter-only UI checks skipped; replace with app-specific checks.');return;}
  const engine=process.env.BK_BROWSER||'chromium';
  const browser=await require('playwright')[engine].launch();
  try {
    for(const [width,height] of [[320,568],[390,844],[740,360],[1360,900]]){
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
          const language=await page.locator('html').getAttribute('lang');
          assert.equal(await page.locator('#languageButton').textContent(),language==='ja'?'EN':'JA');
          assert.equal(await page.locator('.page-intro h1,.page-intro h2').count(),0);
          assert.equal(await page.locator('h1.brand-name').count(),1);
          for(const id of ['copyButton','downloadButton','sampleButton','clearButton']){
            const button=page.locator('#'+id);
            assert.equal(await button.locator('svg[aria-hidden="true"]').count(),1);
            assert.ok((await button.locator('span[data-i18n]').textContent()).trim());
            assert.ok((await button.boundingBox()).height>=44);
          }
          if(width<=520){
            const copy=await page.locator('#copyButton').boundingBox(),download=await page.locator('#downloadButton').boundingBox(),sample=await page.locator('#sampleButton').boundingBox(),clear=await page.locator('#clearButton').boundingBox();
            assert.ok(Math.abs(copy.y-download.y)<1);
            assert.ok(Math.abs(sample.y-clear.y)<1);
            assert.ok(sample.y>copy.y);
            assert.ok(Math.abs(copy.width-download.width)<1);
          }
          assert.equal(await page.locator('.brand-name').evaluate(e=>getComputedStyle(e).fontSize),font);
          assert.equal(await page.locator('.local-badge').isVisible(),width>820);
          assert.equal(await page.locator('body > footer').isVisible(),width>820);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
          await page.locator('#helpButton').click();
          assert.ok(await page.locator('#helpDialog').isVisible());
          await page.locator('[data-i18n="helpLicenseBody"]').scrollIntoViewIfNeeded();
          assert.ok(await page.locator('[data-i18n="helpLicenseBody"]').isVisible());
          const buildInfo=page.locator('#helpDialog details.help-build-info');
          assert.equal(await page.locator('main [data-i18n="buildInfo"]').count(),0);
          assert.equal(await buildInfo.count(),1);
          if(await buildInfo.evaluate(e=>e.open)) await buildInfo.locator('summary').click();
          assert.ok(!(await page.locator('#buildVersion').isVisible()));
          await buildInfo.locator('summary').click();
          await page.locator('#dependencyCount').scrollIntoViewIfNeeded();
          assert.equal(await page.locator('#buildVersion').textContent(),config.version);
          assert.ok(await page.locator('#builtAt').isVisible());
          assert.ok(await page.locator('#dependencyCount').isVisible());
          await buildInfo.locator('summary').click();
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
