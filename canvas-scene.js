import {AIRFIELD_FEATURES} from './assets/terrain/guvercinlik-osm.js';
import {areaObjects} from './area-scene.js';
import {RUNWAY} from './terrain-data.js';
import {roadSamples} from './terrain-detail.js';
import {terrainColor,FEATURES,landCoverAt} from './terrain-data.js';
import {applyDamageVisual} from './component-damage.js';
import {fieldFrame} from './field-frame.js';
import {SitePicker} from './site-picker.js';
import {flightOverlays} from './flight-overlays.js';
import {motionLabel} from './flight-dynamics.js';
// CPU-projected 3D compatibility renderer. Uses the same geometry and timeline,
// but no WebGL context; lighting, terrain and decals are simplified.
import * as T from './vendor/three.module.js';
import {animateHelicopter} from './scene-model.js';
import {createHelicopter} from './scene-model-legacy.js'; // v0.38: the no-WebGL compatibility view keeps the light procedural airframe
import {sampleScene,terrainHeight} from './scene-motion.js';
import {visualWeather} from './visual-weather.js';
import {lessonView} from './scenario-lesson.js';
export function projectPoint(point,matrix,width,height){
 const p=new T.Vector3(...point).applyMatrix4(matrix);
 if(![p.x,p.y,p.z].every(Number.isFinite)||p.z< -1||p.z>1)return null;
 return [(p.x+1)*width/2,(1-p.y)*height/2];
}
export class CanvasScene{
 constructor(host,reason){
  this.host=host;this.canvas=document.createElement('canvas');this.canvas.setAttribute('aria-label','Uyumluluk 3B görünümü. Fareyle sürükle: döndür; tekerlek: yakınlaştır; sağ sürükle: kaydır.');
  this.ctx=this.canvas.getContext('2d');this.dirty=true;this.distance=32;this.azimuth=.8;this.elevation=.35;this.pan=new T.Vector3();this.target=new T.Vector3();this.follow=true;
  this.camera=new T.PerspectiveCamera(43,1,.1,10000);this.heli=createHelicopter();this.meshes=[];
  this.heli.root.traverse(o=>{if(o.isMesh&&!o.material.map&&!o.userData.webglOnly)this.meshes.push(o);});
  if(!this.ctx){host.querySelector('#scene-status').textContent='Tarayıcı 3B ve uyumluluk çizimini başlatamadı. Sayfayı yeniden açmayı deneyebilirsin.';return;}
  host.appendChild(this.canvas);this.canvas.style.touchAction='none';
  host.querySelector('#scene-status').textContent='Uyumluluk 3B görünümü · WebGL gerektirmez';
  host.querySelector('#scene-status').title='WebGL başlatma bilgisi: '+String(reason?.message??reason??'bağlam kullanılamadı');
  let drag=null;this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
  this.canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey,id:e.pointerId};this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
   if(drag.pan){const scale=this.distance/Math.max(100,this.host.clientHeight);this.pan.x-=Math.cos(this.azimuth)*dx*scale;this.pan.z+=Math.sin(this.azimuth)*dx*scale;this.pan.y+=dy*scale;}
   else{this.azimuth-=dx*.008;this.elevation=Math.max(.05,Math.min(1.52,this.elevation+dy*.008));}this.dirty=true;
  });
  const stop=()=>{drag=null;};this.canvas.addEventListener('pointerup',stop);this.canvas.addEventListener('pointercancel',stop);this.canvas.addEventListener('lostpointercapture',stop);
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.distance=Math.max(7,Math.min(2200,this.distance*Math.exp(e.deltaY*.001)));this.dirty=true;},{passive:false});
  this.picker=new SitePicker(host,this.canvas,this.camera,()=>({flightArea:this.session?.config.flightArea,targets:this.overlays?.targets??[],position:this.heli.root.position.toArray()}));
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
 }
 resize(){if(!this.ctx)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.width=w;this.height=h;const ratio=Math.min(globalThis.devicePixelRatio||1,1.5);this.canvas.width=Math.round(w*ratio);this.canvas.height=Math.round(h*ratio);this.ctx.setTransform(ratio,0,0,ratio,0,0);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.dirty=true;}
 preset(kind){this.fieldView=kind==='fields';this.pan.set(0,0,0);this.follow=!['overview','fields'].includes(kind);const presets={close:[32,.8,.35],side:[29,0,.13],top:[43,0,1.5],overview:[1000,.65,.7],fields:[240,.8,.65]};[this.distance,this.azimuth,this.elevation]=presets[kind]??presets.close;this.target.set(0,0,-170);if(this.fieldView){const frame=fieldFrame(this.overlays,this.camera.aspect);this.target.set(...frame.center);this.distance=frame.distance;}this.dirty=true;}
 update(session){if(!this.ctx)return;this.session=session;const state=sampleScene(session.time,session.scenario,session.config,session.choices());this.heli.root.position.set(...state.position);this.heli.root.rotation.order='YZX';this.heli.root.rotation.set(state.roll,state.heading,state.pitch);this.heli.rotor.rotation.y=state.rotorAngle;this.heli.tail.rotation.z=state.tailAngle;applyDamageVisual(this.heli,state.physicalState);animateHelicopter(this.heli,state);this.heli.root.updateMatrixWorld(true);this.weather=visualWeather(session.config);this.overlays=flightOverlays(session.time,session.scenario,session.config,session.choices());if(this.fieldView){const frame=fieldFrame(this.overlays,this.camera.aspect);this.target.set(...frame.center);const signature=this.overlays.targets.map(t=>t.id).join('|');if(signature!==this.fieldSignature)this.distance=frame.distance;this.fieldSignature=signature;}this.dirty=true;
  this.host.querySelector('#scene-status').textContent='Uyumluluk 3B · '+(this.overlays.visible?this.overlays.text:'başlangıç');
  this.host.querySelector('#motion-status').textContent=motionLabel(state.physicalState);
 }
 draw(){if(!this.ctx||!this.session||!this.dirty||!this.host.offsetWidth)return;const now=performance.now();if(now-(this.lastDraw??-100)<40)return;this.lastDraw=now;this.dirty=false;
  const ctx=this.ctx,w=this.width,h=this.height,weather=this.weather;ctx.fillStyle=weather.sky;ctx.fillRect(0,0,w,h);
  const target=(this.follow?this.heli.root.position.clone().add(new T.Vector3(0,2,0)):this.target.clone()).add(this.pan);
  this.camera.position.copy(target).add(new T.Vector3(Math.sin(this.azimuth)*Math.cos(this.elevation),Math.sin(this.elevation),Math.cos(this.azimuth)*Math.cos(this.elevation)).multiplyScalar(this.distance));this.camera.lookAt(target);this.camera.updateMatrixWorld(true);
  this.picker?.refresh();
  const view=this.camera.matrixWorldInverse,projection=new T.Matrix4().multiplyMatrices(this.camera.projectionMatrix,view),faces=[],modelFaces=[];
  const add=(vertices,color,model=false,opacity=1)=>{if(!model){const clipped=[];for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],da=-new T.Vector3(...a).applyMatrix4(view).z-.101,db=-new T.Vector3(...b).applyMatrix4(view).z-.101;if(da>=0)clipped.push(a);if((da>=0)!==(db>=0)){const f=da/(da-db);clipped.push(a.map((v,j)=>v+(b[j]-v)*f));}}vertices=clipped;if(vertices.length<3)return;}const pts=vertices.map(v=>projectPoint(v,projection,w,h));if(pts.some(p=>!p))return;if(pts.every(p=>p[0]<0)||pts.every(p=>p[0]>w)||pts.every(p=>p[1]<0)||pts.every(p=>p[1]>h))return;
   const center=vertices.reduce((a,v)=>a.add(new T.Vector3(...v)),new T.Vector3()).multiplyScalar(1/vertices.length);(model?modelFaces:faces).push({pts,color,opacity,z:vertices.map(v=>new T.Vector3(...v).applyMatrix4(projection).z),depth:center.clone().applyMatrix4(view).z,distance:center.distanceTo(this.camera.position)});
  };
  const area=this.session.config.flightArea??'terrain',height=(x,z)=>terrainHeight(x,z,area);
  const step=area==='water'?60:this.distance<100?70:120;
  for(let x=-3000;x<3000;x+=step)for(let z=-3000;z<3000;z+=step){const corners=[[x,z],[Math.min(3000,x+step),z],[Math.min(3000,x+step),Math.min(3000,z+step)],[x,Math.min(3000,z+step)]],col=new T.Color(...terrainColor(x,z,area));const slope=(height(x+step,z)-height(x,z))/step;col.multiplyScalar(.95-Math.max(-.1,Math.min(.1,slope)));for(const ids of [[0,1,2],[0,2,3]])add(ids.map(i=>[corners[i][0],height(...corners[i]),corners[i][1]]),'#'+col.getHexString());}
  for(const f of area==='terrain'?FEATURES:area==='airfield'?AIRFIELD_FEATURES:[]){if(f.tags.highway){const points=roadSamples(f.points);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],width=f.tags.highway==='track'?2:f.tags.highway==='taxiway'?(Number(f.tags.width)||15)/2:3,len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len*width,nz=(b[0]-a[0])/len*width;add([[a[0]-nx,a[1]-nz],[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz]].map(([x,z])=>[x,height(x,z)+.15,z]),'#b9ac8a');}}
   if(f.tags.aeroway==='apron')add(f.points.map(([x,z])=>[x,height(x,z)+.06,z]),'#b0ada1');
   if(f.tags.building){const pts=f.points.slice(0,-1),buildingHeight=Number(f.tags.height)||3;add(pts.map(([x,z])=>[x,height(x,z)+buildingHeight,z]),'#957462');for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],ya=height(...a),yb=height(...b);add([[a[0],ya,a[1]],[b[0],yb,b[1]],[b[0],yb+buildingHeight,b[1]],[a[0],ya+buildingHeight,a[1]]],'#c8bfa9');}}
  }
  for(let i=0;i<(area==='terrain'?600:0);i++){const x=(i*73.27%900)-450,z=(i*137.31%1600)-800;if(Math.hypot(x-this.camera.position.x,z-this.camera.position.z)>230)continue;const y=height(x,z),k=.2+(i%7)*.08;add([[x-k,y,z],[x,y+k,z],[x+k,y,z]],i%2?'#737451':'#91896a');}
  // Contact shadow anchors the helicopter to terrain; no extra physics impulse.
  const hp=this.heli.root.position,gh=height(hp.x,hp.z),alt=Math.max(0,hp.y-gh);if(alt<50){const pts=[];for(let i=0;i<20;i++){const a=i/20*Math.PI*2;pts.push([hp.x+Math.cos(a)*5,gh+.03,hp.z+Math.sin(a)*2]);}add(pts,'#514e3c',false,.24*Math.max(0,1-alt/60));}
  if(this.areaKey!==area){this.areaKey=area;this.areaItems=areaObjects(area);}
  for(const o of this.areaItems){
   if(o.kind==='tree'){if(Math.hypot(o.x-this.camera.position.x,o.z-this.camera.position.z)>1800)continue;const y=o.y,h=o.height;add([[o.x-.35,y,o.z],[o.x+.35,y,o.z],[o.x+.35,y+h*.7,o.z],[o.x-.35,y+h*.7,o.z]],'#584938');for(const axis of [0,1]){const dx=axis?0:5,dz=axis?5:0;add([[o.x-dx,y+h*.3,o.z-dz],[o.x+dx,y+h*.3,o.z+dz],[o.x,y+h,o.z]],axis?'#334c2b':'#3b5630');}}
   else {const a=RUNWAY.heading;for(let along=-o.length/2;along<o.length/2;along+=20){const end=Math.min(o.length/2,along+20),pts=[[-o.width/2,along],[o.width/2,along],[o.width/2,end],[-o.width/2,end]].map(([q,l])=>{const x=o.x+q*Math.cos(a)+l*Math.sin(a),z=o.z+q*Math.sin(a)-l*Math.cos(a);return [x,height(x,z)+.1,z];});add(pts,o.kind==='runway'?'#4b4c48':'#eee9d8');}}
  }
  for(const mesh of this.meshes){if(!mesh.visible)continue;const p=mesh.geometry.attributes.position,index=mesh.geometry.index,world=[];for(let i=0;i<p.count;i++)world.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray());
   const count=index?index.count:p.count;for(let i=0;i<count;i+=3){const vertices=[0,1,2].map(j=>world[index?index.getX(i+j):i+j]);const a=new T.Vector3(...vertices[1]).sub(new T.Vector3(...vertices[0])),b=new T.Vector3(...vertices[2]).sub(new T.Vector3(...vertices[0])),normal=a.cross(b).normalize();if(mesh.material.side!==T.DoubleSide&&normal.dot(this.camera.position.clone().sub(new T.Vector3(...vertices[0])))<=0)continue;const light=.65+.35*Math.abs(normal.dot(new T.Vector3(.4,.8,.3).normalize()));add(vertices,'#'+mesh.material.color.clone().multiplyScalar(light).getHexString(),true,mesh.material.opacity??1);}
  }
  for(const f of faces)for(let i=1;i<f.pts.length-1;i++)modelFaces.push({...f,pts:[f.pts[0],f.pts[i],f.pts[i+1]],z:[f.z[0],f.z[i],f.z[i+1]]});
  // Per-pixel depth for overlapping airframe surfaces: average triangle sorting
  // cannot resolve glazing, paint and curved cabin intersections reliably.
  const rw=Math.ceil(w),rh=Math.ceil(h);
  if(!this.modelCanvas){this.modelCanvas=document.createElement('canvas');this.modelCtx=this.modelCanvas.getContext('2d');}
  this.modelCanvas.width=rw;this.modelCanvas.height=rh;
  const pixels=this.modelCtx.createImageData(rw,rh),depth=new Float32Array(rw*rh);depth.fill(Infinity);
  modelFaces.sort((a,b)=>(a.opacity<1)-(b.opacity<1)||(a.opacity<1?a.depth-b.depth:0));
  for(const f of modelFaces){const [a,b,c]=f.pts,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;
   const rgb=parseInt(f.color.slice(1),16),alpha=Math.round(255*f.opacity*Math.max(.08,1-Math.max(0,(f.distance-weather.fogNear)/(weather.fogFar-weather.fogNear))));
   const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(rw-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(rh-1,Math.ceil(Math.max(a[1],b[1],c[1])));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den,v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den,t=1-u-v;if(u<0||v<0||t<0)continue;const z=u*f.z[0]+v*f.z[1]+t*f.z[2],i=y*rw+x;if(z>=depth[i])continue;if(f.opacity>=1)depth[i]=z;const k=i*4,src=alpha/255,dst=pixels.data[k+3]/255,out=src+dst*(1-src);for(let c=0;c<3;c++){const value=(rgb>>(16-c*8))&255;pixels.data[k+c]=out?(value*src+pixels.data[k+c]*dst*(1-src))/out:0;}pixels.data[k+3]=out*255;}
  }
  this.modelCtx.putImageData(pixels,0,0);ctx.drawImage(this.modelCanvas,0,0,w,h);
  const overlay=this.overlays;
  if(overlay.visible){for(const t of [...overlay.targets,...(overlay.prediction?[{label:'T',position:overlay.prediction}]:[])]){const p=projectPoint(t.position,projection,w,h);if(p){ctx.fillStyle=t.label==='T'?'#f5e6a5':t.selected?'#ffc05a':'#8dcde2';ctx.beginPath();ctx.arc(p[0],p[1],10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17332f';ctx.font='bold 12px sans-serif';ctx.fillText(t.label,p[0]-4,p[1]+4);}}}
  if(overlay.vrs||overlay.overspeed){ctx.strokeStyle=overlay.overspeed?'#ff665b':'#ffad52';ctx.lineWidth=2;ctx.beginPath();let started=false;for(let i=0;i<=40;i++){const angle=this.session.time+i/40*Math.PI*1.7;const world=new T.Vector3(Math.cos(angle)*7.36,4.2,Math.sin(angle)*7.36).applyMatrix4(this.heli.root.matrixWorld);const p=projectPoint(world.toArray(),projection,w,h);if(p){if(started)ctx.lineTo(...p);else ctx.moveTo(...p);started=true;}else started=false;}ctx.stroke();}
  if(overlay.airflow){for(const offset of [-2.5,2.5]){const start=this.heli.root.position.clone().add(new T.Vector3(0,2,offset)),end=start.clone().add(new T.Vector3(...overlay.flowDirection).multiplyScalar(5));const a=projectPoint(start.toArray(),projection,w,h),b=projectPoint(end.toArray(),projection,w,h);if(a&&b){const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);ctx.strokeStyle='#8dcde2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.moveTo(b[0]-8*Math.cos(angle-.5),b[1]-8*Math.sin(angle-.5));ctx.lineTo(...b);ctx.lineTo(b[0]-8*Math.cos(angle+.5),b[1]-8*Math.sin(angle+.5));ctx.stroke();}}}
 }
}
