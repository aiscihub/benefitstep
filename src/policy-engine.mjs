import {createEngine,fromPolicyAlignedUI,checkPackage} from '../engine/dist/index.js';
import {POLICY_BUNDLE} from '../engine/config/bundle.mjs';
import {today} from './starting-state.mjs';
const engine=createEngine(POLICY_BUNDLE);
// The reviewed UI remains the source of reported facts. Broad citizenship answers
// are not individual immigration classifications; document totals are not MAGI.
export function evaluateStarting(state,program,date=today()){
 const input=fromPolicyAlignedUI(state.starting,[program],date,POLICY_BUNDLE);
 const result=engine.evaluate(input,{mode:'preview',maxQuestions:3});
 return {revision:state.starting[program].revision,evaluation:result,input};
}
export function policyDetails(state,program,esc){
 const record=state.policyResults?.[program];if(!record||record.revision!==state.starting[program].revision)return '';
 const r=record.evaluation;
 return `<details class="policy-checks"><summary>What this initial check reviewed</summary><p>Local research-preview checks. Full eligibility has not been determined.</p>${r.results.flatMap(p=>p.findings).map(f=>`<p>${esc(f.text)}</p>`).join('')}${r.nextQuestions.length?`<p>Details still needed: ${r.nextQuestions.map(q=>esc(q.text)).join('; ')}.</p>`:''}<p class="small muted">Policy ${esc(r.policyVersion)} · ${esc(r.asOf)} · Separate checks for each benefit.</p></details>`;
}

export function enginePackageIssues(state){
 const programs=[...state.programs].map(p=>p==='CalFresh'?'calfresh':'medi_cal');
 const evidence=state.docs.filter(d=>!d.historical).map(d=>{
  const values=state.facts.filter(f=>f.documentId===d.id&&f.confirmedRevision===f.revision&&!f.conflict&&!f.deferred&&!f.superseded);
  const person=values.find(f=>f.fieldKey==='person')?.value;
  const fields={};for(const [key,meaning] of [['currentCharges','current_charges'],['previousBalance','previous_balance'],['totalDue','total_due']]){const f=values.find(f=>f.fieldKey===meaning);if(Number.isSafeInteger(f?.cents))fields[key]=f.cents;}
  return {id:d.id,subject:person?String(person):'unassigned-file:'+d.hash,programs,category:d.kind,readable:d.analysisState==='complete'&&Boolean(d.fields?.length||d.pages?.some(p=>p.text?.trim())),sha256:d.hash,fields};
 });
 // Request matching remains in the existing owner-confirmed Doctor adapter; no
 // person, period basis, or sent status is guessed for the engine's request model.
 return checkPackage({asOf:today(),stage:'details',selectedPrograms:programs,people:[],facts:[],evidence});
}
