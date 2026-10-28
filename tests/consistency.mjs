import fs from 'node:fs';
const root=process.argv[2]??'/workspace/scratch/cd97213201cf/review-oct28',I=f=>import(root+'/'+f);
const {Session,weatherEffects}=await I('engine.js'),{DEFAULT_CONFIG}=await I('catalog.js'),{flightState}=await I('flight-dynamics.js'),{programRun}=await I('program-flight.js'),{contactMechanics}=await I('ground-contact.js'),{ppc}=await I('performance.js');
const {DEFAULT_WEIGHT_LB}=await I('flight-reference.js');
const results={};
function state(patch,t=0){const s=new Session({...DEFAULT_CONFIG,customStart:true,startHeightFt:500,startIasKt:30,windKt:30,windFromDeg:0,headingDeg:0,pressureAltitudeFt:0,temperatureC:15,mode:'watch',...patch});return flightState(t,s.baseScenario,s.config,[]);}
const summarize=p=>({ias:p.iasKt,tas:p.tasKt,gs:p.groundSpeedKt,rpm:p.rotorRpm,engine:p.engineRpm,mass:p.massKg,velocity:p.velocityMps,quality:p.quality,availablePower:p.availablePowerFraction});
results.wind={energy:summarize(state({})),program:summarize(state({program:'maneuver',maneuverId:'turns'}))};
results.rpm={energy:summarize(state({windKt:0,initialRotorRpm:310,initialEngineRpm:6300})),program:summarize(state({windKt:0,initialRotorRpm:310,initialEngineRpm:6300,program:'maneuver',maneuverId:'turns'}))};
results.density={energy:summarize(state({windKt:0,pressureAltitudeFt:10000,temperatureC:35})),program:summarize(state({windKt:0,pressureAltitudeFt:10000,temperatureC:35,program:'maneuver',maneuverId:'turns'}))};
function run(weight){const c=new Session({...DEFAULT_CONFIG,mode:'watch',program:'maneuver',maneuverId:'turns',customStart:true,startHeightFt:500,startIasKt:80,windKt:0,grossWeightLb:weight}).config;return programRun(c).samples.map(s=>[s.x,s.y,s.z,s.vx,s.vy,s.vz,s.rpm,s.col]);}
results.weight={programTrajectoriesEqual6000vs9500lb:JSON.stringify(run(6000))===JSON.stringify(run(9500))};
results.defaultMass={physicsKg:state({windKt:0}).massKg,ppcDefaultLb:DEFAULT_WEIGHT_LB,ppcEquivalentKg:DEFAULT_WEIGHT_LB*.45359237};
fs.writeFileSync(new URL('./consistency-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
