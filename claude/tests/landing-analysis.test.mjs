import test from 'node:test';import assert from 'node:assert/strict';
import {stoppingAssessment} from '../../landing-analysis.js';import {structuralContact} from '../../structural-contact.js';import {contactSeverity} from '../../contact-assessment.js';
import {Session} from '../../engine.js';import {completeSession} from './session-helpers.js';import {flightState} from '../../flight-dynamics.js';import {DEFAULT_CONFIG} from '../../catalog.js';
test('2000 ft/min late-response screening uses consistent SI units and available height',()=>{
 const w=2000*.3048/60,a=stoppingAssessment({heightM:5,descentMps:w,upAccelMps2:4});
 assert.equal(w,10.16);assert.ok(Math.abs(a.stoppingDistanceM-16.4592)<1e-9);assert.ok(a.insufficient);assert.ok(a.optimisticResidualMps>9.5);
 const b=stoppingAssessment({heightM:20,descentMps:w,upAccelMps2:4});assert.equal(b.insufficient,false);assert.equal(b.optimisticResidualMps,0);
 assert.equal(stoppingAssessment({heightM:5,descentMps:w,upAccelMps2:0}).stoppingDistanceM,null);
 assert.throws(()=>stoppingAssessment({heightM:NaN,descentMps:w,upAccelMps2:4}));
});
test('contact index is bounded, energy-normalized and explicitly not a damage probability',()=>{
 assert.equal(contactSeverity(.5).percent,1);assert.equal(contactSeverity(5).percent,100);assert.equal(contactSeverity(10).percent,100);assert.equal(contactSeverity(10).saturated,true);
 assert.match(contactSeverity(.5).color,/118.8/);assert.match(contactSeverity(5).color,/hsl\(0 /);
 let prev=-1;for(let w=0;w<12;w+=.1){const s=contactSeverity(w);assert.ok(s.percent>=prev);prev=s.percent;assert.ok(s.label.split(' ').length<=2);}
 assert.throws(()=>contactSeverity(Infinity));
});
const p={contact:{time:5,descentMps:2},massKg:1000,liftN:9806.65,pitch:0,roll:0};
const model={source:'analytic synthetic test only',minMassKg:500,maxMassKg:2000,maxAttitudeDeg:5,curve:[{strokeM:0,forceN:10000},{strokeM:1,forceN:10000}]};
test('structural foundation integrates force/stroke, refuses absent data and limits its envelope',()=>{
 assert.equal(structuralContact(p).available,false);let r=structuralContact(p,model);assert.ok(Math.abs(r.strokeM-.2)<1e-10);assert.equal(r.peakForceN,10000);assert.equal(r.capacityExceeded,false);
 r=structuralContact({...p,contact:{...p.contact,descentMps:5}},model);assert.equal(r.capacityExceeded,true);assert.ok(Math.abs(r.residualEnergyJ-2500)<1e-8);
 assert.equal(structuralContact({...p,pitch:.5},model).available,false);assert.equal(structuralContact({...p,contact:{time:5,descentMps:0}},model).strokeM,0);
 assert.throws(()=>structuralContact(p,{...model,curve:[model.curve[0],model.curve[0]]}));
 // Softening force: first root is valid even when endpoint net work falls below initial energy.
 r=structuralContact({...p,liftN:0}, {...model,curve:[{strokeM:0,forceN:19806.65},{strokeM:1,forceN:0}]});assert.equal(r.capacityExceeded,false);assert.ok(r.strokeM<.3);
});
test('v0.52 automatic pedal option removed: sessions always use the pilot pedal; physics keeps the fixed-pedal path',()=>{
 assert.equal(new Session().config.pedalMode,'auto');assert.equal(new Session({pedalMode:'off'}).config.pedalMode,'auto');
 {const s=completeSession(new Session());assert.equal(Session.restore(s.serialize()).config.pedalMode,'auto');assert.ok(!s.answers.some(a=>a.id==='yaw'));}
 const old=new Session().serialize();old.schemaVersion=7;delete old.config.pedalMode;assert.equal(Session.restore(old).config.pedalMode,'auto');
 const sc={height:600,ias:0},choices=[{id:'priority',at:4,option:'diagnose'}],off=flightState(7,sc,{...DEFAULT_CONFIG,pedalMode:'off'},choices),auto=flightState(7,sc,DEFAULT_CONFIG,choices);
 assert.equal(off.controls.pedal,0);assert.ok(auto.controls.pedal>0);assert.notEqual(off.roll,auto.roll);assert.notEqual(off.velocityMps[0],auto.velocityMps[0]);
});
test('late-response evidence and animation use the same continuous state, report vanishes on rewind',()=>{
 const s=completeSession(new Session({scenario:'safe'}),{cushion:'late'}),e=s.evidence();assert.ok(e.events.some(e=>e.title.includes('durdurma payı')));assert.ok(e.summary.contact.descentMps>0);
 assert.deepEqual(Session.restore(s.serialize()).evidence(),e);const contact=s.snapshot().renderFrame.physicalState;assert.equal(contact.contact.descentMps,e.summary.contact.descentMps);
 s.seek(3);assert.equal(s.snapshot().renderFrame.physicalState.contact,null);
});
