# Package Doctor — research slides and speaker wording

The main deck now includes the research summary and check inventory as slides 10–11. The material below provides additional detail; Slide B is an optional appendix for questions about evidence. Full source-by-source provenance is in [the research register](../research/package-doctor/README.md).

## Slide A — From applicant problems to checks we can explain

**13 external pages reviewed**

| Evidence | Pages | Role |
|---|---:|---|
| Public applicant questions and complaints | 5 | Identify confusing situations |
| Published Code for America research | 3 | Understand documented service barriers |
| Official benefits guidance | 4 | Bound the response by program, stage and jurisdiction |
| Utility-provider sample statement | 1 | Check what bill fields actually represent |

**Reported problem → source review → defined check → positive and negative test**

Current prototype: **9 implemented Doctor rule IDs**. The larger catalog contains 24 design patterns.

*Bounded desk review, not a representative survey. Four applicant threads concern California; one Arizona thread is used only for general amount-basis confusion. No new interviews were conducted. Four additional feedback themes came from this project’s development conversation.*

### Speaker wording

“We want Package Doctor’s checks to have a traceable reason. We reviewed public applicant questions, published service research and official guidance, then mapped them to checks in the prototype. Public reports reveal confusing situations; they do not establish benefit rules. This review includes material already in our handoff and sources collected now. We distinguish the nine implemented Doctor checks from ideas still in the design catalog.”

### Source note

The counts come from [sources.json](../research/package-doctor/sources.json), which records seven previously registered pages rechecked and six newly collected pages. Code for America conducted the cited research; we did not conduct its surveys or interviews. Incomplete retrievals and four inherited references not reopened are excluded from the 13-page count.

## Slide B — What the evidence supports

| Observed question or document issue | Evidence | Product response | Status |
|---|---|---|---|
| Which income period is being requested? | [Public report](https://www.reddit.com/r/foodstamps/comments/invi3p/help_signing_up_for_calfresh_when_i_have_had_many/) and [county verification guidance](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/VrfctnReqsRcrt.htm) | Match confirmed records to the actual request and its scope | PD05/PD06 implemented |
| Were my documents received, and what remains open? | [Published GetCalFresh research](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/) | Keep preparation, response receipts and application submission distinct | PD12 and related event guards implemented |
| Does this amount mean gross pay or money available after expenses? | [Arizona applicant report](https://www.reddit.com/r/foodstamps/comments/1nliu6e/denied_being_over_income/) — general confusion only | Compare the prepared gross amount with named gross/net/YTD source fields | PD04 implemented; exact algorithm is our design |
| Does total due include older balances or other items? | [PG&E sample statement](https://www.pge.com/assets/pge/docs/account/billing-and-assistance/sample-consolidated-bill.pdf) | Compare current charge, previous balance and total; request context if arithmetic does not reconcile | PD08 implemented; no complaint-frequency claim |
| My job ended after I reported income | [Public report](https://www.reddit.com/r/foodstamps/comments/v0n2jr/appealingam_i_still_eligible/) | Identify the effective change and relevant records | PD11 design only |
| How does freelance income relate to expense methods? | [Public question](https://www.reddit.com/r/foodstamps/comments/1m68n09/question_about_income_reporting_threshold/), [service research](https://codeforamerica.org/news/helping-self-employed-applicants-access-their-full-calfresh-benefit/) and [county guidance](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Budgeting_Concepts/SlfEmplymnt.htm) | Prepare a scoped explanation rather than automatically applying a deduction | PD16 design only |

### Speaker wording

“Some checks connect directly to reported confusion, such as matching income records to the requested period. Others are engineering safeguards supported by document structure. The previous-balance example is in that second group: the bill contains distinct amounts, and our software tests whether they were mixed up. We have not measured how frequently applicants make that mistake. Changed-employment and self-employment-method guidance remain future work.”

### Claim boundaries

- These are sources reviewed, not 13 verified complaints, participants or independent rules.
- The five public threads are unverified reports; they do not prove agency fault or a correct case outcome.
- Published research supports problem discovery; its participants and results belong to the cited authors.
- Software tests use authored scenarios. BenefitStep has not measured a reduction in denials or an increase in benefit receipt.
- Package Doctor is currently rule-based. Neither these posts nor the published research were used as model-training data.
