// Post-flight debrief (v0.31): time history, decision marks, TR-standard checks and a printable report.
// Checks follow TR "Uçuş Hareketleri" Standart Otorotasyon (2-12) and Alçak İrtifa Otorotasyonu (2-15/16) standards.
// They grade the simulated flight against training standards; they are not an airworthiness or accident finding.
import {flightState} from './flight-dynamics.js';
import {currentLanding} from './site-redirect.js';
const FT=.3048,LENGTH_M=17.4;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function debriefData(session){
 const sc=session.scenario,cfg=session.config,choices=session.choices(),end=sc.duration,ev=session.evidence(),contact=ev.summary?.contact;
 const tEnd=contact?.time??end,rows=[],manual=cfg.mode==='manual';let flareAt=null,cushionAt=null,maxClimbFlare=0,minCol=Infinity;
 for(let t=0;t<=tEnd+1e-9;t=Math.round((t+.1)*100)/100){const p=flightState(Math.min(t,tEnd),sc,cfg,choices),c=p.controls;
  rows.push({t,h:p.heightAglFt,ias:p.iasKt,gs:p.groundSpeedKt,rod:p.descentFpm,rpm:p.rotorRpm,col:c.collective,flare:!!(c.flare||p.maneuver?.flaring),cushion:!!c.cushion,stall:p.aerodynamics?.stallExposure??0,margin:p.thrustMargin});
  if(t>4&&flareAt===null&&(c.flare||p.maneuver?.flaring)&&!c.cushion)flareAt=rows.at(-1);
  if(t>4.5)minCol=Math.min(minCol,c.collective);
  if(t>4&&cushionAt===null&&(c.cushion||(manual&&t>5&&p.heightAglFt<80&&c.collective>minCol+.35)))cushionAt=rows.at(-1);
  if(flareAt&&!cushionAt)maxClimbFlare=Math.max(maxClimbFlare,-p.descentFpm);}
 let refRows=[];if(cfg.mode!=='watch'){try{const rc={...cfg,mode:'watch',manualRunId:''},rsc={...sc,duration:600};for(let t=0;t<=120;t=Math.round((t+.2)*100)/100){const q=flightState(t,rsc,rc,[]);refRows.push({t,h:q.heightAglFt,rpm:q.rotorRpm});if(q.contact&&t>=q.contact.time)break;}}catch{refRows=[];}}
 const last=flightState(end,sc,cfg,choices),atContact=contact?flightState(Math.max(4,contact.time-.02),sc,cfg,choices):null;
 const target=currentLanding(choices)?.option,targets=atContact?.landingTargets??[],site=targets.find(t=>t.id===target);
 return {manual,refRows,sc,cfg,choices,rows,flareAt,cushionAt,maxClimbFlare,contact,last,atContact,site,decisions:sc.decisions};
}
const grade=(v,ok,warn,higherBetter=false)=>v==null||!Number.isFinite(v)?'na':higherBetter?(v>=ok?'pass':v>=warn?'warn':'fail'):(v<=ok?'pass':v<=warn?'warn':'fail');
export function standards(d){
 const items=[],R=d.rows,glide=R.filter(r=>r.t>=7&&!r.cushion&&!(d.cushionAt&&r.t>=d.cushionAt.t));
 const green=glide.length?glide.filter(r=>r.rpm>=294&&r.rpm<=339).length/glide.length:null;
 items.push({id:'rpm',title:'Rotor devri yeşil sahada (294–339)',value:green==null?'—':`%${(green*100).toFixed(0)} süre`,grade:grade(green,.9,.7,true),ref:'TR 2-12 Standart c; DCS §9.7B',why:'Süzülüş boyunca rotor yeşilde tutulur; taşma kollektifle önlenir.'});
 if(d.sc.height>=250){const gate=R.findIndex(r=>r.t>5&&r.h<=100),win=gate>0?R.slice(Math.max(0,gate-40),gate):[];
  const mean=win.reduce((a,r)=>a+r.rod,0)/(win.length||1),sd=Math.sqrt(win.reduce((a,r)=>a+(r.rod-mean)**2,0)/(win.length||1)),iasOk=win.every(r=>r.ias>=70&&r.ias<=90) /* TR Standart Otorotasyon d: 80 KIAS +10/−5 before 100 ft (5 kt tolerance for gusts) */,rpmOk=win.every(r=>r.rpm>=294&&r.rpm<=339);
  items.push({id:'steady',title:'100 ft öncesi sabit süzülüş',value:win.length?`alçalış ±${sd.toFixed(0)} ft/dk · ${iasOk?'sürat uygun':'sürat dışında'} · ${rpmOk?'devir yeşil':'devir dışında'}`:'—',grade:!win.length?'na':sd<250&&iasOk&&rpmOk?'pass':sd<450&&rpmOk?'warn':'fail',ref:'TR 2-12 Anlatım: AGL 100 ft öncesi sabit durumlu süzülüş',why:'Sağlanamazsa pas geçilir veya güçlü kurtarma yapılır.'});}
 const fh=d.flareAt?.h;items.push({id:'flare',title:'Fleyır başlangıcı ≈100 ft',value:fh==null?'fleyır yok':`${fh.toFixed(0)} ft · ${d.flareAt.ias.toFixed(0)} kt`,grade:d.sc.height<130?'na':fh==null?(d.sc.ias<20?'na':'fail'):Math.abs(fh-100)<=30?'pass':Math.abs(fh-100)<=60?'warn':'fail',ref:'TR 2-12: yaklaşık 100 ft AGL’de geri saykılıkla fleyır',why:'Fleyır oranı rüzgâr, devir, sürat, yük ve yoğunluk irtifasına göre ayarlanır.'});
 items.push({id:'balloon',title:'Sürekli yavaşlama · irtifa aldırmama',value:d.flareAt?`en fazla ${d.maxClimbFlare.toFixed(0)} ft/dk tırmanma`:'—',grade:d.flareAt?grade(d.maxClimbFlare,100,300):'na',ref:'TR 2-15/16 Hata b: geri saykılığın fazlası irtifa aldırır',why:'Hareket yüksekte biter, temasta kullanılabilecek kollektif azalır.'});
 const ch=d.cushionAt?.h;items.push({id:'pull',title:'İlk kollektif 15 ft ±3',value:ch==null?'uygulanmadı':`${ch.toFixed(0)} ft · ${d.cushionAt.rod.toFixed(0)} ft/dk`,grade:ch==null?'fail':Math.abs(ch-15)<=3?'pass':Math.abs(ch-15)<=10?'warn':'fail',ref:'TR 2-12 Standart f; 2-15 Standart ç',why:'Fleyırla azalan çöküş yeniden artmaya başlarken uygulanır.'});
 const c=d.contact;if(c?.wire)items.unshift({id:'wire',title:'Engel: enerji hattı',value:`${c.part==='mainRotor'?'ana rotor':'gövde/kızak'} iletkene çarptı`,grade:'fail',ref:'TR 2-15 Başlangıç esasları: iniş bölgesi ve engeller önceden değerlendirilir',why:'Tel çarpması en tehlikeli sonuçlardandır; saha seçiminde hat ve direkler hesaba katılır.'});
 if(c){
  items.push({id:'vertical',title:'Temas düşey hızı',value:`${c.descentMps.toFixed(2)} m/s (${(c.descentMps/FT*60).toFixed(0)} ft/dk)`,grade:grade(c.descentMps,1.5,3),ref:'TR 2-12 Standart ğ: yumuşak ve kontrollü bitiş',why:'Kızak ve gövde yükü düşey hızın karesiyle artar.'});
  items.push({id:'ground',title:'Temas yer sürati',value:`${c.groundSpeedMps.toFixed(1)} m/s (${(c.groundSpeedMps/(1852/3600)).toFixed(0)} kt)`,grade:grade(c.groundSpeedMps,3,8),ref:'TR 2-12; DCS §9.7C f (5–10 ft rule)',why:'Sert/düzensiz zeminde ileri sürat takılma ve devrilme riskini artırır.'});
  const gp=d.last.ground?.position,run=gp?Math.hypot(gp[0]-c.point[0],gp[2]-c.point[2]):null;
  items.push({id:'run',title:'Rule mesafesi ≤ 1 helikopter boyu',value:run==null?'—':`${run.toFixed(1)} m (boy ≈ ${LENGTH_M} m)`,grade:grade(run,LENGTH_M,3*LENGTH_M),ref:'TR 2-12: rule mesafesi en fazla bir helikopter boyu',why:'Uzun rule zemine, engele ve devrilmeye maruziyeti artırır.'});
  const v=d.atContact?.velocityMps,hd=d.atContact?.heading;let off=null;if(v&&Math.hypot(v[0],v[2])>2){const track=Math.atan2(v[0],-v[2]);off=Math.abs(Math.atan2(Math.sin(track-hd),Math.cos(track-hd)))*180/Math.PI;}
  items.push({id:'heading',title:'Temasta baş istikameti ±5°',value:off==null?'yer sürati düşük':`${off.toFixed(1)}° sapma`,grade:off==null?'pass':grade(off,5,12),ref:'TR 2-12 Standart g',why:'Kızaklar hareket yönüne paralel değilse yanal yük ve devrilme riski doğar.'});
  if(d.site){const miss=Math.hypot(c.point[0]-d.site.x,c.point[2]-d.site.z);items.push({id:'site',title:`Seçilen sahaya (${d.site.label}) mesafe`,value:`${miss.toFixed(0)} m`,grade:grade(miss,60,180),ref:'TR 2-12 Ç: planlanan noktada bitirebilecek durumda olmak',why:'Seçilen sahaya erişim enerji yönetimi ve yaklaşmanın sonucudur.'});}}
 const w={pass:1,warn:.5,fail:0},scored=items.filter(i=>i.grade!=='na');
 return {items,score:scored.length?Math.round(100*scored.reduce((a,i)=>a+w[i.grade],0)/scored.length):null};
}
function path(rows,x,y,key){return rows.map((r,i)=>`${i?'L':'M'}${x(r.t).toFixed(1)},${y(r[key]).toFixed(1)}`).join('');}
export function renderDebrief(host,session,{onSeek,onExport,compare=null,compareName=''}={}){
 const d=debriefData(session),s=standards(d),R=d.rows;if(!R.length){host.hidden=true;return;}
 // v0.33: a saved attempt chosen for comparison is drawn on the same axes
 let C=[],cs=null;if(compare&&compare.time>=compare.scenario.duration){try{const cd=debriefData(compare);C=cd.rows;cs=standards(cd);}catch{C=[];}}
 const W=720,H1=190,H2=120,L=46,Rp=46,T=14,tMax=Math.max(R.at(-1).t||1,d.refRows.at(-1)?.t??0,C.at(-1)?.t??0),x=t=>L+(W-L-Rp)*t/tMax;
 const hMax=Math.max(50,...R.map(r=>r.h),...d.refRows.map(r=>r.h),...C.map(r=>r.h))*1.08,iMax=Math.max(40,...R.map(r=>r.ias))*1.1,rodMax=Math.max(500,...R.map(r=>Math.abs(r.rod)))*1.1;
 const yh=v=>T+(H1-T-22)*(1-v/hMax),yi=v=>T+(H1-T-22)*(1-v/iMax),yr=v=>T+(H1-T-22)*(1-(v+rodMax*.1)/(rodMax*1.1));
 const r0=200,r1=370,yR=v=>H1+8+(H2-22)*(1-(Math.min(r1,Math.max(r0,v))-r0)/(r1-r0));
 const marks=d.decisions.filter(dd=>d.choices.some(a=>a.id===dd.id)&&dd.at<=tMax).map((dd,i)=>`<g class="db-mark"><line x1="${x(dd.at)}" x2="${x(dd.at)}" y1="${T}" y2="${H1+H2-14}"/><text x="${x(dd.at)+2}" y="${T+9+(i%3)*10}">${i+1}</text></g>`).join('');
 const phase=[d.flareAt&&`<rect class="db-flare" x="${x(d.flareAt.t)}" y="${T}" width="${Math.max(1,x((d.cushionAt?.t??tMax))-x(d.flareAt.t))}" height="${H1-T-22}"/>`,d.cushionAt&&`<rect class="db-cushion" x="${x(d.cushionAt.t)}" y="${T}" width="${Math.max(1,x(tMax)-x(d.cushionAt.t))}" height="${H1-T-22}"/>`].filter(Boolean).join('');
 const ticks=[];for(let t=0;t<=tMax;t+=tMax>40?10:5)ticks.push(`<text class="db-tick" x="${x(t)}" y="${H1+H2-2}">${t}s</text>`);
 const svg=`<svg class="db-chart" viewBox="0 0 ${W} ${H1+H2}" role="img" aria-label="Uçuş zaman çizelgesi: yükseklik, sürat, alçalış ve rotor devri">
  ${phase}<rect class="db-green" x="${L}" y="${yR(339)}" width="${W-L-Rp}" height="${yR(294)-yR(339)}"/>
  <line class="db-axis" x1="${L}" x2="${W-Rp}" y1="${H1-22}" y2="${H1-22}"/><line class="db-axis" x1="${L}" x2="${W-Rp}" y1="${H1+H2-14}" y2="${H1+H2-14}"/>
  <path class="db-h" d="${path(R,x,yh,'h')}"/><path class="db-ias" d="${path(R,x,yi,'ias')}"/><path class="db-rod" d="${path(R,x,yr,'rod')}"/><path class="db-rpm" d="${path(R,x,yR,'rpm')}"/>${d.refRows.length?`<path class="db-ref" d="${path(d.refRows,x,yh,'h')}"/><path class="db-ref" d="${path(d.refRows,x,yR,'rpm')}"/>`:''}${C.length?`<path class="db-cmp" d="${path(C,x,yh,'h')}"/><path class="db-cmp" d="${path(C,x,yi,'ias')}"/><path class="db-cmp" d="${path(C,x,yR,'rpm')}"/>`:''}
  <text class="db-lab" x="4" y="${T+8}">${hMax.toFixed(0)} ft</text><text class="db-lab" x="4" y="${yR(339)+3}">339</text><text class="db-lab" x="4" y="${yR(294)+3}">294</text><text class="db-lab" x="${W-Rp+4}" y="${T+8}">${iMax.toFixed(0)} kt</text>
  ${marks}${ticks.join('')}<line class="db-cursor" x1="0" x2="0" y1="${T}" y2="${H1+H2-14}" visibility="hidden"/></svg>`;
 const label={pass:'Uygun',warn:'Sınırda',fail:'Uygun değil',na:'—'};
 const decisionList=d.decisions.filter(dd=>d.choices.some(a=>a.id===dd.id)&&dd.at<=tMax).map((dd,i)=>{const a=d.choices.find(a=>a.id===dd.id),o=dd.options?.find(o=>o.id===a.option);return `<li><b>${i+1}</b> · ${dd.at.toFixed(1)} s · ${esc(dd.title)} → <i>${esc(o?.label??a.option)}</i></li>`;}).join('');
 const cc=session.config,isaT=15-2*cc.pressureAltitudeFt/1000,da=Math.round((cc.pressureAltitudeFt+120*(cc.temperatureC-isaT))/100)*100,lb=cc.grossWeightLb??6173;
 const heavy=da>=6000||lb>=9000?`<p class="db-heavy">Ağır koşul: ${lb>=9000?lb+' lb':''}${lb>=9000&&da>=6000?' · ':''}${da>=6000?'yoğunluk irtifası ≈ '+da+' ft':''}. Otorotasyonda alçalış oranı ve fleyır için gereken itki artar, rotor pal stall sınırına yaklaşır; temas sertliği bu koşulun sonucudur.</p>`:'';
 // v0.33: plain-language summary first (what went well / what to work on), then the chart and the graded table.
 const good=s.items.filter(i=>i.grade==='pass').map(i=>i.title),work=s.items.filter(i=>i.grade==='fail'||i.grade==='warn');
 const c0=d.atContact,summary=`<div class="db-summary"><div class="db-kpis">${c0?`<div><b>${(d.contact?.descentMps/.3048*60||0).toFixed(0)}</b><span>ft/dk düşey</span></div><div><b>${((d.contact?.groundSpeedMps??0)*3600/1852).toFixed(0)}</b><span>kt yer sürati</span></div><div><b>${(d.contact?.rotorRpm??0).toFixed(0)}</b><span>RPM temasta</span></div>`:''}</div>${work.length?`<p><b>Çalışılacak:</b> ${work.map(i=>esc(i.title)+' ('+esc(i.value)+')').join('; ')}.</p>`:''}${good.length?`<p><b>Uygun:</b> ${good.map(esc).join(', ')}.</p>`:''}</div>`;
 host.innerHTML=`<div class="db-head"><div><span class="eyebrow">UÇUŞ SONRASI DEĞERLENDİRME</span><h3>Standartlara göre sonuç ${s.score==null?'':`<span class="db-score ${s.score>=80?'pass':s.score>=55?'warn':'fail'}">${s.score}/100</span>`}</h3>${heavy}</div><div class="db-actions"><button type="button" data-db="export">Raporu indir</button><button type="button" data-db="print">Yazdır</button></div></div>
 <div class="db-legend"><span class="k h">Yükseklik</span><span class="k ias">Hava sürati</span><span class="k rod">Alçalış</span><span class="k rpm">Rotor devri</span><span class="k fl">Fleyır</span><span class="k cu">Son kollektif</span>${d.refRows.length?'<span class="k ref">Hazır akış (kıyas)</span>':''}${C.length?`<span class="k cmp">Kayıtlı deneme${compareName?': '+esc(compareName):''}${cs?.score!=null?' ('+cs.score+'/100)':''}</span>`:''}<span class="db-read" aria-live="polite"></span></div>
 <div class="db-chart-wrap">${svg}</div><p class="micro">Grafiğe tıklayınca o ana gidilir. Sayılar karar anlarıdır.</p>
 <ol class="db-decisions">${decisionList||(d.manual?'<li>Elle uçuş · kumanda girdileri kayıtlı; karar kartı yok</li>':'')}</ol>
 ${summary}<div class="table-scroll"><table class="reference-table db-table"><thead><tr><th>Ölçüt</th><th>Değer</th><th>Sonuç</th></tr></thead><tbody>${s.items.map(i=>`<tr title="${esc(i.why)} (${esc(i.ref)})"><td>${esc(i.title)}</td><td>${esc(i.value)}</td><td><span class="db-grade ${i.grade}">${label[i.grade]}</span></td></tr>`).join('')}</tbody></table></div>`;
 host.hidden=false;
 const chart=host.querySelector('.db-chart'),cursor=host.querySelector('.db-cursor'),read=host.querySelector('.db-read');
 const tAt=e=>{const b=chart.getBoundingClientRect(),px=(e.clientX-b.left)/b.width*W;return Math.max(0,Math.min(tMax,(px-L)/(W-L-Rp)*tMax));};
 chart.addEventListener('pointermove',e=>{const t=tAt(e),r=R[Math.min(R.length-1,Math.round(t/.1))];cursor.setAttribute('x1',x(r.t));cursor.setAttribute('x2',x(r.t));cursor.setAttribute('visibility','visible');read.textContent=`${r.t.toFixed(1)} s · ${r.h.toFixed(0)} ft · ${r.ias.toFixed(0)} kt · ${r.rod.toFixed(0)} ft/dk · ${r.rpm.toFixed(0)} RPM`;});
 chart.addEventListener('pointerleave',()=>{cursor.setAttribute('visibility','hidden');read.textContent='';});
 chart.addEventListener('click',e=>onSeek?.(tAt(e)));
 host.querySelector('[data-db=export]').addEventListener('click',()=>{const css=[...document.styleSheets].flatMap(sh=>{try{return [...sh.cssRules].map(r=>r.cssText).filter(t=>/\.db-|\.debrief|reference-table|\.micro|\.eyebrow/.test(t));}catch{return [];}}).join('\n');const body=host.cloneNode(true);body.querySelector('.db-actions')?.remove();onExport?.(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AB-205 uçuş değerlendirmesi</title><style>body{font:14px/1.45 system-ui,sans-serif;margin:24px;color:#17332f;background:#fff}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}${css}</style></head><body><p class="micro">${new Date().toLocaleString('tr-TR')} · ${esc(d.sc.name??'')} · ${d.sc.height} ft / ${d.sc.ias} KIAS · ${esc(d.cfg.flightArea)}</p>${body.innerHTML}</body></html>`);});
 host.querySelector('[data-db=print]').addEventListener('click',()=>{document.body.classList.add('print-debrief');try{window.print();}catch{}setTimeout(()=>document.body.classList.remove('print-debrief'),500);});
 return s;
}
