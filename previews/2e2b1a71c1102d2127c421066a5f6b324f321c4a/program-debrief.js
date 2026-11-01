// v0.34 review for emergencies and flight manoeuvres flown by the program model: decisions against the procedure,
// what happened, and the landing / standards numbers.
import {programRun} from './program-flight.js';
import {emergencyById,URGENCY_TEXT} from './emergency-catalog.js';
import {maneuverById} from './maneuver-catalog.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderProgramDebrief(host,session){
 const c=session.config,sc=session.scenario,man=c.program==='maneuver',def=man?maneuverById(c.maneuverId):emergencyById(c.emergencyId),run=programRun(c,c.mode==='guided'?session.answers:[]),ct=run.contact;
 const rows=sc.decisions.map(d=>{const a=session.choices().find(x=>x.id===d.id),o=d.options.find(x=>x.id===a?.option),ok=a&&a.option===d.reference,fine=!ok&&o&&o.risk===false,ref=d.options.find(x=>x.id===d.reference);
  return `<tr><td>${esc(d.title)}</td><td>${o?esc(o.label):'—'}${!ok&&a&&ref?`<small class="pd-ref">Usul: ${esc(ref.label)}</small>`:''}</td><td class="${ok?'pd-ok':fine?'pd-mid':'pd-bad'}">${!a?'—':ok?'Usule uygun':fine?'Kabul edilebilir':'Uygun değil'}</td></tr>`;}).join('');
 const issues=run.events.filter(e=>e.kind==='Hata'||e.kind==='Standart dışı'||e.kind==='Kontrol kaybı');
 const kt=v=>(v/(1852/3600)).toFixed(0),soft=ct&&ct.descentMps<=1.5&&!ct.obstacle,lz=run.lz;
 const outcome=man?(issues.length?'Standart dışı noktalar var':'Hareket standartlara uygun tamamlandı'):ct?(ct.obstacle?'Engel teması':soft?'Kontrollü iniş':ct.descentMps<=3?'İniş · sert sayılabilir':'Sert temas'):'İniş yapılmadı · uçuşa devam';
 host.hidden=false;host.innerHTML=`<div class="pd"><div class="pd-head"><span class="eyebrow">${man?'UÇUŞ HAREKETİ':'EMERCENSİ · '+esc(def.ref)}</span><h3>${esc(def.title)}</h3><p class="pd-out ${issues.length||(!man&&ct&&!soft)?'warn':'ok'}">${esc(outcome)}</p></div>
  <div class="pd-kpi">${ct?`<div><b>${ct.descentMps.toFixed(1)}</b><small>m/s temas alçalışı</small></div><div><b>${kt(ct.groundSpeedMps)}</b><small>kt temas yer sürati</small></div>`:''}<div><b>${sc.duration.toFixed(0)}</b><small>s toplam süre</small></div>${!man&&def.urgency?`<div><b>${esc((URGENCY_TEXT[def.urgency]??'').replace('Mümkün olan en kısa zamanda in','Mümkün olan en kısa zamanda').replace('En uygun şekilde en kısa zamanda in','En uygun şekilde'))}</b><small>talimnamedeki aciliyet</small></div>`:''}${lz&&!man?`<div><b>${esc(lz.label??'—')}</b><small>seçilen saha</small></div>`:''}</div>
  ${rows?`<h4>Kararlar</h4><table class="pd-table"><thead><tr><th>Karar</th><th>Seçim</th><th>Değerlendirme</th></tr></thead><tbody>${rows}</tbody></table>`:''}
  ${issues.length?`<h4>Dikkat edilecekler</h4><ul>${issues.map(e=>`<li><b>${esc(e.title)}</b> — ${esc(e.text)}</li>`).join('')}</ul>`:''}
  ${man?`<h4>Standartlar</h4><ul>${def.standards.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:`<h4>Usul</h4><ol>${def.steps.map(s=>s.startsWith('!')?`<li><u>${esc(s.slice(1))}</u></li>`:`<li>${esc(s)}</li>`).join('')}</ol>`}</div>`;
}
