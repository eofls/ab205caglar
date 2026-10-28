import {outcomeExplanation,movementSummary} from './outcome-report.js';
import {decisionEffect,sameConditions} from './decision-comparison.js';
import {CREW} from './catalog.js';
import {CLOUD_LABELS,LIGHT_LABELS} from './visual-weather.js';
import {Session} from './engine.js';
export const BOOK_KEY='ab205-scenario-book-v1';
export function validateBook(raw){
 if(!raw||raw.schemaVersion!==1||!Array.isArray(raw.entries)||raw.entries.length>40)throw Error('Geçersiz senaryo kitaplığı (en fazla 40 kayıt).');
 const ids=new Set();return {schemaVersion:1,entries:raw.entries.map(e=>{
  if(!e||typeof e.id!=='string'||e.id.length>80||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||e.name.length>80||typeof e.savedAt!=='string'||!Number.isFinite(Date.parse(e.savedAt)))throw Error('Geçersiz senaryo kaydı.');ids.add(e.id);
  return {id:e.id,name:e.name.trim(),savedAt:e.savedAt,session:Session.restore(e.session).serialize()};
 })};
}
export function addRecord(book,name,session,id,date=new Date().toISOString()){
 const valid=validateBook(book);return validateBook({schemaVersion:1,entries:[{id,name,savedAt:date,session:session.serialize()},...valid.entries]});
}
export function removeRecord(book,id){return validateBook({schemaVersion:1,entries:book.entries.filter(e=>e.id!==id)});}
export function decisionReview(session){
 const state=session.snapshot();if(session.config.mode==='watch'){const seen=new Set();return session.evidence().events.filter(e=>e.kind==='Kumanda'&&e.at<=session.time&&!/Öngörülü/.test(e.title)).map((e,i)=>({id:'adaptive-'+i,at:e.at,title:e.title,label:e.title.replace(/^Uyarlanabilir pilot · /,''),text:e.text,risk:false,source:e.source})).filter(r=>!seen.has(r.label)&&seen.add(r.label));}
 return session.scenario.decisions.map(d=>{
  const answer=state.answers.find(a=>a.id===d.id),option=d.options.find(o=>o.id===answer?.option);
  return {pending:!option,id:d.id,at:d.at,title:d.title,label:option?.label??'Henüz seçilmedi',text:option?.text??'Bu karar henüz mevcut zaman çizelgesinde verilmedi.',risk:option?.risk??null,source:d.source};
 });
}
export function resultRows(s){
 if(s.time<s.scenario.duration)return [{label:'Sonuç',value:'Uçuş sürüyor'}];
 // v0.33: pilotage-focused summary; component damage screening is no longer reported.
 const e=s.evidence(),r=e.summary,c=r.contact,fpm=v=>(v/.3048*60).toFixed(0),kt=v=>(v*3600/1852).toFixed(1);
 const sev=r.impact?.severity,choices=e.choices.map(a=>s.scenario.decisions.find(d=>d.id===a.id)?.options.find(o=>o.id===a.option)?.label??a.option);
 return [{label:'Sonuç',value:c?(sev?.label??'Temas'):'Temas yok',color:sev?.color},
 {label:'Temas · düşey / yer sürati',value:c?`${fpm(c.descentMps)} ft/dk · ${kt(c.groundSpeedMps)} kt`:'—'},
 {label:'Temas anında rotor devri',value:c?c.rotorRpm.toFixed(0)+' RPM':'—'},
 {label:'Rotor devri aralığı',value:`${r.minRotorRpm.toFixed(0)}–${r.maxRotorRpm.toFixed(0)} RPM`},
 {label:'En yüksek alçalış',value:r.maxDescentFpm.toFixed(0)+' ft/dk'},
 {label:'Arızadan temasa süre',value:c?Math.max(0,c.time-4).toFixed(1)+' s':'—'},
 {label:'Bulgular',value:r.hazards.join(' · ')||'—'},
 ...(choices.length?[{label:'Kararlar',value:choices.join(' → ')}]:[])];
}
export function comparisonRows(a,b){
 const describe=s=>{const c=s.config;return [s.scenario.name,`${s.scenario.height} ft / ${s.scenario.ias} kt`,`${c.visibilityKm} km / ${c.windKt} kt · ${c.windFromDeg}°`,`${c.temperatureC} °C / ${c.pressureAltitudeFt} ft`,`${CLOUD_LABELS[c.cloudCover]} / ${LIGHT_LABELS[c.lighting]}`,`${CREW[c.pilot].label} / ${CREW[c.copilot].label}`,c.pedalMode==='auto'?'Açık':'Kapalı'];};
 const av=describe(a),bv=describe(b),row=(label,current,saved)=>({label,current,saved,different:current!==saved});
 const rows=['Başlangıç','Yükseklik / sürat','Görüş / rüzgâr','Sıcaklık / basınç irtifası','Görsel atmosfer','Mürettebat','Otomatik pedal'].map((label,i)=>row(label,av[i],bv[i]));
 rows.push(row('Aynı başlangıç ve koşullar',sameConditions(a,b)?'Evet':'Hayır · sonuç farkı yalnız kararlara bağlanamaz','Karşılaştırma temeli'));
 const ar=decisionReview(a),br=decisionReview(b);for(const id of new Set([...ar,...br].map(d=>d.id))){rows.push(row(id==='approach'?'Uzak hedef yaklaşması':id==='cyclic'?'Saykılık / ufkiyet':id==='finalPull'?'Ertelenmiş son kollektif':id==='priority'?'İlk karar':id==='landing'?'Saha kararı':id==='recovery'?'Koşullu devir kararı':id==='flare'?'Fleyır':id.startsWith('adaptive-')?'Uyarlanabilir pilot':id==='cushion'?'Son kollektif':id==='vrs'?'VRS eğilimi kararı':id==='yaw'?'Pedal / yön kararı':id==='criticalRotor'?'Kritik rotor kararı':'Yüksek devir kararı',ar.find(d=>d.id===id)?.label??'Bu dalda yok',br.find(d=>d.id===id)?.label??'Bu dalda yok'));}
 const ra=resultRows(a),rb=resultRows(b);for(const label of new Set([...ra,...rb].map(r=>r.label)))rows.push(row(label,ra.find(r=>r.label===label)?.value??'Henüz tamamlanmadı',rb.find(r=>r.label===label)?.value??'Henüz tamamlanmadı'));
 rows.push(row('Karar–sonuç açıklaması',decisionEffect(a,b),'Fark yönü: mevcut − kayıtlı'));
 return rows;
}
