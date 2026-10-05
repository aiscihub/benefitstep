# BenefitStep v0.3.2 — preview release

This update simplifies document preparation and makes review confirmation required before package generation.

- Paired Quick check questions on wide sidebars, with a direct path to Documents and optional Medi-Cal starting questions.
- Clear document examples and a shorter Try example documents action.
- Clickable extracted-detail count and one review list separating issues from details needing confirmation.
- Package generation and downloads require Confirm reviewed details; changes to reviewed details require confirmation again.
- Program-specific application packages appear only after that program is started. Unstarted programs offer a Start action.
- Shorter Application screen with generation buttons first and details collapsed.
- Workflow illustration and four-step instructions in the repository README.

## Install or submit

Use `benefitstep-0.3.2-chrome-store.zip` to install locally or upload to the Chrome Web Store. Load the repository's `extension/` folder for unpacked testing. The separate store-assets ZIP contains listing materials, not an installable extension.

## Validation

All 251 Node tests passed. The exact release previewed 18 CalFresh and 44 Medi-Cal PDF pages offline with no observed remote requests or runtime exceptions. Review confirmation and collapsed application details were verified.

See `release-browser-check.json` for checks run against the exact staged extension, and `package-validation.json` for archive details. Checksums for both ZIPs are in `SHA256SUMS.txt`.

## Preview limitations

Generated applications are unsigned drafts. Independent PDF field/branch review and reviewer sign-offs remain incomplete. Check filled values, unresolved items, signatures and consent choices before official submission. Fictional examples must not be submitted. Screening is preliminary and does not determine eligibility.

BenefitStep is independent of BenefitsCal and government agencies. It does not submit applications. Work is temporary; download a package before closing or reloading.

This candidate has not been submitted to or approved by the Chrome Web Store. Publication requires a hosted privacy-policy URL, publisher/support details, dashboard declarations and store review.
