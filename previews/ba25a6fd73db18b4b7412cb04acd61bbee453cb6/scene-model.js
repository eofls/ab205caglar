import * as T from './vendor/three.module.js';
import {LITE} from './device-profile.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
/* v0.38 — the helicopter is the user's supplied Jandarma UH-1 / AB-205 model (UH1_Jandarma_Iki_Pilot: geometry, UVs,
   textures and materials as supplied, converted from its FBX), fitted with the supplied right/left cyclic and collective
   set (AB205_Saykilik_Kollektif) in place of the model's own simple sticks, and the supplied crashed airframe
   (UH1_Crashed_Jandarma) for the hardest contacts. Nothing is reshaped; meshes are only grouped so the existing visual
   damage, rotor spin and control motion can move them.
   Supplied axes: nose -X, up +Y, right -Z, skid bottom y=-2, rotor mast x=-4.76 (metres).
   Runtime axes: nose +X, up +Y, right +Z, skid bottom y=0, mast at x=-0.3 (the unchanged physics reference). */
export const DIMENSIONS={rotorDiameterM:12.556,bodyLengthM:12.563};
const here=f=>{try{return new URL('./assets/models/'+f,import.meta.url).href;}catch{return 'assets/models/'+f;}};
/* v0.39.2 telefonda en fazla 1024 px dokular (kazalı model 512): GPU belleği ≈240 MB → ≈25 MB */
const LS=LITE?'-lite':'';
export const MODEL_FILES={main:here('ab205-jandarma'+LS+'.json'),controls:here('ab205-kumandalar'+LS+'.json'),wreck:here('ab205-kazali'+LS+'.json'),panel:here('panel-temiz.jpg')};
const MAST=-4.76,OX=-.3+MAST,OY=2,XJ=-1.8;            // XJ: cabin / tail-boom joint (supplied x)
export const fromModel=(x,y,z)=>new T.Vector3(OX-x,y+OY,-z);
const M2R=new T.Matrix4().makeRotationY(Math.PI).setPosition(OX,OY,0);
/* supplied controls: their own frame (forward +Z, left +X, floor y=-.636) → model frame; each lever is set where the
   model's own stick / collective was (right collective) or beside the left seat (left collective; the model had none). */
const CTL_TX=-3.92,CTL_TY=-.65,CTL_TZ={Sag_Saykilik:.156,Sol_Saykilik:-.096,Sag_Kollektif:.02,Sol_Kollektif:-.167};
/* v0.38.1 cyclics ×0.85 about their base: the grips meet the supplied pilots' hands (model's own stick height) */
const CYCLIC_SCALE=.85,PED_NARROW=.53,PEDAL_AFT=.13;
const CTL_PART={Sag_Saykilik:'cyclicStick',Sol_Saykilik:'cyclicStickL',Sag_Kollektif:'collectiveLever',Sol_Kollektif:'collectiveLeverL'};
const CTL_PIVOT={Sag_Saykilik:[-.656,-.61,3.097],Sol_Saykilik:[.616,-.61,3.097],Sag_Kollektif:[-.27,-.6,2.36],Sol_Kollektif:[.977,-.6,2.36]};
const ctlMatrix=name=>new T.Matrix4().makeRotationY(-Math.PI/2).setPosition(CTL_TX,CTL_TY,CTL_TZ[name]);
export const ctlToRuntime=(name,x,y,z)=>new T.Vector3(x,y,z).applyMatrix4(ctlMatrix(name)).applyMatrix4(M2R);
/* supplied crashed airframe: same nose / tail positions as the intact model (its file is in centimetre units ×0.5) */
const WRECK=new T.Matrix4().makeTranslation(1.15,-2,11.85).multiply(new T.Matrix4().makeScale(50,50,50));
export const COCKPIT_REF={eye:fromModel(-6.785,-.24,-.497),floorY:-1.286+OY,panelFace:{x0:-7.18,k:.25,y0:-.8},pedTop:[[-7.165,-.812],[-6.603,-.919],.198],
 roof:[[-7.0,.10],[-6.2,.17]],lights:{rpm:fromModel(-7.2625,-.4255,-.113),fire:fromModel(-7.2625,-.4245,-.2295)},collectiveHead:'Sag_Kollektif'};
