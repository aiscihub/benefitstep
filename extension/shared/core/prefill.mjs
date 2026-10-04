import {observedIncome} from './screening.mjs';
import {fieldValue,validDate} from './schema.mjs';
export function prefillIncome(profile,documents,{manualIncome=false,manualMonth=false}={}){
 const next={...profile};
 if(!manualMonth){
  const dates=documents.filter(d=>d.reviewed&&!d.duplicateOf&&(!d.possibleDuplicateOf||d.duplicateResolved)&&d.kind==='paystub').map(d=>fieldValue(d,'pay_date',true)).filter(validDate).sort();
  if(dates.length)next.referenceMonth=dates.at(-1).slice(0,7);
 }
 const total=observedIncome(documents,next.referenceMonth);
 if(!manualIncome)next.monthlyGross=total.lines.length?(total.cents/100).toFixed(2):'';
 return {profile:next,total};
}
