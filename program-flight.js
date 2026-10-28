import {tasFactor,windVector,velocityForTrack} from './flight-reference.js';
// v0.34 program flight: powered flight for emergencies that keep (or partly keep) engine power and for the flight
// manoeuvres (normal powered flight, no failure). A kinematic, trimmed flight model: the pilot program sets targets
// (track, speed, vertical speed / height, heading), the aircraft follows them within acceleration, climb and yaw
// limits; attitude, collective, cyclic and pedal positions are derived from the accelerations and a power-required
// curve. Emergency effects (yaw, roll, vibration, RPM excursions, torque limit, heavy controls, hardovers) act on top.
// Engine-power-loss emergencies (tam / kısmi güç kaybı, şaft, kavrama) stay on the blade/energy physics.
import {terrainHeight,surfaceProfile,obstacleTopNear,treesNear,wireTopNear} from './terrain-data.js';
import {assessSpot} from './landing-zone.js';
import {emergencyById,URGENCY_TEXT} from './emergency-catalog.js';
import {maneuverById,maneuverDirector} from './maneuver-catalog.js';
export const KT=1852/3600,FT=.3048,G=9.81;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),brg=(x0,z0,x1,z1)=>Math.atan2(x1-x0,-(z1-z0));
export function isProgramFlight(c){if(!c)return false;if(c.program==='maneuver')return true;if(c.program==='emergency')return emergencyById(c.emergencyId).kind==='program';return false;}
// ---------- power required (fraction of 80 KIAS cruise power) and collective ----------
export function powerRequired(kt,climbMps=0,agl=99){const v=Math.max(0,kt);const p=.52+.73/(1+(v/28)**2)+.42*(v/80)**3;const ige=agl<6?.16*(1-agl/6)*(1-.55*Math.min(1,v/22)):0; /* v0.35.7 ground cushion is lost as speed builds */return p-ige+.085*climbMps;}
// ---------- forced / precautionary landing zone for powered programs ----------
export function pickProgramLZ(st,area,{urgency='asap',runon=false,trees=false,water=false,maxR=1800,minR=120,course=null,bankDeg=25,glide=5.7}={}){
 let best=null;const c0=course??Math.atan2(st.vx,-st.vz),cands=[];
 /* v0.34.1 time to land, not straight distance: a field closer than the descent needs costs S-turns, and a turn costs
    its arc at the bank limit - so "mümkün olan en kısa zamanda" picks the field that is reached first */
 const agl0=Math.max(0,st.y-terrainHeight(st.x,st.z,area)),need=Math.max(0,agl0-10)*glide,v0=Math.max(25,Math.hypot(st.vx,st.vz)),turnM=v0*v0/(G*Math.tan(bankDeg*Math.PI/180));
 for(let r=minR;r<=maxR;r+=r<600?60:110)for(let k=0;k<28;k++){const a=k/28*2*Math.PI,x=st.x+Math.sin(a)*r,z=st.z-Math.cos(a)*r;{const L=area==='terrain'||area==='mountain'?4200:2700;if(Math.abs(x)>L||Math.abs(z)>L)continue;}
  const sf=surfaceProfile(x,z,area);if(water){if(sf.kind!=='water')continue;const v=1-r/maxR*.5;if(!best||v>best.value)best={x,z,score:1,value:v,label:sf.label,bearing:a};continue;}
  let q=assessSpot(x,z,area,{bearing:a});let score=trees?q.fallback*(q.score>0?1:.9):q.score;
  if(trees){/* v0.39 ağaçlara iniş: açık saha değil, en kısa ve seyrek ağaçlı bölge (kitap 9.1.42) */const tr=treesNear(x,z,12,area).filter(t=>Math.hypot(t.x-x,t.z-z)<12);if(tr.length<2)continue;const hA=tr.reduce((s2,t)=>s2+t.height,0)/tr.length;score=Math.max(.2,1-hA/22);q={...q,label:`Ağaçlar · ortalama ${Math.round(hA/.3048)} ft`};}
  if(runon&&score>0){let m=1;for(let d=25;d<=100;d+=25){const s2=assessSpot(x+Math.sin(a)*d,z-Math.cos(a)*d,area).score;m=Math.min(m,s2);}score*=clamp(m*1.4,0,1);}
  /* v0.35 the field's own height: a field up the slope (dağlık) leaves less glide; one above the glide reach is skipped */
  const hzC=st.y-terrainHeight(x,z,area);if(glide<5&&area==='mountain'&&hzC<(r+turnM*Math.abs(wrap(a-c0)))/(glide*1.1)+25)continue;const needC=Math.max(0,hzC-10)*glide;
  const turnA=Math.abs(wrap(a-c0)),eff=(r<needC?needC+(needC-r)*.8:r)+turnA*turnM,dist=urgency==='practicable'?eff/5000:eff/1500;
  const v=score*(urgency==='practicable'&&q.surface==='paved'?1.25:1)-dist*.6;cands.push({x,z,score,value:v,label:q.label,slopeDeg:q.slopeDeg,bearing:a});}
 if(water)return best;
 /* v0.34.1 the final approach must clear trees / buildings: the best few fields are checked along the approach from
    here; a run-on needs a shallow final (≤8°), a normal approach ≤15° */
 cands.sort((p,q)=>q.value-p.value);for(const c of cands.slice(0,24)){if(c.score<=0)continue;const wo={},ang=clearAngle(c,c.bearing,area,terrainHeight(c.x,c.z,area),wo)*180/Math.PI,lim=trees?90:runon?8:15;if(ang>lim){c.value-=Math.min(.6,(ang-lim)*.06);c.score*=.7;}if(wo.wire!==undefined){c.value-=.9-wo.wire/1000;c.wireAhead=wo.wire;} /* v0.39 tel önüne iniş seçilmez */c.appDeg=ang;if(!best||c.value>best.value)best=c;}
 return best??cands[0]??null;}
