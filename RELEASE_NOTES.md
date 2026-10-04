# BenefitStep 0.3.0 — local preview

Prepared October 4, 2026. Load `extension/` as an unpacked Chrome extension.

- Reviewed Quick check, Document, Review and Application UI; temporary local work.
- Integrated local policy engine; research-preview policy configuration.
- Local document classification, extraction, Package Doctor and source-linked answer review.
- CF285 and CCFRM604 unsigned-draft filling, all-page preview, PDF and ZIP downloads.
- Prefill of compatible reviewed evidence, persistent source selection, expanded fictional household demo.
- Bundled standard PDF fonts; import and previews work offline.

Validation: 365 Node tests passed for this copy; latest installed-Chrome form checks passed 16 checks, including offline fonts and PDF/package downloads. The rich-demo browser flow passed for both forms. Evidence lives in `forms/validation/`.

This is a local preview, not a production or Chrome Web Store release. Independent full-form mapping review, desktop/print validation and reviewer sign-offs remain incomplete. PDFs are unsigned drafts; missing items remain visible. Fictional demo outputs are marked DO NOT SUBMIT. No agency submission or eligibility decision is performed.

Build: `npm run build`. Unit tests: `npm test`. Engine tests: `node --test engine/tests/*.test.mjs`. Installed-Chrome PDF checks: `python3 tests/forms-browser.py` (requires Chrome). Browser helpers are included locally in `scripts/`.
