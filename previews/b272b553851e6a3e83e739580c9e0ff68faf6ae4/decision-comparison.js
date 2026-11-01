const ignore=new Set(['mode','scenario','customStart','startHeightFt','startIasKt']);
export function sameConditions(a,b){const cfg=s=>Object.entries(s.config).filter(([k])=>!ignore.has(k)).sort(([a],[b])=>a.localeCompare(b));return JSON.stringify([a.scenario.height,a.scenario.ias,cfg(a)])===JSON.stringify([b.scenario.height,b.scenario.ias,cfg(b)]);}
const names={approach:'uzak hedef yaklaşması',cyclic:'saykılık / ufkiyet',finalPull:'ertelenmiş son kollektif',flare:'fleyır',priority:'ilk müdahale',recovery:'rotor devri müdahalesi',landing:'iniş sahası',cushion:'son kollektif',vrs:'VRS müdahalesi',overspeed:'yüksek devir müdahalesi',yaw:'pedal düzeltmesi',criticalRotor:'kritik rotor enerjisi'};
const signed=(x,d=1)=>(x>0?'+':'')+x.toFixed(d);
export function decisionEffect(a,b){
 if(a.time<a.scenario.duration||b.time<b.scenario.duration)return 'İki koşu da tamamlandığında karar–sonuç farkı gösterilir.';
 if(!sameConditions(a,b))return 'Başlangıç veya koşullar farklı; sonuç farkı yalnız kumanda kararına bağlanamaz.';
 if(a.config.mode!==b.config.mode)return 'Akış türleri farklı: uyarlanabilir pilot ile kullanıcı kararları karşılaştırılıyor; fark tek bir kumandaya bağlanamaz.';
 const aa=a.choices(),bb=b.choices(),ids=[...new Set([...aa,...bb].map(x=>x.id))];
 const changed=ids.filter(id=>{const x=aa.find(c=>c.id===id),y=bb.find(c=>c.id===id);return x?.option!==y?.option||x?.at!==y?.at;});
 if(!changed.length)return 'Başlangıç, koşullar ve karar geçmişi aynı; bağımsız bir karar farkı yok.';
 const x=a.evidence().summary,y=b.evidence().summary;
 const prefix=changed.length===1?`Tek değişen karar/zaman: ${names[changed[0]]}.`:`Birlikte değişen kararlar/zamanlar: ${changed.map(id=>names[id]).join(', ')}. Fark tek bir karara ayrı ayrı yüklenemez.`;
 const contact=x.contact&&y.contact?` Temas öncesi düşey sürat farkı ${signed(x.contact.descentMps-y.contact.descentMps,2)} m/s; yatay sürat farkı ${signed((x.contact.groundSpeedMps-y.contact.groundSpeedMps)*3600/1852)} kt.`:' İki koşuda da temas bulunmadığından temas farkı hesaplanmadı.';
 return `${prefix} Mevcut − kayıtlı: minimum rotor ${signed(x.minRotorRpm-y.minRotorRpm)} RPM; süre ${signed(x.duration-y.duration,2)} s.${contact} Bu farklar deneysel model sonucudur; hasar veya güvenli iniş sınıfı değildir.`;
}
