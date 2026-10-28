// Source and review provenance: curve-audit.json. Approximate chart readings only.
export const CURVES=Object.freeze({
 284:Object.freeze([{"kias": 40, "descentFpm": 1550, "glideRatio": 2.9}, {"kias": 50, "descentFpm": 1450, "glideRatio": 3.8}, {"kias": 60, "descentFpm": 1410, "glideRatio": 4.5}, {"kias": 63, "descentFpm": 1400, "glideRatio": 4.6}, {"kias": 70, "descentFpm": 1430, "glideRatio": 4.9}, {"kias": 80, "descentFpm": 1520, "glideRatio": 5.2}].map(Object.freeze)),
 314:Object.freeze([{"kias": 40, "descentFpm": 1900, "glideRatio": 2.1}, {"kias": 50, "descentFpm": 1670, "glideRatio": 3.0}, {"kias": 60, "descentFpm": 1600, "glideRatio": 3.7}, {"kias": 63, "descentFpm": 1600, "glideRatio": 3.9}, {"kias": 70, "descentFpm": 1620, "glideRatio": 4.2}, {"kias": 80, "descentFpm": 1720, "glideRatio": 4.5}].map(Object.freeze)),
 339:Object.freeze([{"kias": 50, "descentFpm": 2440, "glideRatio": 1.5}, {"kias": 55, "descentFpm": 2270, "glideRatio": 1.9}, {"kias": 60, "descentFpm": 2210, "glideRatio": 2.2}, {"kias": 63, "descentFpm": 2190, "glideRatio": 2.3}, {"kias": 70, "descentFpm": 2220, "glideRatio": 2.7}, {"kias": 75, "descentFpm": 2280, "glideRatio": 2.9}, {"kias": 80, "descentFpm": 2380, "glideRatio": 3.0}].map(Object.freeze)),
});
export const CURVE_POINTS=CURVES[314];
export function readCurve(kias,{rotorRpm=314,pitot='roof',powerState='off'}={}){
 if(!Number.isInteger(kias)||!Number.isInteger(rotorRpm)||!Object.hasOwn(CURVES,rotorRpm)||pitot!=='roof'||powerState!=='off')return null;
 const points=CURVES[rotorRpm];if(kias<points[0].kias||kias>points.at(-1).kias)return null;
 const hi=points.findIndex(p=>p.kias>=kias),b=points[hi],a=points[Math.max(0,hi-1)];
 const fraction=a===b?0:(kias-a.kias)/(b.kias-a.kias);
 const lerp=key=>a[key]+(b[key]-a[key])*fraction;
 return {kias,descentFpm:Math.round(lerp('descentFpm')/10)*10,glideRatio:Math.round(lerp('glideRatio')*10)/10,rotorRpm,pitot,powerState,preliminary:true,review:'source-rechecked',physicsReady:false};
}
export function chartPoint(kias,value,metric='descentFpm'){
 if(metric==='glideRatio'){
  const t=(kias-20)/100,x=30+t*895,y0=599-6*t,y6=38-6*t;
  return [(x+1040)/4*2000/842,(y0-(y0-y6)*value/6+1760)/4*2000/842];
 }
 return [(80+(kias-20)*6.7+714)/3*2000/842,(41+(2600-value)*837/1200+404)/3*2000/842];
}
