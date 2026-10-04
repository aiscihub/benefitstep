import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateBundle,parseJson} from '../dist/index.js';
const bundle=parseJson(await readFile(new URL('../config/bundle.json',import.meta.url),'utf8'));
validateBundle(bundle);
console.log(JSON.stringify({valid:true,bundle:bundle.id,version:bundle.version,programs:bundle.benefits.map(b=>b.id),rules:bundle.benefits.reduce((n,b)=>n+b.rules.length,0),questions:bundle.questions.length,sources:bundle.sources.length},null,2));
