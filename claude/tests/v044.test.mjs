// v0.44 — kare süresi (orman hücreleri, ayrıntı seviyesi), kararların uçuştaki sonucu, saha görselliği
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_CONFIG} from '../../catalog.js';
import {MANEUVERS,maneuverDecisionDefs} from '../../maneuver-catalog.js';
import {programRun} from '../../program-flight.js';
import {createForest} from '../../environment.js';
import {treesInBox,terrainHeight} from '../../terrain-data.js';
const manCfg=m=>({...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:m.start.h,startIasKt:m.start.v,flightArea:m.start.area??'terrain',startX:m.start.x??0,startZ:m.start.z??0,headingDeg:m.start.hdg??0,mode:'watch'});
const R=Math.PI/180,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

test('v0.44 orman: hücrelere bölünür, kameraya göre ayrıntı seviyesi değişir, ağaçlar gölge haritasına girmez',()=>{
 const trees=treesInBox(-1500,1500,-1500,1500,'terrain').map(t=>({...t,treeKind:t.kind,kind:'tree',y:terrainHeight(t.x,t.z,'terrain')}));
 assert.ok(trees.length>500,`ağaç sayısı ${trees.length}`);
 const g=createForest(trees,{time:{value:0},area:'terrain'});
 assert.ok(g.children.length>20,`hücre sayısı ${g.children.length}`);
 let inst=0;for(const cg of g.children)for(const m of cg.children)if(m.isInstancedMesh&&m.visible!==false&&m.geometry.parameters?.radialSegments===6)inst+=m.count;
 assert.equal(inst,trees.length,'her ağacın gövdesi bir kez');
 /* hücre çocukları: [gövde, iğne yapraklı 0/1/2, yuvarlak taç 0/1/2, (gölge)] */
 const lv=()=>{const c=[0,0,0];for(const cg of g.children){const k=cg.children;for(const L of [0,1,2])if(k[1+L].visible||k[4+L].visible)c[L]++;}return c;};
 g.userData.updateLOD({x:0,y:terrainHeight(0,0,'terrain')+30,z:0});const a=lv();
 g.userData.updateLOD({x:20000,y:500,z:20000});const b=lv();
 assert.ok(a[0]>0&&a[2]>0,`yakın / uzak ayrım yok ${a}`);assert.equal(b[0]+b[1],0,`çok uzakta ayrıntılı taç çiziliyor ${b}`);
 for(const cg of g.children)for(const m of cg.children)assert.equal(m.castShadow,false,'ağaç gölge haritasına giriyor');
});
test('v0.44 kararlar: hatalı seçenekler uçuşta görünür fark yaratır (rota, irtifa, baş, duruş veya RPM)',()=>{
 const ids=[['pattern-06','pt-checks'],['pattern-24','pt-checks-24'],['sim-tr-right','tr-thr'],['max-perf','mp-power'],['slope','sl-skid'],['formation','fm-sep']];
 for(const [mid,did] of ids){const m=MANEUVERS.find(x=>x.id===mid),d=maneuverDecisionDefs(m)[did];assert.ok(d,`${mid} ${did} yok`);const ref=programRun(manCfg(m),[{id:did,option:d.reference,at:0}]);
  for(const o of d.options){if(o.id===d.reference)continue;const r=programRun(manCfg(m),[{id:did,option:o.id,at:0}]);let dev=0;const n=Math.min(r.samples.length,ref.samples.length);
   for(let i=0;i<n;i++){const a=r.samples[i],b=ref.samples[i];dev=Math.max(dev,Math.abs(a.y-b.y)/.3048/12,Math.abs(wrap(a.hdg-b.hdg))/(8*R),Math.abs(a.roll-b.roll)/(5*R),Math.abs((a.rpm??0)-(b.rpm??0))/5);}
   assert.ok(dev>=1,`${mid} ${did}=${o.id}: uçuş usule göre değişmiyor (${dev.toFixed(2)})`);}}
});
test('v0.44 kararlar: iniş öncesi kontroller esas bacakta yapılınca son yaklaşma hattı geçilir',()=>{
 const m=MANEUVERS.find(x=>x.id==='pattern-06');const ok=programRun(manCfg(m),[]),bad=programRun(manCfg(m),[{id:'pt-checks',option:'base',at:0}]);
 assert.ok(bad.events.some(e=>e.kind==='Hata'&&/Dikkat kokpit içinde/.test(e.title)),'hata olayı yok');
 assert.ok(bad.duration>ok.duration+5,`yaklaşma uzamadı ${bad.duration.toFixed(0)} / ${ok.duration.toFixed(0)}`);
});
test('v0.44 açılış: uydu görüntüleri önceden keskinleştirilmiş, çalışma anında keskinleştirme yok',()=>{
 const td=readFileSync(new URL('../../terrain-detail.js',import.meta.url),'utf8'),sw=readFileSync(new URL('../../sw.js',import.meta.url),'utf8');
 assert.ok(!/sharpenCanvas\(ctx,/.test(td),'çalışma anında keskinleştirme çağrısı var');
 for(const f of ['golbasi-s2k.jpg','tepeler-s2k.jpg','guvercinlik-s2k.jpg']){assert.ok(td.includes(f.replace('golbasi','')||f)||/s2k\.jpg/.test(td),f);assert.ok(sw.includes(f),`sw.js ${f}`);}
});
test('v0.44 ısıtma çizimi: paylaşılan geometri bir kez kaydedilir ve geri yüklenir (kokpit panosu kırpık kalmaz)',()=>{
 const sv=readFileSync(new URL('../../scene-view.js',import.meta.url),'utf8');const m=sv.match(/precompile\(\)\{[\s\S]*?\n  for\(const o of hidden\)/);assert.ok(m,'precompile yok');
 assert.ok(/geos=new Map\(\)/.test(m[0])&&/if\(!geos\.has\(g\)\)/.test(m[0]),'geometri bir kez kaydedilmiyor');
 assert.ok(/for\(const \[g,\[st,ct\]\] of geos\)g\.setDrawRange\(st,ct\)/.test(m[0]),'geri yükleme yok');
});
test('v0.44 görsellik: uydu ağaç tepeleri bastırılır, ağaç gölgesi güneşe göre, kiremit çatı, ot öbekleri',()=>{
 const env=readFileSync(new URL('../../environment.js',import.meta.url),'utf8'),td=readFileSync(new URL('../../terrain-detail.js',import.meta.url),'utf8'),sv=readFileSync(new URL('../../scene-view.js',import.meta.url),'utf8');
 assert.ok(env.includes('canopy?')&&env.includes('placeShade')&&env.includes('setSun'),'zemin / gölge');
 assert.ok(sv.includes('setSun?.('),'güneş yönü ormana iletilmiyor');
 assert.ok(td.includes('function hipRoof')&&td.includes('tileRoofMat'),'kırma çatı yok');
 assert.ok(env.includes('_vn2('),'ot öbekleri yok');
});
test('v0.46 gece: pencere ışıkları ve sokak lambaları gece açılır, gündüz kapalı; ortam haritası gece kısılır',()=>{
 const td=readFileSync(new URL('../../terrain-detail.js',import.meta.url),'utf8'),sv=readFileSync(new URL('../../scene-view.js',import.meta.url),'utf8');
 assert.ok(td.includes('export function setNightLights')&&td.includes('function streetLamps')&&td.includes('emissiveMap:nightTexture(kind)'));
 assert.ok(/setNightLights\(weather\.night\?1:/.test(sv),'gece ışığı scene-view içinde ayarlanmıyor');
 assert.ok(/environmentIntensity=weather\.night\?\.0\d+/.test(sv),'ortam haritası gece kısılmıyor');
});
