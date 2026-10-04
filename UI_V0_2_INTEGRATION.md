# Policy-aligned UI integration — 0.2.0

Implemented October 4, 2026 in `cookieguard_safestep/BenefitStep_v0_1`. Design input: `../BenefitStep_Policy_Aligned_UI_v0_2`, BS-UI-POL-002. The separate `/Users/zhenli/git/benefitstep` repository was not modified by this update.

## Delivered

- Supplied white/teal utility tokens copied unchanged, with a separate CSS adapter for the existing extension controls. Four destinations: Quick check, Documents, Confirm, Apply.
- Native program checkboxes and keyboard-operable program tabs. Deselection preserves that program's draft only in session memory; zero selection gives a visible navigation prompt.
- CalFresh collects residence, estimated food household and before-tax income band. No initial immigration self-assessment. Zero, unknown and blank are distinct. Relative bands carry the reference ID and boundary in integer cents; changing household size clears a relative band, including silent DOM changes before Continue.
- Effective-dated reference lives in `policy/calfresh-reference.mjs`. Unknown and 9-plus counts do not invent a boundary; an expired reference cannot yield a current comparison. The 24 inherited production-policy flags remain disabled.
- Medi-Cal has independent anonymous applicant rows with age group and residence. It does not inherit CalFresh answers, calculate Medi-Cal household size or display an income threshold. Ten rows is an interface resource limit, not a benefit limit.
- Continue saves the active program and visits another pending program before Documents. Partial saves and explicit skipping remain available. Editing a saved program invalidates only its starting snapshot. New state has schemaVersion 2; legacy generic answers are not migrated to Medi-Cal.
- Documents has collapsed starting summaries. Apply has program-specific starting summaries and separate submission status. History records immutable starting snapshots separately from document confirmations and official-event records.
- Real file import, classifier, local reader/native adapter, Doctor, field corrections, confirmation, source viewing, exports and follow-up remain connected. No mock document-processing or submission implementation replaced them.

## Verification

- **211 Node tests passed**, including the imported reference screen-model file containing **52 assertions** and eight new integration tests. The 52 assertions are inside the suite, not 52 additional Node test cases.
- Two old assertions were updated to reflect the explicitly changed specification: immutable legacy quick-view baseline is retained under `reference/legacy-ui`, and the old four-question-per-program view test now verifies three CalFresh inputs and two fields per Medi-Cal person. Legacy evaluator tests remain historical module checks, not validation of the active v0.2 screen.
- **66 installed-extension browser assertions passed** in isolated Chrome, covering input updates, separate program data, saves, skips, retained drafts, keyboard tabs, source processing, package controls, History, and private-storage checks.
- Existing installed-extension Doctor regression passed its ten reported outcomes: paired bills, affected-answer pause, correction, notice prefill, request-period matching, program isolation, source safety and lifecycle cleanup.
- Both program screens fit **320, 360, 420 and 1180 CSS pixels** without horizontal overflow. Desktop and narrow screenshots were visually reviewed. No page exceptions or remote HTTP(S) page requests were recorded in the instrumented flow. This is not a full accessibility or security audit.
- Original policy inventory and supplied utility CSS match their source files byte-for-byte. Manifest permissions remain `sidePanel` only; no host, storage or content-script permissions were added.

Results: [Node log](tests/latest-policy-ui-node.txt), [browser results](tests/latest-policy-ui-browser.json), [desktop CalFresh](tests/policy-ui-calfresh-1180.png), [narrow Medi-Cal](tests/policy-ui-medical-420.png).

## Reproduce

From this app directory:

```sh
npm run build
npm test
python3 tests/policy-ui-browser.py
```

The browser check uses the repository's `../scripts/extension_smoke.py` CDP helper and an isolated local Chrome profile. Load `extension/` through Chrome's Load unpacked or reload the already installed extension after rebuilding.

## Limits retained

This is a local preparation preview. Full Medi-Cal branching, actual county verification, production eligibility policy activation, general OCR, native AI validation, persistent vaults and automatic portal filling/submission remain outside this change. The previously recorded three Doctor challenge failures are not fixed by this UI work; their baseline results remain preserved. The new classifier candidate remains undeployed.

## First-screen revision (October 4, 2026)

The owner-requested first screen now uses Quick check / Documents / Review / Application and the preparation-package tagline. CalFresh includes residence, household size, estimated before-tax income range, and an optional immigration/citizenship status answer. Blank or declined status is retained without treating it as ineligibility; no immigration eligibility rule was enabled. Existing per-person Medi-Cal questions remain independent.

“See my results” saves the current answers and displays the initial comparison on the same screen. Editing answers marks that result stale; “Update my results” recalculates it. A separate Continue action advances to the next program or documents. Starting answers remain session-only. Example values in the design are not preselected for real users.

## Temporary preparation and download flow

Work remains in page memory and is cleared by closing or reloading. There is no saved-history or resume interface. Temporary internal review records still support source integrity and confirmation checks. Excluded and duplicate originals are accessible under Documents rather than a history screen. Download my package is available once material has been added and prominently on the Application step. The package preserves reviewed answers, unresolved items, and selected originals; it is a reference copy, not an app restore file.
