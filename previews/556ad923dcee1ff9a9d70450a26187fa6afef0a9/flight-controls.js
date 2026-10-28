import {currentLanding} from './site-redirect.js';
import {pilotCommand} from './predictive-pilot.js';
import {landingPolicy,adaptivePilot,glideSpeedKt,hoverEntryKt} from './adaptive-pilot.js';
import {terminalEnvelope} from './terminal-control.js';
// Experimental controller gains and thresholds; not AB-205 control instructions.
import {targetGuidance} from './flight-guidance.js';
import {obstacleAhead} from './landing-zone.js';
import {terrainHeight} from './terrain-data.js';
const OBST=new WeakMap();
/* obstacle check every 0.25 s of flight time (the controls see AGL; the predictor needs the absolute height) */
function obstacleNow(s,p,target=null){let m=OBST.get(p);if(!m){m=new Map();OBST.set(p,m);}const k=Math.floor(s.t/.25)+(target?'t':'');if(m.has(k))return m.get(k);const v=obstacleAhead({...s,y:s.y+terrainHeight(s.x,s.z,p.flightArea)},p.flightArea,{windX:p.windX,windZ:p.windZ,target});m.set(k,v);if(m.size>600)m.delete(m.keys().next().value);return v;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function controlTargets(s,p,choices,sink){
 const B=p.collectiveBias??0;
 const powered=s.t<4;
 if(p.autonomous&&!powered&&s.t<4+(p.crew?.delay??0))return {collective:s.collective,speedKt:p.ias,flare:false,cushion:false,levelCyclic:false,holdCyclic:true,holdAll:true,managed:false,yawManaged:false,guidance:null,turnRate:0,brakeHeightM:terminalEnvelope(s,p).brakeHeightM,phase:'Arıza tanıma · mürettebat tepki süresi',reason:`Pilot profiline bağlı tanıma/tepki süresi (${(p.crew.delay).toFixed(1)} s); kumandalar arıza anındaki konumda.`};
 if(p.autonomous&&!powered){const plan=pilotCommand(adaptivePilot(s,p,sink),s,s.pilotAction);let guidance=s.pilotSite?targetGuidance(s,p,'pilot',s.pilotSite):null;if(guidance&&(plan.flare||plan.cushion)){const speed=plan.speedKt*1852/3600*p.tasFactor,ax=guidance.groundX-p.windX,az=guidance.groundZ-p.windZ,length=Math.hypot(ax,az);if(length>speed)guidance={...guidance,groundX:p.windX+ax/length*speed,groundZ:p.windZ+az/length*speed,turning:false};
  /* v0.33.1: keep closing the cross-track error to the chosen field while decelerating (low starts flare at once); faded out below about 20 ft so the skids meet the ground without side drift */
  const X=globalThis.EXP??{},site=s.pilotSite,gs=Math.hypot(s.vx??0,s.vz??0),agl=Math.max(0,s.y);
  if(site&&!X.noFlareSteer&&gs>3&&agl>(X.fsLow??12)){const ux=s.vx/gs,uz=s.vz/gs,dx=site.x-s.x,dz=site.z-s.z,along=dx*ux+dz*uz,blend=Math.min(1,(agl-(X.fsLow??12))/(X.fsBand??12));
   const cross=-uz*dx+ux*dz;if(along>10){const vlat=Math.max(-4,Math.min(4,cross/Math.max(3,along/Math.max(2,gs*.6))))*blend;guidance={...guidance,groundX:guidance.groundX+(-uz)*vlat,groundZ:guidance.groundZ+ux*vlat};}}
  else if(site&&!X.noFlareSteer&&gs>1){const ux=s.vx/gs,uz=s.vz/gs,gl=guidance.groundX*-uz+guidance.groundZ*ux,k=Math.max(0,Math.min(1,(agl-3)/((X.fsLow??12)-3)));guidance={...guidance,groundX:guidance.groundX-(-uz)*gl*(1-k),groundZ:guidance.groundZ-ux*gl*(1-k)};}}if(!(plan.flare||plan.cushion)){const X=globalThis.EXP??{};if(s.pilotSite&&!X.noSimpleGlide&&X.noPilotPlan!==2){
  // v0.33 glide steering to the chosen field: fly the bearing to it at a speed that matches the glide still needed
  // (63 KIAS min-sink, faster when short of range, slower = steeper when high), turns limited by the normal accel cap.
  const site=s.pilotSite,dx=site.x-s.x,dz=site.z-s.z,d=Math.hypot(dx,dz),agl=Math.max(0,s.y),need=Math.max(0,d-(X.gateD??200))/Math.max(1,agl-(X.gateH??35)),glide=3.3;
  const kias=!X.speedSteer||agl<(X.gateH??30)+5?plan.speedKt:need>glide*1.08?Math.min(80,63+(need/glide-1)*60):need<glide*.85?Math.max(X.slowKt??50,63-(1-need/glide)*40):63,v=Math.max(Math.min(kias,X.maxKt??80),Math.min(45,plan.speedKt))*1852/3600*p.tasFactor;
  const high=need<glide*(X.planBelow??0)&&agl>(X.planAbove??55)&&guidance?.plan; // far too high for the field: descending S-turns / orbit (offset pursuit)
  const ahead=dx*Math.sin(s.heading??p.heading)-dz*Math.cos(s.heading??p.heading)>0||(s.v??0)>15||(!X.noLead&&d>60);
  /* v0.33.1: lead turn - the commanded track is the present track turned at most ~35 deg toward the field, so the cyclic
     banks the aircraft round at glide speed instead of braking along a straight line to it */
  const brg=Math.atan2(dx,-dz),gsp=Math.hypot(s.vx??0,s.vz??0),trk=Math.atan2(s.vx??0,-(s.vz??0)),err=Math.atan2(Math.sin(brg-trk),Math.cos(brg-trk)),lead=!X.noLead&&gsp>5?trk+Math.max(-.6,Math.min(.6,err)):brg;
  guidance=high?guidance:d>8&&ahead?{target:site,distance:d,passed:false,turning:Math.abs(err)>.26&&d>60,groundX:p.windX+Math.sin(lead)*v,groundZ:p.windZ-Math.cos(lead)*v,plan:null,glideNeed:need}:null;}
 else if(X.noPilotPlan||!guidance?.plan)guidance=null;} // v0.33
 /* v0.33.1 obstacle avoidance: a wire / tree line / roof on the path that cannot be stopped short of is cleared by a cyclic
    zoom when the speed can buy the height; otherwise the pilot slows down now and lands short of it */
 {const X=globalThis.EXP??{};if(!X.noAvoid&&!plan.cushion&&s.y>6){const o=obstacleNow(s,p,s.pilotSite),site=s.pilotSite,beyond=o&&site&&o.distance>Math.hypot(site.x-s.x,site.z-s.z)-15; /* obstacles past the field are not on the way */
  if(o&&!beyond&&o.time<5&&(!plan.flare||o.stopM>o.distance*.8)){
   if(o.canClimb)return {...plan,flare:true,cushion:false,flareAccel:5,speedKt:20,guidance:null,levelCyclic:false,holdCyclic:false,managed:true,yawManaged:p.pedalMode==='auto',turnRate:0,phase:'Engel geçişi · saykılıkla tırmanış',reason:'Önde '+(o.kind==='wire'?'enerji hattı':'engel')+': ileri sürat geri saykılıkla irtifaya çevriliyor.'};
   if(!plan.flare)return {...plan,flare:true,flareAccel:2.7,speedKt:0,guidance:null,managed:true,yawManaged:p.pedalMode==='auto',turnRate:0,phase:'Engel önünde yavaşlama',reason:'Önde '+(o.kind==='wire'?'enerji hattı':'engel')+' ve tırmanacak sürat yok: hemen yavaşlanıyor.'};}}}
 return {...plan,reason:plan.reason+' '+(s.pilotForecast?.reason??'')+(s.pilotSite?' Zemin ve erişim taramasıyla iniş hedefi seçildi.':''),managed:true,yawManaged:p.pedalMode==='auto',turnRate:0,guidance};}
 const active=choices.filter(a=>a.at<=s.t),last=active.at(-1);
 if(!powered&&last?.id==='overspeed'&&last.option==='hold')return {collective:s.collective,speedKt:p.ias,flare:false,cushion:false,levelCyclic:false,holdCyclic:true,holdAll:true,managed:false,yawManaged:false,guidance:null,turnRate:0,brakeHeightM:terminalEnvelope(s,p).brakeHeightM,phase:'Kumandalar seçilen konumda tutuluyor',reason:'Overspeed kararında mevcut kumandaları koru seçildi. Yeni bir kumanda kararı verilene kadar kollektif, saykılık ve pedal sabit; otomatik devir düzeltmesi yok.'};
 const first=choices.find(a=>a.id==='priority'&&a.at<=s.t)?.option,second=currentLanding(choices,s.t)?.option;
 const obstacleChoice=choices.find(a=>a.id==='obstacle'&&a.at<=s.t)?.option,approach=choices.find(a=>a.id===(second?.startsWith('site-')?'approach-'+second.slice(5):'approach')&&a.at<=s.t)?.option??(obstacleChoice==='brake'||second?.startsWith('site-')?'brake':undefined); /* v0.33.1: each field has its own slow-down answer */
  const recovery=choices.find(a=>a.id==='recovery'&&a.at<=s.t)?.option,critical=choices.find(a=>a.id==='criticalRotor'&&a.at<=s.t)?.option;
 let guidance=targetGuidance(s,p,second);const targetDistance=guidance?.distance??null,targetSite=guidance?.target??null;
 const finalPull=choices.find(a=>a.id==='finalPull'&&a.at<=s.t)?.option,cyclicMode=choices.find(a=>a.id==='cyclic'&&a.at<=s.t)?.option??'coordinated';
 const terminalChoice=finalPull==='now'?'now':finalPull==='hold'?'hold':choices.find(a=>a.id==='cushion'&&a.at<=s.t)?.option??(p.groundHold&&p.height<=6.096?'timed':'pending'),vrs=choices.find(a=>a.id==='vrs'&&a.at<=s.t)?.option,overspeed=choices.find(a=>a.id==='overspeed'&&a.at<=s.t)?.option;
 const terminal=terminalChoice==='timed'?'pending':terminalChoice;
 const nearHover=p.groundHold&&p.height<=6.096,agl=Math.max(0,s.y),ttg=agl/Math.max(.5,s.w),managed=first==='control'||recovery==='recover'||critical==='unload';
 const envelope=terminalEnvelope(s,p);
 let flareAccel=5,levelCyclic=false,holdCyclic=false,reason='',brakeHeight=envelope.brakeHeightM;
 let collective=1,speed=p.ias,flare=false,phase=powered?'Güçlü uçuş':managed?'Rotor enerjisi yönetimi':'Kumandalar başlangıç konumunda',cushion=false;
 if(!powered&&managed){collective=nearHover?1:clamp(.45+B+.25*s.w/Math.max(1,sink)+.8*(s.omega*30/Math.PI/p.rpm-1),.3,.85+B);speed=p.groundHold?Math.max(p.ias,Math.min(glideSpeedKt({...s,y:agl},p),hoverEntryKt(p))):glideSpeedKt({...s,y:agl},p);}
 if(!powered&&(second==='shared'||approach==='brake'||finalPull||choices.some(a=>a.id==='cushion'&&a.at<=s.t))){
  const plan=landingPolicy(s,p,sink,{terminal,cyclicMode,flareMode:second==='shared'||approach==='brake'?(choices.find(a=>a.id==='flare'&&a.at<=s.t)?.option??'pending'):'omit'});
  flareAccel=plan.flareAccel;levelCyclic=plan.levelCyclic;holdCyclic=plan.holdCyclic;reason=plan.reason;collective=managed||nearHover?plan.collective:Math.max(1,plan.collective);speed=plan.speedKt;flare=plan.flare;cushion=plan.cushion;phase=plan.phase;
  // Do not spend the forward kinetic reserve while still high merely to chase a marker.
  if(!second?.startsWith('site-'))guidance=null;
 }
 if(!powered&&(second==='distant'||second?.startsWith('site-'))&&approach!=='brake'&&!cushion){speed=63;if(!second?.startsWith('site-'))guidance=null;}
 if((flare||approach==='brake')&&guidance){const maxAir=speed*1852/3600*p.tasFactor,ax=guidance.groundX-p.windX,az=guidance.groundZ-p.windZ,len=Math.hypot(ax,az);if(len>maxAir){guidance={...guidance,groundX:p.windX+ax/len*maxAir,groundZ:p.windZ+az/len*maxAir};}}
 if(!powered&&vrs==='exit'&&!cushion&&agl>15){collective=Math.min(collective,.65+B);speed=Math.max(p.ias,30);guidance=null;phase='VRS eğiliminden çıkış · hava sürati kazanma';}
 if(!powered&&vrs==='pull'&&!cushion&&terminal!=='hold'){collective=Math.max(collective,1.6);guidance=null;speed=p.ias;phase='Kollektifi artırma · güç/hatve talebi';}
 if(!powered&&overspeed==='load'&&terminal!=='hold'&&s.omega*30/Math.PI>324){collective=Math.max(collective,clamp(.70+B+(globalThis.EXP?.ogain??.025)*(s.omega*30/Math.PI-324),.70+B,(globalThis.EXP?.ocap??1.25)+B));if(!flare&&!cushion)phase='Yüksek rotor devri · yükleme';}
 if(!powered&&critical==='unload'&&!cushion&&agl>15&&ttg>3&&s.omega*30/Math.PI<p.rpm*.94){collective=Math.min(collective,.55+B);phase='Kritik rotor enerjisi · kollektif yükünü azaltma';}
 if(!powered&&obstacleChoice==='climb'&&!cushion&&agl>3){const o=obstacleNow(s,p,targetSite);if(o&&o.time<6&&!(targetDistance!=null&&o.distance>targetDistance-15)){flare=true;flareAccel=5;speed=Math.min(speed,20);guidance=null;levelCyclic=false;holdCyclic=false;phase='Engel geçişi · saykılıkla tırmanış (sürat → irtifa)';reason='Geri saykılıkla ileri sürat irtifaya çevriliyor; engel geçilince süzülüşe dönülür.';}}
 if(guidance?.turning)reason+=' Seçilen hedefe sınırlı yatışla dönüş talebi; kalan irtifa erişime yetmeyebilir.';
 return {reason,levelCyclic,flareAccel,collective,speedKt:speed,turnRate:0,phase,cushion,flare,managed,yawManaged:p.pedalMode==='auto',brakeHeightM:brakeHeight,holdCyclic:holdCyclic||(!powered&&!managed&&!second&&!vrs),guidance:powered||(nearHover&&second==='shared')?null:guidance};
}
