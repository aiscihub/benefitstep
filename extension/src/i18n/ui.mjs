import {UI_ES_RENEWAL} from './ui-es-renewal.mjs';
import {createLanguagePreferences,changeUiLocale} from './benefitstep-i18n.mjs';
import {UI_ZH} from './ui-zh.mjs';
import {UI_ZH_HANT} from './ui-zh-hant.mjs';
import {UI_VI} from './ui-vi.mjs';
import {UI_TEXT,UI_KEYS} from './ui-catalog.mjs';
let preferences=createLanguagePreferences();
export const uiLocale=()=>preferences.uiLocale;
export const languagePreferences=()=>structuredClone(preferences);
export function setUiLocale(locale){const parsed=new Intl.Locale(locale);
 // The supplied language module accepts English and Spanish only; the other interface languages are set here.
 if(parsed.language==='zh') preferences={...preferences,uiLocale:parsed.script==='Hant'||(parsed.script!=='Hans'&&['TW','HK','MO'].includes(parsed.region))?'zh-TW':'zh-CN'};
 else if(parsed.language==='vi') preferences={...preferences,uiLocale:'vi-VN'};
 else preferences=changeUiLocale(preferences,locale);}
const CATALOG={'es-US':text=>UI_ES_RENEWAL[text]??UI_TEXT[text],'zh-CN':text=>UI_ZH[text],'zh-TW':text=>UI_ZH_HANT[text],'vi-VN':text=>UI_VI[text]};
const REVIEW_NOTICE={
 'es-US':'Vista previa en español: traducciones sin revisión independiente. Algunas explicaciones y los formularios oficiales siguen en inglés. Sus respuestas no se traducen ni cambian.',
 'zh-CN':'简体中文预览：译文尚未经独立审校。部分详细说明和官方表格仍为英语。您的回答不会被翻译或更改。',
 'zh-TW':'繁體中文預覽：譯文尚未經獨立審校。部分詳細說明和官方表格仍為英文。您的回答不會被翻譯或更改。',
 'vi-VN':'Bản xem trước tiếng Việt: bản dịch chưa được thẩm định độc lập. Một số phần giải thích và các mẫu đơn chính thức vẫn bằng tiếng Anh. Câu trả lời của quý vị không bị dịch hay thay đổi.'};
// Call only for trusted UI strings. Never pass filenames, original text or answers.
export function tr(text,params={}){
 const template=CATALOG[preferences.uiLocale]?.(text)??text;
 return String(template).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(match,key)=>Object.hasOwn(params,key)?String(params[key]):match);
}
export function applyUiLanguage(root=document){
 for(const el of root.querySelectorAll('[data-i18n]')){
  const source=UI_KEYS[el.dataset.i18n];if(source)el.textContent=tr(source);
 }
 if(root===document){
  document.documentElement.lang=uiLocale();
  const select=document.querySelector('#interface-language');if(select)select.value=uiLocale();
  const notice=document.querySelector('#translation-review-notice');
  if(notice){notice.hidden=uiLocale()==='en-US';notice.textContent=REVIEW_NOTICE[uiLocale()]??'';}
 }
}
