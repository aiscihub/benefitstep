import {SECTIONS,FIELD_DEFS,LIMITS} from './schema.mjs';
import {completeness,preliminaryCheck} from './screening.mjs';
import {sha256} from './crypto.mjs';
import {summaryPdf} from './pdf-summary.mjs';
import {zipStore} from './zip.mjs';
export async function makePackage(docs,profile,{approved=false,asOf=new Date().toISOString().slice(0,10),generatedAt=new Date().toISOString()}={}){
 if(!approved)throw new Error('Review the disclosure before exporting originals.');
 const chosen=docs.filter(d=>d.include);
 if(!chosen.length)throw new Error('Choose at least one reviewed document.');
 const records=[],entries=[];let total=0;
 for(let i=0;i<chosen.length;i++){
  const d=chosen[i];if(!d.reviewed||d.fields.some(f=>!f.confirmed||f.conflict))throw new Error('Unreviewed facts cannot be exported as reviewed.');
  if(d.duplicateOf||d.possibleDuplicateOf&&!d.duplicateResolved)throw new Error('Resolve duplicate evidence before export.');
  total+=d.bytes.length;if(total>LIMITS.totalBytes)throw new Error('Package exceeds prototype size cap.');
  const currentHash=await sha256(d.bytes);if(currentHash!==d.hash)throw new Error('Original bytes changed since import.');
  const ext=d.mime==='application/pdf'?'pdf':d.mime==='image/png'?'png':d.mime==='image/jpeg'?'jpg':'txt';
  const path=`originals/${String(i+1).padStart(2,'0')}-${d.kind}.${ext}`;
  entries.push({name:path,data:d.bytes});
  records.push({documentId:d.id,sha256:d.hash,exportPath:path,section:SECTIONS[d.kind],reviewed:true,method:d.method,issues:completeness(d),facts:d.fields.map(f=>({key:f.key,label:FIELD_DEFS[f.key][0],value:f.value,page:f.page,quote:f.quote,confirmed:f.confirmed,provenance:f.provenance,sourceVerified:f.sourceVerified}))});
 }
 const summary={format:'BEW-preparation-v1',generatedAt,screening:preliminaryCheck(profile,undefined,asOf),documents:records,checklist:[
 'Check the actual requested person, period and document type in BenefitsCal or your county notice.',
 'Review each original: names, identifiers and metadata remain in the unchanged files.',
 'Use the original files separately; the generated summary is not official proof.',
 'Resolve unreadable, missing or conflicting information, or ask the county about alternatives.',
 'Save the official upload receipt after you choose to submit; this app has not submitted anything.'
 ]};
 const pdf=summaryPdf(summary);entries.push({name:'preparation-summary.pdf',data:pdf},{name:'preparation.json',data:JSON.stringify(summary,null,2)},{name:'READ_BEFORE_SHARING.txt',data:'PRIVATE PREPARATION PACKAGE\nDo not upload the whole ZIP. Review the originals folder and use selected files through the official portal. This summary is not an official form, proof of eligibility, or evidence of submission. Originals have not been redacted or stripped of metadata. Do not delay an application while collecting every document.\n'});
 const manifest={format:'BEW-export-manifest-v1',generatedAt,files:await Promise.all(entries.map(async e=>({path:e.name,sha256:await sha256(typeof e.data==='string'?new TextEncoder().encode(e.data):e.data)})))};entries.push({name:'manifest.json',data:JSON.stringify(manifest,null,2)});
 return {zip:zipStore(entries),pdf,summary,manifest};
}
