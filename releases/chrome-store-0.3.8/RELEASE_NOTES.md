# BenefitStep 0.3.8 — Chrome Web Store upload candidate

Prepared October 10, 2026 from repository baseline 3c31fbd and the current tested extension. This ZIP has not been uploaded or published.

- Filler answers from on-device AI are dropped. When the model could not find a detail it sometimes answered "unknown", copied a placeholder such as "[not visible]" from the page, or repeated its own question, and 0.3.7 offered those as a street address, city, state or ZIP. Such answers are now removed from every AI reading and second look, with a note in the document's extraction details. An address part must also have the shape of one, and the county-notice reader refuses a filler as a case name. A frequency of "unknown" is unchanged.
- A photo is read as one whole page when the reading has to decide what kind of document it is. The overlapping sections introduced in 0.3.7 remain for the two narrow questions where the kind is already known: the second look at an address or description, and the county-notice reader. With sections in the main reading, the on-device model typed a pension letter and a pharmacy statement as pay statements in 5 of 6 readings; with the whole page it typed all three demo photos correctly in 12 of 12 readings before packaging and 6 of 6 from this archive.
- Store version and displayed version are both 0.3.8. Store branding, icons and sidePanel-only permissions are preserved. Development renderer routes and fixtures are excluded. The archive holds the same 365 files as 0.3.7; four source files changed.

Validation: 356 automated source tests and 165 tests against the prepared repository checkout passed. The unzipped archive passed 16 isolated Chrome checks for image bounds, the whole-page image, all three model-input paths, cancellation and image-buffer cleanup, with a simulated model. The unzipped archive was also run with the on-device model on the fictional Earley demo: three full runs of the photo pack gave 71, 58 and 72 CalFresh fields (61 Medi-Cal each time), and the SAR 7 renewal started from an imported notice gave 51 fields. These are small samples, not an accuracy measurement.

Known limits found in this validation:

- In the run that gave 58 fields, the model stalled on a text document. The batch then stops using the model, as designed, and the three photos were left unread. "Read this source again" on each photo reads it. This behaviour is unchanged from earlier versions.
- Wrong readings that are not fillers remain possible: on deliberately misleading test documents the model took an annual wage summary and a job offer's proposed salary as gross pay. Every value still passes through Review before it reaches a form.

Existing limits remain: generated forms are unsigned drafts; independent form-map and translation review is incomplete. Image-derived values need visual confirmation. New renewal interface wording is primarily English. SAR 7 income rows use its report month; excess records require the separate sheet requested by the form. No application is submitted by BenefitStep.

Upload benefitstep-0.3.8-chrome-store.zip. SHA256SUMS.txt records its checksum.
