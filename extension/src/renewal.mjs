// Renewal support: what a household looked like in an earlier BenefitStep package, compared with what its current
// details and documents show now. Nothing here decides what must be reported; it only points at differences for the
// owner to confirm, and the form still asks its own questions.
import {usable} from './state.mjs';
import {householdLists} from './household.mjs';

// Each renewal form as the owner meets it: its code and plain name, when a county asks for it, the codes printed on the
// papers that point to it, what to know before choosing it, and the details its first page asks for from the notice.
// The codes and titles are those of the state's published forms list (CDSS, read October 8, 2026).
export const RENEWAL_FORMS=[
 {id:'sar7b',program:'CalFresh',code:'SAR 7',name:'Periodic report',label:'CalFresh periodic report (SAR 7)',ready:true,notice:['caseName','caseNumber','reportMonth','submitMonth'],
  when:'The report due part-way through your certification period, also called the semi-annual report.',
  papers:['SAR 7','SAR 7B','CF 30 (SAR 7 Reminder Notice)'],
  cautions:['The form says to submit it by the 5th of the submit month on your notice.','BenefitStep fills the blank edition, SAR 7B. If the county mailed a SAR 7 with your details already printed on it, ask your county which copy to return.','If you also get cash aid, the cash aid questions stay for you to answer on the form.']},
 {id:'cf37',program:'CalFresh',code:'CF 37',name:'Recertification',label:'CalFresh recertification (CF 37)',ready:true,notice:['caseName','caseNumber','periodEnd'],
  when:'The renewal at the end of your certification period.',
  papers:['CF 37','CF 377.2 (Notice of Expiration of Certification)'],
  cautions:['The form says to turn it in, and be interviewed by the county, before your certification period ends.','The expiration notice says to file by the 15th day of the last month of your certification period to keep your benefits without a break.','CF 37 is for households that get CalFresh only. If you also get cash aid, the county usually sends a different form.']},
 {id:'mc216',program:'Medi-Cal',code:'MC 216',name:'Medi-Cal renewal',label:'Medi-Cal renewal (MC 216)',ready:false,notice:[],
  when:'The Medi-Cal renewal form. It usually comes in a yellow envelope.',papers:['MC 216'],cautions:[]}
];
// Papers a county sends that are not a renewal form, so the owner does not pick a form for them.
export const OTHER_PAPERS=[
 {papers:['CF 377.6 (Information/Verification Needed)','CW 2200 (Request for Verification)'],text:'These ask for proof. They are not a renewal form, and there is nothing to fill here. Send the county the proof the paper lists by the date on it.'}
];
/** The form the owner chose, or nothing while none is chosen. No form is chosen for them. */
export const chosenForm=state=>RENEWAL_FORMS.find(f=>f.ready&&f.id===state.renewal?.form)||null;
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
/** A month the owner chose, "2026-09", as the form writes it: "September 2026". Anything else gives nothing. */
export function monthName(month){const found=/^(\d{4})-(0[1-9]|1[0-2])$/.exec(month||'');return found?MONTHS[Number(found[2])-1]+' '+found[1]:'';}
const same=(a,b)=>String(a||'').trim().replace(/\s+/g,' ').toLowerCase()===String(b||'').trim().replace(/\s+/g,' ').toLowerCase();
const address=h=>[h?.home_address,h?.home_city,[h?.home_state,h?.home_zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');

/**
 * One household at one moment, reduced to what a renewal form asks about. `facts` are confirmed details, `documents`
 * say what kind of document each came from, and `household` is the owner's own entry. Two statements for one person
 * and source count once, the later one standing.
 */
export function picture({facts=[],documents=[],household={}}){
 const one=(fs,...keys)=>{for(const key of keys){const values=[...new Set(fs.filter(f=>f.fieldKey===key&&f.value!==null&&f.value!==undefined&&String(f.value).trim()).map(f=>String(f.value)))];if(values.length===1)return values[0];}return '';};
 const records=(kinds,read)=>{const found=new Map();
  for(const doc of documents.filter(d=>kinds.includes(d.kind)).sort((a,b)=>String(a.period||'').localeCompare(String(b.period||'')))){
   const fs=facts.filter(f=>f.documentId===doc.id),record=read(fs,doc);if(!record.source&&!record.person)continue;
   found.set((record.person+'|'+record.source).toLowerCase(),record);}
  return [...found.values()];};
 const often=fs=>{const stated=one(fs,'pay_frequency','expense_frequency');return stated==='unknown'?'':stated;};
 return {
  name:String(household.name||'').trim(),address:address(household),
  people:[household.name,...(household.members||[])].map(n=>String(n||'').trim()).filter(Boolean),
  jobs:records(['paystub'],fs=>({person:one(fs,'person'),source:one(fs,'issuer'),amount:one(fs,'gross_pay'),often:often(fs)})),
  awards:records(['income_award'],fs=>({person:one(fs,'person'),source:one(fs,'issuer'),amount:one(fs,'award_amount'),often:often(fs)})),
  housing:records(['rent','mortgage'],fs=>({person:one(fs,'person'),source:one(fs,'issuer'),amount:one(fs,'rent_amount','mortgage_payment'),often:often(fs)})),
  utilities:records(['utility'],fs=>({person:'',source:one(fs,'issuer'),amount:'',often:''})),
  care:records(['childcare'],(fs,doc)=>({person:(doc.dependants||[])[0]||'',source:one(fs,'issuer'),amount:one(fs,'amount_paid','amount_billed'),often:often(fs)})),
  medical:records(['medical'],fs=>({person:one(fs,'person'),source:one(fs,'issuer'),amount:one(fs,'patient_responsibility'),often:often(fs)}))
 };
}
// A detail the owner can still confirm: read, and not paused, in conflict, set aside or replaced.
const standing=f=>f.value!==null&&!f.doctorBlocked&&!f.conflict&&!f.deferred&&!f.superseded;
/**
 * The household as its current details and documents show it. Review compares before the owner confirms, so details
 * awaiting confirmation count there; a form takes confirmed details only.
 */
export function pictureNow(state,confirmedOnly=false){
 const lists=new Set(householdLists(state).map(p=>p.documentId));
 const documents=state.docs.filter(d=>!d.historical&&!d.duplicateOf&&!lists.has(d.id)).map(d=>({id:d.id,kind:d.kind,period:d.period,dependants:(d.dependants||[]).map(c=>c.name)}));
 return picture({facts:state.facts.filter(confirmedOnly?usable:standing),documents,household:state.household?.configured?state.household:{}});
}
const TOPICS=[['jobs','Income from a job'],['awards','Income not from a job'],['housing','Rent or mortgage'],['utilities','Utility bill'],['care','Dependent or child care'],['medical','Medical cost']];
const shown=r=>r.amount?'$'+r.amount+(r.often?' '+r.often:''):'';
const named=r=>[r.person,r.source].filter(Boolean).join(' — ');
/**
 * Differences between two pictures, most notable first. Status is `changed`, `new`, `gone` (in the earlier package,
 * with no current document) or `same`. A missing current document is not a finding that something stopped.
 */
export function compare(before,now){
 const items=[];
 // The address and the people are compared only once the owner has entered the household as it is now.
 if(before.address&&now.address)items.push({topic:'address',group:'Home address',label:'Home address',before:before.address,now:now.address,status:same(before.address,now.address)?'same':'changed'});
 if(before.people.length&&now.people.length){
  for(const name of now.people)if(!before.people.some(p=>same(p,name)))items.push({topic:'people',group:'People in the household',label:name,before:'',now:'In the household now',status:'new'});
  for(const name of before.people){const stays=now.people.some(p=>same(p,name));items.push({topic:'people',group:'People in the household',label:name,before:'In the household before',now:stays?'In the household now':'',status:stays?'same':'gone'});}
 }
 for(const [topic,group] of TOPICS){
  const match=(list,r)=>list.find(x=>same(x.person,r.person)&&same(x.source,r.source));
  for(const r of now[topic]){const old=match(before[topic],r);items.push({topic,group,label:named(r),person:r.person,source:r.source,before:old?shown(old):'',now:shown(r),status:!old?'new':old.amount&&r.amount&&(old.amount!==r.amount||old.often!==r.often)?'changed':'same',record:r,earlier:old||null});}
  for(const r of before[topic])if(!match(now[topic],r))items.push({topic,group,label:named(r),person:r.person,source:r.source,before:shown(r),now:'',status:'gone',record:null,earlier:r});
 }
 const order={changed:0,new:1,gone:2,same:3};
 return items.sort((a,b)=>order[a.status]-order[b.status]);
}
/** The comparison for this session, or null when no previous package is loaded. */
export function renewalChanges(state,confirmedOnly=false){
 const previous=state.renewal?.previous;if(!state.renewal?.on||!previous)return null;
 return compare(picture(previous),pictureNow(state,confirmedOnly));
}
/** The earliest and latest date the documents of a previous package carry, so its age is plain to see. */
export function datedSpan(previous){
 const days=previous.facts.filter(f=>['period_start','period_end','pay_date','document_date'].includes(f.fieldKey)&&/^\d{4}-\d{2}-\d{2}$/.test(f.value)).map(f=>f.value).sort();
 return days.length?{from:days[0],to:days.at(-1)}:null;
}
/** The last day to turn the recertification in without reapplying: the CF 37 gives 30 days past the end of the certification period. */
export function lateLimit(periodEnd){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd||''))return '';
 const day=new Date(periodEnd+'T00:00:00Z');if(Number.isNaN(day.getTime()))return '';
 day.setUTCDate(day.getUTCDate()+30);return day.toISOString().slice(0,10);
}
