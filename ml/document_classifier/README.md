# BenefitStep document classifier — trained pilot

This is a trained text model with exported weights and working browser inference. It recognizes three broad types: **pay statement**, **invoice or receipt**, and **other document**. It returns **unknown** below the selected score threshold or for insufficient text. Field extraction and Package Doctor remain separate components.

## Try it

Reload `BenefitStep_v0_1/extension` in Chrome. **Add documents** now runs the trained classifier automatically with every unique file and displays the broad suggestion beside it. In an empty session, **Try AI demo with fictional documents** exercises classification, separate field extraction and Package Doctor together. For standalone experiments, choose **Processing options → Try trained classifier (experimental)**. Select searchable PDFs or text files together, or paste document text. Classification runs locally with the packaged model; no server, native Chrome model download, or Python is needed. Clear removes the lab's inputs and results. Closing or reloading loses them.

The integrated suggestions and standalone lab do not replace the preparation session's detailed document labels. It is an experimental comparison tool; broad categories are not yet a replacement for the app's detailed benefit-document taxonomy. Scanned pages need separate OCR.

Command-line inference from the repository root:

```sh
node BenefitStep_v0_1/ml/document_classifier/predict.mjs /path/to/document.txt
```

## Benchmark results

See [BENCHMARK.md](BENCHMARK.md) for dataset sizes, recognition results, supported types, score interpretation and measured browser latency. The same report is available in BenefitStep under **View model benchmark**. Regenerate timings with `python3 scripts/benefitstep_model_benchmark.py` from the repository root, then generate the report with `python3 BenefitStep_v0_1/ml/document_classifier/benchmark_report.py`. No fitting or threshold tuning occurs.

## What was trained

Hashed word/bigram TF-IDF with multinomial logistic regression, trained on 460 documents. Another 144 documents selected regularization and the abstention threshold; 163 were held out for the final test. The exported model is about 538 KiB and runs in plain JavaScript.

At the selected threshold, the held-out test produced **126 correct suggestions and 37 unknowns**, with no incorrect accepted suggestions in this small sample. Before abstention, macro-F1 was **0.973** (161/163 correct). These are conditional pilot results on filtered public data, not measured accuracy across BenefitsCal documents.

Read [MODEL_CARD.md](MODEL_CARD.md) for results and limitations, [DATA_CARD.md](DATA_CARD.md) for provenance, and [the shipped notices](../../models/NOTICE.md) for attribution.

## Reproduce the experiment

The current model and test results are retained as experiment `public-text-v0.1`. Training refuses to overwrite an evaluated experiment. Use a fresh copy for exact reproduction; make a new version with a new untouched test set before tuning further. Do not delete results to repeatedly optimize against the same test set.

From a fresh experiment directory, Python 3.9+:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python fetch_data.py
.venv/bin/python fetch_cord.py
.venv/bin/python prepare.py
.venv/bin/python train.py
.venv/bin/python test_pipeline.py
node --test test_inference.mjs
```

Only the two fetch commands require public network access. Exact cached downloads and hashes are recorded in `data/source_manifest.json`. CORD's bounded API response is cached and hashed; reproducing from a future live API response requires comparing that hash, even though its backing dataset revision is checked. Raw/processed data and the Python environment are gitignored and never copied into the extension. No BenefitStep user documents enter training.

Artifacts include the model, metrics, predictions with hashed record IDs, Python/JavaScript parity probes, a frozen split manifest, and browser validation. The browser check is reproducible from the repository root:

```sh
python3 scripts/benefitstep_classifier_smoke.py
```

The browser script uses a temporary Chrome profile and fictional PDFs. Production automatic routing is disabled in both the exported model and deployment manifest. Build 0.1.2 enables automatic experimental suggestions during intake, without using them to route extraction or confirm facts. See `../../demo/ai-components/DEMO.md` for the integrated walkthrough.
