# Rivera household — realistic video dataset

Open **index.html** for a visual gallery. For BenefitStep, select **main-packet/** using Choose folder in an empty session. This folder contains eight PDFs, including a two-page lease. The image-only phone scan is separate in **optional-scan/**.

## The story

Jordan Rivera lives with one child, Maya, in a rented apartment in Sacramento. Jordan works at fictional Juniper Market. Two September payments show $1,250 and $1,300 gross; their net deposits are $1,054.38 and $1,096.55. The bank statement matches these deposits exactly. The $2,550 is the known September payroll subtotal, not proof of complete or expected household income.

The lease and September receipt both show $1,400 rent. Childcare is $300 billed, $200 paid, with $100 remaining. The utility company bills $140 for current service plus $800 from earlier unpaid periods, making $940 due. A fictional October verification request asks for September income received and rent evidence.

The layouts intentionally differ: payroll advice, a two-page serif lease, a compact rent receipt, a remittance-style utility bill, childcare invoicing, a transaction-ledger bank statement and a plain administrative request. All organizations, names, addresses, account references and transactions are fictional; source pages carry a modest visible demo mark and footer. No real logos, signatures, seals, QR payment links or personal records are used.

## Film honest behavior

Use **Local text reader** for repeatable fact extraction; the trained classifier still produces its own broad suggestion. Read **extracted/RESULTS.md** before recording. Unknowns and unsupported bank-statement extraction should remain visible. Do not describe the local reader or Doctor rules as learned AI, or claim this curated packet demonstrates general accuracy.

Visible source labels were chosen to work with the limited local reader while retaining normal statement layouts. There is no hidden answer layer or predicted-result injection. The classifier, its threshold and the existing harder challenge results are unchanged. This pack is for explaining the product workflow, not for a new benchmark.

Reproduce from repository root: `python3 scripts/generate_video_household.py`. The script checks cents-based continuity, renders PDFs with local Chrome, runs actual classification/extraction, and rehearses the utility correction. It uses no cloud inference. The optional phone scan has no readable text layer and demonstrates an OCR limitation.
