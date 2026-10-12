// The translated official editions (Spanish, Traditional Chinese, Vietnamese). Each must be the registered state PDF,
// answer the same questions as the English form on the same pages, and take a draft in the boxes its own map names.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {PDFDocument,PDFTextField,PDFCheckBox,PDFObjectParser,PDFContext,PDFRef,PDFName} from '../extension/vendor/pdf-writer/pdf-lib.mjs';
import {renderOfficialForm} from '../extension/src/form-renderer.mjs';
import {initial,confirmFacts} from '../extension/src/state.mjs';
import {FORMS,FORM_LANGUAGES,FORM_LANGUAGE_NAME,emptyAnswers,reviseAnswer,reviseGroup,confirmApplication} from '../extension/src/form-adapter.mjs';
import {setUiLocale} from '../extension/src/i18n/ui.mjs';
import {formLanguage,formLanguageChoice} from '../extension/src/forms-ui.mjs';
const url=p=>new URL('../extension/forms/'+p,import.meta.url),read=p=>JSON.parse(fs.readFileSync(url(p))),bytes=p=>new Uint8Array(fs.readFileSync(url(p)));
const fontBytes=new Uint8Array(fs.readFileSync(new URL('../extension/vendor/pdf-writer/NotoSans-Regular.ttf',import.meta.url)));
const registry=read('registry.json'),key=b=>[b.groupId,b.field,b.row,JSON.stringify(b.optionValue)].join('|');
const editions=Object.entries(FORM_LANGUAGES).flatMap(([id,languages])=>languages.filter(l=>l!=='en').map(l=>[id,l]));
const assets=(id,language)=>{const stem=language==='en'?id:`${id}.${language}`;return {inventory:read(`inventory/${id}.json`),map:read(`maps/${stem}.json`),template:bytes(`templates/${stem}.pdf`),fontBytes};};
// A few confirmed answers for each form: text, a Yes/No pair and a row of a table.
function answers(id){
 const s=initial();confirmFacts(s);const data=emptyAnswers(id);
 const say=(groupId,field,value,row=0)=>{if(data.groups.find(g=>g.groupId===groupId)?.status!=='applicable')reviseGroup(data,groupId,'applicable',1);reviseAnswer(data,{groupId,row,field,status:'answered',value,sourceIds:['owner-entry']});};
 if(id==='cf285'){say('q1.contact','name','Jordan Example');say('q1.contact','home_address','12 Example Street');say('q1.contact','home_city','San Jose');say('q1.contact','homeless',false);
  say('q8.earned','has_income',true);say('q8.earned','person','Jordan Example');say('q8.earned','employer_name_address','Example Market');say('q8.earned','gross_received_this_month','$1,250.00');
  say('q11.housing','responsible_for_expenses',false);}
 else{say('sar.header','household_name','Jordan Example');say('sar.header','street','12 Example Street');say('sar.header','city','San Jose');say('sar.header','zip','95112');say('sar.header','case_name','Jordan Example');say('sar.header','case_number','1B2C3D4');say('sar.header','report_month','September 2026');
  say('sar.members','has_change',true);say('sar.members','name','Sam Example');say('sar.members','change','Moved In');
  say('sar.resources','has_change',true);say('sar.resources','person','Jordan Example');say('sar.resources','what_happened','Gave away');
  say('sar.utilities','insurance',true);}
 return confirmApplication(data,s);
}
const value=f=>f instanceof PDFTextField?(f.getText()??''):f instanceof PDFCheckBox?f.isChecked():null;