// ---------- kinematic step ----------
function stepAircraft(st,tg,dt,ctx){
 const area=ctx.area,ground=terrainHeight(st.x,st.z,area),agl=st.y-ground,fx=ctx.fx;
 // horizontal
 let dvx=0,dvz=0;
 if(st.onGround){const gs=Math.hypot(st.vx,st.vz);if(tg.taxi){dvx=(tg.taxi.vx-st.vx)*1.2;dvz=(tg.taxi.vz-st.vz)*1.2;}else if(gs>0){const dec=Math.min(gs/dt,tg.groundDecel??2.5);dvx=-st.vx/gs*dec;dvz=-st.vz/gs*dec;}}
 else{let dx,dz;if(tg.vel){dx=tg.vel[0];dz=tg.vel[1];}else{const tr=tg.track??st.track,V=velocityForTrack(tg.speedKt??0,tr,ctx.config);dx=V.x;dz=V.z;}
  const a=(tg.accel??1.6)*(fx.heavy?.6:1),k=tg.gain??.8,gsNow=Math.hypot(st.vx,st.vz),spD=Math.hypot(dx,dz);
  /* v0.34.1 coordinated turns: in forward flight the track turns at a bank-limited rate and the speed changes along it
     (a plain velocity-vector controller cut the corner - a reversal slowed to a stop instead of turning) */
  if(gsNow>12&&spD>12&&!tg.vectorOnly){const trNow=Math.atan2(st.vx,-st.vz),trD=Math.atan2(dx,-dz),aLat=G*Math.tan((tg.bank??25)*Math.PI/180)*(fx.heavy?.6:1);
   const eT=wrap(trD-trNow),spT=Math.abs(eT)>1&&!tg.keepSpeed?Math.min(spD,26):spD; // a reversal is flown slow: tighter, quicker turn
   const w=clamp(eT*(tg.turnGain??.6),-aLat/gsNow,aLat/gsNow),nv=gsNow+clamp((spT-gsNow)*k,-a,a)*dt,nt=trNow+w*dt;dvx=(Math.sin(nt)*nv-st.vx)/dt;dvz=(-Math.cos(nt)*nv-st.vz)/dt;}
  else{let ax=(dx-st.vx)*k,az=(dz-st.vz)*k;const m=Math.hypot(ax,az);if(m>a){ax*=a/m;az*=a/m;}dvx=ax;dvz=az;}}
 st.vx+=dvx*dt;st.vz+=dvz*dt;
 // vertical
 if(!st.onGround||(tg.vy!==undefined&&tg.vy>0)||(tg.heightFt!==undefined&&tg.heightFt>1.5)){
  let vyDes=tg.vy;if(tg.heightFt!==undefined){let hT=tg.heightFt*FT;
   /* v0.34.1 terrain ahead (mountains): en-route / cruise targets keep ~25 m over the highest ground of the next ~7 s */
   const gsH=Math.hypot(st.vx,st.vz);if(!ctx.maneuver&&!tg.vel&&!st.onGround&&gsH>15){const tr=Math.atan2(st.vx,-st.vz);let gMax=ground;for(let d=50;d<=Math.max(150,gsH*7);d+=50)gMax=Math.max(gMax,terrainHeight(st.x+Math.sin(tr)*d,st.z-Math.cos(tr)*d,area));hT=Math.max(hT,gMax-ground+25);}
   vyDes=clamp((tg.vyFF??0)+(hT-agl)*(tg.hGain??.45),-(tg.maxDown??8),tg.maxUp??7);if(tg.vy!==undefined)vyDes=clamp(vyDes,-Math.abs(tg.vy)-.01,Math.abs(tg.vy)+.01);}
  // torque limit (IGV closed, partial power): power above the limit becomes descent
  if(fx.powerCap&&!st.autorot){const kt=Math.hypot(st.vx,st.vz)/KT,need=powerRequired(kt,Math.max(0,vyDes??0),agl);if(need>fx.powerCap)vyDes=Math.min(vyDes??0,(fx.powerCap-powerRequired(kt,0,agl))/.085);}
  const ay=clamp(((vyDes??0)-st.vy)*(tg.vGain??1.4),-(tg.vAccel??3),tg.vAccel??3);st.vy+=ay*dt;if(st.onGround&&st.vy>0){st.onGround=false;if(ctx.maneuver)st.contact=null;}}
 st.x+=st.vx*dt;st.z+=st.vz*dt;st.y+=st.vy*dt;
 const g2=terrainHeight(st.x,st.z,area);
 /* v0.34.1 rotor / fuselage into trees or buildings (forest, villages): an obstacle contact, the airframe hangs in them */
 if(!st.onGround&&!ctx.noObstacle&&st.t>.5&&st.y-g2<30&&(st.y-g2<4||((st.t*20)|0)%2===0)){const top=obstacleTopNear(st.x,st.z,area,4.5);if(top>g2+2.5&&st.y<top-.8){const sf=surfaceProfile(st.x,st.z,area);st.contact={time:st.t,part:'mainRotor',point:[st.x,st.y,st.z],obstacle:area==='forest'||sf.kind==='forest'?'tree':'obstacle',surface:sf,supportHeightM:Math.max(0,top-g2),normalSpeedMps:Math.hypot(st.vx,st.vy,st.vz),descentMps:-st.vy,groundSpeedMps:Math.hypot(st.vx,st.vz),rotorRpm:st.rpm,engineRpm:st.eng,collective:st.col,water:false};st.onGround=true;st.vy=0;st.vx*=.2;st.vz*=.2;ctx.treeRest=st.y;}}
 if(!st.onGround&&st.y<=g2+.02&&st.t>.5&&st.vy<-.02){ // touchdown
  st.y=g2;const sf=surfaceProfile(st.x,st.z,area);if(!st.contact)st.contact={time:st.t,part:tg.contactPart??(st.vy<-3.5?'skidRight':'skidLeft'),point:[st.x,g2,st.z],obstacle:tg.contactObstacle??false,surface:sf,supportHeightM:0,normalSpeedMps:Math.hypot(st.vx,st.vy,st.vz),descentMps:-st.vy,groundSpeedMps:Math.hypot(st.vx,st.vz),rotorRpm:st.rpm,engineRpm:st.eng,collective:st.col,water:sf.kind==='water'};
  st.vy=0;st.onGround=true;}
 if(!st.onGround&&st.y<g2)st.y=g2;
 if(st.onGround){if(st.contact?.water){st.y=Math.max(g2-2.4,st.y-.3*dt);}else if(ctx.treeRest!=null&&ctx.treeRest>g2){ctx.treeRest=Math.max(g2,ctx.treeRest-1.2*dt);st.y=ctx.treeRest;}else st.y=g2;}
 // heading: nose on the track in forward flight, commanded heading in the hover; emergency yaw on top
 const gs=Math.hypot(st.vx,st.vz),track=gs>1?Math.atan2(st.vx,-st.vz):st.track;st.track=track;
 let want=tg.heading??(gs>7&&!st.onGround?track:st.hdg);if(fx.yaw&&!st.onGround)want+=fx.yaw*Math.PI/180;if(fx.yawKick&&st.t<fx.yawKick.until&&!st.onGround)want+=fx.yawKick.deg*Math.PI/180*Math.min(1,(fx.yawKick.until-st.t)/2);
 let rate=tg.yawRate!==undefined?tg.yawRate:clamp(wrap(want-st.hdg)*1.6,-.4,.4);if(fx.spin)rate=fx.spin;if(st.onGround&&!tg.taxi&&!fx.spin)rate*=.2;
 st.yawRate+=(rate-st.yawRate)*Math.min(1,dt*3);st.hdg=wrap(st.hdg+st.yawRate*dt);
 // attitude from accelerations (+ trim nose-down with speed)
 const ca=Math.cos(st.hdg),sa=Math.sin(st.hdg),along=(dvx*sa-dvz*ca),lat=(dvx*ca+dvz*sa)+(gs*st.yawRate*.0);
 const kt=gs/KT,pitchT=st.onGround?0:Math.atan2(along,G)+kt*.0013+(tg.pitchBias??0),rollT=st.onGround?0:Math.atan2(lat+gs*(st.track-st.trackPrev||0)/dt*.0,G)+(fx.roll??0)*Math.PI/180;
 const turnRoll=st.onGround?0:Math.atan2(gs*wrap(track-(st.trackPrev??track))/Math.max(dt,1e-3),G);st.trackPrev=track;
 const sm=Math.min(1,dt*(fx.heavy?1.4:2.6));st.pitch+=(pitchT-st.pitch)*sm;st.roll+=(clamp(rollT+turnRoll*0,-.6,.6)-st.roll)*sm;
 /* v0.35.7 transverse flow / ETL shudder: 8–22 kt, strongest near 15 kt, then smooth */
 {const ek=gs/KT;ctx.etl=!st.onGround&&!st.autorot&&ek>10&&ek<20&&st.y-g2<45?Math.sin(Math.PI*(ek-10)/10)*.7:0;if(ctx.etl>0){st.pitch+=Math.sin(st.t*31)*ctx.etl*.0025;st.roll+=Math.cos(st.t*27)*ctx.etl*.0035;}}
 if(fx.vib&&!st.onGround){const w=Math.sin(st.t*37)*fx.vib*.006;st.pitch+=w;st.roll+=Math.cos(st.t*41)*fx.vib*.006;}
 if(fx.pio&&st.t<fx.pio&&!st.onGround){const k=Math.min(1,(fx.pio-st.t)/3);st.pitch+=Math.sin(st.t*2.3)*.05*k*dt*3;st.roll+=Math.sin(st.t*1.8+1)*.07*k*dt*3;}
 /* v0.39 aerodinamik etkiler (kumanda ve güç üzerinde; yer izi programdadır):
    • hamleler: rüzgârın ~%25'i kadar düzensiz değişim → gövde sarsıntısı, hava sürati dalgalanması
    • tepe / sırt rüzgârı: rüzgâr yamaca çarpınca yukarı, rüzgâraltında aşağı akım (yerden uzaklaştıkça azalır) → güç / kollektif
    • GKK ve geriye savrulma (blowback) ile enine akım: 10–25 kt'ta burun kalkar, gövde sağa yıkılır → ileri ve sol saykılık
    • öteleme eğilimi: havırda kuyruk rotoru helikopteri sağa iter → sol saykılık, sol kızak alçak
    • girdap halkası: güçlüyken 15 kt altında 300 ft/dk üzeri alçalış → titreşim, güç artınca alçalış artar
    • rüzgârgülü etkisi / LTE: havırda yan-arka rüzgâr baş çevirmek ister → pedal iş yükü */
 const W=ctx.wind??{x:0,z:0},Ws=Math.hypot(W.x,W.z),aglNow=Math.max(0,st.y-g2),airX=st.vx-W.x,airZ=st.vz-W.z;let gust=0,wv=0;
 if(Ws>.5&&!st.onGround){gust=(Math.sin(st.t*.73)*.5+Math.sin(st.t*1.91+1)*.3+Math.sin(st.t*3.7+2)*.2)*Ws*.25;const gk=Math.min(1,Ws/10);st.pitch+=Math.sin(st.t*2.9)*gk*.004;st.roll+=Math.sin(st.t*2.3+1)*gk*.006;
  const e=30,gx=(terrainHeight(st.x+e,st.z,area)-terrainHeight(st.x-e,st.z,area))/(2*e),gz=(terrainHeight(st.x,st.z+e,area)-terrainHeight(st.x,st.z-e,area))/(2*e);wv=clamp((W.x*gx+W.z*gz),-4,4)*Math.exp(-aglNow/120);}
 ctx.gust=gust;ctx.wv=wv;const iasNow=Math.max(0,Math.hypot(airX,airZ)+gust)/KT/ctx.tasFactor,driven=st.eng>5000&&!st.autorot;
 let cfOff=0,crOff=0;
 if(!st.onGround&&driven){const e2=iasNow>8&&iasNow<28?Math.sin(Math.PI*(iasNow-8)/20):0;cfOff+=.05*e2;crOff-=.035*e2;
  if(Math.hypot(st.vx,st.vz)<3&&aglNow<15){crOff-=.03;st.roll-=.026*Math.min(1,dt*4);}
  if(st.vy<-1.6&&iasNow<15&&aglNow>15){if(!ctx.vrsAt){ctx.vrsAt=st.t;(ctx.vrsEv??=[]).push(st.t);}st.pitch+=Math.sin(st.t*23)*.006;st.roll+=Math.cos(st.t*19)*.008;}else ctx.vrsAt=0;}
 let pedOff=0;if(Math.hypot(st.vx,st.vz)<5&&Ws>1&&!st.onGround){const rel=wrap(Math.atan2(-W.x,W.z)-st.hdg);pedOff=Math.sin(rel)*Math.min(1,Ws/12)*.25;}
 ctx.aero={ias:iasNow,cfOff,crOff,pedOff};
 // rotor / engine
 /* v0.39 gavırnır: kollektif hızla artınca N2 / rotor kısa süre düşer (droop), ~2 s'de toparlanır */
 if(driven){const rate=(st.col-st.colPrev)/Math.max(dt,1e-3);ctx.droop=Math.max(clamp(rate*260,0,320),(ctx.droop??0)-260*dt);}else ctx.droop=0;
 let rTgt=(tg.rpm??324)-(tg.rpm===undefined?ctx.droop*324/6600:0),eTgt=(tg.eng??6600)-ctx.droop;
 /* v0.39 otorotasyonda rotor devri: kollektif yüksekken düşer, fleyırda artar, ilk kollektifle azalır */
 if(st.autorot&&!st.onGround){const dyn=324+60*(.42-st.col)+80*Math.max(0,-st.pitch);rTgt=clamp(.5*rTgt+.5*dyn,285,337);}st.rpm+=clamp(rTgt-st.rpm,-(tg.rpmRate??25)*dt,(tg.rpmRate??25)*dt);st.eng+=clamp(eTgt-st.eng,-1600*dt,1600*dt);
 st.rotorAngle+=st.rpm*Math.PI/30*dt;
 // control positions (display units of the physics controller: collective 1 = cruise trim)
 const climb=st.vy-wv,needP=st.autorot?.42:powerRequired(iasNow,climb,Math.max(0,st.y-g2))+(ctx.vrsAt?.25:0);let col=tg.collective??(st.onGround&&!tg.vy?(st.eng>3000?.55:.4):needP);if(fx.bounce)col+=Math.sin(st.t*19)*.12;if(fx.colHard!==undefined)col=fx.colHard;
 st.colPrev=st.col;st.col+=(col-st.col)*Math.min(1,dt*4);
 const cf=fx.cycHard?.[0]??clamp(st.pitch*.9+cfOff,-.24,.24),cr=fx.cycHard?.[1]??clamp(st.roll*.55+crOff,-.24,.24);st.cfPrev=st.cyc[0];st.crPrev=st.cyc[1];st.cyc=[st.cyc[0]+(cf-st.cyc[0])*Math.min(1,dt*4),st.cyc[1]+(cr-st.cyc[1])*Math.min(1,dt*4)];
 const drive=st.eng>5000&&!st.autorot,ped=fx.pedalFixed??clamp((drive?-(st.col-.85)*.7:.28+Math.max(0,st.col-.45)*.3)+(tg.yawRate??0)*.6+pedOff,-1,1); /* v0.39 motor tahrik etmezken tork yok: sağ pedal; otorotasyonda ilk kollektifle mast sürtünmesi → sağ pedal (kitap) */st.pedPrev=st.ped;st.ped+=(ped-st.ped)*Math.min(1,dt*4);
}
/* v0.34.1 what each control is doing in this emergency (kumanda görünümü): short notes beside the schematic positions,
   plus the throttle (gaz kolu), which the schematic does not draw */
