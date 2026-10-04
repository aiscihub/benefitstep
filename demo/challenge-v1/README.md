# Harder BenefitStep demo dataset

Import only **pdfs/** using Choose folder in an empty BenefitStep session. Select **Local text reader** in Processing options to reproduce saved results; the trained type classifier still runs. All 18 files fit the 24-file limit. The files are newly authored fictional documents, not valid evidence. Expected answers are stored outside the PDFs.

This pack tests unfamiliar layouts and meanings: table-based payroll, a two-page earnings letter, a vendor invoice full of payroll terms, a Spanish receipt, annual tax wages, bank deposits, a future employment offer, a credit-balance utility bill, a damaged pay statement, a county request, a payroll teaching handout, and a lease with a deposit. Related variants add an image-only pay scan, a skewed/low-contrast receipt scan, simulated OCR errors, two mixed packets, and an exact duplicate.

The scans contain pixels with no hidden text layer. The current text model should leave these unknown. The OCR-error example is a constructed transcript, not output from a measured OCR engine. Mixed packets are expected to abstain; actual results may reveal a limitation. Missing gross pay must not be replaced by visible net pay. Proposed or annual income must not be treated as current pay.

Start with **RESULTS.md** to see the actual failures and unknowns before presenting. **expected.json** was frozen before inference and is never passed into the model. **results.json** contains real predictions, local-reader fields, selected-field scoring and Doctor findings. **previews/** contains example page images for presentation. No original training examples are copied into this pack.

This is an exploratory synthetic challenge, not independent proof of real-world accuracy. Keep related variants together in any future split. The original model and benchmark remain unchanged. The generator refuses to overwrite evaluated results; use a new challenge version when changing cases.

Reproduction source: `scripts/generate_challenge_demo.py`. Rendering/evaluation use local Chrome, packaged model weights and the local label reader. No cloud model or user documents are used.
