import {realGroundTexture,forestGroundTexture,airfieldGroundTexture} from './terrain-detail.js';
import {LITE} from './device-profile.js';
import {enhanceSurface,createWater,createHorizon,createForest,createAirfieldExtras,createPowerLines,rockGeometry} from './environment.js';
import * as T from './vendor/three.module.js';
import {terrainHeight,terrainColor,treesInBox,bouldersInBox,RUNWAY,HELI_PANELS,islandHeight} from './terrain-data.js';
export function areaObjects(area,center={x:0,z:0}){
 const objects=[];
 // v0.33: vegetation from the shared world model, in a window around the start point
 {const R=LITE?(area==='forest'?800:1100):area==='forest'?1150:area==='terrain'||area==='mountain'?2000:1600;for(const t of treesInBox(center.x-R,center.x+R,center.z-R,center.z+R,area))objects.push({...t,treeKind:t.kind,kind:'tree',y:terrainHeight(t.x,t.z,area)});}
 if(area==='airfield'){
  objects.push({kind:'runway',x:0,z:0,width:36,length:2017});
  for(let a=-950;a<1000;a+=60)objects.push({kind:'stripe',x:a*Math.sin(RUNWAY.heading),z:-a*Math.cos(RUNWAY.heading),width:.9,length:30});
 }
 return objects;
}
/* v0.52 sahnedeki zemin ağının (PlaneGeometry ızgarası) gerçek çizilen yüksekliği: helikopter yere değerken ağın üstüne oturtulur, havada durmaz */
export function groundMeshParams(area){const realG=area==='terrain'||area==='mountain',half=area==='mountain'?6500:realG?4500:area==='airfield'?3000:4000,res=LITE?(area==='mountain'?280:realG?220:160):area==='mountain'?400:realG?300:area==='forest'?300:200;return {half,res,cell:2*half/res};}
const GMC=new Map();
export function groundMeshHeight(area,x,z){const P=groundMeshParams(area),c=P.cell,fx=(x+P.half)/c,fz=(z+P.half)/c,ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz;
 const H=(i,j)=>{const k=area+':'+i+':'+j;let h=GMC.get(k);if(h===undefined){if(GMC.size>4000)GMC.clear();const X=-P.half+i*c,Z=-P.half+j*c;h=terrainHeight(X,Z,area)-(area==='water'&&islandHeight(X,Z)<=0?4:0);GMC.set(k,h);}return h;};
 const h00=H(ix,iz),h10=H(ix+1,iz),h01=H(ix,iz+1),h11=H(ix+1,iz+1);return u+v<=1?h00+u*(h10-h00)+v*(h01-h00):h11+(1-u)*(h01-h11)+(1-v)*(h10-h11);}