function controlNotes(st,ctx){const e=ctx.em;if(!e)return {ctrl:ctx.mNotes?.ctrl??null,throttle:ctx.mThr??null};const fx=ctx.fx,id=e.id,act=ctx.actionDone,n={};let thr='tam açık';
 if(st.onGround&&st.contact&&(st.eng<500||st.rpm<200))thr='kapalı (susturma)';else if(st.autorot)thr=id==='clutch-no-disengage'?'rölanti':'tam kapalı';
 else if(id==='engine-overspeed'&&act)thr='elle kontrol · normal RPM’e azaltıldı';else if(id==='gov-emer-light'||id==='igv-closed'||id==='droop-comp'&&ctx.rpmSwing)thr='elle kontrol (GOV EMER)';
 else if(id==='fixed-pedal-high'&&/yaklaşma/i.test(ctx.phase))thr='azaltıldı · 6000 RPM';else if(id==='clutch-no-disengage'&&act)thr='açık';else if(id==='fire-start'&&act)thr='kapalı';else if(id==='fire-ground'&&act)thr='kapalı';else if(id==='engine-restart')thr=ctx.restartTry?'çalıştırma · yavaşça açılıyor':'kapalı';
 if(fx.cycHard)n.cyclic='sıkışık · sağ ileri (servo)';else if(fx.pio&&st.t<fx.pio)n.cyclic='aşırı kumanda · salınım';else if(fx.heavy)n.cyclic=id==='control-stiffness'?'sert':'ağır · hidroliksiz';else if(id==='mast-bumping')n.cyclic='yumuşak · ani hareket yok';else if(id==='tr-components'&&ctx.onsetDone&&!st.onGround)n.cyclic='geri (ağırlık merkezi ileri)';
 if(fx.colHard!==undefined)n.collective='sıkışık · tam yukarı (servo)';else if(fx.bounce)n.collective='titreşim (bounce)';else if(id==='engine-overspeed'&&act&&!st.autorot)n.collective='artırıldı · rotor yüklendi';else if((id==='compressor-stall'||id==='lte')&&act&&!st.onGround)n.collective='azaltıldı';else if(id==='droop-comp'&&!st.onGround)n.collective=ctx.rpmSwing&&st.t<ctx.rpmSwing?'büyük ve seri hareketler':'minimum hareket';else if(id==='igv-closed'&&!st.onGround)n.collective='tork ≤ 20–25 psi';
 if(fx.pedalFixed!==undefined)n.pedal=id==='lte'?'tam sol · yetersiz':'sabit (sıkışık)';else if(['tr-loss-flight','tr-loss-hover','tr-components'].includes(id)&&ctx.onsetDone)n.pedal='etkisiz · kuyruk rotoru';else if(id==='lte'&&act)n.pedal='kontrol geri geldi';
 return {ctrl:n,throttle:thr};}
// ---------- run cache ----------
const RUNS=new Map();
function runKey(c,choices){return JSON.stringify([c.program,c.emergencyId,c.maneuverId,c.flightArea,c.startX,c.startZ,c.startHeightFt,c.startIasKt,c.headingDeg,c.windKt,c.windFromDeg,c.temperatureC,c.pressureAltitudeFt,c.mode,c.pilot,c.grossWeightLb,c.initialRotorRpm,c.initialEngineRpm,c.turbulence,c.copilot,choices.map(a=>[a.id,a.option,+a.at.toFixed(3)])]);}
export function programRun(config,choices=[]){const key=runKey(config,choices);let r=RUNS.get(key);if(r)return r;r=simulate(config,choices);RUNS.set(key,r);if(RUNS.size>40)RUNS.delete(RUNS.keys().next().value);return r;}
// choice lookup: answered option, otherwise (planning / hazır akış) the reference option of that decision
function chooser(config,choices,defs){return (id,t=Infinity)=>{const a=choices.find(x=>x.id===id&&x.at<=t+1e-9);if(a)return a.option;if(config.mode==='guided'&&t===Infinity)return undefined;return defs[id]?.reference;};}
function simulate(config,choices){
 const area=config.flightArea??'terrain',hd=(config.headingDeg??0)*Math.PI/180,h0=(config.startHeightFt??0)*FT,v0=(config.startIasKt??0)*KT*tasFactor(config),maneuver=config.program==='maneuver';
 const W=windVector(config),airborne=h0>=.2,vx0=Math.sin(hd)*v0+(airborne?W.x:0),vz0=-Math.cos(hd)*v0+(airborne?W.z:0);
 const x0=(config.startX??0)-vx0*4,z0=(config.startZ??0)-vz0*4,g0=terrainHeight(x0,z0,area);
 const st={t:0,x:x0,z:z0,y:g0+h0,vx:vx0,vz:vz0,vy:0,hdg:hd,track:hd,trackPrev:hd,yawRate:0,pitch:0,roll:0,rpm:config.initialRotorRpm??324,eng:config.initialEngineRpm??6600,col:1,colPrev:1,cyc:[0,0],cfPrev:0,crPrev:0,ped:0,pedPrev:0,rotorAngle:0,onGround:h0<.2,contact:null,autorot:false};
 if(st.onGround&&v0<1){st.col=.55;}
 const INIT=structuredClone(st);
 const wFrom=(config.windFromDeg??0)*Math.PI/180,wSp=(config.windKt??0)*KT;
 const ctx={config,tasFactor:tasFactor(config),wind:{x:-Math.sin(wFrom)*wSp,z:Math.cos(wFrom)*wSp},area,maneuver,water:false,fx:{},events:[],decisions:[],lights:new Set(),warn:{rpm:false,fire:false},panelOff:false,smoke:0,phase:'Güçlü uçuş',reason:'',lz:null,end:null,endReason:'contact',notes:[]};
 if(!maneuver)ctx.em=emergencyById(config.emergencyId);
 const director=maneuver?maneuverDirector(maneuverById(config.maneuverId),config,choices,ctx,{st,pickLZ:pickProgramLZ,powerRequired}):emergencyDirector(emergencyById(config.emergencyId),config,choices,ctx);
 const dt=.05,samples=[];let tgPrev={};
 for(let i=0,NMAX=maneuver?14000:8000;i<=NMAX;i++){
  st.t=i*dt;const tg=director(st,dt)??tgPrev;tgPrev=tg;
  if(i>0)stepAircraft(st,tg,dt,ctx);
  samples.push(snap(st,ctx));
  if(ctx.end!=null&&st.t>=ctx.end)break;
 }
if(ctx.vrsEv?.length)ctx.events.push({at:ctx.vrsEv[0],kind:'Anlatım',title:'Girdap halkası belirtileri',text:'Güçlüyken 15 knot altında 300 ft/dk üzeri alçalış: titreşim; kollektif artınca alçalış artar. Kurtarma: ileri saykılıkla sürat kazan, kollektifi azalt.',target:'cyclic',source:['faa']});
 const last=samples.at(-1);return {init:INIT,ctx0:{wind:ctx.wind,area:ctx.area,maneuver:ctx.maneuver,water:false,lights:new Set(),warn:{rpm:false,fire:false}},samples,dt,duration:last.t,wing:ctx.wing??[],cover:ctx.cover??null,endReason:ctx.endReason,events:ctx.events.sort((a,b)=>a.at-b.at),decisions:ctx.decisions,lz:ctx.lz,notes:ctx.notes,contact:samples.find(s=>s.contact)?.contact??null};
}
function snap(st,ctx){return {t:st.t,x:st.x,y:st.y,z:st.z,vx:st.vx,vy:st.vy,vz:st.vz,hdg:st.hdg,pitch:st.pitch,roll:st.roll,rpm:st.rpm,eng:st.eng,col:st.col,dcol:(st.col-st.colPrev)/.05,cyc:[...st.cyc],dcyc:[(st.cyc[0]-st.cfPrev)/.05,(st.cyc[1]-st.crPrev)/.05],ped:st.ped,dped:(st.ped-st.pedPrev)/.05,rotorAngle:st.rotorAngle,onGround:st.onGround,contact:st.contact,autorot:st.autorot,phase:ctx.phase,reason:ctx.reason,lights:[...ctx.lights],warn:{...ctx.warn},panelOff:ctx.panelOff,smoke:ctx.smoke,smokeKind:ctx.smokeKind??'engine',vib:Math.max(ctx.fx.vib??0,(ctx.etl??0)*.28),etl:ctx.etl??0,lz:ctx.lz,yawRate:st.yawRate,gust:ctx.gust??0,wv:ctx.wv??0,...controlNotes(st,ctx)};}
// ---------- emergency decisions (karar vererek ilerle) ----------
export function emergencyDecisionDefs(e){
 const defs={};const first=e.act??(e.steps.find(s=>s.startsWith('!'))??e.steps[0]??'Usulü uygula').replace(/^!/,'');
 const generic=e.urgency==='info'?{label:'Gereksiz yere hemen inişe geç',cons:'needless',text:'Bu ışık bilgi amaçlıdır; acil iniş gerekmez, uçuş planı bozulur.'}:e.urgency==='ground'?{label:'Önce durumu telsizle bildir',cons:'fire',text:'Susturma ve tahliye gecikir.'}:{label:'Uçuşa devam et; durumu izle',cons:e.urgency==='asap'?'late-fail':'delay',after:50,text:'Usul uygulanmaz; arıza ilerleyebilir.'};
 const m=e.mistake??generic;
 defs['em-action']={id:'em-action',title:`${e.title}: ilk eylemin ne?`,source:['tr'],reference:'proc',options:[{id:'proc',label:'Usulü uygula: '+first,text:'Operatör talimnamesi '+e.ref+': '+e.steps.map(s=>s.replace(/^!/,'')).join(' · ')+'.',risk:false},{id:'mistake',label:m.label,text:m.text,risk:true},{id:'delay',label:'Önce çeklisti oku; belirtileri doğrula',text:e.steps.some(s=>s.startsWith('!'))?'Altı çizili adımlar ezberden ve hemen uygulanır; gecikme süresi kadar arıza etkisi sürer.':'Çeklist kullanımı uygundur; usul birkaç saniye geç uygulanır.',risk:e.steps.some(s=>s.startsWith('!'))}]};
 if(['hover','runon','fire','restart','clutch'].includes(e.landing)&&e.urgency!=='info'&&e.urgency!=='ground'){
  if(e.landing==='fire')defs['em-landing']={id:'em-landing',title:'Yangın: güçlü mü güçsüz mü inilsin?',source:['tr'],reference:'auto',options:[{id:'powered',label:'Güçlü iniş · mümkün olan en kısa zamanda',text:'Motor gücüyle en yakın uygun sahaya yaklaşma; inişten sonra emercensi motor susturma.',risk:false},{id:'autorot',label:'Güçsüz iniş · otorotasyon ve emercensi susturma',text:'Gaz kapatılır; yangına yakıt beslemesi kesilir, iniş otorotasyonla yapılır.',risk:false},{id:'continue',label:'Meydana kadar devam et',text:'Yangın yayılabilir; motor ve kumandalar etkilenebilir.',risk:true}]};
  else if(e.landing==='restart')defs['em-landing']={id:'em-landing',title:'Motor durdu: tekrar çalıştırma denensin mi?',source:['tr'],reference:'auto',options:[{id:'autorot',label:'Otorotasyonla in',text:'Alçakta en emniyetli yol; çalıştırma yaklaşık bir dakika sürer.',risk:false},{id:'restart',label:'Tekrar çalıştırmayı dene',text:'Yeterli irtifa (≈1500 ft üzeri) varsa: otorotasyonda çalıştırma usulü; motor çalışırsa güçlü uçuşla en kısa zamanda iniş.',risk:false}]};
  else if(e.landing!=='clutch')defs['em-landing']={id:'em-landing',title:'İniş kararı',source:['tr'],reference:e.urgency,options:[{id:'asap',label:'Mümkün olan en kısa zamanda in · en yakın uygun saha',text:'En yakın uygun iniş bölgesine gecikmeksizin iniş.',risk:e.urgency==='practicable'?false:false},{id:'practicable',label:'En uygun şekilde en kısa zamanda in · uygun meydan / saha',text:'Daha uygun (uzun, düz, engelsiz) bir sahaya kadar uçuş; süre uzar.',risk:e.urgency==='asap'},{id:'continue',label:'Göreve devam et',text:'İniş yapılmaz; arızanın ilerleme riski sürer.',risk:true}]};
 }
 if(['hover','runon'].includes(e.landing)&&e.urgency!=='info'&&e.urgency!=='ground')defs['em-term']={id:'em-term',title:'Son yaklaşma ve iniş tekniği',source:['tr','movements'],reference:e.landing,options:[{id:'hover',label:'Havıra kadar normal yaklaşma (8–10°)',text:'3 ft havırda sıfır süratle bitirilir; havır gücü gerekir.',risk:e.landing==='runon'},{id:'runon',label:'Alçak yaklaşma – ruleli iniş',text:'Temas geçiş kaldırıcı kuvvetin üzerinde bir süratle yapılır; havır gücü ve pedal ihtiyacı azalır.',risk:false}]};
 if(e.landing==='autorotRunon')defs['em-term']={id:'em-term',title:'Otorotasyonu nasıl bitireceksin?',source:['tr'],reference:'runon',options:[{id:'runon',label:'Ruleli bitir · istikamet kontrolü için sürat',text:'Rule müsait sahada temas geçiş kaldırıcı kuvvetin üzerinde.',risk:false},{id:'minrun',label:'75 ft’te yavaşla, rulesiz bitir',text:'10–20 ft’te ileri hız minimum; ufki ve seri kollektifle temas.',risk:false}]};
 return defs;}
