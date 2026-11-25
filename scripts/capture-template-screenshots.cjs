// Development tooling only. Capture actual built starter, never a mockup.
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const config=require('../app.config.json');
(async()=>{
 if(config.slug!=='single-html-app-starter')throw new Error('Capture script is starter-only; replace with application-specific screenshots.');
 const browser=await require('playwright').chromium.launch();
 try{
  await fs.mkdir(path.resolve(__dirname,'../assets'),{recursive:true});
  for(const [width,height,name] of [[1360,900,'screenshot.png'],[390,844,'screenshot-mobile.png']]){
   const context=await browser.newContext({viewport:{width,height},locale:'ja-JP',deviceScaleFactor:1,hasTouch:width<820});
   try{
    const page=await context.newPage();await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);
    await page.locator('#editor').fill('旅行の持ち物リスト\n\n・充電器とモバイルバッテリー\n・着替えと洗面用品\n・交通チケットと宿泊先の予約情報\n・折りたたみ傘\n\n出発前に確認して、テキストとして保存します。');
    await page.locator('#outputFilename').fill('travel-checklist');await page.locator('#outputFilename').blur();
    await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.resolve(__dirname,'../assets',name),animations:'disabled'});
   }finally{await context.close();}
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
