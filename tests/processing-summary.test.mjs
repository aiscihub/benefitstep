import test from 'node:test';
import assert from 'node:assert/strict';
import {processingSummary,readerCounts} from '../extension/src/classification-view.mjs';
const docs=[{method:'Local text reader + on-device AI',fields:[{method:'label-baseline'},{method:'label-baseline'},{method:'native-ai'}]},{method:'Automatic local text reader (not AI)',fields:[{method:'label-baseline'}]},{method:'Local text reader; on-device AI asked, nothing added'}];
test('The document summary says which reader produced the details and whether on-device AI is on',()=>{
 assert.deepEqual(readerCounts(docs),{text:3,ai:1});
 assert.match(processingSummary(docs,4,'downloadable'),/Details by reader:<\/strong> local text reader 3 · on-device AI 1\. On-device AI is off\./);
 assert.match(processingSummary(docs,4,'available'),/On-device AI is on\. It was asked about 2 of 3 documents\./);assert.doesNotMatch(processingSummary([docs[1]],1,'downloadable'),/It was asked/);assert.doesNotMatch(processingSummary(docs,4,'checking'),/On-device AI is/);
 assert.equal(processingSummary([],0,'available'),'');
});
