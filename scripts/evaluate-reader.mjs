// Repeats the reader evaluation on the fictional test files in demo/evaluation/ and prints the figures quoted on the
// website's evaluation page. Reads only; writes nothing. Run: node scripts/evaluate-reader.mjs
import fs from 'node:fs';
import path from 'node:path';
import {extractByLabels} from '../extension/shared/core/labels.mjs';
const dir=path.resolve(import.meta.dirname,'../demo/evaluation');
const load=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const reference=load('reference.json').documents,graded=new Map(load('graded-values.json').documents.map(d=>[d.file,d.values]));
const same=(a,b)=>String(a??'').replace(/[$,\s]/g,'')===String(b??'').replace(/[$,\s]/g,'');
const AMOUNTS=new Set(['gross_pay','net_pay','ytd_gross','rent_amount','amount_paid','amount_billed','current_charges','prior_balance','amount_due']);
const sets={};let ungraded=0;
for(const doc of reference){
 const text=fs.readFileSync(path.join(dir,doc.text),'utf8');
 const fields=extractByLabels(text.split('\f').map((t,i)=>({page:i+1,text:t}))).fields||[];
 const s=sets[doc.set]??={files:0,withValues:0,values:0,correct:0,rightDocument:0,amounts:0,amountsCorrect:0,expected:0,found:0,missing:0,wrong:0,blank:0,keptBlank:0,misses:[]};
 s.files++;if(fields.length)s.withValues++;
 const marks=graded.get(doc.file)||[];
 for(const f of fields){
  const mark=marks.find(m=>m.field===f.key&&m.value===f.value);
  if(!mark){ungraded++;console.log('NOT GRADED: '+doc.file+' '+f.key+' = '+f.value);continue;}
  s.values++;if(mark.correct)s.correct++;if(mark.correct&&!mark.wrongDocument)s.rightDocument++;
  if(!mark.correct||mark.wrongDocument)s.misses.push((mark.correct?'matches, wrong document: ':'wrong: ')+doc.file+' · '+f.key+' = "'+f.value+'" · '+mark.note);
  if(AMOUNTS.has(f.key)){s.amounts++;if(mark.correct)s.amountsCorrect++;}
 }
 if(marks.length!==fields.length){ungraded++;console.log('GRADED LIST DIFFERS: '+doc.file);}
 for(const [key,value] of Object.entries(doc.expected)){
  const got=fields.find(f=>f.key===key);
  if(value===null){s.blank++;if(!got)s.keptBlank++;continue;}
  s.expected++;if(!got)s.missing++;else if(same(got.value,value))s.found++;else s.wrong++;
 }
}
const total=Object.values(sets).reduce((a,s)=>{for(const k of Object.keys(s))a[k]=k==='misses'?[...(a[k]||[]),...s[k]]:(a[k]||0)+s[k];return a;},{});
const pct=(n,d)=>d?Math.round(100*n/d)+'%':'n/a';
for(const [name,s] of [...Object.entries(sets),['all',total]]){
 console.log(`${name.padEnd(9)} files ${String(s.files).padStart(2)} · files with values ${String(s.withValues).padStart(2)} · values ${String(s.values).padStart(2)} · match the document ${String(s.correct).padStart(2)} (${pct(s.correct,s.values)}) · and belong to the right document ${String(s.rightDocument).padStart(2)} (${pct(s.rightDocument,s.values)}) · dollar amounts ${s.amountsCorrect}/${s.amounts}`+
  ` · reference fields ${s.found}/${s.expected} found, ${s.missing} left blank, ${s.wrong} wrong · must-stay-blank ${s.keptBlank}/${s.blank}`);
}
console.log('\nValues that are wrong or misplaced:');for(const m of total.misses)console.log(' - '+m);
if(ungraded){console.log('\nThe reader now produces values that have not been graded. Update demo/evaluation/graded-values.json.');process.exit(1);}
