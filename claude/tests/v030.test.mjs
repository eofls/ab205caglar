import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {flightState,localAir} from '../../flight-dynamics.js';
import {terrainHeight} from '../../terrain-data.js';
import {approachPlan} from '../../flight-guidance.js';
import {glideSpeedKt} from '../../adaptive-pilot.js';
import {APPROVED_REFERENCE_CHOICES as A} from '../../catalog.js';
const finish=(s,pref={})=>{for(let i=0;i<30;i++){s.seek(999);if(!s.pending)return s;const p=s.pending;s.choose(p.id,pref[p.id]??A[p.id]??p.options[0].id);}throw Error('decision loop');};

test('a field marked while the landing question is open joins that question instead of a parallel redirect',()=>{
 const s=new Session({scenario:'safe'});s.seek(999);s.choose('priority','control');s.seek(999);assert.equal(s.pending.id,'landing');
 const id=s.addSite(300,-500);assert.equal(s.config.customSites[0].at,undefined);assert.equal(s.pending.id,'landing');assert.ok(s.pending.options.some(o=>o.id===id));
 s.choose('landing',id);finish(s);assert.ok(!s.answers.some(a=>a.id==='landing'&&a.option!==id),'landing must not be re-asked with auto sites');
});
test('a field marked after the landing answer opens its redirect at once and wins over a decision pending at the same instant',()=>{
 const s=new Session({scenario:'safe'});s.seek(999);s.choose('priority','control');s.seek(999);s.choose('landing','distant');s.seek(999);const other=s.pending?.id;
 const id=s.addSite(-200,-400);assert.equal(s.pending.id,'redirect-3');s.choose('redirect-3',id);
 if(other){assert.notEqual(s.pending?.id,'redirect-3');}
 finish(s);assert.ok(s.answers.some(a=>a.id==='redirect-3'&&a.option===id));
});
test('adding a field before the landing question keeps playback running',()=>{const s=new Session({scenario:'safe'});s.seek(4.5);s.play();s.addSite(100,-300);assert.equal(s.playing,!s.pending);});
test('approach decision for a chosen field names the field and reports the energy estimate',()=>{
 const s=new Session({customStart:true,startHeightFt:400,startIasKt:60});s.addSite(0,-900);s.seek(999);s.choose('priority','control');s.seek(999);s.choose('landing','site-3');s.seek(999);
 assert.equal(s.pending.id,'approach-3');assert.match(s.pending.title,/3\. aday saha/);assert.match(s.pending.options[0].text,/süzülüş/);
});
test('approach planner: far field flies a faster glide, close field stretches the path instead of slowing below glide speed',()=>{
 const p={ias:60,tasFactor:1,heading:0,windX:0,windZ:0,rpm:324,mass:2800};
 const far=approachPlan({x:0,z:0,y:120,vx:0,vz:-31,w:10,t:8},p,{x:0,z:-900}),near=approachPlan({x:0,z:0,y:120,vx:0,vz:-31,w:10,t:8},p,{x:0,z:-150});
 assert.ok(far.kias>63&&far.kias<=66,'speed change is rate-limited from the current airspeed');assert.equal(far.reachable,false);
 assert.ok(near.stretch>.3);assert.ok(near.kias>=55);
});
test('glide entry: low and fast never dives to accelerate; high enough settles at the glide speed',()=>{
 const p={ias:50,tasFactor:1,groundHold:false};const kt=1852/3600;
 assert.ok(glideSpeedKt({y:40,v:50*kt},p)<=50+1e-9);assert.ok(glideSpeedKt({y:30,v:75*kt},p)<=75+1e-9);assert.equal(glideSpeedKt({y:150,v:50*kt},p),80); /* v0.33: TR standart otorotasyon 80 KIAS */
});
test('air mass: configured wind during powered flight, calm surface layer near the ground, deterministic gusts',()=>{
 const p={windX:10,windZ:0,turbulence:'moderate',flightArea:'terrain'};
 assert.deepEqual(localAir({t:2,x:0,z:0},p,1),{x:10,z:0,up:0,gust:0});
 const low=localAir({t:6,x:0,z:0},{...p,turbulence:'none'},1),high=localAir({t:6,x:0,z:0},{...p,turbulence:'none'},50);assert.ok(low.x<high.x*.6);assert.equal(high.x,10);
 const a=localAir({t:9.3,x:0,z:0},p,60),b=localAir({t:9.3,x:0,z:0},p,60);assert.deepEqual(a,b);assert.notEqual(a.up,0);
});
test('mountain: windward slope lifts, lee slope sinks; low powered start keeps its AGL on the entry strip',()=>{
 let lift=0,sink=0;for(let x=-2400;x<=2400;x+=200)for(let z=-2400;z<=600;z+=200){const u=localAir({t:6,x,z},{windX:10,windZ:0,turbulence:'none',flightArea:'mountain'},40).up;lift=Math.max(lift,u);sink=Math.min(sink,u);}
 assert.ok(lift>.5&&sink<-.5); /* v0.39 Tepeler gerçek arazi: düz giriş şeridi yok */
 const s=new Session({scenario:'caution',flightArea:'mountain',mode:'watch'});assert.ok(s.evidence().summary.contact.time>8);
});
test('watch mode keeps flare RPM inside the rotor limit band (DCS/TR anchors: ≈330–340 in the flare)',()=>{
 const s=new Session({scenario:'safe',mode:'watch'}),sc=s.scenario;let peak=0;for(let t=5;t<sc.duration;t+=.1){const p=flightState(t,sc,s.config,s.choices());if(p.contact)break;peak=Math.max(peak,p.rotorRpm);}
 assert.ok(peak<=342,`peak ${peak}`);
});
test('guided overspeed choice is offered while RPM is still rising in the flare',()=>{
 const s=finish(new Session({scenario:'safe'}));const o=s.answers.find(a=>a.id==='overspeed');assert.ok(o);assert.ok(flightState(o.at,s.scenario,s.config,s.answers.filter(a=>a.at<o.at)).rotorRpm<342);
});
test('low and fast guided start is offered a flare before the final collective',()=>{
 const s=finish(new Session({scenario:'caution'}));const ids=s.answers.map(a=>a.id);assert.ok(ids.includes('flare'));assert.ok(ids.indexOf('flare')<ids.indexOf('finalPull'));
});
