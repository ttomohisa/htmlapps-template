'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), os=require('node:os'), crypto=require('node:crypto');
const {packageRelease}=require('../scripts/package-release.cjs');
const sha='a'.repeat(40);
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'htmlapp-release-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const config={name:'Demo',slug:'different-slug',version:'1.2.3',repository:{owner:'test',name:'htmlapps-demo'}};
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
