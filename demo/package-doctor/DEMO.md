# Fictional Package Doctor walkthrough

All people, companies and transactions in these PDFs are fictional. Do not submit them to an agency.

## Current charges versus a previous balance

1. Skip the quick check or enter fictional screening answers.
2. Add `01-bill-with-previous-balance.pdf`. It has $140 current charges, $800 previous balance, and $940 total due.
3. In Confirm details, edit **Current utility charges** to **940**, simulating an incorrect prepared answer. Package Doctor flags the relationship, shows the source amounts, and pauses just that answer.
4. Correct it to **140** and use **Yes, correct** once.
5. In a fresh session, add `02-large-current-bill.pdf`. It has $940 current charges, $0 previous balance and $940 due. The previous-balance warning should not appear.

## Same document, different request

1. Add `03-september-pay.pdf` and both `04-request-*.pdf` notices. Confirm the extracted source facts once.
2. Under Apply and follow up → CalFresh follow-up, record an **evidence request**, select the October notice, enter Alex Demo, the request wording, and exact dates **2026-10-01 through 2026-10-31**, meaning **when income was earned**. Confirm this event.
3. Choose **Match evidence to this request**, select the September pay record, CalFresh, and **when income was earned**. The record does not cover October.
4. Record the September notice as a separate request for **2026-09-01 through 2026-09-30** with the same person and basis. Select the same pay record. It covers the requested dates; county acceptance remains undetermined.
5. Switch the follow-up selector to Medi-Cal. The CalFresh events and request findings must not appear there.

## Package and privacy

Open View my package, preview the confirmed answers, and select originals explicitly. Download the ZIP and open `preparation-review.pdf`; its index links to the confirmed answers and selected source pages. The unchanged source bytes are in `originals/`.

The workspace does not upload or submit anything. Clear the session when finished. The generated export remains wherever you downloaded it; remove that separately if desired.
