# Package Doctor scenario assessment

Executed 132 synthetic scenarios: **129 passed, 3 failed**. An additional **26 future scenarios** are not implemented or executed.

- AI-authored synthetic QA scenarios, informed by the existing rule/evidence map and implementation review; not collected applicant cases or independent human validation.
- Doctor and state logic after extraction. No PDF reading, OCR, classifier accuracy, policy eligibility, browser integration, or real applicant success evaluation.
- Elapsed times measure small in-memory synthetic logic cases; they are not document-processing latency benchmarks.
- Expected outcomes are AI-authored against the current design, not independently validated ground truth.
- Known failures remain failures. Future cases are not executed. Original 46 unit tests and 120 design scenarios are separate artifacts; counts must not be added as distinct real-world cases.

Run: `2026-10-04T03:54:33.563Z`; Node v26.10.0.

## Results by behavior

| Rule / guard | Executed | Passed | Failed | Future |
|---|---:|---:|---:|---:|
| PD01 | 12 | 12 | 0 | 0 |
| PD02 | 0 | 0 | 0 | 2 |
| PD03 | 12 | 11 | 1 | 0 |
| PD04 | 12 | 12 | 0 | 0 |
| PD05 | 12 | 12 | 0 | 0 |
| PD06 | 12 | 12 | 0 | 0 |
| PD07 | 12 | 11 | 1 | 0 |
| PD08 | 12 | 12 | 0 | 0 |
| PD09 | 0 | 0 | 0 | 2 |
| PD10 | 0 | 0 | 0 | 2 |
| PD11 | 0 | 0 | 0 | 2 |
| PD12 | 12 | 11 | 1 | 0 |
| PD13 | 0 | 0 | 0 | 2 |
| PD14 | 0 | 0 | 0 | 2 |
| PD15 | 0 | 0 | 0 | 2 |
| PD16 | 0 | 0 | 0 | 2 |
| PD17 | 0 | 0 | 0 | 2 |
| PD18 | 0 | 0 | 0 | 2 |
| PD19 | 0 | 0 | 0 | 2 |
| PD20 | 0 | 0 | 0 | 2 |
| PD21 | 0 | 0 | 0 | 2 |
| PD22 | 12 | 12 | 0 | 0 |
| PD23 | 12 | 12 | 0 | 0 |
| PD24 | 12 | 12 | 0 | 0 |

## Failures to investigate

- **PD03-09: Removing canonical source must not claim orphan duplicate safely excluded** (public_state_actions). Expected/actual details: `[{"query":{"query":"orphanDuplicateClearCount","expected":0},"actual":1}]`
- **PD07-12: Internally conflicting extracted gross must not be treated as established cross-record contradiction** (public_state_actions). Expected/actual details: `[{"query":{"query":"ruleStates","rule":"PD07","expected":[]},"actual":["finding"]}]`
- **PD12-12: Receipt from another application must not close current request** (robustness_fixture_mutation). Expected/actual details: `[{"query":{"query":"ruleStates","rule":"PD12","expected":["finding"]},"actual":[]}]`

## Full scenario catalog

