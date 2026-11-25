const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const names=['file-picker','file-export','progress-panel','action-toolbar','media-preview','range-slider','segmented-control','empty-state','fullscreen','before-after'];
for(const name of names)test(name+' snippet has valid scripts and no external runtime dependencies',()=>{
 const source=read('components/'+name+'.html');
 for(const m of source.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 assert.doesNotMatch(source,/<(?:script|link|iframe)[^>]+(?:src|href)=["']https?:/i);
});
test('file export normalization prevents unsafe names and duplicate suffix',()=>{
 const source=read('components/file-export.html'),ctx=vm.createContext({window:{},TextEncoder});
 vm.runInContext(source.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
 const normalize=ctx.window.AppFileExport.normalize;
 assert.equal(normalize('','txt','fallback'),'fallback.txt');
 assert.equal(normalize('CON.bad:report.txt'),'CON-file.bad-report.txt');
 assert.equal(normalize('test.TXT'),'test.txt');
 assert.equal(normalize(normalize('CON.bad:report.txt')),'CON-file.bad-report.txt');
 assert.equal(normalize('a/b\\c'),'a-b-c.txt');
 assert.equal(normalize('...'),'output.txt');
 assert.throws(()=>normalize('x','../bad'));
 assert.ok(new TextEncoder().encode(normalize('猫'.repeat(120))).length<=240);
});
test('starter Japanese and English translation dictionaries contain the same keys',{skip:require('../app.config.json').slug!=='single-html-app-starter'},()=>{
 const src=read('src/index.template.html');const start=src.indexOf('const translations = '),end=src.indexOf('const storageKeys = ',start);
 const c=vm.createContext({});vm.runInContext(src.slice(start,end)+';globalThis.translations=translations;',c);
 assert.deepEqual(Object.keys(c.translations.ja).sort(),Object.keys(c.translations.en).sort());
 for(const m of src.matchAll(/data-i18n(?:-title|-aria-label)?="([^"]+)"/g))assert.ok(Object.hasOwn(c.translations.ja,m[1]),'missing '+m[1]);
});
