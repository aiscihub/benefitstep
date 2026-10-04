"""Read-only inspection of immutable official templates; top-left PDF point coordinates."""
import fitz,json,hashlib,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
registry=json.loads((ROOT/'forms/registry.json').read_text())
for record in registry['templates']:
 id=record['id'];path=ROOT/'forms/templates'/f'{id}.pdf'
 if not path.exists():continue
 raw=path.read_bytes();assert raw.startswith(b'%PDF-');doc=fitz.open(stream=raw,filetype='pdf')
 pages=[];active=[]
 for x in range(1,doc.xref_length()):
  obj=doc.xref_object(x)
  if re.search(r'/(JavaScript|JS|Launch)\b',obj):active.append(x)
 for i,p in enumerate(doc):
  widgets=[]
  for w in p.widgets() or []:
   widgets.append(dict(name=w.field_name,label=w.field_label,type=w.field_type_string,rect=list(w.rect),flags=w.field_flags,maxLength=w.text_maxlen,fontSize=w.text_fontsize,value=w.field_value,choices=w.choice_values,buttonStates=w.button_states(),xref=w.xref))
  pages.append(dict(page=i+1,mediaBox=list(p.mediabox),cropBox=list(p.cropbox),width=p.rect.width,height=p.rect.height,rotation=p.rotation,widgets=widgets,text=p.get_text()))
 digest=hashlib.sha256(raw).hexdigest()
 manifest=dict(formId=id,edition=record['edition'],sha256=digest,pageCount=len(doc),bytes=len(raw),coordinateContract='one-based pages, unrotated top-left PDF points; browser converts from bottom-left MediaBox',source=record['officialUrl'],resolvedSource='https://www.dhcs.ca.gov/wp-content/uploads/2025/10/ENG-CASingleStreamApp.pdf' if id=='ccfrm604' else record['officialUrl'],acquiredOn='2026-10-04',acquisition='Official agency URL; DHCS fetched with isolated Chrome after redirect',activeContentObjects=active,pages=pages,independentReviewComplete=False)
 (ROOT/'forms/inspection'/f'{id}.json').write_text(json.dumps(manifest,indent=2)+'\n')
 record.update(templateBytesIncluded=True,templateSha256=digest,pageCount=len(doc),fieldGeometryStatus='inspected_mapping_pending_review',acquisitionDate='2026-10-04',resolvedSource=manifest['resolvedSource'])
 print(id,'pages',len(doc),'widgets',sum(len(p['widgets']) for p in pages),'active objects',len(active),digest)
(ROOT/'forms/registry.json').write_text(json.dumps(registry,indent=2)+'\n')
