"""Exercise draft interface locales in the installed development extension, offline."""
from pathlib import Path
import sys,tempfile,time,json,base64
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from extension_smoke import Pipe,find_chrome
LOCALE=next((code for flag,code in [('--chinese','zh-CN'),('--traditional','zh-TW'),('--vietnamese','vi-VN')] if flag in sys.argv),'es-US')
# What each interface language must show at the points checked below.
T={'es-US':dict(apply='Nueva solicitud',renew='Renovación o informe periódico',renewTitle='Prepare una renovación o un informe periódico.',noticeLoad='Importar aviso del condado',badNotice='Use un PDF o una foto JPEG o PNG',cf37='Recertificación',sar7b='Informe periódico',periodEnd='31 de octubre de 2026',reportMonth='septiembre de 2026',documents='Qué documentos agregar',quick='Consulta inicial',within='Su estimación está dentro',found='16 datos propuestos',person='Persona indicada',ready='Su paquete de preparación está listo.',pdf='Idioma del PDF oficial: inglés'),
 'zh-CN':dict(apply='新申请',renew='续期或定期报告',renewTitle='准备续期或定期报告表格。',noticeLoad='导入县政府通知',badNotice='请使用县政府文件的 PDF',cf37='资格重新认证',sar7b='定期报告',periodEnd='2026年10月31日',reportMonth='2026年9月',documents='应添加的材料',quick='快速预查',within='您的估计收入在',found='16 项提取信息',person='材料所列姓名',ready='您的申请准备材料包已就绪。',pdf='官方 PDF 语言为英语'),
 'zh-TW':dict(apply='新申請',renew='續期或定期報告',renewTitle='準備續期或定期報告表格。',noticeLoad='匯入縣政府通知',badNotice='請使用縣政府文件的 PDF',cf37='資格重新認證',sar7b='定期報告',periodEnd='2026年10月31日',reportMonth='2026年9月',documents='應新增的文件',quick='快速預查',within='您的估計收入在',found='16 項擷取資料',person='文件所列姓名',ready='您的申請準備資料包已就緒。',pdf='官方 PDF 語言為英文'),
 'vi-VN':dict(apply='Đơn xin mới',renew='Gia hạn hoặc báo cáo định kỳ',renewTitle='Chuẩn bị mẫu đơn gia hạn hoặc báo cáo định kỳ.',noticeLoad='Nhập thông báo của quận',badNotice='Hãy dùng tệp PDF',cf37='Tái chứng nhận',sar7b='Báo cáo định kỳ',periodEnd='31 tháng 10, 2026',reportMonth='tháng 9 năm 2026',documents='Nên thêm giấy tờ nào',quick='Kiểm tra nhanh',within='Thu nhập ước tính của quý vị nằm trong',found='16 thông tin đọc được',person='Người có tên trên giấy tờ',ready='Bộ hồ sơ chuẩn bị của quý vị đã sẵn sàng.',pdf='Ngôn ngữ của PDF chính thức: tiếng Anh')}[LOCALE]
