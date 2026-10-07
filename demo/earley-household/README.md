# Earley household — complete CalFresh and Medi-Cal demo

A fictional five-person household with eleven documents. The demo goes from the documents to two application drafts and shows how much of each form the app can fill: **72 boxes on six pages of the CalFresh form, and 61 boxes on the Medi-Cal form**. Three of the documents are pictures, which only on-device AI can read, so the demo also shows what the AI adds: without it the CalFresh draft stops at 58 boxes. Everything here is fictional. Do not submit these documents or the drafts.

## The household

Shirley M. Earley lives with her spouse Daniel, their children Emma (8) and Liam (4), and her mother Margaret Lowell (68) at 4078 Sycamore Street, San Jose, CA 95129. Shirley's contract ended on September 30, 2026. Daniel works part-time. Margaret has a pension and pays for prescriptions.

## Two packs of the same documents

| Folder | What is in it | On-device AI |
| --- | --- | --- |
| `documents/` | Eight PDFs and three pictures: `03-rent-receipt.jpg`, `09-pension-award-letter.png`, `10-pharmacy-statement.jpg` | Must be on. A picture has no text for the text reader. |
| `pdfs/` | The same eleven documents, all as PDFs | Not needed. Use this pack when the browser has no on-device AI. |

Both packs lead to the same two drafts. The three pictures were rendered from the matching PDFs in `pdfs/`.

## The documents

| Document | What it is | What it fills on the CalFresh draft |
| --- | --- | --- |
| `00-household-summary.pdf` | The household's own information sheet | The five names offered for the household; each birth date and relationship; other names used; mailing address |
| `01-foxmoor-final-pay-stub.pdf` | Shirley's final contract payment | Job record: Foxmoor, phone, hourly rate, weekly hours, monthly, $4,850.00 |
| `05-daniel-pay-stub.pdf` | Daniel's September pay statement | Job record: Harbor Point Logistics, phone, hourly rate, weekly hours, monthly, $2,200.00 |
| `09-pension-award-letter` (**picture**) | Margaret's pension award letter | Unearned income record: Margaret, the fund, $1,180.00, monthly |
| `04-daycare-invoice.pdf` | Daycare invoice for Liam | Care record: Liam, Little Sprouts Daycare, $1,400.00, monthly |
| `08-after-school-care-invoice.pdf` | After-school invoice for Emma | Care record: Emma, Maple Grove After-School Club, $320.00, monthly |
| `03-rent-receipt` (**picture**) | October 2026 rent receipt | Question 11, rent row: Yes, Shirley pays, $2,500.00, monthly |
| `02-utility-bill.pdf` | Electric and gas statement | Question 11, heating and cooling row: Yes, Shirley pays, monthly |
| `06-phone-bill.pdf` | Wireless bill | Question 11, telephone row: Yes, Shirley pays, monthly |
| `07-water-garbage-bill.pdf` | Water, sewer and garbage statement | Question 11, water row: Yes, Shirley pays, monthly |
| `10-pharmacy-statement` (**picture**) | Margaret's pharmacy statement | Medical expense record: Margaret, $64.20, monthly, Prescriptions |

## Before you start

**Check that the right copy of the app is open.** The footer of the side panel should read **BenefitStep — Benefits Application Helper 0.3.6**. If it shows an older version or no such line, a different copy is loaded: open `chrome://extensions` in the same Chrome profile, remove or switch off the other BenefitStep entries, and load `extension/` from this repository.

**Check on-device AI.** Open the Document step and read the line under the **Add documents** button:

- "On-device AI is on." Nothing to do.
- "On-device AI is off." with a **Turn on on-device AI** button. Select it and wait for "On-device AI is on." If Chrome has not downloaded its model before, this is a one-time download (about 4 GB on the test Mac), so do it before the demo, not during it.
- "This browser does not offer on-device AI." Use the `pdfs/` pack.

## Steps

1. **Quick check (optional).** Select **Skip and add documents**.
2. **Document.** With on-device AI on, select **Add documents** and choose the eleven files in `documents/`.
   - The eight PDFs are read at once. Each picture takes about 10 to 60 seconds; the status line shows "Interpreting on this device", and sometimes "Reading this picture a second time" or "Checking the address on the picture". The whole batch took between 42 and 88 seconds in three test runs on one Mac.
   - Each row shows which reader read it. The three pictures show **Read by: On-device AI** with their types: rent, income award and medical. The seven statements in PDF show "Automatic local text reader (not AI)", and the household sheet shows as a household list.
3. **Household.** Select **Enter household details**. Under "Found in your documents":
   - choose **Shirley M. Earley** as your name;
   - tick **Daniel Earley**, **Emma Earley**, **Liam Earley** and **Margaret Lowell** as other household members;
   - choose the Sycamore Street address.

   Save. All ten statements now pass the household, address and date check.
4. **Review.** Look through the details, then select **Confirm reviewed details**. Nothing should need attention. Do not skip this step: a document's details reach the form only after they are confirmed here.
5. **Application, CalFresh.** Select **Generate CalFresh package (CF285)**.
   - Under "People in this application", tick all five people.
   - "What your documents filled" should show a section next to every document.
   - Select **Confirm these application answers**, then **Generate filled application draft**.
   - Result: **72 fields filled on PDF pages 9, 11, 12, 13, 14 and 15.** The result opens with "What was filled": every section, its PDF page, the values and the document each came from. Select a page number to jump to that page of the draft.
