/** Explicit, limited baseline. This is NOT a language model or general layout extractor. */
import {validateExtraction,ALLOWED_FIELDS,FIELD_DEFS,dateTokens,monthSpan} from './schema.mjs';
export const LABELS={
 business_receipts:['Business gross receipts','Gross business receipts'],award_amount:['Award amount','Monthly benefit'],program_stated:['Program','Program stated'],request_item:['Requested item','Requested evidence'],stated_deadline:['Response deadline','Deadline'],notice_reason:['Administrative reason','Notice reason'],
 home_address:['Home address','Service address','Residential address','Property address','Rental address','Property','Premises'],home_city:['Home city','Service city'],home_state:['Home state','Service state'],home_zip:['Home ZIP','Service ZIP'],
 person:['Employee','Tenant','Borrower','Customer','Person','Recipient','Employee name','Account holder','Contractor','Worker','Resident','Customer name','Account name','Billed to','Bill to','Payee'],
 issuer:['Employer','Issuer','Landlord','Lender','Utility provider','Care provider','Medical provider','Provider','Employer name','Company','Company name','Payer','Property manager','Management company','Provider name'],
 document_date:['Document date','Statement date','Receipt date','Invoice date','Bill date','Billing date','Issue date','Date issued'],period_start:['Period start','Pay period start','Service start','Lease start'],period_end:['Period end','Pay period end','Service end','Lease end'],
 pay_date:['Pay date','Payment date','Check date','Date paid','Paid on'],gross_pay:['Current gross pay','Gross pay','Gross earnings this period','Gross earnings','Gross wages','Gross payment','Gross amount','Total gross','Total gross pay','Contract payment (gross)'],net_pay:['Take-home pay','Net pay','Net deposit','Net payment','Net amount','Net wages','Total net pay'],ytd_gross:['Year-to-date gross','YTD gross','Year-to-date earnings','YTD earnings'],pay_frequency:['Pay frequency'],
 rent_amount:['Monthly rent','Rent amount','Rent per month','Rent','Rent due','Base rent'],mortgage_payment:['Monthly mortgage payment','Mortgage payment','Scheduled payment'],principal:['Principal'],interest:['Interest'],escrow:['Escrow'],loan_balance:['Outstanding loan balance','Loan balance'],
 current_charges:['Current charges','Current service charges','Total current charges','New charges','Total new charges','Charges this period'],prior_balance:['Prior balance','Previous balance','Previous credit','Balance forward'],amount_due:['Amount due','Total due','Total amount due','Balance due'],amount_billed:['Amount billed','Charges','Total billed','Total charges','Invoice total','Invoice amount'],amount_paid:['Amount paid','Payment received','Total paid','Amount received','Payment amount'],insurance_paid:['Insurance paid'],patient_responsibility:['Patient responsibility'],support_direction:['Support direction'],expense_frequency:['Expense frequency'],service_description:['Service description']};
