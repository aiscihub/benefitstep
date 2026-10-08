# BenefitStep

Prepare your benefits application package with a quick check, document review and downloadable application drafts.

![BenefitStep workflow: Quick check, Documents, Review and Application](assets/benefit_workflow.png)

*Workflow illustration; some screen details may differ from the current preview. Official PDF preview opens during the Application step.*

## How to use BenefitStep

1. **Quick check (optional):** Answer the initial questions for CalFresh, Medi-Cal or both, or select **Skip and add documents** to start from your documents. Results are preliminary, not eligibility decisions.
2. **Documents:** Add the files or folder you already have—for example, pay stubs, rent receipts, utility bills or health insurance information. Or select **Try example documents** to explore with fictional data. Click the details-to-review link to see the extracted names, dates and amounts.
3. **Review:** Check the items needing attention, then verify the details needing confirmation against their sources. Edit anything incorrect and click **Confirm reviewed details**. Changing reviewed information requires confirmation again before package generation.
4. **Application:** Choose **Generate CalFresh package (CF285)** or **Generate Medi-Cal package (CCFRM604)** for a program you kept selected; the Quick check does not have to be answered first. Under **People in this application**, tick who the application is for. Review and confirm the application answers, preview the unsigned PDF, and download your application package. The draft opens with **What was filled**: each filled section, its PDF page and the document each value came from. Expand **Review details again** whenever you need to check the prepared answers.

**Download before closing or reloading.** Your work is temporary. Downloaded drafts may still have unresolved items; complete missing answers and signatures before submitting through the official application process. BenefitStep does not submit for you. Never submit fictional example documents.

This repository contains the **v0.3.6 Chrome Web Store submission candidate**, installable extension and release records. Earlier release packages and listing materials remain in `releases/`. Development tools and training data are maintained separately.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in desktop Chrome 138 or later.
3. Enable **Developer mode**, select **Load unpacked**, and choose the [`extension/`](extension/) directory.
4. Pin BenefitStep and open its side panel.

No build command, Node.js, Python, server or account is required. Alternatively, unzip the [extension release ZIP](releases/chrome-store-0.3.6/benefitstep-0.3.6-chrome-store.zip) and load its extracted folder.

## Document reading and on-device AI

Readable PDFs are read by a local text reader. It handles ordinary statement layouts: dates such as `09/30/2026`, a period written on one line, amount rows without a colon and one-line addresses. Each document shows which reader read it, and the document summary counts the details from each reader.

Chrome's on-device AI is optional. On the Document step, select **Turn on on-device AI**; Chrome may download its built-in model once, and documents stay on the device. The model reads pictures, scanned pages and documents whose type the labels do not show; a picture or scan cannot be read without it. On other documents it only fills in a missing name, issuer, period or pay date, and never an amount. Its answers can be wrong, so check every detail against the source.

## Multilingual and household-review preview

Use **Language / 语言** to switch between English, Spanish and Simplified Chinese. Draft translations cover the main workflow; some detailed explanations and official PDFs remain English.

Choose **Enter household details**, then use the persistent **Edit household details** control on any workflow screen to enter your name, California address and household members. After you add documents, the dialog lists the names and addresses found on them, so you can choose instead of typing; check each choice against the original. Source checks compare recipient names, recipient/service addresses and dates before using financial details. Records outside the adjustable recent-document window (initially 90 days) are unusable for current preparation. This window is a local preparation setting, not an agency acceptance rule. Source corrections preserve original documents. Saving your own household removes explicitly marked fictional demo sources and questionnaire answers.

Try the fictional [Alex Demo test pack](demo/test_example2/README.md), importing only its `pdfs/` folder. For a complete five-person run that ends with both application drafts, follow the [Earley household demo](demo/earley-household/README.md). Its `documents/` pack has three pictures that only on-device AI can read; its `pdfs/` pack needs no AI. Image values still need visual confirmation; GIFs use the first frame only. See [coverage and limitations](MULTILINGUAL_INTEGRATION.md).

Validation for 0.3.6: the development suite passed 324 tests, and the 133 targeted Node checks in `tests/` passed against this repository layout. Offline installed-extension checks were run again and passed for household entry, stale-amount exclusion, source correction, language switching and all four Alex PDFs (57 confirmed facts, zero evidence-check findings). The Earley demo was run on the unzipped upload ZIP with both packs: all PDFs with on-device AI off, and the picture pack with it on. Each run ended with 72 fields on the CalFresh draft and 61 on the Medi-Cal draft. On-device AI read the three demo pictures correctly in every run, but that is a small sample of clean renderings; phone photos were not tried, and image decoding with the earlier sample images was not re-run. Browser checks need desktop Chrome and Python 3.

## Chrome Web Store submission

Upload only **[benefitstep-0.3.6-chrome-store.zip](releases/chrome-store-0.3.6/benefitstep-0.3.6-chrome-store.zip)** as the extension package.

The existing 0.3.2 [store materials](releases/chrome-store-0.3.2/store-assets/) include screenshots, icons, promotional images, listing text, the privacy policy and reviewer instructions. Follow the [submission checklist](releases/chrome-store-0.3.2/store-assets/SUBMISSION-CHECKLIST.md). The [store-assets ZIP](releases/chrome-store-0.3.2/benefitstep-0.3.2-store-assets.zip) is for listing preparation, not installation.

The existing screenshots predate the persistent household editor, the on-device AI control and the summary of filled content, and need refreshing for 0.3.6.

Publication still needs a publicly hosted privacy-policy URL, publisher/support details, dashboard declarations and store review. This candidate has not been approved by the Chrome Web Store.

## What is included

- `extension/`: complete browser runtime, local document model, policy engine, PDF libraries, official templates, fonts and required assets/licenses.
- `releases/chrome-store-0.3.6/`: current upload ZIP, checksums, validation records and release notes.
- `releases/chrome-store-0.3.2/`: earlier release and existing listing materials.
- `demo/`: fictional document packs with step-by-step guides.
- `LICENSE`: project license; bundled dependencies retain their own license notices.

The `extension/` files match the current 0.3.6 upload ZIP. Use Load unpacked to try the new functionality. Runtime JavaScript is included because Chrome needs it to run the extension.

## Privacy and preview limits

Document processing and working answers stay in the extension; working data is temporary. Download a preparation package to keep a copy. The extension does not read BenefitsCal, sign forms or submit applications. Official links open external websites when selected. See the [privacy policy](releases/chrome-store-0.3.2/store-assets/privacy-policy.html).

CalFresh and Medi-Cal outputs are **unsigned drafts**. Check the filled values and unresolved items before using them. Independent PDF mapping review remains incomplete. Fictional demo outputs must not be submitted. Preliminary screening is not an eligibility decision. BenefitStep is independent of BenefitsCal and government agencies.

See [release notes](releases/chrome-store-0.3.6/RELEASE_NOTES.md) for validation and limitations.

## Release 0.3.7 — October 8, 2026

The current extension adds CalFresh renewal and periodic-report preparation, county-notice import, document-period guidance, and overlapping image sections to avoid submitting large full-page images for automatic downscaling. See [release notes](releases/chrome-store-0.3.7/RELEASE_NOTES.md) for validation and limitations.
