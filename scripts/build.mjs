import fs from 'node:fs';import {createHash} from 'node:crypto';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'extension');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'SBOM.json'),'utf8'));
const integration=JSON.parse(fs.readFileSync(path.join(root,'INTEGRATION_ASSETS.json'),'utf8'));
for(const [name,expected] of Object.entries(integration.files))if(createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')!==expected)throw Error('Integration asset hash changed: '+name);

for(const [name,expected] of Object.entries(inventory.components[0].files)){const actual=createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');if(actual!==expected)throw Error('Bundled dependency hash changed: '+name);}
const modelManifest=JSON.parse(fs.readFileSync(path.join(root,'models/manifest.json'),'utf8'));if(createHash('sha256').update(fs.readFileSync(path.join(root,'models',modelManifest.file))).digest('hex')!==modelManifest.sha256)throw Error('Classifier model hash changed.');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const name of ['src','assets','shared','reference','models','policy'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
fs.cpSync(path.join(root,'vendor'),path.join(out,'vendor'),{recursive:true});
for(const name of ['engine/dist','engine/config','forms/templates','forms/inventory','forms/maps','forms/fixtures'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
fs.copyFileSync(path.join(root,'forms/registry.json'),path.join(out,'forms/registry.json'));

const demoOut=path.join(out,'demo/ai-components');fs.mkdirSync(demoOut,{recursive:true});
for(const name of ['03-september-pay.pdf','01-bill-with-previous-balance.pdf'])fs.copyFileSync(path.join(root,'demo/package-doctor',name),path.join(demoOut,name));
fs.copyFileSync(path.join(root,'demo/ai-components/05-short-note.txt'),path.join(demoOut,'05-short-note.txt'));

fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({manifest_version:3,name:'BenefitStep — Local Preview',version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,minimum_chrome_version:'138',permissions:['sidePanel'],icons:{16:'assets/benefitstep_small_dark.png',32:'assets/benefitstep_small_dark.png',48:'assets/benefitstep_small_dark.png',128:'assets/benefitstep_small_dark.png'},action:{default_title:'Open BenefitStep',default_icon:{16:'assets/benefitstep_small_dark.png',32:'assets/benefitstep_small_dark.png'}},side_panel:{default_path:'assets/index.html'},background:{service_worker:'src/background.js'},content_security_policy:{extension_pages:"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; worker-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'"}},null,2));
console.log('Built '+out);
