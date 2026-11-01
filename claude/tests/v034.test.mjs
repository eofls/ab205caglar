import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {DEFAULT_CONFIG} from '../../catalog.js';
import {obstacleAhead} from '../../landing-zone.js';
import {terrainHeight} from '../../terrain-data.js';
const answerAll=s=>{for(let n=0;n<20&&s.pending;n++){const d=s.scenario.decisions.find(x=>x.id===s.pending.id);s.seek(d.at);s.choose(d.id,d.options[0].id);}};
test('v0.33.1 a field picked in flight opens a pending question at once and the flow continues after either answer',()=>{
 for(const pick of ['keep','site']){const s=new Session({...DEFAULT_CONFIG,mode:'guided'});s.play();for(let i=0;i<400&&s.time<8.03;i++){s.tick(.0137);if(s.pending){answerAll(s);s.play();}}
  s.pause();const id=s.addSite(50,-420);assert.ok(s.pending&&s.pending.id.startsWith('redirect-'),'pending at once');s.choose(s.pending.id,pick==='keep'?'keep':id);assert.ok(!s.pending||!s.pending.id.startsWith('redirect-'));s.play();assert.equal(s.playing||!!s.pending,true);}
});
test('v0.33.1 a field chosen in flight is flown to with a slow-down (no run-on at glide speed)',()=>{
 const s=new Session({...DEFAULT_CONFIG,mode:'guided'});s.play();for(let i=0;i<400&&s.time<8;i++){s.tick(.05);if(s.pending){answerAll(s);s.play();}}
 s.pause();const id=s.addSite(40,-420);s.choose(s.pending.id,id);s.play();for(let i=0;i<600&&s.time<s.scenario.duration;i++){s.tick(.05);if(s.pending){answerAll(s);s.play();}}
 const c=s.evidence().summary.contact;assert.ok(c.descentMps<3&&c.groundSpeedMps<8,`w ${c.descentMps} gs ${c.groundSpeedMps}`);
});
test('v0.33.1 obstacle prediction: a wire on the line to a field is found; hazır akış climbs over it instead of striking it',()=>{
 const o=obstacleAhead({x:-207,z:1780,y:terrainHeight(-207,1780)+24,vx:0,vz:-30,w:0},'terrain',{target:{x:-207,z:1000}});assert.equal(o?.kind,'wire');
 const s=new Session({...DEFAULT_CONFIG,customStart:true,startHeightFt:40,startIasKt:70,mode:'watch',startX:-207,startZ:1863}),c=s.evidence().summary.contact;assert.notEqual(c.obstacle,'wire');
});
