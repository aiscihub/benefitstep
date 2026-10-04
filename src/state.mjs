import {fresh as startingState} from './starting-state.mjs';
import {reconcileDoctor} from './doctor.mjs';
import {EXPECTED,FIELD_DEFS,normalizeValue,moneyCents,validDate} from '../shared/core/schema.mjs';
const stamp=()=>new Date().toISOString();
const id=()=>crypto.randomUUID();
export const SECTIONS=['Your Information','People','Household Details','Income','Expenses','Assets (if shown)','Other Situations','Document Upload','Review and Submit'];
export const groupFor=(kind,fields=[])=>['paystub','self_employment','income_award'].includes(kind)?'Income':['county_request','application_receipt','upload_receipt','coverage_notice'].includes(kind)?'Application documents':kind==='support'?(fields.find(f=>f.key==='support_direction')?.value==='received'?'Income':fields.find(f=>f.key==='support_direction')?.value==='paid'?'Expenses':'Other Situations'):kind==='childcare'?'Household Details':['rent','mortgage','utility','medical'].includes(kind)?'Expenses':'Other Situations';
export function initial(){return {policyResults:{},formAnswers:{},starting:startingState(),startingHistory:[],activeStarting:'calfresh',programs:new Set(['CalFresh','Medi-Cal']),quick:{resident:'',residencyContext:'',income:'',medicalIncome:'',food:'',tax:'',applicant_status:'',special_group:''},quickProgram:'calfresh',quickChecked:new Set(),route:'quick',doctorResolutions:{},requestMatches:[],docs:[],facts:[],snapshots:[],events:[],applicationId:id(),guideSection:'Your Information',doneSections:new Set(),revision:0,mode:'auto',busy:false,progress:'',errors:[]};}
export function setFact(s,f,value){
 if(value!==null&&f.fieldKey){value=normalizeValue(f.fieldKey,value);if(value===null)throw Error('Enter a valid value. Leave blank only to keep it unanswered.');}
 if(f.value===value)return;
 f.value=value;f.cents=['money','signed_money'].includes(FIELD_DEFS[f.fieldKey]?.[1])?moneyCents(value,true):null;f.revision++;f.confirmedRevision=null;f.origin='owner_entry';f.deferred=false;s.revision++;
 if(f.documentId&&['person','period_start','period_end','pay_date','document_date','support_direction'].includes(f.fieldKey)){
  const related=s.facts.filter(x=>x.documentId===f.documentId),get=key=>related.find(x=>x.fieldKey===key)?.value;
  const person=get('person')||'Person not identified',period=[get('period_start'),get('period_end')].filter(Boolean).join(' — ')||get('pay_date')||get('document_date')||'Period not identified';
  const doc=s.docs.find(d=>d.id===f.documentId),group=groupFor(doc.kind,related.map(x=>({key:x.fieldKey,value:x.value})));
  doc.period=period;doc.group=group;
  for(const x of related)if(x.person!==person||x.period!==period||x.group!==group){x.person=person;x.period=period;x.group=group;x.revision++;x.confirmedRevision=null;}
 }

}
export function usable(f){return f.value!==null&&!f.doctorBlocked&&!f.conflict&&!f.deferred&&!f.superseded&&f.confirmedRevision===f.revision;}
export function addDocument(s,doc,result){
 const prior=s.docs.find(d=>d.hash===doc.hash&&!d.duplicateOf);doc.importedAt=stamp();doc.historical=false;
 if(prior){doc.duplicateOf=prior.id;s.docs.push(doc);s.revision++;return;}
 Object.assign(doc,result);for(const copy of s.docs.filter(d=>d.hash===doc.hash&&d.duplicateOf))copy.duplicateOf=doc.id;s.docs.push(doc);const group=groupFor(doc.kind,doc.fields);doc.group=group;
 const value=key=>doc.fields.find(f=>f.key===key)?.value;
 const period=[value('period_start'),value('period_end')].filter(Boolean).join(' — ')||value('pay_date')||value('document_date')||'Period not identified';
 doc.period=period;
 for(const field of doc.fields){s.facts.push({id:id(),fieldKey:field.key,label:FIELD_DEFS[field.key][0],value:field.value,cents:['money','signed_money'].includes(FIELD_DEFS[field.key][1])?moneyCents(field.value,true):null,sourceValue:field.sourceValue??field.value,group,documentId:doc.id,person:value('person')||'Person not identified',period,origin:'document_candidate',page:field.page,quote:field.quote,conflict:field.conflict,revision:1,confirmedRevision:null});}
 for(const key of EXPECTED[doc.kind]||[])if(!doc.fields.some(f=>f.key===key))s.facts.push({id:id(),fieldKey:key,label:FIELD_DEFS[key][0],value:null,group,documentId:doc.id,person:value('person')||'Person not identified',period,origin:'document_candidate',revision:1,confirmedRevision:null});
 s.revision++;
}
export function manualFact(s,{person,period,value,fieldKey='gross_pay',group='Income'}){
 if(!person.trim()||!period.trim())throw Error('Add the person and period for this answer.');
 const normalized=normalizeValue(fieldKey,value);if(normalized===null)throw Error('Enter an amount, including 0 only if you mean zero.');
 const f={id:id(),fieldKey,label:FIELD_DEFS[fieldKey][0],value:normalized,cents:moneyCents(normalized,true),person:person.trim(),period:period.trim(),group,origin:'owner_entry',revision:1,confirmedRevision:null};s.facts.push(f);s.revision++;return f;
}
export function gaps(s){return [
 ...s.facts.filter(f=>!f.superseded&&(f.value===null||f.conflict)).map(f=>({id:f.id,type:'answer',label:f.deferred?'Answer in BenefitsCal':'Needs your attention',text:`${f.label} · ${f.person} · ${f.period}`,deferred:f.deferred})),
 ...s.facts.filter(f=>!f.superseded&&!f.documentId&&f.value!==null).map(f=>({id:f.id,type:'evidence',label:'Can add later',text:`Supporting evidence for ${f.label}. Your answer stays available; no deduction or verification result is assumed.`})),
 ...s.docs.filter(d=>!d.duplicateOf&&!d.historical&&(d.analysisState!=='complete'||!d.fields.length)).map(d=>({id:d.id,type:'document',label:'Review this source',text:`${d.filename}: ${d.error||'No supported facts extracted. Enter the relevant answer or leave it for BenefitsCal.'}`}))];}
