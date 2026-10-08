import test from 'node:test';
import assert from 'node:assert/strict';
import {imageSections,IMAGE_EDGE} from '../extension/shared/browser/image-input.mjs';
test('reported 1313×1700 image retains full pixel coverage in six overlapping sections',()=>{
 const sections=imageSections(1313,1700);assert.equal(sections.length,6);
 for(const section of sections){assert.ok(section.width<=IMAGE_EDGE&&section.height<=IMAGE_EDGE);assert.ok(section.x+section.width<=1313&&section.y+section.height<=1700);}
 for(let y=0;y<1700;y++)for(let x=0;x<1313;x++)assert.ok(sections.some(s=>x>=s.x&&x<s.x+s.width&&y>=s.y&&y<s.y+s.height));
});
test('small and narrow images stay at their original scale without padding',()=>{
 assert.deepEqual(imageSections(400,600),[{x:0,y:0,width:400,height:600}]);
 const sections=imageSections(200,1700);assert.equal(sections.length,3);assert.ok(sections.every(s=>s.width===200));
});
test('oversized or invalid image grids fail explicitly instead of dropping sections',()=>{
 for(const dims of [[0,400],[400,NaN],[1.5,100],[6000,6000],[4000,4000]])assert.throws(()=>imageSections(...dims));
});
