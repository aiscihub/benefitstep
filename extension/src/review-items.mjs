import {usable} from './state.mjs';

// A finding attached to a detail stays on that detail; document/request issues
// without a specific detail get one separate review item per source/request.
export function reviewItems(facts,findings){
 const active=facts.filter(f=>!f.superseded);
 const rows=active.map(f=>({id:f.id,fact:f,findings:[]}));
 const byFact=new Map(rows.map(r=>[r.id,r]));
 const separate=new Map();
 for(const finding of findings){
  const ids=[...new Set([finding.factId,...(finding.blockedFactIds||[])].filter(id=>byFact.has(id)))];
  if(ids.length&&!finding.primary){for(const id of ids)byFact.get(id).findings.push(finding);continue;}
  const key=finding.requestId?'request:'+finding.requestId:finding.sourceIds?.length?'sources:'+finding.sourceIds.slice().sort().join('|'):'finding:'+finding.id;
  if(!separate.has(key))separate.set(key,{id:key,findings:[]});
  separate.get(key).findings.push(finding);
 }
 for(const row of [...rows,...separate.values()]){
  const f=row.fact;
  row.status=row.findings.length||f?.doctorBlocked||f?.conflict?'attention':!f?'attention':f.deferred?'deferred':f.value===null?'attention':usable(f)?'confirmed':'confirm';
  row.label=row.status==='attention'?(f?.value===null?'Missing information':row.findings.some(x=>x.state==='finding')||f?.conflict?'Issue identified':'Needs clarification'):({deferred:'Answer later',confirmed:'Confirmed',confirm:'Needs confirmation'})[row.status];
 }
 return [...rows,...separate.values()];
}
