# BenefitStep local engine v0.1.0

**Start here:** [Engine and form implementation](docs/Engine_and_Form_Implementation.html).

This package implements local, configuration-driven CalFresh and Medi-Cal checks, a minimal next-question planner, bounded Package Doctor checks, and a confirmed-answer official-form export pipeline. No server or external AI is required by the core. The configuration is research-preview only; it does not determine overall eligibility.

## Run the delivered code

Node 20+; compiled JavaScript is included:

```bash
node tools/validate-config.mjs
node tools/cli.mjs examples/both-programs.json
node tools/cli.mjs examples/self-employment.json
node --test tests/*.test.mjs
```

Open `BenefitStep_Engine_Lab.html` to run the same engine in a browser with fictional scenarios. The lab is not the production extension UI. Its CSP prohibits network connections; no persistent store is used.

## Actual configurations

- `config/benefits/calfresh.json`
- `config/benefits/medi_cal.json`
- `config/shared/questions.json`
- `config/shared/tables.json`
- `config/bundle.json`

The supported review window is October–December 2026. This does not mean policy expires then. Update through source review, not by merely extending a date. `--released` intentionally refuses this unapproved research pack.

## Filled official PDFs

The endpoint is an **unsigned filled original agency form**, not a substitute summary. The package contains semantic question inventories for CF285, SAWS2PLUS and CCFRM604, plus `prepareForm` and a local Python PDF renderer. **Original agency PDFs and calibrated official field maps are not included** because the build environment could not retrieve the PDF bytes. Official-form output is not claimed validated.

```bash
python -m pip install PyMuPDF
python tools/pdf_template.py inspect path/to/official.pdf --out inspected.json
node tools/form-plan.mjs cf285 examples/cf285-answers.json forms/maps/cf285.binding-template.json unresolved-plan.json
```

The supplied empty binding template deliberately produces `template_mapping_review_required`. Obtain the original PDF, bind actual fields, protect signature/office-use regions, render and independently review before approving a map. See the implementation document for the render command. Larger continuation sets and Unicode font support remain integration work.

To rerun the synthetic renderer tests:

```bash
python -m unittest discover -s tests -p 'test_pdf_renderer.py'
```

`tests/fixtures/synthetic_filled.pdf` is visibly fictional and **must never be submitted as an application**.

## Extension integration

`dist/index.js` exposes `createEngine`, `fromPolicyAlignedUI`, `confirmFacts`, `reviseFact`, `prepareForm`, `chooseForms`, snapshot/transfer helpers and a worker message handler. Keep policy facts distinct from paper-form answers and local preparation distinct from official submission. See `src/*.ts` for contracts.

Rebuild with a compatible TypeScript compiler: `npm run build && npm run package`. The included browser bundle is a classic script for embedding in an extension-owned page, not a content script to inject into BenefitsCal.

## Not delivered as production capabilities

Full eligibility/allotment calculations, a general MAGI household engine, native AI/OCR, model training, a production encrypted vault, automatic field insertion, official form mappings, digital signatures, submissions, county synchronization and reliable fraud detection. The old app packages were not modified.

See `VALIDATION.md` and `planning/release-gates.json` for tested scope and remaining work.
