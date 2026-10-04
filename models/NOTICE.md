# Public document classifier attribution

`public-type-model.json` was trained by the BenefitStep project on transformed text from selected public data. It is an experimental three-class text classifier. No source publisher endorses BenefitStep. The original annotations/documents are not bundled here.

- **PAYSLIPS**, copyright (c) 2025 SCOR SE. MIT license, reproduced in `licenses/PAYSLIPS-MIT.txt`. Source: https://github.com/buthaya/payslips at `ec64d17fa94d876b1834760594340a058dac5106`.
- **CORD**, NAVER Corp.; Park et al. (2019), *CORD: A Consolidated Receipt Dataset for Post-OCR Parsing*. CC BY 4.0, reproduced in `licenses/CORD-CC-BY-4.0.txt`. Sources: https://github.com/clovaai/cord and https://huggingface.co/datasets/naver-clova-ix/cord-v2 at `7f0115a4b758a71d6473b8d085751692da2fef98`. Only a bounded annotation subset was used.
- **FieldBench Contributors**, only records explicitly marked synthetic and CC0 1.0. Source: https://github.com/fieldbench/corpus at `fcfefbfbde1909ea440e058593eb72387b636a3f`. Data license description reproduced in `licenses/FieldBench-DATA-LICENSE.md`. Other third-party records were excluded.

Modifications: extracted word text, merged pages, filtered/deduplicated records, grouped data, created broad class labels, fitted TF-IDF/logistic-regression weights, and converted weights to JSON for browser inference. Numeric values and selected dataset markers are omitted from features.

Training code, data manifest, metrics and limitations are in `ml/document_classifier/` in the BenefitStep source package. Source-material licenses do not constitute a blanket license grant for the application or every model use.
