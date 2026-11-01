import {LITE} from './device-profile.js';
// v0.35 cockpit instrument faces, drawn to the AB-205 / UH-1H panel (J-4489 photos, TM 55-1520-210-10 ch.2):
// static dial faces (drawn once) + moving needles (meshes) + a few live faces (attitude, turn & slip, course
// indicator, altimeter drum, standby compass) redrawn only when their value changes.
const R=Math.PI/180;
export const FONT='"DIN Alternate","Arial Narrow",Arial,sans-serif';
export function canvas(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
// angle (deg, clockwise from 12 o'clock) of a value on a piece-wise linear scale
export function scaleAngle(map,v){if(v<=map[0][0])return map[0][1];for(let i=1;i<map.length;i++){if(v<=map[i][0]){const [v0,a0]=map[i-1],[v1,a1]=map[i];return a0+(a1-a0)*(v-v0)/(v1-v0);}}return map.at(-1)[1];}
function pt(cx,cy,r,deg){return [cx+r*Math.sin(deg*R),cy-r*Math.cos(deg*R)];}
function base(ctx,n,{bg='#0b0c0c'}={}){ctx.clearRect(0,0,n,n);ctx.fillStyle=bg;ctx.beginPath();ctx.arc(n/2,n/2,n/2-1,0,2*Math.PI);ctx.fill();}
function arcBand(ctx,cx,cy,r,a0,a1,w,color){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.arc(cx,cy,r,(a0-90)*R,(a1-90)*R);ctx.stroke();}
function tick(ctx,cx,cy,r0,r1,deg,w,color='#f2f0e8'){const [x0,y0]=pt(cx,cy,r0,deg),[x1,y1]=pt(cx,cy,r1,deg);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
function label(ctx,t,x,y,size,{color='#f2f0e8',weight='600',align='center'}={}){ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${FONT}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(t,x,y);}
/* generic round dial: {map:[[v,deg]..], major:[..], minor:step, numbers:[[v,text]], arcs:[[v0,v1,color]], texts:[[t,x,y,size]]} (x,y in 0..1) */
export function drawDial(spec,n=LITE?256:512){ /* v0.38.2 sharper faces */const c=canvas(n),ctx=c.getContext('2d'),cx=n/2,cy=n/2,r=n/2;base(ctx,n);
 const A=v=>scaleAngle(spec.map,v);
 for(const [v0,v1,col] of spec.arcs??[])arcBand(ctx,cx,cy,r*.86,A(v0),A(v1),r*.075,col);
 for(const [v,col] of spec.lines??[])tick(ctx,cx,cy,r*.72,r*.95,A(v),r*.045,col);
 if(spec.minor){const [lo,hi]=[spec.map[0][0],spec.map.at(-1)[0]];for(let v=lo;v<=hi+1e-9;v+=spec.minor)tick(ctx,cx,cy,r*.84,r*.94,A(v),r*.018);}
 for(const v of spec.major??[])tick(ctx,cx,cy,r*.76,r*.95,A(v),r*.035);
 for(const [v,t,sz] of spec.numbers??[]){const [x,y]=pt(cx,cy,r*(spec.numR??.6),A(v));label(ctx,t,x,y,r*(sz??spec.numSize??.2));}
 for(const [t,x,y,sz,opt] of spec.texts??[])label(ctx,t,x*n,y*n,r*sz,opt);
 return c;}
// needle shapes in a unit gauge (radius 1): returns polygon points (x,y) for THREE.Shape
export function needleShape(kind='std',len=.82,w=.055,tail=.18){
 if(kind==='baton')return [[-w*.5,-tail],[w*.5,-tail],[w*.6,len*.82],[0,len],[-w*.6,len*.82]];
 if(kind==='pointer')return [[-w,-tail],[w,-tail],[w*.45,len*.9],[0,len],[-w*.45,len*.9]];
 return [[-w*.6,-tail],[w*.6,-tail],[w*.35,len*.92],[0,len],[-w*.35,len*.92]];}

/* ---------- static faces of the AB-205 panel ---------- */
export const FACES={
 // dual tachometer: ENGINE outer scale x100 RPM (0-70), ROTOR inner scale x100 (1.0-4.0); married needles at 6600/324
 rpm:()=>drawDial({map:[[0,-140],[70,145]],major:[0,10,20,30,40,50,60,70],minor:2,numbers:[[10,'10'],[20,'20'],[30,'30'],[40,'40'],[50,'50'],[60,'60'],[70,'70']],numR:.6,numSize:.17,
  arcs:[[64,66,'#36c25b'],[66,67.5,'#e7c13a'],[61.5,64,'#e7c13a']],lines:[[67.5,'#e0453a'],[60.8,'#e0453a']],
  texts:[['RPM',.5,.37,.2],['ROTOR',.5,.67,.11],['ENGINE',.5,.88,.1],['1.0',.38,.5,.1],['2.0',.5,.46,.1],['3.0',.62,.5,.1],['x 100',.5,.56,.08]]}),
 ias:()=>drawDial({map:[[0,0],[20,28],[40,90],[60,140],[80,182],[100,225],[120,268],[140,312],[150,330]],major:[20,40,60,80,100,120,140],minor:5,
  numbers:[[20,'20'],[40,'40'],[60,'60'],[80,'80'],[100,'100'],[120,'120'],[140,'140']],numR:.58,numSize:.21,lines:[[124,'#e0453a']],texts:[['KNOTS',.5,.62,.13]]}),
 vsi:()=>drawDial({map:[[-3000,-260],[-2000,-215],[-1000,-160],[-500,-125],[0,-90],[500,-55],[1000,-20],[2000,35],[3000,80]],
  major:[-3000,-2000,-1000,0,1000,2000,3000],minor:250,numbers:[[0,'0'],[1000,'1'],[2000,'2'],[3000,'3'],[-1000,'1'],[-2000,'2'],[-3000,'3'],[500,'.5',.12],[-500,'.5',.12]],numR:.6,numSize:.22,
  texts:[['VERTICAL SPEED',.6,.44,.11],['UP',.2,.36,.09],['DOWN',.2,.64,.09],['1000 FT PER MIN',.6,.58,.07]]}),
 c_vsi:()=>drawDial({map:[[-6000,-270],[0,-90],[6000,90]],major:[-6000,-4000,-2000,0,2000,4000,6000],minor:500,numbers:[[0,'0'],[2000,'2'],[4000,'4'],[6000,'6'],[-2000,'2'],[-4000,'4']],numR:.6,numSize:.22,
  texts:[['CLIMB',.5,.42,.12],['1000 FT PER MIN',.5,.55,.07]]}),
 torque:()=>drawDial({map:[[0,-135],[100,135]],major:[0,20,40,60,80,100],minor:5,numbers:[[20,'20'],[40,'40'],[60,'60'],[80,'80'],[100,'100']],numR:.6,numSize:.19,
  arcs:[[0,50,'#36c25b'],[50,50.6,'#e0453a']],lines:[[50,'#e0453a']],texts:[['PSI',.5,.33,.12],['OIL',.36,.66,.11],['PRESS',.62,.66,.11]]}),
 n1:()=>drawDial({map:[[0,-150],[100,150],[110,180]],major:[0,10,20,30,40,50,60,70,80,90,100,110],minor:2,numbers:[[0,'0'],[20,'20'],[40,'40'],[60,'60'],[80,'80'],[100,'100']],numR:.62,numSize:.15,
  lines:[[101.5,'#e0453a']],texts:[['PERCENT',.5,.66,.09],['RPM',.5,.75,.1]]}),
 egt:()=>drawDial({map:[[0,-140],[10,140]],major:[0,1,2,3,4,5,6,7,8,9,10],minor:.5,numbers:[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5'],[6,'6'],[7,'7'],[8,'8'],[9,'9'],[10,'10']],numR:.6,numSize:.17,
  arcs:[[4,6.1,'#36c25b'],[6.1,6.25,'#e7c13a']],lines:[[6.25,'#e0453a'],[7.6,'#e0453a']],texts:[['EXH',.62,.36,.11],['TEMP',.62,.45,.11],['°C X100',.5,.7,.08]]}),
 fuelPress:()=>drawDial({map:[[0,-140],[50,140]],major:[0,10,20,30,40,50],minor:2.5,numbers:[[10,'10'],[20,'20'],[30,'30'],[40,'40'],[50,'50']],numSize:.2,
  arcs:[[5,35,'#36c25b']],lines:[[5,'#e0453a'],[35,'#e0453a']],texts:[['FUEL',.5,.38,.13],['PRESS.',.5,.5,.13],['PSI',.5,.66,.12]]}),
 fuelQty:()=>drawDial({map:[[0,-135],[14,135]],major:[0,2,4,6,8,10,12,14],minor:1,numbers:[[0,'0'],[4,'4'],[8,'8'],[12,'12']],numSize:.2,
  texts:[['FUEL',.5,.36,.12],['QUANTITY',.5,.46,.1],['LBS. X 100',.5,.7,.08]]}),
 engOilP:()=>drawDial({map:[[0,-135],[100,135]],major:[0,20,40,60,80,100],minor:5,numbers:[[20,'20'],[40,'40'],[60,'60'],[80,'80'],[100,'100']],numSize:.17,
  arcs:[[80,100,'#36c25b']],lines:[[25,'#e0453a'],[100,'#e0453a']],texts:[['PSI',.5,.4,.12],['OIL',.5,.66,.12]]}),
 engOilT:()=>drawDial({map:[[-50,-120],[150,120]],major:[-50,0,50,100,150],minor:10,numbers:[[-50,'-50'],[0,'0'],[50,'50'],[100,'100'],[150,'150']],numSize:.15,
  arcs:[[0,93,'#36c25b']],lines:[[93,'#e0453a']],texts:[['°C',.5,.38,.12],['OIL',.5,.66,.12]]}),
 xmsnOilP:()=>drawDial({map:[[0,-135],[100,135]],major:[0,20,40,60,80,100],minor:5,numbers:[[20,'20'],[40,'40'],[60,'60'],[80,'80'],[100,'100']],numSize:.17,
  arcs:[[40,60,'#36c25b']],lines:[[30,'#e0453a'],[70,'#e0453a']],texts:[['PSI',.5,.4,.12],['OIL',.5,.66,.12]]}),
 xmsnOilT:()=>drawDial({map:[[-50,-120],[150,120]],major:[-50,0,50,100,150],minor:10,numbers:[[-50,'-50'],[0,'0'],[50,'50'],[100,'100'],[150,'150']],numSize:.15,
  arcs:[[0,110,'#36c25b']],lines:[[110,'#e0453a']],texts:[['°C',.5,.38,.12],['OIL',.5,.66,.12]]}),
 mainLoad:()=>drawDial({map:[[0,-60],[1,60]],major:[0,.25,.5,.75,1],numbers:[[0,'0',.22],[.5,'.5',.22],[1,'1.0',.22]],numR:.62,texts:[['LOAD',.5,.72,.2]]},128),
 stbyLoad:()=>drawDial({map:[[0,-60],[1,60]],major:[0,.25,.5,.75,1],numbers:[[0,'0',.22],[.5,'.5',.22],[1,'1.0',.22]],numR:.62,texts:[['LOAD',.5,.72,.2]]},128),
 dcVolt:()=>drawDial({map:[[0,-60],[30,60]],major:[0,5,10,15,20,25,30],numbers:[[0,'0',.2],[10,'10',.2],[20,'20',.2],[30,'30',.2]],numR:.62,arcs:[[26,29,'#36c25b']],texts:[['VOLT',.5,.68,.16],['DC',.5,.8,.12]]}),
 acVolt:()=>drawDial({map:[[0,-60],[150,60]],major:[0,50,100,150],minor:10,numbers:[[0,'0',.2],[50,'50',.2],[100,'100',.2],[150,'150',.2]],numR:.62,arcs:[[112,118,'#36c25b']],texts:[['VOLTS AC',.5,.7,.15]]}),
 c_ias:()=>FACES.ias(),
 clock:()=>drawDial({map:[[0,0],[60,360]],major:[0,5,10,15,20,25,30,35,40,45,50,55],minor:1,numbers:[[5,'1'],[10,'2'],[15,'3'],[20,'4'],[25,'5'],[30,'6'],[35,'7'],[40,'8'],[45,'9'],[50,'10'],[55,'11'],[60,'12']],numR:.66,numSize:.2}),
 alt:()=>drawDial({map:[[0,0],[1000,360]],major:[0,100,200,300,400,500,600,700,800,900],minor:20,numbers:[[0,'0'],[100,'1'],[200,'2'],[300,'3'],[400,'4'],[500,'5'],[600,'6'],[700,'7'],[800,'8'],[900,'9']],numR:.68,numSize:.23,
  texts:[['ALT',.5,.32,.15]]}),
 c_alt:()=>FACES.alt(),
};
/* ---------- live faces ---------- */
export function drawADI(ctx,n,{pitch=0,roll=0,off=false,slip=0,turn=0,square=false}){ctx.save();ctx.clearRect(0,0,n,n);const cx=n/2,cy=n/2,r=n/2;
 ctx.beginPath();if(square)ctx.rect(0,0,n,n);else ctx.arc(cx,cy,r-1,0,2*Math.PI);ctx.clip();
 ctx.translate(cx,cy);ctx.rotate(-roll);const pp=r*1.6/40; // px per degree of pitch
 const y0=pitch/R*pp;ctx.fillStyle='#8c9da6';ctx.fillRect(-n,-2*n+y0,2*n,2*n);ctx.fillStyle='#2b2723';ctx.fillRect(-n,y0,2*n,2*n);
 ctx.strokeStyle='#f4f2ea';ctx.lineWidth=n*.012;ctx.beginPath();ctx.moveTo(-n,y0);ctx.lineTo(n,y0);ctx.stroke();
 ctx.fillStyle='#f4f2ea';ctx.font=`600 ${r*.11}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';
 for(let d=-30;d<=30;d+=5){if(!d)continue;const y=y0-d*pp,w=d%10?r*.16:r*.32;ctx.lineWidth=n*.008;ctx.beginPath();ctx.moveTo(-w,y);ctx.lineTo(w,y);ctx.stroke();if(!(d%10)){ctx.fillText(String(Math.abs(d)),-w-r*.12,y);ctx.fillText(String(Math.abs(d)),w+r*.12,y);}}
 ctx.restore();ctx.save();ctx.translate(cx,cy);
 // bank scale (fixed) and pointer (moves with roll)
 ctx.strokeStyle='#f4f2ea';ctx.lineWidth=n*.012;for(const a of [-60,-30,-20,-10,10,20,30,60]){const [x0,y0]=pt(0,0,r*.84,a),[x1,y1]=pt(0,0,r*(Math.abs(a)%30?.9:.95),a);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
 ctx.fillStyle='#f4f2ea';ctx.beginPath();ctx.moveTo(0,-r*.86);ctx.lineTo(-r*.05,-r*.95);ctx.lineTo(r*.05,-r*.95);ctx.fill();
 ctx.rotate(-roll);ctx.fillStyle='#f0b33a';ctx.beginPath();ctx.moveTo(0,-r*.82);ctx.lineTo(-r*.05,-r*.72);ctx.lineTo(r*.05,-r*.72);ctx.fill();ctx.rotate(roll);
 // miniature aircraft (W symbol) fixed
 ctx.strokeStyle='#f0f0f0';ctx.lineWidth=n*.022;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-r*.42,0);ctx.lineTo(-r*.16,0);ctx.lineTo(-r*.08,r*.09);ctx.lineTo(0,0);ctx.lineTo(r*.08,r*.09);ctx.lineTo(r*.16,0);ctx.lineTo(r*.42,0);ctx.stroke();
 if(!square){ // slip indicator + turn pointer at the bottom (pilot ADI)
  ctx.strokeStyle='#ccc';ctx.lineWidth=n*.006;ctx.strokeRect(-r*.2,r*.7,r*.4,r*.1);ctx.fillStyle='#111';ctx.beginPath();ctx.arc(Math.max(-1,Math.min(1,slip))*r*.16,r*.75,r*.045,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#ddd';ctx.stroke();
  ctx.fillStyle='#f4f2ea';ctx.fillRect(Math.max(-1,Math.min(1,turn))*r*.25-r*.02,r*.83,r*.04,r*.08);}
 if(off){ctx.fillStyle='#c8382f';ctx.fillRect(-r*.95,r*.42,r*.36,r*.18);ctx.fillStyle='#fff';ctx.font=`700 ${r*.13}px ${FONT}`;ctx.fillText('OFF',-r*.77,r*.51);}
 ctx.restore();ctx.save();if(!square){ctx.strokeStyle='#1b1d1e';ctx.lineWidth=n*.05;ctx.beginPath();ctx.arc(cx,cy,r-n*.02,0,2*Math.PI);ctx.stroke();}ctx.restore();}
export function drawTurn(ctx,n,{turn=0,slip=0,off=false}){ctx.clearRect(0,0,n,n);ctx.fillStyle='#0b0c0c';ctx.fillRect(0,0,n,n);
 // 4-minute turn needle (top) and ball (bottom), square window like the panel instrument
 ctx.fillStyle='#d9d4c4';ctx.fillRect(n*.43,n*.06,n*.03,n*.12);ctx.fillRect(n*.54,n*.06,n*.03,n*.12);
 ctx.save();ctx.translate(n/2,n*.82);ctx.rotate(Math.max(-1.2,Math.min(1.2,turn))*.32);ctx.fillStyle=off?'#555':'#efece2';ctx.fillRect(-n*.025,-n*.68,n*.05,n*.62);ctx.restore();
 ctx.fillStyle='#2b3a2c';ctx.fillRect(n*.12,n*.62,n*.76,n*.14);ctx.strokeStyle='#d8d4c7';ctx.lineWidth=n*.01;ctx.strokeRect(n*.12,n*.62,n*.76,n*.14);
 ctx.fillStyle='#f0ede5';ctx.fillRect(n*.405,n*.6,n*.015,n*.18);ctx.fillRect(n*.58,n*.6,n*.015,n*.18);
 ctx.fillStyle='#111';ctx.beginPath();ctx.arc(n/2+Math.max(-1,Math.min(1,slip))*n*.3,n*.69,n*.055,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#bbb';ctx.lineWidth=n*.008;ctx.stroke();
 label(ctx,'4 MIN TURN',n/2,n*.9,n*.07);if(off){ctx.fillStyle='#c8382f';ctx.fillRect(n*.08,n*.2,n*.2,n*.1);label(ctx,'OFF',n*.18,n*.25,n*.06,{color:'#fff'});}}
export function drawCard(ctx,n,{heading=0,r0=.98,labels=true,inner=false}){ // rotating compass card (heading up)
 const cx=n/2,cy=n/2,r=n/2*r0;ctx.save();ctx.translate(cx,cy);ctx.rotate(-heading);
 for(let d=0;d<360;d+=5){const len=d%30?(d%10?.06:.09):.12;tick(ctx,0,0,r*(1-len),r,d,n*(d%10?.006:.01));}
 if(labels)for(let d=0;d<360;d+=30){const t={0:'N',90:'E',180:'S',270:'W'}[d]??String(d/10);const [x,y]=pt(0,0,r*.74,d);ctx.save();ctx.translate(x,y);ctx.rotate(d*R);label(ctx,t,0,0,n*.075);ctx.restore();}
 ctx.restore();}
export function drawCDI(ctx,n,{heading=0,course=0,dev=0,off=false,to=true}){ctx.clearRect(0,0,n,n);base(ctx,n);drawCard(ctx,n,{heading,r0:.92});
 const cx=n/2,cy=n/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(course-heading);
 ctx.strokeStyle='#f2c437';ctx.lineWidth=n*.02;ctx.beginPath();ctx.moveTo(0,-n*.4);ctx.lineTo(0,-n*.2);ctx.moveTo(0,n*.2);ctx.lineTo(0,n*.4);ctx.stroke();
 ctx.fillStyle='#f2c437';ctx.beginPath();ctx.moveTo(0,-n*.44);ctx.lineTo(-n*.035,-n*.38);ctx.lineTo(n*.035,-n*.38);ctx.fill();
 for(let k=-2;k<=2;k++){if(!k)continue;ctx.fillStyle='#ddd';ctx.beginPath();ctx.arc(k*n*.07,0,n*.012,0,2*Math.PI);ctx.fill();}
 ctx.strokeStyle='#f2c437';ctx.lineWidth=n*.018;const d=Math.max(-1,Math.min(1,dev))*n*.15;ctx.beginPath();ctx.moveTo(d,-n*.18);ctx.lineTo(d,n*.18);ctx.stroke();
 ctx.fillStyle='#eee';ctx.beginPath();if(to){ctx.moveTo(0,-n*.13);ctx.lineTo(-n*.03,-n*.08);ctx.lineTo(n*.03,-n*.08);}else{ctx.moveTo(0,n*.13);ctx.lineTo(-n*.03,n*.08);ctx.lineTo(n*.03,n*.08);}ctx.fill();ctx.restore();
 ctx.strokeStyle='#f0f0f0';ctx.lineWidth=n*.012;ctx.beginPath();ctx.moveTo(cx-n*.07,cy+n*.03);ctx.lineTo(cx,cy-n*.02);ctx.lineTo(cx+n*.07,cy+n*.03);ctx.moveTo(cx,cy-n*.03);ctx.lineTo(cx,cy+n*.08);ctx.stroke();
 ctx.fillStyle='#f0f0f0';ctx.beginPath();ctx.moveTo(cx,cy-n*.47);ctx.lineTo(cx-n*.025,cy-n*.5);ctx.lineTo(cx+n*.025,cy-n*.5);ctx.fill();
 if(off){ctx.fillStyle='#c8382f';ctx.fillRect(cx+n*.12,cy-n*.22,n*.14,n*.07);label(ctx,'NAV',cx+n*.19,cy-n*.185,n*.045,{color:'#fff'});}}
export function drawRMI(ctx,n,{heading=0,b1=0,b2=0,copilot=false}){ctx.clearRect(0,0,n,n);base(ctx,n);drawCard(ctx,n,{heading,r0:.9});const cx=n/2,cy=n/2;
 const needle=(b,col,w,double)=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(b-heading);ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineWidth=n*w;
  ctx.beginPath();ctx.moveTo(0,-n*.4);ctx.lineTo(-n*.035,-n*.32);ctx.lineTo(n*.035,-n*.32);ctx.fill();
  if(double){ctx.beginPath();ctx.moveTo(-n*.012,-n*.32);ctx.lineTo(-n*.012,n*.38);ctx.moveTo(n*.012,-n*.32);ctx.lineTo(n*.012,n*.38);ctx.stroke();}else{ctx.beginPath();ctx.moveTo(0,-n*.32);ctx.lineTo(0,n*.4);ctx.stroke();}ctx.restore();};
 needle(b2,'#e8e4d8',.012,true);needle(b1,'#f4f1e7',.02,false);
 ctx.fillStyle='#e8e4d8';ctx.beginPath();ctx.moveTo(cx,cy-n*.46);ctx.lineTo(cx-n*.025,cy-n*.5);ctx.lineTo(cx+n*.025,cy-n*.5);ctx.fill();
 ctx.fillStyle='#222';ctx.beginPath();ctx.arc(cx,cy,n*.04,0,2*Math.PI);ctx.fill();
 if(copilot){label(ctx,'MAGN',cx-n*.2,cy+n*.22,n*.05);label(ctx,'RADIO',cx+n*.2,cy+n*.22,n*.05);label(ctx,'INDICATOR',cx,cy-n*.18,n*.05);}else label(ctx,'ADF',cx-n*.24,cy-n*.36,n*.05,{color:'#f0b33a'});}
export function drawAltDrum(ctx,n,{alt=0}){ // altimeter face with counter window (pilot / copilot), baro window
 ctx.clearRect(0,0,n,n);ctx.drawImage(FACECACHE.alt??(FACECACHE.alt=FACES.alt(n)),0,0,n,n);
 const th=Math.floor(Math.max(0,alt)/1000),txt=String(th).padStart(2,'0');ctx.fillStyle='#000';ctx.fillRect(n*.3,n*.58,n*.24,n*.13);ctx.strokeStyle='#888';ctx.lineWidth=n*.006;ctx.strokeRect(n*.3,n*.58,n*.24,n*.13);
 label(ctx,txt,n*.42,n*.645,n*.1,{color:'#f2f0e8',weight:'700'});ctx.fillStyle='#000';ctx.fillRect(n*.62,n*.44,n*.2,n*.1);label(ctx,'29.92',n*.72,n*.49,n*.055);}
const FACECACHE={};
export function drawCompass(ctx,n,{heading=0}){ctx.clearRect(0,0,n,n);ctx.fillStyle='#111';ctx.fillRect(0,0,n,n);ctx.fillStyle='#d9d4c2';ctx.fillRect(n*.08,n*.25,n*.84,n*.5);
 const hd=((heading/R)%360+360)%360;ctx.save();ctx.beginPath();ctx.rect(n*.08,n*.25,n*.84,n*.5);ctx.clip();
 for(let d=-60;d<=60;d+=5){const h=Math.round(hd/5)*5+d,x=n/2+(h-hd)*n*.012;const hh=((h%360)+360)%360;ctx.fillStyle='#111';ctx.fillRect(x-1,n*.25,2,hh%10?n*.08:n*.13);
  if(hh%30===0)label(ctx,{0:'N',90:'E',180:'S',270:'W'}[hh]??String(hh/10),x,n*.52,n*.14,{color:'#111',weight:'700'});}
 ctx.restore();ctx.fillStyle='#e0453a';ctx.fillRect(n/2-1.5,n*.2,3,n*.6);}
