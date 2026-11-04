// v0.49 süpürme: her acil durum × her karar seçeneği (diğerleri referans) → temas
import {DEFAULT_CONFIG} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {programRun,emergencyDecisionDefs} from '../../program-flight.js';
const only=process.argv[2];
const f=r=>{const ct=r.contact;return `${r.duration.toFixed(0).padStart(4)}s ${ct?`v${ct.descentMps.toFixed(1)} gs${(ct.groundSpeedMps/.5144).toFixed(0)}${ct.obstacle?' !'+ct.obstacle:''}`:'temas yok'} ${r.endReason??''}`;};
for(const e of EMERGENCIES.filter(e=>e.kind==='program'&&(!only||e.id===only))){const st=e.start??{};const area=e.area??st.area??'terrain';
 const c={...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:st.h??500,startIasKt:st.v??80,flightArea:area,startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??(area==='airfield'?65:0),mode:'watch'};
 const defs=emergencyDecisionDefs(e);const ref=Object.values(defs).map(d=>({id:d.id,option:d.reference,at:0}));
 let r;try{r=programRun(c,ref);}catch(err){console.log(e.id,'REF ERR',err.message);continue;}
 console.log(`${e.id.padEnd(18)} REF ${f(r)}`);
 for(const d of Object.values(defs))for(const o of d.options){if(o.id===d.reference)continue;const ch=ref.map(x=>x.id===d.id?{...x,option:o.id}:x);
  try{const q=programRun(c,ch);console.log(`${''.padEnd(18)} ${d.id}=${o.id}${o.risk?'(R)':''} ${f(q)}`);}catch(err){console.log('   ',d.id,o.id,'ERR',err.message);}}}
