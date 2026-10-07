import {usable} from './state.mjs';
import {householdSuggestions,householdLists,listedDetails,householdSheet,localToday} from './household.mjs';
export const FORMS={cf285:'CalFresh',ccfrm604:'Medi-Cal'};
export function emptyAnswers(formId){if(!FORMS[formId])throw Error('Unknown official form');return {schemaVersion:'1.0',formId,revision:1,groups:[],answers:[],exportAuthorized:false};}
export function reviseAnswer(data,{groupId,row,field,status,value,sourceIds=[],sourceRefs=[]}){
 const prior=data.answers.find(a=>a.groupId===groupId&&a.row===row&&a.field===field);
 const answer={groupId,row,field,status,revision:(prior?.revision||0)+1,sourceIds,sourceRefs};
 if(status==='answered')answer.value=value;
 data.answers=data.answers.filter(a=>a!==prior);data.answers.push(answer);data.revision++;data.exportAuthorized=false;return answer;
}
// CalFresh question 11 prints one row per kind of expense. The owner answers each row but never names it, and the
// yes/no above the table is asked once, so those two entries are marked as not asked on the rows where they do not apply.
// Plain wording for answers whose inventory label is a short code.
const FIELD_LABELS={'q1.contact|name':'Name','q1.contact|home_zip':'ZIP code','q1.contact|mailing_zip':'Mailing ZIP code','p2.address|mail_zip':'Mail ZIP code','q6a.people|relationship':'Relationship to you','q7.unearned|has_income':'Does anyone in the household get income that is not from a job?','q7.unearned|person':'Person getting the money','q7.unearned|source':'From where','q7.unearned|amount':'How much','q7.unearned|frequency':'How often received','q12.medical|has_expenses':'Does an elderly (60 or older) or disabled person have out-of-pocket medical expenses?','q12.medical|person':'Name of elderly or disabled person','q12.medical|amount':'Amount of expense','q12.medical|frequency':'How often paid','q12.medical|expense_type':'What type of expense','q8.earned|has_income':'Does anyone in the household get income from a job?','q8.earned|employer_name_address':'Employer','q1.contact|other_names':'Other names (maiden, nicknames)','q8.earned|person':'Person working','q8.earned|frequency':'How often paid','q8.earned|hours_week':'Average hours per week','q8.earned|gross_received_this_month':'Total gross earned income received this month','q9.care|has_care_cost':'Does anyone pay for care so they can work, study, train or look for work?','q9.care|care_recipient':'Who gets care','q9.care|provider_name_address':'Who gives care','q9.care|frequency':'How often paid','q11.housing|responsible_for_expenses':'Is anyone in the household responsible for household expenses?','q11.housing|owed':'Do you have this expense?','q11.housing|payer':'Who pays?','q11.housing|frequency':'How often billed (weekly, monthly, other)','p2.address|zip':'ZIP code','p7.income|household_has_income':'Does anyone in the household have income?','p7.income|person_first':'Person, first name','p7.income|person_middle':'Person, middle name','p7.income|person_last':'Person, last name','p7.income|person_suffix':'Person, suffix','p7.income|income_name':'Employer or income source','p7.income|frequency':'How often paid'};
const sentence=text=>{const words=String(text||'').replaceAll('_',' ').trim();return words.charAt(0).toUpperCase()+words.slice(1);};
export const fieldLabel=(groupId,field,fallback)=>FIELD_LABELS[groupId+'|'+field]||sentence(fallback||field);
const RECORD_NAMES={'q6a.people':'Person','p2.identity':'Person','p2.address':'Person','q7.unearned':'Income record','q8.earned':'Job','p7.income':'Income record','q9.care':'Care record','q12.medical':'Expense record'};
export const recordLabel=(groupId,row)=>FIXED_ROWS[groupId]?.[row]||(RECORD_NAMES[groupId]||'Record')+' '+(row+1);
export const FIXED_ROWS={'q11.housing':['Rent or house payment','Property taxes and insurance, if billed separately','Gas, electric or other heating and cooling fuel','Telephone or cell phone','Homeless shelter expense','Water, sewage, garbage']};
const NOT_ASKED={'q11.housing':row=>row?['expense_type','responsible_for_expenses']:['expense_type']};
export function reviseGroup(data,groupId,status,rowCount){
 const fixed=status==='applicable'&&FIXED_ROWS[groupId];if(fixed)rowCount=fixed.length;
 const prior=data.groups.find(g=>g.groupId===groupId);data.groups=data.groups.filter(g=>g!==prior);
 data.groups.push({groupId,status,rowCount,revision:(prior?.revision||0)+1});data.revision++;data.exportAuthorized=false;
 if(fixed)for(let row=0;row<fixed.length;row++)for(const field of NOT_ASKED[groupId](row))if(!data.answers.some(a=>a.groupId===groupId&&a.row===row&&a.field===field))reviseAnswer(data,{groupId,row,field,status:'not_applicable'});
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
// A typed answer, such as a household detail, has no document or page. Those keys are left out so the reference
// stays plain data; the form check rejects an undefined value.
const sourceRef=f=>Object.fromEntries(Object.entries({id:f.id,revision:f.revision,documentId:f.documentId,person:f.person,period:f.period,page:f.page,meaning:f.fieldKey}).filter(([,value])=>value!==undefined));
export function compatibleFacts(state,field){const keys={name:['person'],person:['person'],care_recipient:['care_recipient'],amount_paid:['amount_paid']};return state.facts.filter(f=>usable(f)&&keys[field]?.includes(f.fieldKey));}
export function adoptFact(data,state,target,id){const f=compatibleFacts(state,target.field).find(x=>x.id===id);if(!f)throw Error('This source is not a current confirmed answer for this field');return reviseAnswer(data,{...target,status:'answered',value:String(f.value),sourceIds:[f.id],sourceRefs:[sourceRef(f)]});}

/** People the owner can put on an application: their household list first, then other names their documents show. */
export function applicationPeople(state){
 const p=state.household||{},seen=new Set(),people=[];
 const add=(name,origin)=>{const text=String(name||'').trim(),key=text.toLowerCase();if(key&&!seen.has(key)){seen.add(key);people.push({name:text,origin});}};
 if(p.configured){add(p.name,'you');for(const member of p.members||[])add(member,'household');}
 for(const found of householdSuggestions(state).names)add(found.name,'document');
 return people;
}
// Both forms ask for dates as month/day/year.
const formDate=iso=>iso.slice(5,7)+'/'+iso.slice(8,10)+'/'+iso.slice(0,4);
const NAME_SUFFIXES=new Set(['jr','sr','ii','iii','iv']);
/** First, middle and last name for a form that asks for them separately. Offered only for a person the owner chose, and it stays editable: with more than one name left over, the rest is kept together as the last name. */
export function proposeNameParts(full){
 const words=String(full||'').trim().split(/\s+/).filter(Boolean),parts={first_name:'',middle_name:'',last_name:'',suffix:''};
 if(words.length>2&&NAME_SUFFIXES.has(words.at(-1).replace(/\./g,'').toLowerCase()))parts.suffix=words.pop();
 parts.first_name=words.shift()||'';
 if(words.length===2)[parts.middle_name,parts.last_name]=words;else parts.last_name=words.join(' ');
 return parts;
}
// Where each form lists its people, one record per person.
const PEOPLE_GROUP={cf285:'q6a.people',ccfrm604:'p2.identity'};
export const peopleCapacity=(formId,map)=>1+Math.max(-1,...map.bindings.filter(b=>b.groupId===PEOPLE_GROUP[formId]).map(b=>b.row));
/** Put the people the owner chose on the form, one record each. Only answers written here are replaced or cleared; anything the owner typed stays. */
export function setApplicationPeople(data,state,map,names){
 const candidates=applicationPeople(state),order=name=>{const i=candidates.findIndex(c=>c.name===name);return i<0?candidates.length:i;};
 const people=[...new Set(names)].sort((a,b)=>order(a)-order(b)).slice(0,peopleCapacity(data.formId,map)),home=state.household?.configured?state.household:{},sheet=householdSheet(state);
 const put=(groupId,row,field,value,from)=>{
  if(!map.bindings.some(b=>b.groupId===groupId&&b.row===row&&b.field===field))return;
  const old=data.answers.find(a=>a.groupId===groupId&&a.row===row&&a.field===field);
  if(old&&!old.chosenPerson&&old.status==='answered')return;
  if(!value){if(old?.chosenPerson&&old.status==='answered')reviseAnswer(data,{groupId,row,field,status:'unknown'}).chosenPerson=true;return;}
  if(old?.status==='answered'&&old.value===value)return;
  const group=data.groups.find(g=>g.groupId===groupId);if(group?.status!=='applicable'||group.rowCount<=row)reviseGroup(data,groupId,'applicable',Math.max(group?.rowCount||0,row+1));
  const answer=reviseAnswer(data,{groupId,row,field,status:'answered',value,sourceIds:['chosen-person']});answer.chosenPerson=true;if(from?.length)answer.from=from;
 };
 const nameParts=(groupId,row,name,prefix='')=>{for(const [part,value] of Object.entries(name?proposeNameParts(name):{first_name:'',middle_name:'',last_name:'',suffix:''}))put(groupId,row,prefix?prefix+part.replace('_name',''):part,value);};
 for(let row=0;row<peopleCapacity(data.formId,map);row++){
  const name=people[row];
  // A birth date or relationship is proposed only where a household list in the documents states it for this person.
  const listed=name?listedDetails(state,name):{},born=listed.date_of_birth?formDate(listed.date_of_birth):'';
  if(data.formId==='cf285'){put('q6a.people',row,'name',name);put('q6a.people',row,'date_of_birth',born,listed.files);put('q6a.people',row,'relationship',listed.relationship,listed.files);}
  else{nameParts('p2.identity',row,name);put('p2.address',row,'date_of_birth',born,listed.files);for(const [field,key] of [['home_address','home_address'],['city','home_city'],['state','home_state'],['zip','home_zip']])put('p2.address',row,field,name?home[key]:'',['your household details']);for(const [field,key] of [['mail_address','address'],['mail_city','city'],['mail_state','state'],['mail_zip','zip']])put('p2.address',row,field,name?sheet.mailing?.[key]:'',sheet.files);}
 }
 if(data.formId==='ccfrm604'){
  nameParts('p1.contact',0,people[0]);
  // An income record names its person only when the owner chose that person for this application.
  (data.prefillJobs||[]).forEach((key,row)=>{const person=JSON.parse(key)[0];nameParts('p7.income',row,people.includes(person)?person:'','person_');});
 }
 data.people=people;return people;
}
// Reuse confirmed evidence only where the field has the same meaning. Never
// promote a payment to a monthly total or infer name parts/household membership.
// People and name parts are added only by setApplicationPeople, from the owner's own choice.
export function prefillApplication(data,state,map){
 const facts=state.facts.filter(f=>usable(f)&&f.value!==undefined&&String(f.value).trim()&&(!f.documentId||state.docs.some(d=>d.id===f.documentId&&!d.historical&&!d.duplicateOf)));
 const ref=sourceRef;
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
  if(unique.length!==1){if(old?.autoPrefilled&&!old.from&&old.status==='answered'){reviseAnswer(data,{groupId,row,field,status:'unknown'}).autoPrefilled=true;}return;}
  const sources=[...new Map(candidates.flatMap(c=>c.facts).map(f=>[f.id,f])).values()],refs=sources.map(ref),value=typeof candidates[0].value==='boolean'?candidates[0].value:unique[0];
  if(old?.value===value&&JSON.stringify(old.sourceRefs)===JSON.stringify(refs))return;
  if(!group)reviseGroup(data,groupId,'applicable',row+1);
  else if(group.rowCount<=row)reviseGroup(data,groupId,'applicable',row+1);
  const answer=reviseAnswer(data,{groupId,row,field,status:'answered',value,sourceIds:sources.map(f=>f.id),sourceRefs:refs});answer.autoPrefilled=true;count++;
 };
 const byKey=(fs,key)=>fs.filter(f=>f.fieldKey===key).map(f=>({value:f.value,facts:[f]}));
 // A reader gives "unknown" when a document does not say how often. That is not an answer to write on the form.
 const statedOften=(fs,key)=>byKey(fs,key).filter(c=>c.value!=='unknown');
 // A contact detail from the owner's own household list. It gives way to a confirmed document detail for the same answer.
 const sheet=householdSheet(state);
 const propose=(groupId,row,field,value)=>{
  if(!map.bindings.some(b=>b.groupId===groupId&&b.row===row&&b.field===field))return;
  const old=data.answers.find(a=>a.groupId===groupId&&a.row===row&&a.field===field),group=data.groups.find(g=>g.groupId===groupId);
  if((old&&!(old.autoPrefilled&&(old.from||old.status!=='answered')))||(group&&group.status!=='applicable'))return;
  if(!value){if(old?.status==='answered')reviseAnswer(data,{groupId,row,field,status:'unknown'}).autoPrefilled=true;return;}
  if(old?.status==='answered'&&old.value===value)return;
  if(!group||group.rowCount<=row)reviseGroup(data,groupId,'applicable',row+1);
  const answer=reviseAnswer(data,{groupId,row,field,status:'answered',value,sourceIds:['household-list']});answer.autoPrefilled=true;answer.from=sheet.files;count++;
 };
 // A value a document gives on its own labelled line, such as "Hourly rate: $28.00".
 const stated=(doc,label)=>{for(const page of doc.pages||[])for(const line of String(page.text||'').split('\n')){const found=line.match(new RegExp('^\\s*(?:'+label+')\\s*:\\s*(.+?)\\s*$','i'));if(found)return found[1];}return '';};
 if(data.formId==='ccfrm604')propose('p1.contact',0,'email',sheet.email);
 if(data.formId==='cf285'){
  put('q1.contact',0,'name',personNames.map(name=>({value:name,facts:contactFacts.filter(f=>(f.fieldKey==='person'?String(f.value):f.person)===name)})));
  for(const key of ['home_address','home_city','home_state','home_zip','mailing_address','mailing_city','mailing_state','mailing_zip','other_names','spoken_language','written_language']){
   if(personNames.length===1)put('q1.contact',0,key,byKey(contactFacts,key));
  }
  propose('q1.contact',0,'other_names',sheet.other_names);
  for(const [field,key] of [['mailing_address','address'],['mailing_city','city'],['mailing_state','state'],['mailing_zip','zip']])propose('q1.contact',0,field,sheet.mailing?.[key]);
 }
 // Group earnings by confirmed person and employer, rather than by PDF. Two
 // pay statements for one job should not produce two employment rows.
 const jobs=new Map(),statements=new Map();
 for(const doc of state.docs.filter(d=>d.kind==='paystub'&&!d.historical&&!d.duplicateOf)){
  const fs=facts.filter(f=>f.documentId===doc.id),names=byKey(fs,'person'),issuers=byKey(fs,'issuer');
  if(names.length!==1||issuers.length!==1)continue;
  const key=JSON.stringify([names[0].value,issuers[0].value]);if(!jobs.has(key)){jobs.set(key,[]);statements.set(key,[]);}jobs.get(key).push(...fs);statements.get(key).push(doc);
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
   // What the statement says on a labelled line of its own: the employer's phone, the hourly rate and the weekly hours.
   // The employer's address is left out: the printed box holds one short line, and a longer value is cut off by viewers.
   const said=(label,shape=/.+/)=>(statements.get(key)||[]).map(doc=>({value:stated(doc,label).match(shape)?.[1]??'',facts:fs.filter(f=>f.documentId===doc.id&&(f.fieldKey==='person'||f.fieldKey==='issuer'))})).filter(c=>c.value);
   put(groupId,row,'person',byKey(fs,'person'));
   put(groupId,row,'employer_name_address',byKey(fs,'issuer'));
   put(groupId,row,'employer_phone',said('Employer phone|Employer telephone',/^(\+?[\d()][\d() .-]{6,}\d)$/));
   put(groupId,row,'hourly_rate',said('Hourly rate|Rate of pay|Pay rate',/^\$?\s*(\d[\d,]*(?:\.\d{1,2})?)/));
   put(groupId,row,'hours_week',said('Average hours per week|Hours per week|Weekly hours',/^(\d{1,3}(?:\.\d{1,2})?)\b/));
   put(groupId,row,'frequency',statedOften(fs,'pay_frequency'));
   // A statement that says it is monthly states the month's gross pay. Any other pay period is left for the owner to total.
   const often=byKey(fs,'pay_frequency');
   put(groupId,row,'gross_received_this_month',often.length&&often.every(c=>c.value==='monthly')?byKey(fs,'gross_pay'):[]);
  }else{
   // In this form the employment entry has a source type and payment period.
   // Missing/ambiguous frequency or amount stays unanswered.
   const frequency=byKey(fs,'pay_frequency').map(c=>({...c,value:({weekly:'Weekly',biweekly:'Every 2 weeks',semimonthly:'Twice a month',monthly:'Monthly','one-time':'One-time payment'})[c.value]})).filter(c=>c.value);
   const choices=map.bindings.filter(b=>b.groupId===groupId&&b.field==='frequency').map(b=>b.optionValue);
   const compatible=frequency.filter(c=>choices.includes(c.value));
   put(groupId,row,'income_name',byKey(fs,'issuer'));
   put(groupId,row,'frequency',compatible);
   put(groupId,row,'amount',compatible.length&&new Set(compatible.map(c=>c.value)).size===1?byKey(fs,'gross_pay').map(c=>({...c,facts:[...c.facts,...compatible.flatMap(x=>x.facts)]})):[]);
  }
 });
 // A listed job answers the yes/no question above the table. It is never answered No from the absence of a statement.
 const earners=[...jobs.values()].flat().filter(f=>f.fieldKey==='person');
 put(groupId,0,data.formId==='cf285'?'has_income':'household_has_income',earners.length?[{value:true,facts:earners}]:[]);
 if(data.formId!=='cf285')return count;
 const current=kind=>state.docs.filter(d=>d.kind===kind&&!d.historical&&!d.duplicateOf),of=doc=>facts.filter(f=>f.documentId===doc.id);
 const basis=fs=>fs.filter(f=>f.fieldKey==='person'||f.fieldKey==='issuer');
 // A charge is monthly when the document says so, or when the period it covers is one month long.
 const howOften=fs=>{
  const stated=statedOften(fs,'expense_frequency'),start=fs.find(f=>f.fieldKey==='period_start'),end=fs.find(f=>f.fieldKey==='period_end');if(stated.length||!start||!end)return stated;
  const days=(Date.parse(end.value+'T00:00:00Z')-Date.parse(start.value+'T00:00:00Z'))/86400000+1;return days>=28&&days<=31?[{value:'monthly',facts:[start,end]}]:[];
 };
 // Each printed table keeps a record in the same row once it is placed there, so a later import does not shift the answers.
 const rows=(slot,found,groupId)=>{data[slot]??=[];for(const key of found.keys())if(!data[slot].includes(key))data[slot].push(key);const room=1+Math.max(-1,...map.bindings.filter(b=>b.groupId===groupId).map(b=>b.row));return data[slot].slice(0,room).map(key=>(found.get(key)||[]).flat());};
 // One record per person and issuer. A document that names its person but not its issuer still counts; its issuer box stays empty.
 const named=kind=>{const found=new Map();for(const doc of current(kind)){const fs=of(doc);if(byKey(fs,'person').length!==1||byKey(fs,'issuer').length>1)continue;const key=JSON.stringify([byKey(fs,'person')[0].value,byKey(fs,'issuer')[0]?.value||'']);if(!found.has(key))found.set(key,[]);found.get(key).push(fs);}return found;};
 // Income that is not from a job: an award letter gives who gets it, from where, how much and how often.
 const awards=named('income_award');
 rows('prefillAwards',awards,'q7.unearned').forEach((fs,row)=>{
  put('q7.unearned',row,'person',byKey(fs,'person'));put('q7.unearned',row,'source',byKey(fs,'issuer'));
  put('q7.unearned',row,'amount',byKey(fs,'award_amount'));put('q7.unearned',row,'frequency',statedOften(fs,'pay_frequency'));
 });
 put('q7.unearned',0,'has_income',awards.size?[{value:true,facts:basis([...awards.values()].flat(2))}]:[]);
 // Medical costs count on this form only for a person aged 60 or older, or disabled. A statement is used when a household list gives the patient's birth date and it shows 60 or older.
 const sixty=name=>{const born=listedDetails(state,name).date_of_birth,today=localToday();return !!born&&Number(today.slice(0,4))-Number(born.slice(0,4))-(today.slice(5)<born.slice(5)?1:0)>=60;};
 const bills=new Map([...named('medical')].filter(([key])=>sixty(JSON.parse(key)[0])));
 rows('prefillMedical',bills,'q12.medical').forEach((fs,row)=>{
  put('q12.medical',row,'person',byKey(fs,'person'));put('q12.medical',row,'amount',byKey(fs,'patient_responsibility'));
  put('q12.medical',row,'frequency',howOften(fs));put('q12.medical',row,'expense_type',byKey(fs,'service_description'));
 });
 put('q12.medical',0,'has_expenses',bills.size?[{value:true,facts:basis([...bills.values()].flat(2))}]:[]);
 // Care costs: one record per child and provider. The child is the one the invoice names; an invoice naming none or several is left out.
 const care=new Map();
 for(const doc of current('childcare')){
  const fs=of(doc),children=doc.dependants||[];if(byKey(fs,'issuer').length!==1||children.length!==1)continue;
  const key=JSON.stringify([children[0].name,byKey(fs,'issuer')[0].value]);if(!care.has(key))care.set(key,[]);care.get(key).push(fs);
 }
 data.prefillCare??=[];
 for(const key of care.keys())if(!data.prefillCare.includes(key))data.prefillCare.push(key);
 const careRows=1+Math.max(-1,...map.bindings.filter(b=>b.groupId==='q9.care').map(b=>b.row));
 data.prefillCare.forEach((key,row)=>{
  if(row>=careRows)return;
  const sets=care.get(key)||[],all=sets.flat();
  put('q9.care',row,'care_recipient',sets.length?[{value:JSON.parse(key)[0],facts:basis(all)}]:[]);
  put('q9.care',row,'provider_name_address',byKey(all,'issuer'));
  put('q9.care',row,'amount_paid',byKey(all,'amount_paid'));
  put('q9.care',row,'frequency',sets.flatMap(howOften));
 });
 put('q9.care',0,'has_care_cost',care.size?[{value:true,facts:basis([...care.values()].flat(2))}]:[]);
 // Housing costs: a rent receipt or mortgage statement answers the first printed row; a utility bill answers the row its service lines name.
 const text=doc=>(doc.pages||[]).map(p=>p.text||'').join('\n'),housing=[];
 const row=(n,docs,amount)=>{
  const sets=docs.map(of).filter(fs=>fs.length),all=sets.flat();if(sets.length)housing.push(...basis(all));
  put('q11.housing',n,'owed',sets.length?[{value:true,facts:basis(all)}]:[]);
  put('q11.housing',n,'payer',byKey(all,'person'));
  if(amount)put('q11.housing',n,'amount_owed',amount(all));
  put('q11.housing',n,'frequency',sets.flatMap(howOften));
 };
 row(0,[...current('rent'),...current('mortgage')],fs=>[...byKey(fs,'rent_amount'),...byKey(fs,'mortgage_payment')]);
 for(const [n,service] of UTILITY_ROWS)row(n,current('utility').filter(doc=>service.test(text(doc))));
 put('q11.housing',0,'responsible_for_expenses',housing.length?[{value:true,facts:housing}]:[]);
 return count;
}
// The printed row of CalFresh question 11 that a utility bill belongs to, by the services its lines name.
const UTILITY_ROWS=[[2,/\b(?:electric(?:ity)?|natural gas|gas service|kwh|therms?|propane|heating oil|firewood)\b/i],[3,/\b(?:telephone|phone service|wireless service|cell(?:ular)? (?:phone|service)|mobile (?:phone|service))\b/i],[5,/\b(?:water|sewer|sewage|garbage|trash)\b/i]];
// Kinds of document each application has a section for.
const FORM_KINDS={cf285:['paystub','childcare','rent','mortgage','utility','income_award','medical'],ccfrm604:['paystub']};
/** One entry per document the owner added: the sections it filled on this application, or why it filled none. */
export function documentUse(data,state){
 const filled=new Map(),lists=new Set(householdLists(state).map(p=>p.file));
 for(const a of data.answers)if(a.status==='answered')for(const r of a.sourceRefs||[])if(r.documentId){if(!filled.has(r.documentId))filled.set(r.documentId,new Set());filled.get(r.documentId).add(a.groupId);}
 return state.docs.filter(d=>!d.demoSource).map(doc=>{
  const read=state.facts.filter(f=>f.documentId===doc.id&&!f.superseded&&f.value!==null),groups=[...filled.get(doc.id)||[]];
  const note=groups.length?'':doc.duplicateOf?'An identical copy is already in use.':doc.historical?'It is in History, so its details are not current.':lists.has(doc.filename)?'It lists household members. They are offered under People in this application.':doc.kind==='unknown'||!read.length?'No details were read from it.':read.some(f=>f.doctorBlocked)?'A check in Review paused its details. Open Review to see why.':!read.some(usable)?'Its details are not confirmed yet. Confirm them in Review.':!FORM_KINDS[data.formId].includes(doc.kind)?'This application has no section for this kind of document yet.':'Its details did not give one clear answer. Enter them below.';
  return {file:doc.filename,groups,note};
 });
}
/**
 * What the answers put on the form, in form order: one section per part of the form with its PDF pages, one line per
 * record, and where each line came from. Answers that will not reach the PDF are listed apart, each with the reason.
 * `written` narrows the result to boxes a finished draft holds.
 */
