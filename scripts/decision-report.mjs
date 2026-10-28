import fs from 'node:fs';
import {Session} from '../engine.js';
import {DEFAULT_CONFIG,APPROVED_REFERENCE_CHOICES} from '../catalog.js';
import {flightState} from '../flight-dynamics.js';
import {contactAssessment} from '../contact-assessment.js';

const config={...DEFAULT_CONFIG,scenario:'safe',mode:'guided',customStart:true,startHeightFt:400,startIasKt:60,windKt:0,windFromDeg:0,temperatureC:15,pressureAltitudeFt:0,grossWeightLb:null,initialRotorRpm:324,initialEngineRpm:6600};
const policies=[
 ['Referans kararlar',{}],['Fleyırı ertele',{flare:'late'}],['Fleyır uygulama',{flare:'omit'}],
 ['Erken kollektif',{cushion:'early'}],['Son ana ertelenmiş kollektif',{cushion:'late',finalPull:'now'}],
 ['Son kollektifi uygulama',{finalPull:'hold'}],['Mevcut saykılığı tut',{cyclic:'hold'}]
];
const rows=[];
for(const [name,policy]of policies){
 const s=new Session(config),decisions=[];
 for(let i=0;i<40;i++){
  s.seek(600);const d=s.pending;if(!d)break;
  const p=flightState(s.time,s.baseScenario,s.config,s.answers);
  const option=[policy[d.id],APPROVED_REFERENCE_CHOICES[d.id],d.options[0]?.id].find(x=>d.options.some(o=>o.id===x));
  decisions.push({id:d.id,option,requested:policy[d.id]??null,at:s.time,heightFt:p.heightAglFt,iasKt:p.iasKt,rotorRpm:p.rotorRpm});
  s.choose(d.id,option);
 }
 if(s.pending||s.time!==s.scenario.duration)throw Error(name+': scenario not completed');
 const end=flightState(s.time,s.baseScenario,s.config,s.answers),contact=end.contact;
 const impact=contact?flightState(contact.time,s.baseScenario,s.config,s.answers):end;
 // Use impact attitude for damage assessment, retaining post-contact secondary contacts.
 const assessment=contactAssessment({...impact,contact,ground:end.ground});
 const track=[];
 for(let t=0;t<=Math.min(contact?.time??s.time,s.time);t+=.25){const p=flightState(t,s.baseScenario,s.config,s.answers);track.push({t,iasKt:p.iasKt,heightFt:p.heightAglFt,rotorRpm:p.rotorRpm,descentFpm:p.descentFpm,collective:p.controls.collective,flare:!!p.controls.flare,pitchDeg:p.pitch*180/Math.PI});}
 const requested=Object.entries(policy).map(([id,option])=>({id,option,applied:decisions.some(d=>d.id===id&&d.option===option)}));
 const row={name,policy,requested,decisions,duration:s.time,contactTime:contact?.time??null,descentFpm:contact?contact.descentMps/.3048*60:null,groundSpeedKt:contact?contact.groundSpeedMps*3600/1852:null,rotorRpm:contact?.rotorRpm??null,severityPercent:assessment.severity?.percent??null,damage:assessment.damage,firstContact:contact?.part??null,parts:assessment.components?.parts??[],track};
 if(contact&&![row.descentFpm,row.groundSpeedKt,row.rotorRpm,row.severityPercent].every(Number.isFinite))throw Error('Non-finite impact in '+name);
 rows.push(row);console.log('Comparison: '+name);
}
const base=rows[0];for(const r of rows)r.deltaFromReference={descentFpm:r.descentFpm===null?null:r.descentFpm-base.descentFpm,groundSpeedKt:r.groundSpeedKt===null?null:r.groundSpeedKt-base.groundSpeedKt,rotorRpm:r.rotorRpm===null?null:r.rotorRpm-base.rotorRpm};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/decisions.json',JSON.stringify({schemaVersion:1,commit:process.env.GITHUB_SHA??'local',conditions:config,scope:'Simulated outcomes; not flight validation. A requested decision may not arise in a dynamic branch.',rows},null,2));
const columns=['name','descentFpm','groundSpeedKt','rotorRpm','severityPercent','damage','firstContact'];
const cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';
fs.writeFileSync('reports/decisions.csv',[columns,...rows.map(r=>columns.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\n'));
const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number.isFinite(v)?v.toFixed(1):'—';
const html=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AB-205 karar karşılaştırması</title><style>body{font:16px system-ui;max-width:1200px;margin:40px auto;padding:20px;background:#f4f6f5;color:#182c2c}table{border-collapse:collapse;width:100%;background:white}td,th{padding:12px;border-bottom:1px solid #ccd;text-align:left}section{overflow:auto}details{margin:16px 0}small{color:#456}</style><h1>S01 · Karar karşılaştırması</h1><p>400 ft AGL · 60 KIAS · 2800 kg · rüzgâr 0 kt · 15°C · basınç irtifası 0 ft · 324 / 6600 RPM.</p><p>Deneysel model sonuçlarıdır. Temas sertliği bir enerji endeksidir; hasar olasılığı veya gerçek hava aracı limiti değildir. İstenen karar o dalda doğmadıysa aşağıda belirtilir.</p><small>Kod: ${esc(process.env.GITHUB_SHA??'yerel')}</small><p><a href="decisions.csv">CSV indir</a> · <a href="decisions.json">Ayrıntılı JSON indir</a></p><section><table><thead><tr><th>Karar</th><th>Temas ft/dk</th><th>Yer sürati kt</th><th>Rotor RPM</th><th>Sertlik %</th><th>Referansa göre ft/dk farkı</th><th>Benzetilmiş hasar</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${n(r.descentFpm)}</td><td>${n(r.groundSpeedKt)}</td><td>${n(r.rotorRpm)}</td><td>${n(r.severityPercent)}</td><td>${n(r.deltaFromReference.descentFpm)}</td><td>${esc(r.damage)}</td></tr>`).join('')}</tbody></table></section>${rows.map(r=>`<details><summary>${esc(r.name)} · karar ve parça ayrıntıları</summary><p>${r.requested.filter(x=>!x.applied).map(x=>esc(x.id+':'+x.option)+' bu akışta uygulanmadı.').join(' ')||'İstenen kararlar uygulandı.'}</p><pre>${esc(JSON.stringify({decisions:r.decisions,parts:r.parts},null,2))}</pre></details>`).join('')}</html>`;
fs.writeFileSync('reports/index.html',html);
