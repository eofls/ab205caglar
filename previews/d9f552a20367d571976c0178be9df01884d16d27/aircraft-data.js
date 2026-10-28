// Reference transcription is not an approval for an individual aircraft or a dynamics model.
export const AIRCRAFT_OPTIONS={
 airframeType:{unknown:'Belirtilmedi',ab205:'AB-205',uh1h:'UH-1H',other:'Diğer konfigürasyon'},
 engineType:{unknown:'Belirtilmedi',t53l13:'T53-L-13',t53l703:'T53-L-703 / 703',other:'Diğer motor'},
 bladeType:{unknown:'Belirtilmedi',metal:'Metal pal',composite:'Kompozit pal'},
 pitotLocation:{unknown:'Belirtilmedi',roof:'Çatı',nose:'Burun'},
 externalLoad:{unknown:'Belirtilmedi',none:'Harici yük yok',attached:'Harici yük var'}
};
export const POWERED_FLIGHT_REFERENCE=Object.freeze({rotorRpm:324,engineRpm:6600,powerState:'powered',source:'TR §7.5.1, PDF 118 / basılı 7-5; kullanıcı girdisiyle uyumlu'});
export const DEFAULT_AIRCRAFT={grossWeightLb:null,initialRotorRpm:null,initialEngineRpm:null,airframeType:'unknown',engineType:'unknown',bladeType:'unknown',pitotLocation:'unknown',externalLoad:'unknown',manualRevision:''};
export const OPTIONAL_AIRCRAFT_NUMBERS=['grossWeightLb','initialRotorRpm','initialEngineRpm'];
export const REFERENCE_ROWS=[
 {id:'powered',title:'Motor gücü mevcutken normal uçuş',value:'324 rotor RPM / 6600 motor RPM',source:'TR §7.5.1, PDF 118 / basılı 7-5; kullanıcı girdisiyle uyumlu',context:'Normal uçuş referansı; motor arızasından sonraki hedef veya sabit devir ilişkisi değildir.',status:'Metin ve sayfa görseliyle karşılaştırıldı',image:'powered-reference.png'},
 {id:'weight',title:'Azami gros ağırlık',value:'9.500 lb',source:'TR §5.4.2, PDF 91 / basılı 5-2',context:'Kaynakta belirtilen sınır. İrtifa/sıcaklık performansı ve ağırlık merkezi ayrıca değerlendirilir.',status:'Metinden okundu'},
 {id:'hv',title:'H/V kartının ağırlık kapsamı',value:'9.500 lb ve altı',source:'TR §5.8, PDF 93 / basılı 5-4',context:'Bu ifade eğrileri, çevre koşullarını veya hava aracı konfigürasyonunu tek başına doğrulamaz.',status:'Metinden okundu'},
 {id:'rotor',title:'Rotor takometresi işaretleri',value:'294–324 RPM devamlı; 339 RPM maksimum',source:'TR Şekil 5-1.2, PDF 95 / basılı 5-6',context:'Gösterge açıklamasının aktarımıdır; güçsüz uçuş hedefi olarak otomatik uygulanmaz.',status:'Görselden okundu',image:'rotor-reference.png'},
 {id:'cruise',title:'Metal pal ile seyir',value:'319–324 rotor RPM',source:'TR §5.2.2, PDF 90 / basılı 5-1',context:'Metin, kompozit pal için bu sınırlamanın geçerli olmadığını belirtir. Bu, kompozit için limitsiz kullanım anlamına gelmez.',status:'Metinden okundu'},
 {id:'min-descent',title:'Grafikte minimum alçalma sürati',value:'63 kt çatı / 52 kt burun',source:'TR Şekil 9-2, PDF 197 / basılı 9-14',context:'Grafiğin işaretli sürat çiftidir; her koşul için otomatik hedef sürat değildir.',status:'Grafik etiketinden okundu',image:'autorotation-reference.png'},
 {id:'max-glide',title:'Grafikte azami süzülüş mesafesi sürati',value:'98 kt çatı / 82 kt burun',source:'TR Şekil 9-2, PDF 197 / basılı 9-14',context:'Mevcut başlangıç seçiminin 0–80 kt çatı aralığını genişletmez; yalnız referans bilgidir.',status:'Grafik etiketinden okundu',image:'autorotation-reference.png'},
 {id:'curves',title:'Alçalma ve süzülüş eğrileri',value:'284 / 314 / 339 rotor RPM eğrileri',source:'TR Şekil 9-2, PDF 197 / basılı 9-14',context:'Eğri üzerindeki RPM değerleri işletme limiti değildir. 284/314 RPM için 40–80, 339 RPM için 50–80 çatı KIAS bölümünde alçalma ve süzülüş oranı yaklaşık okundu. Kaynakla yaklaşık karşılaştırıldı; deneysel hesapta kullanılıyor, bağımsız doğrulama tamamlanmadı.',status:'Kısmi ön okuma',image:'autorotation-reference.png'},
 {id:'engine',title:'Motor konfigürasyonu ayrımı',value:'Ana metin T53-L-13; 703 için EK-C',source:'TR PDF 16 / basılı 2-3; §5.3, PDF 91 / basılı 5-2',context:'703 seçimi, ana metindeki motor verilerini 703’e aktarmayı engelleyen bir ayrım olarak kaydedilir.',status:'Metinden okundu'}
];
export function parseAircraftNumber(value){return typeof value==='string'&&value.trim()===''?null:Number(value);}
export function validateAircraftConfig(raw){
 const c={...DEFAULT_AIRCRAFT,...raw};
 for(const [key,max] of [['grossWeightLb',20000],['initialRotorRpm',1000],['initialEngineRpm',20000]]){
  const n=c[key];if(n!==null&&(typeof n!=='number'||!Number.isFinite(n)||!Number.isInteger(n)||n<1||n>max))throw Error(key==='grossWeightLb'?'Gros ağırlık boş veya 1–20000 arasında tam sayı lb olmalı.':key==='initialRotorRpm'?'Başlangıç rotor devri boş veya 1–1000 arasında tam sayı RPM olmalı.':'Başlangıç motor devri boş veya 1–20000 arasında tam sayı RPM olmalı.');
 }
 for(const [key,options] of Object.entries(AIRCRAFT_OPTIONS))if(typeof c[key]!=='string'||!Object.hasOwn(options,c[key]))throw Error('Geçersiz hava aracı seçimi: '+key);
 if(typeof c.manualRevision!=='string'||c.manualRevision.length>160)throw Error('Kitap/revizyon notu en fazla 160 karakter olmalı.');
 c.manualRevision=c.manualRevision.trim();return Object.fromEntries(Object.keys(DEFAULT_AIRCRAFT).map(key=>[key,c[key]]));
}
export function aircraftAssessment(c){
 const warnings=[],missing=[];
 if(c.grossWeightLb===null)missing.push('Gros ağırlık girilmedi.');
 else if(c.grossWeightLb>9500)warnings.push('Girilen ağırlık, incelenen Türkçe kaynağın 9.500 lb sınırının üzerinde. Referans kapsamı dışında eğitim girdisi olarak saklandı.');
 if(c.initialRotorRpm===null)missing.push('Başlangıç rotor devri girilmedi.');
 else {
  if(c.initialRotorRpm<294||c.initialRotorRpm>324)warnings.push('Başlangıç devri, kaynakta gösterilen 294–324 RPM devamlı işaret aralığının dışında. Bu karşılaştırma otorotasyon limiti doğrulaması değildir.');
  if(c.initialRotorRpm>339)warnings.push('Başlangıç devri, kaynak gösterge açıklamasındaki 339 RPM maksimum değerinin üzerinde.');
  if(c.bladeType==='metal'&&c.scenario==='safe'&&!c.customStart&&(c.initialRotorRpm<319||c.initialRotorRpm>324))warnings.push('S01 düz uçuş başlangıcı: metal pal için kaynakta yazan 319–324 RPM seyir aralığıyla uyuşmuyor.');
 }
 if(c.initialEngineRpm==null)missing.push('Başlangıç motor devri girilmedi.');
 for(const [key,label] of [['airframeType','Hava aracı tipi'],['engineType','Motor tipi'],['bladeType','Pal tipi'],['pitotLocation','Pitot konumu'],['externalLoad','Harici yük durumu']])if(c[key]==='unknown')missing.push(label+' belirtilmedi.');
 if(c.pitotLocation==='nose')warnings.push('Burun pitotu seçildi; H/V başlangıç girişi hâlâ çatı KIAS ölçeğidir. Otomatik dönüşüm yapılmadı; 60 kt çatı ile 60 kt burun eşit kabul edilmez.');
 if(c.engineType==='t53l703')warnings.push('703 motor seçildi. EK-C motor limitleri bu sürümde çıkarılmadı; T53-L-13 motor verileri uygulanmaz.');
 if(c.airframeType==='other'||c.engineType==='other')warnings.push('Seçilen diğer konfigürasyon için ayrı kaynak eşlemesi gerekiyor.');
 if(c.bladeType==='composite')warnings.push('Metal pal seyir kısıtı kompozit pala otomatik uygulanmaz; kompozit konfigürasyonun limitleri ayrıca doğrulanmalı.');
 if(c.externalLoad==='attached')warnings.push('Harici yük seçildi. Mevcut animasyonlarda yük dinamiği yok; S01’in harici yük yok varsayımıyla uyuşmaz.');
 const blockers=['Hava aracına uygulanabilir güncel kitap/revizyon ve konfigürasyon eşleşmesi doğrulanmadı.','Ağırlık merkezi ve yükleme durumu doğrulanmadı.','Şekil 9-2 eğrilerinin kısmi okumaları kaynakla karşılaştırıldı; bağımsız doğrulama, kalan aralıklar ve konfigürasyon koşulları bekliyor.','Rotor ataleti, aerodinamik kuvvetler ve geçiş modeli doğrulanmadı.'];
 return {massKg:c.grossWeightLb===null?null:c.grossWeightLb*.45359237,weightReference:c.grossWeightLb===null?'unknown':c.grossWeightLb>9500?'outside':'within-stated-maximum',warnings,missing,blockers,physicsReady:false,sourceApplicability:'unverified',inputComplete:missing.length===0};
}
export function aircraftSummary(c){const a=aircraftAssessment(c);return `Gros ağırlık: ${c.grossWeightLb===null?'belirtilmedi':c.grossWeightLb+' lb ('+a.massKg.toFixed(1)+' kg)'}. Başlangıç rotor devri: ${c.initialRotorRpm===null?'belirtilmedi':c.initialRotorRpm+' RPM (girdi; canlı ölçüm değil)'}. Başlangıç motor devri: ${c.initialEngineRpm==null?'belirtilmedi':c.initialEngineRpm+' RPM (girdi; canlı ölçüm değil)'}. ${Object.entries(AIRCRAFT_OPTIONS).map(([key,options])=>options[c[key]]).join(' / ')}. ${a.warnings.join(' ')} Deneysel hareket ve RPM hesabı etkin. Ağırlık boşsa 2800 kg varsayılır; uçuş doğrulaması yapılmadı.`;}