export function confirmFacts(s,expectedRevision=s.revision){
 if(expectedRevision!==s.revision)throw Error('Details changed. Review the updated summary before confirming.');
 reconcileDoctor(s);
 const resolved=s.facts.filter(f=>f.value!==null&&!f.doctorBlocked&&!f.conflict&&!f.deferred&&!f.superseded);
 for(const f of resolved)f.confirmedRevision=f.revision;
 const snap={id:id(),at:stamp(),programs:[...s.programs],facts:structuredClone(resolved),unresolved:gaps(s).filter(g=>g.type==='answer').map(g=>g.id),engineVersion:'1.0.0',sourceHashes:s.docs.filter(d=>resolved.some(f=>f.documentId===d.id)).map(d=>d.hash)};
 s.snapshots.push(snap);s.revision++;return snap;
}
export function removeDocument(s,docId){s.docs=s.docs.filter(d=>d.id!==docId);s.facts=s.facts.filter(f=>f.documentId!==docId);s.revision++;}
export function historical(s,docId){const d=s.docs.find(d=>d.id===docId);d.historical=!d.historical;for(const f of s.facts.filter(f=>f.documentId===docId)){f.superseded=d.historical;f.confirmedRevision=null;}s.revision++;}
export function submission(s,program='CalFresh'){const events=s.events.filter(e=>e.program===program&&e.applicationId===s.applicationId);return events.some(e=>e.kind==='application_receipt')?'Submitted — receipt recorded':events.some(e=>e.kind==='user_reported_submission')?'Submitted — reported by you':'Submission not recorded';}
export const EVENT_TYPES=['user_reported_submission','application_receipt','evidence_request','upload_receipt','interview_notice','decision_notice'];
export function recordEvent(s,input){
 if(!EVENT_TYPES.includes(input.kind)||!['CalFresh','Medi-Cal'].includes(input.program))throw Error('Choose an event type and program.');
 if(!input.details?.trim())throw Error('Describe what the source says or what you are reporting.');
 if(input.kind!=='user_reported_submission'&&!s.docs.some(d=>d.id===input.sourceId))throw Error('Choose the original receipt or notice. Add it through Documents first.');
 const source=s.docs.find(d=>d.id===input.sourceId);
 const receiptKinds=['application_receipt','upload_receipt'];
 if(receiptKinds.includes(source?.kind)&&receiptKinds.includes(input.kind)&&source.kind!==input.kind)throw Error('Application receipts and document-upload receipts are different. Choose the matching record type or another source.');
 for(const key of ['periodStart','periodEnd','date','deadline'])if(input[key]&&(!/^\d{4}-\d{2}-\d{2}$/.test(input[key])||new Date(input[key]+'T00:00:00Z').toISOString().slice(0,10)!==input[key]))throw Error('Use a valid date.');
 if(input.kind==='upload_receipt'&&input.requestId&&!s.events.some(e=>e.id===input.requestId&&e.kind==='evidence_request'&&e.program===input.program))throw Error('Select a request for this program.');
 if(input.periodStart&&input.periodEnd&&input.periodStart>input.periodEnd)throw Error('Period start must precede its end.');
 if(input.periodBasis&&!['earned','received','service'].includes(input.periodBasis))throw Error('Choose a known period basis.');
 const event={...input,id:id(),applicationId:s.applicationId,recordedAt:stamp(),ownerConfirmed:true,issuerAuthenticated:false,snapshot:structuredClone(s.facts.filter(usable))};s.events.push(event);s.revision++;return event;
}
export function transferSnapshot(s,documentIds=[]){reconcileDoctor(s);return {revision:s.revision,generatedAt:stamp(),type:'LOCAL_PREPARATION_NOT_SUBMITTED',applicationId:s.applicationId,programs:[...s.programs],facts:structuredClone(s.facts.filter(usable)),unresolved:gaps(s),documentIds:[...documentIds]};}
export function transferCurrent(s,snapshot){return !!snapshot&&snapshot.applicationId===s.applicationId&&snapshot.revision===s.revision;}

export function deleteAllSourceCopies(s,docId){
 const doc=s.docs.find(d=>d.id===docId);if(!doc)return;
 const ids=new Set(s.docs.filter(d=>d.hash===doc.hash).map(d=>d.id));
 const factIds=new Set(s.facts.filter(f=>ids.has(f.documentId)).map(f=>f.id));
 s.docs=s.docs.filter(d=>!ids.has(d.id));s.facts=s.facts.filter(f=>!ids.has(f.documentId));
 s.snapshots=s.snapshots.filter(x=>!x.sourceHashes.includes(doc.hash));
 s.events=s.events.filter(e=>!ids.has(e.sourceId)&&!e.snapshot.some(f=>ids.has(f.documentId)));
 s.requestMatches=s.requestMatches.filter(x=>!ids.has(x.documentId)&&s.events.some(e=>e.id===x.requestId));
 for(const [id,r] of Object.entries(s.doctorResolutions))if(r.inputRevisions.some(f=>factIds.has(f.id)))delete s.doctorResolutions[id];
 s.revision++;
}
