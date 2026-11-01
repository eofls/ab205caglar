import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {DEFAULT_AIRCRAFT,parseAircraftNumber} from '../../aircraft-data.js';
import {sampleScene} from '../../scene-motion.js';
const complete={grossWeightLb:9000,initialRotorRpm:324,initialEngineRpm:6600,airframeType:'ab205',engineType:'t53l13',bladeType:'metal',pitotLocation:'roof',externalLoad:'none',manualRevision:'Kullanıcı beyanı / revizyon teyit bekliyor'};
test('Blank aircraft numeric fields remain unknown, never zero or an invented default',()=>{
 assert.equal(parseAircraftNumber(''),null);assert.equal(parseAircraftNumber('   '),null);assert.equal(parseAircraftNumber('9000'),9000);
 const s=new Session();assert.equal(s.config.grossWeightLb,null);assert.equal(s.config.initialRotorRpm,null);assert.equal(s.snapshot().aircraft.massKg,null);assert.ok(s.snapshot().aircraft.missing.length>0);
});
test('Legacy session migration leaves aircraft unknown and preserves start/time/answers',()=>{
 const s=new Session({scenario:'safe'});s.seek(s.scenario.decisions[0].at);s.choose('priority','control');s.seek(20);const old=s.serialize();for(const k of Object.keys(DEFAULT_AIRCRAFT))delete old.config[k];old.appVersion='0.5.0';const restored=Session.restore(old);
 assert.equal(restored.time,s.time);assert.deepEqual(restored.answers,s.answers);assert.equal(restored.config.startHeightFt,400);assert.equal(restored.config.grossWeightLb,null);assert.deepEqual(restored.snapshot(),s.snapshot());
});
test('Entered aircraft data and revision survive export/import without changing storyboard physics',()=>{
 const s=new Session({scenario:'safe',...complete}),baseline=new Session({scenario:'safe'});s.seek(s.scenario.decisions[0].at);s.choose('priority','control');
 assert.deepEqual(Session.restore(s.serialize()).snapshot(),s.snapshot());assert.equal(s.snapshot().aircraft.massKg,9000*.45359237);
 assert.notDeepEqual(sampleScene(20,s.scenario,s.config),sampleScene(20,baseline.scenario,baseline.config));assert.equal(s.snapshot().renderFrame.physicalState.quality,'experimental');assert.equal(s.snapshot().aircraft.physicsReady,false);
});
test('Reference weight boundary is reported without claiming applicability or changing H/V bounds',()=>{
 const at=new Session({...complete,grossWeightLb:9500}),over=new Session({...complete,grossWeightLb:9501});assert.equal(at.snapshot().aircraft.weightReference,'within-stated-maximum');assert.equal(over.snapshot().aircraft.weightReference,'outside');assert.ok(over.snapshot().aircraft.warnings.some(x=>x.includes('9.500')));
 assert.equal(at.snapshot().aircraft.sourceApplicability,'unverified');assert.throws(()=>new Session({...complete,customStart:true,startHeightFt:1000}));
});
test('Metal/composite, engine and pitot differences are retained rather than normalized away',()=>{
 const metal=new Session({...complete,scenario:'safe',initialRotorRpm:314}),composite=new Session({...complete,scenario:'safe',initialRotorRpm:314,bladeType:'composite'});
 assert.ok(metal.snapshot().aircraft.warnings.some(x=>x.includes('319–324')));assert.ok(!composite.snapshot().aircraft.warnings.some(x=>x.includes('319–324')));
 const other=new Session({...complete,pitotLocation:'nose',engineType:'t53l703',externalLoad:'attached',customStart:true,startHeightFt:237,startIasKt:43});assert.equal(other.config.startIasKt,43);assert.ok(other.snapshot().aircraft.warnings.some(x=>x.includes('çatı KIAS')));assert.ok(other.snapshot().aircraft.warnings.some(x=>x.includes('EK-C')));assert.ok(other.snapshot().aircraft.warnings.some(x=>x.includes('yük dinamiği')));
});
test('Invalid imports reject malformed aircraft fields and optional numbers',()=>{
 for(const grossWeightLb of [0,-1,NaN,Infinity,20001,9000.5,'9000'])assert.throws(()=>new Session({grossWeightLb}));
 for(const initialRotorRpm of [0,-1,NaN,Infinity,1001,324.5,'324'])assert.throws(()=>new Session({initialRotorRpm}));
 for(const field of ['airframeType','engineType','bladeType','pitotLocation','externalLoad'])assert.throws(()=>new Session({[field]:'toString'}));
 assert.throws(()=>new Session({manualRevision:'x'.repeat(161)}));assert.throws(()=>new Session({manualRevision:null}));
});
test('Even fully completed input leaves source and dynamics checks unresolved',()=>{
 const s=new Session(complete),a=s.snapshot().aircraft;assert.equal(a.inputComplete,true);assert.equal(a.missing.length,0);assert.equal(a.physicsReady,false);assert.equal(a.sourceApplicability,'unverified');assert.equal(a.blockers.length,4);assert.match(s.events().find(e=>e.kind==='Konfigürasyon').text,/9000 lb/);
});