/* part of the airframe a supplied mesh belongs to (for damage motion), or null when it is replaced */
export function partFor(name,c){
 if(/^Saykilik_|^(throttle|collgov|collts|starter|idlerelease)_/.test(name))return null;
 if(/^(blade_|blade001_|rotortail)/.test(name))return 'tailRotor';
 if(/^(blade\d001_|axe001_)/.test(name))return 'bladeLeft';
 if(/^(blade\d_|axe_)/.test(name))return 'bladeRight';
 const r=/^rotor(\d+)_/.exec(name);if(r){const n=+r[1];return [2001,3,4].includes(n)?'swashplate':[1,5,6,7,14,15,16,17].includes(n)?'mainRotor':'transmission';}
 if(/^elevatortrim/.test(name))return 'stabilizer';
 if(/^(enginecowl[234]|enginetrous|beacon)/.test(name))return 'engine';
 if(/^pedals[LR]_/.test(name))return name[6]==='L'?'pedalsL':'pedalsR';
 if(c&&c.x>XJ)return 'tailBoom';
 return 'cabin';
}
const EXTERIOR=/^(fuselage|skid|enginecowl|enginetrous|elevatortrim|rotor|blade|axe|frontdoor(left|right)_|sidedoor(left|right)_|slidedoor(left|right)_|wirecutter|attaches|taillight|beacon)/;
/* every mesh with its world matrix and names (own name first, then its ancestors up to the file's top level) */
function collect(scene){scene.updateMatrixWorld(true);const out=[];scene.traverse(o=>{if(!o.isMesh)return;const names=[];for(let q=o;q&&q!==scene;q=q.parent)names.push(q.name);out.push({names,top:names.at(-1),name:o.name,mesh:o,matrix:o.matrixWorld.clone()});});return out;}
function split(geo,matrix,classify){const pos=geo.attributes.position,ix=geo.index?.array,n=ix?ix.length:pos.count,c=new T.Vector3(),P=[new T.Vector3(),new T.Vector3(),new T.Vector3()],nn=new T.Vector3(),b={};
 for(let t=0;t<n;t+=3){c.set(0,0,0);for(let k=0;k<3;k++)c.add(P[k].fromBufferAttribute(pos,ix?ix[t+k]:t+k).applyMatrix4(matrix));c.multiplyScalar(1/3);nn.subVectors(P[1],P[0]).cross(new T.Vector3().subVectors(P[2],P[0])).normalize();const key=classify(c,nn);(b[key]??=[]).push(ix?ix[t]:t,ix?ix[t+1]:t+1,ix?ix[t+2]:t+2);}
 const out={};for(const [key,list] of Object.entries(b)){const g=new T.BufferGeometry();for(const [nm,a] of Object.entries(geo.attributes))g.setAttribute(nm,a);g.setIndex(list);g.boundingSphere=geo.boundingSphere?.clone()??null;if(!g.boundingSphere)g.computeBoundingSphere();out[key]=g;}return out;}
