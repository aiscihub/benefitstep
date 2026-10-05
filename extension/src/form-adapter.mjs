import {usable} from './state.mjs';
export const FORMS={cf285:'CalFresh',ccfrm604:'Medi-Cal'};
export function emptyAnswers(formId){if(!FORMS[formId])throw Error('Unknown official form');return {schemaVersion:'1.0',formId,revision:1,groups:[],answers:[],exportAuthorized:false};}
export function reviseAnswer(data,{groupId,row,field,status,value,sourceIds=[],sourceRefs=[]}){
 const prior=data.answers.find(a=>a.groupId===groupId&&a.row===row&&a.field===field);
 const answer={groupId,row,field,status,revision:(prior?.revision||0)+1,sourceIds,sourceRefs};
 if(status==='answered')answer.value=value;
 data.answers=data.answers.filter(a=>a!==prior);data.answers.push(answer);data.revision++;data.exportAuthorized=false;return answer;
}
export function reviseGroup(data,groupId,status,rowCount){
 const prior=data.groups.find(g=>g.groupId===groupId);data.groups=data.groups.filter(g=>g!==prior);
 data.groups.push({groupId,status,rowCount,revision:(prior?.revision||0)+1});data.revision++;data.exportAuthorized=false;
}
export function confirmApplication(data,state){
 const next=structuredClone(data);
 for(const a of next.answers){for(const ref of a.sourceRefs||[]){const f=state.facts.find(f=>f.id===ref.id);if(!f||!usable(f)||f.revision!==ref.revision)throw Error('A source answer changed. Select or correct that answer before confirming.');}a.confirmedRevision=a.revision;}
 for(const g of next.groups)g.confirmedRevision=g.revision;
 next.applicationId=state.applicationId;next.sourceRevision=state.revision;next.exportAuthorized=true;return next;
}
export function currentApplication(data,state){return data.exportAuthorized===true&&data.applicationId===state.applicationId&&data.sourceRevision===state.revision&&data.answers.every(a=>a.confirmedRevision===a.revision&&(a.sourceRefs||[]).every(r=>state.facts.some(f=>f.id===r.id&&f.revision===r.revision&&usable(f))));}
// Only explicitly selected compatible confirmed facts can cross into paper answers.
// No quick-check ranges, guessed identity split, MAGI, or monthly wage sums.
export function compatibleFacts(state,field){const keys={name:['person'],person:['person'],care_recipient:['care_recipient'],amount_paid:['amount_paid']};return state.facts.filter(f=>usable(f)&&keys[field]?.includes(f.fieldKey));}
export function adoptFact(data,state,target,id){const f=compatibleFacts(state,target.field).find(x=>x.id===id);if(!f)throw Error('This source is not a current confirmed answer for this field');return reviseAnswer(data,{...target,status:'answered',value:String(f.value),sourceIds:[f.id],sourceRefs:[{id:f.id,revision:f.revision,documentId:f.documentId,person:f.person,period:f.period,page:f.page,meaning:f.fieldKey}]});}

