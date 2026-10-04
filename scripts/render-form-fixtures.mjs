import fs from 'node:fs';import path from 'node:path';import {renderOfficialForm} from '../src/form-renderer.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=p=>JSON.parse(fs.readFileSync(`${root}/${p}`)),fontBytes=new Uint8Array(fs.readFileSync(`${root}/vendor/pdf-writer/NotoSans-Regular.ttf`));
for(const formId of ['cf285','ccfrm604']){
 const inventory=read(`forms/inventory/${formId}.json`),map=read(`forms/maps/${formId}.json`),template=new Uint8Array(fs.readFileSync(`${root}/forms/templates/${formId}.pdf`));
 for(const fixtureId of Object.keys(map.developerFixtures)){
  const answers=read(`forms/fixtures/${fixtureId}.json`);
  try{const {bytes,report}=await renderOfficialForm({template,inventory,map,answers,fontBytes,mode:'developer',fixtureId,fixtureHash:map.developerFixtures[fixtureId]});fs.writeFileSync(`${root}/forms/validation/${fixtureId}.pdf`,bytes);fs.writeFileSync(`${root}/forms/validation/${fixtureId}.report.json`,JSON.stringify(report,null,2)+'\n');console.log(fixtureId,report.written.length,'written',report.missing.length,'unresolved');}catch(e){console.error(fixtureId,e.stack);process.exitCode=1;break;}
 }
}
