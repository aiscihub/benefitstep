import {extractByLabels,documentCues} from '../core/labels.mjs';
import {ALLOWED_FIELDS,EXPECTED,FIELD_DEFS} from '../core/schema.mjs';
import {extractWithAI,modelStatus} from './ai.mjs';
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
/** Labelled details are exact and repeatable, so they stay. The model only adds what the labels did not give. */
function fillGaps(read,ai){
 if(read.kind==='unknown')return {...ai,method:'On-device AI'};
 if(ai.kind!==read.kind)return {...read,warnings:[...read.warnings,ai.kind==='unknown'?'On-device AI did not recognise this document; only labelled details were read.':`On-device AI read this as a different document type (${ai.kind}); its details were not used.`],method:ASKED};
 const have=new Set(read.fields.map(f=>f.key)),added=ai.fields.filter(f=>!have.has(f.key)&&fillable(read.kind).includes(f.key)),about=w=>[...have].some(key=>new RegExp('\\b'+key+'\\b').test(w));
 return {...read,fields:[...read.fields,...added],warnings:[...read.warnings,...ai.warnings.filter(w=>!about(w))],method:added.length?'Local text reader + on-device AI':ASKED};
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
   const result=await extractWithAI(pages,{approved:true,signal,factory,onStatus,timeoutMs});
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
