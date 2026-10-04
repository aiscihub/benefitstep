import {loadFormAssets,renderInWorker,previewPdf} from './form-browser.mjs';
const $=s=>document.querySelector(s),select=$('#fixture');let epoch=0,controller=null,output=null,url=null;
for(const id of ['cf285','ccfrm604'])for(const scenario of ['one-person','multiple-people','no-income','multiple-income','conditional','declined','long-unicode','overflow']){const o=document.createElement('option');o.value=id+'-'+scenario;o.textContent=id.toUpperCase()+' · '+scenario;select.append(o);}
function clear(){epoch++;controller?.abort();controller=null;output=null;if(url)URL.revokeObjectURL(url);url=null;$('#preview').replaceChildren();$('#report').textContent='';$('#save').disabled=true;}
$('#generate').onclick=async()=>{clear();const token=epoch;controller=new AbortController();const signal=controller.signal;$('#status').textContent='Preparing fictional PDF locally…';
 try{const fixtureId=select.value,id=fixtureId.split('-')[0],assets=await loadFormAssets(id);const r=await fetch(new URL(`../forms/fixtures/${fixtureId}.json`,import.meta.url));if(!r.ok)throw Error('Fixture missing');const answers=await r.json();
 const result=await renderInWorker({...assets,answers,mode:'developer',fixtureId,fixtureHash:assets.map.developerFixtures[fixtureId]},signal);if(token!==epoch)return;
 output=result;$('#report').textContent=JSON.stringify(result.report,null,2);await previewPdf(result.bytes,$('#preview'),signal);if(token!==epoch)return;
 $('#status').textContent=`Fictional test preview ready: ${result.report.pageCount} original pages, ${result.report.written.length} entries, ${result.report.missing.length} unresolved items. Do not submit.`;$('#save').disabled=false;
 }catch(e){if(token===epoch)$('#status').textContent=e.message;}
};
$('#save').onclick=()=>{if(!output)return;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob([output.bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=select.value+'-TEST-ONLY.pdf';a.click();};
$('#stop').onclick=()=>{clear();$('#status').textContent='Cleared.';};select.onchange=()=>{clear();$('#status').textContent='';};window.addEventListener('pagehide',clear);
