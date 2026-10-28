import {isProgramFlight} from './program-flight.js';
import {currentLanding} from './site-redirect.js';
import {flightState,flightEnd,terrainHeight} from './flight-dynamics.js';
// Projection uses only choices already made at the displayed instant. Rewind is causal.
export function flightOverlays(time,s,c,choices){
 if(isProgramFlight(c)){const p=flightState(time,s,c,choices),lz=p.pilotSite,man=c.program==='maneuver';return {visible:!!lz&&!p.contact,targets:lz?[{id:'pilot',label:man?'H':'P',position:[lz.x,terrainHeight(lz.x,lz.z,c.flightArea)+.3,lz.z],selected:true}]:[],prediction:null,airflow:false,vrs:false,overspeed:false,flowDirection:[0,1,0],targetErrorM:null,text:lz?(man?'H: hareket noktası':'P: seçilen iniş sahası · '+(lz.surfaceLabel??'').toLocaleLowerCase('tr-TR')):''};}
 // v0.32 manual flight: no candidate sites; T follows the controls (current velocity carried to the ground at the current sink rate).
 if(c.mode==='manual'){const p=flightState(time,s,c,[]);if(p.contact||time<1||-p.velocityMps[1]<.3)return {visible:true,targets:[],prediction:null,airflow:false,vrs:false,overspeed:false,flowDirection:[0,1,0],targetErrorM:null,text:''};
  const [vx,vy,vz]=p.velocityMps,h=Math.max(0,p.heightAglFt*.3048),sink=Math.max(.6,-vy),t=Math.min(60,h/sink),x=p.position[0]+vx*t,z=p.position[2]+vz*t;
  return {visible:true,targets:[],prediction:[x,terrainHeight(x,z,c.flightArea)+.3,z],airflow:false,vrs:!p.contact&&p.aerodynamics.vrsExposure>.08,overspeed:false,flowDirection:[0,1,0],targetErrorM:null,text:`T: mevcut kumandalarla tahmini temas · ${t.toFixed(0)} s`};}
 const active=choices.filter(a=>a.at<=time),p=flightState(time,s,c,active),end=flightEnd(s,c,active),future=flightState(end.time,s,c,active),selected=c.mode==='watch'&&p.pilotSite?'pilot':currentLanding(active)?.option;
 const targets=[...p.landingTargets,...(c.mode==='watch'&&p.pilotSite?[{...p.pilotSite,id:'pilot',label:'P'}]:[])].map(t=>({...t,position:[t.x,terrainHeight(t.x,t.z,c.flightArea)+.2,t.z],selected:t.id===selected}));
 const target=targets.find(t=>t.selected),error=target?Math.hypot(future.position[0]-target.x,future.position[2]-target.z):null;
 const wind=c.windFromDeg*Math.PI/180,wx=-c.windKt*1852/3600*Math.sin(wind),wz=c.windKt*1852/3600*Math.cos(wind);
 // Schematic air velocity relative to aircraft; not a CFD/induced-flow solution.
 const flow=[wx-p.velocityMps[0],-p.velocityMps[1],wz-p.velocityMps[2]],norm=Math.hypot(...flow)||1;
 const vrs=!p.contact&&p.aerodynamics.vrsExposure>.08,overspeed=!p.contact&&p.aerodynamics.overspeed;
 const airflow=!vrs&&!p.powered&&!p.contact&&p.descentFpm>30&&p.rotorRpm>0;
 const prediction=end.reason==='contact'?[future.position[0],terrainHeight(future.position[0],future.position[2],c.flightArea)+.3,future.position[2]]:null;
 return {visible:true,targets,prediction,airflow,vrs,overspeed,flowDirection:flow.map(v=>v/norm),targetErrorM:error,
  text:`${vrs?'VRS eğilimi · turuncu halka şematik. ':overspeed?'Rotor overspeed · kaynak maksimumunun üzerinde. ':''}${airflow?'Göreli hava akışı · şematik. ':''}${selected?`${target?.label??selected} aday saha hedef · `:''}${prediction?`T: mevcut kumandalarla tahmini temas${error===null?'':` · hedef sapması ${error.toFixed(0)} m`}`:'Temas tahmini yok'}`};
}
