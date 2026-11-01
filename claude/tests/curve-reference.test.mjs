import test from 'node:test';
import assert from 'node:assert/strict';
import {CURVE_POINTS,readCurve} from '../../curve-reference.js';
import {POWERED_FLIGHT_REFERENCE,validateAircraftConfig} from '../../aircraft-data.js';
test('curve anchors and interpolation remain preliminary',()=>{for(const p of CURVE_POINTS)assert.equal(readCurve(p.kias).descentFpm,p.descentFpm);assert.equal(readCurve(75).descentFpm,1670);assert.equal(readCurve(63).physicsReady,false);});
test('curve rejects extrapolation and incompatible context',()=>{for(const v of [null,undefined,0,39,81,63.5,'63',NaN])assert.equal(readCurve(v),null);for(const opts of [{rotorRpm:324},{pitot:'nose'},{powerState:'powered'}])assert.equal(readCurve(63,opts),null);});
test('powered references are distinct; legacy inputs remain unknown',()=>{assert.equal(POWERED_FLIGHT_REFERENCE.rotorRpm,324);assert.equal(POWERED_FLIGHT_REFERENCE.engineRpm,6600);assert.equal(validateAircraftConfig({}).initialEngineRpm,null);assert.equal(validateAircraftConfig({initialEngineRpm:6600}).initialEngineRpm,6600);assert.throws(()=>validateAircraftConfig({initialEngineRpm:-1}));});

test('all reviewed curves stay in their supported ranges with separate units',async()=>{
 const {CURVES}=await import('../../curve-reference.js');
 for(const rpm of [284,314,339]){
  const points=CURVES[rpm];
  for(const p of points){const r=readCurve(p.kias,{rotorRpm:rpm});assert.equal(r.descentFpm,p.descentFpm);assert.equal(r.glideRatio,p.glideRatio);assert.equal(r.physicsReady,false);}
  assert.equal(readCurve(points[0].kias-1,{rotorRpm:rpm}),null);
  assert.equal(readCurve(81,{rotorRpm:rpm}),null);
 }
 assert.equal(readCurve(40,{rotorRpm:339}),null);
 for(let kias=50;kias<=80;kias++){
  const lo=readCurve(kias,{rotorRpm:284}),mid=readCurve(kias),hi=readCurve(kias,{rotorRpm:339});
  assert.ok(lo.descentFpm<mid.descentFpm&&mid.descentFpm<hi.descentFpm);
  assert.ok(lo.glideRatio>mid.glideRatio&&mid.glideRatio>hi.glideRatio);
 }
});
test('downloaded audit matches application readings and records limited spot checks',async()=>{
 const {readFile}=await import('node:fs/promises'),{CURVES,chartPoint}=await import('../../curve-reference.js');
 const audit=JSON.parse(await readFile(new URL('../../curve-audit.json',import.meta.url),'utf8'));
 for(const [rpm,rows] of Object.entries(audit.curves))assert.deepEqual(rows,CURVES[rpm].map(p=>[p.kias,p.descentFpm,p.glideRatio]));
 for(const p of audit.spotChecks314){assert.equal(readCurve(p.roofKias).descentFpm,p.interpolatedFpm);assert.equal(Math.abs(p.readFpm-p.interpolatedFpm),p.absoluteDifferenceFpm);}
 assert.equal(audit.review.physicsReady,false);assert.match(audit.source.sha256,/^[a-f0-9]{64}$/);
 const upper=chartPoint(63,1600),lower=chartPoint(63,3.9,'glideRatio');assert.ok(upper[1]<lower[1]);
});
test('reference inspection does not mutate a running scenario or its 324/6600 input',async()=>{
 const {Session}=await import('../../engine.js');const s=new Session({initialRotorRpm:324,initialEngineRpm:6600});s.seek(5);const before=s.serialize();
 for(const rotorRpm of [284,314,339])readCurve(63,{rotorRpm});
 assert.deepEqual(s.serialize(),before);assert.equal(s.snapshot().renderFrame.physicalState.quality,'experimental');
});
