// v0.33 start-position map (Yükseklik–hız sekmesi). Top view of the selected flight area drawn from the same world
// model as physics and the 3D scene: relief shading, surfaces, roads, buildings, trees, power lines, runway, water.
// Tap/click places the helicopter (failure point); dragging from the helicopter sets its heading.
// Optional overlay shows usable forced-landing spots (landing-zone assessment).
import {terrainHeight,surfaceProfile,treesInBox,bouldersInBox,buildingList,powerLineGeometry,FEATURES,parcelKind,FOREST_ROADS,TEPE_SITES} from './terrain-data.js';
import {assessSpot} from './landing-zone.js';
import {REAL_AREAS} from './real-area.js';
const KIND_COLOR={paved:[118,118,112],field:[139,111,78],stubble:[196,176,118],grass:[132,150,92],rough:[150,140,108],wetland:[94,112,84],rock:[128,124,118],sand:[214,198,150],forest:[54,78,48],dirt:[176,158,120],water:[62,110,140]};
const AREA_NAMES={terrain:'Arazi',airfield:'Meydan',forest:'Ormanlık',mountain:'Tepeler',water:'Su üstü'};
export class StartMap{
 constructor(root,{onChange}={}){
  this.root=root;this.onChange=onChange;this.area=null;this.view={cx:0,cz:0,half:1200};this.marker={x:0,z:0,heading:0};this.overlay=false;this.lz=null;this.token=0;
  root.innerHTML=`<div class="sm-head"><span class="eyebrow">BAŞLANGIÇ KONUMU</span><select class="sm-area" data-sm="area" aria-label="Uçuş sahası">${Object.entries(AREA_NAMES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
  <div class="sm-wrap"><canvas class="sm-canvas" aria-label="Başlangıç konumu haritası. Dokunarak helikopteri yerleştir, helikopterden sürükleyerek yönünü ayarla."></canvas>
  <div class="sm-tools"><button type="button" data-sm="in" aria-label="Yakınlaştır">＋</button><button type="button" data-sm="out" aria-label="Uzaklaştır">－</button><button type="button" data-sm="center" title="Helikopteri merkeze al">◎</button></div></div>
  <label class="sm-lz"><input type="checkbox" data-sm="lz"> Uygun iniş yerlerini göster</label>
  <p class="sm-info micro"></p>`;
  this.canvas=root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.info=root.querySelector('.sm-info');
  root.querySelector('[data-sm=in]').onclick=()=>this.zoom(.5);root.querySelector('[data-sm=out]').onclick=()=>this.zoom(2);
  root.querySelector('[data-sm=center]').onclick=()=>{this.view.cx=this.marker.x;this.view.cz=this.marker.z;this.redraw(true);};
  root.querySelector('[data-sm=lz]').onchange=e=>{this.overlay=e.target.checked;this.lz=null;this.redraw(false);};
  root.querySelector('[data-sm=area]').onchange=e=>{const a=e.target.value;this.onChange?.({flightArea:a,startX:0,startZ:0,...(a==='airfield'?{headingDeg:65}:{})});};
  this.bindPointer();
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>this.redraw(true)).observe(this.canvas);
 }
 zoom(f){this.view.half=Math.max(250,Math.min(this.lim()-300,this.view.half*f));this.view.cx=this.marker.x;this.view.cz=this.marker.z;this.clampView();this.lz=null;this.redraw(true);}
 lim(){return this.area==='terrain'||this.area==='mountain'?4450:this.area==='airfield'?2950:3950;}
 clampView(){const h=this.view.half,m=Math.max(0,this.lim()-50-h);this.view.cx=Math.max(-m,Math.min(m,this.view.cx));this.view.cz=Math.max(-m,Math.min(m,this.view.cz));}
 update(config){const area=config.flightArea??'terrain',x=config.startX??0,z=config.startZ??0,hd=(config.headingDeg??0)*Math.PI/180;
  const areaChanged=area!==this.area;const moved=x!==this.marker.x||z!==this.marker.z||hd!==this.marker.heading;this.marker={x,z,heading:hd};
  if(areaChanged){this.area=area;this.root.querySelector('.sm-area').value=area;this.view={cx:x,cz:z,half:area==='airfield'?1500:1200};this.clampView();this.lz=null;this.redraw(true);}
  else if(moved)this.redraw(false);}
 size(){const r=this.canvas.getBoundingClientRect(),w=Math.max(160,Math.round(r.width||300)),dpr=Math.min(2,globalThis.devicePixelRatio||1);if(this.canvas.width!==Math.round(w*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(w*dpr);}return {w:this.canvas.width,h:this.canvas.height};}
 toPx(x,z){const {w}=this.size(),v=this.view;return [(x-(v.cx-v.half))/(2*v.half)*w,(z-(v.cz-v.half))/(2*v.half)*w];}
 toWorld(px,pz){const {w}=this.size(),v=this.view;return [v.cx-v.half+px/w*2*v.half,v.cz-v.half+pz/w*2*v.half];}
 // base layer (relief + surfaces + vectors) is cached per view; marker and overlay drawn on top
 redraw(rebuildBase){if(!this.area)return;const {w}=this.size();if(rebuildBase||!this.base||this.base.width!==w||this.baseKey!==this.key())this.buildBase();this.compose();if(this.overlay&&!this.lz)this.computeLz();this.describe();}
 key(){return [this.area,this.view.cx,this.view.cz,this.view.half,this.canvas.width].join('|');}
 buildBase(){const {w}=this.size(),area=this.area,v=this.view,N=Math.min(220,Math.round(w/2)),cell=2*v.half/N;
  const off=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(N,N):Object.assign(document.createElement('canvas'),{width:N,height:N}),ox=off.getContext('2d'),img=ox.createImageData(N,N);
  const H=new Float32Array((N+1)*(N+1));for(let j=0;j<=N;j++)for(let i=0;i<=N;i++)H[j*(N+1)+i]=terrainHeight(v.cx-v.half+i*cell,v.cz-v.half+j*cell,area);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=v.cx-v.half+(i+.5)*cell,z=v.cz-v.half+(j+.5)*cell,s=surfaceProfile(x,z,area),c=KIND_COLOR[s.kind]??KIND_COLOR.rough;
   const dhx=(H[j*(N+1)+i+1]-H[j*(N+1)+i])/cell,dhz=(H[(j+1)*(N+1)+i]-H[j*(N+1)+i])/cell,shade=s.kind==='water'?1:Math.max(.55,Math.min(1.25,1-(dhx*.7+dhz*.7)*2.2)),k=(j*N+i)*4;
   img.data[k]=c[0]*shade;img.data[k+1]=c[1]*shade;img.data[k+2]=c[2]*shade;img.data[k+3]=255;}
  ox.putImageData(img,0,0);
  const base=document.createElement('canvas');base.width=w;base.height=w;const b=base.getContext('2d');b.imageSmoothingEnabled=true;b.drawImage(off,0,0,w,w);
  /* v0.39 gerçek sahalarda uydu görüntüsü (Sentinel-2, ±4.5 km) altlık; kabartma gölgesi hafifçe üstünde */
  if(area==='terrain'||area==='mountain'){const im=(StartMap.sat??={})[area]??=(()=>{const i=new Image();i.onload=()=>{if(this.area===area)this.redraw(true);};i.src='assets/terrain/'+(area==='mountain'?'tepeler':'golbasi')+'-s2.jpg';return i;})();
   if(im.complete&&im.naturalWidth){const k=im.naturalWidth/9000,sx=(v.cx-v.half+4500)*k,sy=(v.cz-v.half+4500)*k,sw=2*v.half*k;b.filter='saturate(0.8) hue-rotate(7deg) brightness(0.95)';b.drawImage(im,sx,sy,sw,sw,0,0,w,w);b.filter='none';b.globalAlpha=.25;b.globalCompositeOperation='multiply';b.drawImage(off,0,0,w,w);b.globalAlpha=1;b.globalCompositeOperation='source-over';}}
  const px=(x,z)=>[(x-(v.cx-v.half))/(2*v.half)*w,(z-(v.cz-v.half))/(2*v.half)*w],scale=w/(2*v.half);
  // roads / taxiways
  b.strokeStyle='#d8c8a4';b.lineCap='round';if(area==='forest')for(const r of FOREST_ROADS){b.lineWidth=Math.max(1,6*scale);b.beginPath();for(let t=-3000;t<=3000;t+=20){const q=r.along==='z'?px(r.f(t),t):px(t,r.f(t));t>-3000?b.lineTo(...q):b.moveTo(...q);}b.stroke();}
  for(const f of (REAL_AREAS[area]?.features??[])){if(!f.tags.highway)continue;b.lineWidth=Math.max(1,(f.tags.highway==='track'?3.5:6)*scale);b.beginPath();f.points.forEach((p,i)=>{const q=px(p[0],p[1]);i?b.lineTo(...q):b.moveTo(...q);});b.stroke();}
  // buildings
  b.fillStyle='#7d6f5f';b.strokeStyle='#4d4338';b.lineWidth=Math.max(.5,scale*.6);for(const bl of buildingList(area)){if(bl.maxX<v.cx-v.half||bl.minX>v.cx+v.half||bl.maxZ<v.cz-v.half||bl.minZ>v.cz+v.half)continue;b.beginPath();bl.pts.forEach((p,i)=>{const q=px(p[0],p[1]);i?b.lineTo(...q):b.moveTo(...q);});b.closePath();b.fill();if(scale>.3)b.stroke();}
  // trees
  const trees=treesInBox(v.cx-v.half,v.cx+v.half,v.cz-v.half,v.cz+v.half,area);b.fillStyle='rgba(30,58,30,.9)';
  for(const t of trees){const [x,y]=px(t.x,t.z),r=Math.max(.8,t.radius*scale);b.beginPath();b.arc(x,y,r,0,6.283);b.fill();}
  if(v.half<=900){b.fillStyle='rgba(90,86,78,.85)';for(const r of bouldersInBox(v.cx-v.half,v.cx+v.half,v.cz-v.half,v.cz+v.half,area)){const [x,y]=px(r.x,r.z);b.beginPath();b.arc(x,y,Math.max(.7,r.radius*scale),0,6.283);b.fill();}}
  // power lines
  b.strokeStyle='#d1462f';b.lineWidth=Math.max(1.2,w/300);b.setLineDash([6,4]);for(const line of powerLineGeometry(area)){b.beginPath();line.forEach((p,i)=>{const q=px(p.x,p.z);i?b.lineTo(...q):b.moveTo(...q);});b.stroke();}b.setLineDash([]);
  b.fillStyle='#d1462f';for(const line of powerLineGeometry(area))for(const p of line){const [x,y]=px(p.x,p.z);b.fillRect(x-2,y-2,4,4);}
  if(area==='mountain'){b.font=`600 ${Math.round(w/40)}px system-ui,sans-serif`;for(const st of TEPE_SITES){const [x,y]=px(st.x,st.z);if(x<-20||y<-20||x>w+20||y>w+20)continue;b.strokeStyle='#ffd25a';b.lineWidth=2;b.beginPath();b.arc(x,y,Math.max(4,25*scale),0,6.283);b.stroke();b.fillStyle='#fff';b.strokeStyle='#000a';b.lineWidth=3;b.strokeText(st.name,x+7,y-6);b.fillText(st.name,x+7,y-6);}}
  // scale bar
  const m=v.half>1000?500:v.half>500?200:100,L=m*scale;b.fillStyle='rgba(255,255,255,.85)';b.fillRect(8,w-22,L+8,14);b.fillStyle='#1d2b26';b.fillRect(12,w-12,L,3);b.font=`${Math.round(w/34)}px system-ui,sans-serif`;b.fillText(m+' m',14,w-14);
  // north arrow
  b.fillStyle='rgba(255,255,255,.85)';b.beginPath();b.arc(w-18,18,12,0,6.283);b.fill();b.fillStyle='#1d2b26';b.beginPath();b.moveTo(w-18,8);b.lineTo(w-13,22);b.lineTo(w-18,19);b.lineTo(w-23,22);b.closePath();b.fill();
  this.base=base;this.baseKey=this.key();}
 compose(){const {w}=this.size(),c=this.ctx;c.clearRect(0,0,w,w);if(this.base)c.drawImage(this.base,0,0);
  if(this.overlay&&this.lz){const step=this.lz.step*w/(2*this.view.half);for(const q of this.lz.cells){const [x,y]=this.toPx(q.x,q.z);c.fillStyle=q.score>.6?'rgba(40,200,90,.55)':q.score>.25?'rgba(240,200,40,.5)':'rgba(220,60,40,.18)';c.fillRect(x-step/2,y-step/2,step,step);}}
  // last flight: ground track, failure point, chosen field (P) and touchdown
  const tr=this.track;if(tr?.area===this.area&&tr.points?.length>1){c.lineJoin='round';c.lineCap='round';
   c.strokeStyle='rgba(20,24,22,.55)';c.lineWidth=Math.max(4,w/90);c.beginPath();tr.points.forEach((p,i)=>{const q=this.toPx(p[0],p[1]);i?c.lineTo(...q):c.moveTo(...q);});c.stroke();
   c.strokeStyle='#ffe14d';c.lineWidth=Math.max(2,w/170);c.beginPath();tr.points.forEach((p,i)=>{const q=this.toPx(p[0],p[1]);i?c.lineTo(...q):c.moveTo(...q);});c.stroke();
   const dot=(x,z,fill,r)=>{const [px,pz]=this.toPx(x,z);c.beginPath();c.arc(px,pz,r,0,6.283);c.fillStyle=fill;c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();return [px,pz];};
   if(tr.failure)dot(tr.failure[0],tr.failure[1],'#d1462f',Math.max(4,w/80));
   if(tr.site){const [px,pz]=dot(tr.site[0],tr.site[1],'rgba(29,43,38,.85)',Math.max(8,w/40));c.fillStyle='#fff';c.font=`bold ${Math.round(Math.max(10,w/30))}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(tr.siteLabel??'P',px,pz+1);c.textAlign='start';c.textBaseline='alphabetic';}
   if(tr.touchdown){const [px,pz]=this.toPx(tr.touchdown[0],tr.touchdown[1]),r=Math.max(6,w/55);c.strokeStyle='#1d2b26';c.lineWidth=Math.max(4,w/90);c.beginPath();c.moveTo(px-r,pz-r);c.lineTo(px+r,pz+r);c.moveTo(px+r,pz-r);c.lineTo(px-r,pz+r);c.stroke();c.strokeStyle=tr.good?'#3fd17a':'#ff5a3c';c.lineWidth=Math.max(2,w/180);c.stroke();}}
  // helicopter marker + heading
  const [mx,mz]=this.toPx(this.marker.x,this.marker.z),hd=this.marker.heading,len=w/9,s=Math.max(7,w/38);
  c.strokeStyle='#ffffff';c.lineWidth=Math.max(2,w/160);c.beginPath();c.moveTo(mx,mz);c.lineTo(mx+Math.sin(hd)*len,mz-Math.cos(hd)*len);c.stroke();
  c.fillStyle='#ff7a1a';c.strokeStyle='#ffffff';c.lineWidth=2;c.beginPath();c.moveTo(mx+Math.sin(hd)*s*1.4,mz-Math.cos(hd)*s*1.4);c.lineTo(mx+Math.sin(hd+2.5)*s,mz-Math.cos(hd+2.5)*s);c.lineTo(mx+Math.sin(hd-2.5)*s,mz-Math.cos(hd-2.5)*s);c.closePath();c.fill();c.stroke();
  c.beginPath();c.arc(mx+Math.sin(hd)*len,mz-Math.cos(hd)*len,Math.max(5,w/60),0,6.283);c.fillStyle='#ffffff';c.fill();c.strokeStyle='#ff7a1a';c.stroke();}
 setTrack(track){this.track=track??null;if(this.area){this.compose();this.describe();}}
 computeLz(){const token=++this.token,v=this.view,step=Math.max(20,v.half/22),cells=[];this.lz={step,cells:[]};let i=0;const pts=[];
  for(let z=v.cz-v.half+step/2;z<v.cz+v.half;z+=step)for(let x=v.cx-v.half+step/2;x<v.cx+v.half;x+=step)pts.push([x,z]);
  const work=()=>{if(token!==this.token)return;const t0=performance.now();while(i<pts.length&&performance.now()-t0<12){const [x,z]=pts[i++];const q=assessSpot(x,z,this.area);cells.push({x,z,score:q.score});}this.lz={step,cells};this.compose();if(i<pts.length)setTimeout(work,0);};work();}
 describe(){const {x,z}=this.marker,q=assessSpot(x,z,this.area),ns=z<=0?'K':'G',ew=x>=0?'D':'B';
  this.info.textContent=`Konum: ${Math.abs(Math.round(z))} m ${ns} · ${Math.abs(Math.round(x))} m ${ew} · baş ${Math.round(this.marker.heading*180/Math.PI+360)%360}° · zemin: ${q.label.toLocaleLowerCase('tr-TR')} · eğim ${q.slopeDeg.toFixed(1)}° · en yakın engel ${q.clearM>=40?'40+':Math.round(q.clearM)} m`+(this.track?.area===this.area&&this.track.summary?` · son uçuş: ${this.track.summary}`:'');}
 bindPointer(){let mode=null,start=null;const cv=this.canvas;cv.style.touchAction='none';
  const local=e=>{const r=cv.getBoundingClientRect(),k=cv.width/r.width;return [(e.clientX-r.left)*k,(e.clientY-r.top)*k];};
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture?.(e.pointerId);const [px,pz]=local(e),[mx,mz]=this.toPx(this.marker.x,this.marker.z),len=cv.width/9,hx=mx+Math.sin(this.marker.heading)*len,hz=mz-Math.cos(this.marker.heading)*len,grab=Math.max(18,cv.width/16);
   mode=Math.hypot(px-hx,pz-hz)<grab||Math.hypot(px-mx,pz-mz)<grab*.7?'heading':'move';start=[px,pz];if(mode==='move')this.moveTo(px,pz);e.preventDefault();});
  cv.addEventListener('pointermove',e=>{if(!mode)return;const [px,pz]=local(e);if(mode==='move')this.moveTo(px,pz);else{const [mx,mz]=this.toPx(this.marker.x,this.marker.z);if(Math.hypot(px-mx,pz-mz)>6){this.marker.heading=(Math.atan2(px-mx,-(pz-mz))+2*Math.PI)%(2*Math.PI);this.compose();this.describe();}}});
  const end=()=>{if(!mode)return;const m=mode;mode=null;if(m==='move')this.onChange?.({startX:Math.round(this.marker.x),startZ:Math.round(this.marker.z)});else this.onChange?.({headingDeg:Math.round(this.marker.heading*180/Math.PI)%360});};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);}
 moveTo(px,pz){let [x,z]=this.toWorld(px,pz);x=Math.max(-2500,Math.min(2500,x));z=Math.max(-2500,Math.min(2500,z));this.marker.x=x;this.marker.z=z;this.compose();this.describe();}
}