function prepare(main,ctl,wreck){const items=[];const box=new T.Box3(),cen=new T.Vector3();
 const add=(name,geometry,material,matrix,part,flags={})=>items.push({name,geometry,material,matrix:new T.Matrix4().multiplyMatrices(M2R,matrix),part,flags});
 for(const it of collect(main)){const name=it.top;box.setFromObject(it.mesh);box.getCenter(cen);
  const glass=it.mesh.material?.transparent===true,ext=EXTERIOR.test(name);
  const flags={exterior:ext,glass,rightPilot:/^Sag_Pilot/.test(name),own:glass||name==='panel',panelBody:name==='panel',
   panelGauge:name!=='panel'&&!/^panel\d/.test(name)&&cen.x>-7.33&&cen.x<-7.14&&cen.y>-.86&&cen.y<-.37&&Math.abs(cen.z)<.64};
  if(name==='fuselage_fuselagemesh'){for(const [key,g] of Object.entries(split(it.mesh.geometry,it.matrix,p=>p.x<=XJ?'cabin':p.x>3&&p.y>.55?'fin':'tailBoom')))add(name,g,it.mesh.material,it.matrix,key,flags);continue;}
  /* v0.38.1 panel mesh: face/body, glareshield hood (hidden in the cockpit view: it covered the instruments) and the
     centre pedestal box (narrowed to the pedestal photos in the cockpit view) */
  if(name==='panel'){const cls=(p,q)=>p.x>-7.16&&p.y<-.8?'ped':p.y>-.48&&Math.abs(q.x)<.85?'hood':'body';
   for(const [key,g] of Object.entries(split(it.mesh.geometry,it.matrix,cls))){add(name,g,it.mesh.material,it.matrix,'cabin',{...flags,panelHood:key==='hood',pedestalBody:key==='ped'});
    if(key==='ped'){/* cockpit-view copy narrowed across (model z) to the width of the pedestal photos */const ng=g.clone(),pa=g.attributes.position.clone(),inv=it.matrix.clone().invert(),v=new T.Vector3();
     for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(it.matrix);v.z*=PED_NARROW;v.applyMatrix4(inv);pa.setXYZ(i,v.x,v.y,v.z);}ng.setAttribute('position',pa);ng.computeBoundingSphere();
     add(name,ng,it.mesh.material,it.matrix,'cabin',{...flags,pedestalNarrow:true});}}continue;}
  if(name==='skid_skidmesh'){for(const [key,g] of Object.entries(split(it.mesh.geometry,it.matrix,p=>p.x>0?'tailBoom':p.z>=0?'skidLeft':'skidRight')))add(name,g,it.mesh.material,it.matrix,key,flags);continue;}
  const part=partFor(name,{x:box.min.x});
  /* v0.38.2 pedals 13 cm toward the pilots (seen from the seat below the panel; the panel is not touched) */
  if(part==='pedalsL'||part==='pedalsR'){add(name,it.mesh.geometry,it.mesh.material,new T.Matrix4().makeTranslation(PEDAL_AFT,0,0).multiply(it.matrix),part,flags);continue;}
  if(part)add(name,it.mesh.geometry,it.mesh.material,it.matrix,part,flags);}
 if(ctl)for(const it of collect(ctl)){const name=it.names.find(n=>n in CTL_PART);if(!name)continue;add(name,it.mesh.geometry,it.mesh.material,new T.Matrix4().multiplyMatrices(ctlMatrix(name),it.matrix),CTL_PART[name],{control:name});}
 if(wreck)for(const it of collect(wreck))add(it.name,it.mesh.geometry,it.mesh.material,new T.Matrix4().multiplyMatrices(WRECK,it.matrix),'wreck',{exterior:true,glass:it.mesh.material?.transparent===true});
 return {items};}
let assetPromise=null;
export function loadHelicopterAssets(){if(assetPromise)return assetPromise;
 if(typeof document==='undefined'||typeof fetch==='undefined')return assetPromise=Promise.resolve(null);
 const L=new GLTFLoader();
 return assetPromise=Promise.all([L.loadAsync(MODEL_FILES.main),L.loadAsync(MODEL_FILES.controls).catch(e=>{console.warn(e);return null;}),L.loadAsync(MODEL_FILES.wreck).catch(e=>{console.warn(e);return null;})])
  .then(([m,c,w])=>prepare(m.scene,c?.scene,w?.scene)).catch(e=>{console.warn('Helikopter modeli yüklenemedi',e);return null;});}
function restMatrix(g,root){const u=g.userData,m=new T.Matrix4().compose(u.restPosition,new T.Quaternion().setFromEuler(u.restRotation),u.restScale);return g.parent&&g.parent!==root?restMatrix(g.parent,root).multiply(m):m;}
function fill(heli,a){const inv={},own=new Map();
 for(const t of a.items){const g=t.part==='wreck'?heli.wreck:heli.parts[t.part];if(!g)continue;
  const W=inv[t.part]??=(t.part==='wreck'?new T.Matrix4():restMatrix(g,heli.root).invert());
  let mat=t.material;if(t.flags.own){if(!own.has(mat))own.set(mat,mat.clone());mat=own.get(mat);}
  const m=new T.Mesh(t.geometry,mat);m.name=t.name;new T.Matrix4().multiplyMatrices(W,t.matrix).decompose(m.position,m.quaternion,m.scale);
  m.castShadow=!t.flags.glass&&(t.geometry.boundingSphere?.radius??1)>.04;m.receiveShadow=!t.flags.glass; /* v0.38.3 sunlight and shade inside the cabin too */Object.assign(m.userData,t.flags);if(t.flags.pedestalNarrow)m.visible=false;g.add(m);
  if(t.flags.glass&&t.part!=='wreck'&&/^vitres_/.test(t.name))heli.materials[3]=mat;
  if(t.flags.panelBody)heli.panelMaterial=mat;}
 setupDoors(heli);heli.loaded=true;heli.root.updateMatrixWorld(true);}
