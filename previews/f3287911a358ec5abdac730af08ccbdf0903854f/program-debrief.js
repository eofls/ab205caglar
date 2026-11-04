// v0.34 review for emergencies and flight manoeuvres flown by the program model: decisions against the procedure,
// what happened, and the landing / standards numbers.
import {programRun} from './program-flight.js';
import {emergencyById,URGENCY_TEXT} from './emergency-catalog.js';
import {maneuverById} from './maneuver-catalog.js';
import {componentDamage} from './component-damage.js';
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
  ${rows?`<h4>Kararlar</h4><table class="pd-table"><thead><tr><th>Karar</th><th>Seçim</th><th>Değerlendirme</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="pd-cmp"><h4>Kararların sonuçları</h4><p class="micro">Her satırda yalnızca o karar değiştirilip uçuş baştan hesaplanır; diğer kararlar senin seçtiğin gibi kalır. Böylece aynı arızada / harekette seçenekler arasındaki farkı yan yana görürsün.</p><button type="button" class="pd-cmp-btn">Seçenekleri karşılaştır</button><div class="pd-cmp-out"></div></div>`:''}
  ${issues.length?`<h4>Dikkat edilecekler</h4><ul>${issues.map(e=>`<li><b>${esc(e.title)}</b> — ${esc(e.text)}</li>`).join('')}</ul>`:''}
  ${man?`<h4>Standartlar</h4><ul>${def.standards.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:`<h4>Usul</h4><ol>${def.steps.map(s=>s.startsWith('!')?`<li><u>${esc(s.slice(1))}</u></li>`:`<li>${esc(s)}</li>`).join('')}</ol>`}</div>`;
 const btn=host.querySelector('.pd-cmp-btn'),out=host.querySelector('.pd-cmp-out');if(btn)btn.onclick=()=>{btn.disabled=true;btn.textContent='Hesaplanıyor…';compareDecisions(c,session,sc,out,()=>{btn.hidden=true;});};
}
/* v0.43 karar karşılaştırması: her kararın her seçeneği için uçuş yeniden hesaplanır (diğer kararlar aynı) */
function outcomeOf(run){const ct=run.contact,last=run.samples.at(-1),dm=ct?componentDamage({contact:ct,roll:last?.roll??0,pitch:last?.pitch??0}):null,mx=dm?Math.max(0,...dm.parts.map(q=>q.severity)):0;
 const bad=run.events.filter(e=>['Hata','Standart dışı','Kontrol kaybı','Sonuç','Güçlü çöküş'].includes(e.kind)&&!/İniş tamamlandı/.test(e.title));
 return {dur:run.duration,ct,dmg:Math.round(mx*100),bad,end:run.endReason};}
function compareDecisions(c,session,sc,out,done){const base=session.choices().map(a=>({id:a.id,option:a.option,at:0})),jobs=[];
 for(const d of sc.decisions)for(const o of d.options)jobs.push({d,o});const res=new Map();let i=0;
 const cfg={...c,mode:'watch'};
 const step=()=>{const t0=performance.now();while(i<jobs.length&&performance.now()-t0<120){const {d,o}=jobs[i++];try{const ch=[...base.filter(a=>a.id!==d.id),{id:d.id,option:o.id,at:0}];res.set(d.id+'|'+o.id,outcomeOf(programRun(cfg,ch)));}catch(err){res.set(d.id+'|'+o.id,{err:err.message});}}
  out.innerHTML=`<p class="micro">${i} / ${jobs.length} seçenek hesaplandı…</p>`;if(i<jobs.length){setTimeout(step,0);return;}
  const mine=Object.fromEntries(session.choices().map(a=>[a.id,a.option]));
  out.innerHTML=sc.decisions.map(d=>{const rowsH=d.options.map(o=>{const r=res.get(d.id+'|'+o.id)??{},ref=o.id===d.reference,me=mine[d.id]===o.id,ct=r.ct;
    const tq=ct?`${ct.descentMps.toFixed(1)} m/s · ${(ct.groundSpeedMps*3600/1852).toFixed(0)} kt${ct.obstacle?' · '+(ct.obstacle==='tree'?'ağaç':ct.obstacle):''}`:'temas yok';
    const res=(r.bad??[]).find(e=>e.kind==='Sonuç'||e.kind==='Kontrol kaybı'||e.kind==='Güçlü çöküş'),err=(r.bad??[]).find(e=>e.kind==='Hata'||e.kind==='Standart dışı'),cut=t=>t.length>110?t.slice(0,108)+'…':t;const what=r.err?'Hesaplanamadı':res?(res.title+(res.text?': '+cut(res.text):'')):err?cut(err.text||err.title):'Belirgin sapma yok; usule uygun akış';
    const cls=r.dmg>=30?'pd-bad':r.dmg>=8||(r.bad??[]).some(e=>e.kind!=='Sonuç')?'pd-mid':'pd-ok';
    return `<tr class="${me?'pd-mine':''}"><td>${esc(o.label)}${ref?'<small class="pd-tag ok">usul</small>':''}${me?'<small class="pd-tag me">seçimin</small>':''}</td><td>${r.dur?Math.round(r.dur)+' s':'—'}</td><td>${tq}</td><td class="${cls}">${r.dmg!=null?'%'+r.dmg:'—'}</td><td>${esc(what)}</td></tr>`;}).join('');
   return `<h5 class="pd-cmp-q">${esc(d.title)}</h5><div class="table-scroll"><table class="pd-table pd-cmp-t"><thead><tr><th>Seçenek</th><th>Süre</th><th>Temas</th><th>Hasar</th><th>Ne oldu</th></tr></thead><tbody>${rowsH}</tbody></table></div>`;}).join('')+'<p class="micro">Hasar: parça düzeyinde benzetim tahmini (en çok etkilenen parça). Model sonuçlarıdır; gerçek uçuş onayı değildir.</p>';done();};
 setTimeout(step,0);}
