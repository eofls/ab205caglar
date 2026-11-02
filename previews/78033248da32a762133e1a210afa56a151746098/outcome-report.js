import {contactMechanics} from './ground-contact.js';
// Explanations describe this computed trajectory, not a certified causal accident analysis.
export function movementSummary(session){
 const e=session.evidence(),end=e.summary.contact?.time??e.summary.duration;
 const phases=e.events.filter(x=>(x.kind==='Kumanda'||x.kind==='Uçuş hareketi')&&x.at<=end&&!x.title.includes('Pedal'));
 return phases.map(x=>`${x.at.toFixed(1)} s: ${x.title}`).join(' → ')||'Dinamik uçuş hareketi yok.';
}
export function outcomeExplanation(session){
 const e=session.evidence(),c=e.summary.contact;
 if(!c||c.time===0)return 'Dinamik ilk temas bulunmadığı için iniş manevrası sonucu hesaplanmadı.';
 const samples=e.samples.filter(x=>x.time<=c.time),pull=samples.find(x=>x.cushion),flare=samples.find(x=>x.maneuver?.flaring),level=samples.find(x=>x.levelCyclic);
 const parts=[`İlk temasta düşey hız ${c.descentMps.toFixed(2)} m/s, yer sürati ${(c.groundSpeedMps*3600/1852).toFixed(1)} kt, rotor ${c.rotorRpm.toFixed(1)} RPM.`];
 const m=contactMechanics(c);parts.push(`Zemin: ${m.surface.label??'sert yüzey'}. Hesaplanan yatay durma mesafesi ${m.distance.toFixed(1)} m. ${m.rollover?'Takılma ve devrilme, ikincil rotor/kuyruk teması riski.':m.snag?'Skid takılması / sürüklenme.':m.water?'Suya giriş; yüzdürme doğrulanmadı.':'Kayma / yerleşme.'}`);
 if(pull){parts.push(`Son kollektif talebi ${pull.heightAglFt.toFixed(1)} ft ve ${pull.descentFpm.toFixed(0)} ft/dk alçalışta başladı; temasa ${(c.time-pull.time).toFixed(2)} s kaldı.`);if(pull.stopping.insufficient)parts.push('O andaki yaklaşık durdurma hesabında yükseklik/kuvvet payı yetersizdi; RPM toparlanması bu zaman kaybını silmez.');}
 else parts.push('Bu dalda temastan önce son kollektif uygulanmadı.');
 parts.push(flare?'Disk eğimi ve yavaşlama ile gerçek fleyır hareketi oluştu; ileri ve düşey enerji aynı fizik hesabına girdi.':'Bu dalda ölçülen fleyır hareketi oluşmadı; verilmiş bir komut varsa hareketin gerçekleştiği varsayılmadı.');
 if(level)parts.push('Ufkiyet talebi saykılık tepki süresiyle uygulandı.');
 else if(flare)parts.push('Temastan önce ufkiyet talebi oluşmadı; kalan disk eğimi/tutum sonucu etkiledi.');
 parts.push('Temas sertliği düşey enerji endeksidir; yatay hız ve tutum hasar taramasında ayrıca değerlendirilir. Katsayılar deneysel olduğundan sert temasın gerçek uçakta kaçınılmaz olduğu sonucu çıkarılamaz.');
 return parts.join(' ');
}
