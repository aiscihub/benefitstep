import test from 'node:test';import assert from 'node:assert/strict';
import {initial,addDocument,confirmFacts,usable} from '../extension/src/state.mjs';
import {saveHousehold,setSourceContext,assessSource} from '../extension/src/household.mjs';
import {reconcileDoctor} from '../extension/src/doctor.mjs';
import {reviewItems} from '../extension/src/review-items.mjs';
import {validateExtraction} from '../extension/shared/core/schema.mjs';
import {emptyAnswers,prefillApplication} from '../extension/src/form-adapter.mjs';
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
