# BenefitStep realistic synthetic training corpus v1

Open `index.html` in the exported ZIP for a visual gallery, or `data/realistic-v1/index.html` in the repository. The gallery shows one representative for each of 36 authored scenarios. All 144 original documents are in `pdf/`; each has a paired degraded image in `scans/`, extracted PDF text in `text/` and actual local Apple Vision OCR text in `ocr/`.

This is authored fictional training material, not newly collected real user evidence. It includes dense payroll tables, repeated check stubs, portal styling, bills with earlier balances, receipts and confusing look-alikes such as paycheck simulations, bank records and insurance explanations. The images provided in the conversation were structural examples only. No user screenshot, identity, identifier or amount was copied into the corpus.

`synthetic_records.jsonl` contains 288 model rows. Use `text` as the model input and `label` as the target. Keep `document_id`, `family`, `split`, `capture` and `layout` as metadata, never as classifier features. The three labels are `pay_statement`, `invoice_or_receipt` and `other_document`. The `subtype` records the authored scenario, not a validated fine-grained classifier capability.

Use the frozen split: 96 original documents / 192 captures for training; 24 / 48 for validation; 24 / 48 for testing. Never split the paired PDF and scan across partitions. Scenario families and layout-theme pools are partitioned, but shared rendering components and fictional identity pools mean this is not an independent real-issuer test. Four variations of one family are not four independently sourced templates. The test was evaluated once for candidate v0.2 and must be treated as a known regression set for subsequent development.

`manifest.json` records PDF/scan hashes, family assignments and separately stored expected fields. Those gold fields were not supplied to the classifier and are not model extraction results. `generation_plan.json` records the policy declared before fitting. The OCR text is genuinely recognized from pixels using local macOS Vision; the browser extension does not gain OCR from this training tool.

The candidate trained on this supplement plus 460 existing public training records produced 14 correct accepted suggestions and 34 unknowns on the 48 new test captures. It failed its validation release gate and is not deployed. The corpus is a starting point for more realistic training and failure analysis, not proof of real-world recognition accuracy. Complete frozen metrics, model weights and reproducible scripts are in the repository at `BenefitStep_v0_1/ml/document_classifier_v0_2/`.

This ZIP contains the authored synthetic corpus only. It does not redistribute public-source documents, user files, the Python environment or the extension.
