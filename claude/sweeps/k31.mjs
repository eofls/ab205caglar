import {DEFAULT_CONFIG} from '../../catalog.js';
import {MANEUVERS} from '../../maneuver-catalog.js';
import {programRun} from '../../program-flight.js';import {terrainHeight} from '../../terrain-data.js';
const only=process.argv[2],step=+(process.argv[3]??0);
for(const m of MANEUVERS){if(only&&m.id!==only)continue;const st=m.start;
 const c={...DEFAULT_CONFIG,program:'maneuver',maneuverId:m.id,customStart:true,startHeightFt:st.h,startIasKt:st.v,flightArea:st.area??'terrain',startX:st.x??0,startZ:st.z??0,headingDeg:st.hdg??0,mode:'watch'};
 const t0=Date.now();let r;try{r=programRun(c,[]);}catch(e){console.log(m.no,m.id,'ERR',e.stack.split('\n').slice(0,3).join(' | '));continue;}
 const ct=r.contact;console.log(String(m.no).padStart(2),m.id.padEnd(20),(st.area??'-').padEnd(8),'dur',r.duration.toFixed(0).padStart(4),'ms',Date.now()-t0,ct?`touch ${ct.descentMps?.toFixed(2)} m/s gs ${(ct.groundSpeedMps/0.5144).toFixed(0)} kt obs ${ct.obstacle||'-'} ${ct.surface?.kind}`:'no contact','end',r.endReason);
 if(step){for(const s of r.samples.filter((s,i)=>i%Math.round(step/0.05)===0))console.log(' ',s.t.toFixed(1),Math.round(s.x),Math.round(s.z),'agl',Math.round((s.y-terrainHeight(s.x,s.z,c.flightArea))/0.3048),'kt',(Math.hypot(s.vx,s.vz)/0.5144).toFixed(0),'vy',s.vy.toFixed(1),'hdg',Math.round(s.hdg*57.3),'rpm',Math.round(s.rpm),'eng',Math.round(s.eng),s.phase);
  for(const e of r.events)console.log('  ev',e.at.toFixed(1),e.kind,e.title,e.target??'');}
}
