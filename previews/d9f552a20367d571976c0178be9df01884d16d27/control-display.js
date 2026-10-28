// Read-only schematic of integrated controller state, not calibrated cockpit travel.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function controlDisplay(p){
 const c=p.controls,unknown=p.quality==='unsupported';
 const direction=(rate,positive,negative,epsilon)=>unknown?'Hesap yok':p.contact?'Temas · sabit':rate>epsilon?positive:rate< -epsilon?negative:'Konum korunuyor';
 const forward=clamp(c.cyclicForward/.22,-1,1),right=clamp(c.cyclicRight/.22,-1,1);
 const cyclicDirection=[Math.abs(c.cyclicForwardRate)>.004?(c.cyclicForwardRate>0?'ileri':'geri'):'',Math.abs(c.cyclicRightRate)>.004?(c.cyclicRightRate>0?'sağa':'sola'):''].filter(Boolean).join(' / ');
 const pn=c.programNotes??{},withNote=(base,k)=>pn[k]&&!unknown?base.replace(/·.*$/,'· '+pn[k]):base;
 const out={collective:{angle:unknown?0:clamp((c.collective-.3)/1.9,0,1)*-50,label:'Kollektif · '+(!unknown&&!p.contact&&Math.abs(c.collectiveRate)<=.015?(c.collective<.9?'aşağıda · sabit':c.collective>1.05?'yukarıda · sabit':'başlangıç konumu'):direction(c.collectiveRate,'yukarı','aşağı',.015))+(c.collective<.9&&c.collectiveRate>.015&&!p.contact?' · başlangıcın altında':''),arrow:!unknown&&!p.contact&&Math.abs(c.collectiveRate)>.015?(c.collectiveRate>0?'up':'down'):null},
 cyclic:{x:unknown?0:right*23,y:unknown?0:-forward*23,label:'Saykılık · '+(unknown?'hesap yok':p.contact?'temas · sabit':cyclicDirection||'konum korunuyor'),dx:!unknown&&!p.contact?c.cyclicRightRate:0,dy:!unknown&&!p.contact?-c.cyclicForwardRate:0},
 pedal:{label:'Pedal · '+(unknown?'hesap yok':p.contact?'temas · sabit':Math.abs(c.pedalRate)>.015?(c.pedalRate>0?'sağ ileri':'sol ileri'):Math.abs(c.pedal)>.04?(c.pedal>0?'sağ basılı':'sol basılı'):'başlangıç konumu'),available:!unknown,position:unknown?0:clamp(c.pedal,-1,1)*12,rate:unknown||p.contact?0:c.pedalRate},note:p.contact?'Temas anındaki konumlar':'Şematik kumanda konumları'};
 /* v0.34.1 program flights: what the failure / procedure does to each control, and the throttle */
 for(const k of ['collective','cyclic','pedal'])out[k].label=withNote(out[k].label,k);if(c.throttle)out.note='Gaz kolu: '+c.throttle+(p.contact?' · temas anındaki konumlar':'');
 return out;
}
const svg=(body)=>`<svg viewBox="0 0 100 68" aria-hidden="true" focusable="false">${body}</svg>`;
export function controlMarkup(){return `<div class="control-item"><span class="control-name">KOLLEKTİF</span>${svg('<path class="control-base" d="M9 57H40M18 57V47"/><g id="collective-lever"><path class="control-rod" d="M18 47H72"/><rect class="control-grip" x="65" y="42" width="19" height="10" rx="4"/></g><circle class="control-pivot" cx="18" cy="47" r="5"/><path id="collective-arrow" class="control-arrow" d=""/>')}<span id="collective-label"></span></div>
 <div class="control-item"><span class="control-name">SAYKILIK</span>${svg('<circle class="control-base" cx="50" cy="34" r="26"/><path class="control-guide" d="M50 7V61M23 34H77"/><text x="50" y="9" text-anchor="middle">İLERİ</text><path id="cyclic-rod" class="control-rod" d=""/><circle id="cyclic-grip" class="control-grip" cx="50" cy="34" r="7"/><path id="cyclic-arrow" class="control-arrow" d=""/>')}<span id="cyclic-label"></span></div>
 <div class="control-item control-pedal"><span class="control-name">PEDAL</span>${svg('<path class="control-base" d="M25 53H75M32 53V36M68 53V36"/><g id="left-pedal"><rect class="control-grip" x="20" y="16" width="24" height="23" rx="4"/><path class="control-guide" d="M24 23H40M24 30H40"/></g><g id="right-pedal"><rect class="control-grip" x="56" y="16" width="24" height="23" rx="4"/><path class="control-guide" d="M60 23H76M60 30H76"/></g><path id="pedal-arrow" class="control-arrow" d=""/>')}<span id="pedal-label"></span></div><small id="control-note"></small>`;}
function arrow(x,y,dx,dy){const len=Math.hypot(dx,dy);if(len<.004)return '';const ux=dx/len,uy=dy/len,ex=x+ux*18,ey=y+uy*18;return `M${x} ${y}L${ex} ${ey}M${ex-ux*5-uy*4} ${ey-uy*5+ux*4}L${ex} ${ey}L${ex-ux*5+uy*4} ${ey-uy*5-ux*4}`;}
export function renderControls(root,p){const v=controlDisplay(p),get=id=>root.querySelector('#'+id);
 get('collective-lever').setAttribute('transform',`rotate(${v.collective.angle} 18 47)`);
 get('collective-arrow').setAttribute('d',v.collective.arrow?arrow(91,v.collective.arrow==='up'?43:20,0,v.collective.arrow==='up'?-1:1):'');
 const x=50+v.cyclic.x,y=34+v.cyclic.y;
 get('cyclic-grip').setAttribute('cx',x);get('cyclic-grip').setAttribute('cy',y);get('cyclic-rod').setAttribute('d',`M50 34L${x} ${y}`);
 get('cyclic-arrow').setAttribute('d',arrow(85,34,v.cyclic.dx,v.cyclic.dy));
 get('left-pedal').setAttribute('transform',`translate(0 ${v.pedal.position})`);get('right-pedal').setAttribute('transform',`translate(0 ${-v.pedal.position})`);
 get('pedal-arrow').setAttribute('d',Math.abs(v.pedal.rate)>.015?arrow(v.pedal.rate>0?88:12,44,0,-1):'');
 for(const k of ['collective','cyclic','pedal'])get(k+'-label').textContent=v[k].label;
 get('control-note').textContent=v.note;
}
