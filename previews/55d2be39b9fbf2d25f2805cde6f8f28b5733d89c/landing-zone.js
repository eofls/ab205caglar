// v0.33 landing-zone assessment, shared by the hazır akış pilot, the guided 1/2 targets, the start map and later
// emergency / manoeuvre scenarios. A spot is judged the way a pilot looks for a forced-landing field:
// slope over the skid footprint, rotor-disk clearance from trees and buildings, surface, power lines, water,
// and whether the final approach path is clear of obstacles.
import {terrainHeight,surfaceProfile,obstacleClearance,obstacleHeight,obstacleTopNear,wireTopNear,treesNear,POWER_LINES} from './terrain-data.js';
export const LZ_LIMITS=Object.freeze({slopeDeg:7,clearMinM:11,clearGoodM:24,wireMinM:40,glidePathDeg:6.5});
const SURFACE_SCORE={paved:1,grass:1,stubble:.95,dirt:.95,sand:.85,rough:.8,field:.72,wetland:.3,rock:.25,forest:0,water:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function slopeDeg(x,z,area,r=4){const h=(dx,dz)=>terrainHeight(x+dx,z+dz,area),d=r*Math.SQRT1_2;
 const gx=((h(r,0)-h(-r,0))/(2*r)+(h(d,d)-h(-d,-d))/(4*d)+(h(d,-d)-h(-d,d))/(4*d))/2,gz=((h(0,r)-h(0,-r))/(2*r)+(h(d,d)-h(-d,-d))/(4*d)-(h(d,-d)-h(-d,d))/(4*d))/2;
 return Math.atan(Math.hypot(gx,gz))*180/Math.PI;}
export function wireHorizontalDistance(x,z,area){let best=Infinity;for(const line of POWER_LINES[area]??[])for(let i=1;i<line.length;i++){const [ax,az]=line[i-1],[bx,bz]=line[i],dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1),0,1);best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}return best;}
// Obstacles under the final approach (from `bearing`, the direction of flight) compared with a shallow glide path.
function approachBlock(x,z,area,bearing){if(bearing==null)return 0;const ux=Math.sin(bearing),uz=-Math.cos(bearing),g=Math.tan(LZ_LIMITS.glidePathDeg*Math.PI/180),floor=terrainHeight(x,z,area);let worst=0;
 for(let d=14;d<=230;d+=12){const px=x-ux*d,pz=z-uz*d,top=obstacleHeight(px,pz,area)-floor,allowed=d*g+1.5;if(top>allowed)worst=Math.max(worst,(top-allowed)/6);}return clamp(worst,0,1);} // flare run ≈150–200 m at low height: obstacles under it are not acceptable
// When nothing usable is in reach the pilot still picks the least-bad spot: lowest and sparsest trees, gentlest slope
// (a forced landing into trees is made into the lowest, thinnest canopy with the least speed). 0..1, higher is better.
function leastBad(x,z,area,slope){const g=terrainHeight(x,z,area),canopy=Math.max(0,obstacleTopNear(x,z,area,8)-g),n=treesNear(x,z,14,area).filter(t=>Math.hypot(t.x-x,t.z-z)<10+t.radius).length;
 return ((1-Math.min(1,canopy/22))*.6+(1-Math.min(1,n/7))*.4)*(slope<=LZ_LIMITS.slopeDeg?1:slope<=15?.5:.15);}
export function assessSpot(x,z,area,{bearing=null}={}){
 const surf=surfaceProfile(x,z,area),reasons=[];
 if(surf.kind==='water')return {x,z,ok:false,score:0,fallback:0,slopeDeg:0,clearM:0,wireM:Infinity,surface:surf.kind,label:surf.label,reasons:['su']};
 const slope=slopeDeg(x,z,area),clear=obstacleClearance(x,z,area,40,1.5),wire=wireHorizontalDistance(x,z,area),block=approachBlock(x,z,area,bearing);
 const sSlope=slope<=3?1:slope<=LZ_LIMITS.slopeDeg?1-.55*(slope-3)/(LZ_LIMITS.slopeDeg-3):0;
 const sClear=clear>=LZ_LIMITS.clearGoodM?1:clear>=LZ_LIMITS.clearMinM?.35+.65*(clear-LZ_LIMITS.clearMinM)/(LZ_LIMITS.clearGoodM-LZ_LIMITS.clearMinM):0;
 const sSurf=SURFACE_SCORE[surf.kind]??.7,sWire=wire>=LZ_LIMITS.wireMinM?1:wire>=20?.35:0,sAppr=block>=.6?.05:1-.8*block;
 if(!sSlope)reasons.push('eğim '+slope.toFixed(1)+'°');if(!sClear)reasons.push('engel '+clear.toFixed(0)+' m');if(!sWire)reasons.push('enerji hattı');if(!sSurf)reasons.push(surf.label);if(block>.3)reasons.push('yaklaşmada engel');
 const score=sSlope*sClear*sSurf*sWire*sAppr,fallback=score>.05?1:leastBad(x,z,area,slope)*(wire<15?.3:1);
 return {x,z,ok:score>.05,score,fallback,slopeDeg:slope,clearM:clear,wireM:wire,surface:surf.kind,label:surf.label,approachBlock:block,reasons};
}
// Best spot near (x,z) within radius r (used to place the guided 1/2 targets on usable ground).
export function bestSpotNear(x,z,area,r=80,{bearing=null,step=16}={}){let best=assessSpot(x,z,area,{bearing});
 for(let dx=-r;dx<=r;dx+=step)for(let dz=-r;dz<=r;dz+=step){if(dx*dx+dz*dz>r*r)continue;const a=assessSpot(x+dx,z+dz,area,{bearing});const pen=a.score-.002*Math.hypot(dx,dz)/r;if(pen>best.score-.002*Math.hypot(best.x-x,best.z-z)/r)best=a;}
 return best;}