// ---------- emergency director ----------
function emergencyDirector(e,config,choices,ctx){
 const defs=emergencyDecisionDefs(e),choose=chooser(config,choices,defs),onset=4,ev=(at,kind,title,text)=>ctx.events.push({at,kind,title,text,source:['tr'],reference:'Operatör talimnamesi '+e.ref});
 const area=ctx.area;ctx.water=area==='water';const startH=(config.startHeightFt??0),startV=config.startIasKt??0;
 let phase='cruise',pT=0,action=null,actionAt=null,landingChoice=null,term=null,failAt=null,lz=null,stepIdx=0,shut=false,touched=null,approachAt=null;
 const decisionAt={};const ask=(id,t,reference)=>{if(!defs[id]||decisionAt[id]!==undefined)return;decisionAt[id]=t;ctx.decisions.push({id,at:+t.toFixed(3),...(reference?{reference}:{})});};
 const urg=()=>landingChoice??e.urgency;
 const cruiseKt=e.effects.torqueLimit?55:Math.max(60,Math.min(80,startV||70)); // v0.34.1: torque-limited flight at the minimum-power speed
 ev(0,'Başlangıç',startH<1?'Yerde · motor çalışıyor':startV<5?'Havır':'Güçlü uçuş',startH<1?'Helikopter yerde, rotor dönüyor.':`${startH} ft AGL · ${startV} KIAS · güçlü uçuş.`);
 const stepsQueue=e.steps.map(s=>s.replace(/^!/,''));
 const announceStep=t=>{if(stepIdx<stepsQueue.length){ev(t,'Usul',`Adım ${stepIdx+1}`,stepsQueue[stepIdx]);stepIdx++;}};
 const goAutorot=(st,why,keep=false)=>{st.autorot=true;ctx.warn.rpm=true;phase='autorot';pT=st.t;if(!keep||!lz)lz=pickProgramLZ(st,area,{urgency:'asap',maxR:Math.max(200,(st.y-terrainHeight(st.x,st.z,area))*4.2),minR:60,runon:false,water:ctx.water,glide:3.4})??lz;ctx.lz=lz;ev(st.t,'Emercensi','Otorotasyon',why+(lz?` Saha: ${lz.label?.toLocaleLowerCase('tr-TR')??'—'}, ${Math.round(Math.hypot(lz.x-st.x,lz.z-st.z))} m.`:''));if(e.landing==='autorotRunon')ask('em-term',+(st.t+.6).toFixed(2));};
 return (st,dt)=>{
  const t=st.t,agl=st.y-terrainHeight(st.x,st.z,area),aglFt=agl/FT,gs=Math.hypot(st.vx,st.vz),kt=gs/KT;
  // ---- before onset: steady flight (or ground / hover) ----
  if(t<onset){ctx.phase=startH<1?'Yerde':startV<5?'Havır':'Güçlü uçuş';return startH<1?{vy:0,taxi:null,rpm:e.landing==='groundStart'?Math.min(324,t*20):324,eng:e.landing==='groundStart'?Math.min(6600,1200+t*900):6600}:startV<5?{vel:[0,0],heightFt:startH,heading:st.hdg}:{speedKt:startV,track:st.track,heightFt:startH};}
  // ---- onset ----
  if(!ctx.onsetDone){ctx.onsetDone=true;for(const l of e.lights)ctx.lights.add(l);if(e.lights.length||e.id==='master-only')ctx.lights.add('mc');if(e.warn==='fire')ctx.warn.fire=true;if(e.effects.smoke)ctx.smoke=1;
   const fx=e.effects;ctx.fx={...ctx.fx,vib:fx.vib,heavy:fx.ctrl==='heavy'||fx.ctrl==='stiff',bounce:fx.ctrl==='bounce'};if(fx.ctrl==='hardover-cyclic')ctx.fx.cycHard=[.22,.22];if(fx.ctrl==='hardover-collective')ctx.fx.colHard=1.9;if(fx.yaw)ctx.fx.yaw=fx.yaw;if(fx.roll)ctx.fx.roll=fx.roll;if(fx.torqueLimit)ctx.fx.powerCap=(fx.torqueLimit+4)/30;if(fx.spin)ctx.fx.spin=.25;if(fx.lte)ctx.fx.spin=.12;if(fx.yawDrift)ctx.fx.spin=fx.yawDrift*Math.PI/180;
   if(e.id==='fixed-pedal-low')ctx.fx.pedalFixed=clamp(st.ped+.12,-1,1);if(e.id==='fixed-pedal-high')ctx.fx.pedalFixed=clamp(st.ped-.2,-1,1);if(e.id==='fixed-pedal-hover')ctx.fx.pedalFixed=st.ped;if(fx.lte)ctx.fx.pedalFixed=-1;ctx.smokeKind=e.id==='electrical-fire'||e.id==='smoke'?'cabin':'engine';
   if(e.landing==='restart'||e.landing==='clutch'){ctx.warn.rpm=true;}
   ev(onset,'Emercensi',e.title,'Belirtiler: '+e.symptoms+(e.lights.length?' İkaz paneli: '+e.lights.map(l=>LIGHT_NAMES[l]??l).join(', ')+' · MASTER CAUTION.':'')+(e.gauge?' '+e.gauge+'.':''));
   ask('em-action',onset+.6);}
  // ---- first action (decision or reference) ----
  if(action===null&&t>=onset+.6){const c=choose('em-action',onset+.6+1e-6)??(config.mode==='guided'?undefined:'proc');if(c===undefined)return null;action=c;actionAt=onset+(c==='delay'?5:c==='proc'?1.4:1.2)+(config.pilot==='developing'?.8:0);}
  if(action&&t>=actionAt&&!ctx.actionDone){ctx.actionDone=true;ctx.actionT=t;
   if(action==='proc'||action==='delay'){announceStep(t);const fx=e.effects;
    if(fx.ctrl==='hardover-cyclic')delete ctx.fx.cycHard;if(fx.ctrl==='hardover-collective')delete ctx.fx.colHard;if(fx.ctrl==='bounce')ctx.fx.bounce=false;if(fx.lte)ctx.fx.spin=0;if(fx.rpm==='overspeed')ctx.fx.rpmHold=324;
    if(e.id==='compressor-stall')setTimeoutLike(ctx,t+2.5,()=>{ctx.fx.vib=0;});if(e.id==='electrical-fire'){ctx.panelOff=true;ctx.smoke=.4;}if(e.id==='battery-hot')ctx.notes.push('BAT kapalı');if(e.id==='hydraulic'||e.id==='control-stiffness')ctx.lights.add('hyd');
    if(e.landing==='hoverAutorot'||e.landing==='restart'&&false){}
   }else{const m=e.mistake??emergencyDecisionDefs(e)['em-action'].options[1];ev(t,'Hata',m.label,m.text);const cons=m.cons??'none';
    if(cons==='autorot'){goAutorot(st,'Hatalı eylem sonucunda motor gücü bırakıldı.');}
    else if(cons==='late-fail'){failAt=t+(m.after??40);ctx.landDelay=20;}
    else if(cons==='spin'){ctx.fx.spin=.9;ctx.fx.yaw=undefined;phase='uncontrolled';pT=t;}
    else if(cons==='fire'){ctx.smoke=1.6;failAt=null;ctx.fireDelay=8;}
    else if(cons==='rpm-decay'){ctx.rpmDecay=true;}
    else if(cons==='hard'||cons==='rpm-low'){ctx.hardEnd=cons;}
    else if(cons==='delay'){ctx.delayLanding=true;}
    else if(cons==='needless'){landingChoice='asap';}
    else if(cons==='overpull'){ctx.overpull=t+9;}
    else if(cons==='pio'){ctx.fx.pio=t+11;}
    else if(cons==='yaw'){ctx.fx.yawKick={until:t+7,deg:m.yawDeg??25};}
    else if(cons==='rpm-swing'){ctx.rpmSwing=t+14;}
    const hl=cons==='hardover-long'?8:3.5,fixHo=()=>ev(t+hl,'Usul','HYD CONT anahtarı aksi tarafa alındı','Sıkışma giderildi; kontrol geri kazanıldı.');
    if(e.effects.ctrl==='hardover-cyclic')setTimeoutLike(ctx,t+hl,()=>{delete ctx.fx.cycHard;fixHo();});if(e.effects.ctrl==='hardover-collective')setTimeoutLike(ctx,t+hl,()=>{delete ctx.fx.colHard;fixHo();});}}
  runTimers(ctx,t);
  if(stepIdx>0&&stepIdx<stepsQueue.length&&t>=actionAt+stepIdx*2.6)announceStep(t);
  if(failAt&&t>=failAt&&!st.autorot&&!st.onGround){failAt=null;ctx.eng=0;goAutorot(st,'Arıza ilerledi: motor / tahrik gücü kesildi.');ctx.engineOut=true;}
  // ---- landing decision ----
  const needsLanding=!['none','ground','groundStart','groundInfo','hoverLand','hoverAutorot','lte'].includes(e.landing)||landingChoice==='asap';
  if(defs['em-landing']&&action&&!ctx.landAsked&&t>=actionAt+1+(ctx.landDelay??0)){ctx.landAsked=true;ask('em-landing',+(t+.5).toFixed(2),defs['em-landing'].reference==='auto'?refLanding(e,st,area):undefined);if(e.landing==='restart'&&refLanding(e,st,area)==='autorot')ctx.lowRestart=true;}
  if(defs['em-landing']&&decisionAt['em-landing']!==undefined&&ctx.landChoice===undefined&&t>=decisionAt['em-landing']){let c=choose('em-landing',decisionAt['em-landing']+1e-6);if(c==='auto'||c===undefined)c=refLanding(e,st,area);ctx.landChoice=c;
   if(e.landing==='fire'){if(c==='autorot'){ctx.eng=0;goAutorot(st,'Güçsüz iniş kararı: gaz kapatıldı.');}else if(c==='continue'){failAt=t+30;landingChoice='practicable';ev(t,'Karar','Meydana devam',' Yangın yayılabilir.');}else landingChoice='asap';}
   else if(e.landing==='restart'){if(c==='restart'){ctx.restartTry=true;ev(t,'Karar','Tekrar çalıştırma deneniyor','Gaz kolu kapalı, GOV EMER, starter... Dikkat çalıştırmaya bölünüyor.');}}
   else{landingChoice=c==='continue'?'continue':c;if(c==='continue'){ev(t,'Karar','Göreve devam','İniş yapılmıyor.');if(e.urgency==='asap'&&!failAt&&!e.urgency.includes('info'))failAt=t+45;}}}
  // ---- termination technique decision at approach start ----
  if(defs['em-term']&&approachAt!==null&&decisionAt['em-term']===undefined)ask('em-term',approachAt);
  if(defs['em-term']&&decisionAt['em-term']!==undefined&&term===null&&t>=decisionAt['em-term']){const c=choose('em-term',decisionAt['em-term']+1e-6)??(config.mode==='guided'?undefined:(e.landing==='autorotRunon'?(lz&&lz.runon!==false&&area!=='mountain'&&area!=='forest'?'runon':'minrun'):e.landing));if(c===undefined)return null;term=c;if(c==='hover'&&e.landing==='runon'){ctx.hardEnd=ctx.hardEnd??e.hoverEnd??'hard';ev(t,'Hata','Havıra kadar yaklaşma seçildi',e.hoverText??'Bu arızada havır gücü ve kontrolü sınırlıdır; ruleli iniş gerekir.');}}
  // ---- RPM effects ----
  let rpmT=324,engT=6600,rpmRate=25;
  if(e.effects.rpm==='overspeed'){if(!ctx.fx.rpmHold&&t<actionAt+6){rpmT=348;engT=7100;rpmRate=30;ctx.warn.rpm=true;}else{ctx.warn.rpm=st.rpm>330;}}
  if(e.effects.rpm==='droop'){const sw=ctx.rpmSwing&&t<ctx.rpmSwing?3.4:1;engT=6600+Math.sin(t*1.7)*90*sw*(Math.abs(st.col-st.colPrev)>.001?3:1);rpmT=324+Math.sin(t*1.7)*5*sw;rpmRate=25*sw;}
  if(st.autorot||ctx.engineOut){engT=ctx.engineOut||e.landing==='restart'||ctx.eng===0?Math.max(0,st.eng>4000?1200:0):6600;}
  if(e.landing==='clutch'){if(t<onset+1.5){engT=6000;rpmT=300;}else if(ctx.rpmDecay){engT=1200;rpmT=200;rpmRate=8;}else if(action==='proc'){engT=6600;rpmT=324;}}
  if(ctx.restartTry&&t>decisionAt['em-landing']+40&&!ctx.restarted){engT=Math.min(6400,(t-decisionAt['em-landing']-40)*420);}if(ctx.restarted){engT=6600;}
  ctx.warn.rpm=ctx.warn.rpm&&(st.rpm<310||st.rpm>329||st.eng<6200)||(e.warn==='rpm'&&(st.rpm<310||st.eng<6200));
  if(ctx.rpmSwing&&t<ctx.rpmSwing)ctx.warn.rpm=st.rpm<312||st.rpm>334;
  const base={rpm:rpmT,eng:engT,rpmRate};
  // ---- failure effects on the flight path (hardovers, over-torque) while they last ----
  if(!st.onGround&&!st.autorot){
   if(ctx.fx.cycHard){ctx.phase='Saykılık kendiliğinden sağ ileri gidiyor';ctx.reason='Servo sıkışması';return {...base,speedKt:Math.min(115,kt+10),track:st.track+.5,vy:-4,accel:2.4,bank:30,pitchBias:.08};}
   if(ctx.fx.colHard!==undefined){ctx.phase='Kollektif kendiliğinden tam yukarı';ctx.reason='Servo sıkışması · rotor devri düşüyor';ctx.warn.rpm=st.rpm<312;return {...base,rpm:294,rpmRate:9,eng:6250,speedKt:Math.max(50,kt-4),track:st.track,vy:6,vAccel:2.5};}
   if(ctx.overpull&&t<ctx.overpull){ctx.phase='Tork sınırın üstünde · rotor devri düşüyor';ctx.reason='Oynak giriş yön kanatçıkları kapalı';ctx.warn.rpm=st.rpm<312;return {...base,rpm:296,rpmRate:6,eng:6150,speedKt:Math.max(55,kt-3),track:st.track,vy:-2.8};}}
  // ---- phase machine ----
  if(e.landing==='autorotRunon'&&!st.autorot&&e.autorotAt==='action'&&action==='proc'&&t>=actionAt){goAutorot(st,'Usul: otorotasyona girildi, gaz kolu tam kapalı.');}
  if((action===null||t<actionAt||(defs['em-landing']&&ctx.landChoice===undefined&&!st.autorot))&&!st.onGround&&!['hoverAutorot','hoverLand','lte'].includes(e.landing)){ctx.phase=action==='mistake'&&ctx.landDelay?'Uçuşa devam · arıza izleniyor':'Arıza belirtileri · ilk eylem';return startV<5&&startH>0?{...base,vel:[0,0],heightFt:startH}:{...base,speedKt:Math.max(startV,kt*.98),track:st.track,heightFt:Math.max(aglFt,40)};}
  if(st.onGround){return groundPhase(st,t,e,ctx,base,touched??(touched=t),config,ev);}
  if(phase==='uncontrolled'){ctx.phase='Kontrol kaybı · dikey eksen etrafında dönüş';ctx.reason='Kuyruk rotor itkisi yetersiz.';return {...base,vel:[st.vx*.97,st.vz*.97],vy:-4.5,vAccel:2,yawRate:1.4,contactPart:'tailBoom'};}
  if(e.landing==='hoverLand'&&!st.autorot){ctx.phase='Havırdan iniş · sabit pedal';return {...base,vel:[0,0],vy:action==='proc'?-.45:(t>actionAt+6?-.45:0),heightFt:action==='proc'?undefined:undefined};}
  if(e.landing==='hoverAutorot'){if(action&&t>=actionAt){st.autorot=true;ctx.warn.rpm=st.rpm<310;ctx.phase='Havırda otorotasyon · gaz kapalı';ctx.fx.spin=Math.max(0,(ctx.fx.spin??0)*.985);return {...base,rpm:290,eng:1200,rpmRate:20,vel:[0,0],vy:agl>1.2?-1.1:-.7,collective:1.3};}ctx.phase='Baş sağa dönüyor · pedal etkisiz';ctx.fx.spin=Math.min(1.2,(ctx.fx.spin??.25)+dt*.35);return {...base,vel:[0,0],heightFt:5};}
  if(e.landing==='lte'){if(action==='mistake'&&t>=actionAt){phase='uncontrolled';ctx.fx.spin=1.2;return null;}if((action==='proc'||action==='delay')&&t>=actionAt){ctx.phase='Kollektif azaltıldı · kontrol kazanıldı';ctx.fx.spin=0;delete ctx.fx.pedalFixed;if(t>actionAt+4){ctx.phase='İleri uçuşa geçiş';if(!ctx.lteDone){ctx.lteDone=true;ctx.end=t+14;ctx.endReason='time';ev(t,'Usul','Kontrol kazanıldı','Başa hâkim olununca ileri sürat kazanılarak normal uçuşa geçildi.');}return {...base,speedKt:50,track:st.hdg,vy:1.5};}return {...base,vel:[0,0],vy:-2.5};}ctx.phase='Baş sağa dönüyor · tam sol pedal yetmiyor';ctx.fx.spin=Math.min(1,(ctx.fx.spin??.1)+dt*.05);return {...base,vel:[0,0],heightFt:100};}
  /* in-flight restart: the engine lights ~55 s into the attempt; above 300 ft power is restored and a powered landing follows */
  if(e.landing==='restart'&&ctx.restartTry&&!ctx.restarted&&t>decisionAt['em-landing']+55){if(aglFt>300&&!st.onGround){ctx.restarted=true;st.autorot=false;ctx.engineOut=false;ctx.eng=undefined;phase='cruise';lz=null;landingChoice='asap';ctx.warn.rpm=false;ev(t,'Usul','Motor çalıştı','N1 %40’ta starter bırakıldı; gaz kolu elle 6400–6600 RPM’e açıldı. Mümkün olan en kısa zamanda inilir.');}else ctx.restartFail=true;}
  if(phase==='autorot')return autorotPhase(st,t,e,ctx,base,lz,term,config,ev,(n)=>{lz=n;});
  if(e.landing==='restart'&&!ctx.restarted||e.landing==='clutch'&&ctx.rpmDecay){if(!st.autorot)goAutorot(st,e.landing==='restart'?'Motor durdu.':'Rotor devri motorla birlikte düşüyor.');return autorotPhase(st,t,e,ctx,base,lz,term,config,ev,(n)=>{lz=n;});}
  if(!needsLanding||landingChoice==='continue'){ctx.phase=e.urgency==='info'?'Uçuşa devam · bilgi ikazı':'Uçuşa devam';if(!ctx.infoEnd){ctx.infoEnd=true;ctx.end=Math.max(t+22,onset+26);ctx.endReason='time';}return {...base,speedKt:cruiseKt,track:st.track,heightFt:Math.max(300,startH)};}
  // ---- powered landing: pick a field, fly to it, approach and land ----
  if(!lz||ctx.lzFor!==urg()){if(t<actionAt+1.2&&!ctx.delayLanding)return {...base,speedKt:Math.max(cruiseKt,kt),track:st.track,heightFt:Math.max(aglFt,200)};
   ctx.lzFor=urg();ctx.lzT=t;const runon=e.landing==='runon'||term==='runon';lz=pickProgramLZ(st,area,{urgency:ctx.delayLanding?'practicable':urg(),runon,trees:e.landing==='trees',water:e.landing==='ditch',maxR:urg()==='practicable'?1900:1500,minR:clamp(agl*2.4,150,700)})??{x:st.x+Math.sin(st.track)*600,z:st.z-Math.cos(st.track)*600,score:0,label:'Seçilemedi'};ctx.lz=lz;ctx.fc=e.landing==='trees'||e.landing==='ditch'?null:chooseFinal(st,lz,area,runon);ctx.gateDone=false;ctx.gateExtra=0;
   ev(t,'Saha',`İniş sahası: ${lz.label??''}`,`${Math.round(Math.hypot(lz.x-st.x,lz.z-st.z))} m · ${URGENCY_TEXT[urg()]??''}${lz.slopeDeg!=null?` · eğim ${lz.slopeDeg.toFixed(1)}°`:''}.`);}
  const dx=lz.x-st.x,dz=lz.z-st.z,D=Math.hypot(dx,dz),b=Math.atan2(dx,-dz),runonT=(term??e.landing)==='runon',gL=terrainHeight(lz.x,lz.z,area),hz=st.y-gL,gHere=st.y-agl,ang=Math.max((runonT?5.5:9)*Math.PI/180,ctx.appAng??0),targetH=e.landing==='trees'?Math.max(8,obstacleTopNear(lz.x,lz.z,area,9)-terrainHeight(lz.x,lz.z,area)+2)/FT:e.landing==='ditch'?3:3;
  const minKt=e.effects.minKt??0,maxKt=e.effects.maxKt??80;
  if(e.landing==='autorotRunon'&&!st.autorot&&D<=Math.max(150,agl*3.6)){goAutorot(st,'İnişe müsait araziye gelindi: otorotasyona girildi.',true);return autorotPhase(st,t,e,ctx,base,lz,term,config,ev,(n)=>{lz=n;});}
  /* v0.34.1 approach geometry against the field's elevation (slopes, valleys) and over the obstacles on the final:
     the angle is at least what clears trees / buildings along the final course by 4 m */
  if(ctx.appAngFor!==lz){ctx.appAngFor=lz;ctx.appAng=clearAngle(lz,ctx.fc??b,area,gL);}
  /* v0.34.1 final course chosen with the field (clear of trees / buildings, run-out open): fly to a gate on its extension
     first, so the approach is flown down that course rather than from wherever the aircraft happened to be */
  if(phase!=='approach'&&!ctx.gateDone&&ctx.fc!=null){const fc=ctx.fc,gD=clamp(Math.max(0,hz-targetH*FT)/Math.tan(ang)+80+(ctx.gateExtra??0),220,1100),gx=lz.x-Math.sin(fc)*gD,gz=lz.z+Math.cos(fc)*gD,DG=Math.hypot(gx-st.x,gz-st.z),onFinal=Math.abs(wrap(fc-b))<.3&&D>gD*.55;
   if(onFinal||DG<110)ctx.gateDone=true;else{phase='enroute';const bg=Math.atan2(gx-st.x,-(gz-st.z));ctx.phase='Sahaya güçlü uçuş · son yaklaşma hattına';ctx.reason='Rota '+Math.round((bg*180/Math.PI+360)%360)+'°, saha '+Math.round(D)+' m';
    const R=(Math.max(kt,30)*KT)**2/(G*Math.tan(25*Math.PI/180)),close=Math.abs(wrap(bg-st.track))>.5&&DG<2.6*R;let spd=Math.min(maxKt,cruiseKt+5);if(close)spd=clamp(DG*.12,25,spd);
    const hG=(gD*Math.tan(ang))/FT+targetH;return {...base,speedKt:clamp(spd,minKt,maxKt),track:bg,heightFt:Math.max(hG+(gL-gHere)/FT,100),maxDown:7.5,accel:close?2.2:1.4};}}
  if(phase!=='approach'){const need=Math.max(0,hz-targetH*FT)/Math.tan(ang),err=Math.abs(wrap(b-st.track)),tooHigh=hz-targetH*FT>D*Math.tan(Math.max(ang*1.7,9*Math.PI/180))+8; // v0.34.1: never more than ~1.7x the approach angle above the path
   if(tooHigh&&ctx.fc!=null&&(ctx.gateExtra??0)<300&&D<1500){ctx.gateDone=false;ctx.gateExtra=(ctx.gateExtra??0)+300;return null;}
   if(!(err<.35&&!tooHigh&&D<=need+80)&&t-(ctx.lzT??t)<100){phase='enroute';const orbit=false;ctx.phase=tooHigh?'Sahaya güçlü uçuş · süzülüşle irtifa kaybı':'Sahaya güçlü uçuş'; /* v0.39 kitapta olmayan irtifa kaybı dönüşleri kaldırıldı: düz uçuşta süzülüşle */ctx.reason='Rota '+Math.round((b*180/Math.PI+360)%360)+'°, '+Math.round(D)+' m';
    /* v0.34.1 a field inside the turn circle: slow down while turning (a helicopter tightens the turn with less speed) */
    const R=(Math.max(kt,30)*KT)**2/(G*Math.tan(25*Math.PI/180)),close=!orbit&&err>.5&&D<2.6*R;let spd=orbit?65:Math.min(maxKt,cruiseKt+5);if(close)spd=clamp(D*.1,15,spd);
    return {...base,speedKt:clamp(spd,Math.max(minKt,orbit?60:0),maxKt),track:orbit?b+1.35:b,heightFt:Math.max(targetH+(D<200?12:40),Math.min(clamp(aglFt,250,700),(D*Math.tan(ang))/FT+targetH)+(gL-gHere)/FT,Math.min(150,(D*Math.tan(ang))/FT+targetH+(D<200?12:40))),maxDown:7.5,accel:close?2.2:1.4};}}
  if(phase!=='approach'){phase='approach';approachAt=t;ctx.finalTrack=b;
   /* v0.34.1 run-on: the run-out along the real final course must stay on landable ground - aim short when it does not */
   if(runonT){let c=0;for(let d=10;d<=70;d+=10){if(assessSpot(lz.x+Math.sin(b)*d,lz.z-Math.cos(b)*d,area).score<.45)break;c=d;}
    if(c<60){const back=60-c,nx=lz.x-Math.sin(b)*back,nz=lz.z+Math.cos(b)*back;if(assessSpot(nx,nz,area).score>.45){lz={...lz,x:nx,z:nz};ctx.lz=lz;}}}
   ctx.fc=b;ctx.appAng=clearAngle(lz,b,area,terrainHeight(lz.x,lz.z,area));ctx.appAngFor=lz;const angNow=Math.max((runonT?5.5:9)*Math.PI/180,ctx.appAng);ev(t,'Yaklaşma',runonT?'Alçak yaklaşma · ruleli iniş':e.landing==='trees'?'Ağaç tepelerine yaklaşma':e.landing==='ditch'?'Su üzerine havıra yaklaşma':'Havıra kadar normal yaklaşma',`Yaklaşma açısı ≈ ${(angNow*180/Math.PI).toFixed(0)}°, mesafe ${Math.round(D)} m.`);if(defs['em-term']){ask('em-term',t);if(term===null&&config.mode==='guided'&&choose('em-term',t+1e-6)===undefined)return null;}}
  const along=Math.max(0,dx*Math.sin(b)+dz*-Math.cos(b)*-1),hDes=Math.max(targetH*FT,Math.min(hz,D*Math.tan(ang)+targetH*FT)),hLoc=Math.max(hDes+gL-gHere,D>60?8:D>25?3:.9); // path height above the field, flown as height above the ground here
  const touchKt=runonT?Math.max(minKt?18:20,minKt?Math.min(minKt,30):0):0,hardEnd=ctx.hardEnd;
  // speed: decelerate to arrive with the termination speed (constant deceleration ~0.9 m/s²)
  let sp=Math.sqrt(Math.max(0,(touchKt*KT)**2+2*(runonT?.8:.9)*(ctx.fx.heavy?.55:1)*Math.max(0,D-(runonT?0:3))))/KT;if(D>25)sp=Math.min(sp,4.2/Math.tan(ang)/KT);/* steep final: sink ≤ ~830 fpm */sp=clamp(Math.min(sp,maxKt),touchKt,cruiseKt);
  if(minKt&&!runonT&&sp<minKt&&hardEnd==='spin'){phase='uncontrolled';ev(t,'Kontrol kaybı','Sürat '+minKt+' knot’ın altına düştü','Yana kayış kontrol edilemiyor; helikopter dönmeye başladı.');}
  /* v0.35 narration along the final (anlatım): rate of closure, the last part before contact */
  {const aglN=st.y-terrainHeight(st.x,st.z,area);if(runonT&&!ctx.apN1&&D<380){ctx.apN1=1;ev(t,'Anlatım','Yaklaşma oranı','Açı kollektifle korunur; yer hızı artar gibi görünene kadar sürat muhafaza edilir, sonra alçalma ve yakınlaşma oranı yavaş yavaş azaltılır.');}
   if(runonT&&!ctx.apN2&&aglN<7&&D<120){ctx.apN2=1;ev(t,'Anlatım','Temas öncesi','Geçiş kaldırıcı kuvvetin üzerinde: kollektifle süzülüş oranı, saykılıkla ufkiyet ve yer izi, pedallarla baş istikameti.');}
   if(!runonT&&e.landing!=='trees'&&!ctx.apN1&&aglN<95&&D<520){ctx.apN1=1;ev(t,'Anlatım','Yer hızı analizi','Açı sabit; yer hızı hızlı yürüyüşe düşecek şekilde saykılıkla yavaşlanır, açı kollektifle korunur.');}}
  ctx.phase=runonT?'Alçak yaklaşma · ruleli iniş':'Normal yaklaşma';ctx.reason=`${Math.round(D)} m · hedef ${Math.round(hDes/FT)} ft · ${sp.toFixed(0)} kt`;
  if(ctx.ditchT)return ditchPhase(st,t,ctx,base,ev);
  if(!runonT&&D<6&&kt<4){ // termination: hover, then set down
   if(e.landing==='trees'){ctx.phase='Ağaçlara dikey alçalış';if(!ctx.treesMsg){ctx.treesMsg=true;ev(t,'Usul','Ağaç tepesinde sıfır yer sürati','Ağaçlara dikey alçalış; paller girmeden gaz kapalı ve kalan kollektif.');}
    const top=obstacleTopNear(st.x,st.z,area,7);if(!st.contact&&st.y<=top+1.2){st.contact={time:t,part:'mainRotor',point:[st.x,st.y,st.z],obstacle:'tree',surface:surfaceProfile(st.x,st.z,area),supportHeightM:Math.max(0,top-terrainHeight(st.x,st.z,area)),normalSpeedMps:Math.abs(st.vy),descentMps:-st.vy,groundSpeedMps:Math.hypot(st.vx,st.vz),rotorRpm:st.rpm,engineRpm:0,collective:1.8};st.onGround=true;st.vy=0;ctx.treeRest=st.y;st.autorot=true;}
    return {...base,vel:[0,0],vy:-1,eng:st.y<=top+4?0:6600,collective:1.4};}
   if(e.landing==='ditch')return ditchPhase(st,t,ctx,base,ev);
   ctx.phase='Havır · iniş';if(!ctx.hovered){ctx.hovered=t;ev(t,'Havır','3 ft havır','Yaklaşma havırda tamamlandı; yere iniş.');}
   if(hardEnd==='rpm-low'||hardEnd==='hard'){return {...base,rpm:hardEnd==='rpm-low'?292:324,vel:[0,0],vy:-2.6,vAccel:4};}
   if(hardEnd==='spin'){phase='uncontrolled';return null;}
   return {...base,vel:[0,0],heightFt:t-ctx.hovered<2.2?3:0,vy:-.35,hGain:.6,maxDown:.45};}
  /* final course is frozen at the start of the approach (small corrections only) so a short overshoot never turns the aircraft round */
  if(D>450)ctx.finalTrack=b;const ft=ctx.finalTrack??b,corr=clamp(wrap(b-ft),-.4,.4),passed=(dx*Math.sin(ft)-dz*Math.cos(ft))<0,dir=passed?(D<40?ft:b):ft+corr;if(passed&&D>=40&&!(runonT&&aglFt<25&&D<110)){sp=Math.min(sp,clamp(D*.14,10,35));ctx.finalTrack=b;}
  const vel=[Math.sin(dir)*sp*KT,-Math.cos(dir)*sp*KT];
  if(runonT&&(agl<1.6||(passed&&agl<4)))return {...base,vel,vy:-.45,maxDown:.5};
  if(runonT&&agl<9&&vel)return {...base,vel,vy:-(.55+agl*.5),maxDown:5,vAccel:2.5}; // round-out: the sink comes off over the last ~30 ft
  /* a run-on that reaches the spot a little high continues straight ahead onto the run-out (checked clear for 100 m) */
  if(runonT&&passed&&D<110&&aglFt<25){const v2=Math.max(touchKt,Math.min(kt,touchKt+6))*KT;return {...base,vel:[Math.sin(ft)*v2,-Math.cos(ft)*v2],vy:-1.1,maxDown:1.3,accel:1.2};}
  if(!runonT&&passed&&D<60&&kt<12)return {...base,vel:[dx*.12,dz*.12],heightFt:3,hGain:.6};
  /* feed-forward of the glide-path descent rate: a pure height loop lagged ~10 ft high at the spot */
  const pathH=D*Math.tan(ang)+targetH*FT,onPath=pathH>targetH*FT+.6&&pathH<=hz+1.5&&hz<=pathH+15&&hDes+gL-gHere>=hLoc-.05; // descending along the path (not below it, not on the terrain floor)
  return {...base,vel,heightFt:hLoc/FT,hGain:.6,maxDown:6,accel:1.5,vyFF:onPath?-Math.min(sp*KT,gs)*Math.tan(ang):0};
 };
}
function refLanding(e,st,area){if(e.landing==='fire'){const lz=pickProgramLZ(st,area,{urgency:'asap',maxR:900});return lz&&lz.score>.5?'powered':'autorot';}if(e.landing==='restart')return (st.y-terrainHeight(st.x,st.z,area))/FT>1500?'restart':'autorot';return e.urgency==='practicable'?'practicable':'asap';}
/* obstacles under the flare / final path: the height falls linearly from now to the spot; trees, buildings and
   boulders taller than that line (less a 2 m margin) block it */
