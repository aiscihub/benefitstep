"""Versioned candidate. Uses old train/validation partitions; old test is regression only.
New authored-family test is scored once, after freezing model and threshold.
"""
import collections, hashlib, json, platform, sys, time
from pathlib import Path
ROOT=Path(__file__).resolve().parent;OLD=ROOT.parent/'document_classifier'
sys.path.insert(0,str(OLD))
import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.linear_model import LogisticRegression
from features import matrix,tokens,DIMENSIONS,FEATURE_VERSION
# Avoid importing the identically named train module while this file is __main__.
import importlib.util
spec=importlib.util.spec_from_file_location('old_metrics',OLD/'train.py');prior=importlib.util.module_from_spec(spec);spec.loader.exec_module(prior)
metrics=prior.metrics;LABELS=prior.LABELS

def sha(b):return hashlib.sha256(b).hexdigest()
def dump(path,value):path.write_text(json.dumps(value,indent=2)+'\n')
def score_artifact(a,rows):
 x=matrix([r['text'] for r in rows]);x.data=np.log(x.data)+1;x=x.multiply(np.array(a['idf'])).tocsr()
 norm=np.sqrt(x.multiply(x).sum(axis=1)).A1;norm[norm==0]=1;x=x.multiply(1/norm[:,None]);z=np.asarray(x@np.array(a['weights']).T)+np.array(a['bias']);p=np.exp(z-z.max(axis=1,keepdims=True));return p/p.sum(axis=1,keepdims=True)
def counts(rows):
 return {s:{'rows':len([r for r in rows if r['split']==s]),'by_source':dict(collections.Counter(r['source'] for r in rows if r['split']==s)),'by_class':dict(collections.Counter(r['label'] for r in rows if r['split']==s)),'unique_documents':len({r['document_id'] for r in rows if r['split']==s})} for s in ['train','validation','test','regression']}
