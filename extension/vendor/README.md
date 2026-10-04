# Bundled PDF.js

PDF.js **6.3.289** is bundled here: parser, worker, CMaps, standard fonts and WASM. No CDN or installation is needed to build or import PDFs. `manifest.json` records parser/worker hashes, checked by the build. `PDFJS-LICENSE.txt` carries the Apache-2.0 license. The complete local file inventory is in `../SBOM.json`.

Imported PDFs are read/rendered locally with scripting/evaluation and XFA disabled. These settings and checks are not a security audit or a claim that all malformed PDFs are harmless.

Standard fonts come from the same 6.3.289 distribution. Their license notices are in `standard_fonts/LICENSE_FOXIT` and `standard_fonts/LICENSE_LIBERATION`. Both document import and application preview load them from the extension itself.
