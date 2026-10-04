"""Exercise the actual unpacked extension and CSP in an isolated Chrome profile."""
import base64,json,sys,tempfile,time
from pathlib import Path
APP=Path(__file__).resolve().parents[1];sys.path.insert(0,str(APP/'scripts'))
from extension_smoke import Pipe,find_chrome
FLOW=r'''(async()=>{
 const $=s=>document.querySelector(s),checks=[];
 const check=(name,ok)=>{checks.push({name,passed:!!ok});if(!ok)throw Error(name)};
 const click=a=>{if(a==='continue'&&!$('[data-action=continue]'))$('[data-action=see-results]').click();const b=$('[data-action="'+a+'"]');check('button '+a,!!b);b.click()};
 const set=(id,value,silent=false)=>{const el=$('#'+id);check('control '+id,!!el);el.value=value;if(!silent){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};
 const wait=async fn=>{for(let i=0;i<500;i++){if(fn())return;await new Promise(r=>setTimeout(r,30));}throw Error('Timed out')};
 check('CalFresh has four inputs',$('[data-cf="income"]')&&document.querySelectorAll('[data-cf]').length===4);
 check('program tabs without redundant checkboxes',document.querySelectorAll('input[data-program]').length===0&&document.querySelectorAll('[data-program-tab]').length===2);
 set('residence','yes');set('people','4');set('income','above');
 set('immigration','mixed');click('see-results');
 check('result stays on quick screen',!!$('#income')&&$('#quick-result').textContent.includes('above'));
 set('income','at_or_below');check('edited result marked stale',$('#quick-result').textContent.includes('not current'));
 click('see-results');check('updated result recalculated',$('#quick-result').textContent.includes('within the starting income guide'));
 check('immigration answer retained',$('#immigration').value==='mixed');set('income','above');
 check('correct reference option',$('#income').selectedOptions[0].textContent.includes('5,500'));
 set('people','2');check('changing size clears anchored income',$('#income').value==='');
 set('income','none');set('people','3');check('explicit zero retained',$('#income').value==='none');
 set('income','at_or_below');set('people','4',true);click('continue');
 check('Continue opens independent Medi-Cal',$('#medical-heading')&&document.querySelectorAll('[data-mc]').length===2);
 check('Medi-Cal residence not inherited',$('#residence-mc-person-1').value==='');
 check('No MC income threshold',!$('#income')&&!$('#program-panel').textContent.includes('$'));
 set('age-mc-person-1','19to64');set('residence-mc-person-1','yes');click('add-person');
 set('age-mc-person-2','under19');set('residence-mc-person-2','unknown');
 $('[data-program-tab="calfresh"]').click();check('silent size change cannot preserve old band',$('#income').value==='');
 set('income','above');click('continue');check('pending other program revisited',!!$('#medical-heading'));
 click('continue');check('documents includes starting summary',!!$('.starting-details'));
 check('above is not denial',$('.starting-details').textContent.includes('not a denial'));
 check('MC does not get income comparison',$('[data-start-result="medical"]').textContent.includes('have not been assessed'));
 $('[data-reopen="medical"]').click();set('age-mc-person-1','65plus');
 check('edited MC needs update',$('#tab-medical').textContent.includes('Needs update'));
 check('CF save unaffected',$('#tab-calfresh').textContent.includes('Answers saved'));
 $('[data-program-tab="calfresh"]').click();$('[data-program-tab="medical"]').click();check('draft restored',$('#age-mc-person-1').value==='65plus');
 $('#tab-medical').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));check('keyboard tab switches and focuses',document.activeElement.id==='tab-calfresh');
 click('reference-help');check('income guide uses selected size and amount',$('#dialog').textContent.includes('household of 4')&&$('#dialog').textContent.includes('$5,500')&&$('#dialog').textContent.includes('not a final eligibility decision'));click('close');check('dialog content cleared',!$('#dialog-content').textContent);
 document.querySelector('[data-route=documents]').click();click('ai-demo');await wait(()=>$('#batch-status')?.textContent.startsWith('Processing complete'));
 check('real demo imported',document.querySelectorAll('.cf-docrow').length===3);
 click('to-confirm');check('candidate facts shown',document.querySelectorAll('.cf-facts>div').length>0);click('confirm');
 check('apply independent start summaries',document.querySelectorAll('[data-start-result]').length===2);
 check('Medi-Cal submission still separate',document.body.textContent.includes('Submission not recorded'));
 click('package');check('real export controls available',!!$('[data-action="export"]'));click('close');
 check('localStorage empty',localStorage.length===0);check('indexedDB empty',(await indexedDB.databases()).length===0);check('cache empty',(await caches.keys()).length===0);check('no storage permission',!chrome.storage);
 click('privacy');click('clear');check('clear resets starting facts',$('#residence').value==='');
 click('see-results');click('continue');click('see-results');click('continue');check('blank answers saved as partial',$('.starting-details').textContent.includes('Partial answers saved'));
 return checks;
})()'''
with tempfile.TemporaryDirectory(prefix='benefitstep-policy-ui-') as tmp:
 pipe=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
 try:
  ext=pipe.call('Extensions.loadUnpacked',{'path':str(APP/'extension')})['id']
  tab=pipe.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId']
  sid=pipe.call('Target.attachToTarget',{'targetId':tab,'flatten':True})['sessionId']
  pipe.call('Runtime.enable',{},sid);pipe.call('Network.enable',{},sid);time.sleep(.35)
  def evaluate(expr):
   response=pipe.call('Runtime.evaluate',{'expression':expr,'awaitPromise':True,'returnByValue':True},sid,timeout=55)
   if 'exceptionDetails' in response:raise RuntimeError(json.dumps(response['exceptionDetails']))
   return response.get('result',{}).get('value')
  checks=evaluate(FLOW)
  # Existing source-based Doctor regression, independently of the mock.
  fixtures=[{'name':f.name,'data':base64.b64encode(f.read_bytes()).decode()} for f in (APP/'demo/package-doctor').glob('*.pdf')]
  evaluate('globalThis.DOCTOR_FIXTURES='+json.dumps(fixtures))
  doctor=evaluate((APP/'tests/doctor-browser.js').read_text())
  shots=[]
  for width in [320,360,420,1180]:
   pipe.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1100,'deviceScaleFactor':1,'mobile':False},sid)
   for program in ['calfresh','medical']:
    evaluate("document.querySelector('[data-route=quick]').click();document.querySelector('[data-program-tab=\""+program+"\"]').click()")
    overflow=evaluate('document.documentElement.scrollWidth>innerWidth');assert not overflow,(width,program)
    if width in [420,1180]:
     name=f'policy-ui-{program}-{width}.png';capture=pipe.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':True},sid)
     (APP/'tests'/name).write_bytes(base64.b64decode(capture['data']));shots.append(name)
  errors=[e for e in pipe.events if e.get('method')=='Runtime.exceptionThrown'];assert not errors,errors
  requests=[e['params']['request']['url'] for e in pipe.events if e.get('method')=='Network.requestWillBeSent' and e['params']['request']['url'].startswith(('http:','https:'))];assert not requests,requests
  result={'browser':pipe.call('Browser.getVersion')['product'],'checks':checks,'doctorRegression':doctor,'responsiveWidths':[320,360,420,1180],'screenshots':shots,'pageErrors':errors,'remotePageRequests':requests,'scope':'Real unpacked extension, synthetic document flows, no live BenefitsCal, native AI or full accessibility audit.'}
  (APP/'tests/latest-policy-ui-browser.json').write_text(json.dumps(result,indent=2)+'\n')
  print(json.dumps({'passedChecks':len(checks),'doctor':doctor,'screenshots':shots},indent=2))
 finally:pipe.close()
