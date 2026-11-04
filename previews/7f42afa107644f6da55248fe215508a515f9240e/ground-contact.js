// Surface-dependent dissipative approximation; coefficients are experimental, not AB-205 limits.
export const GROUND_MODEL=Object.freeze({restitution:.1,friction:.35,maxSeconds:30});
const G=9.80665;
export function contactMechanics(c){
 const surface=c?.surface??{kind:'paved',friction:.35,roughness:0,slope:0},v=Math.max(0,c?.groundSpeedMps??0),water=surface.kind==='water',rough=surface.roughness??0;
 // Snag risk is energy and roughness dependent, not a forced 5–10 m stop.
 const snag=!!c?.obstacle||(!water&&rough>0&&v*v*rough>18);
 const acceleration=water?G*.8:G*(surface.friction??.35)+(snag?Math.min(22,rough*v*1.2):0);
 const stopTime=v/Math.max(.1,acceleration),rollover=snag&&v*v*rough>45;
 return {surface,water,snag,rollover,acceleration,stopTime,distance:v*v/(2*acceleration)};
}
export function groundDuration(c){if(!c||c.time===0)return 0;const m=contactMechanics(c);return Math.min(30,Math.max(m.water?4:m.rollover?2:.8,.2*Math.max(0,c.descentMps)/G,m.stopTime));}
export function groundMotion(p,elapsed){
 const c=p.contact,m=contactMechanics(c),duration=groundDuration(c),t=Math.max(0,Math.min(elapsed,duration)),v=c.groundSpeedMps,a=m.acceleration,slideTime=Math.min(t,m.stopTime),distance=v*slideTime-.5*a*slideTime**2;
 const bounceV=(m.water?0:.1)*Math.max(0,c.descentMps),bounceTime=2*bounceV/G,bouncing=t>0&&t<bounceTime;
 const h=bouncing?bounceV*t-.5*G*t*t:0,vertical=bouncing?bounceV-G*t:0,speed=Math.max(0,v-a*t),scale=v>1e-9?distance/v:0,settled=elapsed>=duration-1e-9;
 const u=1-Math.exp(-Math.max(0,t-.08)*2.5),side=(c.part==='skidLeft'||p.roll<0)?-1:1;
 const pitch=m.snag?Math.min(.8,v*.035)*u:p.pitch*Math.exp(-t*3),roll=m.rollover?side*1.35*u:p.roll*Math.exp(-t*3),rotorStrike=m.rollover&&Math.abs(roll)>.65;
 const strikeTime=.08-Math.log(1-.65/1.35)/2.5,firstStrike=c.part==='mainRotor',pre=firstStrike?0:Math.min(t,m.rollover?strikeTime:Infinity),post=t-pre,rotorTau=firstStrike||post>0?.25:8,rotorFactor=Math.exp(-pre/8-post/rotorTau),phaseIntegral=8*(1-Math.exp(-pre/8))+Math.exp(-pre/8)*rotorTau*(1-Math.exp(-post/rotorTau));
 const secondary=[];if(m.snag&&t>.1)secondary.push('skidLeft','skidRight');if(rotorStrike)secondary.push('mainRotor','mast','cabin');if(m.rollover&&t>.8)secondary.push('tailRotor','tailBoom');
 return {duration,elapsed:t,settled,bouncing,mechanics:m,secondaryContacts:secondary,position:[p.position[0]+p.velocityMps[0]*scale,p.position[1]+h-(m.water?Math.min(1.8,t*.45):0),p.position[2]+p.velocityMps[2]*scale],velocityMps:[v>0?p.velocityMps[0]*speed/v:0,vertical,v>0?p.velocityMps[2]*speed/v:0],groundSpeedMps:speed,rotorRpm:(c.rotorRpm??0)*rotorFactor,engineRpm:(c.engineRpm??0)*Math.exp(-t/(p.availablePowerFraction>0?8:3)),rotorAngleDelta:(c.rotorRpm??0)*Math.PI/30*phaseIntegral,pitch,roll,phase:m.water?'Su teması / batma taslağı':m.rollover?'Skid takılması / devrilme':m.snag?'Düzensiz zeminde takılma / sürüklenme':settled?'Yerleşti':bouncing?'Temas sonrası sekme':'Temas sonrası kayma / yerleşme'};
}
