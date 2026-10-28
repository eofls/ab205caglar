import {atmosphere as sharedAtmosphere,DEFAULT_MASS_KG} from './flight-reference.js';
import {currentLanding} from './site-redirect.js';
import {choosePilotSite} from './flight-guidance.js';
import {obstacleHeight,obstacleTopNear} from './terrain-data.js';
import {obstacleAhead} from './landing-zone.js';
import {isProgramFlight,programState,programEnd} from './program-flight.js';
import {getScenario} from './catalog.js';
import {chooseLandingZone} from './landing-zone.js';
import {airframeClearance,CONTACT_POINTS,worldPoint} from './airframe-contact.js';
const WIRE_POINTS=CONTACT_POINTS.filter(q=>q.part==='mainRotor'||q.part==='skidLeft'||q.part==='skidRight'||q.part==='fin');
import {maneuverState} from './maneuver-state.js';
import {approachState} from './flight-guidance.js';
import {choosePilot,PREDICTION} from './predictive-pilot.js';
import {groundDuration,groundMotion} from './ground-contact.js';
import {stoppingAssessment} from './landing-analysis.js';
import {rotorCoupling} from './rotor-coupling.js';
import {yawDynamics} from './yaw-dynamics.js';
import {aerodynamicState} from './aerodynamic-state.js';
import {rotorAero,collectivePitch,trimPitchCached as trimPitch,autorotationPitch,pitchForThrust,ROTOR,DISK_AREA,SOLIDITY} from './rotor-bemt.js';
// Experimental reduced-order energy model. Assumptions and source scope: docs/PHYSICS.md.
import {landingTargets} from './flight-guidance.js';
import {controlTargets} from './flight-controls.js';
import {CURVES} from './curve-reference.js';
export const MODEL_VERSION='energy-1.7';
export const G=9.80665,FT=.3048,KT=1852/3600;
export const PARAMETERS=Object.freeze({massKg:DEFAULT_MASS_KG,inertiaKgM2:2711,engineCoastSeconds:3,step:.02,failureTime:4,dragAreaM2:1.5,profilePowerCollectiveExponent:1.25});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
import {terrainHeight,surfaceProfile,wireDistance,POWER_LINES} from './terrain-data.js';
export {terrainHeight} from './landing-sites.js';
export const atmosphere=sharedAtmosphere;
function row(rpm,kias){const points=CURVES[rpm],v=clamp(kias,points[0].kias,points.at(-1).kias),i=Math.max(1,points.findIndex(p=>p.kias>=v)),a=points[i-1],b=points[i];return a.descentFpm+(b.descentFpm-a.descentFpm)*(v-a.kias)/(b.kias-a.kias);}
// Only the common 50–80 KIAS / 284–339 RPM rectangle is chart interpolation.
// Outside it, a smooth engineering extension is used and explicitly flagged.
export function sinkReference(kias,rpm){const r=clamp(rpm,284,339),a=r<=314?284:314,b=r<=314?314:339,v=clamp(kias,50,80);const base=(row(a,v)+(row(b,v)-row(a,v))*(r-a)/(b-a))*FT/60;return {sinkMps:base+.0015*Math.max(0,50-kias)**2+.003*Math.max(0,kias-80)**2,chartCovered:kias>=50&&kias<=80&&rpm>=284&&rpm<=339};}
// Ground-effect loss reduction: bounded experimental approximation, not AB-205 data.
export function groundEffect(aglM,tasMps){return 1-.18*Math.exp(-(Math.max(0,aglM)+3.5)/7.35)*Math.exp(-((tasMps/12)**2));}
function setup(s,c){const density=atmosphere(c).density,rawHeading=c.headingDeg*Math.PI/180,runwayHeading=64.51*Math.PI/180,snap=c.flightArea==='airfield'?[runwayHeading,runwayHeading+Math.PI].find(a=>Math.abs(Math.atan2(Math.sin(rawHeading-a),Math.cos(rawHeading-a)))<=1.2*Math.PI/180):undefined,heading=snap??rawHeading,wind=c.windFromDeg*Math.PI/180;const p={flightArea:c.flightArea??"terrain",rotorInertia:PARAMETERS.inertiaKgM2,mass:c.grossWeightLb==null?PARAMETERS.massKg:c.grossWeightLb*.45359237,density,heading,windX:-c.windKt*KT*Math.sin(wind),windZ:c.windKt*KT*Math.cos(wind),tasFactor:Math.sqrt(1.225/density),rpm:c.initialRotorRpm??324,engine:c.initialEngineRpm??6600,height:s.height*FT,ias:s.ias,startX:c.startX??0,startZ:c.startZ??0,customSites:c.customSites??[],hiddenSites:c.hiddenSites??[],groundHold:s.ias<=5,pedalMode:c.pedalMode??'auto',autonomous:c.mode==='watch',manual:c.mode==='manual',predictive:c.predictivePilot!==false,powerFraction:c.powerLossMode==='partial'?.35:0,turbulence:c.turbulence??'none'};if(p.flightArea==='airfield'&&p.ias>5){const V=p.ias*KT*p.tasFactor,cross=p.windX*Math.cos(heading)+p.windZ*Math.sin(heading);p.trackHeading=heading;p.heading=heading-Math.asin(Math.max(-.5,Math.min(.5,cross/V)));} // airfield: nose crabs into the wind so the ground track follows the typed course/runway axis
 p.model=c.physicsModel==='blade'?'blade':'energy';
 // Crew profile → hazır akış pilot model (v0.31): recognition/reaction time after the failure and flare/cushion timing.
 // Baseline (yetkin/deneyimli) keeps the calibrated laws; 'gelişmekte' reacts later and flares/pulls later.
 {const pd=c.pilot==='developing'?1.4:0,cd=c.copilot==='developing'?.4:0;const X=globalThis.EXP??{},base=X.crewCushion??.82;p.crew={delay:pd+cd,flareScale:c.pilot==='developing'?.9:1,cushionScale:c.pilot==='developing'?base*1.25:c.pilot==='experienced'?base*(X.expCushion??.95):base};}
 const tas=p.ias*KT*p.tasFactor,sink=sinkReference(p.ias,p.rpm).sinkMps*Math.sqrt(p.mass/PARAMETERS.massKg)*p.tasFactor; p.trimPower=Math.max(0,p.mass*G*sink-.5*density*PARAMETERS.dragAreaM2*tas**3)*(.4+.6*groundEffect(p.height,tas))/.694*(.4+.294*Math.pow(1/.7,PARAMETERS.profilePowerCollectiveExponent)+.1*(.5*density*PARAMETERS.dragAreaM2*tas*tas/(p.mass*G))**2);
 if(p.model==='blade'){const tr=trimPitch({rho:density,omega:p.rpm*Math.PI/30,mass:p.mass,tas,dragAreaM2:PARAMETERS.dragAreaM2,agl:p.height});p.thetaTrim=Math.max(ROTOR.thetaMinRad+.015,tr.theta75);p.trimPower=tr.power;const au=autorotationPitch({rho:density,omega:p.rpm*Math.PI/30,mass:p.mass,dragAreaM2:PARAMETERS.dragAreaM2});
  // pilot laws were written around a .7 glide collective; this bias moves them to the blade model's glide pitch
  p.collectiveBias=0;p.autoPitch=au.theta75;}else p.collectiveBias=0;
 return p;}
