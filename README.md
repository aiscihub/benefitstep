# BenefitStep

Prepare your benefits application package.

This repository contains the **0.3.1 Chrome Web Store submission candidate**, its installable files and publication materials. Development tools, training datasets, research and test fixtures are maintained separately.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in desktop Chrome 138 or later.
3. Enable **Developer mode**, select **Load unpacked**, and choose the [`extension/`](extension/) directory.
4. Pin BenefitStep and open its side panel.

No build command, Node.js, Python, server or account is required. Alternatively, unzip the [extension release ZIP](releases/chrome-store-0.3.1/benefitstep-0.3.1-chrome-store.zip) and load its extracted folder.

## Chrome Web Store submission

Upload only **[benefitstep-0.3.1-chrome-store.zip](releases/chrome-store-0.3.1/benefitstep-0.3.1-chrome-store.zip)** as the extension package.

The [store materials](releases/chrome-store-0.3.1/store-assets/) include screenshots, icons, promotional images, listing text, the privacy policy and reviewer instructions. Follow the [submission checklist](releases/chrome-store-0.3.1/store-assets/SUBMISSION-CHECKLIST.md). The [store-assets ZIP](releases/chrome-store-0.3.1/benefitstep-0.3.1-store-assets.zip) is for listing preparation, not installation.

Publication still needs a publicly hosted privacy-policy URL, publisher/support details, dashboard declarations and store review. This candidate has not been approved by the Chrome Web Store.

## What is included

- `extension/`: complete browser runtime, local document model, policy engine, PDF libraries, official templates, fonts and required assets/licenses.
- `releases/chrome-store-0.3.1/`: upload ZIP, listing materials, checksums, validation records and release notes.
- `LICENSE`: project license; bundled dependencies retain their own license notices.

The extension files match the upload ZIP. Runtime JavaScript is included because Chrome needs it to run the extension.

## Privacy and preview limits

Document processing and working answers stay in the extension; working data is temporary. Download a preparation package to keep a copy. The extension does not read BenefitsCal, sign forms or submit applications. Official links open external websites when selected. See the [privacy policy](releases/chrome-store-0.3.1/store-assets/privacy-policy.html).

CalFresh and Medi-Cal outputs are **unsigned drafts**. Check the filled values and unresolved items before using them. Independent PDF mapping review remains incomplete. Fictional demo outputs must not be submitted. Preliminary screening is not an eligibility decision. BenefitStep is independent of BenefitsCal and government agencies.

See [release notes](releases/chrome-store-0.3.1/RELEASE_NOTES.md) for validation and limitations.
