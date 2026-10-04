"""Explicit bindings to inspected widgets. Does not approve maps or guess geometry."""
import json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1]
for id in ['cf285','ccfrm604']:
 inspection=json.loads((R/f'forms/inspection/{id}.json').read_text());inv=json.loads((R/f'forms/inventory/{id}.json').read_text());groups={g['id']:g for g in inv['groups']}
 widgets={}
 for p in inspection['pages']:
  for w in p['widgets']:widgets.setdefault(w['name'],[]).append(dict(w,page=p['page']))
 bindings=[]
 def bind(g,f,w,row=0,option=None):
  ws=widgets[w];assert len(ws)==1,(id,w,'shared widget requires review');v=ws[0];field=next(x for x in groups[g]['fields'] if x['key']==f)
  b=dict(groupId=g,field=f,row=row,page=v['page'],kind='checkbox' if v['type']=='CheckBox' else 'text',rect=v['rect'],widget=w,fontSize=8,maxLength=min(v['maxLength'] or 4000,4000),font='NotoSans-Regular',multiline=bool(v['flags']&4096),printedLabel=v['label'],conditional=groups[g]['applicability'])
  if option is not None:b['optionValue']=option
  if v['type']=='CheckBox':
   states=set((v['buttonStates'] or {}).get('normal') or [])|set((v['buttonStates'] or {}).get('down') or []);states.discard('Off');assert len(states)==1;b['exportValue']=next(iter(states))
  bindings.append(b)
 def cf(n):return f'CF 285  {n}'
 if id=='cf285':
  for f,n in dict(name=4,other_names=5,home_address=7,home_city=8,home_state=9,home_zip=10,mailing_address=11,mailing_city=12,mailing_state=13,mailing_zip=14,written_language=22,spoken_language=23).items():bind('q1.contact',f,cf(n))
  bind('q1.contact','homeless',cf(20),option=True);bind('q1.contact','homeless',cf(21),option=False)
  for row,(name,dob,rel) in enumerate([(103,105,None),(1013,1014,111),(1021,1022,112),(1029,1030,113),(1037,1038,114)]):
   bind('q6a.people','name',cf(name),row);bind('q6a.people','date_of_birth',cf(dob),row)
   if rel:bind('q6a.people','relationship',cf(rel),row)
  for row in range(4):
   for f,offset in [('person',271),('employer_name_address',272),('employer_phone',273),('hourly_rate',274),('hours_week',275),('frequency',276),('gross_received_this_month',277)]:bind('q8.earned',f,cf(offset+9*row),row)
  bind('q8.earned','has_income',cf(269),option=True);bind('q8.earned','has_income',cf(270),option=False)
  for row in range(4):
   for f,n in [('care_recipient',357),('provider_name_address',358),('amount_paid',359),('frequency',360)]:bind('q9.care',f,cf(n+4*row),row)
  bind('notes','notes',cf(541))
 else:
  for f,n in [('first_name',1),('middle_name',2),('last_name',3),('suffix',4)]:bind('p1.contact',f,f'p_name_{n}')
  bind('p1.contact','email','contact-3-1')
  for row in range(4):
   n=row+1
   for f,w in [('first_name',f'person_fname_{n}'),('middle_name',f'person_mname_{n}'),('last_name',f'person_lname_{n}'),('suffix',f'person_lsuffix_{n}')]:bind('p2.identity',f,w,row)
   for f,w in [('date_of_birth',f'dob_person_{n}'),('home_address',f'pri_address_{n}'),('city',f'pri_city_{n}'),('state',f'pri_state_{n}'),('zip',f'pri_zip_{n}'),('mail_address',f'm_address_{n}'),('mail_city',f'm_city_{n}'),('mail_state',f'm_state_{n}'),('mail_zip',f'm_zip_{n}')]:bind('p2.address',f,w,row)
   for suffix,val in [(1,True),(2,False)]:bind('p2.address','homeless',f'p{n}homeless-{suffix}',row,val)
  bind('p7.income','household_has_income','income_app-1',option=True);bind('p7.income','household_has_income','income_app-2',option=False)
  for row in range(2):
   n=row+1
   for f,k in [('person_first',1),('person_middle',2),('person_last',3),('person_suffix',4)]:bind('p7.income',f,f'income{n}_fname_{k}',row)
   bind('p7.income','income_name',f'income_name_{n}',row);bind('p7.income','amount',f'income_amount_{n}',row)
   for suffix,value in [(1,'Hourly'),(2,'Daily'),(3,'Weekly'),(6,'Every 2 weeks'),(4,'Monthly'),(7,'Twice a month'),(5,'Annually'),(8,'One-time payment')]:bind('p7.income','frequency',f'inc{n}_get-{suffix}',row,value)
   for suffix,value in [(1,'Employment'),(2,'Social Security or interest'),(4,'Self-employment')]:bind('p7.income','source_type',f'in{n}_source-{suffix}',row,value)
 # All unsupported widgets are explicitly protected; a binding cannot write by label similarity.
 mapped={b['widget'] for b in bindings};protected=[];coverage=[]
 for p in inspection['pages']:
  for w in p['widgets']:
   disposition='supported' if w['name'] in mapped else 'manual-only' if (id=='ccfrm604' and p['page']>=18) or (id=='cf285' and (p['page']<9 or p['page']==18 or w['name'] in [cf(15),cf(16),cf(17),cf(18),cf(19),cf(35),cf(36)])) else 'not-yet-supported'
   reason='Explicit semantic binding to inspected widget; independent release review pending.' if disposition=='supported' else 'Leave on original form for applicant/authorized actor; not filled by general confirmation.'
   coverage.append(dict(page=p['page'],widget=w['name'],printedLabel=w['label'],rect=w['rect'],disposition=disposition,reason=reason))
   if disposition!='supported':protected.append(dict(page=p['page'],rect=w['rect'],reason=f'{disposition}: {w["name"]}'))
 mapping=dict(schemaVersion='1.0',formId=id,edition=inv['edition'],templateSha256=inspection['sha256'],expectedPageCount=inspection['pageCount'],geometry=[{k:p[k] for k in ['page','mediaBox','cropBox','rotation','width','height']} for p in inspection['pages']],review=dict(status='draft',reviewers=[],visualValidation=False),bindings=bindings,protectedRegions=protected,coordinateContract=inspection['coordinateContract'],coverageComplete=False,continuation='Unsupported overflow is reported for manual completion; no extra pages are silently copied.')
 (R/f'forms/maps/{id}.json').write_text(json.dumps(mapping,indent=2)+'\n')
 audit=dict(formId=id,templateSha256=inspection['sha256'],coverage=coverage,semanticGroups=[dict(groupId=g['id'],page=g['pdfPage'],disposition='manual-only' if g['manualOnly'] else 'partially-supported' if any(b['groupId']==g['id'] for b in bindings) else 'not-yet-supported',reason='See widget coverage and missing-field report; baseline transcription is not a complete printed-question audit.') for g in inv['groups']],printedQuestionAuditComplete=False,unresolved=['Independent page-by-page printed-question audit remains required, including areas without PDF widgets.','CCFRM604 baseline omits printed attachments on pages 35–36; they remain manual-only.'] if id=='ccfrm604' else ['Independent printed-question audit remains required.','First household relationship is printed Self; its tiny underlying field is left untouched.'])
 (R/f'forms/inspection/{id}.coverage.json').write_text(json.dumps(audit,indent=2)+'\n')
 print(id,len(bindings),'bindings',len(coverage),'widget dispositions')
