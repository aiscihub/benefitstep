BenefitStep v0.3.1 is a **preview release** for local preparation of CalFresh and Medi-Cal applications.

### Included

- Quick check, document review and Package Doctor in Chrome's side panel.
- Local document classification and supported information extraction.
- Reuse of compatible reviewed details in CF285 and CCFRM604 application drafts.
- Filled PDF preview and PDF/application-package downloads.
- Expanded fictional household demo and bundled fonts for offline PDF rendering.

### Install for testing

1. Download **benefitstep-0.3.1-chrome-store.zip** and unzip it.
2. Open `chrome://extensions` in desktop Chrome 138 or later.
3. Enable Developer mode, click **Load unpacked**, and select the folder containing `manifest.json`.
4. Pin BenefitStep and open its side panel. Start with **Document → Try AI demo with fictional documents**.

No Node.js, Python, developer server or user account is needed to run the extension. Chrome's optional on-device AI availability varies by browser/device; the demo and bundled local reader work without that model.

### Downloads

- **benefitstep-0.3.1-chrome-store.zip** — extension package, also prepared for Chrome Web Store upload.
- **benefitstep-0.3.1-store-assets.zip** — screenshots, promotional images, listing text, privacy-policy page and reviewer instructions. This is not the installable extension.
- **SHA256SUMS.txt** — SHA-256 checksums for both ZIP files.

GitHub's automatic repository archives include the extension and listing materials. Use the named extension ZIP, or load the repository's extension/ folder, to install.

### Validation and limitations

The development baseline passed 365 Node tests and 16 installed-extension form checks. The exact store candidate was loaded separately in isolated Chrome: all 18 CF285 and 44 Medi-Cal pages previewed offline, with no observed remote document requests or runtime exceptions in that check.

**Generated applications are unsigned drafts.** Independent field/branch auditing, desktop/print validation and reviewer sign-offs remain incomplete. Inspect every filled value, finish missing information and signatures, and follow the official submission process. Fictional demo outputs are marked **DO NOT SUBMIT**.

BenefitStep is independent of BenefitsCal, CDSS, DHCS and government agencies. Preliminary screening is not an eligibility decision. The extension does not read BenefitsCal or submit applications. Working data is temporary; downloaded files remain on your device and are not encrypted.

**Not published on the Chrome Web Store.** Publication still requires a hosted privacy-policy URL, publisher/account details, completed declarations and store review. This GitHub prerelease does not imply store approval or production readiness.
