import {completeSession} from './session-helpers.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';import {flightState} from '../../flight-dynamics.js';import {flightOverlays} from '../../flight-overlays.js';import {comparisonRows,resultRows} from '../../scenario-book.js';
function finish(first='control',landing='shared',recovery='hold',config={}){return completeSession(new Session({scenario:'safe',...config}),{priority:first,landing,recovery});}
test('conditional recovery requires unmanaged falling rotor and remaining height; cannot skip or repeat it',()=>{
 const s=new Session({scenario:'safe'});s.seek(4);s.choose('priority','diagnose');s.seek(999);assert.equal(s.pending.id,'recovery');const p=s.snapshot().renderFrame.physicalState;assert.ok(p.rotorRateRpmS<0&&p.heightAglFt>60);assert.throws(()=>s.choose('landing','shared'));s.choose('recovery','hold');s.seek(999);assert.equal(s.pending.id,'criticalRotor');assert.ok(s.snapshot().renderFrame.physicalState.rotorRpm<324*.85);s.choose('criticalRotor','hold');s.seek(999);assert.equal(s.pending.id,'landing');
 for(const scenario of ['safe','hover','avoid-fast']){const a=new Session({scenario});a.seek(4);a.choose('priority','control');assert.ok(!a.scenario.decisions.some(d=>d.id==='recovery'));}
});
test('delayed control retains lost energy; hold does not enable hidden recovery with near-field selection',()=>{
 const held=finish('diagnose','shared','hold'),late=finish('diagnose','shared','recover');const t=late.answers.find(a=>a.id==='recovery').at;
 assert.equal(flightState(t,late.scenario,late.config,late.answers).rotorRpm,flightState(t,held.scenario,held.config,held.answers).rotorRpm);
 assert.equal(flightState(6,held.scenario,held.config,held.answers).controls.managed,false);
 assert.equal(flightState(6,late.scenario,late.config,late.answers).controls.managed,true);
 assert.notEqual(held.evidence().summary.duration,late.evidence().summary.duration);
 for(const s of [held,late])assert.deepEqual(Session.restore(s.serialize()).evidence(),s.evidence());
});
test('near and far follow fixed ordered targets; predicted miss is reported rather than forced success',()=>{
 for(const headingDeg of [0,90,180,270]){const a=finish('control','shared','hold',{headingDeg}),b=finish('control','distant','hold',{headingDeg});const pa=a.snapshot().renderFrame.physicalState,pb=b.snapshot().renderFrame.physicalState;
 assert.notDeepEqual(pa.position,pb.position);assert.ok(pa.landingTargets[0].x*pa.landingTargets[0].ux+pa.landingTargets[0].z*pa.landingTargets[0].uz < pa.landingTargets[1].x*pa.landingTargets[1].ux+pa.landingTargets[1].z*pa.landingTargets[1].uz);assert.ok(b.answers.some(x=>x.id==='approach')); /* Far route now offers braking; it is not forced to hit faster. */ // Intended target order is guaranteed; a failed far attempt is not forced to travel farther.
 const o=flightOverlays(b.time,b.scenario,b.config,b.choices());assert.equal(o.targets[1].selected,true);assert.ok(o.targetErrorM>=0);assert.deepEqual(o.prediction.filter((_,i)=>i!==1),pb.position.filter((_,i)=>i!==1));}
});
test('all cases and custom starts share causal airflow and moving touchdown prediction; rewind hides future landing choice',()=>{
 for(const config of [{scenario:'safe'},{scenario:'hover'},{scenario:'caution'},{scenario:'avoid-low'},{customStart:true,startHeightFt:173,startIasKt:37}]){
 const s=new Session({...config,mode:'watch'}),time=Math.min(5,s.scenario.duration-.01),o=flightOverlays(time,s.scenario,s.config,s.choices());assert.equal(o.airflow,true);assert.ok(o.prediction.every(Number.isFinite));assert.equal(flightOverlays(3,s.scenario,s.config,s.choices()).airflow,false);assert.equal(flightOverlays(s.scenario.duration,s.scenario,s.config,s.choices()).airflow,false);
 const earlier=flightOverlays(4.05,s.scenario,s.config,s.choices());assert.deepEqual(earlier,flightOverlays(4.05,s.scenario,s.config,s.choices().filter(a=>a.at<=4.05)));
 assert.deepEqual(o.targets.map(t=>t.position),earlier.targets.map(t=>t.position));
 }
});
test('schema3 migrates held controls explicitly and report compares by ID without showing future outcomes',()=>{
 const old={schemaVersion:3,appVersion:'0.14.0',config:new Session({scenario:'safe'}).config,time:30,rate:1,answers:[{id:'priority',option:'diagnose',at:4},{id:'landing',option:'distant',at:11}]};const s=Session.restore(old);assert.equal(s.answers.find(a=>a.id==='recovery').option,'hold');assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());
 const b=finish();assert.ok(comparisonRows(s,b).some(r=>r.label==='Koşullu devir kararı'));assert.ok(resultRows(b).some(r=>r.label==='Temas · düşey / yer sürati'));b.seek(0);assert.equal(resultRows(b).length,1);
});
