import {liveFlightState} from './flight-reference.js';
import {terrainHeight as liveTerrainHeight} from './terrain-data.js';
// v0.35 3D cockpit of the AB-205 (J-4489): instrument panel, glareshield, pedestal, overhead console, circuit breakers,
// cyclic, collective (with switch box and twist-grip throttle), pedals, seats and the cabin frame.
// Panels are the user's photos (rectified); every instrument face is drawn live over its photo position and every
// switch, knob, button and circuit breaker is a 3D part that can be clicked and is moved by the procedures.
import * as T from './vendor/three.module.js';
import {areaElevationM} from './terrain-data.js';
import {torquePsi} from './performance.js';
import {FACES,needleShape,scaleAngle,canvas,drawADI,drawTurn,drawCDI,drawRMI,drawAltDrum,drawCompass,FONT} from './cockpit-gauges-draw.js';
import {fromModel,ctlToRuntime,COCKPIT_REF} from './scene-model.js';
/* v0.38: the cockpit is the supplied Jandarma model's own cockpit (shell, seats, pedestal, panel body, sticks); this module
   adds our working parts to it: the photo-layout live instruments, warning lights and switches on the model's panel face,
   the misc switch panel, the pedestal radios and caution panel on the model's pedestal top, the overhead console under
   its roof and our collective switch box on the supplied right collective. The model itself is not reshaped. */
const R=Math.PI/180,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const EYE=COCKPIT_REF.eye.clone();          // right seat: the supplied pilot's eye point
const FLOOR=COCKPIT_REF.floorY;
/* panel face of the supplied model: x=-7.18-.25(y+.80) (supplied axes), |z|<.62; the photo layout (u .03–.94) is
   scaled to its width and centred on it */
