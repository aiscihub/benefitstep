import json,hashlib,shutil
from pathlib import Path
r=Path(__file__).resolve().parents[1];dep=Path('/private/tmp/benefitstep-pdf-deps/node_modules');lic=r/'vendor/pdf-writer/licenses';lic.mkdir(exist_ok=True)
packages=[]
for pkg in dep.glob('**/package.json'):
 try:j=json.loads(pkg.read_text())
 except:continue
 if '/node_modules/' not in str(pkg):continue
 name=j.get('name');version=j.get('version')
 if not name or not version:continue
 key=name.replace('/','_').replace('@','');files=[]
 for item in pkg.parent.iterdir():
  if item.is_file() and item.name.lower().startswith(('license','licence','copying','notice')):
   dest=f'{key}-{version}-{item.name}';shutil.copyfile(item,lic/dest);files.append(dest)
 if name=='@pdf-lib/fontkit':
  shutil.copyfile(pkg.parent/'README.md',lic/'fontkit-README.md');shutil.copyfile(pkg,lic/'fontkit-package.json')
 packages.append(dict(name=name,version=version,license=j.get('license'),licenseFiles=files))
(r/'vendor/pdf-writer/dependencies.json').write_text(json.dumps(dict(runtimeWriter='@cantoo/pdf-lib@2.7.1',fontkit='@pdf-lib/fontkit@1.1.1',font='NotoSans-Regular; SIL Open Font License 1.1',packages=packages,localChanges=['fontkit ESM import points to bundled pako.mjs','pako UMD wrapped with ESM default export; no remote imports']),indent=2)+'\n')
files={}
for folder in ['vendor/pdf-writer','engine/dist','engine/config','forms/templates','forms/maps','forms/inventory','forms/fixtures']:
 for p in sorted((r/folder).rglob('*')):
  if p.is_file():files[str(p.relative_to(r))]=hashlib.sha256(p.read_bytes()).hexdigest()
(r/'INTEGRATION_ASSETS.json').write_text(json.dumps(dict(schemaVersion=1,createdOn='2026-10-04',files=files),indent=2)+'\n')
