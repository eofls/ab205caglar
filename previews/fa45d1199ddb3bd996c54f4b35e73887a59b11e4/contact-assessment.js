import {componentDamage} from './component-damage.js';
import {damageScreening} from './damage-screening.js';
import {structuralContact} from './structural-contact.js';
import {LANDING_MODEL} from './landing-analysis.js';
// Pre-contact mechanics; no structural force/displacement or occupant injury model.
export function contactSeverity(descentMps,referenceMps=LANDING_MODEL.referenceContactMps){
 if(!Number.isFinite(descentMps)||!Number.isFinite(referenceMps)||referenceMps<=0)throw Error('Geçersiz temas ölçeği');
 const rawPercent=100*(Math.max(0,descentMps)/referenceMps)**2,percent=Math.round(Math.min(100,rawPercent));
 return {percent,rawPercent,referenceMps,saturated:rawPercent>100,label:percent<20?'Hafif temas':percent<45?'Orta sert':percent<70?'Sert':'Çok sert',color:`hsl(${120*(1-percent/100)} 75% 30%)`,note:`Düşey enerji endeksi; %100 = ${referenceMps} m/s görsel referansı. Hasar olasılığı veya AB-205 limiti değildir.`};
}
export function contactAssessment(p,structuralModel=null){
 if(!p.contact||p.contact.time===0)return {available:false,damage:'Belirlenemedi',accident:'Sınıflandırılmadı',reason:p.contact?'Başlangıç zaten yerde; dinamik iniş teması yok.':'Hesapta temas oluşmadı.'};
 const estimate=damageScreening(p),components=componentDamage(p);
 const w=Math.max(0,p.contact.descentMps),v=p.contact.groundSpeedMps;
 return {available:true,components,severity:contactSeverity(w),structure:structuralContact(p,structuralModel),verticalEnergyJ:.5*p.massKg*w*w,horizontalEnergyJ:.5*p.massKg*v*v,equivalentDropM:w*w/(2*9.80665),
 pitchDeg:p.pitch*180/Math.PI,rollDeg:p.roll*180/Math.PI,damage:estimate.damage,accident:estimate.accident,estimate,
 reason:estimate.reason+' Parçalar: '+components.summary+'. '+components.note};
}
