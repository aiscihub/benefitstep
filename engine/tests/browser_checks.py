from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,ok):
 checks.append({'name':name,'passed':bool(ok)})
 if not ok:raise AssertionError(name)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':1000});errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.url))
 page.set_content((ROOT/'BenefitStep_Engine_Lab.html').read_text(),wait_until='load')
 check('engine object loaded in browser',page.evaluate('typeof BenefitStepEngine.createEngine')=='function')
 check('14 fictional scenarios available',page.locator('#scenario option').count()==14)
 for s in json.loads((ROOT/'examples/index.json').read_text()):
  page.select_option('#scenario',s['id']);page.click('#run')
  check('browser evaluation '+s['id'],page.locator('#error').inner_text()=='')
  r=json.loads(page.locator('#json').text_content())
  check('non-authoritative result '+s['id'],r['authoritative'] is False and r['approvalPrediction'] is None)
 page.select_option('#scenario','both-programs');page.click('#run')
 check('two independent result sections',page.locator('.program').count()==2)
 before=page.locator('#json').text_content()
 check('run is deterministic',page.evaluate('JSON.stringify(BenefitStepEngine.createEngine(DATA.bundle).evaluate(DATA.examples[2].input))')==json.dumps(json.loads(before),separators=(',',':'),ensure_ascii=False))
 page.click('#edit');page.fill('#input','{"asOf":"bad"}');page.click('#run')
 check('malformed JSON data produces visible error','Check stopped' in page.locator('#error').inner_text())
 check('invalid input disables saving',page.locator('#download').is_disabled())
 page.select_option('#scenario','package-doctor');page.click('#run')
 check('Package Doctor runs','Package Doctor' in page.locator('#results').inner_text())
 check('official template limitation visible','not included' in page.locator('body').inner_text())
 check('form inventories are exposed',page.locator('.form-row').count()==3)
 check('no auto network',requests==[])
 check('no script errors',errors==[])
 check('no persistent local storage calls','localStorage' not in (ROOT/'lab/app.js').read_text())
 out=ROOT/'lab/screens';out.mkdir(exist_ok=True)
 page.screenshot(path=str(out/'engine_desktop.png'),full_page=True)
 page.set_viewport_size({'width':420,'height':900})
 check('narrow no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
 page.screenshot(path=str(out/'engine_420px.png'),full_page=True)
 b.close()
result={'checks':len(checks),'passed':sum(x['passed'] for x in checks),'tests':checks,'scope':'In-memory Chromium page; not installed extension, native AI, official form, agency connection or policy approval.'}
(ROOT/'tests/browser-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['checks','passed']}))
