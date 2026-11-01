import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {flightState,flightEnd} from '../../flight-dynamics.js';
import {assessSpot,chooseLandingZone,naturalDistance,LZ_LIMITS} from '../../landing-zone.js';
import {obstacleHeight,terrainHeight,FARMSTEADS,treesInBox,surfaceProfile,bouldersInBox,buildingList,insidePolygon} from '../../terrain-data.js';
import {componentDamage} from '../../component-damage.js';
test('v0.33 world model: farm buildings and trees are collision volumes; surfaces are typed',()=>{
 {const bl=buildingList('terrain').find(q=>q.h>5);assert.ok(bl,'OSM yapıları çarpışma hacmi');const cx=(bl.minX+bl.maxX)/2,cz=(bl.minZ+bl.maxZ)/2;if(insidePolygon(cx,cz,bl.pts))assert.ok(obstacleHeight(cx,cz,'terrain')>terrainHeight(cx,cz,'terrain')+4);} /* v0.39 temsili çiftlikler yerine gerçek OSM yapıları */
 const t=treesInBox(-800,800,-1600,-200,'forest').reduce((a,b)=>b.height>a.height?b:a);assert.ok(obstacleHeight(t.x,t.z,'forest')>terrainHeight(t.x,t.z,'forest')+10);
 assert.equal(surfaceProfile(0,0,'water').kind,'water');assert.ok(['field','stubble','grass','dirt','wetland'].includes(surfaceProfile(300,-300,'terrain').kind));
 assert.ok(bouldersInBox(-1500,1500,-1500,1500,'mountain').length>100);
});
test('v0.33 landing-zone assessment rejects water, dense forest and steep rock; accepts open flat ground',()=>{
 assert.equal(assessSpot(0,0,'water').score,0);const t=treesInBox(-800,800,-1600,-200,'forest')[5];assert.equal(assessSpot(t.x,t.z,'forest').score,0);
 assert.ok(assessSpot(30,-380,'forest').score>.3,'meadow');assert.ok(LZ_LIMITS.slopeDeg===7);
 let steep=null;for(let x=-1800;x<1800&&!steep;x+=60)for(let z=-1800;z<1800&&!steep;z+=60){const q=assessSpot(x,z,'mountain');if(q.slopeDeg>12)steep=q;}assert.ok(steep&&steep.score===0);
});
test('v0.33 hazır akış picks a usable field near the natural glide distance and lands close to it',()=>{
 for(const area of ['terrain','mountain','airfield']){const s=new Session({customStart:true,startHeightFt:400,startIasKt:60,mode:'watch',flightArea:area}),ch=s.choices(),e=flightEnd(s.scenario,s.config,ch),p=flightState(e.time,s.scenario,s.config,ch);
  assert.ok(p.pilotSite.quality>.5,area);assert.ok(Math.hypot(p.position[0]-p.pilotSite.x,p.position[2]-p.pilotSite.z)<80,area);}
 assert.ok(naturalDistance(400,60)>naturalDistance(200,60)&&naturalDistance(400,80)>naturalDistance(400,60));
});
test('v0.33 map start: the failure happens at the placed point and the chosen skid height',()=>{
 const s=new Session({customStart:true,startHeightFt:300,startIasKt:60,startX:800,startZ:-600,mode:'watch'}),p=flightState(4,s.scenario,s.config,s.choices());
 assert.ok(Math.abs(p.position[0]-800)<1&&Math.abs(p.position[2]+600)<1);assert.ok(Math.abs(p.heightAglFt-300)<6);
});
test('v0.33 tail boom separates on a hard low-RPM impact or a hard tail-first strike, not on a normal landing',()=>{
 const base={massKg:2800,roll:0,pitch:0,ground:{secondaryContacts:[]}};
 assert.equal(componentDamage({...base,contact:{time:10,descentMps:1.5,groundSpeedMps:2,rotorRpm:250,part:'skidLeft'}}).breakup,false);
 assert.equal(componentDamage({...base,contact:{time:10,descentMps:10,groundSpeedMps:1,rotorRpm:290,part:'skidLeft'}}).breakup,true);
 assert.equal(componentDamage({...base,contact:{time:10,descentMps:7,groundSpeedMps:8,rotorRpm:300,part:'tailBoom'}}).breakup,true);
});