const PW=1.276,PH=PW*1360/4096,FACE_X=y=>COCKPIT_REF.panelFace.x0-COCKPIT_REF.panelFace.k*(y-COCKPIT_REF.panelFace.y0),FACE_Y=-.557;
const PANEL_N=new T.Vector3(-1,COCKPIT_REF.panelFace.k,0).normalize(),PANEL_C=fromModel(FACE_X(FACE_Y),FACE_Y,-.0185).addScaledVector(PANEL_N,.004);
const ASSET='assets/cockpit/';
const GAUGES={fuelPress:[.41151,.27577,.02202],fuelQty:[.47022,.27577,.02202],rpm:[.61437,.34208,.03355],ias:[.70662,.34839,.0304],adi:[.80884,.34681,.04613],alt:[.91052,.34839,.03145],vsi:[.89794,.59309,.03145],adf:[.7973,.63413,.02831],turn:[.70348,.84883,.02411],cdi:[.79625,.85199,.02935],clock:[.89794,.80937,.02202],torque:[.61751,.55994,.02097],n1:[.61804,.7178,.02097],egt:[.61961,.86778,.02097],engOilP:[.4178,.43522,.02097],engOilT:[.47651,.43522,.02097],xmsnOilP:[.42566,.58677,.02097],xmsnOilT:[.48175,.58677,.02097],mainLoad:[.42304,.74464,.01677],dcVolt:[.48804,.75096,.02306],stbyLoad:[.42829,.87094,.01677],acVolt:[.49381,.89935,.02306],c_ias:[.07051,.3228,.03974],c_adi:[.16538,.3228,.04359],c_alt:[.26795,.32859,.03974],c_rmi:[.19038,.60274,.03846],c_vsi:[.28654,.60274,.03974]};
// p-1 photo (110 dpi) pixel -> panel uv
const p1=(x,y)=>[(x*2.7257+1900)*.78769/4096,(y*2.7257-420-126.67)*.78769/1360];
/* ---------- control catalogue: id -> {panel,u,v,type,pos:[labels],angles,name,desc,...} ---------- */
const TOG=(panel,u,v,name,pos,o={})=>({panel,u,v,type:'toggle',name,pos,...o});
const KNOB=(panel,u,v,name,pos,o={})=>({panel,u,v,type:'knob',name,pos,...o});
const BTN=(panel,u,v,name,o={})=>({panel,u,v,type:'button',name,pos:['',''],...o});
export const CONTROLS={
 // instrument panel
 compassSlave:TOG('panel',...p1(338,763),'COMPASS SLAVING',['IN','OUT'],{desc:'Pusula köleleme: IN normal (manyetik ayarlı), OUT serbest jiroskop.'}),
 codeHold:TOG('panel',...p1(388,640),'IFF CODE HOLD',['ON','OFF'],{def:1,desc:'Mod 4 kodunu iniş sonrası tutar.'}),
 fireTest:BTN('panel',...p1(521,263),'FIRE DETECTOR TEST',{desc:'Basılı tutulduğunda FIRE ikaz ışığı yanar (yangın ihbar sistemi testi).'}),
 fuelTest:BTN('panel',...p1(258,323),'FUEL GAUGE TEST',{desc:'Basılı tutulduğunda yakıt miktar göstergesi düşer; bırakınca geri döner.'}),
 // miscellaneous panel (below the instrument panel)
 chipDet:TOG('misc',.165,.6,'CHIP DET',['XMSN','BOTH','TAIL ROTOR'],{def:1,desc:'Metal parçacık ihbar seçici: BOTH normal; ışık yanarsa XMSN / TAIL ROTOR ile kaynak bulunur.'}),
 hoist:TOG('misc',.43,.55,'HOIST CABLE CUT',['CUT','NORM'],{def:1,guard:'#9b2a22',desc:'Kurtarma vinci kablo kesme (kapaklı).'}),
 forceTrim:TOG('misc',.6,.57,'FORCE TRIM',['ON','OFF'],{desc:'Kumanda kuvvet trim sistemi.'}),
 hydCont:TOG('misc',.86,.5,'HYD CONT',['ON','OFF'],{tip:'#c22b25',desc:'Hidrolik kontrol: ON normal. Hidrolik arızası / servo sıkışmasında usule göre OFF.'}),
 // pedestal
 cautionTest:TOG('ped',.595,.022,'CAUTION RESET / TEST',['RESET','','TEST'],{def:1,spring:1,desc:'TEST: tüm ikaz segmentleri yanar; RESET: MASTER CAUTION söndürülür.'}),
 cautionDim:TOG('ped',.59,.12,'CAUTION BRIGHT / DIM',['BRIGHT','DIM']),
 lowRpmAudio:TOG('ped',.575,.172,'LOW RPM AUDIO',['ON','OFF'],{desc:'Düşük RPM ikaz sesi (korna). Yerde OFF, uçuşta ON.'}),
 fuel:TOG('ped',.75,.178,'FUEL (MAIN)',['ON','OFF'],{guard:'#b02a24',desc:'Ana yakıt valfi. Emercensi motor susturmada OFF.'}),
 auxL:TOG('ped',.575,.265,'INT AUX FUEL LEFT',['ON','OFF'],{def:1}),
 auxR:TOG('ped',.665,.265,'INT AUX FUEL RIGHT',['ON','OFF'],{def:1}),
 deice:TOG('ped',.745,.265,'DE-ICE',['ON','OFF'],{def:1,desc:'Motor giriş buz önleyici (bleed air). Kompresör stolünde OFF.'}),
 gov:TOG('ped',.92,.258,'GOV',['AUTO','EMER'],{guard:'#c22b25',desc:'Gavırnır: AUTO normal; EMER’de RPM gaz koluyla elle kontrol edilir.'}),
 ircm:TOG('ped',.2,.14,'IRCM',['ON','OFF'],{def:1}),
 adfMode:KNOB('ped',.075,.225,'ADF MODE',['OFF','ADF','ANT','LOOP'],{def:1}),
 adfTune:KNOB('ped',.39,.225,'ADF TUNE',['','','',''],{}),
 navPwr:KNOB('ped',.6,.33,'NAV-COMM PWR',['OFF','PWR'],{def:1}),
 icsL:KNOB('ped',.3,.48,'ICS (COPILOT)',['HOT MIC','NORM','VOX ON'],{def:1}),
 icsR:KNOB('ped',.79,.48,'ICS (PILOT)',['HOT MIC','NORM','VOX ON'],{def:1}),
 pressIndic:TOG('ped',.16,.59,'AUX FUEL PRESS INDIC',['MAN','AUT'],{def:1,tip:'#c22b25'}),
 tankRel:TOG('ped',.4,.6,'AUX TANK RELEASE',['REL','SAFE'],{def:1,guard:'#c22b25'}),
 auxPumpL:TOG('ped',.04,.66,'AUX FUEL PUMP L',['ON','OFF'],{def:1,tip:'#c25a25'}),
 auxPumpR:TOG('ped',.28,.66,'AUX FUEL PUMP R',['ON','OFF'],{def:1,tip:'#c25a25'}),
 fmMode:KNOB('ped',.6,.735,'FM RADIO MODE',['OFF','T/R','T/R+G','G','MAR','ADF','HAIL'],{def:1}),
 iffMaster:KNOB('ped',.89,.82,'IFF MASTER',['OFF','STBY','NORM','EMER'],{def:2,desc:'Transponder ana anahtarı. Emercensi durumunda EMER (7700).'}),
 iffM1:TOG('ped',.56,.845,'IFF M-1',['ON','OUT']),iffM2:TOG('ped',.63,.845,'IFF M-2',['ON','OUT']),iffM3:TOG('ped',.7,.845,'IFF M-3/A',['ON','OUT']),iffMC:TOG('ped',.77,.845,'IFF M-C',['ON','OUT']),
 iffIdent:TOG('ped',.94,.915,'IFF IDENT',['IDENT','OUT','MIC'],{def:1}),
 // overhead console
 pitotHtr:TOG('ovh',.335,.085,'PITOT HTR',['OFF','ON']),
 posLt:TOG('ovh',.11,.25,'POSITION STEADY / FLASH',['STEADY','OFF','FLASH'],{def:1}),posDim:TOG('ovh',.18,.255,'POSITION DIM / BRIGHT',['DIM','BRIGHT']),
 fusLt:TOG('ovh',.295,.255,'FUSELAGE LTS',['DIM','OFF','BRIGHT'],{def:1}),antiColl:TOG('ovh',.41,.255,'ANTI COLL',['OFF','ON'],{def:1}),
 wiperSel:TOG('ovh',.11,.40,'WIPER SEL',['PILOT','BOTH','COPILOT'],{def:1}),wipers:KNOB('ovh',.215,.41,'WIPERS',['PARK','OFF','LOW','MED','HIGH'],{def:1,big:1}),
 cargoRel:TOG('ovh',.37,.40,'CARGO REL',['OFF','ARM']),bleedAir:TOG('ovh',.16,.56,'BLEED AIR',['OFF','ON'],{desc:'Kabin ısıtma bleed air. Kompresör stolü / güç ihtiyacında OFF.'}),aftOutlet:KNOB('ovh',.345,.575,'AFT OUTLET',['OFF','1','2','3'],{big:1}),
 ltConsole:KNOB('ovh',.655,.11,'INST LTG CONSOLE',['OFF','MED','BRT'],{big:1,rheo:1}),ltPed:KNOB('ovh',.85,.11,'INST LTG PED',['OFF','MED','BRT'],{big:1,rheo:1}),
 ltSec:KNOB('ovh',.655,.27,'INST LTG SEC',['OFF','MED','BRT'],{big:1,rheo:1}),ltEngine:KNOB('ovh',.85,.27,'INST LTG ENGINE',['OFF','MED','BRT'],{big:1,rheo:1}),
 ltCopilot:KNOB('ovh',.655,.425,'INST LTG COPILOT',['OFF','MED','BRT'],{big:1,rheo:1}),ltPilot:KNOB('ovh',.85,.425,'INST LTG PILOT',['OFF','MED','BRT'],{big:1,rheo:1}),
 acPhase:KNOB('ovh',.655,.58,'AC PHASE',['AB','AC','BC'],{def:1,big:1}),invtr:TOG('ovh',.85,.575,'INVTR',['SPARE ON','OFF','MAIN ON'],{def:2,desc:'İnverter: MAIN ON normal; OFF iken AC aletler (ADI, tork, yakıt) çalışmaz.'}),
 mainGen:TOG('ovh',.615,.77,'MAIN GEN',['RESET','OFF','ON'],{def:2,guard:'#7a4a33',desc:'Ana jeneratör. Arızada RESET sonra ON; elektrik yangınında OFF.'}),vm:KNOB('ovh',.86,.77,'VOLTMETER SEL',['MAIN GEN','STBY GEN','ESS BUS','NON ESS BUS'],{def:2,big:1}),
 bat:TOG('ovh',.635,.885,'BAT',['OFF','ON'],{def:1,desc:'Batarya. Elektrik yangını / batarya aşırı ısınmasında OFF.'}),starterGen:TOG('ovh',.705,.885,'STARTER GEN',['START','STBY GEN'],{def:1}),nonEss:TOG('ovh',.85,.885,'NON-ESS BUS',['MANUAL ON','NORMAL ON'],{def:1}),
 // collective switch box (pilot)
 govRpm:TOG('col',.16,.58,'GOV RPM INCR / DECR',['INCR','','DECR'],{def:1,spring:1,desc:'Gavırnır RPM ayarı (6400–6600).'}),
 slOn:TOG('col',.22,.22,'SEARCH LIGHT',['ON','STOW','OFF'],{def:2}),ldgLt:TOG('col',.72,.22,'LANDING LIGHT',['ON','OFF'],{def:1}),
 ldgExt:TOG('col',.8,.58,'LDG LT EXT / RETR',['EXT','OFF','RETR'],{def:1}),idleStop:BTN('col',.8,.85,'ENGINE IDLE STOP REL',{desc:'Gaz kolunu rölantinin altına (kapalı) almak için basılır.'}),
};
// circuit breakers: overhead DC panel (procedural) + AC panel photo
const DC_CB=[['RPM WARN','SYSTEM'],['ANTI ICE','ENG'],['FIRE','DET'],['J 2 CMPS','IND'],['TURN &','SLIP IND'],['TEMP IND','ENG XMSN'],['HYD','CONT'],['FORCE','TRIM'],['GOV','CONT'],['IDLE STOP','REL'],
 ['LH FUEL','BOOST PUMP'],['FUEL','TRANSFER'],['RH FUEL','BOOST PUMP'],['FUEL','VALVE'],['STARTER','RELAY'],['IGN','SYS'],['CAUTION','LTS'],['PITOT','TUBE HTR'],['VOLT METER','NON ESS'],['GEN & BUS','RESET'],
 ['INVTR','MAIN PWR'],['INVTR','SPARE PWR'],['LDG LT','PWR'],['LDG & SRCH','LT CONT'],['SEARCH LT','PWR'],['POS','LTS'],['ANTI','COLL LT'],['DOME','LT'],['INST LTS','PILOT'],['INST LTS','COPILOT'],
 ['WIPERS','PILOT'],['WIPERS','COPILOT'],['CARGO HOOK','REL'],['RESCUE','HOIST PWR'],['CABLE','CUTTER'],['CABIN HTR','OUTLET VLV'],['CABIN HTR','AIR VALVE'],['VHF','COMM'],['VHF','NAV'],['FM','COMM'],
 ['ADF',''],['IFF',''],['ICS','PILOT'],['ICS','COPILOT'],['GPS',''],['HEATED','BLANKET'],['NON ESS','BUS'],['BAT','RELAY']];
