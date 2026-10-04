import {PDFDocument,PDFName,PDFDict,PDFArray,PDFTextField,PDFCheckBox,PDFDropdown,PDFRadioGroup,PDFOptionList,PDFSignature,rgb} from '../vendor/pdf-writer/pdf-lib.mjs';
import fontkit from '../vendor/pdf-writer/fontkit.mjs';
import {prepareForm} from '../engine/dist/forms.js';
import {stableStringify} from '../engine/dist/engine.js';
import {sha256} from '../shared/core/crypto.mjs';
const assert=(v,m)=>{if(!v)throw Error(m);};
const near=(a,b)=>Math.abs(a-b)<.06;
const overlap=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
export function releasedMap(map){return map.review.status==='approved'&&map.review.visualValidation===true&&new Set(map.review.reviewers.filter(x=>typeof x==='string'&&x.trim())).size>=2&&map.coverageComplete===true;}
export function formPlan(inventory,map,answers){const plan=prepareForm(inventory,map,answers);plan.canRender=plan.canRender&&releasedMap(map);if(!releasedMap(map))plan.status='template_mapping_review_required';return plan;}
function fits(text,font,size,rect,multiline){
 if([...text].some(c=>!font.getCharacterSet().includes(c.codePointAt(0))&&c!=='\n'))return 'unsupported_characters';
 // Complex shaping/RTL needs its own reviewed font/layout path. Preserve it in the report.
 if(/[\u0590-\u08ff\u0900-\u109f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/u.test(text))return 'unsupported_script_layout';
 const width=rect[2]-rect[0]-4,height=rect[3]-rect[1]-2;
 if(!multiline&&text.includes('\n'))return 'multiline_not_supported';
 let lines=0;for(const para of text.split('\n')){let line='';for(const word of para.split(' ')){if(font.widthOfTextAtSize(word,size)>width)return 'text_overflow';const next=line?line+' '+word:word;if(font.widthOfTextAtSize(next,size)>width){lines++;line=word;}else line=next;}lines++;}
 if(!multiline&&lines>1)return 'text_overflow';
 if((lines-1)*size*1.2+font.heightAtSize(size,{descender:false})>height)return 'text_overflow';return null;
}
export async function renderOfficialForm({template,inventory,map,answers,fontBytes,mode='released',fixtureId,fixtureHash,signal}){
 const check=()=>{if(signal?.aborted)throw new DOMException('Cancelled','AbortError');};check();
 assert(['released','developer','draft'].includes(mode),'Invalid renderer mode');
 assert(template instanceof Uint8Array&&template.length>0&&template.length<=10*1024*1024,'Template exceeds 10 MiB limit');
 assert(await sha256(template)===map.templateSha256,'Template SHA-256 mismatch');
 assert(map.edition===inventory.edition,'Template edition mismatch');
 const plan=formPlan(inventory,map,answers);
 assert(answers.exportAuthorized===true,'Export has not been authorized');
 if(mode==='released')assert(releasedMap(map)&&plan.canRender,'Official PDF export awaits independent mapping review');
 else if(mode==='developer') {
  assert(fixtureId&&map.developerFixtures?.[fixtureId]===fixtureHash,'Unknown developer fixture');
  assert(await sha256(new TextEncoder().encode(stableStringify(answers)))===fixtureHash,'Developer preview accepts registered fictional fixtures only');
 }
 if(mode==='draft'){
  assert(answers.answers.every(a=>a.confirmedRevision===a.revision)&&answers.groups.every(g=>g.confirmedRevision===g.revision),'Review and confirm all application answers before generating a draft');
 }
 assert(plan.operations.length>0,'No confirmed mapped answers are available');check();
 const doc=await PDFDocument.load(template.slice(),{updateMetadata:false,throwOnInvalidObject:false,password:''});
 assert(!doc.context.trailerInfo.Encrypt,'Template could not be opened with its empty public password');assert(doc.getPageCount()===map.expectedPageCount,'Page count mismatch');
 assert(doc.context.enumerateIndirectObjects().length<=30000,'Template complexity limit exceeded');
 const form=doc.getForm();assert(!form.hasXFA(),'XFA is not supported; complete this form manually');
 for(const f of form.getFields())assert(!(f instanceof PDFSignature&&f.acroField.dict.get(PDFName.of('V'))),'Already signed PDF cannot be modified');
 const perms=doc.catalog.lookupMaybe(PDFName.of('Perms'),PDFDict);
 assert(!perms?.has(PDFName.of('DocMDP')),'Certified PDF cannot be modified');
 // The hash-pinned CF285 original contains Adobe Reader usage rights, not an applicant signature.
 if(perms){assert(inventory.id==='cf285'&&perms.keys().every(k=>k.toString()==='/UR3'),'Unrecognized signature permissions');doc.catalog.delete(PDFName.of('Perms'));}
 for(const [,obj] of doc.context.enumerateIndirectObjects())if(obj instanceof PDFDict)assert(!obj.has(PDFName.of('ByteRange')),'Already signed PDF cannot be modified');
 const pages=doc.getPages();
 for(let i=0;i<pages.length;i++){
  const p=pages[i],g=map.geometry[i],m=p.getMediaBox(),c=p.getCropBox();
  assert(g&&g.page===i+1&&p.getRotation().angle===g.rotation&&g.rotation===0,'Rotation or geometry mismatch');
  assert([m.x,m.y,m.x+m.width,m.y+m.height].every((n,j)=>near(n,g.mediaBox[j]))&&[c.x,c.y,c.x+c.width,c.y+c.height].every((n,j)=>near(n,g.cropBox[j])),'CropBox/MediaBox mismatch');
  assert(m.x===0&&m.y===0&&c.x===0&&c.y===0&&m.width===c.width&&m.height===c.height,'Nonzero crop origin needs separately calibrated mapping');
 }
 doc.registerFontkit(fontkit);const font=await doc.embedFont(fontBytes,{subset:true});
 const problems=[...plan.missing],written=[],touched=new Set();
 for(const op of plan.operations){check();
  const binding=map.bindings.find(b=>b.groupId===op.groupId&&b.row===op.row&&b.field===op.field&&b.widget===op.widget&&b.page===op.page);
  assert(binding&&stableStringify(binding.rect)===stableStringify(op.rect),'Operation does not match binding');
  const page=pages[op.page-1],r=op.rect;
  assert(r.every(Number.isFinite)&&r[0]>=0&&r[1]>=0&&r[2]<=page.getWidth()&&r[3]<=page.getHeight()&&r[2]>r[0]&&r[3]>r[1],'Out-of-bounds field');
  assert(!map.protectedRegions.some(z=>z.page===op.page&&overlap(r,z.rect)),'Protected region overlap');
  assert(!touched.has(op.widget),'Multiple values target one widget');
  const f=form.getField(op.widget);assert(!f.isReadOnly()&&!(f instanceof PDFSignature),'Protected field');
  const widgets=f.acroField.getWidgets();assert(widgets.length===1,'Shared widget names require an explicit repeat mapping');
  const w=widgets[0],wr=w.getRectangle(),top=[Math.min(wr.x,wr.x+wr.width),Math.min(page.getHeight()-wr.y-wr.height,page.getHeight()-wr.y),Math.max(wr.x,wr.x+wr.width),Math.max(page.getHeight()-wr.y-wr.height,page.getHeight()-wr.y)];
  assert(top.every((n,j)=>near(n,r[j])),'Widget geometry mismatch');
  // Some official rectangles are stored with reversed corners. Normalize only their ordering.
  if(wr.width<0||wr.height<0)w.setRectangle({x:r[0],y:page.getHeight()-r[3],width:r[2]-r[0],height:r[3]-r[1]});
  const pageAnnots=page.node.Annots();assert(pageAnnots?.asArray().some(ref=>doc.context.lookup(ref)===w.dict),'Widget is on another page');
  if(f instanceof PDFTextField){
   const size=binding.fontSize;assert(size>=8&&size<=14,'Unreadable font size');
   const issue=fits(op.text,font,size,r,binding.multiline)||((f.getMaxLength()&&op.text.length>f.getMaxLength())?'text_overflow':null);
   if(issue){problems.push({groupId:op.groupId,row:op.row,field:op.field,reason:issue,value:op.text});continue;}
   f.setFontSize(size);f.setText(op.text);f.updateAppearances(font);
  }else if(f instanceof PDFCheckBox){
   assert(op.kind==='checkbox'&&binding.optionValue!==undefined,'Checkbox needs an explicit option binding');
   assert(w.getOnValue()?.decodeText()===binding.exportValue,'Checkbox export value mismatch');f.check();
  }else if(f instanceof PDFDropdown||f instanceof PDFOptionList||f instanceof PDFRadioGroup){
   assert(f.getOptions().includes(op.text),'Unknown choice option');f.select(op.text);f.updateAppearances(font);
  }else {problems.push({groupId:op.groupId,row:op.row,field:op.field,reason:'unsupported_widget_type'});continue;}
  touched.add(op.widget);written.push(op);
 }
 assert(written.length,'All answers require manual completion; no text was discarded');
 // Official PDFs include validation/formatting JavaScript. Remove executable actions
 // in the generated copy only; printed content and immutable originals remain intact.
 let removedActions=0;
 for(const [,obj] of doc.context.enumerateIndirectObjects())if(obj instanceof PDFDict){
  for(const key of ['AA','OpenAction'])if(obj.has(PDFName.of(key))){obj.delete(PDFName.of(key));removedActions++;}
  const action=doc.context.lookup(obj.get(PDFName.of('A')));
  if(action instanceof PDFDict&&action.get(PDFName.of('S'))?.toString()!=='/URI'){obj.delete(PDFName.of('A'));removedActions++;}
  if(obj.has(PDFName.of('JS'))){obj.delete(PDFName.of('JS'));removedActions++;}
  if(obj.has(PDFName.of('JavaScript'))){obj.delete(PDFName.of('JavaScript'));removedActions++;}
 }
 if(mode==='developer')for(const page of pages)page.drawText('FICTIONAL TEST ONLY - DO NOT SUBMIT',{x:16,y:page.getHeight()-12,size:8,font,color:rgb(.7,0,0)});
 if(mode==='draft')for(const page of pages)page.drawText(answers.demoFixture?'FICTIONAL DEMO - DO NOT SUBMIT':'UNSIGNED DRAFT - REVIEW ALL ANSWERS AND COMPLETE MISSING ITEMS',{x:16,y:page.getHeight()-12,size:8,font,color:rgb(.45,.15,0)});
 doc.setTitle(mode==='developer'?'FICTIONAL TEST ONLY — '+inventory.id:inventory.title+' — unsigned draft');
 check();const bytes=await doc.save({updateFieldAppearances:false});check();
 return {bytes,report:{formId:inventory.id,templateSha256:map.templateSha256,outputSha256:await sha256(bytes),pageCount:pages.length,applicationRevision:answers.revision,mode,fictionalDemo:answers.demoFixture===true,written,missing:problems,manualActions:plan.manualActions,removedActions,signatureApplied:false,submitted:false,status:problems.length||!map.coverageComplete?'partial_unsigned_draft':'unsigned_draft_for_manual_review',independentlyValidated:releasedMap(map)}};
}
