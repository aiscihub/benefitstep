const KEYS=new Set(['resident','residencyContext','food','tax','income','medicalIncome','applicant_status','special_group']);
/** Apply one control value once. Native selects emit both input and change. */
export function setQuickAnswer(state,key,value){
 if(!KEYS.has(key)||state.quick[key]===value)return false;
 state.quick[key]=value;
 if(key==='food'||key==='tax')state.quick[key==='food'?'income':'medicalIncome']='';
 if(key==='resident')state.quick.residencyContext='';
 return true;
}
/** Explicit Update reads displayed values, even when a browser emits no change event. */
export function readQuickControls(state,controls){
 const values=Object.fromEntries(controls.filter(c=>KEYS.has(c.key)).map(c=>[c.key,c.value]));
 const foodChanged=Object.hasOwn(values,'food')&&values.food!==state.quick.food;
 const taxChanged=Object.hasOwn(values,'tax')&&values.tax!==state.quick.tax;
 const residenceChanged=Object.hasOwn(values,'resident')&&values.resident!==state.quick.resident;
 for(const key of ['resident','food','tax','applicant_status','special_group','income','medicalIncome','residencyContext']){
  if(!Object.hasOwn(values,key)||(key==='income'&&foodChanged)||(key==='medicalIncome'&&taxChanged)||(key==='residencyContext'&&residenceChanged))continue;
  setQuickAnswer(state,key,values[key]);
 }
}
