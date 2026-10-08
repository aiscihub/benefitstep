// The household record a preparation package carries, and reading one back in. The record lets a later renewal start
// from an earlier application without the app storing anything itself: the owner keeps the package and chooses it again.
import {unzipEntry} from '../shared/core/zip.mjs';
import {FIELD_DEFS,KINDS} from '../shared/core/schema.mjs';
import {householdLists,householdSheet} from './household.mjs';
import {FORMS} from './form-adapter.mjs';
export const RECORD_FORMAT='benefitstep-household-record',RECORD_VERSION=1;
/**
 * What preparation.json holds: the confirmed snapshot, the people a household list names, the kind of document each
 * detail came from, the application answers of the programs still selected, and the files exported with it.
 */
export function packageRecord(state,snapshot,files=[]){
 const {files:_listed,...contact}=householdSheet(state),used=new Set(snapshot.facts.map(f=>f.documentId).filter(Boolean));
 return {...snapshot,format:RECORD_FORMAT,recordVersion:RECORD_VERSION,purpose:state.renewal?.on?'renewal':'application',
  ...(state.renewal?.on?{renewal:{form:state.renewal.form,notice:{...state.renewal.notice}}}:{}),
  people:[...new Map(householdLists(state).map(p=>[p.name.toLowerCase(),{name:p.name,date_of_birth:p.date_of_birth,relationship:p.relationship}])).values()],
  contact,
  documents:state.docs.filter(d=>used.has(d.id)).map(d=>({id:d.id,filename:d.filename,kind:d.kind,period:d.period,sha256:d.hash,dependants:(d.dependants||[]).map(c=>c.name)})),
  applicationAnswers:Object.fromEntries(Object.entries(state.formAnswers).filter(([id])=>state.programs.has(FORMS[id]))),
  files};
}
const text=(v,max=400)=>typeof v==='string'||typeof v==='number'?String(v).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max):'';
// A package saved before records listed their documents: the kind is told from the details each document gave.
const inferDocuments=facts=>{
 const by=new Map();for(const f of facts)if(f.documentId){if(!by.has(f.documentId))by.set(f.documentId,[]);by.get(f.documentId).push(f);}
 const has=(fs,...keys)=>fs.some(f=>keys.includes(f.fieldKey));
 return [...by].map(([id,fs])=>({id,filename:'',kind:has(fs,'gross_pay')?'paystub':has(fs,'award_amount')?'income_award':has(fs,'rent_amount')?'rent':has(fs,'mortgage_payment')?'mortgage':has(fs,'patient_responsibility')?'medical':has(fs,'current_charges','amount_due')?'utility':fs[0].group==='Household Details'?'childcare':'unknown',period:fs[0].period,dependants:[]}));
};
/** A package record as plain, checked data. It comes from a file, so only known details are kept, each cut to a sane length, and everything else is ignored. */
export function readRecord(raw){
 const unreadable='This file is not a BenefitStep package record.';
 let r;try{r=typeof raw==='string'?JSON.parse(raw):raw;}catch{throw Error(unreadable);}
 if(!r||typeof r!=='object'||r.type!=='LOCAL_PREPARATION_NOT_SUBMITTED'||!Array.isArray(r.facts))throw Error(unreadable);
 if(r.recordVersion!==undefined&&(!Number.isInteger(r.recordVersion)||r.recordVersion>RECORD_VERSION))throw Error('This package was made by a newer version of BenefitStep. Update BenefitStep to read it.');
 if(r.facts.length>5000)throw Error('This package holds more details than BenefitStep can read.');
 const h=r.household&&typeof r.household==='object'?r.household:{},list=v=>Array.isArray(v)?v:[];
 return {
  savedAt:text(r.generatedAt,40),recordVersion:r.recordVersion||0,programs:list(r.programs).filter(p=>['CalFresh','Medi-Cal'].includes(p)),
  household:{name:text(h.name,240),home_address:text(h.home_address,240),home_city:text(h.home_city,120),home_state:text(h.home_state,2),home_zip:text(h.home_zip,10),members:list(h.members).slice(0,20).map(m=>text(m,240)).filter(Boolean)},
  people:list(r.people).slice(0,40).filter(p=>p&&typeof p==='object').map(p=>({name:text(p.name,240),date_of_birth:/^\d{4}-\d{2}-\d{2}$/.test(p.date_of_birth||'')?p.date_of_birth:'',relationship:text(p.relationship,60)})).filter(p=>p.name),
  ...(facts=>({facts,documents:Array.isArray(r.documents)?r.documents.filter(d=>d&&typeof d==='object').slice(0,200).map(d=>({id:text(d.id,60),filename:text(d.filename,150),kind:KINDS.includes(d.kind)?d.kind:'unknown',period:text(d.period,60),dependants:list(d.dependants).slice(0,10).map(n=>text(n,240)).filter(Boolean)})):inferDocuments(facts)}))(
   r.facts.filter(f=>f&&typeof f==='object'&&FIELD_DEFS[f.fieldKey]).map(f=>({fieldKey:f.fieldKey,value:text(f.value),person:text(f.person,240),period:text(f.period,60),group:text(f.group,60),documentId:text(f.documentId,60)})))
 };
}
/** Reads a package the owner chose: the ZIP as downloaded, or its preparation.json on its own. */
export async function readPackage(bytes){
 const json=bytes[0]===0x50&&bytes[1]===0x4b?await unzipEntry(bytes,'preparation.json',4_000_000):bytes;
 if(!json)throw Error('This ZIP has no preparation.json. Choose a package downloaded from BenefitStep.');
 if(json.length>4_000_000)throw Error('The record in this package is too large to read.');
 return readRecord(new TextDecoder().decode(json));
}
