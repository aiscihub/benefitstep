# Official application PDF integration — BS-PDF-001

The extension now integrates the supplied local policy engine and can fill the **original agency PDFs** in local draft and fictional preview modes. **BS-PDF-001 is partially implemented, not closed. At the user’s request, the Application page now generates unsigned drafts using the original official PDFs, with PDF and ZIP downloads. Independently validated release remains pending.** The accepted Quick check / Document / Review / Application layout and temporary-memory privacy model remain in place.

## What works

- Engine v0.1.0 is bundled under `engine/`; `src/policy-engine.mjs` adapts the existing per-program starting state without turning an income band into an exact amount or a CalFresh household into a Medi-Cal household. Initial results use the engine's dated research checks. The policy configuration stays `research_preview`; no eligibility approval or policy release was added.
- The existing Doctor remains authoritative for pausing affected document answers and owner-confirmed request matching. The new engine's bounded document checks are connected through an explicit evidence adapter in its details panel. No request subject, payment period, MAGI, sensitive status, or sent status is inferred.
- Original **CF285 (8/21, 18 pages)** and **CCFRM604 (09/2025, 44 pages)** were acquired from the agency URLs on October 4, 2026. DHCS redirected to `https://www.dhcs.ca.gov/wp-content/uploads/2025/10/ENG-CASingleStreamApp.pdf`; an isolated Chrome fetch retrieved it after command-line requests returned HTML. `registry.json` and `inspection/*.json` record hashes, source, geometry, actual widget labels/types/flags/choices, and full extracted page text. The hash is an integrity check, not independent agency authentication.
- **176 explicit bindings:** 75 CalFresh and 101 health-coverage bindings. They cover supported contact/identity/address, household-person, income, care-expense, and notes fields. **All 1,671 actual widgets have coverage dispositions**, with per-field coverage for the baseline semantic inventory. This is not a claim that all printed questions or branches have been audited or automated.
- Actual field geometry is obtained from the exact immutable PDF bytes. Coordinates are one-based pages, top-left PDF points. The browser writer checks MediaBox, CropBox and rotation and converts bottom-left widget rectangles; reversed corner order in several CCFRM604 widgets is normalized without moving the field.
- The browser writer runs in an extension-owned worker, uses bundled code/fonts, validates form ID/edition/hash/page count/geometry/fields/protected areas, rejects stale/unconfirmed answers and unsupported operations, and checks each checkbox's actual export value. Explicit No is mapped to the No widget; unknown is never silently No or zero.
- Noto Sans preserves supported accented Latin, Greek and Cyrillic characters. Unsupported glyphs, complex-script layout, long text, and excessive rows remain explicit recoverable manual tasks with the original values retained. No truncation, automatic transliteration, tiny-font fitting, or invented continuation pages.
- Application has separate **Generate CalFresh package (CF285)** and **Generate Medi-Cal package (CCFRM604)** actions. Entered values and intended PDF pages appear on the Application page and in answer review; deferred/excluded answers remain clearly identified. Fields are visible without first enabling each section, and entering a value includes that section. After confirming answers, **Generate filled application draft** fills the supported fields, previews all original pages, and offers **Download filled PDF** or **Download application package**. The ZIP contains the filled PDF, confirmed answers, generation report, and items-to-finish checklist. **Preview blank official form** remains available. Users may prepare explicitly applicable answer groups and select compatible, currently confirmed evidence. A single application-answer confirmation is separate from signatures/consents. Missing/unsupported items and official links remain available with no document gate. The ordinary package JSON includes the form-answer records.
- Preview and save are connected for unsigned drafts as well as approved maps. Draft mode accepts explicitly confirmed applicant answers, keeps hash/geometry/protected-region checks, stamps every page as an unsigned draft, and reports `independentlyValidated: false`. It does not change map approvals or sign anything. Current maps remain draft with `reviewers: []`, `visualValidation: false`, and `coverageComplete: false`. Developer preview accepts only hash-registered fictional fixtures and stamps every output page **FICTIONAL TEST ONLY — DO NOT SUBMIT**. It cannot accept arbitrary applicant answers as a review bypass.
- Downloads are unsigned PDFs, not submissions. Closing, clearing, navigation and cancellation terminate obsolete work and clear private preview state. App data remains in memory only.

## Template-specific handling

CF285 is publicly openable with an empty password but internally RC4-encrypted. The bundled writer performs local empty-password decryption; it does not ignore encryption and produce a broken file. Its Adobe Reader `/UR3` usage-rights metadata is distinct from an applicant signature and is removed from the generated copy. Applicant signature fields, signed `/ByteRange` objects, and certification permissions are rejected; signature, date, staff and consent areas are never filled by generic confirmation. CalFresh's contact-authorization phone/email fields are manual-only.

Both agency PDFs contain JavaScript/formatting actions. Those actions are removed from generated copies, and the local PDF.js canvas preview never runs PDF scripts. Original bytes are unchanged; printed content/page order and unfilled regions are preserved. Form fields remain native widgets; the output is not a substituted summary or silently flattened form.

## How to try the fictional preview

1. Reload `BenefitStep_v0_1/extension` at `chrome://extensions`.
2. Copy the extension ID shown there and open `chrome-extension://EXTENSION_ID/assets/form-preview.html`.
3. Choose a fictional case, preview all original pages, and save the **test-only** PDF.

