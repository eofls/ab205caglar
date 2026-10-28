// Mid-scenario site selection: a field picked after the landing question opens its own decision
// at that instant ("redirect-N"). Answer "site-N" steers guidance to it; "keep" removes it again.
export const isLandingAnswer=a=>a.id==='landing'||String(a.id).startsWith('redirect-');
export function currentLanding(choices,t=Infinity){let r=null;for(const a of choices)if(isLandingAnswer(a)&&a.option!=='keep'&&a.at<=t&&(!r||a.at>=r.at))r=a;return r;}
export const redirectId=site=>'redirect-'+site.number;
export function redirectDecision(site){
 const n=site.number;
 return {id:redirectId(site),title:`${n}. aday sahaya yönelmek istiyor musun?`,source:['tr','crm'],options:[
  {id:'site-'+n,label:`Evet, ${n}. aday sahaya yönel`,text:`Rota ${n}. aday sahaya çevrildi. Erişim, rüzgâr ve kalan enerjiyle hesaplanır; iniş garantisi değildir. Mevcut hız, yükseklik ve rotor devri aynen korunur.`,risk:false},
  {id:'keep',label:'Hayır, mevcut planla devam et',text:'Aday saha kaldırıldı; akış önceki hedefle devam ediyor.',risk:false}
 ]};
}
