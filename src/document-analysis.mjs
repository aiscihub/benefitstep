import {validateModel,scoreText} from './trained-classifier.mjs';
import {extractAutomatically} from '../shared/browser/automatic.mjs';

let modelPromise;
const cancelled=signal=>{if(signal?.aborted)throw new DOMException('Analysis cancelled.','AbortError');};
async function packagedModel(){
 if(!modelPromise)modelPromise=fetch(new URL('../models/public-type-model.json',import.meta.url)).then(response=>{
  if(!response.ok)throw Error('Packaged classifier unavailable.');
  return response.json();
 }).then(validateModel).catch(error=>{modelPromise=null;throw error;});
 return modelPromise;
}

/** Broad type suggestions are metadata, never extraction instructions or confirmed facts. */
export async function classifyPages(pages,{signal,loadModel=packagedModel}={}){
 cancelled(signal);
 if(!pages.length||pages.some(page=>!page.text?.trim()))return {label:'unknown',scores:[],reason:'unreadable_pages',status:'not_run',experimental:true};
 const model=await loadModel();cancelled(signal);
 const result=scoreText(model,pages.map(page=>page.text).join('\n'));
 return {...result,labels:[...model.labels],modelId:model.modelId,threshold:model.threshold,status:result.reason==='insufficient_text'||result.reason==='text_too_long'?'not_classified':'scored'};
}

/** One import action runs the independent classifier and existing field extractor. */
export async function analyzeDocument(pages,{classify=classifyPages,extract=extractAutomatically,...options}={}){
 cancelled(options.signal);
 let classification;
 try{classification=await classify(pages,{signal:options.signal});}
 catch(error){cancelled(options.signal);classification={label:'unknown',scores:[],reason:'model_unavailable',status:'unavailable',experimental:true};}
 cancelled(options.signal);
 let result;
 try{result=await extract(pages,options);}
 catch(error){cancelled(options.signal);result={kind:'unknown',fields:[],analysisState:'error',method:'Source available for manual review',error:error.message};}
 cancelled(options.signal);
 return {...result,classification};
}