const AC_CB=[['PILOT ATTD',.13,.17],['PILOT ATTD 2',.27,.17],['COPILOT ATTD',.41,.17],['COPILOT ATTD 2',.55,.17],['AC 115V SPARE',.685,.17],['AC 115V',.155,.47],['GYRO CMPS',.295,.47],['FUEL QTY',.43,.47],['28V TRANS',.565,.47],['FAIL RELAY',.705,.47],['FUEL PRESS',.155,.78],['TORQUE PRESS',.29,.78],['XMSN PRESS',.43,.78],['ENG PRESS',.565,.78],['COURSE IND',.705,.78]];
const CB_EFFECT={'RPM WARN SYSTEM':'rpmWarn','FIRE DET':'fireDet','J 2 CMPS IND':'cmps','TURN & SLIP IND':'turn','TEMP IND ENG XMSN':'temps','HYD CONT':'hydCb','FORCE TRIM':'ftCb','CAUTION LTS':'caution','LDG LT PWR':'ldg','PILOT ATTD':'adi','COPILOT ATTD':'cadi','GYRO CMPS':'cmps','FUEL QTY':'fuelQty','FUEL PRESS':'fuelPress','TORQUE PRESS':'torque','XMSN PRESS':'xmsnPress','ENG PRESS':'engPress','COURSE IND':'cdi'};
export const CB_LIST=[...DC_CB.map(([a,b],i)=>({id:'cb'+i,name:(a+' '+b).trim(),panel:'cb',i}))];
for(const c of CB_LIST)CONTROLS[c.id]={panel:c.panel,u:c.u,v:c.v,i:c.i,type:'cb',name:c.name,pos:['IN','OUT'],effect:CB_EFFECT[c.name],desc:'Devre kesici (sigorta): çekilince ilgili devre beslenmez.'};
export const CAUTION_SEG=[['eop','ENGINE OIL PRESS'],['auxlow','AUX FUEL LOW'],['eicing','ENGINE ICING'],['xop','XMSN OIL PRESS'],['eicedet','ENGINE ICE DET'],['xhot','XMSN OIL HOT'],['echip','ENGINE CHIP DET'],['hyd','HYD PRESSURE'],['lboost','LEFT FUEL BOOST'],['inlet','ENGINE INLET AIR'],['rboost','RIGHT FUEL BOOST'],['inv','INST INVERTER'],['efpump','ENG FUEL PUMP'],['gen','DC GENERATOR'],['m20','20 MINUTE FUEL'],['ext','EXTERNAL POWER'],['ffilter','FUEL FILTER'],['chip','CHIP DETECTOR'],['govemer','GOV EMER'],['iff','IFF']];
/* ---------- textures ---------- */
const loader=typeof document==='undefined'?null:new T.TextureLoader();
function photoCanvas(file,w,h,paint){const c=canvas(1);c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#262727';ctx.fillRect(0,0,w,h);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
 if(typeof Image!=='undefined'){const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0,w,h);paint?.(ctx,w,h);tex.needsUpdate=true;};img.src=ASSET+file;}return tex;}
function cbPanelTexture(){const w=1024,h=1300,c=canvas(1);c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#1d1f1f';x.fillRect(0,0,w,h);
 const cols=4,rows=12,cw=w/cols,rh=h/rows;x.strokeStyle='#d8d4c8';x.lineWidth=2;
 DC_CB.forEach(([a,b],i)=>{const cx=(i%cols)*cw,cy=Math.floor(i/cols)*rh;x.strokeRect(cx+6,cy+6,cw-12,rh-12);x.fillStyle='#e8e4d8';x.font=`600 22px ${FONT}`;x.textAlign='center';x.fillText(a,cx+cw/2,cy+32);x.font=`600 19px ${FONT}`;x.fillText(b,cx+cw/2,cy+rh-16);});
 for(let k=0;k<4;k++){x.fillStyle='#3a3c3c';x.beginPath();x.arc(14,14+k*h/3.2,6,0,7);x.fill();x.beginPath();x.arc(w-14,14+k*h/3.2,6,0,7);x.fill();}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
const cbPos=i=>[(i%4+.5)/4,(Math.floor(i/4)+.5)/12];
/* v0.38.4 shared bits: lamp glow, instrument-glass glare, click sound */
let GLOW=null;function glowTexture(){if(GLOW||typeof document==='undefined')return GLOW;const c=canvas(64),x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.35,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);GLOW=new T.CanvasTexture(c);return GLOW;}
function glareMaterial(){if(typeof document==='undefined')return new T.MeshBasicMaterial({visible:false});const c=canvas(128),x=c.getContext('2d'),g=x.createLinearGradient(20,10,100,118);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(.32,'rgba(255,255,255,.06)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,.03)');x.fillStyle=g;x.beginPath();x.arc(64,64,63,0,7);x.fill();
 const t=new T.CanvasTexture(c);return new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false});}
