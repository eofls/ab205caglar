import {completeSession} from './session-helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../../engine.js';
import {lessonView} from '../../scenario-lesson.js';
function finish(first,second,config={}){return completeSession(new Session({scenario:'safe',...config}),{priority:first,landing:second,recovery:'hold'});}
test('S01 has four distinct combined outcomes with explicit simulated physical results',()=>{
 const outcomes=new Set();for(const a of ['control','diagnose'])for(const b of ['shared','distant']){const s=finish(a,b),snap=s.snapshot();outcomes.add(snap.current.text);assert.equal(snap.current.kind,'Sonuç');assert.equal(snap.renderFrame.physicalState.quality,'experimental');assert.ok(snap.lesson.complete);assert.equal(snap.lesson.landing,b);assert.ok(s.events().every(e=>e.reference));}assert.equal(outcomes.size,4);
});
test('Rewind hides future crew decisions and field emphasis, then replays exactly',()=>{
 const s=finish('diagnose','distant'),final=s.snapshot();s.seek(3);assert.equal(s.snapshot().lesson.priority,null);assert.equal(s.snapshot().lesson.focus,'none');s.seek((s.scenario.decisions[0].at+s.scenario.decisions[1].at)/2);assert.equal(s.snapshot().lesson.focus,'compare');assert.equal(s.snapshot().lesson.landing,null);s.seek(60);assert.deepEqual(s.snapshot(),final);
 s.seek(s.scenario.decisions[0].at);s.choose('priority','control');s.seek(60);assert.equal(s.time,s.scenario.decisions[1].at);assert.equal(s.snapshot().lesson.landing,null);assert.equal(s.snapshot().lesson.focus,'compare');
});
test('S01 adaptive watch and guided branches are distinct; old metadata restores',()=>{
 const guided=finish('control','shared'),watch=new Session({scenario:'safe',mode:'watch'});watch.seek(60);assert.match(watch.snapshot().lesson.crew,/Uyarlanabilir/);assert.equal(watch.scenario.decisions.length,0);assert.ok(guided.scenario.decisions.length>0);assert.notDeepEqual(watch.snapshot().events,guided.snapshot().events);
 const legacy={...guided.serialize(),appVersion:'0.3.1'};assert.deepEqual(Session.restore(legacy).snapshot(),guided.snapshot());
});
test('Free chart selection never silently acquires S01 assumptions, even at 400/60',()=>{
 for(const [startHeightFt,startIasKt] of [[400,60],[1,1],[600,80],[0,0]]){const s=new Session({scenario:'safe',customStart:true,startHeightFt,startIasKt});assert.equal(s.snapshot().lesson,null);assert.equal(s.scenario.height,startHeightFt);assert.equal(s.scenario.ias,startIasKt);assert.notEqual(s.events()[0].title,'S01 · 400 ft / 60 KIAS · düz uçuşta tam güç kaybı');}
});
test('Selected weather and both crew profiles appear in S01 without invented success metrics',()=>{
 const s=finish('control','shared',{windKt:20,windFromDeg:180,headingDeg:0,visibilityKm:2,temperatureC:35,pressureAltitudeFt:5000,turbulence:'moderate',pilot:'developing',copilot:'experienced'});
 assert.match(s.events().find(e=>e.at===2).text,/20.0 kt arka/);assert.match(s.events().find(e=>e.at===2).text,/Görüş 2 km/);assert.match(s.events().find(e=>e.at===1).text,/Gelişmekte/);assert.match(s.events().find(e=>e.at===1).text,/Deneyimli/);
 assert.equal(lessonView(19,[]).focus,'none');assert.equal(lessonView(20,[{id:'priority',at:4,option:'control'}]).focus,'compare');
});
