import {MAX_SESSION_BYTES,liveFlightState} from './flight-reference.js';
import {terrainHeight as liveTerrainHeight} from './terrain-data.js';
import {HeliAudio,soundInputs} from './heli-audio.js';
import {foldNotes} from './ui-help.js';
import {StartMap} from './start-map.js';
import {ProgramPicker} from './program-picker.js';
import {renderProgramDebrief} from './program-debrief.js';
import {isProgramFlight,programRun,isManualProgram,setManualInputSource} from './program-flight.js';
import {currentLanding} from './site-redirect.js';
import {cleanEventText,watchSanitize} from './event-text.js';
import {renderDebrief} from './debrief.js';
import {ManualInput} from './manual-input.js';
import {manualRun,flightState as rawFlightState} from './flight-dynamics.js';
setManualInputSource(id=>manualRun(id));
import {FLIGHT_AREAS} from './terrain-data.js';
import {alternativeResults} from './counterfactual.js';
import {contactAssessment} from './contact-assessment.js';
import {componentDamage} from './component-damage.js';
import {controlMarkup,renderControls} from './control-display.js';
import {PROFILES} from './scenario-profiles.js';
import {BOOK_KEY,validateBook,addRecord,removeRecord,decisionReview,comparisonRows,resultRows} from './scenario-book.js';
import {visualWeather} from './visual-weather.js';
import {POWERED_FLIGHT_REFERENCE} from './aircraft-data.js';
import {CURVES,readCurve,chartPoint} from './curve-reference.js';
import {AIRCRAFT_OPTIONS,DEFAULT_AIRCRAFT,OPTIONAL_AIRCRAFT_NUMBERS,REFERENCE_ROWS,parseAircraftNumber} from './aircraft-data.js';
import {FullscreenLayout} from './fullscreen-layout.js';
import {LESSON_PHASES} from './scenario-lesson.js';
import {SceneView} from './scene-view.js';
import {freshRunConfig,Session} from './engine.js';
import {SCENARIOS,CREW,DEFAULT_CONFIG,SOURCES} from './catalog.js';
import {pointToStart,startToPoint,PLOT} from './chart-selection.js';
const $=id=>document.getElementById(id),KEY='ab205-scenario-lab-v1';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=t=>{const cs=Math.round(Math.max(0,t)*100);return `${String(Math.floor(cs/6000)).padStart(2,'0')}:${String(Math.floor(cs/100)%60).padStart(2,'0')}.${String(cs%100).padStart(2,'0')}`;};
let session=new Session(),lastSignature='',lastDecision='',lastSave=0,restoreMessage='',lastFocusedDecision=null;
try{const raw=localStorage.getItem(KEY);if(raw){session=Session.restore(JSON.parse(raw));restoreMessage='Son oturum geri yüklendi · Duraklatıldı';}}catch(e){restoreMessage='Yerel kayıt kullanılamadı; yeni oturum açıldı.';}
let book={schemaVersion:1,entries:[]},undoBook=null,compareId=null,reviewSignature='',bookBlocked=false,bookRevision=0;
try{const raw=localStorage.getItem(BOOK_KEY);if(raw)book=validateBook(JSON.parse(raw));}catch(e){bookBlocked=true;}
$('control-display').innerHTML=controlMarkup();
const sceneView=new SceneView($('scene-host'));globalThis.__sceneView=sceneView;
let autoResume=false;
$('scene-host').addEventListener('site-edit',e=>{if(session.config.mode==='manual')return;try{const was=session.playing;if(e.detail.remove)session.removeSite(e.detail.remove);else{session.addSite(e.detail.x,e.detail.z);if(session.pending)autoResume=autoResume||was;}lastSignature='';lastDecision='';reviewSignature='';render();save();flashNote(e.detail.remove?'Saha kaldırıldı.':session.pending?.id?.startsWith('redirect-')?'Yeni saha işaretlendi · karar bekleniyor.':'Yeni saha işaretlendi.');}catch(err){error(err);}});
$('scene-host').addEventListener('site-miss',()=>flashNote('Zemin bulunamadı · ufkun altında bir noktaya tıklayın.'));
function flashNote(text){let n=document.getElementById('site-flash');if(!n){n=document.createElement('div');n.id='site-flash';n.className='site-flash';n.setAttribute('role','status');$('scene-host').appendChild(n);}n.textContent=text;n.classList.remove('show');void n.offsetWidth;n.classList.add('show');clearTimeout(flashNote.t);flashNote.t=setTimeout(()=>n.classList.remove('show'),2200);}
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>sceneView.preset(b.dataset.camera));
const fullscreen=new FullscreenLayout({document,root:$('scene-panel'),button:$('scene-fullscreen'),entries:[
 {node:$('event-panel'),slot:$('fullscreen-event')},{node:$('transport-panel'),slot:$('fullscreen-transport')},{node:$('decision'),slot:$('fullscreen-decision')},{node:$('rpm-readout'),slot:$('fullscreen-rpm')},{node:$('manual-panel'),slot:$('fullscreen-manual')}
],onChange:active=>{sceneView.resize();if(active&&session.pending)$('decision').querySelector('[data-choice]')?.focus({preventScroll:true});else $('scene-fullscreen').focus({preventScroll:true});}});
$('scene-fullscreen').onclick=async()=>{try{await fullscreen.toggle();}catch(e){error(new Error('Bu tarayıcıda tam ekran açılamadı.'));}};
function save(){try{localStorage.setItem(KEY,JSON.stringify(session.serialize()));$('save-status').textContent='Bu cihazda kaydedildi · '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});}catch(e){$('save-status').textContent='Otomatik kayıt kullanılamıyor; Oturumu indir’i kullan.';}}
function error(e){$('error').textContent=e.message||String(e);}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.hidden=p.id!==id);document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.page===id));}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
const setupTabs=[...document.querySelectorAll('[data-setup-tab]')];
function selectSetupTab(tab){
 for(const button of setupTabs){const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;$(button.getAttribute('aria-controls')).hidden=!selected;}
}
setupTabs.forEach((button,index)=>{
 button.onclick=()=>selectSetupTab(button);
 button.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%setupTabs.length;else if(e.key==='ArrowLeft')next=(index+setupTabs.length-1)%setupTabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=setupTabs.length-1;else return;e.preventDefault();selectSetupTab(setupTabs[next]);setupTabs[next].focus();};
});

