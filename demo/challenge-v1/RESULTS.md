# Harder document challenge — results

18 fictional PDFs: 12 new content scenarios, five related image/OCR/mixed variants, and one exact duplicate. None were used to train the model. This is a deliberately difficult synthetic challenge, not a population accuracy estimate.

For the 12 new readable scenarios: **0 correct suggestions, 11 unknowns, 1 wrong suggestions, 0 import errors**.

For 11 selected present fields: **1 correctly extracted, 10 missing, 0 wrong**. Of 2 intentionally absent fields, 2 stayed absent and 0 were invented. These checks use the limited local label reader; this is not native AI extraction performance.

| File | Challenge | Expected broad type / behavior | Actual suggestion | Outcome |
|---|---|---|---|---|
| document-01.pdf | Grid layout, gross/net/YTD in adjacent columns | pay_statement | unknown | unknown |
| document-02.pdf | Two-page letter; October payment for September work | pay_statement | unknown | unknown |
| document-03.pdf | Invoice contains payroll and earnings vocabulary | invoice_or_receipt | unknown | unknown |
| document-04.pdf | Spanish text and comma-decimal euro amounts | invoice_or_receipt | unknown | unknown |
| document-05.pdf | Annual wages resemble current earnings | other_document | unknown | unknown |
| document-06.pdf | Payroll deposits are not a pay statement | other_document | unknown | unknown |
| document-07.pdf | Proposed future salary, no actual payment | other_document | unknown | unknown |
| document-08.pdf | Zero amount due despite positive current charges | invoice_or_receipt | unknown | unknown |
| document-09.pdf | Gross missing; visible net must not become gross | pay_statement | unknown | unknown |
| document-10.pdf | Notice asks for pay terms but reports no income | other_document | unknown | unknown |
| document-11.pdf | Educational examples, no actual earnings | other_document | pay_statement | wrongSuggestion |
| document-12.pdf | Monthly rent versus deposit; no proof of payment | other_document | unknown | unknown |
| document-13.pdf | Image-only scan of the pay table | unknown_without_text | unknown | True |
| document-14.pdf | Low contrast, skewed receipt scan | unknown_without_text | unknown | True |
| document-15.pdf | Simulated OCR character substitutions and lost layout | pay_statement | unknown | related variant — descriptive only |
| document-16.pdf | Searchable pay statement and utility bill in one PDF | unknown_mixed_types | unknown | True |
| document-17.pdf | Readable pay page plus scanned bill page | unknown_partly_unreadable | unknown | True |
| document-18.pdf | Identical PDF with a different name | skip_duplicate | duplicate skipped | True |

## What these results mean

Do not replace unknowns with forced labels to make this demo look successful. Readable document recognition, missing-field extraction, and image/OCR capability are different problems. A failure to classify a scan is not a text-model accuracy result. Mixed documents should be split or left unresolved; a single confident-looking label can hide a second document type.

The frozen expected answers are in `expected.json`; actual output, selected-field comparisons and Doctor findings are in `results.json`. Extracted text is in `extracted-text/`. Filenames are neutral and contain no document-type hints.

Cases were not selected using model scores, and no classifier weights, thresholds or extraction code were changed after evaluation. Once inspected, this set is a development challenge; future tuning needs a fresh held-out set.

