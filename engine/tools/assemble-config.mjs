import {readFile,writeFile} from 'node:fs/promises';
import {validateBundle,stableStringify} from '../dist/index.js';
const read=async(path)=>JSON.parse(await readFile(new URL('../config/'+path,import.meta.url),'utf8'));
const original=await read('bundle.json');
const bundle={...original,questions:await read('shared/questions.json'),derivations:await read('shared/derivations.json'),tables:await read('shared/tables.json'),sources:await read('sources/official_sources.json'),benefits:[await read('benefits/calfresh.json'),await read('benefits/medi_cal.json')]};
validateBundle(bundle);
if(process.argv.includes('--check')) {if(stableStringify(bundle)!==stableStringify(original))throw new Error('Split configuration and bundle differ');console.log('Split configurations and bundle agree.');}
else {await writeFile(new URL('../config/bundle.json',import.meta.url),JSON.stringify(bundle,null,2)+'\n');console.log('Validated bundle assembled.');}