const GROUND_CACHE=new Map(),FAR_CACHE=new Map();
export function makeAreaScene(area,center={x:0,z:0}){
 const root=new T.Group();root.name='Uçuş sahası '+area;
 /* v0.52 hız: zemin ağı (13 km ızgara) yalnız saha değişince kurulur; haritadan yeni başlangıç seçince yeniden hesaplanmaz */
 let ground=GROUND_CACHE.get(area);if(ground){root.add(ground);}else{
 const realG=area==='terrain'||area==='mountain',half=area==='mountain'?6500:realG?4500:area==='airfield'?3000:4000, /* v0.42 Tepeler ±6,5 km (doğu R/A–E/B kesişimleri saha içinde) */ /* v0.39 orman ve su sahaları da büyütüldü (8 km) */res=LITE?(area==='mountain'?280:realG?220:160):area==='mountain'?400:realG?300:area==='forest'?300:200,geo=new T.PlaneGeometry(2*half,2*half,res,res);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,terrainHeight(x,z,area)-(area==='water'&&islandHeight(x,z)<=0?4:0)); /* v0.39 su altı zemini suyun 4 m altında: uzakta su ile zemin titreşmez */colors.push(...terrainColor(x,z,area));}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();ground=new T.Mesh(geo,enhanceSurface(new T.MeshStandardMaterial({vertexColors:!realG&&area!=='forest'&&area!=='airfield',map:realG?realGroundTexture(area):area==='forest'?forestGroundTexture():area==='airfield'?airfieldGroundTexture():null,roughness:area==='water'?.3:1}),{rock:area==='mountain'?.35:area==='terrain'?.2:0,snowLine:1e9,detail:area==='water'?.5:1,canopy:realG||area==='airfield'}));ground.receiveShadow=true;ground.name='Zemin';ground.userData.keep=true;GROUND_CACHE.set(area,ground);root.add(ground);}
 root.userData.time={value:0};if(typeof document!=='undefined'){root.add(createHorizon(area));root.add(createPowerLines(area));if(area==='water'){const water=createWater();root.add(water);root.userData.water=water;}if(area==='airfield'){const extras=createAirfieldExtras();root.add(extras);root.userData.airfield=extras;}}
 const objects=areaObjects(area,center);
 {const trees=objects.filter(o=>o.kind==='tree'),R=LITE?(area==='forest'?800:1100):area==='forest'?1150:area==='terrain'||area==='mountain'?2000:1600,half=area==='mountain'?6500:area==='terrain'?4500:area==='airfield'?3000:4000;
  const provider=(x0,x1,z0,z1)=>{x0=Math.max(x0,-half);x1=Math.min(x1,half);z0=Math.max(z0,-half);z1=Math.min(z1,half);if(x0>=x1||z0>=z1)return [];return treesInBox(x0,x1,z0,z1,area).map(t=>({...t,treeKind:t.kind,kind:'tree',y:terrainHeight(t.x,t.z,area)}));};
  if(trees.length||area!=='water')root.add(createForest(trees,{time:root.userData.time,area,provider,buildR:R})); /* v0.47 orman helikopterle birlikte akar */}
 {const nearR=LITE?1100:2000;try{const key=area+':'+(nearR-180);let far=FAR_CACHE.get(key);if(!far){far=createFarTrees(area,center,0,nearR-180);if(far){far.traverse(o=>o.userData.keep=true);FAR_CACHE.set(key,far);}}if(far)root.add(far);}catch(e){console.warn(e);} /* v0.52 uzak ağaçlar yalnız sahaya bağlı: önbellekten */}
 // v0.33 boulders (same obstacles as collision / landing-zone assessment)
 {const R=LITE?800:1500,rocks=bouldersInBox(center.x-R,center.x+R,center.z-R,center.z+R,area);if(rocks.length){const m=new T.InstancedMesh(rockGeometry(),new T.MeshStandardMaterial({color:'#ffffff',roughness:1,flatShading:true,vertexColors:true}),rocks.length),o=new T.Object3D(),cl=new T.Color();rocks.forEach((r,i)=>{o.position.set(r.x,terrainHeight(r.x,r.z,area)+r.height*.22,r.z);o.rotation.set(r.x*.05,r.z*.17+r.x*.3,r.x*.03);o.scale.set(r.radius,r.height*.75,r.radius*.85);o.updateMatrix();m.setMatrixAt(i,o.matrix);const k=Math.abs(Math.sin(r.x*12.9+r.z*78.2)*43758.5)%1;cl.setRGB(.42+.12*k,.4+.1*k,.36+.08*k);m.setColorAt(i,cl);}); /* v0.45 kaya: düzensiz, yarı gömülü, renk farkı */m.receiveShadow=true;m.castShadow=rocks.length<3000;root.add(m);}}
 if(area==='airfield')for(const o of objects){const g=new T.PlaneGeometry(o.width,o.length,1,o.kind==='runway'?100:1);g.rotateX(-Math.PI/2);g.rotateY(-RUNWAY.heading);g.translate(o.x,0,o.z);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(p.getX(i),p.getZ(i),area)+.08+(o.kind==='stripe'?.02:0));g.computeVertexNormals();root.add(new T.Mesh(g,o.kind==='runway'?enhanceSurface(new T.MeshStandardMaterial({color:'#4b4c48',roughness:.95,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}),{asphalt:true,runway:true}):new T.MeshStandardMaterial({color:'#eee9d8',roughness:.95,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3})));}
 if(area==='airfield')for(const [label,along,turn] of [['06',-1008.5+28,0],['24',1008.5-28,Math.PI]]){const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(0,0,0,0)';x.clearRect(0,0,128,128);x.fillStyle='#f4f4ee';x.font='bold 84px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,64,66);const tex=new T.CanvasTexture(c);const g=new T.PlaneGeometry(14,14);g.rotateX(-Math.PI/2);g.rotateY(-(RUNWAY.heading+turn));const px=along*Math.sin(RUNWAY.heading),pz=-along*Math.cos(RUNWAY.heading);const m=new T.Mesh(g,new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4}));m.position.set(px,terrainHeight(px,pz,area)+.12,pz);root.add(m);}
 if(area==='airfield'){
  const H=RUNWAY.heading,sx=Math.sin(H),cz=-Math.cos(H),at=(al,off)=>{const x=al*sx+off*Math.cos(H),z=al*cz+off*Math.sin(H);return [x,terrainHeight(x,z,area),z];};
  const mat=new T.MeshStandardMaterial({color:'#eee9d8',roughness:.95});
  const strip=(al,off,w,l)=>{const g=new T.PlaneGeometry(w,l,1,1);g.rotateX(-Math.PI/2);g.rotateY(-H);const m=new T.Mesh(g,mat);const p=at(al,off);m.position.set(p[0],p[1]+.13,p[2]);m.material.polygonOffset=true;m.material.polygonOffsetFactor=-3;root.add(m);};
  for(const end of [-1,1])for(let k=-6;k<=6;k++){if(k===0)continue;strip(end*(1008.5-8),k*2.6,1.4,10);}
  HELI_PANELS.along.forEach((al,i)=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#5b5b56';x.fillRect(0,0,256,256);x.strokeStyle='rgba(238,236,226,.85)';x.lineWidth=5;x.strokeRect(10,10,236,236);x.fillStyle='rgba(238,236,226,.9)';x.font='bold 140px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('H',128,124);x.font='bold 40px sans-serif';x.fillText(String(i+1),128,222);{let sd=31+i;const rr=()=>(sd=(sd*16807)%2147483647)/2147483647;for(let k=0;k<2600;k++){const px=rr()*256,py=rr()*256,v=rr()<.5?0:255;x.fillStyle=`rgba(${v?120:40},${v?118:40},${v?110:38},${.05+rr()*.12})`;x.fillRect(px,py,1+rr()*3,1+rr()*2);}x.fillStyle='rgba(30,30,28,.18)';for(let k=0;k<5;k++){x.beginPath();x.ellipse(70+rr()*120,70+rr()*120,8+rr()*22,4+rr()*12,rr()*3,0,6.283);x.fill();}} /* v0.45 yıpranmış boya, yağ lekesi ve asfalt dokusu */const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const g=new T.PlaneGeometry(HELI_PANELS.size,HELI_PANELS.size,4,4);g.rotateX(-Math.PI/2);g.rotateY(-H);const p=at(al,HELI_PANELS.across);g.translate(p[0],0,p[2]);const pa=g.attributes.position;for(let k=0;k<pa.count;k++)pa.setY(k,terrainHeight(pa.getX(k),pa.getZ(k),area)+.14);g.computeVertexNormals();root.add(new T.Mesh(g,enhanceSurface(new T.MeshStandardMaterial({map:tex,roughness:.95,polygonOffset:true,polygonOffsetFactor:-4}),{asphalt:true,detail:.8})));}); /* v0.35.9 paneller asfalt (yol ile aynı), talimattaki yerlerinde */
  for(const end of [-1,1]){strip(end*(1008.5-300),-9,4,45);strip(end*(1008.5-300),9,4,45);}
  const lights=[];for(let a=-1000;a<=1000;a+=60)for(const off of [-19,19])lights.push(at(a,off));
  const lm=new T.InstancedMesh(new T.SphereGeometry(.35,8,6),new T.MeshBasicMaterial({color:'#ffe9a6'}),lights.length),o=new T.Object3D();
  lights.forEach((p,i)=>{o.position.set(p[0],p[1]+.4,p[2]);o.updateMatrix();lm.setMatrixAt(i,o.matrix);});root.add(lm);
  /* v0.39 ana pist ile emercensi pist (şerit) arasındaki temsili yol ve mavi ışıkları kaldırıldı */
 }
 return root;
}
export function disposeArea(root){if(!root)return;root.traverse(o=>{if(o.userData?.keep)return;o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){m.map?.dispose();m.dispose();}});root.removeFromParent();}
/* v0.43 uzak ağaçlar: yakın pencerenin (örnek ağaç modelleri) dışında, gerçek ağaç ızgarasından (10 m hücre) tek çağrılı nokta bulutu.
   Uzak tepelerde korular ve dere boyu ağaçları üç boyutlu görünür; telefon için seyrekleştirilir. */