// Reuse confirmed evidence only where the field has the same meaning. Never
// promote a payment to a monthly total or infer name parts/household membership.
export function prefillApplication(data,state,map){
 const facts=state.facts.filter(f=>usable(f)&&f.value!==undefined&&String(f.value).trim()&&(!f.documentId||state.docs.some(d=>d.id===f.documentId&&!d.historical&&!d.duplicateOf)));
 const ref=f=>({id:f.id,revision:f.revision,documentId:f.documentId,person:f.person,period:f.period,page:f.page,meaning:f.fieldKey});
 const contactFacts=facts.some(f=>f.householdProfile)?facts.filter(f=>f.householdProfile):facts;
 const personNames=[...new Set(contactFacts.map(f=>f.fieldKey==='person'?String(f.value):f.person).filter(v=>v&&v!=='Person not identified'))];
 let count=0;
 const put=(groupId,row,field,candidates)=>{
  if(!map.bindings.some(b=>b.groupId===groupId&&b.row===row&&b.field===field))return;
  const old=data.answers.find(a=>a.groupId===groupId&&a.row===row&&a.field===field);
  if(old&&!old.autoPrefilled)return; // Keep edits and deliberate blanks.
  const group=data.groups.find(g=>g.groupId===groupId);
  if(group&&group.status!=='applicable')return;
  const unique=[...new Set(candidates.map(c=>String(c.value)))];
  if(unique.length!==1){if(old?.autoPrefilled&&old.status==='answered'){reviseAnswer(data,{groupId,row,field,status:'unknown'}).autoPrefilled=true;}return;}
  const sources=[...new Map(candidates.flatMap(c=>c.facts).map(f=>[f.id,f])).values()],refs=sources.map(ref),value=unique[0];
  if(old?.value===value&&JSON.stringify(old.sourceRefs)===JSON.stringify(refs))return;
  if(!group)reviseGroup(data,groupId,'applicable',row+1);
  else if(group.rowCount<=row)reviseGroup(data,groupId,'applicable',row+1);
  const answer=reviseAnswer(data,{groupId,row,field,status:'answered',value,sourceIds:sources.map(f=>f.id),sourceRefs:refs});answer.autoPrefilled=true;count++;
 };
 const byKey=(fs,key)=>fs.filter(f=>f.fieldKey===key).map(f=>({value:f.value,facts:[f]}));
 if(data.formId==='cf285'){
  put('q1.contact',0,'name',personNames.map(name=>({value:name,facts:contactFacts.filter(f=>(f.fieldKey==='person'?String(f.value):f.person)===name)})));
  for(const key of ['home_address','home_city','home_state','home_zip','mailing_address','mailing_city','mailing_state','mailing_zip','other_names','spoken_language','written_language']){
   if(personNames.length===1)put('q1.contact',0,key,byKey(contactFacts,key));
  }
 }
 // Group earnings by confirmed person and employer, rather than by PDF. Two
 // pay statements for one job should not produce two employment rows.
 const jobs=new Map();
 for(const doc of state.docs.filter(d=>d.kind==='paystub'&&!d.historical&&!d.duplicateOf)){
  const fs=facts.filter(f=>f.documentId===doc.id),names=byKey(fs,'person'),issuers=byKey(fs,'issuer');
  if(names.length!==1||issuers.length!==1)continue;
  const key=JSON.stringify([names[0].value,issuers[0].value]);if(!jobs.has(key))jobs.set(key,[]);jobs.get(key).push(...fs);
 }
 // Stable slots keep later imports from shifting an existing person's answers.
 data.prefillJobs??=[];
 for(const key of jobs.keys())if(!data.prefillJobs.includes(key))data.prefillJobs.push(key);
 const groupId=data.formId==='cf285'?'q8.earned':'p7.income';
 const capacity=1+Math.max(-1,...map.bindings.filter(b=>b.groupId===groupId).map(b=>b.row));
 data.prefillJobs.forEach((key,row)=>{
  if(row>=capacity)return;
  const fs=jobs.get(key)||[];
  if(data.formId==='cf285'){
   put(groupId,row,'person',byKey(fs,'person'));
   put(groupId,row,'employer_name_address',byKey(fs,'issuer'));
   put(groupId,row,'frequency',byKey(fs,'pay_frequency'));
  }else{
   // In this form the employment entry has a source type and payment period.
   // Missing/ambiguous frequency or amount stays unanswered.
   const frequency=byKey(fs,'pay_frequency').map(c=>({...c,value:({weekly:'Weekly',biweekly:'Every 2 weeks',semimonthly:'Twice a month',monthly:'Monthly','one-time':'One-time payment'})[c.value]})).filter(c=>c.value);
   const choices=map.bindings.filter(b=>b.groupId===groupId&&b.field==='frequency').map(b=>b.optionValue);
   const compatible=frequency.filter(c=>choices.includes(c.value));
   put(groupId,row,'frequency',compatible);
   put(groupId,row,'amount',compatible.length&&new Set(compatible.map(c=>c.value)).size===1?byKey(fs,'gross_pay').map(c=>({...c,facts:[...c.facts,...compatible.flatMap(x=>x.facts)]})):[]);
  }
 });
 return count;
}
