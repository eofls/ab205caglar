import {DEFAULT_CONFIG} from '../../catalog.js';
import {EMERGENCIES} from '../../emergency-catalog.js';
import {programRun} from '../../program-flight.js';
const areas=(process.argv[2]??'terrain,airfield,mountain,forest').split(',');
for(const e of EMERGENCIES.filter(e=>e.kind==='program')){const row=[e.id.padEnd(18)];
 for(const a of areas){const c={...DEFAULT_CONFIG,program:'emergency',emergencyId:e.id,customStart:true,startHeightFt:e.start?.h??500,startIasKt:e.start?.v??80,flightArea:a,startX:0,startZ:0,headingDeg:a==='airfield'?65:0,mode:'watch'};
  let r;try{r=programRun(c,[]);}catch(err){row.push(a+':ERR');continue;}const ct=r.contact;row.push(`${a.slice(0,4)} ${r.duration.toFixed(0)}s ${ct?ct.descentMps.toFixed(1)+'/'+(ct.groundSpeedMps/.5144).toFixed(0)+(ct.obstacle?'!'+ct.obstacle:''):'-'}`.padEnd(22));}
 console.log(row.join(' '));}
