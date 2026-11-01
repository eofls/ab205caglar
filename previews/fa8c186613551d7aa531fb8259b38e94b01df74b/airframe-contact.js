// Swept geometric envelopes in model-local axes (nose +X). Not blade flex/FEA.
import {terrainHeight,obstacleHeight} from './terrain-data.js';
export const CONTACT_POINTS=[
 ...[-1,1].flatMap(side=>[-1.9,2.05].map(x=>({part:side<0?'skidLeft':'skidRight',point:[x,0,side*1.3]}))),
 {part:'cabin',point:[0,.72,0]},{part:'cockpit',point:[3.1,1.05,0]},
 {part:'tailBoom',point:[-8.4,1.92,0]},{part:'fin',point:[-9.42,4.06,0]},
 ...[-1,1].map(side=>({part:'stabilizer',point:[-6.45,2.12,side*1.4]})),
 ...Array.from({length:12},(_,i)=>({part:'tailRotor',point:[-8.95+1.3*Math.cos(i*Math.PI/6),3.75+1.3*Math.sin(i*Math.PI/6),-.48]})),
 ...Array.from({length:16},(_,i)=>({part:'mainRotor',point:[-.3+7.35584*Math.cos(i*Math.PI/8),4.15,7.35584*Math.sin(i*Math.PI/8)]}))];
export function worldPoint(point,s){const [x,y,z]=point,cr=Math.cos(s.roll??0),sr=Math.sin(s.roll??0),cp=Math.cos(s.pitch??0),sp=Math.sin(s.pitch??0),sh=Math.sin(s.heading??0),ch=Math.cos(s.heading??0),y1=y*cr-z*sr,z1=y*sr+z*cr,x2=x*cp+y1*sp,y2=-x*sp+y1*cp;return [(s.x??0)+x2*sh+z1*ch,(s.y??0)+y2,(s.z??0)-x2*ch+z1*sh];}
export function airframeClearance(s,area="terrain"){
 let min={gap:Infinity,part:null,point:null};
 for(const q of CONTACT_POINTS){const p=worldPoint(q.point,s),gap=p[1]-obstacleHeight(p[0],p[2],area);if(gap<min.gap)min={gap,part:q.part,point:p,obstacle:obstacleHeight(p[0],p[2],area)>terrainHeight(p[0],p[2],area)+1};}return min;
}