const keys=['x','y','z','vx','vz','w','omega','engine','angle','heading','pitch','roll','collective','cyclicX','cyclicZ','yawRate','pedal','inflowCapture'];
function initial(p){const v=p.ias*KT*p.tasFactor,vx=Math.sin(p.heading)*v+p.windX,vz=-Math.cos(p.heading)*v+p.windZ,ax=vx-p.windX,az=vz-p.windZ,tas=Math.hypot(ax,az),drag=.5*p.density*PARAMETERS.dragAreaM2*tas;
 // v0.33: a start placed on the map is the failure point; the 4 s of powered flight lead up to it at constant altitude.
 const moved=!!(p.startX||p.startZ),x0=moved?p.startX-vx*4:0,z0=moved?p.startZ-vz*4:0,y0=moved?poweredTarget(poweredPath(p,x0,z0,vx,vz),x0,z0):p.height;
 return {t:0,x:x0,y:y0,z:z0,vx,vz,w:0,omega:p.rpm*Math.PI/30,engine:p.engine,angle:0,heading:p.heading,yawRate:0,pedal:0,inflowCapture:0,pitch:0,roll:0,collective:1,cyclicX:Math.atan2(drag*ax,p.mass*G),cyclicZ:Math.atan2(drag*az,p.mass*G),cushionActive:false,flareActive:false,contact:p.height===0?{time:0,descentMps:0,groundSpeedMps:Math.hypot(vx,vz),rotorRpm:p.rpm,engineRpm:p.engine,collective:1}:null};}
// Local air mass (energy-1.6): logarithmic surface-layer wind below 10 m (roughness by area), slope-driven
// orographic up/down flow (windward lift, lee sink) and a deterministic, seeded gust field for the selected
// turbulence level. Engineering approximations for training comparison, not certified atmospheric data.
const ROUGHNESS={water:.0002,airfield:.03,terrain:.1,mountain:.3,forest:.8};
const GUSTS=[[.043,1.3,.9],[.091,4.1,.7],[.157,2.2,.55],[.263,5.6,.4],[.41,.7,.3],[.67,3.3,.2]];
export function localAir(s,p,agl){
 // Powered (pre-failure) flight is the configured trim state: the air mass is the configured wind.
 if((s.t??0)<4||(!p.windX&&!p.windZ&&(!p.turbulence||p.turbulence==='none')))return {x:p.windX??0,z:p.windZ??0,up:0,gust:0};
 const z0=ROUGHNESS[p.flightArea]??.1,h=Math.max(0,agl),f=h>=10?1:Math.max(0,Math.log((h+z0)/z0)/Math.log((10+z0)/z0));
 let x=p.windX*f,z=p.windZ*f,up=0;
 if((p.windX||p.windZ)&&p.flightArea==='mountain'){const e=25,gx=(terrainHeight(s.x+e,s.z,p.flightArea)-terrainHeight(s.x-e,s.z,p.flightArea))/(2*e),gz=(terrainHeight(s.x,s.z+e,p.flightArea)-terrainHeight(s.x,s.z-e,p.flightArea))/(2*e);up=clamp((p.windX*gx+p.windZ*gz)*Math.exp(-h/140)*1.2,-5,5);}
 const sigma=p.turbulence==='moderate'?[1.8,.9]:p.turbulence==='light'?[.7,.35]:[0,0];let gust=0;
 if(sigma[0]){let gu=0,gv=0,gw=0;const t=s.t??0,norm=Math.sqrt(GUSTS.reduce((a,g)=>a+g[2]*g[2],0)/2);for(const [fr,ph,a] of GUSTS){gu+=a*Math.sin(2*Math.PI*fr*t+ph);gv+=a*Math.sin(2*Math.PI*fr*1.37*t+ph*1.9);gw+=a*Math.sin(2*Math.PI*fr*.83*t+ph*2.7);}
  const near=Math.min(1,(h+1)/30);x+=sigma[0]*gu/norm*Math.max(.35,f);z+=sigma[0]*gv/norm*Math.max(.35,f);gust=sigma[1]*gw/norm*near;up+=gust;}
 return {x,z,up,gust};
}
// v0.33: over a forest the pilot's height reference is the canopy, not the forest floor (flare above the trees,
// then settle into the clearing / tree tops rather than flying into them).
// v0.33: before the failure the crew holds the selected height over the ground / obstacles (terrain following),
// so a start placed anywhere on the map reaches the failure point at the chosen skid height.
export function startReference(x,z,area){let top=terrainHeight(x,z,area);for(const [dx,dz] of [[0,0],[10,0],[-10,0],[0,10],[0,-10]])top=Math.max(top,obstacleHeight(x+dx,z+dz,area));return top;}
// v0.33.1: the 4 s of powered flight to a map-placed failure point is a straight, constant-speed line, so its height
// profile is built once: selected height over the ground, but never lower than 6 m skid clearance over trees,
// boulders and roofs within rotor reach (forest: selected height over the canopy). Obstacles after the failure point
// are not anticipated - that part is the autorotation's problem.
const POWERED_PATHS=new WeakMap();
function poweredPath(p,x0,z0,vx,vz){let pp=POWERED_PATHS.get(p);if(pp)return pp;const v=Math.hypot(vx,vz)||1,ux=vx/v,uz=vz/v,L=v*4+12,step=3,n=Math.ceil(L/step)+1,req=new Float32Array(n),forest=p.flightArea==='forest';
 for(let i=0;i<n;i++){const x=x0+ux*i*step,z=z0+uz*i*step,g=terrainHeight(x,z,p.flightArea),top=globalThis.EXP?.oldFollow?startReference(x,z,p.flightArea):obstacleTopNear(x,z,p.flightArea,9);req[i]=forest||globalThis.EXP?.oldFollow?Math.max(g,top)+p.height:Math.max(g+p.height,top>g+1.5?top+6:-Infinity);}
 const look=Math.ceil(v*2.5/step),back=4,tgt=new Float32Array(n);for(let i=0;i<n;i++){let m=-Infinity;for(let k=Math.max(0,i-back);k<=Math.min(n-1,i+look);k++)m=Math.max(m,req[k]);tgt[i]=m;}
 pp={x0,z0,ux,uz,step,n,tgt};POWERED_PATHS.set(p,pp);return pp;}
