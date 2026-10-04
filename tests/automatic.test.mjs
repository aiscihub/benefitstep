import test from 'node:test';
import assert from 'node:assert/strict';
import {extractAutomatically} from '../shared/browser/automatic.mjs';
const text=content=>[{page:1,text:content}];
test('Automatic text processing identifies type and key facts without labels from user',async()=>{
 const result=await extractAutomatically(text('PAY STATEMENT\nCurrent gross pay: 1250.00\nTake-home pay: 1000.00'),{factory:{}});
 assert.equal(result.kind,'paystub');assert.equal(result.fields.find(f=>f.key==='gross_pay').value,'1250.00');assert.ok(result.fields.every(f=>!f.confirmed));assert.match(result.method,/not AI/);
});
test('Unrelated text stays unidentified instead of forcing a trained type guess',async()=>{
 const r=await extractAutomatically(text('COMMUNITY NEWSLETTER\nCommunity event schedule. No income or expense proof is provided.'),{factory:{}});
 assert.equal(r.kind,'unknown');assert.equal(r.fields.length,0);
});
test('Incomplete rent is identified without inventing its missing amount',async()=>{
 const r=await extractAutomatically(text('RENTAL AGREEMENT\nPerson: Demo Adult A\nExpense frequency: monthly'),{factory:{}});
 assert.equal(r.kind,'rent');assert.ok(!r.fields.some(f=>f.key==='rent_amount'));
});
test('Scans wait for local image AI without silently parsing only other pages',async()=>{
 const r=await extractAutomatically([...text('PAY STATEMENT\nGross pay: 1250.00'),{page:2,text:'',preview:''}],{factory:{}});
 assert.equal(r.analysisState,'needs-ai');assert.equal(r.fields.length,0);
});
test('Downloadable model never triggers automatic download during folder processing',async()=>{
 let calls=0;const factory={availability:async()=>'downloadable',create:async()=>{calls++;}};
 const r=await extractAutomatically(text('RENTAL AGREEMENT\nMonthly rent: 1400.00'),{factory});
 assert.equal(r.kind,'rent');assert.equal(calls,0);
});
test('Ready local AI is automatically invoked and cleaned up',async()=>{
 let destroyed=0;const factory={availability:async()=>'available',create:async()=>({prompt:async()=>JSON.stringify({kind:'rent',fields:[{key:'rent_amount',value:'1400.00',page:1,quote:'Monthly rent: 1400.00'}],warnings:[]}),destroy:()=>destroyed++})};
 const r=await extractAutomatically(text('RENTAL AGREEMENT\nMonthly rent: 1400.00'),{factory});assert.equal(r.method,'On-device AI');assert.equal(destroyed,1);assert.equal(r.fields[0].confirmed,false);
});
test('An invalid AI response is reported, not silently replaced by another reader',async()=>{
 const factory={availability:async()=>'available',create:async()=>({prompt:async()=>'invalid',destroy(){}})};
 await assert.rejects(()=>extractAutomatically(text('RENTAL AGREEMENT'),{factory}));
});
test('Cancelled selection never invokes AI',async()=>{
 const c=new AbortController();c.abort();await assert.rejects(()=>extractAutomatically(text('PAY STATEMENT'),{signal:c.signal}),/cancelled/);
});
test('Automatic mode uses labeled local text fallback and stops retrying a broken model in the batch',async()=>{
 let created=0;const factory={availability:async()=>'available',create:async()=>{created++;throw new DOMException('Local model service stopped','OperationError');}};const batchState={};
 for(let i=0;i<2;i++){const r=await extractAutomatically(text('RENTAL AGREEMENT\nMonthly rent: 1400.00'),{factory,batchState});assert.equal(r.kind,'rent');assert.equal(r.fields[0].confirmed,false);assert.match(r.method,/after AI failure \(not AI\)/);assert.ok(r.warnings.some(w=>w.includes('not AI')));}
 assert.equal(created,1);
});
test('AI-only mode reports failure without replacing results with text',async()=>{
 const factory={availability:async()=>'available',create:async()=>{throw new Error('broken model');}};
 await assert.rejects(()=>extractAutomatically(text('RENTAL AGREEMENT'),{mode:'ai',factory}),e=>e.code==='AI_RUNTIME');
});
test('Automatic timeout falls back locally; scans never receive invented text results',async()=>{
 const factory={availability:async()=>'available',create:async()=>({prompt:()=>new Promise(()=>{}),destroy(){}})};const batchState={};
 const result=await extractAutomatically(text('RENTAL AGREEMENT\nMonthly rent: 1400.00'),{factory,batchState,timeoutMs:10});assert.equal(result.fields[0].value,'1400.00');
 const scan=await extractAutomatically([{page:1,text:'',preview:''}],{factory,batchState});assert.equal(scan.analysisState,'needs-ai');assert.deepEqual(scan.fields,[]);
});
test('User cancellation never falls back or trips the batch model circuit breaker',async()=>{
 const controller=new AbortController(),batchState={};let prompted=0;const factory={availability:async()=>'available',create:async()=>({prompt:async()=>{prompted++;controller.abort();return '{}';},destroy(){}})};
 await assert.rejects(()=>extractAutomatically(text('RENTAL AGREEMENT'),{factory,signal:controller.signal,batchState}),e=>e.code==='AI_CANCELLED');assert.equal(prompted,1);assert.equal(batchState.aiFailure,undefined);
});
