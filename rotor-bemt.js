// energy-2.0 — blade-element / momentum main rotor (UH-1H class geometry).
// Closed-form blade-element thrust with linear twist and trimmed cyclic (tip-path-plane frame), Glauert inflow in
// forward flight, Leishman's empirical induced-velocity curve through the vortex-ring / turbulent-wake states,
// Cheeseman–Bennett ground effect, a soft blade-stall thrust limit (Ct/σ boundary) and a NACA 0012-like profile
// drag polar. Thrust and the aerodynamic shaft power come from the same flow solution, so weight, density altitude,
// rotor speed and descent rate shape both. Engineering approximation for training comparison; not AB-205 flight data.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const ROTOR=Object.freeze({
 radiusM:7.315,          // 48 ft diameter (UH-1H, ARL Aero TM-377: R = 24.0 ft)
 chordM:.533,            // 21 in
 blades:2,
 twistRad:-10*Math.PI/180,
 liftSlope:5.73,         // per rad, NACA 0012 class, low Mach
 cd0:.0087,cd1:-.0216,cd2:.4,
 kappa:1.15,             // induced power factor
 hubHeightM:4.4,         // skid to rotor hub (model geometry)
 ctsMaxHover:.14,ctsMaxSlope:.12, // blade-stall boundary Ct/σ ≈ 0.14 − 0.12 μ
 thetaMinRad:0,                   // collective full-down blade pitch at 0.75 R (calibrated, see REVISION-v031)
 thetaMaxRad:17*Math.PI/180,
});
export const DISK_AREA=Math.PI*ROTOR.radiusM**2,SOLIDITY=ROTOR.blades*ROTOR.chordM/(Math.PI*ROTOR.radiusM);
const K=[1.15,-1.125,-1.372,-1.718,-.655];
// Axial induced inflow / hover inflow as a function of climb ratio X = Vc/vh (Vc > 0 climb, < 0 descent).
export function axialInducedRatio(X){
 if(X>=0)return -X/2+Math.sqrt(X*X/4+1);
 if(X<=-2)return -X/2-Math.sqrt(X*X/4-1);
 return K[0]+K[1]*X+K[2]*X*X+K[3]*X**3+K[4]*X**4; // Leishman, Principles of Helicopter Aerodynamics, eq. 2.168
}
function ctBlade(theta75,mu,lambda){const s=SOLIDITY,a=ROTOR.liftSlope,tw=ROTOR.twistRad,theta0=theta75-.75*tw;
 return s*a/2*(theta0*(1/3+mu*mu/2)+tw/4*(1+mu*mu)-lambda/2);}
/**
 * @param rho air density, omega rotor speed (rad/s), theta75 collective pitch at 0.75R (rad)
 * @param vPerpDown air speed down through the disk along the shaft axis (m/s; descent < 0)
 * @param vInPlane in-plane air speed (m/s), agl skid height (m), lambdaGuess previous inflow (optional)
 */
