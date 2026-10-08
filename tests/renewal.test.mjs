import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';
import {PDFDocument,PDFName} from '../extension/vendor/pdf-writer/pdf-lib.mjs';
import {initial,addDocument,confirmFacts,transferSnapshot} from '../extension/src/state.mjs';
import {saveHousehold} from '../extension/src/household.mjs';
import {extractByLabels} from '../extension/shared/core/labels.mjs';
import {emptyAnswers,prefillApplication,confirmApplication,filledSummary,remainingSummary,documentUse,listsPeople,reviseAnswer} from '../extension/src/form-adapter.mjs';
import {renderOfficialForm,formPlan} from '../extension/src/form-renderer.mjs';
import {prepareForm} from '../extension/engine/dist/forms.js';
import {packageRecord,readRecord,readPackage,RECORD_VERSION} from '../extension/src/record.mjs';
import {picture,pictureNow,compare,renewalChanges,lateLimit,datedSpan,monthName,RENEWAL_FORMS,OTHER_PAPERS,chosenForm} from '../extension/src/renewal.mjs';
import {zipStore,unzipEntry,crc32} from '../extension/shared/core/zip.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p.startsWith('inspection/')?'./form-inspection/'+p.slice('inspection/'.length):'../extension/forms/'+p,import.meta.url)));
const assets={inventory:read('inventory/cf37.json'),map:read('maps/cf37.json'),template:new Uint8Array(fs.readFileSync(new URL('../extension/forms/templates/cf37.pdf',import.meta.url))),fontBytes:new Uint8Array(fs.readFileSync(new URL('../extension/vendor/pdf-writer/NotoSans-Regular.ttf',import.meta.url)))};
const answered=(data,groupId)=>Object.fromEntries(data.answers.filter(a=>a.groupId===groupId&&a.status==='answered').map(a=>[a.row+'.'+a.field,a.value]));
const HOME='12 Example Street, Example City, CA 95000';
// A fictional household at two moments, in the layout of the demo statements. All names and amounts are invented.
const list=people=>'Household summary\nHousehold members\n'+people.map((p,i)=>(i+1)+'. '+p).join('\n')+'\nMailing address: PO Box 12, Example City, CA 95001\nPapers in this packet:\n1. Statements.';
const A='Demo Adult A, 35 (F)   Head of household. DOB 03/14/1991.',B='Demo Adult B, 37 (M)   Spouse. DOB 07/22/1989.',D='Demo Child D, 8 (F)   Daughter. DOB 05/03/2018.',C='Demo Child C, 4 (M)   Son. DOB 11/19/2021.',E='Demo Elder E, 68 (F)   Mother. DOB 02/09/1958.';
const pay=(firm,who,period,amount)=>firm+'\nPay Statement\nEmployee: '+who+'\nAddress: '+HOME+'\nPay period: '+period+'\nPay date: '+period.slice(-10)+'\nPay frequency: Monthly\nGross pay   $'+amount;
const rent=(month,amount)=>'Elm Property Management\nRent Receipt\nTenant: Demo Adult A\nProperty: '+HOME+'\nRental period: '+month+'\nMonthly rent   $'+amount+'\nTotal paid   $'+amount;
const power=period=>'Example Light & Power\nResidential Utility Statement\nAccount holder: Demo Adult A\nService address: '+HOME+'\nBilling period: '+period+'\nElectric service (612 kWh)   $186.20\nGas service (38 therms)   $74.15\nAmount due   $298.47';
const care=(firm,child,month,amount)=>firm+'\nChild care invoice\nBilled to: Demo Adult A — '+HOME+'\nChild: '+child+'\nBilling period: '+month+'\nTotal paid   $'+amount;
const award=(fund,who,date,often,amount)=>fund+'\nBenefit Award Letter\nRecipient: '+who+'\nAddress: '+HOME+'\nDocument date: '+date+'\nPay frequency: '+often+'\nAward amount   $'+amount;
const BEFORE={list:list([A,B,D,C]),payA:pay('Northgate Works','Demo Adult A','03/01/2026 – 03/31/2026','4,850.00'),rent:rent('April 2026','2,350.00'),power:power('03/02/2026 – 04/01/2026'),care:care('Little Example Daycare','Demo Child C (DOB 11/19/2021, age 4)','March 2026','1,400.00'),jobless:award('Example Unemployment Office','Demo Adult B','03/20/2026','Biweekly','600.00')};
const NOW={list:list([A,B,D,C,E]),payA:pay('Northgate Works','Demo Adult A','09/01/2026 – 09/30/2026','4,850.00'),payB:pay('Harborside Depot','Demo Adult B','09/01/2026 – 09/30/2026','2,200.00'),rent:rent('October 2026','2,500.00'),power:power('09/02/2026 – 10/01/2026'),care:care('Little Example Daycare','Demo Child C (DOB 11/19/2021, age 4)','September 2026','1,400.00'),club:care('Example After-School Club','Demo Child D (DOB 05/03/2018, age 8)','September 2026','320.00'),
 pension:award('Example Pension Fund','Demo Elder E','09/15/2026','Monthly','1,180.00'),pharmacy:'Example Community Pharmacy\nPatient Billing Statement\nCustomer: Demo Elder E\nAddress: '+HOME+'\nBilling period: September 2026\nService description: Prescriptions\nPatient responsibility   $64.20'};
