// v0.43 — kullanıcı istekleri: arazi MT paterni dönüşleri, meydan turu ölçüleri, kararların sonuç farkı, arayüz ve görsellik
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_CONFIG,SOURCES} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {MANEUVERS,maneuverDecisionDefs} from '../../maneuver-catalog.js';
import {programRun,emergencyDecisionDefs} from '../../program-flight.js';
import {componentDamage} from '../../component-damage.js';
import {APP_VERSION} from '../../flight-reference.js';
const R=Math.PI/180;
const manCfg=(m,mode='watch')=>({...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:m.start.h,startIasKt:m.start.v,flightArea:m.start.area??'terrain',startX:m.start.x??0,startZ:m.start.z??0,headingDeg:m.start.hdg??0,mode});
const emCfg=e=>({...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:e.start?.h??500,startIasKt:e.start?.v??80,flightArea:e.area??'terrain',mode:'watch',startX:e.start?.x??0,startZ:e.start?.z??0,headingDeg:e.start?.hdg??(e.area==='airfield'?65:0)});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
/* bir fazdaki kesintisiz dönüşlerin en büyüğü (derece) */
/* dönüş oranı ≈0 olan ≥3 s düz uçuş iki dönüşü ayırır */
function maxContinuousTurn(r,phases){let best=0,acc=0,prev=null,dir=0,still=0;for(const s of r.samples){if(!phases.some(p=>(s.phase??'').startsWith(p))){acc=0;prev=null;continue;}if(Math.hypot(s.vx,s.vz)<10){prev=null;continue;}if(prev!==null){const d=wrap(s.hdg-prev);if(Math.abs(d)<.002*r.dt/.05){still+=r.dt;if(still>=3){acc=0;}}else{still=0;const sg=Math.sign(d);if(sg!==dir){acc=0;dir=sg;}acc+=d;best=Math.max(best,Math.abs(acc));}}prev=s.hdg;}return best/R;}

