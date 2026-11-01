// Reduced-order closure, not a measured AB-205 blade polar. See EMERGENCY-REVIEW-v018.md.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function rotorCoupling(collective,rpmRatio,descent,sink,axialInflow=descent,establishedCapture=null){
 // Powered-flight pitch (1) does not instantaneously establish the autorotative driving region.
 // Only actual pitch reduction opens this coupling; decision IDs never change RPM directly.
 const pitchWindow=clamp((1-collective)/.22,0,1);
 const X=globalThis.EXP??{},lowRpmAuthority=clamp((rpmRatio-(X.lowRpmA??.45))/(X.lowRpmW??.3),0,1);
 const desiredCapture=pitchWindow*lowRpmAuthority;
 const capture=establishedCapture===null?desiredCapture:clamp(establishedCapture,0,1)*lowRpmAuthority;
 const inflowLift=capture*(.3*clamp(descent/Math.max(1,sink),0,1.5)+.6*clamp((axialInflow-descent)/Math.max(1,sink),0,1.5));
 return {capture,desiredCapture,inflowLift,highPitch:collective>=.98};
}
