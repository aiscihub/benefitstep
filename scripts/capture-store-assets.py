"""Capture real release UI and render branded store images in isolated Chrome."""
import base64,json,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from extension_smoke import Pipe,find_chrome
OUT=ROOT/'releases/chrome-store-0.3.1';ASSETS=OUT/'store-assets';STAGE=OUT/'unpacked'
with tempfile.TemporaryDirectory(prefix='benefitstep-store-') as tmp:
 p=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
 try:
  ext=p.call('Extensions.loadUnpacked',{'path':str(STAGE)})['id']
  tid=p.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId'];sid=p.call('Target.attachToTarget',{'targetId':tid,'flatten':True})['sessionId']
  p.call('Runtime.enable',{},sid);p.call('Network.enable',{},sid);p.call('Log.enable',{},sid)
  p.call('Network.emulateNetworkConditions',{'offline':True,'latency':0,'downloadThroughput':0,'uploadThroughput':0},sid)
  p.call('Emulation.setDeviceMetricsOverride',{'width':1280,'height':800,'deviceScaleFactor':1,'mobile':False},sid)
  def ev(expr):
   r=p.call('Runtime.evaluate',{'expression':expr,'awaitPromise':True,'returnByValue':True},sid,timeout=60)
   if 'exceptionDetails' in r:raise Exception(r['exceptionDetails'])
   return r.get('result',{}).get('value')
  def wait(expr):
   for _ in range(250):
    if ev(expr):return
    time.sleep(.2)
   raise Exception('Timeout: '+expr)
  def shot(name):
   ev('window.scrollTo(0,0)');time.sleep(.3)
   (ASSETS/name).write_bytes(base64.b64decode(p.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},sid)['data']))
  wait('!!document.querySelector("#residence")')
  ev('for(const [id,value] of [["residence","yes"],["people","3"],["income","at_or_below"]]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event("change",{bubbles:true}));}document.querySelector("[data-action=see-results]").click()')
  shot('01-quick-check-1280x800.png')
  ev('document.querySelector("[data-route=documents]").click();document.querySelector("[data-action=ai-demo]").click()')
  wait('document.querySelector("#main").getAttribute("aria-busy")==="false"&&document.querySelectorAll(".cf-docrow").length===3')
  shot('02-document-review-1280x800.png')
  ev('document.querySelector("#doctor-title").scrollIntoView({block:"center"})');time.sleep(.3)
  (ASSETS/'03-package-doctor-1280x800.png').write_bytes(base64.b64decode(p.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},sid)['data']))
  ev('document.querySelector("[data-action=to-confirm]").click()')
  shot('04-confirm-details-1280x800.png')
  ev('document.querySelector("[data-action=confirm]").click();document.querySelector("[data-form=cf285]").click()')
  wait('!!document.querySelector("#form-editor")')
  ev('document.querySelector("[data-action=form-confirm]").click();document.querySelector("[data-action=form-preview]").click()')
  wait('document.querySelector("[data-action=form-save]")?.disabled===false')
  assert ev('document.querySelectorAll("#official-preview canvas").length')==18
  shot('05-filled-application-1280x800.png')
  ev('document.querySelector("[data-action=close]").click();document.querySelector("[data-form=ccfrm604]").click()');wait('!!document.querySelector("#form-editor")')
  ev('document.querySelector("[data-action=form-confirm]").click();document.querySelector("[data-action=form-preview]").click()');wait('document.querySelector("[data-action=form-save]")?.disabled===false')
  assert ev('document.querySelectorAll("#official-preview canvas").length')==44
  remote=[e for e in p.events if e.get('method')=='Network.requestWillBeSent' and e['params']['request']['url'].startswith(('http:','https:'))];assert not remote
  errors=[e for e in p.events if e.get('method')=='Runtime.exceptionThrown'];assert not errors
  (OUT/'release-browser-check.json').write_text(json.dumps({'version':'0.3.1','loadedReleasePackage':True,'cf285Pages':18,'mediCalPages':44,'offline':True,'remoteRequests':len(remote),'exceptions':len(errors),'screenshots':5},indent=2)+'\n')
  # Promotional artwork is HTML/CSS using the existing logo, not a fake UI screenshot.
  p.call('Page.navigate',{'url':'about:blank'},sid)
  icon=base64.b64encode((ROOT/'assets/benefitstep_small_dark.png').read_bytes()).decode()
  for width,height,name in [(440,280,'promo-440x280.png'),(1400,560,'marquee-1400x560.png')]:
   p.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':1,'mobile':False},sid)
   scale=width/440
   html=f'''<!doctype html><html><style>*{{box-sizing:border-box}}body{{margin:0;background:#092744;color:#fff;font-family:Arial,sans-serif}}main{{width:440px;height:280px;transform:scale({scale});transform-origin:top left;display:flex;align-items:center;justify-content:center;flex-direction:column;background:radial-gradient(ellipse at top right,#126966,transparent 70%)}}img{{width:104px;height:104px;border-radius:24px}}h1{{font-size:34px;margin:16px 0 8px;letter-spacing:-1px}}p{{font-size:15px;margin:0;color:#d5f5ed}}</style><main><img src="data:image/png;base64,{icon}"><h1>BenefitStep</h1><p>Prepare your benefits application package.</p></main></html>'''
   # Wide tile uses a centered compact composition at its natural aspect ratio.
   if width==1400:html=html.replace('transform:scale(3.1818181818181817)','transform:scale(2)').replace('transform-origin:top left','transform-origin:top left;margin-left:260px')
   ev('document.open();document.write('+json.dumps(html)+');document.close()');wait('document.images[0]?.complete');time.sleep(.2)
   (ASSETS/name).write_bytes(base64.b64decode(p.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False},sid)['data']))
  print(json.dumps({'assets':str(ASSETS),'screenshots':5,'promotionalImages':2,'officialFormPreviews':'18 and 44 pages offline'}))
 finally:p.close()
