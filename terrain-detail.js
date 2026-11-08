import * as T from './vendor/three.module.js';
import {LITE} from './device-profile.js';
import {enhanceSurface,waterMaterial} from './environment.js';
import {terrainHeight,landCoverAt,terrainColor,FEATURES,parcelKind,FOREST_ROADS,forestClearcuts,buildingHeightOf,runwayCoordinates,RUNWAY,trackOnU,trackOnV,FIELD_TRACK,OPEN_FIELDS} from './terrain-data.js';
import {AIRFIELD_FEATURES} from './assets/terrain/guvercinlik-osm.js';
export function groundTexture(){
 if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=c.height=2048;const ctx=c.getContext('2d');if(!ctx)return null;
 const image=ctx.createImageData(2048,2048);let seed=205;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 // Fine surface variation is procedural, not satellite imagery.
 for(let y=0;y<2048;y++)for(let x=0;x<2048;x++){const n=(rand()-.5)*24+5*Math.sin(x*.22+y*.035),k=(y*2048+x)*4;image.data[k]=151+n;image.data[k+1]=140+n;image.data[k+2]=107+n;image.data[k+3]=255;}ctx.putImageData(image,0,0);
 const map=([x,z])=>[(x+3000)/6000*2048,(z+3000)/6000*2048];
 // v0.33: field parcels shared with the physics surface model (plowed field / stubble / grass)
 {const th=.21,c=Math.cos(th),s=Math.sin(th),U=260,V=170,col={field:'#8b6f4ea0',stubble:'#c4b07690',grass:'#86965c80'};for(let i=-16;i<=16;i++)for(let j=-24;j<=24;j++){const k=parcelKind(i,j),pts=[[i*U,j*V],[(i+1)*U,j*V],[(i+1)*U,(j+1)*V],[i*U,(j+1)*V]].map(([u,v])=>map([u*c-v*s,u*s+v*c]));ctx.beginPath();pts.forEach((q,n)=>n?ctx.lineTo(...q):ctx.moveTo(...q));ctx.closePath();ctx.fillStyle=col[k];ctx.fill();
  if(k==='field'){ctx.save();ctx.clip();ctx.strokeStyle='#5d4a3440';ctx.lineWidth=.6;const [ax,ay]=pts[0],[bx,by]=pts[1],[dx,dy]=pts[3];for(let f=0;f<1;f+=.06){ctx.beginPath();ctx.moveTo(ax+(dx-ax)*f,ay+(dy-ay)*f);ctx.lineTo(bx+(dx-ax)*f,by+(dy-ay)*f);ctx.stroke();}ctx.restore();}}}
 // v0.35 field roads along parcel edges (same lines as the physics surface)
 {const th=FIELD_TRACK.theta,c=Math.cos(th),s2=Math.sin(th),U=FIELD_TRACK.U,V=FIELD_TRACK.V,P=(u,v)=>map([u*c-v*s2,u*s2+v*c]);ctx.lineCap='round';
  for(const [w,col] of [[7.5,'#9c8a6488'],[4,'#c4b28c']]){ctx.strokeStyle=col;ctx.lineWidth=w*2048/6000;
   for(let i=-16;i<=16;i++)if(trackOnU(i)){ctx.beginPath();ctx.moveTo(...P(i*U,-24*V));ctx.lineTo(...P(i*U,24*V));ctx.stroke();}
   for(let j=-24;j<=24;j++)if(trackOnV(j)){ctx.beginPath();ctx.moveTo(...P(-16*U,j*V));ctx.lineTo(...P(16*U,j*V));ctx.stroke();}}}
 for(const f of FEATURES){if(!f.tags.natural&&!f.tags.landuse)continue;ctx.beginPath();f.points.forEach((p,i)=>{const q=map(p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.fillStyle=f.tags.natural==='wetland'?'#687052':'#a59a83';ctx.fill();}
 // Sparse mottled ground; actual field boundaries are not available.
 for(let i=0;i<25000;i++){const x=rand()*2048,y=rand()*2048;ctx.fillStyle=rand()>.5?'#ffffff08':'#2d32160b';ctx.fillRect(x,y,2+rand()*15,1+rand()*5);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;return tex;
}
// v0.33.1 managed-forest ground: stands from the shared world model at 12 m, roads and clear-cuts drawn crisp on top.
export function forestGroundTexture(){
 if(typeof document==='undefined')return null;const N=512,lo=document.createElement('canvas');lo.width=lo.height=N;const lx=lo.getContext('2d');if(!lx)return null;const img=lx.createImageData(N,N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-4000+(i+.5)*8000/N,z=-4000+(j+.5)*8000/N,c=terrainColor(x,z,'forest'),k=(j*N+i)*4;img.data[k]=c[0]*255;img.data[k+1]=c[1]*255;img.data[k+2]=c[2]*255;img.data[k+3]=255;}
 lx.putImageData(img,0,0);const c=document.createElement('canvas');c.width=c.height=2048;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.drawImage(lo,0,0,2048,2048);
 const map=(x,z)=>[(x+4000)/8000*2048,(z+4000)/8000*2048],px=2048/8000;let seed=77;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(const pts of forestClearcuts(4000)){ctx.beginPath();pts.forEach(([x,z],n)=>n?ctx.lineTo(...map(x,z)):ctx.moveTo(...map(x,z)));ctx.closePath();ctx.fillStyle='#6f6346';ctx.fill();ctx.save();ctx.clip();for(let k=0;k<160;k++){const [ax,ay]=map(pts[0][0],pts[0][1]),[bx,by]=map(pts[2][0],pts[2][1]),x=ax+(bx-ax)*rand(),y=ay+(by-ay)*rand();ctx.fillStyle=rand()>.5?'#4b4130':'#8a7c58';ctx.fillRect(x,y,1.2,1.2);}ctx.restore();}
 ctx.lineCap='round';ctx.lineJoin='round';
 FOREST_ROADS.forEach((r,k)=>{const line=[];for(let t=-4000;t<=4000;t+=20)line.push(r.along==='z'?map(r.f(t),t):map(t,r.f(t)));if(k===0){ctx.strokeStyle='#76824e';ctx.lineWidth=30*px;ctx.beginPath();line.forEach((q,n)=>n?ctx.lineTo(...q):ctx.moveTo(...q));ctx.stroke();}
  ctx.strokeStyle='#8f8466';ctx.lineWidth=6*px;ctx.beginPath();line.forEach((q,n)=>n?ctx.lineTo(...q):ctx.moveTo(...q));ctx.stroke();});
 for(let i=0;i<30000;i++){const x=rand()*2048,y=rand()*2048;ctx.fillStyle=rand()>.5?'#ffffff07':'#10180a10';ctx.fillRect(x,y,1+rand()*4,1+rand()*3);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;return tex;
}
// Short road segments conform to the DEM instead of bridging long slopes.
export function roadSamples(points,spacing=12){
 const out=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/spacing));for(let j=0;j<n;j++)out.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}if(points.length)out.push(points.at(-1));return out;
}
export function addTerrainDetail(scene,features=FEATURES,area="terrain"){
 const height=(x,z)=>terrainHeight(x,z,area);
 const group=new T.Group();group.name=area+' • DEM + OSM';scene.add(group);
 const roadMat=enhanceSurface(new T.MeshStandardMaterial({color:'#b5a585',roughness:1}),{detail:1.1}),pavedMat=enhanceSurface(new T.MeshStandardMaterial({color:'#56565a',roughness:.95,polygonOffset:true,polygonOffsetFactor:-1}),{asphalt:true,detail:1}),taxiMat=enhanceSurface(new T.MeshStandardMaterial({color:'#58585a',roughness:.95}),{asphalt:true,detail:1}), /* v0.43 yol ve taksi yolu: asfalt / toprak dokusu */lineMat=new T.MeshBasicMaterial({color:'#e2b72c'}),buckets=new Map(),marks=[],lampRoads=[];
 for(const f of features){
  if(f.tags.highway){const points=roadSamples(f.points),pos=[],ix=[],hw=f.tags.highway.replace('_link',''),width=Number(f.tags.width)||({track:3.5,taxiway:15,motorway:22,trunk:16,primary:12,secondary:10,tertiary:8,residential:6,unclassified:6,service:4,living_street:5,pedestrian:4}[hw]??5);for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len*width/2,nz=(b[0]-a[0])/len*width/2;for(const s of [-1,1]){const x=p[0]+s*nx,z=p[1]+s*nz;pos.push(x,height(x,z)+.12,z);}if(i){const k=i*2;ix.push(k-2,k-1,k,k-1,k+1,k);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();const taxi=f.tags.highway==='taxiway';if(!taxi&&['motorway','trunk','primary','secondary','tertiary'].includes(hw)&&width>=7)marks.push({points,width});if(!taxi&&f.tags.highway!=='track'&&['motorway','trunk','primary','secondary','tertiary','residential','unclassified','living_street'].includes(hw))lampRoads.push({points,width});const paved=area==='airfield'?f.tags.highway!=='track':['motorway','trunk','primary','secondary','tertiary'].includes(hw);const m=new T.Mesh(g,taxi?taxiMat:paved?pavedMat:roadMat);m.material.side=T.DoubleSide;m.receiveShadow=true;group.add(m);
   if(taxi){const lp=[],li=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len*.2,nz=(b[0]-a[0])/len*.2;for(const s2 of [-1,1]){const x=p[0]+s2*nx,z=p[1]+s2*nz;lp.push(x,height(x,z)+.16,z);}if(i){const k=i*2;li.push(k-2,k-1,k,k-1,k+1,k);}}const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lp,3));lg.setIndex(li);const lm=new T.Mesh(lg,lineMat);lm.material.side=T.DoubleSide;group.add(lm);}}
  if((f.tags.natural==='water'||f.tags.water)&&f.points.length>3){/* v0.43 göl / gölet yüzeyi: su malzemesi (gökyüzü yansıması, güneş parıltısı, rüzgâr dalgası) */const pts=f.points.slice(0,-1),lvl=Math.min(...pts.map(p=>height(p[0],p[1]))),shape=new T.Shape(pts.map(p=>new T.Vector2(p[0],-p[1]))),g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,lvl+.35,0);const wm=new T.Mesh(g,waterMaterial(false));wm.name='Gölet';wm.renderOrder=1;group.add(wm);continue;}
  if(f.tags.aeroway==='apron'){const pts=f.points.slice(0,-1),shape=new T.Shape(pts.map(p=>new T.Vector2(p[0],-p[1]))),g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,height(p.getX(i),p.getZ(i))+.06);const ap=new T.Mesh(g,new T.MeshStandardMaterial({color:'#a8a69e',roughness:1,side:T.DoubleSide}));ap.receiveShadow=true;group.add(ap);}
  if(f.tags.building||f.tags.aeroway==='hangar'){if(f.tags.layer==='-1')continue;const pts=f.points.slice(0,-1);if(pts.length<3)continue;const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cz=pts.reduce((a,p)=>a+p[1],0)/pts.length,shape=new T.Shape(pts.map(p=>new T.Vector2(p[0]-cx,-(p[1]-cz)))),bh=buildingHeightOf(f);if(!Number.isFinite(bh)||!Number.isFinite(height(cx,cz))||pts.some(p=>!Number.isFinite(p[0])||!Number.isFinite(p[1])))continue; /* v0.43 NaN yükseklikli yapı birleşik bina ağını bozmasın */
   const st=buildingStyle(f,cx,cz),hip=barrelRoof(pts,f,bh)??hipRoof(pts,f,bh);
   const g=new T.ExtrudeGeometry(shape,{depth:bh,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(cx,height(cx,cz)-.05,cz);for(const gr of g.groups)addPart(buckets,gr.materialIndex===0?(hip?st.wall:st.roof):st.wall,g,gr);g.dispose();
   if(hip){const rg=hip.geo;rg.translate(0,height(cx,cz)-.05+bh,0);addPart(buckets,hip.mat==='metal'?mat('hgroof',()=>new T.MeshStandardMaterial({color:'#8d9493',roughness:.55,metalness:.35})):tileRoofMat(cx,cz),rg,{start:0,count:rg.attributes.position.count});rg.dispose();}}
 }
 if(marks.length&&typeof document!=='undefined')group.add(roadMarkings(marks,height));if(lampRoads.length&&typeof document!=='undefined')group.add(streetLamps(lampRoads,height)); /* v0.44 asfalt yolda kesik orta çizgi ve kenar çizgileri */
 for(const b of buckets.values()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.nor,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));geo.setAttribute('baseY',new T.Float32BufferAttribute(b.base,1));const m=new T.Mesh(geo,b.mat);m.castShadow=m.receiveShadow=true;m.name='Binalar';group.add(m);}
 return group; /* v0.39 rastgele çalı / kaya ızgarası kaldırıldı: ağaçlar ve kayalar dünya modelinden gelir */
 const o=new T.Object3D(),rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#8a8374',roughness:1}),500),bushes=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#74794c',roughness:1}),1600);
 for(const [m,count] of [[rocks,500],[bushes,1600]]){for(let i=0;i<count;i++){const x=((i*149.71)%2800)-1400,z=((i*239.53)%3600)-1800,wet=landCoverAt(x,z)==='wetland',rock=m===rocks,k=.4+(i%9)*.15;o.position.set(x,height(x,z)+(rock?.14:.35),z);o.rotation.set(.08*(i%3),i*2.399,.03*(i%5));o.scale.set(k,k*(rock?.28:wet?1.1:.55),k*.8);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.castShadow=m.receiveShadow=true;group.add(m);}
 return group;
}

