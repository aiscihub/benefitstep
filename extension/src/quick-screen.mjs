/** Bounded early routing. Never a complete eligibility decision; never blocks filing.
 * Reviewed public sources 2026-10-03. No private data or runtime web requests.
 */
export const SCREEN_SOURCES={
 cfIncome:{title:'County CalFresh income guide, Oct 2026–Sep 2027',url:'https://socialservices.alamedacountyca.gov/ex/our-services/Health-and-Food/CalFresh/tabs/CalFresh-Eligibility'},
 cfResidency:{title:'CalFresh residency guidance',url:'https://my.dpss.lacounty.gov/public/en/home/epolicy/program/calfresh/residency.html'},
 snap:{title:'USDA SNAP eligibility and exceptions',url:'https://www.fna.usda.gov/snap/eligibility/elderly-disabled-special-rules'},
 snapStates:{title:'Find your state’s SNAP office',url:'https://www.fna.usda.gov/snap/state-directory'},
 mcResidency:{title:'DHCS residency guidance (2026)',url:'https://www.dhcs.ca.gov/fa/wp-content/uploads/2026/04/26-04.pdf'},
 mcIncome:{title:'DHCS 2026 income reference',url:'https://www.dhcs.ca.gov/services/medi-cal-resources/medi-cal-eligibility-division/all-county-welfare-directors-medi-cal-eligibility-division-information-letters/2026-fpl-calculation-chart-annual-values-enclosure-2/'},
 mcHelp:{title:'Medi-Cal coverage pathways',url:'https://www.dhcs.ca.gov/medi-cal/help/'},
 mcChanges:{title:'Current Medi-Cal enrollment changes',url:'https://www.dhcs.ca.gov/medi-cal/updates/medi-cal-changes/'},
 medicaidStates:{title:'Find your state’s Medicaid agency',url:'https://www.medicaid.gov/about-us/where-can-people-get-help-medicaid-chip'},
 cfImmigration:{title:'CDSS food-assistance options',url:'https://www.cdss.ca.gov/inforesources/cdss-programs/calfresh/cfap/who-is-eligible'},
 covered:{title:'Covered California',url:'https://www.coveredca.com/'},
 county:{title:'Find a California county benefits office',url:'https://www.dhcs.ca.gov/services/medi-cal/Pages/CountyOffices.aspx'}
};
export const RESIDENCY_OPTIONS=[
 {value:'other_state',label:'I live in another state and am not temporarily away from California'},
 {value:'moved',label:'I have already moved to California'},
 {value:'no_address',label:'I live in California but do not have a fixed address'},
 {value:'temporary',label:'I am temporarily away from California and plan to return'},
 {value:'unsure',label:'I am not sure which state counts as my residence'}
];
export function screenAnswers(state,program){const q=state.quick;return {resident:q.resident,residencyContext:q.residencyContext||'',household_size:program==='calfresh'?q.food:q.tax,income_band:program==='calfresh'?q.income:q.medicalIncome,applicant_status:q.applicant_status,special_group:q.special_group};}
export function quickScreen(program,a,today=new Date().toISOString().slice(0,10)){
 if(!['calfresh','medi_cal'].includes(program))throw Error('Unsupported quick-screen program');
 const cf=program==='calfresh',name=cf?'CalFresh':'Medi-Cal';
 const base={program:name,officialApplicationAvailable:true,qualification:'not_determined',checkedOn:'2026-10-03',reasons:[],sources:[],missing:[],residencyQuestion:false};
 const result=(status,title,reasons,next,sources,extra={})=>({...base,status,title,reasons,next,sources,...extra});
 const residenceSource=cf?'cfResidency':'mcResidency';
 // Resolve a potentially decisive residence mismatch first, without demanding income/documents.
 if(a.resident==='no'||a.resident==='unsure'){
  if(!RESIDENCY_OPTIONS.some(o=>o.value===a.residencyContext)||a.residencyContext==='unsure')return result('clarify','Check residence before ruling yourself out',[
   'Living in California is different from having a permanent address or having lived here for a long time.',
   'A temporary absence needs a residency review; it is not automatically a permanent move.'
  ],'Choose the situation below. No documents are needed for this starting check.',[residenceSource],{residencyQuestion:true});
  if(a.residencyContext==='other_state')return result('other_state',cf?'Apply for SNAP in the state where you live':'Check Medicaid in the state where you live',[
   `Based on your clarification, California’s ${name} residency requirement is not met.`,
   `You may still qualify for ${cf?'SNAP food assistance':'Medicaid or other health coverage'} in your state. This is a state-program mismatch, not a finding that you cannot receive benefits anywhere.`
  ],cf?'Use the state SNAP directory before preparing a California application.':'Contact your state’s Medicaid agency before preparing a California application.',[residenceSource,cf?'snapStates':'medicaidStates'],{residencyQuestion:true});
  if(a.residencyContext==='temporary')return result('review','You may still have California residency',[
   'A temporary absence with plans to return can be treated differently from moving to another state.',
   'The agency needs to review your circumstances, including any benefits or residency determination in another state.'
  ],'Ask the county about residency before abandoning your California application or coverage.',[residenceSource,'county'],{residencyQuestion:true});
 }
 const residenceNote=a.resident!=='yes'&&['moved','no_address'].includes(a.residencyContext)?a.residencyContext==='moved'?'You clarified that you already moved to California. Being a new resident does not by itself rule you out.':'You clarified that you live in California. Lack of a fixed address does not by itself rule you out.':null;
 const missing=[];
 if(!['yes','no','unsure'].includes(a.resident))missing.push('California residence');
 if(!/^([1-9]|1[0-2])$/.test(String(a.household_size||'')))missing.push(cf?'Food household size':'Tax household size');
 if(!['within','over','unsure'].includes(a.income_band))missing.push('Income range');
 if(!['yes','no','unsure'].includes(cf?a.applicant_status:a.special_group))missing.push(cf?'Applicant-status starting answer':'Special health circumstances');
 if(missing.length)return result('incomplete','A few answers are needed for your quick result',residenceNote?[residenceNote]:[],'Answer the remaining starting questions, or skip to preparation.',residenceNote?[residenceSource]:[],{missing,residencyQuestion:!!residenceNote});
 const validFrom=cf?'2026-10-01':'2026-01-01',validThrough=cf?'2027-09-30':'2026-12-31';
 if(today<validFrom||today>validThrough)return result('review','The saved income guide needs updating',residenceNote?[residenceNote]:[],'Use the current official guide or county review. Document preparation remains available.',[cf?'cfIncome':'mcIncome'],{residencyQuestion:!!residenceNote});
 const reasons=residenceNote?[residenceNote]:[],sources=[cf?'cfIncome':'mcIncome',residenceSource];
 if(a.income_band==='over'){
  reasons.push(cf?'Your selected range is above the starting CalFresh gross-income guide. That comparison alone is not a complete eligibility decision.':'Your selected range is above the common adult Medi-Cal income guide. That is not a universal limit for every coverage pathway.');
  reasons.push(cf?'Households with an older or disabled member can have different income-test rules. Deductions and countable income require an official review.':'Children, pregnancy, disability and other circumstances can use different pathways. Covered California may be another option.');
  sources.push(cf?'snap':'mcHelp');
 }
 if(a.income_band==='unsure')reasons.push('Changing or uncertain income needs a current-income review; an unknown amount is not treated as zero.');
 if(cf&&a.applicant_status!=='yes'){
  reasons.push('An uncertain applicant-status answer is not a household denial. Some members or state-funded food-assistance pathways may still qualify; request an official review.');sources.push('cfImmigration');
 }
 if(!cf){
  if(a.special_group!=='no')reasons.push('Age, pregnancy, disability or care needs can change which coverage rules apply.');
  reasons.push('These four answers do not check immigration/enrollment restrictions, all household rules or scope of coverage. Current enrollment rules need review.');sources.push('mcChanges');
 }
 const review=a.income_band!=='within'||(cf?a.applicant_status!=='yes':a.special_group!=='no');
 if(!review)reasons.unshift(cf?'Your starting residence, household and income-range answers support taking the next step and applying.':'Your selected range fits the common adult income guide. An official application can check the remaining coverage conditions.');
 return result(review?'review':'worth_applying',review?(a.income_band==='over'?'Above the basic guide — check other pathways':'You may still qualify — check these details'):(cf?'Applying looks worthwhile':'Income fits the starting guide — check coverage'),reasons,
 review?'Get an official review of these points. You can continue preparing or apply without waiting for every document.':'Continue preparing, or apply now. The agency checks the full eligibility rules.',[...new Set(sources)],{residencyQuestion:!!residenceNote,alternative:!cf&&a.income_band==='over'?'covered':null});
}
