# More realistic document training — v0.2 candidate

Created 144 fictional documents across 36 authored scenario families, with a searchable PDF and a degraded scan of each: **288 paired text examples**. PDF text comes from the app’s PDF.js reader; scan text comes from actual local Apple Vision OCR. There is no hidden answer layer, scripted OCR corruption or gold-label injection into inference.

**This candidate is not ready to replace the shipped classifier.** It failed the predeclared validation precision/coverage gate. The new synthetic test produced 14 correct suggestions, 34 unknowns and no wrong accepted suggestions at threshold 0.70. All 16 pay-record captures were unknown. Before abstention, it misclassified all 16 “other” captures (pay simulations and insurance explanations). This is a useful training corpus and a measured failure, not evidence of production readiness.

## Inspect the documents

Open [the visual gallery](data/realistic-v1/index.html). It shows one of four variants from each family and links to the PDF, scan, extracted PDF text and actual OCR text. All people, organizations, identifiers and transactions are fictional. The screenshots supplied in the conversation were examples of structure; their pixels, personal details and text were not incorporated.

Examples include hourly and salaried wage statements, check/stub copies, payroll portal records, tips and commissions, utilities with old balances, rent receipts, childcare and medical bills, payroll-service invoices, bank deposits, leases, employment offers, tax summaries, coverage information, verification requests, pay projections and insurance explanations. These are **36 authored scenarios, not 36 trained output classes**. The classifier still has three broad outputs: pay statement, invoice/receipt and other document, plus abstention as unknown.

## Dataset sizes

| Partition | Public documents retained | New synthetic documents | New paired captures | Total model rows | Unique documents |
|---|---:|---:|---:|---:|---:|
| train | 460 | 96 | 192 | 652 | 556 |
| validation | 144 | 24 | 48 | 192 | 168 |
| test | 0 | 24 | 48 | 48 | 24 |
| regression | 163 | 0 | 0 | 163 | 163 |

The 460 public training records are the original 285 PAYSLIPS records, 155 selected synthetic FieldBench records and 20 CORD receipts. No new public records were downloaded in this experiment. The original public validation split is retained. The 163 previously examined public test documents are a regression check only; they are not a fresh holdout. Public attribution and licences remain in [the existing source manifest](../document_classifier/data/source_manifest.json) and [model notices](../../models/NOTICE.md).

The new corpus assigns 24 authored families to training, six to validation and six to test before fitting. Each family has four document variations. Both captures of a document stay together. Training, validation and test also use separate layout-theme pools. Exact normalized text duplicates across partitions are rejected. Common tables, vocabulary, fictional identity pools and rendering components remain shared: this is **not an independent real-issuer/template test**, and synthetic scores can be optimistic. Existing challenge and video packs were not used for fitting or as a new test.

## Frozen evaluation

| New test: 48 captures of 24 documents | Shipped v0.1 baseline | v0.2 candidate |
|---|---:|---:|
| Correct accepted suggestions | 0 | 14 |
| Unknown | 48 | 34 |
| Wrong accepted suggestions | 0 | 0 |
| Raw top-class accuracy before abstention | 32/48 (66.7%) | 32/48 (66.7%) |

Candidate: six of 24 original documents had both captures correctly suggested; 18 had at least one unknown. The 14 accepted captures were invoices/receipts. No pay-record capture was accepted. A projection or explanation being unknown does not mean the classifier correctly understood its purpose. Scores are uncalibrated, so 0.70 is a decision threshold, not “70% confident it is right.”

The inherited public regression test had 77 correct accepted suggestions and 86 unknowns. Its raw top-class result was 162/163. That narrower, previously inspected result does not supersede the new synthetic-test failure.

## Model and measured speed

The architecture remains 8,192 hashed word/bigram TF-IDF features with multinomial logistic regression. IDF and weights use training rows only. Paired synthetic captures receive half weight each. C=0.5 was selected by mean public/synthetic validation macro-F1 (lower C breaks ties). Threshold selection required at least 95% accepted precision and 50% coverage in both validation domains; no candidate threshold passed, so the reported fallback threshold does not authorize release.

Chrome 154.0.8037.95 on local macOS/arm64 classified 48 already-extracted texts in a median **2.4 ms** across ten warm batches. This excludes model loading, PDF reading, OCR, field extraction and UI. All 48 browser predictions match the frozen Python results. Local training OCR took a median **142 ms/image**; this is a separate macOS tool, not an OCR capability added to the extension.

## Files and reproduction

- `corpus.py`: authored content, fictional values and declared family/theme partitions.
- `build_corpus.py`: Chrome rendering, one-page/overflow checks, real PDF.js reading and scan construction.
- `ocr.swift`: local macOS Vision OCR; bounding boxes and recognition confidence are saved separately.
- `data/generation_plan.json`, `data/manifest.json`: frozen generation policy, family labels and PDF/scan hashes.
- `data/synthetic_records.jsonl`: 288 labeled text rows with parent document, family, capture and split.
- `data/split_manifest.json`: combined public/synthetic split membership.
- `train.py`: fits the candidate and selects settings on validation; refuses to overwrite a frozen candidate.
- `artifacts/model.json`, `metrics.json`, `predictions.json`: weights, complete metrics and individual outcomes.
- `audit.py`, `verify.mjs`, `browser_check.py`: hash/split integrity and Python/JavaScript/Chrome parity.

From the repository root, a new unevaluated copy can render with `python3 BenefitStep_v0_1/ml/document_classifier_v0_2/build_corpus.py` and train using `BenefitStep_v0_1/ml/document_classifier/.venv/bin/python BenefitStep_v0_1/ml/document_classifier_v0_2/train.py`. Rendering requires local Chrome and macOS Command Line Tools/Vision; model training uses the existing pinned requirements in v0.1. Public caches and their original splits must be present. Do not regenerate or refit this evaluated version to tune against its test.

Existing artifacts can be checked without retraining:

```sh
python3 BenefitStep_v0_1/ml/document_classifier_v0_2/audit.py
node BenefitStep_v0_1/ml/document_classifier_v0_2/verify.mjs
python3 BenefitStep_v0_1/ml/document_classifier_v0_2/browser_check.py
```

## What remains

The synthetic corpus broadens training conditions but does not supply new real-world validation. The next model experiment needs stronger semantic discrimination and more independently sourced, permissioned document families, especially bill-versus-explanation and paid-wages-versus-projection pairs. A new untouched evaluation set is required after making those changes. General browser OCR, detailed benefit-document categorization, field extraction and Package Doctor are separate work. The extension continues to ship v0.1; this candidate has not replaced it.
