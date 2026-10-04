/** Limited pure reference logic; not a parser, benefit engine, vault or installed extension. */
export class InvalidInput extends Error {}
const isInt = n => Number.isSafeInteger(n);
const nonblank = s => typeof s === 'string' && s.trim().length > 0;
const response = (state, reason, extra={}) => ({state,reason,officialApplicationRouteVisible:true,...extra});
export function parseMoney(text) {
 if(typeof text !== 'string' || !/^-?(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(text)) throw new InvalidInput('Use an unambiguous decimal amount.');
 const negative = text.startsWith('-'); const clean = negative ? text.slice(1) : text;
 const [whole, fraction=''] = clean.split('.');
 const cents = Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!isInt(cents)) throw new InvalidInput('Amount out of range.');
 return negative && cents !== 0 ? -cents : cents;
}
function validDay(s) {
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
 const d=new Date(s+'T00:00:00Z');return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10)===s;
}
export function validPeriod(p){return !!p && validDay(p.start)&&validDay(p.end)&&p.start<=p.end;}
export function comparePeriods(a,b) {
 if(!validPeriod(a)||!validPeriod(b))return 'unknown';
 if(a.end<b.start || b.end<a.start)return 'disjoint';
 if(a.start<=b.start && a.end>=b.end)return 'covers';
 return 'partial';
}
export function checkPriorBalance(x) {
 if(!x || x.confirmed!==true || x.sameDocument!==true || x.currency!=='USD')return response('unknown','Comparable confirmed bill fields needed.');
 const vals=[x.current,x.previous,x.total,x.proposedCurrent];
 if(!vals.every(isInt))return response('unknown','Known integer amounts needed.');
 if(x.previous<=0 || x.total===x.current || x.proposedCurrent!==x.total)return response('clear','No previous-balance misuse found.');
 if(x.current+x.previous!==x.total)return response('unknown','Other charges or credits need reconciliation.');
 return response('finding','Current-charge answer uses total due.',{ruleId:'PD08',label:'needs_correction',suggestedCurrent:x.current,changesOriginal:false});
}
export function checkRecordedCashflow(x) {
 if(!x || x.confirmed!==true || x.comparable!==true || x.currency!=='USD'||!validPeriod(x.period)||!x.householdId || !isInt(x.income)||!isInt(x.expenses)||x.income<0||x.expenses<0)return response('unknown','Comparable confirmed recorded subtotals needed.');
 if(x.expenses<=x.income)return response('clear','No gap in the recorded subtotals.');
 return response('finding','Recorded expenses exceed recorded income.',{ruleId:'PD10',label:'needs_explanation',difference:x.expenses-x.income,eligibilityConclusion:null,blocksFactIds:[]});
}
export function matchRecordToRequest(record, request) {
 if(!record || !request || request.ownerConfirmed!==true)return response('unknown','Request confirmation needed.');
 const fields=['applicationId','program','personId'];
 if(fields.some(k=>typeof record[k]!=='string'||!record[k]||typeof request[k]!=='string'||!request[k]))return response('unknown','Scope needs clarification.');
 if(fields.some(k=>record[k]!==request[k]))return response('out_of_scope','Different application, program or person.');
 if(!record.periodBasis||record.periodBasis!==request.periodBasis)return response('unknown','Compare earned/received period basis first.');
 const relation=comparePeriods(record.period,request.period);
 if(relation==='unknown')return response('unknown','Period needs clarification.');
 if(relation==='covers')return response('period_match','Dates cover request; acceptance not determined.');
 return response('finding',relation==='partial'?'Record only partly covers the request.':'Record does not cover the requested period.',{ruleId:'PD05',label:'needs_attention',periodRelation:relation,agencyAcceptance:null});
}
export function policyMayRun(policy, context) {
 if(!policy||!context||!validDay(context.onDate)||!nonblank(policy.jurisdiction)||!nonblank(context.jurisdiction))return false;
 return policy.status==='approved' && policy.enabled===true &&
 Array.isArray(policy.sourceIds)&&policy.sourceIds.length>0 && policy.sourceIds.every(nonblank) &&
 Array.isArray(policy.reviewerIds)&&policy.reviewerIds.every(nonblank)&&new Set(policy.reviewerIds).size>=2 &&
 Array.isArray(policy.programs)&&policy.programs.includes(context.program)&&
 Array.isArray(policy.stages)&&policy.stages.includes(context.stage)&&
 policy.jurisdiction===context.jurisdiction && validDay(policy.effectiveFrom)&&
 validDay(policy.effectiveTo)&&validDay(policy.reviewExpiresAt)&&
 policy.effectiveFrom<=context.onDate && context.onDate<=policy.effectiveTo && context.onDate<=policy.reviewExpiresAt;
}
export function selectConfirmedFacts(facts, snapshot, wantedIds, applicationId) {
 if(!snapshot || snapshot.applicationId!==applicationId || !snapshot.factRevisions || typeof snapshot.factRevisions!=='object' || !Array.isArray(facts)||!Array.isArray(wantedIds))throw new InvalidInput('Snapshot scope mismatch.');
 const selected=[]; const ids=new Set();
 for(const id of wantedIds) {
  if(ids.has(id))throw new InvalidInput('Duplicate requested fact.');ids.add(id);
  const matches=facts.filter(f=>f && f.id===id);if(matches.length!==1)throw new InvalidInput('Missing or duplicate fact identity.');
  const f=matches[0];
  if(f.applicationId!==applicationId||f.active!==true||f.state!=='known'||!isInt(f.revision)||f.confirmedRevision!==f.revision||snapshot.factRevisions[id]!==f.revision)throw new InvalidInput('Unconfirmed, stale or wrong-scope fact.');
  selected.push(structuredClone(f));
 }
 return selected;
}
export function recordSubmission(current, event, applicationId, program) {
 if(!['not_recorded','user_reported','receipt_recorded'].includes(current))throw new InvalidInput('Unknown current status.');
 if(!event || event.ownerConfirmed!==true || event.applicationId!==applicationId || !Array.isArray(event.programs)||!event.programs.includes(program))return current;
 if(event.type==='application_receipt' && event.provenance==='imported_owner_confirmed' && typeof event.sourceId==='string'&&event.sourceId)return 'receipt_recorded';
 if(event.type==='submission_report' && event.provenance==='user_reported' && current==='not_recorded')return 'user_reported';
 return current;
}
export function acceptJobResult(current,incoming) {
 if(!current||!incoming||current.cancelled===true||incoming.cancelled===true)return false;
 for(const t of [current,incoming]) if(!nonblank(t.workspaceId)||!nonblank(t.documentId)||!isInt(t.epoch)||t.epoch<0||!isInt(t.documentRevision)||t.documentRevision<1)return false;
 return ['workspaceId','epoch','documentId','documentRevision'].every(k=>current[k]!==undefined&&current[k]===incoming[k]);
}
