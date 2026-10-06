"""Exercise draft interface locales in the installed development extension, offline."""
from pathlib import Path
import sys,tempfile,time,json,base64
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from extension_smoke import Pipe,find_chrome
LOCALE='zh-CN' if '--chinese' in sys.argv else 'es-US'
ZH=LOCALE=='zh-CN'
with tempfile.TemporaryDirectory(prefix='benefitstep-i18n-') as tmp:
 p=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
 try:
  ext=p.call('Extensions.loadUnpacked',{'path':str(ROOT/'extension')})['id']
  target=p.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId']
  sid=p.call('Target.attachToTarget',{'targetId':target,'flatten':True})['sessionId']
  p.call('Runtime.enable',{},sid);p.call('Network.enable',{},sid)
  p.call('Network.emulateNetworkConditions',{'offline':True,'latency':0,'downloadThroughput':0,'uploadThroughput':0},sid)
  def js(code):
   result=p.call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True},sid,timeout=60)
   assert 'exceptionDetails' not in result,result
   return result.get('result',{}).get('value')
  def wait(code):
   for _ in range(240):
    if js(code):return
    time.sleep(.2)
   raise AssertionError(code)
  def language(value):js(f"document.getElementById('interface-language').value='{value}';document.getElementById('interface-language').dispatchEvent(new Event('change',{{bubbles:true}}))")
  wait("!!document.getElementById('residence')")
  js("for(const [id,value] of [['residence','yes'],['people','3'],['income','at_or_below']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}document.querySelector('[data-action=see-results]').click()")
  original=js("Object.fromEntries(['residence','people','income','immigration'].map(id=>[id,document.getElementById(id).value]))")
  language(LOCALE)
  assert js("document.documentElement.lang")==LOCALE
  assert js("document.getElementById('page-title').textContent")==('快速预查' if ZH else 'Consulta inicial')
  assert js("document.querySelector('#quick-result').textContent").find("您的估计收入在" if ZH else "Su estimación está dentro")>=0
  assert js("Object.fromEntries(['residence','people','income','immigration'].map(id=>[id,document.getElementById(id).value]))")==original
  for width in [390,720,1280]:
   p.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':False},sid)
   assert js('document.documentElement.scrollWidth<=innerWidth'),width
  Path('/private/tmp/benefitstep-quick-'+LOCALE+'.png').write_bytes(base64.b64decode(p.call('Page.captureScreenshot',{'format':'png'},sid)['data']))
  language('en-US');assert js("document.getElementById('page-title').textContent")=='Quick check'
  language(LOCALE)
  js("document.querySelector('#quick-result [data-action=documents]').click();document.querySelector('[data-action=ai-demo]').click()")
  wait("document.querySelector('#main').getAttribute('aria-busy')==='false'&&document.querySelectorAll('.cf-docrow').length===3")
  assert ("16 项提取信息" if ZH else "16 datos propuestos") in js("document.querySelector('.bs-processing').textContent")
  js("document.querySelector('.bs-processing [data-action=to-confirm]').click()")
  assert js("document.querySelectorAll('.review-item').length")==17
  assert js("document.querySelector('[data-review-status=confirm] h3').textContent")==('材料所列姓名' if ZH else 'Persona indicada')
  before=js("[...document.querySelectorAll('.review-item p>strong')].map(e=>e.textContent)")
  language('en-US');assert js("[...document.querySelectorAll('.review-item p>strong')].map(e=>e.textContent)")==before
  js("document.querySelector('[data-action=confirm]').click()")
  language(LOCALE)
  assert js("document.getElementById('page-title').textContent")==('您的申请准备材料包已就绪。' if ZH else 'Su paquete de preparación está listo.')
  assert js("!document.querySelector('[data-form=cf285]').disabled")
  # The quick check is optional: Medi-Cal was not answered here, and its package is still offered because the program stays selected.
  assert js("!document.querySelector('[data-form=ccfrm604]').disabled")
  assert ("官方 PDF 语言为英语" if ZH else "Idioma del PDF oficial: inglés") in js("document.getElementById('main').textContent")
  # User values matching a UI phrase must never be translated.
  js("document.querySelector('[data-route=confirm]').click();document.querySelector('[data-review-status=confirm] [data-action=edit], [data-review-status=confirmed] [data-action=edit]').click()")
  js("document.getElementById('fact-value').value='Income';document.querySelector('[data-action=save-fact]').click()")
  language('en-US');language(LOCALE)
  assert js("[...document.querySelectorAll('.review-item p>strong')].some(e=>e.textContent==='Income')")
  remote=[e for e in p.events if e.get('method')=='Network.requestWillBeSent' and e['params']['request']['url'].startswith(('http:','https:'))]
  errors=[e for e in p.events if e.get('method')=='Runtime.exceptionThrown']
  assert not remote,remote;assert not errors,errors
  print(json.dumps({'languages':['en-US',LOCALE],'answersPreserved':True,'confirmationPreserved':True,'originalValuesPreserved':True,'reviewItems':17,'officialFormsRemainEnglish':True,'offline':True,'remoteRequests':len(remote),'exceptions':len(errors)}))
 finally:p.close()
