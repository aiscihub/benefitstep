import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {stableStringify} from '../engine/dist/engine.js';
const root=path.resolve(import.meta.dirname,'..');
const names=['Jordan García','Alex García','Sam García','Robin García','Lee García'];
for(const formId of ['cf285','ccfrm604']){
 const map=JSON.parse(fs.readFileSync(`${root}/forms/maps/${formId}.json`));map.developerFixtures={};
 for(const scenario of ['one-person','multiple-people','no-income','multiple-income','conditional','declined','long-unicode','overflow']){
  const a={schemaVersion:'1.0',formId,revision:1,groups:[],answers:[],exportAuthorized:true};
  function group(groupId,rows,values){a.groups.push({groupId,status:'applicable',rowCount:rows,revision:1,confirmedRevision:1});for(let row=0;row<Math.min(rows,6);row++)for(const [field,value] of Object.entries(typeof values==='function'?values(row):values))a.answers.push({groupId,row,field,status:'answered',value,revision:1,confirmedRevision:1,sourceIds:[`fictional:${scenario}:${row}`]});}
  const people=scenario==='overflow'?6:scenario==='multiple-people'?3:1,sourceCount=scenario==='multiple-income'?2:1;
  if(formId==='cf285'){
   group('q1.contact',1,{name:scenario==='long-unicode'?'María-José '+ 'Extremelylongname '.repeat(25):names[0],home_address:'123 Example Way',home_city:'Sacramento',home_state:'CA',home_zip:'95814',homeless:false,email:'jordan@example.invalid'});
   group('q6a.people',people,row=>({name:names[row]||'Case Six',date_of_birth:'01/15/1990',...(row?{relationship:'Child'}:{})}));
   group('q8.earned',sourceCount,()=>({has_income:scenario!=='no-income',...(scenario==='no-income'?{}:{person:names[0],employer_name_address:'Example Co.',employer_phone:'916-555-0100',hourly_rate:'18.00',hours_week:'30',frequency:'Twice monthly',gross_received_this_month:'2160.00'})}));
   if(scenario==='conditional')group('q9.care',1,{care_recipient:'Sam García',provider_name_address:'Fictional Care',amount_paid:'200.00',frequency:'Monthly'});
   group('notes',1,{notes:'FICTIONAL TEST ONLY. No real person. Unsigned. Do not submit.'});
  }else{
   group('p1.contact',1,{first_name:scenario==='long-unicode'?'José '+ 'Longname '.repeat(25):'Jordan',last_name:'García',email:'jordan@example.invalid'});
   group('p2.identity',people,row=>({first_name:['Jordan','Alex','Sam','Robin','Lee','Case'][row],last_name:'García'}));
   group('p2.address',people,{date_of_birth:'01/15/1990',home_address:'123 Example Way',city:'Sacramento',state:'CA',zip:'95814',homeless:false});
   group('p7.income',sourceCount,()=>({household_has_income:scenario!=='no-income',...(scenario==='no-income'?{}:{person_first:'Jordan',person_last:'García',income_name:'Example Co.',source_type:'Employment',amount:'1080.00',frequency:'Twice a month'})}));
  }
  if(scenario==='declined')a.answers=a.answers.map(x=>x.field.includes('name')?{...x,status:'deferred',value:undefined}:x);
  const fixtureId=`${formId}-${scenario}`;map.developerFixtures[fixtureId]=createHash('sha256').update(stableStringify(JSON.parse(JSON.stringify(a)))).digest('hex');fs.writeFileSync(`${root}/forms/fixtures/${fixtureId}.json`,JSON.stringify(a,null,2)+'\n');
 }
 fs.writeFileSync(`${root}/forms/maps/${formId}.json`,JSON.stringify(map,null,2)+'\n');
}
