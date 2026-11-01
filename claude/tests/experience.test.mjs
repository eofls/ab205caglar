import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {addRecord,removeRecord,validateBook,decisionReview,comparisonRows} from '../../scenario-book.js';
import {visualWeather} from '../../visual-weather.js';
const empty={schemaVersion:1,entries:[]};
test('named record and backup preserve exact free start, weather, choices and paused time',()=>{
 const s=new Session({customStart:true,startHeightFt:237,startIasKt:43,cloudCover:'overcast',lighting:'dusk',visibilityKm:.5});s.seek(s.scenario.decisions[0].at);s.choose('priority','control');s.seek(18);
 const b=addRecord(empty,'Düşük görüş',s,'case-1');const read=validateBook(JSON.parse(JSON.stringify(b)));const r=Session.restore(read.entries[0].session);assert.deepEqual(r.snapshot(),s.snapshot());assert.equal(r.playing,false);assert.equal(empty.entries.length,0);
 const removed=removeRecord(read,'case-1');assert.equal(removed.entries.length,0);assert.equal(read.entries.length,1);
});
test('invalid library import rejects the whole file, duplicate IDs and invalid scenarios',()=>{
 const s=new Session(),b=addRecord(empty,'Bir',s,'id');assert.throws(()=>addRecord(b,'İki',s,'id'));assert.throws(()=>addRecord(b,' ',s,'new'));
 const bad=structuredClone(b);bad.entries[0].session.config.startHeightFt=1000;bad.entries[0].session.config.customStart=true;assert.throws(()=>validateBook(bad));assert.equal(b.entries[0].session.config.startHeightFt,40);
 assert.throws(()=>validateBook({schemaVersion:2,entries:[]}));assert.throws(()=>validateBook({schemaVersion:1,entries:Array(41).fill(b.entries[0])}));
});
test('decision review and comparison never reveal future rewound answers',()=>{
 const s=new Session({scenario:'safe',mode:'watch'});s.seek(50);assert.ok(decisionReview(s).length>0);assert.ok(decisionReview(s).every(x=>x.at<=s.time));const old=Session.restore(s.serialize());s.seek(0);assert.ok(decisionReview(s).every(r=>r.risk===null));assert.ok(comparisonRows(s,old).some(r=>r.label==='Uyarlanabilir pilot'&&r.different));
});
test('weather settings survive legacy migration and do not change flight physics',()=>{
 const s=new Session();const old=s.serialize();delete old.config.cloudCover;delete old.config.lighting;assert.equal(Session.restore(old).config.cloudCover,'clear');assert.equal(Session.restore(old).config.lighting,'day');
 const dark=new Session({cloudCover:'overcast',lighting:'dusk',visibilityKm:.2});const w=visualWeather(dark.config),clear=visualWeather(s.config);assert.equal(w.cloudCount,28);assert.equal(clear.cloudCount,0);assert.ok(w.fogFar<clear.fogFar);assert.ok(w.sunIntensity<clear.sunIntensity);assert.equal(dark.snapshot().renderFrame.physicalState.quality,'experimental');assert.throws(()=>new Session({cloudCover:'storm'}));assert.throws(()=>new Session({lighting:'noon'}));assert.doesNotThrow(()=>new Session({lighting:'night'}));
});
