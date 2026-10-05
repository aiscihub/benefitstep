# Multilingual development preview

The header language selector switches between English, Spanish and Simplified Chinese. This integration uses the supplied `BenefitStep_Multilingual_Module_v0_1` and adds a presentation catalog for the existing workflow.

## Available

- Translated navigation, main headings, quick-check inputs and initial results, document controls, review labels and package actions.
- Session-only language choice. Switching languages preserves answers, original document values, review confirmation and program selection.
- Explicit UI annotations: original text, filenames, names and entered values are not automatically translated.
- Local packaged translations; no translation requests, cloud fallback, downloaded models or additional permissions.
- A visible translation preview notice. Untranslated policy findings retain their original English explanation.

## Boundaries and remaining work

Spanish and Simplified Chinese translations are drafts and need independent linguistic review. Detailed policy explanations, some dialogs and application-field instructions still use English. Official CF285 and CCFRM604 PDFs remain English; choosing Spanish does not select a Spanish form or an agency communication language.

The supplied local LanguageDetector/Translator adapters are included and covered by mocked tests, but are not activated by this interface. Real browser model availability, consent/download flows and explanation translation remain future integration work. Spanish PDF generation requires validated Spanish templates and field maps.

## Verification

Run `node --test tests/*.test.mjs`. The runtime repository is already unpacked; no build is required. Run `python3 tests/i18n-browser.py` with Chrome available for an isolated offline browser check: all three languages, quick-check answer retention, review confirmation retention, unchanged source values, a user value matching an English UI label, narrow layouts, program gating and English PDF language disclosure.

Development only. Archived Chrome Web Store packages are unchanged; the current unpacked extension includes this preview.

Run `python3 tests/i18n-browser.py --chinese` for the Simplified Chinese flow. Chinese UI does not enable Chinese document recognition or translate official PDFs. Traditional Chinese is not yet supported.

## Household and source-context review

Documents and Review now expose **Enter household details** for the applicant name, current address, other household names and a configurable recent-document window (initially 90 days). These are session-only entries, separate from extracted source values. Saving a personal household removes explicitly marked fictional example sources and questionnaire answers. Confirmed applicant contact details can prefill the CalFresh draft; other household and Medi-Cal identity questions remain editable in Application.

Review checks source recipient, recipient/service address and complete dates before financial comparisons. Missing or differing details pause the source's current prepared facts. Old financial sources outside the selected window are **unusable for current preparation**; originals remain available. The window is a user-controlled preparation filter, not an agency acceptance or eligibility rule. Historical notices and receipts are not rejected by the financial freshness filter. Use **Review source identity and dates** to record source corrections; original document content remains unchanged.

The extractor now requests recipient/service addresses and prioritizes identity and dates; it must not use issuer or remittance addresses. Image-derived values still require visual confirmation. Rejected model fields identify the field, page, received unusable value and corrective action, instead of repeated generic warnings. GIF import preserves the original and reads the first frame only.

Verification: `node --test tests/household.test.mjs` checks blocking, dates, household matching, corrections, demo removal, confirmed contact prefill and diagnostic messages. `python3 tests/household-browser.py` checks the installed offline extension flow, preservation of original source text, language switching and narrow layouts. Optional `--examples /path/to/folder` additionally checks local image decoding (not native-model extraction quality).

A persistent household summary and **Edit household details** control are available on every workflow screen, including Quick check and Application. Reopening the editor shows the saved values. Updates rerun source comparisons and require confirmation again before package generation.