test('the registry and the app agree on which translated editions exist, and each has a name to show',()=>{
 for(const t of registry.templates)if(Object.hasOwn(FORMS,t.id))assert.deepEqual(['en',...(t.translations??[]).map(x=>x.language)],FORM_LANGUAGES[t.id],t.id);
 for(const [,language] of editions)assert(FORM_LANGUAGE_NAME[language],language);
});
test('every form is filled in English, whatever the interface language, until another edition is chosen',()=>{
 try{
  for(const locale of ['en-US','es-US','zh-CN','zh-TW','vi-VN']){setUiLocale(locale);assert.deepEqual(['cf285','sar7b','cf37','ccfrm604'].map(formLanguage),['en','en','en','en'],locale);}
 }finally{setUiLocale('en-US');}
});
test('the choice of edition is offered only for a form the state publishes in other languages, and starts on English',()=>{
 const html=formLanguageChoice('cf285',text=>text);
 assert.deepEqual([...html.matchAll(/<option value="([^"]+)" (selected)?/g)].map(m=>[m[1],!!m[2]]),[['en',true],['es',false],['zh-Hant',false],['vi',false]]);
 assert(html.includes('data-form-language="cf285"'));assert(formLanguageChoice('sar7b',text=>text).includes('data-form-language="sar7b"'));
 assert.equal(formLanguageChoice('cf37',text=>text),'');assert.equal(formLanguageChoice('ccfrm604',text=>text),'');
});
for(const [id,language] of editions){
 test(`${id} ${language}: the registered state PDF, with the English form's questions on the same pages`,()=>{
  const english=read(`maps/${id}.json`),{map,inventory,template}=assets(id,language);
  const record=registry.templates.find(t=>t.id===id).translations.find(x=>x.language===language),hash=createHash('sha256').update(template).digest('hex');
  assert.equal(hash,record.templateSha256);assert.equal(map.templateSha256,hash);assert.equal(map.language,language);assert.equal(map.officialUrl,record.officialUrl);
  assert.equal(map.edition,inventory.edition);assert.equal(map.expectedPageCount,english.expectedPageCount);assert.equal(map.review.status,'draft');
  const was=new Map(english.bindings.map(b=>[key(b),b])),now=new Map(map.bindings.map(b=>[key(b),b]));
  assert.deepEqual([...now.keys()].sort(),[...was.keys()].sort());
  for(const [k,b] of now){assert.equal(b.kind,was.get(k).kind,k);assert.equal(b.page,was.get(k).page,k);}
 });
 test(`${id} ${language}: a draft fills the same answers as the English form, each in the box its own map names`,async()=>{
  const confirmed=answers(id),english=await renderOfficialForm({...assets(id,'en'),answers:structuredClone(confirmed),mode:'draft'});
  const own=assets(id,language),result=await renderOfficialForm({...own,answers:structuredClone(confirmed),mode:'draft'});
  assert.equal(result.report.formLanguage,language);assert.equal(english.report.formLanguage,'en');assert.equal(result.report.pageCount,english.report.pageCount);
  assert.deepEqual(result.report.written.map(key).sort(),english.report.written.map(key).sort());assert(result.report.written.length>=9);
  const form=(await PDFDocument.load(result.bytes)).getForm(),written=new Map(result.report.written.map(op=>[op.widget,op]));
  for(const [widget,op] of written)assert.equal(value(form.getField(widget)),op.kind==='checkbox'?true:op.text,widget);
  // Nothing else on the form took a value.
  const blank=(await PDFDocument.load(own.template,{password:'',updateMetadata:false})).getForm();
  for(const f of form.getFields())if(!written.has(f.getName()))assert.deepEqual(value(f),value(blank.getField(f.getName())),f.getName());
  // The translated edition is a different file from the English one, and a wrong pairing is refused.
  await assert.rejects(renderOfficialForm({...own,template:assets(id,'en').template,answers:structuredClone(confirmed),mode:'draft'}),/SHA-256/);
 });
}
test('a protected form keeps the exact bytes of its translated labels when it is saved again',async()=>{
 // 名 is the bytes 54 0D in a PDF text string, and 0D is a carriage return; "(", ")" and "\\" turn up the same way.
 const bytes=[0xfe,0xff,0x54,0x0d,0x5c,0x0f,0x00,0x28,0x4e,0x29];
 const parser=PDFObjectParser.forBytes(new TextEncoder().encode('(locked)'),PDFContext.create());
 parser.cryptoFactory={createCipherTransform:()=>({decryptBytes:()=>Uint8Array.from(bytes)})};
 const string=parser.parseString(PDFRef.of(1,0));
 assert.deepEqual([...string.asBytes()],bytes);assert.equal(string.asString().includes('\r'),false);
 // A string that was never protected is left exactly as written.
 assert.equal(PDFObjectParser.forBytes(new TextEncoder().encode('(Name \\(first\\))'),PDFContext.create()).parseString().asString(),'Name \\(first\\)');
 // The label of the first box on the Chinese application survives the draft.
 const own=assets('cf285','zh-Hant'),result=await renderOfficialForm({...own,answers:answers('cf285'),mode:'draft'});
 const label=(await PDFDocument.load(result.bytes)).getForm().getField(own.map.bindings[0].widget).acroField.dict.get(PDFName.of('TU')).decodeText();
 assert.equal(label,'姓名（名字、中間名、姓氏）');assert.equal(own.map.bindings[0].printedLabel,label);
});
