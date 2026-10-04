import hashlib,json,unittest
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parent
class DatasetBoundaries(unittest.TestCase):
 def test_disjoint_groups_and_records(self):
  rows=json.loads((ROOT/'data/split_manifest.json').read_text());by_group=defaultdict(set);ids=set();sources=defaultdict(set)
  for r in rows:
   self.assertNotIn(r['id'],ids);ids.add(r['id']);by_group[r['group']].add(r['split'])
   for h in r['source_hashes']:sources[h].add(r['split'])
  self.assertTrue(all(len(v)==1 for v in by_group.values()));self.assertTrue(all(len(v)==1 for v in sources.values()))
 def test_class_coverage(self):
  rows=json.loads((ROOT/'data/split_manifest.json').read_text())
  for split in ['train','validation','test']:self.assertEqual({r['label'] for r in rows if r['split']==split},{'pay_statement','invoice_or_receipt','other_document'})
 def test_rights_filter(self):
  manifest=json.loads((ROOT/'data/source_manifest.json').read_text());self.assertFalse(manifest['user_documents_used'])
  for r in manifest['records']:
   if r['source']=='fieldbench':
    m=json.loads((ROOT/'data/raw/fieldbench'/r['manifest']).read_text());self.assertEqual(m['license'],'CC0 1.0');self.assertEqual(m['source'],'synthetic')
 def test_export_manifest_integrity(self):
  metrics=json.loads((ROOT/'artifacts/metrics.json').read_text());model=(ROOT/'artifacts/model.json').read_bytes();self.assertEqual(hashlib.sha256(model).hexdigest(),metrics['model_sha256']);self.assertFalse(metrics['release_approved'])
if __name__=='__main__':unittest.main()
