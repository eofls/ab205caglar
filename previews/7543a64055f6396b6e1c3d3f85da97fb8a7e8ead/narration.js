// v0.35 narration (anlatım): every procedure step / manoeuvre phase becomes a cue with a cockpit target. In the cockpit
// view the head turns to it, an arrow and a ring point at it and the switch moves; in every view the step is written on
// the screen (independent of the event box) and, if wanted, read aloud (Turkish speech). The flow never waits.
import {isProgramFlight} from './program-flight.js';
import {emergencyById} from './emergency-catalog.js';
const low=s=>String(s??'').toLocaleLowerCase('tr-TR').replace(/ı/g,'i'); /* v0.39 “DE-ICE”, “MAIN GEN”, “BLEED AIR” tr küçük harfte ı olur: eşleşme ı/i farkından bağımsız */
/* step text -> cockpit target and switch positions */
export function interpretStep(text){const t=low(text),set={};let target=null;
 const has=(...k)=>k.some(x=>t.includes(x.replace(/ı/g,'i')));const off=has('kapalı','off','çekili','kapat'),pull=has('çekili','çek');
 if(has('hyd cont sigorta')){target='cb:HYD CONT';set['cb:HYD CONT']=has('basılı')?0:1;if(has('hyd cont anahtarı')){target='hydCont';set.hydCont=has('anahtarı – açık','anahtarı – on')?0:1;}}
 else if(has('hyd cont')){target='hydCont';set.hydCont=has('aksi taraf')?'toggle':(off?1:0);}
 else if(has('gov anahtar','gov emer','gov emer uçuş')){target='gov';set.gov=has('auto')?0:1;}
 else if(has('emercensi motor susturma')){target='fuel';set.fuel=1;set.throttle=0;}
 else if(has('bat, stby','bat anahtar','bat –','batarya')){target='bat';set.bat=0;if(has('main gen'))set.mainGen=1;}
 else if(has('main gen')){target='mainGen';set.mainGen=has('reset')?0:off?1:2;}
 else if(has('yakıt anahtar','fuel anahtar')){target='fuel';set.fuel=off?1:0;}
 else if(has('starter')){target='starterGen';set.starterGen=0;}
 else if(has('de-ice','bleed air')){target='deice';set.deice=1;set.bleedAir=0;}
 else if(has('kapılar','pencereler','havalandırma')){target='doorR';}
 else if(has('transpond','may day','mayday')){target='iffMaster';set.iffMaster=3;}
 else if(has('gaz kolu','gazı','gaz kol')){target='throttle';set.throttle=has('açık')&&!has('kapalı')?1:has('azalt','normal rpm')?.5:0;}
 else if(has('kollektif')){target='collective';}
 else if(has('saykılık','sürat','fleyır','yavaşla')){target=has('sürat')&&!has('saykılık')?'g:ias':'cyclic';}
 else if(has('pedal')){target='pedals';}
 else if(has('ikaz paneli','master caution')){target='caution';}
 else if(has('egt')){target='g:egt';}
 else if(has('tork')){target='g:torque';}
 else if(has('rpm')){target='g:rpm';}
 else if(has('yağ harareti','harareti')){target='g:engOilT';}
 else if(has('yakıt basıncı')){target='g:fuelPress';}
 else if(has('otorotasyon')){target='collective';set.throttle=0;}
 else if(has('gen ve bus reset','sigortaları çek','sigorta'))target='cb:GEN & BUS RESET';
 else if(has('hava hızı','ileri hızı','manevranın sertliğini'))target='cyclic';
 else if(has('güç dalgalan','ani güç','güçlü uçuş','düşük güç'))target='g:torque';
 else if(has('havıra yaklaş','havır taksi'))target='collective';
 else if(has('mürettebat','yolcu','tahliye'))target='doorR';
 else if(has(' in','iniş','saha','yaklaş','uçuşa'))target='out';
 return {target,set};}
function onsetTarget(e){if(e.warn==='fire')return 'fireLight';if(e.lights?.length)return 'caution';
 return {'engine-total':'g:rpm','engine-partial':'g:torque','engine-hover':'g:rpm','engine-low':'g:rpm','engine-restart':'g:rpm','droop-comp':'g:rpm','compressor-stall':'g:egt','igv-closed':'g:torque','igv-open':'g:n1','engine-overspeed':'g:rpm','driveshaft':'g:rpm',
  'tr-loss-flight':'pedals','tr-loss-hover':'pedals','fixed-pedal-low':'pedals','fixed-pedal-high':'pedals','fixed-pedal-hover':'pedals','tr-components':'pedals','lte':'pedals','hydraulic':'cyclic','control-stiffness':'cyclic','servo-cyclic':'cyclic','servo-collective':'collective',
  'rotor-system':'cyclic','mast-bumping':'cyclic','electrical-fire':'g:dcVolt','dc-generator':'caution','trees':'out','ditch-power':'out','ditch-nopower':'g:rpm'}[e.id]??'out';}
