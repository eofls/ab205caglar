// Bounding sphere fit shared by both renderers; leaves room for labels and UI.
export function fieldFrame(overlays,aspect=1,fov=43){
 const points=[...(overlays?.targets??[]).map(t=>t.position),...(overlays?.prediction?[overlays.prediction]:[])];
 if(!points.length)return {center:[0,0,0],distance:240};
 const low=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),high=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
 const center=low.map((v,i)=>(v+high[i])/2),radius=Math.max(30,...points.map(p=>Math.hypot(...p.map((v,i)=>v-center[i]))));
 const half=Math.atan(Math.tan(fov*Math.PI/360)*Math.min(1,aspect));
 return {center,distance:Math.max(240,1.35*radius/Math.sin(half))};
}
