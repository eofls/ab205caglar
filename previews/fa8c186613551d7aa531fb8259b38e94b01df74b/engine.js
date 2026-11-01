import {DEFAULT_WEIGHT_LB,APP_VERSION,MAX_SESSION_SECONDS} from './flight-reference.js';
import {validateSites,landingOptions} from './landing-sites.js';
import {redirectDecision,redirectId,currentLanding} from './site-redirect.js';
import {contactAssessment} from './contact-assessment.js';
import {flightEvidence} from './flight-evidence.js';
import {decisionPlan,EXTRA_DECISIONS,LEGACY_DEFAULTS} from './decision-timing.js';
import {flightState,flightEnd,manualRun} from './flight-dynamics.js';
import {PROFILES,profileEvents} from './scenario-profiles.js';
import {powerTransition,transitionEvents} from './power-transition.js';
import {validateAircraftConfig,aircraftAssessment,aircraftSummary} from './aircraft-data.js';
import {detailedEvents,lessonView} from './scenario-lesson.js';
import {DEFAULT_CONFIG,SCENARIOS,CREW,getScenario,APPROVED_REFERENCE_CHOICES,genericDecisions} from './catalog.js';
import {EMERGENCIES,emergencyById} from './emergency-catalog.js';
import {MANEUVERS,maneuverById,maneuverDecisionDefs} from './maneuver-catalog.js';
import {isProgramFlight,programRun,emergencyDecisionDefs} from './program-flight.js';
import {calloutValues,fillCallout} from './callout-values.js';
import {ppc} from './performance.js';
function programDefs(c){return c.program==='maneuver'?maneuverDecisionDefs(maneuverById(c.maneuverId)):emergencyDecisionDefs(emergencyById(c.emergencyId));}
export const VERSION=15;
// v0.33.1 obstacle on the flight path: the options carry the computed distance, the height needed and the height the speed can buy.
function obstacleDecision(state){const base=EXTRA_DECISIONS.obstacle,o=state?.obstacleAhead;if(!o)return base;const what=o.kind==='wire'?'enerji hattı':'engel (ağaç / yapı)';
 return {...base,title:`Önde ${what}: ${Math.round(o.distance)} m, yaklaşık ${o.time.toFixed(1)} s. Nasıl geçilsin?`,options:base.options.map(op=>op.id==='climb'?{...op,risk:!o.canClimb,text:op.text+` Gereken yükseklik ≈ ${Math.max(0,Math.round(o.needM))} m; mevcut süratle kazanılabilecek ≈ ${Math.round(o.availM)} m.`}:op.id==='brake'?{...op,risk:o.stopM>o.distance,text:op.text+` Durma mesafesi ≈ ${Math.round(o.stopM)} m; engele ${Math.round(o.distance)} m.`}:op)};}
