/** Explicit, limited baseline. This is NOT a language model or general layout extractor. */
import {validateExtraction,ALLOWED_FIELDS} from './schema.mjs';
export const LABELS={
 business_receipts:['Business gross receipts','Gross business receipts'],award_amount:['Award amount','Monthly benefit'],program_stated:['Program','Program stated'],request_item:['Requested item','Requested evidence'],stated_deadline:['Response deadline','Deadline'],notice_reason:['Administrative reason','Notice reason'],
 home_address:['Home address','Service address','Residential address'],home_city:['Home city','Service city'],home_state:['Home state','Service state'],home_zip:['Home ZIP','Service ZIP'],
 person:['Employee','Tenant','Borrower','Customer','Child','Patient','Person','Recipient','Employee name','Account holder'],
 issuer:['Employer','Issuer','Landlord','Lender','Utility provider','Care provider','Medical provider','Provider'],
 document_date:['Document date','Statement date','Receipt date'],period_start:['Period start','Pay period start','Service start','Lease start'],period_end:['Period end','Pay period end','Service end','Lease end'],
 pay_date:['Pay date','Payment date'],gross_pay:['Current gross pay','Gross pay','Gross earnings this period'],net_pay:['Take-home pay','Net pay','Net deposit'],ytd_gross:['Year-to-date gross','YTD gross'],pay_frequency:['Pay frequency'],
 rent_amount:['Monthly rent','Rent amount','Rent per month'],mortgage_payment:['Monthly mortgage payment','Mortgage payment','Scheduled payment'],principal:['Principal'],interest:['Interest'],escrow:['Escrow'],loan_balance:['Outstanding loan balance','Loan balance'],
 current_charges:['Current charges','Current service charges'],prior_balance:['Prior balance','Previous balance','Previous credit'],amount_due:['Amount due','Total due'],amount_billed:['Amount billed','Charges'],amount_paid:['Amount paid','Payment received'],insurance_paid:['Insurance paid'],patient_responsibility:['Patient responsibility'],support_direction:['Support direction'],expense_frequency:['Expense frequency'],service_description:['Service description']};
export function classifyByRules(text){
 const s=text.toLowerCase();const cues=[['self_employment',/self.employment record|business income statement/],['income_award',/income award|benefit award letter/],['county_request',/county evidence request|request for verification/],['application_receipt',/application submission receipt/],['upload_receipt',/document upload receipt/],['coverage_notice',/coverage notice|coverage decision notice/],['paystub',/pay statement|pay stub|paystub|earnings statement/],['mortgage',/mortgage statement|home loan statement/],['rent',/rental agreement|rent receipt|lease agreement/],['utility',/utility statement|energy statement|water service statement/],['childcare',/child care invoice|childcare invoice|dependent care receipt/],['medical',/medical invoice|patient billing statement|health service invoice/],['support',/support payment record|child support receipt|support payment statement/]];
 const hits=cues.filter(([,r])=>r.test(s));return hits.length===1?hits[0][0]:'unknown';
}
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function extractByLabels(pages,kindHint){
 const text=pages.map(p=>p.text||'').join('\n');const kind=kindHint&&kindHint!=='unknown'?kindHint:classifyByRules(text);const fields=[];
 for(let pi=0;pi<pages.length;pi++)for(const line of (pages[pi].text||'').split('\n')){
   for(const key of ALLOWED_FIELDS[kind]||[]){
    const re=new RegExp('^\\s*(?:'+LABELS[key].map(esc).join('|')+')\\s*[:|]\\s*(.*?)\\s*$','i');const match=line.match(re);
    if(match&&match[1]&&!/not visible|unknown|missing|not shown|unreadable/i.test(match[1]))fields.push({key,value:match[1].trim(),page:pi+1,quote:line});
   }
 }
 const warnings=['Local label parser selected. It supports explicit English labels only; it does not establish document authenticity.'];
 return validateExtraction({kind,fields:fields.slice(0,32),warnings},pages,'label-baseline');
}
