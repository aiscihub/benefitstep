"""Train a small public-data classifier; select parameters on validation only."""
import collections,hashlib,json,math,platform
from pathlib import Path
import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report,confusion_matrix,f1_score
from features import matrix,DIMENSIONS,FEATURE_VERSION,tokens
ROOT=Path(__file__).resolve().parent
SEED=20261003
LABELS=['invoice_or_receipt','other_document','pay_statement']
def sha(value):return hashlib.sha256(value.encode()).hexdigest()
def split_rows(rows):
 groups=collections.defaultdict(list)
 for r in rows:groups[r['group']].append(r)
 assignments={}
 for label in LABELS:
  selected=[(g,members) for g,members in groups.items() if members[0]['label']==label]
  if len(selected)<3:raise ValueError('Need at least three independent groups for '+label)
  selected.sort(key=lambda pair:sha(str(SEED)+pair[0]))
  forced=[g for g,m in selected if any(r['official_test_group'] for r in m)]
  pool=[g for g,m in selected if g not in forced]
  if forced:test=forced
  else:
   n=max(1,round(len(pool)*.15));test=pool[:n];pool=pool[n:]
  n=max(1,round(len(pool)*.18));val=pool[:n];train=pool[n:]
  if not train:raise ValueError('No remaining training groups for '+label)
  for split,ids in [('train',train),('validation',val),('test',test)]:
   for gid in ids:assignments[gid]=split
 for r in rows:r['split']=assignments[r['group']]
 return rows

def metrics(y,p,threshold):
 labels=np.array(LABELS);indices=p.argmax(axis=1);scores=p.max(axis=1);pred=labels[indices];routed=np.where(scores>=threshold,pred,'unknown');accepted=routed!='unknown'
 return {'n':len(y),'closed_set_macro_f1':float(f1_score(y,pred,labels=LABELS,average='macro',zero_division=0)),'closed_set_accuracy':float(np.mean(y==pred)),
 'closed_set_per_class':classification_report(y,pred,labels=LABELS,output_dict=True,zero_division=0),'confusion_labels':LABELS,'closed_set_confusion':confusion_matrix(y,pred,labels=LABELS).tolist(),
 'threshold':threshold,'accepted':int(accepted.sum()),'abstained':int((~accepted).sum()),'coverage':float(accepted.mean()),'accepted_accuracy':float(np.mean(y[accepted]==pred[accepted])) if accepted.any() else None,'confident_errors':int(((y!=pred)&accepted).sum()),
 'per_class_after_abstention':{label:{'n':int((y==label).sum()),'correct':int(((y==label)&(routed==label)).sum()),'abstained':int(((y==label)&(~accepted)).sum()),'wrong_route':int(((y==label)&accepted&(routed!=label)).sum())} for label in LABELS}}

