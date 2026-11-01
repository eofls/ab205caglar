import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';import {flightState} from '../../flight-dynamics.js';import {completeSession} from './session-helpers.js';
import {terminalEnvelope} from '../../terminal-control.js';import {controlDisplay} from '../../control-display.js';
import {alternativeRun,alternativeResults} from '../../counterfactual.js';import {resultRows} from '../../scenario-book.js';
test('deferred collective asks once before contact, now moves the lever while continued delay holds it',()=>{
 for(const powerLossMode of ['total','partial']){
  const now=completeSession(new Session({scenario:'safe',powerLossMode}),{cushion:'late'}),hold=completeSession(new Session({scenario:'safe',powerLossMode}),{cushion:'late',finalPull:'hold'});
  const a=now.answers.find(x=>x.id==='finalPull');assert.ok(a);assert.equal(now.answers.filter(x=>x.id==='finalPull').length,1);
  const at=flightState(a.at,now.scenario,now.config,now.answers),before=flightState(a.at,hold.scenario,hold.config,hold.answers);
  assert.equal(at.rotorRpm,before.rotorRpm);assert.equal(at.controls.collective,before.controls.collective);
  const after=flightState(a.at+.4,now.scenario,now.config,now.answers),held=flightState(a.at+.4,hold.scenario,hold.config,hold.answers);
  assert.ok(!after.contact);assert.ok(after.controls.collective>held.controls.collective+.1);assert.equal(controlDisplay(after).collective.arrow,'up');
  assert.ok(now.evidence().summary.contact.descentMps<hold.evidence().summary.contact.descentMps);
  assert.deepEqual(Session.restore(now.serialize()).snapshot(),now.snapshot());
 }
});
test('state-based collective accounts for sink and actuator travel, and starts above the old fixed gate',()=>{
 const p={rpm:324},s={y:20,w:3,omega:324*Math.PI/30,collective:.7};
 assert.ok(terminalEnvelope({...s,w:10},p).brakeHeightM>terminalEnvelope(s,p).brakeHeightM);
 assert.ok(terminalEnvelope({...s,w:6,collective:.3},p).responseSeconds>terminalEnvelope({...s,w:6,collective:1.3},p).responseSeconds);
 const x=completeSession(new Session({scenario:'safe'}),{flare:'omit'}),pull=x.evidence().samples.find(a=>a.cushion);assert.ok(pull.heightAglFt>4.8/.3048);assert.ok(pull.time<x.evidence().summary.contact.time);
});
test('cyclic choices affect actual disk/body state and maintain identical pre-choice trajectory',()=>{
 const a=completeSession(new Session({scenario:'safe'})),b=completeSession(new Session({scenario:'safe'}),{cyclic:'hold'});
 const t=a.answers.find(x=>x.id==='cyclic').at;
 const before=flightState(t-.1,a.scenario,a.config,a.answers),other=flightState(t-.1,b.scenario,b.config,b.answers);assert.deepEqual(before.position,other.position);assert.equal(before.pitch,other.pitch);
 const after=flightState(t+1.5,a.scenario,a.config,a.answers),held=flightState(t+1.5,b.scenario,b.config,b.answers);assert.notEqual(after.controls.cyclicRad,held.controls.cyclicRad);assert.notEqual(after.pitch,held.pitch);
 const hover=completeSession(new Session({scenario:'hover'}));assert.ok(!hover.answers.some(a=>a.id==='cyclic'||a.id==='flare'));
});
test('report uses first-contact speeds and excludes ground coast from flight RPM extrema',()=>{
 const s=completeSession(new Session({scenario:'safe'})),e=s.evidence(),rows=resultRows(s);assert.ok(s.snapshot().renderFrame.physicalState.ground.settled);
 assert.equal(rows.find(x=>x.label==='Temas · düşey / yer sürati').value,(e.summary.contact.descentMps/.3048*60).toFixed(0)+' ft/dk · '+(e.summary.contact.groundSpeedMps*3600/1852).toFixed(1)+' kt');
 const airborne=e.samples.filter(x=>x.time<=e.summary.contact.time);assert.equal(e.summary.minRotorRpm,Math.min(...airborne.map(x=>x.rotorRpm)));
 assert.ok(rows.find(x=>x.label==='Sonuç').value.length>0);
 s.seek(0);assert.equal(resultRows(s).length,1);assert.deepEqual(alternativeResults(s),[]);
});
test('alternative runs preserve conditions and decision prefix, never change the original or claim one-factor causality',()=>{
 const s=completeSession(new Session({scenario:'safe'}),{cushion:'late'}),saved=s.serialize();const {run}=alternativeRun(s,'cushion','timed');
 const at=s.answers.find(x=>x.id==='cushion').at;
 assert.deepEqual(run.config,s.config);assert.deepEqual(run.answers.filter(x=>x.at<at),s.answers.filter(x=>x.at<at));
 const rows=alternativeResults(s);assert.ok(rows.length>0);assert.ok(rows.every(x=>JSON.stringify(x.config)===JSON.stringify(s.config)));assert.deepEqual(s.serialize(),saved);
 assert.deepEqual(alternativeResults(s),rows);assert.equal(rows.find(x=>x.id==='cushion'&&x.option==='timed').deltaDescentMps,run.evidence().summary.contact.descentMps-s.evidence().summary.contact.descentMps);
});

test('terminal maneuvers converge when the integration step is halved',()=>{
 for(const options of [{},{cushion:'late'},{flare:'omit'},{cyclic:'hold'}]){
  const s=completeSession(new Session({scenario:'safe'}),options),a=flightState(100,s.scenario,s.config,s.choices(),.02).contact,b=flightState(100,s.scenario,s.config,s.choices(),.01).contact;
  assert.ok(Math.abs(a.descentMps-b.descentMps)<.15);assert.ok(Math.abs(a.time-b.time)<.03);
 }
});
