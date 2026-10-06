/** Closed vocabulary: the model cannot add eligibility decisions or official fields. */
export const KINDS = ['paystub','rent','mortgage','utility','childcare','support','medical','self_employment','income_award','county_request','application_receipt','upload_receipt','coverage_notice','unknown'];
export const SECTIONS = {paystub:'Income',rent:'Housing',mortgage:'Housing',utility:'Utilities',childcare:'Childcare',support:'Support',medical:'Medical',unknown:'Unsorted'};
export const FIELD_DEFS = {
  business_receipts:['Business gross receipts','money'], award_amount:['Income award amount','money'], program_stated:['Program stated','text'], request_item:['Requested item','text'], stated_deadline:['Deadline wording','text'], notice_reason:['Administrative notice wording','text'],
  home_address:['Home / service street address','text'], home_city:['Home / service city','text'], home_state:['Home / service state','text'], home_zip:['Home / service ZIP code','text'],
  person: ['Person named','text'], issuer:['Employer / issuer','text'],
  document_date:['Document date','date'], period_start:['Period start','date'], period_end:['Period end','date'],
  pay_date:['Payment date','date'], gross_pay:['Current gross pay','money'], net_pay:['Current take-home pay','money'],
  ytd_gross:['Year-to-date gross','money'], pay_frequency:['Pay frequency','frequency'],
  rent_amount:['Stated rent','money'], mortgage_payment:['Mortgage payment','money'],
  principal:['Principal component','money'], interest:['Interest component','money'], escrow:['Escrow component','money'],
  loan_balance:['Loan balance (not an expense)','money'], current_charges:['Current utility charges','money'],
  prior_balance:['Prior balance / credit','signed_money'], amount_due:['Statement amount due','money'],
  amount_billed:['Amount billed','money'], amount_paid:['Payment shown','money'],
  insurance_paid:['Insurance contribution','money'], patient_responsibility:['Patient responsibility','money'],
  support_direction:['Support direction','direction'], expense_frequency:['Expense frequency','frequency'],
  service_description:['Service description','text']
};
export const ALLOWED_FIELDS = {
  paystub:['person','issuer','document_date','period_start','period_end','pay_date','gross_pay','net_pay','ytd_gross','pay_frequency'],
  rent:['person','issuer','document_date','period_start','period_end','rent_amount','amount_paid','expense_frequency'],
  mortgage:['person','issuer','document_date','period_start','period_end','mortgage_payment','principal','interest','escrow','loan_balance'],
  utility:['person','issuer','document_date','period_start','period_end','current_charges','prior_balance','amount_due','amount_paid'],
  childcare:['person','issuer','document_date','period_start','period_end','amount_billed','amount_paid','expense_frequency','service_description'],
  support:['person','issuer','document_date','period_start','period_end','amount_paid','support_direction','expense_frequency'],
  medical:['person','issuer','document_date','period_start','period_end','amount_billed','insurance_paid','patient_responsibility','amount_paid','service_description'],
  self_employment:['person','issuer','period_start','period_end','business_receipts','amount_paid'],
  income_award:['person','issuer','document_date','period_start','period_end','award_amount','pay_frequency'],
  county_request:['person','issuer','document_date','period_start','period_end','program_stated','request_item','stated_deadline'],
  application_receipt:['person','issuer','document_date','program_stated'],
  upload_receipt:['person','issuer','document_date','program_stated'],
  coverage_notice:['person','issuer','document_date','program_stated','stated_deadline','notice_reason'],
  unknown:[]
};
// Household address fields must describe the recipient/service location, never the issuer.
for(const kind of KINDS.filter(k=>k!=='unknown'))ALLOWED_FIELDS[kind].push('home_address','home_city','home_state','home_zip');
export const EXPECTED = {paystub:['person','issuer','pay_date','gross_pay'],rent:['rent_amount'],mortgage:['mortgage_payment'],utility:['current_charges'],childcare:['amount_billed'],support:['amount_paid','support_direction'],medical:['patient_responsibility'],self_employment:['business_receipts'],income_award:['award_amount'],county_request:[],application_receipt:[],upload_receipt:[],coverage_notice:[],unknown:[]};
export const LIMITS = {fileBytes:8_000_000,totalBytes:48_000_000,documents:24,pagesPerDocument:6,pixels:24_000_000,modelChars:24000,fields:32,modelResponse:14000};
export function assertSafeString(s,max=400){if(typeof s!=='string'||s.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u202a-\u202e\u2066-\u2069]/.test(s))throw new Error('Invalid or overlong text.');return s;}
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
const MONTHS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MONTH='\\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const NUMERIC_DATE='\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}\\b',WRITTEN_DATE=MONTH+'\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b',WRITTEN_MONTH=MONTH+'\\.?,?\\s+\\d{4}\\b';
const isoDate=(y,m,d)=>{const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return validDate(s)?s:null;};
const monthNumber=name=>MONTHS.indexOf(name.slice(0,3).toLowerCase())+1;
/** Dates as US documents write them. Numeric dates are read month first; anything that is not a real calendar date stays unreadable. */
export function parseDate(raw){
  const s=String(raw??'').trim();let m;
  if(validDate(s))return s;
  if((m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)))return isoDate(m[3],+m[1],+m[2]);
  if((m=s.match(new RegExp('^('+MONTH+')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})$','i'))))return isoDate(m[3],monthNumber(m[1]),+m[2]);
  return null;
}
/** A whole calendar month ("October 2026", "2026-10", "10/2026") as its first and last day. */
export function monthSpan(raw){
  const s=String(raw??'').trim();let m,y,mo;
  if((m=s.match(new RegExp('^('+MONTH+')\\.?,?\\s+(\\d{4})$','i')))){mo=monthNumber(m[1]);y=+m[2];}
  else if((m=s.match(/^(\d{4})-(\d{2})$/))){y=+m[1];mo=+m[2];}
  else if((m=s.match(/^(\d{1,2})\/(\d{4})$/))){mo=+m[1];y=+m[2];}
  else return null;
  const first=isoDate(y,mo,1);return first?[first,isoDate(y,mo,new Date(Date.UTC(y,mo,0)).getUTCDate())]:null;
}
export const dateTokens=text=>String(text??'').match(new RegExp('\\b\\d{4}-\\d{2}-\\d{2}\\b|'+NUMERIC_DATE+'|'+WRITTEN_DATE,'gi'))||[];
/** The passage must show this date. A month alone can only support the first day of a period start or the last day of a period end. */
function showsDate(passage,value,key){
  if(dateTokens(passage).some(t=>parseDate(t)===value))return true;
  const end=key==='period_start'?0:key==='period_end'?1:null;
  return end!==null&&(passage.match(new RegExp(WRITTEN_MONTH+'|\\b\\d{4}-\\d{2}\\b(?!-)','gi'))||[]).some(t=>monthSpan(t)?.[end]===value);
}
const moneyTokens=passage=>passage.match(/\(?-?\$?\d[\d,]*(?:\.\d{1,2})?\)?/g)||[];
// Searching a whole page for an amount needs a token that is written as money; "01" inside a date is not $1.00.
const writtenAmounts=passage=>(passage.match(/\(?-?\$\s?\d[\d,]*(?:\.\d{1,2})?\)?|\(?-?\d[\d,]*\.\d{2}\)?/g)||[]).map(t=>t.replace(/\s/g,''));
const squash=s=>s.replace(/\s+/g,' ').trim();
const showsWords=(passage,value)=>new RegExp('(?:^|[^a-z0-9])'+squash(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:[^a-z0-9]|$)','i').test(squash(passage));
/** A quote has to point at one real line of the page. Spacing differences are ignored, and a value that appears on exactly one line can stand in for a quote the page does not contain. */
function locateLine(text,quote,shows){
  const lines=text.split('\n').map(l=>l.trim()).filter(l=>l&&l.length<=400),q=squash(quote);
  const quoted=q.length>2?lines.filter(l=>squash(l).includes(q)):[];
  if(quoted.length===1)return quoted[0];
  const showing=(quoted.length?quoted:lines).filter(shows);
  return showing.length===1?showing[0]:null;
}
export function moneyCents(value, signed=false){
  if(typeof value!=='string')return null;
  let s=value.trim();
  if(signed&&/^\(.+\)$/.test(s))s='-'+s.slice(1,-1);
  s=s.replace(/^(-?)\$/, '$1');
  if(s.includes(',')&&!/^-?\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(s))return null;
  s=s.replace(/,/g,'');
  if(!(signed?/^-?\d{1,9}(?:\.\d{1,2})?$/:/^\d{1,9}(?:\.\d{1,2})?$/).test(s))return null;
  const negative=s.startsWith('-');if(negative)s=s.slice(1);const [a,b='']=s.split('.');
  const cents=Number(a)*100+Number(b.padEnd(2,'0'));return negative?-cents:cents;
}
export function normalizeValue(key,raw){
  const def=FIELD_DEFS[key]; if(!def)return null;let s=String(raw??'').trim(); if(s.length>240)return null;
  if(def[1]==='money'||def[1]==='signed_money'){const c=moneyCents(s,def[1]==='signed_money');return c===null?null:(c/100).toFixed(2);}
  if(def[1]==='date')return parseDate(s)??(key==='period_start'?monthSpan(s)?.[0]:key==='period_end'?monthSpan(s)?.[1]:null)??null;
  if(def[1]==='frequency'){const m=s.toLowerCase().replace(/[ _]/g,'-');return ['weekly','biweekly','semimonthly','monthly','one-time','unknown'].includes(m)?m:null;}
  if(def[1]==='direction')return ['paid','received','unknown'].includes(s.toLowerCase())?s.toLowerCase():null;
  try{return assertSafeString(s,240)||null;}catch{return null;}
}
export const MODEL_SCHEMA={type:'object',additionalProperties:false,required:['kind','fields','warnings'],properties:{
  kind:{type:'string',enum:KINDS},
  fields:{type:'array',maxItems:32,items:{type:'object',additionalProperties:false,required:['key','value','page','quote'],properties:{key:{type:'string',enum:Object.keys(FIELD_DEFS)},value:{type:'string',maxLength:240},page:{type:'integer',minimum:1,maximum:6},quote:{type:'string',minLength:1,maxLength:400}}}},
  warnings:{type:'array',maxItems:8,items:{type:'string',maxLength:240}}
}};
function keysExactly(o,keys){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(o,k));}
export function validateExtraction(raw,pages,method='native-ai'){
  if(typeof raw==='string'){if(raw.length>LIMITS.modelResponse)throw new Error('Model output too large.');raw=JSON.parse(raw);}
  if(!keysExactly(raw,['kind','fields','warnings'])||!KINDS.includes(raw.kind)||!Array.isArray(raw.fields)||raw.fields.length>LIMITS.fields||!Array.isArray(raw.warnings)||raw.warnings.length>8)throw new Error('Unsupported extraction response.');
  const fields=[];const rejected=[];const seen=new Set();
  for(const f of raw.fields){
    if(!keysExactly(f,['key','value','page','quote'])||typeof f.value!=='string')throw new Error('Unexpected field property.');
    if(!ALLOWED_FIELDS[raw.kind].includes(f.key)){rejected.push(`Field ${String(f.key).slice(0,80)} is not supported for ${raw.kind}; it was not used. Review the source and enter a supported detail manually.`);continue;}
    if(!Number.isInteger(f.page)||f.page<1||f.page>pages.length){rejected.push(`${FIELD_DEFS[f.key][0]} references page ${String(f.page).slice(0,20)}, but this file has ${pages.length} page(s); it was not used.`);continue;}
    if(seen.has(f.key)){const prior=fields.find(v=>v.key===f.key);if(prior&&normalizeValue(f.key,f.value)===prior.value)continue;rejected.push('Conflicting repeated field: '+f.key+' — check the different values on the source before using this detail.');for(const v of fields)if(v.key===f.key)v.conflict=true;continue;}
    seen.add(f.key);assertSafeString(f.quote,400);const value=normalizeValue(f.key,f.value);
    if(value===null){rejected.push(`Unusable value for ${f.key} (${FIELD_DEFS[f.key][0]}) on page ${f.page}: received “${f.value.slice(0,80)}”; ${FIELD_DEFS[f.key][1]==='date'?'a complete date is required, written as YYYY-MM-DD or MM/DD/YYYY': ['money','signed_money'].includes(FIELD_DEFS[f.key][1])?'a valid USD amount is required; unreadable values are not zero':'the value is missing or invalid'}. View the source and correct this detail.`);continue;}
    const page=pages[f.page-1],type=FIELD_DEFS[f.key][1],money=['money','signed_money'].includes(type);
    const shows=(passage,tokens=moneyTokens)=>money?tokens(passage).some(t=>moneyCents(t,true)===moneyCents(value,true)):type==='date'?showsDate(passage,value,f.key):showsWords(passage,value);
    // A quote that is on the page stays, unless it is too short to show the amount or date it is cited for.
    const cited=!!page.text&&page.text.includes(f.quote),quote=!page.text||cited&&(!money&&type!=='date'||shows(f.quote))?f.quote:locateLine(page.text,f.quote,passage=>shows(passage,writtenAmounts))??(cited?f.quote:null);const exact=!!page.text&&quote!==null;
    if(page.text&&!exact){rejected.push('Source quote not found: '+f.key);continue;}
    // Text equality proves location, not semantic correctness. Image quotes are always unverified.
    if(exact&&money&&!shows(quote)){rejected.push('Amount is absent from the quoted passage: '+f.key);continue;}
    if(exact&&type==='date'&&!shows(quote)){rejected.push('Date normalization requires manual review: '+f.key);continue;}
    fields.push({...f,quote,value,sourceValue:value,sourceVerified:exact,provenance:exact?'text-quote':'image-proposed',confirmed:false,conflict:false,method});
  }
  const warnings=raw.warnings.map(x=>assertSafeString(x,240)).concat([...new Set(rejected)]);
  if(raw.kind==='unknown')warnings.push('Document type not established. No eligibility facts inferred.');
  if(fields.some(f=>!f.sourceVerified))warnings.push('Image-derived values require visual confirmation; quote accuracy is not machine-verified.');
  return {kind:raw.kind,fields,warnings};
}
export function fieldValue(doc,key,reviewedOnly=false){const f=doc.fields?.find(f=>f.key===key);return f&&(!reviewedOnly||f.confirmed&&!f.conflict)?f.value:null;}
export function editField(doc,key,value){const f=doc.fields.find(f=>f.key===key);if(!f)throw new Error('Unknown field');const v=normalizeValue(key,value);if(v===null)throw new Error('Use a valid value and YYYY-MM-DD for dates.');f.value=v;f.provenance=v===f.sourceValue?f.provenance:'owner-correction';f.confirmed=false;f.conflict=false;doc.reviewed=false;doc.include=false;doc.revision=(doc.revision||0)+1;}
