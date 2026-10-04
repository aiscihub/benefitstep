# Actual results for the video packet

The classifier results below were computed from the finished PDFs. Field extraction used the local label reader. These are curated presentation fixtures, not an independent evaluation. No predicted values were supplied to the app.

| File | AI suggestion | Information-reader label | Candidate facts |
|---|---|---|---:|
| 01_JuniperMarket_Pay_2026-09-15.pdf | pay_statement | paystub | 9 |
| 02_JuniperMarket_Pay_2026-09-30.pdf | pay_statement | paystub | 9 |
| 03_WillowCourt_Lease.pdf | unknown | rent | 5 |
| 04_WillowCourt_Rent_2026-09.pdf | unknown | rent | 8 |
| 05_JuniperEnergy_2026-09.pdf | unknown | utility | 8 |
| 06_LittleLantern_Care_2026-09.pdf | unknown | childcare | 8 |
| 07_AlderCommunity_Checking_2026-09.pdf | unknown | unknown | 0 |
| 08_ValleyCounty_Request_2026-10-02.pdf | unknown | county_request | 8 |
| 09_PhoneScan_JuniperEnergy.pdf | unknown | unknown | 0 |

## Key information checks

- 01_JuniperMarket_Pay_2026-09-15.pdf / gross_pay: expected 1250.00; extracted 1250.00; matches.
- 01_JuniperMarket_Pay_2026-09-15.pdf / net_pay: expected 1054.38; extracted 1054.38; matches.
- 01_JuniperMarket_Pay_2026-09-15.pdf / ytd_gross: expected 22500.00; extracted 22500.00; matches.
- 02_JuniperMarket_Pay_2026-09-30.pdf / gross_pay: expected 1300.00; extracted 1300.00; matches.
- 02_JuniperMarket_Pay_2026-09-30.pdf / net_pay: expected 1096.55; extracted 1096.55; matches.
- 02_JuniperMarket_Pay_2026-09-30.pdf / ytd_gross: expected 23800.00; extracted 23800.00; matches.
- 03_WillowCourt_Lease.pdf / rent_amount: expected 1400.00; extracted 1400.00; matches.
- 04_WillowCourt_Rent_2026-09.pdf / rent_amount: expected 1400.00; extracted 1400.00; matches.
- 04_WillowCourt_Rent_2026-09.pdf / amount_paid: expected 1400.00; extracted 1400.00; matches.
- 05_JuniperEnergy_2026-09.pdf / current_charges: expected 140.00; extracted 140.00; matches.
- 05_JuniperEnergy_2026-09.pdf / prior_balance: expected 800.00; extracted 800.00; matches.
- 05_JuniperEnergy_2026-09.pdf / amount_due: expected 940.00; extracted 940.00; matches.
- 06_LittleLantern_Care_2026-09.pdf / amount_billed: expected 300.00; extracted 300.00; matches.
- 06_LittleLantern_Care_2026-09.pdf / amount_paid: expected 200.00; extracted 200.00; matches.
- 08_ValleyCounty_Request_2026-10-02.pdf / program_stated: expected CalFresh; extracted CalFresh; matches.
- 08_ValleyCounty_Request_2026-10-02.pdf / person: expected Jordan Rivera; extracted Jordan Rivera; matches.

## Package Doctor rehearsal

{
  "available": true,
  "wrongAmountFlagged": true,
  "correctedAmountCleared": true,
  "sourceGrossOrCurrent": "140.00",
  "demonstrationCorrection": "940.00"
}

The 940 correction is deliberately entered during the demo. It is not an automatic extraction error. The source originally states current charges of 140, a previous balance of 800 and a total due of 940.
