import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {DEFAULT_CONFIG} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {MANEUVERS} from '../../maneuver-catalog.js';
import {programRun,emergencyDecisionDefs,isProgramFlight} from '../../program-flight.js';
import {flightState} from '../../flight-dynamics.js';
import {controlDisplay} from '../../control-display.js';
const emCfg=(e,extra={})=>({...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:e.start?.h??500,startIasKt:e.start?.v??80,flightArea:e.area??'terrain',mode:'watch',startX:e.start?.x??0,startZ:e.start?.z??0,headingDeg:e.start?.hdg??(e.area==='airfield'?65:0),...extra}); /* v0.42 seçicideki gibi her emercensinin kendi başlangıç noktası */
const program=EMERGENCIES.filter(e=>e.kind==='program');
test('v0.34.1 every program emergency ends in the hazır akış, and every powered landing is soft and clear of obstacles',()=>{
 for(const e of program){const r=programRun(emCfg(e),[]);assert.ok(r.duration<240,`${e.id} ${r.duration}`);
  const c=r.contact;if(!c)continue;if(e.landing==='trees')continue;
  assert.ok(!c.obstacle,`${e.id} hit ${c.obstacle}`);assert.ok(c.descentMps<=1.6,`${e.id} w ${c.descentMps}`);}
});
test('v0.34.1 every decision option of every emergency is flown to an end in guided mode (no stalled question)',()=>{
 for(const e of program){const base=emCfg(e,{mode:'guided'});const probe=new Session(base),all=[];for(let k=0;k<10;k++){probe.seek(999);if(!probe.pending)break;all.push(probe.pending);probe.choose(probe.pending.id,probe.pending.reference);}
  for(const d of all){assert.ok(d.options.some(o=>o.id===d.reference),`${e.id} ${d.id} reference`);
   for(const o of d.options){const s=new Session(base);for(let k=0;k<10;k++){s.seek(999);if(!s.pending)break;s.choose(s.pending.id,s.pending.id===d.id?o.id:s.pending.reference);}assert.ok(!s.pending,`${e.id} ${d.id}=${o.id} stalled`);assert.ok(s.scenario.duration<399,`${e.id} ${d.id}=${o.id} endless`);}}}
});
test('v0.34.1 action labels stay short and the run-on emergencies have a first-action mistake with its own consequence',()=>{
 for(const e of program){const d=emergencyDecisionDefs(e);for(const k in d)for(const o of d[k].options)assert.ok(o.label.length<=72,`${e.id} ${o.label}`);}
 for(const id of ['droop-comp','igv-closed','fixed-pedal-low','fixed-pedal-high','hydraulic','control-stiffness','servo-cyclic','servo-collective']){const e=EMERGENCIES.find(x=>x.id===id);assert.ok(e.hoverEnd,`${id} hoverEnd`);assert.ok(!/Havıra kadar/.test(e.mistake.label),`${id} mistake is the approach technique`);}
});
test('v0.34.1 control view: fixed pedal, LTE, servo hardover and throttle are shown for the emergency',()=>{
 const st=(id,t,extra)=>flightState(t,{duration:400},emCfg(EMERGENCIES.find(e=>e.id===id),extra),[]);
 assert.match(controlDisplay(st('fixed-pedal-low',20)).pedal.label,/sabit/);
 assert.match(controlDisplay(st('servo-cyclic',4.8)).cyclic.label,/sıkışık/);
 assert.match(controlDisplay(st('tr-components',15)).note,/Gaz kolu: tam kapalı/);
 assert.match(controlDisplay(st('engine-overspeed',9)).collective.label,/artırıldı/);
 const lte=st('lte',5,{startHeightFt:100,startIasKt:0});assert.ok(lte.controls.pedal<-.9,'full left pedal during LTE');
 assert.ok(st('fire-flight',8).program.smoke>0&&st('fire-flight',8).program.warn.fire);
});
test('v0.34.1 asap is never slower than practicable for the same emergency (time-to-land field choice)',()=>{
 const e=EMERGENCIES.find(x=>x.id==='compressor-stall');const g={...emCfg(e),mode:'guided'};
 const run=opt=>{const s=new Session(g);for(let k=0;k<10;k++){s.seek(999);if(!s.pending)break;s.choose(s.pending.id,s.pending.id==='em-landing'?opt:s.pending.reference);}return s.scenario.duration;};
 assert.ok(run('asap')<=run('practicable')+1,`${run('asap')} vs ${run('practicable')}`);
});
test('v0.34.1 every manoeuvre completes, and a long taxi to the slope pad clears trees',()=>{
 for(const m of MANEUVERS){const c={...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:m.start.h,startIasKt:m.start.v,flightArea:m.start.area??'terrain',startX:m.start.x??0,startZ:m.start.z??0,headingDeg:m.start.hdg??0,mode:'watch'};assert.ok(isProgramFlight(c));const r=programRun(c,[]);assert.ok(r.duration<(m.id==='pattern'?700:m.site||/^pattern/.test(m.id)?520:300),`${m.id} ${r.duration}`) /* v0.35.9: ana başlık 06 + 24 meydan turunu sırayla uçar */;if(r.contact)assert.ok(!r.contact.obstacle,`${m.id} obstacle`);}
});