$('source-list').innerHTML=Object.entries(SOURCES).map(([id,s])=>`<article class="panel source-card" id="source-${id}"><span class="eyebrow">${esc(id.toUpperCase())} / KAYNAK KAYDI</span><h2>${esc(s.title)}</h2><p>${esc(s.file)}</p><p class="meta">${esc(s.pages)}<br>Basılı sayfa: ${esc(s.printed)}</p><p class="source-status">${esc(s.status)}</p></article>`).join('');
document.querySelectorAll('[data-aircraft-options]').forEach(el=>el.innerHTML=Object.entries(AIRCRAFT_OPTIONS[el.name]).map(([value,label])=>`<option value="${value}">${esc(label)}</option>`).join(''));
$('reference-rows').innerHTML=REFERENCE_ROWS.map(r=>`<tr><th scope="row">${esc(r.title)}</th><td>${esc(r.value)}</td><td>${esc(r.source)}<small>${esc(r.context)}</small>${r.image?`<a href="${r.image}" target="_blank" rel="noopener">Kaynak görseli ↗</a>`:''}</td><td>${esc(r.status)}</td></tr>`).join('');
$('edit-aircraft').onclick=()=>{selectSetupTab($('setup-tab-aircraft'));$('setup-tab-aircraft').scrollIntoView({behavior:'smooth',block:'start'});$('setup-tab-aircraft').focus({preventScroll:true});};
document.querySelectorAll('[data-page-link]').forEach(b=>b.onclick=()=>showPage(b.dataset.pageLink));
function draftWeight(){const value=$('aircraft-form').elements.namedItem('grossWeightLb').value;const lb=parseAircraftNumber(value);$('weight-conversion').textContent=lb!==null&&Number.isFinite(lb)&&lb>0?`≈ ${(lb*.45359237).toLocaleString('tr-TR',{maximumFractionDigits:1})} kg`:'— kg';}
$('aircraft-form').oninput=()=>{draftWeight();$('aircraft-dirty').textContent='Girdiler henüz uygulanmadı; uygulama akışı başa alır.';};
$('aircraft-form').onsubmit=e=>{e.preventDefault();try{const c={...session.config};for(const [k,v] of new FormData(e.target))c[k]=OPTIONAL_AIRCRAFT_NUMBERS.includes(k)?parseAircraftNumber(v):v;reset(c);}catch(e){error(e);}};
document.querySelectorAll('.crew-select').forEach(el=>el.innerHTML=Object.entries(CREW).map(([id,c])=>`<option value="${id}">${c.label}</option>`).join(''));
function fillForm(){ queueMicrotask(syncPilotVis);queueMicrotask(()=>{try{startMap?.update(session.config);}catch(e){console.warn(e);}});$('area-heading').textContent=FLIGHT_AREAS[session.config.flightArea]+' / AB–205';$('area-caption').textContent=session.config.flightArea==='terrain'?'39.713081, 32.775265 · DEM arazi':session.config.flightArea==='airfield'?'LTAB · 06/24 pist 2017 × 36 m · Görüntü: Sentinel-2 cloudless 2023 (EOX, CC BY-NC-SA 4.0; Copernicus) · Yükseklik: Copernicus DEM GLO-30 · Harita: © OpenStreetMap katkıcıları':'Temsili saha · zemin ve engeller ayrı hesaplanır';for(const [k,v] of Object.entries(session.config)){const el=$('config-form').elements.namedItem(k);if(el)el.value=v;}for(const k of Object.keys(DEFAULT_AIRCRAFT)){const el=$('aircraft-form').elements.namedItem(k);if(el)el.value=session.config[k]??'';}draftWeight();$('aircraft-dirty').textContent='';$('start-height').value=session.config.startHeightFt;$('start-ias').value=session.config.startIasKt;$('dirty').textContent='';}
function reset(config=session.config){if(isProgramFlight(config)&&config.mode==='manual'&&!isManualProgram(config)){config={...config,mode:'watch'};queueMicrotask(()=>flashNote?.('Elle uçuş bu bölümde henüz yok; hazır akış açıldı.'));}config={...config,manualRunId:config.mode==='manual'?'m'+Date.now().toString(36)+Math.floor(Math.random()*1e4):''};if(config.mode==='manual')manualRun(config.manualRunId).reset([]);session=new Session(freshRunConfig(config));lastSignature='';lastDecision='';fillForm();render();save();$('error').textContent='';}
function scenarioButtons(){return SCENARIOS.map(s=>`<button type="button" class="scenario-card ${!session.config.customStart&&s.id===session.config.scenario?'selected':''}" data-scenario="${s.id}" aria-pressed="${!session.config.customStart&&s.id===session.config.scenario}"><span class="dot ${s.zone}"></span><strong>${s.name}</strong><small>${s.subtitle}</small></button>`).join('');}
$('start-lesson').onclick=()=>reset({...session.config,scenario:'safe',customStart:false});
$('scenario-list').onclick=e=>{const b=e.target.closest('[data-scenario]');if(b)reset({...session.config,scenario:b.dataset.scenario,customStart:false});};
function selectStart(point){if(point)reset({...session.config,...point,customStart:true});}
$('start-form').onsubmit=e=>{e.preventDefault();try{selectStart({startHeightFt:Number($('start-height').value),startIasKt:Number($('start-ias').value)});}catch(e){error(e);}};
$('chart-picker').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();selectStart(pointToStart((e.clientX-r.left)/r.width*PLOT.width,(e.clientY-r.top)/r.height*PLOT.height));};
$('chart-picker').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();selectStart({startHeightFt:Math.max(0,Math.min(600,session.config.startHeightFt+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0))),startIasKt:Math.max(0,Math.min(80,session.config.startIasKt+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)))});};
$('config-form').oninput=()=>{$('dirty').textContent='Değişiklikler henüz uygulanmadı. Uygulamak mevcut akışı sıfırlar.';};
$('config-form').onsubmit=e=>{e.preventDefault();try{const c={...session.config};for(const [k,v] of new FormData(e.target))c[k]=typeof DEFAULT_CONFIG[k]==='number'?Number(v):v;if(c.flightArea==='airfield'&&session.config.flightArea!=='airfield'&&c.headingDeg===session.config.headingDeg)c.headingDeg=65;if(c.flightArea!==session.config.flightArea){c.startX=0;c.startZ=0;}reset(c);}catch(e){error(e);}};
function sourceButtons(keys){return keys.map(k=>`<button class="source-chip" data-source="${k}" title="Kaynak kaydını aç">${esc(SOURCES[k].title)}</button>`).join('');}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-source]');if(b){session.pause();render();save();try{await fullscreen.exit();showPage('sources');$('source-'+b.dataset.source).scrollIntoView({behavior:'smooth',block:'center'});}catch(err){error(err);}}});
function render(){
 renderReview();manualUi();
 $('weather-caption').textContent=visualWeather(session.config).label;
 sceneView.update(session);
 const state=session.snapshot(),s=session.scenario;
 $('rotor-rpm').textContent=state.power.rotor.text;$('engine-rpm').textContent=state.power.engine.text;
 // v0.33.1 caution panel: TM 55-1520-210-10 Fig. 2-9 segment wording, MASTER CAUTION and the RPM warning light (§2-85)
 {let panel=$('caution-panel');if(!panel){panel=document.createElement('div');panel.id='caution-panel';panel.className='caution-panel';panel.setAttribute('role','status');panel.setAttribute('aria-label','İkaz paneli');
   const SEG=[['eop','ENGINE OIL PRESS'],['eicing','ENGINE ICING'],['eicedet','ENGINE ICE DET'],['echip','ENGINE CHIP DET'],['lboost','LEFT FUEL BOOST'],['rboost','RIGHT FUEL BOOST'],['efpump','ENG FUEL PUMP'],['m20','20 MINUTE FUEL'],['ffilter','FUEL FILTER'],['govemer','GOV EMER'],['auxlow','AUX FUEL LOW'],['xop','XMSN OIL PRESS'],['xhot','XMSN OIL HOT'],['hyd','HYD PRESSURE'],['inlet','ENGINE INLET AIR'],['inv','INST INVERTER'],['gen','DC GENERATOR'],['ext','EXTERNAL POWER'],['chip','CHIP DETECTOR'],['iff','IFF']];
   panel.innerHTML='<div class="cp-top"><b data-l="fire" class="warn">FIRE</b><b data-l="rpm" class="warn">RPM</b><b data-l="mc">MASTER CAUTION</b></div><div class="cp-grid">'+SEG.map(([k,t])=>`<b data-l="${k}">${t}</b>`).join('')+'</div>';$('scene-host').appendChild(panel);}
  // RPM light: rotor 300–310 (low) / 329–339 (high) or engine 6100–6300 (low). After a flameout the gas producer spools down:
  // engine oil pressure, the engine-driven fuel pump and the starter-generator drop out; transmission-driven oil and hydraulic
  // pumps keep working while the rotor turns and fall away only as it stops on the ground.
  const ps=state.power.physicalState,rr=ps.ground?.rotorRpm??ps.rotorRpm,er=ps.ground?.engineRpm??ps.engineRpm??state.power.engine?.rpm??6600,low=rr<=305&&rr>1,high=rr>=332,engLow=er<=6200&&state.time>=4,dead=state.time>=4.6&&session.config.powerLossMode!=='partial'&&er<5000,stopped=rr<120;
  const on={rpm:low||high||engLow,eop:dead,efpump:dead,gen:dead,xop:stopped,hyd:stopped};on.mc=['eop','efpump','gen','xop','hyd'].some(k=>on[k]);
  /* v0.34 program flights: the emergency's own segments, FIRE and RPM warning; electrical master off = dark panel */
  const prog=ps.program;if(prog){/* v0.35 a throttle at idle (otorotasyon çalışması) keeps the engine-driven pumps and the generator on line; only a stopped engine drops them */const off=state.time>=4.6&&er<2500;on.eop=on.efpump=on.gen=off;on.mc=off||stopped;on.rpm=!!prog.warn?.rpm||(off&&rr>1&&rr<300);on.fire=!!prog.warn?.fire;for(const l of prog.lights??[])on[l]=true; /* MASTER CAUTION only while it is not reset ('mc' in the program lights) */if(prog.panelOff)for(const k of Object.keys(on))on[k]=false;}
  panel.querySelectorAll('b[data-l]').forEach(el=>el.classList.toggle('on',!!on[el.dataset.l]));panel.classList.toggle('active',Object.values(on).some(Boolean));}
 const flight=state.renderFrame.physicalState;
 if(!window.__heliAudio){const a=window.__heliAudio=new HeliAudio();a.arm();const tb=document.querySelector('.scene-toolbar');if(tb&&!$('sound-toggle')){const b=document.createElement('button');b.id='sound-toggle';b.type='button';b.setAttribute('aria-pressed','true');b.textContent='Ses: açık';b.onclick=()=>{a.setEnabled(!a.enabled);b.setAttribute('aria-pressed',String(a.enabled));b.textContent=a.enabled?'Ses: açık':'Ses: kapalı';};tb.appendChild(b);}
}
 window.__heliAudio.update(soundInputs(flight,state.power),session.playing);
 renderControls($('control-display'),flight);
 $('live-airspeed').textContent=flight.quality==='unsupported'?'— KIAS':flight.iasKt.toFixed(1)+' KIAS';
 $('live-altitude').textContent=flight.heightAglFt.toFixed(1)+' ft AGL';
 $('live-descent').textContent=flight.quality==='unsupported'?'— ft/dk':(Math.abs(flight.descentFpm)<.5?'0':(flight.descentFpm<0?'+':'−')+Math.abs(flight.descentFpm).toFixed(0))+' ft/dk'; /* v0.38.2 varyo: + tırmanış, − alçalış */
 const result=contactAssessment(flight),badge=$('contact-result');
 {let box=$('damage-parts');if(!box){box=document.createElement('div');box.id='damage-parts';box.className='damage-parts';badge.after(box);}const show=session.time>=s.duration&&result.available&&flight.contact;box.hidden=!show;if(show){const cd=componentDamage(flight),rows=cd.parts.filter(q=>q.severity>=.08).sort((a,b)=>b.severity-a.severity);box.innerHTML='<b>Parça bazlı hasar değerlendirmesi</b>'+(rows.length?'<ul>'+rows.map(q=>`<li><span class="dp-name">${esc(q.label)}${q.directContact?' · ilk temas':''}${q.detach?' · ayrılma':''}</span><span class="dp-bar"><i style="width:${Math.round(q.severity*100)}%"></i></span><span class="dp-state">${esc(q.state)}</span></li>`).join('')+'</ul>':'<p>Belirgin parça hasarı öngörülmedi.</p>')+'<small>Benzetim tahmini; gerçek kırılma eşikleri ve iç hasar doğrulanmış değildir.</small>';}}badge.hidden=!(session.time>=s.duration&&result.available);if(!badge.hidden){badge.textContent=`Temas sertliği %${result.severity.percent} · ${result.severity.label} · ${result.damage}`;badge.style.setProperty('--contact-color',result.severity.color);badge.title=result.severity.note+' '+result.reason;}

 $('live-descent').title=flight.contact?'Temas sonrası düşey hız; temas öncesi değer raporda.':'Varyo: + tırmanış, − alçalış (ft/dk). Anlık düşey hız hesabı.';
 $('live-groundspeed').textContent=flight.quality==='unsupported'?'— kt':flight.groundSpeedKt.toFixed(1)+' kt yer';
 $('rpm-phase').textContent=state.power.phase;$('rpm-note').textContent=state.power.note+' · IAS hava sürati; yer sürati ayrı';
 if(flight.ground){const live=liveFlightState(flight,liveTerrainHeight);$('engine-rpm').textContent=live.engineRpm.toFixed(0)+' RPM';$('live-airspeed').textContent=live.iasKt.toFixed(1)+' KIAS';$('rotor-rpm').textContent=live.rotorRpm.toFixed(1)+' RPM';$('live-altitude').textContent=live.heightAglFt.toFixed(1)+' ft AGL';$('live-descent').textContent=((v=>(Math.abs(v)<.5?'0':(v>0?'+':'−')+Math.abs(v).toFixed(0)))(-live.descentFpm))+' ft/dk';$('live-groundspeed').textContent=live.groundSpeedKt.toFixed(1)+' kt yer';$('rpm-phase').textContent=flight.ground.phase;$('rpm-note').textContent='Temas sonrası varsayımsal zemin modeli · temas öncesi değerler sonuç raporunda';}
 $('rpm-readout').title=state.power.explanation+' '+state.power.reference;
 const profile=PROFILES[s.id];
 $('profile-code').textContent=profile?profile.code+' / SENARYO ODAĞI':s.lesson==='S01'?'S01 / DÜZ UÇUŞ':'SERBEST BAŞLANGIÇ';
 $('profile-title').textContent=profile?.title??(s.lesson==='S01'?'Düz uçuşta güç kaybı':'Seçilen noktaya göre genel değerlendirme');
 $('profile-goal').textContent=profile?.goal??(s.lesson==='S01'?'Kontrol, otorotatif alçalış ve saha seçimini birlikte değerlendir.':'Hazır örneklerin koşulları bu noktaya otomatik aktarılmaz.');
 $('lesson-panel').hidden=!state.lesson;$('fields-camera').hidden=session.config.mode==='manual';
 if(state.lesson){const l=state.lesson;
  $('lesson-phases').innerHTML=l.phases.map((p,i)=>`<li class="${p.at===l.phases.findLast(x=>x.at<=state.time)?.at?'current':p.at<state.time?'passed':''}" ${p.at===l.phases.findLast(x=>x.at<=state.time)?.at?'aria-current="step"':''}><span>${clock(p.at)}</span>${esc(p.label)}</li>`).join('');
  $('lesson-state').innerHTML=[['Motor',session.config.powerLossMode==='partial'?'Kısmi güç kaybı · deneysel':l.engine],['Rotor',l.rotor],['Mürettebat',l.crew],['Saha',l.field]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
 }

 $('clock').textContent=clock(state.time);$('duration').textContent=' / '+clock(s.duration);$('duration').title='Mevcut kararlara göre hesaplanan bitiş; karar değişirse yeniden hesaplanır.';$('seek').max=s.duration;$('seek').value=state.time;$('phase').textContent=state.stage.toLocaleUpperCase('tr-TR');
 $('play').textContent=state.playing?'Ⅱ Duraklat':state.time>=s.duration?'■ Tamamlandı':state.time===0?'▶ Başlat':'▶ Devam';$('play').disabled=Boolean(state.pending)||state.time>=s.duration;
 $('rate').value=session.rate;
 const signature=JSON.stringify([s.id,state.events,session.config,state.power.physicalState.contact?.time]);
 if(signature!==lastSignature){
  const a=state.aircraft,c=session.config;
  $('aircraft-summary').textContent=`Gros ağırlık: ${c.grossWeightLb===null?'belirtilmedi':c.grossWeightLb+' lb / '+a.massKg.toFixed(1)+' kg'} · Başlangıç rotor devri: ${c.initialRotorRpm===null?'belirtilmedi':c.initialRotorRpm+' RPM'} · Başlangıç motor devri: ${c.initialEngineRpm==null?'belirtilmedi':c.initialEngineRpm+' RPM'}`;
  $('aircraft-status').textContent=`${a.missing.length} eksik girdi · ${a.warnings.length} karşılaştırma notu · Uygulanabilirlik doğrulanmadı. Deneysel hesap etkin; ağırlık ve başlangıç devirleri harekete katılır.`;
  $('aircraft-assessment').innerHTML=[['Kaynakla karşılaştırma',a.warnings.length?a.warnings:['Girilen değerlerde bu sınırlı karşılaştırmanın işaretlediği uyuşmazlık yok. Bu bir uygunluk onayı değildir.']],['Eksik girdiler',a.missing.length?a.missing:['Giriş alanları dolu; kaynak uygulanabilirliği hâlâ doğrulanmadı.']],['Sayısal model için kalan işler',a.blockers]].map(([title,items])=>`<h3>${esc(title)}</h3><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`).join('')+(c.manualRevision?`<p>Kitap/revizyon beyanı: ${esc(c.manualRevision)}</p>`:'');
  $('chart-config-note').hidden=c.pitotLocation!=='nose';$('chart-config-note').textContent='Burun pitotu seçili; diyagram girişi çatı KIAS ölçeğindedir.';
  lastSignature=signature;try{programPicker?.update(session.config);}catch(e){console.warn(e);}$('scenario-title').textContent=s.name;$('scenario-subtitle').textContent=s.subtitle;$('zone').textContent=s.zoneLabel;$('zone').className='pill '+s.zone;
  $('height-value').textContent=s.height;$('ias-value').textContent=s.ias;
  const {x,y}=startToPoint(s.height,s.ias);for(const id of ['point','point-halo']){$(id).setAttribute('cx',x);$(id).setAttribute('cy',y);}
  $('selection-status').textContent=`Seçili başlangıç: ${s.height} ft / ${s.ias} KIAS. Rüzgâr yer süratini değiştirir. Yeni nokta seçimi akışı başa alır.`;
  const ev=state.current;$('current-event').innerHTML=`<span class="event-type">${clock(ev.at)} / ${esc(ev.kind.toLocaleUpperCase('tr-TR'))}</span><h3>${esc(ev.title)}</h3><p>${state.power.physicalState.contact?'İlk temas '+state.power.physicalState.contact.time.toFixed(2)+' s. ':''}${esc(cleanEventText(ev.text))}</p><div>${sourceButtons(ev.source)}</div>`;
  $('history').innerHTML=state.events.slice().reverse().map(e=>`<div class="history-item"><time>${clock(e.at)} · ${esc(e.kind)}</time><strong>${esc(e.title)}</strong></div>`).join('');$('event-count').textContent=state.events.length;
 }
 document.querySelectorAll('[data-jump]').forEach(b=>{b.disabled=!s.decisions.find(d=>d.id===(Number(b.dataset.jump)===8?'priority':'landing'));});
 const d=(state.pending&&s.decisions.find(x=>x.id===state.pending))||s.decisions.find(d=>Math.abs(d.at-state.time)<.001); /* v0.33.1: an open question (e.g. a field picked in flight) is always the one shown */
 const decisionSignature=JSON.stringify([d?.id,d?.options,session.config.mode,state.answers,state.pending]);
 if(decisionSignature!==lastDecision){lastDecision=decisionSignature;
  $('decision').hidden=!d||session.config.mode!=='guided';
  if(d&&session.config.mode==='guided'){$('decision').innerHTML=`<span class="eyebrow">${state.pending?'KARAR NOKTASI / AKIŞ DURAKLATILDI':'KARARI YENİDEN DEĞERLENDİR'}</span><h3>${esc(d.title)}</h3>${d.options.map(o=>`<button class="option ${state.answers.some(a=>a.id===d.id&&a.option===o.id)?'selected':''}" data-choice="${o.id}" data-decision="${d.id}">${esc(o.label)}</button>`).join('')}`;}
 }
 if(fullscreen.active&&state.pending&&lastFocusedDecision!==state.pending){$('decision').querySelector('[data-choice]')?.focus({preventScroll:true});}lastFocusedDecision=state.pending;
 $('playback-note').textContent=state.power.physicalState.contact?(session.time>=s.duration?'Yerleşme tamamlandı; süre durdu. Kararları yeniden denemek için geri sarabilirsin.':'Temas sonrası kayma / yerleşme sürüyor.'):state.pending?'Seçimini yapmadan bu kararın ilerisine geçilemez.':session.config.mode==='watch'?'Hazır akış: pilot, anlık enerji ve uçuş durumuna göre kumandaları yönetir ve uygun iniş sahasını seçer.':'Geri sarıp karar anına dönerek seçimini değiştirebilirsin. Uçuş hesabı gerçek saniyelerle ilerler; olay zamanları anlatım çizelgesidir.';
}
$('decision').onclick=e=>{const b=e.target.closest('[data-choice]');if(b)try{session.choose(b.dataset.decision,b.dataset.choice);autoResume=false;render();save();const play=$('play');play.classList.remove('nudge');void play.offsetWidth;play.classList.add('nudge');}catch(e){error(e);}}; // v0.33: choose, then the transport Devam continues // v0.32.2: choose → preview → Devam
$('play').onclick=()=>{autoResume=false;if(!session.playing&&session.config.mode==='manual'){const recorded=manualRun(session.config.manualRunId).inputAt(session.time);if(recorded)manualInput.state={...recorded};else manualInput.sync(rawFlightState(Math.min(session.time,session.scenario.duration),session.scenario,session.config,[]));}session.playing?session.pause():session.play();render();save();};
$('seek').oninput=e=>{session.pause();const v=Number(e.target.value),m=Number(e.target.max);session.seek(v>=m-.011?session.scenario.duration:v);render();save();}; // v0.33: the 0.01 s slider step could stop just short of the end
function seek(t){session.pause();session.seek(t);render();save();}
$('back').onclick=()=>seek(session.time-5);$('forward').onclick=()=>seek(session.time+5);$('reset').onclick=()=>reset();
document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const d=session.scenario.decisions.find(d=>d.id===(Number(b.dataset.jump)===8?'priority':'landing'));if(d)seek(d.at);});
$('rate').onchange=e=>{session.setRate(Number(e.target.value));save();};
$('export').onclick=()=>saveFile('ab205-oturum-v1.json',JSON.stringify(session.serialize(),null,2));
$('import-button').onclick=()=>$('import').click();
$('import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>MAX_SESSION_BYTES)throw Error('Kayıt dosyası fazla büyük.');const restored=Session.restore(JSON.parse(await file.text()));session=restored;lastSignature='';lastDecision='';fillForm();render();save();$('error').textContent='';}catch(e){error(e);}finally{$('import').value='';}};
const manualInput=new ManualInput();let manualMounted=false;
// Instructor cues in manual flight (TR Uçuş Hareketleri otorotasyon sırası); advisory text only.
function manualCue(p){if(!p||p.contact||p.time<4)return '';const c=p.controls??{},h=p.heightAglFt,ias=p.iasKt,rpm=p.rotorRpm,rod=p.descentFpm;
 if(p.time<9&&(c.collective??1)>.8)return 'KOLLEKTİFİ İNDİR · sağ pedal ile baş istikametini tut';
 if(rpm<294)return 'DEVİR DÜŞÜK · kollektifi azalt';if(rpm>339)return 'DEVİR YÜKSEK · kollektifle yükle';
 if(h<6)return 'TEMAS · kalan kollektifi kullan, saykılıkla ufkiyet; rulede kollektifi bastırma';
 if(h<22&&rod>350)return 'İLK KOLLEKTİF (≈15 ft) · ileri saykılıkla ufkiyet';
 if(h<135&&h>60&&ias>35&&!p.maneuver?.flaring)return 'FLEYIR (≈100 ft) · geri saykılık, sürekli yavaşla';
 if(h>150&&ias<50)return 'SÜRAT KAZAN · saykılık ileri (55–80 KIAS)';if(ias>90)return 'SÜRAT FAZLA · saykılık geri';
 return h>150?'SABİT SÜZÜLÜŞ · devir yeşilde, 100 ft öncesi kur':'';}
function manualUi(){const on=session.config.mode==='manual';document.body.classList.toggle('mode-manual',on);document.body.classList.toggle('mode-watch',session.config.mode==='watch');{let cue=$('manual-cue');if(!cue){cue=document.createElement('div');cue.id='manual-cue';cue.className='manual-cue';cue.setAttribute('role','status');$('scene-host').appendChild(cue);}const text=on&&!isManualProgram(session.config)?manualCue(rawFlightState(Math.min(session.time,session.scenario.duration),session.scenario,session.config,[])):'';cue.hidden=!text;cue.textContent=text;}$('manual-panel').hidden=!on;manualInput.active=on;if(on&&!manualMounted){manualInput.mount($('manual-controls'),()=>{manualInput.dirty=true;});manualMounted=true;}
 if(on){const done=session.scenario.endReason==='contact';$('mi-status').textContent=(manualInput.gamepad?'Oyun kumandası bağlı · ':'')+(isManualProgram(session.config)?(session.time<4?'Elle uçuş · görev okunuyor; kumandalar 4. saniyeden sonra etkili':'Elle uçuş · kollektif güç / varyo, saykılık sürat ve yatış, pedal top'):session.time<4?'Motor arızası 4. saniyede · kumandalar arızadan sonra etkili':done&&session.time>=session.scenario.duration?'Uçuş tamamlandı · geri sarıp oynatırsan kayıt izlenir; kumandayı oynatırsan o andan yeniden uçarsın':done?'Kayıt izleniyor':'Kayıt alınıyor');}}
let last=performance.now();function frame(now){const delta=(now-last)/1000;last=now;if(session.config.mode==='manual'){const before=JSON.stringify(manualInput.state);const inp=manualInput.update(delta);const changed=manualInput.dirty||JSON.stringify(inp)!==before;manualInput.dirty=false;
  const run=manualRun(session.config.manualRunId),finished=session.scenario.endReason==='contact';
  if(session.playing&&session.time>=3.98&&(!finished||changed))run.record(session.time,inp);
  manualInput.view?.();}
 if(session.playing){session.tick(Math.min(delta,.25));if(!session.playing&&session.pending)autoResume=true;render();if(!session.playing||now-lastSave>1000){save();lastSave=now;}}try{sceneView.draw();}catch(e){console.error('3B çizim hatası',e);}requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{if(document.hidden){session.pause();save();render();}});window.addEventListener('pagehide',save);
fillForm();render();if(restoreMessage)$('save-status').textContent=restoreMessage;else save();requestAnimationFrame(frame);

$('powered-reference').onclick=()=>{const form=$('aircraft-form');form.elements.namedItem('initialRotorRpm').value=POWERED_FLIGHT_REFERENCE.rotorRpm;form.elements.namedItem('initialEngineRpm').value=POWERED_FLIGHT_REFERENCE.engineRpm;form.oninput();};

function renderCurve(){
 const rpm=Number($('curve-rpm').value),metric=$('curve-metric').value,points=CURVES[rpm];
 $('curve-rows').innerHTML=points.map(p=>`<tr><td>${p.kias}</td><td>≈ ${p.descentFpm}</td><td>≈ ${p.glideRatio.toFixed(1)}:1</td></tr>`).join('');
 const coords=points.map(p=>chartPoint(p.kias,p[metric],metric));
 $('curve-marks').innerHTML=`<polyline points="${coords.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#187253" stroke-width="3"/>`+coords.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#187253"/>`).join('');
 const input=$('curve-speed'),result=readCurve(input.value===''?null:Number(input.value),{rotorRpm:rpm});
 $('curve-selected').style.display=result?'':'none';
 $('curve-result').textContent=result?`≈ ${result.descentFpm} ft/dk · ≈ ${result.glideRatio.toFixed(1)}:1 süzülüş · ${rpm} rotor RPM · kaynakla karşılaştırılmış yaklaşık okuma`:`Okuma kapsamı dışında. ${rpm} RPM için ${points[0].kias}–80 arasında tam sayı çatı KIAS gir. Değer otomatik değiştirilmedi.`;
 if(result){const [x,y]=chartPoint(result.kias,result[metric],metric);$('curve-selected').setAttribute('cx',x);$('curve-selected').setAttribute('cy',y);}
}
for(const id of ['curve-speed','curve-rpm','curve-metric'])$(id).oninput=renderCurve;
renderCurve();
/* last flight drawn on the start map: ground track, failure point, chosen field and touchdown */
function flightTrack(){const sc=session.scenario,cfg=session.config,ch=session.choices(),ct=session.evidence().summary?.contact,end=Math.min(sc.duration,ct?.time??sc.duration),pts=[];let site=null,siteLabel='P';
 for(let t=0;t<end;t=Math.round((t+.5)*100)/100){const p=rawFlightState(t,sc,cfg,ch);pts.push([p.position[0],p.position[2]]);if(p.pilotSite)site=p.pilotSite;}
 const last=rawFlightState(end,sc,cfg,ch);pts.push([last.position[0],last.position[2]]);if(last.pilotSite)site=last.pilotSite;
 if(cfg.mode!=='watch'){const a=currentLanding(ch),tg=a&&last.landingTargets?.find(t=>t.id===a.option);site=tg??null;siteLabel=tg?.label??'P';}
 if(cfg.mode==='manual')site=null;
 const fail=rawFlightState(Math.min(4,end),sc,cfg,ch),td=ct?.point?[ct.point[0],ct.point[2]]:pts.at(-1),miss=site?Math.hypot(td[0]-site.x,td[1]-site.z):null,v=ct?.descentMps;
 const good=v!=null&&v<=3&&!ct.obstacle;
 return {area:cfg.flightArea,points:pts,failure:[fail.position[0],fail.position[2]],site:site?[site.x,site.z]:null,siteLabel,touchdown:td,good,
  summary:[v!=null?`temas ${v.toFixed(1)} m/s`:null,miss!=null?`${siteLabel} sahasına ${Math.round(miss)} m`:null,`${Math.round(Math.hypot(td[0]-fail.position[0],td[1]-fail.position[2]))} m süzülme`].filter(Boolean).join(' · ')};}
function renderReview(){
 const rows=decisionReview(session),signature=JSON.stringify([rows,session.time>=session.scenario.duration,session.config,compareId,bookRevision]);if(signature===reviewSignature)return;reviewSignature=signature;
  {const host=$('debrief');if(host&&isProgramFlight(session.config)){if(session.time>=session.scenario.duration){try{renderProgramDebrief(host,session);}catch(err){host.hidden=true;console.error(err);}}else host.hidden=true;}else if(host){if(session.time>=session.scenario.duration&&session.scenario.endReason==='contact'){try{renderDebrief(host,session,{...(()=>{try{const e=compareId&&book?.entries?.find(x=>x.id===compareId);return e?{compare:Session.restore(e.session),compareName:e.name}:{};}catch{return {};}})(),onSeek:t=>{session.seek(t);session.pause();render();save();$('scene-host').scrollIntoView({behavior:'smooth',block:'center'});},onExport:html=>saveFile('ab205-ucus-degerlendirmesi.html',html,'text/html')});}catch(err){host.hidden=true;console.error(err);}}else host.hidden=true;}}
 try{startMap?.setTrack(session.time>=session.scenario.duration&&session.scenario.endReason==='contact'?flightTrack():null);}catch(err){console.warn(err);}
 $('compare-replay').disabled=bookBlocked||(session.config.mode==='watch'?session.time<4:!session.snapshot().answers.length);
 $('review-progress').textContent=session.time>=session.scenario.duration?'Uçuş tamamlandı.':'Uçuş sürüyor · şu ana kadarki kararlar gösterilir.';
 $('alternative-results').innerHTML='';$('alternative-button').hidden=session.config.mode!=='guided'||session.time<session.scenario.duration;
 $('flight-report').hidden=session.time<session.scenario.duration;$('flight-report').innerHTML=session.time>=session.scenario.duration?'<table class="reference-table"><caption>Uçuş özeti</caption><tbody>'+resultRows(session).map(r=>`<tr><th scope="row">${esc(r.label)}</th><td${r.color?` style="color:${esc(r.color)};font-weight:700"`:""}>${esc(r.value)}${r.note?`<small class="severity-note">${esc(r.note)}</small>`:""}</td></tr>`).join('')+'</tbody></table>':'';
 $('review-choices').innerHTML=rows.filter(r=>!r.pending).map(r=>`<article class="review-choice"><span class="eyebrow">${clock(r.at)} · ${r.risk===null?'BEKLİYOR':r.risk?'TARTIŞILACAK RİSK':'KARAR GEREKÇESİ'}</span><h3>${esc(r.label)}</h3><p>${esc(r.text)}</p><button data-review-at="${r.at}">Karar anına dön</button> ${sourceButtons(r.source)}</article>`).join('');
 const entry=book.entries.find(e=>e.id===compareId);$('comparison').hidden=!entry;
 if(entry){$('comparison-title').textContent='Karşılaştırılan kayıt: '+entry.name;$('comparison-rows').innerHTML=comparisonRows(session,Session.restore(entry.session)).map(r=>`<tr class="${r.different?'comparison-different':''}"><th>${esc(r.label)}${r.different?' · farklı':''}</th><td>${esc(r.current)}</td><td>${esc(r.saved)}</td></tr>`).join('');}
}
function renderBook(){
 $('book-save').disabled=bookBlocked;$('book-export').disabled=bookBlocked;$('book-undo').hidden=!undoBook;
 $('book-list').innerHTML=book.entries.length?book.entries.map(e=>{const s=Session.restore(e.session);return `<article class="book-entry"><div><strong>${esc(e.name)}</strong><small>${s.scenario.height} ft / ${s.scenario.ias} kt · ${clock(s.time)} · ${esc(new Date(e.savedAt).toLocaleString('tr-TR'))}</small></div><div><button data-book-load="${esc(e.id)}">Aç</button><button data-book-compare="${esc(e.id)}">Karşılaştır</button><button data-book-delete="${esc(e.id)}">Sil</button></div></article>`;}).join(''):'<p class="micro">Henüz adlandırılmış kayıt yok.</p>';
}
function writeBook(next,message,keepUndo=false){
 try{const valid=validateBook(next);localStorage.setItem(BOOK_KEY,JSON.stringify(valid));undoBook=keepUndo?book:null;book=valid;bookRevision++;bookBlocked=false;$('book-status').textContent=message;renderBook();renderReview();return true;}catch(e){$('book-status').textContent='Kaydedilemedi: '+e.message;return false;}
}
// Files leave through the viewer's downloads capability when the page runs as a claude.ai artifact; a plain
// browser download otherwise (local/offline use).
let downloadsCap=null;try{window.claude?.use?.('downloads').then(d=>{downloadsCap=d;}).catch(()=>{});}catch{}
async function saveFile(name,text,type='application/json'){if(downloadsCap){try{await downloadsCap.save({filename:name,data:text});return;}catch(e){if(e?.code==='declined')return;if(!['unavailable','not_granted','capability_disabled','capability_removed'].includes(e?.code)){error(new Error('Dosya kaydedilemedi: '+(e?.message??e?.code)));return;}}}
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function downloadJson(value,name){saveFile(name,JSON.stringify(value,null,2));}
$('book-form').onsubmit=e=>{e.preventDefault();try{const next=addRecord(book,$('book-name').value,session,crypto.randomUUID());if(writeBook(next,'Senaryo bu tarayıcıda kaydedildi.'))$('book-name').value='';}catch(e){$('book-status').textContent=e.message;}};
$('book-list').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.bookLoad??b.dataset.bookCompare??b.dataset.bookDelete,entry=book.entries.find(e=>e.id===id);if(!entry)return;
 if(b.hasAttribute('data-book-load')){session=Session.restore(entry.session);lastSignature='';lastDecision='';fillForm();render();save();$('book-status').textContent=entry.name+' açıldı · duraklatıldı.';$('scene-panel').scrollIntoView({behavior:'smooth',block:'start'});}
 else if(b.hasAttribute('data-book-compare')){compareId=id;renderReview();$('review-panel').scrollIntoView({behavior:'smooth',block:'start'});}
 else writeBook(removeRecord(book,id),'Kayıt silindi. Geri alabilirsin.',true);
};
$('review-choices').onclick=e=>{const b=e.target.closest('[data-review-at]');if(b){seek(Number(b.dataset.reviewAt));$('transport-panel').scrollIntoView({behavior:'smooth',block:'center'});}};
$('clear-comparison').onclick=()=>{compareId=null;renderReview();};
$('book-export').onclick=()=>downloadJson(book,'ab205-senaryo-kitapligi.json');
$('book-import-button').onclick=()=>$('book-import').click();
$('book-import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('Kitaplık yedeği en fazla 2 MB olabilir.');const next=validateBook(JSON.parse(await file.text()));writeBook(next,'Kitaplık yüklendi. Önceki kitaplığı geri alabilirsin.',true);}catch(e){$('book-status').textContent='Yüklenemedi: '+e.message;}finally{$('book-import').value='';}};
$('book-undo').onclick=()=>{if(undoBook)writeBook(undoBook,'Önceki kitaplık geri yüklendi.');};
renderBook();renderReview();
if(bookBlocked)$('book-status').textContent='Mevcut kitaplık okunamadı; üzerine yazılmadı. Geçerli yedek yükleyebilirsin.';

$('compare-replay').onclick=()=>{try{
 const id=crypto.randomUUID(),name=session.scenario.name+' · önceki deneme';
 const next=addRecord(book,name,session,id);if(!writeBook(next,'Karşılaştırma denemesi kaydedildi.'))return;
 compareId=id;reset({...session.config,mode:'guided'});renderReview();$('scene-panel').scrollIntoView({behavior:'smooth',block:'start'});
}catch(e){$('book-status').textContent=e.message;error(e);}};

$('alternative-button').onclick=()=>{try{const rows=alternativeResults(session);const signed=n=>n===null?'—':(n>0?'+':'')+n.toFixed(2);$('alternative-results').innerHTML='<p class="micro">Her satır aynı başlangıç ve hava koşullarında bir seçimi değiştirir. Sonraki mevcut seçimler korunur; karar zamanları yeniden hesaplanır. Yeni karar oluşursa durum yönetimi seçeneği kullanılır. Fark: alternatif − mevcut. Sonuçlar model tahminidir.</p><div class="table-scroll"><table class="reference-table"><caption>Alternatif karar sonuçları</caption><thead><tr><th>Değiştirilen seçim</th><th>Düşey temas (m/s)</th><th>Yer sürati (kt)</th><th>Sertlik</th><th>Fark: düşey / yatay</th><th>Hasar tahmini</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${esc(r.label)}${r.fallback.length?' · sonraki yeni kararlar otomatik':''}</td><td>${r.contact?r.contact.descentMps.toFixed(2):'—'}</td><td>${r.contact?(r.contact.groundSpeedMps*3600/1852).toFixed(1):'—'}</td><td>${r.severity===null?'—':'%'+r.severity}</td><td>${signed(r.deltaDescentMps)} m/s / ${signed(r.deltaGroundKt)} kt</td><td>${esc(r.damage)}</td></tr>`).join('')+'</tbody></table></div>';}catch(e){$('alternative-results').textContent='Karşılaştırma tamamlanamadı: '+e.message;}};

// In-app image viewer: opening the reference images in a new tab fails inside the hosted page.
{const open=(src,alt)=>{const box=document.createElement('div');box.className='lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',alt||'Görsel');box.innerHTML='<button type="button" class="lightbox-close" aria-label="Kapat">✕ Kapat</button><img alt="">';box.querySelector('img').src=src;box.querySelector('img').alt=alt||'';const close=()=>{box.remove();document.removeEventListener('keydown',key);};const key=e=>{if(e.key==='Escape')close();};box.addEventListener('click',e=>{if(e.target===box||e.target.closest('.lightbox-close'))close();});document.addEventListener('keydown',key);document.body.appendChild(box);box.querySelector('.lightbox-close').focus();};
 const openChart=()=>{const box=document.createElement('div');box.className='lightbox hv-lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Yükseklik–hız diyagramı · büyütülmüş seçim');
  box.innerHTML=`<div class="hv-lb-bar"><span class="hv-lb-title">Yükseklik–hız diyagramı · tıkla ve seç</span><span class="hv-lb-read" aria-live="polite"></span><span class="hv-lb-tools"><button type="button" data-z="-1" aria-label="Uzaklaştır">−</button><button type="button" data-z="0" aria-label="Sığdır">Sığdır</button><button type="button" data-z="1" aria-label="Yakınlaştır">+</button><button type="button" class="hv-lb-close" aria-label="Kapat">✕ Kapat</button></span></div><div class="hv-lb-stage"><div class="hv-lb-wrap" tabindex="0" role="group" aria-label="Diyagramın çizim alanına tıklayın; ok tuşları 1 ft / 1 kt."><img src="hv-reference.png" alt="Yükseklik–hız diyagramı" width="712" height="820" draggable="false"><svg viewBox="0 0 712 820" aria-hidden="true"><line class="hv-cross" x1="0" x2="712"/><line class="hv-cross" y1="0" y2="820"/><circle class="hv-ghost" r="7"/><circle class="hv-halo" r="17"/><circle class="hv-dot" r="6"/></svg></div></div>`;
  const wrap=box.querySelector('.hv-lb-wrap'),stage=box.querySelector('.hv-lb-stage'),svg=box.querySelector('svg'),[hx,vy]=svg.querySelectorAll('.hv-cross'),ghost=svg.querySelector('.hv-ghost'),read=box.querySelector('.hv-lb-read');let zoom=0;
  const fit=()=>{const r=stage.getBoundingClientRect(),base=Math.max(200,Math.min(r.width-8,(r.height-8)*712/820));wrap.style.width=Math.round(base*Math.pow(1.35,zoom))+'px';};
  const mark=()=>{const c=session.config,{x,y}=startToPoint(c.startHeightFt,c.startIasKt);for(const el of svg.querySelectorAll('.hv-halo,.hv-dot')){el.setAttribute('cx',x);el.setAttribute('cy',y);}read.textContent=`Seçili: ${c.startHeightFt} ft · ${c.startIasKt} kt`;};
  const at=e=>{const r=wrap.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*PLOT.width,y:(e.clientY-r.top)/r.height*PLOT.height};};
  wrap.addEventListener('pointermove',e=>{const q=at(e),pt=pointToStart(q.x,q.y);const show=!!pt;for(const el of [hx,vy,ghost])el.style.display=show?'':'none';if(!pt){read.textContent='Çizim alanı dışında';return;}const g=startToPoint(pt.startHeightFt,pt.startIasKt);hx.setAttribute('y1',g.y);hx.setAttribute('y2',g.y);vy.setAttribute('x1',g.x);vy.setAttribute('x2',g.x);ghost.setAttribute('cx',g.x);ghost.setAttribute('cy',g.y);read.textContent=`${pt.startHeightFt} ft · ${pt.startIasKt} kt · seçmek için tıkla`;});
  wrap.addEventListener('pointerleave',()=>{for(const el of [hx,vy,ghost])el.style.display='none';mark();});
  wrap.addEventListener('click',e=>{const q=at(e),pt=pointToStart(q.x,q.y);if(!pt){read.textContent='Çizim alanı dışında · seçim yapılmadı';return;}selectStart(pt);mark();read.textContent=`Seçildi: ${pt.startHeightFt} ft · ${pt.startIasKt} kt`;});
  wrap.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const c=session.config;selectStart({startHeightFt:Math.max(0,Math.min(600,c.startHeightFt+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0))),startIasKt:Math.max(0,Math.min(80,c.startIasKt+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)))});mark();});
  for(const el of [hx,vy,ghost])el.style.display='none';
  const close=()=>{box.remove();removeEventListener('resize',fit);document.removeEventListener('keydown',key);};const key=e=>{if(e.key==='Escape')close();};
  box.addEventListener('click',e=>{const z=e.target.closest('[data-z]');if(z){zoom=z.dataset.z==='0'?0:Math.max(-2,Math.min(4,zoom+Number(z.dataset.z)));fit();return;}if(e.target===box||e.target===stage||e.target.closest('.hv-lb-close'))close();});
  document.addEventListener('keydown',key);addEventListener('resize',fit);document.body.appendChild(box);fit();mark();wrap.focus({preventScroll:true});};
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;const href=a.getAttribute('href');if(!/\.(png|jpe?g|webp)$/i.test(href))return;e.preventDefault();if(/hv-reference\.png$/i.test(href)&&a.closest('.reference-foot')){openChart();return;}open(a.href,a.textContent.replace(/[↗]/g,'').trim());},true);}

