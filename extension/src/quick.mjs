import {tr,uiLocale} from './i18n/ui.mjs';
import {policyDetails} from './policy-engine.mjs';
import * as Q from './starting-state.mjs';
export const startingNames={calfresh:'CalFresh',medical:'Medi-Cal'};
export const selectedStarting=s=>Object.keys(startingNames).filter(p=>s.programs.has(startingNames[p]));
export const pending=(s,p)=>!['Answers saved','Partial answers saved','Skipped'].includes(Q.status(s.starting,p));
export function quickProgram(s){return selectedStarting(s).includes(s.activeStarting)?s.activeStarting:(selectedStarting(s)[0]||'calfresh');}
function views(real,escape,icon=()=> ''){
 const Qstate=real.starting;
 const state={quick:Qstate,active:quickProgram(real),programs:Object.fromEntries(Object.entries(startingNames).map(([p,name])=>[p,real.programs.has(name)]))};
 const names=startingNames,selected=()=>selectedStarting(real);
 const dollars=c=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(c/100);
 const option=(value,label,current)=>`<option value="${escape(value)}"${value===current?' selected':''}>${escape(tr(label))}</option>`;
 const heading=(title,subtitle)=>`<div class="page-head"><h1 id="page-title" tabindex="-1">${escape(tr(title))}</h1><p class="subtitle">${escape(tr(subtitle))}</p></div>`;
 const actions=(secondary,primary)=>`<div class="actions">${secondary}${primary}</div>`;
 const next=(action,label)=>`<button id="quick-next" class="button primary right-action" data-action="${action}">${escape(tr(label))}${icon('arrow')}</button>`;
  function programNavigation() {
    const picks=selected();
    if(picks.length===1)return `<div id="quick-program-nav" class="program-heading"><span class="program-only">${names[picks[0]]}</span><span class="program-state">${escape(tr(Q.status(state.quick,picks[0])))}</span></div>`;
    if(!picks.length)return '<div id="quick-program-nav"></div>';
    return `<div id="quick-program-nav" class="program-heading separate-programs" role="tablist" aria-label="Separate program questions">${picks.map(p=>`<button role="tab" id="tab-${p}" aria-controls="program-panel" aria-selected="${state.active===p}" tabindex="${state.active===p?'0':'-1'}" data-program-tab="${p}"><span>${names[p]}</span><span class="tab-status">${escape(tr(Q.status(state.quick,p)))}</span></button>`).join('')}</div>`;
  }
  const residenceOptions=current=>[['','Choose an answer'],['yes','Yes'],['no','No'],['unknown','Not sure']].map(([v,l])=>option(v,l,current)).join('');
  function incomeOptions(q){
    const t=Q.threshold(q.people), choices=[['','Choose a range'],['none','No income']];
    if(t!==null)choices.push(['at_or_below',tr('Some income, up to ${amount}/month',{amount:dollars(t)})],['above',tr('More than ${amount}/month',{amount:dollars(t)})]);
    choices.push(['unknown','Not sure']);if(['above','at_or_below'].includes(q.income)&&t===null)choices.push([q.income,'Previous range — reference unavailable']);return choices.map(([v,l])=>option(v,l,q.income)).join('');
  }
  function quick() {
    const prog=selected();let panel='';
    if(state.active==='calfresh'&&prog.includes('calfresh')) {
      const q=state.quick.calfresh;
      panel=`<h2 class="sr-only" id="program-title">CalFresh starting questions</h2><div class="fields">
      <div class="quick-question-row">
      <div class="field"><label for="residence" data-i18n=ui8>Do you live in California?</label><select class="select-short" id="residence" data-cf="residence" aria-describedby="residence-help">${residenceOptions(q.residence)}</select><div class="helper help-inline" id="residence-help"><span data-i18n=ui24>No permanent address is needed.</span><button class="help-button" data-action="residence-help" data-i18n=ui25>Residency help</button></div></div>
      <div class="field"><label for="immigration" data-i18n=ui11>Immigration / citizenship status</label><select id="immigration" data-cf="immigration">${[['','Choose an answer'],['citizen','U.S. citizen or national'],['noncitizen','Not a U.S. citizen or national'],['mixed','Different statuses in my household'],['unknown','Not sure'],['prefer_not','Prefer not to answer']].map(([v,l])=>option(v,l,q.immigration)).join('')}</select></div>
      </div>
      <div class="quick-question-row">
      <div class="field"><label for="people" data-i18n=ui9>Household size</label><select class="select-short" id="people" data-cf="people" aria-describedby="people-help">${[['','Choose a number'],...Array.from({length:8},(_,i)=>[String(i+1),String(i+1)]),['9plus','9 or more'],['unknown','Not sure']].map(([v,l])=>option(v,l,q.people)).join('')}</select><div class="helper help-inline" id="people-help"><span data-i18n=ui26>Include yourself and people you buy and prepare food with.</span><button class="help-button" data-action="household-help" data-i18n=ui27>Who to include</button></div></div>
      <div class="field"><label for="income" data-i18n=ui10>Estimated monthly household income before tax</label><select class="select-medium" id="income" data-cf="income" aria-describedby="income-help">${incomeOptions(q)}</select><div class="helper help-inline" id="income-help"><button class="help-button" data-action="reference-help" data-i18n=ui28>Income reference</button></div></div>
      </div>
      </div>`;
    } else if(state.active==='medical'&&prog.includes('medical')) {
      panel=`<section class="medical-start" aria-labelledby="medical-heading"><h2 id="medical-heading" data-i18n=ui43>People who need health coverage</h2><p class="helper" data-i18n=ui44>Start with age and residence. No names or birth dates needed.</p>
      ${state.quick.medical.people.map((p,i)=>`<section class="applicant-row" aria-labelledby="person-title-${p.id}"><div class="applicant-heading"><h3 id="person-title-${p.id}">${escape(tr('Person {number}',{number:i+1}))}</h3>${i>0?`<button class="text-button" data-remove-person="${p.id}">Remove<span class="sr-only"> person ${i+1}</span></button>`:''}</div><div class="applicant-fields"><div class="field"><label for="age-${p.id}" data-i18n=ui45>Age group</label><select id="age-${p.id}" data-mc="age" data-person="${p.id}">${[['','Choose an age group'],['under19','Under 19'],['19to64','19 to 64'],['65plus','65 or older'],['unknown','Not sure']].map(([v,l])=>option(v,l,p.age)).join('')}</select></div><div class="field"><label for="residence-${p.id}" data-i18n=ui50>Does this person live in California?</label><select id="residence-${p.id}" data-mc="residence" data-person="${p.id}">${residenceOptions(p.residence)}</select></div></div></section>`).join('')}
      <button class="text-button" ${state.quick.medical.people.length>=10?'disabled':''} data-action="add-person">Add another person</button>
      <p class="disclosure">Medi-Cal household and income questions come after the coverage pathway is identified. <button class="help-button" data-action="medical-help" data-i18n=ui53>Why different questions?</button></p>
      <p class="small muted" data-i18n=ui55>The ten-person entry limit is a local interface limit, not a benefit limit. You can continue on BenefitsCal.</p><p class="small muted prototype-scope" data-i18n=ui54>Saves starting details only. It does not run a Medi-Cal eligibility check.</p></section>`;
    }
    const other=prog.find(p=>p!==state.active&&pending(real,p));
    const optionalCheck=other?`<button class="button" data-program-tab="${other}">${escape(tr('Check {program} (optional)',{program:names[other]}))}</button>`:'';
    return heading('Quick check','Answer a few key questions to see your initial result.')+`
      ${programNavigation()}<section id="program-panel"${prog.length>1?` role="tabpanel" aria-labelledby="tab-${state.active}"`:''}>${panel}</section>
      <p class="error" id="program-error" role="alert" hidden>Choose at least one benefit to prepare for.</p>
      ${actions(`<button class="button" data-action="skip">${escape(tr('Skip and add documents'))}</button>`,next('see-results',state.quick[state.active].saved?'Update my results':'See my results'))}
      <p class="disclosure" data-i18n=ui35>This is an initial screen, not an eligibility decision.</p>
      <section id="quick-result" aria-live="polite">${state.quick[state.active].saved?`<h2 data-i18n=ui31>Your initial result</h2>${startingSummary(state.active,true)}${actions(optionalCheck,`<button class="button primary" data-action="documents" data-i18n=ui32>Continue to documents</button>`)}`:''}</section>`;
  }
  function startingSummary(p,compact=false){
    const q=state.quick[p],o=Q.overview(state.quick,p);
    const evaluated=real.policyResults?.[p];
    if(p==='calfresh'&&evaluated?.revision===q.revision&&o.comparison!=='needs_update'){
      const finding=evaluated.evaluation.results.flatMap(x=>x.findings).find(x=>x.ruleId==='cf.income_reference');
      o.comparison=({within_mce_reference:q.income==='none'?'no_income_reported':'at_or_below_reference',above_mce_reference:'above_reference'})[finding?.code]||'not_compared';
    }
    let explanation='Starting questions have not been completed.';
    if(o.status==='Skipped')explanation='Starting questions were skipped. You can prepare documents or answer on the official site.';
    else if(o.comparison==='needs_update')explanation='Starting answers changed. The earlier comparison is not current.';
    else if(p==='calfresh'&&q.saved){
      const texts={above_reference:'Your estimate is above the starting income guide. More details are needed; this is not a denial.',at_or_below_reference:'Your estimate is within the starting income guide.',no_income_reported:'You reported no income.',not_compared:'The income comparison was left open. No missing answer was treated as zero.',reference_expired:'The saved income reference has expired. No current comparison is shown.',reference_mismatch:'The income range needs to be selected again for this household size.'};
      explanation=tr(texts[o.comparison]||'No current comparison is available.');
      if(q.saved.facts.residence==='no')explanation=tr('You reported living outside California. State routing needs clarification; no full eligibility result is available.')+' '+explanation;
      else if(q.saved.facts.residence!=='yes')explanation=tr('California residence still needs clarification.')+' '+explanation;
    } else if(p==='medical'&&q.saved)explanation=tr('Starting age and residence details saved. Coverage pathway, household, income, and other eligibility conditions have not been assessed.')+(q.saved.facts.people.some(x=>x.residence!=='yes')?' '+tr('One or more residence answers need clarification.'):'');
    const savedDate=q.saved?new Date(q.saved.at):null;
    const savedTime=savedDate?`${savedDate.toLocaleDateString(uiLocale(),{month:'short',day:'numeric',year:'numeric'})} at ${savedDate.toLocaleTimeString(uiLocale(),{hour:'numeric',minute:'2-digit'})}`:'';
    return `<div class="start-result" data-start-result="${p}">${compact?'':`<h3>${names[p]} <span>${escape(tr(o.status))}</span></h3>`}<p><strong>${escape(tr(explanation))}</strong></p>${p==='calfresh'&&q.saved?'<p data-i18n=ui72>Other eligibility factors, including immigration/citizenship, have not been reviewed.</p>':''}<p><em data-i18n=ui73>Preliminary only — not an eligibility decision.</em></p>${q.saved?`<p class="small"><strong>${escape(tr('Saved {time} · Residence self-reported',{time:savedTime}))}</strong></p>`:''}${policyDetails(real,p,escape)}<button class="help-button" data-reopen="${p}">${escape(tr('Edit {program} starting answers',{program:names[p]}))}</button></div>`;
  }
  function startingDetails(){return `<details class="starting-details"><summary data-i18n=ui57>Starting answers by benefit</summary>${selected().map(p=>startingSummary(p)).join('')}</details>`;}

 return {quick,startingDetails,startingSummary};
}
export const quickView=({state,esc,icon})=>views(state,esc,icon).quick();
export const startingDetails=(state,esc)=>views(state,esc).startingDetails();
export const startingSummary=(state,program,esc)=>views(state,esc).startingSummary(program,true);
export function readStartingControls(state,controls){
 const people=controls.find(x=>x.cf==='people'),changed=people&&people.value!==state.starting.calfresh.people;
 for(const c of controls){
  if(c.cf&&!(c.cf==='income'&&changed&&['above','at_or_below'].includes(c.value)))Q.setCalFresh(state.starting,c.cf,c.value);
  if(c.mc)Q.setMedical(state.starting,c.person,c.mc,c.value);
 }
}
