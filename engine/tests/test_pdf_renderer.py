"""Only synthetic fixtures. This suite does not validate any official form map."""
import copy, hashlib, importlib.util, json, tempfile, unittest
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pdf_template',ROOT/'tools/pdf_template.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

class PDFTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory();cls.dir=Path(cls.temp.name);cls.template=cls.dir/'fixture.pdf'
  d=fitz.open();p=d.new_page(width=612,height=792)
  p.insert_text((40,40),'SYNTHETIC TEST - NOT AN OFFICIAL APPLICATION',fontsize=14)
  p.insert_text((40,80),'Name:');p.draw_rect(fitz.Rect(40,90,350,120))
  p.insert_text((40,160),'Confirmed address:');w=fitz.Widget();w.field_name='address_fixture';w.field_type=fitz.PDF_WIDGET_TYPE_TEXT;w.rect=fitz.Rect(40,170,350,200);w.text_fontsize=10;p.add_widget(w)
  p.insert_text((40,240),'Applicant signature (leave blank):');p.draw_rect(fitz.Rect(40,250,350,280))
  p2=d.new_page(width=612,height=792);p2.insert_text((40,40),'SYNTHETIC TEST - RETAIN ALL ORIGINAL PAGES',fontsize=14)
  d.save(cls.template);d.close()
  cls.sha=hashlib.sha256(cls.template.read_bytes()).hexdigest()
  cls.mapping={'formId':'synthetic','templateSha256':cls.sha,'expectedPageCount':2,'review':{'status':'approved','reviewers':['test-a','test-b'],'visualValidation':True},'bindings':[{'groupId':'contact','row':0,'field':'name','page':1,'kind':'text','rect':[40,90,350,120],'fontSize':11,'maxLength':100},{'groupId':'contact','row':0,'field':'address','page':1,'kind':'text','rect':[40,170,350,200],'widget':'address_fixture','fontSize':10,'maxLength':200}],'protectedRegions':[{'page':1,'rect':[40,250,350,280],'reason':'signature'}]}
  cls.plan={'formId':'synthetic','templateSha256':cls.sha,'pageCount':2,'canRender':True,'exportAuthorized':True,'operations':[{**cls.mapping['bindings'][0],'text':'Jordan Example','answerRevision':1,'sourceIds':['synthetic']},{**cls.mapping['bindings'][1],'text':'100 Example Street','answerRevision':1,'sourceIds':['synthetic']}],'status':'partial_unsigned_draft','missing':[],'manualActions':[{'text':'Sign manually'}]}
 def run_fill(self,m=None,p=None,out=None):return mod.render(self.template,m or copy.deepcopy(self.mapping),p or copy.deepcopy(self.plan),out or self.dir/'out.pdf')
 def test_01_inspection(self):
  x=mod.inspect(self.template);self.assertEqual(x['pageCount'],2);self.assertEqual(x['sha256'],self.sha);self.assertEqual(x['pages'][0]['widgets'][0]['name'],'address_fixture')
 def test_02_render_preserves_pages_and_template(self):
  r=self.run_fill();self.assertEqual(r['pages'],2);self.assertFalse(r['submitted']);self.assertFalse(r['signatureApplied']);self.assertEqual(hashlib.sha256(self.template.read_bytes()).hexdigest(),self.sha)
  d=fitz.open(self.dir/'out.pdf');self.assertIn('Jordan Example',d[0].get_text());self.assertEqual(next(d[0].widgets()).field_value,'100 Example Street');d.close()
 def test_03_hash_mismatch(self):
  m=copy.deepcopy(self.mapping);m['templateSha256']='0'*64
  with self.assertRaisesRegex(ValueError,'SHA256'):self.run_fill(m=m)
 def test_04_unreviewed(self):
  m=copy.deepcopy(self.mapping);m['review']['status']='draft'
  with self.assertRaisesRegex(ValueError,'review'):self.run_fill(m=m)
 def test_05_no_authorization(self):
  p=copy.deepcopy(self.plan);p['exportAuthorized']=False
  with self.assertRaisesRegex(ValueError,'authorized'):self.run_fill(p=p)
 def test_06_empty_operations(self):
  p=copy.deepcopy(self.plan);p['operations']=[]
  with self.assertRaisesRegex(ValueError,'No confirmed'):self.run_fill(p=p)
 def test_07_original_never_overwritten(self):
  with self.assertRaisesRegex(ValueError,'overwritten'):self.run_fill(out=self.template)
 def test_08_unknown_geometry(self):
  p=copy.deepcopy(self.plan);p['operations'][0]['rect']=[0,0,100,100]
  with self.assertRaisesRegex(ValueError,'reviewed binding'):self.run_fill(p=p)
 def test_09_protected_area(self):
  m=copy.deepcopy(self.mapping);m['protectedRegions'][0]['rect']=[40,90,350,120]
  with self.assertRaisesRegex(ValueError,'protected'):self.run_fill(m=m)
 def test_10_no_unicode_corruption(self):
  p=copy.deepcopy(self.plan);p['operations'][0]['text']='Name \u6c49'
  with self.assertRaisesRegex(ValueError,'Unicode'):self.run_fill(p=p)
 def test_11_no_truncation(self):
  p=copy.deepcopy(self.plan);p['operations'][0]['text']='a'*101
  with self.assertRaisesRegex(ValueError,'overlong'):self.run_fill(p=p)
 def test_12_widget_overflow(self):
  p=copy.deepcopy(self.plan);p['operations'][1]['text']='W'*150
  with self.assertRaisesRegex(ValueError,'overflow'):self.run_fill(p=p)
 def test_13_wrong_form(self):
  p=copy.deepcopy(self.plan);p['formId']='cf285'
  with self.assertRaisesRegex(ValueError,'authorized'):self.run_fill(p=p)
 def test_14_wrong_pages(self):
  p=copy.deepcopy(self.plan);p['pageCount']=1
  with self.assertRaisesRegex(ValueError,'page count'):self.run_fill(p=p)
 def test_15_one_reviewer(self):
  m=copy.deepcopy(self.mapping);m['review']['reviewers']=['same','same']
  with self.assertRaisesRegex(ValueError,'review'):self.run_fill(m=m)
 def test_16_blank_text(self):
  p=copy.deepcopy(self.plan);p['operations'][0]['text']=''
  with self.assertRaisesRegex(ValueError,'Invalid'):self.run_fill(p=p)
 def test_17_requires_visual_review(self):
  m=copy.deepcopy(self.mapping);m['review']['visualValidation']=False
  with self.assertRaisesRegex(ValueError,'review'):self.run_fill(m=m)
 def test_18_publishes_synthetic_qa_fixture(self):
  dest=ROOT/'tests/fixtures';dest.mkdir(exist_ok=True);(dest/'synthetic_template.pdf').write_bytes(self.template.read_bytes());m=copy.deepcopy(self.mapping);p=copy.deepcopy(self.plan)
  (dest/'synthetic_mapping.json').write_text(json.dumps(m,indent=2));(dest/'synthetic_plan.json').write_text(json.dumps(p,indent=2));self.run_fill(m=m,p=p,out=dest/'synthetic_filled.pdf');d=fitz.open(dest/'synthetic_filled.pdf');qa=self.dir/'pdf_qa';qa.mkdir(exist_ok=True)
  for i,page in enumerate(d):page.get_pixmap(matrix=fitz.Matrix(1.3,1.3)).save(qa/f'page-{i+1}.png')
  d.close()
 @classmethod
 def tearDownClass(cls):cls.temp.cleanup()
if __name__=='__main__':unittest.main(verbosity=2)
