import {CF_REFERENCE} from '../policy/calfresh-reference.mjs';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function fresh(){return {
    schemaVersion:2,
    calfresh:{residence:'',people:'',income:'',immigration:'',boundCents:null,referenceId:null,revision:0,saved:null,skipped:false},
    medical:{people:[{id:'mc-person-1',age:'',residence:''}],nextId:2,revision:0,saved:null,skipped:false}
  };}
  const referenceCurrent=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date&&date>=CF_REFERENCE.from&&date<=CF_REFERENCE.through;
  function threshold(people,date=today()){return referenceCurrent(date)&&Object.hasOwn(CF_REFERENCE.amounts,people)?CF_REFERENCE.amounts[people]:null;}
  function validProgram(p){if(!['calfresh','medical'].includes(p))throw Error('Unknown program');}
  function setCalFresh(s,key,value,date=today()){
    const choices={immigration:['','citizen','noncitizen','mixed','unknown','prefer_not'],residence:['','yes','no','unknown'],people:['',...Object.keys(CF_REFERENCE.amounts),'9plus','unknown'],income:['','none','at_or_below','above','unknown']};
    if(!choices[key]?.includes(value))throw Error('Invalid CalFresh input');
    const q=s.calfresh;
    if(q[key]===value)return false;
    if(key==='income'&&['at_or_below','above'].includes(value)&&threshold(q.people,date)===null)throw Error('Income reference unavailable');
    q[key]=value;q.revision++;q.skipped=false;
    if(key==='people'&&['at_or_below','above'].includes(q.income)){q.income='';q.boundCents=null;q.referenceId=null;}
    if(key==='income'){
      q.boundCents=['at_or_below','above'].includes(value)?threshold(q.people,date):null;
      q.referenceId=q.boundCents===null?null:CF_REFERENCE.id;
    }
    return true;
  }
  function setMedical(s,id,key,value){
    const allowed={age:['','under19','19to64','65plus','unknown'],residence:['','yes','no','unknown']};
    const row=s.medical.people.find(p=>p.id===id);
    if(!row||!allowed[key]?.includes(value))throw Error('Invalid Medi-Cal input');
    if(row[key]===value)return false;
    row[key]=value;s.medical.revision++;s.medical.skipped=false;return true;
  }
  function addMedical(s){
    if(s.medical.people.length>=10)return null;
    const id='mc-person-'+s.medical.nextId++;s.medical.people.push({id,age:'',residence:''});
    s.medical.revision++;s.medical.skipped=false;return id;
  }
  function removeMedical(s,id){
    if(s.medical.people.length<=1||!s.medical.people.some(p=>p.id===id))return false;
    s.medical.people=s.medical.people.filter(p=>p.id!==id);s.medical.revision++;s.medical.skipped=false;return true;
  }
  function hasAnswers(q,p){return p==='calfresh'?!!(q.residence||q.people||q.income||q.immigration):q.people.some(x=>x.age||x.residence);}
  function isComplete(q,p){return p==='calfresh'?!!(q.residence&&q.people&&q.income):q.people.every(x=>x.age&&x.residence);}
  function status(s,p,date=today()){
    validProgram(p);const q=s[p];
    if(q.saved){
      if(q.saved.revision!==q.revision)return 'Needs update';
      if(p==='calfresh'&&q.saved.facts.referenceId&&!referenceCurrent(date))return 'Reference expired';
      return q.saved.partial?'Partial answers saved':'Answers saved';
    }
    if(q.skipped)return 'Skipped';
    return hasAnswers(q,p)?'In progress':'Not started';
  }
  function save(s,p,at=new Date().toISOString()){
    validProgram(p);const q=s[p];
    const facts=p==='calfresh'?{residence:q.residence,people:q.people,income:q.income,immigration:q.immigration,boundCents:q.boundCents,referenceId:q.referenceId}:{people:copy(q.people)};
    const result={schemaVersion:2,method:'owner_report',program:p,revision:q.revision,at,facts,partial:!isComplete(q,p),eligibility:'not_assessed',verification:'not_performed'};
    q.saved=copy(result);q.skipped=false;return copy(result);
  }
  function skip(s,p){validProgram(p);s[p].skipped=true;}
  function comparison(q,date=today()){
    if(q.income==='none')return 'no_income_reported';
    if(!['at_or_below','above'].includes(q.income))return 'not_compared';
    if(!referenceCurrent(date))return 'reference_expired';
    if(q.referenceId!==CF_REFERENCE.id||q.boundCents!==threshold(q.people,date))return 'reference_mismatch';
    return q.income==='above'?'above_reference':'at_or_below_reference';
  }
  function overview(s,p,date=today()){
    validProgram(p);const q=s[p];const label=status(s,p,date);
    if(!q.saved)return {status:label,comparison:'not_compared',eligibility:'not_assessed'};
    if(q.saved.revision!==q.revision)return {status:label,comparison:'needs_update',eligibility:'not_assessed'};
    return {status:label,comparison:p==='calfresh'?comparison(q.saved.facts,date):'not_compared',eligibility:'not_assessed'};
  }

export {CF_REFERENCE,fresh,today,referenceCurrent,threshold,setCalFresh,setMedical,addMedical,removeMedical,status,save,skip,comparison,overview};
