import test from 'node:test';
import assert from 'node:assert/strict';
import {pointToStart,startToPoint} from '../../chart-selection.js';
import {Session} from '../../engine.js';
test('Every selectable integer ft/kt roundtrips through image coordinates',()=>{
 for(let h=0;h<=600;h++)for(let v=0;v<=80;v++){
  const p=startToPoint(h,v);assert.deepEqual(pointToStart(p.x,p.y),{startHeightFt:h,startIasKt:v});
 }
 assert.equal(pointToStart(10,10),null);assert.equal(pointToStart(NaN,100),null);
});
test('Free selection changes actual session start and survives save/restore',()=>{
 const s=new Session({customStart:true,startHeightFt:237,startIasKt:43});
 assert.equal(s.scenario.height,237);assert.equal(s.scenario.ias,43);assert.match(s.events()[0].text,/237/);
 s.seek(s.scenario.decisions[0].at);s.choose('priority','control');assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());
});
test('Out-of-chart and fractional selections are rejected; old records remain compatible',()=>{
 assert.throws(()=>new Session({customStart:true,startHeightFt:1000,startIasKt:50}));
 assert.throws(()=>new Session({customStart:true,startHeightFt:4.5}));
 assert.throws(()=>new Session({customStart:true,startIasKt:81}));
 const s=new Session({scenario:'safe'});const old=s.serialize();delete old.config.startHeightFt;delete old.config.startIasKt;delete old.config.customStart;
 const restored=Session.restore(old);assert.equal(restored.scenario.height,400);assert.equal(restored.config.startIasKt,60);
});
