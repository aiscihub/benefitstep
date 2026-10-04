/** Portable local inference for the versioned public-data text classifier.
 * It produces type suggestions only. It cannot extract or confirm facts.
 */
const STOP=new Set(['synthetic','fictional','sample','demo','fieldbench','scor','dataset','benchmark']);
export const FEATURE_VERSION='ascii-words-bigrams-fnv1a-v1';
export function tokens(text){return (text.toLowerCase().match(/[a-z]{2,32}/g)||[]).filter(w=>!STOP.has(w));}
export function hashToken(value,dimensions=8192){let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619)>>>0;return h%dimensions;}
export function validateModel(model){
 if(!model||model.schemaVersion!==1||model.featureVersion!==FEATURE_VERSION||model.dimensions!==8192||!Array.isArray(model.labels)||model.labels.join('|')!=='invoice_or_receipt|other_document|pay_statement')throw Error('Unsupported classifier model.');
 if(!Array.isArray(model.idf)||model.idf.length!==model.dimensions||!model.idf.every(v=>Number.isFinite(v)&&v>0)||!Array.isArray(model.weights)||model.weights.length!==model.labels.length||!model.weights.every(row=>Array.isArray(row)&&row.length===model.dimensions&&row.every(Number.isFinite))||!Array.isArray(model.bias)||model.bias.length!==model.labels.length||!model.bias.every(Number.isFinite))throw Error('Malformed classifier weights.');
 if(model.maxChars!==100000||model.minTokens!==12||!Number.isFinite(model.threshold)||model.threshold<.5||model.threshold>1)throw Error('Unsupported classifier limits.');
 return model;
}
export function features(text,model){
 const words=tokens(text),counts=new Map();
 const add=f=>{const index=hashToken(f,model.dimensions);counts.set(index,(counts.get(index)||0)+1);};
 for(let i=0;i<words.length;i++){add('w:'+words[i]);if(i>0)add('b:'+words[i-1]+'_'+words[i]);}
 let norm=0;const values=[];
 for(const [index,count]of counts){const value=(1+Math.log(count))*model.idf[index];values.push([index,value]);norm+=value*value;}
 norm=Math.sqrt(norm)||1;return {values:values.map(([i,v])=>[i,v/norm]),tokenCount:words.length};
}
export function scoreText(model,text){
 if(typeof text!=='string')throw Error('Provide document text only.');
 if(text.length>model.maxChars)return {label:'unknown',topLabel:null,score:null,scores:[],reason:'text_too_long',experimental:true};
 const {values,tokenCount}=features(text,model);
 const logits=model.weights.map((row,i)=>values.reduce((sum,[j,x])=>sum+row[j]*x,model.bias[i]));const largest=Math.max(...logits);const exps=logits.map(v=>Math.exp(v-largest)),sum=exps.reduce((a,b)=>a+b,0);const scores=exps.map(v=>v/sum),index=scores.indexOf(Math.max(...scores));
 const reason=tokenCount<model.minTokens?'insufficient_text':scores[index]<model.threshold?'below_threshold':'model_suggestion';
 return {label:reason==='model_suggestion'?model.labels[index]:'unknown',topLabel:model.labels[index],score:scores[index],scores,reason,tokenCount,experimental:true,modelId:model.modelId,scoresAreCalibrated:false};
}
