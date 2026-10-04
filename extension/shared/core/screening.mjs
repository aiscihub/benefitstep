import {RULE_PACK} from './rules.mjs';
import {validDate,moneyCents,fieldValue,EXPECTED} from './schema.mjs';
export function completeness(doc){
 const issues=[];
 if(doc.duplicateOf)issues.push('Duplicate file; excluded from totals and the evidence export.');
 if(doc.possibleDuplicateOf&&!doc.duplicateResolved)issues.push('Possible same payment under another file; resolve before including.');
 if(!doc.pages?.length)issues.push('No readable pages.');
 if(doc.pages?.some(p=>p.error))issues.push('One or more pages could not be read.');
 if(!doc.kind||doc.kind==='unknown')issues.push('Document category needs review.');
 for(const key of EXPECTED[doc.kind]||[])if(!fieldValue(doc,key))issues.push('Not established: '+key);
 for(const f of doc.fields||[])if(f.conflict)issues.push('Conflicting values: '+f.key);
 if(!doc.reviewed)issues.push('Owner has not reviewed these facts.');
 return issues;
}
export function samePaymentKey(doc){
 if(doc.kind!=='paystub')return null;
 const a=['person','issuer','pay_date','gross_pay'].map(k=>fieldValue(doc,k));
 return a.every(Boolean)?a.map(x=>x.toLowerCase().replace(/\s+/g,' ').trim()).join('|'):null;
}
export function refreshDuplicateFlags(docs){
 const payments=new Map();for(const d of docs){d.possibleDuplicateOf=null;if(d.duplicateOf)continue;const key=samePaymentKey(d);if(!key)continue;if(payments.has(key))d.possibleDuplicateOf=payments.get(key);else payments.set(key,d.id);}
}
export function observedIncome(docs,month,personAlias=''){
 const lines=[];const warnings=[];const seen=new Set();let cents=0;
 for(const d of docs){
  if(d.kind!=='paystub'||d.duplicateOf||!d.reviewed)continue;
  if(d.possibleDuplicateOf&&!d.duplicateResolved){warnings.push(d.id+': possible duplicate excluded.');continue;}
  const p=fieldValue(d,'pay_date',true),g=fieldValue(d,'gross_pay',true);
  if(!p||!g||!p.startsWith(month+'-'))continue;
  if(personAlias&&fieldValue(d,'person',true)!==personAlias)continue;
  const key=samePaymentKey(d);if(key&&seen.has(key)&&!d.duplicateResolved)continue;if(key)seen.add(key);
  const n=moneyCents(g);if(n===null)continue;cents+=n;lines.push({documentId:d.id,page:d.fields.find(f=>f.key==='gross_pay').page,grossCents:n,payDate:p,person:fieldValue(d,'person',true)});
 }
 return {cents,lines,warnings,label:'Observed reviewed gross payments in the selected month. Not automatically expected or countable monthly income.'};
}
/** Deliberately not a benefits eligibility engine. No model may make this decision. */
export function preliminaryCheck(p,pack=RULE_PACK,asOf=new Date().toISOString().slice(0,10)){
 const common={ruleId:pack.id,ruleVersion:pack.version,source:pack.source,asOf,scope:'Gross-income reference only; qualification NOT determined.',qualification:'not_determined',unknowns:['MCE applicability','household grouping','income exclusions and deductions','net-income rules','citizenship / immigration route','student and work rules','assets and exceptions']};
 const result=(status,headline,detail,more={})=>({...common,status,headline,detail,...more});
 if(!validDate(asOf)||asOf<pack.effectiveFrom||asOf>pack.effectiveThrough||asOf>pack.reviewDue||asOf<pack.reviewedAt)return result('rules_unavailable','Current-rule check unavailable','The saved review is not current for this date. Preparation and export remain available.');
 if(p.state!=='CA')return result('outside_scope','California reference only','No numerical screening for other jurisdictions.');
 if(!Number.isInteger(p.householdSize)||p.householdSize<1||p.householdSize>20||!p.householdConfirmed)return result('needs_information','Confirm the relevant household size','Number of people at an address is not automatically the CalFresh household.');
 if(p.specialSituation!=='no')return result('special_review','Another eligibility route may apply','An older or disabled household member, student, self-employment, changed income, or an uncertain situation requires more review. No negative decision.');
 const income=moneyCents(String(p.monthlyGross??''));
 if(income===null||!p.incomeConfirmed||!p.allSourcesConfirmed)return result('needs_information','Confirm current monthly gross income','Document totals are evidence, not a complete monthly household-income declaration. Confirm amounts, people, sources, and expected period.');
 const limit=p.householdSize<=8?pack.gross200[p.householdSize]:pack.gross200[8]+(p.householdSize-8)*pack.additionalMember;
 if(!Number.isFinite(limit)||limit<=0)return result('rules_unavailable','Income table unavailable','No default threshold is substituted.');
 const detail='Owner-confirmed gross monthly amount compared with the saved 200% reference. Expenses have NOT been subtracted. '+pack.limits;
 return income<=limit*100?result('within_gross_reference','Within the saved gross-income reference',detail,{incomeCents:income,referenceCents:limit*100}):result('above_gross_reference','Above this gross-income reference; seek rule review',detail+' This is not a denial and must not prevent applying.',{incomeCents:income,referenceCents:limit*100});
}
