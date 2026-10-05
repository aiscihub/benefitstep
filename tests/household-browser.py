"""Offline extension flow: own household, old source exclusion and source corrections."""
from pathlib import Path
import sys,tempfile,time,json,base64
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from extension_smoke import Pipe,find_chrome
with tempfile.TemporaryDirectory(prefix='benefitstep-household-') as tmp:
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
  def wait(code):
   for _ in range(240):
    if js(code):return
    time.sleep(.2)
   raise AssertionError(code)
  wait("!!document.getElementById('residence')")
  js("document.getElementById('residence').value='yes';document.getElementById('residence').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-route=documents]').click();document.querySelector('[data-action=household]').click()")
  values={'name':'Jordan Tester','home_address':'100 Test Lane','home_city':'Sacramento','home_state':'CA','home_zip':'95814','members':'Taylor Tester'}
  js('for(const [key,value] of Object.entries('+json.dumps(values)+")){document.getElementById('household-'+key).value=value;}document.querySelector('[data-action=save-household]').click()")
  assert 'Jordan Tester' in js("document.getElementById('main').textContent")
  # Saved details remain reachable and editable from every workflow step.
  for route in ['quick','documents','confirm','next']:
   js(f"document.querySelector('[data-route={route}]').click();document.querySelector('#household-access [data-action=household]').click()")
   assert js("document.getElementById('household-name').value")=='Jordan Tester'
   assert js("document.getElementById('household-home_address').value")=='100 Test Lane'
   js("document.querySelector('[data-action=close]').click()")
  js("document.querySelector('#household-access [data-action=household]').click();document.getElementById('household-members').value="+json.dumps("Taylor Tester\nCasey Tester")+";document.querySelector('[data-action=save-household]').click()")
  assert js("document.querySelector('[data-action=official-form]').disabled")
  js("document.querySelector('#household-access [data-action=household]').click()")
  assert js("document.getElementById('household-members').value")=="Taylor Tester\nCasey Tester"
  js("document.querySelector('[data-action=save-household]').click();document.querySelector('[data-route=documents]').click()")
  # Import through the real local label reader. Dates are deliberately old.
  text='ENERGY STATEMENT\nCustomer: Jordan Tester\nHome address: 100 Test Lane\nHome city: Sacramento\nHome state: CA\nHome ZIP: 95814\nStatement date: 2020-01-17\nCurrent charges: 22.45\nPrevious balance: 89.35\nTotal due: 22.45\nAmount paid: 89.35'
  js("const dt=new DataTransfer();dt.items.add(new File(["+json.dumps(text)+"],'old-bill.txt',{type:'text/plain'}));const input=document.getElementById('files');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));")
  wait("document.querySelector('#main').getAttribute('aria-busy')==='false'&&document.querySelectorAll('.cf-docrow').length===1")
  js("document.querySelector('[data-action=to-confirm]').click()")
  assert 'document is too old' in js("document.getElementById('main').textContent")
  assert 'Alex Demo' not in js("document.getElementById('main').textContent")
  js("document.querySelector('[data-review-status=confirm] [data-action=edit]').click()")
  assert js("document.getElementById('household-name').value")=='Jordan Tester'
  js("document.querySelector('[data-action=close]').click()")
  js("document.querySelector('[data-action=confirm]').click();document.querySelector('[data-action=package]').click()")
  assert 'Current utility charges' not in js("document.querySelector('#dialog-content dl').textContent")
  js("document.querySelector('[data-action=close]').click();document.querySelector('[data-route=confirm]').click();document.querySelector('details').open=true;document.querySelector('[data-action=source-context]').click()")
  assert js("document.getElementById('source-document_date').value")=='2020-01-17'
  # Correct the date as an explicit owner correction, leaving original source text intact.
  today=js("(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})()")
  js("document.getElementById('source-document_date').value="+json.dumps(today)+";document.querySelector('[data-action=save-source-context]').click()")
  assert 'document is too old' not in js("document.getElementById('main').textContent")
  assert 'Ready for detail review' in js("document.getElementById('main').textContent")
  js("document.querySelector('[data-source]').click()")
  assert '2020-01-17' in js("document.querySelector('.source-text').textContent")
  js("document.querySelector('[data-action=close]').click()")
  for locale in ['es-US','zh-CN','en-US']:
   js(f"document.getElementById('interface-language').value='{locale}';document.getElementById('interface-language').dispatchEvent(new Event('change',{{bubbles:true}}))")
   assert 'Jordan Tester' in js("document.getElementById('main').textContent")
  for width in [390,720,1280]:
   p.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':False},sid)
   assert js('document.documentElement.scrollWidth<=innerWidth'),width
  Path('/private/tmp/benefitstep-household-review.png').write_bytes(base64.b64decode(p.call('Page.captureScreenshot',{'format':'png'},sid)['data']))
  js("document.querySelector('[data-action=confirm]').click()")
  assert js("!document.querySelector('[data-action=official-form]').disabled")
  js("document.querySelector('#household-access [data-action=household]').click();document.getElementById('household-home_city').value='Sacramento';document.getElementById('household-age').value='120';document.querySelector('[data-action=save-household]').click()")
  assert js("document.querySelector('[data-action=official-form]').disabled")
  js("document.querySelector('#household-access [data-action=household]').click()")
  assert js("document.getElementById('household-age').value")=='120'
  js("document.querySelector('[data-action=close]').click();document.querySelector('[data-route=documents]').click()")
  assert js("document.querySelectorAll('.cf-docrow').length")==1
  sample_imports=[]
  if '--examples' in sys.argv:
   folder=Path(sys.argv[sys.argv.index('--examples')+1]).expanduser()
   for file in sorted(folder.iterdir()):
    if file.suffix.lower() not in ['.png','.jpg','.jpeg','.gif']:continue
    encoded=base64.b64encode(file.read_bytes()).decode()
    result=js("(async()=>{const {loadDocument}=await import('../shared/browser/files.mjs');const bytes=Uint8Array.from(atob("+json.dumps(encoded)+"),c=>c.charCodeAt(0));const d=await loadDocument(new File([bytes],"+json.dumps(file.name)+"));return {filename:d.filename,mime:d.mime,pages:d.pages.length,preview:!!d.pages[0].preview,warnings:d.warnings}})()")
    assert result['pages']==1 and result['preview'],result
    if file.suffix.lower()=='.gif':assert result['mime']=='image/gif' and result['warnings'],result
    sample_imports.append(result['filename'])
  remote=[e for e in p.events if e.get('method')=='Network.requestWillBeSent' and e['params']['request']['url'].startswith(('http:','https:'))]
  errors=[e for e in p.events if e.get('method')=='Runtime.exceptionThrown']
  assert not remote,remote;assert not errors,errors
  print(json.dumps({'sampleImagesImported':sample_imports,'householdEntry':True,'staleAmountsExcluded':True,'sourceCorrection':True,'originalPreserved':True,'languagesPreserveProfile':True,'remoteRequests':len(remote),'exceptions':len(errors)}))
 finally:p.close()