// Measured straight-glide touchdown distance from the failure point (hazır akış laws, standard day, 2800 kg):
// rows = start height ft, columns = start KIAS. Used to centre the field search where the aircraft will actually arrive.
const NAT_H=[0,50,100,200,300,400,500,600],NAT_V=[0,30,60,80];
const NAT=[[0,20,160,360],[9,43,186,394],[10,53,209,413],[2,116,271,499],[11,165,399,609],[38,248,536,733],[80,361,672,857],[140,500,812,977]]; // v0.33: 80 KIAS glide (TR standart otorotasyon)
export function naturalDistance(hFt,kias){const lerp=(xs,x)=>{let i=0;while(i<xs.length-2&&x>xs[i+1])i++;return [i,clamp((x-xs[i])/(xs[i+1]-xs[i]),0,1)];};
 const [i,u]=lerp(NAT_H,Math.min(hFt,600)),[j,w]=lerp(NAT_V,Math.min(kias,80)),f=(a,b)=>NAT[a][b];
 const base=(f(i,j)*(1-w)+f(i,j+1)*w)*(1-u)+(f(i+1,j)*(1-w)+f(i+1,j+1)*w)*u;return hFt>600?base+(hFt-600)*1.1:base;}
// Hazır akış pilot: choose the best forced-landing field around the point the glide naturally reaches; small lateral or
// along-track corrections are flown with the heading, larger ones only when the natural area is unusable.
// Terrain, trees, roofs and wires between the aircraft and a candidate, against a straight descent to it with 3 m skid
// margin (the flare part is covered by approachBlock). 0 = clear, 1 = the glide would meet it.
export function pathBlock(s,x,z,area){const D=Math.hypot(x-s.x,z-s.z);if(D<45)return 0;const yt=terrainHeight(x,z,area),h0=s.y-terrainHeight(s.x,s.z,area),k=1+clamp((60-h0)/60,0,1);let worst=0; /* low starts bleed speed first and keep their height longer */
 for(let d=20;d<=D-30;d+=12){const f=d/D,px=s.x+(x-s.x)*f,pz=s.z+(z-s.z)*f,yp=s.y+(yt-s.y)*Math.pow(f,k),g=terrainHeight(px,pz,area),top=obstacleTopNear(px,pz,area,7),obst=top>g+2,wire=wireTopNear(px,pz,area);
  const over=Math.max(obst?top-(yp-3):g-(yp+2),wire>-1e9?Math.min(wire-(yp-4),yp+7-wire):-1); /* a wire blocks only when it lies in the band the rotor and skids pass through */
  if(over>0)worst=Math.max(worst,over/8);}
 return clamp(worst,0,1);}
// Flown path length to a spot including the turn onto it (turn radius from ground speed and the guidance bank limit);
// Infinity when the spot lies inside the turning circle (cannot be reached without an extra orbit).
export function turnPathLength(s,x,z,aTurn=4){const gs=Math.hypot(s.vx??0,s.vz??0),d0=Math.hypot(x-s.x,z-s.z);if(gs<8)return d0;
 const R=gs*gs/aTurn;let px=s.x,pz=s.z,h=Math.atan2(s.vx,-s.vz),len=0;const e0=Math.atan2(Math.sin(Math.atan2(x-px,-(z-pz))-h),Math.cos(Math.atan2(x-px,-(z-pz))-h));if(Math.abs(e0)<.06)return d0;const side=Math.sign(e0),st=.05;
 for(let k=0;k<130;k++){const dx=x-px,dz=z-pz,d=Math.hypot(dx,dz),e=Math.atan2(Math.sin(Math.atan2(dx,-dz)-h),Math.cos(Math.atan2(dx,-dz)-h));if(Math.abs(e)<st*1.2||Math.sign(e)!==side)return len+d;if(d<R*.35)return Infinity;h+=side*st;px+=Math.sin(h)*R*st;pz-=Math.cos(h)*R*st;len+=R*st;}
 return Infinity;}
