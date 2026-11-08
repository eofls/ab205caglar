// v0.52 — fleyır, havır otorotasyonu, BAP torku, yaklaşma duruşu, arazi uçuşu, saha seçimi, QNH, tel dizini
import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_CONFIG} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {MANEUVERS} from '../../maneuver-catalog.js';
import {programRun} from '../../program-flight.js';
import {Session} from '../../engine.js';
import {terrainHeight,wireTopNear,POWER_LINES,treesNear,OPEN_FIELDS} from '../../terrain-data.js';
import {pressureAltFt,atmosphere} from '../../flight-reference.js';
import {readFileSync} from 'node:fs';
const D=180/Math.PI,FT=.3048,KT=.5144;
const emCfg=e=>{const st=e.start??{},area=e.area??'terrain';return {...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:st.h??500,startIasKt:st.v??80,flightArea:area,startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??(area==='airfield'?65:0),mode:'watch'};};
const manCfg=m=>({...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:m.start.h,startIasKt:m.start.v,flightArea:m.start.area??'terrain',startX:m.start.x??0,startZ:m.start.z??0,headingDeg:m.start.hdg??((m.start.area??'terrain')==='airfield'?65:0),mode:'watch'});
const run=id=>{const m=MANEUVERS.find(x=>x.id===id);return {m,r:programRun(manCfg(m),[])};};
const agl=(q,a)=>(q.y-terrainHeight(q.x,q.z,a))/FT;

test('v0.52 mecburi iniş fleyırı: tedrici ve derin (≥25° burun yukarı), temastan önce ufkiyet, temasta ≤3 kt',()=>{
 const {m,r}=run('forced-ground'),a=m.start.area??'terrain';
 const fl=r.samples.filter(q=>/Fleyır/.test(q.phase??''));assert.ok(fl.length>10);
 assert.ok(Math.min(...fl.map(q=>q.pitch))*D<-25,'fleyır derin değil');
 const td=r.samples.find(q=>q.onGround&&q.t>20);assert.ok(td,'temas yok');
 assert.ok(Math.abs(td.pitch*D)<4,`temasta baş ${(td.pitch*D).toFixed(1)}°`);
 assert.ok(Math.hypot(td.vx,td.vz)/KT<=3.2,`temasta ${(Math.hypot(td.vx,td.vz)/KT).toFixed(1)} kt`);
});

test('v0.52 havır / taksi otorotasyonu: kollektif aşağı indirilmez, yalnız yukarı',()=>{
 for(const id of ['hover-autorot','taxi-autorot']){const {r}=run(id);let c0=null,prev=null,down=0;
  for(const q of r.samples){if(!/otorot|Gaz kıs|Çöküş|Kollektif/i.test(q.phase??'')||q.onGround)continue;const c=q.controls?.collective;if(c==null)continue;if(c0===null)c0=c;if(prev!==null&&c<prev-.004)down++;prev=c;}
  assert.ok(down===0,`${id}: kollektif ${down} adımda azaldı`);}
});

test('v0.52 BAP kalkış: havır torku +5 PSI anlatımla uyumlu (BAP kartı: +3/−0)',()=>{
 const src=readFileSync(new URL('../../maneuver-catalog.js',import.meta.url),'utf8');
 assert.match(src,/tqAdd:S\.limit\?18:S\.p3&&el>2\?8:5/);
 const {r}=run('max-perf');const hov=r.samples.filter(q=>/Havır/.test(q.phase??'')&&q.pw).at(-1),bap=r.samples.filter(q=>/Azami|performans/i.test(q.phase??'')&&q.pw);
 assert.ok(hov&&bap.length);const rise=Math.max(...bap.map(q=>q.pw))/hov.pw;assert.ok(rise>1.05&&rise<1.35,`güç oranı ${rise.toFixed(2)}`);
});

test('v0.52 yaklaşmada yavaşlarken baş durumu ≈5–7° burun yukarı; iz ve sürat değişmedi',()=>{
 const {r}=run('approach-hover');const dec=r.samples.filter(q=>/Normal yaklaşma/.test(q.phase??'')&&Math.hypot(q.vx,q.vz)/KT>12&&Math.hypot(q.vx,q.vz)/KT<55);
 assert.ok(dec.length>10);const mean=dec.reduce((s,q)=>s+q.pitch*D,0)/dec.length;assert.ok(mean<-4.5&&mean>-8,`ortalama baş ${mean.toFixed(1)}°`);
});

