# Package Doctor — research evidence and rule provenance

Reviewed 2026-10-03. This records a desk review and a retrospective source-to-rule mapping. It does not claim that newly collected reports caused earlier implementation.

## What research can we substantiate?

**13 external pages reviewed in this pass:** five public applicant threads, three published Code for America research articles, four official benefits references and one utility-provider sample bill. Seven pages were already registered in the handoff; six were added during this review. Four further inherited Medi-Cal references are retained but were not reopened. Five retrieval leads were excluded from the reviewed count.

The five public threads include four California reports and one Arizona report, explicitly limited to general gross-income confusion. Four product-feedback themes come from this development conversation; they are not four interview participants. We conducted no new interviews or surveys. This is a purposive sample, so it cannot establish how common any problem is.

The earlier handoff registered 30 read sources: eight official benefits, three public reports, 13 technical and six dataset references, plus one failed retrieval. That historical count includes software and dataset research; it is not 30 benefits rules or 30 applicant complaints. Its proposed larger research targets were plans, not completed counts.

## The research-to-design chain

**Reported difficulty → documented question → scoped authoritative/context source → software condition → positive and negative tests.** A public report identifies a problem worth investigating. Official guidance supplies scoped process constraints. Software comparisons remain our implementation choices; collecting sources does not validate the code or establish eligibility.

## Public questions and complaints reviewed

