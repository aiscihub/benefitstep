"""Build a Chrome Web Store upload ZIP from the already-built extension (macOS)."""
import hashlib,json,shutil,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VERSION='0.3.1'
OUT=ROOT/'releases'/('chrome-store-'+VERSION)
STAGE=OUT/'unpacked'
OUT.mkdir(parents=True,exist_ok=True)
if STAGE.exists():shutil.rmtree(STAGE)
shutil.copytree(ROOT/'extension',STAGE)
m=json.loads((STAGE/'manifest.json').read_text())
m.update(name='BenefitStep — Benefits Application Helper',version=VERSION,description='Prepare CalFresh and Medi-Cal application drafts with local document review, evidence checks, and PDF downloads.')
assert len(m['description'])<=132
icons=STAGE/'assets/icons';icons.mkdir(exist_ok=True)
for size in [16,32,48,128]:
 subprocess.run(['sips','-z',str(size),str(size),str(ROOT/'assets/benefitstep_small_dark.png'),'--out',str(icons/f'icon-{size}.png')],check=True,capture_output=True)
m['icons']={str(s):f'assets/icons/icon-{s}.png' for s in [16,32,48,128]}
m['action']['default_icon']={str(s):m['icons'][str(s)] for s in [16,32]}
(STAGE/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
# Dev-only fictional renderer route and fixtures are not part of the store UI.
for rel in ['assets/form-preview.html','src/form-preview.mjs','forms/fixtures']:
 p=STAGE/rel
 if p.is_dir():shutil.rmtree(p)
 elif p.exists():p.unlink()
archive=OUT/f'benefitstep-{VERSION}-chrome-store.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(STAGE.rglob('*')):
  if p.is_file() and p.name!='.DS_Store':z.write(p,p.relative_to(STAGE))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 assert 'manifest.json' in z.namelist()
 assert not any('/node_modules/' in p or p.startswith(('tests/','ml/')) for p in z.namelist())
listing=OUT/'store-assets';listing.mkdir(exist_ok=True)
shutil.copy2(icons/'icon-128.png',listing/'icon-128.png')
for p in (ROOT/'store').iterdir():
 if p.is_file():shutil.copy2(p,listing/p.name)
checksum=hashlib.sha256(archive.read_bytes()).hexdigest()
(OUT/'SHA256SUMS.txt').write_text(checksum+'  '+archive.name+'\n')
(OUT/'package-validation.json').write_text(json.dumps({'version':VERSION,'archive':archive.name,'bytes':archive.stat().st_size,'sha256':checksum,'manifestAtRoot':True,'permissions':m['permissions'],'productionApprovalClaimed':False},indent=2)+'\n')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':checksum},indent=2))
