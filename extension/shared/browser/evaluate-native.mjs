/** Run only with explicitly approved synthetic examples. Gold answers are NOT sent to the model. */
import {extractWithAI} from './ai.mjs';
export async function evaluateNative(rows,{approved=false,signal,onProgress=()=>{},factory=globalThis.LanguageModel}={}){
 if(!approved||!Array.isArray(rows)||rows.length>100||rows.some(r=>r.synthetic!==true||typeof r.text!=='string'))throw new Error('Approve a bounded synthetic test set first.');
 let tp=0,fp=0,fn=0,types=0;const items=[];
 for(let i=0;i<rows.length;i++){
  if(signal?.aborted)break;const row=rows[i],start=performance.now();let result,error;
  try{result=await extractWithAI([{page:1,text:row.text,preview:''}],{approved:true,signal,factory});}catch(e){error=e.message;}
  const gold=new Set(row.fields.map(f=>f.key+'='+f.value)),got=new Set((result?.fields||[]).map(f=>f.key+'='+f.value));
  for(const f of got)gold.has(f)?tp++:fp++;for(const f of gold)if(!got.has(f))fn++;if(result?.kind===row.kind)types++;
  items.push({id:row.id,kindCorrect:result?.kind===row.kind,fieldCount:got.size,missing:[...gold].filter(f=>!got.has(f)).length,extra:[...got].filter(f=>!gold.has(f)).length,latencyMs:Math.round(performance.now()-start),error:error||null});onProgress(i+1,rows.length);
 }
 return {mode:'native Chrome model on synthetic text',processed:items.length,correctTypes:types,tp,fp,fn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,items,limits:'This measures synthetic text only, not photographs, real documents, qualification, or authenticity.'};
}
