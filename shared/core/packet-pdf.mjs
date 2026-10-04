/** One review PDF: clickable index, confirmed facts, and rendered source pages. */
const enc=new TextEncoder();
const ascii=value=>String(value).replace(/[^\x20-\x7e]/gu,c=>'\\u{'+c.codePointAt(0).toString(16)+'}');
const esc=value=>ascii(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const txt=(s,x,y,size=10,bold=false)=>`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${esc(s)}) Tj ET\n`;
function concat(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}
export function packetPdf(summary,documents){
 if(documents.length>25)throw new Error('Too many documents for the packet.');
 const objects=[null,null,null,enc.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),enc.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')];
 const add=value=>{objects.push(typeof value==='string'?enc.encode(value):value);return objects.length-1;};
 const stream=(bytes,extra='')=>concat([enc.encode(`<< /Length ${bytes.length} ${extra} >>\nstream\n`),bytes,enc.encode('\nendstream')]);
 const pages=[],index=[];
 function page(content,image=null){const id=add(''),cid=add(stream(enc.encode(content)));let resources='/Font << /F1 3 0 R /F2 4 0 R >>';if(image){const iid=add(stream(image.bytes,`/Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`));resources+=` /XObject << /Im1 ${iid} 0 R >>`;}
 pages.push({id,cid,resources,annotations:[]});return pages.length;}
 const header=title=>'0.08 0.18 0.23 rg\n'+txt('BENEFITSTEP / PRIVATE REVIEW COPY',40,752,10,true)+txt(title,40,723,19,true);
 page('');
 for(let i=0;i<documents.length;i++){
  const doc=documents[i],record=summary.documents[i];if(!record)throw new Error('Packet document mismatch.');
  const first=pages.length+1;
  let content=header(`${i+1}. ${ascii(doc.filename).slice(0,65)}`),y=690;
  content+=txt('Confirmed facts. Original pages follow this summary.',40,y);y-=26;
  for(const fact of record.facts){const line=ascii(`${fact.label}: ${fact.value}`);for(let start=0;start<line.length;start+=86){if(y<70){page(content);content=header('Confirmed facts (continued)');y=685;}content+=txt(line.slice(start,start+86),40,y);y-=17;}}
  for(const issue of record.issues){const line=ascii('Unresolved: '+issue);for(let start=0;start<line.length;start+=95){if(y<70){page(content);content=header('Unresolved tasks (continued)');y=685;}content+=txt(line.slice(start,start+95),40,y,9);y-=14;}}
  page(content+txt('Preparation copy only. No application has been submitted.',40,35,9));
  index.push({name:doc.filename,page:first,sourcePages:doc.images.length});
  for(const image of doc.images){const scale=Math.min(532/image.width,660/image.height),w=image.width*scale,h=image.height*scale;
   page(header(`${i+1}. Source page`)+`q ${w} 0 0 ${h} ${(612-w)/2} ${50+(660-h)/2} cm /Im1 Do Q\n`+txt('Rendered copy for review; use unchanged originals when requested.',40,30,9),image);
  }
 }
 let cover=header('Your prepared package');cover+=txt('One PDF with an index, confirmed facts, and selected source pages.',40,689);
 cover+=txt('Created: '+summary.generatedAt,40,669,9);cover+=txt('PREPARATION: '+ascii(summary.screening.headline).slice(0,78),40,644,10,true);
 cover+=txt('A preparation aid, not an application or an eligibility decision.',40,625,9);
 cover+=txt('Select a document below to jump to its section.',40,594,11,true);
 for(let i=0;i<index.length;i++){const entry=index[i],y=568-i*18;cover+=txt(`${i+1}. ${ascii(entry.name).slice(0,66)}    page ${entry.page}`,44,y,10);
  const target=pages[entry.page-1].id;const annotation=add(`<< /Type /Annot /Subtype /Link /Rect [40 ${y-3} 570 ${y+12}] /Border [0 0 0] /Dest [${target} 0 R /Fit] >>`);pages[0].annotations.push(annotation);
 }
 cover+=txt('Source pages are rendered copies; the ZIP retains unchanged originals.',40,76,9)+txt('Non-ASCII text is escaped in summaries; source pages preserve appearance.',40,61,8);
 objects[pages[0].cid]=stream(enc.encode(cover));
 for(const p of pages)objects[p.id]=enc.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << ${p.resources} >> /Contents ${p.cid} 0 R ${p.annotations.length?`/Annots [${p.annotations.map(id=>id+' 0 R').join(' ')}]`:''} >>`);
 objects[1]=enc.encode('<< /Type /Catalog /Pages 2 0 R >>');objects[2]=enc.encode(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map(p=>p.id+' 0 R').join(' ')}] >>`);
 const parts=[enc.encode('%PDF-1.4\n')],offsets=[0];let length=parts[0].length;
 for(let i=1;i<objects.length;i++){offsets.push(length);const bytes=concat([enc.encode(`${i} 0 obj\n`),objects[i],enc.encode('\nendobj\n')]);parts.push(bytes);length+=bytes.length;}
 let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(const offset of offsets.slice(1))xref+=String(offset).padStart(10,'0')+' 00000 n \n';xref+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`;parts.push(enc.encode(xref));
 return {bytes:concat(parts),index,pageCount:pages.length};
}