function poweredTarget(pp,x,z){const d=(x-pp.x0)*pp.ux+(z-pp.z0)*pp.uz,f=Math.max(0,Math.min(pp.n-1.001,d/pp.step)),i=Math.floor(f),u=f-i;return pp.tgt[i]*(1-u)+pp.tgt[i+1]*u;}
function poweredClimb(s,p){const pp=POWERED_PATHS.get(p);if(!pp){const look=2.5,ahead=startReference(s.x+(s.vx??0)*look,s.z+(s.vz??0)*look,p.flightArea),now=startReference(s.x,s.z,p.flightArea),target=(ahead>now+3?ahead:now)+p.height,wCmd=Math.max(-6,Math.min(6,(s.y-target)*.9));return (wCmd-s.w)*2.5;}
 const target=poweredTarget(pp,s.x,s.z),wCmd=Math.max(-8,Math.min(10,(s.y-target)*.9));return (wCmd-s.w)*2.5;} /* powered: up to about 1600 fpm climb, 2000 fpm descent */
function canopyAgl(s,agl,area){let top=-Infinity;for(const [dx,dz] of [[0,0],[9,0],[-9,0],[0,9],[0,-9]])top=Math.max(top,obstacleHeight(s.x+dx,s.z+dz,area)-terrainHeight(s.x+dx,s.z+dz,area));return Math.max(0,agl-Math.max(0,top));}
function derivative(s,p,choices){
 const agl=Math.max(0,s.y-terrainHeight(s.x,s.z,p.flightArea)),air=localAir(s,p,agl),airX=s.vx-air.x,airZ=s.vz-air.z,tas=Math.hypot(airX,airZ),ias=tas/KT/p.tasFactor,wa=s.w+air.up;
 const rpm=s.omega*30/Math.PI,ref=sinkReference(ias,rpm),sink=ref.sinkMps*Math.sqrt(p.mass/PARAMETERS.massKg)*p.tasFactor,ge=groundEffect(agl,tas);
 const powered=s.t<4,aglCtl=p.flightArea==='forest'&&!globalThis.EXP?.noCanopy?canopyAgl(s,agl,p.flightArea):agl,controls=p.manual&&!powered?manualControls(s,p):controlTargets({...s,y:aglCtl,v:tas},p,choices,sink);
 const speed=controls.speedKt*KT*p.tasFactor,gx=controls.guidance?.groundX??(Math.sin(p.heading)*speed+p.windX),gz=controls.guidance?.groundZ??(-Math.cos(p.heading)*speed+p.windZ),holdTrack=p.trackHeading!==undefined&&!controls.guidance,crossGround=holdTrack?gx*Math.cos(p.trackHeading)+gz*Math.sin(p.trackHeading):0,desiredX=holdTrack?gx-crossGround*Math.cos(p.trackHeading):gx,desiredZ=holdTrack?gz-crossGround*Math.sin(p.trackHeading):gz; // airfield: cyclic into the wind holds the runway track at low airspeed
 const drag=.5*p.density*PARAMETERS.dragAreaM2*tas,dx=drag*airX,dz=drag*airZ;
 const limit=controls.flare?(p.bladeLaws?Math.min(controls.flareAccel??5,globalThis.EXP?.bladeAMax??2.7):(controls.flareAccel??5)):controls.guidance?.turning?(globalThis.EXP?.turnA??4):2;
 const rawAX=(desiredX-s.vx)*.6,rawAZ=(desiredZ-s.vz)*.6,speeding=!powered&&!controls.flare&&rawAX*s.vx+rawAZ*s.vz>0&&rpm<p.rpm*(globalThis.EXP?.accRpm??.96),accelScale=Math.min(1,(speeding?Math.min(limit,globalThis.EXP?.accLow??.7):limit)/Math.max(1e-9,Math.hypot(rawAX,rawAZ))) /* v0.33: gentle acceleration while rotor RPM is low (nose-down unloads the disk) */,turnPri=!!controls.guidance?.turning&&!globalThis.EXP?.noTurnPri&&Math.hypot(s.vx,s.vz)>3,tux=turnPri?s.vx/Math.hypot(s.vx,s.vz):0,tuz=turnPri?s.vz/Math.hypot(s.vx,s.vz):0,tLat=turnPri?Math.max(-limit,Math.min(limit,-rawAX*tuz+rawAZ*tux)):0,tRem=Math.sqrt(Math.max(0,limit*limit-tLat*tLat)),tAlong=turnPri?Math.max(-tRem,Math.min(speeding?Math.min(tRem,globalThis.EXP?.accLow??.7):tRem,rawAX*tux+rawAZ*tuz)):0 /* v0.33.1: in a turn the bank (lateral) comes first, speed changes share what is left */,accelX=turnPri?tux*tAlong-tuz*tLat:rawAX*accelScale,accelZ=turnPri?tuz*tAlong+tux*tLat:rawAZ*accelScale; // vector limit: per-axis clamping rotated the commanded deceleration and bent the track
 const shaftFraction=powered?1:p.powerFraction*clamp((p.rpm+2-rpm)/4,0,1);
 const aero=aerodynamicState({mass:p.mass,density:p.density,rpm,referenceRpm:p.rpm,collective:s.collective,tas,descent:wa,powerFraction:shaftFraction,agl});
 const axialInflow=wa-airX*Math.tan(s.cyclicX)-airZ*Math.tan(s.cyclicZ);
 const coupling=rotorCoupling(s.collective,rpm/p.rpm,wa,sink,axialInflow,s.inflowCapture);
 const diskTilt=Math.hypot(Math.tan(s.cyclicX),Math.tan(s.cyclicZ)),verticalFactor=1/Math.sqrt(1+diskTilt*diskTilt);
 // energy-2.0: blade-element rotor. Thrust along the disk normal; flow through the disk from the air-relative velocity.
 let rotor=null;if(p.model==='blade'&&!powered){const tX=Math.tan(s.cyclicX),tZ=Math.tan(s.cyclicZ),nx=tX*verticalFactor,ny=verticalFactor,nz=tZ*verticalFactor,vay=-wa,vPerp=airX*nx+vay*ny+airZ*nz,ix=airX-vPerp*nx,iy=vay-vPerp*ny,iz=airZ-vPerp*nz,vIn=Math.hypot(ix,iy,iz);
  // Thrust-matched blade pitch: the crew's lift demand (calibrated control laws) is converted to blade pitch through the
  // blade-element solution; thrust limits, induced/profile power and therefore rotor RPM come from the rotor model.
  // Manual flight: the lever is the blade pitch itself.
  const theta=p.manual?collectivePitch(s.collective,p.thetaTrim):pitchForThrust({rho:p.density,omega:s.omega,thrust:p.mass*G*(rpm/p.rpm)**2*Math.max(0,s.collective+coupling.inflowLift)*aero.liftFactor,vPerpDown:vPerp,vInPlane:vIn,agl});
  rotor=rotorAero({rho:p.density,omega:s.omega,theta75:theta,vPerpDown:vPerp,vInPlane:vIn,agl});rotor.vPerpDown=vPerp;rotor.theta75=theta;aero.stallExposure=Math.max(aero.stallExposure,rotor.stall);}
 let lift=powered?p.mass*G:rotor?rotor.thrust*verticalFactor:p.mass*G*(rpm/p.rpm)**2*(s.collective+coupling.inflowLift)*aero.liftFactor*verticalFactor;
 // energy-1.7: blade-stall thrust boundary (Ct/σ ≈ 0.14 − 0.12 μ, UH-1H rotor geometry) caps the reduced-order lift.
 // Inactive in normal conditions; it is what limits the cushion at high weight, density altitude or low rotor RPM.
 let thrustLimit=null;if(!powered&&!rotor){const OR=Math.max(1,s.omega*ROTOR.radiusM),mu=tas/OR,cap=p.density*DISK_AREA*OR*OR*SOLIDITY*Math.max(.06,ROTOR.ctsMaxHover-ROTOR.ctsMaxSlope*mu),T=lift/Math.max(.3,verticalFactor);thrustLimit={capN:cap,demandRatio:T/cap};
  const kn=globalThis.EXP?.knee??.8;if(T>kn*cap){const Tc=kn*cap+(1-kn)*cap*Math.tanh((T-kn*cap)/((1-kn)*cap));lift=Tc*verticalFactor;aero.stallExposure=Math.max(aero.stallExposure,clamp((T/cap-.8)/.35,0,1));}}
 const predictedTail=p.trimPower/(p.rpm*Math.PI/30)*(rpm/p.rpm)**2*(1-2*s.pedal)/6;
 const tiltLimit0=(controls.flare||controls.guidance?.turning)?(p.bladeLaws?clamp(.16+tas*(globalThis.EXP?.tiltPerMps??.008),.2,globalThis.EXP?.bladeTiltMax??.31):.42):.22,tiltLimit=controls.manual||controls.holdCyclic?tiltLimit0:Math.min(tiltLimit0,globalThis.EXP?.noTail?9:clamp((globalThis.EXP?.tail0??.2)+(globalThis.EXP?.tailK??.06)*agl,.2,.42)) /* v0.33: nose-up flare attitude limited near the ground (tail boom clearance ≈16° with skids on the ground) */,tiltRef=globalThis.EXP?.oldTilt?Math.max(1,lift):Math.max(lift,(globalThis.EXP?.tiltFloor??.85)*p.mass*G),rawTX=controls.levelCyclic?0:Math.atan2(p.mass*accelX+dx-predictedTail*Math.cos(s.heading),tiltRef),rawTZ=controls.levelCyclic?0:Math.atan2(p.mass*accelZ+dz-predictedTail*Math.sin(s.heading),tiltRef),tiltScale=Math.min(1,tiltLimit/Math.max(1e-9,Math.hypot(rawTX,rawTZ))),targetX=controls.manual?Math.atan(Math.tan(controls.cyclicF)*Math.sin(s.heading)+Math.tan(controls.cyclicR)*Math.cos(s.heading)):rawTX*tiltScale,targetZ=controls.manual?Math.atan(-Math.tan(controls.cyclicF)*Math.cos(s.heading)+Math.tan(controls.cyclicR)*Math.sin(s.heading)):rawTZ*tiltScale;
 const tx=powered?dx:lift*Math.tan(s.cyclicX),tz=powered?dz:lift*Math.tan(s.cyclicZ);
 const tilt=Math.hypot(Math.tan(s.cyclicX),Math.tan(s.cyclicZ));
 // Disk tilt is an attitude command: a transient lift deficit must not be answered with an ever larger forward tilt.
 // Additional collective/tilt work consumes rotor energy; no scripted RPM increase/decrease.
 const baseLoss=Math.max(0,p.mass*G*sink-drag*tas*tas)*Math.pow(Math.max(0,rpm)/p.rpm,3);
 // Profile-power growth with collective is an engineering assumption (not AB-205 data): exponent 1.25, normalized to 1 at the calibrated autorotation collective .7 (chart sink match); was 2 in energy-1.3. trimPower below uses the same function at collective 1.
 const profileFactor=(.4+.294*Math.pow(Math.max(0,s.collective)/.7,PARAMETERS.profilePowerCollectiveExponent)+.1*tilt*tilt)/.694*aero.lossFactor;
 let loss=baseLoss*(.4+.6*ge)*profileFactor;
 // Residual power is a selectable illustrative fraction of initial trim requirement, not % N2.
 const trimSink=sinkReference(p.ias,p.rpm).sinkMps*Math.sqrt(p.mass/PARAMETERS.massKg)*p.tasFactor;
 const shaftPower=powered?loss:p.trimPower*shaftFraction;
 const yaw=yawDynamics(s,p,{shaftPower,rpm,tas,airX,airZ,managed:controls.yawManaged,powered});
 const tailRight=powered?0:-yaw.tailMoment/6,tailX=tailRight*Math.cos(s.heading),tailZ=tailRight*Math.sin(s.heading);
 const tailWork=tailX*airX+tailZ*airZ;
 const airWork=lift*wa-tx*airX-tz*airZ-tailWork,wakeLoss=powered||rotor?0:Math.max(0,airWork)*(1-coupling.capture);
 if(rotor)loss=rotor.inducedPower+rotor.profilePower;
 loss+=wakeLoss+yaw.tailLossW;
 const rotorPower=powered?0:rotor?shaftPower-rotor.power-tailWork-yaw.tailLossW:shaftPower+airWork-loss;
 // Lever target. Pilot laws express collective as a lift fraction (≈ lift/(W·Ω²ratio²)); in the blade model a glide-range
 // demand maps through the glide-pitch bias and a pull (≥ .9) is inverted through the rotor model into a lever position.
 let leverTarget=controls.collective;
 if(false&&rotor&&!controls.holdAll&&!controls.manual){const B=p.collectiveBias??0,glide=controls.collective+B,cOld=controls.collective;
  if(cOld>.9){const ratio=rpm/p.rpm,need=p.mass*G*ratio*ratio*cOld/Math.max(.5,verticalFactor),th=pitchForThrust({rho:p.density,omega:s.omega,thrust:need,vPerpDown:rotor.vPerpDown,vInPlane:Math.hypot(airX,airZ),agl}),lever=.3+.7*(th-ROTOR.thetaMinRad)/(p.thetaTrim-ROTOR.thetaMinRad),k=clamp((cOld-.9)/.2,0,1);leverTarget=glide*(1-k)+lever*k;}
  else leverTarget=glide;
  leverTarget=clamp(leverTarget,.25,2.6);}
 const longitudinal=tx*Math.sin(s.heading)-tz*Math.cos(s.heading),lateral=tx*Math.cos(s.heading)+tz*Math.sin(s.heading);
 return {inflowCapture:powered?0:(coupling.desiredCapture-s.inflowCapture)/(coupling.desiredCapture>s.inflowCapture?.2:.8),x:s.vx,y:-s.w,z:s.vz,vx:powered?0:(tx+tailX-dx)/p.mass,vz:powered?0:(tz+tailZ-dz)/p.mass,w:powered&&(p.startX||p.startZ)&&!globalThis.EXP?.noFollow?poweredClimb(s,p):G-lift/p.mass,omega:powered?0:rotorPower/(PARAMETERS.inertiaKgM2*Math.max(1,s.omega)),engine:powered?0:p.powerFraction>0?(Math.min(p.engine,rpm/p.rpm*p.engine)-s.engine)/.3:-s.engine/PARAMETERS.engineCoastSeconds,angle:s.omega,collective:clamp((leverTarget-s.collective)/.25,-1.2,1.2),cyclicX:(powered||controls.holdCyclic?0:clamp((targetX-s.cyclicX)/.3,-.3,.3))-s.cyclicZ*s.yawRate,cyclicZ:(powered||controls.holdCyclic?0:clamp((targetZ-s.cyclicZ)/.3,-.3,.3))+s.cyclicX*s.yawRate,heading:powered?0:s.yawRate,yawRate:yaw.acceleration,pedal:controls.holdAll?0:controls.manual?clamp((controls.pedal-s.pedal)/.18,-3,3):yaw.pedalRate,pitch:(Math.atan2(longitudinal,Math.max(1,lift))-s.pitch)/.3,roll:(Math.atan2(lateral+.25*tailRight,Math.max(1,lift))-s.roll)/.3,aero,yaw:{...yaw,sideForceN:tailRight},coupling,wakeLoss,verticalFactor,shaftPower,controls,chartCovered:ref.chartCovered,rotorPower,loss,dragLoss:drag*tas*tas,lift,groundEffect:rotor?rotor.groundEffect:ge,air,rotor,thrustLimit};
}
function advance(s,p,choices,dt){if(s.contact)return s;
 if(p.autonomous&&s.t>=4&&!s.pilotSite&&!globalThis.EXP?.noSite)s={...s,pilotSite:globalThis.EXP?.oldSite?choosePilotSite(s,p,(x,z)=>terrainHeight(x,z,p.flightArea),(x,z)=>surfaceProfile(x,z,p.flightArea),(x,z)=>obstacleHeight(x,z,p.flightArea)):chooseLandingZone(s,p)}; // v0.33: landing-zone assessment (slope, obstacles, surface, wires, approach)
 // Resolve actuator/state-gate transitions at <=10 ms, including coarse prediction steps.
 if(dt>.010000001){let next=s;for(let left=dt;left>1e-10&&!next.contact;left-=.01)next=advance(next,p,choices,Math.min(.01,left));return next;}

 if(p.autonomous&&p.predictive&&s.t>=4-1e-9&&s.t>=(s.nextPilotAt??4)-1e-9){
  const reference={...s,pilotAction:'reference'},base=derivative(reference,p,choices).controls;
  const forecast=choosePilot(reference,p,base,(state,h)=>advance(state,{...p,predictive:false},choices,h),(x,z)=>terrainHeight(x,z,p.flightArea));
  s={...s,pilotAction:forecast.action,pilotForecast:forecast,nextPilotAt:4+(Math.floor((s.t-4+1e-8)/PREDICTION.interval)+1)*PREDICTION.interval};
 }
 const a=derivative(s,p,choices),mid={...s,t:Math.round((s.t+dt/2)*1e10)/1e10,cushionActive:s.cushionActive||a.controls.cushion,flareActive:s.flareActive||a.controls.flare};for(const k of keys)mid[k]=s[k]+a[k]*dt/2;const b=derivative(mid,p,choices),n={...s,t:Math.round((s.t+dt)*1e10)/1e10,cushionActive:mid.cushionActive||b.controls.cushion,flareActive:mid.flareActive||b.controls.flare};for(const k of keys)n[k]=s[k]+b[k]*dt;n.omega=Math.max(0,n.omega);n.engine=Math.max(0,n.engine);
 // Wire strike: rotor tips, cabin roof and skids against the conductors (checked only near a line and below 60 m AGL).
 if(!n.contact&&(POWER_LINES[p.flightArea]?.length)){const agl=n.y-terrainHeight(n.x,n.z,p.flightArea);if(agl<60&&wireDistance(n.x,n.y+3,n.z,p.flightArea)<14){for(const q of WIRE_POINTS){const w=worldPoint(q.point,n);if(wireDistance(w[0],w[1],w[2],p.flightArea)<.45){n.contact={time:n.t,part:q.part,point:w,obstacle:'wire',wire:true,surface:surfaceProfile(n.x,n.z,p.flightArea),supportHeightM:Math.max(0,agl),normalSpeedMps:Math.hypot(n.vx,n.w,n.vz),descentMps:n.w,groundSpeedMps:Math.hypot(n.vx,n.vz),rotorRpm:n.omega*30/Math.PI,engineRpm:n.engine,collective:n.collective};return n;}}}}
 const floor=terrainHeight(n.x,n.z,p.flightArea);if(n.y-floor<(p.flightArea==='water'?14:34)){const hit=airframeClearance(n,p.flightArea);if(hit.gap<=0){const prev=airframeClearance(s,p.flightArea),f=clamp(prev.gap/Math.max(1e-12,prev.gap-hit.gap),0,1);for(const k of keys)n[k]=s[k]+(n[k]-s[k])*f;const at=airframeClearance(n,p.flightArea);n.y-=at.gap;n.contact={time:s.t+dt*f,part:hit.part,point:at.point,obstacle:hit.obstacle,surface:surfaceProfile(n.x,n.z,p.flightArea),supportHeightM:Math.max(0,n.y-terrainHeight(n.x,n.z,p.flightArea)),normalSpeedMps:Math.max(0,(prev.gap-hit.gap)/dt),descentMps:n.w,groundSpeedMps:Math.hypot(n.vx,n.vz),rotorRpm:n.omega*30/Math.PI,engineRpm:n.engine,collective:n.collective};n.t=n.contact.time;}}
 return n;}
