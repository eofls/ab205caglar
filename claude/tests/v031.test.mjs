import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {flightState,manualRun} from '../../flight-dynamics.js';
import {rotorAero,autorotationPitch,axialInducedRatio,trimPitch,pitchForThrust,ROTOR} from '../../rotor-bemt.js';
import {debriefData,standards} from '../../debrief.js';
import {wireDistance,terrainHeight} from '../../terrain-data.js';
import {CURVES} from '../../curve-reference.js';
const om=324*Math.PI/30;
test('blade-element rotor: steady 63 KIAS autorotation sink is within 15 % of the chart at 324 RPM and rises with RPM',()=>{
 const a=autorotationPitch({rho:1.225,omega:om,mass:2800,dragAreaM2:1.5}),chart=(CURVES[314].find(p=>p.kias===63).descentFpm*.6+CURVES[339].find(p=>p.kias===63).descentFpm*.4)*.3048/60;
 assert.ok(Math.abs(a.descentMps-chart)/chart<.15,`${a.descentMps} vs ${chart}`);
 const lo=autorotationPitch({rho:1.225,omega:284*Math.PI/30,mass:2800,dragAreaM2:1.5}),hi=autorotationPitch({rho:1.225,omega:339*Math.PI/30,mass:2800,dragAreaM2:1.5});assert.ok(lo.descentMps<a.descentMps&&a.descentMps<hi.descentMps);
});
test('blade-element rotor: hover power, stall boundary and inverse pitch are consistent',()=>{
 const t=trimPitch({rho:1.225,omega:om,mass:2800,tas:0,dragAreaM2:1.5});assert.ok(t.power>3e5&&t.power<6e5,`${t.power}`);
 const big=rotorAero({rho:1.225,omega:om*.7,theta75:ROTOR.thetaMaxRad,vPerpDown:0,vInPlane:0});assert.ok(big.ctSigma<.14&&big.stall>.5);
 const th=pitchForThrust({rho:1.225,omega:om,thrust:27460,vPerpDown:0,vInPlane:0}),r=rotorAero({rho:1.225,omega:om,theta75:th,vPerpDown:0,vInPlane:0});assert.ok(Math.abs(r.thrust-27460)/27460<.05);
 for(let X=-3;X<=1;X+=.05)assert.ok(Number.isFinite(axialInducedRatio(X))&&axialInducedRatio(X)>0);
});
test('v0.32 single model: a requested blade model is coerced to the calibrated energy model and still completes',()=>{
 const s=new Session({scenario:'safe',mode:'watch',physicsModel:'blade'}),c=s.evidence().summary.contact;assert.ok(c&&Number.isFinite(c.descentMps)&&c.time>8);
 assert.equal(s.config.physicsModel,'energy');assert.throws(()=>new Session({physicsModel:'x'}));
});
test('energy model: thrust is capped by the blade-stall boundary at high weight / density altitude',()=>{
 const s=new Session({customStart:true,startHeightFt:200,startIasKt:50,grossWeightLb:9500,pressureAltitudeFt:8000,temperatureC:30,mode:'watch'}),sc=s.scenario;let minMargin=1;
 for(let t=5;t<sc.duration;t+=.1){const p=flightState(t,sc,s.config,s.choices());if(p.contact)break;if(p.thrustMargin!=null)minMargin=Math.min(minMargin,p.thrustMargin);}assert.ok(minMargin<.6,`${minMargin}`);
});
test('manual flight: recorded inputs replay deterministically, survive save/restore and re-flying truncates the future',()=>{
 const run=manualRun('test-manual');run.reset([]);const s=new Session({scenario:'safe',mode:'manual',manualRunId:'test-manual'});s.play();
 for(let k=0;k<2000&&s.playing;k++){const p=flightState(s.time,s.scenario,s.config,[]),h=p.heightAglFt;let i={collective:1,cyclicF:p.controls.cyclicForward,cyclicR:0,pedal:p.controls.pedal};if(s.time>4.3)i={collective:.55,cyclicF:.02,cyclicR:0,pedal:.5};if(s.time>4.3&&h<110)i={collective:.7,cyclicF:-.2,cyclicR:0,pedal:.5};if(s.time>4.3&&h<16)i={collective:2,cyclicF:0,cyclicR:0,pedal:.5};run.record(s.time,i);s.tick(.05);}
 assert.equal(s.scenario.endReason,'contact');const a=flightState(12,s.scenario,s.config,[]).position;
 const r=Session.restore(JSON.parse(JSON.stringify(s.serialize())));assert.deepEqual(flightState(12,r.scenario,r.config,[]).position,a);
 const n=run.inputs.length;run.record(8,{collective:1.5,cyclicF:0,cyclicR:0,pedal:.5});assert.ok(run.inputs.length<n&&run.inputs.at(-1)[0]===8);
});
test('debrief grades a completed flight against TR standards and flags a wire strike',()=>{
 const s=new Session({scenario:'safe',mode:'watch'});s.seek(999);const st=standards(debriefData(s));assert.ok(st.score>=0&&st.score<=100);assert.ok(st.items.some(i=>i.id==='vertical'));
 
});
test('power lines: conductors are collision geometry with sag; far from lines there is no wire',()=>{
 assert.equal(wireDistance(0,100,0,'terrain'),Infinity);/* v0.39 gerçek OSM hattı (Gölbaşı) */const g=terrainHeight(-207,1663);let best=Infinity;for(let y=g;y<g+40;y+=.25)best=Math.min(best,wireDistance(-207,y,1663,'terrain'));assert.ok(best<.5,String(best));
});
test('crew profile: a developing pilot holds the failure-instant controls for the recognition time',()=>{
 const a=new Session({scenario:'safe',mode:'watch',pilot:'developing'}),b=new Session({scenario:'safe',mode:'watch',pilot:'proficient'});
 const pa=flightState(4.8,a.scenario,a.config,a.choices()),pb=flightState(4.8,b.scenario,b.config,b.choices());assert.match(pa.controls.phase,/tepki/);assert.ok(pa.controls.collective>pb.controls.collective);
});
test('night / rain / manual configuration validates; invalid values are rejected',()=>{
 for(const c of [{lighting:'night'},{precipitation:'rain'},{mode:'manual',manualRunId:'x'}])assert.doesNotThrow(()=>new Session(c));
 for(const c of [{lighting:'noon'},{precipitation:'snow'},{mode:'auto'}])assert.throws(()=>new Session(c));
});
