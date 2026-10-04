"""Read-only compatibility/timing check of frozen candidate in an isolated Chrome profile."""
import json,platform,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent;APP=ROOT.parents[1];sys.path.insert(0,str(ROOT.parents[2]/'scripts'))
from extension_smoke import Pipe,find_chrome
model=json.loads((ROOT/'artifacts/model.json').read_text());rows=[json.loads(l) for l in (ROOT/'data/synthetic_records.jsonl').read_text().splitlines()];rows=[r for r in rows if r['split']=='test'];expected={r['id']:r for r in json.loads((ROOT/'artifacts/predictions.json').read_text()) if r['split']=='test'}
with tempfile.TemporaryDirectory(prefix='benefitstep-candidate-browser-') as tmp:
 pipe=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
 try:
  ext=pipe.call('Extensions.loadUnpacked',{'path':str(APP/'extension')})['id'];tab=pipe.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId'];sid=pipe.call('Target.attachToTarget',{'targetId':tab,'flatten':True})['sessionId'];time.sleep(.3)
  script="""(async()=>{const {validateModel,scoreText}=await import('../src/trained-classifier.mjs');const m=validateModel(MODEL),rows=ROWS;const predicted=rows.map(r=>({id:r.id,...scoreText(m,r.text)}));const durations=[];for(let pass=0;pass<10;pass++){const start=performance.now();for(const r of rows)scoreText(m,r.text);durations.push(performance.now()-start)}return {predicted,durations}})()""".replace('MODEL',json.dumps(model)).replace('ROWS',json.dumps([{'id':r['id'],'text':r['text']} for r in rows]))
  response=pipe.call('Runtime.evaluate',{'expression':script,'awaitPromise':True,'returnByValue':True},sid,timeout=55)
  if 'exceptionDetails' in response:raise RuntimeError(json.dumps(response['exceptionDetails']))
  result=response['result']['value']
  for p in result['predicted']:
   assert p['label']==expected[p['id']]['routed'];assert abs(p['score']-expected[p['id']]['score'])<1e-10
  import statistics
  report={'modelId':model['modelId'],'browser':pipe.call('Browser.getVersion')['product'],'machine':platform.machine(),'macOS':platform.mac_ver()[0],'predictionsMatchFrozenPythonResults':48,'batchSize':48,'passes':10,'batchMilliseconds':result['durations'],'medianBatchMilliseconds':statistics.median(result['durations']),'scope':'Warm text classification only. Excludes PDF parsing, OCR, model loading, field extraction and UI. Candidate supplied in memory; deployed extension model unchanged.'}
  (ROOT/'artifacts/browser-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 finally:pipe.close()
