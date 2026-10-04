"""Fetch pinned public records only. Never reads BenefitStep user documents."""
import concurrent.futures,hashlib,io,json,tarfile,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent
RAW=ROOT/'data/raw';RAW.mkdir(parents=True,exist_ok=True)
SOURCES={
 'payslips':{'repo':'buthaya/payslips','revision':'ec64d17fa94d876b1834760594340a058dac5106','license':'MIT','attribution':'Copyright (c) 2025 SCOR SE'},
 'fieldbench':{'repo':'fieldbench/corpus','revision':'fcfefbfbde1909ea440e058593eb72387b636a3f','license':'CC0 1.0 (selected synthetic documents only)','attribution':'FieldBench Contributors'}
}
def fetch(url,limit=5_000_000):
 for attempt in range(4):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'BenefitStep-Document-Classification-Research/0.1'})
   with urllib.request.urlopen(req,timeout=40) as response:data=response.read(limit+1)
   if len(data)>limit:raise ValueError('Public file exceeds bounded download limit')
   return data
  except Exception:
   if attempt==3:raise
   time.sleep(1+attempt)
def file_url(source,path):
 s=SOURCES[source];return 'https://raw.githubusercontent.com/'+s['repo']+'/'+s['revision']+'/'+path

def cached(source,path):
 target=RAW/source/path
 if not target.exists():
  raw=fetch(file_url(source,path));target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
 return target

def main():
 for key,source in SOURCES.items():
  (RAW/key).mkdir(exist_ok=True)
  for file in (['README.md','LICENSE'] if key=='payslips' else ['README.md','DATA_LICENSE.md','ATTRIBUTION.md']):cached(key,file)
  source['license_sha256']=hashlib.sha256((RAW/key/('LICENSE' if key=='payslips' else 'DATA_LICENSE.md')).read_bytes()).hexdigest()
 # The publisher explicitly licenses the PAYSLIPS annotations; download only those and retain notices.
 s=SOURCES['payslips'];tree_path=RAW/'payslips/tree.json'
 if not tree_path.exists():tree_path.write_bytes(fetch('https://api.github.com/repos/'+s['repo']+'/git/trees/'+s['revision']+'?recursive=1'))
 tree=json.loads(tree_path.read_text())['tree']
 files=[x['path'] for x in tree if x['path'].endswith('.json') and x['path'].startswith(('train/annotations/','test/annotations/'))]
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  for i,_ in enumerate(pool.map(lambda p:cached('payslips',p),files),1):
   if i%100==0:print('PAYSLIPS annotations:',i,'/',len(files),flush=True)
 s=SOURCES['fieldbench'];tree_path=RAW/'fieldbench/tree.json'
 if not tree_path.exists():tree_path.write_bytes(fetch('https://api.github.com/repos/'+s['repo']+'/git/trees/'+s['revision']+'?recursive=1'))
 tree=json.loads(tree_path.read_text())['tree'];paths={x['path'] for x in tree}
 categories={'invoices','receipts','contracts','irs_forms','insurance_policies','legal_filings'}
 manifests=[x['path'] for x in tree if x['path'].split('/')[0] in categories and '/manifests/' in x['path'] and x['path'].endswith('.json')]
 accepted=[];excluded={}
 def inspect(path):
  p=cached('fieldbench',path);m=json.loads(p.read_text());
  # Exclude all third-party documents, unresolved-license mirrors, and attribution assumptions.
  if m.get('source')!='synthetic' or m.get('license')!='CC0 1.0':return None,m.get('license','unknown')
  name=m.get('filename','')
  if not name or Path(name).name!=name:raise ValueError('Unsafe source filename')
  docpath=path.split('/')[0]+'/documents/'+name
  if docpath not in paths:return None,'missing source'
  cached('fieldbench',docpath)
  return {'path':docpath,'manifest':path},None
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  for i,(record,reason) in enumerate(pool.map(inspect,manifests),1):
   if record:accepted.append(record)
   else:excluded[reason]=excluded.get(reason,0)+1
   if i%100==0:print('FieldBench manifests reviewed:',i,'/',len(manifests),'accepted',len(accepted),flush=True)
 # Hash every used annotation and document, not only a mutable repository URL.
 records=[{'source':'payslips','path':p} for p in files]+[{'source':'fieldbench',**a} for a in accepted]
 for r in records:r['sha256']=hashlib.sha256((RAW/r['source']/r['path']).read_bytes()).hexdigest()
 manifest={'sources':SOURCES,'records':records,'excluded_fieldbench_licenses':excluded,'user_documents_used':False}
 (ROOT/'data').mkdir(exist_ok=True);(ROOT/'data/source_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print(json.dumps({'payslip_pages':len(files),'fieldbench_cc0_synthetic':len(accepted),'excluded':sum(excluded.values())}),flush=True)
if __name__=='__main__':main()
