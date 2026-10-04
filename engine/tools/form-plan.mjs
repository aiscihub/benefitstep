import {readFileSync,writeFileSync} from 'node:fs';
import {prepareForm,parseJson} from '../dist/index.js';
const [id,answersPath,mapPath,outPath]=process.argv.slice(2);
if(!/^(cf285|saws2plus|ccfrm604|synthetic)$/.test(id??'')||!answersPath||!mapPath||!outPath){console.error('Usage: node tools/form-plan.mjs FORM_ID answers.json binding-map.json plan.json');process.exit(1)}
try{
 const read=p=>parseJson(readFileSync(p,'utf8'));
 const inventory=read(new URL(`../forms/inventory/${id}.json`,import.meta.url));
 const plan=prepareForm(inventory,read(mapPath),read(answersPath));writeFileSync(outPath,JSON.stringify(plan,null,2)+'\n');
 console.log(JSON.stringify({status:plan.status,canRender:plan.canRender,operations:plan.operations.length,unresolved:plan.missing.length}));
}catch(e){console.error('Form planning stopped:',e.message);process.exit(1)}
