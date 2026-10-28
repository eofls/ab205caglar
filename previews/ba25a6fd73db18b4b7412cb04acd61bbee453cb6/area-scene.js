import {realGroundTexture,forestGroundTexture,airfieldGroundTexture} from './terrain-detail.js';
import {LITE} from './device-profile.js';
import {enhanceSurface,createWater,createHorizon,createForest,createAirfieldExtras,createPowerLines} from './environment.js';
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
export function makeAreaScene(area,center={x:0,z:0}){
 const root=new T.Group();root.name='Uçuş sahası '+area;
 const realG=area==='terrain'||area==='mountain',half=realG?4500:area==='airfield'?3000:4000, /* v0.39 orman ve su sahaları da büyütüldü (8 km) */res=LITE?(realG?220:160):realG?300:area==='forest'?300:200,geo=new T.PlaneGeometry(2*half,2*half,res,res);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,terrainHeight(x,z,area)-(area==='water'&&islandHeight(x,z)<=0?4:0)); /* v0.39 su altı zemini suyun 4 m altında: uzakta su ile zemin titreşmez */colors.push(...terrainColor(x,z,area));}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new T.Mesh(geo,enhanceSurface(new T.MeshStandardMaterial({vertexColors:!realG&&area!=='forest'&&area!=='airfield',map:realG?realGroundTexture(area):area==='forest'?forestGroundTexture():area==='airfield'?airfieldGroundTexture():null,roughness:area==='water'?.3:1}),{rock:area==='mountain'?.35:area==='terrain'?.2:0,snowLine:1e9,detail:area==='water'?.5:1}));ground.receiveShadow=true;ground.name='Zemin';root.add(ground);
 root.userData.time={value:0};if(typeof document!=='undefined'){root.add(createHorizon(area));root.add(createPowerLines(area));if(area==='water'){const water=createWater();root.add(water);root.userData.water=water;}if(area==='airfield'){const extras=createAirfieldExtras();root.add(extras);root.userData.airfield=extras;}}
 const objects=areaObjects(area,center);
 {const trees=objects.filter(o=>o.kind==='tree');if(trees.length)root.add(createForest(trees,{time:root.userData.time}));}
 // v0.33 boulders (same obstacles as collision / landing-zone assessment)
 {const R=LITE?800:1500,rocks=bouldersInBox(center.x-R,center.x+R,center.z-R,center.z+R,area);if(rocks.length){const m=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#8d877b',roughness:1,flatShading:true}),rocks.length),o=new T.Object3D();rocks.forEach((r,i)=>{o.position.set(r.x,terrainHeight(r.x,r.z,area)+r.height*.35,r.z);o.rotation.set(r.x*.13,r.z*.17,r.x*.07);o.scale.set(r.radius,r.height*.75,r.radius*.85);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.receiveShadow=true;m.castShadow=rocks.length<3000;root.add(m);}}
 if(area==='airfield')for(const o of objects){const g=new T.PlaneGeometry(o.width,o.length,1,o.kind==='runway'?100:1);g.rotateX(-Math.PI/2);g.rotateY(-RUNWAY.heading);g.translate(o.x,0,o.z);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(p.getX(i),p.getZ(i),area)+.08+(o.kind==='stripe'?.02:0));g.computeVertexNormals();root.add(new T.Mesh(g,o.kind==='runway'?enhanceSurface(new T.MeshStandardMaterial({color:'#4b4c48',roughness:.95,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}),{asphalt:true}):new T.MeshStandardMaterial({color:'#eee9d8',roughness:.95,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3})));}
 if(area==='airfield')for(const [label,along,turn] of [['06',-1008.5+28,0],['24',1008.5-28,Math.PI]]){const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(0,0,0,0)';x.clearRect(0,0,128,128);x.fillStyle='#f4f4ee';x.font='bold 84px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(label,64,66);const tex=new T.CanvasTexture(c);const g=new T.PlaneGeometry(14,14);g.rotateX(-Math.PI/2);g.rotateY(-(RUNWAY.heading+turn));const px=along*Math.sin(RUNWAY.heading),pz=-along*Math.cos(RUNWAY.heading);const m=new T.Mesh(g,new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4}));m.position.set(px,terrainHeight(px,pz,area)+.12,pz);root.add(m);}
 if(area==='airfield'){
  const H=RUNWAY.heading,sx=Math.sin(H),cz=-Math.cos(H),at=(al,off)=>{const x=al*sx+off*Math.cos(H),z=al*cz+off*Math.sin(H);return [x,terrainHeight(x,z,area),z];};
  const mat=new T.MeshStandardMaterial({color:'#eee9d8',roughness:.95});
  const strip=(al,off,w,l)=>{const g=new T.PlaneGeometry(w,l,1,1);g.rotateX(-Math.PI/2);g.rotateY(-H);const m=new T.Mesh(g,mat);const p=at(al,off);m.position.set(p[0],p[1]+.13,p[2]);m.material.polygonOffset=true;m.material.polygonOffsetFactor=-3;root.add(m);};
  for(const end of [-1,1])for(let k=-6;k<=6;k++){if(k===0)continue;strip(end*(1008.5-8),k*2.6,1.4,10);}
  HELI_PANELS.along.forEach((al,i)=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#5b5b56';x.fillRect(0,0,256,256);x.strokeStyle='rgba(238,236,226,.85)';x.lineWidth=5;x.strokeRect(10,10,236,236);x.fillStyle='rgba(238,236,226,.9)';x.font='bold 140px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('H',128,124);x.font='bold 40px sans-serif';x.fillText(String(i+1),128,222);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const g=new T.PlaneGeometry(HELI_PANELS.size,HELI_PANELS.size,4,4);g.rotateX(-Math.PI/2);g.rotateY(-H);const p=at(al,HELI_PANELS.across);g.translate(p[0],0,p[2]);const pa=g.attributes.position;for(let k=0;k<pa.count;k++)pa.setY(k,terrainHeight(pa.getX(k),pa.getZ(k),area)+.14);g.computeVertexNormals();root.add(new T.Mesh(g,new T.MeshStandardMaterial({map:tex,roughness:.95,polygonOffset:true,polygonOffsetFactor:-4})));}); /* v0.35.9 paneller asfalt (yol ile aynı), talimattaki yerlerinde */
  for(const end of [-1,1]){strip(end*(1008.5-300),-9,4,45);strip(end*(1008.5-300),9,4,45);}
  const lights=[];for(let a=-1000;a<=1000;a+=60)for(const off of [-19,19])lights.push(at(a,off));
  const lm=new T.InstancedMesh(new T.SphereGeometry(.35,8,6),new T.MeshBasicMaterial({color:'#ffe9a6'}),lights.length),o=new T.Object3D();
  lights.forEach((p,i)=>{o.position.set(p[0],p[1]+.4,p[2]);o.updateMatrix();lm.setMatrixAt(i,o.matrix);});root.add(lm);
  /* v0.39 ana pist ile emercensi pist (şerit) arasındaki temsili yol ve mavi ışıkları kaldırıldı */
 }
 return root;
}
export function disposeArea(root){if(!root)return;root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){m.map?.dispose();m.dispose();}});root.removeFromParent();}
