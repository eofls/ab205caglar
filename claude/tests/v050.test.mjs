// v0.50 — S01 güvenli saha: doğru kararlarla fleyır kitaba uygun (rotor limit içinde, sürat 15 ft'te düşük, yumuşak temas)
import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';import {SCENARIOS} from '../../catalog.js';
import {completeSession} from './session-helpers.js';
const run=(id,combo={})=>{const s=new Session({scenario:id});completeSession(s,combo);let mx=0,at15=null;
 for(let t=0;t<=s.scenario.duration;t+=.25){s.seek(t);const p=s.snapshot().renderFrame.physicalState;mx=Math.max(mx,p.rotorRpm);if(!at15&&p.heightAglFt<=15)at15=p;if(p.contact)break;}
 s.seek(999);return {mx,at15,c:s.snapshot().renderFrame.physicalState.contact};};
test('v0.50 S01 doğru kararlar: rotor 339 RPM üstüne çıkmaz, 15 ft’te sürat ≤12 kt, temas ≤400 ft/dk ve ≤6 kt',()=>{
 const r=run('safe');assert.ok(r.mx<=339,`rotor ${r.mx.toFixed(0)}`);assert.ok(r.at15.iasKt<=12,`15 ft sürat ${r.at15.iasKt.toFixed(0)}`);
 assert.ok(r.c&&!r.c.obstacle&&r.c.descentMps*196.85<=400&&r.c.groundSpeedMps/.5144<=6,`temas ${(r.c.descentMps*196.85).toFixed(0)} ft/dk ${(r.c.groundSpeedMps/.5144).toFixed(1)} kt`);
});
test('v0.50 S01 hatalı kararlar yine sert: fleyırsız, erken veya ertelenen kollektif',()=>{
 for(const combo of [{flare:'omit'},{cushion:'early'},{finalPull:'hold'}]){const r=run('safe',combo);assert.ok(r.c.descentMps*196.85>700,JSON.stringify(combo));}
});
test('v0.50 fleyır ayarı yalnızca S01’de',()=>{assert.equal(SCENARIOS.filter(s=>s.flareTune).map(s=>s.id).join(),'safe');});