const PHYS=[ // physics (blade-element) flights: the few events worth narrating, with a plain explanation
 [/^Sistem$/,/güç kaybı|motor|şaft|kavrama/i,ev=>[{dt:0,title:'Motor arızası',text:'Burun sola sapıyor, rotor ve motor RPM’i düşüyor; RPM ikaz ışığı ve korna.',target:'g:rpm'},
  {dt:1.1,title:'Kollektif aşağı',text:'Rotor devrini korumak için kollektif hemen indirilir.',target:'collective'},{dt:2.3,title:'Pedal',text:'Tork kalkınca burun sola döner; sağ pedalla istikamet tutulur.',target:'pedals'},
  {dt:3.5,title:'Gaz kolu',text:'Gaz kolu rölantiye / kapalıya; otorotasyonda motor rotoru sürmez.',target:'throttle',set:{throttle:0}},{dt:4.8,title:'Sürat',text:'Saykılıkla süzülüş sürati (≈70 KIAS) kurulur; RPM yeşil bantta tutulur.',target:'g:ias'}]],
 [/Uçuş hareketi/,/Fleyır gerçekleşiyor/,()=>[{dt:0,title:'Fleyır',text:'≈75 ft’te saykılık geri: sürat ve alçalış azalır, rotor devri artar.',target:'cyclic'}]],
 [/Kumanda/,/son kollektif/i,()=>[{dt:0,title:'Son kollektif',text:'10–15 ft’te kollektif seri çekilir; temas yumuşatılır.',target:'collective'}]],
 [/Uçuş hareketi/,/Ufkiyet/,()=>[{dt:0,title:'Ufkiyet',text:'Saykılık ileri: burun düzeltilir, kızaklar araziye paralel.',target:'cyclic'}]],
 [/^Temas$/,/./,ev=>[{dt:0,title:'Temas',text:ev.text,target:'out'}]],[/^Sonuç$/,/./,ev=>[{dt:0,title:'Sonuç',text:ev.text,target:'out'}]]];
/* written abbreviations -> how an instructor says them (Turkish speech) */
export function speakable(t){return String(t).replace(/–/g,',').replace(/≈/g,'yaklaşık ').replace(/KIAS/g,'knot').replace(/(\d)\s?kt\b/g,'$1 knot').replace(/(\d)\s?ft\/dk/g,'$1 fit dakikada').replace(/(\d)\s?ft\b/g,'$1 fit').replace(/(\d)\s?m\/s/g,'$1 metre saniyede').replace(/%\s?(\d+)/g,'yüzde $1').replace(/(\d)\s?°/g,'$1 derece').replace(/\bGKK\b/g,'geçiş kaldırıcı kuvvet').replace(/\bTQ\b/g,'tork').replace(/\bPSI\b/g,'pi es ay').replace(/“|”/g,'');}
const CACHE=new WeakMap();
export function buildCues(session){const sc=session.scenario,key=sc;if(key&&CACHE.has(key))return CACHE.get(key);
 let evs=[];try{evs=session.events();}catch{evs=[];}const cfg=session.config,out=[];const prog=isProgramFlight(cfg),em=cfg.program!=='maneuver'?emergencyById(cfg.emergencyId):null;
 if(prog){for(const e of evs){if(e.kind==='Başlangıç')continue;let cue={at:e.at,title:e.title,text:e.text,target:'out',set:{}};
   if(e.kind==='Emercensi'&&em&&e.title===em.title){cue.target=onsetTarget(em);cue.title=em.title;cue.text=em.symptoms;}
   else if(e.kind==='Usul'){const r=interpretStep(e.text);cue.title=e.title+' · '+e.text;cue.text='';cue.target=r.target??'out';cue.set=r.set;}
   else if(e.kind==='Anlatım'||e.kind==='Görev'){const r=interpretStep(e.title+' '+e.text);cue.target=e.kind==='Görev'?'out':(r.target??'out');}
   else if(e.kind==='Yaklaşma'||e.kind==='Temas'&&cfg.program==='maneuver')cue.target='lz';
   if(e.target){cue.target=e.target;cue.set=e.set??{};}if(e.kind==='Görev'){cue.kicker='GÖREV';cue.text=String(e.text).split(' Standartlar:')[0];}
   else if(e.title==='Fleyır'){cue.target='cyclic';}else if(/Son kollektif/.test(e.title)){cue.target='collective';}
   else if(e.kind==='Otorotasyon'){cue.target='collective';cue.set={throttle:0};}
   out.push(cue);}}
 else{let done=new Set();for(const e of evs){for(const [k,rx,fn] of PHYS){if(!k.test(e.kind)||!rx.test(e.title+' '+e.text))continue;const id=String(k)+String(rx);if(done.has(id)&&!/Temas|Sonuç/.test(e.kind))continue;done.add(id);
   for(const c of fn(e))out.push({at:e.at+c.dt,title:c.title,text:c.text,target:c.target,set:c.set??{}});break;}}
  if(em&&em.id!=='engine-total'&&em.id!=='engine-partial'){const first=out.find(c=>c.title==='Motor arızası');if(first){first.title=em.title;first.text=em.symptoms;}}}
 out.sort((a,b)=>a.at-b.at);const rd=c=>2.2+((c.title??'').length+(c.text??'').length)/17;for(let i=1;i<out.length;i++){const p=out[i-1];if(out[i].at-p.at<1.2)out[i].at=p.at+Math.min(4,rd(p));} /* same-moment cues are read one after the other */
 out.forEach((c,i)=>{const nx=out[i+1]?.at??c.at+9,read=2.2+((c.title??'').length+(c.text??'').length)/17;c.dur=Math.max(2.4,Math.min(9,read,nx-c.at));c.speak=speakable(c.title+(c.text?'. '+c.text:'')).slice(0,260);});
 // switch positions for the cockpit (cockpit ids)
 for(const c of out){const s={};for(const [k,v] of Object.entries(c.set??{})){if(k==='throttle'){s.throttle=v;continue;}s[k]=v;}c.set=s;}
 if(key)CACHE.set(key,out);return out;}
