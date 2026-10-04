#!/usr/bin/env python3
"""Render fictional documents; extract real PDF text + local Vision OCR from scan variants."""
import base64, hashlib, html, json, platform, subprocess, sys, tempfile, time
from pathlib import Path
ROOT=Path(__file__).resolve().parent; REPO=ROOT.parents[2]; APP=ROOT.parents[1]
sys.path.insert(0,str(REPO/'scripts'))
from extension_smoke import Pipe,find_chrome
from corpus import families,create,CSS
OUT=ROOT/'data';DSET=OUT/'realistic-v1'
def digest(b):return hashlib.sha256(b).hexdigest()
def evaluate(pipe,sid,js):
 r=pipe.call('Runtime.evaluate',{'expression':js,'awaitPromise':True,'returnByValue':True},sid,timeout=55)
 if 'exceptionDetails' in r:raise RuntimeError(json.dumps(r['exceptionDetails']))
 return r['result'].get('value')
def main():
 if (ROOT/'artifacts/metrics.json').exists():raise SystemExit('Experiment evaluated: use a new version, not a regenerated test set.')
 for p in ['pdf','previews','scans','html','text','ocr']:(DSET/p).mkdir(parents=True,exist_ok=True)
 fs=list(families());plan={'schemaVersion':1,'dataset':'benefitstep-realistic-synthetic-v1','familySplits':fs,'recordsPerFamily':4,'captures':['pdf_text','scan_ocr'],'scope':'Authored scenario families and layout-theme pools split before generation; shared table components remain across splits. Not independent real issuer templates.','userDocumentsUsed':False,'screenshotUse':'Structural inspiration only. No copied identities, identifiers, amounts, pixels or screenshot OCR.','seed':9301}
 (OUT/'generation_plan.json').write_text(json.dumps(plan,indent=2)+'\n')
 records=[]
 with tempfile.TemporaryDirectory(prefix='benefitstep-realistic-') as tmp:
  pipe=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
  try:
   tid=pipe.call('Target.createTarget',{'url':'about:blank'})['targetId'];sid=pipe.call('Target.attachToTarget',{'targetId':tid,'flatten':True})['sessionId']
   pipe.call('Emulation.setDeviceMetricsOverride',{'width':816,'height':1056,'deviceScaleFactor':1,'mobile':False},sid)
   frame=pipe.call('Page.getFrameTree',{},sid)['frameTree']['frame']['id']
   for f in fs:
    for variant in range(4):
     i=len(records);rid=f'record-{i+1:03}';doc=create(f,variant,i)
     source='<!doctype html><html lang="en"><head><meta charset="utf-8"><style>'+CSS+'</style></head><body>'+doc['html']+'</body></html>'
     (DSET/'html'/f'{rid}.html').write_text(source)
     pipe.call('Page.setDocumentContent',{'frameId':frame,'html':source},sid)
     layout=evaluate(pipe,sid,"({footer:document.querySelector('footer').getBoundingClientRect().top,bottom:Math.max(...[...document.querySelector('.paper').children].filter(e=>e.tagName!=='FOOTER').map(e=>e.getBoundingClientRect().bottom))})")
     assert layout['bottom']+5<layout['footer'],(rid,f['subtype'],layout)
     pdf=base64.b64decode(pipe.call('Page.printToPDF',{'printBackground':True,'preferCSSPageSize':True,'displayHeaderFooter':False},sid)['data']);(DSET/'pdf'/f'{rid}.pdf').write_bytes(pdf)
     png=pipe.call('Page.captureScreenshot',{'format':'png','clip':{'x':0,'y':0,'width':816,'height':1056,'scale':1}},sid)['data'];(DSET/'previews'/f'{rid}.png').write_bytes(base64.b64decode(png))
     # Only pixels enter scan OCR. Deliberate resizing, skew, faded print and a margin shadow.
     js="""(async()=>{const im=new Image();im.src='data:image/png;base64,IMAGE';await im.decode();const c=document.createElement('canvas');c.width=816;c.height=1056;const x=c.getContext('2d');x.fillStyle='#e9e7e0';x.fillRect(0,0,816,1056);x.save();x.translate(408,528);x.rotate(ANGLE*Math.PI/180);x.filter='grayscale(1) contrast(CONTRAST) brightness(1.04) blur(BLURpx)';x.drawImage(im,-390,-505,780,1010);x.restore();let seed=SEED;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let k=0;k<6500;k++){x.fillStyle='rgba(40,35,25,'+(rnd()*.12)+')';x.fillRect(rnd()*816,rnd()*1056,1,1)}const g=x.createLinearGradient(0,0,65,0);g.addColorStop(0,'rgba(0,0,0,.17)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,65,1056);return c.toDataURL('image/png').split(',')[1]})()""".replace('IMAGE',png).replace('ANGLE',str([-.8,.6,1.1,-.4][variant])).replace('CONTRAST',str([.8,.66,.9,.74][variant])).replace('BLUR',str([.15,.28,.4,.1][variant])).replace('SEED',str(i+9301))
     scan=base64.b64decode(evaluate(pipe,sid,js));(DSET/'scans'/f'{rid}.png').write_bytes(scan)
     records.append({'id':rid,'family':f['id'],'label':f['label'],'subtype':f['subtype'],'split':f['split'],'layout':doc['layout'],'variant':variant,'gold_fields':doc['fields'],'pdf_sha256':digest(pdf),'scan_sha256':digest(scan)})
    if len(records)%16==0:print('Rendered',len(records),'of 144 documents + scans',flush=True)
   ext=pipe.call('Extensions.loadUnpacked',{'path':str(APP/'extension')})['id'];pipe.call('Page.navigate',{'url':f'chrome-extension://{ext}/assets/index.html'},sid);time.sleep(.3)
   for offset in range(0,len(records),12):
    batch=[{'id':r['id'],'data':base64.b64encode((DSET/'pdf'/f"{r['id']}.pdf").read_bytes()).decode()} for r in records[offset:offset+12]]
    results=evaluate(pipe,sid,"""(async()=>{const {loadDocument}=await import('../shared/browser/files.mjs');const out=[];for(const f of BATCH){const d=await loadDocument(new File([Uint8Array.from(atob(f.data),c=>c.charCodeAt(0))],f.id+'.pdf',{type:'application/pdf'}));out.push({id:f.id,text:d.pages.map(p=>p.text).join('\\n'),pages:d.pages.length});}return out})()""".replace('BATCH',json.dumps(batch)))
    for r in results:
     assert r['pages']==1 and len(r['text'])>100,r['id'];(DSET/'text'/f"{r['id']}.txt").write_text(r['text'])
   browser=pipe.call('Browser.getVersion')['product']
  finally:pipe.close()
 print('Running local Vision OCR on 144 degraded images...',flush=True)
 items=[{'id':r['id'],'path':str(DSET/'scans'/f"{r['id']}.png")} for r in records];(OUT/'ocr-input.json').write_text(json.dumps(items))
 binary='/private/tmp/benefitstep-training-ocr'
 subprocess.run(['xcrun','swiftc','-O','-module-cache-path','/private/tmp/benefitstep-swift-cache',str(ROOT/'ocr.swift'),'-o',binary],check=True)
 subprocess.run([binary,str(OUT/'ocr-input.json'),str(OUT/'ocr-output.json')],check=True)
 ocr={r['id']:r for r in json.loads((OUT/'ocr-output.json').read_text())};training=[]
 for r in records:
  result=ocr[r['id']];assert len(result['text'])>100,r['id']
  (DSET/'ocr'/f"{r['id']}.txt").write_text(result['text'])
  for capture,directory in [('pdf_text','text'),('scan_ocr','ocr')]:
   text=(DSET/directory/f"{r['id']}.txt").read_text()
   training.append({**{k:r[k] for k in ['family','label','subtype','split','layout']},'id':r['id']+'-'+capture,'document_id':r['id'],'capture':capture,'text':text,'text_sha256':digest(text.encode()),'source':'benefitstep_realistic_synthetic','synthetic':True})
 (OUT/'synthetic_records.jsonl').write_text(''.join(json.dumps(r)+'\n' for r in training))
 manifest={**plan,'browser':browser,'ocrEngine':'Apple Vision VNRecognizeTextRequest accurate en-US; local macOS '+platform.mac_ver()[0], 'ocrLanguageCorrection':False,'documents':records,'documentCount':len(records),'trainingRowsIncludingPairedCaptures':len(training),'generatorSha256':{n:digest((ROOT/n).read_bytes()) for n in ['corpus.py','build_corpus.py','ocr.swift']}}
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 cards=[]
 for r in records[::4]:
  rid=r['id'];cards.append('<article><a href="pdf/'+rid+'.pdf"><img loading="lazy" src="previews/'+rid+'.png"><b>'+html.escape(r['subtype'].replace('_',' '))+'</b></a><p>'+r['split']+' · '+r['label']+'</p><a href="scans/'+rid+'.png">Scan</a> · <a href="text/'+rid+'.txt">PDF text</a> · <a href="ocr/'+rid+'.txt">Actual scan OCR</a></article>')
 (DSET/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>BenefitStep training corpus</title><style>body{font:15px/1.5 Arial;background:#f0f3f1;color:#203d35;margin:35px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}article{background:white;padding:16px}img{width:100%}a{color:#165e52}b{display:block}</style><h1>More realistic training examples</h1><p>144 fictional documents in 36 authored scenario families; each has a searchable PDF and a degraded scan with actual local OCR. Four variations per family. One representative per family is shown here. Synthetic data is not a substitute for an independent real-document evaluation.</p><main>'+''.join(cards)+'</main>')
 print(json.dumps({'documents':len(records),'rows':len(training),'folder':str(DSET)},indent=2),flush=True)
if __name__=='__main__':main()
