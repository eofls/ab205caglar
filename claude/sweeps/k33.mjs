import {DEFAULT_CONFIG} from '../../catalog.js';
import {MANEUVERS,maneuverDecisionDefs} from '../../maneuver-catalog.js';
import {programRun} from '../../program-flight.js';
for(const m of MANEUVERS){const st=m.start,defs=maneuverDecisionDefs(m);
 const c={...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:st.h,startIasKt:st.v,flightArea:st.area??'terrain',startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??0,mode:'guided'};
 for(const pick of ['ref','risk']){const choices=Object.values(defs).map(d=>({id:d.id,option:pick==='ref'?d.options[0].id:(d.options.find(o=>o.risk)??d.options.at(-1)).id,at:0}));
  let r;try{r=programRun({...c,mode:'watch'},choices);}catch(e){console.log(m.id,pick,'ERR',e.message);continue;}const ct=r.contact;
  console.log(m.id.padEnd(20),pick.padEnd(4),'dur',r.duration.toFixed(0).padStart(4),ct?`touch ${ct.descentMps?.toFixed(2)} gs ${(ct.groundSpeedMps/.5144).toFixed(0)} ${ct.obstacle||''}`:'-',r.events.filter(e=>e.kind==='Not').length?'TIMEOUT':'');}}
