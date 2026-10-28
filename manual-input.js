// Manual controls (v0.31): keyboard, gamepad and on-screen controls → collective lever, cyclic disk tilt, pedal.
// Collective is the physical lever (.3 full down … 2.2 full up; 1 = position at the failure instant).
import {LEVER} from './flight-dynamics.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),CYC=.32;
export const MANUAL_HELP='W/S veya PgUp/PgDn: kollektif · Oklar: saykılık · A/D: pedal · C: saykılığı ortala · T: saykılığı trimle · Oyun kumandası: sol çubuk dikey kollektif, yatay pedal; sağ çubuk saykılık; omuz tuşu trim';
export class ManualInput{
 constructor(){this.state={collective:1,cyclicF:0,cyclicR:0,pedal:0};this.keys=new Set();this.touch=null;this.gamepad=false;
  // v0.33 control settings (per viewer, kept in this browser): sensitivity, dead zone, expo, inversion, gamepad axis map, cyclic trim
  this.settings={sens:1,dead:.08,expo:.35,invCyc:false,invCol:false,axCol:1,axPed:0,axCycX:2,axCycY:3};try{Object.assign(this.settings,JSON.parse(localStorage.getItem('ab205-controls')??'{}'));}catch{}
  this.trim={f:0,r:0};this.lastButtons=[];
  this.down=e=>{if(e.target.closest?.('input,select,textarea'))return;const k=e.key.toLowerCase();if(['w','s','a','d','c','t','pageup','pagedown','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&this.active){this.keys.add(k);e.preventDefault();if(k==='t'){this.trim={f:this.state.cyclicF,r:this.state.cyclicR};}if(k==='c'){this.trim={f:0,r:0};this.state.cyclicF=0;this.state.cyclicR=0;}}};
  this.up=e=>this.keys.delete(e.key.toLowerCase());
  addEventListener('keydown',this.down);addEventListener('keyup',this.up);addEventListener('blur',()=>this.keys.clear());this.active=false;}
 sync(p){if(!p)return;const c=p.controls??{};this.state={collective:clamp(c.collective??1,LEVER.min,LEVER.max),cyclicF:clamp(c.cyclicForward??0,-CYC,CYC),cyclicR:clamp(c.cyclicRight??0,-CYC,CYC),pedal:clamp(c.pedal??0,0,1)};}
 saveSettings(){try{localStorage.setItem('ab205-controls',JSON.stringify(this.settings));}catch{}}
 update(dt){const s=this.state,k=this.keys,t=Math.min(.1,dt)*this.settings.sens;
  if(k.has('w')||k.has('pageup'))s.collective+=.9*t;if(k.has('s')||k.has('pagedown'))s.collective-=.9*t;
  if(k.has('arrowup'))s.cyclicF+=.32*t;if(k.has('arrowdown'))s.cyclicF-=.32*t;if(k.has('arrowright'))s.cyclicR+=.32*t;if(k.has('arrowleft'))s.cyclicR-=.32*t;
  if(k.has('d'))s.pedal+=.7*t;if(k.has('a'))s.pedal-=.7*t;
  const pads=typeof navigator!=='undefined'&&navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];const g=pads[0];this.gamepad=!!g;
  if(g){const S=this.settings,ax=i=>{const v=g.axes[i]??0,a=Math.abs(v);if(a<S.dead)return 0;const n=(a-S.dead)/(1-S.dead);return Math.sign(v)*Math.min(1,(1-S.expo)*n+S.expo*n*n*n);};
   // mapped axes: collective absolute; cyclic = trim + stick (spring-centred stick, force-trim button 4/5 or T); pedal
   const btn=i=>!!g.buttons?.[i]?.pressed;if((btn(4)||btn(5))&&!(this.lastButtons[4]||this.lastButtons[5]))this.trim={f:s.cyclicF,r:s.cyclicR};this.lastButtons=[0,1,2,3,4,5].map(btn);
   const cy=ax(S.axCycY)*(S.invCyc?-1:1),cx=ax(S.axCycX),cl=ax(S.axCol)*(S.invCol?-1:1);
   if(Math.abs(cl)>0)s.collective=LEVER.min+(LEVER.max-LEVER.min)*(.5-cl/2);
   s.cyclicF=this.trim.f-cy*CYC*Math.min(1.5,S.sens);s.cyclicR=this.trim.r+cx*CYC*Math.min(1.5,S.sens);
   if(Math.abs(ax(S.axPed))>0)s.pedal=.5+ax(S.axPed)/2;}
  s.collective=clamp(s.collective,LEVER.min,LEVER.max);s.cyclicF=clamp(s.cyclicF,-CYC,CYC);s.cyclicR=clamp(s.cyclicR,-CYC,CYC);s.pedal=clamp(s.pedal,0,1);
  return {...s};}
 // On-screen controls: collective slider, cyclic pad (drag), pedal slider. Same state as keyboard/gamepad.
 mount(host,onChange){host.innerHTML=`<div class="mi-grid">
  <label class="mi-col">Kollektif<input type="range" min="${LEVER.min}" max="${LEVER.max}" step="0.01" data-mi="collective" orient="vertical" aria-label="Kollektif"><output data-mo="collective"></output></label>
  <div class="mi-pad" data-mi="pad" role="slider" tabindex="0" aria-label="Saykılık (sürükle)"><span class="mi-dot"></span><span class="mi-cross"></span></div>
  <label class="mi-ped">Pedal<input type="range" min="0" max="1" step="0.01" data-mi="pedal" aria-label="Pedal"><output data-mo="pedal"></output></label>
  <p class="micro mi-help">${MANUAL_HELP}</p></div>
  <details class="mi-settings"><summary>Kumanda ayarları</summary><div class="mi-set-grid">
   <label>Hassasiyet<input type="range" min=".4" max="2" step=".05" data-set="sens"></label>
   <label>Ölü bölge<input type="range" min="0" max=".25" step=".01" data-set="dead"></label>
   <label>Yumuşatma (expo)<input type="range" min="0" max=".8" step=".05" data-set="expo"></label>
   <label class="chk"><input type="checkbox" data-set="invCyc"> Saykılık ileri/geri ters</label>
   <label class="chk"><input type="checkbox" data-set="invCol"> Kollektif ters</label>
   ${[['axCol','Kollektif ekseni'],['axCycY','Saykılık ileri/geri ekseni'],['axCycX','Saykılık sağ/sol ekseni'],['axPed','Pedal ekseni']].map(([k,l])=>`<label>${l}<select data-set="${k}">${[0,1,2,3,4,5].map(i=>`<option value="${i}">Eksen ${i}</option>`).join('')}</select></label>`).join('')}
   <button type="button" data-set-trim>Saykılığı trimle (T)</button><button type="button" data-set-reset>Varsayılana dön</button>
  </div></details>`;
  {const S=this.settings,fill=()=>host.querySelectorAll('[data-set]').forEach(el=>{const v=S[el.dataset.set];if(el.type==='checkbox')el.checked=!!v;else el.value=v;});fill();
   host.querySelectorAll('[data-set]').forEach(el=>el.addEventListener('input',()=>{S[el.dataset.set]=el.type==='checkbox'?el.checked:Number(el.value);this.saveSettings();}));
   host.querySelector('[data-set-trim]').addEventListener('click',()=>{this.trim={f:this.state.cyclicF,r:this.state.cyclicR};});
   host.querySelector('[data-set-reset]').addEventListener('click',()=>{Object.assign(S,{sens:1,dead:.08,expo:.35,invCyc:false,invCol:false,axCol:1,axPed:0,axCycX:2,axCycY:3});this.trim={f:0,r:0};this.saveSettings();fill();});}
  const col=host.querySelector('[data-mi=collective]'),ped=host.querySelector('[data-mi=pedal]'),pad=host.querySelector('[data-mi=pad]'),dot=pad.querySelector('.mi-dot');
  col.addEventListener('input',()=>{this.state.collective=Number(col.value);onChange?.();});ped.addEventListener('input',()=>{this.state.pedal=Number(ped.value);onChange?.();});
  const fromPad=e=>{const r=pad.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width*2-1,-1,1),y=clamp((e.clientY-r.top)/r.height*2-1,-1,1);this.state.cyclicR=x*CYC;this.state.cyclicF=-y*CYC;onChange?.();};
  pad.addEventListener('pointerdown',e=>{pad.setPointerCapture(e.pointerId);fromPad(e);});pad.addEventListener('pointermove',e=>{if(pad.hasPointerCapture(e.pointerId))fromPad(e);});
  this.view=()=>{col.value=this.state.collective;ped.value=this.state.pedal;host.querySelector('[data-mo=collective]').textContent=`${Math.round((this.state.collective-LEVER.min)/(LEVER.max-LEVER.min)*100)}%`;host.querySelector('[data-mo=pedal]').textContent=this.state.pedal<.45?'sol':this.state.pedal>.55?'sağ':'orta';
   dot.style.left=`${50+this.state.cyclicR/CYC*50}%`;dot.style.top=`${50-this.state.cyclicF/CYC*50}%`;};this.view();}
}