/* v0.39 kapılar: kokpit kapıları ön kenarındaki menteşe etrafında açılır / atılır, kabin (sürgülü) kapıları geriye kayar */
const DOOR_RX={frontL:/^frontdoor(left|lint|glasleft|glasleftint)_/,frontR:/^frontdoor(right|rint|rint5|glasright|glasrighint)_/,slideL:/^slidedoor(left|intl|glasleft|glasleftint)_/,slideR:/^slidedoor(right|intr|glasright|glasrighint)_/};
function setupDoors(heli){const cabin=heli.parts.cabin;if(!cabin)return;heli.doors={};cabin.updateMatrixWorld(true);
 for(const [id,rx] of Object.entries(DOOR_RX)){const ms=cabin.children.filter(m=>m.isMesh&&rx.test(m.name));if(!ms.length)continue;const box=new T.Box3();for(const m of ms){m.geometry.computeBoundingBox?.();const b=m.geometry.boundingBox.clone().applyMatrix4(m.matrix);box.union(b);}
  const front=id.startsWith('front'),hinge=new T.Vector3(front?box.max.x:box.min.x,(box.min.y+box.max.y)/2,id.endsWith('L')?box.min.z:box.max.z),pivot=new T.Group();pivot.name='door-'+id;pivot.position.copy(hinge);cabin.add(pivot);
  for(const m of ms){m.position.sub(hinge);pivot.add(m);}pivot.userData={rest:hinge.clone(),side:id.endsWith('L')?-1:1,front};heli.doors[id]=pivot;}}
export function setDoors(heli,{front=0,slide=0,jettison=0}={}){const D=heli.doors;if(!D)return;
 for(const [id,p] of Object.entries(D)){const u=p.userData;if(u.front){const k=Math.min(1,front);p.rotation.y=-u.side*k*1.05;p.position.copy(u.rest);p.visible=true;
   if(jettison>0){/* atılan kapı: dışa ve aşağı düşer, sonra gizlenir */p.position.z+=u.side*jettison*2.5;p.position.y-=jettison*jettison*4.9;p.rotation.x=u.side*jettison*.8;p.visible=jettison<2.2;}}
  else{p.position.copy(u.rest);p.position.x-=Math.min(1,slide)*1.25;}}}
