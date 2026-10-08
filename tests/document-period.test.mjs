import test from 'node:test';import assert from 'node:assert/strict';
import {documentPeriod,documentGuidance,payStatementCheck} from '../extension/src/document-period.mjs';
import {initial,addDocument} from '../extension/src/state.mjs';
import {extractByLabels} from '../extension/shared/core/labels.mjs';
import {tr,setUiLocale} from '../extension/src/i18n/ui.mjs';
const TODAY='2026-10-08';
// Fictional pay statements in the layout of the demo statements. All names and amounts are invented.
const pay=(period,paid)=>'Northgate Works\nPay Statement\nEmployee: Demo Adult A\nAddress: 12 Example Street, Example City, CA 95000\nPay period: '+period+(paid?'\nPay date: '+paid:'')+'\nPay frequency: Monthly\nGross pay   $4,850.00';
function household(texts,renewal){
 const s=initial();
 for(const [id,text] of Object.entries(texts)){const pages=[{page:1,text}];addDocument(s,{id,hash:id,filename:id+'.pdf',pages},{...extractByLabels(pages),analysisState:'complete'});}
 if(renewal)s.renewal={...s.renewal,on:true,...renewal};
 return s;
}
const lines=g=>g.lines.join(' ');

test('a new application asks for the most recent documents: pay from the last 30 days, as the CalFresh application words it',()=>{
 const s=initial(),g=documentGuidance(s,TODAY);
 assert.deepEqual(g.period,{path:'application',since:'2026-09-08',today:TODAY});
 assert.equal(g.title,'Which documents to add: your most recent ones');
 assert.match(lines(g),/every pay statement from the last 30 days, since \{since\}/);assert.match(lines(g),/earned income for the past 30 days/);assert.match(lines(g),/For Medi-Cal: the application asks about your current income/);
 assert.equal(g.source,'From the CalFresh application (CF 285) and the health insurance application.');
 // Each program brings its own lines.
 s.programs=new Set(['Medi-Cal']);const medical=documentGuidance(s,TODAY);assert.equal(medical.lines.length,1);assert.equal(medical.source,'From the health insurance application.');
 s.programs=new Set(['CalFresh']);const food=documentGuidance(s,TODAY);assert.equal(food.lines.length,3);assert.doesNotMatch(lines(food),/Medi-Cal/);assert.equal(food.source,'From the CalFresh application (CF 285).');
});
test('a recertification asks for the 30 days before the form is turned in, and a SAR 7 for its report month',()=>{
 const recert=documentGuidance(household({},{form:'cf37'}),TODAY);
 assert.equal(recert.period.path,'recertification');assert.equal(recert.period.since,'2026-09-08');
 assert.match(lines(recert),/received in the 30 days before you turn in this form/);assert.match(recert.source,/All County Letter 21-24/);
 const report=documentGuidance(household({},{form:'sar7b',notice:{caseName:'',caseNumber:'',periodEnd:'',reportMonth:'2026-09',submitMonth:'2026-10'}}),TODAY);
 assert.deepEqual(report.period,{path:'sar7',month:'2026-09'});
 assert.match(report.title,/your report month/);assert.match(lines(report),/everything received in \{month\}/);assert.match(lines(report),/the month before your submit month/);
 // Both renewal paths say that an earlier package's documents are not current proof.
 for(const g of [recert,report])assert.match(lines(g),/Documents from a previous package are not used as current proof/);
 // Until the report month is entered, the screen says so and names no month.
 const unset=documentGuidance(household({},{form:'sar7b'}),TODAY);
 assert.deepEqual(unset.period,{path:'sar7',month:''});assert.match(lines(unset),/Enter the report month on the Renewal step/);assert.equal(payStatementCheck(household({a:pay('09/01/2026 – 09/30/2026','09/30/2026')},{form:'sar7b'}),unset.period),null);
 // Leaving the renewal path, or having no form chosen yet, gives the application wording.
 assert.equal(documentGuidance(household({},{form:''}),TODAY).period.path,'application');
 const back=household({},{form:'cf37'});back.renewal.on=false;assert.equal(documentGuidance(back,TODAY).period.path,'application');
});
test('pay statements are counted against the period: the last 30 days for an application, the report month for a SAR 7',()=>{
 const texts={recent:pay('09/01/2026 – 09/30/2026','09/30/2026'),older:pay('08/01/2026 – 08/31/2026','08/31/2026'),edge:pay('09/01/2026 – 09/08/2026','09/08/2026')};
 const s=household(texts),check=payStatementCheck(s,documentPeriod(s,TODAY));
 assert.equal(check.total,3);assert.deepEqual(check.inside.map(r=>r.file).sort(),['edge.pdf','recent.pdf']);assert.deepEqual(check.outside.map(r=>[r.file,r.paid]),[['older.pdf','2026-08-31']]);assert.deepEqual(check.undated,[]);
 // The same statements on a SAR 7 for August: only the one paid in August counts.
 const report=household(texts,{form:'sar7b',notice:{caseName:'',caseNumber:'',periodEnd:'',reportMonth:'2026-08',submitMonth:'2026-09'}}),august=payStatementCheck(report,documentPeriod(report,TODAY));
 assert.deepEqual([august.inside.map(r=>r.file),august.outside.map(r=>r.file).sort()],[['older.pdf'],['edge.pdf','recent.pdf']]);
 // With no pay date printed, the end of the pay period stands in for it.
 const undated=household({a:pay('09/01/2026 – 09/30/2026','')});
 assert.deepEqual(payStatementCheck(undated,documentPeriod(undated,TODAY)).inside.map(r=>r.paid),['2026-09-30']);
 // A document that is not a pay statement is not counted, a copy in History is left out, and no pay statement gives no check.
 const other=household({rent:'Elm Property Management\nRent Receipt\nTenant: Demo Adult A\nRental period: October 2026\nMonthly rent   $2,500.00\nTotal paid   $2,500.00'});
 assert.equal(payStatementCheck(other,documentPeriod(other,TODAY)),null);
 s.docs.find(d=>d.id==='older').historical=true;assert.equal(payStatementCheck(s,documentPeriod(s,TODAY)).total,2);
 // The check informs only: every document stays in the list as it was.
 assert.equal(s.docs.length,3);
});
test('the lines a new application shows are worded in Spanish and Simplified Chinese with their values kept',()=>{
 const g=documentGuidance(initial(),TODAY),params={since:'8 de septiembre de 2026',count:1,total:2,date:'x'};
 try{
  for(const locale of ['es-US','zh-Hans']){
   setUiLocale(locale);
   for(const text of [g.title,...g.lines,g.source,'{count} of {total} pay statements you added were paid in the last 30 days, since {since}.','Older than 30 days:','The county asks for pay from the last 30 days. Add a newer statement if you have one.','{count} pay statements have no pay date that could be read. Check them in Review.','paid {date}']){
    const shown=tr(text,params);assert.notEqual(shown,text.replace('{since}',params.since).replace('{count}','1').replace('{total}','2').replace('{date}','x'),locale+': '+text);assert.doesNotMatch(shown,/\{[a-z]+\}/,text);
   }
   assert.match(tr(g.lines[0],params),/30/);assert.match(tr(g.lines[0],params),/8 de septiembre de 2026/);
  }
 }finally{setUiLocale('en-US');}
});
