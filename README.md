# Latest integration: 0.3.0

The local policy engine is integrated. CF285 and Medi-Cal forms now support local unsigned-draft generation, preview, and PDF/ZIP downloads. Reviewed evidence is reused; the expanded fictional AI demo fills household and application details. Independent field audit and approval remain pending. See [PDF implementation and remaining acceptance work](forms/README.md).

# BenefitStep — policy-aligned local preview 0.2.0

Implements the core preparation and manual application workflow from **BS-DEV-001**, now with the **BS-UI-POL-002 v0.2** utility design and independent program starting screens. See [integration and validation](UI_V0_2_INTEGRATION.md) and [policy tracking](policy/README.md). The supplied design package and original policy inventory remain unchanged.

## Load the extension

In `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select:

`extension/` inside this project (release copy: `/Users/zhenli/git/benefitstep/extension`).

Pin **BenefitStep — Local Preview** and click its toolbar icon to open the sidebar. This is a separate extension from CookieGuard and the previous Companion. The supplied `BenefitStep_Implementation_v0_1` handoff folder is not the loadable extension.

## Working flow

Quick check → Add documents → resolve important issues → **Yes, correct** → Apply and follow up.

- CalFresh asks residence, estimated food household and an income band tied to a dated reference. Medi-Cal separately collects age and residence per person seeking coverage; no Medi-Cal household or income conclusion is calculated. Saves, partial saves, skips and revisions are independent. Starting estimates never become confirmed document facts.
- Select PDFs/images/text together or choose a folder. One batch action reads and organizes files. Native on-device extraction is used when available; a clearly labeled local English-label reader is used for searchable documents when unavailable. Images need supported local AI or manual entry. No cloud fallback.
- Strict allowlisted candidate fields, exact text quotes, page references, integer cents, original values, editable revisions and immutable confirmation history. Unknowns remain unknown. Native output cannot select benefit rules or set submission status.
- Package Doctor runs on actual records: unreadable/conflicting values, exact duplicates, gross/net/YTD confusion, prior-balance misuse, comparable pay-record conflicts, and evidence linked to a confirmed request's person/program/date basis/period. It offers one prominent finding, sources and a correction path. Other findings stay collapsed.
- Only affected answers pause. A revision-bound explanation can retain a correction after a source comparison; it does not confirm facts. The single summary confirmation excludes unresolved, deferred and paused values.
- CalFresh manual section companion, explicit copy, source viewing, original selection and ZIP export. Export includes an indexed **preparation-review.pdf** with rendered source copies, a text PDF summary, accessible HTML, JSON, and unchanged selected originals. No original is preselected.
- Explicitly recorded submission, receipt, request, upload, interview and decision events. CalFresh and Medi-Cal follow-up views stay separate. Recognized notice fields prefill for owner review; imported notices do not create official events. Prepared, sent, accepted and approved stay distinct.
- Session memory only. No host permissions, content scripts, analytics or persistent private storage. Clear removes hidden dialog content and cancels jobs; source deletion offers active-only or all retained copies. Model setup cancels on dialog close; late sessions are destroyed.

## Trained document classifier

A small custom text classifier has been trained on selected public PAYSLIPS, CORD and synthetic FieldBench data. It now runs automatically during batch import and shows a broad suggestion beside each file: pay statement, invoice/receipt, other document, or unknown. **View source** shows model provenance and scores separately from the information reader. The standalone lab remains under **Processing options → Try trained classifier (experimental)**. It does not extract facts or change preparation labels.

On 163 eligible held-out documents, it returned 126 correct suggestions and 37 unknowns. This is a narrow pilot with source/class confounding, not measured benefits-wide accuracy. See [training instructions](ml/document_classifier/README.md), [model card](ml/document_classifier/MODEL_CARD.md) and [data provenance](ml/document_classifier/DATA_CARD.md). Field extraction and Package Doctor remain independent components in the same workflow.

For a one-click walkthrough, open **Add documents → Try AI demo with fictional documents** in an empty session. It loads a pay PDF, utility bill, and short note, runs the actual classifier and local text reader, then shows Doctor checks. See [demo steps and wording](demo/ai-components/DEMO.md).

## Realistic household packet for the video

Use [the Rivera household filming packet](demo/video-household/README.md): eight PDFs with consistent September payroll, rent, utility, childcare, banking and request details, plus an optional image-only phone scan. Each issuer has a distinct visual layout. Open [the local gallery](demo/video-household/index.html) to preview documents; import only `demo/video-household/main-packet/` into an empty session.

[The 90-second script](demo/video-household/VIDEO_SCRIPT.md) follows the actual results. The reader extracted 55 candidate facts; all 16 selected amount/program/person checks matched. The installed-extension rehearsal flagged a deliberately entered utility amount of 940 and cleared it when restored to 140. The model recognized the two pay statements; other suggestions remained unknown. These are curated video fixtures, not a new benchmark, and the harder challenge findings remain unchanged. ZIP: `demo/BenefitStep_Video_Household.zip`.

## Harder document challenge

Use [challenge-v1](demo/challenge-v1/README.md) for unfamiliar layouts and failure cases: 18 PDFs covering tables, two-page letters, receipts, misleading payroll vocabulary, annual/future income, scans, simulated OCR errors, missing amounts, mixed packets and a duplicate. Import only its `pdfs/` folder. The [recorded results](demo/challenge-v1/RESULTS.md) show 0 correct suggestions, 11 unknowns and 1 wrong suggestion across 12 new readable scenarios; the separate local reader found only 1 of 11 selected present fields. This synthetic challenge exposes current generalization limits; it is not a real-user accuracy estimate. Weights and thresholds were unchanged. ZIP: `demo/BenefitStep_Challenge_v1.zip`.

## Public training-data demo pack

The [training-data demo pack](demo/training-data-demo/README.md) contains eight public training examples reconstructed as searchable PDFs, plus two fictional workflow PDFs. Import only its `pdfs/` folder in an empty session. The [saved extraction results](demo/training-data-demo/extracted/RESULTS.md) show actual classifier suggestions, extracted text and candidate facts. Publisher annotations are separate reference answers, not model output. A portable copy is in `demo/BenefitStep_Training_Data_Demo.zip`.

These examples demonstrate familiar training data and do not add evidence to held-out accuracy. The model, training splits and benchmark are unchanged. No demo sources are added to the extension bundle.

## Model benchmark

Open **Processing options → View model benchmark**, or use the benchmark link above the document processing overview. The report shows dataset/split counts, supported types, held-out recognition, abstention, score reliability and measured browser speed. It explicitly distinguishes public test results from unmeasured accuracy on real applicant documents.

The current register of datasets actually used is [ml/dataset_register.json](ml/dataset_register.json); the original handoff register remains a historical candidate list. [BENCHMARK.md](ml/document_classifier/BENCHMARK.md) is the presentation-ready report; raw timing measurements and the generated JSON summary are in `ml/document_classifier/artifacts/`. Reproduction commands are included in the report. No training text is shipped with the benchmark page.

## Package Doctor demo

Five visibly fictional PDFs are in `demo/package-doctor/`. See `demo/package-doctor/DEMO.md` for the walkthrough. Existing realistic pay/rent examples remain available in `demo/starter/`.

The normal extractor keeps current charges and total due separate. To demonstrate an issue, deliberately change the first bill's prepared **Current utility charges** from **140** to **940**. Package Doctor uses the original source fields to flag the error. The alternative bill actually has **940** current charges and must not trigger that warning. This is an evidence-based comparison, not a filename-triggered scenario.

## Build and checks

Node 22.16+; runtime dependencies are already bundled. No `npm install` or network is needed.

```sh
cd /Users/zhenli/Projects/cookieguard_safestep/BenefitStep_v0_1
npm run build
npm test
```

Installed-extension check from the repository root, using a temporary Chrome profile:

```sh
python3 scripts/benefitstep_smoke.py
```

`VALIDATION.md` distinguishes executed checks from release work. PDF.js 6.3.289, its license and hashes are recorded in `SBOM.json`; builds verify every inventoried vendor file. This inventory is not a vulnerability assessment.

## Scope and implementation choices

This is a **working G1/G2 local preview**, not certification that the specification's complete production gates pass. It reuses the tested JavaScript module UI instead of rewriting it into React/TypeScript. The extension-owned sidebar is the sole session owner; there is no second synchronized workspace or internal cross-window message protocol. Different windows do not share private application state.

The handoff's strict extraction vocabulary is adapted to existing field/type names and extended with business income, award, county request, application receipt, upload receipt and coverage notice candidates. Mixed files abstain. Limits remain the previously tested conservative bounds: 24 files, 8 MB/file, six pages/PDF, 48 MB total, one active model job. Password-protected PDFs need an owner-unlocked copy or manual entry. Broad layout OCR and document splitting are not implemented.

Generic document checks run locally; the handoff's unapproved consequential county policy designs remain disabled. The starting comparison remains display-only; Medi-Cal starting facts do not constitute an eligibility screener. No cash-flow eligibility inference, deductions, forensic authenticity model, automatic routing by the trained classifier, or medical coverage decision is enabled. Medi-Cal supports separate preparation and follow-up; its guided official completion is not implemented.

Saved-work encryption, cross-window projections, production policy approvals, coverage navigation, a full accessibility/security audit, hardware-native AI validation and measured user pilots remain separate release work. Closing or reloading loses preparation. Exports are ordinary unencrypted reference copies, not restorable encrypted backups. Clipboard and downloaded files can be shared by other software.

## More realistic classifier training corpus

A separate [v0.2 training experiment](ml/document_classifier_v0_2/README.md) adds 144 fictional documents and paired scan/OCR examples across 36 authored scenarios. [Open the gallery](ml/document_classifier_v0_2/data/realistic-v1/index.html). The trained candidate failed its validation release gate and is not deployed; the shipped v0.1 model and benchmark remain unchanged. The new results distinguish paired captures from unique documents and report unknowns explicitly.

## Package Doctor research provenance

[Research register and rule mapping](research/package-doctor/README.md) distinguish public reports, published service research, official guidance, issuer examples and development feedback. The review documents 13 external pages, nine implemented Doctor rule IDs and the remaining design patterns. [Presentation slides and wording](presentation/BenefitStep_Package_Doctor_Research.md) are included. This documentation does not change runtime rules or establish policy approval.
