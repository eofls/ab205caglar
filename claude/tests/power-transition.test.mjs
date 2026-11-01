import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {SCENARIOS} from '../../catalog.js';
test('initial HUD references do not silently overwrite aircraft input',()=>{
 const s=new Session(),p=s.snapshot().power;assert.equal(p.rotor.rpm,324);assert.equal(p.engine.rpm,6600);assert.equal(p.rotor.quality,'reference');assert.equal(s.config.initialRotorRpm,null);
 const entered=new Session({initialRotorRpm:320,initialEngineRpm:6500});assert.equal(entered.snapshot().power.rotor.rpm,320);assert.equal(entered.snapshot().power.engine.quality,'declared');
});
test('failure starts with continuous RPM and integrates independent experimental states',()=>{
 for(const scenario of SCENARIOS){const s=new Session({scenario:scenario.id,mode:'watch'});s.seek(3.999);assert.equal(s.snapshot().power.powered,true);s.seek(4);const p=s.snapshot().power;assert.ok(Math.abs(p.rotor.rpm-324)<.001);assert.equal(p.engine.rpm,6600);assert.match(p.note,/Deneysel/);s.seek(s.scenario.duration);assert.ok(Number.isFinite(s.snapshot().power.rotor.rpm));}
});
test('pause, playback, rewind and import reproduce the same power state',()=>{
 const s=new Session({scenario:'safe',mode:'watch'});s.play();s.tick(5);const at5=s.snapshot().power;s.pause();s.tick(10);assert.deepEqual(s.snapshot().power,at5);s.seek(18);const later=s.snapshot().power;assert.deepEqual(Session.restore(s.serialize()).snapshot().power,later);s.seek(0);assert.equal(s.snapshot().power.rotor.rpm,324);s.seek(5);assert.deepEqual(s.snapshot().power,at5);
});
test('future crew choices never leak into rewound power descriptions',()=>{
 const s=new Session({scenario:'safe'});s.seek(s.scenario.decisions[0].at);s.choose('priority','diagnose');s.seek(12);assert.match(s.snapshot().power.explanation,/İki pilotun/);s.seek(3);assert.doesNotMatch(s.snapshot().power.explanation,/İki pilotun/);assert.equal(s.snapshot().power.physicalState.quality,'experimental');
});
