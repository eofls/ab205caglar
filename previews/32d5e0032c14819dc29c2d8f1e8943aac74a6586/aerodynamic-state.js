// Regime screening and bounded experimental response, not a validated AB-205 polar.
export const AERO=Object.freeze({radiusM:7.35584,profileFraction:.2,stallRatio:.8,stallWidth:.15,vrsLossMax:.25});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function aerodynamicState({mass,density,rpm,referenceRpm,collective,tas,descent,powerFraction=0,agl=100}){
 const diskArea=Math.PI*AERO.radiusM**2,hoverInflow=Math.sqrt(mass*9.80665/(2*density*diskArea));
 const ratio=rpm/referenceRpm,loading=clamp((collective-.7)/.5,0,1);
 // Low-speed/high-pitch proxy. No universal stall RPM is claimed.
 const stallExposure=clamp((AERO.stallRatio-ratio)/AERO.stallWidth,0,1)*loading;
 const vertical=clamp((descent-1.524)/hoverInflow,0,1)*clamp((2.5*hoverInflow-descent)/hoverInflow,0,1);
 const vrsExposure=powerFraction>0?clamp(powerFraction/.35,0,1)*vertical*clamp(1-tas/(10*1852/3600),0,1)*clamp(agl/AERO.radiusM,0,1):0;
 return {diskAreaM2:diskArea,hoverInflowMps:hoverInflow,dynamicPressurePa:.5*density*tas*tas,stallExposure,vrsExposure,
  liftFactor:1-.6*stallExposure-AERO.vrsLossMax*vrsExposure,
  lossFactor:1+stallExposure+vrsExposure*.3,
  lowRotor:rpm<294,overspeed:rpm>339,highRotor:rpm>329};
}
