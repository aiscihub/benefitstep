"""Construct document-level records and conservative family/near-duplicate groups."""
import collections,hashlib,json
from pathlib import Path
from features import normalized,tokens,MAX_CHARS
ROOT=Path(__file__).resolve().parent
LABELS=['pay_statement','invoice_or_receipt','other_document']
def digest(x):return hashlib.sha256(x.encode()).hexdigest()
def build():
 source_manifest=json.loads((ROOT/'data/source_manifest.json').read_text());pays={};rows=[]
 for record in source_manifest['records']:
  path=ROOT/'data/raw'/record['source']/record['path'];raw=path.read_bytes()
  if hashlib.sha256(raw).hexdigest()!=record['sha256']:raise ValueError('Source hash changed')
  if record['source']=='payslips':
   d=json.loads(raw);docid=str(d['docid']);group=pays.setdefault(docid,[])
   group.append({'text':' '.join(d['words']),'page':d['page'],'split':record['path'].split('/')[0],'source_sha':record['sha256']})
  elif record['source']=='cord':
   d=json.loads(raw);text='\n'.join(' '.join(w['text'] for w in line['words']) for line in d['valid_line']);key='cord:'+record['path'];rows.append({'id':digest(key)[:20],'source':'cord','label':'invoice_or_receipt','text':text,'family':key,'official_test':record['path'].startswith('test/'),'source_hashes':[record['sha256']],'synthetic':False})
  else:
   m=json.loads((ROOT/'data/raw/fieldbench'/record['manifest']).read_text());category=record['path'].split('/')[0]
   label='invoice_or_receipt' if category in {'invoices','receipts'} else 'other_document'
   # Keep every example from the same declared generator/schema in one split.
   family='|'.join([category,m.get('source_name','unknown'),m.get('schema','unknown'),m.get('added_by','unknown')])
   rows.append({'id':digest('fieldbench:'+record['path'])[:20],'source':'fieldbench','label':label,'text':raw.decode('utf-8'),'family':'fieldbench:'+digest(family)[:20],'official_test':False,'source_hashes':[record['sha256']],'synthetic':True})
 for docid,pages in pays.items():
  pages.sort(key=lambda p:str(p['page']).zfill(5));text='\n'.join(p['text'] for p in pages)
  rows.append({'id':digest('payslips:'+docid)[:20],'source':'payslips','label':'pay_statement','text':text,'family':'payslips:'+digest(docid)[:20],'official_test':any(p['split']=='test' for p in pages),'source_hashes':[p['source_sha'] for p in pages],'synthetic':False})
 rows.sort(key=lambda r:r['id']);rejected=[];seen={};unique=[]
 for r in rows:
  if len(r['text'])>MAX_CHARS or len(tokens(r['text']))<12:rejected.append({'id':r['id'],'reason':'text_budget_or_too_short'});continue
  key=digest(normalized(r['text']))
  if key in seen:
   prior=seen[key]
   if prior['label']!=r['label']:raise ValueError('Contradictory labels on identical normalized text')
   prior['official_test']|=r['official_test'];rejected.append({'id':r['id'],'reason':'normalized_duplicate','kept':prior['id']});continue
  seen[key]=r;unique.append(r)
 # Connected components prevent near-duplicate layouts crossing boundaries. This is a proxy,
 # not certification that every issuer/template in the publisher's corpus is identified.
 parent=list(range(len(unique)))
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 def union(i,j):parent[find(j)]=find(i)
 families={}
 for i,r in enumerate(unique):
  if r['family'] in families:union(i,families[r['family']])
  else:families[r['family']]=i
 sets=[set(tokens(r['text'])) for r in unique]
 near_count=0
 for i in range(len(unique)):
  for j in range(i):
   if unique[i]['label']!=unique[j]['label']:continue
   a,b=sets[i],sets[j]
   if min(len(a),len(b))/max(len(a),len(b))<.85:continue
   if len(a&b)/len(a|b)>=.85:union(i,j);near_count+=1
 groups=collections.defaultdict(list)
 for i,r in enumerate(unique):groups[find(i)].append(r)
 for members in groups.values():
  gid=digest('|'.join(sorted(r['id'] for r in members)))[:20];official=any(r['official_test'] for r in members)
  for r in members:r['group']=gid;r['official_test_group']=official
 out=ROOT/'data/processed';out.mkdir(exist_ok=True)
 (out/'records.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in unique))
 report={'records':len(unique),'source_counts':dict(collections.Counter(r['source'] for r in unique)),'label_counts':dict(collections.Counter(r['label'] for r in unique)),'groups_per_class':{label:len({r['group'] for r in unique if r['label']==label}) for label in LABELS},'near_duplicate_pairs_grouped':near_count,'excluded':rejected,'grouping_limitation':'Publisher document IDs + declared generator/schema families + 0.85 word-set Jaccard components. Full issuer/template isolation is not certified.'}
 (ROOT/'data/preparation_report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='excluded'},indent=2))
 return unique
if __name__=='__main__':build()
