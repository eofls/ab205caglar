// Measured model-state gates. Thresholds prevent command labels being mistaken for actual motion.
export function maneuverState(s,p,{tas,ax,az,airX,airZ}){
 const diskForward=s.cyclicX*Math.sin(s.heading)-s.cyclicZ*Math.cos(s.heading);
 const deceleration=-(ax*airX+az*airZ)/Math.max(1,tas),noseUp=-s.pitch;
 const flaring=!s.contact&&s.t>=4&&tas>3&&diskForward<-.04&&noseUp>.025&&deceleration>.2;
 return {flaring,diskForwardRad:diskForward,noseUpRad:noseUp,decelerationMps2:deceleration,canLevel:flaring&&s.y>1.2&&s.y/Math.max(.5,s.w)>.6};
}