/* ---- v0.35 buildings: facade textures (windows, ribbed sheet metal), varied colours; one merged mesh per material ---- */
const FACADES=new Map(),MATS=new Map();
function facadeTexture(kind,wall,win){const key=kind+wall+win;if(FACADES.has(key))return FACADES.get(key);if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');if(!x)return null;x.fillStyle=wall;x.fillRect(0,0,128,128);
 if(kind==='apt'){for(let f=0;f<2;f++){x.fillStyle='rgba(0,0,0,.07)';x.fillRect(0,f*64+56,128,8);for(let w=0;w<2;w++){x.fillStyle=win;x.fillRect(10+w*64,f*64+12,40,32);x.fillStyle='rgba(255,255,255,.22)';x.fillRect(10+w*64,f*64+12,40,5);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(29+w*64,f*64+12,2,32);}}}
 else if(kind==='ind'){for(let i=0;i<128;i+=8){x.fillStyle='rgba(0,0,0,.08)';x.fillRect(i,0,3,128);x.fillStyle='rgba(255,255,255,.07)';x.fillRect(i+3,0,2,128);}x.fillStyle=win;x.fillRect(0,20,128,12);}
 else if(kind==='hangar'){for(let i=0;i<128;i+=6){x.fillStyle='rgba(0,0,0,.09)';x.fillRect(i,0,2,128);}x.fillStyle='rgba(0,0,0,.12)';x.fillRect(0,0,128,10);}
 else{x.fillStyle=win;x.fillRect(20,34,30,34);x.fillRect(78,34,30,34);x.fillStyle='rgba(0,0,0,.08)';x.fillRect(0,112,128,16);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(20,34,30,4);x.fillRect(78,34,30,4);}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(1/6,1/6);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;FACADES.set(key,t);return t;}
