// Chrome's image reader reduces inputs above 768px. Keep a page overview for
// context, then overlapping, original-scale sections for its smaller print.
// Sections suit a narrow question about a page whose kind is already known. A reading that has to decide what kind of
// document the page is gets the whole page as one image (`whole`): given sections, the on-device model typed a pension
// letter and a pharmacy statement as pay statements in 5 of 6 readings, against 1 of 6 from the whole page.
export const IMAGE_EDGE=768,IMAGE_OVERLAP=96;
export function imageSections(width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>24_000_000)throw Error('Unsupported image dimensions. Use a smaller document image.');
 const starts=size=>{if(size<=IMAGE_EDGE)return [0];const count=Math.ceil((size-IMAGE_EDGE)/(IMAGE_EDGE-IMAGE_OVERLAP))+1;return Array.from({length:count},(_,i)=>Math.round(i*(size-IMAGE_EDGE)/(count-1)));};
 const sections=starts(height).flatMap(y=>starts(width).map(x=>({x,y,width:Math.min(width,IMAGE_EDGE),height:Math.min(height,IMAGE_EDGE)})));
 if(sections.length>16)throw Error('This image needs too many reading sections. Use smaller page images.');
 return sections;
}
export async function imagePromptContent(preview,page,{signal,whole=false}={}){
 const stopped=()=>{if(signal?.aborted)throw new DOMException('Image reading cancelled.','AbortError');};
 stopped();const image=new Image();image.src=preview;await image.decode();stopped();
 const width=image.naturalWidth,height=image.naturalHeight,sections=imageSections(width,height),canvases=[];
 const dispose=()=>{for(const canvas of canvases)canvas.width=canvas.height=0;image.src='';};
 const draw=(section,scale=1)=>{stopped();const canvas=document.createElement('canvas');canvases.push(canvas);canvas.width=Math.max(1,Math.round(section.width*scale));canvas.height=Math.max(1,Math.round(section.height*scale));const context=canvas.getContext('2d');if(!context)throw Error('Could not prepare this document image.');context.drawImage(image,section.x,section.y,section.width,section.height,0,0,canvas.width,canvas.height);return canvas;};
 try{
  const content=[];
  if(whole){
   content.push({type:'image',value:draw({x:0,y:0,width,height},Math.min(1,IMAGE_EDGE/width,IMAGE_EDGE/height))});
   return {content,dispose};
  }
  if(sections.length>1){
   content.push({type:'text',value:`PAGE ${page}: overview for layout only. Read small print from the original-scale sections that follow. All images belong to this same page, not additional pages. Do not infer absent values or count repeated overlap as separate evidence.`});
   content.push({type:'image',value:draw({x:0,y:0,width,height},Math.min(IMAGE_EDGE/width,IMAGE_EDGE/height))});
  }
  for(const [i,section] of sections.entries()){
   content.push({type:'text',value:`PAGE ${page}, section ${i+1}/${sections.length}: original pixel rectangle x=${section.x}, y=${section.y}, width=${section.width}, height=${section.height}; full page ${width}×${height}. Preserve the original page number for citations. Use the overview to distinguish recipient information from issuer information. Omit ambiguous or conflicting details.`});
   content.push({type:'image',value:draw(section)});
  }
  return {content,dispose};
 }catch(error){dispose();throw error;}
}
