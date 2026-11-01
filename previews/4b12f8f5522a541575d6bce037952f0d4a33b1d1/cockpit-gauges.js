import {liveFlightState} from './flight-reference.js';
import {terrainHeight as liveTerrainHeight} from './terrain-data.js';
// Cockpit instrument overlay (v0.31; v0.32 restyled after the user's AB-205 panel photos: English panel legends, black bezels on a dark green-grey panel): analog-style dual tachometer, airspeed, radar altitude, VSI and attitude.
// Values come from the same simulated state as the rest of the app; gauges are schematic, not certified panel art.
const NS='http://www.w3.org/2000/svg';
const polar=(cx,cy,r,deg)=>[cx+r*Math.cos((deg-90)*Math.PI/180),cy+r*Math.sin((deg-90)*Math.PI/180)];
function arc(cx,cy,r,a0,a1){const [x0,y0]=polar(cx,cy,r,a0),[x1,y1]=polar(cx,cy,r,a1);return `M${x0},${y0} A${r},${r} 0 ${a1-a0>180?1:0} 1 ${x1},${y1}`;}
function dial({title,min,max,a0=-135,a1=135,ticks,bands=[],unit,needles}){
 const ang=v=>a0+(a1-a0)*(Math.min(max,Math.max(min,v))-min)/(max-min);
 const t=ticks.map(v=>{const [x0,y0]=polar(60,60,46,ang(v)),[x1,y1]=polar(60,60,40,ang(v)),[lx,ly]=polar(60,60,31,ang(v));return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/><text x="${lx}" y="${ly+3}">${v>=1000?v/1000+'k':v}</text>`;}).join('');
 const b=bands.map(([v0,v1,c])=>`<path d="${arc(60,60,47,ang(v0),ang(v1))}" stroke="${c}" stroke-width="5" fill="none"/>`).join('');
 return {html:`<svg viewBox="0 0 120 120" class="cg-dial"><circle cx="60" cy="60" r="56" class="cg-face"/>${b}<g class="cg-ticks">${t}</g><text x="60" y="88" class="cg-title">${title}</text><text x="60" y="99" class="cg-unit">${unit}</text>${needles.map((n,i)=>`<line data-n="${i}" x1="60" y1="60" x2="60" y2="${n.len??16}" class="cg-needle ${n.cls??''}"/>`).join('')}<circle cx="60" cy="60" r="4" class="cg-hub"/><text x="60" y="76" class="cg-digit" data-d="0"></text></svg>`,ang};
}
export class CockpitGauges{
 constructor(host){
  this.el=document.createElement('div');this.el.className='cockpit-gauges';this.el.hidden=true;this.el.setAttribute('aria-label','Kokpit göstergeleri');host.appendChild(this.el);
  const tach=dial({title:'RPM',unit:'ROTOR · ENGINE %',min:0,max:120,ticks:[0,20,40,60,80,100,120],bands:[[90.7,100,'#2fbf5b'],[100,104.6,'#e8c33a'],[104.6,106,'#e0453a']],needles:[{len:14,cls:'r'},{len:22,cls:'e'}]});
  const ias=dial({title:'AIRSPEED',unit:'KNOTS',min:0,max:150,ticks:[0,30,60,90,120,150],bands:[[50,80,'#2fbf5b']],needles:[{len:14}]});
  const alt=dial({title:'RADAR ALT',unit:'FEET',min:0,max:1000,a0:-150,a1:150,ticks:[0,200,400,600,800,1000],bands:[[0,100,'#e8c33a']],needles:[{len:14}]});
  const vsi=dial({title:'VERTICAL SPEED',unit:'FT/MIN',min:-4000,max:4000,a0:-160,a1:160,ticks:[-4000,-2000,0,2000,4000],needles:[{len:14}]});
  this.dials={tach,ias,alt,vsi};
  this.el.innerHTML=`<div class="cg-row">${tach.html}${ias.html}<div class="cg-att"><svg viewBox="0 0 120 120" class="cg-dial"><defs><clipPath id="cg-clip"><circle cx="60" cy="60" r="50"/></clipPath></defs><circle cx="60" cy="60" r="56" class="cg-face"/><g clip-path="url(#cg-clip)"><g class="cg-horizon"><rect x="-60" y="-140" width="240" height="200" fill="#3d7fc1"/><rect x="-60" y="60" width="240" height="200" fill="#7a5a33"/><line x1="-60" y1="60" x2="180" y2="60" stroke="#fff" stroke-width="1.5"/>${[-20,-10,10,20].map(p=>`<line x1="${p%20?48:42}" x2="${p%20?72:78}" y1="${60-p*2}" y2="${60-p*2}" stroke="#fff" stroke-width="1"/>`).join('')}</g></g><path d="M30 60 H50 L55 66 L60 60 L65 66 L70 60 H90" stroke="#ffcc33" stroke-width="3" fill="none"/><text x="60" y="112" class="cg-title">ATTITUDE</text></svg></div>${alt.html}${vsi.html}<div class="cg-col"><span>KOLLEKTİF</span><div class="cg-bar"><i></i></div><b data-col></b><span class="cg-warn" data-warn></span></div></div>`;
  this.q=k=>this.el.querySelector(k);
 }
 set(dialKey,i,value){const d=this.dials[dialKey],svg=this.el.querySelectorAll('.cg-dial')[['tach','ias','att','alt','vsi'].indexOf(dialKey)];if(!svg)return;const n=svg.querySelector(`[data-n="${i}"]`);if(n)n.setAttribute('transform',`rotate(${d.ang(value)} 60 60)`);}
 update(p,{visible}){p=p?liveFlightState(p,liveTerrainHeight):p;this.el.hidden=!visible;if(!visible||!p)return;
  const rotorPct=p.rotorRpm/324*100,enginePct=(p.engineRpm??0)/6600*100;this.set('tach',0,rotorPct);this.set('tach',1,enginePct);
  this.set('ias',0,p.iasKt);this.set('alt',0,p.heightAglFt);this.set('vsi',0,-p.descentFpm);
  const digits=this.el.querySelectorAll('[data-d="0"]');digits[0].textContent=p.rotorRpm.toFixed(0);digits[1].textContent=p.iasKt.toFixed(0);digits[2].textContent=p.heightAglFt.toFixed(0);digits[3].textContent=(-p.descentFpm).toFixed(0);
  const h=this.q('.cg-horizon');if(h){const pitchDeg=-(p.pitch??0)*180/Math.PI,rollDeg=(p.roll??0)*180/Math.PI;h.setAttribute('transform',`rotate(${-rollDeg} 60 60) translate(0 ${pitchDeg*2})`);}
  const c=p.controls??{},frac=Math.max(0,Math.min(1,((c.collective??1)-.3)/1.9));this.q('.cg-bar i').style.height=`${frac*100}%`;this.q('[data-col]').textContent=`%${Math.round(frac*100)}`;
  const warn=p.rotorRpm<294&&p.rotorRpm>1?'DÜŞÜK RPM':p.rotorRpm>339?'YÜKSEK RPM':'';this.q('[data-warn]').textContent=warn;}
 dispose(){this.el.remove();}
}
