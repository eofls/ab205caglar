import {surfaceProfile,obstacleHeight,terrainHeight} from './terrain-data.js';
// Local receding-horizon search over the same experimental dynamics, not a learned pilot.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const PREDICTION={horizon:2,step:.05,interval:.5};
export function pilotCandidates(s,p,base){
 const options=['reference'];
 if(base.flare&&!base.cushion)options.push('firmFlare','gentleFlare');
 // Low and fast (approved H/V low-level area): a hard flare balloons and bleeds rotor energy; offer a soft flare or an immediate cushion/run-on.
 if(base.flare&&!base.cushion&&s.y<20&&Math.hypot(s.vx??0,s.vz??0)>12)options.push('softFlare');
 if(base.cushion){options.push('firmPull','smoothPull','moderatePull');if(s.y>5&&(s.collective??.7)<1.1)options.push('reserveEnergy');}
 // 'anticipateFlare' was removed in energy-1.4: 9-start ablation showed it started the flare too early and raised mean vertical contact speed from ~2.7 to ~6.8 m/s.
 if(!base.cushion&&s.y>15&&s.omega*30/Math.PI<p.rpm*.94)options.push('unload');
 return options;
}
export function pilotCommand(base,s,action='reference'){
 const c={...base};
 if(action==='anticipateFlare'&&!c.cushion&&s.y<45&&s.y>8){c.flare=true;c.speedKt=3;c.flareAccel=4;c.collective=Math.max(c.collective,.7);c.levelCyclic=false;}
 if(action==='reserveEnergy'&&s.y>5&&(s.collective??.7)<1.1){c.cushion=false;c.collective=.78+(base.collectiveBias??0);c.flare=(s.v??0)>3;c.levelCyclic=false;c.flareAccel=3;c.speedKt=3;}
 if(action==='moderatePull'&&c.cushion)c.collective=Math.min(c.collective,1.3);
 if(action==='softFlare'&&c.flare)c.flareAccel=Math.min(c.flareAccel,1.4);
 if(action==='earlyCushion'&&!c.cushion){c.cushion=true;c.flare=false;c.levelCyclic=true;c.collective=Math.max(c.collective,s.collective??.7,.95);c.speedKt=3;}
 if(action==='firmFlare'&&c.flare)c.flareAccel=Math.min(5,c.flareAccel*1.3);
 if(action==='gentleFlare'&&c.flare)c.flareAccel=Math.max(.25,c.flareAccel*.75);
 if(action==='unload'&&!c.cushion&&s.y>15)c.collective=Math.max(.3,c.collective-.12);
 if(action==='firmPull'&&c.cushion)c.collective=Math.min(2.2,c.collective+.12);
 if(action==='smoothPull'&&c.cushion)c.collective=Math.max(1,c.collective-.12);
 if(c.cushion&&s.y<=4.8&&s.w>0)c.collective=Math.max(c.collective,s.collective??1);
 return c;
}
function cost(s,p,ground){
 const h=Math.max(0,s.y-ground(s.x,s.z)),rpm=s.omega*30/Math.PI,gs=Math.hypot(s.vx,s.vz);
 const low=Math.max(0,.90-rpm/p.rpm),high=Math.max(0,rpm/p.rpm-1.05);
 const surface=surfaceProfile(s.x,s.z,p.flightArea),horizontalWeight=surface.kind==='paved'?.08:surface.kind==='water'?2:1.2;
 if(s.contact)return 24*s.contact.descentMps**2+horizontalWeight*s.contact.groundSpeedMps**2+90*s.pitch**2+120*s.roll**2+200*low**2+(s.contact.obstacle?300:0)+(surface.kind==='water'?120:0);
 const targetW=Math.min(9,Math.sqrt(2+1.1*h));
 return 3*Math.max(0,s.w-targetW)**2+500*low**2+200*high**2+horizontalWeight*.25*gs*gs*clamp(1-h/35,0,1)+30*s.pitch*s.pitch*clamp(1-h/8,0,1);
}
export function choosePilot(s,p,base,advance,ground){
 const gs0=Math.hypot(s.vx,s.vz),horizon=s.y-ground(s.x,s.z)<45?(gs0>25&&s.y-ground(s.x,s.z)<18?7:3):2;
 const candidates=pilotCandidates({...s,y:s.y-ground(s.x,s.z)},p,base),results=[];
 for(const action of candidates){
  let predicted={...s,pilotAction:action},path=0;
  for(let i=0;i<horizon/PREDICTION.step&&!predicted.contact;i++){
   predicted=advance(predicted,PREDICTION.step);path+=cost(predicted,p,ground)*PREDICTION.step;
  }
  const score=cost(predicted,p,ground)+.15*path+(action==='reference'?0:.1);
  results.push({action,score,rotorRpm:predicted.omega*30/Math.PI,descentMps:predicted.w,heightM:Math.max(0,predicted.y-ground(predicted.x,predicted.z)),contact:!!predicted.contact});
 }
 const best=results.reduce((a,b)=>b.score<a.score?b:a),names={reserveEnergy:'son kollektif öncesi rotor enerjisini saklama',moderatePull:'ölçülü kollektifle enerji koruma',anticipateFlare:'erken frenleme değerlendirmesi',reference:'mevcut durum yönetimi',firmFlare:'fleyır frenlemesini artırma',gentleFlare:'fleyır frenlemesini azaltma',firmPull:'son kollektif talebini artırma',smoothPull:'son kollektif talebini ölçülü uygulama',unload:'rotor yükünü azaltma',softFlare:'alçak irtifada yumuşak fleyır',earlyCushion:'alçak irtifada erken kollektif / koşarak iniş'};
 return {action:best.action,at:s.t,horizon,candidates:results,reason:`${horizon} saniyelik fizik öngörüsünde ${results.length} kumanda seçeneği karşılaştırıldı: ${names[best.action]}. Seçilen öngörü: rotor ${best.rotorRpm.toFixed(0)} RPM, alçalma ${(best.descentMps/.3048*60).toFixed(0)} ft/dk. Kısa ufuklu deneysel tahmindir; tüm inişin en iyi sonucu olduğu anlamına gelmez.`};
}
