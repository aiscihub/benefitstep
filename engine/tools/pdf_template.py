#!/usr/bin/env python3
"""Local PDF inspector and hash-bound renderer. No network operations.
Install: python -m pip install PyMuPDF
Commands: inspect FILE --out manifest.json; render TEMPLATE --map MAP --plan PLAN --out OUTPUT
Geometry is PDF points, top-left origin, one-based pages. Never edits the input file.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, tempfile
from pathlib import Path
import fitz
MAX_BYTES = 50 * 1024 * 1024

def load_json(path):
    p=Path(path)
    if p.stat().st_size>10_000_000: raise ValueError('JSON size limit exceeded')
    return json.loads(p.read_text())

def open_template(path):
    p=Path(path)
    if p.stat().st_size>MAX_BYTES: raise ValueError('PDF exceeds supported 50 MiB limit')
    raw=p.read_bytes()
    if not raw.startswith(b'%PDF-'): raise ValueError('Not a PDF file')
    doc=fitz.open(stream=raw,filetype='pdf')
    if doc.needs_pass: raise ValueError('Unlock PDF locally before importing; password handling is not implemented')
    if doc.page_count>200 or doc.xref_length()>100000: raise ValueError('PDF complexity limit exceeded')
    # This is defense in depth, not a full malicious-PDF security audit.
    for i in range(1,doc.xref_length()):
        obj=doc.xref_object(i,compressed=False)
        if re.search(r'/(JavaScript|JS|Launch|RichMedia)\b',obj):
            raise ValueError('Active PDF content requires a separate security review')
    for page in doc:
        for w in page.widgets() or []:
            if w.field_type==fitz.PDF_WIDGET_TYPE_SIGNATURE and w.field_value:
                raise ValueError('Do not modify an already signed PDF')
    return raw,doc

def inspect(path):
    raw,doc=open_template(path)
    pages=[]
    for i,page in enumerate(doc):
        ws=[]
        for w in page.widgets() or []:
            ws.append(dict(name=w.field_name,type=w.field_type_string,rect=list(w.rect),value=w.field_value,readonly=bool(w.field_flags&1),choices=w.choice_values,buttonStates=w.button_states()))
        pages.append(dict(page=i+1,width=page.rect.width,height=page.rect.height,rotation=page.rotation,widgets=ws,textExcerpt=page.get_text()[:1200]))
    out=dict(schemaVersion='1.0',sha256=hashlib.sha256(raw).hexdigest(),pageCount=doc.page_count,pages=pages,reviewStatus='unreviewed',note='Field names and rectangles come from these exact bytes. Inspect rendered pages and assign semantic bindings; no automatic matching by similar labels.')
    doc.close();return out

def rect_ok(rect,page):
    if not isinstance(rect,list) or len(rect)!=4 or any(type(n) not in [int,float] for n in rect):raise ValueError('Invalid rectangle')
    r=fitz.Rect(rect)
    if r.is_empty or r.is_infinite or r.x0<0 or r.y0<0 or r.x1>page.rect.width or r.y1>page.rect.height:raise ValueError('Rectangle outside page')
    return r

def render(template,mapping,plan,out):
    raw,doc=open_template(template)
    digest=hashlib.sha256(raw).hexdigest()
    review=mapping.get('review',{})
    if review.get('status')!='approved' or review.get('visualValidation') is not True or len(set(review.get('reviewers',[])))<2:raise ValueError('Mapping requires independent review and visual validation')
    if digest!=mapping.get('templateSha256') or digest!=plan.get('templateSha256'):raise ValueError('Template SHA256 mismatch')
    if doc.page_count!=mapping.get('expectedPageCount') or doc.page_count!=plan.get('pageCount'):raise ValueError('Template page count mismatch')
    if plan.get('formId')!=mapping.get('formId') or plan.get('canRender') is not True or plan.get('exportAuthorized') is not True:raise ValueError('Export not authorized for this reviewed mapping')
    if not plan.get('operations'):raise ValueError('No confirmed mapped answers to render')
    if Path(template).resolve()==Path(out).resolve():raise ValueError('Original template cannot be overwritten')
    protected=mapping.get('protectedRegions',[])
    bindings=mapping.get('bindings',[])
    written=[]
    for op in plan['operations']:
        keys=['groupId','row','field','page','rect','kind','widget']
        matches=[b for b in bindings if all(b.get(k)==op.get(k) for k in keys)]
        if len(matches)!=1:raise ValueError('Operation does not match exactly one reviewed binding')
        b=matches[0]
        if re.search(r'(signature|certification|county_only)',b['groupId'],re.I):raise ValueError('Protected signature or staff group')
        idx=op['page']-1
        if not 0<=idx<doc.page_count:raise ValueError('Invalid page')
        page=doc[idx]
        if page.rotation!=0:raise ValueError('Rotated page requires separately calibrated mapping')
        rect=rect_ok(op['rect'],page)
        for z in protected:
            if z['page']==op['page'] and rect.intersects(fitz.Rect(z['rect'])):raise ValueError('Operation overlaps protected signature/staff area')
        text=op['text']
        if not isinstance(text,str) or not text or len(text)>b.get('maxLength',4000):raise ValueError('Invalid/overlong text; never truncate')
        if any(ord(c)>126 or (ord(c)<32 and c not in '\n\t') for c in text):raise ValueError('A reviewed local Unicode-font path is required for this text; no transliteration or dropped glyphs')
        if op.get('widget'):
            ws=[w for w in page.widgets() or [] if w.field_name==op['widget']]
            if len(ws)!=1:raise ValueError('Widget ambiguous or not found on mapped page')
            w=ws[0]
            if w.field_flags&1 or w.field_type==fitz.PDF_WIDGET_TYPE_SIGNATURE:raise ValueError('Read-only/signature widget')
            if any(abs(x-y)>.05 for x,y in zip(w.rect,rect)):raise ValueError('Widget geometry changed')
            if w.field_type==fitz.PDF_WIDGET_TYPE_TEXT:
                if w.text_maxlen and len(text)>w.text_maxlen:raise ValueError('Widget character capacity exceeded')
                fs=b.get('fontSize',10)
                if not 8<=fs<=20:raise ValueError('Unsupported widget font size')
                if not (w.field_flags & 4096) and ('\n' in text or fitz.get_text_length(text,fontname='helv',fontsize=fs)>rect.width-4):raise ValueError('Widget text would overflow; no clipping')
                if w.field_flags & 4096:
                    probe=fitz.open();probe_page=probe.new_page(width=page.rect.width,height=page.rect.height)
                    spare=probe_page.insert_textbox(rect,text,fontname='helv',fontsize=fs)
                    probe.close()
                    if spare<0:raise ValueError('Multiline widget text would overflow')
                w.field_value=text;w.text_fontsize=fs;w.update()
            elif w.field_type==fitz.PDF_WIDGET_TYPE_CHECKBOX:
                if text!='X':raise ValueError('Checkbox expects explicit mapped X')
                w.field_value=w.on_state();w.update()
            else:raise ValueError('Widget type not supported by this renderer; use reviewed overlay')
        else:
            fs=b.get('fontSize',10)
            if not 8<=fs<=20:raise ValueError('Unsupported font size')
            spare=page.insert_textbox(rect,text,fontname='helv',fontsize=fs,color=(0,0,0),overlay=True)
            if spare<0:raise ValueError('Text does not fit: expand an approved continuation route; do not truncate')
        written.append(dict(groupId=op['groupId'],row=op['row'],field=op['field'],page=op['page']))
    output=Path(out);output.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(suffix='.pdf',dir=output.parent);os.close(fd)
    try:
        doc.save(tmp,garbage=3,deflate=True);doc.close()
        verify=fitz.open(tmp)
        if verify.page_count!=mapping['expectedPageCount']:raise ValueError('Output lost original pages')
        verify.close();os.replace(tmp,output)
    finally:
        if os.path.exists(tmp):os.remove(tmp)
    return dict(formId=plan['formId'],templateSha256=digest,outputSha256=hashlib.sha256(output.read_bytes()).hexdigest(),pages=mapping['expectedPageCount'],written=written,status=plan['status'],missing=plan['missing'],manualActions=plan['manualActions'],submitted=False,signatureApplied=False,officialRenderingIndependentlyValidated=False)

def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='cmd',required=True)
    i=sub.add_parser('inspect');i.add_argument('pdf');i.add_argument('--out',required=True)
    r=sub.add_parser('render');r.add_argument('pdf');r.add_argument('--map',required=True);r.add_argument('--plan',required=True);r.add_argument('--out',required=True)
    a=p.parse_args()
    try:
        if a.cmd=='inspect':result=inspect(a.pdf);Path(a.out).write_text(json.dumps(result,indent=2)+'\n')
        else:result=render(a.pdf,load_json(a.map),load_json(a.plan),a.out);Path(a.out+'.report.json').write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps({'ok':True,'command':a.cmd,'output':a.out}))
    except (ValueError,KeyError,TypeError,OSError,RuntimeError) as e:
        p.exit(1,f'PDF operation stopped: {e}\n')
if __name__=='__main__':main()
