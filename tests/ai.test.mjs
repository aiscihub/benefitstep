import test from 'node:test';import assert from 'node:assert/strict';import {extractWithAI,modelStatus,modelOptions,setupModel} from '../shared/browser/ai.mjs';
const pages=[{page:1,text:'PAY STATEMENT\nGross pay: 1250.00',preview:''}];const good=JSON.stringify({kind:'paystub',fields:[{key:'gross_pay',value:'1250.00',page:1,quote:'Gross pay: 1250.00'}],warnings:[]});
function factory(response=good,status='available'){const calls={created:0,destroyed:0,prompt:0};return {calls,availability:async()=>status,create:async opts=>{calls.created++;calls.opts=opts;return {prompt:async (p,o)=>{calls.prompt++;calls.input=p;calls.constraints=o;return response;},destroy:()=>calls.destroyed++};}};}
test('Unavailable API stays unavailable',async()=>assert.equal(await modelStatus(false,{}),'unavailable'));
test('No approval means no model invocation',async()=>{const f=factory();await assert.rejects(()=>extractWithAI(pages,{factory:f}),/Approve/);assert.equal(f.calls.created,0);});
test('Downloadable model does not start hidden setup during extraction',async()=>{const f=factory(good,'downloadable');await assert.rejects(()=>extractWithAI(pages,{approved:true,factory:f}),/setup/);assert.equal(f.calls.created,0);});
test('Valid structured response and session cleanup',async()=>{const f=factory();const r=await extractWithAI(pages,{approved:true,factory:f});assert.equal(r.fields[0].value,'1250.00');assert.equal(r.fields[0].confirmed,false);assert.equal(f.calls.destroyed,1);assert.ok(f.calls.constraints.responseConstraint);});
test('Model supplied eligibility output rejected, session cleaned',async()=>{const f=factory(JSON.stringify({kind:'paystub',fields:[],warnings:[],eligible:true}));await assert.rejects(()=>extractWithAI(pages,{approved:true,factory:f}));assert.equal(f.calls.destroyed,1);});
test('Fabricated quote withheld',async()=>{const f=factory(JSON.stringify({kind:'paystub',fields:[{key:'gross_pay',value:'9000',page:1,quote:'Gross pay: 9000'}],warnings:[]}));const r=await extractWithAI(pages,{approved:true,factory:f});assert.equal(r.fields.length,0);});
test('Invalid JSON not replaced with a confident fallback',async()=>{const f=factory('hello');await assert.rejects(()=>extractWithAI(pages,{approved:true,factory:f}));assert.equal(f.calls.destroyed,1);});
test('Setup invokes only public model creation, no document prompts',async()=>{const f=factory();await setupModel(true,()=>{},f);assert.equal(f.calls.prompt,0);assert.equal(f.calls.destroyed,1);assert.ok(f.calls.opts.expectedInputs.some(x=>x.type==='image'));});
test('Text mode does not request image capability',()=>assert.equal(modelOptions(false).expectedInputs.length,1));
test('Too many pages rejected',async()=>await assert.rejects(()=>extractWithAI(Array(7).fill(pages[0]),{approved:true,factory:factory()}),/page count/));
test('Oversized document text rejected and session cleaned',async()=>{const f=factory();await assert.rejects(()=>extractWithAI([{page:1,text:'x'.repeat(30000)}],{approved:true,factory:f}),/Too much text/);assert.equal(f.calls.destroyed,1);});
test('Abort does not publish response',async()=>{const f=factory();const c=new AbortController();c.abort();await assert.rejects(()=>extractWithAI(pages,{approved:true,factory:f,signal:c.signal}),/cancelled/);});
test('Normal model preparation progress does not cancel a ready model',async()=>{
 const f=factory();const original=f.create;f.create=async opts=>{opts.monitor({addEventListener(name,fn){assert.equal(name,'downloadprogress');fn({loaded:0});fn({loaded:1});}});assert.equal(opts.signal.aborted,false);return original(opts);};
 const statuses=[];const result=await extractWithAI(pages,{approved:true,factory:f,onStatus:s=>statuses.push(s)});assert.equal(result.kind,'paystub');assert.equal(f.calls.prompt,1);assert.ok(statuses.some(s=>s.includes('100%')));
});
test('A hanging model is bounded even when it ignores AbortSignal',async()=>{
 const f=factory();f.create=async()=>({prompt:()=>new Promise(()=>{}),destroy:()=>f.calls.destroyed++});
 await assert.rejects(()=>extractWithAI(pages,{approved:true,factory:f,timeoutMs:10}),e=>e.code==='AI_TIMEOUT');assert.equal(f.calls.destroyed,1);
});
test('Session that arrives after a creation timeout is destroyed',async()=>{
 let finish,destroyed=0;const f={availability:async()=>'available',create:()=>new Promise(resolve=>finish=resolve)};
 await assert.rejects(()=>extractWithAI(pages,{approved:true,factory:f,timeoutMs:10}),e=>e.code==='AI_TIMEOUT');finish({destroy(){destroyed++;}});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(destroyed,1);
});
test('User cancellation has a distinct error and does not create a session',async()=>{
 const f=factory();const c=new AbortController();c.abort();await assert.rejects(()=>extractWithAI(pages,{approved:true,factory:f,signal:c.signal}),e=>e.code==='AI_CANCELLED');assert.equal(f.calls.created,0);
});

test('setup cancellation rejects promptly and destroys a late-created session',async()=>{
 const {setupModel}=await import('../shared/browser/ai.mjs');let finish,destroyed=0;
 const controller=new AbortController();const factory={create:()=>new Promise(resolve=>finish=resolve)};
 const pending=setupModel(false,()=>{},factory,controller.signal);controller.abort();await assert.rejects(pending,/cancelled/);
 finish({destroy(){destroyed++;}});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(destroyed,1);
});
