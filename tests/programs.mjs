import fs from 'node:fs';
const root=process.argv[2]??'/workspace/scratch/cd97213201cf/review-oct28',I=f=>import(root+'/'+f);
const {MANEUVERS}=await I('maneuver-catalog.js'),{EMERGENCIES}=await I('emergency-catalog.js'),{DEFAULT_CONFIG}=await I('catalog.js'),{programRun}=await I('program-flight.js'),{Session}=await I('engine.js');
const rows=[];for(const [program,list]of [['maneuver',MANEUVERS],['emergency',EMERGENCIES.filter(x=>x.kind==='program')]])for(const item of list){const start=item.start??{};const config={...DEFAULT_CONFIG,mode:'watch',program,maneuverId:item.id,emergencyId:item.id,customStart:true,startHeightFt:start.h??400,startIasKt:start.v??60,flightArea:start.area??item.area??'terrain',startX:start.x??0,startZ:start.z??0,headingDeg:start.hdg??0};try{const c=new Session(config).config,r=programRun(c),errors=[];for(const s of r.samples){for(const k of ['t','x','y','z','vx','vz','vy','hdg','pitch','roll','rpm','eng','col'])if(!Number.isFinite(s[k])){errors.push({t:s.t,k,value:s[k]});break;}if(errors.length>5)break;}const seq=r.samples.every((s,i)=>!i||s.t>r.samples[i-1].t);let row={program,id:item.id,duration:r.duration,endReason:r.endReason,samples:r.samples.length,finite:errors.length===0,errors,monotonic:seq,decisions:r.decisions,contact:r.contact};rows.push(row);console.log(program,item.id,r.duration,row.finite,seq);}catch(e){rows.push({program,id:item.id,error:e.stack});console.log(program,item.id,e.message);}fs.writeFileSync(new URL('./program-results.json',import.meta.url),JSON.stringify(rows,null,2));}
console.log('DONE',rows.length);

// Manual turns must integrate past frame zero and respond to each pilot axis.
const {default:assert}=await import('node:assert/strict');
const {flightState,manualRun}=await I('flight-dynamics.js');
const {setManualInputSource}=await I('program-flight.js');
setManualInputSource(id=>manualRun(id));
function manualCase(id,input,weather={}){
 const s=new Session({...DEFAULT_CONFIG,program:'maneuver',maneuverId:'turns',mode:'manual',customStart:true,startHeightFt:500,startIasKt:70,manualRunId:'test-'+id,...weather});
 manualRun(s.config.manualRunId).reset([]);
 const initial=flightState(.1,s.scenario,s.config,[]);
 assert.ok(initial.position.every(Number.isFinite),'manual first frames are finite');
 manualRun(s.config.manualRunId).record(4,{collective:.7,cyclicF:0,cyclicR:0,pedal:.5,...input});
 const p=flightState(10,s.scenario,s.config,[]);
 assert.ok([...p.position,p.heading,p.roll,p.iasKt,p.descentFpm].every(Number.isFinite),'manual integration remains finite');
 return p;
}
const left=manualCase('left',{cyclicR:-.25}),right=manualCase('right',{cyclicR:.25});
assert.ok(left.roll<-.1&&right.roll>.1&&left.heading<right.heading,'lateral cyclic changes bank and heading');
assert.ok(manualCase('up',{collective:1.2}).position[1]>manualCase('down',{collective:.4}).position[1],'collective changes vertical motion');
assert.ok(manualCase('forward',{cyclicF:.2}).iasKt>manualCase('back',{cyclicF:-.2}).iasKt,'longitudinal cyclic changes speed');
assert.ok(manualCase('pedal-right',{pedal:1}).heading>manualCase('pedal-left',{pedal:0}).heading,'pedal changes heading');
manualCase('weather',{cyclicR:.2},{windKt:15,windFromDeg:270,temperatureC:30,pressureAltitudeFt:3000});
console.log('PASS: manual turns, all control axes and non-default atmosphere');
