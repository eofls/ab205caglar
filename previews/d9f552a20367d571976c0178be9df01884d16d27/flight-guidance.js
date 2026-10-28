import {CURVES} from './curve-reference.js';
import {bestSpotNear} from './landing-zone.js';
// Synthetic fixed terrain targets. Distances are scenario construction, not reachability limits.
const KT=1852/3600;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const TARGET_CACHE=new Map();
export function landingTargets(p){
 const speed=p.ias*KT*p.tasFactor,vx=Math.sin(p.heading)*speed+p.windX,vz=-Math.cos(p.heading)*speed+p.windZ;
 const length=Math.hypot(vx,vz),ux=length>.5?vx/length:Math.sin(p.heading),uz=length>.5?vz/length:-Math.cos(p.heading);
 const range=Math.max(4,length*(p.height/9+2));
 const ox=p.startX??0,oz=p.startZ??0,key=[p.flightArea,ox,oz,vx,vz,range].map(v=>typeof v==='number'?v.toFixed(2):v).join('|');
 // v0.33: the synthetic near/far targets are moved onto the best usable ground within ~60 m (slope, obstacles, surface).
 let fixed=TARGET_CACHE.get(key);if(!fixed){fixed=['shared','distant'].map((id,i)=>{const x=ox+vx*4+ux*range*(i?1.25:.65),z=oz+vz*4+uz*range*(i?1.25:.65),b=globalThis.EXP?.noSnap?{x,z}:bestSpotNear(x,z,p.flightArea??'terrain',60,{bearing:Math.atan2(ux,-uz)});return {id,label:String(i+1),ux,uz,x:b.x,z:b.z,quality:b.score};});if(TARGET_CACHE.size>200)TARGET_CACHE.clear();TARGET_CACHE.set(key,fixed);}
 return [...fixed.filter(t=>!(p.hiddenSites??[]).includes(t.id)),...(p.customSites??[]).map(t=>{const length=Math.hypot(t.x,t.z)||1;return {id:'site-'+t.number,label:String(t.number),x:t.x,z:t.z,ux:t.x/length,uz:t.z/length};})];
}
// Chart glide polar (curve-reference: approximate chart reading) for approach energy planning.
function chartSink(kias,rpm){const r=Math.max(284,Math.min(339,rpm)),a=r<=314?284:314,b=r<=314?314:339,v=Math.max(50,Math.min(80,kias));
 const row=k=>{const pts=CURVES[k],i=Math.max(1,pts.findIndex(q=>q.kias>=v)),q0=pts[i-1],q1=pts[i];return q0.descentFpm+(q1.descentFpm-q0.descentFpm)*(v-q0.kias)/Math.max(1,q1.kias-q0.kias);};
 return (row(a)+(row(b)-row(a))*(r-a)/(b-a))*.3048/60;}
