# BenefitStep document classifier benchmark

Measured: 2026-10-04T00:25:00.511765+00:00 · experimental model · automatic routing not approved

Follow-up challenge: 0 correct suggestions, 11 unknowns and 1 wrong suggestion on 12 new readable synthetic scenarios. The public-test score does not establish generalization to varied benefit documents.

## What this benchmark establishes

Three public data sources supplied 767 eligible unique documents: 460 training, 144 validation and 163 held-out test records. Frozen model and threshold; no retraining or tuning for this benchmark. Browser predictions matched all 163 saved test predictions.

The model suggests three broad text-based types. Its score is not a probability that a user’s document is correctly recognized. Real applicant-document accuracy and unfamiliar-document rejection have not yet been measured.

## Datasets and splits

Counts below are deduplicated document records after filtering. Training fits weights; validation selects settings; the test set evaluates the frozen model.

PAYSLIPS started with 611 annotated pages merged by document ID. FieldBench used 255 explicitly synthetic CC0 documents. CORD used 95 annotations from a truncated first-rows API subset; only 37 survived text filtering/deduplication. These starting units are different and must not be summed as a document total.

Groups were separated using document IDs, declared generator families and near-duplicate proxies. Train/validation/test contain 147/33/79 groups. This is not a complete issuer/template audit. No user documents were used.

| Dataset | Eligible total | Train | Validation | Test |
|---|---|---|---|---|
| PAYSLIPS | 525 | 285 | 123 | 117 |
| FieldBench — selected synthetic CC0 records | 205 | 155 | 17 | 33 |
| CORD-v2 — bounded text subset | 37 | 20 | 4 | 13 |
| Total | 767 | 460 | 144 | 163 |

## What types can it recognize?

Unknown is an abstention, not a fourth trained class. “Other document” means the comparison category represented in training; it does not mean irrelevant to an application.

| Output / input | Evidence and boundary |
|---|---|
| Pay statement | 525 eligible records; 285 train, 123 validation, 117 test. Text classification only. |
| Invoice or receipt | 142 eligible records; 120 train, 9 validation, 13 test. Test examples are CORD receipts, so invoice-only test accuracy is unmeasured. |
| Other document | 100 eligible records; 55 train, 12 validation, 33 test. Only synthetic comparison documents. |
| Unknown | Returned below score 0.5, or for insufficient/unreadable/oversized text. Reliable unknown detection is not yet established. |
| Rent, utility, mortgage, childcare, support, medical, county notice | Not trained as separate categories. The existing reader may recognize fields independently. |
| Searchable PDF / plain text | Supported after text extraction. Production import limit: six pages/PDF, 8 MB/file, 24 files, 48 MB/batch. |
| Scanned PDF / photo | Not read by this text model; needs a separate OCR or image extraction component. |
| Language | ASCII word features. No validated multilingual performance. |

## Held-out recognition results

Before abstention: 161/163 correct (98.8%), macro-F1 0.973. Two pay statements were predicted as invoices/receipts; both were withheld by the threshold.

With the deployed suggestion threshold: 126 correct suggestions, 0 incorrect suggestions and 37 unknowns. Coverage is 77.3%; unknowns are not counted as correct. The 126/126 result among accepted suggestions is a small-sample observation, not a guarantee.

A baseline that always predicts the most common training class (pay statement) gets 71.8% accuracy and 0.279 macro-F1 on the same test, without abstention.

| True type | Test records | Correct suggestions | Incorrect suggestions | Unknown | Coverage |
|---|---|---|---|---|---|
| Invoice or receipt | 13 | 9 | 0 | 4 | 69.2% |
| Other document | 33 | 18 | 0 | 15 | 54.5% |
| Pay statement | 117 | 99 | 0 | 18 | 84.6% |

## New challenge: recognition does not generalize yet

A separate 18-file synthetic challenge contains 12 newly authored readable scenarios, five related scan/OCR/mixed variants and one duplicate. On the 12 new readable scenarios: 0 correct suggestions, 11 unknowns and 1 wrong suggestion. The incorrect suggestion labeled a payroll teaching handout as a pay statement.

The limited local label reader recovered 1 of 11 selected present fields, leaving 10 missing. 2 intentionally absent fields stayed absent. Native AI and general OCR were not evaluated. These extraction checks are separate from classifier performance.

Scanned and partly unreadable files returned unknown, and the exact duplicate was skipped. These expected limitations are not counted as successful text recognition. References were fixed before evaluation; no weights, thresholds or extraction code changed in response.

This is a deliberately challenging synthetic development set, not an independent real-applicant study. Nevertheless, it shows that the earlier public-data score does not establish readiness for varied benefit documents. The current model should remain an experimental suggestion component.

Challenge files and recorded failures are in demo/challenge-v1/ in the source package; expected.json and results.json preserve the inputs and outputs. The old public-data results remain unchanged and are shown separately.

## How confident should a user be?

Use the suggestion as a starting point for source review. We cannot yet assign a trustworthy numerical correctness probability to a new user document. A score of 0.8 does not mean 80% accuracy.

Source and label are confounded: all test pay statements are PAYSLIPS, all test receipts are CORD, and all test “other” records are synthetic FieldBench. Strong benchmark results can reflect publisher, language or style cues. The small test and validation categories also limit conclusions.