/* v0.46 gece pencere ışıkları: pencere yerleri cephe dokusuyla aynı, 4×4 döşemede rastgele yanan pencereler (24 m'de bir tekrar) */
const NIGHT_TEX=new Map(),WALL_MATS=new Set(),STREET=new Set();
function nightTexture(kind){if(NIGHT_TEX.has(kind))return NIGHT_TEX.get(kind);if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,512,512);let sd=kind.length*97+13;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
 const lit=(px,py,w,h)=>{if(r()<(kind==='apt'?.42:kind==='other'?.3:.18)){const warm=r()<.75;x.fillStyle=warm?`rgb(${230+r()*25|0},${170+r()*40|0},${90+r()*40|0})`:`rgb(${170+r()*30|0},${190+r()*30|0},${220+r()*30|0})`;x.fillRect(px,py,w,h);}};
 for(let ty=0;ty<4;ty++)for(let tx=0;tx<4;tx++){const ox=tx*128,oy=ty*128;if(kind==='apt'){for(let f=0;f<2;f++)for(let w=0;w<2;w++)lit(ox+10+w*64,oy+f*64+12,40,32);}else if(kind==='ind'){if(r()<.3){x.fillStyle='rgb(200,210,220)';x.fillRect(ox,oy+20,128,12);}}else if(kind==='hangar'){}else{lit(ox+20,oy+34,30,34);lit(ox+78,oy+34,30,34);}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(1/24,1/24);t.colorSpace=T.SRGBColorSpace;NIGHT_TEX.set(kind,t);return t;}
