# Earley household — complete CalFresh and Medi-Cal demo

A fictional four-person household with two earners. The demo goes from documents to two application drafts, one for CalFresh and one for Medi-Cal, with the people chosen from what the documents show. Everything here is fictional. Do not submit these documents or the drafts.

## The household

Shirley M. Earley lives with her spouse Daniel and their children Emma (8) and Liam (4) at 4078 Sycamore Street, San Jose, CA 95129. Shirley's contract ended on September 30, 2026. Daniel works part-time and earns $2,200 a month.

## The documents

Add all six files in `pdfs/`.

| File | What it is | What the app reads |
| --- | --- | --- |
| `00-household-summary.pdf` | One-page summary of the household | Nothing. It mentions several document types, so it stays unidentified. |
| `01-foxmoor-final-pay-stub.pdf` | Shirley's final contract payment | Name, address, September 2026 period, pay date, gross $4,850.00, net $3,751.47, Foxmoor |
| `02-utility-bill.pdf` | Utility statement | Name, address, billing period, amount due $298.47, issuer |
| `03-rent-receipt.pdf` | October 2026 rent receipt | Name, address, October 2026, rent $2,500.00, paid $2,500.00, issuer |
| `04-daycare-invoice.pdf` | September daycare invoice for Liam | Shirley as the person billed, Liam as the child, paid $1,400.00, issuer |
| `05-daniel-pay-stub.pdf` | Daniel's September pay statement | Name, address, period, pay date, monthly, gross $2,200.00, net $1,855.70, Harbor Point Logistics |

`05-daniel-pay-stub.pdf` was generated for this demo in the same layout as the other five, which were supplied.

## Steps

Start with a freshly reloaded extension. On-device AI can stay off; the text reader handles these files.

1. **Quick check (optional).** Select **Skip and add documents**. The Quick check is not needed for this demo; both programs stay selected.
2. **Document.** Select **Add documents** and choose the six PDFs. You should see 6 documents and 51 candidate details, all read by the local text reader.
3. **Household.** Select **Enter household details**. Under "Found in your documents":
   - choose **Shirley M. Earley** as your name;
   - tick **Daniel Earley** and **Liam Earley** as other household members;
   - choose the Sycamore Street address;
   - type **Emma Earley** on a new line in the members box, because no document names her.

   Save. The five real documents now pass the household, address and date check.
4. **Review.** Look through the details, then select **Confirm reviewed details**. Two items stay open on purpose: the utility bill has no "current charges" line, and the daycare invoice has no "amount billed" line.
5. **Application, CalFresh.** Select **Generate CalFresh package (CF285)**. Under "People in this application", tick all four people. Select **Confirm these application answers**, then **Generate filled application draft**.
   - The household roster lists Shirley, Daniel, Liam and Emma.
   - Earned income has two records: Shirley at Foxmoor, and Daniel at Harbor Point Logistics, monthly.
   - Result: 14 fields filled, 18 pages.
6. **Application, Medi-Cal.** Select **Generate Medi-Cal package (CCFRM604)**. Tick the same four people, confirm, and generate.
   - Persons 1 to 4 are filled with first, middle and last name, and the household address.
   - Shirley is the primary contact.
   - Income has two records. Daniel's shows Monthly and $2,200.00. Shirley's shows the employer only, because her pay statement states no pay frequency.
   - Result: 37 fields filled, 44 pages.

## What to say about the limits

- The name split into first, middle and last is a proposal. Check it on screen before confirming; every box stays editable.
- Birth dates, relationships, signatures and consent choices are not filled. The drafts say how many items are still open.
- The drafts are unsigned and the field mapping has not had independent review.
- The documents are dated September and October 2026. After late December 2026 they fall outside the default 90-day window; raise "Recent-document window" in the household details when showing the demo later.