// Energy-managed approach (pre-flare): the glide ratio needed to arrive at the flare gate over the field decides the
// airspeed (63 KIAS min-sink … 80 KIAS max range, TR standart otorotasyon) and, when there is height to spare,
// path stretching with S-turns instead of slowing down (slowing below the glide speed raises the sink rate).
export function approachPlan(s,p,target){
 const X=globalThis.EXP??{},h=Math.max(0,s.y),rpm0=(s.omega??((p.rpm??324)*Math.PI/30))*30/Math.PI,rpm=Number.isFinite(rpm0)?Math.max(250,rpm0):324,mass=Math.sqrt((p.mass??2800)/2800),dx=target.x-s.x,dz=target.z-s.z,d=Math.hypot(dx,dz),bearing=Math.atan2(dx,-dz);
 const tf=p.tasFactor??1,ux=Math.sin(bearing),uz=-Math.cos(bearing),along=(p.windX??0)*ux+(p.windZ??0)*uz,cross=(p.windX??0)*Math.cos(bearing)+(p.windZ??0)*Math.sin(bearing);
 const gr=kias=>{const v=kias*KT*tf,g=Math.sqrt(Math.max(1,v*v-cross*cross))+along;return Math.max(.1,g)/(chartSink(kias,rpm)*mass*tf);};
 const gateH=X.gateH??30,gateD=Math.max(60,(X.gateS??5.5)*Math.hypot(s.vx??0,s.vz??0));
 const hg=h-gateH,dg=d-gateD,need=hg>3?Math.max(0,dg)/hg:Infinity;
 let best=63,bestGr=gr(63);for(let k=55;k<=80;k++){const g=gr(k);if(g>bestGr+1e-9){bestGr=g;best=k;}}
 const minSinkGr=gr(63);let kias=63,stretch=0,reachable=true;
 if(!(hg>3)){kias=Math.max(55,Math.min(70,(Math.hypot((s.vx??0)-(p.windX??0),(s.vz??0)-(p.windZ??0))/KT/tf)||63));}
 else if(need>minSinkGr){const cap=h>(X.fastAboveM??90)?80:70;kias=Math.min(best,cap);for(let k=63;k<=Math.min(best,cap);k++)if(gr(k)>=need){kias=k;break;}reachable=need<=gr(kias)*1.02;}
 else{const ratio=need/minSinkGr;stretch=Math.acos(Math.max(X.minCos??.34,Math.min(1,ratio)));if(stretch<.12)stretch=0;}
 const now=Math.hypot((s.vx??0)-(p.windX??0),(s.vz??0)-(p.windZ??0))/KT/tf;if(now>20)kias=Math.max(now-(X.dDown??6),Math.min(now+(X.dUp??3),kias));
 // Constant-offset pursuit = descending spiral over the field: distance shrinks at V·cosφ while height shrinks at the sink rate.
 const side=X.sPeriod?(Math.floor(Math.max(0,(s.t??4)-4)/X.sPeriod)%2?1:-1):1;
 return {kias,bearing,course:bearing+side*stretch,stretch,reachable,needGlideRatio:need,bestGlideRatio:bestGr,distance:d};
}
export function targetGuidance(s,p,id,override=null){
 const target=override??landingTargets(p).find(t=>t.id===id);if(!target)return null;
 const dx=target.x-s.x,dz=target.z-s.z,distance=Math.hypot(dx,dz),forward=dx*target.ux+dz*target.uz;
 // No automatic turn-back after overshooting; report the miss instead.
 const remaining=Math.max(.6,s.y/Math.max(1,s.w));
 const planned=(!override||(id==='pilot'&&!globalThis.EXP?.noPilotPlan))&&(id==='distant'||id==='pilot'||id?.startsWith('site-'))&&!(globalThis.EXP?.noPlan)?approachPlan(s,p,target):null; // v0.33: the hazır akış pilot flies an energy-managed approach to its chosen field
 const speed=planned?planned.kias*KT*p.tasFactor:Math.min(Math.max(63,Math.min(70,p.ias))*KT*p.tasFactor,distance/remaining,Math.sqrt(2*1.2*distance));
 let vx=forward>0&&distance>.1?dx/distance*speed:0,vz=forward>0&&distance>.1?dz/distance*speed:0;
 if(planned&&distance>.1&&(forward>0||id?.startsWith('site-')||id==='pilot')){vx=Math.sin(planned.course)*speed+p.windX;vz=-Math.cos(planned.course)*speed+p.windZ;}
 // A rearward selected site requires a curved turn, not a reversed velocity target.
 const course=Math.hypot((s.vx??(Math.sin(p.heading)*p.ias*KT*p.tasFactor+p.windX))-p.windX,(s.vz??(-Math.cos(p.heading)*p.ias*KT*p.tasFactor+p.windZ))-p.windZ)>2?Math.atan2((s.vx??(Math.sin(p.heading)*p.ias*KT*p.tasFactor+p.windX))-p.windX,-((s.vz??(-Math.cos(p.heading)*p.ias*KT*p.tasFactor+p.windZ))-p.windZ)):(s.heading??p.heading),desired=planned?planned.course:Math.atan2(dx,-dz),error=wrap(desired-course),turning=Math.abs(error)>.25&&distance>15;
 if(turning){const look=course+Math.max(-.4,Math.min(.4,error)),turnSpeed=Math.max(12,Math.min((planned?Math.max(45,Math.min(63,planned.kias)):45)*KT*p.tasFactor,Math.hypot((s.vx??(Math.sin(p.heading)*p.ias*KT*p.tasFactor+p.windX))-p.windX,(s.vz??(-Math.cos(p.heading)*p.ias*KT*p.tasFactor+p.windZ))-p.windZ)));vx=Math.sin(look)*turnSpeed+p.windX;vz=-Math.cos(look)*turnSpeed+p.windZ;}
 // Air-relative guidance limit (80 KIAS for planned max-range glides), including cross/head wind.
 const ax=vx-p.windX,az=vz-p.windZ,tas=Math.hypot(ax,az),limit=(planned?Math.max(63,planned.kias):Math.max(63,Math.min(70,p.ias)))*KT*p.tasFactor;
 if(tas>limit){vx=p.windX+ax/tas*limit;vz=p.windZ+az/tas*limit;}
 return {target,distance,passed:forward<=0&&!id?.startsWith('site-')&&id!=='pilot',turning,turnAngle:error,groundX:vx,groundZ:vz,plan:planned};
}
// Approximate approach scheduling, not a guaranteed reachable landing site.
export function approachState(s,p,id='distant'){
 const guidance=targetGuidance(s,p,id),groundSpeed=Math.hypot(s.vx??0,s.vz??0),ttg=Math.max(0,s.y)/Math.max(.5,s.w);
 const brakingDistance=groundSpeed*.8+groundSpeed*groundSpeed/(2*2.5);
 return {distance:guidance?.distance??null,passed:guidance?.passed??false,brakingDistance,timeToGround:ttg,brakeReady:!!guidance&&(guidance.passed||guidance.distance<=brakingDistance*1.3||ttg<(globalThis.EXP?.brakeTtg??10))};
}
// Reachability screening for the autonomous pilot; candidate search, not guaranteed optimality.
export function choosePilotSite(s,p,height,surface,obstacle){
 const h=Math.max(0,s.y-height(s.x,s.z)),speed=Math.hypot(s.vx,s.vz),course=speed>1?Math.atan2(s.vx,-s.vz):s.heading,stop=speed*speed/(2*(globalThis.EXP?.stopDecel??2.4)),range=Math.max(8,speed*h/Math.max(6,s.w),stop),candidates=[]; // v0.32.2: never pick a site inside the speed-bleed distance
 for(const factor of [.35,.65,1])for(const angle of [-.6,-.3,0,.3,.6]){const a=course+angle,d=range*factor;candidates.push({id:'pilot',x:s.x+Math.sin(a)*d,z:s.z-Math.cos(a)*d,ux:Math.sin(a),uz:-Math.cos(a)});}
 for(const t of landingTargets(p))candidates.push(t);
 return candidates.map(t=>{const dx=t.x-s.x,dz=t.z-s.z,d=Math.hypot(dx,dz),angle=Math.abs(wrap(Math.atan2(dx,-dz)-course)),f=surface(t.x,t.z),tree=obstacle(t.x,t.z)>height(t.x,t.z)+1;const score=(f.kind==='water'?300:f.kind==='paved'?0:35)+f.slope*120+(tree?500:0)+Math.abs(d-range*.65)*.08+angle*80+(d>range*1.2?500:0)+(d<stop*.8?400:0)+(h<30&&angle>.4?1000:0);return {...t,score};}).reduce((a,b)=>b.score<a.score?b:a);
}
