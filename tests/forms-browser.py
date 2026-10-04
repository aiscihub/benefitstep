"""Installed-extension original-form writer, offline preview and download checks."""
import json,sys,tempfile,time,hashlib,zipfile
from pathlib import Path
APP=Path(__file__).resolve().parents[1];sys.path.insert(0,str(APP/'scripts'))
from extension_smoke import Pipe,find_chrome
with tempfile.TemporaryDirectory(prefix='benefitstep-forms-') as tmp:
 p=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json');checks=[]
 try:
  ext=p.call('Extensions.loadUnpacked',{'path':str(APP/'extension')})['id']
  p.call('Browser.setDownloadBehavior',{'behavior':'allow','downloadPath':tmp+'/downloads','eventsEnabled':True})
  tid=p.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId'];sid=p.call('Target.attachToTarget',{'targetId':tid,'flatten':True})['sessionId']
  p.call('Runtime.enable',{},sid);p.call('Log.enable',{},sid);p.call('Network.enable',{},sid);p.call('Network.emulateNetworkConditions',{'offline':True,'latency':0,'downloadThroughput':0,'uploadThroughput':0},sid)
  def ev(expr):
   r=p.call('Runtime.evaluate',{'expression':expr,'awaitPromise':True,'returnByValue':True},sid,timeout=55)
   if 'exceptionDetails' in r:raise Exception(r['exceptionDetails'])
   return r.get('result',{}).get('value')
  def wait(expr):
   for _ in range(200):
    if ev(expr):return
    time.sleep(.2)
   raise Exception('Timeout: '+expr+'; status='+str(ev('document.querySelector("#status")?.textContent')))
  wait('!!document.querySelector("[data-route=next]")')
  ev('document.querySelector("[data-route=documents]").click();document.querySelector("[data-action=manual]").click()')
  ev('document.querySelector("#manual-person").value="Jordan Rivera";document.querySelector("#manual-period").value="September 2026, biweekly";document.querySelector("#manual-value").value="1250";document.querySelector("[data-action=save-manual]").click()')
  ev('document.querySelector("[data-action=confirm]").click()')
  wait('!!document.querySelector("[data-form=cf285]")')
  for id in ['cf285','ccfrm604']:
   ev(f'document.querySelector("[data-form={id}]").click()');wait('!!document.querySelector("#form-editor")')
   assert ev('!!document.querySelector("[data-form-answer]")'),'Fields should be visible without applicability clicks'
   if id=='cf285':
    assert ev("document.querySelector('[data-form-answer=\"q1.contact|0|name\"]').value===\"Jordan Rivera\"")
    assert ev('document.querySelector("#dialog").textContent.includes("Filled from your reviewed details")')
    checks.append('prior reviewed answer automatically fills CF285 name without re-entry')

   ev('{const x=document.querySelector("[data-form-answer]");x.value="Jordan";x.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("[data-action=form-confirm]").click()}')
   wait('!!document.querySelector("[data-action=form-blank]")')
   assert ev('!document.querySelector("[data-action=form-preview]").disabled&&document.querySelector("#dialog").textContent.includes("independent")')
   assert ev('document.querySelector("#dialog .application-answer-summary").textContent.includes("Jordan")&&document.querySelector("#dialog .application-answer-summary").textContent.includes("PDF page")')
   assert ev('document.querySelector("#main .application-answer-summary").parentElement.parentElement.textContent.includes("Jordan")')
   checks.append(id+' entered values and PDF destinations visible; filled-draft action available')
   ev('document.querySelector("[data-action=form-blank]").click()')
   wait('document.querySelector("#blank-preview-status")?.textContent.startsWith("All pages loaded")')
   assert ev('document.querySelectorAll("#official-preview canvas").length')==(18 if id=='cf285' else 44)
   ev('document.querySelector("[data-action=form-review]").click()')
   assert ev('document.querySelector("#dialog .application-answer-summary").textContent.includes("Jordan")')
   checks.append(id+' blank official form previews offline and returns to entered answers')
   ev('document.querySelector("[data-action=form-preview]").click()')
   wait('document.querySelector("[data-action=form-save]")?.disabled===false||!!document.querySelector("#dialog-error")?.textContent')
   assert ev('document.querySelector("[data-action=form-save]")?.disabled===false'),ev('document.querySelector("#dialog-error")?.textContent')
   assert ev('document.querySelectorAll("#official-preview canvas").length')==(18 if id=='cf285' else 44)
   ev('document.querySelector("[data-action=form-save]").click();document.querySelector("[data-action=form-package]").click()')
   pdf=Path(tmp)/'downloads'/f'{id}-unsigned.pdf'
   package=Path(tmp)/'downloads'/f'{id}-application-package.zip'
   for _ in range(100):
    if pdf.exists() and package.exists():break
    time.sleep(.1)
   assert pdf.exists() and package.exists()
   with zipfile.ZipFile(package) as z:
    assert z.read(f'{id}-unsigned.pdf')==pdf.read_bytes()
    answers=json.loads(z.read('application-answers.json'))
    assert any(a.get('value')=='Jordan' for a in answers['answers'])
    report=json.loads(z.read('generation-report.json'))
    assert report['mode']=='draft' and not report['independentlyValidated'] and not report['submitted'] and not report['signatureApplied']
    assert any(w['text']=='Jordan' for w in report['written'])
    assert hashlib.sha256(pdf.read_bytes()).hexdigest()==report['outputSha256']
   (APP/f'forms/validation/{id}-app-flow-draft.pdf').write_bytes(pdf.read_bytes())
   checks.append(id+' confirmed applicant answers generate filled draft and matching PDF/package downloads offline')

   ev('document.querySelector("[data-action=close]").click()')
  source_check=ev("""(async()=>{
   const {connectForms}=await import('../src/forms-ui.mjs');
   const state={applicationId:'selector-test',revision:1,formAnswers:{},docs:[{id:'one',filename:'pay-sept-15.pdf'},{id:'two',filename:'pay-sept-30.pdf'}],facts:['one','two'].map((id,i)=>({id,documentId:id,fieldKey:'person',value:'Alex Demo',person:'Alex Demo',period:'September 2026',page:1,revision:1,confirmedRevision:1}))};
   const host=document.createElement('div');document.body.append(host);
   const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
   const ui=connectForms({getState:()=>state,esc,btn:()=>'',download:()=>{},close:()=>{},modal:(title,body)=>{host.innerHTML=body;}});
   await ui.action('official-form',{dataset:{form:'cf285'}});
   const selector=()=>host.querySelector('[data-form-source="q1.contact|0|name"]');
   const labels=[...selector().options].map(o=>o.textContent);
   selector().value='two';ui.change({target:selector()});
   const second=selector().value==='two'&&state.formAnswers.cf285.answers.find(a=>a.field==='name').sourceRefs[0].id==='two';
   selector().value='one';ui.change({target:selector()});
   const first=selector().value==='one';
   const input=host.querySelector('[data-form-answer="q1.contact|0|name"]');input.value='Corrected name';ui.input({target:input});await ui.action('form-edit',{});
   const corrected=selector().value===''&&host.querySelector('[data-form-answer="q1.contact|0|name"]').value==='Corrected name';
   host.remove();return {second,first,corrected,labels};
  })()""")
  assert source_check['second'] and source_check['first'] and source_check['corrected'],source_check
  assert any('pay-sept-15.pdf' in x for x in source_check['labels']) and any('pay-sept-30.pdf' in x for x in source_check['labels']),source_check
  checks.append('source choices persist after redraw, show distinct filenames, and clear after manual correction')
  p.call('Page.navigate',{'url':f'chrome-extension://{ext}/assets/form-preview.html'},sid);wait('typeof document.querySelector("#generate")?.onclick==="function"')
  for id,count in [('cf285',18),('ccfrm604',44)]:
   ev(f'document.querySelector("#fixture").value="{id}-multiple-people";document.querySelector("#generate").click()')
   wait('document.querySelector("#status").textContent.startsWith("Fictional test preview ready")||document.querySelector("#status").textContent.includes("could not")')
   status=ev('document.querySelector("#status").textContent');assert 'preview ready' in status,status
   assert ev('document.querySelectorAll("canvas").length')==count
   report=ev('JSON.parse(document.querySelector("#report").textContent)');assert not report['signatureApplied'] and not report['submitted']
   checks.append(id+' offline worker fills and PDF.js previews all '+str(count)+' original pages')
   ev('document.querySelector("#save").click()')
   filename=Path(tmp)/'downloads'/f'{id}-multiple-people-TEST-ONLY.pdf'
   for _ in range(100):
    if filename.exists():break
    time.sleep(.1)
   assert filename.exists(),'Download not completed'
   assert hashlib.sha256(filename.read_bytes()).hexdigest()==report['outputSha256']
   (APP/f'forms/validation/{id}-browser-test.pdf').write_bytes(filename.read_bytes())
   checks.append(id+' saved bytes match preview bytes')
   ev('document.querySelector("#stop").click()');assert ev('document.querySelectorAll("canvas").length===0&&document.querySelector("#save").disabled')
  ev('document.querySelector("#generate").click();document.querySelector("#stop").click()');time.sleep(.5);assert ev('document.querySelector("#save").disabled&&document.querySelectorAll("canvas").length===0')
  checks.append('cancelled job cannot repopulate preview')
  assert ev('(async()=>localStorage.length===0&&(await indexedDB.databases()).length===0)()')
  checks.append('no persistent private storage')
  font_errors=[e for e in p.events if e.get('method') in ['Log.entryAdded','Runtime.consoleAPICalled'] and ('standardFontDataUrl' in json.dumps(e) or 'Unable to load font data' in json.dumps(e))];assert not font_errors,font_errors
  font_responses=[e['params']['response'] for e in p.events if e.get('method')=='Network.responseReceived' and '/standard_fonts/' in e['params']['response']['url']];assert font_responses and all(r['status']==200 for r in font_responses),font_responses
  checks.append('bundled standard fonts load offline with no missing-font warnings')
  errors=[e for e in p.events if e.get('method')=='Runtime.exceptionThrown'];assert not errors,errors
  remote=[e for e in p.events if e.get('method')=='Network.requestWillBeSent' and e['params']['request']['url'].startswith(('http:','https:'))];assert not remote,remote
  checks.append('no remote document requests; offline throughout filling')
  out={'browser':p.call('Browser.getVersion')['product'],'checks':checks,'passed':len(checks),'pageErrors':errors,'remoteRequests':remote,'scope':'Real installed extension. PDF.js preview and Chrome downloads. Separate PyMuPDF pixel validation. Independent desktop-viewer and reviewer approvals not performed.'}
  (APP/'forms/validation/browser-results.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
 finally:p.close()
