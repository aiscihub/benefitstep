/** Source-backed question priorities, NOT eligibility decisions or proof requirements.
 * No document text, model guess, or Medi-Cal answer establishes a CalFresh status.
 */
export const QUALIFICATION_SOURCES={
 work:{title:'CDSS work requirements',url:'https://www.cdss.ca.gov/inforesources/calfresh/abawd',checkedOn:'2026-10-03'},
 policy:{title:'CDSS student and household guidance',url:'https://www.cdss.ca.gov/inforesources/calfresh-resource-center/policy',checkedOn:'2026-10-03'},
 eligibility:{title:'County CalFresh eligibility guidance',url:'https://socialservices.alamedacountyca.gov/ex/our-services/Health-and-Food/CalFresh/tabs/CalFresh-Eligibility',checkedOn:'2026-10-03'}
};
const HOUSEHOLD=[
 {id:'student',input:'College/Trade School',why:'College attendance can bring additional student eligibility rules. Check enrollment and any applicable student exception.',action:'If someone attends college or trade school, answer that topic in BenefitsCal.',source:'policy'},
 {id:'disability',input:'Person With a Disability',why:'Disability or inability to work can change which work requirements apply.',action:'If relevant, answer the disability questions directly. A medical bill alone does not establish this status.',source:'work'},
 {id:'pregnancy',input:'Pregnancy',why:'Pregnancy can be a reason someone is excused from the ABAWD work requirement.',action:'If relevant, answer the pregnancy question. We do not infer pregnancy from documents.',source:'work'},
 {id:'care',input:'Childcare/Disabled Adult Care',why:'Caring for a child or a person with a disability can affect work-rule exceptions. Care responsibility and a care bill are different facts.',action:'Check who provides care and whom they care for when the application asks.',source:'work'},
 {id:'facility',input:'Facility/Shelter',why:'Some institutional living arrangements have special eligibility rules. A shelter and an institution are not automatically treated alike.',action:'If relevant, describe the actual living arrangement; do not infer eligibility from its name.',source:'policy'},
 {id:'assistance',input:'Public Assistance',why:'The type of public assistance can affect which CalFresh eligibility pathway or work rules apply.',action:'If relevant, report the actual program and recipient. Receiving assistance does not automatically establish qualification.',source:'policy'}
];
export function qualificationHighlights(state,section=state.guideSection){
 if(!state.programs.has('CalFresh'))return [];
 const flag=(id,input,why,action,source,extra={})=>({id,input,why,action,source,conditional:true,...extra});
 if(section==='Household Details')return HOUSEHOLD.map(item=>({...item,conditional:true}));
 const quick=state.quick||{};
 if(section==='Your Information')return quick.resident==='yes'||['moved','no_address'].includes(quick.residencyContext)?[]:[flag('residence','California residence','California residence is part of CalFresh eligibility.','Answer the residence question in BenefitsCal; use county help if your situation is unclear.','eligibility',{basis:quick.resident==='no'?'Your quick check says you do not live in California.':'Your starting residence answer is missing or uncertain.'})];
 if(section==='People')return [flag('household','Who buys and prepares food together','Which people belong in the CalFresh household changes the income comparison. A shared address alone does not answer this.',quick.food?`Your quick-check count is ${quick.food}. Check the actual household questions in BenefitsCal.`:'Answer who buys and prepares food together and the household relationships BenefitsCal asks about.','eligibility')];
 if(section==='Income'){
  const incomeFacts=(state.facts||[]).filter(f=>!f.superseded&&f.group==='Income');
  const unresolved=incomeFacts.filter(f=>['gross_pay','pay_frequency','pay_date','period_start','period_end','support_direction'].includes(f.fieldKey)&&(f.value===null||f.conflict));
  const flags=[];
  if(unresolved.length)flags.push(flag('income-answer','Unresolved income details','Amounts, timing and income type can change the eligibility income comparison.','Resolve the highlighted income details or answer them directly in BenefitsCal.','eligibility',{conditional:false,affectedFactIds:unresolved.map(f=>f.id)}));
  if(quick.income==='over'||quick.income==='unsure')flags.push(flag('income-context','Income range needs context','A starting range alone cannot establish eligibility; household circumstances and applicable rules still matter.','Report current income accurately. The helper does not treat this range as a denial.','eligibility',{basis:quick.income==='over'?'You selected a range above the starting income guide.':'You said income is uncertain or changes.'}));
  return flags;
 }
 return [];
}