function flarePathClear(st,x1,z1,area){const L=Math.hypot(x1-st.x,z1-st.z),h0=st.y;for(let d=8;d<L-6;d+=8){const f=d/L,x=st.x+(x1-st.x)*f,z=st.z+(z1-st.z)*f,g=terrainHeight(x,z,area),h=h0+(terrainHeight(x1,z1,area)-h0)*f;if(obstacleTopNear(x,z,area,5)>g+1.5&&obstacleTopNear(x,z,area,5)+2>h)return false;}return true;}
function chooseFinal(st,lz,area,runon){const gL=terrainHeight(lz.x,lz.z,area),a0=Math.atan2(lz.x-st.x,-(lz.z-st.z)),lim=(runon?8:15)*Math.PI/180;let best=null;
 for(const off of [0,.45,-.45,.9,-.9,1.4,-1.4,2,-2,2.6,-2.6,Math.PI]){const c=a0+off;let cost=Math.abs(off)*.35;const an=clearAngle(lz,c,area,gL);if(an>lim)cost+=(an-lim)*20;
  if(runon){let m=1;for(let d=20;d<=80;d+=20){const x=lz.x+Math.sin(c)*d,z=lz.z-Math.cos(c)*d;m=Math.min(m,obstacleTopNear(x,z,area,5)>terrainHeight(x,z,area)+1.5?0:assessSpot(x,z,area).score);}if(m<.45)cost+=2;}
  if(!best||cost<best.cost)best={c,cost};}
 return best.c;}