export function setNightLights(v){for(const m of WALL_MATS){m.emissiveIntensity=v*1.4;m.emissive.set(v>0?'#ffffff':'#000000');}for(const p of STREET){p.visible=v>.05;p.material.opacity=Math.min(1,v*1.1);}}
/* v0.44 yol çizgileri: orta (3 m çizgi / 6 m boşluk) ve kenar şeritleri; tek ağ, kesikler dokunun saydamlığıyla */
let DASH=null;function dashTex(){if(DASH)return DASH;const c=document.createElement('canvas');c.width=8;c.height=64;const x=c.getContext('2d');x.clearRect(0,0,8,64);x.fillStyle='#f2f0e6';x.fillRect(0,0,8,21);DASH=new T.CanvasTexture(c);DASH.wrapS=DASH.wrapT=T.RepeatWrapping;DASH.colorSpace=T.SRGBColorSpace;return DASH;}
function roadMarkings(list,height){const pos=[],uv=[],ix=[],pos2=[],ix2=[];
 const strip=(P,ix,uvA,points,off,w,dash)=>{let base=P.length/3,acc=0;for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len,nz=(b[0]-a[0])/len;if(i)acc+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);for(const s of [-1,1]){const x=p[0]+nx*(off+s*w/2),z=p[1]+nz*(off+s*w/2);P.push(x,height(x,z)+.16,z);if(uvA)uvA.push(s<0?0:1,acc/9);}if(i){const k=base+i*2;ix.push(k-2,k-1,k,k-1,k+1,k);}}};
 for(const r of list){strip(pos,ix,uv,r.points,0,.15,true);strip(pos2,ix2,null,r.points,r.width/2-.35,.18);strip(pos2,ix2,null,r.points,-(r.width/2-.35),.18);}
 const g=new T.Group();g.name='Yol çizgileri';
 const g1=new T.BufferGeometry();g1.setAttribute('position',new T.Float32BufferAttribute(pos,3));g1.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g1.setIndex(ix);g1.computeVertexNormals();
 g.add(new T.Mesh(g1,new T.MeshStandardMaterial({color:'#ffffff',map:dashTex(),alphaTest:.5,roughness:.8,polygonOffset:true,polygonOffsetFactor:-3,side:T.DoubleSide})));
 const g2=new T.BufferGeometry();g2.setAttribute('position',new T.Float32BufferAttribute(pos2,3));g2.setIndex(ix2);g2.computeVertexNormals();
 g.add(new T.Mesh(g2,new T.MeshStandardMaterial({color:'#e9e7dd',roughness:.85,polygonOffset:true,polygonOffsetFactor:-3,side:T.DoubleSide})));return g;}
/* v0.46 sokak lambaları: asfalt yol kenarında ≈38 m'de bir turuncu ışık (yalnız gece / gün batımında görünür) */
function streetLamps(list,height){const pos=[];for(const r of list){let acc=0,side=1;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!L)continue;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;for(let d=(38-acc%38)%38;d<L;d+=38){const off=(r.width/2+1)*side;side=-side;const x=a[0]+ux*d-uz*off,z=a[1]+uz*d+ux*off;pos.push(x,height(x,z)+8,z);}acc+=L;}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,240,200,1)');gr.addColorStop(.25,'rgba(255,180,90,.85)');gr.addColorStop(1,'rgba(255,150,60,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);
 const m=new T.PointsMaterial({size:9,sizeAttenuation:true,map:new T.CanvasTexture(c),transparent:true,depthWrite:false,blending:T.AdditiveBlending,color:'#ffd9a8',fog:true,opacity:1});const p=new T.Points(g,m);p.name='Sokak lambaları';p.visible=false;STREET.add(p);p.userData.count=pos.length/3;return p;}
