import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,programStarted,programSelected,transferSnapshot} from '../extension/src/state.mjs';
import * as Q from '../extension/src/starting-state.mjs';
test('default selection, empty saved screen and demo form answers do not start a program',()=>{
 const s=initial();Q.save(s.starting,'medical');s.formAnswers.ccfrm604={answers:[{value:'Demo'}]};
 assert.equal(programStarted(s,'CalFresh'),false);assert.equal(programStarted(s,'Medi-Cal'),false);
});
test('programs start independently and packages omit unstarted programs',()=>{
 const s=initial();Q.setCalFresh(s.starting,'residence','yes');
 assert.equal(programStarted(s,'CalFresh'),true);assert.equal(programStarted(s,'Medi-Cal'),false);
 assert.deepEqual(transferSnapshot(s).programs,['CalFresh']);
 Q.setMedical(s.starting,'mc-person-1','age','19to64');assert.equal(programStarted(s,'Medi-Cal'),true);
 Q.setCalFresh(s.starting,'residence','');assert.equal(programStarted(s,'CalFresh'),false);
 assert.deepEqual(transferSnapshot(s).programs,['Medi-Cal']);
});
test('skipped or deselected programs do not authorize generation',()=>{
 const s=initial();Q.setMedical(s.starting,'mc-person-1','residence','unknown');Q.skip(s.starting,'medical');assert.equal(programStarted(s,'Medi-Cal'),false);
 Q.setCalFresh(s.starting,'residence','yes');s.programs.delete('CalFresh');assert.equal(programStarted(s,'CalFresh'),false);
});
test('a selected program can be prepared without the quick check, and a deselected one cannot',()=>{
 const s=initial();Q.skip(s.starting,'calfresh');Q.skip(s.starting,'medical');
 assert.equal(programStarted(s,'CalFresh'),false);assert.equal(programSelected(s,'CalFresh'),true);assert.equal(programSelected(s,'Medi-Cal'),true);
 s.programs.delete('Medi-Cal');assert.equal(programSelected(s,'Medi-Cal'),false);
});
