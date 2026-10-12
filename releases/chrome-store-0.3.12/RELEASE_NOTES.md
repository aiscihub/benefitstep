# BenefitStep 0.3.12

The CalFresh application and the periodic report can now be filled on the state's translated forms. Every form is still filled on the English edition by default, whatever the interface language. For the CalFresh application (CF 285) and the SAR 7 periodic report (SAR 7B), a new **Official form language** choice sits under the form's button on the package screen and again in the form dialog: English, Español, 繁體中文 or Tiếng Việt. Choosing one fills the state's own form in that language. The saved file is named for its edition, for example `cf285-zh-Hant-unsigned.pdf`.

The six translated PDFs are the state's own files, the same edition as the English forms (CF 285 8/21, SAR 7B 12/23), downloaded from the state's translated-forms pages on October 12, 2026. `extension/forms/registry.json` records each address and SHA-256. The state publishes these forms in Traditional Chinese only, so that is the Chinese edition offered.

Each translated form has its own map. A translated PDF does not always name a box as the English one does: the Vietnamese SAR 7B numbers the boxes at the top of page 1 differently, and each edition renames a few others. Every box the app writes was matched by its own label in that language and by its place on the page. The build stops unless a translated map answers the same questions as the English map, on the same pages, with every box in the same place relative to its neighbours.

Fixed: a draft made from a protected form could not be drawn by the in-app preview when its labels held certain Chinese, Vietnamese or Spanish characters; the preview showed scrambled letters. The saved file now keeps those labels intact.

Not changed:

- Answers are written as entered. A frequency such as "monthly" or a relationship such as "Mother" stays in English on a translated form.
- The recertification (CF 37) and the Medi-Cal application are still filled in English. The state publishes CF 37 in the three languages, but those PDFs name every box differently and carry no box labels, so they are not mapped yet.
- The translated maps are drafts like the English ones. Every download is stamped as an unsigned draft, and no map has had independent review.
- On-screen text that was English in the translated interfaces, mainly the form-answers screens, is still English.

Validation: 374 source tests and 183 repository tests passed, 16 of them new for the translated editions. The interface-language browser test passed in Spanish, Simplified Chinese, Traditional Chinese and Vietnamese. On the unzipped package, the fictional Earley household was run in all five interface languages through a new application, a SAR 7 report and a CF 37 recertification, twice. With nothing chosen, all 20 forms were the English edition. With the matching edition chosen in the dialog, the CF 285 (72 boxes) and the SAR 7B (51 boxes) were the Spanish, Traditional Chinese and Vietnamese forms, holding the same answers as the English form with nothing written to any other box. No run had page errors or viewer warnings. Filled pages of all six translated forms were also checked by eye against their printed labels.

This package has not been uploaded or published.