export function filledSummary(data,state,inventory,map,written){
 const sections=[],unplaced=[],pages=new Set();
 const origin=a=>[...(a.sourceRefs||[]).map(r=>r.documentId?state.docs.find(d=>d.id===r.documentId)?.filename||'a document':'your household details'),...(a.from||[]),...(a.chosenPerson&&!a.from?.length?['the people you chose']:[]),...(a.sourceIds||[]).includes('owner-entry')?['what you typed']:[],...(a.sourceIds||[]).includes('fictional-demo-questionnaire')?['the demo questionnaire']:[]];
 for(const g of inventory.groups){
  const group=data.groups.find(x=>x.groupId===g.id),bound=map.bindings.filter(b=>b.groupId===g.id),order=key=>g.fields.findIndex(f=>f.key===key);
  // An answer asked once above a table, such as the Yes box of a section, is bound on the first record only.
  const once=field=>bound.some(b=>b.row>0)&&bound.filter(b=>b.field===field).every(b=>b.row===0);
  const section={groupId:g.id,label:g.label,pages:[],boxes:0,records:[]},records=new Map();
  for(const a of data.answers.filter(a=>a.groupId===g.id&&a.status==='answered').sort((a,b)=>a.row-b.row||order(a.field)-order(b.field))){
   const boxes=bound.filter(b=>b.row===a.row&&b.field===a.field&&(b.optionValue===undefined||b.optionValue===a.value));
   const item={label:fieldLabel(g.id,a.field,g.fields.find(f=>f.key===a.field)?.label),value:typeof a.value==='boolean'?(a.value?'Yes':'No'):String(a.value)};
   const why=group?.status!=='applicable'||a.row>=group.rowCount?'Its section is set to be answered on the official form.':group.rowCount>g.printedCapacity?'The form has no room for this many records.':!boxes.length?'The app cannot write this box yet.':written&&!written.has(a.groupId+'|'+a.row+'|'+a.field)?'The text does not fit the box.':'';
   if(why){unplaced.push({section:g.label,...item,why});continue;}
   const key=once(a.field)?'once':a.row;
   if(!records.has(key))records.set(key,{label:key==='once'||g.printedCapacity<2?'':recordLabel(g.id,a.row),items:[],from:[]});
   const record=records.get(key);record.items.push(item);if(key!=='once')for(const source of origin(a))if(!record.from.includes(source))record.from.push(source);
   section.boxes++;for(const b of boxes){pages.add(b.page);if(!section.pages.includes(b.page))section.pages.push(b.page);}
  }
  if(!section.boxes)continue;
  section.records=[...records.entries()].sort(([a],[b])=>(a==='once'?-1:a)-(b==='once'?-1:b)).map(([,record])=>record);section.pages.sort((a,b)=>a-b);sections.push(section);
 }
 return {boxes:sections.reduce((n,s)=>n+s.boxes,0),pages:[...pages].sort((a,b)=>a-b),sections,unplaced};
}
/** What is left for the owner, from a form plan or a finished draft: sections with answers still open, sections not started, and the parts only the owner may complete. */
export function remainingSummary(missing,manualActions,inventory,map){
 const open=[],untouched=[];
 for(const g of inventory.groups){
  const mine=missing.filter(m=>m.groupId===g.id);if(!mine.length)continue;
  if(mine.some(m=>m.field===undefined)){untouched.push(g.label);continue;}
  // The form prints some boxes on certain records only: a Yes box once above a table, no relationship box for the applicant, no amount box for a fixed allowance. Where a record has no such box, nothing is left to answer.
  const boxes=field=>map.bindings.filter(b=>b.groupId===g.id&&b.field===field),asked=mine.filter(m=>!boxes(m.field).length||boxes(m.field).some(b=>b.row===m.row));
  if(asked.length)open.push({label:g.label,count:asked.length,fields:[...new Set(asked.map(m=>fieldLabel(g.id,m.field,g.fields.find(f=>f.key===m.field)?.label)))]});
 }
 return {answers:open.reduce((n,o)=>n+o.count,0),open,untouched,manual:manualActions.map(m=>({page:m.page,text:m.text}))};
}
const listed=words=>words.length<2?words.join(''):words.slice(0,-1).join(', ')+' and '+words.at(-1);
export const pageList=pages=>(pages.length===1?'PDF page ':'PDF pages ')+listed(pages.map(String));
/** The two summaries as plain text, for the downloaded package. */
export function summaryText(filled,remaining){
 const lines=['WHAT WAS FILLED',filled.boxes?filled.boxes+' fields filled on '+pageList(filled.pages)+'.':'Nothing was filled.',''];
 for(const s of filled.sections){
  lines.push(pageList(s.pages)+' — '+s.label);
  for(const r of s.records)lines.push('  '+(r.label?r.label+': ':'')+r.items.map(i=>i.label+': '+i.value).join('; ')+(r.from.length?' (from '+listed(r.from)+')':''));
  lines.push('');
 }
 if(filled.unplaced.length)lines.push('ENTERED BUT NOT ON THE PDF',...filled.unplaced.map(u=>'  '+u.section+' — '+u.label+': '+u.value+'. '+u.why),'');
 lines.push('WHAT IS LEFT FOR YOU',...remaining.open.map(o=>'  '+o.label+': '+o.count+(o.count===1?' answer':' answers')+' left ('+o.fields.join(', ')+')'));
 if(remaining.untouched.length)lines.push('  Sections not started: '+remaining.untouched.join('; '));
 lines.push(...remaining.manual.map(m=>'  PDF page '+m.page+': '+m.text+' (complete by hand)'));
 return lines.join('\n')+'\n';
}
