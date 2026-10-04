# Demonstrate the integrated AI components

Build 0.1.2. Reload the unpacked `BenefitStep_v0_1/extension` in Chrome and open the sidebar. On **Add documents**, choose **Try AI demo with fictional documents**. This button appears in an empty session. It adds three local files together and runs the same classifier used for ordinary imports.

No model download is needed for this classifier. The demo explicitly uses the local text reader for field extraction so it works without native Chrome AI. Your normal processing preference is preserved for later imports. All three sample sources are fictional; the classifier results are computed live from their contents and are not scripted.

| Component | What to show | Suggested wording |
|---|---|---|
| Trained classifier | The pay PDF's **AI type suggestion: Pay statement** | “Our trained model identifies a broad document type locally.” |
| Abstention | The bill and short note show **Unknown** with the current model | “It leaves uncertain or insufficient text unknown. The bill still has readable facts.” |
| Model provenance | **View source → How the AI suggestion was produced** | “These scores come from the packaged trained weights. They are not accuracy percentages.” |
| Field extraction | **Confirm details** shows gross pay $2,550, net pay $2,060, and current utility charges $140 | “A separate local reader prepares source-linked facts. Classification alone does not extract or confirm them.” |
| Package Doctor | Edit **Current utility charges** from 140 to 940 | “The Doctor detects that a previous balance was included in the current charge, using the source amounts.” |
| Resolution | Correct the charge back to 140 | “The affected issue clears. We confirm the available details together.” |

The short note intentionally contains too little text. It remains an unresolved source; a high count of prepared facts does not mean the package is complete. The bill's broad AI type can remain unknown while the explicit-label reader recognizes its detailed utility fields. This shows the real boundary between the model and extraction.

The app does not infer income eligibility from these suggestions, select policy, or submit anything. The integrated overview reports classifier outcomes, candidate details and Doctor findings. Source details preserve the extraction method separately from the trained classifier. The independent classifier lab remains under **Processing options** for ad hoc experiments.

To demonstrate ordinary import, download an original from its source view, clear the session, then add it through **Add documents**. Renaming the file does not change its text features. Existing exact duplicates are excluded from active evidence. Closing/reloading clears the session; downloaded originals remain on disk.

Validation: `python3 scripts/benefitstep_ai_flow_smoke.py` exercises this flow with the actual packaged weights, renamed ordinary uploads, duplicate exclusion, rereading, clear, and privacy observations. Results: `tests/latest-ai-flow.json`.
