# BenefitStep 0.1.4 validation

Executed October 3, 2026 on macOS, Node 26.10.0 and Chrome 154.0.8037.95. This is implementation evidence for a local preview, not a production release approval.

| Check | Result and boundary |
|---|---|
| Node tests | **202 passed**, zero failed. Includes 96 supplied reference-kernel tests, the preserved quick-check/state tests, new Package Doctor integration cases, local AI adapter doubles, and PDF layout checks. Raw output: `tests/latest-node.txt`. |
| Reviewed baseline | Quick view, result engine and input/update modules match the recorded Companion 0.1.4 SHA-256 hashes. |
| Installed extension | Loaded unpacked in an isolated temporary Chrome profile; tests run in its real extension origin under its manifest CSP. Toolbar gesture itself is not tested. |
| Real files | PDF parsing/rendering, local-label extraction, missing fields, malformed-file isolation, duplicates, source viewing, manual zero and correction invalidation passed. |
| Package Doctor | Real bill PDFs demonstrate positive and negative prior-balance cases; only affected answers pause; correction clears the issue. Same September pay PDF mismatches October request and covers September request. Separate Medi-Cal view excludes CalFresh requests. |
| Follow-up | Candidate notice fields can prefill an event for explicit owner review. Imports alone do not set submission. Upload receipt and application receipt remain distinct; wrong program/source-less receipt events rejected in unit checks. |
| Export | Explicit original selection, stale-revision checks, original SHA-256 checks, ZIP generation, and indexed review PDF passed. Exported PDF was parsed with bundled PDF.js; internal index destinations and presence of rendered source pages verified. |
| Native AI boundary | Adapter tests use controlled model doubles: valid response, fabricated quotes, extra eligibility fields, invalid output, capability/setup, timeouts, aborts and late-session disposal. Browser flow simulates native failure and verifies local-label fallback once per batch. **Actual hardware-native inference/setup was not exercised.** |
| Privacy | No HTTP(S) page requests or runtime exceptions observed in the instrumented extension page during the scripted flow. LocalStorage, IndexedDB and Cache Storage remained empty; no storage permission. Untrusted document HTML stayed inert source text. Clear/close removed hidden dialog content; cancelled jobs did not publish late results. |
| Narrow layout | Scripted flow at **360 CSS pixels** passed horizontal layout check; screenshot in `tests/sidebar.png`. This is not an accessibility audit. |
| Dependency inventory | Locally bundled PDF.js 6.3.289, Apache-2.0 license, all vendor files hashed in SBOM; build verifies inventory. No vulnerability review claimed. |

`tests/latest-browser.json` records the browser/version and scenario results. `scripts/benefitstep_smoke.py` at the repository root reproduces the browser checks using only fictional data. No fictional application was submitted to BenefitsCal.

## Public-data classifier addendum

The 195 application tests passed again after adding the experimental lab. Four JavaScript classifier checks and four Python pipeline checks also passed. Exported model predictions match Python on six fictional parity probes to <1e-10. These probes check portability, not classification accuracy.

The trained model was evaluated on 163 eligible held-out documents: closed-set macro-F1 0.9733; at the validation-selected threshold, 126 correct suggestions, zero incorrect accepted suggestions and 37 abstentions. Source/class confounding and small samples prevent a production accuracy claim. See [MODEL_CARD.md](ml/document_classifier/MODEL_CARD.md).

`python3 scripts/benefitstep_classifier_smoke.py` loaded the packaged classifier in an isolated extension origin, classified an actual fictional pay PDF as `pay_statement`, checked clear and short-text abstention, and passed the 360-pixel layout check. It observed no remote page requests, runtime exceptions or persistent local browser storage. Results and screenshot: `ml/document_classifier/artifacts/browser-validation.json` and `classifier-lab.png`. This is actual inference using our exported weights; it does not exercise the separate native Chrome extraction adapter.

Builds verify the model hash. Public-source license notices are bundled. Automatic routing remains disabled. No raw training examples or Python dependencies are shipped in the extension.

## Integrated classifier flow (0.1.2)

The application suite now has **202 passing tests**, including classifier/extractor failure isolation, cancellation, unknown handling, no automatic confirmation, and rereading a source with duplicates. The full installed-extension regression passed again. The new `scripts/benefitstep_ai_flow_smoke.py` passed with the actual packaged weights in Chrome: one-click fictional demo, source score/provenance display, independent field extraction, Doctor source comparison, normal renamed PDF import, duplicate exclusion, reread, clear, and 360-pixel layout.

Observed demo outcomes: pay statement → `pay_statement`; bill → `unknown`; short note → `unknown`. No outcomes are injected or selected by filename. The bill's detailed utility label is still produced by the separate information reader. Classifier suggestions do not alter routing, confirm facts, or create eligibility decisions. No remote page requests or runtime exceptions were observed; persistent local browser storage stayed empty. See `tests/latest-ai-flow.json` and `tests/ai-flow.png`.

## Benchmark reporting (0.1.3)