function household(texts,members,{home={home_address:'12 Example Street',home_city:'Example City',home_state:'CA',home_zip:'95000'}}={}){
 const s=initial();
 for(const [id,text] of Object.entries(texts)){const pages=[{page:1,text}];addDocument(s,{id,hash:id,filename:id+'.pdf',pages},{...extractByLabels(pages),analysisState:'complete'});}
 saveHousehold(s,{name:'Demo Adult A',...home,members:members.join('\n'),maxAgeDays:3650});confirmFacts(s);return s;
}
const earlier=()=>household(BEFORE,['Demo Adult B','Demo Child D','Demo Child C']);
const later=()=>household(NOW,['Demo Adult B','Demo Child D','Demo Child C','Demo Elder E']);
const packaged=s=>zipStore([{name:'preparation.json',data:JSON.stringify(packageRecord(s,transferSnapshot(s)))},{name:'preparation-summary.html',data:'<p>summary</p>'}]);
async function renewing(){const s=later();s.renewal={on:true,form:'cf37',previous:await readPackage(packaged(earlier())),notice:{caseName:'Demo Adult A',caseNumber:'1B2C3D4',periodEnd:'2026-10-31'}};return s;}
const filled=s=>{const data=emptyAnswers('cf37');prefillApplication(data,s,assets.map);return data;};