function clearAngle(lz,course,area,gL,out){let a=0;for(let d=10;d<=450;d+=8){const x=lz.x-Math.sin(course)*d,z=lz.z+Math.cos(course)*d,g=terrainHeight(x,z,area),top=obstacleTopNear(x,z,area,8),w=wireTopNear(x,z,area,14);let h=top>g+1.5?top-gL+4:g-gL>1?g-gL+4:0;if(w>-1e9){h=Math.max(h,w-gL+6);if(out)out.wire=Math.min(out.wire??1e9,d);}if(h>0)a=Math.max(a,Math.atan2(h,d));}return Math.min(a,20*Math.PI/180);} /* v0.39 son yaklaşma hattındaki teller de engel */
function setTimeoutLike(ctx,at,fn){(ctx.timers??=[]).push({at,fn});}
function runTimers(ctx,t){if(!ctx.timers)return;for(const k of ctx.timers)if(!k.done&&t>=k.at){k.done=true;k.fn();}}
const LIGHT_NAMES={eop:'ENGINE OIL PRESS',eicing:'ENGINE ICING',eicedet:'ENGINE ICE DET',echip:'ENGINE CHIP DET',lboost:'LEFT FUEL BOOST',rboost:'RIGHT FUEL BOOST',efpump:'ENG FUEL PUMP',m20:'20 MINUTE FUEL',ffilter:'FUEL FILTER',govemer:'GOV EMER',auxlow:'AUX FUEL LOW',xop:'XMSN OIL PRESS',xhot:'XMSN OIL HOT',hyd:'HYD PRESSURE',inlet:'ENGINE INLET AIR',inv:'INST INVERTER',gen:'DC GENERATOR',ext:'EXTERNAL POWER',chip:'CHIP DETECTOR',iff:'IFF'};
export {LIGHT_NAMES};
// kinematic autorotation: glide at ~65 KIAS / ~1700 fpm to the field, flare from ~75 ft, cushion at ~15 ft
function autorotPhase(st,t,e,ctx,base,lz,term,config,ev,setLz){
 const area=ctx.area,agl=st.y-terrainHeight(st.x,st.z,area),aglFt=agl/FT,gs=Math.hypot(st.vx,st.vz);st.autorot=true;
 const engT=ctx.engineOut||ctx.eng===0||e.landing==='restart'?(st.eng>4000?1500:0):6600*0+1200;
 if(!lz){lz={x:st.x+Math.sin(st.track)*aglFt*FT*4,z:st.z-Math.cos(st.track)*aglFt*FT*4,label:'Süzülüş istikameti'};setLz(lz);ctx.lz=lz;}
 const dx=lz.x-st.x,dz=lz.z-st.z,D=Math.hypot(dx,dz),b=D>15?Math.atan2(dx,-dz):st.track,runon=(term??(e.landing==='autorotRunon'?'runon':'minrun'))==='runon';
 const late=ctx.restartTry&&(ctx.lowRestart||ctx.restartFail)?.35:1;
 /* v0.35 rising ground (dağlık): the flare gate is judged on the lower of the height over the ground below and the
    height over the field, and over the terrain the next 3 s will cross, so a hillside does not come up under a late flare */
 let gAhead=terrainHeight(st.x,st.z,area);for(let d=20;d<=gs*3;d+=20)gAhead=Math.max(gAhead,terrainHeight(st.x+st.vx/Math.max(gs,1)*d,st.z+st.vz/Math.max(gs,1)*d,area));const hGate=Math.min(aglFt,(st.y-Math.max(gAhead,terrainHeight(lz.x,lz.z,area)))/FT);
 if(hGate>75*late){ctx.phase='Otorotasyon · süzülüş';ctx.reason=`${Math.round(D)} m · ${Math.round(aglFt)} ft`;
  /* v0.34.1 glide geometry to the flare gate: distance less the flare run, height less the 75 ft flare height.
     Achievable glide ~3.3 (55 kt) to ~4 (75 kt); too high for the distance -> spiral round the field, leaving the
     spiral early enough that the turn-in (≈70°) still ends on a 55-kt glide */
  const hz=st.y-terrainHeight(lz.x,lz.z,area),fl=Math.min(110,gs*gs/(2*5.5)),aE=Math.max(5,hz-23),dE=Math.max(0,D-fl),need=dE/aE,w=G*Math.tan(30*Math.PI/180)/Math.max(20,gs);
  if(!ctx.spiral&&!ctx.spiralDone&&need<2.7&&hz>52)ctx.spiral=true;
  const errB=Math.abs(wrap(b-Math.atan2(st.vx,-st.vz)));if(ctx.spiral&&errB>.6&&dE/Math.max(5,aE-8.6*errB/w)>=3.3){ctx.spiral=false;ctx.spiralDone=true;}
  /* glide speed sets the glide: 75 kt stretches (~4), 55 kt min-rate (~3.3), 45 kt steepens (~2.6, higher sink) */
  const kt=need>3.9?75:need<2.9?45:need<3.4?55:65,spiral=ctx.spiral;if(spiral)ctx.phase='Otorotasyon · sahaya dönüşlü süzülüş';
  return {...base,rpm:327,eng:engT,rpmRate:12,speedKt:spiral?60:kt,track:spiral?b+1.2:b,vy:-(spiral?8.6:kt>70?9.6:kt<50?9.2:8.6),vAccel:2.5,accel:kt<50?2:1.5,bank:30};}
 if(aglFt>15*late){ctx.phase='Otorotasyon · fleyır';if(!ctx.flared){ctx.flared=t;
   /* v0.34.1 the flare decides where the skids go: when the field is not where the flare ends, take the best landable
      spot round the flare end point (ahead of the nose) rather than flaring onto whatever lies there */
   const tr=Math.atan2(st.vx,-st.vz),tkM=(runon?22:3)*KT,vyF=runon?3:2,ahead=Math.min(230,Math.max(0,gs*gs-tkM*tkM)/(2*5.5)+Math.max(0,(agl-4.6)/vyF-(gs-tkM)/5.5)*tkM+(runon?25:5)),px=st.x+Math.sin(tr)*ahead,pz=st.z-Math.cos(tr)*ahead;let moved=false;
   const reach=(x,z)=>{const a=Math.atan2(x-st.x,-(z-st.z));if(Math.abs(wrap(a-tr))>=.5||!flarePathClear(st,x,z,area))return false;if(runon)for(let d=10;d<=40;d+=10){const xx=x+Math.sin(a)*d,zz=z-Math.cos(a)*d;if(obstacleTopNear(xx,zz,area,5)>terrainHeight(xx,zz,area)+1.5)return false;}return true;};
   if(Math.hypot(px-lz.x,pz-lz.z)>40||!reach(lz.x,lz.z)){let best=null;for(let r=0;r<=90;r+=15)for(let k=0;k<(r?12:1);k++){const a=k/12*2*Math.PI,x=px+Math.sin(a)*r,z=pz-Math.cos(a)*r,q=Math.abs(terrainHeight(x,z,area)-terrainHeight(px,pz,area))>4?0:assessSpot(x,z,area).score,off=Math.abs(wrap(Math.atan2(x-st.x,-(z-st.z))-tr)),val=q-r/300-off*.8;if(q>.5&&(!best||val>best.val)&&reach(x,z))best={x,z,val};}
    /* nothing landable and clear ahead: at least a clear flare line (open ground, no building / trees in the way) */
    if(!best)for(const dA of [0,.25,-.25,.5,-.5,.75,-.75]){const x=st.x+Math.sin(tr+dA)*ahead,z=st.z-Math.cos(tr+dA)*ahead;if(flarePathClear(st,x,z,area)&&obstacleTopNear(x,z,area,6)<terrainHeight(x,z,area)+1.5){best={x,z};break;}}
    if(best){lz={...lz,x:best.x,z:best.z,label:surfaceProfile(best.x,best.z,area).label};setLz(lz);ctx.lz=lz;moved=true;}}
   ctx.flareTrack=Math.abs(wrap(Math.atan2(lz.x-st.x,-(lz.z-st.z))-tr))<.8?Math.atan2(lz.x-st.x,-(lz.z-st.z)):tr;
   ev(t,'Otorotasyon','Fleyır',`${Math.round(aglFt)} ft · ${(gs/KT).toFixed(0)} kt.`+(moved?` İniş noktası düzeltildi: ${lz.label?.toLocaleLowerCase('tr-TR')??''}.`:''));}
  const tk=runon?22:3;return {...base,rpm:334,eng:engT,rpmRate:15,speedKt:tk,track:ctx.flareTrack,vy:-(runon?3:2)*late-(ctx.restartTry?3:0),vAccel:4,accel:5.5,pitchBias:-.1};}
 ctx.phase='Otorotasyon · son kollektif';if(!ctx.cushioned){ctx.cushioned=t;ev(t,'Otorotasyon','Son kollektif',`${Math.round(aglFt)} ft’te seri kollektif.`);}
 return {...base,rpm:255,eng:engT,rpmRate:30,speedKt:runon?18:2,track:ctx.flareTrack??b,vy:ctx.restartTry&&(ctx.lowRestart||ctx.restartFail)?-3.5:-1.1,vAccel:4,accel:3,collective:1.7};}
