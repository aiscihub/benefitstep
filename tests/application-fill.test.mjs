import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PDFDocument} from '../extension/vendor/pdf-writer/pdf-lib.mjs';
import {initial,addDocument,confirmFacts} from '../extension/src/state.mjs';
import {saveHousehold,householdLists,listedDetails,householdSuggestions,householdSheet} from '../extension/src/household.mjs';
import {extractByLabels} from '../extension/shared/core/labels.mjs';
import {emptyAnswers,prefillApplication,confirmApplication,setApplicationPeople,applicationPeople,reviseAnswer,reviseGroup,documentUse,FIXED_ROWS,filledSummary,remainingSummary,summaryText} from '../extension/src/form-adapter.mjs';
import {renderOfficialForm} from '../extension/src/form-renderer.mjs';
import {prepareForm} from '../extension/engine/dist/forms.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../extension/forms/'+p,import.meta.url)));
const formFiles=id=>({map:read('maps/'+id+'.json'),inventory:read('inventory/'+id+'.json')});
const answered=(data,groupId)=>Object.fromEntries(data.answers.filter(a=>a.groupId===groupId&&a.status==='answered').map(a=>[a.row+'.'+a.field,a.value]));
const HOME='12 Example Street, Example City, CA 95000';
// Fictional documents in the layout of the demo statements. All names and amounts are invented.
const TEXT={
 list:'Household summary\nHousehold members\n1. Demo Adult A, 35 (F)   Head of household. DOB 03/14/1991. Drafter.\n2. Demo Adult B, 37 (M)   Spouse. DOB 07/22/1989.\n3. Demo Child D, 8 (F)   Daughter. DOB 05/03/2018.\n4. Demo Child C, 4 (M)   Son. DOB 11/19/2021.\nPapers in this packet:\n1. A pay statement, paid 09/30/2026.\n2. Demo Adult Z, a neighbour.',
 payA:'Northgate Works\nPay Statement\nEmployee: Demo Adult A\nAddress: '+HOME+'\nPay period: 09/01/2026 – 09/30/2026\nPay date: 09/30/2026\nGross pay   $4,850.00',
 payB:'Harborside Depot\nPay Statement\nEmployee: Demo Adult B\nAddress: '+HOME+'\nPay period: 09/01/2026 – 09/30/2026\nPay date: 09/30/2026\nPay frequency: Monthly\nGross pay   $2,200.00',
 rent:'Elm Property Management\nRent Receipt\nTenant: Demo Adult A\nProperty: '+HOME+'\nRental period: October 2026\nMonthly rent — October 2026   $2,500.00\nTotal paid   $2,500.00',
 power:'Example Light & Power\nResidential Utility Statement\nAccount holder: Demo Adult A\nService address: '+HOME+'\nBilling period: 09/02/2026 – 10/01/2026\nElectric service (612 kWh)   $186.20\nGas service (38 therms)   $74.15\nAmount due   $298.47',
 care:'Little Example Daycare\nChild care invoice\nBilled to: Demo Adult A — '+HOME+'\nChild: Demo Child C (DOB 11/19/2021, age 4)\nBilling period: September 2026\nTotal paid   $1,400.00'
};
// A larger household: a grandparent with a pension and prescriptions, a statement with work details, and contact details on the list.
const MORE={
 list:TEXT.list.replace('Papers in this packet:','5. Demo Elder E, 68 (F)   Mother. DOB 02/09/1958.\nMailing address: PO Box 12, Example City, CA 95001\nOther names used: Demo A. Former (maiden name)\nEmail: demo.a@example.test\nPapers in this packet:'),
 payB:TEXT.payB.replace('Pay frequency: Monthly','Pay frequency: Monthly\nEmployer address: 9 Depot Road, Example City, CA 95002\nEmployer phone: (408) 555-0199\nHourly rate: $21.50 per hour\nAverage hours per week: 30'),
 award:'Example Retirees Pension Fund\nBenefit Award Letter\nRecipient: Demo Elder E\nAddress: '+HOME+'\nDocument date: 09/15/2026\nPay frequency: Monthly\nMonthly benefit   $1,180.00',
 pharmacy:'Example Community Pharmacy\nPatient Billing Statement\nCustomer: Demo Elder E\nAddress: '+HOME+'\nBilling period: September 2026\nService description: Prescriptions\nPatient responsibility   $64.20',
 clinic:'Example Family Clinic\nPatient Billing Statement\nCustomer: Demo Adult B\nAddress: '+HOME+'\nBilling period: September 2026\nService description: Office visit\nPatient responsibility   $40.00'
};
const larger=(names=Object.keys(MORE),options={})=>household(names,{texts:MORE,members:['Demo Adult A','Demo Adult B','Demo Child D','Demo Child C','Demo Elder E'],...options});
function household(names=Object.keys(TEXT),{owner='Demo Adult A',texts=TEXT,confirm=true,members=['Demo Adult A','Demo Adult B','Demo Child D','Demo Child C'],reread={}}={}){
 const s=initial();
 for(const id of names){const pages=[{page:1,text:texts[id]}];addDocument(s,{id,hash:id,filename:id+'.pdf',pages},{...(reread[id]||(read=>read))(extractByLabels(pages)),analysisState:'complete'});}
 saveHousehold(s,{name:owner,home_address:'12 Example Street',home_city:'Example City',home_state:'CA',home_zip:'95000',members:members.filter(n=>n!==owner).join('\n'),maxAgeDays:3650});
 if(confirm)confirmFacts(s);return s;
}
const filled=(s,id='cf285')=>{const {map}=formFiles(id),data=emptyAnswers(id);prefillApplication(data,s,map);return data;};

