import test from 'node:test';import assert from 'node:assert/strict';
import {flightState,flightEnd} from '../../flight-dynamics.js';import {DEFAULT_CONFIG} from '../../catalog.js';import {Session} from '../../engine.js';import {completeSession} from './session-helpers.js';import {controlDisplay,controlMarkup,renderControls} from '../../control-display.js';import {sampleScene} from '../../scene-motion.js';
const c={...DEFAULT_CONFIG,windKt:0},held=[{id:'priority',at:4,option:'diagnose'}];
test('within 600 ft full-power-loss envelope, held powered collective never passively restores RPM',()=>{
 for(const height of [3,20,100,600])for(const ias of [0,5,40,80])for(const windKt of [0,40])for(const grossWeightLb of [4000,9500]){
  const sc={height,ias},cfg={...c,windKt,windFromDeg:90,grossWeightLb},end=flightEnd(sc,cfg,held);let previous=324;
  for(let t=4.1;t<end.time;t+=.2){const p=flightState(t,sc,cfg,held);if(p.contact)continue;/* Rising real terrain can end flight before engine failure; test airborne rotor dynamics only. */assert.equal(p.controls.collective,1);assert.ok(p.rotorRpm<previous+1e-8,JSON.stringify({height,ias,windKt,grossWeightLb,t}));assert.ok(p.rotorPowerW<0);assert.equal(p.aerodynamics.autorotationCapture,0);previous=p.rotorRpm;}
 }
});
test('unloading changes actual pitch and permits energy-driven recovery; late response cannot restore history',()=>{
 const sc={height:600,ias:60},early=[{id:'priority',at:4,option:'control'}],late=[...held,{id:'recovery',at:6,option:'recover'}];
 const a=flightState(5.5,sc,c,early),b=flightState(5.5,sc,c,late);assert.ok(a.controls.collective<.9);assert.equal(b.controls.collective,1);assert.ok(a.rotorRpm>b.rotorRpm);assert.equal(b.rotorRpm,flightState(5.5,sc,c,held).rotorRpm);
 assert.ok(flightState(10,sc,c,early).rotorRateRpmS>0);assert.ok(controlDisplay(a).collective.angle>controlDisplay(b).collective.angle);assert.equal(controlDisplay(flightState(4.1,sc,c,early)).collective.arrow,'down');
});
test('IGE exception keeps initial collective but consumes rotor reserve; does not freeze RPM',()=>{
 const p=flightState(4.5,{height:3,ias:0},c,[{id:'priority',at:4,option:'control'}]);assert.equal(p.controls.collective,1);assert.ok(p.rotorRpm<324);assert.ok(p.rotorRateRpmS<0);
});
test('power-loss left yaw, right-pedal correction and RPM-dependent authority reach scene orientation',()=>{
 const sc={height:600,ias:0,duration:30},fixed=flightState(8,sc,{...c,pedalMode:'off'},held),choices=held,corrected=flightState(8,sc,c,choices);
 assert.ok(fixed.heading<0&&fixed.yaw.rate<0);assert.ok(corrected.controls.pedal>0);assert.ok(Math.abs(corrected.yaw.rate)<Math.abs(fixed.yaw.rate));assert.ok(corrected.yaw.authority<flightState(4,sc,c,choices).yaw.authority);
 assert.equal(sampleScene(8,sc,c,choices).heading,Math.PI/2-corrected.heading);assert.notEqual(sampleScene(8,sc,c,choices).heading,sampleScene(8,sc,{...c,pedalMode:'off'},held).heading);
 assert.deepEqual(controlDisplay(flightState(5,sc,c,choices)),controlDisplay(flightState(5,sc,c,held)));
});
test('critical prompts are state-gated, spaced, unique, disappear when no longer needed and migrate old records',()=>{
 const s=completeSession(new Session({scenario:'safe'}),{priority:'diagnose',recovery:'hold',criticalRotor:'hold',yaw:'hold'});assert.ok(s.answers.some(a=>a.id==='criticalRotor'));
 assert.equal(new Set(s.answers.map(a=>a.id)).size,s.answers.length);for(let i=1;i<s.answers.length;i++)assert.ok(s.answers[i].at-s.answers[i-1].at>=(['landing','cushion','finalPull'].includes(s.answers[i].id)?.35:1.25)-1e-8);
 const good=completeSession(new Session({scenario:'safe'}));assert.ok(!good.answers.some(a=>a.id==='criticalRotor'||a.id==='yaw'));
 const old=s.serialize();old.schemaVersion=6;old.answers=old.answers.filter(a=>!['criticalRotor','yaw'].includes(a.id));const restored=Session.restore(old);assert.ok(restored.answers.some(a=>a.id==='criticalRotor'&&a.option==='hold'));assert.deepEqual(Session.restore(restored.serialize()).snapshot(),restored.snapshot());
 s.seek(4);s.choose('priority','control');assert.equal(s.answers.length,1);assert.ok(!s.scenario.decisions.some(d=>d.id==='criticalRotor'));
});
test('SVG renderer moves both pedal pads and freezes all arrows at contact',()=>{
 const markup=controlMarkup(),nodes=new Map([...markup.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{attributes:{},setAttribute(k,v){this.attributes[k]=v;},textContent:''}])),root={querySelector:s=>nodes.get(s.slice(1))};
 const sc={height:400,ias:0},choices=[{id:'priority',at:4,option:'control'}];renderControls(root,flightState(4.2,sc,c,choices));assert.match(nodes.get('pedal-label').textContent,/sağ ileri/);assert.notEqual(nodes.get('right-pedal').attributes.transform,nodes.get('left-pedal').attributes.transform);assert.ok(nodes.get('pedal-arrow').attributes.d);
 renderControls(root,flightState(100,sc,c,choices));for(const k of ['pedal','collective','cyclic'])assert.equal(nodes.get(k+'-arrow').attributes.d,'');
});
