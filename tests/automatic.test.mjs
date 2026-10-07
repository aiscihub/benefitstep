import test from 'node:test';
import assert from 'node:assert/strict';
import {extractAutomatically} from '../extension/shared/browser/automatic.mjs';
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
test('Ready local AI is automatically invoked and cleaned up; it adds to labelled details without replacing them',async()=>{
 let destroyed=0;const factory={availability:async()=>'available',create:async()=>({prompt:async()=>JSON.stringify({kind:'rent',fields:[{key:'rent_amount',value:'1450.00',page:1,quote:'Monthly rent: 1400.00'},{key:'person',value:'Demo Adult A',page:1,quote:'Resident of record Demo Adult A'}],warnings:[]}),destroy:()=>destroyed++})};
 const r=await extractAutomatically(text('RENTAL AGREEMENT\nResident of record Demo Adult A\nMonthly rent: 1400.00'),{factory});assert.equal(r.method,'Local text reader + on-device AI');assert.equal(destroyed,1);assert.ok(r.fields.every(f=>!f.confirmed));
 assert.deepEqual(r.fields.map(f=>[f.key,f.value,f.method]),[['rent_amount','1400.00','label-baseline'],['person','Demo Adult A','native-ai']]);assert.ok(!r.warnings.some(w=>/rent_amount/.test(w)));
});
test('A fully labelled document is not sent to the model',async()=>{
 let created=0;const factory={availability:async()=>'available',create:async()=>{created++;throw Error('not expected');}};
 const r=await extractAutomatically(text('RENT RECEIPT\nTenant: Demo Adult A\nLandlord: Demo Homes\nPeriod start: 2026-09-01\nMonthly rent: 1400.00'),{factory});assert.equal(created,0);assert.match(r.method,/not AI/);assert.equal(r.fields.length,4);
});
test('The model may add who, from whom and when, but never an amount to a document the labels identified',async()=>{
 const factory={availability:async()=>'available',create:async()=>({prompt:async()=>JSON.stringify({kind:'utility',fields:[{key:'document_date',value:'09/02/2026',page:1,quote:'Billing period: 09/02/2026 – 10/01/2026'},{key:'current_charges',value:'86.20',page:1,quote:'Electric service'},{key:'issuer',value:'Demo Light and Power',page:1,quote:'Thank you for choosing Demo Light and Power'}],warnings:[]}),destroy(){}})};
 const r=await extractAutomatically(text('UTILITY STATEMENT\nCustomer: Demo Adult A\nBilling period: 09/02/2026 – 10/01/2026\nElectric service   $86.20\nGas service   $33.80\nAmount due: $120.00\nThank you for choosing Demo Light and Power'),{factory});
 assert.deepEqual(r.fields.map(f=>[f.key,f.value,f.method]),[['person','Demo Adult A','label-baseline'],['period_start','2026-09-02','label-baseline'],['period_end','2026-10-01','label-baseline'],['amount_due','120.00','label-baseline'],['issuer','Demo Light and Power','native-ai']]);
});
test('A missing amount alone does not send a document to the model',async()=>{
 let created=0;const factory={availability:async()=>'available',create:async()=>{created++;throw Error('not expected');}};
 const r=await extractAutomatically(text('UTILITY STATEMENT\nCustomer: Demo Adult A\nUtility provider: Demo Light and Power\nBilling period: 09/02/2026 – 10/01/2026\nAmount due: $120.00'),{factory});assert.equal(created,0);assert.ok(!r.fields.some(f=>f.key==='current_charges'));assert.match(r.method,/not AI/);
});
test('A file that names several document types is not handed to the model to pick one',async()=>{
 let created=0;const factory={availability:async()=>'available',create:async()=>{created++;throw Error('not expected');}};
 const r=await extractAutomatically(text('Household summary\n1. pay stub for September\n2. utility statement\n3. rent receipt'),{factory});assert.equal(created,0);assert.equal(r.kind,'unknown');assert.deepEqual(r.fields,[]);assert.ok(r.warnings.some(w=>/several document types/.test(w)));
});
test('A model that reads a different document type does not change labelled details',async()=>{
 const factory={availability:async()=>'available',create:async()=>({prompt:async()=>JSON.stringify({kind:'paystub',fields:[{key:'gross_pay',value:'1400.00',page:1,quote:'Monthly rent: 1400.00'}],warnings:[]}),destroy(){}})};
 const r=await extractAutomatically(text('RENTAL AGREEMENT\nMonthly rent: 1400.00'),{factory});assert.equal(r.kind,'rent');assert.deepEqual(r.fields.map(f=>f.key),['rent_amount']);assert.equal(r.method,'Local text reader; on-device AI asked, nothing added');assert.ok(r.warnings.some(w=>/different document type \(paystub\)/.test(w)));
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
import {splitAddress,addSecondLook,missingFromPicture,thin,mergeReadings} from '../extension/shared/browser/automatic.mjs';
const picture=[{page:1,text:'',preview:'data:image/png;base64,'}],proposed=(key,value)=>({key,value,page:1,quote:value,sourceValue:value,sourceVerified:false,provenance:'image-proposed',confirmed:false,conflict:false,method:'native-ai'});
test('an address the model gives as one line is split into street, city, state and ZIP',()=>{
 const split=splitAddress({kind:'rent',fields:[proposed('home_address','12 Example Street, Example City, ca 95000'),proposed('rent_amount','1400.00')],warnings:[]});
 assert.deepEqual(Object.fromEntries(split.fields.map(f=>[f.key,f.value])),{home_address:'12 Example Street',rent_amount:'1400.00',home_city:'Example City',home_state:'CA',home_zip:'95000'});
 const kept=splitAddress({kind:'rent',fields:[proposed('home_address','12 Example Street'),proposed('home_city','Example City')],warnings:[]});
 assert.deepEqual(kept.fields.map(f=>f.value),['12 Example Street','Example City']);
});
test('a second look at a picture adds only what the first reading lacks and the document type allows',()=>{
 const first={kind:'medical',fields:[proposed('person','Demo Elder E'),proposed('home_city','Example City'),proposed('patient_responsibility','64.20')],warnings:[]};
 assert.deepEqual(missingFromPicture(first),['home_address','home_state','home_zip','service_description']);
 const second=addSecondLook(first,{home_address:'12 Example Street',home_city:'Other City',home_state:'CA',home_zip:'95000',service_description:'Prescriptions',gross_pay:'9999.00'},picture);
 assert.deepEqual(Object.fromEntries(second.fields.map(f=>[f.key,f.value])),{person:'Demo Elder E',home_city:'Example City',patient_responsibility:'64.20',home_address:'12 Example Street',home_state:'CA',home_zip:'95000',service_description:'Prescriptions'});
 assert.equal(second.fields.at(-1).provenance,'image-proposed');
 // A rent receipt has no service description to ask about, and an unidentified picture is not asked anything.
 assert.deepEqual(missingFromPicture({kind:'rent',fields:[],warnings:[]}),['home_address','home_city','home_state','home_zip']);assert.deepEqual(missingFromPicture({kind:'unknown',fields:[],warnings:[]}),[]);
 assert.equal(addSecondLook(first,{},picture),first);
});
test('a thin picture reading is recognised, and a second reading supplies only what the first lacks',()=>{
 const name={kind:'rent',fields:[proposed('person','Demo Adult A')],warnings:[]},full={kind:'rent',fields:[proposed('person','Other Name'),proposed('rent_amount','1400.00'),proposed('period_start','2026-10-01')],warnings:[]};
 assert.equal(thin(name),true);assert.equal(thin(full),false);assert.equal(thin({kind:'unknown',fields:[],warnings:[]}),true);
 assert.equal(thin({kind:'rent',fields:[proposed('rent_amount','1400.00')],warnings:[]}),true);
 assert.deepEqual(mergeReadings(name,full).fields.map(f=>[f.key,f.value]),[['person','Demo Adult A'],['rent_amount','1400.00'],['period_start','2026-10-01']]);
 assert.equal(mergeReadings(name,{kind:'utility',fields:[proposed('amount_due','80.00')],warnings:[]}),name);
 assert.equal(mergeReadings({kind:'unknown',fields:[],warnings:[]},full),full);
});
