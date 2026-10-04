import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
test('reviewed quick-check modules preserved byte-for-byte',()=>{
 const hashes=JSON.parse(fs.readFileSync(new URL('../reference/baseline-hashes.json',import.meta.url)));
 for(const [file,expected]of Object.entries(hashes)){const local=fs.readFileSync(new URL('../src/'+path.basename(file),import.meta.url));assert.equal(createHash('sha256').update(local).digest('hex'),expected);}
});
