// Procedural UH-1H-style sound (Web Audio). No external recordings: everything is synthesized
// from the current flight state, so it follows rotor RPM, speed, power, collective and descent.
// Replaceable by licensed recordings later. Not a measured acoustic model.
const BLADES=2,NOMINAL_RPM=324;
export function soundInputs(flight,power){
 const rotor=power?.rotor?.rpm??NOMINAL_RPM,engine=power?.engine?.rpm??6600;
 const ground=flight?.ground;
 return {
  rotorRpm:ground?.rotorRpm??(flight?.program?flight.rotorRpm:null)??rotor,
  engineRpm:ground?.engineRpm??(flight?.program?flight.engineRpm:null)??engine,
  stall:flight?.program?.id==='compressor-stall'&&(flight.program.vibration??0)>0&&!flight?.contact,vib:flight?.contact?0:(flight?.program?.vibration??0),etl:flight?.contact?0:(flight?.program?.etl??0),
  iasKt:Math.max(0,flight?.iasKt??0),
  descentFpm:flight?.descentFpm??0,
  heightFt:flight?.heightAglFt??0,
  collective:flight?.controls?.collective??.5,
  powerFraction:flight?.availablePowerFraction??1,
  contact:!!flight?.contact,
  groundSpeedKt:flight?.groundSpeedKt??0,
  unsupported:flight?.quality==='unsupported'
 };
}
export function soundTargets(i){
 const nr=Math.max(0,i.rotorRpm)/NOMINAL_RPM,bladeHz=BLADES*i.rotorRpm/60;
 const forward=Math.min(1,i.iasKt/80),descending=Math.max(0,Math.min(1,i.descentFpm/2000));
 const slap=Math.max(.25,Math.min(1,.35+.45*forward+.35*descending*(i.heightFt<400?1:.5)+.2*Math.max(0,i.collective-.6)));
 const powered=Math.max(0,Math.min(1,i.powerFraction));
 // TM 55-1520-210-10 §2-85: audio with the light only when rotor 300–310 AND engine 6100–6300 RPM are both low; high RPM is light-only
 const lowRpm=i.rotorRpm<=305&&i.rotorRpm>5&&(i.engineRpm??6600)<=6200&&!i.contact,highRpm=false;
 return {
  bladeHz,rate:bladeHz/10.8,slap:slap*Math.min(1,nr*1.1)*(i.contact&&i.groundSpeedKt<1?.45:1),
  tailHz:55*nr,tail:Math.min(1,nr)*.5*(.6+.4*powered),
  whineHz:520+330*Math.min(1.1,i.engineRpm/6600),whine:.035*Math.min(1,i.engineRpm/6600)*(.25+.75*powered),
  wind:Math.min(1,i.iasKt/90)*.35+Math.max(0,Math.min(1,i.descentFpm/2500))*.2,
  alarm:lowRpm||highRpm,alarmHz:highRpm?1400:900
 };
}
export class HeliAudio{
 constructor(){this.ctx=null;this.enabled=true;this.armed=false;this.alarmWasOn=false;this.lastContact=false;this.listeners=[];}
 arm(){
  if(this.armed)return;this.armed=true;
  const start=()=>{try{this.init();}catch(e){this.failed=true;}};
  for(const ev of ['pointerdown','keydown','touchstart'])window.addEventListener(ev,start,{once:true,capture:true});
 }
 init(){
  if(this.ctx||this.failed)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC){this.failed=true;return;}
  const c=this.ctx=new AC(),sr=c.sampleRate;
  this.master=c.createGain();this.master.gain.value=0;
  const comp=c.createDynamicsCompressor();this.master.connect(comp);comp.connect(c.destination);
  // blade-slap: one blade passage at nominal 10.8 Hz, looped with variable rate
  const len=Math.round(sr/10.8),buf=c.createBuffer(1,len,sr),d=buf.getChannelData(0);let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647*2-1;};
  for(let n=0;n<len;n++){const t=n/sr;const thump=Math.sin(2*Math.PI*62*t)*Math.exp(-t*38)*.9;const crack=rnd()*Math.exp(-t*210)*.8;const body=Math.sin(2*Math.PI*118*t)*Math.exp(-t*60)*.35;d[n]=thump+crack+body;}
  this.slapSrc=c.createBufferSource();this.slapSrc.buffer=buf;this.slapSrc.loop=true;
  this.slapGain=c.createGain();this.slapGain.gain.value=0;
  const slapLP=c.createBiquadFilter();slapLP.type='lowpass';slapLP.frequency.value=2400;this.slapLP=slapLP;
  this.slapSrc.connect(slapLP);slapLP.connect(this.slapGain);this.slapGain.connect(this.master);this.slapSrc.start();
  // noise source shared by wind/rotor wash
  const nl=sr*2,nb=c.createBuffer(1,nl,sr),nd=nb.getChannelData(0);for(let n=0;n<nl;n++)nd[n]=rnd();
  const noise=c.createBufferSource();noise.buffer=nb;noise.loop=true;
  const wash=c.createBiquadFilter();wash.type='bandpass';wash.frequency.value=700;wash.Q.value=.6;this.washGain=c.createGain();this.washGain.gain.value=0;
  noise.connect(wash);wash.connect(this.washGain);this.washGain.connect(this.master);noise.start();this.wash=wash;
  // tail rotor buzz
  this.tailOsc=c.createOscillator();this.tailOsc.type='sawtooth';this.tailOsc.frequency.value=55;
  const tailBP=c.createBiquadFilter();tailBP.type='bandpass';tailBP.frequency.value=420;tailBP.Q.value=.9;this.tailGain=c.createGain();this.tailGain.gain.value=0;
  this.tailOsc.connect(tailBP);tailBP.connect(this.tailGain);this.tailGain.connect(this.master);this.tailOsc.start();
  // turbine whine
  this.whineOsc=c.createOscillator();this.whineOsc.type='sine';this.whineOsc.frequency.value=1400;this.whineGain=c.createGain();this.whineGain.gain.value=0;
  const whine2=c.createOscillator();whine2.type='triangle';whine2.frequency.value=2800;const w2g=c.createGain();w2g.gain.value=.08;this.whine2=whine2;
  this.whineOsc.connect(this.whineGain);whine2.connect(w2g);w2g.connect(this.whineGain);const whineLP=c.createBiquadFilter();whineLP.type='lowpass';whineLP.frequency.value=800;this.whineGain.connect(whineLP);whineLP.connect(this.master);this.whineOsc.start();whine2.start();
  // low/high RPM alarm
  this.alarmOsc=c.createOscillator();this.alarmOsc.type='square';this.alarmOsc.frequency.value=900;const alp=c.createBiquadFilter();alp.type='lowpass';alp.frequency.value=2200;
  this.alarmGain=c.createGain();this.alarmGain.gain.value=0;this.alarmOsc.connect(alp);alp.connect(this.alarmGain);this.alarmGain.connect(c.destination);this.alarmOsc.start();
  this.noiseBuf=nb;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)c.suspend?.();else c.resume?.();});
 }
 setEnabled(v){this.enabled=!!v;}
 /* v0.35 compressor stall: sharp bang (bleed-band / burner pop) */
 bang(s=1){const c=this.ctx;if(!c||!this.enabled||c.state!=='running')return;const t=c.currentTime;
  const src=c.createBufferSource();src.buffer=this.noiseBuf;const hp=c.createBiquadFilter();hp.type='bandpass';hp.frequency.value=900+Math.random()*900;hp.Q.value=.7;const g=c.createGain();g.gain.setValueAtTime(1.1*s,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);
  src.connect(hp);hp.connect(g);g.connect(this.master);src.start(t,Math.random(),.3);
  const o=c.createOscillator();o.type='triangle';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(45,t+.15);const og=c.createGain();og.gain.setValueAtTime(.8*s,t);og.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(og);og.connect(this.master);o.start(t);o.stop(t+.22);}
 impact(strength){
  const c=this.ctx;if(!c||!this.enabled||c.state!=='running')return;const t=c.currentTime,s=Math.max(.15,Math.min(1,strength));
  const src=c.createBufferSource();src.buffer=this.noiseBuf;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=260+700*s;const g=c.createGain();g.gain.setValueAtTime(.9*s,t);g.gain.exponentialRampToValueAtTime(.001,t+.5+.5*s);
  src.connect(f);f.connect(g);g.connect(this.master);src.start(t,Math.random(),1.2);
  const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(38,t+.4);const og=c.createGain();og.gain.setValueAtTime(.9*s,t);og.gain.exponentialRampToValueAtTime(.001,t+.45);o.connect(og);og.connect(this.master);o.start(t);o.stop(t+.5);
 }
 update(inputs,playing){
  {const c=this.ctx;if(c&&c.state==='running'){const t=c.currentTime;if(inputs.stall&&playing&&this.enabled&&t>(this.nextBang??0)){this.bang(.6+Math.random()*.4);this.nextBang=t+.18+Math.random()*.55;}
   if(!this.rumble){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=19;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=140;const g=c.createGain();g.gain.value=0;o.connect(lp);lp.connect(g);g.connect(this.master);o.start();this.rumble=g;this.rumbleOsc=o;}
   if(this.rumbleOsc){const bp=Math.max(4,(inputs.rotorRpm??324)/60*2);{const v=(inputs.etl??0)>.05?bp:19,P=this.rumbleOsc.frequency;if(Math.abs((P._lv??-1)-v)>.05){P._lv=v;P.setTargetAtTime(v,t,.2);}}} /* v0.35.7 ETL: blade-passage beat */{const v=playing&&this.enabled?Math.min(.35,(inputs.vib??0)*.4):0,P=this.rumble.gain;if(Math.abs((P._lv??-1)-v)>.002){P._lv=v;P.setTargetAtTime(v,t,.15);}}}}
  const c=this.ctx;if(!c)return;if(c.state==='suspended'&&!document.hidden)c.resume?.();
  const on=this.enabled&&playing&&!inputs.unsupported,t=c.currentTime,k=.08,g=soundTargets(inputs);
  /* v0.39 çatırtı: her karede yeni otomasyon olayı birikiyordu; değer değişmedikçe yeni hedef yazılmaz */
  const set=(p,v)=>{if(!Number.isFinite(v))return;const lv=p._lv;if(lv!==undefined&&Math.abs(lv-v)<=1e-3*(Math.abs(v)+.05))return;p._lv=v;p.setTargetAtTime(v,t,k);};
  set(this.master.gain,on?.9:0);
  /* v0.33.1: a slowly spinning rotor after touchdown stretched the looped slap into a crackle - fade it out with RPM and darken it */
  const slow=Math.max(0,Math.min(1,(g.rate-.2)/.4));set(this.slapSrc.playbackRate,Math.max(.2,g.rate));set(this.slapGain.gain,g.slap*1.9*slow);set(this.slapLP.frequency,(400+2100*g.slap)*(.35+.65*slow));
  set(this.tailOsc.frequency,Math.max(10,g.tailHz));set(this.tailGain.gain,g.tail*.09);
  set(this.whineOsc.frequency,g.whineHz);set(this.whine2.frequency,g.whineHz*2.01);set(this.whineGain.gain,g.whine);
  set(this.washGain.gain,g.wind*.5+g.slap*.08);set(this.wash.frequency,500+900*g.wind);
  const alarmNow=on&&g.alarm&&!inputs.contact; /* v0.39 yerde (motor susturma, rotor yavaşlarken) düşük RPM kornası susturulur: LOW RPM AUDIO yerde OFF */
  if(alarmNow){const beat=Math.floor(t*3.5)%2===0;this.alarmGain.gain._lv=undefined;this.alarmGain.gain.setTargetAtTime(beat?.16:0,t,.015);set(this.alarmOsc.frequency,g.alarmHz);}else set(this.alarmGain.gain,0);
  if(inputs.contact&&!this.lastContact&&on)this.impact(Math.min(1,Math.abs(inputs.descentFpm)/1500+.15));
  this.lastContact=inputs.contact;
 }
}