test('a package record carries its version, the listed people and the kind of each document, and reads back as checked data',async()=>{
 const s=earlier(),record=packageRecord(s,transferSnapshot(s));
 assert.equal(record.recordVersion,RECORD_VERSION);assert.equal(record.purpose,'application');
 assert.deepEqual(record.people.map(p=>[p.name,p.date_of_birth,p.relationship]),[['Demo Adult A','1991-03-14','Head of household'],['Demo Adult B','1989-07-22','Spouse'],['Demo Child D','2018-05-03','Daughter'],['Demo Child C','2021-11-19','Son']]);
 assert.deepEqual(record.documents.map(d=>d.kind).sort(),['childcare','income_award','paystub','rent','utility']);
 assert.deepEqual(record.documents.find(d=>d.kind==='childcare').dependants,['Demo Child C']);
 const back=await readPackage(zipStore([{name:'preparation.json',data:JSON.stringify(record)}]));
 assert.deepEqual(back.household,{name:'Demo Adult A',home_address:'12 Example Street',home_city:'Example City',home_state:'CA',home_zip:'95000',members:['Demo Adult B','Demo Child D','Demo Child C']});
 assert.equal(back.facts.find(f=>f.fieldKey==='rent_amount').value,'2350.00');assert.equal(back.people.length,4);
 // The record alone, without the ZIP around it, reads the same.
 assert.deepEqual(await readPackage(new TextEncoder().encode(JSON.stringify(record))),back);
});
test('a file that is not a package record is refused, and unknown content in a record is dropped',async()=>{
 await assert.rejects(readPackage(new TextEncoder().encode('{"facts":[]}')),/not a BenefitStep package record/);
 await assert.rejects(readPackage(new TextEncoder().encode('not json')),/not a BenefitStep package record/);
 await assert.rejects(readPackage(zipStore([{name:'other.txt',data:'x'}])),/no preparation\.json/);
 assert.throws(()=>readRecord({type:'LOCAL_PREPARATION_NOT_SUBMITTED',facts:[],recordVersion:99}),/newer version/);
 const r=readRecord({type:'LOCAL_PREPARATION_NOT_SUBMITTED',generatedAt:'2026-04-02T10:00:00Z',household:{name:'Demo Adult A\u0000<b>',members:['x'.repeat(900),7,{}],extra:'no'},facts:[{fieldKey:'gross_pay',value:1200,documentId:'d1',script:'<script>'},{fieldKey:'not_a_field',value:'x'},null],surprise:{a:1}});
 assert.equal(r.household.name,'Demo Adult A <b>');assert.equal(r.household.members[0].length,240);assert.equal(r.household.members.length,2);
 assert.deepEqual(r.facts,[{fieldKey:'gross_pay',value:'1200',person:'',period:'',group:'',documentId:'d1'}]);assert.equal('surprise' in r,false);
 // A package saved before records listed their documents: the kind is told from the details.
 assert.deepEqual(r.documents,[{id:'d1',filename:'',kind:'paystub',period:'',dependants:[]}]);assert.equal(r.recordVersion,0);
});
test('a file is read out of a ZIP whether it was stored or deflated, and from inside a folder',async()=>{
 const stored=zipStore([{name:'a.txt',data:'first'},{name:'preparation.json',data:'{"x":1}'}]);
 assert.equal(new TextDecoder().decode(await unzipEntry(stored,'preparation.json')),'{"x":1}');assert.equal(await unzipEntry(stored,'missing.json'),null);
 const name=Buffer.from('saved/preparation.json'),plain=Buffer.from('{"deflated":true}'.repeat(20)),packed=zlib.deflateRawSync(plain),head=(sig,extra)=>{const b=Buffer.alloc(extra);b.writeUInt32LE(sig,0);return b;};
 const local=head(0x04034b50,30);local.writeUInt16LE(8,8);local.writeUInt32LE(crc32(plain),14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(plain.length,22);local.writeUInt16LE(name.length,26);
 const central=head(0x02014b50,46);central.writeUInt16LE(8,10);central.writeUInt32LE(crc32(plain),16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(plain.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(0,42);
 const end=head(0x06054b50,22);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(46+name.length,12);end.writeUInt32LE(30+name.length+packed.length,16);
 const zip=new Uint8Array(Buffer.concat([local,name,packed,central,name,end]));
 assert.equal(new TextDecoder().decode(await unzipEntry(zip,'preparation.json')),plain.toString());
 await assert.rejects(unzipEntry(new Uint8Array(40),'x'),/Not a ZIP/);
});
test('the comparison names what is new, changed, gone and the same, and says nothing about people or address before the household is entered',async()=>{
 const s=await renewing(),items=renewalChanges(s),status=Object.fromEntries(items.map(i=>[i.topic+': '+i.label,i.status]));
 assert.deepEqual(status,{'housing: Demo Adult A — Elm Property Management':'changed','people: Demo Elder E':'new','jobs: Demo Adult B — Harborside Depot':'new','awards: Demo Elder E — Example Pension Fund':'new','care: Demo Child D — Example After-School Club':'new','medical: Demo Elder E — Example Community Pharmacy':'new',
  'awards: Demo Adult B — Example Unemployment Office':'gone','address: Home address':'same','people: Demo Adult A':'same','people: Demo Adult B':'same','people: Demo Child D':'same','people: Demo Child C':'same','jobs: Demo Adult A — Northgate Works':'same','utilities: Example Light & Power':'same','care: Demo Child C — Little Example Daycare':'same'});
 const rentLine=items.find(i=>i.topic==='housing');assert.deepEqual([rentLine.before,rentLine.now],['$2350.00','$2500.00']);
 assert.deepEqual(items.map(i=>i.status),[...items.map(i=>i.status)].sort((a,b)=>['changed','new','gone','same'].indexOf(a)-['changed','new','gone','same'].indexOf(b)));
 const blank=compare(picture(s.renewal.previous),picture({}));assert.equal(blank.some(i=>i.topic==='people'||i.topic==='address'),false);assert.equal(blank.every(i=>i.status==='gone'),true);
 s.renewal.on=false;assert.equal(renewalChanges(s),null);
 const moved=compare(picture(s.renewal.previous),{...pictureNow(s),address:'34 Sample Avenue, Example City, CA 95001'}).find(i=>i.topic==='address');assert.equal(moved.status,'changed');
 // Review compares before anything is confirmed; a form counts confirmed details only.
 const open=await renewing();for(const f of open.facts)f.confirmedRevision=null;
 assert.deepEqual(renewalChanges(open).map(i=>[i.label,i.status]),items.map(i=>[i.label,i.status]));assert.equal(renewalChanges(open,true).filter(i=>i.topic==='jobs').every(i=>i.status==='gone'),true);
 assert.deepEqual(datedSpan(s.renewal.previous),{from:'2026-03-01',to:'2026-04-30'});assert.equal(datedSpan({facts:[]}),null);
 assert.equal(lateLimit('2026-10-31'),'2026-11-30');assert.equal(lateLimit(''),'');assert.equal(lateLimit('10/31/2026'),'');
});
test('the recertification form is filled from current documents, and its change questions only from a difference with the previous package',async()=>{
 const s=await renewing(),data=filled(s);
 assert.deepEqual(answered(data,'case'),{'0.case_name':'Demo Adult A','0.case_number':'1B2C3D4'});
 assert.deepEqual(answered(data,'mailing'),{'0.mailing_address':'PO Box 12','0.mailing_city':'Example City','0.mailing_state':'CA','0.mailing_zip':'95001'});
 assert.deepEqual(answered(data,'q7.earned'),{'0.has_income':true,'0.person':'Demo Adult A','0.employer':'Northgate Works','0.frequency':'Monthly','0.monthly_gross':'4850.00','1.person':'Demo Adult B','1.employer':'Harborside Depot','1.frequency':'Monthly','1.monthly_gross':'2200.00'});
 assert.deepEqual(answered(data,'q8.unearned'),{'0.has_income':true,'0.person':'Demo Elder E','0.source':'Example Pension Fund','0.one_time_or_ongoing':'Ongoing','0.amount_and_frequency':'$1180.00 monthly'});
 // Two care invoices: both children are named, and the two amounts are left for the owner.
 assert.deepEqual(answered(data,'q11.care'),{'0.pays_care':true,'0.payer':'Demo Adult A','0.dependent':'Demo Child C, Demo Child D'});
 assert.deepEqual(answered(data,'q4a.utilities'),{'0.electric_gas':true});
 assert.deepEqual(answered(data,'q1.household_changes'),{'0.has_change':true,'0.direction':'In','0.name':'Demo Elder E','0.date_of_birth':'020958','0.relationship':'Mother'});
 assert.deepEqual(answered(data,'q4.housing_costs'),{'0.rent_or_mortgage':'2500.00'});
 assert.deepEqual(answered(data,'q9.medical'),{'0.has_change':true,'0.person':'Demo Elder E','0.cost_type':'Prescriptions','0.amount':'64.20','0.frequency':'monthly'});
 assert.deepEqual(answered(data,'q3.address_change'),{});
 // Nothing is answered No, and the questions only the owner can answer stay open.
 assert.equal(data.answers.some(a=>a.value===false),false);
 for(const group of ['q5.homeless','q6.students','q7a.changes','q8a.changes','q10.child_support','q12.medi_cal'])assert.deepEqual(answered(data,group),{});
 assert.equal(listsPeople('cf37'),false);
 assert.deepEqual(documentUse(data,s).filter(d=>!d.groups.length).map(d=>d.file),['list.pdf']);
});
test('without a previous package the change questions stay empty, and the current answers are still filled',()=>{
 const s=later();s.renewal={on:true,form:'cf37',previous:null,notice:{caseName:'',caseNumber:'',periodEnd:''}};const data=filled(s);
 for(const group of ['case','q1.household_changes','q3.address_change','q4.housing_costs','q9.medical'])assert.deepEqual(answered(data,group),{});
 assert.equal(answered(data,'q7.earned')['1.employer'],'Harborside Depot');assert.equal(answered(data,'q8.unearned')['0.person'],'Demo Elder E');assert.equal(answered(data,'q11.care')['0.pays_care'],true);
});
test('a person who left is listed as moved out with the birth date the previous package held, and a lower medical cost is not reported',async()=>{
 const s=await renewing();s.household.members=s.household.members.filter(n=>n!=='Demo Adult B');s.revision++;confirmFacts(s);
 s.renewal.previous.facts.push({fieldKey:'person',value:'Demo Elder E',documentId:'old-rx',person:'',period:'',group:''},{fieldKey:'issuer',value:'Example Community Pharmacy',documentId:'old-rx',person:'',period:'',group:''},{fieldKey:'patient_responsibility',value:'90.00',documentId:'old-rx',person:'',period:'',group:''});
 s.renewal.previous.documents.push({id:'old-rx',filename:'rx.pdf',kind:'medical',period:'2026-03',dependants:[]});
 const data=filled(s),moves=answered(data,'q1.household_changes');
 assert.deepEqual([moves['0.direction'],moves['0.name'],moves['1.direction'],moves['1.name'],moves['1.date_of_birth'],moves['1.relationship']],['In','Demo Elder E','Out','Demo Adult B','072289','Spouse']);
 assert.deepEqual(answered(data,'q9.medical'),{});
});
test('the recertification answers are written into the original CF 37, each tick in its own box, and nothing protected is touched',async()=>{
 const s=await renewing(),data=filled(s),plan=prepareForm(assets.inventory,assets.map,confirmApplication(data,s));
 assert.equal(plan.manualActions.length,4);
 const result=await renderOfficialForm({...assets,answers:confirmApplication(data,s),mode:'draft'});
 assert.equal(result.report.pageCount,11);assert.equal(result.report.signatureApplied,false);assert.equal(result.report.independentlyValidated,false);
 const form=(await PDFDocument.load(result.bytes)).getForm(),text=name=>form.getTextField(name).getText(),ticked=name=>form.getCheckBox(name).isChecked();
 assert.deepEqual([text('case_name'),text('case_number'),text('mailing_street'),text('mailing_zip')],['Demo Adult A','1B2C3D4','PO Box 12','95001']);
 assert.deepEqual([ticked('question1-1'),ticked('question1-2'),ticked('question1-1-1-1'),ticked('question1-1-1-2'),text('question1-1-3'),text('question1-1-4'),text('question1-1-5')],[true,false,true,false,'Demo Elder E','020958','Mother']);
 assert.deepEqual([text('question4_rent'),ticked('question4a_4'),ticked('question4a_1')],['2500.00',true,false]);
 assert.deepEqual([ticked('question7-1'),text('question7-1-1'),text('question7-1-2'),ticked('question7-1-4-3'),ticked('question7-1-4-1'),text('question7-1-5'),text('question7-1-8'),text('question7-1-9'),ticked('question7-1-11-3'),text('question7-1-12')],[true,'Demo Adult A','Northgate Works',true,false,'4850.00','Demo Adult B','Harborside Depot',true,'2200.00']);
 assert.deepEqual([ticked('question8-1'),text('question8-1-1'),text('question8-1-2'),text('question8-1-3'),text('question8-1-4')],[true,'Demo Elder E','Example Pension Fund','Ongoing','$1180.00 monthly']);
 assert.deepEqual([ticked('question9-1'),text('question9-1-1'),text('question9-1-2'),text('question9-1-3'),text('question9-1-4')],[true,'Demo Elder E','Prescriptions','64.20','monthly']);
 assert.deepEqual([ticked('question11-1'),text('question11-1-2'),text('question11-1-3'),text('question11-1-1')],[true,'Demo Adult A','Demo Child C, Demo Child D',undefined]);
 // The form hides its detail boxes until its own script sees a Yes. A box the app filled is shown and set to print; a box it left alone stays as it was.
 const hidden=name=>((form.getField(name).acroField.getWidgets()[0].dict.get(PDFName.of('F'))?.asNumber()??0)&2)===2;
 for(const name of ['question1-1-3','question1-1-1-1','question7-1-1','question7-1-4-3','question8-1-1','question9-1-3','question11-1-3'])assert.equal(hidden(name),false,name);
 for(const name of ['question1-1-9','question7-1-15','question2-1-1','question13-1-1','question11-1-1'])assert.equal(hidden(name),true,name);
 const untouched=structuredClone(assets.map);delete untouched.bindings.find(b=>b.widget==='question1-1-3').hiddenUntilAnswered;
 await assert.rejects(renderOfficialForm({...assets,map:untouched,answers:confirmApplication(data,s),mode:'draft'}),/visibility differs/);
 // Signature date, contact authorization, representative and conviction questions are left as the form came.
 for(const name of ['signed_date','contact_phone_home','contact_email','question2-1-1','question13-1-1'])assert.equal(text(name),undefined);
 for(const name of ['question2-1','question13-1','question13-2','question18-1','question12-1','question5-1'])assert.equal(ticked(name),false);
 const summary=filledSummary(confirmApplication(data,s),s,assets.inventory,assets.map,new Set(result.report.written.map(w=>w.groupId+'|'+w.row+'|'+w.field)));
 assert.equal(summary.boxes,result.report.written.length);assert.deepEqual(summary.pages,[8,9,10]);assert.equal(summary.unplaced.length,0);
 // A name too long for its printed box is reported with its value and never cut or shrunk.
 const long=await renewing();long.facts.find(f=>f.fieldKey==='issuer'&&f.value==='Example Pension Fund').value='Example Valley Retirees Pension Fund';
 const wide=filled(long),drawn=await renderOfficialForm({...assets,answers:confirmApplication(wide,long),mode:'draft'});
 assert.deepEqual(drawn.report.missing.filter(m=>m.reason==='text_overflow').map(m=>[m.field,m.value]),[['source','Example Valley Retirees Pension Fund']]);
 assert.equal((await PDFDocument.load(drawn.bytes)).getForm().getTextField('question8-1-2').getText(),undefined);
});
// The periodic report, SAR 7. The app fills the blank edition, SAR 7B, for one report month.
const sar={inventory:read('inventory/sar7b.json'),map:read('maps/sar7b.json'),template:new Uint8Array(fs.readFileSync(new URL('../extension/forms/templates/sar7b.pdf',import.meta.url))),fontBytes:assets.fontBytes};
const NOTICE={caseName:'Demo Adult A',caseNumber:'1B2C3D4',periodEnd:'',reportMonth:'2026-09',submitMonth:'2026-10'};
async function reporting(notice=NOTICE,from=later){const s=from();s.renewal={on:true,form:'sar7b',previous:await readPackage(packaged(earlier())),notice:{...notice}};return s;}
const reported=s=>{const data=emptyAnswers('sar7b');prefillApplication(data,s,sar.map);return data;};
test('the periodic report is offered beside the recertification, each with the notice details its first page asks for',()=>{
 assert.deepEqual(RENEWAL_FORMS.filter(f=>f.ready).map(f=>[f.id,f.program,f.notice]),[['sar7b','CalFresh',['caseName','caseNumber','reportMonth','submitMonth']],['cf37','CalFresh',['caseName','caseNumber','periodEnd']]]);
 assert.deepEqual([monthName('2026-09'),monthName('2026-13'),monthName('September'),monthName('')],['September 2026','','','']);
 assert.equal(initial().renewal.notice.reportMonth,'');
});
test('no renewal form is chosen for the owner, and each form names the codes on the papers that point to it',()=>{
 const s=initial();assert.equal(s.renewal.form,'');assert.equal(chosenForm(s),null);
 // A form that is not available yet, or an unknown id, is not a choice either.
 for(const id of ['mc216','cf285','nothing'])assert.equal(chosenForm({renewal:{form:id}}),null,id);
 assert.deepEqual(['sar7b','cf37'].map(id=>chosenForm({renewal:{form:id}}).code),['SAR 7','CF 37']);
 const codes=f=>f.papers.map(paper=>paper.split(' (')[0]);
 assert.deepEqual(RENEWAL_FORMS.map(f=>[f.code,codes(f)]),[['SAR 7',['SAR 7','SAR 7B','CF 30']],['CF 37',['CF 37','CF 377.2']],['MC 216',['MC 216']]]);
 // Every form says when it is used and carries its own code; a form that can be filled says what to know first.
 for(const f of RENEWAL_FORMS){assert(f.name&&f.when,f.id);assert(codes(f).includes(f.code),f.id);assert.equal(f.cautions.length>0,f.ready,f.id);}
 // No code points to two forms, and a request for proof points to none.
 const all=RENEWAL_FORMS.flatMap(codes),other=OTHER_PAPERS.flatMap(codes);
 assert.equal(new Set(all).size,all.length);assert.deepEqual(other,['CF 377.6','CW 2200']);assert.equal(other.some(code=>all.includes(code)),false);
});
test('the periodic report is filled for its report month: what the household has from current documents, what changed only from the previous package',async()=>{
 const s=await reporting(),data=reported(s);
 assert.deepEqual(answered(data,'sar.header'),{'0.household_name':'Demo Adult A','0.street':'12 Example Street','0.city':'Example City','0.zip':'95000','0.case_name':'Demo Adult A','0.case_number':'1B2C3D4','0.report_month':'September 2026','0.submit_month':'October 2026'});
 assert.deepEqual(answered(data,'sar.home'),{'0.street':'12 Example Street','0.city_state_zip':'Example City, CA 95000'});
 assert.deepEqual(answered(data,'sar.mailing'),{'0.street':'PO Box 12','0.city_state_zip':'Example City, CA 95001'});
 assert.deepEqual(answered(data,'sar.members'),{'0.has_change':true,'0.name':'Demo Elder E','0.date_of_birth':'02/09/1958','0.relationship':'Mother','0.change':'Moved In'});
 // Jobs first, then other income, in one table. The new job of a person who was already in the household is marked as started; the pension of the person who moved in is not.
 assert.deepEqual(answered(data,'sar.income'),{'0.has_income':true,
  '0.person':'Demo Adult A','0.source':'From a job','0.employer':'Northgate Works','0.frequency':'Monthly','0.received_in_report_month':true,'0.gross_in_report_month':'4850.00','0.dates_received':'09/30/2026',
  '1.person':'Demo Adult B','1.source':'From a job','1.employer':'Harborside Depot','1.frequency':'Monthly','1.received_in_report_month':true,'1.gross_in_report_month':'2200.00','1.dates_received':'09/30/2026','1.started':true,
  '2.person':'Demo Elder E','2.source':'Not from a job','2.income_type':'Example Pension Fund','2.frequency':'Monthly','2.received_in_report_month':true,'2.gross_in_report_month':'1180.00'});
 assert.deepEqual(answered(data,'sar.expenses'),{'0.expenses_changed':true,'0.rent_or_mortgage':'2500.00'});
 assert.deepEqual(answered(data,'sar.utilities'),{'0.electric_gas':true});
 assert.deepEqual(answered(data,'sar.care'),{'0.payer':'Demo Adult A','0.dependents':'Demo Child C, Demo Child D'});
 assert.deepEqual(answered(data,'sar.medical'),{'0.payer':'Demo Elder E','0.amount':'64.20'});
 // Nothing is answered No, income is never marked as stopped, and what only the owner knows stays open.
 assert.equal(data.answers.some(a=>a.value===false),false);assert.equal(data.answers.some(a=>a.field==='stopped'&&a.status==='answered'),false);
 for(const group of ['sar.contact','sar.strike','sar.resources','sar.child_support','sar.gambling'])assert.deepEqual(answered(data,group),{});
 // A box that does not apply to a record is marked, so it is not counted as open: no type of income for a job, no employer or hours for a pension.
 assert.deepEqual(data.answers.filter(a=>a.status==='not_applicable').map(a=>a.row+'.'+a.field).sort(),['0.income_type','1.income_type','2.employer','2.employer_more','2.hours_month']);
 // Filling again changes nothing.
 const revision=data.revision;assert.equal(prefillApplication(data,s,sar.map),0);assert.equal(data.revision,revision);
 assert.deepEqual(documentUse(data,s).filter(d=>!d.groups.length).map(d=>[d.file,d.note]),[['list.pdf','It lists household members. This form asks only who moved in or out.']]);
});
test('without a report month no amount is filled, and without a previous package no change is',async()=>{
 const blank=await reporting({...NOTICE,reportMonth:'',submitMonth:''}),a=reported(blank),income=answered(a,'sar.income');
 assert.deepEqual([income['0.employer'],income['0.frequency'],income['2.income_type'],income['1.started']],['Northgate Works','Monthly','Example Pension Fund',true]);
 for(const field of ['received_in_report_month','gross_in_report_month','dates_received'])assert.equal(a.answers.some(x=>x.field===field&&x.status==='answered'),false,field);
 assert.deepEqual([answered(a,'sar.header')['0.report_month'],answered(a,'sar.medical')['0.amount'],answered(a,'sar.medical')['0.payer']],[undefined,undefined,'Demo Elder E']);
 // Another month than the documents carry: the sources are listed, and their amounts are left for the owner.
 const other=reported(await reporting({...NOTICE,reportMonth:'2026-08'}));
 assert.deepEqual([answered(other,'sar.income')['0.person'],answered(other,'sar.income')['0.gross_in_report_month'],answered(other,'sar.income')['2.gross_in_report_month'],answered(other,'sar.income')['0.received_in_report_month']],['Demo Adult A',undefined,undefined,undefined]);
 // Correcting the report month after the form was filled takes the amounts of the other month back out and keeps what the owner typed.
 const fixed=await reporting(),c=reported(fixed);reviseAnswer(c,{groupId:'sar.income',row:0,field:'hours_month',status:'answered',value:'160',sourceIds:['owner-entry']});
 fixed.renewal.notice.reportMonth='2026-08';prefillApplication(c,fixed,sar.map);
 assert.deepEqual([answered(c,'sar.header')['0.report_month'],answered(c,'sar.income')['0.gross_in_report_month'],answered(c,'sar.income')['0.received_in_report_month'],answered(c,'sar.income')['2.gross_in_report_month'],answered(c,'sar.income')['0.dates_received'],answered(c,'sar.medical')['0.amount'],answered(c,'sar.income')['0.hours_month'],answered(c,'sar.income')['0.employer']],['August 2026',undefined,undefined,undefined,undefined,undefined,'160','Northgate Works']);
 const alone=later();alone.renewal={on:true,form:'sar7b',previous:null,notice:{...NOTICE}};const b=reported(alone);
 for(const group of ['sar.members','sar.medical'])assert.deepEqual(answered(b,group),{});
 assert.deepEqual(answered(b,'sar.expenses'),{'0.rent_or_mortgage':'2500.00'});
 assert.equal(b.answers.some(x=>['started','changed'].includes(x.field)&&x.status==='answered'),false);
 assert.deepEqual([answered(b,'sar.income')['1.gross_in_report_month'],answered(b,'sar.care')['0.payer']],['2200.00','Demo Adult A']);
});
test('a changed amount is marked as changed, a source with no current document is not marked as stopped, and a newborn is a birth',async()=>{
 // The same job at a higher pay, a child born after the earlier package, and the earlier unemployment award with no current letter.
 const now=()=>household({...NOW,list:list([A,B,D,C,E,'Demo Baby F, 0 (F)   Daughter. DOB 06/02/2026.']),payA:pay('Northgate Works','Demo Adult A','09/01/2026 – 09/30/2026','5,100.00')},['Demo Adult B','Demo Child D','Demo Child C','Demo Elder E','Demo Baby F']);
 const s=await reporting(NOTICE,now),data=reported(s),income=answered(data,'sar.income'),members=answered(data,'sar.members');
 assert.deepEqual([income['0.changed'],income['0.started'],income['0.gross_in_report_month'],income['1.started'],income['1.changed']],[true,undefined,'5100.00',true,undefined]);
 assert.equal(Object.keys(income).some(key=>key.endsWith('.stopped')),false);
 assert.deepEqual([members['0.name'],members['0.change'],members['1.name'],members['1.change'],members['1.date_of_birth']],['Demo Elder E','Moved In','Demo Baby F','Birth','06/02/2026']);
 // A person who left is named with the details the earlier package held; why they left is for the owner to say.
 const gone=await reporting();gone.household.members=gone.household.members.filter(n=>n!=='Demo Adult B');gone.revision++;confirmFacts(gone);
 const left=answered(reported(gone),'sar.members');
 assert.deepEqual([left['1.name'],left['1.date_of_birth'],left['1.relationship'],left['1.change']],['Demo Adult B','07/22/1989','Spouse',undefined]);
});
test('an employer name too long for one line is divided over the two printed lines, and a stated benefit type is used for income that is not from a job',async()=>{
 const now=()=>household({...NOW,payB:pay('Harborside Freight and Storage','Demo Adult B','09/01/2026 – 09/30/2026','2,200.00'),pension:NOW.pension.replace('Pay frequency: Monthly','Pay frequency: Monthly\nBenefit type: Retirement pension'),late:award('Example Annuity Office','Demo Adult A','10/02/2026','Monthly','210.00')},['Demo Adult B','Demo Child D','Demo Child C','Demo Elder E']);
 const s=await reporting(NOTICE,now),data=reported(s),income=answered(data,'sar.income');
 assert.deepEqual([income['1.employer'],income['1.employer_more'],income['2.income_type']],['Harborside Freight','and Storage','Retirement pension']);
 // An award letter dated after the report month does not show income received in it.
 assert.deepEqual([income['3.person'],income['3.income_type'],income['3.received_in_report_month'],income['3.gross_in_report_month']],['Demo Adult A','Example Annuity Office',undefined,undefined]);
 const result=await renderOfficialForm({...sar,answers:confirmApplication(data,s),mode:'draft'}),form=(await PDFDocument.load(result.bytes)).getForm();
 assert.deepEqual([form.getTextField('SAR7  583').getText(),form.getTextField('SAR7  582').getText(),form.getTextField('SAR7  601').getText(),form.getTextField('SAR7  2014').getText()],['Harborside Freight','and Storage','Retirement pension','Demo Adult A']);
 assert.deepEqual(result.report.missing.filter(m=>/overflow/.test(m.reason)),[]);
});
test('the periodic report answers are written into the original SAR 7B, each tick in its own box, and nothing protected is touched',async()=>{
 const s=await reporting(),data=reported(s),confirmed=confirmApplication(data,s),plan=prepareForm(sar.inventory,sar.map,confirmed);
 assert.equal(plan.manualActions.length,8);assert.equal(formPlan(sar.inventory,sar.map,confirmed).canRender,false);
 await assert.rejects(renderOfficialForm({...sar,answers:confirmed,mode:'released'}),/independent mapping review/);
 const result=await renderOfficialForm({...sar,answers:confirmed,mode:'draft'});
 assert.equal(result.report.pageCount,14);assert.equal(result.report.signatureApplied,false);assert.equal(result.report.independentlyValidated,false);assert.equal(result.report.written.length,46);
 const pdf=await PDFDocument.load(result.bytes),form=pdf.getForm(),text=n=>form.getTextField(typeof n==='number'?'SAR7  '+n:n).getText(),ticked=n=>form.getCheckBox('SAR7  '+n).isChecked();
 assert.deepEqual([text(11),text(12),text(13),text(16),text(17),text(18),text(34),text(35),text(10)],['Demo Adult A','12 Example Street','Example City','95000',undefined,'Demo Adult A','1B2C3D4','October 2026','September 2026']);
 assert.deepEqual([text(37),text(40),text(41),text(42),ticked(39),ticked(43)],['12 Example Street','Example City, CA 95000','PO Box 12','Example City, CA 95001',false,false]);
 assert.deepEqual([ticked('124a'),ticked('124a 2'),text(122),text(123),text(124),ticked(125),ticked(127),ticked(126),ticked(133),ticked(134),text(136)],[true,false,'Demo Elder E','02/09/1958','Mother',true,false,false,false,false,undefined]);
 // Income: the first record on page 5, the next two on page 6. Each record ticks its own boxes only.
 assert.deepEqual([ticked('569a'),ticked('569a 2'),ticked('569a 3'),ticked('569a 4')],[true,false,false,false]);
 assert.deepEqual([text(2011),ticked(570),ticked(569),ticked(568),ticked(567),ticked(563),ticked(560),text(562),ticked(556),ticked(558),text(553),text(552),text(550)],['Demo Adult A',true,false,false,false,true,false,'Northgate Works',true,false,'4850.00','09/30/2026',undefined]);
 assert.deepEqual([text(2012),ticked(591),ticked(590),ticked(589),ticked(584),text(583),ticked(577),text(574),text(573)],['Demo Adult B',true,true,false,true,'Harborside Depot',true,'2200.00','09/30/2026']);
 assert.deepEqual([text(2013),ticked(612),ticked(611),ticked(605),ticked(602),text(604),text(601),ticked(598),text(595),text(594)],['Demo Elder E',true,false,false,true,undefined,'Example Pension Fund',true,'1180.00',undefined]);
 assert.deepEqual([text(2014),ticked(633)],[undefined,false]);
 assert.deepEqual([ticked(3025),ticked(3026),ticked(3027),ticked(3028),text('Text Field 25'),ticked(3032),ticked(3031),text('Text Field 30'),text('Text Field 31'),text('Text Field 32'),text('Text Field 35'),text('Text Field 36')],[true,false,false,false,'2500.00',true,false,'Demo Adult A',undefined,'Demo Child C, Demo Child D','Demo Elder E','64.20']);
 // Stopping a benefit, the disability and work boxes, the text and email choices, the proof boxes, the cash aid sections and the signatures are left as the form came.
 for(const n of [19,20,21,22,26,52,56,290,517,3040,3042,481,492,499,500])assert.equal(ticked(n),false,String(n));
 for(const n of [24,49,55,511,513,515,509])assert.equal(text(n),undefined,String(n));
 for(const name of ['Signature Field 1','Signature Field 2','Signature Field 3'])assert.equal(form.getField(name).acroField.dict.has(PDFName.of('V')),false);
 // The original carries usage rights and scripts; the generated copy has neither, and the original itself is unchanged.
 assert.equal(pdf.catalog.has(PDFName.of('Perms')),false);assert(result.report.removedActions>0);
 const summary=filledSummary(confirmed,s,sar.inventory,sar.map,new Set(result.report.written.map(w=>w.groupId+'|'+w.row+'|'+w.field)));
 assert.equal(summary.boxes,46);assert.deepEqual(summary.pages,[1,3,4,5,6,10,11]);assert.equal(summary.unplaced.length,0);
 // What is left counts questions, not every empty tick box or second line.
 const left=remainingSummary(result.report.missing,result.report.manualActions,sar.inventory,sar.map);
 assert.equal(left.answers,9);assert.deepEqual(left.open.map(o=>[o.label,o.count]),[['Page 1: household, case and report month',1],['Household members: who moved in or out',2],['Income',4],['Expenses: housing (CalFresh only)',1],['Expenses: dependent or child care',1]]);
 assert.equal(left.manual.length,8);
 // An answer typed into a box that may stay blank is still written, and one that does not fit is still reported.
 reviseAnswer(data,{groupId:'sar.income',row:0,field:'explain',status:'answered',value:'A long explanation that cannot fit on the first short line',sourceIds:['owner-entry']});
 const wide=await renderOfficialForm({...sar,answers:confirmApplication(data,s),mode:'draft'});
 assert.deepEqual(wide.report.missing.filter(m=>m.reason==='text_overflow').map(m=>m.field),['explain']);
 const altered={...sar,template:sar.template.slice()};altered.template[20]^=1;await assert.rejects(renderOfficialForm({...altered,answers:confirmed,mode:'draft'}),/SHA-256/);
});
test('every SAR 7B box is either bound to one question or protected, and the boxes the household must answer itself are never bound',()=>{
 const inspected=read('inspection/sar7b.json').pages.flatMap(p=>p.widgets.map(w=>({...w,page:p.page}))),bound=new Set(sar.map.bindings.map(b=>b.widget));
 assert.equal(inspected.length,304);assert.equal(sar.map.bindings.length,bound.size);assert.equal(bound.size+sar.map.protectedRegions.length,304);
 assert.equal(inspected.some(w=>w.annotationFlags&2),false);assert.equal(sar.map.bindings.some(b=>b.hiddenUntilAnswered),false);
 for(const b of sar.map.bindings)assert(![2,12,13,14].includes(b.page),b.widget);
 for(const w of inspected.filter(w=>w.type==='Signature'||w.flags&1||/proof|text messages|email notices|do not have an email|stop my/i.test(w.label)))assert.equal(bound.has(w.name),false,w.name);
 const manual=sar.inventory.groups.filter(g=>g.manualOnly).map(g=>g.id);
 assert.deepEqual(manual,['sar.stop','sar.disability','sar.consent','sar.proof','sar.abawd','sar.warrant','sar.life_events','sar.certification']);
});
