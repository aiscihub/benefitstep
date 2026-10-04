import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateModel,scoreText,tokens,hashToken} from './inference.mjs';
const model=validateModel(JSON.parse(fs.readFileSync(new URL('./artifacts/model.json',import.meta.url))));
const probes=JSON.parse(fs.readFileSync(new URL('./artifacts/parity_probes.json',import.meta.url)));
test('portable inference matches fitted Python probabilities',()=>{for(const p of probes){const actual=scoreText(model,p.text);p.scores.forEach((v,i)=>assert.ok(Math.abs(v-actual.scores[i])<1e-10,JSON.stringify({text:p.text,index:i,expected:v,actual:actual.scores[i]})));}});
test('short and oversized input abstains without invented text',()=>{assert.equal(scoreText(model,'').label,'unknown');assert.equal(scoreText(model,'pay stub').reason,'insufficient_text');assert.equal(scoreText(model,'x'.repeat(100001)).reason,'text_too_long');});
test('source filenames and annotation labels are never input features',()=>{assert.deepEqual(tokens('DEMO Synthetic sample FieldBench Gross pay 2500'),['gross','pay']);assert.equal(hashToken('w:gross'),hashToken('w:gross'));});
test('model cannot add policy output or unsupported labels',()=>{assert.throws(()=>validateModel({...model,labels:['eligible','not_eligible']}));assert.throws(()=>validateModel({...model,weights:[[NaN]]}));const r=scoreText(model,'Gross earnings salary payroll net pay federal tax pay period deductions income wages benefits');assert.equal(r.eligibility,undefined);assert.equal(r.experimental,true);});
