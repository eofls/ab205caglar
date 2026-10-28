// Controller scheduling estimates, not AB-205 operating limits or certified stopping distances.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function terminalEnvelope(s,p){
 const h=Math.max(0,s.y),w=Math.max(0,s.w),ratio=s.omega/(p.rpm*Math.PI/30);
 const targetSink=1.5,collectiveCap=2.2;
 // Include both command lag and the rate-limited collective travel before demanding arrest.
 const travelSeconds=Math.max(0,1.6-(s.collective??.7))/1.2;
 const responseSeconds=.35+travelSeconds;
 const upAccel=clamp(9.80665*(ratio*ratio*1.65-1),.5,5);
 const arrestDistance=Math.max(0,w*w-targetSink*targetSink)/(2*upAccel);
 const brakeHeightM=Math.max(4.8,Math.min(18,w*responseSeconds+arrestDistance));
 return {brakeHeightM,responseSeconds,upAccelMps2:upAccel,targetSink,collectiveCap,timeToGround:h/Math.max(.5,w)};
}
