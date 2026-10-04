# Model card: benefitstep-public-text-classifier-v0.1

Trained October 3, 2026. Status: **experimental; automatic routing disabled**.

## Purpose and boundaries

Suggest a broad document type from readable text: `pay_statement`, `invoice_or_receipt`, or `other_document`. `unknown` is an abstention, not a separately trained class. The model does not extract amounts, identify people, read images, detect fraud, determine eligibility, or choose benefits policy. Utility, rent, medical and county notices are not separately trained classes.

Build 0.1.2 runs the model during batch import as an experimental suggestion and also offers a standalone lab. The model runs in the browser and does not store training examples, transmit entered documents, or modify application answers. This model is distinct from the existing native Chrome AI extraction adapter and deterministic local text reader.

## Architecture and training

- 8,192 FNV-1a hashed word and bigram features; sublinear term frequency, smoothed IDF fitted on training data only, L2 normalization.
- Lowercase ASCII letter tokens of length 2–32; numbers omitted. Dataset/demo marker words removed. Filenames and annotation labels are excluded from features.
- Multinomial logistic regression with balanced class weights; scikit-learn 1.6.1, NumPy 1.26.4, Python 3.9.6; seed 20261003.
- Regularization C selected from 0.5, 2, 8 using validation macro-F1; all tied at 1.0, so C=0.5 retained.
- Score threshold **0.5**, selected on validation to maximize coverage subject to at least 95% accepted accuracy and 50% coverage. Scores are uncalibrated and are not probabilities of correctness.
- Fewer than 12 tokens or more than 100,000 characters returns unknown at inference.

Grouping combines publisher document IDs, declared synthetic generator/schema families, and same-class near duplicates (word-set Jaccard ≥0.85). Groups are disjoint across splits. Original publisher test groups remain held out; this is a grouping proxy, not a certified issuer/template isolation audit.

| Class | Training | Validation | Test |
|---|---:|---:|---:|
| Pay statement | 285 | 123 | 117 |
| Invoice or receipt | 120 | 9 | 13 |
| Other document | 55 | 12 | 33 |
| Total | 460 | 144 | 163 |

## Measured results

Test set was evaluated after parameter selection. Before abstention, accuracy was **161/163 (98.77%)**, with macro-F1 **0.9733**. Both errors were pay statements predicted as invoices/receipts. After abstention:

| True class | Correct suggestions | Incorrect suggestions | Unknown |
|---|---:|---:|---:|
| Pay statement | 99 | 0 | 18 |
| Invoice or receipt | 9 | 0 | 4 |
| Other document | 18 | 0 | 15 |
| Total | **126** | **0** | **37** |

Coverage was **77.30%**. The 100% accuracy among accepted suggestions is a small-sample observation, not a reliability guarantee. Validation coverage was 140/144; all accepted validation suggestions were correct.

Full machine-readable results: [metrics.json](artifacts/metrics.json). Per-source macro-F1 in that file averages over all three labels, including absent labels; use its counts and accuracy when interpreting single-class source subsets.

## Limitations that prevent automatic routing

1. **Source and class are confounded.** Test pay statements all come from PAYSLIPS, receipts from CORD, and other documents from synthetic FieldBench. A model can learn source/language/style cues instead of general document semantics.
2. The test has only 13 receipts and 33 other documents. Invoice/receipt validation has only nine examples. Neither zero accepted errors nor high F1 establishes broad accuracy.
3. CORD is a bounded Indonesian receipt subset. Only 37 of 95 fetched annotations survived text eligibility/deduplication. Reported metrics exclude rejected examples and do not measure full-corpus coverage or end-to-end OCR quality.
4. The other-document category contains synthetic examples only. Real unfamiliar documents and intentional misleading text have not been evaluated as an out-of-distribution benchmark. Softmax thresholding alone cannot guarantee safe unknown detection.
5. No measured generalization to unseen US benefit-document issuers, scanned documents, non-English inputs, or finer benefit categories. Public text annotations differ from PDF.js reading order and noisy OCR.
6. Grouping removes identified overlap but cannot prove no unseen template leakage. No independent external evaluation or confidence calibration has been completed.

Before automatic routing: build a separately licensed target-domain benchmark across issuers and templates, add independent unknown documents and OCR failures, measure class-specific errors/coverage, and freeze a new evaluation set before further tuning.

## Runtime verification

Four JavaScript tests passed, including probability parity with Python to <1e-10 on six fictional probes. Four pipeline tests passed for grouping, class coverage, licenses and model hash. An installed-extension browser check recognized a fictional pay PDF, tested insufficient-text abstention and clear, and observed zero remote page requests, zero runtime exceptions and no persistent browser storage. The layout fit 360 CSS pixels. These checks do not establish general classification accuracy.

Model SHA-256: `23ac10b26d73520ed85da16afddf3a0b6dae08e61358187f1b527491642b2cee`. The build verifies the packaged weights against `models/manifest.json`.

## Follow-up challenge: important generalization failure

The new `demo/challenge-v1` synthetic development set contains 12 newly authored readable scenarios plus related scan/OCR/mixed variants and a duplicate. At the unchanged threshold, the 12 readable cases produced **0 correct suggestions, 11 unknowns, and 1 wrong suggestion** (a teaching handout labeled as a pay statement). The local label reader separately recovered 1 of 11 selected present fields; its limitations are not measurements of native AI extraction.

These cases are not a representative user sample and do not replace the original held-out public test. They directly demonstrate that the public-test result does not establish generalization to varied benefit-document wording and layouts. No tuning followed this evaluation. Preserve this now-inspected set as a development challenge and use a fresh independent set for future accuracy claims.
