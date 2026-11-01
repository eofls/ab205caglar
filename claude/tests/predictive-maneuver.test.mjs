import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';import {flightState} from '../../flight-dynamics.js';import {completeSession} from './session-helpers.js';import {sampleScene} from '../../scene-motion.js';import * as T from '../../vendor/three.module.js';
test('predictive pilot evaluates physical alternatives, keeps baseline candidate and replays without state injection',()=>{
 const s=new Session({scenario:'safe',mode:'watch'}),sc=s.scenario;
 assert.equal(flightState(3,sc,s.config).pilotForecast,null);
 const p=flightState(18,sc,s.config),f=p.pilotForecast;assert.ok(f.candidates.length>=3);assert.ok([2,3].includes(f.horizon));
 const chosen=f.candidates.find(x=>x.action===f.action),reference=f.candidates.find(x=>x.action==='reference');assert.ok(chosen.score<=reference.score);assert.ok(f.candidates.every(x=>[x.score,x.rotorRpm,x.descentMps,x.heightM].every(Number.isFinite)));
 const baseline=flightState(18,sc,{...s.config,predictivePilot:false});assert.notEqual(p.iasKt,baseline.iasKt);
 s.seek(18);const saved=s.snapshot();s.seek(3);s.seek(18);assert.deepEqual(s.snapshot(),saved);assert.deepEqual(Session.restore(s.serialize()).snapshot(),saved);
 const next=flightState(18.001,sc,s.config);assert.ok(Math.abs(next.rotorRpm-p.rotorRpm)<1);assert.ok(Math.abs(next.pitch-p.pitch)<.01);
});
test('level-off prompt requires real braking and nose-up motion, not a flare label or early collective',()=>{
 for(const options of [{},{flare:'late'},{flare:'omit'},{cushion:'early'},{landing:'distant'},{landing:'distant',approach:'extend'}]){
  const s=completeSession(new Session({scenario:'safe'}),options),d=s.answers.find(x=>x.id==='cyclic');
  if(d){const p=flightState(d.at,s.scenario,s.config,s.answers.filter(a=>a.at<d.at));assert.ok(p.maneuver.canLevel);assert.ok(p.controls.flare);assert.ok(p.maneuver.decelerationMps2>.2);}
  if(options.flare==='omit'||options.cushion==='early'||options.approach==='extend')assert.equal(d,undefined);
 }
});
test('delayed flare actually moves before the level question, normal flare changes IAS and displayed nose attitude',()=>{
 const late=completeSession(new Session({scenario:'safe'}),{flare:'late'}),e=late.evidence(),motion=e.events.find(x=>x.kind==='Uçuş hareketi'&&x.title.startsWith('Fleyır'));
 assert.ok(motion);assert.ok(motion.at<=late.answers.find(x=>x.id==='cyclic').at);
 const s=completeSession(new Session({scenario:'safe'})),sc=s.scenario;let t0=4;while(t0<sc.duration&&!flightState(t0,sc,s.config,s.answers).maneuver.flaring)t0+=.1;const ref=flightState(t0,sc,s.config,s.answers),tf=t0+2,p=flightState(tf,sc,s.config,s.answers),v=sampleScene(tf,sc,s.config,s.answers); /* v0.33: timed from the actual flare onset (80 KIAS glide shifts the clock) */
 assert.ok(p.maneuver.flaring);assert.ok(p.iasKt<ref.iasKt-8);assert.ok(v.pitch>.08);assert.equal(v.pitch,-p.pitch);
 const root=new T.Object3D();root.rotation.order='YZX';root.rotation.set(v.roll,v.heading,v.pitch);const nose=new T.Vector3(1,0,0).applyQuaternion(root.quaternion);assert.ok(nose.y>0);
});
test('far target offers approach before flare, braking and extending produce distinct physics',()=>{
 const a=completeSession(new Session({scenario:'safe'}),{landing:'distant'}),b=completeSession(new Session({scenario:'safe'}),{landing:'distant',approach:'extend'});
 const approach=a.answers.find(x=>x.id==='approach'),flare=a.answers.find(x=>x.id==='flare');assert.ok(approach&&flare&&approach.at<flare.at);
 assert.ok(a.evidence().summary.contact.groundSpeedMps<b.evidence().summary.contact.groundSpeedMps-5);
 assert.ok(!b.answers.some(x=>x.id==='flare'||x.id==='cyclic'));
 const x=flightState(approach.at,a.scenario,a.config,a.answers),y=flightState(approach.at,b.scenario,b.config,b.answers);assert.deepEqual(x.position,y.position);assert.equal(x.iasKt,y.iasKt);
});
test('obsolete schema11 early-collective level-off question migrates away without losing earlier choices',()=>{
 const s=new Session({scenario:'safe'});const raw={schemaVersion:11,appVersion:'0.21.0',config:s.config,time:30,rate:1,answers:[{id:'priority',option:'control',at:4},{id:'landing',option:'shared',at:5.3},{id:'flare',option:'adaptive',at:6.6},{id:'cushion',option:'early',at:8.1},{id:'cyclic',option:'coordinated',at:11.7}]};
 const restored=Session.restore(raw);assert.ok(!restored.answers.some(x=>x.id==='cyclic'));assert.equal(restored.answers.find(x=>x.id==='cushion').option,'early');assert.deepEqual(Session.restore(restored.serialize()).snapshot(),restored.snapshot());
});
test('high vertical starts offer final collective without inventing a forward-flight flare',()=>{
 const s=completeSession(new Session({customStart:true,startHeightFt:400,startIasKt:0}));assert.ok(s.answers.some(x=>x.id==='cushion'));assert.ok(s.evidence().samples.some(x=>x.cushion)); // v0.33: from a 400 ft hover the nose is lowered to gain airspeed (H-V high-hover point), so a flare may follow
 const low=completeSession(new Session({scenario:'hover'}));assert.ok(!low.answers.some(x=>x.id==='flare'||x.id==='cyclic'));
});
test('predictive ready-flow terminal trajectory remains stable when the integration step is halved',()=>{
 const s=new Session({scenario:'safe',mode:'watch'}),a=flightState(100,s.baseScenario,s.config,[],.02).contact,b=flightState(100,s.baseScenario,s.config,[],.01).contact;
 assert.ok(Math.abs(a.descentMps-b.descentMps)<.3);assert.ok(Math.abs(a.time-b.time)<.1);
});