This descriptive score table includes the highest-scoring prediction for every test record, including predictions that were withheld. It is not a calibration model and was not used to change the threshold.

| Top-score range | Test records | Mean score | Observed top-prediction accuracy |
|---|---|---|---|
| 0.4–0.6 | 64 | 0.508 | 96.9% |
| 0.6–0.8 | 95 | 0.704 | 100.0% |
| 0.8–1.0 | 4 | 0.825 | 100.0% |

## Measured browser speed

Measured 2026-10-04T00:25:00.511765+00:00 on Apple M3 Pro, macOS-26.6.2-arm64-arm-64bit, Chrome/154.0.8037.95 (headless). Model size: 551,368 bytes. These measurements describe this machine and workload, not all devices.

Text timing uses all 163 public held-out texts, 20 warm-up documents and seven timed passes (1,141 calls). Amortized cost is approximately 0.039 ms/text, calculated from total pass time. Individual measurements are quantized at approximately 0.1 ms; a measured zero is below resolution. Single-document text percentiles are therefore not advertised.

Model loading uses five fresh page contexts with fetch cache disabled; OS caches are not flushed. Module import and first-time browser startup are excluded. PDF timing uses ten unique one-page fictional searchable PDFs, three passes: parsing/rendering, classification, local-label extraction and Doctor checks. File selection, UI painting, native AI, scanned OCR and network/model downloads are excluded. The first PDF pass includes lazy PDF engine setup.

| Operation | Median elapsed time | Measurement count / boundary |
|---|---|---|
| Load and validate packaged weights | 6.2 ms | 5 fresh page contexts |
| Classify 163 already-readable texts | 5.5 ms | 7 complete passes; warm classifier |
| Prepare one searchable demo PDF | 66.3 ms | 30 observations; p95 67.8 ms |
| Prepare the ten-PDF batch | 0.62 seconds | 3 passes; includes local reader and Doctor |

## Benefit-document demo probes

These ten existing fictional development examples are a scope demonstration, not independent held-out data or an accuracy estimate. One exact duplicate was excluded. Both pay statements received pay-statement suggestions; the other eight files returned unknown. No threshold or weights were changed to obtain these results.

This shows why the three-class model is not yet a complete benefits-document recognizer. Unknown can coexist with a useful detailed label from the separate local reader.

| Fictional source | Trained classifier result | Separate reader label |
|---|---|---|
| 01-pay-september-15.pdf | Pay statement | paystub |
| 02-pay-september-30.pdf | Pay statement | paystub |
| 04-rent.pdf | Unknown | rent |
| 05-utility.pdf | Unknown | utility |
| 06-childcare.pdf | Unknown | childcare |
| 07-support.pdf | Unknown | support |
| 08-medical.pdf | Unknown | medical |
| 09-mortgage.pdf | Unknown | mortgage |
| 10-unrelated.pdf | Unknown | unknown |
| 11-incomplete-rent.pdf | Unknown | rent |

## Next benchmark required before broader claims

Freeze a new evaluation set with unseen US issuers and templates, distinct benefit-document categories, unfamiliar documents, scanned pages and noisy OCR. Keep related documents together and retain unreadable cases when measuring end-to-end coverage.

Evaluate errors and abstention per category and language; calibrate on a separate validation set; measure unknown false suggestions and latency on lower-resource devices. Do not retune using this already-inspected test set.

A larger test size alone will not remove source/class confounding. Recognition, field extraction and Package Doctor need separate accuracy evaluations. Neither eligibility nor authenticity is measured here.

## Reproducibility and provenance

Benchmark: public-text-v0.1-benchmark-1. Model SHA-256: 23ac10b26d73520ed85da16afddf3a0b6dae08e61358187f1b527491642b2cee. Split manifest SHA-256: 2fbea97cea3f3032b96de67562bc8b715a7d70817f1f8c3ba451068e4afad6a5.

From the repository root: python3 scripts/benefitstep_model_benchmark.py; then python3 BenefitStep_v0_1/ml/document_classifier/benchmark_report.py; then node BenefitStep_v0_1/scripts/build.mjs. Public processed data must already be present locally (see training README). The scripts never fit or retune the model.

Input artifacts: benchmark_config.json, data/source_manifest.json, data/split_manifest.json, artifacts/metrics.json, artifacts/test_predictions.json, artifacts/browser-benchmark.json. Output summaries contain counts, timings and synthetic filenames, not public OCR text or user documents.

No remote HTTP(S) page requests or runtime exceptions were observed in the benchmark. Browser localStorage, IndexedDB and Cache Storage stayed empty. This is an instrumented-page observation, not a comprehensive security audit.

## Dataset sources

- [PAYSLIPS](https://github.com/buthaya/payslips) — MIT; revision `ec64d17fa94d876b1834760594340a058dac5106`.
- [FieldBench — selected synthetic CC0 records](https://github.com/fieldbench/corpus) — CC0 1.0 (selected synthetic documents only); revision `fcfefbfbde1909ea440e058593eb72387b636a3f`.
- [CORD-v2 — bounded text subset](https://huggingface.co/datasets/naver-clova-ix/cord-v2) — CC BY 4.0; revision `7f0115a4b758a71d6473b8d085751692da2fef98`.