function ditchPhase(st,t,ctx,base,ev){
 if(!ctx.ditchT){ctx.ditchT=t;ev(t,'Usul','3 ft havır · su üstü','Kokpit kapıları atıldı, kabin kapıları açık; mürettebat ve yolcular helikopteri terk ediyor.');}
 const dt=t-ctx.ditchT;if(dt<6){ctx.phase='Su üstünde havır · tahliye';return {...base,vel:[0,0],heightFt:3};}
 if(dt<12){ctx.phase='Personelden uzaklaşma · havır taksi';const h=st.hdg;return {...base,vel:[Math.sin(h+Math.PI/2)*4,-Math.cos(h+Math.PI/2)*4],heightFt:3};}
 if(!ctx.ditchOff){ctx.ditchOff=true;ev(t,'Usul','Gaz kapalı · otorotasyon','Paller suya girmeden kollektifin tamamı; ufki tut, yatış başlayınca yatış yönüne saykılık.');}
 st.autorot=true;ctx.phase='Suya iniş';return {...base,rpm:270,eng:0,rpmRate:20,vel:[0,0],vy:-1.2,collective:1.8};}
function groundPhase(st,t,e,ctx,base,touched,config,ev){
 if(e.landing==='groundStart'){if(!ctx.gs0){ctx.gs0=true;ctx.warn.fire=true;ev(4,'Emercensi','EGT limit aşımı','Çalıştırmada EGT hızla yükseliyor; egzozdan alev.');}const ok=ctx.actionDone&&t>=(ctx.actionT??t)+(ctx.fireDelay??0);ctx.phase=ok?'Starter basılı · gaz ve yakıt kapalı':'Çalıştırma devam ediyor';if(ok&&!ctx.endSet){ctx.endSet=true;ctx.end=t+16;ctx.endReason='time';ctx.smoke=.5;}if(ok&&t>(ctx.actionT??t)+(ctx.fireDelay??0)+4){ctx.warn.fire=false;ctx.smoke=Math.max(0,.5-(t-(ctx.actionT??t))*.03);}
  return {...base,vy:0,rpm:ok?Math.max(0,st.rpm-1):Math.min(140,st.rpm+2),eng:ok?900:2600,rpmRate:9};}
 if(e.landing==='ground'||e.landing==='groundInfo'){const ok=ctx.actionDone;if(e.landing==='ground'){ctx.phase=ok?'Emercensi motor susturma · tahliye':'Yangın · susturma bekleniyor';if(ok&&!ctx.endSet){ctx.endSet=true;ctx.end=t+18+(ctx.fireDelay??0);ctx.endReason='time';}if(ok&&t>ctx.end-18+(ctx.fireDelay??0))return {...base,vy:0,rpm:0,eng:0,rpmRate:9};return {...base,vy:0};}
  ctx.phase=ok?'Kapak kapatıldı':'EXTERNAL POWER ikazı';if(ok){ctx.lights.delete('ext');ctx.lights.delete('mc');if(!ctx.endSet){ctx.endSet=true;ctx.end=t+6;ctx.endReason='time';}}return {...base,vy:0};}
 // landed
 const since=t-touched;ctx.phase=e.shutdown||ctx.engineOut||st.autorot?'Yerde · emercensi motor susturma':'Yerde · iniş tamamlandı';
 if(!ctx.landedMsg){ctx.landedMsg=true;const c=st.contact;ev(t,'Temas',c?.water?'Suya temas':'Temas',`${(c?.descentMps??0).toFixed(1)} m/s alçalış · ${((c?.groundSpeedMps??0)/KT).toFixed(0)} kt yer sürati · ${(c?.surface?.label??'').toLocaleLowerCase('tr-TR')}.`);
  if(e.shutdown||st.autorot)ev(t+1.5,'Usul','Emercensi motor susturma','Gaz kolu kapalı, yakıt anahtarları kapalı, batarya kapalı.');ctx.end=t+(ctx.water?9:7);ctx.endReason='contact';}
 const down=e.shutdown||st.autorot||ctx.engineOut;return {...base,vy:0,rpm:down&&since>1.5?Math.max(0,st.rpm-12*.05*20):324,eng:down&&since>1.5?0:6600,rpmRate:down?12:25,collective:.4};}