There is no developer-lab link in the applicant flow. The main Application buttons prepare answers, show their values and intended PDF destinations, and generate filled unsigned drafts. They clearly report incomplete independent mapping review. The blank-form preview does not contain the entered answers.

Locally generated examples are under `validation/`, including `cf285-one-person.pdf` and `ccfrm604-one-person.pdf`. They must not be submitted. Full-size originals remain under `templates/`.

## Validation evidence

- `validation/node-tests.txt`: 353 passing Node tests, including the 124 supplied engine tests and 18 original official-form/adapter tests (the focused suite now has 22 tests including applicant draft generation and confirmation requirements).
- `validation/python-tests.txt`: 18 supplied synthetic renderer tests pass in the integrated copy. Its obsolete `/mnt/data` test-artifact path was changed to a temporary directory. The original engine package remains unchanged.
- `validation/browser-results.json`: installed Chrome extension, real forms, offline worker filling, PDF.js preview of all 62 original pages for multiple-person cases, saved-byte hash checks, draft PDF/package downloads, release gate checks, cancellation, no persistent storage and no remote requests.
- Existing `tests/latest-policy-ui-browser.json`: 70 UI assertions and ten Doctor outcomes pass.
- `validation/pixel-comparison.json`: **496 generated pages across 16 fictional cases** compared with original PyMuPDF renders; no unexpected changes outside written widget bounds (2-point tolerance) and the test-only header. This is automated pixel validation, not independent review.
- All-page contact sheets and selected full-size populated pages were inspected during implementation. **Every populated answer has not received independent human review; an independent desktop viewer and print/print-to-PDF checks remain outstanding.**

## Remaining acceptance work — no fabricated sign-offs

1. Independently audit every printed question, repeated column and branch; expand/calibrate mappings where needed. Unbound fields remain manual. The copied baseline inventory was incomplete; manual coverage was added for health-form consent/election sections and attachments E/F. Attachment A's starting PDF page was corrected to 29.
2. Validate each supported field/value/choice case page by page in the supported browser viewer and an independent desktop PDF viewer, including printed appearance. Run a complete supported case per form and record exceptions.
3. Review and implement exact continuation instructions for over-capacity people, income and deduction tables, or retain the specific manual continuation path. Additional scripts/font paths need separate review.
4. Record **two distinct real reviewers per form**, their evidence and any corrections. Only then release the individual map. One approval does not release the other form, the policy bundle, or SAWS2PLUS.

The task's full acceptance checklist is tracked in `validation/task-status.json`. These release requirements come from the user's supplied `BenefitStep_BS-PDF-001_Implementation_Task.md`, sections 2, 5 and 7. No approval or full-form completeness is implied by passing tests.

## Reproduce

From the project root:

```sh
npm run build --prefix BenefitStep_v0_1
node --test BenefitStep_v0_1/tests/*.test.mjs BenefitStep_v0_1/engine/tests/*.test.mjs
node BenefitStep_v0_1/scripts/render-form-fixtures.mjs
python3 BenefitStep_v0_1/tests/forms-browser.py
# Use an environment with PyMuPDF 1.26.5 and Pillow 11.3.0:
python BenefitStep_v0_1/scripts/inspect-official-forms.py
python BenefitStep_v0_1/scripts/validate-form-pixels.py
python -m unittest discover -s BenefitStep_v0_1/engine/tests -p test_pdf_renderer.py
```

Runtime dependencies are already packaged; builds require no network. `INTEGRATION_ASSETS.json` pins templates, maps, fixtures, engine configuration, writer and font assets. Changing a reviewed asset requires consciously updating the manifest and rerunning the affected checks. License notices and dependency metadata are in `vendor/pdf-writer/`.

### Applicant draft integration — October 4, 2026

The user requested that existing generation be integrated into the main application flow. Draft generation is now available for confirmed applicant answers without asserting independent release approval. Both maps remain draft, the existing approved-release mode remains gated, and all outstanding acceptance work above remains open. Draft download does not submit an application.

### Reuse reviewed evidence

Opening an application now prefills compatible confirmed evidence while preserving user edits. CF285 can reuse a single unambiguous reviewed person name, employer and pay frequency. Medi-Cal can reuse an unambiguous gross payment with its matching frequency. Multiple statements from the same person/employer share a stable employment slot. Conflicting values, unconfirmed/paused evidence, missing address information, exact income totals not established by the evidence, and unknown name components stay unresolved. Imported values retain source revisions; changes invalidate confirmation. Six prefill tests cover these boundaries, and the installed-extension test carries a prior reviewed answer into CF285.

### Expanded AI demo household

The AI demo button now adds a clearly labeled fictional questionnaire alongside the three live-classified documents. It supplies Alex, Morgan and Riley Demo, a fictional Sacramento address, dates of birth, languages, employer/contact details, $2,550 monthly gross income and $240 monthly childcare for the September 2026 scenario. Questionnaire fields are not presented as AI extraction. The Review page shows the household; both applications start with these draft answers and still require confirmation. Generated pages are stamped FICTIONAL DEMO — DO NOT SUBMIT. Standalone examples: `validation/cf285-rich-ai-demo.pdf` and `validation/ccfrm604-rich-ai-demo.pdf`. The dedicated browser test exercises the demo button through both PDF/package downloads without retyping.
