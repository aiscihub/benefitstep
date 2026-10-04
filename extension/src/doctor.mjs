/** Generic evidence checks only. No eligibility rules, thresholds, or model decisions. */
import {parseMoney, validPeriod, matchRecordToRequest} from '../reference/kernel.mjs';
export const DOCTOR_VERSION='1.0.0';
const known=f=>f&&f.value!==null&&!f.deferred&&!f.superseded;
const cents=f=>{try{return known(f)?parseMoney(String(f.value)):null;}catch{return null;}};
const money=n=>'$'+(n/100).toFixed(2);
export function runDoctor(s){
 const findings=[],trace=[];
 const facts=s.facts.filter(f=>!f.superseded),active=s.docs.filter(d=>!d.historical&&!d.duplicateOf);
 const emit=(ruleId,state,title,detail,action,fs=[],docs=[],blocked=[],extra={})=>{
  const inputs=fs.map(f=>({id:f.id,revision:f.revision}));
  const id=[ruleId,...docs.map(d=>d.id),...inputs.map(f=>f.id+':'+f.revision),extra.contextKey||''].join('|');
  const resolution=s.doctorResolutions?.[id];
  const item={id,ruleId,version:DOCTOR_VERSION,state,title,detail,action,inputRevisions:inputs,sourceIds:docs.map(d=>d.id),blockedFactIds:resolution?[]:blocked,applicationId:s.applicationId,officialApplicationRouteVisible:true,...extra};
  if(resolution)item.resolution=resolution;
  trace.push(item);if(['finding','needs_context'].includes(state)&&!resolution)findings.push(item);
 };
 for(const d of s.docs.filter(d=>d.duplicateOf))emit('PD03','clear','Exact duplicate excluded','Identical file bytes remain in History.','Use the original record.',[],[d]);
 for(const d of active){
  const fs=facts.filter(f=>f.documentId===d.id),get=k=>fs.find(f=>f.fieldKey===k);
  const source=k=>{const f=d.fields?.find(f=>f.key===k);return f&&!f.conflict?cents({value:f.sourceValue??f.value}):null;};
  if(d.analysisState!=='complete')emit('PD01','needs_context','This source needs help',d.error||'Some source content could not be read.','View the source, add a clearer copy, or enter the answer.',fs,[d]);
  if(d.kind==='unknown')emit('PD24','needs_context','Document type is not established','No supported document type was confidently identified.','View the source and enter only the relevant details.',fs,[d]);
  for(const f of fs.filter(f=>!f.deferred&&(f.value===null||f.conflict)))emit('PD01',f.conflict?'finding':'needs_context',f.conflict?'Conflicting source values':'Needs your attention',`${f.label} is ${f.conflict?'conflicting':'unreadable or missing'} in ${d.filename}.`,'Correct this answer or leave it for BenefitsCal.',[f],[d],[f.id],{factId:f.id});
  if(d.kind==='utility'){
   const f=get('current_charges'),current=source('current_charges'),previous=source('prior_balance'),total=source('amount_due'),proposed=cents(f);
   if([current,previous,total,proposed].some(v=>v===null))emit('PD08','needs_context','Bill comparison needs more context','Current charges, previous balance, total due, and the proposed answer are needed.','Check the statement; missing fields are not zero.',fs,[d]);
   else if(previous>0&&total!==current&&proposed===total){
    if(current+previous!==total)emit('PD08','needs_context','Reconcile the bill components','Charges plus previous balance do not equal the total due. Credits or fees may be missing.','View the bill before changing the current-charge answer.',fs,[d],[f.id],{factId:f.id});
    else emit('PD08','finding','Previous balance included in current charges',`The source shows ${money(current)} current charges + ${money(previous)} previous balance = ${money(total)} total due. The prepared current-charge answer uses ${money(proposed)}.`,'Compare the source and correct the current-charge answer.',fs,[d],[f.id],{factId:f.id,canExplain:true});
   }else emit('PD08','clear','Bill amounts remain distinct','No previous-balance misuse found.','Keep the labeled amounts separate.',fs,[d]);
  }
  if(d.kind==='paystub'){
   const f=get('gross_pay'),gross=source('gross_pay'),proposed=cents(f);
   const wrong=['net_pay','ytd_gross'].find(k=>source(k)!==null&&source(k)===proposed&&proposed!==gross);
   if(gross!==null&&proposed!==null&&wrong)emit('PD04','finding','Check the income amount basis',`The prepared gross-pay answer matches ${wrong==='net_pay'?'take-home pay':'year-to-date earnings'}, rather than the source gross pay of ${money(gross)}.`,'Compare the pay statement and correct the gross-pay answer.',fs,[d],[f.id],{factId:f.id,canExplain:true});
  }
 }
 // Cross-record conflicts require the same issuer, person, full period AND payment date.
 const buckets=new Map();
 for(const d of active.filter(d=>d.kind==='paystub')){
  const fs=facts.filter(f=>f.documentId===d.id),get=k=>fs.find(f=>f.fieldKey===k),keys=['person','issuer','period_start','period_end','pay_date'];
  if(!keys.every(k=>known(get(k))))continue;
  const key=keys.map(k=>get(k).value).join('\u001f');const f=get('gross_pay');if(cents(f)===null)continue;
  const list=buckets.get(key)||[];list.push({d,f});buckets.set(key,list);
 }
 for(const entries of buckets.values())if(entries.length>1&&new Set(entries.map(x=>cents(x.f))).size>1)emit('PD07','finding','Comparable pay records disagree','Records name the same person, employer, pay period and payment date, but have different gross amounts.','Compare both sources; explain the difference or move the superseded source to History.',entries.map(x=>x.f),entries.map(x=>x.d),entries.map(x=>x.f.id),{canExplain:true});
 for(const e of s.events.filter(e=>e.kind==='evidence_request'&&e.ownerConfirmed&&e.applicationId===s.applicationId)){
  if(!s.events.some(x=>x.kind==='upload_receipt'&&x.requestId===e.id&&x.program===e.program))emit('PD12','finding','Requested by your county',e.details,'Prepare the requested response; adding a local file does not send it.',[],s.docs.filter(d=>d.id===e.sourceId),[],{contextKey:e.id,requestId:e.id});
 }
 for(const link of s.requestMatches||[]){
  const request=s.events.find(e=>e.id===link.requestId&&e.kind==='evidence_request');const doc=s.docs.find(d=>d.id===link.documentId&&!d.duplicateOf);
  if(!request||!doc){emit('PD05','needs_context','Request comparison needs its sources','A selected request or document was removed.','Select the evidence again.',[],[],[],{contextKey:link.id});continue;}
  const fs=s.facts.filter(f=>f.documentId===doc.id&&!f.superseded),get=k=>fs.find(f=>f.fieldKey===k);
  const fields=['person','period_start','period_end'];const confirmed=fields.every(k=>known(get(k))&&get(k).confirmedRevision===get(k).revision);
  // Historical records retain their dated source snapshots but must be restored and confirmed before matching.
  const record={applicationId:s.applicationId,program:link.program,personId:confirmed?get('person').value:'',periodBasis:link.recordBasis,period:{start:get('period_start')?.value,end:get('period_end')?.value}};
  const target={applicationId:request.applicationId,program:request.program,personId:request.person,ownerConfirmed:request.ownerConfirmed,periodBasis:request.periodBasis,period:{start:request.periodStart,end:request.periodEnd}};
  const result=matchRecordToRequest(record,target);
  emit(result.state==='out_of_scope'?'PD06':'PD05',result.state==='period_match'?'clear':result.state==='finding'||result.state==='out_of_scope'?'finding':'needs_context',result.state==='period_match'?'Record dates cover this request':'Check evidence against the request',result.reason,result.state==='period_match'?'Coverage of the dates does not establish county acceptance.':'Confirm the person, program and period basis, or select a matching record.',fs,[doc],[],{contextKey:JSON.stringify([link,request.periodStart,request.periodEnd,request.person,request.periodBasis]),requestId:request.id});
 }
 return {version:DOCTOR_VERSION,findings,trace,notAssessed:['Eligibility and deductions','Evidence authenticity','Medical coverage','Complete household income or spending','Unreviewed county policy options'],officialApplicationRouteVisible:true};
}
export function reconcileDoctor(s){
 const report=runDoctor(s),blocked=new Set(report.findings.flatMap(f=>f.blockedFactIds));
 for(const f of s.facts){f.doctorBlocked=blocked.has(f.id);if(f.doctorBlocked)f.confirmedRevision=null;}
 return report;
}
export function explainFinding(s,id,reason){
 const finding=runDoctor(s).findings.find(f=>f.id===id);
 if(!finding?.canExplain||typeof reason!=='string'||reason.trim().length<8||reason.length>1000)throw Error('Explain the source comparison before keeping this correction.');
 s.doctorResolutions||={};s.doctorResolutions[id]={reason:reason.trim(),at:new Date().toISOString(),inputRevisions:finding.inputRevisions};s.revision++;reconcileDoctor(s);
}
export function linkRequest(s,input){
 const request=s.events.find(e=>e.id===input.requestId&&e.kind==='evidence_request');
 if(!request||!s.docs.some(d=>d.id===input.documentId&&!d.duplicateOf)||!['CalFresh','Medi-Cal'].includes(input.program)||!['earned','received','service'].includes(input.recordBasis))throw Error('Choose the request, evidence, program and period basis.');
 const link={id:crypto.randomUUID(),requestId:request.id,documentId:input.documentId,program:input.program,recordBasis:input.recordBasis};
 s.requestMatches=(s.requestMatches||[]).filter(x=>x.requestId!==link.requestId).concat(link);s.revision++;return link;
}
