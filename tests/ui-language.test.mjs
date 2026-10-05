import test from 'node:test';
import assert from 'node:assert/strict';
import {tr,setUiLocale,languagePreferences} from '../extension/src/i18n/ui.mjs';
import {UI_TEXT,UI_KEYS} from '../extension/src/i18n/ui-catalog.mjs';

test('interface locale preserves independent form and communication preferences',()=>{
 const before=languagePreferences();
 try {
  setUiLocale('es-US');
  assert.deepEqual(languagePreferences(),{...before,uiLocale:'es-US'});
  const copy=languagePreferences();copy.formLanguages.calfresh='es';
  assert.equal(languagePreferences().formLanguages.calfresh,'en');
 } finally {setUiLocale('en-US');}
});

test('translations preserve substituted values and fall back to the source',()=>{
 try {
  setUiLocale('es-US');
  assert.equal(tr('Quick check'),'Consulta inicial');
  assert.ok(tr('Generate {program} package ({form})',{program:'Medi-Cal',form:'CCFRM604'}).includes('CCFRM604'));
  assert.equal(tr('Untranslated explanation'),'Untranslated explanation');
  assert.ok(tr('Saved {time} · Residence self-reported',{time:'<original> $1,250.00'}).includes('<original> $1,250.00'));
 } finally {setUiLocale('en-US');}
});

test('catalog retains every parameter and annotation has a translation',()=>{
 const parameters=text=>[...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m=>m[1]).sort();
 for(const [source,translated] of Object.entries(UI_TEXT)) assert.deepEqual(parameters(translated),parameters(source),source);
 for(const source of Object.values(UI_KEYS)) assert.ok(UI_TEXT[source],source);
});


test('Simplified Chinese covers the catalog and preserves parameters and independent preferences',async()=>{
 const {UI_ZH}=await import('../extension/src/i18n/ui-zh.mjs');
 const before=languagePreferences();
 try {
  setUiLocale('zh-Hans');
  assert.deepEqual(languagePreferences(),{...before,uiLocale:'zh-CN'});
  assert.equal(tr('Quick check'),'快速预查');
  assert.equal(tr('Person {number}',{number:3}),'第 3 人');
  const parameters=text=>[...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m=>m[1]).sort();
  for(const source of Object.values(UI_KEYS)) {
   assert.ok(UI_ZH[source],source);
   assert.deepEqual(parameters(UI_ZH[source]),parameters(source),source);
  }
  assert.throws(()=>setUiLocale('zh-Hant'));
 } finally {setUiLocale('en-US');}
});
