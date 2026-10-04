import {packetPdf} from '../core/packet-pdf.mjs';
export async function buildPacket(summary,docs){
 const rendered=[];
 for(const doc of docs){const images=[];
  for(const page of doc.pages){if(!page.preview)continue;const image=new Image();image.src=page.preview;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);
   const encoded=canvas.toDataURL('image/jpeg',.9).split(',')[1];images.push({bytes:Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),width:canvas.width,height:canvas.height});canvas.width=canvas.height=0;
  }rendered.push({filename:doc.filename,images});
 }
 return packetPdf(summary,rendered);
}
