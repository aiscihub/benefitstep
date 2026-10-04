"""Compare every generated page with the exact official original outside authorized areas."""
import fitz,json,hashlib
from PIL import Image,ImageChops,ImageDraw
from pathlib import Path
R=Path(__file__).resolve().parents[1];results=[]
for id in ['cf285','ccfrm604']:
 original=fitz.open(R/f'forms/templates/{id}.pdf');m=json.loads((R/f'forms/maps/{id}.json').read_text())
 baseline=[]
 for p in original:
  pix=p.get_pixmap();baseline.append(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))
 for reportfile in sorted((R/'forms/validation').glob(id+'-*.report.json')):
  report=json.loads(reportfile.read_text());output=fitz.open(str(reportfile).replace('.report.json','.pdf'));assert len(output)==len(original)
  pages=[]
  for i,p in enumerate(output):
   pix=p.get_pixmap();im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);diff=ImageChops.difference(baseline[i],im).convert('L');draw=ImageDraw.Draw(diff);draw.rectangle((0,0,612,17),fill=0)
   for op in report['written']:
    if op['page']==i+1:
     a=op['rect'];draw.rectangle((a[0]-2,a[1]-2,a[2]+2,a[3]+2),fill=0)
   hist=diff.histogram();pixels=sum(hist[8:]);pages.append(dict(page=i+1,outsideChangedPixels=pixels))
  result=dict(fixture=reportfile.name.replace('.report.json',''),pageCount=len(output),outsideFieldsPassed=all(p['outsideChangedPixels']==0 for p in pages),pages=pages)
  results.append(result);print(result['fixture'],sum(p['outsideChangedPixels'] for p in pages),'unexpected pixels')
  if reportfile.name==id+'-one-person.report.json':
   thumbs=[]
   for p in output:
    pix=p.get_pixmap(matrix=fitz.Matrix(.4,.4));thumb=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);thumbs.append(thumb)
   sheet=Image.new('RGB',(5*245,((len(thumbs)+4)//5)*337),'#ddd');draw=ImageDraw.Draw(sheet)
   for j,im in enumerate(thumbs):x=(j%5)*245;y=(j//5)*337;sheet.paste(im,(x,y));draw.text((x+5,y+317),f'{id}: PDF page {j+1}',fill='black')
   sheet.save(R/f'forms/validation/{id}-all-pages.png')
 summary={id:hashlib.sha256((R/f'forms/templates/{id}.pdf').read_bytes()).hexdigest() for id in ['cf285','ccfrm604']}
(R/'forms/validation/pixel-comparison.json').write_text(json.dumps(dict(results=results,originalHashes=summary,independentHumanReview=False,method='PyMuPDF 1.26.5 at 72dpi; mask written widget rectangles with 2-point allowance and test-only top margin; tolerance >7 grayscale levels'),indent=2)+'\n')