test('a household list is read only under its heading, and only lines that give a name and a date of birth',()=>{
 const s=household(['list']);
 assert.deepEqual(householdLists(s).map(p=>[p.name,p.date_of_birth,p.relationship,p.self]),[['Demo Adult A','1991-03-14','Head of household',true],['Demo Adult B','1989-07-22','Spouse',false],['Demo Child D','2018-05-03','Daughter',false],['Demo Child C','2021-11-19','Son',false]]);
 const loose=household(['list'],{texts:{list:'Shopping list\n1. Demo Adult A, DOB 03/14/1991\n2. Demo Adult B, DOB 07/22/1989'}});
 assert.deepEqual(householdLists(loose),[]);
});
test('a person only the household list names is offered for the household, after the people documents are addressed to',()=>{
 const names=householdSuggestions(household()).names;
 assert.deepEqual(names.map(n=>n.name),['Demo Adult A','Demo Adult B','Demo Child C','Demo Child D']);assert.equal(names.at(-1).recipient,false);
});
test('a relationship is proposed only from a list written from the owner\'s side, and a birth date only where lists agree',()=>{
 assert.deepEqual(listedDetails(household(),'Demo Adult B'),{date_of_birth:'1989-07-22',relationship:'Spouse',files:['list.pdf']});
 assert.deepEqual(listedDetails(household(),'Demo Adult A'),{date_of_birth:'1991-03-14',relationship:'',files:['list.pdf']});
 assert.deepEqual(listedDetails(household(undefined,{owner:'Demo Adult B'}),'Demo Child D'),{date_of_birth:'2018-05-03',relationship:'',files:['list.pdf']});
 const two=household(['list','other'],{texts:{...TEXT,other:'Household members\n1. Demo Adult B, Spouse, DOB 01/01/1980'}});
 assert.deepEqual(listedDetails(two,'Demo Adult B'),{date_of_birth:'',relationship:'Spouse',files:['list.pdf','other.pdf']});
});
test('choosing people fills the CalFresh roster with listed birth dates and relationships, and Medi-Cal with birth dates',()=>{
 const s=household(),cal=emptyAnswers('cf285'),med=emptyAnswers('ccfrm604'),everyone=applicationPeople(s).map(p=>p.name);
 setApplicationPeople(cal,s,formFiles('cf285').map,everyone);
 assert.deepEqual(answered(cal,'q6a.people'),{'0.name':'Demo Adult A','0.date_of_birth':'03/14/1991','1.name':'Demo Adult B','1.date_of_birth':'07/22/1989','1.relationship':'Spouse','2.name':'Demo Child D','2.date_of_birth':'05/03/2018','2.relationship':'Daughter','3.name':'Demo Child C','3.date_of_birth':'11/19/2021','3.relationship':'Son'});
 setApplicationPeople(med,s,formFiles('ccfrm604').map,everyone);
 assert.deepEqual([0,1,2,3].map(row=>answered(med,'p2.address')[row+'.date_of_birth']),['03/14/1991','07/22/1989','05/03/2018','11/19/2021']);
 reviseAnswer(cal,{groupId:'q6a.people',row:1,field:'date_of_birth',status:'answered',value:'07/23/1989',sourceIds:['owner-entry']});
 setApplicationPeople(cal,s,formFiles('cf285').map,everyone);assert.equal(answered(cal,'q6a.people')['1.date_of_birth'],'07/23/1989');
});
test('confirmed documents fill the CalFresh income, care and housing sections, each in its own printed row',()=>{
 const s=household(),data=filled(s);
 assert.deepEqual(answered(data,'q8.earned'),{'0.has_income':true,'0.person':'Demo Adult A','0.employer_name_address':'Northgate Works','1.person':'Demo Adult B','1.employer_name_address':'Harborside Depot','1.frequency':'monthly','1.gross_received_this_month':'2200.00'});
 assert.deepEqual(answered(data,'q9.care'),{'0.has_care_cost':true,'0.care_recipient':'Demo Child C','0.provider_name_address':'Little Example Daycare','0.amount_paid':'1400.00','0.frequency':'monthly'});
 assert.deepEqual(answered(data,'q11.housing'),{'0.responsible_for_expenses':true,'0.owed':true,'0.payer':'Demo Adult A','0.amount_owed':'2500.00','0.frequency':'monthly','2.owed':true,'2.payer':'Demo Adult A','2.frequency':'monthly'});
 const {map,inventory}=formFiles('cf285'),plan=prepareForm(inventory,map,confirmApplication(data,s));
 assert.equal(plan.operations.filter(o=>['q8.earned','q9.care','q11.housing'].includes(o.groupId)).length,20);
 // The printed row names and the single yes/no above the table are not reported as unanswered questions.
 assert.equal(plan.missing.some(m=>m.groupId==='q11.housing'&&(m.field==='expense_type'||(m.field==='responsible_for_expenses'&&m.row>0))),false);
 assert.equal(data.groups.find(g=>g.groupId==='q11.housing').rowCount,FIXED_ROWS['q11.housing'].length);
});
test('nothing is filled from what a document does not state, and a question is never answered No',()=>{
 const twins=household(['care'],{texts:{care:TEXT.care.replace('Child: Demo Child C (DOB 11/19/2021, age 4)','Child: Demo Child C\nChild: Demo Child D')}});
 assert.deepEqual(answered(filled(twins),'q9.care'),{});
 const plain=household(['power'],{texts:{power:TEXT.power.replace('Electric service (612 kWh)','Service charges').replace('Gas service (38 therms)','Other charges')}});
 assert.deepEqual(answered(filled(plain),'q11.housing'),{});
 const unconfirmed=household(['rent','payB'],{confirm:false});
 assert.deepEqual(filled(unconfirmed).answers.filter(a=>a.status==='answered'&&a.groupId!=='q1.contact'),[]);
 const none=filled(household(['list']));
 assert.equal(none.answers.some(a=>a.value===false),false);assert.deepEqual(answered(none,'q8.earned'),{});
 const rents=household(['rent','rent2'],{texts:{...TEXT,rent2:TEXT.rent.replace('October 2026\n','September 2026\n').replaceAll('2,500.00','2,400.00')}});
 assert.deepEqual(answered(filled(rents),'q11.housing'),{'0.responsible_for_expenses':true,'0.owed':true,'0.payer':'Demo Adult A','0.frequency':'monthly'});
});
test('each document reports the sections it filled, or the reason it filled none',()=>{
 const s=household(),use=Object.fromEntries(documentUse(filled(s),s).map(u=>[u.file,u]));
 assert.deepEqual(use['rent.pdf'].groups,['q11.housing']);assert.deepEqual(use['care.pdf'].groups,['q9.care']);assert.deepEqual(use['payB.pdf'].groups,['q8.earned']);
 assert.match(use['list.pdf'].note,/lists household members/);
 const stranger=household(['payA','payB'],{owner:'Demo Adult B'});stranger.household.members=[];confirmFacts(stranger);
 const paused=Object.fromEntries(documentUse(filled(stranger),stranger).map(u=>[u.file,u]));
 assert.match(paused['payA.pdf'].note,/check in Review paused/);assert.deepEqual(paused['payB.pdf'].groups,['q8.earned']);
 const waiting=household(['payA'],{confirm:false});assert.match(documentUse(filled(waiting),waiting)[0].note,/not confirmed yet/);
 const medical=household(['rent']);assert.match(documentUse(filled(medical,'ccfrm604'),medical)[0].note,/no section for this kind of document/);
});
test('the new CalFresh boxes are written into the original form, including each Yes and No box',async()=>{
 const s=household(),{map,inventory}=formFiles('cf285'),data=filled(s);
 reviseAnswer(data,{groupId:'q11.housing',row:3,field:'owed',status:'answered',value:false,sourceIds:['owner-entry']});
 const answers=confirmApplication(data,s),fontBytes=new Uint8Array(fs.readFileSync(new URL('../extension/vendor/pdf-writer/NotoSans-Regular.ttf',import.meta.url)));
 const result=await renderOfficialForm({template:new Uint8Array(fs.readFileSync(new URL('../extension/forms/templates/cf285.pdf',import.meta.url))),inventory,map,answers,fontBytes,mode:'draft'});
 const form=(await PDFDocument.load(result.bytes)).getForm(),text=n=>form.getTextField('CF 285  '+n).getText(),checked=n=>form.getCheckBox('CF 285  '+n).isChecked();
 assert.deepEqual([text(397),text(398),text(399),text(4010),text(411)],['Demo Adult A','2500.00','monthly','Demo Adult A','monthly']);
 assert.deepEqual([text(357),text(358),text(359),text(360),text(277+9)],['Demo Child C','Little Example Daycare','1400.00','monthly','2200.00']);
 assert.deepEqual([355,393,395,408,414,269].map(checked),[true,true,true,true,true,true]);
 assert.deepEqual([356,'393b',396,409,413,401,402,270].map(checked),[false,false,false,false,false,false,false,false]);
});
test('a section with printed rows always opens with every row, whoever opens it',()=>{
 const data=emptyAnswers('cf285');reviseGroup(data,'q11.housing','applicable',1);
 assert.equal(data.groups[0].rowCount,6);assert.equal(data.answers.filter(a=>a.status==='not_applicable').length,11);
 reviseGroup(data,'q11.housing','deferred',1);assert.equal(data.groups[0].rowCount,1);
});
// The whole demo household on the CalFresh form, as the owner would confirm it.
function prepared(){
 const s=household(),{map,inventory}=formFiles('cf285'),data=filled(s);setApplicationPeople(data,s,map,applicationPeople(s).map(p=>p.name));
 const answers=confirmApplication(data,s);return {s,map,inventory,answers,plan:prepareForm(inventory,map,answers)};
}
test('the summary of filled content follows the form: section, page, one line per record, and where each line came from',()=>{
 const {s,map,inventory,answers,plan}=prepared(),summary=filledSummary(answers,s,inventory,map);
 assert.equal(summary.boxes,plan.operations.length);assert.deepEqual(summary.pages,[9,11,13,14]);
 assert.deepEqual(summary.sections.map(x=>[x.groupId,x.pages,x.boxes]),[['q1.contact',[9],5],['q6a.people',[11],11],['q8.earned',[13],7],['q9.care',[14],5],['q11.housing',[14],8]]);
 const housing=summary.sections.at(-1).records;
 assert.deepEqual(housing[0],{label:'',items:[{label:'Is anyone in the household responsible for household expenses?',value:'Yes'}],from:[]});
 assert.deepEqual(housing[1],{label:'Rent or house payment',items:[{label:'Do you have this expense?',value:'Yes'},{label:'Who pays?',value:'Demo Adult A'},{label:'Amount owed',value:'2500.00'},{label:'How often billed (weekly, monthly, other)',value:'monthly'}],from:['rent.pdf']});
 assert.deepEqual(housing[2].label,'Gas, electric or other heating and cooling fuel');assert.deepEqual(housing[2].from,['power.pdf']);
 assert.deepEqual(summary.sections[0].records,[{label:'',items:[{label:'Name',value:'Demo Adult A'},{label:'Home address',value:'12 Example Street'},{label:'Home city',value:'Example City'},{label:'Home state',value:'CA'},{label:'ZIP code',value:'95000'}],from:['your household details']}]);
 assert.deepEqual(summary.sections[1].records[1],{label:'Person 2',items:[{label:'Name',value:'Demo Adult B'},{label:'Relationship to you',value:'Spouse'},{label:'Date of birth',value:'07/22/1989'}],from:['the people you chose','list.pdf']});
 assert.deepEqual(summary.sections[2].records.map(r=>[r.label,r.from]),[['',[]],['Job 1',['payA.pdf']],['Job 2',['payB.pdf']]]);
});
test('an answer that will not reach the PDF is listed apart with its reason, and is not counted as filled',()=>{
 const {s,map,inventory}=prepared(),data=filled(s);
 reviseAnswer(data,{groupId:'notes',row:0,field:'notes',status:'answered',value:'Call after 3 pm',sourceIds:['owner-entry']});
 reviseAnswer(data,{groupId:'q1.contact',row:0,field:'ssn',status:'answered',value:'000-00-0000',sourceIds:['owner-entry']});
 const summary=filledSummary(data,s,inventory,map);
 assert.deepEqual(summary.unplaced.map(u=>[u.label,u.why]),[['Ssn','The app cannot write this box yet.'],['Notes','Its section is set to be answered on the official form.']]);
 assert.equal(summary.sections.some(x=>x.groupId==='notes'),false);
 const draft=filledSummary(data,s,inventory,map,new Set(['q1.contact|0|name']));
 assert.equal(draft.boxes,1);assert.equal(draft.unplaced.filter(u=>u.why==='The text does not fit the box.').length>0,true);
});
test('what is left is grouped by section and leaves out boxes the form does not print on a record',()=>{
 const {map,inventory,plan}=prepared(),left=remainingSummary(plan.missing,plan.manualActions,inventory,map),by=Object.fromEntries(left.open.map(o=>[o.label,o]));
 // Four rows of question 11 are unanswered: a yes/no, who pays and how often on each, and an amount on the property tax row only.
 assert.equal(by['11. Housing, utilities and shelter'].count,13);
 assert.deepEqual(by['8. Earned income'].fields.includes('Does anyone in the household get income from a job?'),false);
 assert.equal(by['6a. Household roster'].fields.includes('Relationship to you'),false);
 assert.equal(left.untouched.includes('7. Unearned income'),true);assert.equal(left.answers,left.open.reduce((n,o)=>n+o.count,0));
 assert.deepEqual(left.manual.map(m=>m.page),[9,18]);
});
test('the package text states the filled content and what is left in plain lines',()=>{
 const {s,map,inventory,answers,plan}=prepared(),text=summaryText(filledSummary(answers,s,inventory,map),remainingSummary(plan.missing,plan.manualActions,inventory,map));
 assert.match(text,/^WHAT WAS FILLED\n36 fields filled on PDF pages 9, 11, 13 and 14\./);
 assert.match(text,/PDF page 14 — 11\. Housing, utilities and shelter\n  Is anyone in the household responsible for household expenses\?: Yes\n  Rent or house payment: Do you have this expense\?: Yes; Who pays\?: Demo Adult A; Amount owed: 2500\.00; How often billed \(weekly, monthly, other\): monthly \(from rent\.pdf\)/);
 assert.match(text,/WHAT IS LEFT FOR YOU\n/);assert.match(text,/PDF page 9: Applicant signature and date \(complete by hand\)/);
});
test('labelled lines on a pay statement fill the employer phone, hourly rate and weekly hours; the employer box keeps the name only',()=>{
 assert.deepEqual(answered(filled(larger(['payB'])),'q8.earned'),{'0.has_income':true,'0.person':'Demo Adult B','0.employer_name_address':'Harborside Depot','0.employer_phone':'(408) 555-0199','0.hourly_rate':'21.50','0.hours_week':'30','0.frequency':'monthly','0.gross_received_this_month':'2200.00'});
});
test('an award letter fills unearned income, and a medical statement counts only for a listed person aged 60 or older',()=>{
 const data=filled(larger());
 assert.deepEqual(answered(data,'q7.unearned'),{'0.has_income':true,'0.person':'Demo Elder E','0.source':'Example Retirees Pension Fund','0.amount':'1180.00','0.frequency':'monthly'});
 assert.deepEqual(answered(data,'q12.medical'),{'0.has_expenses':true,'0.person':'Demo Elder E','0.amount':'64.20','0.frequency':'monthly','0.expense_type':'Prescriptions'});
 // Without a list that gives the patient's birth date, the statement is not used.
 assert.deepEqual(answered(filled(larger(['pharmacy'])),'q12.medical'),{});
});
test('"unknown" from a reader is never written as how often; a one-month period still gives monthly',()=>{
 // On-device AI sometimes answers "unknown" for how often a picture of a receipt or letter is billed or paid.
 const unknown=key=>read=>({...read,fields:[...read.fields.filter(f=>f.key!==key),{...read.fields[0],key,value:'unknown',sourceValue:'unknown'}]});
 const data=filled(larger(['list','rent','award','payB'],{texts:{...TEXT,...MORE},reread:{rent:unknown('expense_frequency'),award:unknown('pay_frequency'),payB:unknown('pay_frequency')}}));
 assert.equal(answered(data,'q11.housing')['0.frequency'],'monthly');
 assert.equal('0.frequency' in answered(data,'q7.unearned'),false);assert.equal(answered(data,'q7.unearned')['0.amount'],'1180.00');
 assert.equal('0.frequency' in answered(data,'q8.earned'),false);assert.equal(answered(data,'q8.earned')['0.person'],'Demo Adult B');
});
test('contact details on the owner\'s own household list fill other names, the mailing address and the Medi-Cal email',()=>{
 const s=larger();
 assert.deepEqual(householdSheet(s),{files:['list.pdf'],mailing:{address:'PO Box 12',city:'Example City',state:'CA',zip:'95001'},other_names:'Demo A. Former (maiden name)',email:'demo.a@example.test'});
 const contact=answered(filled(s),'q1.contact');
 assert.deepEqual([contact['0.other_names'],contact['0.mailing_address'],contact['0.mailing_city'],contact['0.mailing_state'],contact['0.mailing_zip']],['Demo A. Former (maiden name)','PO Box 12','Example City','CA','95001']);
 const med=filled(s,'ccfrm604');setApplicationPeople(med,s,formFiles('ccfrm604').map,['Demo Adult A','Demo Adult B']);
 assert.equal(answered(med,'p1.contact')['0.email'],'demo.a@example.test');
 assert.deepEqual([0,1].map(row=>answered(med,'p2.address')[row+'.mail_address']),['PO Box 12','PO Box 12']);
 // A list written by someone else says nothing about this owner's contact details.
 assert.deepEqual(householdSheet(larger(undefined,{owner:'Demo Adult B'})),{files:[]});
});
test('opening an application again leaves confirmed answers as they are',()=>{
 const s=larger(),{map}=formFiles('cf285'),data=filled(s);setApplicationPeople(data,s,map,applicationPeople(s).map(p=>p.name));
 const revision=data.revision;prefillApplication(data,s,map);setApplicationPeople(data,s,map,data.people);
 assert.equal(data.revision,revision);
});
test('every kind of document together fills six pages of the CalFresh form, and each new box is written',async()=>{
 const all={...TEXT,...MORE},s=larger(Object.keys(all),{texts:all}),{map,inventory}=formFiles('cf285'),data=filled(s);setApplicationPeople(data,s,map,applicationPeople(s).map(p=>p.name));
 const answers=confirmApplication(data,s),summary=filledSummary(answers,s,inventory,map);
 assert.deepEqual(summary.pages,[9,11,12,13,14,15]);
 assert.deepEqual(summary.sections.map(x=>[x.groupId,x.boxes]),[['q1.contact',10],['q6a.people',14],['q7.unearned',5],['q8.earned',10],['q9.care',5],['q11.housing',8],['q12.medical',5]]);
 const result=await renderOfficialForm({template:new Uint8Array(fs.readFileSync(new URL('../extension/forms/templates/cf285.pdf',import.meta.url))),inventory,map,answers,fontBytes:new Uint8Array(fs.readFileSync(new URL('../extension/vendor/pdf-writer/NotoSans-Regular.ttf',import.meta.url))),mode:'draft'});
 assert.equal(result.report.written.length,summary.boxes);
 const form=(await PDFDocument.load(result.bytes)).getForm(),text=n=>form.getTextField('CF 285  '+n).getText(),checked=n=>form.getCheckBox('CF 285  '+n).isChecked();
 assert.deepEqual([text(243),text(244),text(245),text(246)],['Demo Elder E','Example Retirees Pension Fund','1180.00','monthly']);
 assert.deepEqual([text(449),text(450),text(451),text(452)],['Demo Elder E','64.20','monthly','Prescriptions']);
 assert.deepEqual([219,434].map(checked),[true,true]);assert.deepEqual([220,435,247,248].map(checked),[false,false,false,false]);
});