function approachDecision(target,state){const base=EXTRA_DECISIONS.approach,plan=state?.controls?.guidance?.plan,note=plan&&Number.isFinite(plan.needGlideRatio)?` Hesaplanan süzülüş: gereken ≈ ${plan.needGlideRatio.toFixed(1)}, ulaşılabilir en iyi ≈ ${plan.bestGlideRatio.toFixed(1)} (${plan.reachable?(plan.stretch>0?'yükseklik fazlası var; yol uzatılıyor':'erişim sınırda/uygun'):'hedef erişim dışında kalabilir'}). Tahmindir; garanti değildir.`:'',a={...base,options:base.options.map(o=>({...o,text:o.text+note}))};if(!target?.startsWith('site-'))return a;const n=target.slice(5);return {...a,title:`${n}. aday saha için kalan mesafe ve yükseklik azalıyor. Yaklaşma nasıl sürdürülsün?`,options:a.options.map(o=>o.id==='extend'?{...o,label:`${n}. sahaya erişmek için sürati korumaya devam et`}:o)};}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function number(v,a,b,key){if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b)throw Error('Geçersiz '+key);return v;}
export function validateConfig(raw){
  const c={...DEFAULT_CONFIG,...raw};
  Object.assign(c,validateAircraftConfig(c));
  c.customSites=validateSites(c.customSites);
  if(!Array.isArray(c.hiddenSites)||c.hiddenSites.some(x=>!['shared','distant'].includes(x)))throw Error('Geçersiz gizli saha');
  c.hiddenSites=[...new Set(c.hiddenSites)];
  c.nextSiteNumber=Math.max(c.nextSiteNumber??3,...c.customSites.map(t=>t.number+1),3);
  if(!Number.isInteger(c.nextSiteNumber)||c.nextSiteNumber>100001)throw Error('Geçersiz saha numarası');
  if(!getScenario(c.scenario))throw Error('Bilinmeyen senaryo');
  if(typeof c.customStart!=='boolean')throw Error('Geçersiz başlangıç türü');
  if(!c.customStart){c.startHeightFt=getScenario(c.scenario).height;c.startIasKt=getScenario(c.scenario).ias;}
  const prog=isProgramFlight(c);for(const [k,max] of [['startHeightFt',prog?4000:600],['startIasKt',prog?120:80]]){number(c[k],0,max,k);if(!Number.isInteger(c[k]))throw Error('Başlangıç değerleri tam sayı olmalı');}
  if(!['terrain','airfield','forest','mountain','water'].includes(c.flightArea))throw Error('Geçersiz uçuş sahası');
  if(!['auto','off'].includes(c.pedalMode))throw Error('Geçersiz otomatik pedal ayarı');
  if(!['blade','energy'].includes(c.physicsModel))throw Error('Geçersiz fizik modeli');
  c.physicsModel='energy'; // v0.32: single calibrated model (blade-element limits built in); old saves map here
  if(!['total','partial'].includes(c.powerLossMode))throw Error('Geçersiz güç kaybı türü');
  /* v0.34 program: emergencies (TM 9. bölüm) or flight manoeuvres; power-loss emergencies set the physics power-loss mode */
  if(!['emergency','maneuver'].includes(c.program))c.program='emergency';
  if(!EMERGENCIES.some(e=>e.id===c.emergencyId))c.emergencyId='engine-total';
  if(!MANEUVERS.some(m=>m.id===c.maneuverId))c.maneuverId=MANEUVERS[0]?.id??'hover';
  if(c.program==='emergency'){if(c.powerLossMode==='partial'&&c.emergencyId==='engine-total')c.emergencyId='engine-partial';const e=emergencyById(c.emergencyId);if(e.kind==='total'||e.kind==='partial')c.powerLossMode=e.kind;}
  if(!['guided','watch','manual'].includes(c.mode))throw Error('Geçersiz mod');
  if(typeof c.manualRunId!=='string'||c.manualRunId.length>64)throw Error('Geçersiz elle uçuş kaydı');
  for(const [k,a,b] of [['temperatureC',-20,45],['pressureAltitudeFt',0,12000],['windKt',0,40],['windFromDeg',0,359],['headingDeg',0,359],['visibilityKm',0.2,30],['startX',-4200,4200],['startZ',-4200,4200]])number(c[k],a,b,k);
  if(!['clear','scattered','overcast'].includes(c.cloudCover)||!['day','dusk','night'].includes(c.lighting)||!['none','rain'].includes(c.precipitation))throw Error('Geçersiz görsel atmosfer');
  if(!['none','light','moderate'].includes(c.turbulence)||!CREW[c.pilot]||!CREW[c.copilot])throw Error('Geçersiz koşul');
  return Object.fromEntries(Object.keys(DEFAULT_CONFIG).map(k=>[k,c[k]]));
}
export function weatherEffects(c){
 const angle=(c.windFromDeg-c.headingDeg)*Math.PI/180;
 const headwind=c.windKt*Math.cos(angle),crosswind=c.windKt*Math.sin(angle);
 // v0.32.2: short technical statements only (no meta disclaimers).
 const isaT=15-2*c.pressureAltitudeFt/1000,da=Math.round((c.pressureAltitudeFt+120*(c.temperatureC-isaT))/100)*100;
 const surface={water:'su yüzeyi',forest:'orman',airfield:'meydan',mountain:'tepelik arazi'}[c.flightArea]??'arazi';
 const effects=[{kind:'Meteoroloji',text:`Rüzgâr ${c.windKt} kt / ${c.windFromDeg}°: ${Math.abs(headwind).toFixed(1)} kt ${headwind>=0?'karşı':'arka'}, ${Math.abs(crosswind).toFixed(1)} kt yan bileşen.`,source:['faa']}];
 effects.push({kind:'Meteoroloji',text:`${c.temperatureC} °C, basınç irtifası ${c.pressureAltitudeFt} ft → yoğunluk irtifası ≈ ${da} ft.${da>4000?' Yüksek yoğunluk irtifası rotor verimini düşürür; alçalış oranı artar, fleyırda frenleme azalır.':''}`,source:['faa']});
 if(c.windKt>0)effects.push({kind:'Meteoroloji',text:`Rüzgâr yere yaklaştıkça azalır (${surface}); fleyır ve temas anında karşı rüzgâr katkısı yukarıdakinden düşüktür.${c.flightArea==='mountain'?' Rüzgârüstü yamaçta yükselen, rüzgâraltında çöken hava vardır.':''}`,source:['met','faa']});
 {const p=ppc({weightLb:c.grossWeightLb??DEFAULT_WEIGHT_LB,paFt:c.pressureAltitudeFt,tempC:c.temperatureC});effects.push({kind:'Performans',text:`PPC (${c.grossWeightLb??DEFAULT_WEIGHT_LB} lb, ${c.pressureAltitudeFt} ft, ${c.temperatureC} °C): azami tork ${p.tqMax} PSI; havır torku yer tesirinde ${p.tqIge}, dışında ${p.tqOge} PSI; güç payı ${p.margin} PSI. Azami havır ağırlığı yer tesirinde ${p.wMaxIge} lb, dışında ${p.wMaxOge} lb.${p.goOge?'':' Yer tesiri dışında havır gücü yok: tepe / kapalı bölge harekâtı yapılmaz.'}`,source:['tr'],reference:'TM 55-1520-210-10 bölüm 7 (yaklaşım)'});}
 effects.push({kind:'Meteoroloji',text:`Görüş ${c.visibilityKm} km${c.visibilityKm<5?': saha ve engel (tel, ağaç) tespiti zorlaşır.':'.'}`,source:['crm']});
 if(c.turbulence!=='none')effects.push({kind:'Meteoroloji',text:`${c.turbulence==='moderate'?'Orta':'Hafif'} türbülans: yatay σ≈${c.turbulence==='moderate'?'1.8':'0.7'} m/s, düşey σ≈${c.turbulence==='moderate'?'0.9':'0.35'} m/s; düşey bileşen yere yaklaştıkça azalır.`,source:['met','crm']});
 return {headwind,crosswind,effects};
}
export function freshRunConfig(config){return {...config,customSites:[],hiddenSites:[],nextSiteNumber:3};}
export class Session {
 constructor(config=DEFAULT_CONFIG){this.config=validateConfig(config);this.time=0;this.rate=1;this.playing=false;this.answers=[];this.legacyTiming=false;}
 addSite(x,z){
  // Until the landing question is answered the new field joins its options (shown at once if that question is open);
  // after it, the field opens its own redirect decision at this instant. Playback keeps running unless a decision appears.
  const n=this.config.nextSiteNumber,landed=this.answers.some(a=>a.id==='landing'),mid=this.config.mode==='guided'&&landed&&this.time>=4&&this.time<this.scenario.duration,customSites=validateSites([...this.config.customSites,mid?{number:n,x,z,at:Number(Math.max(4,this.time).toFixed(3))}:{number:n,x,z}]);
  const wasPlaying=this.playing;this.config={...this.config,customSites,nextSiteNumber:n+1};if(mid)this.time=customSites.find(t=>t.number===n).at; /* v0.33.1: the redirect question opens exactly now (was rounded past the clock, so it was shown but not pending) */this.playing=wasPlaying&&!this.pending;return 'site-'+n;
 }
 removeSite(id){
  if(!['shared','distant',...this.config.customSites.map(t=>'site-'+t.number)].includes(id))return;
  const landing=this.answers.find(a=>a.id==='landing'&&a.option===id),oldSites=this.config.customSites;
  this.config={...this.config,customSites:this.config.customSites.filter(t=>'site-'+t.number!==id),hiddenSites:['shared','distant'].includes(id)?[...new Set([...this.config.hiddenSites,id])]:this.config.hiddenSites};
  if(landing){this.answers=this.answers.filter(a=>a.at<landing.at);this.time=Math.min(this.time,landing.at);}
  const gone=oldSites.find(t=>'site-'+t.number===id&&t.at!==undefined);if(gone){this.answers=this.answers.filter(a=>a.at<gone.at);this.time=Math.min(this.time,gone.at);}
  this.playing=false;
 }
 get baseScenario(){
  if(!this.config.customStart)return getScenario(this.config.scenario);
  const c=this.config;
  return {...getScenario('caution'),id:'custom',decisions:genericDecisions(),name:'Serbest başlangıç',subtitle:`${c.startHeightFt} ft · ${c.startIasKt} KIAS`,height:c.startHeightFt,ias:c.startIasKt,zone:'context',zoneLabel:'Seçilen nokta',
   context:`Motor arızası için seçilen başlangıç: ${c.startHeightFt} ft skid AGL ve ${c.startIasKt} KIAS (çatı ölçeği). Başlangıç seçimi serbesttir; otomatik bölge sınıflandırması henüz yapılmıyor.`,
   aero:'Seçilen yükseklik ve sürat birlikte değerlendirilir. Yerden açıklık, ileri sürat ve rotor enerjisi aynı şey değildir. Alçak havır ile seyir koşullarına aynı ilk kumanda kalıbı uygulanmaz.',
   outcome:'Bu noktadaki sonuç; diyagramın ağırlık/konfigürasyon koşulları, rotor enerjisi, arazi, hava ve mürettebat kararlarıyla birlikte değerlendirilecek. Seçilen nokta aynı deneysel uçuş ve benzetilmiş hasar hesabını başlatır; H/V bölgesi otomatik doğrulanmaz.'};
 }
 get scenario(){
  if(isProgramFlight(this.config)){const base=this.baseScenario,c=this.config,defs=programDefs(c),guided=c.mode==='guided',run=programRun(c,guided?this.answers:[]),title=c.program==='maneuver'?maneuverById(c.maneuverId).title:emergencyById(c.emergencyId).title;
   const decisions=guided?run.decisions.filter(d=>defs[d.id]&&d.at<run.duration).map(d=>({...defs[d.id],at:d.at,...(d.reference?{reference:d.reference}:{})})):[];
   return {...base,name:title,subtitle:c.program==='maneuver'?'Uçuş hareketi':'Emercensi · '+emergencyById(c.emergencyId).ref,zone:'context',zoneLabel:c.program==='maneuver'?'Uçuş hareketi':'Emercensi',lesson:null,decisions,duration:run.duration,endReason:run.endReason};}
  const base=this.baseScenario,plan=decisionPlan(base,this.config,this.answers,this.config.mode);
  const decisions=plan.map(item=>{const site=item.id.startsWith('redirect-')?this.config.customSites.find(t=>redirectId(t)===item.id):null,d=site?redirectDecision(site):item.id.startsWith('approach')?{...approachDecision(currentLanding(this.answers.filter(a=>a.at<=item.at+1e-9))?.option,this.config.mode==='guided'?flightState(item.at,base,this.config,this.answers.filter(a=>a.at<item.at-1e-9)):null),id:item.id}:item.id==='obstacle'?obstacleDecision(this.config.mode==='guided'?flightState(item.at,base,this.config,this.answers.filter(a=>a.at<item.at-1e-9)):null):(EXTRA_DECISIONS[item.id]??base.decisions.find(d=>d.id===item.id));return {...d,at:item.at,options:(d.id==='landing'?landingOptions(this.config,d.options):d.options).map(o=>({...o,label:o.id==='control'?(base.ias<=5&&base.height<=20?'Havır konumunu tut; kollektifi koru ve rotor devrini izle':'Rotor enerjisini yönet; kollektif ve saykılığı düzenle'):o.id==='diagnose'?'Kumandaları başlangıç konumunda tut; arızayı incele':o.id==='shared'?(base.ias<=5?'1 · Yakın yüzeyi seç; son kollektifle alçalmayı azalt':'1 · Yakın hedefi seç; yavaşlama ve son kollektifi uygula'):o.id==='distant'?'2 · Uzak hedefi izle; yaklaşmada yavaşlamayı değerlendir':o.label}))};});
  const choices=this.config.mode==='watch'?decisions.map(d=>({id:d.id,at:d.at,option:APPROVED_REFERENCE_CHOICES[d.id]})):this.answers;
  const end=flightEnd(base,this.config,choices);return {...base,decisions:decisions.filter(d=>d.at<end.time),duration:end.time,endReason:end.reason};
 }
 get pending(){if(this.config.mode!=='guided')return undefined;const open=this.scenario.decisions.filter(d=>!this.answers.some(a=>a.id===d.id)&&this.time>=d.at);return open.find(d=>d.id.startsWith('redirect-')&&Math.abs(d.at-this.time)<1e-6)??open[0];}
 seek(t){
  if(!Number.isFinite(t))throw Error('Geçersiz zaman');
  let target=clamp(t,0,this.scenario.duration);
  if(this.config.mode==='guided'){const missing=this.scenario.decisions.find(d=>!this.answers.some(a=>a.id===d.id));if(missing)target=Math.min(target,missing.at);}
  this.time=target;if(this.pending||target===this.scenario.duration)this.playing=false;return this.snapshot();
 }
 tick(delta){if(!Number.isFinite(delta)||delta<0)throw Error('Geçersiz zaman adımı');if(this.playing)this.seek(this.time+delta*this.rate);return this.snapshot();}
 play(){if(!this.pending&&this.time<this.scenario.duration)this.playing=true;}
 pause(){this.playing=false;}
 setRate(rate){if(![0.5,1,1.5,2].includes(rate))throw Error('Geçersiz hız');this.rate=rate;}
 choose(id,option){
  const d=this.scenario.decisions.find(d=>d.id===id);
  if(this.config.mode!=='guided'||!d||Math.abs(this.time-d.at)>0.001||!d.options.some(o=>o.id===option))throw Error('Karar bu anda seçilemez');
  if(this.scenario.decisions.some(x=>x.at<d.at-1e-9&&!this.answers.some(a=>a.id===x.id)))throw Error('Önceki karar eksik');
  this.answers=this.answers.filter(a=>a.at<d.at-1e-9||(Math.abs(a.at-d.at)<=1e-9&&a.id!==id));
  if(id.startsWith('redirect-')&&option==='keep'){this.config={...this.config,customSites:this.config.customSites.filter(t=>redirectId(t)!==id)};this.playing=false;return this.snapshot();}
  this.answers.push({id,option,at:d.at});this.playing=false;return this.snapshot();
 }
 choices(){return this.config.mode==='watch'?this.scenario.decisions.map(d=>({id:d.id,at:d.at,option:APPROVED_REFERENCE_CHOICES[d.id]})):this.answers;}
 narrativeEvents(){
  const s=this.scenario,c=this.config,w=weatherEffects(c);
  const aircraftEvent={at:.5,kind:'Konfigürasyon',title:'Hava aracı girdileri ve kaynak kapsamı',text:`Ağırlık ${c.grossWeightLb?c.grossWeightLb+' lb':'2800 kg (standart)'} · rotor ${c.initialRotorRpm??324} RPM · motor ${c.initialEngineRpm??6600} RPM.`,source:['tr'],reference:'TR §5.2.2, §5.4.2, §5.8, Şekil 5-1.2 ve 9-2. Kullanıcı girdileri uygulanabilirlik onayı değildir.'};
  if(s.lesson==='S01')return [aircraftEvent,...this.decisionEvents(),...transitionEvents(this.config),...detailedEvents(c,this.choices(),w,CREW).filter(e=>e.at<=6&&e.kind!=='Karar')].sort((a,b)=>a.at-b.at);
  const events=[aircraftEvent,...transitionEvents(this.config),
   {at:0,kind:'Başlangıç',title:s.name,text:s.context,source:['chart']},
   {at:1,kind:'Mürettebat',title:'Görev paylaşımı',text:`Pilot: ${CREW[c.pilot].label}. ${CREW[c.pilot].text} İkinci pilot: ${CREW[c.copilot].label}. ${CREW[c.copilot].text}`,source:['crm']},
   {at:2,kind:'Meteoroloji',title:'Seçilen çevre',text:w.effects.map(e=>e.text).join(' '),source:[...new Set(w.effects.flatMap(e=>e.source))]},
   {at:4,kind:'Sistem',title:'Tam motor gücü kaybı',text:'Tam güç kaybı. Belirtiler: burun sola sapar, motor sesi değişir, tork ve N1 düşer, rotor devri azalmaya başlar. İlk tepki: kollektif aşağı (devri korumak için), sağ pedal, sürat kontrolü.',source:['tr','tm']},
   {at:6,kind:'Aerodinamik',title:'Başlangıç koşulunun etkisi',text:s.aero,source:['tr','faa']},
   {at:18,kind:'Sistem',title:'Rotorun tahrik yolu',text:'Serbest bırakma kavraması motoru rotordan ayırır. Kuyruk rotoru ve hidrolik pompa transmisyondan tahrik edilir; rotor döndükçe yön kontrolü ve hidrolik destek sürer.',source:['tr']},
   {at:33,kind:'Değerlendirme',title:'Saha, hava ve ekip birlikte',text:'Saha seçimi: yüzey, eğim, engeller (tel, ağaç, bina) ve rüzgâr yönü birlikte değerlendirilir; iniş mümkünse rüzgâra karşı yapılır.',source:['tr','faa','crm']},
   {at:s.duration-5,kind:'Sonuç',title:'Senaryonun tartışma sonucu',text:s.outcome,source:['tr','faa']}
  ];
  for(const a of this.choices()){const d=s.decisions.find(d=>d.id===a.id);if(!d)continue;const o=d.options.find(o=>o.id===a.option);events.push({at:d.at+0.1,kind:'Karar',title:o.label,text:o.text,source:d.source,risk:o.risk});}
  return [...events.filter(e=>!(PROFILES[s.id]&&e.kind==='Sonuç')),...profileEvents(s,this.choices())].sort((a,b)=>a.at-b.at);
 }
 events(){const pe=this.config.program==='emergency'&&!isProgramFlight(this.config)&&this.config.emergencyId!=='engine-total'&&this.config.emergencyId!=='engine-partial'?emergencyById(this.config.emergencyId):null;
  if(pe){const base=this.physicsEvents(),i=base.findIndex(e=>e.at>=4);base.splice(i<0?base.length:i,0,{at:4,kind:'Emercensi',title:pe.title+' · '+pe.ref,text:'Belirtiler: '+pe.symptoms+' Usul: '+pe.steps.map(x=>x.replace(/^!/,'')).join(' · ')+'.',source:['tr'],reference:'Operatör talimnamesi '+pe.ref});return base;}
  return this.physicsEvents();}
 physicsEvents(){if(isProgramFlight(this.config)){const s=this.scenario,run=programRun(this.config,this.config.mode==='guided'?this.answers:[]),p=flightState(s.duration,s,this.config,this.choices()),c=p.contact;
   const ev=run.events.filter(e=>e.at<=s.duration).map(e=>{const o={...e,source:e.source??['tr']};if(/\{[A-Z]/.test(o.text+o.title)){const k=run.filled??=new Map(),key=e.at+'|'+e.title;if(!k.has(key)){const v=calloutValues(flightState(Math.min(s.duration,e.at+1.2),s,this.config,this.choices()),this.config,e.at);k.set(key,{title:fillCallout(e.title,v),text:fillCallout(e.text,v)});}Object.assign(o,k.get(key));}return o;});
   ev.push({at:s.duration,kind:'Sonuç',title:s.endReason==='contact'?(c?.obstacle?'İniş · engel teması':'İniş tamamlandı'):'Senaryo tamamlandı',text:(c?`Temas: ${c.descentMps.toFixed(1)} m/s alçalış, ${(c.groundSpeedMps/(1852/3600)).toFixed(0)} kt yer sürati, ${(c.surface?.label??'').toLocaleLowerCase('tr-TR')}. `:'')+(this.choices().length&&this.config.mode==='guided'?'Kararlar: '+this.choices().map(a=>s.decisions.find(d=>d.id===a.id)?.options.find(o=>o.id===a.option)?.label??a.option).join(' · ')+'.':''),source:['tr']});
   return ev.sort((a,b)=>a.at-b.at);}
  const s=this.scenario,events=[...this.narrativeEvents().map(e=>this.config.powerLossMode==='partial'&&e.at===4?{...e,title:'Kısmi güç kaybı · deneysel dal',text:'Kısmi güç kaybı: başlangıç şaft gücünün %35’i kullanılabilir. Kalan güç düz uçuşu sürdürmeye yetmez; alçalış kaçınılmazdır.'}:e),...(this.config.mode==='manual'&&s.endReason!=='contact'?[]:flightEvidence(s,this.config,this.choices()).events)].filter(e=>e.kind!=='Sonuç'&&e.at<s.duration);const p=flightState(s.duration,s,this.config,this.choices()),impact=contactAssessment(p);if(p.contact?.wire)events.push({at:Math.min(s.duration,p.contact.time+.05),kind:'Engel',title:'Enerji hattına çarpma',text:`${p.contact.part==='mainRotor'?'Ana rotor palleri':'Gövde/kızak'} iletkene ${(p.contact.supportHeightM/.3048).toFixed(0)} ft AGL’de temas etti. Hat, direkler ve turuncu işaret küreleri sahnede gösterilir; saha seçerken engel olarak değerlendirilmelidir.`,source:['tr','crm'],reference:'Benzetilmiş engel; tel çarpması sonrası hareket temsili'});
if(p.contact?.time>0&&p.ground?.mechanics){const m=p.ground.mechanics;events.push({at:Math.min(s.duration,p.contact.time+.2),kind:'Zemin',title:m.water?'Su teması':m.rollover?'Skid takılması ve devrilme':m.snag?'Düzensiz zeminde takılma':'Yüzey üzerinde yavaşlama',text:m.surface.label+'. Temas sonrası yatay hareket yüzeye göre hesaplanıyor. '+(m.rollover?'Skid takılması gövdeyi döndürüyor; takip eden rotor ve kuyruk temasları hasar görseline aktarılıyor.':m.water?'Suya giriş ve batma temsili; yüzdürme sistemi modellenmedi.':'Kayma miktarı temas sürati ve yüzey direncine bağlı.'),source:['tr'],reference:'Deneysel zemin/engel modeli'});}events.push({at:s.duration,kind:'Sonuç',title:s.endReason==='contact'?'Yerleşme tamamlandı · senaryo sonucu':s.endReason==='unsupported'?'Hesap kapsamı dışında':'Hesap zaman sınırında durdu',text:`${s.endReason==='contact'?`Temas öncesi alçalış ${p.descentFpm.toFixed(0)} ft/dk, yer sürati ${p.groundSpeedKt.toFixed(1)} kt, rotor ${p.rotorRpm.toFixed(0)} RPM.${impact.severity?.label?' '+impact.severity.label+'.':''}`:'Uçuş sonucu belirlenmedi.'}${this.choices().length&&this.config.mode!=='watch'?' Kararlar: '+this.choices().map(a=>s.decisions.find(d=>d.id===a.id)?.options.find(o=>o.id===a.option)?.label??a.option).join(' · ')+'.':''}`,source:['tr'],reference:'Deneysel kuvvet/enerji hesabı; uçuş doğrulaması yok.'});return events.sort((a,b)=>a.at-b.at);}
 evidence(){const sc=this.scenario;if(this.config.mode==='manual'&&sc.endReason!=='contact')return {summary:{contact:null},events:[],samples:[]};return flightEvidence(sc,this.config,this.choices());}
 decisionEvents(){return this.choices().map(a=>{const d=this.scenario.decisions.find(d=>d.id===a.id),o=d?.options.find(o=>o.id===a.option);return {at:a.at,kind:'Karar',title:o?.label??a.id,text:o?.text??'',source:d?.source??['tr'],reference:'Deneysel kumanda dalı; zaman fizik durumundan belirlenir.'};});}
 snapshot(){
  const scenario=this.scenario,choices=this.choices(),events=this.events().filter(e=>e.at<=this.time),answers=choices.filter(a=>a.at<=this.time);
  const power=powerTransition(this.time,this.config,scenario,choices),physical=power.physicalState,complete=this.time>=scenario.duration;
  const lesson=scenario.lesson==='S01'?{...lessonView(this.time,choices,scenario.decisions),phases:[...lessonView(this.time,choices,scenario.decisions).phases.filter(p=>p.at<scenario.duration),{at:scenario.duration,label:'Tamamlandı'}],complete,...(this.config.mode==='watch'?{crew:'Uyarlanabilir pilot · anlık durum değerlendirmesi',field:'Anlık kumandalara göre T temas tahmini',focus:'compare'}:{})}:null;
  return {power,aircraft:aircraftAssessment(this.config),time:this.time,duration:scenario.duration,playing:this.playing,rate:this.rate,pending:this.pending?.id??null,events,answers,current:events.at(-1),stage:complete?'Tamamlandı':physical.ground?.phase??physical.controls.phase,lesson,renderFrame:{presentationProgress:this.time/(scenario.duration||1),enginePowered:physical.powered,physicalState:physical},riskChoices:answers.filter(a=>scenario.decisions.find(d=>d.id===a.id)?.options.find(o=>o.id===a.option)?.risk).length};
 }
 serialize(){return {schemaVersion:VERSION,appVersion:APP_VERSION,legacyTiming:this.legacyTiming,config:{...this.config},time:this.time,rate:this.rate,answers:this.answers.map(a=>({...a})),...(this.config.mode==='manual'?{manualInputs:manualRun(this.config.manualRunId).inputs.map(r=>[...r])}:{})};}
 static restore(raw){
  if(!raw||![1,2,3,4,5,6,7,8,9,10,11,12,13,14,VERSION].includes(raw.schemaVersion)||!Array.isArray(raw.answers)||raw.answers.length>64)throw Error('Desteklenmeyen kayıt');
  const s=new Session(raw.config);if(s.config.mode==='manual'){if(raw.manualInputs!==undefined&&(!Array.isArray(raw.manualInputs)||raw.manualInputs.length>40000||raw.manualInputs.some(r=>!Array.isArray(r)||r.length!==5||r.some(v=>!Number.isFinite(v)))))throw Error('Geçersiz elle uçuş kaydı');const run=manualRun(s.config.manualRunId);run.reset(raw.manualInputs??[]);run.prepare(s.baseScenario,s.config);if(Number.isFinite(raw.time))run.ensure(Math.min(600,raw.time));}if(raw.legacyTiming!==undefined&&typeof raw.legacyTiming!=='boolean')throw Error('Geçersiz zamanlama');s.legacyTiming=raw.schemaVersion===VERSION&&raw.legacyTiming===true;s.setRate(raw.rate);
  let previous=-1;const seen=new Set();
  for(const a of raw.answers){if(seen.has(a.id)||![...s.baseScenario.decisions,...Object.values(EXTRA_DECISIONS),...s.config.customSites.filter(t=>t.at!==undefined).map(redirectDecision),...s.config.customSites.map(t=>({...EXTRA_DECISIONS.approach,id:'approach-'+t.number})),...Object.values(programDefs(s.config))].some(d=>d.id===a.id&&(d.id==='landing'?landingOptions(s.config,d.options):d.options).some(o=>o.id===a.option)))throw Error('Geçersiz karar');seen.add(a.id);if(raw.schemaVersion!==VERSION){for(let n=0;n<16;n++){const next=s.scenario.decisions.find(d=>!s.answers.some(x=>x.id===d.id));if(!next||next.id===a.id||!LEGACY_DEFAULTS[next.id])break;s.seek(next.at);s.choose(next.id,LEGACY_DEFAULTS[next.id]);}}const d=s.scenario.decisions.find(d=>d.id===a.id);if(!Number.isFinite(a.at)||a.at<=previous)throw Error('Geçersiz karar kaydı');previous=a.at;if(!d){if(raw.schemaVersion===VERSION)throw Error('Karar bulunamadı');continue;}if(raw.schemaVersion===VERSION&&a.at!==d.at)throw Error('Geçersiz karar zamanı');s.seek(d.at);s.choose(a.id,a.option);}
  number(raw.time,0,isProgramFlight(s.config)?MAX_SESSION_SECONDS:600,'zaman');if(raw.schemaVersion!==VERSION){for(let n=0;n<16;n++){const next=s.scenario.decisions.find(d=>!s.answers.some(x=>x.id===d.id));if(!next||next.at>raw.time||!LEGACY_DEFAULTS[next.id])break;s.seek(next.at);s.choose(next.id,LEGACY_DEFAULTS[next.id]);}}const target=raw.schemaVersion===VERSION?raw.time:Math.min(raw.time,s.scenario.duration);s.seek(target);if(raw.schemaVersion===VERSION&&s.time!==target)throw Error('Karar atlanmış kayıt');return s;
 }
}
