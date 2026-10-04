import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
test('original quick-check baseline retained; v0.2 view is separately integrated',()=>{
 const hashes=JSON.parse(fs.readFileSync(new URL('../reference/baseline-hashes.json',import.meta.url)));
 for(const [file,expected]of Object.entries(hashes)){const local=fs.readFileSync(new URL((path.basename(file)==='quick.mjs'?'../reference/legacy-ui/':'../src/')+path.basename(file),import.meta.url));assert.equal(createHash('sha256').update(local).digest('hex'),expected);}
});