/* Synchronous: returns the part hierarchy at once; the supplied meshes fill it as soon as the files are loaded (heli.ready). */
export function createHelicopter(){
 const root=new T.Group();root.name='AB-205 Jandarma (kullanıcı modeli)';const parts={};
 const group=(id,parent=root,pivot=new T.Vector3())=>{const g=new T.Group();g.name=id;g.position.copy(pivot);parent.add(g);parts[id]=g;return g;};
 const cabin=group('cabin');group('cockpit');group('engine');group('transmission');group('mast');const controls=group('controls');
 group('skidLeft');group('skidRight');
 const boomPivot=fromModel(XJ,.05,0),tailBoom=group('tailBoom',root,boomPivot);
 group('stabilizer',tailBoom,fromModel(1.2,-.11,0).sub(boomPivot));group('fin',tailBoom,fromModel(3.2,.5,0).sub(boomPivot));
 const rotor=group('mainRotor',root,fromModel(MAST,1.59,0)),tail=group('tailRotor',tailBoom,fromModel(4.27,1.5525,.472).sub(boomPivot));
 group('bladeLeft',rotor);group('bladeRight',rotor);
 const swash=group('swashplate',controls,fromModel(MAST,1.24,0));
 for(const [name,id] of Object.entries(CTL_PART)){const g=group(id,cabin,ctlToRuntime(name,...CTL_PIVOT[name]));if(/Saykilik/.test(name))g.scale.setScalar(CYCLIC_SCALE);}
 group('pedalsL',cabin);group('pedalsR',cabin);
 const wreck=new T.Group();wreck.name='Kazalı gövde';wreck.visible=false;root.add(wreck);
 const rotorBlur=[];for(const angle of [0,Math.PI]){const m=new T.Mesh(new T.RingGeometry(.55,DIMENSIONS.rotorDiameterM/2,64,1,angle,Math.PI*.42),new T.MeshBasicMaterial({color:'#263632',transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.y=.018;m.userData.webglOnly=true;rotor.add(m);rotorBlur.push(m);}
 const mesh=(geo,mat,pos,parent)=>{const m=new T.Mesh(geo,mat);m.position.copy(pos);parent.add(m);return m;};
 const black=new T.MeshStandardMaterial({color:'#1b1d1c',roughness:.7}),paint=new T.MeshStandardMaterial({color:'#e9ecec',roughness:.45});
 const tube=(a,b,r,parent,mat)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b);const m=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),mat,av.clone().add(bv).multiplyScalar(.5),parent);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;};
 const effects=new T.Group();effects.name='impactEffects';root.add(effects);const dust=[];
 for(let i=0;i<16;i++){const mat=new T.MeshBasicMaterial({color:'#b9a88c',transparent:true,opacity:.12,depthWrite:false});const m=mesh(new T.IcosahedronGeometry(1,1),mat,new T.Vector3(0,1,0),effects);m.visible=false;dust.push(m);}
 const splash=[];for(let i=0;i<3;i++){const m=mesh(new T.TorusGeometry(1,.06,5,32),new T.MeshBasicMaterial({color:'#c6e4e8',transparent:true,opacity:.55,depthWrite:false}),new T.Vector3(0,.1,0),effects);m.rotation.x=Math.PI/2;m.visible=false;splash.push(m);}
 const damageMarks=[];for(const side of [-1,1])for(let i=0;i<4;i++){const mark=tube([.75-i*.2,.95+i*.1,side*1.2],[.6-i*.2,1.1+i*.09,side*1.2],.009,cabin,black);mark.visible=false;damageMarks.push(mark);}
 const debris=new T.Group();debris.name='impactFragments';root.add(debris);for(let i=0;i<6;i++){const m=mesh(new T.BoxGeometry(i<2?1.4:.32,.045,i<2?.4:.16),i<4?black:paint,new T.Vector3(0,.1,0),debris);m.visible=false;}
 root.userData={visualOnly:true,dimensions:DIMENSIONS,detailRevision:'0.38',source:'UH1_Jandarma_Iki_Pilot + AB205_Saykilik_Kollektif + UH1_Crashed_Jandarma (kullanıcı modelleri)',referenceLimits:'Kullanıcının verdiği görsel model; sertifikalı CAD değildir'};
 for(const g of Object.values(parts)){g.userData.restPosition=g.position.clone();g.userData.restRotation=g.rotation.clone();g.userData.restScale=g.scale.clone();}
 root.updateMatrixWorld(true);
 const heli={root,rotor,tail,parts,debris,dust,splash,damageMarks,swash,materials:[],rotorBlur,wreck,loaded:false};
 heli.ready=loadHelicopterAssets().then(a=>{if(a)fill(heli,a);return heli;});
 return heli;
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function animateHelicopter(heli,state){
 const p=state.physicalState??{},c=p.controls??{};
 for(const m of heli.rotorBlur??[])m.visible=(p.rotorRpm??0)>100&&!p.contact;
 heli.rotor.rotation.y=state.rotorAngle;heli.tail.rotation.z=state.tailAngle;
 if(heli.swash){heli.swash.position.y=heli.swash.userData.restPosition.y+(c.collective??.4)*.08;heli.swash.rotation.z=-(c.cyclicForward??0);heli.swash.rotation.x=c.cyclicRight??0;}
 // cockpit controls follow the simulated control positions (both seats; pilot and co-pilot controls are linked)
 const cf=clamp((c.cyclicForward??0)/.22,-1,1),cr=clamp((c.cyclicRight??0)/.22,-1,1),col=clamp(((c.collective??1)-.3)/1.9,0,1),pd=clamp(c.pedal??0,-1,1),P=heli.parts;
 for(const id of ['cyclicStick','cyclicStickL'])if(P[id]){P[id].rotation.z=-cf*.3;P[id].rotation.x=cr*.24;}
 for(const id of ['collectiveLever','collectiveLeverL'])if(P[id])P[id].rotation.z=col*.35;
 if(P.pedalsL&&P.pedalsR){P.pedalsL.position.x=P.pedalsL.userData.restPosition.x-pd*.08;P.pedalsR.position.x=P.pedalsR.userData.restPosition.x+pd*.08; /* v0.39 pedal > 0 = sağ pedal ileri (gösterge ve anlatımla aynı) */}
 // v0.33: blade coning grows with thrust (collective × rotor speed²); a slow / stopped rotor droops on its stops
 const nr=Math.max(0,(p.rotorRpm??324)/324),cone=nr>.35?Math.min(.09,.012+.032*Math.max(0,c.collective??.7)*nr*nr):-.035*(1-nr/.35);
 for(const [id,side] of [['bladeLeft',1],['bladeRight',-1]]){const b=P[id];if(b){b.rotation.x=side*(.035+(c.collective??.4)*.16);if(!p.contact)b.rotation.z=side*cone;}}
}
