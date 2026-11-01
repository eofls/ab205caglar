import {FEATURES} from '../../terrain-data.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';import {flightState} from '../../flight-dynamics.js';import {completeSession} from './session-helpers.js';import {flightOverlays} from '../../flight-overlays.js';import {siteDistances,terrainHeight,surfaceAt} from '../../landing-sites.js';import {groundIntersection,SitePicker} from '../../site-picker.js';import * as T from '../../vendor/three.module.js';
test('custom candidates are numbered monotonically, offered at landing and persist/replay',()=>{
 const s=new Session({scenario:'safe'});assert.equal(s.addSite(10,-450),'site-3');assert.equal(s.addSite(25,-550),'site-4');s.removeSite('site-3');assert.equal(s.addSite(-20,-400),'site-5');
 s.seek(4);s.choose('priority','control');s.seek(999);assert.equal(s.pending.id,'landing');assert.deepEqual(s.pending.options.map(o=>o.id),['shared','distant','site-4','site-5']);s.choose('landing','site-5');
 const restored=Session.restore(s.serialize());assert.deepEqual(restored.serialize(),s.serialize());assert.equal(flightOverlays(s.time,s.scenario,s.config,s.answers).targets.find(t=>t.selected).label,'5');
 const finished=completeSession(s),a=finished.serialize();finished.seek(0);assert.ok(!flightOverlays(0,s.scenario,s.config,s.answers).targets.some(t=>t.selected));finished.seek(a.time);assert.deepEqual(finished.serialize(),a);
 finished.removeSite('site-5');assert.equal(finished.answers.some(a=>a.id==='landing'),false);assert.equal(finished.playing,false);assert.ok(!finished.scenario.decisions.find(d=>d.id==='landing').options.some(o=>o.id==='site-5'));
});
test('right-removal of default sites removes options, distances use actual terrain and reject invalid imports',()=>{
 const s=new Session({scenario:'safe'});s.removeSite('shared');assert.ok(!s.scenario.decisions.find(d=>d.id==='landing').options.some(o=>o.id==='shared'));
 assert.deepEqual(siteDistances([0,4+terrainHeight(3,0),0],{x:3,z:0}),{horizontal:3,vertical:4,slant:5});const road=FEATURES.find(f=>f.tags.highway);assert.match(surfaceAt(...road.points[0]),/Haritalanmış yol/);
 for(const customSites of [[{number:2,x:0,z:0}],[{number:3,x:NaN,z:0}],[{number:3,x:0,z:0},{number:3,x:1,z:1}]])assert.throws(()=>new Session({customSites}));
});
test('custom field changes guidance only after the landing choice',()=>{
 const s=new Session({scenario:'safe'});s.addSite(80,-350);const a=completeSession(s,{landing:'site-3'}),b=completeSession(new Session(a.config),{landing:'shared'}),t=a.answers.find(x=>x.id==='landing').at;
 assert.deepEqual(flightState(t-.1,a.scenario,a.config,a.answers).position,flightState(t-.1,b.scenario,b.config,b.answers).position);
 assert.ok(Math.abs(flightState(t+3,a.scenario,a.config,a.answers).position[0]-flightState(t+3,b.scenario,b.config,b.answers).position[0])>1);
});
test('overspeed hold freezes physical collective and body cyclic/pedal until a new command, never clamps RPM',()=>{
 const s=completeSession(new Session({scenario:'safe'}),{overspeed:'hold'}),hold=s.answers.find(a=>a.id==='overspeed');assert.ok(hold);
 const choices=s.answers.filter(a=>a.at<=hold.at),a=flightState(hold.at,s.scenario,s.config,choices),b=flightState(hold.at+1,s.scenario,s.config,choices);
 assert.equal(b.controls.collective,a.controls.collective);assert.equal(b.controls.pedal,a.controls.pedal);assert.ok(Math.abs(b.controls.cyclicForward-a.controls.cyclicForward)<1e-5);assert.ok(Math.abs(b.controls.cyclicRight-a.controls.cyclicRight)<1e-5);assert.equal(b.controls.collectiveRate,0);assert.equal(b.controls.pedalRate,0);assert.notEqual(a.rotorRpm,b.rotorRpm);
 const resumed=flightState(hold.at+1,s.scenario,s.config,[...choices,{id:'finalPull',option:'now',at:hold.at+.2}]);assert.ok(resumed.controls.collective>a.controls.collective);
});
test('actual normal/delayed flare begins around 100/75 ft and final collective reduces sink in S01',()=>{
 for(const powerLossMode of ['total','partial'])for(const flare of ['adaptive','late']){
  const s=completeSession(new Session({scenario:'safe',powerLossMode}),{flare});let onset=null,ten=null,five=null;
  for(let t=4;t<s.scenario.duration;t+=.05){const p=flightState(t,s.scenario,s.config,s.answers);if(p.contact)break;if(!onset&&p.maneuver.flaring)onset=p;if(!ten&&p.heightAglFt<=10)ten=p;if(!five&&p.heightAglFt<=5)five=p;}
  assert.ok(onset);assert.ok(onset.heightAglFt>=75&&onset.heightAglFt<=105,`${powerLossMode} ${flare}: ${onset.heightAglFt}`);assert.ok(ten&&five);assert.ok(five.descentFpm<ten.descentFpm);assert.ok(five.controls.collective>=ten.controls.collective);
 }
});
test('ground ray intersects terrain, upward ray cannot create a field',()=>{
 const p=groundIntersection(new T.Ray(new T.Vector3(200,100,0),new T.Vector3(0,-1,0)));assert.ok(Math.abs(p.y-terrainHeight(p.x,p.z))<.001);assert.equal(groundIntersection(new T.Ray(new T.Vector3(0,100,0),new T.Vector3(0,1,0))),null);
});
test('finer final integration converges for held cyclic without weakening time tolerance',()=>{
 const s=completeSession(new Session({scenario:'safe'}),{cyclic:'hold'}),a=flightState(100,s.scenario,s.config,s.answers,.01).contact,b=flightState(100,s.scenario,s.config,s.answers,.005).contact;assert.ok(Math.abs(a.time-b.time)<.03);assert.ok(Math.abs(a.descentMps-b.descentMps)<.15);
});
test('picker hover needs no click, drag does not create, left creates and right removes',()=>{
 const old=globalThis.document,events=[],listeners={},tip={hidden:true,style:{},offsetWidth:200,offsetHeight:70,setAttribute(){}};
 globalThis.document={createElement:()=>tip};
 try{
 const rect={left:0,top:0,width:640,height:480},host={appendChild(){},getBoundingClientRect:()=>rect,dispatchEvent:e=>events.push(e.detail)},canvas={getBoundingClientRect:()=>rect,addEventListener:(k,f)=>listeners[k]=f};
 const camera=new T.PerspectiveCamera(43,640/480,.1,1000);camera.position.set(0,100,100);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 let data={targets:[{id:'shared',label:'1',x:0,z:0}],position:[0,40,0]};new SitePicker(host,canvas,camera,()=>data);
 listeners.pointermove({clientX:320,clientY:240});assert.equal(tip.hidden,false);assert.match(tip.textContent,/Dikey: 40.0 m/);assert.equal(events.length,0);
 listeners.pointerdown({clientX:320,clientY:240,button:2});listeners.pointerup({clientX:320,clientY:240,button:2});assert.deepEqual(events.pop(),{remove:'shared'});
 data={...data,targets:[]};listeners.pointerdown({clientX:320,clientY:240,button:0});listeners.pointermove({clientX:350,clientY:240});listeners.pointerup({clientX:350,clientY:240,button:0});assert.equal(events.length,0);
 listeners.pointerdown({clientX:320,clientY:240,button:0});listeners.pointerup({clientX:320,clientY:240,button:0});assert.ok(Number.isFinite(events[0].x)&&Number.isFinite(events[0].z));
 }finally{globalThis.document=old;}
});
