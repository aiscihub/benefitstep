/** node predict.mjs document.txt — no network, no user data storage. */
import fs from 'node:fs';import {validateModel,scoreText} from './inference.mjs';
const filename=process.argv[2];if(!filename){console.error('Usage: node predict.mjs document.txt');process.exit(2);}
const model=validateModel(JSON.parse(fs.readFileSync(new URL('./artifacts/model.json',import.meta.url),'utf8')));
console.log(JSON.stringify(scoreText(model,fs.readFileSync(filename,'utf8')),null,2));
