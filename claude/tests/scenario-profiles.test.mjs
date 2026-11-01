import {completeSession} from './session-helpers.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';import {PROFILES} from '../../scenario-profiles.js';import {sampleScene,terrainHeight} from '../../scene-motion.js';
test('four profile contexts each have four distinct combined outcomes',()=>{
 const titles=new Set();for(const id of Object.keys(PROFILES)){const results=new Set();for(const first of ['control','diagnose'])for(const second of ['shared','distant']){
  const s=new Session({scenario:id});titles.add(s.scenario.decisions[0].title);completeSession(s,{priority:first,landing:second,recovery:'hold',criticalRotor:'hold',yaw:'hold'});results.add(s.snapshot().current.text);assert.equal(s.snapshot().current.kind,'Sonuç');assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());
 }assert.equal(results.size,4);}assert.equal(titles.size,4);
});
test('custom point never inherits an authored low-level case, even at identical coordinates',()=>{
 const s=new Session({customStart:true,startHeightFt:40,startIasKt:70});assert.equal(s.scenario.id,'custom');assert.doesNotMatch(s.scenario.decisions[0].title,/40 ft/);assert.ok(!s.events().some(e=>e.title.startsWith('S04')));
});
test('case animation branches stay continuous, rewindable and above terrain',()=>{
 for(const id of Object.keys(PROFILES)){
  const session=new Session({scenario:id}),sc=session.scenario,choices=[{id:'priority',at:8,option:'diagnose'},{id:'landing',at:25,option:'distant'}];
  assert.deepEqual(sampleScene(7,sc,session.config,choices),sampleScene(7,sc,session.config));
  for(const t of [4,8,25,sc.duration-5]){const a=sampleScene(t-1e-5,sc,session.config,choices),b=sampleScene(t+1e-5,sc,session.config,choices);for(let i=0;i<3;i++)assert.ok(Math.abs(a.position[i]-b.position[i])<.001);}
  assert.ok(sampleScene(30,sc,session.config,choices).physicalState.contact);
  assert.deepEqual(sampleScene(sc.duration,sc,session.config,choices).position,sampleScene(sc.duration+10,sc,session.config,choices).position);
  for(let headingDeg=0;headingDeg<360;headingDeg+=30)for(let t=0;t<=sc.duration;t++){const p=sampleScene(t,sc,{...session.config,headingDeg},choices).position;assert.ok(p[1]>=terrainHeight(p[0],p[2]));}
 }
});
