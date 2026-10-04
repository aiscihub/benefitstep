"""Authored scenario families: split declarations precede rendering or fitting.
No screenshot text, user identity, gold label, filename or metadata is fed to ML.
"""
import html, random
E=html.escape
# Each tuple is a distinct authored wording family. Layout pools are also split.
FAMILIES = {
 'pay_statement': [
 ('hourly', 'Earnings advice', 'Hourly wages posted to payroll. Overtime is shown separately from regular hours.'),
 ('salary', 'Compensation statement', 'Salary disbursement for the completed service period. Employer benefits are informational and excluded from cash pay.'),
 ('check_stub', 'Employee payment voucher', 'Retain the detachable stub for your records. The check and the employee copy refer to the same payment.'),
 ('portal_paid', 'My pay • Completed payment', 'Payment status: deposited. Download history for completed payroll transactions.'),
 ('tips', 'Wages and reported tips', 'Cash tips reported during this period are included in taxable earnings. Noncash employer benefits are not deposited.'),
 ('commission', 'Sales earnings detail', 'Commission released this cycle relates to previously closed sales. This statement records a completed payroll run.'),
 ('shift', 'Payroll register — employee copy', 'Evening differential and paid leave are included in this pay cycle. Cumulative balances are year to date.'),
 ('reimbursement', 'Remittance and earnings', 'Expense reimbursement is paid in addition to wages and is not included in the gross earnings figure.'),
 ('advice', 'Deposit notification and wage detail', 'The payroll transfer has been completed. Current earnings and cumulative totals are displayed separately.'),
 ('weekly', 'Weekly remuneration record', 'Earnings for services already performed. Statutory deductions were withheld from this payment.'),
 ('employer_record', 'Employer confirmation of wages paid', 'Our accounting ledger confirms the following wages were paid to this employee. This is a record of payment, not an offer of future work.'),
 ('hours_detail', 'Time and earnings reconciliation', 'Approved worked hours have been paid in the payroll transaction below. The time ledger is followed by the disbursement detail.')],
 'invoice_or_receipt': [
 ('electric_gas', 'Residential energy account', 'This bill includes an unpaid prior balance. Usage charges for the current billing period are separate from the total amount due.'),
 ('medical_bill', 'Patient account statement', 'Insurance adjustments have been applied. The remaining patient responsibility is payable to the practice.'),
 ('childcare', 'After-school care • Billing detail', 'Attendance charges cover scheduled care days. A payment received after the statement date may appear on the next statement.'),
 ('rent_receipt', 'Resident payment receipt', 'Payment received and allocated to the rent period below. The security deposit is held separately.'),
 ('phone', 'Wireless service account', 'Monthly access and usage charges. Equipment installments are shown separately from the service plan.'),
 ('water', 'Water and sanitation services', 'Meter readings determine usage. Wastewater and refuse collection charges are billed on the same account.'),
 ('payroll_vendor', 'Payroll processing services • Invoice', 'Bill to the business customer. These are software and payroll processing fees, not wages paid to an employee.'),
 ('retail', 'Customer sales receipt', 'Items purchased and tender received are listed below. Keep this receipt for returns.'),
 ('dental', 'Dental practice • Account balance', 'Treatment charges less insurer adjustment and previous payment. Please remit the amount due.'),
 ('bilingual', 'Recibo / Service receipt', 'Amount received / Importe recibido. Services completed / Servicios prestados. Paid in full / Pagado.'),
 ('homecare', 'Support services billing statement', 'In-home support visits completed during the service month. The account summary separates new charges from earlier amounts.'),
 ('rent_ledger', 'Housing account transaction record', 'Monthly rent assessment, resident payment and closing amount owed. This is a billing ledger, not a lease agreement.')],
 'other_document': [
 ('projection', 'Paycheck details after modeling', 'WHAT-IF CALCULATION ONLY. These hypothetical earnings, taxes and deductions have not been paid. Change assumptions to model a future paycheck.'),
 ('bank', 'Checking account activity', 'Deposits and withdrawals reflect bank activity. A payroll deposit is a net transfer; this bank record does not itemize employer gross wages.'),
 ('lease', 'Residential rental agreement', 'This agreement sets the future monthly rent and responsibilities of the resident and property manager. It does not acknowledge payment.'),
 ('tax', 'Annual earnings and withholding summary', 'Annual tax reporting copy. Totals cover the full calendar year and do not identify a current individual wage payment.'),
 ('offer', 'Conditional employment offer', 'Proposed salary and start date are subject to acceptance. No wages have been disbursed under this offer.'),
 ('county_notice', 'Request for verification', 'Please provide available proof of income and housing costs for the requested period. This notice is not itself a wage or expense record.'),
 ('coverage', 'Health coverage information', 'Plan enrollment and member service information. Coverage information is not a medical bill or a receipt for premiums.'),
 ('school', 'Enrollment confirmation', 'The student is enrolled for the stated academic term. Attendance information is supplied on request. This is not a tuition invoice.'),
 ('benefit_estimator', 'Take-home pay calculator • Scenario', 'Estimated payroll only. The displayed gross, withholding and net values are hypothetical, not an actual payment record.'),
 ('bank_letter', 'Account verification letter', 'The named customer holds an active deposit account. Recent incoming transfers are shown for reference; employer gross pay is not certified.'),
 ('what_if', 'Compensation planning worksheet', 'Proposed pay cycle simulation. Salary, deductions and net deposit are estimates for planning; no payment was issued or received.'),
 ('eob', 'Explanation of benefits', 'THIS IS NOT A BILL. This explanation shows how a health claim was processed. Do not send payment based on this document; the provider bills separately.')]
}
NAMES=['Alex Rowan','Casey Quinn','Morgan Ellis','Taylor Brooks','Robin Lane','Avery Reed','Jamie Ash','Drew Harper']
ISSUERS=['Willowbridge','Cedarfield','Alderpoint','Juniper Vale','Harborstone','Larch Meadow','Copper Hill','Maplebrook']
LAYOUTS={'train':['ledger','portal','classic','compact'],'validation':['sidebar'],'test':['report']}
def families():
 for label, items in FAMILIES.items():
  for i,(subtype,title,description) in enumerate(items):
   yield {'id':label+'-'+subtype,'label':label,'subtype':subtype,'title':title,'description':description,'split':'train' if i<8 else 'validation' if i<10 else 'test','ordinal':i}
