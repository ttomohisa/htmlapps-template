'use strict';
// Run only in the contents:write job after the read-only validation job succeeds.
module.exports=async({github,context,core,releaseDir=require('node:path').resolve('release')})=>{
  const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
  if(context.ref!=='refs/heads/main')throw Error('Releases may only be published from main');
  const meta=JSON.parse(fs.readFileSync(path.join(releaseDir,'release.json'),'utf8'));
  if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(meta.version)||meta.tag!=='v'+meta.version||meta.commit!==context.sha)throw Error('Release metadata does not match the tested commit/version');
  if(!Array.isArray(meta.assets)||meta.assets.length!==3||new Set(meta.assets.map(x=>x.name)).size!==3||!meta.assets.some(x=>x.name==='SHA256SUMS'))throw Error('Incomplete release assets');
  const assets=meta.assets.map(entry=>{
    if(entry.name!==path.basename(entry.name)||!(/^[a-z0-9.-]+\.html$/.test(entry.name)||entry.name==='SHA256SUMS'))throw Error('Invalid release asset name');
    const data=fs.readFileSync(path.join(releaseDir,entry.name));
    if(data.length!==entry.size||crypto.createHash('sha256').update(data).digest('hex')!==entry.sha256)throw Error('Release asset integrity check failed: '+entry.name);
    return {...entry,data};
  });
  const {owner,repo}=context.repo;
  const config=JSON.parse(fs.readFileSync('app.config.json','utf8'));
  if(config.repository.owner.toLowerCase()!==owner.toLowerCase()||config.repository.name.toLowerCase()!==repo.toLowerCase()||config.version!==meta.version||config.name!==meta.name)throw Error('Release configuration does not match this repository');
  const expected=[config.slug+'.html',config.slug+'.self-extract.html','SHA256SUMS'];
  if(!expected.every(name=>meta.assets.some(asset=>asset.name===name)))throw Error('Unexpected release assets');
  const sums=assets.filter(asset=>asset.name!=='SHA256SUMS').map(asset=>asset.sha256+'  '+asset.name).join('\n')+'\n';
  if(assets.find(asset=>asset.name==='SHA256SUMS').data.toString('utf8')!==sums)throw Error('SHA256SUMS does not match packaged HTML');
  const releases=await github.paginate(github.rest.repos.listReleases,{owner,repo,per_page:100});
  let release=releases.find(item=>item.tag_name===meta.tag);
  if(release&&!release.draft){core.notice(meta.tag+' is already published; tag and assets left unchanged.');return{skipped:true,url:release.html_url};}
  let ref;
  try{ref=(await github.rest.git.getRef({owner,repo,ref:'tags/'+meta.tag})).data;}catch(error){if(error.status!==404)throw error;}
  if(ref){
    let object=ref.object;
    for(let depth=0;object.type==='tag'&&depth<5;depth++)object=(await github.rest.git.getTag({owner,repo,tag_sha:object.sha})).data.object;
    if(object.type!=='commit'||object.sha!==meta.commit)throw Error('Release tag points at another commit; refusing to move it');
  }else await github.rest.git.createRef({owner,repo,ref:'refs/tags/'+meta.tag,sha:meta.commit});
  if(!release)release=(await github.rest.repos.createRelease({owner,repo,tag_name:meta.tag,target_commitish:meta.commit,name:meta.name+' '+meta.tag,body:meta.notes,draft:true,prerelease:false})).data;
  for(const asset of assets){
    // Only a draft's expected assets may be replaced to resume an interrupted run.
    const old=(release.assets||[]).find(item=>item.name===asset.name);
    if(old)await github.rest.repos.deleteReleaseAsset({owner,repo,asset_id:old.id});
    await github.rest.repos.uploadReleaseAsset({owner,repo,release_id:release.id,url:release.upload_url,name:asset.name,data:asset.data,headers:{'content-type':asset.name.endsWith('.html')?'text/html':'text/plain','content-length':asset.size}});
  }
  const published=(await github.rest.repos.updateRelease({owner,repo,release_id:release.id,name:meta.name+' '+meta.tag,body:meta.notes,draft:false,prerelease:false,make_latest:'true'})).data;
  await core.summary.addHeading('Published '+meta.tag).addLink('GitHub Release',published.html_url).write();
  return{skipped:false,url:published.html_url};
};