`python3 scripts/benefitstep_model_benchmark.py` verified all **163** exported browser predictions against the saved held-out outputs without retraining. It measured five model loads, seven passes over all 163 test texts (1,141 calls), and three preparation passes over ten unique fictional PDFs (30 document observations). The Apple M3 Pro / headless Chrome run is recorded in `ml/document_classifier/artifacts/browser-benchmark.json`; the generated report gives timing boundaries and timer resolution. Observed page requests and persistent storage remained empty.

The report is generated from hashed model/split artifacts and records the fixed threshold, source/class confounding, excluded data and unmeasured applicant-document accuracy. It does not reinterpret softmax scores as calibrated confidence. The current `ml/dataset_register.json` records the three actual data sources independently of the original design register. The generated report opened from Processing options and passed a 360-pixel layout check with six data tables and its stylesheet loaded; see `tests/latest-benchmark-view.json` and `tests/benchmark-page.png`.

## Public training-data demo pack

`scripts/generate_training_data_demo.py` selected the first two training IDs in each of four predefined source/label strata, without scoring during selection. It rendered eight searchable PDF reconstructions, verified that normalized classifier tokens exactly match the original training text, added two existing fictional workflow records, and ran the actual packaged classifier and local reader on all ten files. The model hash and frozen split manifest remained unchanged.

All eight public training examples received their expected broad class; this is explicitly not a new accuracy benchmark. Ten PDF texts, 16 unconfirmed candidate facts from the workflow fixtures and 39 separate publisher reference fields were saved. ZIP integrity and all PDF/text hashes were checked. An installed-extension batch import of all ten PDFs matched the saved predictions and displayed a source preview, with no remote page requests observed. See `tests/latest-public-demo.json` and `tests/public-demo-preview.png`.

## Harder synthetic challenge (0.1.4 report update)

`scripts/generate_challenge_demo.py` fixed reference labels before inference, rendered 18 PDFs with neutral filenames, and exercised the actual classifier and local label reader. All imported within limits. On 12 new readable cases, there were 0 correct suggestions, 11 unknowns and 1 wrong suggestion. The local reader recovered 1 of 11 selected present fields, left 10 missing, and preserved two intentionally absent fields. Image-only PDFs had no hidden text layer; the mixed image/text PDF had one readable page of two. The exact duplicate was skipped.

These are observed failures, not passing accuracy checks or population estimates. Expected-reference hashes, result hashes, model hash, PDF hashes, image text absence, six-page limits and ZIP integrity were checked. No remote page requests or runtime exceptions were observed. The model and threshold are unchanged. The benchmark page and presentation now include this challenge separately from the original public test.

## Video household fixture rehearsal

`scripts/generate_video_household.py` creates eight coordinated, visibly fictional PDFs and an optional image-only scan. Cents-based checks cover pay deductions, YTD progression, matching bank deposits, bank closing balance, current/prior utility arithmetic and childcare balance. Page content was checked for footer overlap. All 16 selected extraction checks passed with the local label reader; 55 candidate facts were produced. The trained classifier recognized the two pay statements; other types remained unknown.

A real installed-extension batch import of the eight main documents matched the candidate count. A deliberate owner correction from current utility charges 140 to 940 triggered the expected Doctor finding; restoring 140 cleared it. The source preview displayed. No remote page requests were observed. PDFs, extracted-result hashes and the unchanged model hash were checked, and ZIP integrity passed. Results and source/gallery previews are in `demo/video-household/`; these curated fixtures are not generalization evidence.

## Implemented checks versus the handoff catalog

The supplied 24 design records and 120 planned scenarios are not claimed as completed. This build executes scoped generic portions of PD01, PD03, PD04, PD05/06, PD07, PD08, PD12, PD22, PD23 and PD24. Other patterns remain unassessed, including complete cash-flow comparison, self-employment treatment, forensic checks and medical coverage recommendations. The inherited preliminary quick check remains separate from Package Doctor and is not a full eligibility determination.

## Remaining release work

- Hardware/device-native model evaluation, unfamiliar-layout extraction accuracy and latency, scanned-page/photo testing across supported devices.
- Separate workspace-to-panel projection protocol and multi-window application selection; this preview has one in-memory owner per panel page and no private inter-window sharing.
- Formal runtime contract migration to the handoff's TypeScript model. Current modules use the existing runtime-validated vocabulary and source/revision adapters; no claim that `contracts/domain.ts` is implemented verbatim.
- Encrypted persistence/locking/migration/restorable backup after independent security review. Session close loses work; ordinary ZIP downloads are unencrypted.
- Reviewed consequential policy registry and domain review. The handoff's unapproved policy records are not activated.
- Accessibility (keyboard/screen reader/200% zoom), low-resource devices, incognito/shared-device behavior, broader all-context network inspection and security audit.
- Full G1/G2 production acceptance matrix and user pilot. The package's original `production_acceptance.json` remains a design artifact, not a passed release checklist.

The privacy observation boundary is the instrumented extension page's requests plus its local browser storage. It does not establish that Chrome's first model download, every service-worker path, browser internals, other extensions or the operating system never communicate. There is no analytics SDK, remote document endpoint, automatic cloud fallback, host permission or portal-reading integration in the built extension.