const cache=new Map();
export function flightState(time,scenario,config,choices=[],step=PARAMETERS.step){
 if(isProgramFlight(config)){if(!Number.isFinite(time)||time<0||time>900)throw Error('Invalid integration time');const tc={...config,program:'emergency',emergencyId:'engine-total',mode:'watch',manualRunId:''},ts={...getScenario('caution'),id:'custom',decisions:[],height:config.startHeightFt??0,ias:config.startIasKt??0};return programState(time,config,choices,flightState(0,ts,tc,[]));}
 if(!Number.isFinite(time)||time<0||time>600||!Number.isFinite(step)||step<=0||step>.1)throw Error('Invalid integration time');
 if(config.mode==='manual')return manualRun(config.manualRunId).state(time,scenario,config);
 const p=setup(scenario,config),unsupported=p.rpm<250||p.rpm>360||p.mass<1000||p.mass>5000,active=choices.filter(a=>a.at<=time),key=JSON.stringify([p,active,step]);let run=cache.get(key);
 if(!run){run=[initial(p)];cache.set(key,run);if(cache.size>24)cache.delete(cache.keys().next().value);}
 const count=Math.floor((time+1e-10)/step);if(!unsupported)while(run.length<=count+1&&!run.at(-1).contact)run.push(advance(run.at(-1),p,active,step));
 const terminal=run.at(-1),base=run[Math.min(count,run.length-1)];
 const s=unsupported?run[0]:terminal.contact&&time>=terminal.contact.time-1e-9?terminal:time-base.t>1e-9?advance(base,p,active,time-base.t):base;
 return describe(s,p,active,config,time,unsupported);
}
function describe(s,p,active,config,time,unsupported){
 const d=derivative(s,p,active),airX=s.vx-d.air.x,airZ=s.vz-d.air.z,tas=Math.hypot(airX,airZ);
 const reserveCap=clamp(1+3*(s.omega*30/Math.PI/p.rpm-.85),1,1.5),maxUp=G*((s.omega*30/Math.PI/p.rpm)**2*Math.max(reserveCap,d.controls.collective)*d.aero.liftFactor*d.verticalFactor-1);
 const stopping=stoppingAssessment({heightM:Math.max(0,s.y-terrainHeight(s.x,s.z,p.flightArea)),descentMps:s.w,upAccelMps2:maxUp});
 const ground=s.contact?groundMotion({availablePowerFraction:p.powerFraction,contact:s.contact,position:[s.x,s.y,s.z],velocityMps:[s.vx,-s.w,s.vz],heading:s.heading,pitch:s.pitch,roll:s.roll},time-s.contact.time):null;
 if(ground)ground.position[1]=terrainHeight(ground.position[0],ground.position[2],p.flightArea)+(ground.mechanics.water?ground.position[1]-s.y:Math.max(0,ground.position[1]-s.y))+(s.contact.supportHeightM??0)*Math.exp(-ground.elapsed*3);
 const maneuver=maneuverState({...s,y:Math.max(0,s.y-terrainHeight(s.x,s.z,p.flightArea))},p,{tas,ax:d.vx,az:d.vz,airX,airZ});
 return {physicsModel:p.model,thrustMargin:d.rotor?Math.max(0,1-d.rotor.stall):d.thrustLimit?1-Math.min(1,d.thrustLimit.demandRatio):null,rotorModel:d.rotor?{ctSigma:d.rotor.ctSigma,mu:d.rotor.mu,lambda:d.rotor.lambda,inducedMps:d.rotor.inducedVelocity,stall:d.rotor.stall,vrs:d.rotor.vrs,pitchDeg:d.rotor.theta75*180/Math.PI,thrustN:d.rotor.thrust,flowThroughDiskMps:d.rotor.vPerpDown,groundEffect:d.rotor.groundEffect,profileW:d.rotor.profilePower,inducedW:d.rotor.inducedPower}:null,airMass:{upMps:d.air.up,gustMps:d.air.gust,windX:d.air.x,windZ:d.air.z},flightArea:p.flightArea,pilotSite:s.pilotSite??null,obstacleAhead:!s.contact&&s.t>=4&&!globalThis.EXP?.noObstacle?obstacleAhead(s,p.flightArea,{windX:p.windX,windZ:p.windZ,target:p.autonomous?s.pilotSite:landingTargets(p).find(t=>t.id===currentLanding(active)?.option)??null}):null,maneuver,approach:approachState({...s,y:Math.max(0,s.y-terrainHeight(s.x,s.z,p.flightArea))},p,currentLanding(active)?.option??'distant'),pilotForecast:s.pilotForecast??null,ground,stopping,modelVersion:MODEL_VERSION,quality:unsupported?'unsupported':'experimental',controls:{...d.controls,collective:s.collective,targetCollective:d.controls.collective,collectiveRate:s.contact?0:d.collective,cyclicRad:Math.hypot(s.cyclicX,s.cyclicZ),cyclicForward:s.cyclicX*Math.sin(s.heading)-s.cyclicZ*Math.cos(s.heading),cyclicRight:s.cyclicX*Math.cos(s.heading)+s.cyclicZ*Math.sin(s.heading),cyclicForwardRate:s.contact?0:d.cyclicX*Math.sin(s.heading)-d.cyclicZ*Math.cos(s.heading)+s.yawRate*(s.cyclicX*Math.cos(s.heading)+s.cyclicZ*Math.sin(s.heading)),cyclicRightRate:s.contact?0:d.cyclicX*Math.cos(s.heading)+d.cyclicZ*Math.sin(s.heading)-s.yawRate*(s.cyclicX*Math.sin(s.heading)-s.cyclicZ*Math.cos(s.heading)),pedal:s.pedal,pedalRate:s.contact?0:d.pedal,pedalTarget:d.controls.holdAll?s.pedal:d.yaw.target},groundHold:p.groundHold,shaftPowerW:d.shaftPower,referenceShaftPowerW:p.trimPower,availableShaftPowerW:time<4?p.trimPower:p.trimPower*p.powerFraction,availablePowerFraction:time<4?1:p.powerFraction,aerodynamics:{...d.aero,autorotationCapture:d.coupling.capture,highPitch:d.coupling.highPitch},yaw:{...d.yaw,rate:s.contact?0:s.yawRate,heading:s.heading,energyJ:.5*d.yaw.inertia*s.yawRate**2},wakeLossW:d.wakeLoss,liftN:d.lift,landingTargets:landingTargets(p),rotorPowerW:d.rotorPower,rotorRateRpmS:d.omega*30/Math.PI,time,position:[s.x,s.y,s.z],velocityMps:[s.vx,-s.w,s.vz],heightAglFt:Math.max(0,s.y-terrainHeight(s.x,s.z,p.flightArea))/FT,iasKt:tas/KT/p.tasFactor,tasKt:tas/KT,groundSpeedKt:Math.hypot(s.vx,s.vz)/KT,descentFpm:s.w/FT*60,verticalAccelerationMps2:d.w,rotorRpm:time<=4?p.rpm:s.omega*30/Math.PI,engineRpm:s.engine,rotorAngle:s.angle,heading:s.heading,pitch:s.pitch,roll:s.roll,contact:s.contact,chartCovered:d.chartCovered,massKg:p.mass,densityKgM3:p.density,assumedMass:config.grossWeightLb==null,powered:time<4&&!s.contact,groundEffectFactor:d.groundEffect,lossW:d.loss+d.dragLoss,totalEnergyJ:p.mass*G*s.y+.5*p.mass*(tas*tas+s.w*s.w)+.5*PARAMETERS.inertiaKgM2*s.omega**2,rotorEnergyJ:.5*PARAMETERS.inertiaKgM2*s.omega**2};
}
const ends=new Map();
export function flightEnd(s,c,choices){if(isProgramFlight(c))return programEnd(c,choices);if(c.mode==='manual'){const run=manualRun(c.manualRunId),hit=run.contact(s,c);return hit?{time:hit.time+groundDuration(hit),reason:'contact',contact:hit}:{time:Math.min(599,run.lastTime(s,c)+.3),reason:'manual',contact:null};}const key=JSON.stringify([s.height,s.ias,c,choices]);if(ends.has(key))return ends.get(key);const p=flightState(180,s,c,choices),end={time:p.quality==='unsupported'?0:p.contact?p.contact.time+groundDuration(p.contact):180,reason:p.quality==='unsupported'?'unsupported':p.contact?'contact':'horizon',contact:p.contact};ends.set(key,end);if(ends.size>64)ends.delete(ends.keys().next().value);return end;}
export function motionLabel(s){if(s.quality==='unsupported')return 'Hesap durdu · deneysel kapsam: 1000–5000 kg / 250–360 başlangıç RPM';return `${s.ground?s.ground.phase:'Deneysel hesap'} · ${s.heightAglFt.toFixed(0)} ft AGL · ${s.iasKt.toFixed(1)} KIAS · ${s.descentFpm.toFixed(0)} ft/dk${s.contact?' · temas öncesi değerler':''}${!s.contact&&Math.abs(s.airMass?.upMps??0)>=.3?` · hava kütlesi ${(s.airMass.upMps>0?'+':'')+s.airMass.upMps.toFixed(1)} m/s ${s.airMass.upMps>0?'yükselen':'çöken'}`:''}`;}

