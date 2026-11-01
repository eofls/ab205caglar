import {AIRFIELD_FEATURES} from './assets/terrain/guvercinlik-osm.js';
import {LITE} from './device-profile.js';
import {makeAreaScene,disposeArea} from './area-scene.js';
import {CockpitGauges} from './cockpit-gauges.js';
import {createSky,updateSky,createClouds,updateClouds,createDownwash,updateDownwash,updateAirfieldExtras,mergeStatic,createRain,updateRain,createSmoke,updateSmoke} from './environment.js';
import {terrainColor,DEM,FEATURES,extraFeatures} from './terrain-data.js';
import {REAL_AREAS} from './real-area.js';
import {isManualProgram} from './program-flight.js';
import {groundTexture,addTerrainDetail} from './terrain-detail.js';
import {applyDamageVisual} from './component-damage.js';
import {fieldFrame} from './field-frame.js';
import {SitePicker} from './site-picker.js';
import {flightOverlays} from './flight-overlays.js';
import {motionLabel} from './flight-dynamics.js';
import {CanvasScene} from './canvas-scene.js';
import {PROFILES} from './scenario-profiles.js';
import {visualWeather} from './visual-weather.js';
import {lessonView} from './scenario-lesson.js';
import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {createHelicopter,animateHelicopter,MODEL_FILES,setDoors} from './scene-model.js';
import {Cockpit,EYE as CK_EYE} from './cockpit3d.js';
import {Narrator,buildCues} from './narration.js';
import {programRun} from './program-flight.js';
import {sampleScene,terrainHeight} from './scene-motion.js';
export class SceneView{
 constructor(host){
  this.host=host;this.follow=true;this.previous=new T.Vector3();
  try{this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});}catch(first){
   try{this.renderer=new T.WebGLRenderer({antialias:false,alpha:false,powerPreference:'low-power'});}catch(second){this.fallback=new CanvasScene(host,second);return;}
  }
  const r=this.renderer;r.setPixelRatio(Math.min(devicePixelRatio,LITE?1.5:2));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.95;r.setClearColor('#c7d3ce');host.appendChild(r.domElement);r.domElement.setAttribute('aria-label','AB-205 ve koordinata dayalı Gölbaşı arazisi. Sürükle: dön, tekerlek: yaklaş, sağ sürükle: kaydır.');
  /* v0.33.1: a lost WebGL context (tablet app switch, GPU reset) is waited for and restored - three.js re-uploads
     geometry and textures; only if it does not come back is the simplified canvas view used */
  r.debug.checkShaderErrors=false;
  r.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(this.fallback)return;this.contextLost=true;clearTimeout(this.lostTimer);this.lostTimer=setTimeout(()=>{if(!this.contextLost||this.fallback)return;this.picker?.dispose();this.controls?.dispose();this.observer?.disconnect();r.domElement.remove();this.fallback=new CanvasScene(host,'WebGL bağlamı çalışma sırasında kesildi.');if(this.lastSession)this.fallback.update(this.lastSession);},8000);});
  r.domElement.addEventListener('webglcontextrestored',()=>{this.contextLost=false;clearTimeout(this.lostTimer);this.resize();this.precompile();});
  this.scene=new T.Scene();this.scene.fog=new T.Fog('#c7d3ce',300,1700);
  this.camera=new T.PerspectiveCamera(43,1,.5,30000);
  this.controls=new OrbitControls(this.camera,r.domElement);this.controls.enableDamping=true;this.controls.minDistance=7;this.controls.maxDistance=2200;this.controls.maxPolarAngle=Math.PI*.49;
  this.ambient=new T.HemisphereLight('#e6f2ff','#77704a',1.9);this.scene.add(this.ambient);
  /* v0.38.3 image-based sky light: soft sky / ground reflections on paint, metal, glass and the cockpit */
  try{const pm=new T.PMREMGenerator(r),es=new T.Scene(),sky=new T.Mesh(new T.SphereGeometry(50,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 top=vec3(.30,.48,.78),hor=vec3(.82,.86,.88),gnd=vec3(.30,.27,.20);vec3 c=h>0.?mix(hor,top,pow(h,.55)):mix(hor*.7,gnd,pow(-h,.35));gl_FragColor=vec4(c,1.);}'}));es.add(sky);
   const sb=new T.Mesh(new T.SphereGeometry(3.2,16,8),new T.MeshBasicMaterial({color:new T.Color(9,8.4,7.2)}));sb.position.set(24,42,17);es.add(sb);
   this.scene.environment=pm.fromScene(es,.015).texture;this.scene.environmentIntensity=.5;pm.dispose();}catch(e){console.warn(e);}
  this.maxAniso=Math.min(8,r.capabilities.getMaxAnisotropy?.()??1);
  const sun=this.sun=new T.DirectionalLight('#fff0cf',3);sun.position.set(100,180,70);sun.castShadow=true;sun.shadow.mapSize.set(LITE?1024:2048,LITE?1024:2048);Object.assign(sun.shadow.camera,{left:-160,right:160,top:160,bottom:-160,near:1,far:500});sun.shadow.bias=-.0003;this.scene.add(sun);
  this.areaRoot=makeAreaScene('terrain');this.scene.add(this.areaRoot);this.areaDetail=addTerrainDetail(this.scene,[...FEATURES,...extraFeatures('terrain')]);this.flightArea='terrain';this.areaKey='terrain:0:0';
  const marker=new T.ArrowHelper(new T.Vector3(0,0,-1),new T.Vector3(40,8,25),10,0xf1d6a1,3,2);this.wind=marker;this.scene.add(marker);
  this.sky=createSky();this.scene.add(this.sky);
  this.clouds=createClouds();this.scene.add(this.clouds);
  this.downwash=createDownwash();this.scene.add(this.downwash);
  this.rain=createRain();this.scene.add(this.rain);
  this.smoke=createSmoke();this.scene.add(this.smoke);this.smokeTrail=[];
  {const fl=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,240,180,1)');g.addColorStop(.35,'rgba(255,140,40,.85)');g.addColorStop(1,'rgba(255,60,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return c;})()),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));fl.position.set(-2.7,2.75,0);fl.scale.set(1.3,1.3,1);fl.visible=false;fl.name='Alev';this.flame=fl;}
  this.heli=createHelicopter();this.scene.add(this.heli.root);
  /* v0.38 the supplied model arrives asynchronously: bind the cockpit to it, re-apply the cockpit view, warm its shaders */
  this.heli.ready.then(()=>{this.sharpen(this.scene);try{this.setupWipers();}catch(e){console.warn(e);}this.cpit?.bindModel(this.heli);if(this.cockpit)this.cockpitMode(true);this.precompile();this.dirty=true;});
  /* v0.35 3D cockpit (photo panels, live instruments, clickable switches); right-drag / touch-drag looks around */
  this.cpit=new Cockpit();this.heli.root.add(this.cpit.group);this.look={yaw:0,pitch:-.13,tYaw:null,tPitch:null};this.installCockpitInput(r.domElement);this.narr=new Narrator(host);this.cues=[];
  this.heli.root.add(this.flame);
  this.landingLight=new T.SpotLight('#fff3dc',0,260,.42,.5,1.2);this.landingLight.position.set(2.6,.9,0);this.landingLight.target.position.set(40,-22,0);this.heli.root.add(this.landingLight,this.landingLight.target);
  this.searchLight=new T.SpotLight('#fff8e8',0,200,.3,.45,1.2);this.searchLight.position.set(1.6,.5,.35);this.searchLight.target.position.set(30,-30,8);this.heli.root.add(this.searchLight,this.searchLight.target);
  /* v0.38.4 exterior lights: position (red left, green right, white tail) and the red anti-collision beacon */
  {const tex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
   const spr=(col,pos)=>{const s=new T.Sprite(new T.SpriteMaterial({map:tex,color:col,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));s.position.copy(pos);s.scale.setScalar(.5);s.visible=false;this.heli.root.add(s);return s;};
   this.posLights=[spr('#ff3030',new T.Vector3(.9,2.15,-1.22)),spr('#30ff60',new T.Vector3(.9,2.15,1.22)),spr('#ffffff',new T.Vector3(-9.45,2.55,0))];
   this.beaconSpr=spr('#ff2a1a',new T.Vector3(-2.51,2.88,0));this.beaconLight=new T.PointLight('#ff2a1a',0,14,2);this.beaconLight.position.set(-2.51,2.95,0);this.heli.root.add(this.beaconLight);}
  // Ghost: the adaptive reference flight from the same start, shown while flying manually.
  this.wingHeli=createHelicopter();this.wingHeli.root.visible=false;this.scene.add(this.wingHeli.root);this.ghost=createHelicopter();this.ghost.ready.then(()=>this.ghost.root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.26;o.material.depthWrite=false;o.castShadow=false;}if(o.isMesh&&o.parent===this.ghost.wreck)o.visible=true;}));this.ghost.root.visible=false;this.scene.add(this.ghost.root);
  this.fields=new T.Group();this.fields.visible=false;this.scene.add(this.fields);this.fieldMarkers=[];this.fieldLabels=[];{const warm=new T.Group();warm.visible=false;warm.name='Gölgelendirici ısıtma';warm.add(new T.Mesh(new T.RingGeometry(9,10,8),new T.MeshBasicMaterial({color:'#8dcde2',side:T.DoubleSide})),new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(document.createElement('canvas')),depthTest:true,sizeAttenuation:false})));this.scene.add(warm);}
  this.picker=new SitePicker(host,r.domElement,this.camera,()=>({cockpit:!!this.cockpit,flightArea:this.flightArea,targets:[...(this.overlays?.targets??[]),...(this.overlays?.prediction?[{id:'prediction',label:'T',x:this.overlays.prediction[0],z:this.overlays.prediction[2]}]:[])],position:this.heli.root.position.toArray()}));
  this.gauges=new CockpitGauges(host);
  this.flow=new T.Group();this.flow.visible=false;this.scene.add(this.flow);
  for(const z of [-2.5,2.5])this.flow.add(new T.ArrowHelper(new T.Vector3(0,1,0),new T.Vector3(-.3,1,z),5,0x8dcde2,1,.6));
  this.regimeHalo=new T.Mesh(new T.TorusGeometry(7.36,.08,5,64,Math.PI*1.7),new T.MeshBasicMaterial({color:'#ffad52',transparent:true,opacity:.7}));this.regimeHalo.rotation.x=Math.PI/2;this.regimeHalo.position.y=4.2;this.regimeHalo.visible=false;this.heli.root.add(this.regimeHalo);
  this.guide=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,10,0)]),new T.LineDashedMaterial({color:'#efe6c9',dashSize:1,gapSize:.7}));this.scene.add(this.guide);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();this.preset('close');this.precompile();
 }
 /* v0.33.1: compile every shader program up front (hidden objects included: dust, debris, splash, rain, markers, ghost)
    so nothing compiles mid-flight - first-use compiles were the freezes at contact and the audio crackle with them */
 precompile(){if(!this.renderer||this.fallback||this.contextLost)return;const r=this.renderer,hidden=[],culled=[];this.scene.traverse(o=>{if(!o.visible){hidden.push(o);o.visible=true;}if(o.frustumCulled&&(o.isMesh||o.isSprite||o.isPoints||o.isLine)){culled.push(o);o.frustumCulled=false;}});
  /* one draw into a 1x1 scissor makes the driver finish every program and three fetch its uniforms now, not at first use */
  try{r.compile(this.scene,this.camera);const sz=r.getSize(new T.Vector2());r.setScissorTest(true);r.setScissor(0,0,1,1);r.render(this.scene,this.camera);r.setScissorTest(false);r.setScissor(0,0,sz.x,sz.y);}catch(e){console.warn(e);}
  for(const o of hidden)o.visible=false;for(const o of culled)o.frustumCulled=true;}
 animateEnvironment(){const now=performance.now()/1000,e=this.env;this.sky.position.copy(this.camera.position);const root=this.areaRoot;if(root?.userData.time)root.userData.time.value=now;
  const water=root?.userData.water;if(water){const u=water.material.uniforms;u.time.value=now;if(this.sunDir)u.sunDir.value.copy(this.sunDir);u.skyTop.value.copy(this.sky.material.uniforms.top.value);u.skyHorizon.value.copy(this.sky.material.uniforms.horizon.value);u.sunColor.value.copy(this.sky.material.uniforms.sunColor.value);if(e){u.heli.value.set(e.position[0],e.position[2],e.agl,e.contact?0:Math.min(1,e.rpmRatio*e.rpmRatio));u.wind.value.set(e.windKt,0);}}
  if(root?.userData.airfield&&e)updateAirfieldExtras(root.userData.airfield,{time:now,windFromDeg:e.windFromDeg,windKt:e.windKt});
  updateRain(this.rain,{time:now,camera:this.camera,on:!!this.rainOn,windX:e?.windKt?Math.sin(e.windFromDeg*Math.PI/180)*-e.windKt:0,windZ:e?.windKt?Math.cos(e.windFromDeg*Math.PI/180)*e.windKt:0});
  if(e)updateDownwash(this.downwash,{...e,time:now,rpmRatio:e.contact?Math.max(0,e.rpmRatio-.2):e.rpmRatio});else this.downwash.visible=false;}
 glassFromInside(on){this.heli.root.traverse(o=>{const m=o.material;if(!o.isMesh||!m||Array.isArray(m))return;if(/Fuselage|livery|_White|_Blue|_Red|panel/i.test(o.name)&&!/Windshield|glass/i.test(o.name)){o.visible=!on||!/Fuselage_White|Fuselage_Blue|Continuous_livery|Fuselage_Red/.test(o.name);}if(/^(Conformal_windshield|Windshield_frame|Windshield_center_post|Windshield_post_seal|Wiper_arm|Wiper_blade|Pilot_seal-?1)$/.test(o.name))o.visible=!on; // v0.32: no windshield/wipers from inside (user request: clear field of view)
if(!m.transparent)return;if(m.userData.outsideOpacity===undefined)m.userData.outsideOpacity=m.opacity;m.opacity=on?Math.min(m.userData.outsideOpacity,.07):m.userData.outsideOpacity;});}
 /* v0.38.3 anisotropic filtering on every texture (ground imagery, livery, panels) seen at a slant */
 sharpen(root){const A=this.maxAniso??1;if(A<=1)return;root.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms)for(const k of ['map','normalMap','roughnessMap','emissiveMap'])if(m[k]&&m[k].anisotropy<A){m[k].anisotropy=A;m[k].needsUpdate=true;}});}
 placeCockpit(){const r=this.heli.root;r.updateMatrixWorld(true);
  /* v0.38.3 panel view: the camera stands square in front of the chosen panel and fits it to the screen */
  if(this.ckFocus){const fr=this.cpit.panelFrame(this.ckFocus);if(fr){const [f,w,h]=fr;f.updateWorldMatrix(true,false);const m=f.matrixWorld,c=new T.Vector3().setFromMatrixPosition(m),n=new T.Vector3().setFromMatrixColumn(m,2).normalize(),up=new T.Vector3().setFromMatrixColumn(m,1).normalize();
   let H=h;if(this.ckFocus==='ped'){const mf=this.cpit.miscF,md=this.cpit.dims?.misc;if(mf&&md){mf.updateWorldMatrix(true,false);const mc=new T.Vector3().setFromMatrixPosition(mf.matrixWorld);H=h+md[1]+.006;c.lerp(mc,(md[1]+.006)/H);}} /* pedestal view includes the misc panel */
   const t=Math.tan(this.camera.fov*Math.PI/360),d=Math.max(H/2/t,w/2/(t*this.camera.aspect))*1.12;this.camera.position.copy(c).addScaledVector(n,d);this.camera.up.copy(up);this.camera.lookAt(c);return;}}const eye=CK_EYE.clone();if(this.vib){const k=performance.now()/1000;eye.y+=Math.sin(k*29)*this.vib*.012;eye.z+=Math.sin(k*23+1)*this.vib*.008;}
  const L=this.look,now=performance.now(),dtL=Math.min(.12,Math.max(0,(now-(L.last??now))/1000));L.last=now;if(L.tYaw!=null&&!L.drag){const k=1-Math.exp(-dtL*4.2);L.yaw+=(L.tYaw-L.yaw)*k;L.pitch+=(L.tPitch-L.pitch)*k;}
  const cp=Math.cos(L.pitch),dir=new T.Vector3(Math.cos(L.yaw)*cp,Math.sin(L.pitch),Math.sin(L.yaw)*cp);
  this.camera.position.copy(r.localToWorld(eye.clone()));const look=r.localToWorld(eye.clone().add(dir));this.camera.up.copy(r.localToWorld(eye.clone().add(new T.Vector3(0,1,0))).sub(this.camera.position).normalize());this.camera.lookAt(look);}
 /* cockpit input: right mouse drag (or one-finger drag on touch) turns the head, wheel / pinch zooms, left click works a switch */
 installCockpitInput(el){let drag=null;const L=this.look;
  el.addEventListener('contextmenu',e=>{if(this.cockpit)e.preventDefault();});
  el.addEventListener('pointerdown',e=>{if(!this.cockpit)return;if(e.button===2||e.pointerType==='touch'){drag={x:e.clientX,y:e.clientY,id:e.pointerId,moved:0};L.drag=true;L.tYaw=null;L.userAt=performance.now();el.setPointerCapture?.(e.pointerId);}});
  el.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.moved+=Math.abs(dx)+Math.abs(dy);const k=this.camera.fov/80*.0045;
   L.yaw=Math.max(-2.6,Math.min(2.6,L.yaw+dx*k));L.pitch=Math.max(-1.25,Math.min(1.3,L.pitch+dy*k));L.userAt=performance.now();});
  const end=e=>{if(!drag||e.pointerId!==drag.id)return;const tap=e.pointerType==='touch'&&drag.moved<8;drag=null;L.drag=false;if(tap)this.cockpitClick(e);};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('click',e=>{if(this.cockpit&&e.button===0)this.cockpitClick(e);});
  /* v0.38.4 keys: 1 panel · 2 pedestal · 3 overhead · 4 circuit breakers · 0 ahead · H hide/show the control bar */
  window.addEventListener('keydown',e=>{if(e.target?.closest?.('input,select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key;
   if(k==='h'||k==='H'){document.body.classList.toggle('hide-transport');return;}if(!this.cockpit)return;
   if(k==='2'||k==='3'||k==='4'){this.ckFocus=null;this.focusPanel({2:'ped',3:'ovh',4:'cb'}[k]);}else if(k==='1'||k==='0'){this.focusPanel(null);L.tYaw=k==='1'?-.12:0;L.tPitch=k==='1'?-.55:-.13;L.userAt=performance.now()+(k==='1'?6000:0);}});
  el.addEventListener('dblclick',e=>{if(this.cockpit){this.ckFocus=null;L.tYaw=null;L.userAt=performance.now();L.yaw=0;L.pitch=-.13;this.camera.fov=80;this.camera.updateProjectionMatrix();}});
  el.addEventListener('wheel',e=>{if(!this.cockpit)return;e.preventDefault();this.camera.fov=Math.max(30,Math.min(100,this.camera.fov+Math.sign(e.deltaY)*4));this.camera.updateProjectionMatrix();},{passive:false});
  el.addEventListener('pointermove',e=>{if(!this.cockpit||drag||e.pointerType==='touch')return;const hit=this.cockpitPick(e);el.style.cursor=hit?'pointer':'';this.cockpitHover(hit,e);});}
 cockpitPick(e){const rect=this.renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),this.camera);
  const h=ray.intersectObjects(this.cpit.picks,false)[0];return h?.object.userData.ctrl??null;}
 /* v0.38.2 panel focus: look straight at the pedestal / overhead / breaker panel and zoom so it fills the view */
 focusPanel(name){const L=this.look;if(this.ckFocus===name||!name){this.ckFocus=null;L.tYaw=null;L.userAt=performance.now();this.camera.fov=80;this.camera.updateProjectionMatrix();return;}
  this.ckFocus=name;L.userAt=performance.now()+1e9;this.camera.fov=40;this.camera.updateProjectionMatrix();}
 cockpitClick(e){const id=this.cockpitPick(e);if(!id)return;if(id.startsWith('focus:')){this.focusPanel(id.slice(6));return;}const r=this.cpit.click(id);if(r)this.cockpitToast(`${r.name}${r.pos?' · '+r.pos:''}`,r.desc);}
 cockpitHover(id,e){const tip=this.ckTip??=(()=>{const d=document.createElement('div');d.className='ck-tip';d.hidden=true;this.host.appendChild(d);return d;})();
  if(!id){tip.hidden=true;return;}if(id.startsWith('g:')||id==='chrono'){const rect=this.host.getBoundingClientRect();tip.hidden=false;tip.innerHTML=id==='chrono'?'<b>Saat / kronometre</b><br><small>Tıkla: başlat → durdur → sıfırla</small>':`<b>${this.cpit.gaugeText(id.slice(2))}</b>`;tip.style.left=Math.min(rect.width-260,e.clientX-rect.left+14)+'px';tip.style.top=(e.clientY-rect.top+16)+'px';return;}if(id.startsWith('focus:')){const rect=this.host.getBoundingClientRect();tip.hidden=false;tip.innerHTML=this.ckFocus===id.slice(6)?'<b>Önceki görünüme dön</b>':'<b>Paneli yakından göster</b><br><small>Tıkla: panel tam ekrana gelir; anahtarlar seçilebilir.</small>';tip.style.left=Math.min(rect.width-260,e.clientX-rect.left+14)+'px';tip.style.top=(e.clientY-rect.top+16)+'px';return;}const c=this.cpit.parts[id]?.c;if(!c){tip.hidden=true;return;}const rect=this.host.getBoundingClientRect();tip.hidden=false;tip.innerHTML=`<b>${c.name}</b> · ${c.pos[this.cpit.state[id]]||'—'}${c.desc?`<br><small>${c.desc}</small>`:''}`;
  tip.style.left=Math.min(rect.width-260,e.clientX-rect.left+14)+'px';tip.style.top=(e.clientY-rect.top+16)+'px';}
 cockpitToast(t,d){const el=this.ckToast??=(()=>{const x=document.createElement('div');x.className='ck-toast';this.host.appendChild(x);return x;})();el.innerHTML=`<b>${t}</b>${d?`<small>${d}</small>`:''}`;el.classList.add('on');clearTimeout(this.ckToastT);this.ckToastT=setTimeout(()=>el.classList.remove('on'),2600);}
 /* narration head turn: look at a cockpit part (id) or back ahead (null) */
 /* v0.39 suya inişte kapılar: güçlü suya inişte kokpit kapıları havırda atılır, kabin kapıları açılır; güçsüz suya inişte suya girmeden önce açılır */
 doorState(session,s){const c=session.config,id=c.program==='emergency'?c.emergencyId:null;if(id!=='ditch-power'&&id!=='ditch-nopower'){if(this.doorsSet){setDoors(this.heli,{});this.doorsSet=false;}return;}
  const t=session.time;let k=this.doorKey===session.scenario?this.doorT:undefined;if(k===undefined){let tt=null;try{for(const e of session.events())if(/kapı/i.test(e.title+' '+e.text)&&e.at>4.5&&!/^Adım/.test(e.title)){tt=e.at;break;}}catch{}this.doorKey=session.scenario;this.doorT=k=tt;}
  const p=s.physicalState,agl=p?.heightAglFt??99;let open=0,jet=0;
  if(id==='ditch-power'&&k!=null){open=Math.max(0,Math.min(1,(t-k)/1.5));jet=Math.max(0,t-k-1.5);}else if(id==='ditch-nopower'&&t>4)open=Math.max(0,Math.min(1,(80-agl)/40));
  setDoors(this.heli,{front:open,slide:open,jettison:id==='ditch-power'?jet:0});this.doorsSet=true;}
 worldTarget(id){if(id==='wing')return this.wingOn?this.wingHeli.root.position.clone().add(new T.Vector3(0,1.6,0)):null;if(id==='lz'){const lz=this.lastPhysical?.program?.lz;return lz?new T.Vector3(lz.x,terrainHeight(lz.x,lz.z,this.flightArea)+1,lz.z):null;}return this.cpit.targetPos(id)??this.cpit.worldPos(id);}
 lookAtPart(id){const L=this.look;if(!this.cockpit)return;if(L.drag||performance.now()-(L.userAt??0)<2500)return;if(this.lastSession?.config?.mode==='manual')return;if(!id){L.tYaw=0;L.tPitch=-.13;return;}
  if(id.startsWith('look:')){/* v0.39 “… TEMİZ”: baş dönüş / bakış tarafına çevrilir, sonra tekrar ileri */const k=id.slice(5);L.tYaw={left:-.95,right:.95,back:1.75,backleft:-1.75,up:0,down:0}[k]??0;L.tPitch=k==='down'?-.55:k==='up'?.25:-.1;return;}
  const w=id==='out'?null:this.worldTarget(id);if(!w){L.tYaw=0;L.tPitch=-.13;return;}const loc=this.heli.root.worldToLocal(w.clone()).sub(CK_EYE);L.tYaw=Math.atan2(loc.z,loc.x);L.tPitch=Math.max(-1.25,Math.min(1.3,Math.atan2(loc.y,Math.hypot(loc.x,loc.z))-(loc.y<0?.05:-.03)));} // target near the screen centre: the caption sits at the top, the transport bar at the bottom
 cockpitMode(on){this.host.classList.toggle('cockpit-mode',on);try{document.body.classList.toggle('in-cockpit',on);}catch{}this.gauges?.update(null,{visible:false});this.cpit.group.visible=on;
  /* v0.38 the supplied model is the cockpit: it stays visible; only the rotor (it filled the windshield), the right-seat pilot
     (the eye is his), the model's own panel instruments (ours replace them in the photo layout) and overlays are hidden */
  const h=this.heli;h.noWreck=on;this.cockpitHide(on);
  h.root.traverse(o=>{if(!o.isMesh)return;if(o.userData.rightPilot||o.userData.panelGauge||o.userData.panelHood)o.visible=!on;if(o.userData.pedestalBody)o.visible=!on;if(o.userData.pedestalNarrow)o.visible=on;});
  if(h.panelMaterial){const m=h.panelMaterial;m.userData.outsideMap??=m.map;if(on&&!this.cleanPanel&&typeof document!=='undefined'){this.cleanPanel=new T.TextureLoader().load(MODEL_FILES.panel,t=>{t.colorSpace=T.SRGBColorSpace;t.flipY=false;if(h.noWreck&&m.map===this.cleanPanel)m.needsUpdate=true;});this.cleanPanel.colorSpace=T.SRGBColorSpace;this.cleanPanel.flipY=false;}
   const want=on&&this.cleanPanel?this.cleanPanel:m.userData.outsideMap;if(m.map!==want){m.map=want;m.needsUpdate=true;}
   /* v0.38.2 cockpit: black instrument panel (satin, not dead matte) */m.userData.outside??={color:m.color.clone(),roughness:m.roughness,metalness:m.metalness};if(on){m.color.setScalar(.13);m.roughness=.42;m.metalness=.15;}else{m.color.copy(m.userData.outside.color);m.roughness=m.userData.outside.roughness;m.metalness=m.userData.outside.metalness;}}
  if(!on){this.ckFocus=null;for(const ch of h.rotor.children)ch.visible=true;}}
 /* v0.38.2 rotor plane seen from the seat: the turning rotor shows as its disc, a slow / stopped rotor as its blades */
 cockpitRotor(p){const rpm=p?.ground?.rotorRpm??p?.rotorRpm??0,fast=rpm>90&&!p?.contact,blur=this.heli.rotorBlur??[];
  for(const ch of this.heli.rotor.children)if(!blur.includes(ch))ch.visible=!fast;for(const m of blur){m.visible=fast;m.material.opacity=fast?.07+.13*Math.max(0,Math.min(1,(324-rpm)/150)):.055;}} /* v0.38.4 a slowing rotor shows more */
 /* v0.38.4 switch-driven exterior lights and windshield wipers */
 airframeLights(o,p){if(!o)return;const t=performance.now()/1000,night=o.night;
  {const on=!!o.pos&&(o.pos==='steady'||t%1<.55),k=(o.posBright?1:.6)*(.35+.65*night);for(const s of this.posLights??[]){s.visible=on;s.scale.setScalar(.25+.45*k);s.material.opacity=.55+.45*k;}}
  {const flash=o.antiColl&&(t*1.4)%1<.18;if(this.beaconSpr){this.beaconSpr.visible=flash;this.beaconSpr.scale.setScalar(.6+.6*night);}if(this.beaconLight)this.beaconLight.intensity=flash?4+20*night:0;}
  const W=this.wipers;if(W){const sel=o.wiperSel;for(const w of W){const run=o.wipers>0&&(sel===1||(sel===0)===(w.side==='R'));w.ph=run?(w.ph??0)+(this.dtWiper??.016)*o.wipers*Math.PI*2:(w.ph??0);if(!run&&w.ph%(Math.PI*2)>.05){w.ph+= .1;} const a=(.5-.5*Math.cos(w.ph))*1.05;w.g.rotation.x=w.sign*a;}}
  const now=performance.now();this.dtWiper=Math.min(.05,(now-(this.lastWiper??now))/1000);this.lastWiper=now;}
 setupWipers(){const h=this.heli,out=[];for(const [nm,side] of [['LHwiper_LHwipermesh','L'],['RHwiper_RHwipermesh','R']]){const m=h.root.getObjectByName(nm);if(!m)continue;
   h.root.updateMatrixWorld(true);const par=m.parent,inv=par.matrixWorld.clone().invert(),pa=m.geometry.attributes.position,v=new T.Vector3(),pts=[];for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m.matrixWorld).applyMatrix4(inv);pts.push(v.clone());}
   const maxY=Math.max(...pts.map(q=>q.y)),top=pts.filter(q=>q.y>maxY-.02),pv=top.reduce((a,q)=>a.add(q),new T.Vector3()).multiplyScalar(1/top.length),far=pts.reduce((a,q)=>q.distanceTo(pv)>a.distanceTo(pv)?q:a,pv);
   const g=new T.Group();g.position.copy(pv);par.add(g);g.updateMatrixWorld(true);g.attach(m);out.push({g,side,sign:Math.sign(far.z-pv.z)||1,ph:0});}
  this.wipers=out;}
 cockpitHide(on){const keep=new Set(Object.values(this.heli.parts).filter(g=>g.parent===this.heli.root));
  for(const ch of this.heli.root.children){if(ch===this.cpit.group||ch.isLight||ch===this.landingLight?.target||keep.has(ch))continue;
   if(on){if(ch.userData.ckVis===undefined)ch.userData.ckVis=ch.visible;ch.visible=false;}else if(ch.userData.ckVis!==undefined){ch.visible=ch.userData.ckVis;delete ch.userData.ckVis;}}}
 resize(){if(this.fallback)return this.fallback.resize();if(!this.renderer)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 preset(kind){if(this.fallback)return this.fallback.preset(kind);if(!this.renderer)return;
  this.cockpit=kind==='cockpit';this.controls.enabled=!this.cockpit;this.camera.fov=this.cockpit?80:43;this.camera.near=this.cockpit?.045:.5;this.camera.updateProjectionMatrix();this.cockpitMode(this.cockpit);if(this.cockpit){this.follow=false;this.look.yaw=0;this.look.pitch=-.13;this.placeCockpit();return;}const p=this.heli.root.position;this.fieldView=kind==='fields';this.follow=!['overview','fields'].includes(kind);const target=kind==='fields'?this.fieldCenter??p.clone():new T.Vector3(0,0,-170);this.controls.target.copy(this.follow?p:target).add(new T.Vector3(0,this.follow?2:0,0));const offsets={close:[24,14,24],side:[0,5,29],top:[.1,43,0],overview:[440,650,600],fields:[150,140,120]};this.camera.position.copy(this.controls.target).add(new T.Vector3(...offsets[kind]).multiplyScalar(kind==='fields'?(this.fieldDistance??240)/Math.hypot(...offsets.fields):1));this.controls.update();}
 update(session){this.lastSession=session;if(this.fallback)return this.fallback.update(session);if(!this.renderer)return;
  const area=session.config.flightArea??'terrain',areaCenter={x:Math.round((session.config.startX??0)/200)*200,z:Math.round((session.config.startZ??0)/200)*200},areaKey=area+':'+areaCenter.x+':'+areaCenter.z;if(areaKey!==this.areaKey){this.areaKey=areaKey;disposeArea(this.areaRoot);disposeArea(this.areaDetail);this.areaRoot=makeAreaScene(area,areaCenter);this.scene.add(this.areaRoot);this.areaDetail=area==='terrain'||area==='mountain'?mergeStatic(addTerrainDetail(this.scene,REAL_AREAS[area].features,area)):area==='airfield'?mergeStatic(addTerrainDetail(this.scene,AIRFIELD_FEATURES,area)):null;this.flightArea=area;this.sharpen(this.scene);this.precompile();}
  const lesson=session.scenario.lesson==='S01'?lessonView(session.time,session.choices(),session.scenario.decisions):null;
  const overlays=flightOverlays(session.time,session.scenario,session.config,session.choices());
  this.fields.visible=overlays.visible;
  this.overlays=overlays;
  const entries=[...overlays.targets,...(overlays.prediction?[{id:'prediction',label:'T',position:overlays.prediction}]:[])],signature=entries.map(t=>t.id).join('|');
  if(signature!==this.markerSignature){
   for(const child of [...this.fields.children]){child.geometry?.dispose();child.material?.map?.dispose();child.material?.dispose();this.fields.remove(child);}
   this.fieldMarkers=[];this.fieldLabels=[];this.markerSignature=signature;
   for(const entry of entries){
    const marker=new T.Mesh(new T.RingGeometry(9,10,48),new T.MeshBasicMaterial({color:'#8dcde2',side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;this.fields.add(marker);this.fieldMarkers.push(marker);
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#17332f';ctx.fillRect(0,0,128,64);ctx.fillStyle='white';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText(entry.label,64,46);
    const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:true,sizeAttenuation:false}));sprite.scale.set(.05,.025,1);/* v0.33: constant screen size */this.fields.add(sprite);this.fieldLabels.push(sprite);
   }
  }
  const points=entries.map(t=>t.position);
  entries.forEach((t,i)=>{this.fieldMarkers[i].position.set(...t.position);this.fieldMarkers[i].material.color.set(t.id==='prediction'?'#f5e6a5':t.selected?'#ffc05a':'#8dcde2');this.fieldLabels[i].position.set(t.position[0],t.position[1]+(t.id==='prediction'?12:5),t.position[2]);});
  const frame=fieldFrame(overlays,this.camera.aspect,this.camera.fov),center=new T.Vector3(...frame.center);this.fieldDistance=frame.distance;
  if(this.fieldView&&this.fieldCenter){const delta=center.clone().sub(this.fieldCenter);this.camera.position.add(delta);this.controls.target.add(delta);}this.fieldCenter=center;
  this.regimeHalo.visible=overlays.vrs||overlays.overspeed;this.regimeHalo.material.color.set(overlays.overspeed?'#ff665b':'#ffad52');this.regimeHalo.rotation.z=session.time;
  this.flow.visible=overlays.airflow;
  this.flow.children.forEach(a=>a.setDirection(new T.Vector3(...overlays.flowDirection)));

const s=sampleScene(session.time,session.scenario,session.config,session.choices()),p=new T.Vector3(...s.position);if(this.follow){const d=p.clone().sub(this.previous);this.camera.position.add(d);this.controls.target.add(d);}this.previous.copy(p);this.flow.position.copy(p);this.heli.root.position.copy(p);this.heli.root.rotation.order='YZX';this.heli.root.rotation.set(s.roll,s.heading,s.pitch);this.heli.rotor.rotation.y=s.rotorAngle;this.heli.tail.rotation.z=s.tailAngle;applyDamageVisual(this.heli,s.physicalState);animateHelicopter(this.heli,s);this.doorState(session,s);{const o=this.cpit.outputs(s.physicalState,session.time,session.config);this.cpit.out=o;this.airframeLights(o,s.physicalState);this.cpit.warnSound(o,!!session.playing);}if(this.cockpit){this.cockpitHide(true);this.cockpitRotor(s.physicalState);}else if(this.heli.rotorBlur)for(const m of this.heli.rotorBlur)m.material.opacity=.055; /* v0.35.4 damage/animation passes must not re-show the rotor around the eye */
  {/* v0.34.1 emergency smoke / fire and vibration */const pg=s.physicalState.program,sm=pg?.smoke??0,tNow=session.time;this.vib=pg?.vibration??0;
   const cab=pg?.smokeKind==='cabin',lp=k=>new T.Vector3(cab?.3:-2.7,cab?1.3:2.8,cab?(k%2?1.3:-1.3):0),last=this.smokeTrail.at(-1);
   if(!sm)this.smokeTrail=[];
   else if(!last||tNow<last.t-.05||tNow-last.t>.6){/* seek / restart: rebuild the trail from the flight history so a scrubbed-to moment shows the smoke behind it */
    this.smokeTrail=[];const o=this.smokeProbe??=new T.Object3D();o.rotation.order='YZX';
    for(let tt=Math.max(0,tNow-8.5),k=0;tt<=tNow+1e-6;tt+=.12,k++){const q=sampleScene(tt,session.scenario,session.config,session.choices()),qs=q.physicalState.program?.smoke??0;if(!qs)continue;o.position.set(...q.position);o.rotation.set(q.roll,q.heading,q.pitch);o.updateMatrixWorld(true);this.smokeTrail.push({t:tt,p:o.localToWorld(lp(k)).toArray(),s:Math.min(1,qs)});}}
   else if(tNow-last.t>=.07){this.heli.root.updateMatrixWorld(true);this.smokeTrail.push({t:tNow,p:this.heli.root.localToWorld(lp(this.smokeTrail.length)).toArray(),s:Math.min(1,sm)});if(this.smokeTrail.length>220)this.smokeTrail.shift();}
   const wd=session.config.windFromDeg*Math.PI/180,wk=session.config.windKt*.5144;updateSmoke(this.smoke,{trail:this.smokeTrail,time:tNow,windX:-Math.sin(wd)*wk,windZ:Math.cos(wd)*wk,kind:pg?.smokeKind});
   const fire=!!pg?.warn?.fire&&pg?.smokeKind!=='cabin'&&(s.physicalState.engineRpm??0)>500;this.flame.visible=fire;if(fire){const f=.9+Math.sin(tNow*23)*.18+Math.sin(tNow*37)*.12;this.flame.scale.set(1.3*f,1.5*f,1);}}
  {const show=session.config.mode==='manual'&&!this.cockpit&&(typeof document==='undefined'||document.getElementById('ghost-toggle')?.checked!==false);this.ghost.root.visible=show;
   if(show){try{const gc={...session.config,mode:'watch',manualRunId:''},g=sampleScene(session.time,{...session.baseScenario,duration:1e9},gc,[]);this.ghost.root.position.set(...g.position);this.ghost.root.rotation.order='YZX';this.ghost.root.rotation.set(g.roll,g.heading,g.pitch);this.ghost.rotor.rotation.y=g.rotorAngle;this.ghost.tail.rotation.z=g.tailAngle;}catch{this.ghost.root.visible=false;}}}
  {/* v0.35 second helicopter (kol lideri / destek unsuru): the own flight path shifted in time and offset sideways */const W=this.wingHeli;let on=false;
   try{const c=session.config;if(c.program==='maneuver'){const run=programRun(c,c.mode==='guided'?(session.answers??[]):[]),keys=run.wing??[],t=session.time;let k=null,prev=null;for(const q of keys){if(q.at<=t+1e-6){prev=k;k=q;}}
     if(k&&!k.off){const b=prev&&!prev.off?Math.min(1,(t-k.at)/5):1,mix=f=>(prev&&!prev.off?prev[f]??0:k[f]??0)*(1-b)+(k[f]??0)*b,ts=Math.max(0,Math.min(run.duration,t+mix('shift'))),q=sampleScene(ts,session.scenario,c,session.choices());
      const th=q.heading,r=mix('right'),u=mix('up'),x=q.position[0]+Math.sin(th)*r,z=q.position[2]+Math.cos(th)*r,y=Math.max(terrainHeight(x,z,this.flightArea),q.position[1]+u);
      W.root.position.set(x,y,z);W.root.rotation.order='YZX';W.root.rotation.set(q.roll,th,q.pitch);W.rotor.rotation.y=q.rotorAngle+1.3;W.tail.rotation.z=q.tailAngle;on=true;}}}catch(e){console.warn(e);}
   W.root.visible=on;this.wingOn=on;}
  {const near=this.cockpit||this.camera.position.distanceTo(p)<90,S=near?34:160;if(this.sunS!==S){this.sunS=S;Object.assign(this.sun.shadow.camera,{left:-S,right:S,top:S,bottom:-S});this.sun.shadow.camera.updateProjectionMatrix();this.sun.shadow.normalBias=near?.012:.04;}}
  this.sun.position.copy(p).add(new T.Vector3(100,180,70));this.sun.target.position.copy(p);if(!this.sun.target.parent)this.scene.add(this.sun.target);
  const a=this.guide.geometry.attributes.position;a.setXYZ(0,p.x,terrainHeight(p.x,p.z,this.flightArea)+.08,p.z);a.setXYZ(1,p.x,p.y,p.z);a.needsUpdate=true;this.guide.geometry.computeBoundingSphere();this.guide.computeLineDistances();
  const dir=session.config.windFromDeg*Math.PI/180;this.wind.setDirection(new T.Vector3(-Math.sin(dir),0,Math.cos(dir)));this.wind.setLength(3+session.config.windKt*.3,2,1);this.wind.visible=session.config.windKt>0;
  const weather=visualWeather(session.config);this.scene.fog.far=weather.fogFar;this.scene.fog.near=weather.fogNear;this.scene.fog.color.set(weather.sky);this.renderer.setClearColor(weather.sky);this.sun.intensity=weather.sunIntensity*1.2;this.sun.color.set(weather.sunColor);this.ambient.intensity=weather.ambient*.5;this.ambient.color.set(session.config.lighting==="dusk"?"#d9c2b8":"#cfe0f2");this.ambient.groundColor.set(this.flightArea==="water"?"#3b5a63":"#5d5a40");updateClouds(this.clouds,weather,session.config.cloudCover);{const o=this.cpit.out,dk=session.config.lighting==='dusk';this.landingLight.intensity=o&&(o.landing||o.landingAuto)?(weather.night?60:dk?18:5):0;if(this.searchLight)this.searchLight.intensity=o?.search?(weather.night?45:dk?14:4):0;} /* v0.38.4 LANDING / SEARCH LIGHT switches */this.rainOn=!!weather.rain;this.sunDir=updateSky(this.sky,weather,session.config.lighting,session.config.cloudCover).clone();this.sun.position.copy(p).addScaledVector(this.sunDir,260);this.env={time:session.time,position:s.position,agl:s.physicalState.heightAglFt*.3048,rpmRatio:(s.physicalState.rotorRpm??0)/324,area:this.flightArea,contact:s.physicalState.contact,windFromDeg:session.config.windFromDeg,windKt:session.config.windKt,impact:s.physicalState.contact&&session.time-s.physicalState.contact.time<1.2?Math.min(1,(s.physicalState.contact.descentMps??2)/4)*(1-(session.time-s.physicalState.contact.time)/1.2):0};
  this.lastPhysical=s.physicalState;try{this.cues=buildCues(session);}catch(e){console.warn(e);this.cues=[];}this.ckArgs={time:session.time,config:session.config,cues:this.cues};
  const motionStatus=document.getElementById('motion-status');if(motionStatus)motionStatus.textContent=motionLabel(s.physicalState);
  document.getElementById('scene-status').textContent=overlays.visible?overlays.text:'Başlangıç konumu · motor gücü mevcut';
 }
 /* v0.39 uyarlanan çözünürlük: kare süresi uzun kalırsa piksel oranı adım adım düşer, rahatlayınca geri çıkar (donma / takılma azalır) */
 adaptRes(){const now=performance.now(),P=this.perf??={last:now,acc:0,n:0,pr:Math.min(devicePixelRatio,2),since:now};const dt=now-P.last;P.last=now;if(dt>0&&dt<500){P.acc+=dt;P.n++;}
  if(now-P.since>2500&&P.n>20){const avg=P.acc/P.n,max=Math.min(devicePixelRatio,2);let pr=P.pr;if(avg>30&&pr>1)pr=Math.max(1,pr-.25);else if(avg<17&&pr<max)pr=Math.min(max,pr+.25);if(pr!==P.pr){P.pr=pr;this.renderer.setPixelRatio(pr);this.resize?.();}P.acc=0;P.n=0;P.since=now;}}
 draw(){if(this.fallback)return this.fallback.draw();if(this.renderer)this.adaptRes();if(this.renderer&&!this.contextLost&&this.host.offsetWidth){{const a=this.ckArgs,ses=this.lastSession,manual=ses?.config?.mode==='manual'&&!isManualProgram(ses?.config);const cur=a&&!manual?this.narr.update(a.time,this.cues,{playing:!!ses?.playing}):(this.narr.update(-1,[]),null);
   /* v0.38.3 caution panel and control display stay visible in the cockpit (CSS places them small) */
   if(this.cockpit){const ck=cur?cur.at.toFixed(2)+'|'+cur.title:null;if(ck!==this.ckCue){this.ckCue=ck;this.ckCueAt=performance.now();this.lookAtPart(cur?.target??null);}
   else if(cur&&!['out','wing','lz'].includes(cur.target)&&!this.look.drag&&performance.now()-(this.look.userAt??0)>2500){/* v0.35.7 a glance inside, then eyes outside again: sooner when moving */const kt=this.lastPhysical?.iasKt??0,hold=kt>10?1700:3200;if(performance.now()-(this.ckCueAt??0)>hold){this.look.tYaw=0;this.look.tPitch=-.13;}}else if(cur&&(cur.target==='wing'||cur.target==='lz'))this.lookAtPart(cur.target);if(this.lastPhysical)this.cpit.update(this.lastPhysical,a??{});this.placeCockpit();}
   let xy=null;if(cur&&this.cockpit&&cur.target&&cur.target!=='out'){const w=this.worldTarget(cur.target);if(w){const v=w.clone().project(this.camera);if(v.z<1&&Math.abs(v.x)<.97&&Math.abs(v.y)<.97){xy=[(v.x+1)/2*this.host.clientWidth,(1-v.y)/2*this.host.clientHeight];}}}this.narr.point(xy);}if(!this.cockpit)this.controls.update();this.animateEnvironment();this.renderer.render(this.scene,this.camera);this.picker?.refresh();}}
}