// A dependant is named as the person only when nobody is named as the customer, tenant or payer.
const DEPENDANT_LABELS=['Child','Patient'];
// One line that states both ends of a period, or one whole month.
const PERIOD_LABELS=['Pay period','Billing period','Service period','Statement period','Rental period','Rent period','Invoice period','Coverage period','Period'];
const CUES=[['self_employment',/self.employment record|business income statement/],['income_award',/income award|benefit award letter/],['county_request',/county evidence request|request for verification/],['application_receipt',/application submission receipt/],['upload_receipt',/document upload receipt/],['coverage_notice',/coverage notice|coverage decision notice/],['paystub',/pay statement|pay stub|paystub|payslip|pay slip|earnings statement|wage statement/],['mortgage',/mortgage statement|home loan statement/],['rent',/rental agreement|rent receipt|rental receipt|lease agreement/],['utility',/utility statement|utility bill|energy statement|water service statement/],['childcare',/child care invoice|childcare invoice|daycare invoice|day care invoice|dependent care receipt/],['medical',/medical invoice|patient billing statement|health service invoice/],['support',/support payment record|child support receipt|support payment statement/]];
export const documentCues=text=>{const s=text.toLowerCase();return CUES.filter(([,r])=>r.test(s)).map(([kind])=>kind);};
export function classifyByRules(text){const hits=documentCues(text);return hits.length===1?hits[0]:'unknown';}
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const labelled=labels=>new RegExp('^\\s*(?:'+labels.map(esc).join('|')+')\\s*[:|]\\s*(.*?)\\s*$','i');
// Statement rows often leave out the colon: "Amount due   $298.47", "Monthly rent — October 2026   $2,500.00".
const amountRow=labels=>new RegExp('^\\s*(?:'+labels.map(esc).join('|')+')(?:\\s+[—–-]\\s+[^$]{1,40}?)?\\s+(\\$\\s?[\\d,]+(?:\\.\\d{1,2})?)\\s*$','i');
const ONE_LINE_ADDRESS=/^(.+?),\s*([A-Za-z][A-Za-z .'-]*?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,NAME_THEN_ADDRESS=/^(.+?)\s+[—–-]\s+(\d.*)$/;
const SAMPLE_BANNER=/\b(?:sample|demo|fictional|synthetic|specimen|not valid)\b|^(?:\S\s+){6}/i,DOCUMENT_TITLE=/\b(?:statement|invoice|receipt|bill|notice|request|verification|agreement|contract|lease|record|letter|correspondence|summary|report|advice|handout|newsletter|application|form|certificate|confirmation|schedule|stub|payslip|payroll|earnings|payment|page|copy)\b/i;
/** A statement usually opens with who issued it. The first line is used only when it reads like a name. */
function letterhead(page){
 const line=(page?.text||'').split('\n').map(l=>l.trim()).filter(Boolean).slice(0,4).find(l=>!SAMPLE_BANNER.test(l));
 return line&&/^[A-Za-z][A-Za-z0-9 &.,'’-]{1,59}$/.test(line)&&!/\d{3}/.test(line)&&!DOCUMENT_TITLE.test(line)?line:null;
}
export function extractByLabels(pages,kindHint){
 const text=pages.map(p=>p.text||'').join('\n');const kind=kindHint&&kindHint!=='unknown'?kindHint:classifyByRules(text);const allowed=ALLOWED_FIELDS[kind]||[],fields=[],dependants=[];
 const patterns=allowed.map(key=>[key,labelled(LABELS[key]),FIELD_DEFS[key][1].includes('money')?amountRow(LABELS[key]):null]),person=labelled(LABELS.person),dependant=labelled(DEPENDANT_LABELS),period=labelled(PERIOD_LABELS);
 // A teaching handout or a price list also has rows of amounts. Rows without a colon count only when the document names who it is for.
 const named=pages.some(p=>(p.text||'').split('\n').some(l=>person.test(l)||dependant.test(l)));
 const add=(list,key,value,page,quote)=>{if(allowed.includes(key)&&value&&!/not visible|unknown|missing|not shown|unreadable/i.test(value))list.push({key,value:value.trim(),page,quote});};
 // "Street, City, ST 12345" on one line fills the four address fields from the same quote.
 const address=(value,page,quote)=>{const parts=value.match(ONE_LINE_ADDRESS);if(parts)['home_address','home_city','home_state','home_zip'].forEach((key,i)=>add(fields,key,parts[i+1],page,quote));else add(fields,'home_address',value,page,quote);};
 for(let pi=0;pi<pages.length;pi++){let underRecipient=false;for(const line of (pages[pi].text||'').split('\n')){
   if(line.length>400||!line.trim())continue;
   // "Address:" alone could be anyone's. It is the recipient's only directly under the line that names them.
   const plain=underRecipient&&line.match(/^\s*Address\s*[:|]\s*(.*?)\s*$/i);if(plain&&plain[1])address(plain[1],pi+1,line);
   underRecipient=person.test(line);
   for(const [key,withColon,row] of patterns){
    const value=(line.match(withColon)||row&&named&&line.match(row)||[])[1];if(!value)continue;
    const payer=key==='person'&&value.match(NAME_THEN_ADDRESS);
    if(key==='home_address')address(value,pi+1,line);
    else if(payer&&ONE_LINE_ADDRESS.test(payer[2])){add(fields,'person',payer[1],pi+1,line);address(payer[2],pi+1,line);}
    else add(fields,key,value,pi+1,line);
   }
   const child=line.match(dependant);if(child)add(dependants,'person',child[1],pi+1,line);
   const span=line.match(period);
   if(span){const dates=dateTokens(span[1]);if(dates.length===2){add(fields,'period_start',dates[0],pi+1,line);add(fields,'period_end',dates[1],pi+1,line);}else if(!dates.length&&monthSpan(span[1])){add(fields,'period_start',span[1],pi+1,line);add(fields,'period_end',span[1],pi+1,line);}}
 }}
 const warnings=['Local label parser selected. It supports explicit English labels only; it does not establish document authenticity.'];
 if(kind==='unknown'&&documentCues(text).length>1)warnings.push('This file mentions several document types, so none was chosen. Split it or enter the details yourself.');
 if(!fields.some(f=>f.key==='person'))fields.push(...dependants);
 const recipient=fields.find(f=>f.key==='person'),heading=recipient&&allowed.includes('issuer')&&!fields.some(f=>f.key==='issuer')?letterhead(pages[recipient.page-1]):null;
 if(heading&&heading!==recipient.value){fields.push({key:'issuer',value:heading,page:recipient.page,quote:heading});warnings.push('Issuer was taken from the first line of the document, not from a label. Check it against the source.');}
 // Children and patients named on the page are kept apart from the facts; they are only offered as possible household members.
 return {...validateExtraction({kind,fields:fields.slice(0,32),warnings},pages,'label-baseline'),dependants:dependants.map(d=>({name:d.value.replace(/\s*\([^)]*\)\s*$/,'').trim(),page:d.page,quote:d.quote})).filter(d=>d.name)};
}