// ---- Manual flight (v0.31): recorded control timeline, incremental integration, deterministic replay ----
export const LEVER={min:.3,max:2.2};
function manualControls(s,p){const i=s.input??{};return {manual:true,collective:clamp(i.collective??1,LEVER.min,LEVER.max),cyclicF:clamp(i.cyclicF??0,-.32,.32),cyclicR:clamp(i.cyclicR??0,-.32,.32),pedal:clamp(i.pedal??0,0,1),
 speedKt:p.ias,flare:false,cushion:false,levelCyclic:false,holdCyclic:false,holdAll:false,managed:false,yawManaged:false,guidance:null,turnRate:0,brakeHeightM:0,phase:'Elle kumanda',reason:'Kollektif, saykılık ve pedal pilotta; hesap kaydedilen kumanda girdisini kullanır.'};}
const MANUAL=new Map();
class ManualRun{
 constructor(id){this.id=id;this.inputs=[];this.states=null;this.key='';}
 reset(inputs=[]){this.inputs=inputs.map(a=>[...a]);this.states=null;}
 inputAt(t){let lo=0,hi=this.inputs.length-1,r=null;while(lo<=hi){const m=(lo+hi)>>1;if(this.inputs[m][0]<=t+1e-9){r=this.inputs[m];lo=m+1;}else hi=m-1;}return r?{collective:r[1],cyclicF:r[2],cyclicR:r[3],pedal:r[4]}:null;}
 // Record the pilot input at time t; anything recorded after t is replaced (re-flying from a rewound point).
 record(t,input){const row=[Math.round(t*1000)/1000,input.collective,input.cyclicF,input.cyclicR,input.pedal].map(v=>Math.round(v*10000)/10000);
  let k=this.inputs.length;while(k>0&&this.inputs[k-1][0]>row[0]-1e-9)k--;const prev=this.inputs[k-1];
  if(this.inputs.length!==k)this.inputs.length=k;
  if(prev&&prev.slice(1).every((v,i)=>Math.abs(v-row[i+1])<1e-4)){this.truncate(row[0]);return;}
  this.inputs.push(row);this.truncate(row[0]);}
 truncate(t){if(!this.states)return;const keep=Math.floor((t+1e-9)/PARAMETERS.step)+1;if(this.states.length>keep)this.states.length=Math.max(1,keep);}
 prepare(scenario,config){const p=setup(scenario,config),key=JSON.stringify([p]);if(key!==this.key||!this.states){this.key=key;this.p=p;this.states=[initial(p)];}return this.p;}
 lastTime(scenario,config){this.prepare(scenario,config);return this.states.at(-1).t;}
 contact(scenario,config){this.prepare(scenario,config);return this.states.at(-1).contact??null;}
 ensure(time){const p=this.p,step=PARAMETERS.step;while(this.states.at(-1).t<time-1e-9&&!this.states.at(-1).contact&&this.states.length<30001){const s=this.states.at(-1),inp=this.inputAt(s.t)??{collective:s.collective,cyclicF:0,cyclicR:0,pedal:s.pedal};this.states.push(advance({...s,input:inp},p,[],step));}}
 state(time,scenario,config){const p=this.prepare(scenario,config),step=PARAMETERS.step;this.ensure(time);const run=this.states,count=Math.floor((time+1e-10)/step),terminal=run.at(-1),base=run[Math.min(count,run.length-1)];
  const inp=this.inputAt(base.t);const s0={...base,input:inp??base.input};
  const s=terminal.contact&&time>=terminal.contact.time-1e-9?terminal:time-base.t>1e-9?advance(s0,p,[],time-base.t):s0;
  const out=describe({...s,input:this.inputAt(s.t)??s.input},p,[],config,time,false);out.manualInput=this.inputAt(time);return out;}
}
export function manualRun(id='default'){if(!MANUAL.has(id))MANUAL.set(id,new ManualRun(id));return MANUAL.get(id);}

