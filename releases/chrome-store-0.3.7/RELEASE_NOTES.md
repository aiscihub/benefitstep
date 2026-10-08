# BenefitStep 0.3.7 — Chrome Web Store upload candidate

Prepared October 8, 2026 from repository baseline 37eba00 and the current tested extension. This ZIP has not been uploaded or published.

- Large image inputs use a layout overview and overlapping original-scale sections, each at most 768 pixels on either side. Document extraction, targeted rereading and county-notice reading share this preparation. Sections retain their original page number, and their image buffers are released after use. More than 32 images in one document prompt is refused explicitly rather than silently dropping content.
- Includes the current CalFresh renewal and periodic-report workflows: CF 37 recertification, SAR 7B preparation, reuse of a previous BenefitStep package, and comparison with current documents.
- Includes county-notice import and document-period guidance from the current tested folder. Form codes and case details remain proposals for the owner to check.
- Store version and displayed version are both 0.3.7. Store branding, icons and sidePanel-only permissions are preserved. Development renderer routes and fixtures are excluded.

Validation: 354 automated source tests and 163 tests against the prepared repository checkout passed. The packaged extension passed 13 isolated Chrome checks for image bounds, full-size pixel preservation, all three model-input paths, cancellation and image-buffer cleanup. These Chrome checks used a synthetic 1313×1700 image and a simulated model. They do not measure Gemini Nano accuracy, extraction speed or whether a real-model context limit will be reached. Smaller sections increase the number of image inputs, so real-model retesting is still needed.

Existing limits remain: generated forms are unsigned drafts; independent form-map and translation review is incomplete. Image-derived values need visual confirmation. New renewal interface wording is primarily English. SAR 7 income rows use its report month; excess records require the separate sheet requested by the form. No application is submitted by BenefitStep.

Upload benefitstep-0.3.7-chrome-store.zip. SHA256SUMS.txt records its checksum.
