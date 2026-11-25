'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), os=require('node:os'), crypto=require('node:crypto');
const {packageRelease}=require('../scripts/package-release.cjs');
const sha='a'.repeat(40);
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'htmlapp-release-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const config={name:'Demo',slug:'different-slug',version:'1.2.3',repository:{owner:'test',name:'htmlapps-demo'},build:{output:'dist/index.html',selfExtract:{enabled:true,output:'dist/index.self-extract.html'}}};
  fs.mkdirSync(path.join(root,'dist'));fs.mkdirSync(path.join(root,'docs/releases'),{recursive:true});
  fs.writeFileSync(path.join(root,'app.config.json'),JSON.stringify(config));
  fs.writeFileSync(path.join(root,'dist/index.html'),'<html>demo</html>');
  fs.copyFileSync(path.join(root,'dist/index.html'),path.join(root,'demo.html'));
  fs.writeFileSync(path.join(root,'dist/index.self-extract.html'),'<html>loader</html>');
  fs.writeFileSync(path.join(root,'docs/releases/v1.2.3.md'),'Release notes');
  return root;
}
test('packages actual root filename and slug-named assets with exact hashes',t=>{
  const root=fixture(t),meta=packageRelease({root,commitSha:sha});
  assert.equal(meta.commit,sha);assert.equal(meta.tag,'v1.2.3');
  assert.deepEqual(meta.assets.map(a=>a.name),['different-slug.html','different-slug.self-extract.html','SHA256SUMS']);
  for(const a of meta.assets) assert.equal(a.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'release',a.name))).digest('hex'));
});
test('rejects stale repository-root copy',t=>{
  const root=fixture(t);fs.writeFileSync(path.join(root,'demo.html'),'stale');
  assert.throws(()=>packageRelease({root,commitSha:sha}),/stale/);
});
test('rejects missing notes and invalid tested commit',t=>{
  const root=fixture(t);
  assert.throws(()=>packageRelease({root,commitSha:'bad'}),/commit SHA/);
  fs.rmSync(path.join(root,'docs/releases/v1.2.3.md'));
  assert.throws(()=>packageRelease({root,commitSha:sha}),/ENOENT/);
});

const publish=require('../scripts/publish-release.cjs');
function mockPublisher(t,{published=false,tagSha=sha,unexpected=false}={}){
  const root=fixture(t),meta=packageRelease({root,commitSha:sha}),calls=[];
  const release={id:123,tag_name:meta.tag,draft:!published,html_url:'https://example.invalid/release',assets:unexpected?[{name:'unexpected.bin',id:3}]:[]};
  const github={paginate:async()=>[release],rest:{git:{getRef:async()=>({data:{object:{type:'commit',sha:tagSha}}})},repos:{
    listReleases:()=>{},deleteReleaseAsset:async()=>calls.push('delete'),
    uploadReleaseAsset:async({name})=>calls.push('upload:'+name),
    updateRelease:async()=>{calls.push('publish');return{data:release};}
  }}};
  const core={notice:()=>calls.push('skip'),summary:{addHeading(){return this},addLink(){return this},async write(){}}};
  return {root,meta,calls,run:(ref='refs/heads/main')=>publish({github,core,context:{ref,sha,repo:{owner:'test',repo:'htmlapps-demo'}},root,releaseDir:path.join(root,'release')})};
}
test('published releases remain unchanged',async t=>{const p=mockPublisher(t,{published:true});assert.equal((await p.run()).skipped,true);assert.deepEqual(p.calls,['skip']);});
test('refuses moving a tag or publishing unexpected draft assets',async t=>{const p=mockPublisher(t,{tagSha:'b'.repeat(40)});await assert.rejects(p.run(),/another commit/);assert.deepEqual(p.calls,[]);const q=mockPublisher(t,{unexpected:true});await assert.rejects(q.run(),/unexpected assets/);assert.deepEqual(q.calls,[]);});
test('publishes only after all three checked assets are uploaded',async t=>{const p=mockPublisher(t);assert.equal((await p.run()).skipped,false);assert.deepEqual(p.calls,['upload:different-slug.html','upload:different-slug.self-extract.html','upload:SHA256SUMS','publish']);});
test('rejects non-main, tampered bytes and notes',async t=>{const p=mockPublisher(t);await assert.rejects(p.run('refs/pull/1/merge'),/main/);fs.writeFileSync(path.join(p.root,'docs/releases/v1.2.3.md'),'Changed');await assert.rejects(p.run(),/notes differ/);fs.writeFileSync(path.join(p.root,'docs/releases/v1.2.3.md'),'Release notes');fs.writeFileSync(path.join(p.root,'release/different-slug.html'),'tampered');await assert.rejects(p.run(),/integrity/);assert.deepEqual(p.calls,[]);});
test('packaging requires self-extract and rejects escaping output paths',t=>{const root=fixture(t),file=path.join(root,'app.config.json'),c=JSON.parse(fs.readFileSync(file));c.build.selfExtract.enabled=false;fs.writeFileSync(file,JSON.stringify(c));assert.throws(()=>packageRelease({root,commitSha:sha}),/requires the self-extract/);c.build.selfExtract.enabled=true;c.build.output='../outside.html';fs.writeFileSync(file,JSON.stringify(c));assert.throws(()=>packageRelease({root,commitSha:sha}),/escapes repository root/);});
