# BenefitStep — speaker wording v0.1

Companion to [the 17-slide presentation](BenefitStep_Slides_v0_1.md). Written for approximately 13–15 minutes, including a 90-second demonstration. Timing is a rehearsal target, not a measured product-performance claim.

Use a conversational pace. The central story is: **understand the evidence, resolve an important issue, and help the applicant take the next step.**

---

## Slide 1 — BenefitStep

**Suggested wording · 25 seconds**

“BenefitStep helps people prepare for benefits applications and keep track of what happens afterward. The idea is simple: bring the documents you already have, review the information that matters, and keep those details beside you while completing the official application.

We are building this as a browser companion, with document processing on the device and control over sharing left with the applicant.”

**Visual direction:** Product name, tagline, and one clean image of the sidebar. Use the current [synthetic-demo screenshot](../tests/sidebar.png), or capture the opening screen. Avoid personal BenefitsCal screenshots in a shared deck.

---

## Slide 2 — Having the document is only the beginning

**Suggested wording · 40 seconds**

“A document does not directly tell you what to enter into an application. A pay statement has gross pay, take-home pay, and year-to-date earnings. A bill can combine this month’s charges with an earlier unpaid balance.

Someone may have the right document but still need help choosing the right number, understanding its period, or matching it to a request. After sending something, they also need to know whether they have recorded a submission, an upload, or an actual county response.

Those are the preparation tasks BenefitStep is designed to support.”

**Visual direction:** Show the fictional utility bill with two highlighted labels: “Current charges: $140” and “Total due: $940.” Describe this as an illustrative problem, not a measured claim about how often applicants make this mistake.

---

## Slide 3 — Four parts, one experience

**Suggested wording · 40 seconds**

“BenefitStep brings four parts into one workflow. The guide keeps the next action visible. The classifier suggests a broad type; a separate reader prepares candidate information. Package Doctor checks how that information relates to other fields or to an application task. Privacy shapes where processing happens and how information can leave the workspace.

The applicant should not have to operate four separate tools. They add available documents, deal with the important questions, confirm the resolved information, and continue.”

**Visual direction:** Four equally sized cards surrounding a single applicant workflow. Keep technical component names secondary to the action each one supports.

---

## Slide 4 — Start with an early answer, then prepare

**Suggested wording · 45 seconds**

“We preserved the quick-check experience already reviewed for this project. It uses four questions per program, including an income range, and updates the preliminary result when an answer changes. People can also skip it and start preparing.

Next, they choose multiple files or a folder. The app processes the batch without asking them to label each document or press Extract repeatedly. It then focuses attention on unresolved information and offers one confirmation for the resolved summary.

Throughout the process, the official application route stays available. A preparation gap does not become an app-imposed barrier to applying.”

**Visual direction:** A horizontal journey on a wide slide. Make “Resolve important issues” a small step inside document review, consistent with the four-destination UI. Do not suggest every source or event is confirmed forever by one click; later changed facts and newly recorded events need their own review.

---

## Slide 5 — Residence first; proof depends on the program

**Suggested wording · 50 seconds**

“The early check already asks for clarification when someone says they do not live in California or are unsure. It distinguishes a recent move, no fixed address, a temporary absence, and living in another state. These lead to different next steps, while the official application remains available.

Evidence requirements also differ by program. CalFresh generally verifies residence, with flexible evidence and exceptions. DHCS tells Medi-Cal applicants to certify residence and provide their living or mailing address without routine residency documents.

We should reuse relevant documents and ask about an unclear address when needed. That evidence guidance is planned; automatic address extraction and a residency-specific Doctor rule are not implemented.”

**Visual direction:** Put the two program rows beside the existing quick-check choices. Label the upper part “Implemented quick check” and the lower part “Planned evidence guidance.” Do not demonstrate an address comparison the app cannot perform.