export function rotorAero({rho,omega,theta75,vPerpDown,vInPlane,agl=100,lambdaGuess=null}){
 const OR=Math.max(1,omega*ROTOR.radiusM),q=rho*DISK_AREA*OR*OR,mu=Math.abs(vInPlane)/OR,lc=vPerpDown/OR;
 const z=Math.max(.5,agl+ROTOR.hubHeightM),geRaw=1-(ROTOR.radiusM/(4*z))**2;
 const ctsMax=Math.max(.06,ROTOR.ctsMaxHover-ROTOR.ctsMaxSlope*mu),ctLim=SOLIDITY*ctsMax;
 let li=lambdaGuess!=null&&Number.isFinite(lambdaGuess)?Math.max(.001,lambdaGuess-lc):.03,ct=0,lh=.03,stall=0,vrs=0,wgt=1,ge=1;
 for(let i=0;i<14;i++){
  let c=ctBlade(theta75,mu,lc+li);
  // soft blade-stall knee: thrust saturates beyond ~80 % of the Ct/σ boundary
  if(c>.8*ctLim){const ex=c-.8*ctLim;c=.8*ctLim+.2*ctLim*Math.tanh(ex/(.2*ctLim));}
  ct=c;lh=Math.sqrt(Math.max(Math.abs(ct),2e-7)/2);
  const X=lc/lh,ax=lh*axialInducedRatio(X)*Math.sign(ct||1);
  const ff=ct/(2*Math.sqrt(mu*mu+(lc+li)**2+1e-6));
  wgt=clamp((mu/lh-.6)/1.4,0,1);wgt=wgt*wgt*(3-2*wgt);
  ge=1-(1-geRaw)*Math.exp(-(((mu*OR)/(1.5*lh*OR+1e-6))**2)); // ground effect fades as the wake is swept back
  const target=((1-wgt)*ax+wgt*ff)*ge;
  li+=.55*(target-li);
 }
 const thrust=ct*q,vi=li*OR;
 stall=clamp((ct/ctLim-.8)/.35,0,1);
 const X=lc/lh;vrs=(1-wgt)*clamp(1-Math.abs(X+.9)/.75,0,1);
 const clBar=6*Math.max(0,ct)/SOLIDITY,alpha=clBar/ROTOR.liftSlope,cd=ROTOR.cd0+ROTOR.cd1*alpha+ROTOR.cd2*alpha*alpha+.09*stall*stall;
 const profile=SOLIDITY*cd/8*(1+4.65*mu*mu)*q*OR,induced=ROTOR.kappa*thrust*vi;
 // Thrust work on the airflow through the disk (negative in descent = the autorotative driving term)
 const flow=thrust*vPerpDown,power=flow+induced+profile;
 return {thrust,ct,ctSigma:ct/SOLIDITY,mu,lambda:lc+li,lambdaInduced:li,inducedVelocity:vi,hoverInflow:lh*OR,stall,vrs,groundEffect:ge,
  inducedPower:induced,profilePower:profile,flowPower:flow,power,torque:power/Math.max(1,omega),dynamicPressure:q};
}
// Collective (normalised: 1 = position at the failure instant, .3 = full down) → blade pitch at 0.75 R.
export function collectivePitch(collective,thetaTrim){
 const t=ROTOR.thetaMinRad+(thetaTrim-ROTOR.thetaMinRad)*(collective-.3)/.7;
 return clamp(t,ROTOR.thetaMinRad-.02,ROTOR.thetaMaxRad);
}
// Trim collective pitch for the configured powered flight state (thrust balances weight and fuselage drag).
export function trimPitch({rho,omega,mass,tas,dragAreaM2,agl=100}){
 const g=9.80665,drag=.5*rho*dragAreaM2*tas*tas,need=Math.hypot(mass*g,drag),tilt=Math.atan2(drag,mass*g);
 const vPerp=tas*Math.sin(tilt),vIn=tas*Math.cos(tilt);let lo=-.05,hi=.4,r=null;
 for(let i=0;i<40;i++){const mid=(lo+hi)/2;r=rotorAero({rho,omega,theta75:mid,vPerpDown:vPerp,vInPlane:vIn,agl});if(r.thrust<need)lo=mid;else hi=mid;}
 r=rotorAero({rho,omega,theta75:(lo+hi)/2,vPerpDown:vPerp,vInPlane:vIn,agl});
 return {theta75:(lo+hi)/2,power:r.power,thrust:r.thrust,ctSigma:r.ctSigma};
}
const memo=new Map();
function remember(key,fn){if(memo.has(key))return memo.get(key);const v=fn();memo.set(key,v);if(memo.size>256)memo.delete(memo.keys().next().value);return v;}
export function trimPitchCached(o){return remember('t'+[o.rho,o.omega,o.mass,o.tas,o.dragAreaM2,Math.round((o.agl??100)*10)].join('|'),()=>trimPitch(o));}
// Collective pitch that holds the reference rotor speed in a steady glide (63 KIAS, chart min-sink speed).
export function autorotationPitch({rho,omega,mass,dragAreaM2,kias=63}){return remember('a'+[rho,omega,mass,dragAreaM2,kias].join('|'),()=>{
 const g=9.80665,V=kias*1852/3600*Math.sqrt(1.225/rho),W=mass*g,D=.5*rho*dragAreaM2*V*V,tau=Math.atan2(D,W),need=Math.hypot(W,D);
 const at=(w,th)=>rotorAero({rho,omega,theta75:th,vPerpDown:V*Math.sin(tau)-w*Math.cos(tau),vInPlane:V*Math.cos(tau)+w*Math.sin(tau)});
 const thetaFor=w=>{let a=-.2,b=.4;for(let i=0;i<30;i++){const m=(a+b)/2;if(at(w,m).thrust<need)a=m;else b=m;}return (a+b)/2;};
 let lo=0,hi=45;for(let i=0;i<30;i++){const w=(lo+hi)/2;if(at(w,thetaFor(w)).power>0)lo=w;else hi=w;}
 const w=(lo+hi)/2;return {theta75:thetaFor(w),descentMps:w};});}
// Analytic inverse: blade pitch at 0.75R that produces a thrust in the current flow (used to turn a thrust demand
// from the pilot model into a lever position; the rotor model then decides what the rotor actually delivers).
export function pitchForThrust({rho,omega,thrust,vPerpDown,vInPlane,agl=100}){
 const OR=Math.max(1,omega*ROTOR.radiusM),q=rho*DISK_AREA*OR*OR,mu=Math.abs(vInPlane)/OR,lc=vPerpDown/OR,ctsMax=Math.max(.06,ROTOR.ctsMaxHover-ROTOR.ctsMaxSlope*mu);
 const ct=Math.min(thrust/q,.98*ctsMax*SOLIDITY),lh=Math.sqrt(Math.max(ct,2e-7)/2),z=Math.max(.5,agl+ROTOR.hubHeightM),ge=1-((ROTOR.radiusM/(4*z))**2)*Math.exp(-((mu/(1.5*lh))**2));
 let li=lh;for(let i=0;i<8;i++){const ax=lh*axialInducedRatio(lc/lh),ff=ct/(2*Math.sqrt(mu*mu+(lc+li)**2+1e-6));let w=clamp((mu/lh-.6)/1.4,0,1);w=w*w*(3-2*w);li+=.6*(((1-w)*ax+w*ff)*ge-li);}
 const a=ROTOR.liftSlope,tw=ROTOR.twistRad,theta0=(2*ct/(SOLIDITY*a)-tw/4*(1+mu*mu)+(lc+li)/2)/(1/3+mu*mu/2);
 return clamp(theta0+.75*tw,ROTOR.thetaMinRad-.02,ROTOR.thetaMaxRad);
}
