import test from 'node:test';import assert from 'node:assert/strict';
import {controlTargets} from '../../flight-controls.js';
import {Session} from '../../engine.js';import {flightState} from '../../flight-dynamics.js';import {completeSession} from './session-helpers.js';
const p={rpm:324,rotorInertia:2711,mass:2800,height:122,ias:60,groundHold:false,tasFactor:1,powerFraction:0,pedalMode:'auto'};
test('10–15 ft descending final arrest cannot be overridden by stale rotor/VRS recovery or reverse collective',()=>{
 for(const autonomous of [false,true])for(const h of [10,12,15])for(const rpm of [250,300,340]){
  const s={t:15,y:h*.3048,w:1,v:6,omega:rpm*Math.PI/30,collective:1.5,cushionActive:true};
  const choices=[{id:'priority',option:'control',at:4},{id:'landing',option:'shared',at:6},{id:'criticalRotor',option:'unload',at:7},{id:'vrs',option:'exit',at:8}];
  const c=controlTargets(s,{...p,autonomous},choices,8);assert.ok(c.cushion);assert.ok(c.collective>=s.collective);assert.match(c.phase,/son kollektif/);
 }
});
test('late recovery offers final collective on both landing routes and preserves physical continuity',()=>{
 for(const powerLossMode of ['total','partial'])for(const landing of ['shared','distant']){
  const s=completeSession(new Session({scenario:'safe',powerLossMode}),{priority:'diagnose',recovery:'recover',landing});
  assert.ok(s.answers.some(a=>a.id==='cushion'));const t=s.answers.find(a=>a.id==='recovery').at;
  const a=flightState(t,s.scenario,s.config,s.answers),b=flightState(t,s.scenario,s.config,s.answers.filter(x=>x.at<t));
  assert.equal(a.rotorRpm,b.rotorRpm);assert.equal(a.descentFpm,b.descentFpm);assert.deepEqual(a.position,b.position);
  assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());
 }
});
test('all starts keep final descending collective nondecreasing in ready flow',()=>{
 let n=0;for(const startHeightFt of [15,100,400])for(const startIasKt of [0,30,60])for(const powerLossMode of ['total','partial']){
  const s=new Session({customStart:true,startHeightFt,startIasKt,powerLossMode,mode:'watch'}),sc=s.scenario;
  for(let t=4;t<sc.duration;t+=.1){const a=flightState(t,sc,s.config,[]);if(a.contact)break;if(a.heightAglFt<=15&&a.descentFpm>0&&a.controls.cushion){n++;assert.ok(a.controls.collectiveRate>=-1e-8);}}
 }assert.ok(n>0);
});
test('schema9 distant-route record migrates new terminal decisions and remains replayable',()=>{
 const raw={schemaVersion:9,appVersion:'0.20.0',config:new Session({scenario:'safe'}).config,time:20,rate:1,answers:[{id:'priority',option:'diagnose',at:4},{id:'recovery',option:'recover',at:5.3},{id:'landing',option:'distant',at:6.6}]};
 const s=Session.restore(raw);assert.ok(s.answers.some(a=>a.id==='cushion'));assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());
});
