// Which documents each path asks for, and whether the pay statements added so far fall in that period. The periods are
// the ones the forms and state policy name:
//  - a new CalFresh application: earned income "for the past 30 days" (CF 285, "What do I need for my interview?");
//  - a CalFresh recertification: income received in the 30 days before the recertification is turned in
//    (CDSS All County Letter 21-24, March 4, 2021);
//  - a SAR 7: the report month, which is the month before the submit month (SAR 7A instructions, 12/23);
//  - a Medi-Cal application: current income, with pay stubs and the most recent tax information (CCFRM604).
// This only informs. Nothing here blocks a step, sets a document aside or changes what a form is filled from.
import {chosenForm,monthName} from './renewal.mjs';
import {localToday} from './household.mjs';

const DAY=86400000;
/** The period the current path asks income proof for: one calendar month for the periodic report, otherwise the last 30 days up to today. */
export function documentPeriod(state,today=localToday()){
 const form=state.renewal?.on?chosenForm(state):null;
 if(form?.id==='sar7b')return {path:'sar7',month:monthName(state.renewal.notice?.reportMonth)?state.renewal.notice.reportMonth:''};
 return {path:form?.id==='cf37'?'recertification':'application',since:new Date(Date.parse(today+'T00:00:00Z')-30*DAY).toISOString().slice(0,10),today};
}
const LATEST_INCOME='Other income, such as unemployment, Social Security or a pension: the latest award letter or statement.';
const NOT_PREVIOUS='Documents from a previous package are not used as current proof. Add current ones.';
/**
 * What to add on this path: a title, lines to show, and where the wording comes from. Each line is a text with the
 * values to put in it, so the screen can show it in the interface language. `since` and `month` are left as dates for
 * the screen to write out.
 */
export function documentGuidance(state,today=localToday()){
 const period=documentPeriod(state,today),calfresh=state.programs.has('CalFresh'),medical=state.programs.has('Medi-Cal');
 if(period.path==='sar7')return period.month?{period,title:'Which documents to add: those for {month}, your report month',lines:[
   'Pay and other income: proof of everything received in {month}. Add every pay statement paid in that month.',
   'The SAR 7 asks about the report month only. It is the month before your submit month.',
   'Rent, utilities, child care and medical costs: the bill or receipt for {month}. The form requires this part only if your address changed; otherwise it can still raise your benefit.',
   NOT_PREVIOUS],source:'From the SAR 7 and its instructions (SAR 7A).'}
  :{period,title:'Which documents to add: those for your report month',lines:[
   'The SAR 7 asks about one month, the report month. It is the month before your submit month.',
   'Enter the report month on the Renewal step. Until then, no amount is filled from any document.'],source:'From the SAR 7 and its instructions (SAR 7A).'};
 if(period.path==='recertification')return {period,title:'Which documents to add: those from the last 30 days',lines:[
   'Pay and other income: proof of what was received in the 30 days before you turn in this form. Today that means since {since}.',
   'Rent, utilities, child care and medical costs: the latest bill or receipt, showing what you pay now.',
   NOT_PREVIOUS],source:'From state CalFresh policy (All County Letter 21-24) and the CF 37.'};
 return {period,title:'Which documents to add: your most recent ones',lines:[
   ...(calfresh?['Pay: every pay statement from the last 30 days, since {since}, for each person in the household who works. The CalFresh application asks for earned income for the past 30 days.',LATEST_INCOME,
    'Rent, utilities, child care and medical costs: the latest bill or receipt. Proof of these can raise your CalFresh benefit; without proof they are not counted.']:[]),
   ...(medical?['For Medi-Cal: the application asks about your current income. Add recent pay statements or other income documents for everyone in your family, and your most recent tax information if you file taxes.']:[])],
  source:calfresh&&medical?'From the CalFresh application (CF 285) and the health insurance application.':calfresh?'From the CalFresh application (CF 285).':'From the health insurance application.'};
}
/**
 * The current pay statements against the period: those paid inside it, those paid outside it, and those whose pay date
 * could not be read. The pay date is used, or the end of the pay period when no pay date is printed. Gives nothing when
 * there is no pay statement, or when the periodic report has no report month yet.
 */
export function payStatementCheck(state,period){
 if(period.path==='sar7'&&!period.month)return null;
 const read=(doc,key)=>state.facts.find(f=>f.documentId===doc.id&&f.fieldKey===key&&f.value!==null&&!f.superseded)?.value||'';
 const rows=state.docs.filter(d=>d.kind==='paystub'&&!d.historical&&!d.duplicateOf).map(doc=>{
  const stated=read(doc,'pay_date')||read(doc,'period_end'),paid=/^\d{4}-\d{2}-\d{2}$/.test(stated)?stated:'';
  return {file:doc.filename,paid,inside:!paid?null:period.path==='sar7'?paid.startsWith(period.month):paid>=period.since};
 });
 return rows.length?{total:rows.length,inside:rows.filter(r=>r.inside===true),outside:rows.filter(r=>r.inside===false),undated:rows.filter(r=>r.inside===null)}:null;
}
