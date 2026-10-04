#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createEngine,parseJson} from '../dist/index.js';
const args=process.argv.slice(2);
if(!args[0]||args[0]==='--help'){
 console.log('Usage: node tools/cli.mjs INPUT.json [--released]\nReads only local JSON and prints the evaluation. No server or network.');
 process.exit(args[0]?0:2);
}
try {
 const bundle=parseJson(await readFile(new URL('../config/bundle.json',import.meta.url),'utf8'));
 const input=parseJson(await readFile(args[0],'utf8'));
 const result=createEngine(bundle).evaluate(input,{mode:args.includes('--released')?'released':'preview'});
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error('Evaluation stopped:',error.message);process.exitCode=1}
