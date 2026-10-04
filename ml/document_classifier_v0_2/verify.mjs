import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateModel,scoreText} from '../../src/trained-classifier.mjs';
const root=new URL('./',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const model=validateModel(read('artifacts/model.json'));
let worst=0;
for(const p of read('artifacts/parity.json')){
 const actual=scoreText(model,p.text,{validated:true});
 for(let j=0;j<model.labels.length;j++)worst=Math.max(worst,Math.abs(actual.scores[j]-p.scores[j]));
}
assert(worst<1e-10,`Python / JavaScript score difference ${worst}`);
const rows=fs.readFileSync(new URL('data/synthetic_records.jsonl',root),'utf8').trim().split('\n').map(JSON.parse);
const gold=new Map(read('artifacts/predictions.json').filter(r=>r.split==='test').map(r=>[r.id,r]));
for(const r of rows.filter(r=>r.split==='test')){
 const actual=scoreText(model,r.text,{validated:true});
 assert.equal(actual.label,gold.get(r.id).routed);
 assert.equal(actual.topLabel,gold.get(r.id).top);
}
const summary={checks:['Python/JavaScript probability parity','All 48 held-out capture predictions match browser-portable JavaScript'],maxScoreDifference:worst};
fs.writeFileSync(new URL('artifacts/parity-results.json',root),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
