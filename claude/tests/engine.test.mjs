import {completeSession} from './session-helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Session,weatherEffects} from '../../engine.js';
import {SCENARIOS,SOURCES,DEFAULT_CONFIG} from '../../catalog.js';
import {SCENE_SPEC} from '../../scene-contract.js';
test('Forward seek and fast playback cannot bypass an unanswered decision',()=>{
 const s=new Session();s.seek(100);assert.equal(s.time,s.scenario.decisions[0].at);assert.equal(s.pending.id,'priority');s.play();assert.equal(s.playing,false);
 s.choose('priority','control');s.play();s.tick(100);assert.equal(s.time,s.scenario.decisions[1].at);assert.equal(s.pending.id,'landing');
});
test('Rewinding removes future events and visible decisions, without losing replay history',()=>{
 const s=new Session();s.seek(s.scenario.decisions[0].at);s.choose('priority','diagnose');s.seek(s.scenario.decisions[1].at);s.choose('landing','distant');s.seek(48);
 const final=s.snapshot();s.seek(3);assert.equal(s.snapshot().answers.length,0);assert.equal(s.snapshot().events.some(e=>e.kind==='Karar'),false);
 s.seek(48);assert.deepEqual(s.snapshot(),final);
});
test('Changing an earlier decision invalidates all dependent decisions',()=>{
 const s=new Session();s.seek(s.scenario.decisions[0].at);s.choose('priority','diagnose');s.seek(s.scenario.decisions[1].at);s.choose('landing','distant');s.seek(s.scenario.decisions[0].at);s.choose('priority','control');
 assert.equal(s.answers.length,1);s.seek(48);assert.equal(s.time,s.scenario.decisions[1].at);assert.equal(s.snapshot().riskChoices,0);
});
test('All scenarios and branch combinations complete deterministically and cite known sources',()=>{
 for(const sc of SCENARIOS)for(const first of ['control','diagnose'])for(const second of ['shared','distant']){
  const s=new Session({scenario:sc.id});completeSession(s,{priority:first,landing:second,recovery:'hold',criticalRotor:'hold',yaw:'hold'});
  assert.equal(s.time,s.scenario.duration);assert.equal(s.snapshot().current.kind,'Sonuç');assert.equal(s.snapshot().renderFrame.physicalState.quality,'experimental');
  for(const e of s.events())for(const source of e.source)assert.ok(SOURCES[source]);
  assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());
 }
});
test('Ready-made viewing answers automatically, and pauses at the end',()=>{
 const s=new Session({mode:'watch'});s.play();s.tick(100);assert.equal(s.time,s.scenario.duration);assert.equal(s.snapshot().answers.length,s.scenario.decisions.length);assert.equal(s.playing,false);assert.equal(s.pending,undefined);
 assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());
});
test('Wrong-time and unknown decisions are rejected',()=>{
 const s=new Session();assert.throws(()=>s.choose('priority','control'));s.seek(s.scenario.decisions[0].at);assert.throws(()=>s.choose('priority','invented'));assert.throws(()=>s.choose('landing','shared'));
});
test('Malformed, skipped, duplicate and unsupported imported histories are rejected',()=>{
 const valid=new Session().serialize();assert.throws(()=>Session.restore({...valid,schemaVersion:99}));assert.throws(()=>Session.restore({...valid,time:40}));
 const a={id:'priority',option:'control',at:8};assert.throws(()=>Session.restore({...valid,time:8,answers:[a,a]}));
 assert.throws(()=>Session.restore({...valid,config:{...valid.config,temperatureC:NaN}}));assert.throws(()=>Session.restore({...valid,rate:Infinity}));
});
test('Vector components respect wind FROM direction and heading',()=>{
 let w=weatherEffects({...DEFAULT_CONFIG,windKt:10,windFromDeg:0,headingDeg:0});assert.equal(w.headwind,10);assert.equal(w.crosswind,0);
 w=weatherEffects({...DEFAULT_CONFIG,windKt:10,windFromDeg:180,headingDeg:0});assert.equal(w.headwind,-10);
 w=weatherEffects({...DEFAULT_CONFIG,windKt:10,windFromDeg:90,headingDeg:0});assert.ok(Math.abs(w.headwind)<1e-9);assert.equal(w.crosswind,10);
});
test('Environment and both crew profiles change explanations without inventing aircraft physics',()=>{
 const a=new Session(),b=new Session({temperatureC:35,visibilityKm:2,turbulence:'moderate',pilot:'developing',copilot:'experienced'});
 a.seek(3);b.seek(3);assert.notDeepEqual(a.snapshot().events,b.snapshot().events);assert.notDeepEqual(a.snapshot().renderFrame,b.snapshot().renderFrame);
});
test('Pause, playback rate and reverse seek preserve presentation state',()=>{
 const s=new Session();s.setRate(2);s.play();s.tick(2);assert.equal(s.time,4);s.pause();s.tick(2);assert.equal(s.time,4);s.seek(-99);assert.equal(s.time,0);
 assert.throws(()=>s.seek(NaN));assert.throws(()=>s.tick(-1));assert.throws(()=>s.setRate(8));
});
test('Display time is independent from physics and 3D dimensions retain declared assumptions',()=>{
 assert.equal(SCENE_SPEC.terrain.widthM,609.6);assert.equal(SCENE_SPEC.terrain.lengthM,2438.4);assert.equal(SCENE_SPEC.terrain.georeferenced,false);
 assert.equal(new Session().snapshot().renderFrame.physicalState.quality,'experimental');
});
