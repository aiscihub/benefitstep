"""Fetch a bounded publisher CORD-v2 annotation sample; never fetch images.
The HF /rows endpoint was unavailable. Use the first-rows samples as a clearly
reported partial dataset, retaining exact hashes and the publisher revision.
"""
import hashlib,json
from pathlib import Path
from fetch_data import ROOT,RAW,fetch
DATASET='naver-clova-ix/cord-v2';REVISION='7f0115a4b758a71d6473b8d085751692da2fef98'
def main():
 root=RAW/'cord';root.mkdir(exist_ok=True)
 info=json.loads(fetch('https://huggingface.co/api/datasets/'+DATASET))
 if info['sha']!=REVISION:raise ValueError('CORD publisher revision changed; review before fetching.')
 license_path=root/'LICENSE-CC-BY'
 if not license_path.exists():license_path.write_bytes(fetch('https://raw.githubusercontent.com/clovaai/cord/master/LICENSE-CC-BY'))
 records=[];subset={}
 for split in ['train','validation','test']:
  cache=root/(split+'-first-rows.json')
  if not cache.exists():cache.write_bytes(fetch('https://datasets-server.huggingface.co/first-rows?dataset=naver-clova-ix%2Fcord-v2&config=default&split='+split))
  response=json.loads(cache.read_text());subset[split]={'n':len(response['rows']),'truncated_endpoint':response['truncated'],'response_sha256':hashlib.sha256(cache.read_bytes()).hexdigest()}
  for row in response['rows']:
   # Strip image URLs and metadata unrelated to the public annotation before any training input.
   gt=json.loads(row['row']['ground_truth']);path=split+'/'+str(row['row_idx'])+'.json';target=root/path;target.parent.mkdir(exist_ok=True);target.write_text(json.dumps(gt,sort_keys=True)+'\n')
   records.append({'source':'cord','path':path,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
 if json.loads(fetch('https://huggingface.co/api/datasets/'+DATASET))['sha']!=REVISION:raise ValueError('Revision changed during download.')
 manifest=json.loads((ROOT/'data/source_manifest.json').read_text());manifest['sources']['cord']={'repo':DATASET,'revision':REVISION,'license':'CC BY 4.0','attribution':'NAVER Corp.; Park et al., CORD: A Consolidated Receipt Dataset for Post-OCR Parsing (2019)','license_sha256':hashlib.sha256(license_path.read_bytes()).hexdigest(),'subset':subset,'scope':'Publisher first-rows endpoint sample, not the complete 1,000-document release. OCR annotation words only, no images.'};manifest['records']=[r for r in manifest['records'] if r['source']!='cord']+records;(ROOT/'data/source_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(subset,indent=2))
if __name__=='__main__':main()
