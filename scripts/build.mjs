import {copyFileSync,mkdirSync,readFileSync,statSync,existsSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_ANON_KEY||'';
if(Boolean(url)!==Boolean(key))throw new Error('Set both SUPABASE_URL and SUPABASE_ANON_KEY.');
if(url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))throw new Error('SUPABASE_URL must be your https://PROJECT.supabase.co URL.');
if(key){
  let valid=key.startsWith('sb_publishable_');
  if(key.startsWith('eyJ')){try{valid=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon';}catch{valid=false;}}
  if(!valid)throw new Error('Use a Supabase publishable or anon key, never a secret/service-role key.');
}
// Remove only the known obsolete prototype outputs, never unrelated files.
for(const name of ['seed.js','domain.js','views.js','app.js'])rmSync(resolve(root,'dist',name),{force:true});
const files=['index.html','styles.css','site.css','images/lobby.webp','images/logo.png','images/coach-domz.png','images/coach-paul.png','images/class-schedule.png','images/hiring.png'];
for(const file of files){const target=resolve(root,'dist',file);mkdirSync(dirname(target),{recursive:true});copyFileSync(resolve(root,'public',file),target);}
await build({entryPoints:[resolve(root,'public/site.js')],bundle:true,minify:true,format:'iife',target:['es2022'],outfile:resolve(root,'dist/site.bundle.js'),define:{__SUPABASE_URL__:JSON.stringify(url),__SUPABASE_ANON_KEY__:JSON.stringify(key)}});
writeFileSync(resolve(root,'dist/.nojekyll'),'');
const html=readFileSync(resolve(root,'dist/index.html'),'utf8');
for(const src of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(x=>x[1]).filter(x=>!/^https?:/.test(x))){if(!existsSync(resolve(root,'dist',src)))throw new Error('Missing asset: '+src);}
const bytes=[...files,'site.bundle.js'].reduce((sum,file)=>sum+statSync(resolve(root,'dist',file)).size,0);
console.log(`Built ${files.length+1} files (${Math.ceil(bytes/1024)} KB). Member backend: ${url?'configured':'not configured — public website only'}.`);
