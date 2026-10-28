import {Session} from './engine.js';
import {APPROVED_REFERENCE_CHOICES} from './catalog.js';
const cache=new Map();
export function alternativeRun(original,id,option){
 const source=original.answers.find(a=>a.id===id);if(!source)throw Error('Karar bu koşuda yok');
 const run=new Session({...original.config,mode:'guided'});let changed=false;const fallback=[];
 for(let n=0;n<16;n++){
  run.seek(600);if(!run.pending)break;const d=run.pending;
  let pick=d.id===id?option:original.answers.find(a=>a.id===d.id)?.option;
  if(!pick){pick=APPROVED_REFERENCE_CHOICES[d.id];fallback.push(d.id);}
  if(d.id===id)changed=true;
  run.choose(d.id,pick);
 }
 run.seek(600);if(run.pending||!changed)throw Error('Alternatif koşu tamamlanamadı');
 return {run,fallback};
}
export function alternativeResults(original){
 if(original.config.mode!=='guided'||original.time<original.scenario.duration)return [];
 const key=JSON.stringify([original.config,original.answers]);if(cache.has(key))return cache.get(key);
 const base=original.evidence().summary,result=[];
 for(const id of ['priority','recovery','approach','flare','cushion','finalPull','cyclic']){
  const answer=original.answers.find(a=>a.id===id),decision=original.scenario.decisions.find(d=>d.id===id);if(!answer||!decision)continue;
  for(const option of decision.options.filter(o=>o.id!==answer.option)){
   const {run,fallback}=alternativeRun(original,id,option.id),e=run.evidence().summary;
   result.push({id,option:option.id,label:option.label,contact:e.contact,severity:e.impact.severity?.percent??null,damage:e.impact.damage,deltaDescentMps:e.contact&&base.contact?e.contact.descentMps-base.contact.descentMps:null,deltaGroundKt:e.contact&&base.contact?(e.contact.groundSpeedMps-base.contact.groundSpeedMps)*3600/1852:null,fallback,config:run.config});
  }
 }
 cache.set(key,result);if(cache.size>8)cache.delete(cache.keys().next().value);return result;
}
