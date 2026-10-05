import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewItems} from '../extension/src/review-items.mjs';
const fact=(id,extra={})=>({id,value:'100',revision:1,confirmedRevision:null,...extra});
test('detail findings do not inflate the total or remain ready for confirmation',()=>{
 const items=reviewItems([fact('a'),fact('b')],[{id:'issue',state:'finding',factId:'a',blockedFactIds:['a'],sourceIds:['doc']}]);
 assert.equal(items.length,2);assert.equal(items[0].status,'attention');assert.equal(items[0].findings.length,1);assert.equal(items[1].status,'confirm');
});
test('document issues are separate items, grouped per document',()=>{
 const items=reviewItems([fact('a')],[{id:'unreadable',sourceIds:['note'],state:'needs_context'},{id:'unknown',sourceIds:['note'],state:'needs_context'}]);
 assert.equal(items.length,2);assert.equal(items[1].findings.length,2);assert.equal(items[1].label,'Needs clarification');
});
test('missing, deferred, confirmed and superseded details have distinct statuses',()=>{
 const items=reviewItems([fact('missing',{value:null}),fact('later',{value:null,deferred:true}),fact('done',{confirmedRevision:1}),fact('old',{superseded:true})],[]);
 assert.deepEqual(items.map(i=>i.status),['attention','deferred','confirmed']);assert.equal(items[0].label,'Missing information');
});
test('a conflict affecting two details marks both, with no extra issue item',()=>{
 const items=reviewItems([fact('a'),fact('b')],[{id:'conflict',state:'finding',blockedFactIds:['a','b'],sourceIds:['one','two']}]);
 assert.equal(items.length,2);assert.ok(items.every(i=>i.status==='attention'));
});
