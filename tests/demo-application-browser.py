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
  p.call('Runtime.enable',{},sid);p.call('Network.enable',{},sid);p.call('Network.emulateNetworkConditions',{'offline':True,'latency':0,'downloadThroughput':0,'uploadThroughput':0},sid)
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
  ev('document.querySelector("[data-route=documents]").click();document.querySelector("[data-action=ai-demo]").click()')
  wait('document.querySelector("#main").getAttribute("aria-busy")==="false"&&document.querySelectorAll(".cf-docrow").length===3')
  ev('document.querySelector("[data-action=to-confirm]").click()')
  assert ev('document.querySelector("#main").textContent.includes("123 Example Lane")&&document.querySelector("#main").textContent.includes("Riley Demo")')
  ev('document.querySelector("[data-action=confirm]").click()')
  for id,count in [('cf285',18),('ccfrm604',44)]:
   ev(f'document.querySelector("[data-form={id}]").click()');wait('!!document.querySelector("#form-editor")')
   assert ev('[...document.querySelectorAll("[data-form-answer]")].some(el=>el.value==="123 Example Lane")')
   ev('document.querySelector("[data-action=form-confirm]").click();document.querySelector("[data-action=form-preview]").click()')
   wait('document.querySelector("[data-action=form-save]")?.disabled===false||!!document.querySelector("#dialog-error")?.textContent')
   assert ev('document.querySelector("[data-action=form-save]")?.disabled===false'),ev('document.querySelector("#dialog-error")?.textContent')
   assert ev('document.querySelectorAll("#official-preview canvas").length')==count
   assert ev('document.querySelector("#dialog").textContent.includes("Fictional demo — do not submit")')
   ev('document.querySelector("[data-action=form-package]").click()')
   package=Path(tmp)/'downloads'/f'{id}-application-package.zip'
   for _ in range(100):
    if package.exists():break
    time.sleep(.1)
   with zipfile.ZipFile(package) as z:
    report=json.loads(z.read('generation-report.json'));assert report['fictionalDemo'] and len(report['written'])>30
    assert any(w['text']=='123 Example Lane' for w in report['written'])
    assert any(w['text']=='2550.00' for w in report['written'])
   checks.append(id+' rich demo flows from Review into filled PDF/package without retyping')
   ev('document.querySelector("[data-action=close]").click()')
  out={'checks':checks,'passed':len(checks)}
  (APP/'forms/validation/rich-demo-browser.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
 finally:p.close()
