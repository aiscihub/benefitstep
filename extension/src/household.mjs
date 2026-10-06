import {FIELD_DEFS,normalizeValue,validDate} from '../shared/core/schema.mjs';
const normalized=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[.,]/g,'').replace(/\s+/g,' ').trim();
const stateCode=v=>normalized(v)==='california'?'CA':String(v||'').trim().toUpperCase();
export const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const days=(a,b)=>(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000;
export function saveHousehold(s,input){
 const p={};for(const key of ['name','home_address','home_city','home_state','home_zip'])p[key]=normalizeValue(key==='name'?'person':key,input[key]);
 if(!p.name)throw Error('Enter your name.');
 p.home_state=stateCode(p.home_state);if(p.home_state&&!/^[A-Z]{2}$/.test(p.home_state))throw Error('Use a two-letter state code, such as CA.');
 if(p.home_zip&&!/^\d{5}(?:-\d{4})?$/.test(p.home_zip))throw Error('Use a five-digit ZIP code, optionally followed by four digits.');
 p.members=String(input.members||'').split('\n').map(x=>normalizeValue('person',x)).filter(Boolean);if(p.members.length>20)throw Error('Enter at most 20 household names.');
 p.maxAgeDays=Number(input.maxAgeDays);if(!Number.isInteger(p.maxAgeDays)||p.maxAgeDays<1||p.maxAgeDays>3650)throw Error('Choose a recent-document window from 1 to 3650 days.');
 p.configured=true;
 // Drop only explicitly identified fictional source records and questionnaire answers.
 const demoIds=new Set(s.docs.filter(d=>d.demoSource).map(d=>d.id));s.docs=s.docs.filter(d=>!demoIds.has(d.id));s.facts=s.facts.filter(f=>!f.householdProfile&&!demoIds.has(f.documentId));
 for(const [key,data] of Object.entries(s.formAnswers))if(data.demoFixture)delete s.formAnswers[key];
 s.demo=false;s.household=p;s.revision++;s.reviewConfirmedRevision=null;
 for(const [key,value] of Object.entries({person:p.name,home_address:p.home_address,home_city:p.home_city,home_state:p.home_state,home_zip:p.home_zip}))if(value)s.facts.push({id:crypto.randomUUID(),fieldKey:key,label:FIELD_DEFS[key][0],value,person:p.name,period:'Current household details',group:'Your Information',origin:'owner_entry',householdProfile:true,revision:1,confirmedRevision:null});
 return p;
}
/** Names and addresses that current sources show for their recipient. They are only offered for the owner to choose; nothing is applied automatically. */
export function householdSuggestions(s){
 const names=new Map(),addresses=new Map();
 const note=(map,key,entry,file)=>{if(!map.has(key))map.set(key,{...entry,files:[]});const found=map.get(key);if(!found.files.includes(file))found.files.push(file);return found;};
 for(const doc of s.docs.filter(d=>!d.duplicateOf&&!d.historical&&!d.demoSource)){
  const get=key=>{const f=s.facts.find(f=>f.documentId===doc.id&&f.fieldKey===key&&!f.superseded);return f&&!f.conflict&&!f.deferred&&f.value?String(f.value):null;};
  const person=get('person'),street=get('home_address');
  if(person)note(names,normalized(person),{name:person,recipient:true},doc.filename).recipient=true;
  for(const d of doc.dependants||[])note(names,normalized(d.name),{name:d.name,recipient:false},doc.filename);
  if(street){const a={home_address:street,home_city:get('home_city'),home_state:get('home_state'),home_zip:get('home_zip')};note(addresses,normalized(Object.values(a).filter(Boolean).join(' ')),a,doc.filename);}
 }
 // People a document is addressed to come before a child or patient it only names; then the most frequent first.
 const order=map=>[...map.values()].sort((a,b)=>(b.recipient===true)-(a.recipient===true)||b.files.length-a.files.length);
 return {names:order(names),addresses:order(addresses)};
}
export function setSourceContext(s,docId,input){
 const doc=s.docs.find(d=>d.id===docId&&!d.duplicateOf&&!d.historical);if(!doc)throw Error('Choose a current source.');
 const keys=['person','home_address','home_city','home_state','home_zip','document_date','pay_date','period_start','period_end'];
 const prepared=keys.map(key=>{const raw=String(input[key]||'').trim(),value=raw?normalizeValue(key,raw):null;if(raw&&value===null)throw Error(`Enter a valid ${FIELD_DEFS[key][0]}; dates use YYYY-MM-DD.`);return {key,value};});
 for(const {key,value} of prepared){let f=s.facts.find(f=>f.documentId===docId&&f.fieldKey===key);if(!f&&value){f={id:crypto.randomUUID(),documentId:docId,fieldKey:key,label:FIELD_DEFS[key][0],group:doc.group,revision:0};s.facts.push(f);}if(f&&(f.value!==value||f.conflict||f.deferred)){f.value=value;f.origin='owner_entry';f.conflict=false;f.deferred=false;f.revision++;f.confirmedRevision=null;}}
 const fs=s.facts.filter(f=>f.documentId===docId),get=k=>fs.find(f=>f.fieldKey===k)?.value;
 doc.period=[get('period_start'),get('period_end')].filter(Boolean).join(' — ')||get('pay_date')||get('document_date')||'Period not identified';
 for(const f of fs){const person=get('person')||'Person not identified';if(f.person!==person||f.period!==doc.period){f.person=person;f.period=doc.period;f.revision++;f.confirmedRevision=null;}}
 s.revision++;s.reviewConfirmedRevision=null;
}
export function assessSource(s,doc,today=localToday()){
 const p=s.household||{},fs=s.facts.filter(f=>f.documentId===doc.id&&!f.superseded),get=k=>{const f=fs.find(f=>f.fieldKey===k);return f&&!f.conflict&&!f.deferred?f.value:null;},checks=[];
 const add=(code,status,title,detail)=>checks.push({code,status,title,detail});
 if(!p.configured){add('profile','needs_context','Enter your household details first','Add your name, household members and current address so this source can be compared with your preparation.');return {checks,usable:false};}
 const person=get('person'),names=[p.name,...p.members||[]];
 if(!person)add('person','needs_context','Recipient is missing or unclear','Read the recipient name on this document. Enter it from the source; do not use the issuer name.');
 else if(!names.some(n=>normalized(n)===normalized(person)))add('person','finding','Recipient does not match your household',`The document names ${person}; your listed household is ${names.join(', ')}. Correct a reading error or add the actual household member. Name variations require your review.`);
 else add('person','clear','Recipient matches a listed household name',`${person} matches your entered name list; confirm against the original.`);
 const address=get('home_address'),region=stateCode(get('home_state'));
 if(!address||!region)add('address','needs_context','Recipient address needs review','The recipient/service street address or state is missing. Enter the address shown on the source. An issuer address does not establish where your household lives.');
 else if(region!=='CA')add('address','finding','Source address is outside California',`The recipient/service address shows ${region}. This source cannot be used as current California-address evidence in this preparation.`);
 else if(p.home_state&&p.home_state!=='CA')add('address','finding','Your current address is outside California',`Your household address shows ${p.home_state}. Review your residence and source purpose before using this record.`);
 else if(!p.home_address||!p.home_state)add('address','needs_context','Enter your current address for comparison','The source shows California, but your current street address and state are needed to compare it.');
 else if(normalized(address)!==normalized(p.home_address)||['home_city','home_zip'].some(k=>get(k)&&p[k]&&normalized(get(k))!==normalized(p[k])))add('address','needs_context','Source address differs from your current address',`Source: ${[address,get('home_city'),region,get('home_zip')].filter(Boolean).join(', ')}. Current: ${[p.home_address,p.home_city,p.home_state,p.home_zip].filter(Boolean).join(', ')}. Check spelling, apartment details or a previous address before using this as current evidence.`);
 else add('address','clear','Source address matches your California address','The entered recipient street address and available city/ZIP match. This comparison is not proof of residency.');
 const dateKeys=['document_date','pay_date','period_start','period_end'];
 // A period that has started may end later this month, as on a rent receipt for the current month.
 const started=validDate(get('period_start'))&&get('period_start')<=today,future=dateKeys.find(k=>validDate(get(k))&&get(k)>today&&!(k==='period_end'&&started));
 const dateKey=doc.kind==='paystub'&&get('pay_date')?'pay_date':get('period_end')?'period_end':get('document_date')?'document_date':null,date=dateKey&&get(dateKey);
 if(future)add('date','finding','Source has a future date',`${FIELD_DEFS[future][0]} is ${get(future)}, after today (${today}). Check the reading and source dates before using current amounts.`);
 else if(get('period_start')&&get('period_end')&&get('period_start')>get('period_end'))add('date','finding','Source period dates are reversed',`Period starts ${get('period_start')} and ends ${get('period_end')}. Correct the dates from the original.`);
 else if(!validDate(date))add('date','needs_context','A complete source date is missing','Enter the payment date, period end or document date shown on the original. A year alone, an unreadable date or a due date does not establish recency.');
 else {
  const age=days(today,date),recentKinds=['paystub','utility','rent','mortgage','childcare','medical','support','self_employment','income_award'];
  if(recentKinds.includes(doc.kind)&&age>(p.maxAgeDays||90))add('date','finding','Unusable for current preparation: document is too old',`${FIELD_DEFS[dateKey][0]}: ${date} (${age} days before today, ${today}). Your recent-document window is ${p.maxAgeDays||90} days. Current amounts from this record are excluded. Add a recent record, or adjust the window to the period actually requested. This is a preparation setting, not an agency acceptance rule.`);
  else add('date','clear','Source date checked',`${FIELD_DEFS[dateKey][0]}: ${date}; today: ${today}. ${recentKinds.includes(doc.kind)?'Within your recent-document window.':'Historical notices and receipts are retained as dated records; no current-income freshness rule is applied.'}`);
 }
 return {checks,usable:checks.every(c=>c.status==='clear')};
}
