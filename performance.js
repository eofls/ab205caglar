import {DEFAULT_WEIGHT_LB} from './flight-reference.js';
/* v0.39 performans planlaması (PPC) — TM 55-1520-210-10 bölüm 7 mantığıyla: yoğunluk irtifası, havır torku (yer tesirinde
   2 ft / yer tesiri dışında), azami kullanılabilir tork (30 dakika) ve güç payı. Abaklar sayısallaştırılmadı: değerler
   UH-1H / T53-L-13B için bilinen noktalara oturtulmuş bir yaklaşım (deniz seviyesi 9500 lb: IGE ≈ 39, OGE ≈ 46 PSI;
   azami tork 50 PSI transmisyon sınırı, yoğunluk irtifası arttıkça motor sınırlı). Uygunluk onayı değildir. */
const FT=.3048;
export function densityAltitudeFt(paFt,tempC){const isa=15-2*paFt/1000;return paFt+120*(tempC-isa);}
export function sigmaOf(daFt){return Math.pow(1-6.8756e-6*daFt,4.2561);}
export function ppc({weightLb=DEFAULT_WEIGHT_LB,paFt=3000,tempC=15}={}){const da=densityAltitudeFt(paFt,tempC),sig=sigmaOf(Math.max(-2000,da)),w=weightLb/9500;
 const oge=16+30*Math.pow(w,1.5)/Math.sqrt(sig),ige=oge*.84,max=Math.min(50,58-1.8*Math.max(0,da)/1000);
 const margin=max-oge,marginIge=max-ige;
 /* azami havır ağırlığı (yer tesirinde): ige(w)=max */
 const wMaxIge=9500*Math.pow(Math.max(0,(max/.84-16))*Math.sqrt(sig)/30,1/1.5),wMaxOge=9500*Math.pow(Math.max(0,(max-16))*Math.sqrt(sig)/30,1/1.5);
 return {da:Math.round(da/100)*100,sigma:sig,tqIge:Math.round(ige*10)/10,tqOge:Math.round(oge*10)/10,tqMax:Math.round(max*10)/10,margin:Math.round(margin*10)/10,marginIge:Math.round(marginIge*10)/10,
  wMaxIge:Math.min(9500,Math.round(wMaxIge/50)*50),wMaxOge:Math.min(9500,Math.round(wMaxOge/50)*50),goIge:marginIge>=0,goOge:margin>=0};}
export function ppcText(p){return `YOĞUNLUK İRTİFASI ${p.da} FİT; AZAMİ TORK ${p.tqMax} PSI; HAVIR TORKU YER TESİRİNDE ${p.tqIge}, YER TESİRİ DIŞINDA ${p.tqOge} PSI; GÜÇ PAYI ${p.margin>=0?p.margin:'YOK ('+p.margin+')'} PSI${p.goOge?'':' — YER TESİRİ DIŞI HAVIR GÜCÜ YOK'}`;}
/* site conditions: pressure altitude ≈ site elevation (standard pressure), temperature with the standard lapse from the configured value */
export function sitePpc(config,elevFt){const pa=Math.max(0,elevFt),t=(config.temperatureC??15)-2*(pa-(config.pressureAltitudeFt??3000))/1000;return ppc({weightLb:config.grossWeightLb??DEFAULT_WEIGHT_LB,paFt:pa,tempC:t});}
export {FT};

/* v0.39 tork göstergesi PPC'ye bağlı: güç oranı (şaft gücü / referans) × yer tesiri dışı havır torku / 1.25
   (programdaki güç eğrisinde OGE havır = 1.25). Ağırlık, basınç irtifası ve sıcaklıkla değişir. */
const PPC_CACHE=new Map();
export function torquePsi(p,config,elevFt){const ref=p.referenceShaftPowerW??p.shaftPowerW??1;const share=Math.max(0,(p.shaftPowerW??0)/(ref||1));
 const k=Math.round(elevFt/100)+'|'+config.grossWeightLb+'|'+config.temperatureC+'|'+config.pressureAltitudeFt;let pp=PPC_CACHE.get(k);if(!pp){pp=sitePpc(config,elevFt);PPC_CACHE.set(k,pp);if(PPC_CACHE.size>200)PPC_CACHE.clear();}
 return Math.min(90,share*pp.tqOge/1.25);}
