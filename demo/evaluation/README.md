# Reader evaluation set

26 fictional test documents used to measure BenefitStep's local text reader. Every person, organisation and amount in them is invented; none of these files is valid evidence.

- `household/`: 8 everyday documents for one invented household, written with the kind of labelled layout the reader was built for.
- `hard/`: 18 files written to trip the reader up: unfamiliar layouts, look-alike documents that are not proof of income, image-only scans, a copy with simulated OCR errors, two files that each hold two documents, and an exact duplicate.
- `*/text/`: the text layer of each PDF, as the extension's PDF library extracts it. The reader is run on these.
- `reference.json`: answers written when the documents were authored, before the reader was run.
- `graded-values.json`: every value the reader produced, each compared with the document.

Run `node scripts/evaluate-reader.mjs` from the repository root to repeat the measurement. The method, the results and their limits are explained on the [evaluation page](https://aiscihub.github.io/benefitstep/evaluation.html) (source: `docs/evaluation.html`).