/* v0.44 kırma çatı: küçük, dikdörtgene yakın evlerde kiremit kaplı kırma çatı (köy ve meydan çevresi evleri). Taban
   dikdörtgen değilse ya da yapı büyük / çok katlıysa düz çatı kalır. */
/* v0.44 hangar: dikdörtgen tabanda kemerli (beşik tonoz) çatı, uzun eksen boyunca */
function barrelRoof(pts,f,bh){const t=f.tags;if(!(t.aeroway==='hangar'||t.building==='hangar'))return null;if(pts.length!==4)return null;const P=pts,e=[0,1,2,3].map(i=>Math.hypot(P[(i+1)%4][0]-P[i][0],P[(i+1)%4][1]-P[i][1]));const long=e[0]>=e[1]?0:1,L=e[long],W=e[1-long];if(W<8)return null;
 const ux=(P[long+1][0]-P[long][0])/L,uz=(P[long+1][1]-P[long][1])/L,vx=-uz,vz=ux,cx=P.reduce((s,q)=>s+q[0],0)/4,cz=P.reduce((s,q)=>s+q[1],0)/4,H=W*.22,seg=12,pos=[],uv=[];
 const pt=(a,k)=>{const th=Math.PI*k/seg,w=-Math.cos(th)*W/2,y=Math.sin(th)*H;return [cx+ux*a+vx*w,y,cz+uz*a+vz*w];};
 for(let k=0;k<seg;k++){const a0=pt(-L/2,k),a1=pt(-L/2,k+1),b0=pt(L/2,k),b1=pt(L/2,k+1);pos.push(...a0,...b0,...b1,...a0,...b1,...a1);for(let q=0;q<6;q++)uv.push(0,0);
  pos.push(...pt(-L/2,k),...pt(-L/2,k+1),cx-ux*L/2,0,cz-uz*L/2,...pt(L/2,k+1),...pt(L/2,k),cx+ux*L/2,0,cz+uz*L/2);for(let q=0;q<6;q++)uv.push(0,0);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
 {const n=g.attributes.normal,p=g.attributes.position;for(let i=0;i<n.count;i+=3){const mx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3-cx,my=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3+.01,mz=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3-cz;if(n.getX(i)*mx+n.getY(i)*my+n.getZ(i)*mz<0){for(let k=0;k<3;k++)n.setXYZ(i+k,-n.getX(i+k),-n.getY(i+k),-n.getZ(i+k));const ax=p.getX(i+1),ay=p.getY(i+1),az=p.getZ(i+1);p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,ax,ay,az);}}}
 return {geo:g,mat:'metal'};}
function hipRoof(pts,f,bh){const b=f.tags.building;if(!['house','yes','residential','detached','farm','semidetached_house','bungalow','shed','barn','garage'].includes(b))return null;if(bh>9)return null;
 const P=pts.length===4?pts:null;if(!P)return null;const e=[0,1,2,3].map(i=>Math.hypot(P[(i+1)%4][0]-P[i][0],P[(i+1)%4][1]-P[i][1]));
 for(let i=0;i<4;i++){const a=P[i],b2=P[(i+1)%4],c=P[(i+2)%4],v1=[b2[0]-a[0],b2[1]-a[1]],v2=[c[0]-b2[0],c[1]-b2[1]],cos=(v1[0]*v2[0]+v1[1]*v2[1])/(Math.hypot(...v1)*Math.hypot(...v2)||1);if(Math.abs(cos)>.2)return null;}
 const area=e[0]*e[1];if(area>320||area<18)return null;const long=e[0]>=e[1]?0:1,L=e[long],W=e[1-long];
 const ux=(P[long+1][0]-P[long][0])/L,uz=(P[long+1][1]-P[long][1])/L,vx=-uz,vz=ux,cx=P.reduce((s,q)=>s+q[0],0)/4,cz=P.reduce((s,q)=>s+q[1],0)/4,h=Math.min(3.2,W*.36),ov=.35,hl=L/2+ov,hw=W/2+ov,r=Math.max(0,hl-hw);
 const C=(a,w,y)=>[cx+ux*a+vx*w,y,cz+uz*a+vz*w],c0=C(-hl,-hw,0),c1=C(hl,-hw,0),c2=C(hl,hw,0),c3=C(-hl,hw,0),r0=C(-r,0,h),r1=C(r,0,h),pos=[],uv=[];
 const tri=(a,b,c)=>{pos.push(...a,...b,...c);uv.push(a[0]*.3,a[2]*.3,b[0]*.3,b[2]*.3,c[0]*.3,c[2]*.3);};
 /* dört yüz; yönler dışa bakar (saat yönü kontrolü normal hesabında) */
 tri(c0,c1,r1);tri(c0,r1,r0);tri(c2,c3,r0);tri(c2,r0,r1);tri(c1,c2,r1);tri(c3,c0,r0);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
 {const n=g.attributes.normal,p=g.attributes.position;for(let i=0;i<n.count;i+=3){const mx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3-cx,mz=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3-cz;if(n.getX(i)*mx+n.getZ(i)*mz<0){for(let k=0;k<3;k++)n.setXYZ(i+k,-n.getX(i+k),-n.getY(i+k),-n.getZ(i+k));const ax=p.getX(i+1),ay=p.getY(i+1),az=p.getZ(i+1);p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,ax,ay,az);}}}
 return {geo:g};}
