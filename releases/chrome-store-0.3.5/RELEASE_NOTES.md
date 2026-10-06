# BenefitStep 0.3.5 — local Chrome Web Store upload candidate

Prepared October 6, 2026 from commit 5976afb plus the document-reader changes committed with this release. This package has not been uploaded or published.

- The local text reader now reads ordinary statement layouts: US-style dates (`09/30/2026`, `September 30, 2026`), a period written on one line (`09/01/2026 – 09/30/2026`, `October 2026`), amount rows without a colon, one-line addresses, and more label names such as Contractor, Billed to and Total paid.
- Amount rows without a colon, and an issuer taken from the first line of a page, are used only on a document that names its recipient. Amount due is never copied into current charges. A file that mentions several document types stays unidentified.
- The Document step shows whether Chrome's on-device AI is on and offers **Turn on on-device AI**. Earlier versions had no control to start the model, so readable documents were read by the text reader only.
- Labelled details are kept. The on-device model reads scanned pages and documents whose type the labels do not show. On other documents it is asked only when the person, issuer, period or pay date is missing, and it never adds an amount there.
- A quote from the model is matched to one real line of the page, ignoring spacing, and a date is accepted when that line shows the same date in another format. A value that no line shows is still rejected.
- Each document row shows which reader read it, and the document summary counts the details from each reader.
- The household dialog lists the names and addresses found on the added documents, including a child or patient named on an invoice. You choose your own name, other members and the current address; the fields stay editable and nothing is applied without that choice.
- An address line directly under the recipient's name is read, and a period that has started may end later in the month without a future-date warning.
- Both application editors have a “People in this application” list drawn from the household details and the names on the documents. Each person you tick fills one record: the CalFresh household roster, or a Medi-Cal person with a proposed first, middle and last name, the household address and, for the first person, the primary contact. An income record names its person only when that person was chosen, and typed answers are never overwritten.
- The Quick check is optional. A package can be generated for any program that is still selected; the Quick check has a **Skip and add documents** button.
- `demo/earley-household/` holds a fictional two-earner household pack and a step-by-step guide that ends with both drafts generated.
- Fixed: generating an application draft failed with “Only JSON-compatible data is allowed” whenever contact answers came from typed household details. This affected 0.3.4 as well.

Limits: the first, middle and last name split is a proposal to check, and birth dates and relationships are left to you. Names are offered only where a document labels them, and choosing your name from your own documents means the name check mainly catches documents that belong to someone else. On-device AI answers vary between runs and can be wrong; in testing it read one gross-pay amount incorrectly from a table layout. Image-derived values need visual confirmation. Every detail still needs confirmation against its source. Numeric dates are read month first. The new interface text is English only; Spanish and Chinese show it untranslated.

Validation: the 111 Node checks in `tests/` passed. In installed desktop Chrome 154, the offline Alex, household, Spanish and Chinese checks passed (four Alex PDFs, 57 confirmed facts, zero evidence-check findings), the on-device AI control was checked with the model off and on, and the Earley household demo was run from the Document step without the Quick check: household details and four people were chosen from the six documents, then the CalFresh draft (14 fields, 18 pages) and the Medi-Cal draft (37 fields, 44 pages) were generated. Not re-run: image decoding with sample images and store screenshots. Results are in `package-validation.json` and `release-browser-check.json`.

The ZIP retains existing store branding, icons, CSP and sidePanel-only permissions. Development preview routes and renderer fixtures are excluded. Official PDFs remain unsigned drafts; independent linguistic and PDF-mapping review remains incomplete.

Upload only benefitstep-0.3.5-chrome-store.zip. SHA256SUMS.txt records its checksum.
