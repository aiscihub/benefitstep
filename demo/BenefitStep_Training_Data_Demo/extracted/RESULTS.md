# Demo extraction results

Actual packaged classifier and local text reader, run on the generated PDFs. No facts were automatically confirmed. This is a training-subset demonstration, not a new accuracy benchmark.

| PDF | Trained type suggestion | Detailed reader label | Extracted candidate facts |
|---|---|---|---:|
| 01-payslips-pay-statement.pdf | pay_statement | unknown | 0 |
| 02-payslips-pay-statement.pdf | pay_statement | unknown | 0 |
| 03-fieldbench-invoice-or-receipt.pdf | invoice_or_receipt | unknown | 0 |
| 04-fieldbench-invoice-or-receipt.pdf | invoice_or_receipt | unknown | 0 |
| 05-cord-invoice-or-receipt.pdf | invoice_or_receipt | unknown | 0 |
| 06-cord-invoice-or-receipt.pdf | invoice_or_receipt | unknown | 0 |
| 07-fieldbench-other-document.pdf | other_document | unknown | 0 |
| 08-fieldbench-other-document.pdf | other_document | unknown | 0 |
| 09-fictional-pay-statement.pdf | pay_statement | paystub | 9 |
| 10-fictional-utility-bill.pdf | unknown | utility | 7 |

The classifier predicts broad types only. The local reader requires explicit supported English labels, so public receipts and unfamiliar payslip layouts can yield zero candidate facts even when their broad type is recognized. Publisher annotations are in a separate folder and were not supplied to the classifier or extraction reader.

## 01-payslips-pay-statement.pdf

AI suggestion: **pay_statement**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 02-payslips-pay-statement.pdf

AI suggestion: **pay_statement**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 03-fieldbench-invoice-or-receipt.pdf

AI suggestion: **invoice_or_receipt**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 04-fieldbench-invoice-or-receipt.pdf

AI suggestion: **invoice_or_receipt**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 05-cord-invoice-or-receipt.pdf

AI suggestion: **invoice_or_receipt**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 06-cord-invoice-or-receipt.pdf

AI suggestion: **invoice_or_receipt**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 07-fieldbench-other-document.pdf

AI suggestion: **other_document**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 08-fieldbench-other-document.pdf

AI suggestion: **other_document**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

No supported candidate facts were extracted. Read the source text or inspect publisher annotations separately; these are not automatic application answers.

## 09-fictional-pay-statement.pdf

AI suggestion: **pay_statement**. Reason: `model_suggestion`. Reader: Automatic local text reader (not AI).

| Field | Extracted value | Source page |
|---|---|---:|
| person | Alex Demo | 1 |
| issuer | Cedar Demo Workshop | 1 |
| period_start | 2026-09-01 | 1 |
| period_end | 2026-09-30 | 1 |
| pay_date | 2026-09-30 | 1 |
| gross_pay | 2550.00 | 1 |
| net_pay | 2060.00 | 1 |
| ytd_gross | 22950.00 | 1 |
| pay_frequency | monthly | 1 |

## 10-fictional-utility-bill.pdf

AI suggestion: **unknown**. Reason: `below_threshold`. Reader: Automatic local text reader (not AI).

| Field | Extracted value | Source page |
|---|---|---:|
| person | Alex Demo | 1 |
| issuer | Orchard Utility (fictional) | 1 |
| period_start | 2026-09-01 | 1 |
| period_end | 2026-09-30 | 1 |
| current_charges | 140.00 | 1 |
| prior_balance | 800.00 | 1 |
| amount_due | 940.00 | 1 |