// Diagnostic bench only: evaluate the production force/energy equations at a fixed
// airspeed/RPM/descent. No controller tuning, no integration, no claim of flight validation.
export function autorotationBalance({config,iasKt,rotorRpm,descentMps,collective}){
 const c={...config,windKt:0,turbulence:'none',mode:'manual',powerLossMode:'total',program:'emergency',emergencyId:'engine-total',initialRotorRpm:rotorRpm};
 const p=setup({height:2000,ias:iasKt},c),s=initial(p),tas=iasKt*KT*p.tasFactor,drag=.5*p.density*PARAMETERS.dragAreaM2*tas*tas;
 Object.assign(s,{t:20,x:0,z:0,y:terrainHeight(0,0,p.flightArea)+2000*FT,w:descentMps,collective,pedal:.5,cyclicX:0,cyclicZ:-Math.atan2(drag,p.mass*G),inflowCapture:clamp((1-collective)/.22,0,1),engine:0,input:{collective,cyclicF:0,cyclicR:0,pedal:.5}});
 const d=derivative(s,p,[]);return {liftN:d.lift,weightN:p.mass*G,verticalAccelerationMps2:d.w,rotorPowerW:d.rotorPower,rotorRateRpmS:d.omega*30/Math.PI,forwardAccelerationMps2:-d.vz,lateralAccelerationMps2:d.vx,densityKgM3:p.density,massKg:p.mass,tasKt:tas/KT,collective,descentMps,iasKt,rotorRpm};
}