let TILE=null;function tileTexture(){if(TILE||typeof document==='undefined')return TILE;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#b8b8b8';x.fillRect(0,0,128,128);
 for(let y=0;y<128;y+=8){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(0,y+6,128,2);for(let k=0;k<128;k+=10){x.fillStyle=`rgba(${Math.random()<.5?255:0},${Math.random()<.5?255:0},0,.07)`;x.fillRect(k+(y/8%2)*5,y,9,6);x.fillStyle='rgba(0,0,0,.12)';x.fillRect(k+(y/8%2)*5,y,1,6);}}
 TILE=new T.CanvasTexture(c);TILE.wrapS=TILE.wrapT=T.RepeatWrapping;TILE.colorSpace=T.SRGBColorSpace;TILE.anisotropy=4;return TILE;}
const TILE_COLS=['#a24f36','#9a4a33','#b05b3d','#8f4632','#a8613f','#7f4636'];
function tileRoofMat(cx,cz){const k=Math.abs(Math.sin(cx*7.13+cz*3.71)*15731.7)%1,col=TILE_COLS[Math.floor(k*TILE_COLS.length)];return mat('tile'+col,()=>new T.MeshStandardMaterial({color:col,map:tileTexture(),roughness:.85}));}
/* v0.47 düz çatı dokusu: membran / beton panel izleri, lekeler, kenarda koyu parapet hissi (ekstrüzyon üst yüzü metre ölçekli uv) */
let ROOFT=null;function roofTexture(){if(ROOFT||typeof document==='undefined')return ROOFT;const N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');x.fillStyle='#d8d8d8';x.fillRect(0,0,N,N);let sd=71;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
 for(let i=0;i<N;i+=32){x.fillStyle='rgba(0,0,0,.06)';x.fillRect(i,0,2,N);x.fillRect(0,i,N,2);}
 for(let i=0;i<40;i++){const px=r()*N,py=r()*N,rad=6+r()*30;const g=x.createRadialGradient(px,py,0,px,py,rad);g.addColorStop(0,`rgba(${r()<.5?60:255},${r()<.5?60:250},${r()<.5?55:240},${.06+r()*.1})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-rad,py-rad,rad*2,rad*2);}
 for(let i=0;i<14;i++){x.fillStyle='rgba(70,72,74,.55)';const px=r()*N,py=r()*N;x.fillRect(px,py,4+r()*6,3+r()*5);} /* çatı üstü cihazlar */
 ROOFT=new T.CanvasTexture(c);ROOFT.wrapS=ROOFT.wrapT=T.RepeatWrapping;ROOFT.repeat.set(1/24,1/24);ROOFT.colorSpace=T.SRGBColorSpace;ROOFT.anisotropy=4;return ROOFT;}
function mat(key,make){if(!MATS.has(key))MATS.set(key,make());return MATS.get(key);}
const STYLE={apt:{walls:['#ece5d3','#e8d3b4','#dccabb','#eeeae1','#e5cba9','#d9d2c4'],win:'#3f4c58',roofs:['#76797b','#9c5c45','#8b8d8c']},
 ind:{walls:['#cfd2d3','#bcc6cc','#d7d5cd','#aeb8bc','#dad6c8','#c9c1b0'],win:'#64788a',roofs:['#8f9597','#a3a8aa','#6f7c84','#5d6b78','#8a5a48','#9a9c96']},
 hangar:{walls:['#8e9486','#9ba1a0','#a3a596'],win:'#55605c',roofs:['#7d8483','#8a8f88']},
 other:{walls:['#ddd3bf','#e9e2d2','#d5c3a6','#e3dccd'],win:'#4a5661',roofs:['#9b5a43','#7e7f80','#a9674a','#8f8577']}};
function buildingStyle(f,cx,cz){const t=f.tags,b=t.building,kind=t.aeroway==='hangar'||b==='hangar'?'hangar':b==='apartments'?'apt':b==='industrial'||b==='warehouse'?'ind':'other',S=STYLE[kind],k=Math.abs(Math.sin(cx*12.9898+cz*78.233)*43758.5453)%1,k2=Math.abs(Math.sin(cx*39.3468+cz*11.135)*24634.6345)%1;
 const wall=S.walls[Math.floor(k*S.walls.length)],roof=S.roofs[Math.floor(k2*S.roofs.length)];
 return {wall:mat('w'+kind+wall,()=>{const m=weatherWall(new T.MeshStandardMaterial({color:'#ffffff',map:facadeTexture(kind,wall,S.win),emissiveMap:nightTexture(kind),emissive:'#000000',emissiveIntensity:0,roughness:kind==='ind'||kind==='hangar'?.7:.9,metalness:kind==='hangar'?.15:0}));WALL_MATS.add(m);return m;}),roof:mat('r'+roof,()=>new T.MeshStandardMaterial({color:roof,map:roofTexture(),roughness:.85}))};}
function addPart(buckets,material,geo,gr){let b=buckets.get(material);if(!b)buckets.set(material,b={mat:material,pos:[],nor:[],uv:[],base:[]});const P=geo.attributes.position.array,N=geo.attributes.normal.array,U=geo.attributes.uv.array,end=gr.start+gr.count;
 let y0=Infinity;for(let i=1;i<P.length;i+=3)y0=Math.min(y0,P[i]);
 for(let i=gr.start;i<end;i++){b.pos.push(P[i*3],P[i*3+1],P[i*3+2]);b.nor.push(N[i*3],N[i*3+1],N[i*3+2]);b.uv.push(U[i*2],U[i*2+1]);b.base.push(y0);}}
/* v0.43 bina duvarı: zemine yakın kısım kirli / gölgeli (temas gölgesi), yüzeyde hafif lekelenme — bina zemine oturur */
function weatherWall(m){m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float baseY;varying float vHb;varying vec3 vWp;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;vHb=vWp.y-baseY;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vHb;varying vec3 vWp;').replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*=mix(.58,1.,smoothstep(0.,2.2,vHb));{float n=fract(sin(dot(floor(vWp.xz*.7+vWp.y*.9),vec2(12.9898,78.233)))*43758.5453);diffuseColor.rgb*=.94+.08*n;}');};m.customProgramCacheKey=()=>'wall-weather';return m;}
/* ---- v0.35 airfield ground (Güvercinlik): mowed grass inside the fence, perimeter road, built-up ground around the blocks,
   dry-green fields further out (instead of the bare tan "desert") ---- */
/* v0.37 Güvercinlik zemini: gerçek uydu görüntüsü (Sentinel-2 cloudless 2023, EOX — CC BY-NC-SA 4.0; Copernicus Sentinel
   verisi). Görüntü ±4 km'yi kaplar; zemin düzlemi ±3 km olduğundan ortası kırpılır. Yüklenene kadar eski çizim gösterilir. */
/* v0.43.1 uydu görüntüsü keskinleştirmesi önceden yapılır: claude/tools/bake_sharpen.py (*-s2k.jpg) */
export function airfieldGroundTexture(){const t=airfieldGroundTextureDrawn();if(!t||typeof Image==='undefined')return t;const img=new Image();img.decoding='async';
 img.onload=()=>{const c=t.image,ctx=c.getContext('2d');if(!ctx)return;const s=img.width*(6000/8000),o=(img.width-s)/2;ctx.filter='saturate(0.8) hue-rotate(6deg) contrast(1.06) brightness(1.04)';ctx.drawImage(img,o,o,s,s,0,0,c.width,c.height);ctx.filter='none'; /* v0.43.1 keskinleştirme önceden yapıldı (claude/tools/bake_sharpen.py) */ /* v0.38.3 satellite colours toned to the eye: less orange, a little more contrast */t.needsUpdate=true;};img.src='assets/terrain/guvercinlik-s2k.jpg';return t;}
/* v0.39 gerçek arazi / tepeler zemini: Sentinel-2 cloudless 2023 (EOX, CC BY-NC-SA 4.0), ±4.5 km, zemin düzlemiyle aynı kapsam */
export function realGroundTexture(area){if(typeof document==='undefined')return null;const N=LITE?2048:4096,c=document.createElement('canvas');c.width=c.height=N;const ctx=c.getContext('2d');if(!ctx)return null;ctx.fillStyle='#8c7b5c';ctx.fillRect(0,0,N,N);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;const img=new Image();img.decoding='async';
 img.onload=()=>{ctx.filter='saturate(0.66) hue-rotate(9deg) contrast(1.12) brightness(0.95)'; /* v0.43 bozkır renkleri: biraz daha kontrast ve doygunluk */ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,N,N);ctx.filter='none'; /* v0.43.1 keskinleştirme önceden yapıldı */
  /* fine field texture on top of the 4–10 m satellite pixels: soft furrows and mottling (not new features) */
  let seed=91;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<(LITE?12000:60000);i++){const x=rand()*N,y=rand()*N;ctx.fillStyle=rand()>.5?'rgba(255,255,255,.035)':'rgba(30,25,10,.05)';ctx.fillRect(x,y,1+rand()*3,1+rand()*2);}
  /* v0.52 kullanıcı işaretlemesi: ağaçsız düz yeşil alan (OPEN_FIELDS) uydu dokusunun üstüne çayır olarak boyanır */
  {const half=area==='mountain'?6500:4500;for(const f of OPEN_FIELDS[area]??[]){const px=(f.x+half)/(2*half)*N,py=(f.z+half)/(2*half)*N,rx=f.rx/(2*half)*N,rz=f.rz/(2*half)*N;ctx.save();ctx.translate(px,py);ctx.scale(1,rz/rx);const g=ctx.createRadialGradient(0,0,rx*.2,0,0,rx);g.addColorStop(0,'rgba(112,128,66,.72)');g.addColorStop(.75,'rgba(116,128,68,.62)');g.addColorStop(1,'rgba(120,126,70,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rx,0,6.2832);ctx.fill();ctx.restore();
   for(let i=0;i<(LITE?600:2400);i++){const a=rand()*6.2832,r=Math.sqrt(rand())*.85;ctx.fillStyle=rand()>.5?'rgba(140,160,80,.12)':'rgba(60,82,34,.12)';ctx.fillRect(px+Math.cos(a)*r*rx,py+Math.sin(a)*r*rz,1+rand()*3,1+rand()*2);}}}
  t.needsUpdate=true;};img.src='assets/terrain/'+(area==='mountain'?'tepeler':'golbasi')+'-s2k.jpg';return t;}
export function airfieldWideTexture(){if(typeof document==='undefined')return null;const tex=new T.TextureLoader().load('assets/terrain/guvercinlik-s2-genis.jpg');tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.ClampToEdgeWrapping;tex.anisotropy=4;return tex;}
function airfieldGroundTextureDrawn(){
 if(typeof document==='undefined')return null;const N=512,lo=document.createElement('canvas');lo.width=lo.height=N;const lx=lo.getContext('2d');if(!lx)return null;const img=lx.createImageData(N,N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-3000+(i+.5)*6000/N,z=-3000+(j+.5)*6000/N,c=terrainColor(x,z,'airfield'),k=(j*N+i)*4;img.data[k]=c[0]*255;img.data[k+1]=c[1]*255;img.data[k+2]=c[2]*255;img.data[k+3]=255;}
 lx.putImageData(img,0,0);const c=document.createElement('canvas');c.width=c.height=2048;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.drawImage(lo,0,0,2048,2048);
 const px=2048/6000,map=(x,z)=>[(x+3000)*px,(z+3000)*px],H=RUNWAY.heading,rw=(a,o)=>map(a*Math.sin(H)+o*Math.cos(H),-a*Math.cos(H)+o*Math.sin(H));let seed=31;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 // fields outside the fence: rotated parcels, greens and straw
 {const th=.18,co=Math.cos(th),si=Math.sin(th),U=210,V=150,cols=['#7d8c4d','#8f9255','#a39360','#6f8447','#9a8a5a','#85904f'];for(let i=-15;i<=15;i++)for(let j=-21;j<=21;j++){const pts=[[i*U,j*V],[(i+1)*U,j*V],[(i+1)*U,(j+1)*V],[i*U,(j+1)*V]].map(([u,v])=>[u*co-v*si,u*si+v*co]);const mid=pts.reduce((a,p)=>[a[0]+p[0]/4,a[1]+p[1]/4],[0,0]),q=runwayCoordinates(mid[0],mid[1]);if(Math.abs(q.across)<300&&Math.abs(q.along)<1250)continue;
  ctx.beginPath();pts.forEach((p,n)=>{const m=map(p[0],p[1]);n?ctx.lineTo(...m):ctx.moveTo(...m);});ctx.closePath();ctx.fillStyle=cols[Math.floor(rand()*cols.length)]+'b0';ctx.fill();}}
 // inside the fence: mowed grass with stripes along the runway
 ctx.save();ctx.beginPath();[[-1180,-235],[1180,-235],[1180,235],[-1180,235]].forEach(([a,o],n)=>{const m=rw(a,o);n?ctx.lineTo(...m):ctx.moveTo(...m);});ctx.closePath();ctx.fillStyle='#64803f';ctx.fill();ctx.clip();
 for(let a=-1180;a<1180;a+=14){if(((a+1180)/14|0)%2)continue;ctx.beginPath();[[a,-235],[a+14,-235],[a+14,235],[a,235]].forEach(([u,o],n)=>{const m=rw(u,o);n?ctx.lineTo(...m):ctx.moveTo(...m);});ctx.closePath();ctx.fillStyle='#71904866';ctx.fill();}
 ctx.restore();
 // built-up ground around the blocks (yards, car parks, streets)
 ctx.lineJoin='round';for(const f of AIRFIELD_FEATURES){if(!f.tags.building&&f.tags.aeroway!=='hangar')continue;ctx.beginPath();f.points.forEach((p,n)=>{const m=map(p[0],p[1]);n?ctx.lineTo(...m):ctx.moveTo(...m);});ctx.closePath();ctx.strokeStyle='#a9a598';ctx.lineWidth=26*px;ctx.stroke();ctx.fillStyle='#a9a598';ctx.fill();}
 for(const f of AIRFIELD_FEATURES){if(!f.tags.building&&f.tags.aeroway!=='hangar')continue;ctx.beginPath();f.points.forEach((p,n)=>{const m=map(p[0],p[1]);n?ctx.lineTo(...m):ctx.moveTo(...m);});ctx.closePath();ctx.strokeStyle='#8f8c84';ctx.lineWidth=8*px;ctx.stroke();}
 // perimeter road / fence line
 ctx.strokeStyle='#8a877c';ctx.lineWidth=7*px;ctx.beginPath();[[-1185,-240],[1185,-240],[1185,240],[-1185,240],[-1185,-240]].forEach(([a,o],n)=>{const m=rw(a,o);n?ctx.lineTo(...m):ctx.moveTo(...m);});ctx.stroke();
 for(let i=0;i<40000;i++){const x=rand()*2048,y=rand()*2048;ctx.fillStyle=rand()>.5?'#ffffff08':'#1c240f10';ctx.fillRect(x,y,1+rand()*5,1+rand()*3);}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;return tex;}