6. **Application, Medi-Cal.** Select **Generate Medi-Cal package (CCFRM604)**. The form has room for four people: tick Shirley, Daniel, Emma and Liam. Confirm and generate.
   - Result: **61 fields filled on PDF pages 4, 5, 6, 15 and 16.**

After you close a result, the same summary stays on the Application page under each program.

## Showing what on-device AI adds

Add the `documents/` pack once with on-device AI off and once with it on.

| | AI off | AI on |
| --- | --- | --- |
| The three pictures | "unknown", **Read by: Needs local image AI** | rent, income award, medical; **Read by: On-device AI** |
| Review | 3 need attention | 0 need attention |
| CalFresh draft | 58 fields on PDF pages 9, 11, 13 and 14 | 72 fields on PDF pages 9, 11, 12, 13, 14 and 15 |
| Medi-Cal draft | 61 fields | 61 fields |

The 14 boxes the AI adds are the rent row of question 11 (4), the unearned income record on page 12 (5) and the medical expense record on page 15 (5). The Medi-Cal draft does not change because that form has no section for these three documents.

The app has no switch to turn on-device AI off. Once it is on in a Chrome profile, pictures are read. The "AI off" column therefore needs a profile where the Document step still offers **Turn on on-device AI**. This was tested in a fresh test copy of Chrome; whether a new profile in your everyday Chrome starts with AI off has not been checked. If the button is not offered, quote the 58 from this table instead of showing it.

To show both in one sitting:

1. With AI off, do steps 1 to 5. In Review, select **Confirm reviewed details** although three items need attention. The CalFresh draft has 58 fields, and "What your documents filled" says of each picture "Not used. No details were read from it."
2. Go back to the Document step and select **Turn on on-device AI**.
3. For each picture, select **View source**, then **Read this source again**. Each took 12 to 17 seconds in testing.
4. In Review, select **Confirm reviewed details** again, then generate the CalFresh draft again: 72 fields.

## What the CalFresh draft shows

| PDF page | Section | Boxes | Filled |
| --- | --- | --- | --- |
| 9 | 1. Applicant | 10 | Name, other names, home address, mailing address |
| 11 | 6a. Household | 14 | Five names and birth dates; four relationships |
| 12 | 7. Unearned income | 5 | Yes; Margaret's pension |
| 13 | 8. Earned income | 15 | Yes; two jobs with employer, phone, hourly rate, hours, frequency and monthly gross |
| 14 | 9. Care expenses | 9 | Yes; Liam's daycare and Emma's after-school club |
| 14 | 11. Household expenses | 14 | Yes; rent, gas and electric, telephone, water |
| 15 | 12. Medical expenses | 5 | Yes; Margaret's prescriptions |

The Medi-Cal draft shows the primary contact with email, four persons with name parts, birth date, home and mailing address, and two income records with amount and frequency.

## If a draft comes out emptier than this

Read the "What was filled" summary to see which sections are missing. Then open the application answers again and read "What your documents filled". It names each document and either the section it filled or why it filled nothing. The usual reasons:

- **A picture was not read.** Its row says "Read by: Needs local image AI", or the status line said that local AI could not finish. Turn on-device AI on, then select **View source** and **Read this source again** for that picture. If the picture still is not read, add the same document from `pdfs/` instead.
- **A picture was read with a detail missing.** The model's answers differ from run to run. Open **View source** to see what was read, and select **Read this source again** or correct the detail in Review.
- **Not confirmed yet.** Step 4 was skipped, or something changed after it. Confirm in Review again.
- **Paused by a check.** The name or address on the document does not match the household details, or the date is outside the recent-document window. Margaret's two documents are paused if she is not ticked as a household member in step 3.
- **No section for it.** The Medi-Cal draft has no place for the rent, utility, care, pension and pharmacy documents.

## What stays empty, and why

- The app can write 157 of the 538 boxes on the CalFresh form and 101 of the 1,133 on the Medi-Cal form. Signatures, consent choices, Social Security numbers, phone and email on the CalFresh form, immigration and the yes/no eligibility questions are left for the applicant on purpose.
- "Expect to continue?" and the reimbursement boxes are never filled; no document states them.
- The employer box holds the employer's name only. The printed box is too small for a full address.
- The roster's gender, citizenship and "applying for benefits" boxes are not mapped.
- Margaret is not on the Medi-Cal draft because that form has four person records.

## What to say about the limits

- Every filled value is a proposal. The name split, the birth dates, the relationships and each Yes box can be edited on screen before confirming.
- A value read from a picture is the model's reading. The app cannot check it against text, so it is marked for visual confirmation and the owner compares it with the picture in Review.
- The three pictures are clean renderings of the PDFs, not phone photos. A skewed, dark or creased photo has not been tried with this pack and may read less well.
- The pictures were read correctly in every test so far: 9 of 9 single readings, 3 full runs and 6 re-readings, all in a test copy of Chrome on one Mac. That is a small sample. Keep the `pdfs/` pack at hand.
- The pension letter's source view sometimes lists a note that the model gave a date as "unknown". That answer was dropped, not used.
- "Monthly" is filled when the document says so or its period is one month long.
- The medical expense record is filled only for a person the household sheet shows to be 60 or older.
- The drafts are unsigned and the field mapping has not had independent review.
- The documents are dated September and October 2026. After late December 2026 they fall outside the default 90-day window; raise "Recent-document window" in the household details when showing the demo later.
