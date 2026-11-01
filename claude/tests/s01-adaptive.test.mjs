import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';import {flightState} from '../../flight-dynamics.js';
import {completeSession} from './session-helpers.js';import {adaptivePilot} from '../../adaptive-pilot.js';
import {damageScreening} from '../../damage-screening.js';import {groundMotion,groundDuration} from '../../ground-contact.js';
test('S01 full and partial loss can be cushioned; omitted flare and continued collective deferral retain measurable penalties',()=>{
 for(const powerLossMode of ['total','partial']){
  const finish=options=>completeSession(new Session({scenario:'safe',powerLossMode}),options);
  const good=finish({}),late=finish({cushion:'late',finalPull:'hold'}),none=finish({flare:'omit'}),g=good.evidence().summary;
  assert.ok(g.contact.descentMps<2.5);assert.ok(late.evidence().summary.contact.descentMps>g.contact.descentMps+.5);
  assert.ok(none.evidence().summary.impact.horizontalEnergyJ>g.impact.horizontalEnergyJ*2); // v0.33: the omitted flare is penalised by the run-on (horizontal) energy; // energy-1.4: with partial shaft power an omitted flare no longer raises vertical speed; its penalty is the horizontal energy checked belowassert.ok(none.evidence().summary.impact.horizontalEnergyJ>g.impact.horizontalEnergyJ*2); // Partial power can soften vertical impact without removing the no-flare run-on penalty.
  assert.ok(g.impact.severity.percent<25);assert.ok(g.impact.horizontalEnergyJ>0); // soft vertical contact does not erase run-on risk
  const phases=good.evidence().events.filter(e=>e.kind==='Kumanda').map(e=>e.title);
  assert.ok(phases.some(x=>x.includes('Fleyır')));assert.ok(phases.some(x=>x.includes('Ufkiyet')));
  assert.deepEqual(Session.restore(good.serialize()).snapshot(),good.snapshot());
 }
});
test('adaptive ready flow has no scripted answer list, responds to hazards and replays causally',()=>{
 const s=new Session({scenario:'safe',mode:'watch'});assert.deepEqual(s.choices(),[]);assert.deepEqual(s.scenario.decisions,[]);
 s.seek(18);const before=s.snapshot();s.seek(3);assert.equal(s.snapshot().renderFrame.physicalState.powered,true);s.seek(18);assert.deepEqual(s.snapshot(),before);
 const p={rpm:324,rotorInertia:2711,mass:2800,height:122,ias:60,groundHold:false,tasFactor:1,powerFraction:0};
 const state={t:10,y:60,w:8,v:30,omega:324*Math.PI/30};
 const normal=adaptivePilot(state,p,8),low=adaptivePilot({...state,omega:260*Math.PI/30},p,8),vrs=adaptivePilot({...state,v:1},{...p,powerFraction:.35},8);
 assert.notEqual(normal.phase,low.phase);assert.ok(low.collective<normal.collective);assert.match(vrs.phase,/düşük süratli/);
 const c=s.config,sc=s.scenario,a=flightState(10,sc,c),b=flightState(10,sc,{...c,powerLossMode:'partial'});assert.notEqual(a.controls.collective,b.controls.collective);
});
test('synthetic damage includes mass, horizontal motion and attitude without claiming validated thresholds',()=>{
 const p={massKg:2800,pitch:0,roll:0,liftN:10000,contact:{time:10,descentMps:1,groundSpeedMps:0}};
 const a=damageScreening(p),b=damageScreening({...p,contact:{...p.contact,groundSpeedMps:30}}),c=damageScreening({...p,roll:.4}),heavy=damageScreening({...p,massKg:4000});
 assert.ok(b.score>a.score&&c.score>a.score&&heavy.score>a.score);assert.match(a.damage,/benzetim tahmini/);
 assert.ok(Math.abs(a.loadShares.reduce((sum,x)=>sum+x.share,0)-1)<1e-10);assert.ok(a.forceRangeN.every(Number.isFinite));
});
test('contact rebound and sliding dissipate energy and freeze at computed settling time',()=>{
 const p={contact:{time:10,descentMps:8,groundSpeedMps:12,rotorRpm:300,engineRpm:500},position:[0,0,0],velocityMps:[0,-8,-12],pitch:.1,roll:.1};
 const d=groundDuration(p.contact),a=groundMotion(p,.05),end=groundMotion(p,d),later=groundMotion(p,d+100);
 assert.ok(a.position[1]>0&&a.groundSpeedMps<12);assert.ok(a.velocityMps[1]**2+2*9.80665*a.position[1]<=8**2*.1**2+1e-8);
 assert.equal(end.groundSpeedMps,0);assert.ok(end.settled);assert.deepEqual(end,later);
 const s=new Session({scenario:'safe',mode:'watch'});s.seek(999);assert.ok(s.snapshot().renderFrame.physicalState.ground.settled);assert.ok(s.time>s.evidence().summary.contact.time);s.play();assert.equal(s.playing,false);
});