| Case | Scenario | Type | Result |
|---|---|---|---|
| PD01-01 | Unreadable rent amount remains unresolved | missing_context | passed |
| PD01-02 | Explicit zero rent is a value | valid | passed |
| PD01-03 | Two extracted rent amounts conflict | issue | passed |
| PD01-04 | Failed reader reports source needing help | issue | passed |
| PD01-05 | Partial reader retains source warning | issue | passed |
| PD01-06 | Moving unreadable source to History removes active warning | lifecycle | passed |
| PD01-07 | Deferring missing amount does not invent zero | lifecycle | passed |
| PD01-08 | Manual correction can be confirmed | lifecycle | passed |
| PD01-09 | Batch confirmation leaves unreadable answer unconfirmed | missing_context | passed |
| PD01-10 | UI correction resolves conflict with explicit review | lifecycle | passed |
| PD01-11 | One missing field does not produce warning on readable rent | valid | passed |
| PD01-12 | Deleting failed source removes active warning | lifecycle | passed |
| PD03-01 | Renamed identical bytes excluded | issue | passed |
| PD03-02 | Same filename with different bytes retained | valid | passed |
| PD03-03 | Equal payment amounts with distinct bytes retained | valid | passed |
| PD03-04 | Different scan of same apparent payment not byte duplicate | valid | passed |
| PD03-05 | Three copies result in two exclusions | issue | passed |
| PD03-06 | Zero pay is not itself a duplicate signal | valid | passed |
| PD03-07 | Duplicate creates no second set of facts | issue | passed |
| PD03-08 | Removing duplicate preserves canonical record | lifecycle | passed |
| PD03-09 | Removing canonical source must not claim orphan duplicate safely excluded | lifecycle | failed |
| PD03-10 | Reimport reconnects remaining duplicate | lifecycle | passed |
| PD03-11 | Deleting all copies removes duplicate facts and sources | lifecycle | passed |
| PD03-12 | Confirming a duplicate batch counts gross once | valid | passed |
| PD04-01 | Net entered as gross is flagged | issue | passed |
| PD04-02 | YTD entered as current gross is flagged | issue | passed |
| PD04-03 | Correct gross retained | valid | passed |
| PD04-04 | Equal net and gross creates no basis mismatch | valid | passed |
| PD04-05 | First payment YTD equals gross creates no mismatch | valid | passed |
| PD04-06 | Absent source gross cannot establish basis mismatch | missing_context | passed |
| PD04-07 | Absent net and YTD cannot establish basis mismatch | missing_context | passed |
| PD04-08 | Arbitrary correction is outside narrow net/YTD rule | valid | passed |
| PD04-09 | Historical wrong basis is excluded from active review | lifecycle | passed |
| PD04-10 | Correction back to source gross clears mismatch | lifecycle | passed |
| PD04-11 | Wrong gross cannot be confirmed while net remains usable | issue | passed |
| PD04-12 | Conflicting source gross cannot establish reliable mismatch | missing_context | passed |
| PD05-01 | Exact requested dates covered | valid | passed |
| PD05-02 | Broader record covers narrower request | valid | passed |
| PD05-03 | Half-month record cannot cover full-month request | issue | passed |
| PD05-04 | Prior month is disjoint | issue | passed |
| PD05-05 | Next month is disjoint | issue | passed |
| PD05-06 | Shared boundary day still partial coverage | issue | passed |
| PD05-07 | Single day at period end is covered | valid | passed |
| PD05-08 | Unconfirmed record cannot positively match | missing_context | passed |
| PD05-09 | Unknown request end date cannot positively match | missing_context | passed |
| PD05-10 | Historical source must be restored before match | lifecycle | passed |
| PD05-11 | Restored and reconfirmed source matches again | lifecycle | passed |
| PD05-12 | Removed linked source produces context request | lifecycle | passed |
| PD06-01 | Different person is out of scope | issue | passed |
| PD06-02 | Medi-Cal request cannot match CalFresh selection | issue | passed |
| PD06-03 | Same program and person match | valid | passed |
| PD06-04 | Unknown person needs context instead of scope accusation | missing_context | passed |
| PD06-05 | Unknown date meaning needs context | missing_context | passed |
| PD06-06 | Earned versus received dates are not interchangeable | missing_context | passed |
| PD06-07 | Income versus service dates are not interchangeable | missing_context | passed |
| PD06-08 | Unconfirmed wrong person is unresolved rather than established mismatch | missing_context | passed |
| PD06-09 | Correcting request link program resolves program mismatch | lifecycle | passed |
| PD06-10 | Person correction requires review before comparison | lifecycle | passed |
| PD06-11 | Confirmed changed person triggers scope mismatch | lifecycle | passed |
| PD06-12 | Request from different application cannot match | wrong_scope | passed |
| PD07-01 | Same full payment context with conflicting gross | issue | passed |
| PD07-02 | Same context with equal gross is not conflict | valid | passed |
| PD07-03 | Different employer preserves separate income | valid | passed |
| PD07-04 | Different person preserves separate income | valid | passed |
| PD07-05 | Different period start is not exact context | valid | passed |
| PD07-06 | Different period end is not exact context | valid | passed |
| PD07-07 | Different pay date is not exact context | valid | passed |
| PD07-08 | Missing issuer prevents comparison | missing_context | passed |
| PD07-09 | Deferred gross is excluded from comparison | missing_context | passed |
| PD07-10 | Superseded paystub removed from active comparison | lifecycle | passed |
| PD07-11 | Corrected gross resolves cross-document conflict | lifecycle | passed |
| PD07-12 | Internally conflicting extracted gross must not be treated as established cross-record contradiction | missing_context | failed |
| PD08-01 | Total with arrears entered as current | issue | passed |
| PD08-02 | Correct current charges kept distinct | valid | passed |
| PD08-03 | Large current bill with no arrears is valid | valid | passed |
| PD08-04 | Unexplained arithmetic prompts context | missing_context | passed |
| PD08-05 | Missing previous balance is not zero | missing_context | passed |
| PD08-06 | Missing total prevents comparison | missing_context | passed |
| PD08-07 | Missing current charges prevents comparison | missing_context | passed |
| PD08-08 | Deferred prepared amount needs context | missing_context | passed |
| PD08-09 | Negative prior credit is outside positive arrears rule | valid | passed |
| PD08-10 | Zero current charges with old balance still detects misuse | issue | passed |
| PD08-11 | Cent values reconcile exactly | issue | passed |
| PD08-12 | Explaining a bill comparison does not confirm answer | lifecycle | passed |
| PD12-01 | Confirmed request initially outstanding | issue | passed |
| PD12-02 | Local evidence import is not agency response | issue | passed |
| PD12-03 | Matching linked upload receipt closes reminder | valid | passed |
| PD12-04 | Unlinked upload receipt does not close request | issue | passed |
| PD12-05 | Application receipt is not requested evidence response | issue | passed |
| PD12-06 | Self-reported application submission is not response | issue | passed |
| PD12-07 | Other program unlinked receipt leaves request open | wrong_scope | passed |
| PD12-08 | Deleting response source and all copies reopens reminder | lifecycle | passed |
| PD12-09 | Deleting request source removes dependent reminder | lifecycle | passed |
| PD12-10 | Two requests with one receipt leave one outstanding | issue | passed |
| PD12-11 | Historical local evidence alone leaves request open | issue | passed |
| PD12-12 | Receipt from another application must not close current request | wrong_scope | failed |
| PD24-01 | Unrecognized reader kind prompts review | missing_context | passed |
| PD24-02 | Recognized paystub has no unknown-type warning | valid | passed |
| PD24-03 | Recognized utility has no unknown-type warning | valid | passed |
| PD24-04 | Recognized receipt has no unknown-type warning | valid | passed |
| PD24-05 | Unknown source with readable amount remains unknown type | missing_context | passed |
| PD24-06 | Failed analysis still retains unknown-type warning | missing_context | passed |
| PD24-07 | Historical unknown source is not active warning | lifecycle | passed |
| PD24-08 | Restoring unknown source restores warning | lifecycle | passed |
| PD24-09 | Deleting unknown source removes warning | lifecycle | passed |
| PD24-10 | Duplicate unknown source gives one type warning | issue | passed |
| PD24-11 | Confirming known facts does not assert document type | missing_context | passed |
| PD24-12 | Rereading source as supported type clears type warning | lifecycle | passed |
| PD22-01 | Unchanged prepared snapshot is current | valid | passed |
| PD22-02 | Changed gross invalidates transfer | lifecycle | passed |
| PD22-03 | Equivalent normalized value leaves snapshot current | valid | passed |
| PD22-04 | Person correction invalidates attribution and transfer | lifecycle | passed |
| PD22-05 | New source invalidates prepared transfer | lifecycle | passed |
| PD22-06 | Source removal invalidates prepared transfer | lifecycle | passed |
| PD22-07 | Move to History invalidates prepared transfer | lifecycle | passed |
| PD22-08 | New event invalidates prepared transfer | lifecycle | passed |
| PD22-09 | Read-only Doctor run leaves snapshot current | valid | passed |
| PD22-10 | Deferring answer invalidates prepared transfer | lifecycle | passed |
| PD22-11 | Old snapshot preserves old value after correction | lifecycle | passed |
| PD22-12 | Stale confirm click is rejected | lifecycle | passed |
| PD23-01 | Upload receipt cannot be relabeled application receipt | issue | passed |
| PD23-02 | Application receipt cannot be relabeled upload receipt | issue | passed |
| PD23-03 | Application receipt records CalFresh submission | valid | passed |
| PD23-04 | Upload receipt never records application submission | valid | passed |
| PD23-05 | Self report remains explicitly user reported | valid | passed |
| PD23-06 | Receipt event without source is rejected | missing_context | passed |
| PD23-07 | Unsupported program is rejected | wrong_scope | passed |
| PD23-08 | Medi-Cal receipt does not submit CalFresh | wrong_scope | passed |
| PD23-09 | Wrong-program request link is rejected | wrong_scope | passed |
| PD23-10 | Invalid receipt date is rejected | issue | passed |
| PD23-11 | Empty event description is rejected | missing_context | passed |
| PD23-12 | Receipt supersedes self-report display without authenticating issuer | lifecycle | passed |
| PD02-F01 | Two-page paystub imported without page two | future_design | not_implemented |
| PD02-F02 | Complete two-page paystub includes a blank reverse | future_design | not_implemented |
| PD09-F01 | Rent explicitly includes electricity and household also adds same electricity as extra cost | future_design | not_implemented |
| PD09-F02 | Separately billed electricity in addition to rent | future_design | not_implemented |
| PD10-F01 | Listed expenses exceed income and household has savings | future_design | not_implemented |
| PD10-F02 | Expense month differs from income month | future_design | not_implemented |
| PD11-F01 | Old paystub and later dated employment termination letter | future_design | not_implemented |
| PD11-F02 | Two same-employer paystubs without termination evidence | future_design | not_implemented |
| PD13-F01 | Pay date written 03/04 without locale | future_design | not_implemented |
| PD13-F02 | Employer explicitly states twice monthly | future_design | not_implemented |
| PD14-F01 | Owner enters rent but has no receipt available | future_design | not_implemented |
| PD14-F02 | A request explicitly names proof due on a stated date | future_design | not_implemented |
| PD15-F01 | Suggested proof item has no program name | future_design | not_implemented |
| PD15-F02 | Suggestion explicitly applies only to Medi-Cal | future_design | not_implemented |
| PD16-F01 | Self-employed household uploads revenue and expense receipts | future_design | not_implemented |
| PD16-F02 | Gross revenue statement without expenses or method | future_design | not_implemented |
| PD17-F01 | Family asks whether a named treatment is covered | future_design | not_implemented |
| PD17-F02 | General medical bill without coverage question | future_design | not_implemented |
| PD18-F01 | Notice states denial and provides a dated next action | future_design | not_implemented |
| PD18-F02 | Upload receipt has no coverage decision wording | future_design | not_implemented |
| PD19-F01 | Low-resolution scan has compression artifacts around amount | future_design | not_implemented |
| PD19-F02 | Source has a verifiable issuer signature mechanism | future_design | not_implemented |
| PD20-F01 | Stored policy excerpt has expired effective period | future_design | not_implemented |
| PD20-F02 | Reference validity has never been checked | future_design | not_implemented |
| PD21-F01 | User asks for help with a specific medical condition | future_design | not_implemented |
| PD21-F02 | No condition or referral request is present | future_design | not_implemented |

## Reproduce

From `BenefitStep_v0_1`:

```sh
node scripts/evaluate-doctor-scenarios.mjs
```

The command writes this report and the detailed JSON, then exits nonzero when an executable scenario fails. Expectations and source hashes are preserved in the JSON. Review outcomes before changing an expectation; do not re-label failures as passes to improve a percentage.
