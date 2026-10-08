import {getPdfEngine} from '../shared/browser/files.mjs';
import {FORMS} from './form-adapter.mjs';
const assets=new Map();
export async function loadFormAssets(id){
 if(!Object.hasOwn(FORMS,id))throw Error('Unknown form');
 if(!assets.has(id))assets.set(id,(async()=>{
  const read=async(p,json=true)=>{const r=await fetch(new URL(p,import.meta.url));if(!r.ok)throw Error('Packaged form asset missing');return json?r.json():new Uint8Array(await r.arrayBuffer());};
  const [inventory,map,template,fontBytes]=await Promise.all([read(`../forms/inventory/${id}.json`),read(`../forms/maps/${id}.json`),read(`../forms/templates/${id}.pdf`,false),read('../vendor/pdf-writer/NotoSans-Regular.ttf',false)]);return {inventory,map,template,fontBytes};
 })().catch(e=>{assets.delete(id);throw e;}));return assets.get(id);
}
export function renderInWorker(payload,signal){return new Promise((resolve,reject)=>{
 const worker=new Worker(new URL('./form-worker.mjs',import.meta.url),{type:'module'});
 const cleanup=()=>{worker.terminate();signal?.removeEventListener('abort',abort);clearTimeout(timer);};
 const abort=()=>{cleanup();reject(new DOMException('Cancelled','AbortError'));};
 const timer=setTimeout(()=>{cleanup();reject(Error('PDF preparation timed out. Your answers are still available.'));},45000);
 if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
 worker.onerror=()=>{cleanup();reject(Error('Local PDF writer could not run. Your answers are still available.'));};
 worker.onmessage=event=>{cleanup();event.data.ok?resolve(event.data.result):reject(Error(event.data.message));};worker.postMessage(payload);
 });}
export async function previewPdf(bytes,container,signal){
 const lib=await getPdfEngine(),job=lib.getDocument({data:bytes.slice(),isEvalSupported:false,enableXfa:false,disableAutoFetch:true,disableStream:true,useSystemFonts:false,standardFontDataUrl:new URL('../vendor/standard_fonts/',import.meta.url).href,cMapUrl:new URL('../vendor/cmaps/',import.meta.url).href,cMapPacked:true,wasmUrl:new URL('../vendor/wasm/',import.meta.url).href});
 let task;const abort=()=>{task?.cancel();job.destroy();};signal?.addEventListener('abort',abort,{once:true});
 try{const pdf=await job.promise;for(let n=1;n<=pdf.numPages;n++){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');const page=await pdf.getPage(n),viewport=page.getViewport({scale:.8});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);canvas.setAttribute('aria-label',`Application page ${n} of ${pdf.numPages}`);canvas.className='official-form-page';task=page.render({canvas,canvasContext:canvas.getContext('2d'),viewport,annotationMode:lib.AnnotationMode.ENABLE});await task.promise;container.append(canvas);page.cleanup();}}
 finally{signal?.removeEventListener('abort',abort);await job.destroy();}
}
