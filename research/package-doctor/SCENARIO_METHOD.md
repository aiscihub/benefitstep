# How to use the larger scenario set

The new corpus contains 158 AI-authored scenarios: 132 executable cases across nine implemented Doctor checks and two workflow guards, plus 26 future scenarios for the remaining 13 design patterns. Twelve scenarios per implemented behavior make the review manageable; equal allocation does not imply equal risk or complete coverage.

The expected outcomes were authored before the first execution. They were informed by the current design and source code, so this is development QA, not an independent benchmark. All inputs are fictional. The runner injects candidate fields after extraction; it does not read PDFs, perform OCR, compute file hashes, run the classifier, interact with Chrome, or determine benefits eligibility. Declared fixture hashes simulate the importer's results. Two cases explicitly mutate event state; these are robustness probes, not claims about reachable UI paths.

## What the first run found

| Case | Expected behavior | Observed behavior | Interpretation |
|---|---|---|---|
| PD03-09 | After removal of the original, do not claim a remaining copy is safely excluded in favor of that missing original. | Doctor still emits “Exact duplicate excluded.” | Source lifecycle gap through public removal action; re-importing a source reconnects the copy, but this intermediate state is misleading. |
| PD07-12 | An internally conflicting extraction should require context before it establishes a cross-record contradiction. | Doctor emits the definite comparable-pay conflict in addition to the extraction conflict. | Uncertainty handling gap. The proposed expected outcome needs product review; the test does not establish which extracted amount is correct. |
| PD12-12 | A receipt from another application must not close the current application's request. | Matching request ID and program close the reminder despite the mismatched application. | Defensive scope gap found by deliberately altering event state. Normal recordEvent actions stamp the current application ID. |

These three failures remain visible. Production code was not changed to obtain a passing score. None of the failures is an eligibility finding about an applicant.

## What makes the case set useful

Counting scenarios alone is insufficient. Review each behavior for:

- A problem it should catch and a similar valid situation it should leave alone.
- Missing or conflicting context where the answer should remain uncertain.
- Person, program, application and date boundaries relevant to that behavior.
- Corrections, deletion, History, confirmation and other changes that can invalidate previous conclusions.
- Shared invariants: the official application route stays visible; unknown values are not silently made zero; receipt recording does not authenticate an issuer.

The runner checks official-route visibility after each action. Individual cases check other expectations where applicable; this is not a claim that every invariant has exhaustive coverage. A passing narrow comparison means only that its specified observation matched. For example, PD08 returning clear for a negative prior credit does not validate the entire bill or its deduction treatment.

## Next evaluation

1. Have a domain reviewer approve the expected outcomes and prioritize the three failures. Keep the baseline and expectation changes traceable.
2. Fix agreed implementation defects and rerun the same cases; retain before/after results.
3. Add unfamiliar scenarios designed without consulting implementation details, including combined failures and longer action sequences.
4. Separately evaluate end-to-end processing on realistic, appropriately sourced documents and observe user tasks.

Report counts of executable passes, failures and unimplemented cases separately, with false alarms and missed issues by scenario type when the test set supports those measures. Do not call 129/132 a real-world accuracy rate, a coverage percentage, or evidence that more cases alone makes the product ready.

The original 46 unit tests, the original 120 unexecuted design entries and this corpus overlap in behavior. They are separate artifacts and must not be summed as distinct applicant cases. Reproduce this assessment with `node scripts/evaluate-doctor-scenarios.mjs` from the app directory; it intentionally exits nonzero while failures remain.