**Sources:** [CalFresh verification](https://www.ecfr.gov/current/title-7/section-273.2), [DHCS address guidance](https://www.dhcs.ca.gov/medi-cal/help/), and [current routing code](../src/quick-screen.mjs). Guidance reviewed 2026-10-03; specific county requests remain relevant. This is a separate policy clarification, not an increase in the original 13-source desk-review count.

---

## Slide 6 — Read the document—and preserve what its numbers mean

**Suggested wording · 50 seconds**

“Document recognition has two jobs. First, identify what kind of document this appears to be. Second, extract information with the correct meaning and a source reference.

In this fictional pay statement, twenty-five fifty is current gross pay, twenty-sixty is take-home pay, and twenty-two thousand nine hundred fifty is year-to-date gross pay. Recognizing the digits is only part of the task. Preserving those meanings is essential.

The current build connects an on-device AI adapter and validates candidate output. It also has a limited local reader for explicitly labeled text. The browser demonstrations use that reader; hardware-native AI performance still needs evaluation. We have now trained a separate small text classifier on public data for pay statements, invoices or receipts, and other documents. In a held-out pilot of 163 eligible documents, it made 126 correct suggestions and left 37 unknown. This is an experimental classifier, not a trained field extractor; source and class are partly confounded, so these results do not establish accuracy across benefits documents.”

**Visual direction:** Use the three-row amount table with a small source-page marker next to each field. If demonstrating with the label reader, leave its processing-method label visible. Do not call that path AI inference.

**Follow-up evidence:** The later 12-case challenge produced 0 correct suggestions, 11 unknowns and 1 wrong suggestion. Show the candidate evaluation next; the early public pilot cannot stand alone as evidence of readiness. [Challenge results](../demo/challenge-v1/RESULTS.md).

---

## Slide 7 — Cover the documents people actually bring

**Suggested wording · 45 seconds**

“Benefits preparation involves much more than paystubs. Our development map now spans twenty-six document families, including income, housing, care, identity, insurance and agency correspondence.

Those twenty-six families describe the work ahead. The trained model still has only three broad labels. The extractor has thirteen named schemas plus unknown, but having a schema does not prove accuracy on unfamiliar documents.

The Doctor assessment is also uneven: eighty-seven of its one hundred thirty-two cases contain paystubs. We need realistic examples and useful checks across more families. Applicants should see evidence relevant to their circumstances, not a demand to supply everything on this map.”

**Visual direction:** Six evidence groups, then a small status line: “3 trained labels / 13 extraction schemas / 26 planned families.” Keep these units explicit. The 26 future rule scenarios are a different count with no one-to-one relationship.

**Evidence:** [Document-family map](../research/package-doctor/document-family-coverage.json), [schema](../shared/core/schema.mjs), [model card](../ml/document_classifier/MODEL_CARD.md). Scenario counts overlap because one case can include several kinds of document.

---

## Slide 8 — More realistic data exposed the model’s limits

**Suggested wording · 65 seconds**

“We built a harder fictional corpus: one hundred forty-four documents across thirty-six authored families. Each has a searchable PDF and a degraded scan read by actual local OCR. Those are two captures of the same document, not independent documents.

Combining public and new synthetic data gave the candidate six hundred fifty-two training rows from five hundred fifty-six documents. Validation used one hundred sixty-eight documents, and the new test used twenty-four documents represented by forty-eight captures.

On that test, the shipped model left every capture unknown. The experimental candidate made fourteen correct suggestions and left thirty-four unknown. All accepted suggestions were invoices or receipts; every pay-record capture remained unknown. The candidate failed the release criteria on validation, so it was not deployed.

The result gives us useful failure evidence and more realistic training material. It does not establish recognition across real applicants’ documents.”

**Visual direction:** Use the partition table followed by the matched-test comparison. Keep “Not deployed” next to v0.2. Do not turn fourteen out of fourteen accepted suggestions into a headline accuracy claim.

**Technical Q&A:** The model remains hashed TF-IDF plus logistic regression with three classes. Family splits and separate layout pools reduce overlap, but shared rendering components prevent an independent issuer claim. The old 163-document public test is now a regression set for v0.2. Candidate Chrome timing was 2.4 ms median for a warm batch of 48 already-extracted texts; it excludes loading, PDF reading, OCR, extraction and UI. Actual OCR was an offline macOS corpus-building step, not a shipped extension feature.

**Evidence:** [Candidate metrics](../ml/document_classifier_v0_2/artifacts/metrics.json), [dataset and reproduction](../ml/document_classifier_v0_2/README.md), [fictional gallery](../ml/document_classifier_v0_2/data/realistic-v1/index.html).

---

## Slide 9 — Package Doctor checks the relationship

**Suggested wording · 50 seconds**

“Here is the key Package Doctor example. Both bills have a total due of nine hundred forty dollars. In Bill A, that total includes eight hundred dollars from an earlier balance. Current charges are only one hundred forty dollars. In Bill B, all nine hundred forty dollars belongs to current charges.

If the prepared current-charge answer is nine hundred forty for Bill A, the app identifies the mismatch and points back to the source amounts. Bill B should not trigger the same warning.

For this demonstration, we deliberately change Bill A’s prepared answer to create the error. That tests the checking logic without pretending the extractor made a mistake it did not make.”

**Visual direction:** Put the two fictional bills side by side. Reveal the result only after the audience sees the amounts. Keep both cases visible so the negative test is part of the main story.

---

## Slide 10 — Where Package Doctor’s checks come from

**Suggested wording · 45 seconds**

“We reviewed thirteen external sources: five public applicant threads, three published Code for America research articles, four official benefits references and a utility-provider sample bill. Seven sources were in our earlier handoff and six were collected in the later review.

The sources play different roles. Applicant reports help identify confusing situations. Published research gives context. Official guidance sets boundaries for program-specific responses. We then map the evidence to checks and tests in our prototype. Some checks are engineering safeguards rather than directly complaint-derived rules.

This was desk research. We did not conduct the cited studies or independently verify the reported cases.”

**Visual direction:** Four source categories with counts, followed by the research-to-check sequence. Keep the distinction between older references and later collection visible. Do not use a participant count or an AI-training graphic.

**Evidence:** [Full research register](../research/package-doctor/README.md), [machine-readable sources](../research/package-doctor/sources.json). The one Arizona thread supports general confusion only, not California policy. The four development-feedback themes are not four interview participants.

---

## Slide 11 — What Package Doctor checks today

**Suggested wording · 50 seconds**

“The current Doctor handles nine categories. It identifies unresolved information and document types, excludes identical files, compares gross pay with net and year-to-date amounts, and checks whether evidence fits the person, program and period of a request. It also checks conflicting comparable pay records, previous balances used as current charges, and county requests without a recorded response.

There are two additional workflow safeguards: changed information invalidates an earlier confirmed transfer, and an upload receipt cannot stand in for an application receipt.

Our catalog contains twenty-four patterns altogether. Nine are Doctor checks, two have related workflow safeguards, and thirteen remain design or future work. A check can ask for context; it does not always mean the applicant made an error.”

**Visual direction:** Use the nine-row coverage table. Put the 9 + 2 + 13 status breakdown below it. Keep IDs in smaller text for technical questions; lead with readable descriptions.

**Scope note:** PD03 is exact-file deduplication, not recognition of all duplicate payments. PD24 follows the extraction component’s unresolved document kind, not the separate trained classifier score. PD07 requires matching person, employer, period and pay date. PD08 requires known source amounts and reconciled arithmetic. None is a complete-income, authenticity or eligibility determination.

**New scenario assessment:** AI authored 158 synthetic scenarios: 132 executable cases across the nine checks and two guards, plus 26 narrative cases for future features. The first execution passed 129 and failed three. Two executable cases deliberately alter event state to test defensive handling; the rest use public state actions or reproduce the existing UI action. This is not independent model evaluation or observed applicant data. [All cases and results](../research/package-doctor/SCENARIO_ASSESSMENT.md).

**Earlier case count:** The original handoff contains 120 planned scenarios: five variants for each of 24 patterns (issue, non-issue, unknown context, wrong scope, changed period). All 120 remain marked `not_run` in that catalog. Separately, the executed Doctor/state subset contains 46 passing automated tests, including extraction validation and state protections. These are distinct test artifacts, not 120 implemented checks or 46 independent applicant cases.

**Evidence:** [Implementation](../src/doctor.mjs), [executed test results](../research/package-doctor/latest-check-tests.txt), [original planned scenarios](../../BenefitStep_Implementation_v0_1/tests/package_doctor_scenarios.json).

---

## Slide 12 — The same record can fit one request and miss another

**Suggested wording · 40 seconds**

“A second example checks the task rather than the size of an amount. A September income record does not cover a request for October income. But that same record can be relevant when the request is specifically for September.

The app compares the confirmed request with selected evidence, including the program, person, dates, and what those dates mean. If the context is missing, it asks for clarification.

This is why we preserve historical documents. Their usefulness depends on the request. A date match still does not establish that the county has accepted the evidence.”

**Visual direction:** Keep one September document in the center and show two request cards. Add a third, quieter “Need context” state. Do not depict a matched record as an approved application.

---

## Slide 13 — Privacy is part of the workflow

**Suggested wording · 45 seconds**

“Personal documents and prepared facts stay in the extension’s session memory during processing. There is no automatic cloud document fallback, and the extension does not need access to the BenefitsCal page to provide the manual companion.

Moving information out is an explicit action: the applicant copies displayed details or selects originals for export, then completes the official application themselves.

There are practical boundaries. The first local-model setup may need a public model download. Exported files and copied text are outside the workspace’s control. Saved-work encryption is not enabled in this build, so closing or reloading loses the session.”

**Visual direction:** Draw a device boundary around local reading, checking, and confirmation. Put a clearly labeled user action on the arrow leaving that boundary. Do not use a lock icon to imply downloaded ZIP files are encrypted.

---

## Slide 14 — Demo: from a bill to a usable answer

**Live-demo wording and actions · approximately 90 seconds**

| Action | What to say |
|---|---|
| Start with the fictional bill already imported, or add it live if rehearsal timing allows. | “This is a fictional utility bill. BenefitStep has kept current charges, previous balance, and total due separate.” |
| In Confirm details, change **Current utility charges** from **140** to **940**. | “I’m deliberately changing this answer to the total due so we can test the checker.” |
| Show the Package Doctor finding and open its source. | “The finding explains the relationship and gives me the evidence to compare. It pauses this answer; the rest of the preparation remains available.” |
| Correct the answer to **140**, then choose **Yes, correct**. | “Once I resolve the issue, I confirm the available details together.” |
| Open the CalFresh guide and select **Expenses**. | “These are the confirmed details I can use while answering the official form. This panel does not fill or submit that form.” |
| Open the prepared package; select the bill, specify its intended person and purpose, and download. | “I choose which original to include. The ZIP contains an indexed review PDF and the unchanged selected original.” |
| Briefly point to follow-up. | “Preparation, submission, and county response are recorded separately. Downloading this file has not submitted an application.” |

**Integrated AI demo:** In an empty session, use **Add documents → Try AI demo with fictional documents**. Show the pay-statement suggestion and source scores, then the bill’s Unknown result. Say: “The classifier suggests a broad type; the separate reader can still extract explicitly labeled facts when the classifier abstains.” Continue with the bill correction below. See [the integrated demo guide](../demo/ai-components/DEMO.md).

**Rehearsal setup:** Use [the full demo instructions](../demo/package-doctor/DEMO.md). Select **Local text reader** in Processing options for a repeatable demo and identify that mode accurately. Do not start a first-time model download during the presentation. Use a recorded walkthrough or screenshots if the live-demo time is too short.

**Demo files:**

- `../demo/package-doctor/01-bill-with-previous-balance.pdf`
- `../demo/package-doctor/02-large-current-bill.pdf`
- `../demo/package-doctor/03-september-pay.pdf`
- `../demo/package-doctor/04-request-october.pdf`
- `../demo/package-doctor/04-request-september.pdf`

Do not submit any fictional record to a real agency. The official-site portion can be explained with the local guide alone.

---

## Slide 15 — What we have tested

**Suggested wording · 65 seconds**

“The recorded full-suite run has two hundred two passing automated tests. We also rechecked forty-six tests for the Doctor and related state handling, and all passed. Those forty-six are a subset of the suite, not additional tests.

We then used AI to write a larger set of synthetic scenarios. Of one hundred thirty-two executable cases, one hundred twenty-nine passed and three failed. Another twenty-six describe future behavior and were not executed. The failures involve deleting an original with duplicates, comparing uncertain pay values, and a deliberately altered receipt from another application. We have kept the failures visible. These are logic checks after extraction, not document-recognition accuracy or observed applicant outcomes.

We also loaded the extension into Chrome and exercised real synthetic PDFs through import, correction, confirmation, follow-up, and export. The paired bill and request examples produced different outcomes as intended.

During the instrumented browser flow, we observed no remote HTTP or HTTPS page requests, and the tested storage remained empty. These results support specific implementation claims. They do not establish extraction accuracy across real documents, comprehensive security, or measured benefits for applicants.”

**Visual direction:** Use three evidence cards: “202 full-suite tests; 46 Doctor/state tests rechecked,” “132 synthetic scenarios: 129 passed / 3 failed,” and “Installed Chrome workflow.” Put “Local preview validation” above the cards. Avoid an accuracy percentage or security certification badge.

**Evidence:** [Scenario assessment](../research/package-doctor/SCENARIO_ASSESSMENT.md), [Validation record](../VALIDATION.md), [Node results](../tests/latest-node.txt), [Browser results](../tests/latest-browser.json).

---

## Slide 16 — What we need to prove next

**Suggested wording · 45 seconds**

“The next stage starts with the failures we have measured: the candidate classifier did not meet release criteria, and three expanded Doctor scenarios failed. We need agreed fixes, independent review of the expected outcomes, and unfamiliar document families and devices. Recognition, field extraction and Doctor behavior need separate measurements.

For the workflow, we need people completing fictional tasks so we can measure effort and see whether they understand the next action. Encrypted saved work needs separate security review. More consequential policy recommendations need reviewed official guidance and tested scope conditions.

Public applicant experiences can help us identify problems to investigate. They are not a source of benefit rules or proof that a recommendation is correct.”

**Visual direction:** Five evaluation questions with a concrete measurement or review beside each. Present these as planned work, not completed research. Keep the broader Medi-Cal coverage feature in future work if asked; the current build provides separate preparation and follow-up.

---

## Slide 17 — Make the next step easier

**Suggested wording · 25 seconds**

“BenefitStep brings the document, the prepared answer, and the reason for a correction into one workflow. The applicant can understand what needs attention, confirm the information they have checked, and choose what to share.

Our next goal is to test whether this makes preparation easier while preserving clear sources and user control.

That is the promise behind BenefitStep: simpler applications, checked details, and privacy by design.”

**Visual direction:** Return to the title-slide styling. Use a single sentence and the product name; remove the technical diagram and detailed roadmap.

---

## Optional answers for questions after the talk

**“Does BenefitStep decide whether someone qualifies?”**

“No. It offers a preliminary quick check and helps prepare information. Package Doctor checks defined evidence relationships. The agency makes the official decision.”

**“Did you train your own AI?”**

“Yes. We trained a small TF-IDF and logistic-regression document classifier using public PAYSLIPS data, a CORD receipt subset and selected public synthetic FieldBench records. It runs locally during batch import and suggests three broad types. It does not yet control automatic benefit-document labels or extract fields. The Package Doctor demo still uses the limited local text reader; the integrated demo shows the actual classifier alongside that reader and the Doctor.”

**“Why does the applicant still confirm information?”**

“Extraction creates candidates. The applicant can compare sources, correct errors, and confirm the resolved summary once. Changed facts lose their confirmation, while unaffected facts keep it.”

**“What makes Package Doctor more than a checklist?”**

“Its results depend on the supplied evidence and task. Two bills with the same total can produce different results, and one record can match one requested period but miss another. We test both issue and non-issue cases.”

**“Can people save their work?”**

“They can explicitly export a reference package. The current workspace is session-only, and the export is not an encrypted, restorable backup. Optional encrypted persistence remains separately gated.”

**“Does the extension automatically fill BenefitsCal?”**

“No. The first implementation provides a manual section companion and explicit copying. It does not read the portal, sign, upload, or submit automatically.”

**“Have you shown that it saves time?”**

“Not yet. We have recorded working browser flows and engineering tests, alongside three failing expanded scenarios and an unreleased model candidate. User-task timing, error rates, and usability remain evaluation work.”


**“How many problems does Package Doctor catch?”**

“Nine check categories are implemented in the Doctor, with two related workflow safeguards elsewhere. The catalog has twenty-four patterns, including future ideas. The existing forty-six Doctor/state tests pass. A new one hundred thirty-two-case synthetic assessment passed one hundred twenty-nine and failed three, with twenty-six further cases unimplemented. The original one hundred twenty planned entries remain a separate unexecuted catalog. Case counts are not counts of independent check types or real applicants.”

**“Are the checks learned from social media?”**

“No. Public reports help us find questions worth investigating. The Doctor uses explicit software rules. Our source register distinguishes applicant reports, published research, official guidance, provider examples and engineering choices. These posts were not used for model training.”


**“Do users have to upload proof that they live in California?”**

“CalFresh generally verifies residence with flexible evidence and exceptions. DHCS says Medi-Cal applicants certify residence and give their living or mailing address without routine residency documents. Our starting check requires no files. Detailed evidence guidance and automatic address comparison remain planned.” [CalFresh verification](https://www.ecfr.gov/current/title-7/section-273.2), [DHCS guidance](https://www.dhcs.ca.gov/medi-cal/help/).

**“Can it recognize all 26 document families?”**

“No. Twenty-six is our development coverage map. The trained model has three broad labels, while a separate reader has thirteen named schemas plus unknown. Each family still needs realistic recognition and extraction evaluation.”

**“Is the new model deployed?”**

“No. The v0.2 candidate failed its validation release criteria. The extension still packages experimental v0.1 suggestions. Candidate results and failed Doctor scenarios are shown so the audience can distinguish delivered behavior from development work.”
