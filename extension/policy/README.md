# BenefitStep policy tracking

The canonical supplied inventory remains at `../../BenefitStep_Implementation_v0_1/policy/`. Its `policy_inventory.json` and HTML audit are copied here unchanged for the standalone app. All **24 policy-family production flags remain false**. The UI integration does not approve or activate an eligibility engine.

- `policy_inventory.json`: inherited family IDs, sources, unresolved review and production status.
- `Policy_Inventory_and_Screen_1_Audit.html`: supplied first-screen policy audit.
- `screen_policy_map.json`: input-to-policy mapping supplied with BS-UI-POL-002.
- `delta_sources.json`: supplied narrow source review for v0.2.
- `calfresh-reference.mjs`: effective-dated MCE display reference, separated from layout code. Integer cents, rows 1–8 only; `productionEnabled:false`.
- `upstream_hashes.json`: supplied package's upstream provenance, not a hash manifest of the integrated app.

The CalFresh chart and 42 CFR 435.603 were rechecked during integration on October 4, 2026. The other supplied source records retain their original provenance. CalFresh's comparison does not establish household composition, countable income, pathway applicability or eligibility. Medi-Cal collects per-person starting facts without a household-income threshold or qualification result.

Runtime policy approval is distinct from UI implementation. No uploaded document, saved starting snapshot or local confirmation becomes a county-verification event. The extension retains its existing sidePanel-only permission and local processing boundaries.

See [integration and validation](../UI_V0_2_INTEGRATION.md).