import {realArea} from './real-area.js';
export function createFarTrees(area,center,nearR,hideR=0){const ra=realArea(area);if(!ra||typeof document==='undefined')return null;
 /* v0.47 1 km'lik karolar: görüş dışındaki karo çizilmez, kameranın çevresindeki (3B ağaçlı) karolar gizlenir */
 const R=ra.R,step=LITE?20:10,TL=1000,tiles=new Map(),c=new T.Color();let n=0;const hh=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};
 for(let z=-R+5;z<R;z+=step)for(let x=-R+5;x<R;x+=step){if(Math.abs(x-center.x)<nearR-60&&Math.abs(z-center.z)<nearR-60)continue;const t=ra.treeCell(x,z);if(!t||t.d<.12)continue;if(hh(x,z)>t.d*(LITE?1.4:1.1))continue;
  const jx=x+(hh(z,x)-.5)*step,jz=z+(hh(x+7,z-3)-.5)*step,h=terrainHeight(jx,jz,area);const k=Math.floor(jx/TL)+':'+Math.floor(jz/TL);let tl=tiles.get(k);if(!tl)tiles.set(k,tl={pos:[],col:[],cx:(Math.floor(jx/TL)+.5)*TL,cz:(Math.floor(jz/TL)+.5)*TL});tl.pos.push(jx,h+3.2,jz);const v=.8+.4*hh(jx,jz);
  if(t.kind===1)c.setRGB(.10*v,.16*v,.07*v);else if(t.kind===2)c.setRGB(.06*v,.11*v,.07*v);else if(t.kind===3)c.setRGB(.13*v,.18*v,.08*v);else c.setRGB(.11*v,.14*v,.07*v);tl.col.push(c.r,c.g,c.b);n++;}
 const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d'),gr=x.createRadialGradient(32,30,4,32,32,30);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.7,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.beginPath();x.arc(32,32,30,0,6.283);x.fill();
 const tex=new T.CanvasTexture(cv);const m=new T.PointsMaterial({size:LITE?9:7.5,sizeAttenuation:true,vertexColors:true,map:tex,alphaTest:.35,transparent:false,fog:true});
 if(hideR>0){m.onBeforeCompile=sh=>{sh.uniforms.uHide={value:hideR};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uHide;').replace('#include <fog_vertex>','#include <fog_vertex>\n {float dC=distance((modelMatrix*vec4(transformed,1.)).xz,cameraPosition.xz);gl_PointSize*=smoothstep(uHide-120.,uHide,dC);}');};m.customProgramCacheKey=()=>'fartrees'+hideR;} /* kamera çevresinde 3B ağaçlar var: nokta bulutu orada çizilmez */
 const grp=new T.Group();grp.name='Uzak ağaçlar';const list=[];
 for(const tl of tiles.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(tl.pos,3));g.setAttribute('color',new T.Float32BufferAttribute(tl.col,3));g.computeBoundingSphere();const p=new T.Points(g,m);p.userData.c=[tl.cx,tl.cz];grp.add(p);list.push(p);}
 grp.userData.count=n;grp.userData.update=cam=>{if(!hideR)return;for(const p of list){const [cx,cz]=p.userData.c,d=Math.max(Math.abs(cam.x-cx),Math.abs(cam.z-cz))+TL/2;p.visible=Math.hypot(Math.abs(cam.x-cx)+TL/2,Math.abs(cam.z-cz)+TL/2)>hideR-130;}};return grp;}
