// Mechanism-based visual screening. Thresholds are illustrative, not AB-205 failure limits.
export const PART_LABELS={skidLeft:'Sol skid',skidRight:'Sağ skid',cabin:'Gövde/taban',cockpit:'Kokpit',tailBoom:'Kuyruk bumu',tailRotor:'Kuyruk rotoru',mainRotor:'Ana rotor',mast:'Mast',transmission:'Transmisyon bağlantıları',engine:'Motor bağlantıları',stabilizer:'Yatay stabilize',fin:'Dikey stabilize',controls:'Kumanda bağlantıları',crosstube:'Skid çapraz boruları',glazing:'Cam yüzeyleri',blades:'Ana rotor palleri'};
const clamp=x=>Math.max(0,Math.min(1,x));
export function componentDamage(p){
 const c=p.contact;if(!c||c.time===0)return {parts:[],breakup:false,firstContact:null,summary:'Dinamik temas yok'};
 const mass=(p.massKg??2800)/2800,w=Math.max(0,c.descentMps),normal=mass*(w/5)**2,slide=(c.groundSpeedMps/12)**2,roll=p.roll??0,first=c.part??'skidLeft';
 const severity={skidLeft:clamp(normal*.45*(1+roll)+slide*.08),skidRight:clamp(normal*.45*(1-roll)+slide*.08),cabin:clamp((normal-1)*.27),cockpit:clamp((normal-1.8)*.22),engine:clamp((normal-1.2)*.23),transmission:clamp((normal-1)*.25),mast:clamp((normal-2)*.22),controls:clamp((normal-1.5)*.2),tailBoom:clamp((normal-2.5)*.15),tailRotor:0,mainRotor:0,stabilizer:0,fin:0,crosstube:clamp((normal-.8)*.32+slide*.05),glazing:clamp((normal-2.2)*.2+(roll!==0?Math.abs(roll)*.4:0)*slide),blades:0};
 if(!first.startsWith('skid'))severity[first]=Math.max(severity[first]??0,clamp(.35+normal*.2+slide*.1));
 for(const id of p.ground?.secondaryContacts??[])severity[id]=Math.max(severity[id]??0,id.includes('Rotor')?.85:.65);
 const rotorStrike=['tailRotor','mainRotor'].includes(first)||(p.ground?.secondaryContacts??[]).some(x=>x.includes('Rotor'));
 if(['tailRotor','mainRotor'].includes(first)){severity[first]=clamp(.45+(c.rotorRpm??0)/400);severity[first==='mainRotor'?'mast':'tailBoom']=Math.max(severity[first==='mainRotor'?'mast':'tailBoom'],.45);severity.controls=Math.max(severity.controls,.3);}
 {const rpmFrac=Math.max(0,(c.rotorRpm??324)/324),droop=clamp((.75-rpmFrac)*2.2),rolled=clamp((Math.abs(roll)*57.3-10)/25),pitchUp=clamp((Math.abs(p.pitch??0)*57.3-12)/20);severity.blades=clamp(Math.max(severity.blades,droop*(.4+.3*normal),rolled*.8,pitchUp*.5));
  if(severity.blades>.3)severity.mast=Math.max(severity.mast,severity.blades*.55);}
 // Severe tail-first impact can fail the attachment; 100% contact index alone never triggers separation.
 // v0.33: tail boom separation — a hard tail-first strike (over-flare), or a hard landing at low rotor RPM where the
 // drooping main-rotor blades strike the boom ("tail boom chop", typical of two-blade teetering rotors).
 const rpmFrac=(c.rotorRpm??324)/324,tailFirst=['tailBoom','fin','stabilizer','tailRotor'].includes(first);
 const chop=w>7&&rpmFrac<.95||w>9.5||severity.blades>.78&&normal>2.2;
 const tailBreak=(tailFirst&&(normal>1.6||slide>.9))||chop;
 if(tailBreak){severity.tailBoom=Math.max(severity.tailBoom,.9);severity.tailRotor=Math.max(severity.tailRotor,.8);severity.fin=Math.max(severity.fin,.5);}
 const parts=Object.keys(PART_LABELS).map(id=>({id,label:PART_LABELS[id],severity:severity[id],state:severity[id]<.08?'Belirgin etki yok':severity[id]<.35?'Hafif deformasyon':severity[id]<.7?'Belirgin deformasyon':'Ağır deformasyon',detach:(id==='tailBoom'&&tailBreak)||((id===first||p.ground?.secondaryContacts?.includes(id))&&['mainRotor','tailRotor'].includes(id)&&rotorStrike&&(c.rotorRpm??0)>150),directContact:id===first}));
 /* v0.38: the supplied crashed airframe stands for the hardest contacts only — a hard impact that also separates the
    tail boom, or one hard enough to crush the cabin on its own. Lighter contacts keep the graded deformation. */
 const wreck=(tailBreak&&severity.cabin>=.5)||severity.cabin>=.8;
 return {parts,breakup:tailBreak,tailChop:chop,wreck,firstContact:first,rotorStrike,summary:parts.filter(q=>q.severity>=.08).map(q=>q.label+': '+q.state+(q.detach?' / parça ayrılması':'')).join('; ')||'Düşük enerjili temas; belirgin deformasyon öngörülmedi',note:'Parça düzeyinde benzetim; gerçek kırılma eşikleri ve iç hasar doğrulanmış değildir.'};
}
export function applyDamageVisual(heli,p){
 if(!heli.parts)return;const model=componentDamage(p),t=Math.max(0,p.ground?.elapsed??0),u=1-Math.exp(-t*5);
 for(const [id,g] of Object.entries(heli.parts)){const r=g.userData;if(r.restPosition)g.position.copy(r.restPosition);if(r.restScale)g.scale.copy(r.restScale);if(r.restRotation){const spin=id==='mainRotor'?g.rotation.y:id==='tailRotor'?g.rotation.z:null;g.rotation.copy(r.restRotation);if(id==='mainRotor')g.rotation.y=spin;if(id==='tailRotor')g.rotation.z=spin;}g.visible=true;const d=model.parts.find(q=>q.id===id);if(!d||!p.contact||!u)continue;
  const amount=d.severity*u,ring=Math.exp(-t*3.2)*Math.sin(t*17),settle=amount*(1-.18*Math.exp(-t*4)*Math.cos(t*13));
  if(id==='tailBoom'||id==='stabilizer'||id==='fin')g.rotation.z+=d.severity*.06*ring;
  if(id==='skidLeft'||id==='skidRight'){const side=id==='skidLeft'?-1:1;g.position.z+=side*.1*d.severity*Math.max(0,Math.sin(Math.min(t,.5)*Math.PI/.5))*(1-u*.5);g.rotation.x=side*.08*d.severity*ring;}
  if(id.startsWith('skid')){g.scale.y=1-.35*amount;g.position.z+=(id==='skidLeft'?-1:1)*.18*amount;}
  if(['cabin','cockpit','engine','transmission'].includes(id)){g.scale.y=1-.14*amount;g.rotation.z=.06*amount*(id==='cockpit'?-1:1);}
  if(['tailBoom','stabilizer','fin'].includes(id)){g.rotation.z=.09*amount;g.position.y-=.2*amount;}
  if(id==='mast'||id==='controls')g.rotation.z=.14*amount;
  if(d.detach&&id==='tailBoom'){
   // separation: the boom first pivots down about its attachment, then breaks free, drops and slews aside
   const t1=Math.min(1,t/.35),t2=Math.max(0,Math.min(1,(t-.3)/1.1)),e2=1-Math.pow(1-t2,3);
   g.rotation.z=-.16*t1+(.10)*e2;g.rotation.y=.42*e2;g.rotation.x=.22*e2;g.position.x-=2.4*e2;g.position.y-=1.55*e2+.15*t1;g.position.z+=1.1*e2;}
  if(d.detach&&id==='mainRotor'){for(const name of ['bladeLeft','bladeRight']){const blade=heli.parts[name];if(blade){blade.rotation.z=(name==='bladeLeft'?-1:1)*.28*u;blade.position.y=-.35*u;}}}
  if(d.detach&&id==='tailRotor'){g.scale.y=1-.65*u;g.rotation.x=.4*u;}
 }
 {const bl=model.parts.find(q=>q.id==='blades'),rpmNow=p.ground?.rotorRpm??p.contact?.rotorRpm??324,slow=Math.max(0,1-rpmNow/324);
  for(const name of ['bladeLeft','bladeRight']){const b=heli.parts[name];if(!b||!p.contact||!bl)continue;const dir=name==='bladeLeft'?-1:1;b.rotation.z+=dir*(slow*.16+bl.severity*.2*u)+dir*bl.severity*.05*Math.exp(-t*2)*Math.sin(t*21);}}
 {const gl=model.parts.find(q=>q.id==='glazing'),mat=heli.materials?.[3];if(mat){mat.userData.baseOpacity??=mat.opacity;const sv=gl&&p.contact?gl.severity*u:0;mat.opacity=mat.userData.baseOpacity+(.82-mat.userData.baseOpacity)*Math.min(1,sv*1.6);}}
 // Re-apply blade bends after their own rest transform reset (stable rewind).
 const main=model.parts.find(q=>q.id==='mainRotor');if(main?.detach)for(const name of ['bladeLeft','bladeRight']){const b=heli.parts[name];if(b){b.rotation.z=(name==='bladeLeft'?-1:1)*.28*u;b.position.y=-.35*u;}}
 {const boom=model.parts.find(q=>q.id==='tailBoom');if(boom?.detach&&p.contact&&t>.3){heli.tail.userData.frozenSpin??=heli.tail.rotation.z;heli.tail.rotation.z=heli.tail.userData.frozenSpin;}else if(heli.tail)heli.tail.userData.frozenSpin=undefined;}
 if(heli.debris){const struck=model.parts.find(q=>q.detach&&['mainRotor','tailRotor','tailBoom'].includes(q.id));for(let i=0;i<heli.debris.children.length;i++){const f=heli.debris.children[i];f.visible=!!struck&&t>.04;if(f.visible){const boom=struck.id==='tailBoom',tail=struck.id==='tailRotor',d=Math.min(t,1.4),x0=boom?-2.6:tail?-8.95:-.3,y0=boom?2.3:tail?3.75:4.15;f.position.set(x0+(i-1.5)*d*(boom?1:2),Math.max(.1,y0-4.9*d*d),(tail?-.48:0)+(i%2?1:-1)*d*(boom?1.6:1));f.rotation.set(d*(i+1),d*2,d*.8);}}}
 if(heli.dust){const energy=(p.ground?.mechanics?.water?0:(p.contact?.descentMps??0)**2)+Math.pow((p.contact?.groundSpeedMps??0)*.22,2),strength=Math.min(1,energy/36);for(let i=0;i<heli.dust.length;i++){const d=heli.dust[i],age=t-i*.035;d.visible=!!p.contact&&!p.ground?.mechanics?.water&&age>0&&age<3.2&&strength>.04;if(d.visible){const a=i*2.399,r=(.6+age*2.2)*strength;d.position.set(Math.cos(a)*r,.15+age*.5,Math.sin(a)*r);d.scale.setScalar((.2+age*.6)*strength);d.material.opacity=.18*strength*Math.max(0,1-age/3.2);}}}
 if(heli.splash)for(let i=0;i<heli.splash.length;i++){const m=heli.splash[i],age=t-i*.18;m.visible=!!p.ground?.mechanics?.water&&age>0&&age<3;if(m.visible){m.scale.setScalar(.6+age*3);m.position.y=.1+Math.min(1.8,t*.45);m.material.opacity=.5*(1-age/3);}}
 /* v0.38 hardest contact: the supplied crashed airframe replaces the intact one once the first impact has played out */
 if(heli.wreck){const on=!!p.contact&&!!model.wreck&&t>.2&&heli.loaded!==false&&!heli.noWreck;heli.wreck.visible=on;heli.wreckOn=on;
  if(on){for(const g of Object.values(heli.parts))g.visible=false;for(const m of heli.debris?.children??[])m.visible=false;if(heli.damageMarks)for(const m of heli.damageMarks)m.visible=false;return model;}}
 if(heli.damageMarks){const severity=Math.max(...model.parts.filter(q=>['cabin','cockpit'].includes(q.id)).map(q=>q.severity),0);for(const m of heli.damageMarks)m.visible=t>.04&&severity>.35;}
 return model;
}
