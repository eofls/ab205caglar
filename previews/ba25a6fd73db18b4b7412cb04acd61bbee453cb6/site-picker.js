import * as T from './vendor/three.module.js';
import {terrainHeight,surfaceAt,siteDistances} from './landing-sites.js';
// Same picking/tooltip logic for WebGL and CPU fallback. No DOM strings from user input.
export function groundIntersection(ray,area="terrain"){
 let prev=ray.origin.y-terrainHeight(ray.origin.x,ray.origin.z,area),last=0;
 for(let distance=10;distance<=20000;distance+=10){const p=ray.at(distance,new T.Vector3()),gap=p.y-terrainHeight(p.x,p.z,area);if(prev>=0&&gap<=0){let lo=last,hi=distance;for(let i=0;i<20;i++){const mid=(lo+hi)/2,q=ray.at(mid,new T.Vector3());if(q.y>terrainHeight(q.x,q.z,area))lo=mid;else hi=mid;}const hit=ray.at((lo+hi)/2,new T.Vector3());return Math.abs(hit.x)<=6000&&Math.abs(hit.z)<=6000?hit:null;}prev=gap;last=distance;}
 return null;
}
export class SitePicker{
 constructor(host,canvas,camera,read){
  this.host=host;this.canvas=canvas;this.camera=camera;this.read=read;
  const tip=this.tip=document.createElement('div');tip.className='site-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;host.appendChild(tip);
  let down=null;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,button:e.button,moved:false,at:performance.now()};});
  canvas.addEventListener('pointermove',e=>{this.pointer={x:e.clientX,y:e.clientY};if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>(performance.now()-down.at<400?12:8))down.moved=true;this.refresh();});
  canvas.addEventListener('pointerleave',()=>{this.pointer=null;tip.hidden=true;});
  canvas.addEventListener('pointercancel',()=>{down=null;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerup',e=>{
   const start=down;down=null;if(this.read()?.cockpit)return; /* v0.38.2 cockpit clicks work switches, not field picks */
   if(!start||start.moved||Math.hypot(e.clientX-start.x,e.clientY-start.y)>(performance.now()-start.at<400?12:8))return;
   const hit=this.hit(e.clientX,e.clientY,start.button===2?25:14);if(start.button===2){if(hit.site&&hit.site.id!=='prediction')host.dispatchEvent(new CustomEvent('site-edit',{detail:{remove:hit.site.id}}));return;}
   if(start.button!==0||(hit.site&&hit.site.id!=='prediction'))return;
   const rect=canvas.getBoundingClientRect(),ray=new T.Raycaster();camera.updateMatrixWorld();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
   const point=groundIntersection(ray.ray,this.read()?.flightArea);if(point)host.dispatchEvent(new CustomEvent('site-edit',{detail:{x:point.x,z:point.z}}));else host.dispatchEvent(new CustomEvent('site-miss'));
  });
 }
 hit(x,y,radius=25){const data=this.read(),rect=this.canvas.getBoundingClientRect();let site=null,best=radius;
  this.camera.updateMatrixWorld();for(const t of data?.targets??[]){for(const dy of [0,5]){const p=new T.Vector3(t.x,terrainHeight(t.x,t.z,data?.flightArea)+dy,t.z).project(this.camera);if(p.z< -1||p.z>1)continue;const d=Math.hypot(rect.left+(p.x+1)*rect.width/2-x,rect.top+(1-p.y)*rect.height/2-y);if(d<best){best=d;site=t;}}}return {site,data};
 }
 refresh(){if(!this.pointer)return;const {x,y}=this.pointer,{site,data}=this.hit(x,y);this.tip.hidden=!site;if(!site)return;
  const d=siteDistances(data.position,site,data.flightArea),isT=site.id==='prediction';this.tip.textContent=`${isT?'Tahmini temas noktası (T)':'Aday saha '+site.label}\nYatay: ${d.horizontal.toFixed(1)} m · Dikey: ${d.vertical.toFixed(1)} m\nDoğrudan (hipotenüs): ${d.slant.toFixed(1)} m\nZemin: ${surfaceAt(site.x,site.z,data.flightArea)} · temsili${isT?'\nMevcut kumandalarla hesaplanan temas yeri':'\nSağ tık: sahayı kaldır'}`;
  const rect=this.host.getBoundingClientRect(),left=Math.min(x-rect.left+14,rect.width-this.tip.offsetWidth-6),top=y-rect.top-this.tip.offsetHeight-12;
  this.tip.style.left=Math.max(6,left)+'px';this.tip.style.top=Math.max(6,top)+'px';
 }
 dispose(){this.tip.remove();}
}