def main():
 output=ROOT/'artifacts';output.mkdir(exist_ok=True)
 if (output/'metrics.json').exists():raise SystemExit('This experiment already evaluated its held-out test. Use a new versioned experiment for further tuning.')
 rows=split_rows([json.loads(line) for line in (ROOT/'data/processed/records.jsonl').read_text().splitlines()]);splits={k:[r for r in rows if r['split']==k] for k in ['train','validation','test']}
 split_manifest=[{k:r[k] for k in ['id','group','split','label','source','source_hashes','synthetic']} for r in rows]
 manifest_text=json.dumps(split_manifest,sort_keys=True,indent=2)+'\n';(ROOT/'data/split_manifest.json').write_text(manifest_text)
 counts={split:dict(collections.Counter(r['label'] for r in items)) for split,items in splits.items()};print('Frozen splits:',json.dumps(counts),flush=True)
 x={k:matrix([r['text'] for r in items]) for k,items in splits.items()};y={k:np.array([r['label'] for r in items]) for k,items in splits.items()}
 tfidf=TfidfTransformer(sublinear_tf=True,smooth_idf=True,norm='l2');x['train']=tfidf.fit_transform(x['train']);x['validation']=tfidf.transform(x['validation'])
 candidates=[];best=None
 for c in [.5,2.,8.]:
  model=LogisticRegression(C=c,class_weight='balanced',max_iter=1500,random_state=SEED,solver='lbfgs');model.fit(x['train'],y['train']);pred=model.predict(x['validation']);score=float(f1_score(y['validation'],pred,labels=LABELS,average='macro',zero_division=0));candidates.append({'C':c,'validation_macro_f1':score})
  if best is None or score>best[0]:best=(score,model,c)
 model=best[1];assert list(model.classes_)==LABELS
 val=model.predict_proba(x['validation']);thresholds=[]
 for threshold in [.5,.6,.7,.8,.85,.9,.95,.98]:
  result=metrics(y['validation'],val,threshold);thresholds.append(result)
 eligible=[r for r in thresholds if r['accepted_accuracy'] is not None and r['accepted_accuracy']>=.95 and r['coverage']>=.5]
 if eligible:chosen=max(eligible,key=lambda r:r['coverage'])
 else:chosen=max(thresholds,key=lambda r:(r['accepted_accuracy'] or 0,r['coverage']))
 threshold=chosen['threshold']
 # Freeze fitted parameters and chosen threshold before evaluating held-out examples.
 artifact={'schemaVersion':1,'modelId':'benefitstep-public-text-classifier-v0.1','family':'hashed TF-IDF + multinomial logistic regression','featureVersion':FEATURE_VERSION,'dimensions':DIMENSIONS,'maxChars':100000,'minTokens':12,'labels':LABELS,'threshold':threshold,'scoresAreCalibrated':False,'idf':tfidf.idf_.tolist(),'weights':model.coef_.tolist(),'bias':model.intercept_.tolist(),'splitManifestSha256':sha(manifest_text),'seed':SEED,'C':best[2],'deploymentEnabled':False,'scope':'Experimental text classification. Not OCR, field extraction, authenticity, or eligibility. Utility/rent/county-notice categories are not trained.'}
 model_text=json.dumps(artifact,separators=(',',':'));(output/'model.json').write_text(model_text+'\n')
 test=model.predict_proba(tfidf.transform(x['test']));test_metrics=metrics(y['test'],test,threshold)
 report={'experiment':'public-text-v0.1','model_sha256':sha(model_text+'\n'),'split_manifest_sha256':sha(manifest_text),'seed':SEED,'python':platform.python_version(),'sklearn':sklearn.__version__,'numpy':np.__version__,'training_counts':counts,'group_counts':{k:len({r['group'] for r in v}) for k,v in splits.items()},'validation_C_selection':candidates,'threshold_selection':'Validation only: maximize coverage with >=95% accepted accuracy and >=50% coverage; otherwise report best precision without passing gate.','validation':chosen,'validation_routing_gate_passed':bool(eligible),'test':test_metrics,'per_source_test':{source:metrics(y['test'][np.array([r['source']==source for r in splits['test']])],test[np.array([r['source']==source for r in splits['test']])],threshold) for source in sorted({r['source'] for r in splits['test']})},'release_approved':False,'limitations':['Source and class are partly confounded: pay statements come from PAYSLIPS; receipts include an Indonesian CORD sample; other documents are public synthetic FieldBench records.','Group isolation uses document IDs, declared generator/schema families and a near-duplicate proxy, not a complete issuer/template audit.','Public synthetic comparison data are not real US benefits documents.','No target-domain held-out utility, rent, county-notice or image classification accuracy measured.','Closed-set test metrics do not measure unknown-document false-routing rates.','Softmax scores are uncalibrated. Do not present them as accuracy or eligibility probabilities.']}
 (output/'metrics.json').write_text(json.dumps(report,indent=2)+'\n')
 predictions=[]
 for r,p in zip(splits['test'],test):predictions.append({'id':r['id'],'label':r['label'],'top':LABELS[int(p.argmax())],'score':float(p.max()),'routed':LABELS[int(p.argmax())] if p.max()>=threshold else 'unknown','source':r['source']})
 (output/'test_predictions.json').write_text(json.dumps(predictions,indent=2)+'\n')
 # Synthetic parity probes contain no training documents and are not an accuracy benchmark.
 probes=['Gross earnings salary payroll net pay federal tax pay period deductions','Invoice billed to payment terms subtotal tax total due line item service','Lease rent agreement landlord tenant monthly rent','County request verification income proof response deadline','Community picnic newsletter volunteers garden Saturday','']
 scores=model.predict_proba(tfidf.transform(matrix(probes)))
 (output/'parity_probes.json').write_text(json.dumps([{'text':t,'scores':p.tolist()} for t,p in zip(probes,scores)],indent=2)+'\n')
 print(json.dumps({'selected_C':best[2],'threshold':threshold,'validation':{k:chosen[k] for k in ['n','closed_set_macro_f1','coverage','accepted_accuracy']},'test':{k:test_metrics[k] for k in ['n','closed_set_macro_f1','closed_set_accuracy','coverage','accepted_accuracy','confident_errors']},'model_bytes':len(model_text),'release_approved':False},indent=2),flush=True)
if __name__=='__main__':main()
