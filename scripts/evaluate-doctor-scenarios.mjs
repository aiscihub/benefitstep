/** Standalone assessment: reports failures without changing production behavior. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {initial,addDocument,setFact,confirmFacts,usable,recordEvent,transferSnapshot,transferCurrent,deleteAllSourceCopies,historical,removeDocument,submission} from '../src/state.mjs';
import {runDoctor,explainFinding,linkRequest} from '../src/doctor.mjs';
const root=new URL('../',import.meta.url),corpusPath='tests/scenarios/package-doctor-v1.json';
const corpusText=await readFile(new URL(corpusPath,root),'utf8'),corpus=JSON.parse(corpusText);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function field(s,id,key){const f=s.facts.find(f=>f.documentId===id&&f.fieldKey===key);assert.ok(f,`Fixture missing ${id}.${key}`);return f;}
function step(s,a,refs){
 switch(a.op){
 case 'document':{
  const fields=Object.entries(a.values).map(([key,value])=>({key,value,sourceValue:value,page:1,quote:`${key}: ${value}`,conflict:a.conflicts?.includes(key)||false}));
  addDocument(s,{id:a.id,hash:a.hash||a.id,filename:a.filename||a.id+'.pdf',pages:[{page:1,text:fields.map(f=>f.quote).join('\n')}],bytes:new Uint8Array([1])},{kind:a.kind,analysisState:a.analysisState||'complete',fields});break;
 }
 case 'edit':setFact(s,field(s,a.id,a.key),a.value);break;
 case 'uiCorrect':{ // Save-fact semantics from app.mjs, including clearing extraction conflict.
  const f=field(s,a.id,a.key);setFact(s,f,a.value);
  if(f.conflict){f.revision++;f.confirmedRevision=null;s.revision++;}f.conflict=false;break;
 }
 case 'defer':{const f=field(s,a.id,a.key);f.deferred=true;f.confirmedRevision=null;s.revision++;break;}
 case 'history':historical(s,a.id);break;
 case 'remove':removeDocument(s,a.id);break;
 case 'deleteAll':deleteAllSourceCopies(s,a.id);break;
 case 'confirm':confirmFacts(s,a.revision?refs[a.revision]:s.revision);break;
 case 'captureRevision':refs[a.alias]=s.revision;break;
 case 'transfer':refs[a.alias]=transferSnapshot(s);break;
 case 'doctor':runDoctor(s);break;
 case 'event':{
  const {op,alias,request,expectThrow,...input}=a;
  if(request){assert.ok(refs[request],`Unknown request alias ${request}`);input.requestId=refs[request].id;}
  const event=recordEvent(s,input);if(alias)refs[alias]=event;break;
 }
 case 'link':assert.ok(refs[a.request]);linkRequest(s,{requestId:refs[a.request].id,documentId:a.documentId,program:a.program,recordBasis:a.recordBasis});break;
 case 'fixtureEventPatch':assert.ok(refs[a.alias]);Object.assign(refs[a.alias],a.values);break;
 case 'explain':{const f=runDoctor(s).findings.find(f=>f.ruleId===a.rule);assert.ok(f,'Expected a finding to explain');explainFinding(s,f.id,'I checked the source and confirm the corrected interpretation.');break;}
 default:throw Error(`Unsupported scenario action: ${a.op}`);
 }
}
function observe(s,c,refs){
 switch(c.query){
 case 'ruleStates':return (c.active?runDoctor(s).findings:runDoctor(s).trace).filter(f=>f.ruleId===c.rule&&(!c.document||f.sourceIds.includes(c.document))&&(!c.key||f.factId===field(s,c.document||'a',c.key).id)).map(f=>f.state).sort();
 case 'fact':{const f=field(s,c.id,c.key);return c.property==='usable'?usable(f):f[c.property];}
 case 'factCount':return s.facts.filter(f=>!c.document||f.documentId===c.document).length;
 case 'usableCount':return s.facts.filter(f=>usable(f)&&(!c.key||f.fieldKey===c.key)).length;
 case 'docCount':return s.docs.length;
 case 'docProperty':return s.docs.find(d=>d.id===c.id)?.[c.property];
 case 'orphanDuplicateClearCount':return runDoctor(s).trace.filter(f=>f.ruleId==='PD03'&&f.state==='clear'&&f.sourceIds.some(id=>{const d=s.docs.find(d=>d.id===id);return d?.duplicateOf&&!s.docs.some(original=>original.id===d.duplicateOf);})).length;
 case 'transferCurrent':return transferCurrent(s,refs[c.alias]);
 case 'snapshotFact':return refs[c.alias].facts.find(f=>f.fieldKey===c.key)?.value;
 case 'snapshotCount':return s.snapshots.length;
 case 'eventCount':return s.events.length;
 case 'authenticatedEvents':return s.events.filter(e=>e.issuerAuthenticated).length;
 case 'submission':return submission(s,c.program);
 default:throw Error(`Unsupported scenario observation: ${c.query}`);
 }
}
assert.equal(new Set(corpus.cases.map(c=>c.id)).size,corpus.cases.length,'Duplicate case IDs');
const start=performance.now(),results=[];
for(const c of corpus.cases){
 if(c.status==='not_implemented'){results.push({id:c.id,ruleId:c.ruleId,title:c.title,status:'not_implemented'});continue;}
 assert.equal(c.status,'executable');assert.ok(c.checks.length,'Every executed case needs an expectation');
 const s=initial(),refs={},failures=[],observations=[];let stage='actions';const begun=performance.now();
 try{
  for(const a of c.steps){
   if(a.expectThrow){let thrown;try{step(s,a,refs);}catch(e){thrown=e;}assert.ok(thrown,`Expected ${a.op} to reject input`);assert.notEqual(thrown.code,'ERR_ASSERTION','Fixture error must not count as expected rejection');observations.push({action:a.op,rejected:true,message:thrown.message});}
   else step(s,a,refs);
   const report=runDoctor(s);assert.equal(report.officialApplicationRouteVisible,true);assert.ok(report.trace.every(f=>f.officialApplicationRouteVisible===true));
  }
  stage='expectations';
  for(const q of c.checks){const actual=observe(s,q,refs);observations.push({...q,actual});try{assert.deepEqual(actual,q.expected);}catch{failures.push({query:q,actual});}}
 }catch(e){failures.push({stage,error:e.message});}
 results.push({id:c.id,ruleId:c.ruleId,title:c.title,caseType:c.caseType,inputMode:c.inputMode,status:failures.length?'failed':'passed',durationMs:Number((performance.now()-begun).toFixed(3)),observations,failures});
}
const counts={total:results.length,executed:results.filter(r=>r.status!=='not_implemented').length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,notImplemented:results.filter(r=>r.status==='not_implemented').length};
const hashes={};for(const path of ['src/doctor.mjs','src/state.mjs','src/app.mjs','shared/core/schema.mjs','reference/kernel.mjs','scripts/evaluate-doctor-scenarios.mjs'])hashes[path]=sha(await readFile(new URL(path,root)));
const report={version:'1.0.0',generatedAt:new Date().toISOString(),command:'node scripts/evaluate-doctor-scenarios.mjs',node:process.version,platform:process.platform,arch:process.arch,corpus:corpusPath,corpusSha256:sha(corpusText),sourceSha256:hashes,counts,durationMs:Number((performance.now()-start).toFixed(3)),boundaries:[corpus.provenance,corpus.scope,'Elapsed times measure small in-memory synthetic logic cases; they are not document-processing latency benchmarks.','Expected outcomes are AI-authored against the current design, not independently validated ground truth.','Known failures remain failures. Future cases are not executed. Original 46 unit tests and 120 design scenarios are separate artifacts; counts must not be added as distinct real-world cases.'],results};
await writeFile(new URL('research/package-doctor/scenario-results.json',root),JSON.stringify(report,null,2)+'\n');
const lines=['# Package Doctor scenario assessment','',`Executed ${counts.executed} synthetic scenarios: **${counts.passed} passed, ${counts.failed} failed**. An additional **${counts.notImplemented} future scenarios** are not implemented or executed.`,'',...report.boundaries.map(x=>'- '+x),'',`Run: \`${report.generatedAt}\`; Node ${process.version}.`,'','## Results by behavior','','| Rule / guard | Executed | Passed | Failed | Future |','|---|---:|---:|---:|---:|'];
for(const id of [...new Set(results.map(r=>r.ruleId))].sort()){const rs=results.filter(r=>r.ruleId===id);lines.push(`| ${id} | ${rs.filter(r=>r.status!=='not_implemented').length} | ${rs.filter(r=>r.status==='passed').length} | ${rs.filter(r=>r.status==='failed').length} | ${rs.filter(r=>r.status==='not_implemented').length} |`);}
lines.push('','## Failures to investigate','');
for(const r of results.filter(r=>r.status==='failed'))lines.push(`- **${r.id}: ${r.title}** (${r.inputMode}). Expected/actual details: \`${JSON.stringify(r.failures)}\``);
lines.push('','## Full scenario catalog','','| Case | Scenario | Type | Result |','|---|---|---|---|');
for(const c of corpus.cases){const r=results.find(x=>x.id===c.id);lines.push(`| ${c.id} | ${c.title.replaceAll('|','/')} | ${c.caseType} | ${r.status} |`);}
lines.push('','## Reproduce','','From `BenefitStep_v0_1`:','','```sh','node scripts/evaluate-doctor-scenarios.mjs','```','','The command writes this report and the detailed JSON, then exits nonzero when an executable scenario fails. Expectations and source hashes are preserved in the JSON. Review outcomes before changing an expectation; do not re-label failures as passes to improve a percentage.','');
await writeFile(new URL('research/package-doctor/SCENARIO_ASSESSMENT.md',root),lines.join('\n'));
console.log(JSON.stringify({counts,failed:results.filter(r=>r.status==='failed').map(r=>({id:r.id,title:r.title,failures:r.failures})),report:'research/package-doctor/SCENARIO_ASSESSMENT.md'},null,2));
if(counts.failed)process.exitCode=1;