/* on-screen caption + arrow; speech */
export class Narrator{
 constructor(host){this.host=host;const el=this.el=document.createElement('div');el.className='narr';el.hidden=true;el.innerHTML='<div class="narr-k"></div><div class="narr-t"></div><div class="narr-x"></div><div class="narr-bar"><i></i></div>';host.appendChild(el);
  const svg=this.svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','narr-svg');svg.innerHTML='<defs><marker id="narr-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ffd25a"/></marker></defs><path class="narr-line" d="" marker-end="url(#narr-head)"/><circle class="narr-ring" r="22"/><circle class="narr-ring2" r="22"/>';host.appendChild(svg);
  this.voice=null;this.speechOn=false;this.cur=null;this.lastTime=null;}
 setSpeech(on){this.speechOn=on;try{localStorage.setItem('narrSpeech',on?'1':'0');}catch{}if(!on)this.stopSpeech();}
 stopSpeech(){try{speechSynthesis.cancel();}catch{}}
 say(text){} /* v0.35.3 seslendirme kaldırıldı */
 /* time -> current cue; returns it (or null) */
 update(time,cues,{playing=true}={}){const prev=this.lastTime;this.lastTime=time;let cur=null;for(const c of cues){if(c.at>time+1e-6)break;if(time<c.at+c.dur)cur=c;}
  if(prev!=null&&(time<prev-.05||time>prev+1.5))this.stopSpeech();
  const key=cur?cur.at.toFixed(2)+'|'+cur.title:null; /* v0.35.6 cues may be rebuilt each frame while playing: compare by content, not identity (the entry animation restarted every frame and hid the box) */
  if(key!==this.curKey){this.curKey=key;this.cur=cur;if(cur){this.el.hidden=false;this.el.querySelector('.narr-k').textContent=cur.kicker??'';this.el.querySelector('.narr-t').textContent=cur.title;this.el.querySelector('.narr-x').textContent=cur.text??'';
    this.el.classList.remove('in');void this.el.offsetWidth;this.el.classList.add('in');if(playing&&prev!=null&&time-prev<1.5&&time>=prev)this.say(cur.speak);}else{this.el.hidden=true;}}
  if(cur)this.el.querySelector('.narr-bar i').style.width=Math.min(100,(time-cur.at)/cur.dur*100)+'%';return cur;}
 /* screen-space pointer to a target (x,y in host px) or none */
 point(xy){const s=this.svg;if(!xy||this.el.hidden){s.classList.remove('on');return;}s.classList.add('on');const hr=this.host.getBoundingClientRect(),br=this.el.getBoundingClientRect();
  const [x,y]=xy,below=y>br.bottom-hr.top,x0=br.left-hr.left+br.width/2,y0=below?br.bottom-hr.top:br.top-hr.top,dx=x-x0,dy=y-y0,d=Math.hypot(dx,dy)||1,ex=x-dx/d*26,ey=y-dy/d*26,cx=(x0+ex)/2+(dy>0?-60:60)*(Math.abs(dx)>40?1:.4),cy=(y0+ey)/2+(below?30:-40);
  s.querySelector('.narr-line').setAttribute('d',`M${x0},${y0} Q${cx},${cy} ${ex},${ey}`);for(const c of s.querySelectorAll('circle')){c.setAttribute('cx',x);c.setAttribute('cy',y);}}
}
