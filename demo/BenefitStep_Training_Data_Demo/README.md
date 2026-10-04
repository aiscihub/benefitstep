# Public-training-data demonstration pack

This pack has **10 PDFs**: eight examples from public data used to train the classifier, plus two separate fictional examples that demonstrate field extraction and Package Doctor. The eight public examples are deliberately marked as training examples; their recognition results are not new test accuracy.

## Use in BenefitStep

1. Open an empty BenefitStep preparation session and go to **Add documents**.
2. Choose the **pdfs** folder inside this pack, or select all ten PDFs together. Do not select the entire pack: it also contains text copies and reports.
3. For repeatable field extraction, choose **Processing options → Local text reader** before importing. The trained classifier still runs automatically.
4. Show the AI type suggestions beside each file. Use **View source** for model details and readable source text.
5. Use **Confirm details** to show the extracted fields from the two fictional workflow records. Do not confirm or submit public example values as a real person's application answers.
6. For Package Doctor, change the fictional utility record's current charges from 140 to 940. Compare the finding with the source and restore 140.

The PDFs can be opened directly without the app. **extracted/RESULTS.md** contains the pre-run classification and candidate extraction results; **extracted/extraction-results.json** includes source quotes and Doctor output. Extracted PDF text is saved in **extracted/text/**.

## Contents and provenance

- PDFs 01–02: PAYSLIPS public anonymized pay statements; MIT, SCOR SE.
- PDFs 03–04: FieldBench synthetic invoice/receipt examples; explicitly licensed CC0 1.0 subset.
- PDFs 05–06: CORD receipt annotations; CC BY 4.0, NAVER Corp.
- PDFs 07–08: FieldBench synthetic comparison documents; explicitly licensed CC0 1.0 subset.
- PDFs 09–10: Existing BenefitStep fictional pay statement and utility bill, not model-training records.
- **source-text/**: exact selected public training text.
- **publisher-reference/**: PAYSLIPS/CORD annotated fields, copied as reference answers. These are publisher labels, not BenefitStep extraction or AI predictions. FieldBench entries explicitly indicate that structured reference labels are unavailable here.
- **manifest.json**: original record IDs, train split, source paths/hashes, license/revision, PDF hashes and normalized-text verification.
- **licenses/** and **NOTICE.md**: attribution and source licenses.

Public PDF examples are reconstructed from available text annotations or Markdown. They are not the publisher's original scans or original visual layouts. Dates, currencies and imperfect OCR strings are preserved; they must not be assumed to be USD or current US benefit evidence. DEMO/SAMPLE markers are excluded by the model's existing feature rules. No labels or expected answers are injected into the classifier.

Selection is reproducible: the first two training records, sorted by hashed ID, in each source/label stratum. Selection does not use classifier scores. The frozen model, split manifests and benchmark remain unchanged. This pack was not added to training. No user documents were used.

Rebuild and extract from the repository root: `python3 scripts/generate_training_data_demo.py`. Requires cached public training data and Chrome. The script does not use cloud AI, retrain the model, or submit documents anywhere.
