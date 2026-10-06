import {tr} from './i18n/ui.mjs';
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
const AI_STATE={available:'On-device AI is on.',downloadable:'On-device AI is off.',downloading:'On-device AI is off.',unavailable:'On-device AI is not available in this browser.'};
/** How many candidate details each reader produced: the label reader or the on-device model. */
export function readerCounts(docs){const fields=docs.flatMap(d=>d.fields||[]),ai=fields.filter(f=>f.method==='native-ai').length;return {text:fields.length-ai,ai};}
export function processingSummary(docs,facts,aiStatus){
 if(!docs.length)return '';
 const asked=docs.filter(d=>/on-device AI/i.test(d.method||'')).length;
 return `<section class="card pad bs-processing" aria-label="Document review summary"><h2 data-i18n=ui99>Your document summary</h2><p><button class="help-button" data-action="to-confirm">${tr('{count} candidate details to review',{count:facts})}</button></p><p class="small"><strong>${tr('Details by reader')}:</strong> ${tr('local text reader {text} · on-device AI {ai}',readerCounts(docs))}${AI_STATE[aiStatus]?'. '+tr(AI_STATE[aiStatus]):''}${aiStatus==='available'||asked?' '+tr('It was asked about {asked} of {total} documents.',{asked,total:docs.length}):''}</p><p data-i18n=ui100>These are names, dates and amounts found in your documents. Open the details to check their values against the originals before confirming.</p></section>`;
}
