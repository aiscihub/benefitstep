import type {Fact, Input} from './types.js';
import {assert} from './validation.js';
import {stableStringify} from './engine.js';
/** One UI confirmation operates on explicitly displayed fact ids/revisions. */
export function confirmFacts(input:Input,displayed:{id:string;revision:number}[]):Input {
 const m=new Map(displayed.map(x=>[x.id,x.revision]));assert(m.size===displayed.length,'Duplicate confirmation');
 for(const x of displayed){const f=input.facts.find(f=>f.id===x.id);assert(f&&f.revision===x.revision&&f.status==='known','Stale or unresolved confirmation')}
 return {...input,facts:input.facts.map(f=>m.has(f.id)?{...f,confirmedRevision:f.revision}:f)};
}
export function reviseFact(input:Input,id:string,update:Pick<Fact,'status'|'value'>):Input {
 assert(input.facts.some(f=>f.id===id),'Fact not found');
 return {...input,facts:input.facts.map(f=>{if(f.id!==id)return f;const next={...f,...update,revision:f.revision+1};delete next.confirmedRevision;if(update.status!=='known')delete next.value;return next})};
}
export function snapshot(input:Input,policyVersion:string,recordedAt:string) {
 return JSON.parse(JSON.stringify({schemaVersion:'1.0',recordedAt,asOf:input.asOf,policyVersion,selectedPrograms:input.selectedPrograms,people:input.people,facts:input.facts.filter(f=>f.status==='known'&&f.confirmedRevision===f.revision)}));
}
export function compareSnapshots(previous:ReturnType<typeof snapshot>,current:ReturnType<typeof snapshot>) {
 const old=new Map<string,Fact>(previous.facts.map((f:Fact)=>[`${f.subject}|${f.key}`,f]));
 const changes=current.facts.filter((f:Fact)=>stableStringify(old.get(`${f.subject}|${f.key}`))!==stableStringify(f)).map((f:Fact)=>({key:f.key,subject:f.subject,kind:old.has(`${f.subject}|${f.key}`)?'changed':'added'}));
 const currentKeys=new Set(current.facts.map((f:Fact)=>`${f.subject}|${f.key}`));
 for(const [key,f]of old)if(!currentKeys.has(key))changes.push({key:f.key,subject:f.subject,kind:'removed'});
 return {policyChanged:previous.policyVersion!==current.policyVersion,changes,message:'Information changed. Re-run each selected program separately; this is not a loss-of-eligibility decision.'};
}
/** Detect changes after transfer preview; authorization itself stays in the UI. */
export function createTransferIntent(input:Input,selectedIds:string[]) {
 const chosen=input.facts.filter(f=>selectedIds.includes(f.id));
 assert(new Set(selectedIds).size===selectedIds.length&&chosen.length===selectedIds.length,'Invalid selected fact ids');
 assert(chosen.every(f=>f.status==='known'&&f.confirmedRevision===f.revision),'Only confirmed facts can be selected');
 return {factVersions:chosen.map(f=>({id:f.id,revision:f.revision})),basis:stableStringify(input),kind:'local_transfer_preview' as const};
}
export function transferIntentIsCurrent(input:Input,intent:ReturnType<typeof createTransferIntent>):boolean {
 return stableStringify(input)===intent.basis&&intent.factVersions.every(v=>input.facts.some(f=>f.id===v.id&&f.revision===v.revision&&f.confirmedRevision===v.revision&&f.status==='known'));
}
