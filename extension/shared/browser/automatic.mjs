import {extractByLabels,documentCues} from '../core/labels.mjs';
import {ALLOWED_FIELDS,EXPECTED,FIELD_DEFS,validateExtraction} from '../core/schema.mjs';
import {extractWithAI,modelStatus,lookAgain} from './ai.mjs';
export const RECOVERABLE_AI_ERRORS=new Set(['AI_TIMEOUT','AI_RUNTIME','AI_UNAVAILABLE','AI_SETUP_REQUIRED']);
const TEXT_READER='Automatic local text reader (not AI)',ASKED='Local text reader; on-device AI asked, nothing added';
// Who, from whom and when. The model is asked only when the labels leave one of these out, and may add only these,
// the period end and the address. It never adds an amount to a document the labels identified: tried on a utility
// bill, it offered one line item as the current charges.
const needed=kind=>[...new Set(['person','issuer','period_start',...EXPECTED[kind]])].filter(key=>ALLOWED_FIELDS[kind].includes(key)&&!FIELD_DEFS[key][1].includes('money'));
const fillable=kind=>[...needed(kind),'period_end','home_address','home_city','home_state','home_zip'];
const complete=read=>read.kind!=='unknown'&&needed(read.kind).every(key=>read.fields.some(f=>f.key===key));
// A file that names several document types stays unidentified; neither reader picks one.
const mixed=(read,pages)=>read.kind==='unknown'&&documentCues(pages.map(p=>p.text||'').join('\n')).length>1;
// A model that cannot find a detail sometimes answers with a filler word such as "unknown", copies a placeholder the
// page prints, such as "[not visible]", or repeats the question back. None of those is a value.
const FILLER=/^[\s\[(<"'“]*(?:unknown|n\/?a|none|null|nil|unavailable|unspecified|unreadable|illegible|missing|redacted|blank|empty|tbd|not\s+(?:visible|available|provided|stated|shown|listed|given|found|applicable|specified|known|legible|readable|printed|present)(?:\s+(?:on|in)\s+(?:the\s+)?(?:page|document|picture|image))?|no\s+(?:\w+\s+){0,2}(?:shown|listed|provided|given|found|visible|available|printed)|x{2,}|[-–—?.*_•·\s]+)[\s\])>"'”.]*$/i;
const ECHO=value=>/\b(?:person|recipient|addressee)\b/i.test(value)&&/\b(?:city|state|zip|address|addressed)\b/i.test(value);
/** True for an answer that stands in for a missing detail and names nothing. */
export const fillerValue=value=>FILLER.test(String(value??''))||ECHO(String(value??''));
// What each part of an address has to look like at the least: a ZIP is digits, a street address has a number or a box,
// a city and a state are short words.
const SHAPE={home_zip:v=>/^\d{5}(?:-\d{4})?$/.test(v),home_address:v=>/\d/.test(v)||/\b(?:p\.?\s*o\.?\s*box|general delivery)\b/i.test(v),home_city:v=>/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'’-]{1,39}$/.test(v),home_state:v=>/^[A-Za-z][A-Za-z .]{1,19}$/.test(v)};
/**
 * Takes fillers out of a model reading, so the detail stays open for the owner and no filler is offered for
 * confirmation. Covers the worded details: names, address parts and descriptions. An address part must also have
 * the shape of one, and cannot repeat the person or the issuer. Each one dropped leaves a note. Amounts and dates
 * are already refused unless they parse, and a frequency or support direction of "unknown" is one of the answers the
 * model is asked for.
 */
export function dropFillers(result){
 const worded=key=>FIELD_DEFS[key]?.[1]==='text',named=new Set(result.fields.filter(f=>f.key==='person'||f.key==='issuer').map(f=>String(f.value).trim().toLowerCase()));
 const bad=f=>{const value=String(f.value??'').trim();return worded(f.key)&&(fillerValue(value)||(SHAPE[f.key]?!SHAPE[f.key](value)||named.has(value.toLowerCase()):false));};
 const dropped=result.fields.filter(bad);if(!dropped.length)return result;
 return {...result,fields:result.fields.filter(f=>!bad(f)),warnings:[...result.warnings,...dropped.map(f=>`On-device AI gave no usable ${FIELD_DEFS[f.key][0].toLowerCase()} (“${String(f.value).slice(0,40)}”). It was left open.`)].slice(0,8)};
}
/** Labelled details are exact and repeatable, so they stay. The model only adds what the labels did not give. */
function fillGaps(read,ai){
 if(read.kind==='unknown')return {...ai,method:'On-device AI'};
 if(ai.kind!==read.kind)return {...read,warnings:[...read.warnings,ai.kind==='unknown'?'On-device AI did not recognise this document; only labelled details were read.':`On-device AI read this as a different document type (${ai.kind}); its details were not used.`],method:ASKED};
 const have=new Set(read.fields.map(f=>f.key)),added=ai.fields.filter(f=>!have.has(f.key)&&fillable(read.kind).includes(f.key)),about=w=>[...have].some(key=>new RegExp('\\b'+key+'\\b').test(w));
 return {...read,fields:[...read.fields,...added],warnings:[...read.warnings,...ai.warnings.filter(w=>!about(w))],method:added.length?'Local text reader + on-device AI':ASKED};
}
/** A street address the model gave as one line, with city, state and ZIP, is split into its parts. */
export function splitAddress(result){
 const whole=result.fields.find(f=>f.key==='home_address'),parts=whole&&String(whole.value).match(/^(.+?),\s*([^,]+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);if(!parts)return result;
 const have=new Set(result.fields.map(f=>f.key)),rest=[['home_city',parts[2].trim()],['home_state',parts[3].toUpperCase()],['home_zip',parts[4]]].filter(([key])=>!have.has(key)).map(([key,value])=>({...whole,key,value,sourceValue:value}));
 return {...result,fields:[...result.fields.map(f=>f===whole?{...f,value:parts[1].trim()}:f),...rest]};
}
// What a picture reading is asked about a second time when the first reading left it out.
const ASK_AGAIN=['home_address','home_city','home_state','home_zip','service_description'];
export const missingFromPicture=result=>result.kind==='unknown'?[]:ASK_AGAIN.filter(key=>ALLOWED_FIELDS[result.kind].includes(key)&&!result.fields.some(f=>f.key===key));
/** Adds what the second look found. Only details the first reading lacks and the document type allows are taken, and each passes the same checks as any other model answer. */
export function addSecondLook(result,found,pages){
 const page=pages.find(p=>!(p.text||'').trim())?.page||1,fields=missingFromPicture(result).filter(key=>found[key]).map(key=>({key,value:found[key],page,quote:found[key]}));
 return fields.length?{...result,fields:[...result.fields,...validateExtraction(JSON.stringify({kind:result.kind,fields,warnings:[]}),pages,'native-ai').fields]}:result;
}
// A picture reading is thin when it does not identify the document, leaves out an amount that kind of document is read for, or gives no date.
const DATES=['document_date','period_start','period_end','pay_date'];
export const thin=result=>result.kind==='unknown'||EXPECTED[result.kind].some(key=>!result.fields.some(f=>f.key===key))||!result.fields.some(f=>DATES.includes(f.key));
/** Two readings of one picture. The first stands; the second supplies only the details the first lacks, and only when both name the same kind of document. */
export function mergeReadings(first,second){
 if(first.kind==='unknown')return second;
 if(second.kind!==first.kind)return first;
 const have=new Set(first.fields.map(f=>f.key));return {...first,fields:[...first.fields,...second.fields.filter(f=>!have.has(f.key))]};
}
/** Explicit batch action; any fallback is local, labeled, and never confirms facts. */
export async function extractAutomatically(pages,{mode='auto',signal,factory=globalThis.LanguageModel,onStatus=()=>{},batchState={},timeoutMs}={}){
 if(signal?.aborted)throw new Error('Analysis cancelled.');
 const images=pages.some(p=>!p.text?.trim());
 const status=mode==='labels'||(mode==='auto'&&batchState.aiFailure)?'unavailable':await modelStatus(images,factory);
 if(signal?.aborted)throw new Error('Analysis cancelled.');
 const read=images||mode==='ai'?null:extractByLabels(pages);
 if(read&&status==='available'&&(complete(read)||mixed(read,pages)))return {...read,method:TEXT_READER,analysisState:'complete'};
 if(mode==='ai'||status==='available'){
  try{
   const reading=async limit=>dropFillers(await extractWithAI(pages,{approved:true,signal,factory,onStatus,timeoutMs:limit}));
   let result;
   // A picture has no text reader to fall back on. A reading usually takes under 20 seconds, so one that stalls is stopped early and tried again.
   try{result=await reading(images&&timeoutMs?Math.min(timeoutMs,40000):timeoutMs);}catch(error){if(!images||signal?.aborted||!['AI_TIMEOUT','AI_RUNTIME'].includes(error.code))throw error;onStatus('On-device AI did not finish. Reading this picture once more.');result=await reading(timeoutMs);}
   // The model sometimes returns only a name for a picture it reads fully the next time.
   if(images&&thin(result)){onStatus('Reading this picture a second time');try{result=mergeReadings(result,await reading(timeoutMs));}catch(error){if(signal?.aborted)throw error;}}
   result=splitAddress(result);
   if(images&&missingFromPicture(result).length){
    onStatus('Checking the address on the picture');
    try{result=dropFillers(splitAddress(addSecondLook(result,await lookAgain(pages,missingFromPicture(result),{signal,factory}),pages)));}catch(error){if(signal?.aborted)throw error;}
   }
   return {...(read?fillGaps(read,result):{...result,method:'On-device AI'}),analysisState:'complete'};
  }catch(error){
   if(signal?.aborted||mode==='ai'||!RECOVERABLE_AI_ERRORS.has(error.code))throw error;
   batchState.aiFailure=error.message;
   onStatus('Local AI could not finish. Using the local text reader for readable PDFs in this batch.');
  }
 }
 if(images)return {kind:'unknown',fields:[],warnings:[batchState.aiFailure||'This file includes a scanned page or photo.','Local text reading cannot read these images. Set up local AI and retry the batch.'],method:'Needs local image AI',analysisState:'needs-ai'};
 if(batchState.aiFailure)read.warnings.unshift('Local AI did not finish in this batch. These facts come from the limited local text reader, not AI.');
 return {...read,method:batchState.aiFailure?'Local text reader after AI failure (not AI)':TEXT_READER,analysisState:'complete'};
}
