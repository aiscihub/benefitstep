import {createLanguagePreferences,changeUiLocale} from './benefitstep-i18n.mjs';
import {UI_ZH} from './ui-zh.mjs';
import {UI_TEXT,UI_KEYS} from './ui-catalog.mjs';
let preferences=createLanguagePreferences();
export const uiLocale=()=>preferences.uiLocale;
export const languagePreferences=()=>structuredClone(preferences);
export function setUiLocale(locale){const parsed=new Intl.Locale(locale);
 if(parsed.language==='zh'&&parsed.script!=='Hant'&&!['TW','HK','MO'].includes(parsed.region)) preferences={...preferences,uiLocale:'zh-CN'};
 else preferences=changeUiLocale(preferences,locale);}
// Call only for trusted UI strings. Never pass filenames, original text or answers.
export function tr(text,params={}){
 const template=preferences.uiLocale==='es-US'?(UI_TEXT[text]??text):preferences.uiLocale==='zh-CN'?(UI_ZH[text]??text):text;
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
  if(notice){notice.hidden=uiLocale()==='en-US';notice.textContent=uiLocale()==='zh-CN'?'简体中文预览：译文尚未经独立审校。部分详细说明和官方表格仍为英语。您的回答不会被翻译或更改。':'Vista previa en español: traducciones sin revisión independiente. Algunas explicaciones y los formularios oficiales siguen en inglés. Sus respuestas no se traducen ni cambian.';}
 }
}
