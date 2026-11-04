// v0.51 — pilot seviyeleri, bitiş tutarlılığı, ek karar anları
import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_CONFIG} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {MANEUVERS,maneuverDecisionDefs} from '../../maneuver-catalog.js';
import {programRun,emergencyDecisionDefs} from '../../program-flight.js';
import {componentDamage} from '../../component-damage.js';
import {contactSeverity} from '../../contact-assessment.js';
import {readFileSync} from 'node:fs';
const R=Math.PI/180,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const emCfg=e=>{const st=e.start??{},area=e.area??'terrain';return {...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:st.h??500,startIasKt:st.v??80,flightArea:area,startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??(area==='airfield'?65:0),mode:'watch'};};
const manCfg=m=>({...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:m.start.h,startIasKt:m.start.v,flightArea:m.start.area??'terrain',startX:m.start.x??0,startZ:m.start.z??0,headingDeg:m.start.hdg??((m.start.area??'terrain')==='airfield'?65:0),mode:'watch'});
const worst=d=>Math.max(0,...d.parts.map(q=>q.severity));
test('v0.51 hasar ölçeği temas sertliğiyle tutarlı: %100 sertlikte ağır hasar, normal otorotasyon temasında hasar yok',()=>{
 const dm=w=>componentDamage({contact:{descentMps:w,groundSpeedMps:3,part:'skidLeft',rotorRpm:300},roll:0,pitch:0,massKg:2800});
 assert.equal(contactSeverity(5).percent,100);assert.ok(worst(dm(5))>=.7,'%100 sertlik ama ağır hasar yok');assert.ok(dm(5).parts.find(q=>q.id==='cabin').severity>=.35,'gövde tabanı etkilenmiyor');
 assert.ok(worst(dm(1.5))<.08,'1,5 m/s temasta hasar gösteriliyor');assert.ok(worst(dm(2.5))<.35,'2,5 m/s hafif olmalı');
});
test('v0.51 acil durumlar: haberleşme, rotor devri ve inişten sonra susturma kararları; doğru seçimlerle yumuşak iniş',()=>{
 let n=0;for(const e of EMERGENCIES.filter(x=>x.kind==='program')){const defs=emergencyDecisionDefs(e);if(!defs['em-after'])continue;n++;
  const r=programRun(emCfg(e),Object.values(defs).map(d=>({id:d.id,option:d.reference,at:0})));
  if(e.landing!=='trees'){assert.ok(r.contact&&r.contact.descentMps<=1.6&&!r.contact.obstacle,`${e.id}: ${r.contact?.descentMps} ${r.contact?.obstacle}`);}
  assert.ok(r.decisions.some(d=>d.id==='em-after'),`${e.id}: inişten sonra karar sorulmadı`);}
 assert.ok(n>=20,`yalnız ${n} acil durumda iniş sonrası karar`);
 const eng=EMERGENCIES.find(x=>x.id==='engine-low'),d=emergencyDecisionDefs(eng);assert.ok(d['em-rpm']&&d['em-radio']);
 const ref=Object.values(d).map(x=>({id:x.id,option:x.reference,at:0})),bad=programRun(emCfg(eng),ref.map(x=>x.id==='em-rpm'?{...x,option:'stretch'}:x)),ok=programRun(emCfg(eng),ref);
 assert.ok(bad.contact.descentMps>ok.contact.descentMps+2,'kollektifi tutmak sert temas yaratmıyor');
 const cs=EMERGENCIES.find(x=>x.id==='compressor-stall'),dc=emergencyDecisionDefs(cs),refc=Object.values(dc).map(x=>({id:x.id,option:x.reference,at:0}));
 const talk=programRun(emCfg(cs),refc.map(x=>x.id==='em-radio'?{...x,option:'talk'}:x));assert.ok(talk.events.some(e=>/Dikkat telsizde/.test(e.title))&&!talk.contact.obstacle,'telsiz gecikmesi ağaçlara iniş yaptırmamalı');
});
test('v0.51 uçuş hareketleri: standart karar anları eklendi ve hatalı seçenek uçuşta görünür',()=>{
 const ids=[['turns','turn-xc'],['climb-descent','cd-desc'],['climb-descent-turns','dt-climb'],['takeoff-ground','gt-climb'],['max-perf','mp-climb'],['decel-accel','da-accel'],['terrain-flight','tf-speed'],['formation','fm-turn']];
 for(const [mid,did] of ids){const m=MANEUVERS.find(x=>x.id===mid),d=maneuverDecisionDefs(m)[did];assert.ok(d,`${mid} ${did} yok`);const ref=programRun(manCfg(m),[{id:did,option:d.reference,at:0}]);
  for(const o of d.options){if(o.id===d.reference)continue;const r=programRun(manCfg(m),[{id:did,option:o.id,at:0}]);let dev=0;const n=Math.min(r.samples.length,ref.samples.length);
   for(let i=0;i<n;i++){const a=r.samples[i],b=ref.samples[i];dev=Math.max(dev,Math.abs(a.y-b.y)/.3048/12,Math.abs(wrap(a.hdg-b.hdg))/(8*R),Math.abs(a.roll-b.roll)/(5*R),Math.abs(Math.hypot(a.vx,a.vz)-Math.hypot(b.vx,b.vz))/.5144/5);}
   assert.ok(dev>=1,`${mid} ${did}=${o.id}: fark yok (${dev.toFixed(2)})`);assert.ok(r.events.some(e=>e.kind==='Standart dışı'),`${mid} ${did}=${o.id}: standart dışı olayı yok`);}}
});
test('v0.51 pilot seviyesi: tam güç kaybında deneyimli pilot her sahada yumuşak ve engelsiz iner; gelişmekte olan daha sert',async()=>{
 const {Session}=await import('../../engine.js');const e=EMERGENCIES.find(x=>x.id==='engine-total'),st=e.start;
 const run=(area,pl)=>new Session({program:'emergency',emergencyId:'engine-total',pilot:pl,copilot:pl,customStart:true,startHeightFt:st.h,startIasKt:st.v,startX:area===e.area?st.x:0,startZ:area===e.area?st.z:0,headingDeg:st.hdg??(area==='airfield'?65:0),flightArea:area,mode:'watch'}).evidence().summary.contact;
 let sx=0,sd=0;for(const area of ['terrain','airfield','mountain','forest']){const x=run(area,'experienced'),d=run(area,'developing');assert.ok(x.descentMps<=2.5&&!x.obstacle,`${area} deneyimli: ${x.descentMps.toFixed(2)} m/s ${x.obstacle}`);sx+=x.descentMps;sd+=d.descentMps;}
 assert.ok(sx<sd,`deneyimli toplam ${sx.toFixed(1)} / gelişmekte ${sd.toFixed(1)}`);
});
test('v0.51 temas rozeti engel temasında düşey sertlik yerine engel ve parça gösterir',()=>{
 const app=readFileSync(new URL('../../app.js',import.meta.url),'utf8');assert.ok(app.includes('Engel teması ·'),'engel teması ifadesi yok');
});