const fmtS=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
/* ---------- the cockpit ---------- */
export class Cockpit{
 constructor(){const g=this.group=new T.Group();g.name='Kokpit';g.visible=false;this.state={};this.user={};this.parts={};this.live=[];this.needles=[];this.picks=[];this.lights={};this.frame=0;
  for(const [id,c] of Object.entries(CONTROLS))this.state[id]=c.def??0;
  const mat=(color,o={})=>new T.MeshStandardMaterial({color,roughness:o.r??.75,metalness:o.m??.1,...o.extra});
  this.mDark=mat('#1c1e1f');this.mPaint=mat('#2b2d2d',{r:.85});this.mMetal=mat('#9a9c9a',{r:.35,m:.8});this.mBlack=mat('#0d0e0e',{r:.6});this.mSeat=mat('#3a4236',{r:.95});this.mFloor=mat('#2a2c2b',{r:.95});
  this.mFrame=mat('#3a403b',{r:.7});this.mGlass=new T.MeshPhysicalMaterial({color:'#7fa89a',transparent:true,opacity:.12,roughness:.05,metalness:0,depthWrite:false,side:T.DoubleSide});
  this.mTint=new T.MeshBasicMaterial({color:'#2f6b55',transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
  this.buildPanel();this.buildMisc();this.buildPedestal();this.buildOverhead(); /* v0.35.6 AC sigorta paneli kaldırıldı */this.buildMarks();this.buildControls();
 }
 frameAt(center,target,up=new T.Vector3(0,1,0)){const o=new T.Object3D();o.position.copy(center);o.up.copy(up);o.lookAt(target);this.group.add(o);return o;}
 plane(parent,w,h,tex,{x=0,y=0,z=0,mat}={}){const m=new T.Mesh(new T.PlaneGeometry(w,h),mat??new T.MeshStandardMaterial({map:tex,color:'#e6e6e2',roughness:.62,metalness:.1,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:.42}) /* v0.38.3 lit by the cabin light, still readable in shade */);if(!mat){(this.photoMats??=[]).push(m.material);m.receiveShadow=true;}m.position.set(x,y,z);parent.add(m);return m;}
 buildPanel(){const f=this.panelF=this.frameAt(PANEL_C,PANEL_C.clone().add(PANEL_N));f.updateMatrix();
  // gauges (photo layout) on the model's panel face
  for(const [id,[u,v,r]] of Object.entries(GAUGES))this.addGauge(id,u,v,r);
  // panel lights: FIRE and RPM go into the model's own two light housings, the rest at their photo places
  const inv=f.matrix.clone().invert();
  const L=(id,xy,w,h,col,txt,at)=>{const [u,v]=xy;const c=canvas(128);c.height=64;const x=c.getContext('2d');const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
   const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));if(at){m.position.copy(at.clone().applyMatrix4(inv));m.position.z=Math.max(m.position.z,0)+.003;}else{m.position.set((u-.5)*PW,(.5-v)*PH,.006);const hs=new T.Mesh(new T.BoxGeometry(w+.008,h+.008,.008),this.mBlack);hs.position.set(m.position.x,m.position.y,.002);f.add(hs);}
   f.add(m);(this.lightMesh??={})[id]=m;
   /* v0.38.4 lit lamps glow */const glow=new T.Mesh(new T.PlaneGeometry(w*2.4,h*3),new T.MeshBasicMaterial({map:glowTexture(),color:col,transparent:true,opacity:.75,blending:T.AdditiveBlending,depthWrite:false}));glow.position.copy(m.position);glow.position.z+=.0015;glow.visible=false;f.add(glow);
   this.lights[id]={x,c,tex,col,txt,on:null,glow};this.drawLight(id,false);};
  L('fire',p1(610,265),.046,.018,'#ff3a2c','FIRE',COCKPIT_REF.lights.fire);L('rpm',p1(405,262),.046,.018,'#ff3a2c','RPM',COCKPIT_REF.lights.rpm);L('mc',p1(160,258),.05,.022,'#ffb52a','MASTER CAUTION',fromModel(-7.2625,-.4255,.047)); /* v0.38.1 in line with RPM / FIRE (the hood is hidden) */
  L('aux1',p1(135,312),.014,.014,'#4cd36b','');L('aux2',p1(180,312),.014,.014,'#4cd36b','');L('cargo',p1(1015,790),.016,.016,'#ffb52a','');
  // standby compass at the right end of the panel
  const cmp=new T.Group();cmp.position.set((.985-.5)*PW,(.5-.66)*PH,.045); /* v0.38.2 clear of the VSI */f.add(cmp);const box=new T.Mesh(new T.BoxGeometry(.075,.056,.07),this.mBlack);cmp.add(box);
  const cc=canvas(128);const ct=new T.CanvasTexture(cc);ct.colorSpace=T.SRGBColorSpace;const win=this.cmpWin=new T.Mesh(new T.PlaneGeometry(.056,.039),new T.MeshBasicMaterial({map:ct}));win.position.set(0,0,.0355);cmp.add(win);
  this.live.push({id:'compass',ctx:cc.getContext('2d'),n:128,tex:ct,draw:(ctx,n,s)=>drawCompass(ctx,n,{heading:s.hdg}),key:s=>Math.round(s.hdg/R*2)});
 }
 addGauge(id,u,v,r){const f=this.panelF,size=2*r*PW,x=(u-.5)*PW,y=(.5-v)*PH,grp=new T.Group();grp.position.set(x,y,.013);f.add(grp);this.parts['g_'+id]=grp;
  {const sq=id==='adi'||id==='c_adi'||id==='turn',caseM=this.mCase??=new T.MeshStandardMaterial({color:'#151617',roughness:.55,metalness:.2});
   const cs=new T.Mesh(sq?new T.BoxGeometry(size*1.1,size*1.1,.013):new T.CylinderGeometry(size*.57,size*.6,.013,40),caseM);if(!sq)cs.rotation.x=Math.PI/2;cs.position.z=-.0068;grp.add(cs);}
  const liveKinds={adi:1,c_adi:1,turn:1,cdi:1,adf:1,c_rmi:1,alt:1,c_alt:1};const n=id==='adi'?1024:liveKinds[id]?640:512;
  if(liveKinds[id]){const c=canvas(n),tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(id==='c_adi'||id==='turn'?new T.PlaneGeometry(size*.95,size*.95):new T.CircleGeometry(size/2,48),new T.MeshBasicMaterial({map:tex}));grp.add(m);
   const draw={adi:(ctx,n,s)=>drawADI(ctx,n,{pitch:s.pitch,roll:s.roll,off:s.adiOff,slip:s.slip,turn:s.turn}),c_adi:(ctx,n,s)=>drawADI(ctx,n,{pitch:s.pitch,roll:s.roll,off:s.cadiOff,square:true}),turn:(ctx,n,s)=>drawTurn(ctx,n,{turn:s.turnOff?0:s.turn,slip:s.slip,off:s.turnOff}),
    cdi:(ctx,n,s)=>drawCDI(ctx,n,{heading:s.hdg,course:s.course,dev:s.dev,off:s.cdiOff,to:s.to}),adf:(ctx,n,s)=>drawRMI(ctx,n,{heading:s.hdgCard,b1:s.b1,b2:s.b2}),c_rmi:(ctx,n,s)=>drawRMI(ctx,n,{heading:s.hdgCard,b1:s.b1,b2:s.b2,copilot:true}),
    alt:(ctx,n,s)=>drawAltDrum(ctx,n,{alt:s.alt}),c_alt:(ctx,n,s)=>drawAltDrum(ctx,n,{alt:s.alt})}[id];
   const key={adi:s=>[Math.round(s.pitch/R*4),Math.round(s.roll/R*3),s.adiOff,Math.round(s.slip*20),Math.round(s.turn*20)].join(),c_adi:s=>[Math.round(s.pitch/R*3),Math.round(s.roll/R*2),s.cadiOff].join(),turn:s=>[Math.round(s.turn*30),Math.round(s.slip*30),s.turnOff].join(),
    cdi:s=>[Math.round(s.hdg/R),Math.round(s.dev*40),s.cdiOff].join(),adf:s=>[Math.round(s.hdgCard/R),Math.round(s.b1/R),Math.round(s.b2/R)].join(),c_rmi:s=>[Math.round(s.hdgCard/R),Math.round(s.b1/R),Math.round(s.b2/R)].join(),alt:s=>Math.floor(s.alt/1000),c_alt:s=>Math.floor(s.alt/1000)}[id];
   this.live.push({id,ctx:c.getContext('2d'),n,tex,draw,key});}
  else{const face=FACES[id]?.()??FACES.ias();const tex=new T.CanvasTexture(face);tex.colorSpace=T.SRGBColorSpace;grp.add(new T.Mesh(new T.CircleGeometry(size/2,48),new T.MeshBasicMaterial({map:tex})));}
  const ndl=(src,{len=.8,w=.06,col='#f4f1e6',kind='std',tail=.16,z=.001,map}={})=>{const pts=needleShape(kind,len,w,tail),sh=new T.Shape(pts.map(([a,b])=>new T.Vector2(a*size/2,b*size/2)));
   const m=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshBasicMaterial({color:col}));m.position.z=z;grp.add(m);this.needles.push({m,src,map});return m;};
  const hub=()=>{const h=new T.Mesh(new T.CircleGeometry(size*.045,16),new T.MeshBasicMaterial({color:'#111'}));h.position.z=.0025;grp.add(h);};
  const M={rpm:[[0,-140],[70,145]],ias:[[0,0],[20,28],[40,90],[60,140],[80,182],[100,225],[120,268],[140,312],[150,330]],vsi:[[-3000,-260],[-2000,-215],[-1000,-160],[-500,-125],[0,-90],[500,-55],[1000,-20],[2000,35],[3000,80]],c_vsi:[[-6000,-270],[0,-90],[6000,90]],
   torque:[[0,-135],[100,135]],n1:[[0,-150],[100,150],[110,180]],egt:[[0,-140],[10,140]],fuelPress:[[0,-140],[50,140]],fuelQty:[[0,-135],[14,135]],engOilP:[[0,-135],[100,135]],engOilT:[[-50,-120],[150,120]],xmsnOilP:[[0,-135],[100,135]],xmsnOilT:[[-50,-120],[150,120]],
   mainLoad:[[0,-60],[1,60]],stbyLoad:[[0,-60],[1,60]],dcVolt:[[0,-60],[30,60]],acVolt:[[0,-60],[150,60]],c_ias:[[0,0],[20,28],[40,90],[60,140],[80,182],[100,225],[120,268],[140,312],[150,330]],alt:[[0,0],[1000,360]],c_alt:[[0,0],[1000,360]]};
  if(id==='rpm'){/* v0.38.2 dual tachometer: long thin ENGINE needle, short broad ROTOR needle (married at 6600/324, split when they differ) */ndl('engRpm',{len:.9,w:.045,map:M.rpm,kind:'baton',col:'#f6f3e8'});ndl('rotRpmScaled',{len:.56,w:.13,map:M.rpm,kind:'baton',col:'#d9cf9e',tail:.1,z:.002});hub();}
  else if(id==='clock'){ndl('clockH',{len:.5,w:.08,map:[[0,0],[60,360]],kind:'baton'});ndl('clockM',{len:.8,w:.06,map:[[0,0],[60,360]],kind:'baton',z:.0015});ndl('clockS',{len:.85,w:.02,map:[[0,0],[60,360]],col:'#d8462f',z:.002});hub();}
  else if(id==='alt'||id==='c_alt'){ndl('altHund',{len:.8,w:.07,map:M.alt,kind:'pointer'});hub();}
  else if(M[id]){const src={ias:'ias',c_ias:'ias',vsi:'vsi',c_vsi:'vsi'}[id]??id;ndl(src,{len:id==='mainLoad'||id==='stbyLoad'||id==='dcVolt'||id==='acVolt'?.85:.8,map:M[id],tail:id.includes('Load')||id.includes('Volt')?.0:.16});hub();}
  if(id==='mainLoad'||id==='stbyLoad'||id==='dcVolt'||id==='acVolt'){for(const nd of this.needles.slice(-1))nd.m.position.y=-size*.3;}
  // glass reflection
  const gl=new T.Mesh(new T.CircleGeometry(size/2,32),Cockpit.glareMat??=glareMaterial());gl.position.z=.004;grp.add(gl);
  /* v0.38.4 hover shows the reading; the clock face starts / stops / resets the chronometer */
  const hit=new T.Mesh(new T.CircleGeometry(size/2,16),new T.MeshBasicMaterial({visible:false}));hit.position.z=.005;hit.userData.ctrl=id==='clock'?'chrono':'g:'+id;grp.add(hit);this.picks.push(hit);
  grp.userData.zone=id.startsWith('c_')?'copilot':['rpm','ias','adi','alt','vsi','adf','turn','cdi','clock'].includes(id)?'pilot':'engine';}
 drawLight(id,on){const L=this.lights[id];if(!L||L.on===on)return;L.on=on;if(L.glow)L.glow.visible=!!on;const {x,c,col,txt}=L;x.fillStyle=on?col:'#2a1d1a';if(!txt)x.fillStyle=on?col:'#1c241e';x.fillRect(0,0,c.width,c.height);
  if(txt){x.fillStyle=on?'#1a0a05':'#5b4a43';x.font=`700 ${txt.length>6?19:30}px ${FONT}`;x.textAlign='center';x.textBaseline='middle';const w=txt.split(' ');if(w.length>1){x.fillText(w[0],64,20);x.fillText(w[1],64,44);}else x.fillText(txt,64,32);}L.tex.needsUpdate=true;}
 paintOut(ctx,w,h,panel){for(const [id,c] of Object.entries(CONTROLS)){if(c.panel!==panel||c.type==='cb')continue;const r=(c.type==='knob'?(c.big?.055:.035):.026)*w*(panel==='panel'?.12:1)*(panel==='misc'?.9:1);
  ctx.fillStyle='#232424';ctx.beginPath();ctx.arc(c.u*w,c.v*h,r,0,7);ctx.fill();}}
 buildMisc(){this.dims={};}   /* v0.38.1 the misc switch panel sits on the pedestal (buildPedestal), as in the photos */
 buildPedestal(){const [[x0,y0],[x1,y1]]=COCKPIT_REF.pedTop,P0=fromModel(x0,y0,0),P1=fromModel(x1,y1,0),dd=P1.clone().sub(P0).normalize();
  /* v0.38.1 pedestal top as in the photos: misc switch panel (CHIP DET / FORCE TRIM / HYD CONT) first, then the radio
     stack and caution panel, both the same width; the model's pedestal box is narrowed to it in the cockpit view */
  const top=P0.clone().addScaledVector(dd,.012),bot=P1.clone().addScaledVector(dd,-.008),dir=bot.clone().sub(top),Ltot=dir.length(),gap=.006,w=(Ltot-gap)/(435/1024+2560/1024),hm=w*435/1024,L=w*2560/1024,n=new T.Vector3(-dir.y,dir.x,0).normalize();if(n.y<0)n.negate();
  dir.normalize();const up=dir.clone().negate(),at=s=>top.clone().addScaledVector(dir,s).addScaledVector(n,.009);
  this.pedW=w;const cm=at(hm/2),fm=this.miscF=this.frameAt(cm,cm.clone().add(n),up);
  this.miscMat=this.plane(fm,w,hm,photoCanvas('miscpanel.jpg',1024,435,(ctx,ww,hh)=>this.paintOut(ctx,ww,hh,'misc'))).material;this.dims.misc=[w,hm];
  const mid=at(hm+gap+L/2),f=this.pedF=this.frameAt(mid,mid.clone().add(n),up);
  this.pedMat=this.plane(f,w,L,photoCanvas('pedestal.jpg',1024,2560,(ctx,ww,hh)=>this.paintOut(ctx,ww,hh,'ped'))).material;this.dims.ped=[w,L];
  // caution segments (lit overlays on the photo)
  const c=canvas(256);c.height=512;this.cautionCv=c;this.cautionTex=new T.CanvasTexture(c);this.cautionTex.colorSpace=T.SRGBColorSpace;
  const seg=this.cautionMesh=new T.Mesh(new T.PlaneGeometry(w*.29,L*.146),new T.MeshBasicMaterial({map:this.cautionTex,transparent:true}));seg.position.set((.795-.5)*w,(.5-.075)*L,.002);f.add(seg);this.drawCaution({});}
 drawCaution(on,test=false,dim=false){const sig=JSON.stringify([on,test,dim]);if(sig===this.cautionSig)return;this.cautionSig=sig;const c=this.cautionCv,x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
  CAUTION_SEG.forEach(([k,t],i)=>{const col=i%2,row=Math.floor(i/2),bx=col*130+2,by=row*51+2,lit=test||on[k];x.fillStyle=lit?(dim?'#9a6a14':'#f2b229'):'rgba(20,18,14,.55)';x.fillRect(bx,by,124,46);
   x.fillStyle=lit?'#1b1205':'rgba(150,140,120,.6)';x.font=`700 15px ${FONT}`;x.textAlign='center';x.textBaseline='middle';const w=t.split(' ');const half=Math.ceil(w.length/2);x.fillText(w.slice(0,half).join(' '),bx+62,by+15);x.fillText(w.slice(half).join(' '),bx+62,by+33);});
  this.cautionTex.needsUpdate=true;}
 buildOverhead(){const w=.30,lsw=w*1181/1024,lcb=.375,th=.07,[[ra,ya],[rb,yb]]=COCKPIT_REF.roof,roof=x=>ya+(x-ra)*(yb-ya)/(rb-ra);
  const xf=-7.01,xr=xf+lsw+lcb+.03,F=fromModel(xf,roof(xf)-th,0),Rr=fromModel(xr,roof(xr)-th,0),d=Rr.clone().sub(F),len=d.length();d.normalize();
  const n=new T.Vector3(-d.y,d.x,0);if(n.y>0)n.negate();          // down (into the cockpit), slightly aft
  const at=s=>F.clone().addScaledVector(d,s).addScaledVector(n,.002);
  const cs=at(.005+lsw/2),fsw=this.ovhF=this.frameAt(cs,cs.clone().add(n),d.clone());
  this.plane(fsw,w,lsw,photoCanvas('overhead_sw.jpg',1024,1181,(ctx,ww,hh)=>this.paintOut(ctx,ww,hh,'ovh')));this.dims.ovh=[w,lsw];
  const cc=at(.015+lsw+lcb/2),fcb=this.cbF=this.frameAt(cc,cc.clone().add(n),d.clone());
  this.plane(fcb,w,lcb,cbPanelTexture());this.dims.cb=[w,lcb];
  const box=new T.Mesh(new T.BoxGeometry(len,th,w+.03),this.mDark);box.position.copy(F.clone().addScaledVector(d,len/2).addScaledVector(n,-th/2+.0005));box.rotation.z=Math.atan2(d.y,d.x);this.group.add(box);}
 buildAC(){const w=.22,h=w*950/1000;const c=new T.Vector3(EYE.x+.55,FLOOR+.30,.17);const f=this.acF=this.frameAt(c,c.clone().add(new T.Vector3(-.3,.25,1)));
  this.plane(f,w,h,photoCanvas('acpanel.jpg',1000,950));this.dims.ac=[w,h];}
 /* narration targets inside the supplied cockpit */
 buildMarks(){const g=this.group,mark=(v)=>{const o=new T.Object3D();o.position.copy(v);g.add(o);return o;};
  this.doorMark=mark(fromModel(-6.8,-.6,-1.0));
  this.marks={pedals:mark(fromModel(-7.20,-1.25,-.43)),cyclic:mark(ctlToRuntime('Sag_Saykilik',-.645,-.03,3.03)),collective:mark(ctlToRuntime('Sag_Kollektif',-.27,-.29,2.9)),throttle:mark(ctlToRuntime('Sag_Kollektif',-.27,-.42,2.72))};}
 /* cyclic, collective, pedals: the supplied model's own (moved by animateHelicopter); switch parts on our panels */
 buildControls(){this.ctl={cyc:[],col:[],ped:[]};
  for(const [id,c] of Object.entries(CONTROLS))this.addPart(id,c);
  for(const n of ['ped','ovh','cb'])this.addFocus(n);}
 /* once the model is loaded: our collective switch box (photo + switches) on the supplied right collective's head */
 bindModel(heli){if(!heli?.parts||this.bound===heli)return;const P=heli.parts,lever=P.collectiveLever;if(!lever||!heli.loaded)return;this.bound=heli;
  this.ctl={cyc:[P.cyclicStick,P.cyclicStickL].filter(Boolean),col:[P.collectiveLever,P.collectiveLeverL].filter(Boolean),ped:[[P.pedalsL,P.pedalsR]]};
  if(this.colBox)return;
  const head=ctlToRuntime('Sag_Kollektif',-.2715,-.282,2.902).sub(lever.userData.restPosition);
  const hb=this.colBox=new T.Group();hb.name='Kollektif anahtar kutusu';hb.position.copy(head);hb.rotation.z=-.513;lever.add(hb);
  const body=new T.Mesh(new T.BoxGeometry(.2,.128,.082),this.mBlack);body.position.y=.004;hb.add(body); /* v0.38.2 encloses the supplied head fully */
  const tex=photoCanvas('colhead.jpg',700,1080,(ctx,ww,hh)=>this.paintOut(ctx,ww,hh,'col'));const fw=.08,fh=.08*1080/700;
  const face=new T.Mesh(new T.PlaneGeometry(fw,fh),new T.MeshStandardMaterial({map:tex,roughness:.7}));face.rotation.set(-Math.PI/2,0,-Math.PI/2);face.position.y=.0685;hb.add(face);
  this.colFace=face;this.colFaceDims=[fw,fh];
  for(const [id,c] of Object.entries(CONTROLS))if(c.panel==='col')this.addPart(id,c);}
 panelFrame(name){const d=this.dims??{};return {panel:()=>[this.panelF,PW,PH],misc:()=>[this.miscF,...(d.misc??[])],ped:()=>[this.pedF,...(d.ped??[])],ovh:()=>[this.ovhF,...(d.ovh??[])],cb:()=>[this.cbF,...(d.cb??[])],col:()=>this.colFace?[this.colFace,...this.colFaceDims]:null}[name]?.();}
 addPart(id,c){const [f,w,h]=this.panelFrame(c.panel)??[];if(!f)return;let u=c.u,v=c.v;if(c.type==='cb'&&c.panel==='cb')[u,v]=cbPos(c.i);
  const g=new T.Group();g.position.set((u-.5)*w,(.5-v)*h,0);f.add(g);const s=(c.panel==='col'?.55:1)*({panel:PW/1.7,misc:w/.30,ped:w/.30,ovh:w/.32,cb:w/.32}[c.panel]??1);let mov;
  const metal=this.mMetal,black=this.mBlack;
  if(c.type==='toggle'){const nut=new T.Mesh(new T.CylinderGeometry(.007*s,.008*s,.005*s,12),metal);nut.rotation.x=Math.PI/2;nut.position.z=.0025*s;g.add(nut);
   mov=new T.Group();mov.position.z=.004*s;g.add(mov);const lev=new T.Mesh(new T.CylinderGeometry(.0022*s,.0028*s,.019*s,8),metal);lev.position.y=.0095*s;mov.add(lev);
   const tip=new T.Mesh(new T.SphereGeometry(.0035*s,10,8),c.tip?new T.MeshStandardMaterial({color:c.tip,roughness:.4}):metal);tip.position.y=.019*s;mov.add(tip);
   if(c.guard){const gd=new T.Mesh(new T.BoxGeometry(.016*s,.03*s,.012*s),new T.MeshStandardMaterial({color:c.guard,roughness:.5}));gd.position.set(.012*s,.004*s,.007*s);g.add(gd);}}
  else if(c.type==='knob'){const r=(c.big?.016:.011)*s;mov=new T.Group();g.add(mov);const k=new T.Mesh(new T.CylinderGeometry(r,r*1.08,.013,c.big?4:16),black);k.rotation.x=Math.PI/2;k.position.z=.0065;if(c.big)k.rotation.y=Math.PI/4;mov.add(k);
   const ptr=new T.Mesh(new T.BoxGeometry(.0025,r*1.1,.002),new T.MeshBasicMaterial({color:'#e9e6dc'}));ptr.position.set(0,r*.45,.0135);mov.add(ptr);}
  else if(c.type==='button'){mov=new T.Mesh(new T.CylinderGeometry(.006*s,.006*s,.006*s,14),new T.MeshStandardMaterial({color:'#2d2f30',roughness:.5}));mov.rotation.x=Math.PI/2;mov.position.z=.003;g.add(mov);}
  else if(c.type==='cb'){const sc=c.panel==='cb'?1:.9;mov=new T.Group();g.add(mov);const b=new T.Mesh(new T.CylinderGeometry(.0065*sc,.0065*sc,.008,14),black);b.rotation.x=Math.PI/2;b.position.z=.004;mov.add(b);
   const band=new T.Mesh(new T.CylinderGeometry(.0068*sc,.0068*sc,.004,14),new T.MeshBasicMaterial({color:'#f4f2ea'}));band.rotation.x=Math.PI/2;band.position.z=-.001;band.name='band';mov.add(band);
   const cap=new T.Mesh(new T.CircleGeometry(.004*sc,10),new T.MeshBasicMaterial({color:'#d8d4c8'}));cap.position.z=.0082;mov.add(cap);}
  // generous invisible pick target
  const hit=new T.Mesh(new T.CircleGeometry(c.type==='cb'?.011:c.type==='knob'?.02*s:.014*s,10),new T.MeshBasicMaterial({visible:false}));hit.position.z=.01;hit.userData.ctrl=id;g.add(hit);this.picks.push(hit);
  this.parts[id]={g,mov,c};this.applyPart(id);}
 applyPart(id){const P=this.parts[id];if(!P?.mov)return;const {c,mov}=P,st=this.state[id],n=c.pos.length;
  if(c.type==='toggle'){const lean=n===3?[1,0,-1][st]:[1,-1][st];mov.rotation.x=Math.PI/2-lean*.5;} /* v0.38.2 lever out of the panel, leaning toward its label (pos[0] = upper label) */
  else if(c.type==='knob'){const span=c.rheo?250:Math.min(300,(n-1)*45);mov.rotation.z=-(-span/2+span*st/Math.max(1,n-1))*R;}
  else if(c.type==='button'){mov.position.z=st?.0005:.003;}
  else if(c.type==='cb'){mov.position.z=st?.007:0;}}
 set(id,v){if(!CONTROLS[id])return;const n=CONTROLS[id].pos.length;v=clamp(v,0,n-1);if(this.state[id]===v)return;this.state[id]=v;this.applyPart(id);}
 /* user click: cycle a control (buttons / spring switches are momentary) */
 /* v0.38.2 small round button at a panel corner: brings that panel fully into view (second press: back) */
 addFocus(name){const [f,w,h]=this.panelFrame(name)??[];if(!f)return;const r=.0045,g=new T.Group();g.position.set(w/2-r*2,h/2-r*2,.008); /* v0.38.3 small */f.add(g);
  const ring=new T.Mesh(new T.RingGeometry(r*.62,r,24),new T.MeshBasicMaterial({color:'#ffd25a'}));g.add(ring);const dot=new T.Mesh(new T.CircleGeometry(r*.62,24),new T.MeshBasicMaterial({color:'#1b2a24'}));dot.position.z=-.0005;g.add(dot);
  const hit=new T.Mesh(new T.CircleGeometry(r*1.5,12),new T.MeshBasicMaterial({visible:false}));hit.position.z=.002;hit.userData.ctrl='focus:'+name;g.add(hit);this.picks.push(hit);(this.focusBtns??={})[name]=g;}
 focusView(name,eye){const [f,w,h]=this.panelFrame(name)??[];if(!f)return null;f.updateWorldMatrix(true,false);const root=this.group.parent;const c=root.worldToLocal(new T.Vector3().setFromMatrixPosition(f.matrixWorld)).sub(eye);
  const d=c.length();return {yaw:Math.atan2(c.z,c.x),pitch:Math.atan2(c.y,Math.hypot(c.x,c.z)),fov:Math.max(22,Math.min(80,2*Math.atan(Math.max(w,h)*.62/d)*180/Math.PI))};}
 click(id){if(id?.startsWith('focus:'))return {focus:id.slice(6)};
  if(id==='chrono'){const c=this.chrono??={run:false,t0:0,acc:0},t=this.simTime??0;let pos;if(c.run){c.acc+=t-c.t0;c.run=false;c.stopped=true;pos='DURDU · '+fmtS(c.acc);}else if(c.stopped){c.acc=0;c.stopped=false;pos='SIFIRLANDI';}else{c.t0=t;c.run=true;pos='BAŞLADI';}this.clickSound();return {id,name:'KRONOMETRE',pos,desc:'Saat yüzüne tıkla: başlat → durdur → sıfırla (simülasyon zamanı).'};}const c=CONTROLS[id];if(!c)return null;this.user[id]=performance.now();(this.userAt??={})[id]=this.simTime??0;
  if(c.type==='button'||c.spring){const hold=c.type==='button'?1:(this.state[id]===0?2:0);this.set(id,hold);clearTimeout(this['t'+id]);this['t'+id]=setTimeout(()=>this.set(id,c.def??0),1600);}
  else this.set(id,(this.state[id]+1)%c.pos.length);
  this.clickSound();
  return {id,name:c.name,pos:c.pos[this.state[id]],desc:c.desc};}
 cbId(name){return CB_LIST.find(c=>c.name===name)?.id;}
 targetPos(t){if(!t||t==='out')return null;let o=null;
  if(t.startsWith('g:'))o=this.parts['g_'+t.slice(2)];else if(t.startsWith('cb:'))o=this.parts[this.cbId(t.slice(3))]?.g;
  else o={collective:this.colBox??this.marks?.collective,throttle:this.marks?.throttle,cyclic:this.marks?.cyclic,pedals:this.marks?.pedals,caution:this.cautionMesh,fireLight:this.lightMesh?.fire,doorR:this.doorMark}[t]??this.parts[t]?.g;
  if(!o)return null;o.updateWorldMatrix(true,false);return new T.Vector3().setFromMatrixPosition(o.matrixWorld);}
 worldPos(id){const P=this.parts[id]??this.parts['g_'+id];if(!P)return null;const o=P.g??P;o.updateWorldMatrix(true,false);return new T.Vector3().setFromMatrixPosition(o.matrixWorld);}
 /* ---------- per-frame update from the simulated state ---------- */
 update(p,{time=0,config={},cues=[]}={}){p=p?liveFlightState(p,liveTerrainHeight):p;if(p)this.out=this.outputs(p,time,config);if(!this.group.visible||!p)return;this.frame++;this.applyLighting(this.out);const nowR=performance.now(),dtR=Math.min(.2,Math.max(0,(nowR-(this.lastR??nowR))/1000));this.lastR=nowR;
  const st=this.state,on=k=>st[k],ac=on('invtr')!==1&&on('bat')===1&&!this.cbOut('adi'),dcOn=on('bat')===1||p.engineRpm>5500;
  // engine / power values
  const eng=p.ground?.engineRpm??p.engineRpm??6600,rot=p.ground?.rotorRpm??p.rotorRpm??324,shp=Math.max(0,(p.shaftPowerW??0)),running=eng>3000,pf=clamp(shp/820000,0,1.3);
  const torque=this.cbOut('torque')?0:running?(p.program?torquePsi(p,config,areaElevationM((p.position??[0,0,0])[0],(p.position??[0,0,0])[2],config.flightArea??'terrain')/.3048):clamp(shp/16400,0,90)):0, /* v0.39 program uçuşlarında tork PPC'ye kalibre */n1=running?clamp(70+28*pf,0,104):clamp(eng/6600*60,0,60),egt=running?3.6+2.4*pf+(p.program?.id==='compressor-stall'&&time>4&&time<9?2.4:0):clamp(eng/6600*3,0,3),
   hdg=(((p.program?p.heading:p.heading)??0)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
  const pos=p.position??[0,0,0],brg=(x,z)=>Math.atan2(x-pos[0],-(z-pos[2])),agl=p.heightAglFt??0,alt=areaElevationM(pos[0],pos[2],config.flightArea??'terrain')/.3048+agl, /* v0.39 altimetre: arazinin MSL yüksekliği + AGL */now=new Date(),mins=now.getHours()%12*60+now.getMinutes()+now.getSeconds()/60+time/60;
  const vals={engRpm:eng/100,rotRpmScaled:rot*6600/324/100,ias:p.iasKt??0,vsi:-(p.descentFpm??0),torque,n1,egt,fuelPress:this.cbOut('fuelPress')||!running||on('fuel')===1?(on('fuel')===1&&running?0:2):27,fuelQty:on('fuelTest')?1.5:this.cbOut('fuelQty')?0:Math.max(0,9.6-time/600),
   engOilP:this.cbOut('engPress')?0:running?82:eng>800?eng/6600*70:0,engOilT:this.cbOut('temps')?-50:78,xmsnOilP:this.cbOut('xmsnPress')?0:rot>120?48*Math.min(1,rot/280):0,xmsnOilT:this.cbOut('temps')?-50:82,
   mainLoad:dcOn&&running&&on('mainGen')===2?.38:0,stbyLoad:dcOn&&!(running&&on('mainGen')===2)&&on('starterGen')===1&&running?.4:0,dcVolt:(()=>{const s=on('vm'),gen=running&&on('mainGen')===2,stby=running&&on('starterGen')===1;return s===0?(gen?28:0):s===1?(stby?28:0):on('bat')||gen||stby?(gen||stby?27.8:24):0;})(), /* v0.38.4 VOLTMETER SEL */acVolt:ac?115:0,clockH:(mins/12)%60,clockM:mins%60,clockS:(now.getSeconds()+time)%60,altHund:alt%1000};
  /* v0.38.4 chronometer on the clock's second hand; needles move like real instruments (short lag, no jumps) */
  const ch=this.chrono;if(ch&&(ch.run||ch.stopped))vals.clockS=((ch.acc+(ch.run?time-ch.t0:0))%60+60)%60;this.vals=vals;this.simTime=time;
  const kN=1-Math.exp(-dtR*9);for(const nd of this.needles){const v=vals[nd.src];if(v===undefined||!nd.map)continue;const tgt=-scaleAngle(nd.map,v)*R;if(nd.src==='clockS'||nd.src==='clockM'||nd.src==='clockH'||nd.k===undefined||Math.abs(tgt-nd.m.rotation.z)>3){nd.m.rotation.z=tgt;nd.k=1;}else nd.m.rotation.z+=(tgt-nd.m.rotation.z)*kN;}
  const yawRate=p.program?.yawRate??(p.yawRate??0),turn=this.cbOut('turn')?0:clamp(yawRate/(1.5*R),-2,2),slip=clamp(-(p.roll??0)*.6+turn*.15,-1,1);
  const ls={pitch:p.pitch??0,roll:p.roll??0,adiOff:!ac,cadiOff:!ac||this.cbOut('cadi'),slip,turn,turnOff:this.cbOut('turn')||!dcOn,hdg,hdgCard:this.cbOut('cmps')?this.frozenHdg??hdg:(this.frozenHdg=hdg),course:240*R,b1:brg(0,0),b2:brg(-3000,2500),alt,
   dev:clamp(Math.sin(brg(0,0)-240*R)*3,-1,1),to:Math.cos(brg(0,0)-240*R)>0,cdiOff:this.cbOut('cdi')||!ac};
  for(const L of this.live){const k=L.key(ls);if(k===L.k)continue;if(L.id!=='adi'&&L.k!==undefined&&this.frame%2)continue;L.k=k;L.draw(L.ctx,L.n,ls);L.tex.needsUpdate=true;}
  // warning / caution lights
  const prog=p.program,lights={...caution(p,time,config),...this.switchLights(p)};const testC=on('cautionTest')===2,mc=Object.keys(lights).some(k=>lights[k]&&k!=='rpm'&&k!=='fire');
  const lit=dcOn&&!this.cbOut('caution');this.drawCaution(lit?lights:{},lit&&testC,on('cautionDim')===1);
  this.drawLight('fire',dcOn&&!this.cbOut('fireDet')&&(!!prog?.warn?.fire||on('fireTest')===1));this.drawLight('rpm',dcOn&&!this.cbOut('rpmWarn')&&(!!lights.rpm||testC));this.drawLight('mc',lit&&(mc||testC));
  this.drawLight('cargo',dcOn&&on('cargoRel')===1);
  // flight controls
  const c=p.controls??{};const cf=clamp((c.cyclicForward??0)/.22,-1,1),cr=clamp((c.cyclicRight??0)/.22,-1,1),col=clamp(((c.collective??1)-.3)/1.9,0,1),pd=clamp(c.pedal??0,-1,1);
  /* v0.38 the supplied sticks, collectives and pedals are moved by animateHelicopter (scene-model.js) */
  // procedure-driven switch states (cues up to now); a user click wins until the next cue for that switch
  this.simTime=time;
  const kid=k=>k.startsWith('cb:')?this.cbId(k.slice(3)):k;
  if(cues!==this.cueRef){this.cueRef=cues;this.cueKeys=new Set();for(const q of cues??[])for(const k of Object.keys(q.set??{}))if(k!=='throttle'&&kid(k))this.cueKeys.add(kid(k));}
  {let th=null;for(const q of cues??[]){if(q.at>time)break;if(q.set?.throttle!==undefined)th=q.set.throttle;}this.cueThrottle=th;}
  if(this.cueKeys?.size){const want={};for(const q of cues){if(q.at>time)break;if(q.set)for(const [k0,v0] of Object.entries(q.set)){if(k0==='throttle')continue;const k=kid(k0);if(!k)continue;const v=v0==='toggle'?1-(CONTROLS[k]?.def??0):v0;want[k]={v,at:q.at};}}
   for(const k of this.cueKeys){const w=want[k]??{v:CONTROLS[k]?.def??0,at:-1};if(this.userAt?.[k]!==undefined&&this.userAt[k]>=w.at&&this.userAt[k]<=time+.01)continue;this.set(k,w.v);}}
 }
 setLight(k){for(const m of this.photoMats??[])m.color.setScalar(.84*k+.06);}
 /* v0.38.4 switch outputs for the airframe and scene (exterior lights, wipers, warning horn, panel lighting) */
 /* v0.39 anahtar fiziği: HYD CONT OFF (veya sigortası çekik) → HYD PRESSURE; GOV EMER → GOV EMER ikazı; FUEL OFF → yakıt basıncı düşer,
    ENG FUEL PUMP ikazı; FORCE TRIM OFF → kumanda kuvvet trimi yok (saykılık serbest, göstergede not) */
 switchLights(p){const on=k=>this.state[k],out={},run=(p.engineRpm??6600)>3000;if(on('hydCont')===1||this.cbOut('hydCb'))out.hyd=true;if(on('gov')===1)out.govemer=true;if(on('fuel')===1&&run){out.efpump=true;out.lboost=true;out.rboost=true;}return out;}
 outputs(p,time,config){const st=this.state,on=k=>st[k],dcOn=on('bat')===1||(p.engineRpm??0)>5500,rot=p.ground?.rotorRpm??p.rotorRpm??324,night=config.lighting==='night'?1:config.lighting==='dusk'?.55:0,lights=caution(p,time,config);
  return {night,landing:dcOn&&on('ldgLt')===0&&on('ldgExt')!==2,landingAuto:this.user.ldgLt===undefined&&night>.4,search:dcOn&&on('slOn')===0,antiColl:dcOn&&on('antiColl')===1,
   pos:dcOn&&on('posLt')!==1?(on('posLt')===2?'flash':'steady'):null,posBright:on('posDim')===1,fus:dcOn?[.5,0,1][on('fusLt')]:0,wipers:dcOn?[0,0,.7,1.1,1.6][on('wipers')]:0,wiperSel:on('wiperSel'),
   horn:dcOn&&on('lowRpmAudio')===0&&rot>1&&(rot<=305||!!lights.rpm&&rot<324),overspeed:dcOn&&rot>=339,
   backlight:Object.fromEntries(['ltPilot','ltCopilot','ltEngine','ltSec','ltConsole','ltPed'].map(k=>[k,dcOn?[0,.55,1][on(k)]:0]))};}
 applyLighting(o){if(!o)return;const lvl=k=>1-o.night*(1-.12-.88*(o.backlight[k]??0)),key=[o.night,...Object.values(o.backlight)].join();if(key===this.ltKey)return;this.ltKey=key;
  for(const [id,P] of Object.entries(this.parts)){if(!id.startsWith('g_'))continue;const z=P.userData.zone,L=lvl(z==='copilot'?'ltCopilot':z==='pilot'?'ltPilot':'ltEngine');P.traverse(m=>{const mt=m.material;if(!m.isMesh||!mt?.isMeshBasicMaterial||mt===Cockpit.glareMat||!mt.visible)return;mt.userData.base??=mt.color.clone();mt.color.copy(mt.userData.base).multiplyScalar(L);});}
  const pl=lvl('ltConsole'),pd=lvl('ltPed');for(const m of this.photoMats??[]){m.userData.ei??=m.emissiveIntensity;m.emissiveIntensity=m.userData.ei*(m===this.pedMat||m===this.miscMat?pd:pl);}
  if(this.cmpWin){this.cmpWin.material.color.setScalar(lvl('ltSec'));}
  this.flood??=(()=>{const l=new T.PointLight('#ffd9b0',0,2.2,1.6);l.position.copy(EYE).add(new T.Vector3(.15,.35,-.45));this.group.add(l);return l;})();
  this.flood.intensity=o.night*(.15+.6*Math.max(o.backlight.ltConsole,o.backlight.ltPed,o.backlight.ltSec));}
 audioCtx(){if(this.ac!==undefined)return this.ac;try{this.ac=new (globalThis.AudioContext||globalThis.webkitAudioContext)();}catch{this.ac=null;}return this.ac;}
 soundOn(){return globalThis.__heliAudio?.enabled!==false;}
 clickSound(){if(!this.soundOn())return;const a=this.audioCtx();if(!a)return;a.resume?.();const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.setValueAtTime(1800,t);o.frequency.exponentialRampToValueAtTime(600,t+.03);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.06);}
 /* low rotor RPM horn (LOW RPM AUDIO switch), overspeed tone; pulsed */
 warnSound(o,playing){const want=!!(o?.horn||o?.overspeed)&&playing&&this.soundOn();if(!want){if(this.hornG)this.hornG.gain.value=0;return;}const a=this.audioCtx();if(!a)return;
  if(!this.hornO){this.hornO=a.createOscillator();this.hornG=a.createGain();this.hornO.type='square';this.hornO.connect(this.hornG).connect(a.destination);this.hornG.gain.value=0;this.hornO.start();}
  this.hornO.frequency.value=o.horn?560:1250;const ph=(performance.now()/1000*(o.horn?3:5))%1;this.hornG.gain.value=ph<.55?.05:0;}
 gaugeText(id){const v=this.vals??{},f=(x,d=0)=>x===undefined?'—':Number(x).toFixed(d);
  return {rpm:`Motor ${f(v.engRpm*100)} RPM · Rotor ${f(v.rotRpmScaled*324/66)} RPM`,ias:`Sürat ${f(v.ias)} KIAS`,c_ias:`Sürat ${f(v.ias)} KIAS`,vsi:`Varyo ${f(v.vsi)} ft/dk`,c_vsi:`Varyo ${f(v.vsi)} ft/dk`,alt:'İrtifa (barometrik)',c_alt:'İrtifa (barometrik)',
   torque:`Tork ${f(v.torque)} PSI`,n1:`N1 (gaz üreteci) ${f(v.n1)} %`,egt:`EGT ${f(v.egt*100)} °C`,fuelPress:`Yakıt basıncı ${f(v.fuelPress)} PSI`,fuelQty:`Yakıt ${f(v.fuelQty*100)} lb`,engOilP:`Motor yağ basıncı ${f(v.engOilP)} PSI`,engOilT:`Motor yağ sıcaklığı ${f(v.engOilT)} °C`,
   xmsnOilP:`Transmisyon yağ basıncı ${f(v.xmsnOilP)} PSI`,xmsnOilT:`Transmisyon yağ sıcaklığı ${f(v.xmsnOilT)} °C`,mainLoad:`Ana jeneratör yükü ${f(v.mainLoad,2)}`,stbyLoad:`Yedek jeneratör yükü ${f(v.stbyLoad,2)}`,dcVolt:`DC ${f(v.dcVolt,1)} V`,acVolt:`AC ${f(v.acVolt)} V`,
   adi:'Ufuk göstergesi (pilot)',c_adi:'Ufuk göstergesi (kopilot)',turn:'Dönüş ve kayış göstergesi',cdi:'Rota göstergesi (CDI)',adf:'RMI / ADF',c_rmi:'RMI (kopilot)'}[id]??id;}
 cbOut(effect){for(const c of CB_LIST){if(CONTROLS[c.id].effect===effect&&this.state[c.id]===1)return true;}return false;}
}
/* caution segments + RPM light from the simulated state (shared with the 2D panel) */
export function caution(ps,time,config){const prog=ps.program;if(prog){const on={};for(const l of prog.lights??[])on[l]=true;on.rpm=!!prog.warn?.rpm;return on;}
 const rr=ps.ground?.rotorRpm??ps.rotorRpm,er=ps.ground?.engineRpm??ps.engineRpm??6600,low=rr<=305&&rr>1,high=rr>=332,engLow=er<=6200&&time>=4,dead=time>=4.6&&config.powerLossMode!=='partial'&&er<5000,stopped=rr<120;
 return {rpm:low||high||engLow,eop:dead,efpump:dead,gen:dead,xop:stopped,hyd:stopped};}
