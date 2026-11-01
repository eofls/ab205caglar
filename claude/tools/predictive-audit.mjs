import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
import {Session} from '../../engine.js';import {flightState} from '../../flight-dynamics.js';
let md='# Öngörülü pilot karşılaştırması — v0.23\n\nAynı başlangıçta eski durum pilotu / 2 saniyelik öngörülü pilot. Sayılar deneysel model çıktılarıdır. Daha düşük düşey hız tek başına daha düşük toplam temas enerjisi anlamına gelmez. Tam iniş optimizasyonu garanti edilmez.\n\n| AGL ft | IAS kt | Güç kaybı | Düşey m/s eski → yeni | Yer kt eski → yeni | Rotor RPM eski → yeni |\n|---|---|---|---|---|---|\n';
let count=0,betterVertical=0,betterHorizontal=0;
for(const startHeightFt of [100,400])for(const startIasKt of [0,30,60])for(const powerLossMode of ['total','partial']){
 const s=new Session({mode:'watch',customStart:true,startHeightFt,startIasKt,powerLossMode});
 const a=flightState(180,s.baseScenario,{...s.config,predictivePilot:false}),b=flightState(180,s.baseScenario,s.config);assert.ok(a.contact&&b.contact);
 for(const p of [a,b])assert.ok([p.contact.descentMps,p.contact.groundSpeedMps,p.contact.rotorRpm].every(Number.isFinite));
 const x=a.contact,y=b.contact;betterVertical+=y.descentMps<x.descentMps?1:0;betterHorizontal+=y.groundSpeedMps<x.groundSpeedMps?1:0;count++;
 md+=`| ${startHeightFt} | ${startIasKt} | ${powerLossMode} | ${x.descentMps.toFixed(2)} → ${y.descentMps.toFixed(2)} | ${(x.groundSpeedMps*3600/1852).toFixed(1)} → ${(y.groundSpeedMps*3600/1852).toFixed(1)} | ${x.rotorRpm.toFixed(1)} → ${y.rotorRpm.toFixed(1)} |\n`;
}
md+=`\n${count} koşuldan ${betterVertical} tanesinde düşey temas hızı, ${betterHorizontal} tanesinde yatay temas hızı azaldı. Eşit veya kötüleşen ölçüler saklanmadı; tablo her koşulu gösterir. Bir ölçünün iyileşmesi diğerinin iyileştiği anlamına gelmez.\n`;
writeFileSync(new URL('../docs/PREDICTIVE-AUDIT-v023.md',import.meta.url),md);console.log({count,betterVertical,betterHorizontal});
