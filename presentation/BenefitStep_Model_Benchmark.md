# BenefitStep model benchmark — slides and wording

Measured 2026-10-04T00:25:00.511765+00:00. Generated from the frozen model results and browser timing artifacts. The first five appendix slides retain those original measurements. The latest candidate evaluation is added below; the main deck integrates it on slide 8.

## Slide 1 — Three public data sources, 767 eligible documents

| Dataset | Training | Validation | Held-out test |
|---|---:|---:|---:|
| PAYSLIPS | 285 | 123 | 117 |
| FieldBench — selected synthetic CC0 records | 155 | 17 | 33 |
| CORD-v2 — bounded text subset | 20 | 4 | 13 |
| **Total** | **460** | **144** | **163** |

**Wording:** “We trained a small text classifier using three public data sources. We kept related records together across splits. The counts are unique eligible documents after filtering, not downloaded pages. No applicant documents were used for training.”

---

## Slide 2 — Recognition with an Unknown option

- **126 correct suggestions**, **37 unknowns**, **0 incorrect accepted suggestions** on the 163-document held-out test.
- Suggestion coverage: **77.3%**.
- Before abstention: accuracy **98.8%**, macro-F1 **0.973**.
- Always predicting the majority class: **71.8%** accuracy.

**Wording:** “The model can withhold a suggestion. It answered on 126 test documents, all correctly in this small sample, and left 37 unknown. This is not a claim of perfect recognition: source and category are partly confounded, and real applicant-document accuracy has not been measured.”

---

## Slide 3 — Small model, local processing

| Measured operation | Median time |
|---|---:|
| Load and validate packaged weights | 6.2 ms |
| Classify 163 already-readable texts | 5.5 ms |
| Prepare 10 searchable demo PDFs | 0.62 seconds |

Device: **Apple M3 Pro**, Chrome/154.0.8037.95 headless. Weights: **538 KiB**.

**Wording:** “The classifier works on text, so its work is fast. PDF parsing and rendering take more time. On this computer, ten small searchable PDFs took about 0.62 seconds through the local reader and Doctor checks. These timings exclude scanned OCR, native AI, file selection and UI painting; other devices may differ.”

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

---

## Slide 5 — The harder challenge reveals the gap

- **12 new readable scenarios:** 0 correct suggestions, 11 unknowns, 1 wrong suggestion.
- A payroll teaching handout was mistaken for a pay statement.
- The local label reader recovered **1 of 11 selected fields**.
- Separate variants cover scans, OCR errors, mixed files and a duplicate.

**Wording:** “The earlier public benchmark was too narrow to establish real-world readiness. New wording and layouts exposed substantial abstention and a false suggestion. We kept the model unchanged and recorded the failures. This is why our next work must improve data diversity and extraction, followed by a fresh independent evaluation.”

These are synthetic development cases, not an estimate of population accuracy. See [challenge results](../demo/challenge-v1/RESULTS.md).


---

## Slide 6 — Realistic corpus and unreleased v0.2 candidate

**144 fictional documents / 36 authored families / 288 paired PDF-text and actual OCR captures.**

| Partition | Model rows | Unique documents |
|---|---:|---:|
| Training (460 public rows + 192 synthetic captures) | 652 | 556 |
| Validation | 192 | 168 |
| New synthetic test | 48 | 24 |
| Previously examined public regression set | 163 | 163 |

**Wording:** “Both captures stay with their parent document. Families and layout pools are separated across the new splits, but shared rendering components mean this is not an independent real-issuer benchmark. The thirty-six authored families are not thirty-six trained classes.”

## Slide 7 — Same harder test, different model versions

| Outcome on 48 captures of 24 new synthetic documents | Shipped v0.1 | Candidate v0.2 |
|---|---:|---:|
| Correct accepted suggestions | 0 | 14 |
| Unknown | 48 | 34 |
| Wrong accepted suggestions | 0 | 0 |

**Wording:** “The candidate failed its predeclared validation criteria and was not deployed. Its accepted test suggestions were invoices or receipts; all sixteen pay-record captures remained unknown. There is still a substantial recognition gap. A threshold of 0.70 is not a calibrated seventy-percent probability of correctness.”

**Timing scope:** Chrome 154 on local macOS/arm64 classified a warm batch of 48 already-extracted texts in a median 2.4 ms across ten batches. This excludes loading, PDF reading, OCR, field extraction and UI. Corpus OCR used a separate macOS tool; it has not been added to the extension.

Evidence: [candidate dataset and methods](../ml/document_classifier_v0_2/README.md), [frozen candidate metrics](../ml/document_classifier_v0_2/artifacts/metrics.json), [fictional document gallery](../ml/document_classifier_v0_2/data/realistic-v1/index.html). These are stored measurements, not a new benchmark run for this deck update.
