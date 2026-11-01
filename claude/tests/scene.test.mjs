import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';
import {createHelicopter,DIMENSIONS} from '../../scene-model.js';
import {sampleScene,terrainHeight} from '../../scene-motion.js';
import {SCENARIOS,DEFAULT_CONFIG} from '../../catalog.js';
test('3D model has finite geometry and a source-scaled two-blade rotor',()=>{
 const m=createHelicopter();let count=0;m.root.traverse(o=>{if(o.isMesh){count++;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});assert.ok(count>20);
 assert.ok(Math.abs(DIMENSIONS.rotorDiameterM-12.556)<.01);assert.ok(Math.abs(m.rotor.position.x+.3)<1e-9);assert.ok(Math.abs(m.rotor.position.y-3.59)<1e-6);
});
test('Every starting height is respected and rewind produces identical illustrative state',()=>{
 for(const s of SCENARIOS){const first=sampleScene(0,s,DEFAULT_CONFIG);assert.equal(first.position[1],s.height*.3048);const middle=sampleScene(12,s,DEFAULT_CONFIG);sampleScene(s.duration,s,DEFAULT_CONFIG);assert.deepEqual(sampleScene(12,s,DEFAULT_CONFIG),middle);assert.ok(sampleScene(4,s,DEFAULT_CONFIG).rotorAngle>0);assert.equal(sampleScene(4,s,DEFAULT_CONFIG).powered,false);}
 for(const height of [0,1,600])assert.equal(sampleScene(0,{height,ias:50,duration:48},DEFAULT_CONFIG).position[1],height*.3048);
});
test('Paths stay over flat corridor for all available headings, heights and speeds',()=>{
 for(let headingDeg=0;headingDeg<360;headingDeg+=10)for(const height of [0,1,600])for(const ias of [0,80])for(let t=0;t<=60;t++){
 const s=sampleScene(t,{height,ias,duration:60},{...DEFAULT_CONFIG,headingDeg});const [x,y,z]=s.position;assert.ok(y>=terrainHeight(x,z));assert.ok(s.position.every(Number.isFinite));}
});
test('S01 choreography is continuous at every phase and decision boundary',()=>{
 const sc=SCENARIOS.find(s=>s.id==='safe');
 for(const first of ['control','diagnose'])for(const second of ['shared','distant']){
  const choices=[{id:'priority',at:8,option:first},{id:'landing',at:25,option:second}];
  for(const t of [4,8,18,25,40,48,55]){const a=sampleScene(t-1e-5,sc,DEFAULT_CONFIG,choices),b=sampleScene(t+1e-5,sc,DEFAULT_CONFIG,choices);for(let i=0;i<3;i++)assert.ok(Math.abs(a.position[i]-b.position[i])<.001);assert.ok(Math.abs(a.pitch-b.pitch)<.001);assert.ok(Math.abs(a.heading-b.heading)<.001);}
 }
});
test('S01 all branches and headings keep geometry above terrain without claiming a landing',()=>{
 const sc=SCENARIOS.find(s=>s.id==='safe');for(const first of ['control','diagnose'])for(const second of ['shared','distant'])for(let headingDeg=0;headingDeg<360;headingDeg+=10)for(let t=0;t<=60;t+=.5){
 const choices=[{id:'priority',at:8,option:first},{id:'landing',at:25,option:second}],s=sampleScene(t,sc,{...DEFAULT_CONFIG,headingDeg},choices),[x,y,z]=s.position;
 assert.ok(y>=terrainHeight(x,z));assert.ok(s.position.every(Number.isFinite));assert.equal(s.visualOnly,false);
 }
});
