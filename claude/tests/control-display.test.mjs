import test from 'node:test';import assert from 'node:assert/strict';
import {controlDisplay} from '../../control-display.js';import {flightState} from '../../flight-dynamics.js';import {DEFAULT_CONFIG} from '../../catalog.js';import {Session} from '../../engine.js';import {completeSession} from './session-helpers.js';import {decisionEffect} from '../../decision-comparison.js';import {targetGuidance} from '../../flight-guidance.js';
const c={...DEFAULT_CONFIG,windKt:0},sc={height:400,ias:60};
test('collective indicator follows actual actuator direction, not choice title, and rewinds deterministically',()=>{
 const choices=[{id:'priority',at:4,option:'control'}],p=flightState(4.1,sc,c,choices),v=controlDisplay(p);assert.equal(v.collective.arrow,'down');assert.match(v.collective.label,/aşağı/);
 const start=controlDisplay(flightState(3,sc,c,choices));assert.equal(start.collective.arrow,null);assert.equal(start.pedal.available,true);
 flightState(20,sc,c,choices);assert.deepEqual(controlDisplay(flightState(4.1,sc,c,choices)),v);
 assert.deepEqual(controlDisplay(flightState(3,sc,c,choices)),controlDisplay(flightState(3,sc,c,[])));
});
test('cyclic components remain body-relative through heading changes',()=>{
 let reference;for(const headingDeg of [0,90,180,270]){const p=flightState(4.1,{height:400,ias:20},{...c,headingDeg},[{id:'priority',at:4,option:'control'}]);assert.ok(p.controls.cyclicForward>0);if(reference)assert.ok(Math.abs(p.controls.cyclicRight-reference.controls.cyclicRight)<1e-10);reference=p;assert.match(controlDisplay(p).cyclic.label,/ileri/);}
});
test('contact freezes control arrows and positions, unsupported model shows no fictitious command',()=>{
 const p=flightState(100,sc,c),v=controlDisplay(p);assert.ok(p.contact);assert.equal(v.collective.arrow,null);assert.equal(v.cyclic.dx,0);assert.equal(v.cyclic.dy,0);assert.deepEqual(controlDisplay(flightState(110,sc,c)),v);
 const u=controlDisplay(flightState(3,sc,{...c,initialRotorRpm:1}));assert.equal(u.collective.arrow,null);assert.match(u.cyclic.label,/hesap yok/);
});
test('target guidance limits air-relative command, not ground command, in strong wind',()=>{
 const p={ias:80,tasFactor:1,heading:0,height:120,windX:20,windZ:20},s={x:0,z:0,y:120,w:20};const g=targetGuidance(s,p,'distant');assert.ok(Math.hypot(g.groundX-p.windX,g.groundZ-p.windZ)<=80*1852/3600+1e-9);
});
test('comparison explains observed deltas, refuses causal claim across conditions, and hides future results',()=>{
 const a=completeSession(new Session({scenario:'safe'})),b=completeSession(new Session({scenario:'safe'}),{cushion:'early'});assert.match(decisionEffect(a,b),/Mevcut − kayıtlı/);assert.match(decisionEffect(a,b),/son kollektif/);
 assert.match(decisionEffect(a,a),/karar farkı yok/);const other=completeSession(new Session({scenario:'safe',windKt:20}));assert.match(decisionEffect(a,other),/yalnız kumanda kararına bağlanamaz/);a.seek(0);assert.match(decisionEffect(a,b),/tamamlandığında/);
});
