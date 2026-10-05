# Alex Demo: valid payment and expense test examples

All documents are fictional. Do not submit them. Prepared for testing on October 5, 2026; the September/October dates fall within the initial 90-day preparation window.

1. Reload BenefitStep and start a fresh preparation.
2. Enter household details: **Alex Demo**, **123 Example Lane**, **Sacramento**, **CA**, **95814**. Other members: **Morgan Demo** and **Riley Demo**, one per line. Leave the recent-document window at 90 days.
3. Start CalFresh or Medi-Cal, then import only the **pdfs/** folder. Do not click Try example documents; this pack supplies its own sources.
4. Review the extracted names, addresses, dates and amounts, then confirm.

| Document | Dates | Amounts |
|---|---|---|
| Pay statement | September 1–30; paid October 1, 2026 | Gross $2,550; net $2,040; YTD $22,950 |
| Rent receipt | September 1–30; paid September 1, 2026 | Rent $1,200; paid $1,200 |
| Utility statement | September 1–30; issued October 2, 2026 | Current $140; prior $0; total $140; paid $140 |
| Childcare receipt | September 1–30; paid October 2, 2026 | Billed $240; paid $240; care for Riley, paid by Alex |

Expected: recipient and California-address comparisons pass; dates are recent; no current/prior-balance or gross/net/YTD errors. These are searchable PDFs with explicit labels so the local text reader can work without an image model. Native model output may still need corrections. This pack does not establish agency acceptance, eligibility, deductions or complete application answers.

Expected fields are in **expected-results.json**. As time passes, dates may exceed your configured recent-document window.