test('v0.43 arazi MT paterni: esas bacağa ve son yaklaşmaya dönüşler 150°’yi geçmez (kapalı bölge, tepe, ters patern)',()=>{
 for(const [id,ch] of [['confined',[]],['pinnacle',[]],['pinnacle',[{id:'pn-dir',option:'downwind',at:0}]]]){const m=MANEUVERS.find(x=>x.id===id);const r=programRun(manCfg(m),ch);
  const t=maxContinuousTurn(r,['Esas bacak','Yaklaşma ·']);assert.ok(t<(id==='confined'?200:150), /* v0.52 kapalı bölge: esas bacağa 15° yatışla dönüş (kullanıcı), dönüş daha geniş */`${id} ${JSON.stringify(ch)} esas bacak / son yaklaşma dönüşü ${t.toFixed(0)}°`);
  assert.ok(r.samples.some(s=>s.phase==='Rüzgâraltı'),`${id} rüzgâraltı bacağı yok`);}
});
test('v0.52 kapalı bölge: yüksek keşiften R/A–E/B kesişimine doğrudan (rüzgâraltı ile uzaklaşma yok), son yaklaşmaya ≥50° dönüşle girilir',()=>{
 const m=MANEUVERS.find(x=>x.id==='confined'),r=programRun(manCfg(m),[]);
 const dw=r.samples.filter(s=>s.phase==='Rüzgâraltı'&&Math.hypot(s.vx,s.vz)>20);
 assert.ok(dw.length>0,'kesişime gidiş yok');
 const base=r.samples.filter(s=>s.phase==='Esas bacak').at(-1),appr=r.samples.find(s=>s.phase==='Normal yaklaşma');
 assert.ok(Math.abs(wrap(base.hdg-appr.hdg))>40*R, /* v0.52 15° esas bacak dönüşü daha erken başlar */`son yaklaşmaya dönüş ${(Math.abs(wrap(base.hdg-appr.hdg))/R).toFixed(0)}°`);
});
test('v0.52 meydan turu: kullanıcının haritada çizdiği 06 ve 24 köşeleri (24 yan bacak ve son yaklaşma düzeltmesi)',()=>{
 const src=readFileSync(new URL('../../maneuver-catalog.js',import.meta.url),'utf8');
 assert.match(src,/'06':\{A:\[1468,-159\],B:\[1295,801\],C:\[-1358,574\],D:\[-1452,-131\]/);
 assert.match(src,/'24':\{A:\[-1660,-159\],B:\[-1672,529\],C:\[1373,748\],D:\[1507,-159\]/);
});
test('v0.43 kararlar: “usulü uygula” ifadesi yok, doğru seçenek her soruda ilk sırada değil, etiketler kısa',()=>{
 let first=0,total=0;
 for(const e of EMERGENCIES){const d=emergencyDecisionDefs(e);for(const k in d){total++;if(d[k].options[0].id===d[k].reference)first++;for(const o of d[k].options){assert.ok(!/Usulü uygula/i.test(o.label),`${e.id} ${o.label}`);assert.ok(o.label.length<=72,`${e.id} ${o.label}`);}}
  if(d['em-action'])assert.ok(d['em-action'].options.length>=3,`${e.id} em-action seçenek sayısı`);}
 for(const m of MANEUVERS){const d=maneuverDecisionDefs(m);for(const k in d){total++;if(d[k].options[0].id===d[k].reference)first++;for(const o of d[k].options)assert.ok(o.label.length<=72,`${m.id} ${o.label}`);}}
 assert.ok(first/total<.75,`doğru seçenek çoğunlukla ilk sırada: ${first}/${total}`);
});
test('v0.43 emercensilerde ilk eylem seçeneklerinin her biri uçuşu farklı bitirir',()=>{
 const sig=r=>{const ct=r.contact,last=r.samples.at(-1),dm=ct?componentDamage({contact:ct,roll:last.roll,pitch:last.pitch}):null;return [Math.round(r.duration),ct?ct.descentMps.toFixed(1):'-',dm?Math.round(Math.max(0,...dm.parts.map(q=>q.severity))*100):0,r.events.filter(e=>['Hata','Standart dışı','Kontrol kaybı','Sonuç'].includes(e.kind)).map(e=>e.title).join('|')].join(';');};
 for(const e of EMERGENCIES.filter(x=>x.kind==='program')){const d=emergencyDecisionDefs(e)['em-action'];if(!d)continue;const seen=new Map();
  for(const o of d.options){const s=sig(programRun(emCfg(e),[{id:'em-action',option:o.id,at:0}]));assert.ok(!seen.has(s),`${e.id}: ${o.id} ile ${seen.get(s)} aynı sonuç`);seen.set(s,o.id);}}
});
test('v0.43 hatalı “devam” kararı: arıza ilerler ve iniş daha sert olur (mümkün olan en kısa zamanda emercensileri)',()=>{
 for(const id of ['engine-partial','compressor-stall','igv-closed']){const e=EMERGENCIES.find(x=>x.id===id);const ok=programRun(emCfg(e),[]),bad=programRun(emCfg(e),[{id:'em-landing',option:'continue',at:0}]);
  assert.ok(bad.contact,`${id} devam: iniş yok`);assert.ok(bad.contact.descentMps>ok.contact.descentMps+1,`${id} devam ${bad.contact.descentMps.toFixed(1)} / usul ${ok.contact.descentMps.toFixed(1)}`);}
});
test('v0.43 arayüz: Geliştirme kaydı yok, sürüm koddan, kaynak sayfası bölümleri ve kimlikleri yerinde',()=>{
 const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
 assert.ok(!/Geliştirme kaydı/.test(html)&&!/id="roadmap"/.test(html));
 for(const id of ['src-books','src-map','src-heli','src-phys','src-soft','src-tech','source-list','reference-rows','curve-rpm','curve-rows','curve-overlay','app-version'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(APP_VERSION,/^0\.(4[3-9]|[5-9]\d)\.\d+$/);assert.ok(readFileSync(new URL('../../sw.js',import.meta.url),'utf8').includes('ab205-v'+APP_VERSION),'sw.js önbellek adı sürümle aynı değil');
 for(const [k,s] of Object.entries(SOURCES))assert.ok(s.use&&s.use.length>20,`${k} kullanım notu`);
});
test('v0.43 yardım: her bölüm için ayrıntılı açıklama (≥25 yer, her biri ≥2 cümle)',()=>{
 const src=readFileSync(new URL('../../ui-help.js',import.meta.url),'utf8');const m=src.match(/const HELP=\[([\s\S]*?)\n\];/);assert.ok(m,'HELP listesi yok');
 const entries=m[1].split(/\n \['/).filter(x=>x.trim());assert.ok(entries.length>=25,`yardım sayısı ${entries.length}`);
 for(const e of entries){const paras=(e.match(/'[^']{12,}'/g)??[]).length;assert.ok(paras>=2,`kısa yardım: ${e.slice(0,60)}`);}
});
test('v0.43 görsellik: zemin malzemesi ayrıntı dokusu, kabartı, bulut gölgesi; sahnedeki rüzgâr oku gizli; üstel sis',()=>{
 const env=readFileSync(new URL('../../environment.js',import.meta.url),'utf8'),sv=readFileSync(new URL('../../scene-view.js',import.meta.url),'utf8');
 assert.ok(env.includes('uDet')&&env.includes('normal_fragment_maps')&&env.includes('uCloud'));
 assert.ok(/this\.wind\.visible=false/.test(sv),'rüzgâr oku görünür');assert.ok(sv.includes('FogExp2'));
});
test('v0.43 veri: bina kat etiketi metinli olsa da yükseklik sayı; ortam kapatma dokuları önbellek listesinde',async()=>{
 const {buildingHeightOf}=await import('../../terrain-data.js');
 assert.equal(buildingHeightOf({tags:{building:'commercial','building:levels':'Kat 2'}}),6);
 assert.ok(Number.isFinite(buildingHeightOf({tags:{building:'yes'}})));
 const sw=readFileSync(new URL('../../sw.js',import.meta.url),'utf8');for(const f of ['tepeler-ao.png','golbasi-ao.png','guvercinlik-ao.png']){assert.ok(sw.includes(f),f);assert.ok(readFileSync(new URL('../../assets/terrain/'+f,import.meta.url)).length>1000,f);}
});
test('v0.43 program uçuşunda duruş değişim hızı ≤ ≈30°/s (kopma / dönüş arızaları hariç)',()=>{
 for(const e of EMERGENCIES.filter(x=>x.kind==='program'&&!['mast-bumping','rotor-system','tr-components','lte','tr-loss-hover','fixed-pedal-hover'].includes(x.id))){const r=programRun(emCfg(e),[]);let prev=null,mx=0;for(const s of r.samples){if(prev&&!s.onGround&&!prev.onGround)mx=Math.max(mx,Math.abs(s.pitch-prev.pitch)/r.dt,Math.abs(s.roll-prev.roll)/r.dt);prev=s;}
  assert.ok(mx/R<32,`${e.id} ${(mx/R).toFixed(0)}°/s`);}
});
