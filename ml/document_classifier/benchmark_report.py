"""Generate an auditable benchmark summary from frozen predictions and browser measurements."""
import collections,hashlib,html,json,math,statistics
from pathlib import Path
ROOT=Path(__file__).resolve().parent
APP=ROOT.parents[1]
LABELS=['pay_statement','invoice_or_receipt','other_document']
NAMES={'pay_statement':'Pay statement','invoice_or_receipt':'Invoice or receipt','other_document':'Other document','unknown':'Unknown'}
SOURCES={'payslips':('PAYSLIPS','https://github.com/buthaya/payslips'), 'fieldbench':('FieldBench — selected synthetic CC0 records','https://github.com/fieldbench/corpus'), 'cord':('CORD-v2 — bounded text subset','https://huggingface.co/datasets/naver-clova-ix/cord-v2')}
def load(path):return json.loads((ROOT/path).read_text())
def sha(path):return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
def pct(x):return f'{100*x:.1f}%'
def summarize(values):
 ordered=sorted(values)
 return {'n':len(ordered),'mean':statistics.mean(ordered),'median':statistics.median(ordered),'p95NearestRank':ordered[math.ceil(.95*len(ordered))-1],'min':ordered[0],'max':ordered[-1]}

def build():
 metrics=load('artifacts/metrics.json');predictions=load('artifacts/test_predictions.json');splits=load('data/split_manifest.json');sources=load('data/source_manifest.json');browser=load('artifacts/browser-benchmark.json');config=load('benchmark_config.json')
 assert sha('artifacts/model.json')==metrics['model_sha256']==browser['modelSha256']==config['modelSha256']
 assert sha('data/split_manifest.json')==metrics['split_manifest_sha256']==browser['splitManifestSha256']
 assert sha('benchmark_config.json')==browser['configSha256']
 assert {r['id'] for r in predictions}=={r['id'] for r in splits if r['split']=='test'}
 assert len(predictions)==metrics['test']['n']
 counts=collections.Counter((r['source'],r['split']) for r in splits)
 datasets=[{'id':key,'name':name,'url':url,'revision':sources['sources'][key]['revision'],'license':sources['sources'][key]['license'],'downloaded':True,'usedForTraining':True,'eligibleUniqueDocuments':sum(counts[key,s] for s in ['train','validation','test']),'training':counts[key,'train'],'validation':counts[key,'validation'],'test':counts[key,'test']} for key,(name,url) in SOURCES.items()]
 majority=collections.Counter(r['label'] for r in splits if r['split']=='train').most_common(1)[0][0]
 baseline_accuracy=sum(r['label']==majority for r in predictions)/len(predictions)
 baseline_f1=sum(2*sum(r['label']==label and majority==label for r in predictions)/(sum(r['label']==label for r in predictions)+len(predictions)*(majority==label)) for label in LABELS)/len(LABELS)
 bins=[]
 for lo,hi in [(0,.2),(.2,.4),(.4,.6),(.6,.8),(.8,1.0000001)]:
  selected=[r for r in predictions if lo<=r['score']<hi]
  if selected:bins.append({'range':f'{lo:.1f}–{min(hi,1):.1f}','n':len(selected),'meanScore':statistics.mean(r['score'] for r in selected),'observedTopAccuracy':sum(r['top']==r['label'] for r in selected)/len(selected)})
 test=metrics['test'];m=browser['measurements'];pdf=m['pdfSamples'];pass0=[r for r in pdf if r['pass']==0]
 assert len(pass0)==10 and len({r['sha256'] for r in pass0})==10
 speed={'modelLoadMs':summarize([x['modelLoadMs'] for x in browser['freshPageLoads']]),'testTextBatchMs':summarize(m['textPassTotalsMs']),'amortizedTextMs':sum(m['textPassTotalsMs'])/len(m['textSamples']),'timerResolutionMs':m['timerResolutionMs'],'rawSingleTextMs':summarize([x['ms'] for x in m['textSamples']]),'pdfPreparationMs':summarize([x['totalProcessingMs'] for x in pdf]),'tenPdfBatchMs':summarize(m['pdfPassTotalsMs']),'pdfPages':[x['pages'] for x in pass0]}
 report={'benchmarkId':config['benchmarkId'],'measuredAt':browser['measuredAt'],'modelId':'benefitstep-public-text-classifier-v0.1','modelSha256':metrics['model_sha256'],'splitManifestSha256':metrics['split_manifest_sha256'],'modelBytes':browser['modelBytes'],'datasetCount':len(datasets),'datasets':datasets,'splitCounts':{s:sum(r['split']==s for r in splits) for s in ['train','validation','test']},'groupCounts':metrics['group_counts'],'classCounts':metrics['training_counts'],'test':test,'majorityBaseline':{'label':majority,'accuracy':baseline_accuracy,'macroF1':baseline_f1},'scoreReliabilityBins':bins,'speed':speed,'machine':browser['host'],'browser':browser['browser']['product'],'pdfProbes':pass0,'browserParityDocuments':browser['parityDocuments'],'privacy':{'remotePageRequests':browser['remotePageRequests'],'runtimeExceptions':browser['runtimeExceptions']},'userDocumentAccuracyMeasured':False,'probabilitiesCalibrated':False,'automaticRoutingApproved':False,'limitations':metrics['limitations']+['Test scores are conditional on preprocessing eligibility; raw short/unreadable records were filtered out.','Latency is from one Apple M3 Pro with headless Chrome; PDF fixtures are small, searchable, one-page synthetic files.','Individual text timing is quantized; zero measured duration means below timer resolution, not instant inference.','Existing PDF examples were used during development and are not a new independent accuracy benchmark.']}
 challenge_path=APP/'demo/challenge-v1/results.json'
 if challenge_path.exists():
  challenge=json.loads(challenge_path.read_text());expected=(APP/'demo/challenge-v1/expected.json').read_bytes()
  assert challenge['modelSha256']==report['modelSha256'] and hashlib.sha256(expected).hexdigest()==challenge['referenceSha256']
  report['newSyntheticChallenge']={'referenceSha256':challenge['referenceSha256'],'resultsSha256':hashlib.sha256(challenge_path.read_bytes()).hexdigest(),'newTextScenarios':challenge['newTextScenarios'],'selectedFieldChecks':challenge['selectedFieldChecks'],'scope':'New synthetic development challenge; not a representative real-user benchmark. Kept separate from original public test.'}
 return report

