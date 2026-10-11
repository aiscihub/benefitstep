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
  setUiLocale('zh-Hans-TW');assert.equal(languagePreferences().uiLocale,'zh-CN');
 } finally {setUiLocale('en-US');}
});

test('Traditional Chinese and Vietnamese cover every string the Simplified Chinese catalog covers',async()=>{
 const {UI_ZH}=await import('../extension/src/i18n/ui-zh.mjs');
 const {UI_ZH_HANT}=await import('../extension/src/i18n/ui-zh-hant.mjs');
 const {UI_VI}=await import('../extension/src/i18n/ui-vi.mjs');
 const before=languagePreferences();
 const parameters=text=>[...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m=>m[1]).sort();
 try {
  for(const [locale,catalog,accepted,quick,person] of [['zh-TW',UI_ZH_HANT,['zh-Hant','zh-TW','zh-HK','zh-MO'],'快速預查','第 3 人'],['vi-VN',UI_VI,['vi','vi-VN'],'Kiểm tra nhanh','Người thứ 3']]){
   for(const tag of accepted){setUiLocale(tag);assert.deepEqual(languagePreferences(),{...before,uiLocale:locale},tag);}
   assert.equal(tr('Quick check'),quick);
   assert.equal(tr('Person {number}',{number:3}),person);
   assert.equal(tr('Untranslated explanation'),'Untranslated explanation');
   assert.deepEqual(Object.keys(catalog).sort(),Object.keys(UI_ZH).sort(),locale);
   for(const [source,translated] of Object.entries(catalog)){
    assert.ok(translated.trim()&&translated!==source,locale+': '+source);
    assert.deepEqual(parameters(translated),parameters(source),locale+': '+source);
   }
  }
  // Traditional Chinese must not fall back to Simplified wording: these words differ between the two scripts.
  for(const source of ['Your household details','Documents','Save','Download my package'])assert.notEqual(UI_ZH_HANT[source],UI_ZH[source],source);
 } finally {setUiLocale('en-US');}
});

// These screens were added after the original numbered catalog. Check their data-driven
// labels too, so a complete old catalog cannot mask a missing new workflow translation.
test('Every interface language covers renewal forms, document guidance and dynamic parameters',async()=>{
 const {UI_ZH_RENEWAL}=await import('../extension/src/i18n/ui-zh-renewal.mjs');
 const {UI_ES_RENEWAL}=await import('../extension/src/i18n/ui-es-renewal.mjs');
 const {UI_ZH_HANT}=await import('../extension/src/i18n/ui-zh-hant.mjs');
 const {UI_VI}=await import('../extension/src/i18n/ui-vi.mjs');
 const {RENEWAL_FORMS,OTHER_PAPERS}=await import('../extension/src/renewal.mjs');
 const {documentGuidance}=await import('../extension/src/document-period.mjs');
 const parameters=text=>[...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m=>m[1]).sort();
 assert.deepEqual(Object.keys(UI_ZH_RENEWAL).sort(),Object.keys(UI_ES_RENEWAL).sort());
 try {
  for(const [locale,catalog] of [['zh-CN',UI_ZH_RENEWAL],['es-US',UI_ES_RENEWAL],['zh-TW',UI_ZH_HANT],['vi-VN',UI_VI]]){
   setUiLocale(locale);
   for(const [source,translation] of Object.entries(catalog))assert.deepEqual(parameters(translation),parameters(source),source);
   const required=['What are you preparing?','New application','Renewal or periodic report',
    ...RENEWAL_FORMS.flatMap(f=>[f.name,f.label,f.when,...f.cautions,...f.papers.filter(p=>p.includes('('))]),
    ...OTHER_PAPERS.flatMap(o=>[o.text,...o.papers])];
   for(const form of ['', 'cf37','sar7b'])for(const reportMonth of ['','2026-09']){
    const g=documentGuidance({programs:new Set(['CalFresh','Medi-Cal']),renewal:{on:!!form,form,notice:{reportMonth}}},'2026-10-10');
    required.push(g.title,...g.lines,g.source);
   }
   for(const source of required)assert.notEqual(tr(source),source,locale+': '+source);
   assert.ok(tr('Read from {file}.',{file:'Income 原件.pdf'}).includes('Income 原件.pdf'));
  }
 }finally{setUiLocale('en-US');}
});
