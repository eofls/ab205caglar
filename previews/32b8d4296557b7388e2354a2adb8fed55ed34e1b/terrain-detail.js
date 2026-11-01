import * as T from './vendor/three.module.js';
import {LITE} from './device-profile.js';
import {terrainHeight,landCoverAt,terrainColor,FEATURES,parcelKind,FOREST_ROADS,forestClearcuts,buildingHeightOf,runwayCoordinates,RUNWAY,trackOnU,trackOnV,FIELD_TRACK} from './terrain-data.js';
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
 const roadMat=new T.MeshStandardMaterial({color:'#c2b393',roughness:1}),pavedMat=new T.MeshStandardMaterial({color:'#5f5f5a',roughness:.95,polygonOffset:true,polygonOffsetFactor:-1}),taxiMat=new T.MeshStandardMaterial({color:'#5b5b56',roughness:.95}),lineMat=new T.MeshBasicMaterial({color:'#e2b72c'}),buckets=new Map();
 for(const f of features){
  if(f.tags.highway){const points=roadSamples(f.points),pos=[],ix=[],hw=f.tags.highway.replace('_link',''),width=Number(f.tags.width)||({track:3.5,taxiway:15,motorway:22,trunk:16,primary:12,secondary:10,tertiary:8,residential:6,unclassified:6,service:4,living_street:5,pedestrian:4}[hw]??5);for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len*width/2,nz=(b[0]-a[0])/len*width/2;for(const s of [-1,1]){const x=p[0]+s*nx,z=p[1]+s*nz;pos.push(x,height(x,z)+.12,z);}if(i){const k=i*2;ix.push(k-2,k-1,k,k-1,k+1,k);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ix);g.computeVertexNormals();const taxi=f.tags.highway==='taxiway';const paved=area==='airfield'?f.tags.highway!=='track':['motorway','trunk','primary','secondary','tertiary'].includes(hw);const m=new T.Mesh(g,taxi?taxiMat:paved?pavedMat:roadMat);m.material.side=T.DoubleSide;m.receiveShadow=true;group.add(m);
   if(taxi){const lp=[],li=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len*.2,nz=(b[0]-a[0])/len*.2;for(const s2 of [-1,1]){const x=p[0]+s2*nx,z=p[1]+s2*nz;lp.push(x,height(x,z)+.16,z);}if(i){const k=i*2;li.push(k-2,k-1,k,k-1,k+1,k);}}const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lp,3));lg.setIndex(li);const lm=new T.Mesh(lg,lineMat);lm.material.side=T.DoubleSide;group.add(lm);}}
  if(f.tags.aeroway==='apron'){const pts=f.points.slice(0,-1),shape=new T.Shape(pts.map(p=>new T.Vector2(p[0],-p[1]))),g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,height(p.getX(i),p.getZ(i))+.06);const ap=new T.Mesh(g,new T.MeshStandardMaterial({color:'#a8a69e',roughness:1,side:T.DoubleSide}));ap.receiveShadow=true;group.add(ap);}
  if(f.tags.building||f.tags.aeroway==='hangar'){if(f.tags.layer==='-1')continue;const pts=f.points.slice(0,-1);if(pts.length<3)continue;const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cz=pts.reduce((a,p)=>a+p[1],0)/pts.length,shape=new T.Shape(pts.map(p=>new T.Vector2(p[0]-cx,-(p[1]-cz)))),bh=buildingHeightOf(f);
   const g=new T.ExtrudeGeometry(shape,{depth:bh,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(cx,height(cx,cz)-.05,cz);const st=buildingStyle(f,cx,cz);for(const gr of g.groups)addPart(buckets,gr.materialIndex===0?st.roof:st.wall,g,gr);g.dispose();}
 }
 for(const b of buckets.values()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.nor,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));const m=new T.Mesh(geo,b.mat);m.castShadow=m.receiveShadow=true;m.name='Binalar';group.add(m);}
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
function mat(key,make){if(!MATS.has(key))MATS.set(key,make());return MATS.get(key);}
const STYLE={apt:{walls:['#ece5d3','#e8d3b4','#dccabb','#eeeae1','#e5cba9','#d9d2c4'],win:'#3f4c58',roofs:['#76797b','#9c5c45','#8b8d8c']},
 ind:{walls:['#cfd2d3','#bcc6cc','#d7d5cd','#aeb8bc','#dad6c8'],win:'#64788a',roofs:['#a3a8aa','#babcb8','#8e9597']},
 hangar:{walls:['#8e9486','#9ba1a0','#a3a596'],win:'#55605c',roofs:['#7d8483','#8a8f88']},
 other:{walls:['#ddd3bf','#e9e2d2','#d5c3a6','#e3dccd'],win:'#4a5661',roofs:['#9b5a43','#7e7f80','#a9674a','#8f8577']}};