// ---------- full flight-state object (same shape as the physics state) ----------
/* ---------- v0.39 elle uçuş (Düz uçuşta dönüşler): aynı kinematik model, hedefler pilotun kumandasından ----------
   kollektif → güç / varyo (1 = düz uçuş), saykılık ileri-geri → sürat değişimi, saykılık sağ-sol → yatış ve dönüş oranı,
   pedal → baş ile yer izi arasındaki kayma (top). Anlatım ve süre hazır akıştan; kumandalar 4. saniyeden sonra etkili. */
export const MANUAL_MANEUVERS=new Set(['turns']);
export const isManualProgram=c=>c?.mode==='manual'&&c.program==='maneuver'&&MANUAL_MANEUVERS.has(c.maneuverId);
let inputSource=null;export function setManualInputSource(fn){inputSource=fn;}
const MAN=new Map();
function manualSamples(config,time){const id=config.manualRunId||'default',src=inputSource?.(id),inputs=src?.inputs??[],key=JSON.stringify([config.maneuverId,config.flightArea,config.startX,config.startZ,config.startHeightFt,config.startIasKt,config.headingDeg,config.windKt,config.windFromDeg,config.temperatureC,config.pressureAltitudeFt]);
 let m=MAN.get(id);if(!m||m.key!==key){const ref=programRun({...config,mode:'watch'},[]);const st0=structuredClone(ref.init);m={key,ref,ctx:{...ref.ctx0,config,tasFactor:tasFactor(config),fx:{},events:[],timers:[]},samples:[snap(st0,{phase:'Görev',reason:'',lights:new Set(),warn:{},fx:{}})],states:[st0],seen:[]};MAN.set(id,m);}
 {let i=0;const a=m.seen,b=inputs;while(i<a.length&&i<b.length&&a[i]===b[i])i++;if(i<a.length||i<b.length){const tc=Math.min(a[i]?.[0]??1e9,b[i]?.[0]??1e9),keep=Math.max(1,Math.floor(tc/.05)+1);if(m.samples.length>keep){m.samples.length=keep;m.states.length=keep;}m.seen=b.slice();}}
 const dt=.05,end=Math.min(time,m.ref.duration);
 while(m.states.at(-1).t<end-1e-9&&m.samples.length<20000){const st=structuredClone(m.states.at(-1)),t=st.t+dt,inp=src?.inputAt?.(t)??null,kt=Math.hypot(st.vx,st.vz)/KT;
  let tg;if(!inp||t<4){const r=m.ref.samples[Math.min(m.ref.samples.length-1,Math.round(t/dt))];tg={speedKt:Math.hypot(r.vx,r.vz)/KT,track:Math.atan2(r.vx,-r.vz),vy:r.vy,accel:1.5};}
  else{const need=powerRequired(kt,0,99),vy=clamp((inp.collective-need)*7,-8,6),bank=clamp(inp.cyclicR/.32,-1,1)*35*Math.PI/180,v=Math.max(15,kt)*KT,w=G*Math.tan(bank)/v,spd=clamp(kt+inp.cyclicF/.32*8,0,120),slip=((inp.pedal??.5)-.5)*2*.35;
   tg={speedKt:spd,track:st.track+w*1.2,vy,accel:2.2,bank:Math.abs(bank*180/Math.PI)+5,turnGain:1,heading:kt>12?st.track+slip:undefined,yawRate:kt<=12?slip*1.2:undefined};}
  st.t=t;stepAircraft(st,tg,dt,m.ctx);m.states.push(st);m.samples.push(snap(st,{...m.ctx,phase:t<4?'Görev':'Elle uçuş',reason:inp?`kollektif ${inp.collective.toFixed(2)} · saykılık ${inp.cyclicF.toFixed(2)} / ${inp.cyclicR.toFixed(2)}`:'',lights:new Set(),warn:{}}));}
 return {samples:m.samples,dt,ref:m.ref};}
export function programState(time,config,choices,template){
 const run=isManualProgram(config)?(()=>{const r=manualSamples(config,time);return {...r.ref,samples:r.samples};})():programRun(config,choices),n=run.samples.length,i=clamp(Math.round(time/run.dt),0,n-1),s=run.samples[i],p=run.samples[Math.max(0,i-1)],area=config.flightArea??'terrain';
 const g=terrainHeight(s.x,s.z,area),wx=template.airMass?.windX??0,wz=template.airMass?.windZ??0,air=Math.hypot(s.vx-wx,s.vz-wz),gs=Math.hypot(s.vx,s.vz),powered=s.eng>5000&&!s.autorot;
 const contact=s.contact&&time>=s.contact.time-1e-9?s.contact:null;
 const ground=contact?{duration:Math.max(0,s.t-contact.time),elapsed:Math.max(0,s.t-contact.time),settled:gs<.3,bouncing:false,mechanics:{water:!!contact.water,surface:contact.surface,rollover:false,snag:false},secondaryContacts:[],position:[s.x,s.y,s.z],velocityMps:[s.vx,0,s.vz],groundSpeedMps:gs,rotorRpm:s.rpm,engineRpm:s.eng,rotorAngleDelta:0,pitch:s.pitch,roll:s.roll,phase:s.phase}:null;
 const controls={...template.controls,reason:s.reason,phase:s.phase,collective:s.col,targetCollective:s.col,collectiveRate:s.dcol,cyclicForward:s.cyc[0],cyclicRight:s.cyc[1],cyclicForwardRate:s.dcyc[0],cyclicRightRate:s.dcyc[1],pedal:s.ped,pedalRate:s.dped,pedalTarget:s.ped,programNotes:s.ctrl,throttle:s.throttle,flare:/fleyır/i.test(s.phase),cushion:/son kollektif/i.test(s.phase),guidance:null,managed:true,speedKt:air/KT,holdCyclic:false,levelCyclic:false};
 const share=powered?Math.min(1.2,powerRequired(air/KT,s.vy,s.y-g)):0;
 return {...template,time,position:[s.x,s.y,s.z],velocityMps:[s.vx,s.vy,s.vz],heightAglFt:Math.max(0,(s.y-g)/FT),iasKt:Math.max(0,air+(s.gust??0))/KT/tasFactor(config),tasKt:air/KT,airMass:{...(template.airMass??{}),upMps:s.wv??0},groundSpeedKt:gs/KT,descentFpm:-s.vy/FT*60,verticalAccelerationMps2:(s.vy-p.vy)/run.dt,rotorRpm:s.rpm,engineRpm:s.eng,rotorAngle:s.rotorAngle,heading:s.hdg,pitch:s.pitch,roll:s.roll,
  contact,ground,controls,powered,availablePowerFraction:powered?1:0,shaftPowerW:(template.referenceShaftPowerW??template.shaftPowerW??600000)*share,pilotSite:s.lz?{id:'pilot',label:'P',x:s.lz.x,z:s.lz.z,quality:s.lz.score??0,surfaceLabel:s.lz.label}:null,landingTargets:[],obstacleAhead:null,pilotForecast:null,quality:'program',
  program:{kind:config.program,id:config.program==='maneuver'?config.maneuverId:config.emergencyId,phase:s.phase,lights:s.lights,warn:s.warn,panelOff:s.panelOff,smoke:s.smoke,smokeKind:s.smokeKind,vibration:s.vib,etl:s.etl??0,yawRate:s.yawRate,autorotation:s.autorot}};}
export function programEnd(config,choices){const r=programRun(config,choices);return {time:r.duration,reason:r.endReason,contact:r.contact};}