| ID | Source | Problem reported (paraphrase) | Scope and use |
|---|---|---|---|
| U01 | [Self-employment reporting confusion](https://www.reddit.com/r/foodstamps/comments/1m68n09/question_about_income_reporting_threshold/) | Freelance earnings increased temporarily; the poster was unsure how deductions related to reporting obligations. | Unverified applicant report; previously registered, rechecked. |
| U02 | [Changed job income after earlier report](https://www.reddit.com/r/foodstamps/comments/v0n2jr/appealingam_i_still_eligible/) | Employment ended after an earlier income report; the poster was unsure which changed circumstances mattered. | Unverified applicant report; previously registered, rechecked. |
| U03 | [Income-request period confusion](https://www.reddit.com/r/foodstamps/comments/1wmiipy/ca_calfresh_medical_denied_even_though_im_getting/) | Final wages and unemployment payments fell across dates; repeated verification requests left the poster unsure what period/source to supply. | Unverified applicant report; previously registered, rechecked. |
| U04 | [Multiple income sources and an unclear requested period](https://www.reddit.com/r/foodstamps/comments/invi3p/help_signing_up_for_calfresh_when_i_have_had_many/) | The poster could not access an old employer payroll account and described a request whose year wording seemed inconsistent with its recent-paystub examples. | California self-report; collected now. |
| U05 | [Gross income versus money available after expenses](https://www.reddit.com/r/foodstamps/comments/1nliu6e/denied_being_over_income/) | The poster questioned a gross-income-based outcome while describing reduced hours and competing expenses. | Arizona self-report — not California policy evidence; collected now. |

Posts are evidence that an author described confusion, not independently verified case histories. We summarize problem patterns without reproducing usernames, financial histories or comment advice. No public posts were used to train the document classifier.

## Published service research reviewed

| ID | Source | Finding relevant to this project |
|---|---|---|
| R01 | [How GetCalFresh Helps Applicants Submit Verifications](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/) (2018-03-18) | Reports document-access barriers, uncertainty about acceptable evidence and receipt status. In an October 2017 survey of over 200 applicants, 27% were unsure about verification categories or acceptable documents. |
| R02 | [Challenges for CalFresh Applicants Without Stable Housing](https://codeforamerica.org/news/overcoming-barriers-identifying-challenges-for-calfresh-applicants-without-stable-housing/) (2019-03-15) | Describes difficulty obtaining paperwork and receiving notices; includes an applicant report of documents sent but treated as missing. |
| R03 | [Helping Self-Employed Applicants Access Their Full CalFresh Benefit](https://codeforamerica.org/news/helping-self-employed-applicants-access-their-full-calfresh-benefit/) (2019-10-09) | Studies how applicants describe gig work and varied income evidence; informs clearer self-employment questions and evidence examples. |

These studies, interviews and surveys were conducted by Code for America. Our contribution here is reviewing them and tracing their relevance to BenefitStep. The historical survey statistic is not a BenefitStep outcome or a current statewide estimate.

## Official and issuer context

| ID | Source | Supported interpretation and boundary |
|---|---|---|
| P01 | [7 CFR 273.2: application processing](https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.2) | Application filing and verification are distinct; joint programs retain separate determinations. Federal SNAP; California implementation and current exceptions require separate review. |
| P02 | [CalFresh: Questionable Information](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/QuestnblInfo.htm) | Inconsistent information can need clarification; an income/expense gap alone is not a denial basis. Santa Clara County CalFresh staff guidance; not a fraud rule. |
| P03 | [CalFresh: Verification Requirements](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/VrfctnReqsRcrt.htm) | Verification periods depend on application stage and anticipated income changes. Santa Clara County CalFresh; no universal fixed 30-day rejection rule and no staff database access in BenefitStep. |
| P04 | [CalFresh: Self-Employment](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Budgeting_Concepts/SlfEmplymnt.htm) | Self-employment expense methods and income averaging have conditions separate from employee wages. Santa Clara County CalFresh; a policy candidate, not an implemented automatic deduction. |
| B01 | [PG&E sample statement for consolidated billing](https://www.pge.com/assets/pge/docs/account/billing-and-assistance/sample-consolidated-bill.pdf) | The sample separates previous statement, payments, unpaid balance, current electric/gas charges, other services and total due. Supports distinguishing bill fields; does not measure how often applicants confuse them or define allowable CalFresh utility deductions. Extra services also limit simple three-number arithmetic. |

The utility sample’s other-services line illustrates why total due must not automatically be equated with current energy charges. PD08 is a narrow comparison of source fields, not a CalFresh deduction formula. We have not collected a direct applicant complaint measuring the frequency of this exact mistake.

## Feedback from this project

| ID | Recorded feedback | Relevance |
|---|---|---|
| F01 | Project owner requested one batch extraction action and fewer repeated confirmations. | Batch processing and a single review flow; no evidence for a specific benefit rule. |
| F02 | Project owner questioned why an observed document-income total still required an expected-monthly-income input. | Explain the distinction between recorded payments and expected complete household income; adjacent to PD04 and planned PD11/PD13. |
| F03 | Project owner reported extraction timeouts and repeated failed-file messages. | PD01: make unreadable/failed extraction visible and preserve manual correction. |
| F04 | Project owner asked the sidebar to match BenefitsCal questions with key local evidence. | Scoped request/evidence comparison and clear next actions; adjacent to PD05/PD06/PD12. |

## What is implemented?

The original catalog lists **24 design patterns**. The current Doctor emits **nine rule IDs**: PD01, PD03, PD04, PD05, PD06, PD07, PD08, PD12 and PD24. Two other patterns have related workflow guards in state.mjs (PD22 and PD23); they are not additional Doctor findings. Source mapping does not promote the remaining ideas into implemented features.

| Pattern | Current status | Evidence links | Actual behavior or gap |
|---|---|---|
| PD01 — Unreadable relevant field | implemented prototype doctor check | [R01](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/), [R02](https://codeforamerica.org/news/overcoming-barriers-identifying-challenges-for-calfresh-applicants-without-stable-housing/), F03 | Incomplete analysis or unresolved/conflicting candidate fields produces a needs-context finding. |
| PD02 — Partial document or page failure | design or future only | [R01](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/) | No distinct cropped-page completeness detector in doctor.mjs. |
| PD03 — Exact duplicate | implemented prototype doctor check | No external source established | Exact duplicate bytes are excluded; similar-looking documents are not automatically duplicates. |
| PD04 — Amount basis mismatch | implemented prototype doctor check | [U05](https://www.reddit.com/r/foodstamps/comments/1nliu6e/denied_being_over_income/), F02, [P03](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/VrfctnReqsRcrt.htm) | Warns when a prepared gross amount equals source net or YTD instead of source gross. |
| PD05 — Period/request mismatch | implemented prototype doctor check | [U03](https://www.reddit.com/r/foodstamps/comments/1wmiipy/ca_calfresh_medical_denied_even_though_im_getting/), [U04](https://www.reddit.com/r/foodstamps/comments/invi3p/help_signing_up_for_calfresh_when_i_have_had_many/), [P03](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/VrfctnReqsRcrt.htm), F04 | Compares owner-confirmed request scope/period with confirmed record facts; does not invent a universal evidence window. |
| PD06 — Person or application scope unresolved | implemented prototype doctor check | [U03](https://www.reddit.com/r/foodstamps/comments/1wmiipy/ca_calfresh_medical_denied_even_though_im_getting/), [P01](https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.2), F04 | Unresolved or mismatched person, program, application or period basis prevents a positive match. |
| PD07 — Conflicting same-context values | implemented prototype doctor check | [P02](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/QuestnblInfo.htm) | Requires matching person, issuer, full period and pay date before flagging unequal gross amounts. |
| PD08 — Previous balance mistaken for current charge | implemented prototype doctor check | [B01](https://www.pge.com/assets/pge/docs/account/billing-and-assistance/sample-consolidated-bill.pdf) | Flags total due used as current charge only with known source amounts, positive previous balance and reconcilable arithmetic. |
| PD09 — Shared or included expense double count | design or future only | No external source established | No dedicated shared-expense double-count rule in doctor.mjs. |
| PD10 — Recorded expenses exceed recorded income | design or future only | [P02](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/QuestnblInfo.htm) | Design only; no income-versus-expense sufficiency or fraud check is implemented. |
| PD11 — Income change/history | design or future only | [U02](https://www.reddit.com/r/foodstamps/comments/v0n2jr/appealingam_i_still_eligible/), [P03](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/VrfctnReqsRcrt.htm), F02 | History exists, but automatic employment-change diagnosis is not implemented under PD11. |
| PD12 — Confirmed county request outstanding | implemented prototype doctor check | [U03](https://www.reddit.com/r/foodstamps/comments/1wmiipy/ca_calfresh_medical_denied_even_though_im_getting/), [R01](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/), [R02](https://codeforamerica.org/news/overcoming-barriers-identifying-challenges-for-calfresh-applicants-without-stable-housing/), [P01](https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.2), F04 | Keeps a confirmed county request open until a matching response event; a local import is not submission or acceptance. |
| PD13 — Ambiguous date or pay frequency | design or future only | [U03](https://www.reddit.com/r/foodstamps/comments/1wmiipy/ca_calfresh_medical_denied_even_though_im_getting/), F02 | No general ambiguous-date or weekly-versus-semimonthly diagnosis under PD13. |
| PD14 — Supporting proof not yet added | design or future only | [P01](https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.2), [R01](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/), [R02](https://codeforamerica.org/news/overcoming-barriers-identifying-challenges-for-calfresh-applicants-without-stable-housing/) | Official application route remains visible, but no new program-specific proof-deferral engine is implemented. |
| PD15 — Suggested item with unknown program | design or future only | [P01](https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.2) | No distinct PD15 finding emitted. |
| PD16 — Self-employment expense method | design or future only | [U01](https://www.reddit.com/r/foodstamps/comments/1m68n09/question_about_income_reporting_threshold/), [R03](https://codeforamerica.org/news/helping-self-employed-applicants-access-their-full-calfresh-benefit/), [P04](https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Budgeting_Concepts/SlfEmplymnt.htm) | No automatic self-employment expense-method election or deduction. |
| PD17 — Requested care coverage question | design or future only | [P05](https://www.dhcs.ca.gov/services/medi-cal-resources/for-medi-cal-members/) | No individualized health-service coverage determination. |
| PD18 — Notice indicates authorization or denial | design or future only | [P05](https://www.dhcs.ca.gov/services/medi-cal-resources/for-medi-cal-members/), [P06](https://www.dhcs.ca.gov/services/appeal/) | Notice extraction is not an implemented coverage/appeal diagnosis. |
| PD19 — Document integrity concern | design or future only | No external source established | No authenticity or fraud detector. |
| PD20 — Rule or source stale/unsupported | design or future only | No external source established | No generic stale-policy finding in doctor.mjs. |
| PD21 — Specific-program referral | design or future only | [P07](https://www.dhcs.ca.gov/services/genetically-handicapped-persons-program/find-out-if-i-qualify-ghpp-qualify/), [P08](https://www.dhcs.ca.gov/services/california-childrens-services/) | No automatic condition-based program referral. |
| PD22 — Transfer snapshot changed | adjacent workflow guard | No external source established | Revision-aware transfer invalidation exists in state.mjs; not a PD22 Doctor finding. |
| PD23 — Receipt type mismatch | adjacent workflow guard | [R01](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/), [P01](https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.2) | Receipt-type checks and separate application/upload events exist in state.mjs; no PD23 finding emitted. |
| PD24 — Unknown document family | implemented prototype doctor check | [R01](https://codeforamerica.org/news/overcoming-barriers-how-getcalfresh-helps-applicants-submit-verifications/), F03 | Flags unresolved extracted document kind. It is not directly triggered by the trained classifier score. |

The precise strength of each connection is recorded in [rule-evidence-map.json](rule-evidence-map.json). For example, PD03 is an engineering safeguard with no direct complaint established here; PD07 has general official context; PD08 has issuer-field support; PD05 has both relevant applicant reports and scoped verification guidance. Do not present all checks as equally complaint-derived.

## Implementation and tests

- [Doctor implementation](../../src/doctor.mjs)
- [Doctor tests](../../tests/doctor.test.mjs)
- [State and event tests](../../tests/state.test.mjs)
- [Original design catalog](../../../BenefitStep_Implementation_v0_1/knowledge/package_doctor_catalog.json)
- [Machine-readable research register](sources.json)
- [Presentation wording](../../presentation/BenefitStep_Package_Doctor_Research.md)

The tests exercise authored scenarios, including a prior-balance mistake versus a genuinely high current charge, unknown amounts, scoped requests, exact duplicates, changed confirmations and distinct upload/application receipts. They are software checks, not tested applicant outcomes or proof of county acceptance.

## Defensible presentation wording

> We reviewed public applicant questions, published service research, and official guidance to identify preparation problems and examine Package Doctor’s checks. We mapped those sources to implemented checks and future ideas, keeping the source scope and evidence gaps visible. Public reports help us find problems; they do not determine benefit rules.

Do not claim that we interviewed these Reddit authors, surveyed Code for America’s participants, trained an AI on complaints, implemented all 24 patterns, proved reduced denials, or independently confirmed agency mistakes.

## Continuing collection

For each new item, save its URL, review date, source type, jurisdiction, application stage, short de-identified problem summary, supporting passage location, proposed rule connection and limitations. Label it as newly collected. Count unique source pages separately from themes, participants, rules and tests. Keep incomplete retrievals as leads until the relevant page can be read. Prioritize unresolved evidence gaps for duplicates, YTD confusion, conflicting corrected pay records and unclear document types, plus permissioned interviews with applicants and benefits navigators.


## Expanded AI-authored scenario assessment

A new [158-case catalog](../../tests/scenarios/package-doctor-v1.json) contains **132 executable cases and 26 future narrative cases**. The executable cases exercise nine Doctor checks and two state guards after extraction: issues, valid non-issues, missing context, wrong scope and changes over time. They use fictional values and preconstructed extraction outputs, not real applicant PDFs. Source IDs identify background context from the existing map; they do not mean a source supplied or validated each synthetic case.

The first run produced **129 passes and 3 failures**. The original 46 Doctor/state tests were rerun and all passed. Production behavior was not changed in this assessment. See the [full scenario results](SCENARIO_ASSESSMENT.md), [machine-readable observations and source hashes](scenario-results.json), and [evaluation method](SCENARIO_METHOD.md).

The original 120 planned handoff entries remain `not_run`. The new corpus is a separate artifact with overlapping design themes; do not add those counts or the 46 test count to imply unique observed applicant cases.

## Document breadth

The scenario count does not establish coverage across BenefitsCal document categories. The [26-family coverage map](DOCUMENT_COVERAGE.md) separates trained labels, limited extraction paths, Doctor checks and unexecuted challenge examples. It also records how heavily the new case set relies on paystubs.
