/* v0.39 yüksek sesle söylenecekler: ikaz metnindeki {TQ}, {ALT}, {ALT+500}, {IAS}, {HDG}, {AGL}, {FUEL}, {WIND}, {RPM}, {N1}
   o andaki gerçek değerlerle doldurulur (“DÜZ UÇUŞ TORKUM 34 PSI DUR”). Değerler göstergelerin kullandığı durumdan alınır. */
import {areaElevationM} from './terrain-data.js';
import {sitePpc,ppcText,torquePsi} from './performance.js';
const FT=.3048;
export function calloutValues(p,config,time){const pos=p.position??[0,0,0],area=config.flightArea??'terrain',agl=p.heightAglFt??0,eng=p.engineRpm??6600,shp=Math.max(0,p.shaftPowerW??0),pf=Math.min(1.3,shp/820000);
 const alt=areaElevationM(pos[0],pos[2],area)/FT+agl,hdg=((((p.heading??0)*180/Math.PI)%360)+360)%360;
 return {TQ:Math.round(p.program?torquePsi(p,config,alt-agl):Math.min(90,shp/16400)),ALT:Math.round(alt/10)*10,ALT100:Math.round(alt/100)*100,IAS:Math.round(p.iasKt??0),HDG:String(Math.round(hdg)%360||360).padStart(3,'0'),AGL:Math.round(agl/10)*10,FUEL:Math.round((9.6-time/600)*100/10)*10,
  WIND:config.windKt>0?`${String(Math.round(config.windFromDeg??0)).padStart(3,'0')}° / ${Math.round(config.windKt)} KNOT`:'SAKİN',PPC:ppcText(sitePpc(config,alt-agl)),RPM:Math.round(eng/10)*10,N1:Math.round(eng>3000?70+28*pf:eng/6600*60)};}
export function fillCallout(text,v){if(typeof text!=='string'||!text.includes('{'))return text;
 return text.replace(/\{(TQ|ALT|IAS|HDG|AGL|FUEL|WIND|RPM|N1|PPC)([+-]\d+)?\}/g,(m,k,off)=>{if(v[k]===undefined)return m;if(off){const base=k==='ALT'?v.ALT100:v[k];return String(base+Number(off));}return String(v[k]);});}