export function chooseLandingZone(s,p){
 const X=globalThis.EXP??{},area=p.flightArea,floor=terrainHeight(s.x,s.z,area),h=Math.max(0,s.y-floor),gx=s.vx??0,gz=s.vz??0,speed=Math.hypot(gx,gz),kias=Math.hypot(gx-(p.windX??0),gz-(p.windZ??0))/(1852/3600)/(p.tasFactor??1),course=speed>1&&kias>=10?Math.atan2(gx,-gz):(s.heading??p.heading??0); // slow: the nose (into the wind), not the drift
 const mass=Math.sqrt((p.mass??2800)/2800);
 const ux=Math.sin(course),uz=-Math.cos(course);let nat=naturalDistance(h/.3048,kias)/mass;
 /* v0.33.1: sloping ground - the glide ends where the height above the ground there runs out, so the distance is iterated
    with the terrain at the predicted point (falling ground stretches it, rising ground shortens it) */
 if(!X.noNatIter)for(let k=0;k<4;k++){const g=terrainHeight(s.x+ux*nat,s.z+uz*nat,area),dg=floor-g,hk=Math.max(0,h+Math.sign(dg)*Math.max(0,Math.abs(dg)-8)),n2=naturalDistance(hk/.3048,kias)/mass;nat=Math.max(20,nat*.5+n2*.5);}
 if(area==='mountain'||area==='terrain')nat*=.86; /* v0.39 gerçek arazi: ölçülen süzülüş tablo değerinin ≈%86'sı (yer izi altındaki dalgalı arazi, yüksek saha) */
 const cx=s.x+ux*nat,cz=s.z+uz*nat;
 const along=Math.max(30,nat*(X.lzAlong??.22)+25),lat=Math.max(30,nat*(X.lzLat??.22)+25),cand=[];
 for(let a=-along;a<=along+1e-6;a+=along/5)for(let l=-lat;l<=lat+1e-6;l+=lat/5){const x=cx+ux*a+uz*-l*-1*0+(-uz)*l,z=cz+uz*a+ux*l;cand.push([x,z,a,l]);}
 const aTurn=X.turnA??4,hiK=clamp((h/.3048-100)/200,0,1) /* low starts: distance is set by the speed bleed, both ways equally hard */,rate=(x,z,a,l)=>{const r=Math.hypot(x-s.x,z-s.z),q0=r<20?assessSpot(x,z,area):assessSpot(x,z,area,{bearing:Math.atan2(x-s.x,-(z-s.z))}),pb=X.noPath?0:pathBlock(s,x,z,area),tl=X.noTurnReach?r:turnPathLength(s,x,z,aTurn),sp=(pb>=.5?.02:1-1.5*pb)*(tl>Math.max(nat*1.18,r+40)?.05:1),q={...q0,score:q0.score*sp,fallback:q0.fallback*sp,pathBlock:pb},move=Math.hypot(a/along,l/lat)/1.4;
  return {...q,dist:r,value:q.score-(X.lzMove??.35)*move-(a<0?(X.lzShortPen??.05)*(1-hiK):(X.lzLongPen??(area==="mountain"||area==="terrain"?.6:.15))*hiK*a/along),bad:q.fallback-.25*move};}; /* stretching a glide is harder than losing height */
 let best=null,leastBadSpot=null;for(const c of cand){const q=rate(...c);if(!best||q.value>best.value)best=q;if(!leastBadSpot||q.bad>leastBadSpot.bad)leastBadSpot=q;}
 if(best.score<.05&&!X.noLeastBad)best=leastBadSpot; /* nothing usable in the natural area: least-bad spot (fewest, lowest trees) */
 // refine
 const b0=best;for(let dx=-12;dx<=12;dx+=6)for(let dz=-12;dz<=12;dz+=6){const x=b0.x+dx,z=b0.z+dz,a=(x-cx)*ux+(z-cz)*uz,l=(x-cx)*-uz+(z-cz)*ux;const q=rate(x,z,a,l);if(best.score<.05&&!X.noLeastBad?q.score>=.05||q.bad>best.bad:q.value>best.value)best=q;}
 // nothing usable around the natural point: widen to the whole reachable fan (turns allowed)
 if(best.score<.25&&h>30){const fan=1.7;for(let f=.3;f<=1.2;f+=.06)for(let k=-10;k<=10;k++){const ang=course+fan*k/10,r=nat*f,x=s.x+Math.sin(ang)*r,z=s.z-Math.cos(ang)*r;
   // terrain-aware reach: glide height is measured to the candidate's own ground, and the straight glide line must clear the terrain between
   const hc=s.y-terrainHeight(x,z,area);if(hc<10)continue;const natC=naturalDistance(hc/.3048,kias)/mass*(area==="mountain"||area==="terrain"?.9:1); /* v0.39 gerçek arazide yer izi altındaki yükselti için pay */if(r>natC*1.05)continue;if(!X.noTurnReach){const tl=turnPathLength(s,x,z,aTurn);if(tl>natC*1.1)continue;}let blocked=false;for(let t=.2;t<.95&&!blocked;t+=.15){const px=s.x+(x-s.x)*t,pz=s.z+(z-s.z)*t,py=s.y-(s.y-(s.y-hc))*t;if(py<terrainHeight(px,pz,area)+25)blocked=true;}if(blocked)continue;
   const q0=assessSpot(x,z,area,{bearing:ang});if(q0.score<.25)continue;const pb=X.noPath?0:pathBlock(s,x,z,area),q={...q0,score:q0.score*(pb>=.5?.02:1-1.5*pb)},v=q.score-.45*Math.abs(ang-course)/Math.PI-.15*Math.abs(r-natC)/natC;if(v>best.value+.1||(best.score<.05&&q.score>.25))best={...q,dist:r,value:v};}}
 const bu=Math.atan2(best.x-s.x,-(best.z-s.z));
 return {id:'pilot',label:'P',x:best.x,z:best.z,ux:Math.sin(bu),uz:-Math.cos(bu),quality:best.score,slopeDeg:best.slopeDeg,clearM:best.clearM,surface:best.surface,surfaceLabel:best.label,reasons:best.reasons,natural:nat};
}
// v0.33.1 obstacle on the present flight path (wire band, tree crowns, roofs) within `horizon` s, and whether the speed
// left can buy the height to clear it: a cyclic zoom returns about a third of the ideal kinetic-to-height exchange
// (model check: 80 -> 55 KIAS gave about 16 m). stopM: straight-line stopping distance at the flare deceleration limit.
export function obstacleAhead(s,area,{horizon=6,step=.5,windX=0,windZ=0,target=null}={}){
 const gs=Math.hypot(s.vx??0,s.vz??0);if(gs<6)return null;const w=s.w??0;
 /* with a chosen field the path is the straight descent line to it (only what stands between us and the field counts) */
 if(target){const dx=target.x-s.x,dz=target.z-s.z,D=Math.hypot(dx,dz);if(D<30)return null;const yt=terrainHeight(target.x,target.z,area),air=Math.hypot(s.vx-windX,s.vz-windZ);
  for(let d=10;d<=Math.min(D-15,gs*horizon);d+=8){const f=d/D,x=s.x+dx*f,z=s.z+dz*f,y=s.y+(yt-s.y)*f,g=terrainHeight(x,z,area),top=obstacleTopNear(x,z,area,7),wire=wireTopNear(x,z,area);let kind=null,clearTo=0;
   if(wire>-1e9&&wire>y-4&&wire<y+7){kind='wire';clearTo=wire+5;}else if(top>g+2&&top>y-3){kind='obstacle';clearTo=top+4;}
   if(kind){const need=clearTo-y,avail=.35*Math.max(0,air*air-225)/(2*9.81),t=d/gs;return {time:t,distance:d,kind,x,z,needM:need,availM:avail,canClimb:need<=avail&&t>=1,stopM:gs*gs/(2*2.7)};}}
  return null;}
 for(let t=step;t<=horizon+1e-9;t+=step){const x=s.x+s.vx*t,z=s.z+s.vz*t,y=s.y-w*t,g=terrainHeight(x,z,area);if(y-g<1)break;
  const top=obstacleTopNear(x,z,area,7),wire=wireTopNear(x,z,area);let kind=null,clearTo=0;
  if(wire>-1e9&&wire>y-4&&wire<y+7){kind='wire';clearTo=wire+5;}else if(top>g+2&&top>y-3){kind='obstacle';clearTo=top+4;}
  if(kind){const air=Math.hypot(s.vx-windX,s.vz-windZ),need=clearTo-y,avail=.35*Math.max(0,air*air-225)/(2*9.81);return {time:t,distance:gs*t,kind,x,z,needM:need,availM:avail,canClimb:need<=avail&&t>=1,stopM:gs*gs/(2*2.7)};}}
 return null;}
