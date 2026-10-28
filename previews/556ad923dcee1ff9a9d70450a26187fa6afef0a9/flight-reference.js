// Shared reference frames and defaults; not an aircraft certification.
export const APP_VERSION='0.40.0-validation';
export const FT=.3048,KT=1852/3600,LB_KG=.45359237;
export const DEFAULT_MASS_KG=2800,DEFAULT_WEIGHT_LB=DEFAULT_MASS_KG/LB_KG;
export const MAX_SESSION_SECONDS=900,MAX_SESSION_BYTES=8*1024*1024;
export function massKg(c={}){return c.grossWeightLb==null?DEFAULT_MASS_KG:c.grossWeightLb*LB_KG;}
export function atmosphere(c){const h=c.pressureAltitudeFt*FT,p=101325*Math.pow(1-2.25577e-5*h,5.25588);return {density:p/(287.05287*(c.temperatureC+273.15)),pressurePa:p};}
export function tasFactor(c){return Math.sqrt(1.225/atmosphere(c).density);}
export function windVector(c){const a=c.windFromDeg*Math.PI/180;return {x:-c.windKt*KT*Math.sin(a),z:c.windKt*KT*Math.cos(a)};}
// IAS target on a ground track: crab into crosswind; unreachable crosswind is allowed to drift.
export function velocityForTrack(iasKt,track,c){const W=windVector(c),v=Math.max(0,iasKt)*KT*tasFactor(c),ux=Math.sin(track),uz=-Math.cos(track),rx=Math.cos(track),rz=Math.sin(track),cross=W.x*rx+W.z*rz,cancel=Math.max(-v,Math.min(v,-cross)),along=Math.sqrt(Math.max(0,v*v-cancel*cancel));return {x:ux*along+rx*cancel+W.x,z:uz*along+rz*cancel+W.z};}
export function liveFlightState(p,areaHeight){if(!p.ground)return p;const g=p.ground,v=g.velocityMps,W=p.airMass??{},tas=Math.hypot(v[0]-(W.windX??0),v[2]-(W.windZ??0)),f=Math.sqrt(1.225/(p.densityKgM3??1.225));return {...p,position:g.position,velocityMps:v,iasKt:tas/KT/f,tasKt:tas/KT,groundSpeedKt:g.groundSpeedMps/KT,heightAglFt:Math.max(0,(g.position[1]-areaHeight(g.position[0],g.position[2],p.flightArea))/FT),descentFpm:-v[1]/FT*60,rotorRpm:g.rotorRpm,engineRpm:g.engineRpm,pitch:g.pitch,roll:g.roll};}