def money(cents):return '${:,.2f}'.format(cents/100)
def table(headers,rows):
 return '<table><thead><tr>'+''.join('<th>'+E(str(c))+'</th>' for c in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(str(c))+'</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table>'
def block(title,content):return '<section><h3>'+E(title)+'</h3>'+content+'</section>'
def create(f, variant, index):
 rng=random.Random(9301+index);name=NAMES[index%len(NAMES)];issuer=ISSUERS[(index*5+variant)%len(ISSUERS)]
 # Fictional values varied independently of target; no real identifiers or signatures.
 hours=40+variant*4;gross=hours*rng.randrange(1800,6500,25)+7500;ded=int(gross*.19);net=gross-ded;reimburse=4500 if f['subtype']=='reimbursement' else 0
 month=6+variant;date=f'2026-{month:02}-28';start=f'2026-{month:02}-01';ref=f'R-{index+12001}'
 identity='<div class="identity"><b>'+E(name)+'</b><br>1840 Example Lane, Unit '+str(variant+1)+'<br>Sacramento, CA 95814</div>'
 context=table(['Reference','Issue date','Period'],[[ref,date,start+' – '+date]])
 label=f['label'];sub=f['subtype'];fields={};body=''
 if label=='pay_statement' or sub in ['projection','benefit_estimator','what_if']:
  fields={'gross':gross/100,'net':net/100,'pay_date':date,'paid':label=='pay_statement'}
  if sub=='check_stub':
   body+='<div class="check"><b>VOID • NON-NEGOTIABLE SPECIMEN</b><p>Pay to the order of '+E(name)+' <strong>'+money(net)+'</strong></p><p>Account •••• 0000 &nbsp; Reference '+ref+'</p><p>Signature intentionally omitted</p></div>'
  if sub=='employer_record':body+='<p>To whom it may concern: '+E(name)+' is employed by '+E(issuer)+'. The completed payroll transaction is summarized below. Please contact the payroll office at records@example.invalid for questions about this fictional letter.</p>'
  base=gross-7500;tax1=int(gross*.1);tax2=int(gross*.062);tax3=int(gross*.0145);rest=ded-tax1-tax2-tax3
  body+=block('Earnings',table(['Description','Hours','Rate','Current','YTD'],[['Regular compensation',hours,money(round(base/hours)),money(base),money(base*9)],[{'tips':'Reported tips','commission':'Sales commission','shift':'Shift differential'}.get(sub,'Premium / incentive'),'—','—',money(7500),money(7500*9)],['Total gross earnings','', '',money(gross),money(gross*9)]]))
  body+=block('Taxes and deductions',table(['Description','Current','Year to date'],[['Federal withholding',money(tax1),money(tax1*9)],['Social Security',money(tax2),money(tax2*9)],['Medicare',money(tax3),money(tax3*9)],['State / benefit deduction',money(rest),money(rest*9)],['Total deductions',money(ded),money(ded*9)]]))
  body+=table(['Gross','Deductions','Net wages','Reimbursement','Deposit amount'],[[money(gross),money(ded),money(net),money(reimburse),money(net+reimburse)]])
  if sub=='check_stub':body+=block('Retain with your records — repeated stub',table(['Pay reference','Gross','Net','Pay date'],[[ref,money(gross),money(net),date]]))
  body+='<p class="fine">Amounts are illustrative. Withholding figures are not tax advice. YTD values are cumulative and should not be treated as current period income.</p>'
 elif label=='invoice_or_receipt':
  current=rng.randrange(7500,145000,100);old=(variant%3)*8700;paid=current if sub in ['rent_receipt','retail','bilingual'] else (variant%2)*3500
  item={'electric_gas':'Electricity and gas usage','medical_bill':'Office consultation and laboratory service','childcare':'Afternoon care sessions','rent_receipt':'Monthly rent','phone':'Voice and data access','water':'Water usage and refuse collection','payroll_vendor':'Payroll platform processing fee','retail':'Household supplies','dental':'Preventive dental treatment','bilingual':'Completed service / Servicio','homecare':'Home support visits','rent_ledger':'Monthly rent assessment'}[sub]
  fields={'current_charges':current/100,'prior_balance':old/100,'paid':paid/100,'total_due':(old+current-paid)/100}
  first=current-1200
  body+=block('Service detail',table(['Item','Quantity','Unit amount','Charge'],[[item,'1',money(first),money(first)],['Administration / service charge','1',money(1200),money(1200)]]))
  body+=block('Account summary',table(['Activity','Amount'],[['Balance brought forward',money(old)],['New charges this period',money(current)],['Payment received',money(-paid)],['Closing amount due',money(old+current-paid)]]))
  if sub=='medical_bill':body+='<p>Claim reference C-100. Charges shown above are after contractual adjustments. No diagnosis or treatment advice is included.</p>'
  if sub=='electric_gas':body+=table(['Meter','Previous','Current','Usage'],[['Electric','5120','5508','388 kWh'],['Gas','791','809','18 therms']])
  body+='<p>Payment date '+date+' · Method: '+('received electronically' if paid else 'not yet received')+'</p><div class="remit">Detach and retain account reference '+ref+'<br>Remittance amount __________________</div>'
 else:
  if sub in ['bank','bank_letter']:
   opening=250000;withdraw=140000;closing=opening+net-withdraw
   fields={'opening':opening/100,'closing':closing/100,'net_deposit':net/100}
   body+=table(['Date','Transaction','Money in','Money out','Balance'],[[start,'Opening balance','','',money(opening)],[date,'Employer ACH payroll',money(net),'',money(opening+net)],[date,'Housing transfer','',money(withdraw),money(closing)]])+'<p>Checking •••• 0000. No credit or loan terms apply to this fictional account activity summary.</p>'
  elif sub=='lease':body+='<p>1. PREMISES. The resident named above will occupy the dwelling beginning '+start+'.</p><p>2. RENT. The agreed monthly rent is '+money(140000+variant*5000)+'. A refundable security deposit of the same amount is accounted for separately.</p><p>3. UTILITIES. Water is included; electricity and telephone are arranged by the resident.</p><p>4. TERM. The initial term is twelve months. Neither an unsigned agreement nor this specimen records a rent payment.</p><p>Resident signature: __________________ &nbsp; Date: __________</p>'
  elif sub=='tax':body+=table(['Annual reporting box','Calendar-year amount'],[['Wages and compensation',money(gross*24)],['Federal tax withheld',money(ded*12)],['Social security wages',money(gross*24)],['Medicare wages',money(gross*24)]])+'<p>Employee identifier masked. Annual reporting information only; this is not a current-period check stub.</p>'
  elif sub=='offer':body+='<p>We are pleased to offer '+E(name)+' a position starting '+date+'. Proposed compensation is '+money(gross)+' per month, before withholding. Benefits may include health coverage and paid leave.</p><p>Please return your acceptance before the proposed start date. Employment has not started and this letter records no payment.</p>'
  elif sub=='county_notice':body+='<p>Application reference '+ref+'. We need information about the period '+start+' through '+date+'.</p><ul><li>Available earnings statements, with gross pay and payment dates.</li><li>Housing costs and utility statements, if requested for your case.</li></ul><p>Send copies in response to the actual agency request. This fictional notice does not establish real program requirements or a deadline.</p>'
  elif sub=='coverage':body+=table(['Member','Plan','Coverage starts'],[[name,'Example health network',start]])+'<p>Member identifier •••• 0000. Primary care and pharmacy service information. Copays, deductibles and coverage limits depend on plan terms. Not a premium payment receipt.</p>'
  elif sub=='school':body+='<p>Registrar confirms enrollment for '+E(name)+' in the academic term beginning '+start+'. Status: enrolled. Course schedule: general studies, morning attendance.</p><p>No tuition payment is recorded in this letter. Registrar signature intentionally omitted in this specimen.</p>'
  elif sub=='eob':body+=table(['Service','Provider charge','Allowed','Plan paid','May owe'],[['Office visit',money(28000),money(18000),money(15000),money(3000)],['Lab',money(12000),money(8000),money(8000),money(0)]])+'<p>Claim processed '+date+'. Billed amounts differ from allowed amounts. This is an explanation of claim processing, not a demand for payment.</p>'
 layout=LAYOUTS[f['split']][variant%len(LAYOUTS[f['split']])]
 if label=='pay_statement':organization=issuer+' Works'
 elif label=='invoice_or_receipt':organization=issuer+' Services'
 else:organization=issuer+' Office'
 # Organization suffix omitted from ML-independent split policy, but retained as realistic context.
 # Avoid a class-specific issuer shortcut: use the same neutral identity in every class.
 organization=issuer
 layout_class=layout+(' dense' if sub=='check_stub' else '')
 content='<header><div class="brand">'+E(organization)+'</div><small>Records office · contact@example.invalid</small></header><h1>'+E(f['title'])+'</h1><p class="intro">'+E(f['description'])+'</p><div class="meta">'+identity+context+'</div>'+body
 content+='<footer>Fictional training specimen · No real person or transaction · Not valid for submission</footer>'
 return {'html':'<article class="paper '+layout_class+'">'+content+'</article>','fields':fields,'layout':layout,'name':name,'issuer':issuer}
CSS='''@page{size:Letter;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff;color:#202b36;font:12px/1.45 Arial}.paper{width:816px;height:1056px;padding:42px 46px;position:relative;overflow:hidden}header{border-bottom:2px solid #355669;padding-bottom:14px;margin-bottom:20px}.brand{font-size:26px;font-weight:700}small,.fine{font-size:10px;color:#5e666b}h1{font-size:21px;margin:13px 0}h3{font-size:12px;margin:17px 0 6px;text-transform:uppercase;letter-spacing:.6px}.intro{background:#f0f3f5;padding:12px;margin:14px 0}.identity{padding:10px 0}.meta{display:flex;align-items:center;gap:26px}.meta .identity{width:34%;flex:none}.meta table{flex:1;font-size:10px}table{border-collapse:collapse;width:100%;font-size:11px;margin:10px 0 15px}th,td{padding:7px 9px;border-bottom:1px solid #d5dbdf;text-align:left;vertical-align:top}th{background:#eef1f4}td:not(:first-child){text-align:right}p{margin:13px 0}footer{position:absolute;bottom:25px;left:46px;right:46px;font:9px Arial;color:#717777;border-top:1px solid #cdd4d4;padding-top:9px}.check{border:1px solid #799497;padding:15px;background:#f2f7f5}.check p{margin:8px 0}.check strong{float:right}.remit{border-top:1px dashed #65757b;margin-top:22px;padding-top:14px}.portal{padding:35px 40px;background:linear-gradient(#e7eef4 0 30px,#fff 30px)}.portal header{background:#31485e;color:#fff;padding:16px;margin:0 0 20px}.portal header small{color:#e4eaf0}.portal th{background:#dbe5ec}.classic{font-family:Georgia,serif}.classic header{text-align:center;border-bottom:1px solid #555}.classic th{background:#f1eee8}.classic .intro{background:none;padding:0;font-style:italic}.compact{font:11px/1.35 'Courier New',monospace;padding:45px}.compact .brand{font-size:21px}.compact h1{font-size:18px}.compact th,.compact td{padding:6px 7px}.compact .intro{border:1px solid #aaa;background:#fff}.sidebar{border-left:15px solid #647664;padding-left:40px;font-family:Verdana,sans-serif}.sidebar .brand{font-size:23px;color:#425b43}.sidebar th{background:#edf1e9}.sidebar .meta{border:1px solid #bbc8b6;padding:8px}.report{font-family:Georgia,serif;padding:44px 53px}.report header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px double #7d7164}.report .brand{font-weight:400;font-size:27px}.report h1{font-size:23px}.report .meta{display:block}.report .identity{width:100%}.report .meta table{font-size:11px}.report .intro{border-left:3px solid #9a8870;background:#f6f4f0}.report th{background:#eee9e2}.report td,.report th{padding:6px 8px}.dense td,.dense th{padding:4px 7px}.dense table{margin:7px 0 10px}.dense h3{margin-top:10px}.dense .check{padding:8px 14px}.dense .check p{margin:5px 0}'''
