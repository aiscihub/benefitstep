import test from 'node:test';import assert from 'node:assert/strict';
import {initial,addDocument,confirmFacts,usable} from '../extension/src/state.mjs';
import {saveHousehold,setSourceContext,assessSource,householdSuggestions} from '../extension/src/household.mjs';
import {extractByLabels} from '../extension/shared/core/labels.mjs';
import {reconcileDoctor} from '../extension/src/doctor.mjs';
import {reviewItems} from '../extension/src/review-items.mjs';
import {validateExtraction} from '../extension/shared/core/schema.mjs';
import {emptyAnswers,prefillApplication,confirmApplication,adoptFact,applicationPeople,proposeNameParts,setApplicationPeople,reviseAnswer} from '../extension/src/form-adapter.mjs';
import {prepareForm} from '../extension/engine/dist/forms.js';
import fs from 'node:fs';
const profile={name:'Dainette R. Woods',home_address:'568 S 36TH ST',home_city:'San Diego',home_state:'CA',home_zip:'92113',members:'',maxAgeDays:90};
function fixture(date='2020-01-17'){
 const s=initial();saveHousehold(s,profile);
 addDocument(s,{id:'bill',hash:'abc',filename:'ut_bill2.png',pages:[{page:1,text:''}]},{kind:'utility',analysisState:'complete',fields:[{key:'current_charges',value:'22.45',page:1,quote:'Current Charges + 22.45'}],warnings:[]});
 setSourceContext(s,'bill',{person:profile.name,home_address:profile.home_address,home_city:profile.home_city,home_state:'CA',home_zip:'92113',document_date:date});return s;
}
test('sample bill is unusable for current amounts, with explicit date and reason',()=>{
 const s=fixture(),a=assessSource(s,s.docs[0],'2026-10-05');assert.equal(a.usable,false);assert.equal(a.checks.filter(c=>c.status==='clear').length,2);assert.match(a.checks.find(c=>c.code==='date').detail,/2020-01-17.*2026-10-05/);
 confirmFacts(s);assert.equal(usable(s.facts.find(f=>f.fieldKey==='current_charges')),false);assert.equal(s.snapshots[0].facts.some(f=>f.documentId==='bill'),false);
 const report=reconcileDoctor(s);assert.ok(report.findings.some(f=>f.ruleId==='HH-date'));assert.equal(reviewItems(s.facts,report.findings).filter(r=>!r.fact).length,1);
});
test('recent matching source passes, but changed name, state, address and dates stop it',()=>{
 const s=fixture('2026-10-01'),d=s.docs[0];assert.equal(assessSource(s,d,'2026-10-05').usable,true);
 for(const [field,value,code] of [['person','Other Person','person'],['home_state','WI','address'],['home_address','Different street','address'],['document_date','2026-11-01','date']]){
  const f=s.facts.find(f=>f.documentId==='bill'&&f.fieldKey===field),before=f.value;f.value=value;assert.notEqual(assessSource(s,d,'2026-10-05').checks.find(c=>c.code===code).status,'clear');f.value=before;
 }
});
test('missing dates, year-only dates and reversed periods cannot pass',()=>{
 const s=fixture(''),d=s.docs[0];assert.match(assessSource(s,d,'2026-10-05').checks.find(c=>c.code==='date').title,/missing/);
 assert.throws(()=>setSourceContext(s,'bill',{document_date:'2004'}),/valid/);
 setSourceContext(s,'bill',{person:profile.name,home_address:profile.home_address,home_state:'CA',period_start:'2026-10-04',period_end:'2026-10-01'});assert.match(assessSource(s,d,'2026-10-05').checks.find(c=>c.code==='date').title,/reversed/);
});
test('window can match a historical request; old receipts are not discarded by freshness rule',()=>{
 const s=fixture('2026-06-01'),d=s.docs[0];assert.equal(assessSource(s,d,'2026-10-05').usable,false);s.household.maxAgeDays=180;assert.equal(assessSource(s,d,'2026-10-05').usable,true);
 d.kind='application_receipt';s.facts.find(f=>f.documentId==='bill'&&f.fieldKey==='document_date').value='2020-01-17';assert.equal(assessSource(s,d,'2026-10-05').usable,true);
});
test('saving own household removes demo only, resets confirmation and preserves real sources',()=>{
 const s=fixture();s.demo=true;s.docs.push({id:'demo',demoSource:true});s.facts.push({id:'demo-fact',documentId:'demo'});s.formAnswers.cf285={demoFixture:true};s.formAnswers.ccfrm604={answers:[]};s.reviewConfirmedRevision=s.revision;
 saveHousehold(s,{...profile,name:'New Applicant'});assert.equal(s.demo,false);assert.equal(s.docs.length,1);assert.ok(!s.facts.some(f=>f.documentId==='demo'));assert.ok(!s.formAnswers.cf285);assert.ok(s.formAnswers.ccfrm604);assert.equal(s.reviewConfirmedRevision,null);
});
test('household name and address are reused only after review confirmation',()=>{
 const s=initial();saveHousehold(s,profile);const map={bindings:['name','home_address','home_city','home_state','home_zip'].map(field=>({groupId:'q1.contact',row:0,field}))},data=emptyAnswers('cf285');assert.equal(prefillApplication(data,s,map),0);confirmFacts(s);assert.equal(prefillApplication(data,s,map),5);assert.equal(data.answers.find(a=>a.field==='name').value,profile.name);
});
test('source diagnostics identify rejected field, page and expected date format; repeated identical values stay usable',()=>{
 const r=validateExtraction({kind:'utility',fields:[{key:'gross_pay',value:'100',page:1,quote:'100'},{key:'document_date',value:'2019',page:1,quote:'2019'},{key:'person',value:'Pat',page:9,quote:'Pat'},{key:'amount_due',value:'22.45',page:1,quote:'22.45'},{key:'amount_due',value:'22.45',page:1,quote:'22.45'}],warnings:[]},[{text:''}]);
 assert.match(r.warnings[0],/gross_pay.*utility/);assert.match(r.warnings[1],/YYYY-MM-DD/);assert.match(r.warnings[2],/page 9.*1 page/);assert.equal(r.fields.length,1);assert.equal(r.fields[0].conflict,false);
});
test('names and addresses on the documents are offered for the household, recipients before dependants, and nothing is applied',()=>{
 const s=initial(),add=(id,text,extra={})=>addDocument(s,{id,hash:id,filename:id+'.pdf',pages:[{page:1,text}],...extra},extractByLabels([{page:1,text}]));
 add('bill','Utility Statement\nAccount holder: Demo Adult A\nService address: 12 Example Street, Example City, CA 95000\nAmount due: $50.00');
 add('rent','Rent Receipt\nTenant: demo adult a\nProperty: 12 Example Street, Example City, CA 95000\nMonthly rent: $900.00');
 add('care','Child care invoice\nBilled to: Demo Adult A\nChild: Demo Child B (age 4)\nAmount billed: $300.00');
 add('other','PAY STATEMENT\nEmployee: Demo Adult C\nHome address: 9 Other Road, Other Town, CA 94000\nGross pay: $100.00');
 add('demo','PAY STATEMENT\nEmployee: Fictional Person\nGross pay: $100.00',{demoSource:true});
 const found=householdSuggestions(s);
 assert.deepEqual(found.names.map(n=>[n.name,n.recipient,n.files.length]),[['Demo Adult A',true,3],['Demo Adult C',true,1],['Demo Child B',false,1]]);
 assert.deepEqual(found.addresses.map(a=>[a.home_address,a.home_city,a.home_state,a.home_zip,a.files.length]),[['12 Example Street','Example City','CA','95000',2],['9 Other Road','Other Town','CA','94000',1]]);
 assert.equal(s.household.configured,false);assert.ok(!s.facts.some(f=>f.householdProfile));
});
test('a period that has started may end later in the month; a period that has not started is still a future date',()=>{
 const s=fixture('2026-10-01'),d=s.docs[0];setSourceContext(s,'bill',{person:profile.name,home_address:profile.home_address,home_city:profile.home_city,home_state:'CA',home_zip:'92113',period_start:'2026-10-01',period_end:'2026-10-31'});
 assert.equal(assessSource(s,d,'2026-10-06').checks.find(c=>c.code==='date').status,'clear');
 setSourceContext(s,'bill',{person:profile.name,home_address:profile.home_address,home_city:profile.home_city,home_state:'CA',home_zip:'92113',period_start:'2026-11-01',period_end:'2026-11-30'});
 assert.match(assessSource(s,d,'2026-10-06').checks.find(c=>c.code==='date').title,/future date/);
});
test('an application prefilled from typed household details passes the form check and fills the contact answers',()=>{
 const load=name=>JSON.parse(fs.readFileSync(new URL('../extension/forms/'+name+'/cf285.json',import.meta.url))),map=load('maps'),inventory=load('inventory');
 const s=initial();saveHousehold(s,profile);confirmFacts(s);const data=emptyAnswers('cf285');assert.equal(prefillApplication(data,s,map),5);
 adoptFact(data,s,{groupId:'q8.earned',row:0,field:'person'},s.facts.find(f=>f.fieldKey==='person').id);
 const refs=data.answers.flatMap(a=>a.sourceRefs);assert.ok(refs.length>5&&refs.every(r=>Object.values(r).every(v=>v!==undefined)&&!('documentId' in r)&&!('page' in r)));
 const plan=prepareForm(inventory,map,confirmApplication(data,s));assert.deepEqual(plan.operations.filter(o=>o.groupId==='q1.contact').map(o=>o.field),['name','home_address','home_city','home_state','home_zip']);
});
const formFiles=id=>({map:JSON.parse(fs.readFileSync(new URL('../extension/forms/maps/'+id+'.json',import.meta.url))),inventory:JSON.parse(fs.readFileSync(new URL('../extension/forms/inventory/'+id+'.json',import.meta.url)))});
// Two earners with pay statements, one child named on an invoice, one more member typed by the owner.
function twoEarners(){
 const s=initial(),add=(id,text)=>addDocument(s,{id,hash:id,filename:id+'.pdf',pages:[{page:1,text}]},{...extractByLabels([{page:1,text}]),analysisState:'complete'});
 add('pay-a','Northgate Works\nPay Statement\nEmployee: Demo Adult A\nAddress: 12 Example Street, Example City, CA 95000\nPay period: 09/01/2026 – 09/30/2026\nPay date: 09/30/2026\nGross pay   $4,850.00');
 add('pay-b','Harborside Depot\nPay Statement\nEmployee: Demo Adult B\nAddress: 12 Example Street, Example City, CA 95000\nPay period: 09/01/2026 – 09/30/2026\nPay date: 09/30/2026\nPay frequency: Monthly\nGross pay   $2,200.00');
 add('care','Child care invoice\nBilled to: Demo Adult A\nChild: Demo Child C (age 4)\nTotal paid   $1,400.00');
 saveHousehold(s,{name:'Demo Adult A',home_address:'12 Example Street',home_city:'Example City',home_state:'CA',home_zip:'95000',members:'Demo Adult B\nDemo Child D',maxAgeDays:90});confirmFacts(s);return s;
}
const answered=(data,groupId)=>Object.fromEntries(data.answers.filter(a=>a.groupId===groupId&&a.status==='answered').map(a=>[a.row+'.'+a.field,a.value]));
test('name parts are proposed plainly: one middle name, a suffix, and anything longer kept together as the last name',()=>{
 assert.deepEqual(proposeNameParts('Shirley M. Earley'),{first_name:'Shirley',middle_name:'M.',last_name:'Earley',suffix:''});
 assert.deepEqual(proposeNameParts('Daniel Earley'),{first_name:'Daniel',middle_name:'',last_name:'Earley',suffix:''});
 assert.deepEqual(proposeNameParts('Maria de la Cruz'),{first_name:'Maria',middle_name:'',last_name:'de la Cruz',suffix:''});
 assert.deepEqual(proposeNameParts('John Q Public Jr.'),{first_name:'John',middle_name:'Q',last_name:'Public',suffix:'Jr.'});
 assert.deepEqual(proposeNameParts('Cher'),{first_name:'Cher',middle_name:'',last_name:'',suffix:''});
});
test('people offered for an application come from the household list first, then from names on documents',()=>{
 assert.deepEqual(applicationPeople(twoEarners()).map(p=>[p.name,p.origin]),[['Demo Adult A','you'],['Demo Adult B','household'],['Demo Child D','household'],['Demo Child C','document']]);
 assert.deepEqual(applicationPeople(initial()),[]);
});
test('nobody is put on an application until the owner chooses; the CalFresh roster then lists each chosen person',()=>{
 const s=twoEarners(),{map,inventory}=formFiles('cf285'),data=emptyAnswers('cf285');prefillApplication(data,s,map);
 assert.deepEqual(answered(data,'q6a.people'),{});assert.equal(answered(data,'q8.earned')['1.person'],'Demo Adult B');
 setApplicationPeople(data,s,map,['Demo Adult B','Demo Adult A','Demo Child C']);
 assert.deepEqual(answered(data,'q6a.people'),{'0.name':'Demo Adult A','1.name':'Demo Adult B','2.name':'Demo Child C'});
 assert.ok(prepareForm(inventory,map,confirmApplication(data,s)).operations.filter(o=>o.groupId==='q6a.people').length>=3);
});
test('the Medi-Cal form gets each chosen person with a proposed name split, the household address and their income record',()=>{
 const s=twoEarners(),{map,inventory}=formFiles('ccfrm604'),data=emptyAnswers('ccfrm604');prefillApplication(data,s,map);
 assert.deepEqual(answered(data,'p2.identity'),{});assert.deepEqual(answered(data,'p7.income'),{'0.income_name':'Northgate Works','1.income_name':'Harborside Depot','1.frequency':'Monthly','1.amount':'2200.00'});
 setApplicationPeople(data,s,map,['Demo Adult A','Demo Adult B']);
 assert.deepEqual(answered(data,'p1.contact'),{'0.first_name':'Demo','0.middle_name':'Adult','0.last_name':'A'});
 assert.deepEqual(answered(data,'p2.identity'),{'0.first_name':'Demo','0.middle_name':'Adult','0.last_name':'A','1.first_name':'Demo','1.middle_name':'Adult','1.last_name':'B'});
 assert.deepEqual(answered(data,'p2.address'),{'0.home_address':'12 Example Street','0.city':'Example City','0.state':'CA','0.zip':'95000','1.home_address':'12 Example Street','1.city':'Example City','1.state':'CA','1.zip':'95000'});
 assert.equal(answered(data,'p7.income')['1.person_last'],'B');assert.equal(answered(data,'p7.income')['0.person_last'],'A');
 const plan=prepareForm(inventory,map,confirmApplication(data,s));assert.ok(plan.operations.length>=20);
});
test('a name the owner typed is kept, and removing a person clears only what the choice had filled',()=>{
 const s=twoEarners(),{map}=formFiles('ccfrm604'),data=emptyAnswers('ccfrm604');
 setApplicationPeople(data,s,map,['Demo Adult A','Demo Adult B']);
 reviseAnswer(data,{groupId:'p2.identity',row:1,field:'middle_name',status:'answered',value:'Typed',sourceIds:['owner-entry']});
 setApplicationPeople(data,s,map,['Demo Adult A']);
 assert.deepEqual(answered(data,'p2.identity'),{'0.first_name':'Demo','0.middle_name':'Adult','0.last_name':'A','1.middle_name':'Typed'});
 assert.deepEqual(Object.keys(answered(data,'p2.address')).filter(k=>k.startsWith('1.')),[]);assert.deepEqual(data.people,['Demo Adult A']);
 assert.equal(setApplicationPeople(data,s,map,['Demo Adult A','Demo Adult B','Demo Child C','Demo Child D','Someone Else']).length,4);
});