{const d=document.getElementById('status-note');if(d)d.addEventListener('toggle',()=>{const pre=document.getElementById('status-note-text');if(!d.open||pre.dataset.loaded)return;fetch('project-status.md').then(r=>r.ok?r.text():Promise.reject(r.status)).then(t=>{pre.textContent=t;pre.dataset.loaded='1';}).catch(()=>{pre.textContent='Not yüklenemedi.';});});}

try{if('serviceWorker' in navigator&&(location.protocol==='https:'||/^(localhost|127\.0\.0\.1)$/.test(location.hostname))&&window.top===window)navigator.serviceWorker.register('sw.js').catch(()=>{});}catch{}
try{watchSanitize(document.getElementById('lab'),document.getElementById('roadmap'));}catch(e){console.warn(e);}
try{foldNotes();}catch(e){console.warn(e);}
// v0.32.2: pilot experience only affects hazır akış / rehberli flights; hide it for manual flight.
function syncPilotVis(){const l=document.querySelector('#config-form select[name=pilot]')?.closest('label');if(l)l.hidden=$('mode').value==='manual';}
$('mode').addEventListener('change',syncPilotVis);syncPilotVis();
// v0.33: start-position map under the H-V diagram
var programPicker=null;try{programPicker=new ProgramPicker($('program-picker'),{onSelect:(patch,title)=>{try{const area=patch.flightArea&&patch.flightArea!==session.config.flightArea;reset({...session.config,...(area?{startX:0,startZ:0}:{}),...patch});flashNote?.('Senaryo seçildi: '+title);}catch(e){error(e);}}});programPicker.update(session.config);}catch(e){console.warn(e);}
var startMap=null;try{startMap=new StartMap($('start-map'),{onChange:patch=>{try{reset({...session.config,...patch});flashNote?.('Başlangıç konumu güncellendi.');}catch(e){error(e);}}});startMap.update(session.config);}catch(e){console.warn(e);}
