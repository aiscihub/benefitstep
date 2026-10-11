"""Capture the website's product screenshots from extension/ in a throwaway Chrome, one set per interface language.
The screens show the built-in fictional example household. Run after a release changes the interface:
python3 scripts/capture-site-screenshots.py"""
import base64,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from extension_smoke import Pipe,find_chrome
OUT=ROOT/'docs/assets/screens'
WIDTH,HEIGHT=400,500
# Website language folder -> interface language of the extension.
LOCALES={'en':'en-US','es':'es-US','zh-CN':'zh-CN','zh-TW':'zh-TW','vi':'vi-VN'}
for folder,locale in LOCALES.items():
 with tempfile.TemporaryDirectory(prefix='benefitstep-site-') as tmp:
  p=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
  try:
   ext=p.call('Extensions.loadUnpacked',{'path':str(ROOT/'extension')})['id']
   target=p.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId']
   sid=p.call('Target.attachToTarget',{'targetId':target,'flatten':True})['sessionId']
   p.call('Runtime.enable',{},sid);p.call('Page.enable',{},sid)
   p.call('Emulation.setDeviceMetricsOverride',{'width':WIDTH,'height':HEIGHT,'deviceScaleFactor':2,'mobile':False},sid)
   p.call('Emulation.setScrollbarsHidden',{'hidden':True},sid)
   def js(code):
    result=p.call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True},sid,timeout=60)
    assert 'exceptionDetails' not in result,result
    return result.get('result',{}).get('value')
   def wait(code):
    for _ in range(240):
     if js(code):return
     time.sleep(.2)
    raise AssertionError(code)
   def shot(name,top):
    # `top` is a JavaScript expression for the page position where the picture starts.
    time.sleep(.4)
    js(f"document.activeElement.blur();scrollTo(0,{top})")
    time.sleep(.3)
    data=p.call('Page.captureScreenshot',{'format':'webp','quality':82},sid)['data']
    (OUT/folder).mkdir(parents=True,exist_ok=True);(OUT/folder/(name+'.webp')).write_bytes(base64.b64decode(data))
   edge=lambda selector,side,offset:f"Math.round(document.querySelector({selector!r}).getBoundingClientRect().{side}+scrollY)+({offset})"
   wait("!!document.getElementById('residence')")
   js(f"document.getElementById('interface-language').value='{locale}';document.getElementById('interface-language').dispatchEvent(new Event('change',{{bubbles:true}}))")
   shot('start','0')
   js("for(const [id,value] of [['residence','yes'],['people','3'],['income','at_or_below']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}document.querySelector('[data-action=see-results]').click()")
   shot('quick',edge('#quick-result','top',-150))
   js("document.querySelector('#quick-result [data-action=documents]').click();document.querySelector('[data-action=ai-demo]').click()")
   wait("document.querySelector('#main').getAttribute('aria-busy')==='false'&&document.querySelectorAll('.cf-docrow').length===3")
   shot('documents',edge('.bs-processing','top',-12))
   js("document.querySelector('.bs-processing [data-action=to-confirm]').click()")
   shot('review',edge('section[aria-label="Review summary"]','top',-12))
   js("document.querySelector('[data-action=confirm]').click()")
   shot('application',edge('.page-head','top',-12))
   errors=[e for e in p.events if e.get('method')=='Runtime.exceptionThrown']
   assert not errors,errors
   print(folder,sorted(f.name for f in (OUT/folder).iterdir()))
  finally:p.close()
