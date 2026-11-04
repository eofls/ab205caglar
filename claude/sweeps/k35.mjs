// v0.49 süpürme: her hareket × her karar seçeneği (diğerleri referans) → temas
import {DEFAULT_CONFIG} from '../../catalog.js';
import {MANEUVERS,maneuverDecisionDefs} from '../../maneuver-catalog.js';
import {programRun} from '../../program-flight.js';
const only=process.argv[2];
const f=r=>{const ct=r.contact;return `${r.duration.toFixed(0).padStart(4)}s ${ct?`v${ct.descentMps.toFixed(2)} gs${(ct.groundSpeedMps/.5144).toFixed(0)}${ct.obstacle?' !'+ct.obstacle:''}`:'-'} ${r.endReason??''}`;};
for(const m of MANEUVERS.filter(m=>!only||m.id===only)){const st=m.start,defs=maneuverDecisionDefs(m);
 const c={...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:st.h,startIasKt:st.v,flightArea:st.area??'terrain',startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??((st.area??'terrain')==='airfield'?65:0),mode:'watch'};
 const ref=Object.values(defs).map(d=>({id:d.id,option:d.reference,at:0}));
 let r;try{r=programRun(c,ref);}catch(e){console.log(m.id,'REF ERR',e.message);continue;}console.log(`${m.id.padEnd(20)} REF ${f(r)}`);
 if(process.argv[3]==='ref')continue;
 for(const d of Object.values(defs))for(const o of d.options){if(o.id===d.reference)continue;const ch=ref.map(x=>x.id===d.id?{...x,option:o.id}:x);
  try{console.log(`${''.padEnd(20)} ${d.id}=${o.id}${o.risk?'(R)':''} ${f(programRun(c,ch))}`);}catch(e){console.log('  ',d.id,o.id,'ERR',e.message);}}}
