import {extractByLabels} from '../core/labels.mjs';
import {extractWithAI,modelStatus} from './ai.mjs';
export const RECOVERABLE_AI_ERRORS=new Set(['AI_TIMEOUT','AI_RUNTIME','AI_UNAVAILABLE','AI_SETUP_REQUIRED']);
/** Explicit batch action; any fallback is local, labeled, and never confirms facts. */
export async function extractAutomatically(pages,{mode='auto',signal,factory=globalThis.LanguageModel,onStatus=()=>{},batchState={},timeoutMs}={}){
 if(signal?.aborted)throw new Error('Analysis cancelled.');
 const images=pages.some(p=>!p.text?.trim());
 const status=mode==='labels'||(mode==='auto'&&batchState.aiFailure)?'unavailable':await modelStatus(images,factory);
 if(signal?.aborted)throw new Error('Analysis cancelled.');
 if(mode==='ai'||status==='available'){
  try{
   const result=await extractWithAI(pages,{approved:true,signal,factory,onStatus,timeoutMs});
   return {...result,method:'On-device AI',analysisState:'complete'};
  }catch(error){
   if(signal?.aborted||mode==='ai'||!RECOVERABLE_AI_ERRORS.has(error.code))throw error;
   batchState.aiFailure=error.message;
   onStatus('Local AI could not finish. Using the local text reader for readable PDFs in this batch.');
  }
 }
 if(images)return {kind:'unknown',fields:[],warnings:[batchState.aiFailure||'This file includes a scanned page or photo.','Local text reading cannot read these images. Set up local AI and retry the batch.'],method:'Needs local image AI',analysisState:'needs-ai'};
 const result=extractByLabels(pages);
 if(batchState.aiFailure)result.warnings.unshift('Local AI did not finish in this batch. These facts come from the limited local text reader, not AI.');
 return {...result,method:batchState.aiFailure?'Local text reader after AI failure (not AI)':'Automatic local text reader (not AI)',analysisState:'complete'};
}
