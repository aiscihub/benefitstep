"""Verify corpus integrity and split isolation without fitting or changing scores."""
import collections,hashlib,json,statistics
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def main():
 manifest=json.loads((ROOT/'data/manifest.json').read_text());rows=[json.loads(s) for s in (ROOT/'data/synthetic_records.jsonl').read_text().splitlines()];splits=json.loads((ROOT/'data/split_manifest.json').read_text());groups=collections.defaultdict(set);documents=collections.defaultdict(set)
 for r in splits:groups[r['family']].add(r['split']);documents[r['document_id']].add(r['split'])
 assert all(len(s)==1 for s in groups.values());assert all(len(s)==1 for s in documents.values())
 assert len(manifest['documents'])==144 and len(rows)==288
 base=ROOT/'data/realistic-v1';lookup=collections.defaultdict(list)
 for r in rows:
  lookup[r['document_id']].append(r);assert hashlib.sha256(r['text'].encode()).hexdigest()==r['text_sha256']
 for r in manifest['documents']:
  rid=r['id'];assert {v['capture'] for v in lookup[rid]}=={'pdf_text','scan_ocr'}
  for d,suffix,key in [('pdf','.pdf','pdf_sha256'),('scans','.png','scan_sha256')]:assert hashlib.sha256((base/d/(rid+suffix)).read_bytes()).hexdigest()==r[key]
  fields=r['gold_fields']
  if 'gross' in fields:assert round(fields['gross']-fields['net'],2)>=0
  if 'total_due' in fields:assert round(fields['current_charges']+fields['prior_balance']-fields['paid'],2)==fields['total_due']
 ocr=json.loads((ROOT/'data/ocr-output.json').read_text());times=[r['milliseconds'] for r in ocr]
 out={'verifiedDocuments':144,'verifiedCaptureRows':288,'familyIsolation':True,'parentDocumentIsolation':True,'pdfAndScanHashesMatch':True,'expenseTotalsMatch':True,'ocrEngine':manifest['ocrEngine'],'trainingOCRLatencyMs':{'n':len(times),'median':statistics.median(times),'p95':sorted(times)[int(.95*(len(times)-1))]},'trainingOCRLatencyScope':'Local Vision recognition only, not rendering and not browser app latency.','unchangedDeployedModel':hashlib.sha256((ROOT.parents[1]/'models/public-type-model.json').read_bytes()).hexdigest()=='23ac10b26d73520ed85da16afddf3a0b6dae08e61358187f1b527491642b2cee'}
 assert out['unchangedDeployedModel'];(ROOT/'artifacts/data-audit.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
if __name__=='__main__':main()
