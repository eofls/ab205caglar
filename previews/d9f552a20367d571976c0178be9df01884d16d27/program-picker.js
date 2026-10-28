// v0.34 Senaryolar tab: Emercensiler (TM 9. bölüm) and Uçuş hareketleri (Uçuş Hareketleri 1. bölüm).
import {EMERGENCIES,EMERGENCY_GROUPS,URGENCY_TEXT} from './emergency-catalog.js';
import {MANEUVERS,MANEUVER_GROUPS} from './maneuver-catalog.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AREA_TAG={airfield:'Meydan',terrain:'Arazi',mountain:'Tepeler',forest:'Orman',water:'Su'};
const KIND_TAG={total:'Güç kaybı · otorotasyon',partial:'Kısmi güç',program:''};
export class ProgramPicker{
 constructor(root,{onSelect}={}){this.root=root;this.onSelect=onSelect;this.tab='emergency';this.filter='';this.sig='';
  root.innerHTML=`<div class="pp-switch" role="tablist" aria-label="Senaryo türü"><button type="button" role="tab" data-pp="emergency">Emercensiler <small>${EMERGENCIES.length}</small></button><button type="button" role="tab" data-pp="maneuver">Uçuş hareketleri <small>${MANEUVERS.length}</small></button></div>
  <input class="pp-filter" type="search" placeholder="Ara…" aria-label="Senaryo ara"><div class="pp-list" role="listbox"></div><div class="pp-detail" aria-live="polite"></div>`;
  this.list=root.querySelector('.pp-list');this.detail=root.querySelector('.pp-detail');
  root.querySelectorAll('[data-pp]').forEach(b=>b.onclick=()=>{this.tab=b.dataset.pp;this.sig='';this.render();});
  root.querySelector('.pp-filter').oninput=e=>{this.filter=e.target.value.toLocaleLowerCase('tr-TR');this.sig='';this.render();};
  this.list.onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;const id=b.dataset.id;
   if(this.tab==='emergency'){const em=EMERGENCIES.find(x=>x.id===id),st=em.start??{h:500,v:80},area=em.area??'terrain';
    this.onSelect?.({program:'emergency',emergencyId:id,customStart:true,startHeightFt:st.h,startIasKt:st.v,startX:0,startZ:0,...(area==='airfield'?{headingDeg:65}:{}),...(area?{flightArea:area}:{}),...(em.kind==='total'||em.kind==='partial'?{powerLossMode:em.kind}:{})},em.title);}
   else{const m=MANEUVERS.find(x=>x.id===id),st=m.start;this.onSelect?.({program:'maneuver',maneuverId:id,customStart:true,startHeightFt:st.h,startIasKt:st.v,flightArea:st.area??'terrain',startX:st.x??0,startZ:st.z??0,...(st.hdg!==undefined?{headingDeg:st.hdg}:{})},m.title);}};
 }
 update(config){this.config=config;if(config.program&&this.sig===''&&!this.touched){this.tab=config.program;}this.touched=true;this.render();}
 render(){const c=this.config??{},sig=JSON.stringify([this.tab,this.filter,c.program,c.emergencyId,c.maneuverId]);if(sig===this.sig)return;this.sig=sig;
  this.root.querySelectorAll('[data-pp]').forEach(b=>{const on=b.dataset.pp===this.tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
  const f=this.filter,hit=t=>!f||t.toLocaleLowerCase('tr-TR').includes(f);let html='';
  if(this.tab==='emergency'){{const items=EMERGENCIES.filter(e=>hit(e.title+' '+e.ref+' '+(e.symptoms??'')));if(items.length) /* v0.35 kitap sırası, alt başlıksız */
    html+=items.map(e=>{const sel=c.program!=='maneuver'&&c.emergencyId===e.id;return `<button type="button" role="option" aria-selected="${sel}" class="pp-item ${sel?'selected':''}" data-id="${e.id}"><span class="pp-ref">${esc(e.ref)}</span><strong>${esc(e.title)}</strong></button>`;}).join('');}}
  else{{const items=MANEUVERS.filter(m=>hit(m.title+' '+m.task+' '+m.group));if(items.length) /* v0.35 istenen sıra, alt başlıksız */
    html+=items.map(m=>{const sel=c.program==='maneuver'&&c.maneuverId===m.id;return `<button type="button" role="option" aria-selected="${sel}" class="pp-item ${m.sub?'pp-sub':''} ${sel?'selected':''}" data-id="${m.id}"><span class="pp-ref">${m.no}</span><strong>${esc(m.title)}</strong></button>`;}).join('');}}
  this.list.innerHTML=html||'<p class="micro">Sonuç yok.</p>';
  const sel=this.list.querySelector('.selected');if(sel&&!this.scrolled){this.scrolled=true;sel.scrollIntoView?.({block:'nearest'});}
  if(c.program==='maneuver'){const m=MANEUVERS.find(x=>x.id===c.maneuverId);if(m)this.detail.innerHTML=`<span class="eyebrow">${m.no}. HAREKET</span><h3>${esc(m.title)}</h3><p>${esc(m.task)}</p><h4>Standartlar</h4><ul>${m.standards.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${m.id==='turns'?`<p><button type="button" class="pp-manual" data-manual="1">${c.mode==='manual'?'Hazır akışa dön':'Elle uç · kumanda sende'}</button></p><p class="micro">Elle uçuşta anlatım ve süre hazır akıştan gelir; kollektif güç / varyo, saykılık sürat ve yatış, pedal top. Klavye: W/S kollektif, oklar saykılık, A/D pedal.</p>`:''}`;if(m?.id==='turns'){const b=this.detail.querySelector('[data-manual]');if(b)b.onclick=()=>{const st=m.start;this.onSelect?.({program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:st.h,startIasKt:st.v,flightArea:st.area??'terrain',startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??0,mode:c.mode==='manual'?'guided':'manual'},m.title);};}}
  else{const e=EMERGENCIES.find(x=>x.id===c.emergencyId);if(e)this.detail.innerHTML=`<span class="eyebrow">OPERATÖR TALİMNAMESİ ${esc(e.ref)}</span><h3>${esc(e.title)}</h3>${e.symptoms?`<p><b>Belirtiler:</b> ${esc(e.symptoms)}</p>`:''}<h4>Usul</h4><ol>${e.steps.map(s=>s.startsWith('!')?`<li><u>${esc(s.slice(1))}</u></li>`:`<li>${esc(s)}</li>`).join('')}</ol>${e.note?`<p class="micro">${esc(e.note)}</p>`:''}<p class="micro">Altı çizili adımlar çekliste bakılmadan, hemen uygulanır.</p>`;}
 }
}
