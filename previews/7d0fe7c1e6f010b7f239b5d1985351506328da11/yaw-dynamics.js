// Qualitative torque/yaw extension. Coefficients are explicit assumptions, not certified data.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function yawDynamics(s,p,{shaftPower,rpm,tas,airX,airZ,managed,powered}){
 const inertia=p.mass*3.5**2,ratio=Math.max(0,rpm/p.rpm),omega=Math.max(1,rpm*Math.PI/30);
 const trimTorque=p.trimPower/(p.rpm*Math.PI/30),authority=trimTorque*ratio**2;
 const shaftTorque=shaftPower/omega,gearTorque=powered?0:.02*trimTorque*ratio**2;
 const course=tas>5?Math.atan2(airX,-airZ):p.heading;
 const error=wrap(course-s.heading),damping=inertia*(.35+.025*tas),finMoment=inertia*.018*tas*Math.sin(error);
 const tailMoment=authority*(2*s.pedal-1);
 const desiredTail=inertia*(1.8*error-2.5*s.yawRate)-shaftTorque+gearTorque-finMoment+damping*s.yawRate;
 const target=powered?0:managed?clamp((1+desiredTail/Math.max(1,authority))/2,-.5,1):0;
 const acceleration=powered?0:(shaftTorque-gearTorque+tailMoment+finMoment-damping*s.yawRate)/inertia;
 const pedalRate=powered?0:clamp((target-s.pedal)/.25,-1.5,1.5);
 return {acceleration,pedalRate,target,error,tailMoment,shaftTorque,gearTorque,authority,inertia,managed,
  tailLossW:powered?0:.04*p.trimPower*ratio**3*Math.abs(2*s.pedal-1)**1.5};
}
