import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeDocument,classifyPages} from '../src/document-analysis.mjs';
import {initial,addDocument,usable,removeDocument} from '../src/state.mjs';
const model=JSON.parse(fs.readFileSync(new URL('../models/public-type-model.json',import.meta.url)));
const pages=[{page:1,text:'Gross earnings salary payroll net pay federal tax pay period deductions income wages benefits current year to date'}];
const classify=(p,options)=>classifyPages(p,{...options,loadModel:async()=>model});

test('real trained suggestion accompanies extraction without changing document type or confirming facts',async()=>{
 const result=await analyzeDocument(pages,{classify,extract:async()=>({kind:'unknown',fields:[{key:'gross_pay',value:'1250.00',page:1,quote:'Gross pay 1250.00'}],method:'Local text reader',analysisState:'complete'})});
 assert.equal(result.classification.label,'pay_statement');assert.equal(result.kind,'unknown');assert.equal(result.method,'Local text reader');
 const state=initial();addDocument(state,{id:'doc',hash:'hash',filename:'utility-bill.pdf',bytes:new Uint8Array([1]),pages},result);
 assert.equal(state.docs[0].group,'Other Situations');assert.equal(state.docs[0].classification.modelId,model.modelId);assert.equal(state.facts.filter(usable).length,0);
 removeDocument(state,'doc');assert.equal(state.docs.length,0);assert.equal(state.facts.length,0);
});
test('classifier failure preserves independently extracted facts',async()=>{
 const result=await analyzeDocument(pages,{classify:async()=>{throw Error('missing model');},extract:async()=>({kind:'paystub',fields:[{key:'gross_pay',value:'100.00'}]})});
 assert.equal(result.classification.reason,'model_unavailable');assert.equal(result.kind,'paystub');assert.equal(result.fields[0].value,'100.00');
});
test('extraction failure preserves the model suggestion without inventing facts',async()=>{
 const result=await analyzeDocument(pages,{classify,extract:async()=>{throw Error('Invalid AI output');}});
 assert.equal(result.classification.label,'pay_statement');assert.equal(result.analysisState,'error');assert.deepEqual(result.fields,[]);assert.equal(result.kind,'unknown');
});
test('blank scanned pages and short text abstain; partial readable pages do not hide unreadable pages',async()=>{
 const blank=await classifyPages([...pages,{page:2,text:''}],{loadModel:async()=>{throw Error('must not load');}});
 assert.equal(blank.reason,'unreadable_pages');assert.equal(blank.status,'not_run');assert.equal(blank.label,'unknown');
 const short=await classify([{page:1,text:'Call tomorrow'}]);assert.equal(short.label,'unknown');assert.equal(short.reason,'insufficient_text');
});
test('cancellation during model load prevents extraction and late candidate publication',async()=>{
 const controller=new AbortController();let resolve,extracted=false;
 const pending=analyzeDocument(pages,{signal:controller.signal,classify:(p,options)=>classifyPages(p,{...options,loadModel:()=>new Promise(r=>{resolve=r;})}),extract:async()=>{extracted=true;return {fields:[]};}});
 controller.abort();resolve(model);await assert.rejects(pending,{name:'AbortError'});assert.equal(extracted,false);
});
test('cancellation during extraction prevents publishing even completed classifier output',async()=>{
 const controller=new AbortController();
 await assert.rejects(analyzeDocument(pages,{signal:controller.signal,classify,extract:async()=>{controller.abort();return {kind:'paystub',fields:[]};}}),{name:'AbortError'});
});
test('rereading a canonical source with an existing duplicate retains one active classified source',async()=>{
 const state=initial(),result=await analyzeDocument(pages,{classify,extract:async()=>({kind:'paystub',fields:[],analysisState:'complete'})});
 const doc={id:'original',hash:'same',filename:'pay.pdf',bytes:new Uint8Array([1]),pages};
 addDocument(state,doc,result);addDocument(state,{...doc,id:'copy',filename:'copy.pdf'},result);
 removeDocument(state,'original');addDocument(state,{...doc,id:'reread'},result);
 assert.equal(state.docs.filter(d=>!d.duplicateOf).length,1);assert.equal(state.docs.find(d=>d.id==='reread').classification.label,'pay_statement');assert.equal(state.docs.find(d=>d.id==='copy').duplicateOf,'reread');
});