def main():
 out=ROOT/'artifacts';out.mkdir(exist_ok=True)
 if (out/'model.json').exists():raise SystemExit('Candidate already frozen. Use a new experiment for changes or retuning.')
 syn=[json.loads(l) for l in (ROOT/'data/synthetic_records.jsonl').read_text().splitlines()]
 oldsplit={r['id']:r['split'] for r in json.loads((OLD/'data/split_manifest.json').read_text())};pub=[]
 for l in (OLD/'data/processed/records.jsonl').read_text().splitlines():
  r=json.loads(l);r['split']=oldsplit[r['id']];r['split']='regression' if r['split']=='test' else r['split'];r['document_id']='public:'+r['id'];r['family']=r['group'];r['capture']='publisher_text';pub.append(r)
 rows=pub+syn;splits={s:[r for r in rows if r['split']==s] for s in ['train','validation','test','regression']}
 # Actual identities/groups, not rendered variants, determine isolation.
 for key in ['document_id','family']:
  seen={}
  for r in rows:
   if r[key] in seen:assert seen[r[key]]==r['split'],(key,r[key])
   seen[r[key]]=r['split']
 fingerprints={}
 for r in rows:
  h=sha(' '.join(tokens(r['text'])).encode())
  if h in fingerprints:assert fingerprints[h]['split']==r['split'],('normalized duplicate crosses splits',r['id'],fingerprints[h]['id'])
  fingerprints[h]=r
 manifest=[{k:r[k] for k in ['id','document_id','family','split','label','source','capture']} for r in rows];dump(ROOT/'data/split_manifest.json',manifest)
 split_sha=sha((ROOT/'data/split_manifest.json').read_bytes())
 train=splits['train'];val=splits['validation'];x=matrix([r['text'] for r in train]);tf=TfidfTransformer(sublinear_tf=True,smooth_idf=True,norm='l2');x=tf.fit_transform(x);vx=tf.transform(matrix([r['text'] for r in val]));y=np.array([r['label'] for r in train]);vy=np.array([r['label'] for r in val]);mask=np.array([r['source']=='benefitstep_realistic_synthetic' for r in val])
 # Each synthetic document has two captures; paired samples total one document's weight.
 weight=np.array([.5 if r['source']=='benefitstep_realistic_synthetic' else 1 for r in train]);options=[];best=None
 for c in [.5,2.,8.]:
  model=LogisticRegression(C=c,class_weight='balanced',solver='lbfgs',max_iter=1500,random_state=20261003);model.fit(x,y,sample_weight=weight);p=model.predict_proba(vx)
  real=metrics(vy[mask],p[mask],.5);public=metrics(vy[~mask],p[~mask],.5);score=(real['closed_set_macro_f1']+public['closed_set_macro_f1'])/2
  options.append({'C':c,'mean_validation_domain_macro_f1':score,'synthetic_macro_f1':real['closed_set_macro_f1'],'public_macro_f1':public['closed_set_macro_f1']})
  if best is None or score>best[0]:best=(score,model,c)
 model=best[1];vp=model.predict_proba(vx);thresholds=[]
 for t in [.5,.6,.7,.8,.85,.9,.95,.98]:
  result=metrics(vy,vp,t);result['synthetic']=metrics(vy[mask],vp[mask],t);result['public']=metrics(vy[~mask],vp[~mask],t)
  result['gate']=all((result[k]['accepted_accuracy'] or 0)>=.95 and result[k]['coverage']>=.5 for k in ['synthetic','public']);thresholds.append(result)
 eligible=[m for m in thresholds if m['gate']]
 chosen=max(eligible,key=lambda r:r['coverage']) if eligible else max(thresholds,key=lambda r:(min(r[k]['accepted_accuracy'] or 0 for k in ['synthetic','public']),r['coverage']))
 threshold=chosen['threshold']
 a={'schemaVersion':1,'modelId':'benefitstep-realistic-text-candidate-v0.2','family':'hashed TF-IDF + multinomial logistic regression','featureVersion':FEATURE_VERSION,'dimensions':DIMENSIONS,'maxChars':100000,'minTokens':12,'labels':LABELS,'threshold':threshold,'scoresAreCalibrated':False,'idf':tf.idf_.tolist(),'weights':model.coef_.tolist(),'bias':model.intercept_.tolist(),'splitManifestSha256':split_sha,'seed':20261003,'C':best[2],'deploymentEnabled':False,'scope':'Candidate broad text classifier trained with public data and synthetic PDF/OCR pairs. Not a visual model, OCR engine, authenticity check, field extractor or eligibility model.'}
 (out/'model.json').write_text(json.dumps(a,separators=(',',':'))+'\n')
 report={'experiment':'realistic-text-v0.2','modelSha256':sha((out/'model.json').read_bytes()),'splitManifestSha256':split_sha,'python':platform.python_version(),'sklearn':sklearn.__version__,'counts':counts(rows),'selection':options,'validation':chosen,'thresholdCandidates':thresholds,'releaseApproved':False,'deployedToExtension':False,'testScope':'New authored scenario families and layout-theme pool. Shared generator/table components mean this is not an independent real-world or unseen-issuer test. Paired captures are not independent documents.','publicRegressionScope':'The previously inspected v0.1 public test is regression only, not fresh holdout.'}
 old=json.loads((OLD/'artifacts/model.json').read_text());predictions=[]
 for name in ['test','regression']:
  subset=splits[name];truth=np.array([r['label'] for r in subset]);tx=tf.transform(matrix([r['text'] for r in subset]));start=time.perf_counter();p=model.predict_proba(tx);elapsed=(time.perf_counter()-start)*1000
  bp=score_artifact(old,subset);report[name]={'candidate':metrics(truth,p,threshold),'baseline_v0_1':metrics(truth,bp,old['threshold']),'pythonBatchPredictionMsExcludingFeatures':elapsed}
  if name=='test':
   report[name]['byCapture']={cap:{'candidate':metrics(truth[np.array([r['capture']==cap for r in subset])],p[np.array([r['capture']==cap for r in subset])],threshold),'baseline':metrics(truth[np.array([r['capture']==cap for r in subset])],bp[np.array([r['capture']==cap for r in subset])],old['threshold'])} for cap in ['pdf_text','scan_ocr']}
  for r,probs in zip(subset,p):predictions.append({'id':r['id'],'document_id':r['document_id'],'family':r['family'],'split':name,'capture':r['capture'],'expected':r['label'],'top':LABELS[int(probs.argmax())],'score':float(probs.max()),'routed':LABELS[int(probs.argmax())] if probs.max()>=threshold else 'unknown'})
 # Unit of evaluation is also reported at original-document level: both captures must succeed.
 tests=[r for r in predictions if r['split']=='test'];docs=collections.defaultdict(list)
 for r in tests:docs[r['document_id']].append(r)
 report['test']['pairedDocuments']={'n':len(docs),'bothCapturesCorrect':sum(all(r['routed']==r['expected'] for r in rs) for rs in docs.values()),'atLeastOneWrongSuggestion':sum(any(r['routed'] not in [r['expected'],'unknown'] for r in rs) for rs in docs.values()),'atLeastOneUnknown':sum(any(r['routed']=='unknown' for r in rs) for rs in docs.values())}
 report['limitations']=['All new visual documents are synthetic; no new real user documents or screenshots were used.','Public source/class confounding persists in the inherited corpus.','The held-out synthetic scenarios share common rendering components with training; this can inflate performance.','Only three broad labels are trained, not 36 reliable fine-grained types.','Scan OCR is local macOS training infrastructure; the extension still lacks general scan OCR.','Scores are uncalibrated and cannot be called probability of correctness.','Previously viewed challenge/demo packs were not added to training or treated as fresh tests.']
 dump(out/'metrics.json',report);dump(out/'predictions.json',predictions)
 probes=splits['test'][:8]+[r for r in splits['test'] if r['label']=='other_document'][:4];probs=model.predict_proba(tf.transform(matrix([r['text'] for r in probes])));dump(out/'parity.json',[{'id':r['id'],'text':r['text'],'scores':p.tolist()} for r,p in zip(probes,probs)])
 print(json.dumps({'counts':report['counts'],'C':best[2],'threshold':threshold,'validationGate':chosen['gate'],'newTest':report['test']['candidate'],'pairedDocuments':report['test']['pairedDocuments'],'publicRegression':report['regression']['candidate']},indent=2))
if __name__=='__main__':main()
