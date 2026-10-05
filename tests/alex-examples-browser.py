"""Validate the actual searchable Alex fixture PDFs in an offline extension browser."""
from pathlib import Path
import sys,tempfile,json,base64
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from extension_smoke import Pipe,find_chrome
folder=ROOT/'demo/test_example2'
expected=json.loads((folder/'expected-results.json').read_text())
with tempfile.TemporaryDirectory(prefix='benefitstep-alex-examples-') as tmp:
 p=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
 try:
  ext=p.call('Extensions.loadUnpacked',{'path':str(ROOT/'extension')})['id']
  tid=p.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId']
  sid=p.call('Target.attachToTarget',{'targetId':tid,'flatten':True})['sessionId']
  p.call('Runtime.enable',{},sid);p.call('Network.enable',{},sid)
  p.call('Network.emulateNetworkConditions',{'offline':True,'latency':0,'downloadThroughput':0,'uploadThroughput':0},sid)
  def js(code):
   r=p.call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True},sid,timeout=60)
   assert 'exceptionDetails' not in r,r
   return r.get('result',{}).get('value')
  js("(async()=>{const {initial}=await import('../src/state.mjs');const {saveHousehold}=await import('../src/household.mjs');globalThis.alexFixtureState=initial();saveHousehold(alexFixtureState,"+json.dumps(expected['household'])+");})()")
  for record in expected['expected']:
   encoded=base64.b64encode((folder/'pdfs'/record['file']).read_bytes()).decode()
   result=js("(async()=>{const {loadDocument}=await import('../shared/browser/files.mjs');const {extractByLabels}=await import('../shared/core/labels.mjs');const {addDocument}=await import('../src/state.mjs');const {assessSource}=await import('../src/household.mjs');const d=await loadDocument(new File([Uint8Array.from(atob("+json.dumps(encoded)+"),c=>c.charCodeAt(0))],"+json.dumps(record['file'])+",{type:'application/pdf'}));const r=extractByLabels(d.pages);addDocument(alexFixtureState,d,{...r,analysisState:'complete'});return {pages:d.pages.length,kind:r.kind,fields:Object.fromEntries(r.fields.map(f=>[f.key,f.value])),usable:assessSource(alexFixtureState,d,'2026-10-05').usable}})()")
   assert result['pages']==1 and result['kind']==record['kind'] and result['fields']==record['fields'] and result['usable'],result
  result=js("(async()=>{const {runDoctor}=await import('../src/doctor.mjs');const {confirmFacts,usable}=await import('../src/state.mjs');const s=alexFixtureState;const findings=runDoctor(s).findings;confirmFacts(s);return {documents:s.docs.length,findings:findings.length,confirmedFacts:s.facts.filter(usable).length,unusableFacts:s.facts.filter(f=>!usable(f)).length}})()")
  assert result['documents']==4 and result['findings']==0 and result['unusableFacts']==0,result
  print(json.dumps(result))
 finally:p.close()
