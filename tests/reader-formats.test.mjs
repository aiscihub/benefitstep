import test from 'node:test';
import assert from 'node:assert/strict';
import {extractByLabels} from '../extension/shared/core/labels.mjs';
import {validateExtraction,normalizeValue,parseDate,monthSpan} from '../extension/shared/core/schema.mjs';
const page=content=>[{page:1,text:content}];
const read=content=>{const r=extractByLabels(page(content));return {...r,values:Object.fromEntries(r.fields.map(f=>[f.key,f.value]))};};
// Layout of an ordinary statement: letterhead, a labelled header block, then amount rows without colons.
const PAY=`SAMPLE — FOR DEMO ONLY — Fictional data, not a real document

Northgate Studio

Design services • Example City, CA

Contractor Pay Statement — FINAL PAYMENT

Contractor:   Demo Adult A

Pay period:   09/01/2026 – 09/30/2026

Pay date:   09/30/2026

Contract payment (gross)   $4,850.00
Federal income tax withheld   − $485.00

Net payment   $3,751.47`;
test('A statement with US dates, a period range and amount rows is read without rewriting it',()=>{
 const r=read(PAY);assert.equal(r.kind,'paystub');
 assert.deepEqual(r.values,{person:'Demo Adult A',period_start:'2026-09-01',period_end:'2026-09-30',pay_date:'2026-09-30',gross_pay:'4850.00',net_pay:'3751.47',issuer:'Northgate Studio'});
 assert.ok(r.fields.every(f=>f.sourceVerified&&PAY.includes(f.quote)&&!f.confirmed));assert.ok(r.warnings.some(w=>/first line of the document/.test(w)));
});
test('A period given as a month covers that whole month; a month alone is never a payment date',()=>{
 const r=read('Rent Receipt\nTenant: Demo Adult A\nRental period:   October 2026\nMonthly rent — October 2026   $2,500.00\nTotal paid   $2,500.00');
 assert.equal(r.values.period_start,'2026-10-01');assert.equal(r.values.period_end,'2026-10-31');assert.equal(r.values.rent_amount,'2500.00');assert.equal(r.values.amount_paid,'2500.00');
 assert.deepEqual(monthSpan('February 2028'),['2028-02-01','2028-02-29']);assert.equal(normalizeValue('pay_date','October 2026'),null);
});
test('Numeric dates are read month first and impossible dates stay unreadable',()=>{
 assert.equal(parseDate('9/3/2026'),'2026-09-03');assert.equal(parseDate('Sept. 3rd 2026'),'2026-09-03');assert.equal(parseDate('2026-09-03'),'2026-09-03');
 for(const bad of ['25/10/2026','02/30/2026','10/01/26','2026','soon'])assert.equal(parseDate(bad),null);
 const r=read('PAY STATEMENT\nEmployee: Demo Adult A\nPay date: 25/10/2026');assert.ok(!('pay_date' in r.values));assert.ok(r.warnings.some(w=>/pay_date.*YYYY-MM-DD or MM\/DD\/YYYY/.test(w)));
});
test('A one-line address fills street, city, state and ZIP from the same quote',()=>{
 const r=read('Residential Utility Statement\nAccount holder:   Demo Adult A\nService address:   12 Example Street, Example City, CA 95000\nAmount due   $298.47');
 assert.deepEqual([r.values.home_address,r.values.home_city,r.values.home_state,r.values.home_zip],['12 Example Street','Example City','CA','95000']);
 assert.equal(r.values.amount_due,'298.47');assert.ok(!('current_charges' in r.values),'amount due is never copied into current charges');
});
test('A bare address line counts only directly under the line that names the recipient',()=>{
 assert.equal(read('PAY STATEMENT\nEmployee: Demo Adult A\nAddress: 12 Example Street, Example City, CA 95000\nGross pay: $100.00').values.home_zip,'95000');
 assert.ok(!('home_address' in read('PAY STATEMENT\nEmployer: Demo Market\nAddress: 1 Market Plaza, Example City, CA 95001\nEmployee: Demo Adult A\nGross pay: $100.00').values));
});
test('The person billed is named before a child or patient',()=>{
 const billed=read('Child care invoice\nBilled to:   Demo Adult A — 12 Example Street, Example City, CA 95000\nChild:   Demo Child B (age 4)\nTotal paid   $1,400.00');
 assert.equal(billed.values.person,'Demo Adult A');assert.equal(billed.values.home_zip,'95000');assert.ok(!billed.fields.some(f=>f.conflict));
 assert.deepEqual(billed.dependants,[{name:'Demo Child B',page:1,quote:'Child:   Demo Child B (age 4)'}]);
 assert.equal(read('Child care invoice\nChild: Demo Child B\nAmount billed: $300.00').values.person,'Demo Child B');
});
test('Amount rows and headings are ignored on a page that names nobody',()=>{
 const handout=read('Employee learning handout\nA pay statement may include gross earnings and net pay.\nGross pay   $9,999.00\nNet pay   $8,888.00');
 assert.equal(handout.kind,'paystub');assert.deepEqual(handout.fields,[]);
});
test('A document title is never offered as the issuer, and a labelled issuer is never overridden',()=>{
 assert.ok(!('issuer' in read('COUNTY EVIDENCE REQUEST\nPerson: Demo Adult A\nRequested item: Pay statement').values));
 assert.equal(read('Demo Market\nPAY STATEMENT\nEmployee: Demo Adult A\nEmployer: Demo Market Payroll LLC').values.issuer,'Demo Market Payroll LLC');
});
test('A model quote is matched to one real line; a value the page shows once can replace a quote the page does not contain',()=>{
 const raw=fields=>validateExtraction({kind:'paystub',fields:fields.map(f=>({page:1,...f})),warnings:[]},page(PAY));
 const r=raw([{key:'period_start',value:'09/01/2026',quote:'Pay period'},{key:'period_end',value:'2026-09-30',quote:'Pay period: 09/01/2026 – 09/30/2026'},{key:'gross_pay',value:'4850.00',quote:'Contract payment (gross)'},{key:'person',value:'Demo Adult A',quote:'# Contract'}]);
 assert.deepEqual(r.fields.map(f=>[f.key,f.value,f.quote]),[['period_start','2026-09-01','Pay period:   09/01/2026 – 09/30/2026'],['period_end','2026-09-30','Pay period:   09/01/2026 – 09/30/2026'],['gross_pay','4850.00','Contract payment (gross)   $4,850.00'],['person','Demo Adult A','Contractor:   Demo Adult A']]);
 assert.ok(r.fields.every(f=>f.sourceVerified));
});
test('A quote that cannot be tied to one line, or does not show the value, is still rejected',()=>{
 const raw=fields=>validateExtraction({kind:'paystub',fields:fields.map(f=>({page:1,...f})),warnings:[]},page(PAY));
 const r=raw([{key:'pay_date',value:'2026-09-30',quote:'not on the page'},{key:'gross_pay',value:'4850.00',quote:'Net payment'},{key:'net_pay',value:'1.00',quote:'made up'},{key:'document_date',value:'2026-09-15',quote:'Pay date'}]);
 assert.deepEqual(r.fields,[]);
 assert.deepEqual(r.warnings.slice(0,4),['Source quote not found: pay_date','Amount is absent from the quoted passage: gross_pay','Source quote not found: net_pay','Date normalization requires manual review: document_date']);
});
