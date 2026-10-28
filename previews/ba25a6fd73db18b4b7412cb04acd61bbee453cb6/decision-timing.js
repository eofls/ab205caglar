import {flightState} from './flight-dynamics.js';
import {currentLanding} from './site-redirect.js';
const cache=new Map();
const option=(id,label,text,risk=false)=>({id,label,text,risk});
export const RECOVERY_DECISION={id:'recovery',title:'Rotor devri düşüyor. Enerji yönetimine şimdi geçilsin mi?',source:['movements','tr'],options:[option('recover','Gecikmiş rotor devri yönetimine geç','Kollektif mevcut duruma göre düzenlenir; kaybedilen enerji geri yüklenmez.'),option('hold','Kumandaları tutmaya devam et','Otomatik devir koruma etkinleşmez; net aerodinamik güç belirleyicidir.',true)]};
export const EXTRA_DECISIONS={recovery:RECOVERY_DECISION,
 approach:{id:'approach',title:'Uzak hedef için kalan mesafe ve yükseklik azalıyor. Yaklaşma nasıl sürdürülsün?',source:['movements','dynamics'],options:[option('brake','Yavaşlamaya geç; mevcut erişimi değerlendir','Fleyır ve son kollektif seçenekleri kalan gerçek hız, tutum ve zamana göre açılır. Hedefe erişim garanti değildir.'),option('extend','Uzak hedef için sürati korumaya devam et','Yavaşlama mesafesi azalır; sonraki temas hızı ve hedef kaçırma hesabı korunur.',true)]},
 finalPull:{id:'finalPull',title:'Temas yaklaşıyor. Kalan rotor enerjisiyle son kollektif uygulansın mı?',source:['movements','dynamics'],options:[option('now','Kalan rotor enerjisini şimdi kullan','Kollektif tepki süresiyle yükselir; kalan yükseklik alçalışı durdurmaya yetmeyebilir.'),option('hold','Kollektifi uygulamadan devam et','Mevcut hatve korunur; otomatik son kollektif uygulanmaz.',true)]},
 cyclic:{id:'cyclic',title:'Saykılıkla iniş baş durumu nasıl tesis edilsin?',source:['movements','dynamics'],options:[option('coordinated','Fleyırdan ufkiyete kollektifle koordineli geç','İleri saykılık düzeltmesi disk eğimini azaltır; kuvvet ve hareket birlikte hesaplanır.'),option('now','Ufkiyete şimdi geç','Frenleyici disk eğimi şimdi azaltılır; kalan ileri sürat etkisini korur.',true),option('hold','Mevcut saykılık konumunu tut','Ufkiyet düzeltmesi yapılmaz; kalan disk eğimi temas tutumunu ve enerjiyi etkiler.',true)]},
 flare:{id:'flare',title:'Geri saykılıkla fleyır nasıl uygulansın?',source:['movements','dynamics'],options:[option('adaptive','Fleyırı sürat ve alçalışa göre düzenle','Geri saykılık ile yavaşlama, ardından ufkiyet ve son kollektif birlikte hesaplanır.'),option('late','Fleyırı yaklaşık 75 ft başlangıcına ertele','Düşey ve yatay enerjiyi azaltmak için daha az mesafe kalır.',true),option('omit','Fleyır uygulama; mevcut yaklaşmayı sürdür','Son kollektif tek başına ileri enerjiyi kullanamaz.',true)]},
 yaw:{id:'yaw',title:'Baş sapması büyüyor. Pedal düzeltmesi yapılsın mı?',source:['tr','dynamics'],options:[option('correct','Pedalları düzenle; istikameti kontrol et','Kuyruk rotoru itki talebi değişir; elde kalan rotor devri yön kontrolünü sınırlar.'),option('hold','Pedalları mevcut konumda tut','Tork dengesi bozulmuşsa baş sapması devam eder.',true)]},
 criticalRotor:{id:'criticalRotor',title:'Rotor enerjisi daha da azaldı. Kollektif yükü azaltılsın mı?',source:['tr','dynamics'],options:[option('unload','Kalan yükseklik içinde kollektif yükünü azalt','Önceki enerji kaybı silinmez; düşük devirde toparlanma ve iniş garanti edilmez.'),option('hold','Mevcut kollektif talebini sürdür','Yüksek hatve ve kayıplar rotor enerjisini tüketmeye devam eder.',true)]},
 cushion:{id:'cushion',title:'Son kollektifin zamanlamasını seç',source:['movements','dynamics'],options:[option('timed','Alçalış ve yüksekliğe göre son uygulama kararını sor','Kumanda kendiliğinden uygulanmaz; yaklaşan temas için ayrı bir şimdi uygula / tut kararı açılır.'),option('early','Kollektifi şimdi artır','Rotor enerjisi daha erken harcanır; sonuç hesaplanır.',true),option('late','Uygulamayı son ana ertele','Temas yaklaşınca bir son uygulama kararı sunulur; gecikmenin enerji ve zaman kaybı korunur.',true)]},
 vrs:{id:'vrs',title:'Düşük hava sürati ve güç altında alçalma: VRS eğilimi',source:['dynamics'],options:[option('exit','Kollektif talebini azalt; hava sürati kazan','Deneysel akış bölgesinden çıkış dalı; gerçek uçağın kurtarma usulü değildir.'),option('pull','Alçalışa karşı kollektifi artır','Talep ve rotor kayıpları artar; kaldırma/çöküş etkisi hesaba bağlıdır.',true),option('hold','Mevcut kumandaları koru','Eğilim ve enerji durumu izlenir.',true)]},
 obstacle:{id:'obstacle',title:'Uçuş yolunun önünde engel var. Nasıl geçilsin?',source:['movements','dynamics'],options:[option('climb','Saykılıkla tırman; sürati irtifaya çevirip üzerinden geç','Geri saykılıkla burun kaldırılır, ileri sürat irtifaya çevrilir; sürat ve rotor devri düşer, engel geçilince süzülüşe dönülür.'),option('brake','Hemen yavaşla; engelin önüne inmeyi dene','Fleyır şimdi başlar; kalan mesafe durmaya yetmezse temas engelde olur.'),option('hold','Mevcut yaklaşmayı sürdür','Yol ve yükseklik değişmez.',true)]},
 overspeed:{id:'overspeed',title:'Rotor devri yüksek: yükleme tercihi',source:['tr','dynamics'],options:[option('load','Kollektif yüklemesiyle devri yönet','Kollektif kuvveti ve kayıp torku birlikte değişir; ani RPM sıfırlaması yok.'),option('hold','Mevcut kumandaları koru','Devam eden enerji girişi devri daha da artırabilir.',true)]}
};
export const LEGACY_DEFAULTS={obstacle:'hold',approach:'extend',cyclic:'coordinated',finalPull:'now',flare:'adaptive',recovery:'hold',cushion:'timed',vrs:'hold',overspeed:'hold',yaw:'hold',criticalRotor:'hold'};
const reference={obstacle:'climb',approach:'brake',cyclic:'coordinated',finalPull:'now',flare:'adaptive',priority:'control',landing:'shared',recovery:'recover',cushion:'timed',vrs:'exit',overspeed:'load',yaw:'correct',criticalRotor:'unload'};
export function decisionPlan(s,c,answers,mode){
 if(mode!=='guided')return [];
 const key=JSON.stringify([s.height,s.ias,c,answers.map(a=>[a.id,a.option]),mode]);if(cache.has(key))return cache.get(key);
 const before=flightState(4,s,c,[]);if(before.contact||before.quality==='unsupported')return [];
 const chosen=(id,t=Infinity)=>mode==='watch'?reference[id]:(id==='landing'?currentLanding(answers,t)?.option:answers.find(a=>a.id===id)?.option)??(id==='priority'?'control':id.startsWith('approach-')?'brake':LEGACY_DEFAULTS[id.startsWith('approach')?'approach':id]??'distant'); /* a field picked in flight is flown to with a slow-down unless told otherwise */
 /* v0.33.1: every field flown to after the first choice (2 or a field picked in flight) gets its own approach / slow-down question */
 const apId=t=>{const l=chosen('landing',t);return l?.startsWith('site-')?'approach-'+l.slice(5):'approach';},braking=t=>(seen.has(apId(t))&&chosen(apId(t))==='brake')||chosen('obstacle')==='brake';
 const plan=[{id:'priority',at:4}],choices=[{id:'priority',at:4,option:chosen('priority')}],seen=new Set(['priority']);let previous=before;
 const add=(id,at)=>{plan.push({id,at});choices.push({id,at,option:chosen(id,at)});seen.add(id);};
 const lowFastFlare=(p,t)=>seen.has('landing')&&!seen.has('flare')&&(chosen('landing',t)==='shared'||braking(t))&&!p.controls.cushion&&p.tasKt>20&&p.heightAglFt>6;
 const redirects=(c.customSites??[]).filter(x=>x.at!==undefined).sort((a,b)=>a.at-b.at);let ri=0;
 for(let i=1;i<1760;i++){
  const t=Number((4+i*.1).toFixed(2)),p=flightState(t,s,c,choices);if(p.contact)break;
  while(ri<redirects.length&&redirects[ri].at<=t+1e-9){const r=redirects[ri++],id='redirect-'+r.number;plan.push({id,at:r.at});choices.push({id,at:r.at,option:answers.find(a=>a.id===id)?.option??'keep'});seen.add(id);}
  const ttg=p.heightAglFt/Math.max(1,p.descentFpm/60),gap=t-plan.at(-1).at;
  const finalWindow=chosen('cushion')==='late'?ttg<1.8&&p.heightAglFt*.3048<.65*p.controls.brakeHeightM:p.heightAglFt*.3048<p.controls.brakeHeightM;
  const finalDue=(['late','timed'].includes(chosen('cushion'))||p.controls.holdAll)&&(seen.has('cushion')||(p.groundHold&&s.height<=20))&&!seen.has('finalPull')&&!p.controls.cushion&&finalWindow;
  // Rotor overspeed builds within ~1 s in the flare: offer the loading choice while RPM is still rising, not after the peak.
  const overspeedDue=!seen.has('overspeed')&&!p.controls.cushion&&p.heightAglFt>5&&ttg>1.5&&(p.rotorRpm>329||(p.rotorRpm>321&&p.rotorRateRpmS>6));
  if(overspeedDue&&gap>=.35&&!finalDue){add('overspeed',t);previous=p;continue;}
  /* obstacle on the flight path that cannot simply be stopped short of: offer the avoidance choice early enough to fly it */
  {const o=p.obstacleAhead;if(!seen.has('obstacle')&&seen.has('landing')&&o&&!(p.approach?.distance!=null&&o.distance>p.approach.distance-15)&&o.time>=1.2&&o.time<=6&&gap>=.35&&!p.controls.cushion&&p.heightAglFt>8&&!finalDue&&(!p.controls.flare||o.stopM>o.distance*.8)){add('obstacle',t);previous=p;continue;}}
  if(finalDue&&gap>=.35){add('finalPull',t);previous=p;continue;}
  // Debounce in simulation time. Urgent near-ground landing gate may shorten the gap.
  if(gap<1.25){
   if(gap>=.35&&ttg<2.5){
    if(!seen.has('landing'))add('landing',t);
    else if(lowFastFlare(p,t))add('flare',t);
    else if(!seen.has('cushion')&&!(p.groundHold&&s.height<=20)&&p.heightAglFt>3)add('cushion',t);
   }
   previous=p;continue;
  }
  if(!seen.has('criticalRotor')&&(seen.has('recovery')||seen.has('landing'))&&p.rotorRpm<before.rotorRpm*.85&&p.rotorRateRpmS<-.5&&(!p.controls.managed||p.controls.collective>.95)&&p.heightAglFt>50&&ttg>3&&!p.controls.cushion){add('criticalRotor',t);previous=p;continue;}
  if(seen.has('landing')&&!seen.has('cushion')&&!(p.groundHold&&s.height<=20)&&ttg<3&&p.heightAglFt>3)add('cushion',t);
  else if(!seen.has('cyclic')&&p.maneuver.canLevel&&p.controls.flare&&!p.controls.levelCyclic&&ttg<5&&p.heightAglFt>12)add('cyclic',t);
  else if(!seen.has('overspeed')&&!p.controls.cushion&&p.rotorRpm>329&&p.heightAglFt>5&&ttg>2)add('overspeed',t);
  else if(!seen.has('vrs')&&!p.controls.cushion&&p.aerodynamics.vrsExposure>.08&&p.heightAglFt>10&&ttg>2)add('vrs',t);
  else if(chosen('priority')==='diagnose'&&!p.controls.managed&&!seen.has('recovery')&&!seen.has('landing')&&!(p.groundHold&&s.height<=20)&&p.rotorRpm<before.rotorRpm*.94&&p.rotorRpm<previous.rotorRpm&&ttg>5&&p.heightAglFt>60)add('recovery',t);
  else if(!seen.has('landing')&&((t>=5.2&&p.descentFpm>200)||p.heightAglFt<=Math.min(100,s.height*.65)||ttg<=6))add('landing',t);
  else if(seen.has('landing')&&(chosen('landing',t)==='distant'||chosen('landing',t)?.startsWith('site-'))&&!seen.has(apId(t))&&chosen('obstacle')!=='brake'&&p.approach.brakeReady&&p.tasKt>10&&!p.controls.cushion&&p.heightAglFt>12&&ttg>.7)add(apId(t),t);
  else if(seen.has('landing')&&(chosen('landing',t)==='shared'||braking(t))&&!seen.has('flare')&&!p.controls.cushion&&p.tasKt>10&&(ttg<14||p.heightAglFt<150)&&(ttg>.7||p.tasKt>20)&&(p.heightAglFt>20||(p.tasKt>20&&p.heightAglFt>6)))add('flare',t);
  else if(seen.has('landing')&&!seen.has('cushion')&&!(p.groundHold&&s.height<=20)&&ttg<8&&p.heightAglFt>10)add('cushion',t);
  previous=p;
 }
 cache.set(key,plan);if(cache.size>64)cache.delete(cache.keys().next().value);return plan;
}
export function decisionTimes(...args){return decisionPlan(...args).map(d=>d.at);}