with tempfile.TemporaryDirectory(prefix='benefitstep-i18n-') as tmp:
 p=Pipe(find_chrome(),tmp+'/profile',tmp+'/net.json')
 try:
  ext=p.call('Extensions.loadUnpacked',{'path':str(ROOT/'extension')})['id']
  target=p.call('Target.createTarget',{'url':f'chrome-extension://{ext}/assets/index.html'})['targetId']
  sid=p.call('Target.attachToTarget',{'targetId':target,'flatten':True})['sessionId']
  p.call('Runtime.enable',{},sid);p.call('Network.enable',{},sid)
  p.call('Network.emulateNetworkConditions',{'offline':True,'latency':0,'downloadThroughput':0,'uploadThroughput':0},sid)
  def js(code):
   result=p.call('Runtime.evaluate',{'expression':code,'returnByValue':True,'awaitPromise':True},sid,timeout=60)
   assert 'exceptionDetails' not in result,result
   return result.get('result',{}).get('value')
  def wait(code):
   for _ in range(240):
    if js(code):return
    time.sleep(.2)
   raise AssertionError(code)
  def language(value):js(f"document.getElementById('interface-language').value='{value}';document.getElementById('interface-language').dispatchEvent(new Event('change',{{bubbles:true}}))")
  wait("!!document.getElementById('residence')")
  # Exercise both application purposes and both supported renewal forms before the
  # existing questionnaire/document checks. Switching locale must preserve answers.
  language(LOCALE)
  assert js("document.querySelector('[data-action=purpose-apply]').textContent")==T['apply']
  assert js("document.querySelector('[data-action=purpose-renew]').textContent")==T['renew']
  js("document.querySelector('[data-action=purpose-renew]').click()")
  assert js("document.getElementById('page-title').textContent")==T['renewTitle']
  assert js("document.querySelector('[data-action=notice-load]').textContent")==T['noticeLoad']
  js("const dt=new DataTransfer();dt.items.add(new File(['test'],'notice.txt',{type:'text/plain'}));const el=document.getElementById('notice-file');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));")
  wait("!!document.querySelector('.renewal-read .renewal-stop')")
  assert T['badNotice'] in js("document.querySelector('.renewal-read').textContent")
  js("document.querySelector('[data-action=notice-clear]').click()")
  for form in ['cf37','sar7b']:
   js(f"document.querySelector('input[name=renewal-form][value={form}]').click()")
   js("for(const [id,value] of [['caseName','Alex 原件'],['caseNumber','CASE-0123'],['periodEnd','2026-10-31'],['reportMonth','2026-09'],['submitMonth','2026-10']]){const el=document.getElementById('renewal-'+id);if(el){el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}}")
   beforeRenewal=js("[...document.querySelectorAll('[data-renewal]')].map(el=>[el.id,el.value])")
   language('en-US');language(LOCALE)
   assert js("[...document.querySelectorAll('[data-renewal]')].map(el=>[el.id,el.value])")==beforeRenewal
   main=js("document.getElementById('main').textContent")
   assert T[form] in main
   assert T['periodEnd' if form=='cf37' else 'reportMonth'] in main
   js("document.querySelector('[data-action=renewal-continue]').click()")
   assert T['documents'] in js("document.querySelector('.document-period').textContent")
   js("document.querySelector('[data-route=quick]').click()")
  for width in [390,1280]:
   p.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False},sid)
   assert js('document.documentElement.scrollWidth<=innerWidth'),width
  Path('/private/tmp/benefitstep-renewal-'+LOCALE+'.png').write_bytes(base64.b64decode(p.call('Page.captureScreenshot',{'format':'png'},sid)['data']))
  js("document.querySelector('[data-action=purpose-apply]').click()")
  language('en-US')
  js("for(const [id,value] of [['residence','yes'],['people','3'],['income','at_or_below']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}document.querySelector('[data-action=see-results]').click()")
  original=js("Object.fromEntries(['residence','people','income','immigration'].map(id=>[id,document.getElementById(id).value]))")
  language(LOCALE)
  assert js("document.documentElement.lang")==LOCALE
  assert js("document.getElementById('page-title').textContent")==T['quick']
  assert js("document.querySelector('#quick-result').textContent").find(T['within'])>=0
  assert js("Object.fromEntries(['residence','people','income','immigration'].map(id=>[id,document.getElementById(id).value]))")==original
  for width in [390,720,1280]:
   p.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':900,'deviceScaleFactor':1,'mobile':False},sid)
   assert js('document.documentElement.scrollWidth<=innerWidth'),width
  Path('/private/tmp/benefitstep-quick-'+LOCALE+'.png').write_bytes(base64.b64decode(p.call('Page.captureScreenshot',{'format':'png'},sid)['data']))
  language('en-US');assert js("document.getElementById('page-title').textContent")=='Quick check'
  language(LOCALE)
  js("document.querySelector('#quick-result [data-action=documents]').click();document.querySelector('[data-action=ai-demo]').click()")
  wait("document.querySelector('#main').getAttribute('aria-busy')==='false'&&document.querySelectorAll('.cf-docrow').length===3")
  assert T['found'] in js("document.querySelector('.bs-processing').textContent")
  js("document.querySelector('.bs-processing [data-action=to-confirm]').click()")
  assert js("document.querySelectorAll('.review-item').length")==17
  assert js("document.querySelector('[data-review-status=confirm] h3').textContent")==T['person']
  before=js("[...document.querySelectorAll('.review-item p>strong')].map(e=>e.textContent)")
  language('en-US');assert js("[...document.querySelectorAll('.review-item p>strong')].map(e=>e.textContent)")==before
  js("document.querySelector('[data-action=confirm]').click()")
  language(LOCALE)
  assert js("document.getElementById('page-title').textContent")==T['ready']
  assert js("!document.querySelector('[data-form=cf285]').disabled")
  # The quick check is optional: Medi-Cal was not answered here, and its package is still offered because the program stays selected.
  assert js("!document.querySelector('[data-form=ccfrm604]').disabled")
  assert T['pdf'] in js("document.getElementById('main').textContent")
  # User values matching a UI phrase must never be translated.
  js("document.querySelector('[data-route=confirm]').click();document.querySelector('[data-review-status=confirm] [data-action=edit], [data-review-status=confirmed] [data-action=edit]').click()")
  js("document.getElementById('fact-value').value='Income';document.querySelector('[data-action=save-fact]').click()")
  language('en-US');language(LOCALE)
  assert js("[...document.querySelectorAll('.review-item p>strong')].some(e=>e.textContent==='Income')")
  remote=[e for e in p.events if e.get('method')=='Network.requestWillBeSent' and e['params']['request']['url'].startswith(('http:','https:'))]
  errors=[e for e in p.events if e.get('method')=='Runtime.exceptionThrown']
  assert not remote,remote;assert not errors,errors
  print(json.dumps({'languages':['en-US',LOCALE],'answersPreserved':True,'confirmationPreserved':True,'originalValuesPreserved':True,'reviewItems':17,'officialFormsRemainEnglish':True,'offline':True,'remoteRequests':len(remote),'exceptions':len(errors)}))
 finally:p.close()
