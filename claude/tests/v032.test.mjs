import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {flightState,flightEnd} from '../../flight-dynamics.js';
import {APPROVED_REFERENCE_CHOICES as R} from '../../catalog.js';
import {cleanEventText} from '../../event-text.js';
test('v0.32.2 guided 40 ft / 70 kt: low-entry deceleration keeps contact slow',()=>{
 const s=new Session({customStart:true,startHeightFt:40,startIasKt:70,mode:'guided'});for(let i=0;i<20;i++){s.seek(999);const d=s.pending;if(!d)break;s.choose(d.id,R[d.id]??d.options[0].id);}s.seek(999);
 const c=s.evidence().summary.contact;assert.ok(c.groundSpeedMps*1.944<15,`${c.groundSpeedMps*1.944} kt`);assert.ok(c.descentMps<2.5);
});
test('v0.32.2 hazır akış landing site is not inside the speed-bleed distance',()=>{
 const s=new Session({customStart:true,startHeightFt:40,startIasKt:70,mode:'watch'}),ch=s.choices(),e=flightEnd(s.scenario,s.config,ch),p=flightState(e.time,s.scenario,s.config,ch);
 assert.ok(p.pilotSite&&Math.hypot(p.position[0]-p.pilotSite.x,p.position[2]-p.pilotSite.z)<60);
});
test('v0.32.2 event text drops meta disclaimers and keeps technical statements',()=>{
 assert.equal(cleanEventText('Rotor 293 RPM. Rejim ve kuvvet katsayıları deneysel; limitler ayrıca doğrulanmalı.'),'Rotor 293 RPM.');
 assert.equal(cleanEventText('Bu bir varsayımdır.'),'');
});
