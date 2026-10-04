# Public training data and provenance

Only public records below were fetched. No user application, private PDF or account data was used. The extension contains weights and notices, not the training records. See `data/source_manifest.json` for source revisions, paths and hashes; `data/preparation_report.json` for exclusions; `data/split_manifest.json` for frozen assignments.

| Source | Selected material | Eligible deduplicated records | License |
|---|---|---:|---|
| [PAYSLIPS](https://github.com/buthaya/payslips) | 611 anonymized annotated pages, merged by document ID; text only | 525 | MIT; copyright 2025 SCOR SE |
| [FieldBench](https://github.com/fieldbench/corpus) | 255 explicitly synthetic CC0 documents from invoice/receipt and comparison categories | 205 | CC0 1.0 for the selected records |
| [CORD-v2](https://huggingface.co/datasets/naver-clova-ix/cord-v2) | Bounded first-rows subset: 26 train, 35 validation, 34 test annotations; word text only | 37 | CC BY 4.0; NAVER Corp. |
| Total | | **767** | |

PAYSLIPS revision: `ec64d17fa94d876b1834760594340a058dac5106`.

FieldBench revision: `fcfefbfbde1909ea440e058593eb72387b636a3f`. Of 683 examined manifests, 428 were excluded. The importer requires both `source == synthetic` and `license == CC0 1.0`. The repository's code license does not license all third-party documents; see its [data license](https://github.com/fieldbench/corpus/blob/main/DATA_LICENSE.md). Selected categories include invoices, receipts, contracts, IRS forms, insurance policies and legal filings. These examples are synthetic, not applicant records.

CORD dataset revision checked before and after download: `7f0115a4b758a71d6473b8d085751692da2fef98`. The full rows endpoint failed, so this experiment uses only cached first-rows responses. These can be truncated and are not the complete 1,000-document dataset. Response hashes and truncation information are retained. Original repository and attribution: [clovaai/cord](https://github.com/clovaai/cord), Park et al. (2019), *CORD: A Consolidated Receipt Dataset for Post-OCR Parsing*. See [CC BY license](https://github.com/clovaai/cord/blob/master/LICENSE-CC-BY).

## Transformations

Publisher word annotations or selected document text were converted to text classification records. Field labels, structured ground-truth values, image URLs, filenames and source metadata are not model inputs. Pages were merged where publisher document IDs were available. Records with fewer than 12 ASCII word tokens or over 100,000 characters were excluded; normalized exact duplicates were removed. CORD lost 58 of 95 fetched records under these filters, creating substantial selection bias.

Data-derived features remove numeric amounts and known dataset/demo markers. This reduces obvious shortcuts but does not eliminate language, publisher or generator cues. Near-duplicate grouping joined 1,699 qualifying pairs; this count is not a number of independent documents. Declared generator families stay in a single split. See the model card for split counts and limits of this proxy.

## Attribution and retention

Copies of the publisher licenses and attribution are shipped in `models/licenses/` and `models/NOTICE.md`. Model training and conversion are modifications by the BenefitStep project; original publishers do not endorse the model. The licenses above describe source materials, not a blanket license grant for every part of BenefitStep. Raw downloads and processed text stay local and gitignored. No consent to use future user uploads for training is implied.
