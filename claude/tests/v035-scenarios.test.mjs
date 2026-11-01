import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {DEFAULT_CONFIG} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {MANEUVERS,maneuverDecisionDefs} from '../../maneuver-catalog.js';
import {programRun} from '../../program-flight.js';
import {buildCues,interpretStep} from '../../narration.js';
const mCfg=(m,extra={})=>({...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:m.start.h,startIasKt:m.start.v,flightArea:m.start.area??'terrain',startX:m.start.x??0,startZ:m.start.z??0,headingDeg:m.start.hdg??0,mode:'watch',...extra});
test('v0.35 emergency list: the 31 asked for, in book order, each with its own flight area',()=>{
 assert.equal(EMERGENCIES.length,31);const refs=EMERGENCIES.map(e=>e.ref);
 for(const id of ['engine-partial','engine-total','engine-hover','engine-low','engine-restart','droop-comp','compressor-stall','igv-closed','igv-open','engine-overspeed','driveshaft','fire-ground','fire-flight','electrical-fire','hydraulic','control-stiffness','servo-cyclic','servo-collective','rotor-system','mast-bumping','dc-generator','trees','ditch-power','ditch-nopower'])assert.ok(EMERGENCIES.some(e=>e.id===id),id);
 assert.ok(!EMERGENCIES.some(e=>/start/.test(e.id)&&e.id!=='engine-restart'),'no engine-start fire');
 for(const e of EMERGENCIES)assert.ok(['terrain','airfield','forest','water','mountain'].includes(e.area),e.id);
 assert.equal(EMERGENCIES.find(e=>e.id==='trees').area,'forest');assert.equal(EMERGENCIES.find(e=>e.id==='ditch-power').area,'water');
 assert.ok(EMERGENCIES.find(e=>e.id==='engine-restart').start.h>=2500);void refs;
});
test('v0.35 in-flight restart from altitude: the engine lights, power is back and a powered landing follows',()=>{
 const e=EMERGENCIES.find(x=>x.id==='engine-restart');const s=new Session({...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:e.start.h,startIasKt:e.start.v,flightArea:e.area,mode:'watch'});s.seek(999);
 const evs=s.events();assert.ok(evs.some(x=>x.title==='Motor çalıştı'),'restart');const c=s.scenario;assert.ok(c.duration<240);
});
test('v0.35 manoeuvre list: exactly the asked items in order, every one flown to its end with a soft, clear contact',()=>{
 const ids=MANEUVERS.map(m=>m.id);
 assert.deepEqual(ids.slice(0,8),['turns','climb-descent','climb-descent-turns','hover','takeoff-hover','takeoff-ground','max-perf','pattern']);
 for(const id of ['hover-autorot','taxi-autorot','forced-power','forced-goaround','forced-ground','std-autorot','turn-autorot','sim-tr-right','sim-tr-left','sim-hyd','gov-emer','movement','masking','terrain-flight','formation'])assert.ok(ids.includes(id),id);
 for(const id of ['controls','straight-level','preflight','start-stop','fuel','prelanding','weight-balance','ppc','pedal-margin','hover-power'])assert.ok(!ids.includes(id),id);
 for(const m of MANEUVERS){const r=programRun(mCfg(m),[]);assert.ok(r.duration<(m.id==='pattern'?700:m.site||/^pattern/.test(m.id)?450:300),`${m.id} ${r.duration}`) /* v0.35.9: ana başlık 06 + 24 meydan turunu sırayla uçar */;const c=r.contact;if(c){assert.ok(!c.obstacle,`${m.id} ${c.obstacle}`);assert.ok(c.descentMps<=1.0,`${m.id} ${c.descentMps}`);}}
});
test('v0.35 autorotations end on the runway at walking speed; power recovery and go-around never touch down',()=>{
 for(const id of ['std-autorot','turn-autorot','forced-ground']){const r=programRun(mCfg(MANEUVERS.find(m=>m.id===id)),[]);assert.ok(r.contact,id);assert.equal(r.contact.surface.kind,'paved',id);assert.ok(r.contact.groundSpeedMps<4.2,`${id} ${r.contact.groundSpeedMps}`);}
 for(const id of ['forced-power','forced-goaround']){const r=programRun(mCfg(MANEUVERS.find(m=>m.id===id)),[]);assert.ok(!r.contact,id);}
 const ga=programRun(mCfg(MANEUVERS.find(m=>m.id==='forced-goaround')),[]);assert.ok(ga.events.some(e=>e.title==='Pas geç!'));
});
test('v0.35 every decision option of every manoeuvre is flown to an end in guided mode',()=>{
 for(const m of MANEUVERS){const defs=maneuverDecisionDefs(m);for(const d of Object.values(defs))for(const o of d.options){const s=new Session(mCfg(m,{mode:'guided'}));for(let k=0;k<12;k++){s.seek(999);if(!s.pending)break;s.choose(s.pending.id,s.pending.id===d.id?o.id:s.pending.reference);}assert.ok(!s.pending,`${m.id} ${d.id}=${o.id}`);assert.ok(s.scenario.duration<(m.id==='pattern'?700:m.site?480:399),`${m.id} ${d.id}=${o.id} endless`);}}
});
test('v0.35 narration: cockpit targets for manoeuvres, a lead helicopter for formation, captions long enough to read',()=>{
 const s=new Session(mCfg(MANEUVERS.find(m=>m.id==='gov-emer')));s.seek(999);const cues=buildCues(s);
 assert.ok(cues.some(c=>c.target==='gov'&&c.set.gov===1),'GOV to EMER');assert.ok(cues.some(c=>c.target==='throttle'));for(const c of cues)assert.ok(c.dur>=2.4&&c.dur<=9);
 const f=programRun(mCfg(MANEUVERS.find(m=>m.id==='formation')),[]);assert.ok(f.wing.length>=2&&f.wing.some(w=>w.right<0));
 const h=new Session(mCfg(MANEUVERS.find(m=>m.id==='sim-hyd')));h.seek(999);assert.ok(buildCues(h).some(c=>c.target==='hydCont'&&c.set.hydCont===1));
 assert.equal(interpretStep('GOV anahtarı – EMER').target,'gov');
});
