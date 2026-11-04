import {terminalEnvelope} from './terminal-control.js';
// Deterministic, state-feedback local decision model. No LLM or learned aircraft policy.
// All thresholds are experimental controller settings, not operational instructions.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Glide-entry speed target. TR Uçuş Hareketleri (Alçak İrtifa Otorotasyonu): low and fast, hold height with aft
// cyclic until the glide profile is intercepted instead of diving; high enough, settle at the min-sink glide speed.
export function glideSpeedKt(s,p){
 const X=globalThis.EXP??{},hFt=Math.max(0,s.y)/.3048,ias=(s.v??p.ias*(1852/3600)*p.tasFactor)/(1852/3600)/p.tasFactor,glide=X.glideKt??80;
 // Low rotor RPM with height in hand: no acceleration; a little aft cyclic loads the disk (DCS UH-1H §9.7A a).
 const ratio=s.omega&&p.rpm?s.omega*30/Math.PI/p.rpm:1;if(!p.groundHold&&ias>=40&&ratio<(X.lowRatio??.9)&&hFt>60)return Math.max(45,Math.min(glide,ias)-(X.loadKt??4));
 if(p.groundHold||ias<40)return glide;
 // v0.32.2: very low and fast (TR alçak irtifa otorotasyonu): trade speed for time with aft cyclic from entry.
 const lowKt=X.noLow||p.height>(X.lowFt??90)*.3048?null:(X.lowKt??30),lowFt=X.lowFt??90,hold=lowKt==null?Math.min(ias,glide):Math.min(ias,glide,lowKt+(glide-lowKt)*clamp((hFt-40)/(lowFt-40),0,1)),lo=X.holdBelowFt??150,hi=X.glideAboveFt??350,entryFt=p.height!=null&&X.entryBlend?p.height/.3048:hFt,k=clamp((entryFt-lo)/(hi-lo),0,1); // low and fast: no dive below ~150 ft (TR alçak irtifa); entry-height blend kept as an option (EXP.entryBlend)
 return hold+(glide-hold)*k;
}
// v0.33: engine failure from a hover. Close to the ground the hover is held and cushioned (havır otorotasyonu); higher up the
// nose is lowered to build airspeed so that a normal glide and flare are possible (H-V: above the high-hover point).
export function hoverEntryKt(p){const X=globalThis.EXP??{},ft=p.height/.3048;return clamp((ft-(X.hoverBaseFt??25))*(X.hoverSlope??.25),0,X.glideKt??63);}
export function landingPolicy(s,p,sink,{terminal='timed',enabled=true,flareMode='adaptive',cyclicMode='coordinated',holdFlareWhileFast=false,governor=false}={}){
 const h=Math.max(0,s.y),w=Math.max(0,s.w),ratio=s.omega/(p.rpm*Math.PI/30);
 const hover=p.groundHold&&p.height<=6.096;
 const airSpeed=s.v??0,brakeAccel=3.5;
 const flareHeight=p.bladeLaws?(globalThis.EXP?.bladeFlareM??48)+Math.min(6,Math.max(0,w-9)*1.2):globalThis.EXP?.oldFlare?30.48+Math.min(6,w*.4):30.48+clamp((w-10)*(globalThis.EXP?.flareRodGain??0),-4,14)+Math.min(6,w*.4)+Math.max(0,sink/(globalThis.EXP?.sink0??9.6)-1)*(globalThis.EXP?.flareSinkM??0); // ~100 ft actual onset after control response; v0.33: earlier with weight / density altitude (TR: fleyır oranı yük ve yoğunluk irtifasına göre)
 const delayedFlareHeight=p.bladeLaws?(globalThis.EXP?.bladeLateM??34)+Math.min(6,w*.4):22.86+Math.min(7,w*.6); // user-selected ~75 ft onset
 const envelope0=terminalEnvelope(s,p),envelope=governor&&p.crew?{...envelope0,brakeHeightM:envelope0.brakeHeightM*p.crew.cushionScale}:envelope0;
 const fastLevel=!globalThis.EXP?.noFastLevel&&airSpeed>(globalThis.EXP?.cushFast??13)&&w<.6&&h>1.2; // v0.33: still fast and not sinking near the ground: keep decelerating level, cushion later
 const cushion=enabled&&terminal!=='hold'&&(s.cushionActive||(terminal!=='pending'&&!(fastLevel&&terminal!=='now'&&terminal!=='early')&&(terminal==='early'||terminal==='now'||(hover&&w>.1)||h<(terminal==='late'?1.2:envelope.brakeHeightM))));
 const lateFlareWindow=flareMode==='late'&&h>4.8&&airSpeed>5&&terminal!=='early'&&terminal!=='now';
 const fastSkimming=holdFlareWhileFast&&airSpeed>8&&h>1.5&&flareMode==='adaptive'; // keep the flare attitude while still fast; level only near the ground
 const levelCyclic=!hover&&(cyclicMode==='now'||(cyclicMode==='coordinated'&&cushion&&!lateFlareWindow&&!fastSkimming));
 const holdCyclic=cyclicMode==='hold';
 const flare=enabled&&!['omit','pending'].includes(flareMode)&&!hover&&!levelCyclic&&!holdCyclic&&(s.flareActive||h<(flareMode==='late'?delayedFlareHeight:flareHeight)*(governor?(p.crew?.flareScale??1):1));
 const B=p.collectiveBias??0;let collective=hover?1:clamp(.45+B+.25*w/Math.max(1,sink)+1.4*(ratio-1),.3,.85+B);
 let speedKt=p.groundHold?Math.max(p.ias,Math.min(glideSpeedKt(s,p),hoverEntryKt(p))):glideSpeedKt(s,p),phase='Rotor enerjisi yönetimi',reason='Kollektif, alçalma akışı ve rotor devrine göre düzenleniyor.';
 const X=globalThis.EXP??{},gov=X.gov??.09,govStart=X.govStart??328,govMax=X.govMax??1.8;
 if(flare){collective=Math.max(collective,.7+B,(governor&&ratio*p.rpm>govStart?Math.min(govMax,.7+B+gov*(ratio*p.rpm-govStart)):0));speedKt=Math.min(p.ias,3);phase='Fleyır · sürat ve alçalışı azaltma';reason='Kalan yükseklik, düşey hız ve ileri enerji fleyır başlattı; disk eğimi frenleme işini rotor enerji hesabına taşıyor.';}
 if(cushion){
  const targetW=clamp(Math.sqrt(h)*(globalThis.EXP?.twGain??1.2),.35,globalThis.EXP?.twCap??2.2),usable=Math.max(.25,h-w*(.35+Math.max(0,1.5-(s.collective??.7))/1.2));
  // Sinking slower than the target (or climbing): let it settle instead of holding height on rotor energy (TR: no float).
  const a=w<targetW?-clamp((targetW-w)*(globalThis.EXP?.sinkGain??1.2),0,2.5):clamp((w*w-targetW*targetW)/(2*usable),0,5);
  collective=clamp((1+a/9.80665)/Math.max(.15,ratio*ratio),a<0?(globalThis.EXP?.cushionFloor??.55)+B:1,terminal==='early'?1.8:2.2);
  // During the final descending arrest, do not reverse the pull as RPM/inflow changes.
  if(h<=4.8&&w>0)collective=Math.max(collective,s.collective??1);
  speedKt=hover?p.ias:Math.max(0,Math.min(airSpeed/(1852/3600)/p.tasFactor,8));
  phase=(holdCyclic?'Saykılık tutuluyor / ':levelCyclic?'Ufkiyet / ':'')+'son kollektif · temas yumuşatma';reason='Kalan mesafe ve kumanda tepki süresine göre kollektif uygulanıyor; rotor enerjisi tüketiliyor. '+(holdCyclic?'Saykılık konumu tutulduğu için ufkiyet otomatik tesis edilmiyor.':'Saykılık ufkiyet talebiyle birlikte hesaplanıyor.');
 }
 const targetDescent=Math.sqrt(1+1.1*h);
 const flareTime=Math.max(1.2,(h-4.6)/Math.max(w,1)),neededDecel=(Math.max(0,airSpeed)-3)/flareTime;
 // TR (alçak irtifa otorotasyonu, hata b): excessive aft cyclic that makes the helicopter climb wastes the
 // collective needed at contact — when the sink is gone (or reversing) the deceleration demand is eased.
 const balloon=globalThis.EXP?.noBalloon?1:clamp(1+(s.w-(globalThis.EXP?.balloonW??.8))/(globalThis.EXP?.balloonSpan??2.5),.3,1);
 const flareAccel=globalThis.EXP?.timedFlare?clamp((neededDecel+(globalThis.EXP.kSink??.3)*Math.max(0,w-targetDescent))*balloon,.6,5):clamp(Math.max(1.8+.8*(w-targetDescent),neededDecel)*balloon,balloon<1?.6:1.2,5); // authority also covers the speed still to be removed before ~15 ft
 // energy-2.0 profile flare (TR Standart Otorotasyon: ~100 ft'te başla, sürekli yavaşla, 15 ft'te en az alçalış ve sürat):
 // a descent schedule w*(h) is held with collective while aft cyclic removes the speed by the 15 ft gate.
 let profile=null;
 if(p.bladeLaws&&flare&&!cushion){const X=globalThis.EXP??{},hg=Math.max(.3,h-(X.gateM??4.6)),wd=(X.wGate??2.6)+(X.wSpan??5)*clamp(hg/(X.hSpan??40),0,1),tg=Math.max(.8,hg/Math.max(1.5,(w+wd)/2)),vg=X.vGate??4.5;
  const a=clamp((airSpeed-vg)/tg,X.aMin??.4,X.aMax??4.2);profile={wd,a};
  collective=clamp(.7+B+(X.kW??.10)*(w-wd)*(1+.5*Math.max(0,1-hg/8)),(X.cFloor??.5)+B,(X.cMax??1.15));
  if(governor||true){const rpmNow=ratio*p.rpm;if(rpmNow>(X.govRpm??336))collective=Math.max(collective,.7+B+(X.govK??.03)*(rpmNow-(X.govRpm??336)));}}
 if(levelCyclic&&!cushion){phase='Saykılık · ufkiyete erken geçiş';reason='Seçilen ileri saykılık düzeltmesi disk eğimini azaltıyor; fleyır frenlemesi sonlandırılıyor.';}
 if(holdCyclic&&!cushion){phase='Saykılık · mevcut konum tutuluyor';reason='Seçilen saykılık konumu korunuyor; disk eğimi otomatik ufkiyet talebi almıyor.';}
 if(terminal==='hold'&&!cushion){phase='Son kollektif ertelendi · mevcut hatve talebi';reason='Son fırsatta da kollektif uygulanmaması seçildi; otomatik temas yumuşatma yapılmıyor.';collective=s.collective??collective;}
 return {collective,speedKt,flare,cushion,phase,reason,flareAccel:profile?profile.a:flareAccel,levelCyclic,holdCyclic,flareHeightM:flareHeight,...envelope};
}
export function adaptivePilot(s,p,sink){
 const rpm=s.omega*30/Math.PI,h=Math.max(0,s.y),ttg=h/Math.max(.5,s.w);
 const v=s.v??0,hover=p.groundHold&&p.height<=6.096;
 const plan=landingPolicy(s,p,sink,{holdFlareWhileFast:true,governor:true});
 // Hazard avoidance takes precedence only while time and height permit it.
 if(!plan.cushion&&!hover&&h>15&&ttg>3&&rpm<p.rpm*.88){return {...plan,collective:Math.max(.3,(globalThis.EXP?.recCol??.4)+(p.collectiveBias??0)),flare:false,cushion:false,speedKt:Math.max(30,p.ias),phase:'Uyarlanabilir pilot · rotor enerjisini kurtarma',reason:'Düşük rotor devri ve kullanılabilir yükseklik nedeniyle iniş yumuşatma ertelendi; kollektif yükü azaltıldı.'};}
 if(!plan.cushion&&p.powerFraction>0&&v<5&&s.w>2&&h>15){return {...plan,collective:.55+(p.collectiveBias??0),flare:false,cushion:false,speedKt:30,phase:'Uyarlanabilir pilot · düşük süratli alçalıştan çıkış',reason:'Artık güç altında düşük hava sürati ve alçalma birlikte; yatay hava sürati kazanma seçildi.'};}
 if(!plan.cushion&&rpm>330){const B=p.collectiveBias??0;plan.collective=Math.max(plan.collective,clamp(.75+B+(rpm-330)*.025,.75+B,1.15+B));plan.reason+=' Yüksek rotor devri için hatve yüklemesi uygulanıyor.';}
 return {...plan,phase:'Uyarlanabilir pilot · '+plan.phase};
}
