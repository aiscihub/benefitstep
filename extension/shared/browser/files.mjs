import {LIMITS} from '../core/schema.mjs';
import {sha256} from '../core/crypto.mjs';
let pdfPromise;
export async function getPdfEngine(){
 if(!pdfPromise)pdfPromise=import(new URL('../../vendor/pdf.mjs',import.meta.url).href).then(mod=>{mod.GlobalWorkerOptions.workerSrc=new URL('../../vendor/pdf.worker.mjs',import.meta.url).href;return mod;}).catch(()=>{pdfPromise=null;throw new Error('PDF engine is not installed. Run npm install --ignore-scripts then npm run vendor and npm run build. Image import and the labeled walkthrough still work.');});
 return pdfPromise;
}
export async function pdfReady(){try{await getPdfEngine();return true;}catch{return false;}}
function joinedText(items){let out='',y=null;for(const i of items){if(!('str'in i))continue;const iy=i.transform?.[5];if(y!==null&&Math.abs(iy-y)>2)out+='\n';else if(out&&!out.endsWith('\n'))out+=' ';out+=i.str;y=iy;if(i.hasEOL){out+='\n';y=null;}}return out.trim();}
export async function loadDocument(file,{allowText=false}={}){
 if(file.size>LIMITS.fileBytes||file.size===0)throw new Error('Use a non-empty file below 8 MB (prototype import cap, not a guarantee of portal acceptance).');
 const bytes=new Uint8Array(await file.arrayBuffer());const hash=await sha256(bytes);const name=String(file.name||'document').replace(/[\u0000-\u001f]/g,'').slice(0,150);
 const isPdf=String.fromCharCode(...bytes.slice(0,5))==='%PDF-';
 const isPng=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
 const isJpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 let pages=[],mime='';
 if(isPdf){
  mime='application/pdf';const lib=await getPdfEngine();const job=lib.getDocument({data:bytes.slice(),isEvalSupported:false,enableXfa:false,disableAutoFetch:true,disableStream:true,useSystemFonts:true,stopAtErrors:true,standardFontDataUrl:new URL('../../vendor/standard_fonts/',import.meta.url).href,cMapUrl:new URL('../../vendor/cmaps/',import.meta.url).href,cMapPacked:true,wasmUrl:new URL('../../vendor/wasm/',import.meta.url).href});
  job.onPassword=()=>job.destroy();let pdf;
  try{pdf=await job.promise;if(pdf.numPages>LIMITS.pagesPerDocument)throw new Error('Maximum six pages per file in this prototype. Split a copy and keep the original.');
   for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n);const tc=await page.getTextContent();const text=joinedText(tc.items);const v=page.getViewport({scale:1});const scale=Math.min(2,1600/Math.max(v.width,v.height));const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d'),viewport,annotationMode:0}).promise;
    pages.push({page:n,text,preview:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height});canvas.width=canvas.height=0;page.cleanup();}
  }catch(e){if(e.name==='PasswordException')throw new Error('Encrypted PDF unsupported. Supply an owner-unlocked copy, not a password.');throw e;}finally{await job.destroy();}
 }else if(isPng||isJpg){mime=isPng?'image/png':'image/jpeg';const blob=new Blob([bytes],{type:mime});const bitmap=await createImageBitmap(blob);try{if(bitmap.width*bitmap.height>LIMITS.pixels)throw new Error('Image exceeds 24 megapixels; resize a copy locally.');const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);pages=[{page:1,text:'',preview:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height}];canvas.width=canvas.height=0;}finally{bitmap.close();}
 }else if(allowText&&name.endsWith('.txt')){mime='text/plain';pages=[{page:1,text:new TextDecoder('utf-8',{fatal:true}).decode(bytes),preview:'',width:0,height:0}];}
 else throw new Error('Only PDF, JPEG and PNG documents are accepted. SVG, Office documents and executable files are rejected.');
 return {id:crypto.randomUUID(),filename:name,hash,bytes,mime,pages,kind:'unknown',fields:[],warnings:[],reviewed:false,include:false,revision:0,method:'not-extracted'};
}
