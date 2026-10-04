import {quickScreen,screenAnswers,SCREEN_SOURCES,RESIDENCY_OPTIONS} from './quick-screen.mjs';
import {SCREENING_QUESTIONS,incomePrompt} from './screening-reference.mjs';
export function quickProgram(state){return state.programs.has('CalFresh')&&(state.quickProgram!=='medi_cal'||!state.programs.has('Medi-Cal'))?'calfresh':'medi_cal';}
export function quickView({head,state,icon,selectedOption,esc}) {
 const program=quickProgram(state),medical=program==='medi_cal',householdKey=medical?'tax':'food',incomeKey=medical?'medicalIncome':'income';
 const keys={resident:'resident',household_size:householdKey,income_band:incomeKey,applicant_status:'applicant_status',special_group:'special_group'};
 const showResult=state.quickChecked?.has(program)||['no','unsure'].includes(state.quick.resident);
 const result=showResult?quickScreen(program,screenAnswers(state,program)):null;
 const prompt=incomePrompt(program,Number(state.quick[householdKey]));
 return head(1,'Get ready to apply for benefits.','Start with four quick questions. An income range is enough.',false)+`
 <section class="card pad"><p class="section-label">Which benefits would you like help with?</p>
 <div class="program-picks">${['CalFresh','Medi-Cal'].map(p=>`<button class="program-pick" data-program="${p}" aria-pressed="${state.programs.has(p)}">${icon(state.programs.has(p)?'check':'plus')}${p}</button>`).join('')}</div>
 ${state.programs.size>1?`<div class="field"><label for="quick-program">Quick questions for</label><select id="quick-program"><option value="calfresh"${selectedOption(program,'calfresh')}>CalFresh</option><option value="medi_cal"${selectedOption(program,'medi_cal')}>Medi-Cal</option></select><small>Each program keeps its own household size and income range.</small></div>`:''}
 <div class="fields-grid">${SCREENING_QUESTIONS[program].map(q=>{const key=keys[q.id],id=q.kind==='income'?'q-income':q.kind==='household'?'q-'+householdKey:'q-'+key;
 const options=q.kind==='income'?(prompt?.answers||[{value:'unsure',label:'Not sure / income changes'}]):q.answers;
 const label=q.kind==='income'?(medical?'Estimated yearly household income before tax':'Estimated monthly household income before tax'):q.label;
 const help=q.kind==='income'?(prompt?prompt.help+' Choose a range; no exact amount needed.':'Choose household size to see income ranges.'):q.help;
 return `<div class="field" data-screen-question="${q.id}"><label for="${id}">${esc(label)}</label><select id="${id}" data-quick="${key}"><option value="">Choose an answer</option>${options.map(o=>`<option value="${o.value}"${selectedOption(state.quick[key],o.value)}>${esc(o.label)}</option>`).join('')}</select><small>${esc(help)}</small></div>`;}).join('')}</div>
 <p class="small">These starting answers are remembered in this session. They do not confirm eligibility or replace the answers you give in BenefitsCal.</p><p id="quick-error" class="error" hidden></p></section>
 <div id="quick-residency-slot"> ${['no','unsure'].includes(state.quick.resident)?`<div class="field"><label for="q-residency-context">Which best describes your residence?</label><select id="q-residency-context" data-quick="residencyContext"><option value="">Choose a situation</option>${RESIDENCY_OPTIONS.map(o=>`<option value="${o.value}"${selectedOption(state.quick.residencyContext,o.value)}>${esc(o.label)}</option>`).join('')}</select></div>`:''}</div>
 <div id="quick-result-slot">${result?resultView(result,state,esc,selectedOption):''}</div>
 <div class="bottom-actions"><button class="btn btn-quiet" data-action="skip">Skip and add documents</button><button class="btn btn-primary" data-action="quick-check">${result?'Update quick result':'Check my options'} ${icon('arrow')}</button></div>`;
}

function resultView(result,state,esc,selectedOption){
 const answers=screenAnswers(state,result.program==='CalFresh'?'calfresh':'medi_cal');
 const labels={yes:'Yes',no:'No',unsure:'Not sure',within:'Within the displayed range',over:'Above the displayed range'};
 const summary=[['California residence',labels[answers.resident]||'Not answered'],['Household size',answers.household_size||'Not answered'],['Income range',labels[answers.income_band]||'Not answered'],[result.program==='CalFresh'?'Applicant status':'Special health circumstances',labels[result.program==='CalFresh'?answers.applicant_status:answers.special_group]||'Not answered']];

 const sourceLinks=result.sources.map(id=>{const source=SCREEN_SOURCES[id];return `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>`;}).join(' · ');
 return `<section class="card pad quick-result" id="quick-result" data-result="${result.status}" aria-labelledby="quick-result-title" aria-live="polite"><span class="badge">${esc(result.program)} · Preliminary quick result</span><h2 id="quick-result-title" tabindex="-1">${esc(result.title)}</h2>${result.reasons.length?`<ul>${result.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul>`:''}${result.missing.length?`<p>Still needed: ${result.missing.map(esc).join(', ')}.</p>`:''}

 <p><strong>Recommended next step:</strong> ${esc(result.next)}</p>
 <div class="cf-tools">${result.status==='other_state'?`<a class="btn btn-primary" href="${SCREEN_SOURCES[result.program==='CalFresh'?'snapStates':'medicaidStates'].url}" target="_blank" rel="noopener noreferrer">Find my state’s program</a>`:''}${result.alternative?`<a class="btn btn-secondary" href="${SCREEN_SOURCES[result.alternative].url}" target="_blank" rel="noopener noreferrer">Check health coverage options</a>`:''}<button class="btn ${result.status==='worth_applying'?'btn-primary':'btn-secondary'}" data-action="quick-next">${result.status==='other_state'?'Continue California preparation anyway':'Continue preparing'}</button><button class="text-link" data-action="handoff">Open California application</button></div>
 <p class="small">This is early guidance from your answers, not an approval or denial. No documents are needed to run it. Source review: ${result.checkedOn}.</p><details><summary>Answers used for this result</summary><dl class="cf-facts">${summary.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></details><details><summary>Why this result?</summary><p>${sourceLinks}</p><p>Not checked: full income calculations, every household rule, student/work rules, verification, or an agency decision. Each program has its own result.</p></details></section>`;
}
