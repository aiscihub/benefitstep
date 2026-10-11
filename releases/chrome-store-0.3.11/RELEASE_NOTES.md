# BenefitStep 0.3.11

Add Traditional Chinese and Vietnamese. The language menu now offers English, Español, 简体中文, 繁體中文 and Tiếng Việt, and the package carries Chrome locale files for all five (`en`, `es`, `zh_CN`, `zh_TW`, `vi`), so the Chrome Web Store listing can be shown in each. This package replaces 0.3.10, which added the locale files for English, Spanish and Simplified Chinese only.

The two new languages cover the same 424 interface strings as Simplified Chinese and Spanish. Traditional Chinese was converted from the Simplified Chinese text and then adjusted to Traditional wording; Vietnamese was translated from the English text. Neither has been checked by a native speaker, and the panel says so in a notice, as it does for Spanish and Simplified Chinese.

Not changed: text that was English in the Spanish and Chinese interfaces is English in the new languages too. On a walk through the example household, 195 of 445 pieces of on-screen text stayed English in each language, mainly the application form questions, the privacy note, the on-device AI panel and the document checks. Official PDFs stay in English. The side panel still opens in English until a language is chosen in its menu. Readers, forms and stored answers are unchanged: compared with 0.3.9, the package adds the five locale files and two translation files and changes `manifest.json`, `assets/index.html` and `src/i18n/ui.mjs`.

The detailed descriptions for the store listings are in `store-assets/LISTING-LOCALIZED.md`. They are entered in the developer dashboard after this package is uploaded.

Validation: 358 source tests and 167 repository tests passed. The interface-language browser test passed in Spanish, Simplified Chinese, Traditional Chinese and Vietnamese, offline, with entered answers and confirmed details preserved across language changes and no sideways scrolling at 390, 720 and 1280 pixels. The upload ZIP was unzipped and loaded in a separate test copy of Chrome set to Vietnamese, Traditional Chinese (zh-TW, zh-HK), Simplified Chinese, Spanish and English: the name, summary and tooltip appeared in that language, and the panel switched through all five languages without errors.

This package has not been uploaded or published.