def write_report(report):
 r=report;t=r['test'];speed=r['speed'];sections=[]
 def section(title,paragraphs=(),headers=None,rows=None):sections.append((title,paragraphs,headers,rows))
 section('What this benchmark establishes',[
  f"Three public data sources supplied 767 eligible unique documents: 460 training, 144 validation and 163 held-out test records. Frozen model and threshold; no retraining or tuning for this benchmark. Browser predictions matched all {r['browserParityDocuments']} saved test predictions.",
  'The model suggests three broad text-based types. Its score is not a probability that a user’s document is correctly recognized. Real applicant-document accuracy and unfamiliar-document rejection have not yet been measured.'
 ])
 section('Datasets and splits',[
  'Counts below are deduplicated document records after filtering. Training fits weights; validation selects settings; the test set evaluates the frozen model.',
  'PAYSLIPS started with 611 annotated pages merged by document ID. FieldBench used 255 explicitly synthetic CC0 documents. CORD used 95 annotations from a truncated first-rows API subset; only 37 survived text filtering/deduplication. These starting units are different and must not be summed as a document total.',
  'Groups were separated using document IDs, declared generator families and near-duplicate proxies. Train/validation/test contain 147/33/79 groups. This is not a complete issuer/template audit. No user documents were used.'
 ],['Dataset','Eligible total','Train','Validation','Test'],[[d['name'],d['eligibleUniqueDocuments'],d['training'],d['validation'],d['test']] for d in r['datasets']]+[['Total',767,460,144,163]])
 section('What types can it recognize?',[
  'Unknown is an abstention, not a fourth trained class. “Other document” means the comparison category represented in training; it does not mean irrelevant to an application.'
 ],['Output / input','Evidence and boundary'],[
  ['Pay statement','525 eligible records; 285 train, 123 validation, 117 test. Text classification only.'],
  ['Invoice or receipt','142 eligible records; 120 train, 9 validation, 13 test. Test examples are CORD receipts, so invoice-only test accuracy is unmeasured.'],
  ['Other document','100 eligible records; 55 train, 12 validation, 33 test. Only synthetic comparison documents.'],
  ['Unknown','Returned below score 0.5, or for insufficient/unreadable/oversized text. Reliable unknown detection is not yet established.'],
  ['Rent, utility, mortgage, childcare, support, medical, county notice','Not trained as separate categories. The existing reader may recognize fields independently.'],
  ['Searchable PDF / plain text','Supported after text extraction. Production import limit: six pages/PDF, 8 MB/file, 24 files, 48 MB/batch.'],
  ['Scanned PDF / photo','Not read by this text model; needs a separate OCR or image extraction component.'],
  ['Language','ASCII word features. No validated multilingual performance.']
 ])
 section('Held-out recognition results',[
  f"Before abstention: {t['n']-2}/{t['n']} correct ({pct(t['closed_set_accuracy'])}), macro-F1 {t['closed_set_macro_f1']:.3f}. Two pay statements were predicted as invoices/receipts; both were withheld by the threshold.",
  f"With the deployed suggestion threshold: {t['accepted']} correct suggestions, {t['confident_errors']} incorrect suggestions and {t['abstained']} unknowns. Coverage is {pct(t['coverage'])}; unknowns are not counted as correct. The 126/126 result among accepted suggestions is a small-sample observation, not a guarantee.",
  f"A baseline that always predicts the most common training class (pay statement) gets {pct(r['majorityBaseline']['accuracy'])} accuracy and {r['majorityBaseline']['macroF1']:.3f} macro-F1 on the same test, without abstention."
 ],['True type','Test records','Correct suggestions','Incorrect suggestions','Unknown','Coverage'],[[NAMES[label],v['n'],v['correct'],v['wrong_route'],v['abstained'],pct((v['correct']+v['wrong_route'])/v['n'])] for label,v in t['per_class_after_abstention'].items()])
 if 'newSyntheticChallenge' in r:
  challenge=r['newSyntheticChallenge'];c=challenge['newTextScenarios'];f=challenge['selectedFieldChecks']
  section('New challenge: recognition does not generalize yet',[
   f"A separate 18-file synthetic challenge contains 12 newly authored readable scenarios, five related scan/OCR/mixed variants and one duplicate. On the 12 new readable scenarios: {c['correct']} correct suggestions, {c['unknown']} unknowns and {c['wrongSuggestion']} wrong suggestion. The incorrect suggestion labeled a payroll teaching handout as a pay statement.",
   f"The limited local label reader recovered {f['correct']} of {f['expectedPresent']} selected present fields, leaving {f['missing']} missing. {f['correctlyAbsent']} intentionally absent fields stayed absent. Native AI and general OCR were not evaluated. These extraction checks are separate from classifier performance.",
   'Scanned and partly unreadable files returned unknown, and the exact duplicate was skipped. These expected limitations are not counted as successful text recognition. References were fixed before evaluation; no weights, thresholds or extraction code changed in response.',
   'This is a deliberately challenging synthetic development set, not an independent real-applicant study. Nevertheless, it shows that the earlier public-data score does not establish readiness for varied benefit documents. The current model should remain an experimental suggestion component.',
   'Challenge files and recorded failures are in demo/challenge-v1/ in the source package; expected.json and results.json preserve the inputs and outputs. The old public-data results remain unchanged and are shown separately.'
  ])
 section('How confident should a user be?',[
  'Use the suggestion as a starting point for source review. We cannot yet assign a trustworthy numerical correctness probability to a new user document. A score of 0.8 does not mean 80% accuracy.',
  'Source and label are confounded: all test pay statements are PAYSLIPS, all test receipts are CORD, and all test “other” records are synthetic FieldBench. Strong benchmark results can reflect publisher, language or style cues. The small test and validation categories also limit conclusions.',
  'This descriptive score table includes the highest-scoring prediction for every test record, including predictions that were withheld. It is not a calibration model and was not used to change the threshold.'
 ],['Top-score range','Test records','Mean score','Observed top-prediction accuracy'],[[b['range'],b['n'],f"{b['meanScore']:.3f}",pct(b['observedTopAccuracy'])] for b in r['scoreReliabilityBins']])
 section('Measured browser speed',[
  f"Measured {r['measuredAt']} on {r['machine']['cpu']}, {r['machine']['os']}, {r['browser']} (headless). Model size: {r['modelBytes']:,} bytes. These measurements describe this machine and workload, not all devices.",
  f"Text timing uses all 163 public held-out texts, 20 warm-up documents and seven timed passes (1,141 calls). Amortized cost is approximately {speed['amortizedTextMs']:.3f} ms/text, calculated from total pass time. Individual measurements are quantized at approximately {speed['timerResolutionMs']:.1f} ms; a measured zero is below resolution. Single-document text percentiles are therefore not advertised.",
  'Model loading uses five fresh page contexts with fetch cache disabled; OS caches are not flushed. Module import and first-time browser startup are excluded. PDF timing uses ten unique one-page fictional searchable PDFs, three passes: parsing/rendering, classification, local-label extraction and Doctor checks. File selection, UI painting, native AI, scanned OCR and network/model downloads are excluded. The first PDF pass includes lazy PDF engine setup.'
 ],['Operation','Median elapsed time','Measurement count / boundary'],[
  ['Load and validate packaged weights',f"{speed['modelLoadMs']['median']:.1f} ms",'5 fresh page contexts'],
  ['Classify 163 already-readable texts',f"{speed['testTextBatchMs']['median']:.1f} ms",'7 complete passes; warm classifier'],
  ['Prepare one searchable demo PDF',f"{speed['pdfPreparationMs']['median']:.1f} ms",f"30 observations; p95 {speed['pdfPreparationMs']['p95NearestRank']:.1f} ms"],
  ['Prepare the ten-PDF batch',f"{speed['tenPdfBatchMs']['median']/1000:.2f} seconds",'3 passes; includes local reader and Doctor']
 ])
 section('Benefit-document demo probes',[
  'These ten existing fictional development examples are a scope demonstration, not independent held-out data or an accuracy estimate. One exact duplicate was excluded. Both pay statements received pay-statement suggestions; the other eight files returned unknown. No threshold or weights were changed to obtain these results.',
  'This shows why the three-class model is not yet a complete benefits-document recognizer. Unknown can coexist with a useful detailed label from the separate local reader.'
 ],['Fictional source','Trained classifier result','Separate reader label'],[[x['file'],NAMES[x['prediction']],x['extractedKind'].replace('_',' ')] for x in r['pdfProbes']])
 section('Next benchmark required before broader claims',[
  'Freeze a new evaluation set with unseen US issuers and templates, distinct benefit-document categories, unfamiliar documents, scanned pages and noisy OCR. Keep related documents together and retain unreadable cases when measuring end-to-end coverage.',
  'Evaluate errors and abstention per category and language; calibrate on a separate validation set; measure unknown false suggestions and latency on lower-resource devices. Do not retune using this already-inspected test set.',
  'A larger test size alone will not remove source/class confounding. Recognition, field extraction and Package Doctor need separate accuracy evaluations. Neither eligibility nor authenticity is measured here.'
 ])
 section('Reproducibility and provenance',[
  f"Benchmark: {r['benchmarkId']}. Model SHA-256: {r['modelSha256']}. Split manifest SHA-256: {r['splitManifestSha256']}.",
  'From the repository root: python3 scripts/benefitstep_model_benchmark.py; then python3 BenefitStep_v0_1/ml/document_classifier/benchmark_report.py; then node BenefitStep_v0_1/scripts/build.mjs. Public processed data must already be present locally (see training README). The scripts never fit or retune the model.',
  'Input artifacts: benchmark_config.json, data/source_manifest.json, data/split_manifest.json, artifacts/metrics.json, artifacts/test_predictions.json, artifacts/browser-benchmark.json. Output summaries contain counts, timings and synthetic filenames, not public OCR text or user documents.',
  'No remote HTTP(S) page requests or runtime exceptions were observed in the benchmark. Browser localStorage, IndexedDB and Cache Storage stayed empty. This is an instrumented-page observation, not a comprehensive security audit.'
 ])
 md=['# BenefitStep document classifier benchmark','',f"Measured: {r['measuredAt']} · experimental model · automatic routing not approved",'']
 body=['<p class="eyebrow">BenefitStep / Model benchmark</p>','<h1>What our document model can recognize.</h1>','<p class="subtitle">Measured public-data results, supported types and local browser speed.</p>','<p class="benchmark-boundary">Experimental model. User-document accuracy remains unmeasured; model scores are not correctness probabilities.</p>']
 if 'newSyntheticChallenge' in r:
  c=r['newSyntheticChallenge']['newTextScenarios'];notice=f"Follow-up challenge: {c['correct']} correct suggestions, {c['unknown']} unknowns and {c['wrongSuggestion']} wrong suggestion on 12 new readable synthetic scenarios. The public-test score does not establish generalization to varied benefit documents."
  md+=[notice,''];body.append('<p class="benchmark-boundary">'+html.escape(notice)+'</p>')
 for title,paragraphs,headers,rows in sections:
  md+=['## '+title,'']
  body+=['<section class="card pad"><h2>'+html.escape(title)+'</h2>']
  for paragraph in paragraphs:md += [paragraph,''];body.append('<p>'+html.escape(paragraph)+'</p>')
  if headers:
   md+=['| '+' | '.join(headers)+' |','|'+'|'.join(['---']*len(headers))+'|']
   md+=['| '+' | '.join(str(cell) for cell in row)+' |' for row in rows];md+=['']
   body.append('<div class="benchmark-table" tabindex="0" role="region" aria-label="'+html.escape(title)+' table"><table><thead><tr>'+''.join('<th scope="col">'+html.escape(x)+'</th>' for x in headers)+'</tr></thead><tbody>')
   for row in rows:body.append('<tr>'+''.join(('<th scope="row">'+html.escape(str(cell))+'</th>') if i==0 else '<td>'+html.escape(str(cell))+'</td>' for i,cell in enumerate(row))+'</tr>')
   body.append('</tbody></table></div>')
  body.append('</section>')
 md+=['## Dataset sources','']
 body.append('<section class="card pad"><h2>Dataset sources</h2><ul>')
 for d in r['datasets']:
  md.append(f"- [{d['name']}]({d['url']}) — {d['license']}; revision `{d['revision']}`.")
  body.append('<li><a href="'+html.escape(d['url'])+'" target="_blank" rel="noopener noreferrer">'+html.escape(d['name'])+'</a> — '+html.escape(d['license'])+'</li>')
 body.append('</ul></section>')
 (ROOT/'BENCHMARK.md').write_text('\n'.join(md)+'\n')
 (ROOT/'artifacts/benchmark-summary.json').write_text(json.dumps(r,indent=2)+'\n')
 (APP/'assets/benchmark.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BenefitStep — Model benchmark</title><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="benchmark.css"></head><body><main class="benchmark">'+''.join(body)+'</main></body></html>\n')
 (APP/'ml/dataset_register.json').write_text(json.dumps({'status':'Used by the trained pilot; separate from the original handoff candidate register','modelId':r['modelId'],'modelSha256':r['modelSha256'],'sources':r['datasets'],'userDocumentsUsed':False,'productionRoutingApproved':False,'sourceManifest':'document_classifier/data/source_manifest.json','benchmark':'document_classifier/BENCHMARK.md'},indent=2)+'\n')
 slides=f'''# BenefitStep model benchmark — slides and wording

Measured {r['measuredAt']}. Generated from the frozen model results and browser timing artifacts. Use these as optional slides after the Document AI introduction.

## Slide 1 — Three public data sources, 767 eligible documents

| Dataset | Training | Validation | Held-out test |
|---|---:|---:|---:|
'''+''.join(f"| {d['name']} | {d['training']} | {d['validation']} | {d['test']} |\n" for d in r['datasets'])+f'''| **Total** | **460** | **144** | **163** |

**Wording:** “We trained a small text classifier using three public data sources. We kept related records together across splits. The counts are unique eligible documents after filtering, not downloaded pages. No applicant documents were used for training.”

---

## Slide 2 — Recognition with an Unknown option

- **126 correct suggestions**, **37 unknowns**, **0 incorrect accepted suggestions** on the 163-document held-out test.
- Suggestion coverage: **{pct(t['coverage'])}**.
- Before abstention: accuracy **{pct(t['closed_set_accuracy'])}**, macro-F1 **{t['closed_set_macro_f1']:.3f}**.
- Always predicting the majority class: **{pct(r['majorityBaseline']['accuracy'])}** accuracy.

**Wording:** “The model can withhold a suggestion. It answered on 126 test documents, all correctly in this small sample, and left 37 unknown. This is not a claim of perfect recognition: source and category are partly confounded, and real applicant-document accuracy has not been measured.”

---

## Slide 3 — Small model, local processing

| Measured operation | Median time |
|---|---:|
| Load and validate packaged weights | {speed['modelLoadMs']['median']:.1f} ms |
| Classify 163 already-readable texts | {speed['testTextBatchMs']['median']:.1f} ms |
| Prepare 10 searchable demo PDFs | {speed['tenPdfBatchMs']['median']/1000:.2f} seconds |

Device: **{r['machine']['cpu']}**, {r['browser']} headless. Weights: **{r['modelBytes']/1024:.0f} KiB**.

**Wording:** “The classifier works on text, so its work is fast. PDF parsing and rendering take more time. On this computer, ten small searchable PDFs took about {speed['tenPdfBatchMs']['median']/1000:.2f} seconds through the local reader and Doctor checks. These timings exclude scanned OCR, native AI, file selection and UI painting; other devices may differ.”

---

## Slide 4 — What we can claim today

| Supported broad outputs | Not yet validated |
|---|---|
| Pay statement | Individual utility, rent, medical and county-notice categories |
| Invoice or receipt | Invoice-only held-out accuracy; current test examples are receipts |
| Other document; Unknown when uncertain | Reliable rejection of unfamiliar documents |
| Local classification of readable text | Scanned images, multilingual accuracy, calibrated confidence |

**Wording:** “A model score is not a correctness probability. Our current demo recognizes both pay statements and leaves eight other benefit examples unknown. The separate reader can still prepare useful labeled facts. The next evaluation needs unseen US issuers, noisy scans and independent unfamiliar-document examples.”

Evidence: [full benchmark](../ml/document_classifier/BENCHMARK.md), [machine-readable summary](../ml/document_classifier/artifacts/benchmark-summary.json), [raw browser measurements](../ml/document_classifier/artifacts/browser-benchmark.json).
'''
 if 'newSyntheticChallenge' in r:
  c=r['newSyntheticChallenge']['newTextScenarios'];f=r['newSyntheticChallenge']['selectedFieldChecks']
  slides+=f'''\n---\n\n## Slide 5 — The harder challenge reveals the gap\n\n- **12 new readable scenarios:** {c['correct']} correct suggestions, {c['unknown']} unknowns, {c['wrongSuggestion']} wrong suggestion.\n- A payroll teaching handout was mistaken for a pay statement.\n- The local label reader recovered **{f['correct']} of {f['expectedPresent']} selected fields**.\n- Separate variants cover scans, OCR errors, mixed files and a duplicate.\n\n**Wording:** “The earlier public benchmark was too narrow to establish real-world readiness. New wording and layouts exposed substantial abstention and a false suggestion. We kept the model unchanged and recorded the failures. This is why our next work must improve data diversity and extraction, followed by a fresh independent evaluation.”\n\nThese are synthetic development cases, not an estimate of population accuracy. See [challenge results](../demo/challenge-v1/RESULTS.md).\n'''
 (APP/'presentation/BenefitStep_Model_Benchmark.md').write_text(slides)
 print('Wrote benchmark report, summary, presentation wording, extension page and current dataset register.')

if __name__=='__main__':write_report(build())
