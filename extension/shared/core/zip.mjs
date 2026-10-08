/** Small, uncompressed ZIP writer; no remote libraries or executable content generation. */
const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const encoder=new TextEncoder();
const cat=chunks=>{const out=new Uint8Array(chunks.reduce((n,x)=>n+x.length,0));let p=0;for(const x of chunks){out.set(x,p);p+=x.length;}return out;};
export function zipStore(entries){
 const local=[],central=[];let offset=0;const seen=new Set();
 if(entries.length>100)throw new Error('Too many export files');
 for(const {name,data} of entries){
  if(!/^[A-Za-z0-9_./-]+$/.test(name)||name.startsWith('/')||name.split('/').includes('..')||seen.has(name))throw new Error('Unsafe or duplicate ZIP path');seen.add(name);
  const nb=encoder.encode(name),bytes=typeof data==='string'?encoder.encode(data):new Uint8Array(data);if(bytes.length>48_000_000)throw new Error('Export item too large');const crc=crc32(bytes);
  const h=new Uint8Array(30),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(12,0x21,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,nb.length,true);
  local.push(h,nb,bytes);
  const c=new Uint8Array(46),w=new DataView(c.buffer);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x0800,true);w.setUint16(14,0x21,true);w.setUint32(16,crc,true);w.setUint32(20,bytes.length,true);w.setUint32(24,bytes.length,true);w.setUint16(28,nb.length,true);w.setUint32(42,offset,true);central.push(c,nb);offset+=h.length+nb.length+bytes.length;
 }
 const cb=cat(central),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,cb.length,true);v.setUint32(16,offset,true);return cat([...local,cb,end]);
}
/** Reads one file out of a ZIP by name, wherever in the archive's folders it sits: a stored entry as it is, a deflated one through the platform's own inflater. Returns null when the archive has no such file. */
export async function unzipEntry(bytes,wanted,limit=8_000_000){
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-66000);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('Not a ZIP file');
 const count=v.getUint16(end+10,true);let p=v.getUint32(end+16,true);
 for(let n=0;n<count;n++){
  if(p+46>bytes.length||v.getUint32(p,true)!==0x02014b50)throw new Error('Damaged ZIP file');
  const method=v.getUint16(p+10,true),size=v.getUint32(p+20,true),full=v.getUint32(p+24,true),nameLength=v.getUint16(p+28,true),local=v.getUint32(p+42,true);
  const name=new TextDecoder().decode(bytes.subarray(p+46,p+46+nameLength));
  if(name===wanted||name.endsWith('/'+wanted)){
   if(full>limit||local+30>bytes.length)throw new Error('ZIP entry too large or damaged');
   const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true),data=bytes.subarray(start,start+size);
   if(method===0)return data.slice();
   if(method!==8)throw new Error('Unsupported ZIP compression');
   const out=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
   if(out.length>limit)throw new Error('ZIP entry too large or damaged');return out;
  }
  p+=46+nameLength+v.getUint16(p+30,true)+v.getUint16(p+32,true);
 }
 return null;
}
