'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function packageRelease({root=path.resolve(__dirname,'..'),commitSha,outDir=path.join(root,'release')}={}){
  const config=JSON.parse(fs.readFileSync(path.join(root,'app.config.json'),'utf8'));
  if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(config.version)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.slug))throw Error('Invalid stable release version or slug');
  if(!/^[a-f0-9]{40}$/.test(commitSha||''))throw Error('Release requires the exact tested commit SHA');
  if(!/^[a-zA-Z0-9_.-]+$/.test(config.repository.name))throw Error('Invalid repository name');
  if(!config.build?.selfExtract?.enabled)throw Error('Release packaging requires the self-extract variant');
  const buildPath=value=>{if(typeof value!=='string'||!value.trim()||path.isAbsolute(value))throw Error('Release build paths must be relative to repository root');const resolved=path.resolve(root,value),relative=path.relative(root,resolved);if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('Release build path escapes repository root');return resolved;};
  const readable=fs.readFileSync(buildPath(config.build.output));
  if(!readable.equals(fs.readFileSync(path.join(root,config.repository.name.replace(/^htmlapps-/i, '')+'.html'))))throw Error('Repository-root HTML is stale');
  const self=fs.readFileSync(buildPath(config.build.selfExtract.output));
  if(!readable.length||!self.length)throw Error('Missing standalone build');
  const notes=fs.readFileSync(path.join(root,'docs/releases/v'+config.version+'.md'),'utf8').trim();
  if(!notes)throw Error('Release notes are empty');
  fs.mkdirSync(outDir,{recursive:true});
  const entries=[{name:config.slug+'.html',data:readable},{name:config.slug+'.self-extract.html',data:self}];
  const sums=entries.map(x=>hash(x.data)+'  '+x.name).join('\n')+'\n';
  entries.push({name:'SHA256SUMS',data:Buffer.from(sums)});
  for(const entry of entries)fs.writeFileSync(path.join(outDir,entry.name),entry.data);
  const metadata={name:config.name,version:config.version,tag:'v'+config.version,commit:commitSha,notes,assets:entries.map(x=>({name:x.name,size:x.data.length,sha256:hash(x.data)}))};
  fs.writeFileSync(path.join(outDir,'release.json'),JSON.stringify(metadata,null,2)+'\n');
  return metadata;
}
module.exports={packageRelease};
if(require.main===module){
  const sha=process.env.GITHUB_SHA||require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const metadata=packageRelease({commitSha:sha});console.log('Prepared '+metadata.tag+' for '+metadata.commit);
}
