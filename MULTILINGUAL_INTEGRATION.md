# Multilingual development preview

The header language selector switches between English, Spanish, Simplified Chinese, Traditional Chinese and Vietnamese. This integration uses the supplied `BenefitStep_Multilingual_Module_v0_1` and adds a presentation catalog for the existing workflow.

## Available

- Translated navigation, main headings, quick-check inputs and initial results, document controls, review labels and package actions.
- Session-only language choice. Switching languages preserves answers, original document values, review confirmation and program selection.
- Explicit UI annotations: original text, filenames, names and entered values are not automatically translated.
- Local packaged translations; no translation requests, cloud fallback, downloaded models or additional permissions.
- A visible translation preview notice. Untranslated policy findings retain their original English explanation.

## Boundaries and remaining work

The Spanish, Simplified Chinese, Traditional Chinese and Vietnamese translations are drafts and need independent linguistic review. The Traditional Chinese catalog (`extension/src/i18n/ui-zh-hant.mjs`) was converted from the Simplified one and then adjusted to Traditional wording; the Vietnamese catalog (`extension/src/i18n/ui-vi.mjs`) was drafted from the English source. Both must carry every string the Simplified Chinese catalog carries; `tests/ui-language.test.mjs` checks this. Detailed policy explanations, some dialogs and application-field instructions still use English. Choosing an interface language does not choose an agency communication language. Which official PDF is filled is described under "Translated official forms" below.

The supplied local LanguageDetector/Translator adapters are included and covered by mocked tests, but are not activated by this interface. Real browser model availability, consent/download flows and explanation translation remain future integration work.

## Verification

Run `node --test tests/*.test.mjs`. The runtime repository is already unpacked; no build is required. Run `python3 tests/i18n-browser.py` with Chrome available for an isolated offline browser check: all three languages, quick-check answer retention, review confirmation retention, unchanged source values, a user value matching an English UI label, narrow layouts, program gating and the notice that says which official edition is filled.

Development only. Archived Chrome Web Store packages are unchanged; the current unpacked extension includes this preview.

Run `python3 tests/i18n-browser.py --chinese` for the Simplified Chinese flow, `--traditional` for Traditional Chinese and `--vietnamese` for Vietnamese. No interface language enables document recognition in that language, and answers are never translated.

## Translated official forms

Every form is filled on the English edition by default, whatever the interface language. For the CalFresh application (CF 285, 8/21) and the periodic report (SAR 7B, 12/23), an **Official form language** choice sits under the form's button on the package screen and again in the form dialog: the state's own Spanish, Traditional Chinese or Vietnamese edition can be filled instead. The choice lasts for the session. The state publishes these forms in Traditional Chinese only, so that is the Chinese edition offered.

- The translated PDFs come from the state's translated-forms pages and are the same edition as the English form. `extension/forms/registry.json` records each address, date and SHA-256 under `translations`.
- Each edition has its own map, `extension/forms/maps/<form>.<language>.json`. A translated map is accepted only if it answers the same questions as the English map, on the same pages, with every box in the same place relative to its neighbours.
- A translated PDF does not always name a box as the English one does. The Vietnamese SAR 7B numbers the boxes at the top of page 1 differently, and each edition renames a few others. Each was matched by the box's own label in that language.
- Answers are written as entered. A frequency such as "monthly" or a relationship such as "Mother" stays in English on a translated form.
- The recertification (CF 37) and the Medi-Cal application are filled in English. The state publishes CF 37 in the three languages, but those PDFs name every box differently, carry no box labels, split each date into three boxes, and the Vietnamese one lays out the pay-frequency boxes differently. They need to be matched box by box and checked on the page before they can be used.
- The maps are drafts like the English ones: every download is stamped as an unsigned draft, and no map has had independent review.

`tests/translated-forms.test.mjs` checks each edition against the registry and the English map, fills a draft on each and reads it back. Opening a protected form made the PDF library drop the backslashes its strings need; many Chinese and Vietnamese characters contain those bytes, and the in-app preview drew the saved form as scrambled letters. `extension/src/pdf-decrypted-strings.mjs` restores them and the same test covers it.

## Household and source-context review

Documents and Review now expose **Enter household details** for the applicant name, current address, other household names and a configurable recent-document window (initially 90 days). These are session-only entries, separate from extracted source values. Saving a personal household removes explicitly marked fictional example sources and questionnaire answers. Confirmed applicant contact details can prefill the CalFresh draft; other household and Medi-Cal identity questions remain editable in Application.

Review checks source recipient, recipient/service address and complete dates before financial comparisons. Missing or differing details pause the source's current prepared facts. Old financial sources outside the selected window are **unusable for current preparation**; originals remain available. The window is a user-controlled preparation filter, not an agency acceptance or eligibility rule. Historical notices and receipts are not rejected by the financial freshness filter. Use **Review source identity and dates** to record source corrections; original document content remains unchanged.

The extractor now requests recipient/service addresses and prioritizes identity and dates; it must not use issuer or remittance addresses. Image-derived values still require visual confirmation. Rejected model fields identify the field, page, received unusable value and corrective action, instead of repeated generic warnings. GIF import preserves the original and reads the first frame only.

Verification: `node --test tests/household.test.mjs` checks blocking, dates, household matching, corrections, demo removal, confirmed contact prefill and diagnostic messages. `python3 tests/household-browser.py` checks the installed offline extension flow, preservation of original source text, language switching and narrow layouts. Optional `--examples /path/to/folder` additionally checks local image decoding (not native-model extraction quality).

A persistent household summary and **Edit household details** control are available on every workflow screen, including Quick check and Application. Reopening the editor shows the saved values. Updates rerun source comparisons and require confirmation again before package generation.
