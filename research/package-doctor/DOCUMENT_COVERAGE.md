# BenefitsCal document-family coverage

BenefitsCal evidence varies by program, household circumstances and county request. This is a **26-family product planning map**, not a requirement to collect 26 documents or a complete official upload-category list. The earlier 132 scenarios measure Doctor/state behavior after extraction. They do not establish broad document recognition.

Current DHCS examples span identity, several income sources and supporting expense records; the guidance also explains alternatives when income proof is unavailable. [DHCS Medi-Cal Help](https://www.dhcs.ca.gov/medi-cal/help/). The older joint application illustrates housing, health-insurance and separate cash-aid evidence categories; its 2013 checklist is used here only to identify document families, not current requirements. [CDSS SAWS 1, coversheet page 2](https://www.cdss.ca.gov/cdssweb/entres/forms/English/SAWS_1.pdf).

## Current limits

- Trained model: three broad labels—pay statement, invoice/receipt, other document—with unknown as abstention. It does not separately recognize IDs, leases, bank statements, tax returns or insurance policies.
- Extraction: 13 named kinds plus unknown. These are schema/reader paths, not 13 validated AI classes. The local parser requires limited English title/field cues; native AI accuracy remains unverified.
- New scenario corpus: 87 of 132 executable cases contain paystubs, 37 county requests, 13 utility records, 12 rent records, 11 unknown records, 10 upload receipts, six application receipts and one medical record. Counts overlap; no real PDF extraction is tested in this corpus.
- No cases in that corpus instantiate mortgage, childcare, support, self_employment, income_award or coverage_notice. Existing tests elsewhere may cover them; this is an audit of the new corpus only.

## Coverage and gaps

| Document family | Existing extraction path | Doctor / state scope | New challenge examples (not executed) |
|---|---|---|---|
| Pay statements | paystub | PD04, PD07; PD05/06 if request linked | Net deposit mistaken for gross; two employers paid on same day |
| Employer income letters | No dedicated schema | Future structured letter extraction | Job ended after last paycheck; variable hours without monthly guarantee |
| Business income / profit-and-loss statements | self_employment | PD01; expense-method reasoning is future PD16 | Revenue versus profit; personal transfer recorded as business revenue |
| Tax returns and schedules | No dedicated schema | Future dedicated schema | Prior-year annual income mistaken for current monthly income; missing Schedule C |
| Benefit award letters | income_award | PD01; no general benefit-income policy engine | Retroactive lump sum versus recurring payment; superseded award |
| Bank statements | No dedicated schema | Future dedicated schema | Own-account transfer mistaken for wages; statement balance mistaken for income |
| Support payment records | support | PD01; state routes paid/received separately | Received support assigned to expenses; court order mistaken for payment receipt |
| Rent receipts and lease agreements | rent | PD01; shared/included expense diagnosis is future PD09 | Deposit mistaken for monthly rent; rent includes separately entered utilities |
| Mortgage statements | mortgage | PD01; no dedicated mortgage-component Doctor comparison | Loan balance mistaken for payment; escrow and property tax counted twice |
| Utility and telephone bills | utility | PD08 for known positive arrears; phone layout support unverified | Past-due total used as current charge; bill credit or included service |
| Property tax and housing insurance | No dedicated schema | Future dedicated schema | Annual premium mistaken for monthly cost; escrow duplicates statement |
| Child or dependent-care invoices | childcare | PD01; adult-care layouts not separately validated | Two children share an invoice; billed amount versus paid receipt |
| Medical bills | medical | PD01; no individualized deduction/coverage decision | Insurer payment mistaken for patient responsibility; duplicate provider statements |
| Insurance cards and coverage / employer-offer records | No dedicated schema | Future dedicated schema; policy/card is not coverage_notice | Insurance card mistaken for proof a treatment is covered; old policy card |
| Photo ID and passport | No dedicated schema | Future dedicated schema; no authenticity check | Name variation across sources; blurred relevant text |
| Birth certificates | No dedicated schema | Future dedicated schema | Child record attributed to parent; unclear spelling |
| Immigration documents | No dedicated schema | Future dedicated schema; separate reviewed policy context | One-sided card image; document belonging to non-applicant |
| School enrollment / student records | No dedicated schema | Future dedicated schema; no automatic student eligibility decision | Old term mistaken for current enrollment; aid award mistaken for wages |
| Immunization records | No dedicated schema | Outside current CalFresh/Medi-Cal roadmap unless an actual scoped request calls for it | Screenshot upload suggestion copied into every program checklist; wrong child |
| Vehicle / insurance-value / trust / investment records | No dedicated schema | Future dedicated schemas; applicability requires reviewed program context | Loan value confused with asset value; cash-value insurance confused with health coverage |
| County verification requests | county_request | PD12; PD05/06 for linked evidence | Request for different program; ambiguous date basis |
| Application submission receipts | application_receipt | PD23 state guard | Upload receipt mislabeled application receipt; different program |
| Document upload receipts | upload_receipt | PD12 and PD23 state guard | Local import mistaken for upload; receipt for another request |
| Coverage decision notices | coverage_notice | PD01; individualized decision/appeal interpretation is future PD18 | Partial notice hides next-action page; authorization confused with receipt |
| Renewal and periodic-report forms | No dedicated schema | Future dedicated schema; do not treat all forms as county_request | Medi-Cal renewal misrouted as CalFresh recertification; prior period form |
| Mixed packets and unrelated / unreadable files | unknown | PD24; no reliable general mixed-packet splitter | Bank statement bundled with paystub; instruction-like text in unrelated document |

## How to expand evaluation

Use document families as one axis and mistakes, missing context, valid cases and lifecycle changes as another. Test realistic layout/issuer variation separately from repeated field-value variations. A family needs both a correct example and confusing near-neighbors: an insurance card versus a medical bill, an employer letter versus a paystub, and an application receipt versus an upload receipt.

Prioritize richer evaluation of existing paths for pay, rent, utility, mortgage, dependent-care, support, medical, business income and benefit awards. Then add dedicated schemas and reviewed labeled data for major uncovered families such as bank statements, tax returns, employer letters, identity and health-insurance records. Priority is a product choice, not measured document prevalence.

For each family, report classification errors/unknowns, supported field accuracy with source references, Doctor missed issues/false alarms, and end-to-end processing time separately. Keep unseen issuer/layout families outside training. Include scans, missing pages and multi-document packets; until supported, they should produce understandable uncertainty rather than invented details.

One source can support several evidence needs. For example, a utility statement may provide both a stated address and a charge, but BenefitStep currently has no address field. Do not force duplicate uploads or claim current residence has been established from a historical address. A future UI should show matched evidence, uncertainty and source-specific requests while preserving the ability to continue the official application.

The additional source review here is separate from the prior 13-source research count. The 26 document families are also separate from the previous 26 future rule scenarios. [Machine-readable map](document-family-coverage.json) · [Existing executed scenario results](SCENARIO_ASSESSMENT.md) · [Model card](../../ml/document_classifier/MODEL_CARD.md).
