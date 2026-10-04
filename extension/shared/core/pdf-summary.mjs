/** Limited PDF summary writer, not a parser. Standard built-in fonts; no font files. */
function ascii(s){return String(s).replace(/[^\x20-\x7e\n]/gu,c=>'\\u{'+c.codePointAt(0).toString(16)+'}');}
function esc(s){return ascii(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
function wrap(s,n=83){const out=[];for(const para of ascii(s).split('\n')){let line='';for(let word of para.split(/\s+/)){while(word.length>n){if(line){out.push(line);line='';}out.push(word.slice(0,n));word=word.slice(n);}if((line+' '+word).trim().length>n){out.push(line);line=word;}else line+=(line?' ':'')+word;}out.push(line);}return out;}
export function summaryPdf(summary){
 const chunks=[];let content='',y=686;const pageStreams=[];
 const text=(s,x,yy,size=9.5,font='F1',color='0.12 0.18 0.24')=>`${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${yy} Tm (${esc(s)}) Tj ET\n`;
 function start(){content='0.06 0.15 0.22 rg 0 718 612 74 re f\n'+text('BENEFITSTEP',48,762,10,'F2','0.65 0.85 0.86')+text('Preparation summary',48,735,19,'F2','1 1 1');y=686;}
 function end(){content+=text('Preparation only. Not a submitted application or eligibility determination.',48,34,8,'F1');content+=text(String(pageStreams.length+1),551,34,8);pageStreams.push(content);}
 function line(s){for(const t of wrap(s)){if(y<65){end();start();}content+=text(t,48,y);y-=14;}}
 function section(s){if(y<105){end();start();}y-=8;content+=`0.90 0.94 0.94 rg 43 ${y-5} 526 22 re f\n`+text(s,49,y+2,10,'F2');y-=25;}
 start();line('Created: '+summary.generatedAt);line('Programs: '+(summary.programs||[]).join(', ')+' | Local preparation');line('Not an official application.');line('Documents remain the owner\'s selected evidence; no authenticity finding.');line('Unicode text is escaped in this basic PDF. Full text is in preparation.json.');
 section('1 / PRELIMINARY CHECK');line(summary.screening.headline);line(summary.screening.scope);line(summary.screening.detail);line('Rule pack: '+summary.screening.ruleId+' / '+summary.screening.ruleVersion);line('Source: '+summary.screening.source);
 section('2 / SELECTED SUPPORTING DOCUMENTS');
 if(!summary.documents.length)line('No supporting documents selected.');
 for(const d of summary.documents){line(d.exportPath+' | '+d.section);line('Owner reviewed: '+d.reviewed+' | Extraction: '+d.method);for(const f of d.facts)line(`${f.label}: ${f.value} [page ${f.page}; ${f.provenance}; confirmed: ${f.confirmed}]`);for(const issue of d.issues)line('Unresolved: '+issue);y-=6;}
 section('3 / OWNER CHECKLIST');for(const task of summary.checklist)line('[ ] '+task);
 section('4 / WHAT THIS PACKAGE DOES NOT DO');line('Do not upload this entire ZIP as a substitute for the portal\'s requested files. Use the originals/ folder one document at a time. Keep this summary for preparation unless specifically requested.');line('Billed amounts are not assumed paid or deductible. Household membership, identity, citizenship/immigration, student/work rules and program decisions are not inferred from documents.');line('Documents are not required to start a BenefitsCal application. Follow your actual notice or county instructions.');end();
 const objects=['','<< /Type /Catalog /Pages 2 0 R >>','','<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];const kids=[];
 for(const stream of pageStreams){const p=objects.length,c=p+1;kids.push(`${p} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${c} 0 R >>`);objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);}
 objects[2]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>`;let out='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(out.length);out+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=out.length;out+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(const o of offsets.slice(1))out+=String(o).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return new TextEncoder().encode(out);
}
