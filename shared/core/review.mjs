import {EXPECTED,fieldValue} from './schema.mjs';
export function reviewBlocker(doc,{allowMissing=false}={}){
 if(doc.duplicateOf)return 'Exact duplicate';
 if(doc.possibleDuplicateOf&&!doc.duplicateResolved)return 'Resolve possible duplicate';
 if(!doc.kind||doc.kind==='unknown')return 'Document type not identified';
 if(['processing','queued','needs-ai','error','cancelled'].includes(doc.analysisState))return 'Reading is unfinished';
 if(!doc.fields?.length)return 'No extracted facts';
 if(doc.fields.some(f=>f.conflict))return 'Resolve conflicting values';
 if(!allowMissing&&(EXPECTED[doc.kind]||[]).some(k=>!fieldValue(doc,k)))return 'Key information is missing';
 return '';
}
export function confirmDocument(doc,options={}){
 const reason=reviewBlocker(doc,options);if(reason)throw new Error(reason);
 for(const fact of doc.fields)fact.confirmed=true;
 doc.reviewed=true;doc.include=true;doc.reviewSelected=false;
}
export function confirmSelected(docs){
 const selected=docs.filter(d=>d.reviewSelected&&!d.reviewed);
 // Validate the whole selection before applying any confirmation.
 for(const doc of selected){const reason=reviewBlocker(doc);if(reason)throw new Error(`${doc.filename}: ${reason}`);}
 for(const doc of selected)confirmDocument(doc);
 return selected.length;
}
