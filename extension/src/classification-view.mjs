const names={pay_statement:'Pay statement',invoice_or_receipt:'Invoice or receipt',other_document:'Other document',unknown:'Unknown'};
const reasons={unreadable_pages:'Needs readable text; this model cannot read scanned pages.',insufficient_text:'Not enough text to classify.',text_too_long:'Text exceeds this model’s limit.',below_threshold:'The model was uncertain and left the type unknown.',model_unavailable:'The classifier could not load. Available facts can still be reviewed.'};
export function classificationBadge(result,esc){
 if(!result)return '';
 return `<small class="bs-ai-label" data-ai-label="${esc(result.label)}">AI type suggestion: ${esc(names[result.label]||'Unknown')} · experimental</small>`;
}
export function classificationDetails(result,esc){
 if(!result)return '';
 return `<section class="bs-classification" aria-label="AI document classification">${classificationBadge(result,esc)}<p>${esc(reasons[result.reason]||'Suggested by the trained public-data model from this document’s text.')}</p><p>This broad suggestion does not confirm the document or its facts. The detailed document label comes from the separate information reader.</p><details><summary>How the AI suggestion was produced</summary><p>Text features → trained classifier → type suggestion. PAYSLIPS, selected synthetic FieldBench records, and a CORD receipt subset were used for training. This document stays on your device and is not added to training.</p>${result.modelId?`<p class="small">Model: ${esc(result.modelId)}</p>`:''}${result.status==='scored'&&result.scores?.length?`<table><caption>Model scores — not accuracy probabilities</caption><thead><tr><th scope="col">Type</th><th scope="col">Score</th></tr></thead><tbody>${result.labels.map((label,i)=>`<tr><th scope="row">${esc(names[label])}</th><td>${Number(result.scores[i]).toFixed(3)}</td></tr>`).join('')}</tbody></table><p class="small">Suggestion threshold: ${Number(result.threshold).toFixed(2)}. Low scores return Unknown.</p>`:''}</details></section>`;
}
export function processingSummary(docs,facts){
 if(!docs.length)return '';
 return `<section class="card pad bs-processing" aria-label="Document review summary"><h2>Your document summary</h2><p><button class="help-button" data-action="to-confirm">${facts} candidate ${facts===1?'detail':'details'} to review</button></p><p>These are names, dates and amounts found in your documents. Open the details to check their values against the originals before confirming.</p></section>`;
}
