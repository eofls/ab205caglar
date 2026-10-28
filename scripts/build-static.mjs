import fs from 'node:fs';
import path from 'node:path';
const dest='site-dist';fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest);
// Only runtime files and generated reports; never publish credentials or development metadata.
for(const f of fs.readdirSync('.'))if(fs.statSync(f).isFile()&&/\.(html|css|js|json|png|jpe?g|webp|webmanifest)$/.test(f)&&!['package.json','package-lock.json'].includes(f))fs.copyFileSync(f,path.join(dest,f));
for(const d of ['assets','vendor','reports'])if(fs.existsSync(d))fs.cpSync(d,path.join(dest,d),{recursive:true});
fs.copyFileSync('project-status.md',dest+'/project-status.md');
if(!fs.existsSync(dest+'/reports/index.html'))throw Error('Decision report missing');
fs.writeFileSync(dest+'/build-info.json',JSON.stringify({commit:process.env.GITHUB_SHA??'local',createdAt:new Date().toISOString()}));
// Preview and live service workers must not delete one another's caches.
const revision=process.env.GITHUB_SHA??'local';
let sw=fs.readFileSync(dest+'/sw.js','utf8');
sw=sw.replace(/const CACHE=.*?;/,`const PREFIX='ab205-'+encodeURIComponent(self.registration.scope)+'-';const CACHE=PREFIX+${JSON.stringify(revision)};`).replace("x.startsWith('ab205-')","x.startsWith(PREFIX)");
fs.writeFileSync(dest+'/sw.js',sw);