test('v0.52 arazi uçuşu: hiçbir karar birleşiminde yere sürtünme yok; her geçişte karar',()=>{
 const m=MANEUVERS.find(x=>x.id==='terrain-flight'),a=m.start.area;const base=programRun(manCfg(m),[]);
 const ids=base.decisions.map(d=>d.id);for(const id of ['tf-speed','tf-ref','tf-noe','tf-exit'])assert.ok(ids.includes(id),id+' yok');
 for(const ch of [[],[{id:'tf-ref',option:'ground',at:0}],[{id:'tf-speed',option:'fast',at:0},{id:'tf-ref',option:'ground',at:0},{id:'tf-noe',option:'fast',at:0}]]){
  const r=programRun({...manCfg(m),mode:'guided'},ch);const low=r.samples.filter(q=>q.t>3&&agl(q,a)<10);assert.equal(low.length,0,JSON.stringify(ch));}
});

test('v0.52 acil durum saha seçimi: karar var, seçilen sahaya gidilir',()=>{
 const e=EMERGENCIES.find(x=>x.id==='engine-partial');const cfg={...emCfg(e),mode:'guided'};
 const s=new Session(cfg);const d=s.scenario.decisions.find(x=>x.id==='em-site');assert.ok(d,'saha kararı yok');assert.ok(d.options.length>=2);
 const pick=d.options[1].id,ans=[];for(const x of s.scenario.decisions)ans.push({id:x.id,option:x.id==='em-site'?pick:x.reference??x.options[0].id,at:x.at});
 const r=programRun(cfg,ans),td=r.samples.find(q=>q.onGround&&q.t>d.at)??r.samples.at(-1);
 assert.ok(Math.hypot(td.x-r.lz.x,td.z-r.lz.z)<120,'seçilen sahaya inilmedi');
 const r0=programRun({...cfg,mode:'watch'},[]);assert.ok(Math.hypot(r.lz.x-r0.lz.x,r.lz.z-r0.lz.z)>250,'ikinci saha önerilenle aynı');
});

test('v0.52 otomatik pedal seçeneği yok; QNH basınç irtifasına girer',()=>{
 assert.ok(!/name="pedalMode"/.test(readFileSync(new URL('../../index.html',import.meta.url),'utf8')));
 assert.ok(/name="qnhHpa"/.test(readFileSync(new URL('../../index.html',import.meta.url),'utf8')));
 const c={...DEFAULT_CONFIG};assert.equal(pressureAltFt(c),c.pressureAltitudeFt);
 assert.ok(atmosphere({...c,qnhHpa:990}).density<atmosphere({...c,qnhHpa:1030}).density);
});

test('v0.52 tel araması dizinli ve aynı sonucu verir; açık alan ağaçsız',()=>{
 for(const A of ['terrain','mountain'])for(const L of POWER_LINES[A])for(let i=0;i<L.length;i++){const [x,z]=L[i];for(const r of [5,10,30]){const v=wireTopNear(x,z,A,r);assert.ok(v>-Infinity,`${A} ${i}`);}}
 for(const f of OPEN_FIELDS.mountain)assert.equal(treesNear(f.x,f.z,Math.min(f.rx,f.rz)*.8,'mountain').length,0);
});

test('v0.52 kokpit: pedal yönü, 3B ADI yunuslama, balık gözü, uç yolu düzlemi, kuyruk kızağı, silecek kırpma',()=>{
 const sm=readFileSync(new URL('../../scene-model.js',import.meta.url),'utf8'),sv=readFileSync(new URL('../../scene-view.js',import.meta.url),'utf8'),gd=readFileSync(new URL('../../cockpit-gauges-draw.js',import.meta.url),'utf8');
 assert.match(sm,/pedalsL\.position\.x=P\.pedalsL\.userData\.restPosition\.x-pd\*\.08/);assert.match(sm,/tailSkid/);
 assert.match(gd,/const y0=-pitch\/R\*pp;/);assert.match(sv,/fishK\(\)/);assert.match(sv,/wiperClip/);assert.match(sv,/this\.tpp/);assert.match(sv,/L\.tFov=null;/);
});