function buildingStyle(f,cx,cz){const t=f.tags,b=t.building,kind=t.aeroway==='hangar'||b==='hangar'?'hangar':b==='apartments'?'apt':b==='industrial'||b==='warehouse'?'ind':'other',S=STYLE[kind],k=Math.abs(Math.sin(cx*12.9898+cz*78.233)*43758.5453)%1,k2=Math.abs(Math.sin(cx*39.3468+cz*11.135)*24634.6345)%1;
 const wall=S.walls[Math.floor(k*S.walls.length)],roof=S.roofs[Math.floor(k2*S.roofs.length)];
 return {wall:mat('w'+kind+wall,()=>new T.MeshStandardMaterial({color:'#ffffff',map:facadeTexture(kind,wall,S.win),roughness:kind==='ind'||kind==='hangar'?.7:.9,metalness:kind==='hangar'?.15:0})),roof:mat('r'+roof,()=>new T.MeshStandardMaterial({color:roof,roughness:.85}))};}
function addPart(buckets,material,geo,gr){let b=buckets.get(material);if(!b)buckets.set(material,b={mat:material,pos:[],nor:[],uv:[]});const P=geo.attributes.position.array,N=geo.attributes.normal.array,U=geo.attributes.uv.array,end=gr.start+gr.count;
 for(let i=gr.start;i<end;i++){b.pos.push(P[i*3],P[i*3+1],P[i*3+2]);b.nor.push(N[i*3],N[i*3+1],N[i*3+2]);b.uv.push(U[i*2],U[i*2+1]);}}
/* ---- v0.35 airfield ground (Güvercinlik): mowed grass inside the fence, perimeter road, built-up ground around the blocks,
   dry-green fields further out (instead of the bare tan "desert") ---- */
/* v0.37 Güvercinlik zemini: gerçek uydu görüntüsü (Sentinel-2 cloudless 2023, EOX — CC BY-NC-SA 4.0; Copernicus Sentinel
   verisi). Görüntü ±4 km'yi kaplar; zemin düzlemi ±3 km olduğundan ortası kırpılır. Yüklenene kadar eski çizim gösterilir. */
export function airfieldGroundTexture(){const t=airfieldGroundTextureDrawn();if(!t||typeof Image==='undefined')return t;const img=new Image();img.decoding='async';
 img.onload=()=>{const c=t.image,ctx=c.getContext('2d');if(!ctx)return;const s=img.width*(6000/8000),o=(img.width-s)/2;ctx.filter='saturate(0.8) contrast(1.06) brightness(0.98)';ctx.drawImage(img,o,o,s,s,0,0,c.width,c.height);ctx.filter='none'; /* v0.38.3 satellite colours toned to the eye: less orange, a little more contrast */t.needsUpdate=true;};img.src='assets/terrain/guvercinlik-s2.jpg';return t;}
/* v0.39 gerçek arazi / tepeler zemini: Sentinel-2 cloudless 2023 (EOX, CC BY-NC-SA 4.0), ±4.5 km, zemin düzlemiyle aynı kapsam */
export function realGroundTexture(area){if(typeof document==='undefined')return null;const N=LITE?2048:4096,c=document.createElement('canvas');c.width=c.height=N;const ctx=c.getContext('2d');if(!ctx)return null;ctx.fillStyle='#8c7b5c';ctx.fillRect(0,0,N,N);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;const img=new Image();img.decoding='async';
 img.onload=()=>{ctx.filter='saturate(0.72) hue-rotate(7deg) contrast(1.08) brightness(0.93)';ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,N,N);ctx.filter='none';
  /* fine field texture on top of the 4–10 m satellite pixels: soft furrows and mottling (not new features) */
  let seed=91;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<(LITE?12000:60000);i++){const x=rand()*N,y=rand()*N;ctx.fillStyle=rand()>.5?'rgba(255,255,255,.035)':'rgba(30,25,10,.05)';ctx.fillRect(x,y,1+rand()*3,1+rand()*2);}
  t.needsUpdate=true;};img.src='assets/terrain/'+(area==='mountain'?'tepeler':'golbasi')+'-s2.jpg';return t;}
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
