import {currentLanding} from './site-redirect.js';
// S01 is a source-linked discussion exercise, not an aircraft procedure or flight solver.
export const SAFE_DECISIONS=[
 {id:'priority',at:8,title:'Güç kaybı belirtileri var. Mürettebatın ilk iş bölümü ne olsun?',source:['tr','crm'],options:[
  {id:'control',label:'Pilot uçuşu ve rotor devrini izlesin; ikinci pilot belirtileri çapraz kontrol etsin',text:'Uçuş kontrolü ile arızanın değerlendirilmesi ayrı görevler olarak tutuldu. Seyir koşulundaki rotor devri yönetimi, yer tesirinde havırla aynı ilk kumanda kalıbına indirgenmedi. Bu seçim devrin belirli bir değerde kaldığını kanıtlamaz.',risk:false},
  {id:'diagnose',label:'İki pilot da önce arızanın sebebini çözmeye odaklansın',text:'Ortak dikkat arızaya yöneldi. Dış çevre ve uçuşun izlenmesinde boşluk oluşabilir; tanımada/uygulamada gecikme kullanılabilir payı azaltabilir. Buradan sabit bir tepki süresi veya kaçınılmaz kaza sonucu çıkarılmıyor.',risk:true}
 ]},
 {id:'landing',at:25,title:'Hangi aday sahayı seçeceksin?',source:['tr','crm'],options:[
  {id:'shared',label:'1 ve 2’yi erişim, engel, zemin ve rüzgâr yönünden karşılaştır; görevleri paylaş',text:'Her iki aday incelemeye açık kaldı. Daha yakın veya daha düzgün görünmek tek başına uygunluk sağlamaz. Kumanda ve saha/gösterge izleme görevleri ayrıldı; erişilebilirlik henüz hesaplanmadı.',risk:false},
  {id:'distant',label:'2 daha düzgün görünüyor; diğer değerlendirmeleri bırakıp 2’ye odaklan',text:'2. aday sahaya dikkat daralması seçildi. Uzak sahaya takılma ve bunu zorlayan aşırı manevra, zaman/enerji payını azaltabilir. Sarı 2 işareti seçilen dikkat hedefidir; erişilebilir iniş sahası onayı değildir.',risk:true}
 ]}
];
export const LESSON_PHASES=[
 {at:0,label:'Başlangıç'}, {at:4,label:'Güç kaybı'}, {at:8,label:'Kontrol / karar'},
 {at:18,label:'Sistemler'}, {at:25,label:'Saha / karar'}, {at:40,label:'Son yaklaşma tartışması'}, {at:55,label:'Değerlendirme'}
];
const refs={engine:'TR §9.1.9, PDF 185–186 / basılı 9-2–9-3',systems:'TR §2.7.1, PDF 24 / basılı 2-11',crew:'CRM §2.4.1–2.4.4, PDF 14–16 / basılı 2-7–2-9'};
export function lessonView(time,choices=[],decisions=[]){
 const active=choices.filter(a=>a.at<=time),first=active.find(a=>a.id==='priority')?.option,second=currentLanding(active)?.option;
 const phases=LESSON_PHASES.map(p=>({...p,at:p.at===8?(decisions[0]?.at??choices.find(a=>a.id==='priority')?.at??4):p.at===25?(decisions.find(d=>d.id==='landing')?.at??choices.find(a=>a.id==='landing')?.at??25):p.at})).sort((a,b)=>a.at-b.at);const phase=phases.findLast(p=>p.at<=time)||phases[0];
 return {phase:phase.label,phases,phaseIndex:phases.indexOf(phase),engine:time<4?'Güç kaybı henüz enjekte edilmedi':'Tam güç kaybı · senaryo girdisi',
  rotor:time<4?'Dönüş gösterimi':'Serbest dönüş · deneysel RPM hesabı',
  crew:first==='diagnose'?'İki pilotun dikkati arızada':first==='control'?'Kontrol ve çapraz izleme paylaşıldı':'İş bölümü kararı bekleniyor',
  focus:!first?'none':second==='distant'?'B':'compare',
  field:second?.startsWith('site-')?second.slice(5)+'. aday saha · erişim garanti değil':!first?'Numaralı saha adayları değerlendirmeye açık':second==='distant'?'2’ye odaklanma · erişim doğrulanmadı':second==='shared'?'1 / 2 karşılaştırması · erişim doğrulanmadı':'1 / 2 saha adayları · seçim bekleniyor',
  priority:first??null,landing:second??null,complete:time>=55};
}
export function detailedEvents(config,choices,weather,crew){
 const first=choices.find(a=>a.id==='priority')?.option,second=currentLanding(choices)?.option;
 const event=(at,kind,title,text,source,reference)=>({at,kind,title,text,source,reference});
 const initial=[
 event(0,'Başlangıç','S01 · 400 ft / 60 KIAS · düz uçuşta tam güç kaybı','400 ft skid AGL, 60 KIAS çatı ölçeği. Düz uçuş, açık bozkır ve ayrı bir transmisyon/rotor arızası bulunmaması bu örneğin varsayımlarıdır. Ağırlık ve hava aracı girdileri kaynakla henüz doğrulanmadığı için bu nokta için emniyet garantisi veya otomatik H/V doğrulaması yapılmaz. Senaryo süresi fizik hesabındaki bitiş anına bağlıdır; karar değişirse yeniden hesaplanır.',['tr','chart'],'TR §5.8; H/V Şekil 9-3. Başlangıç ve süre: uygulama tasarımı.'),
 event(1,'Mürettebat','Başlangıç brifingi',`Pilot: ${crew[config.pilot].label}. ${crew[config.pilot].text} İkinci pilot: ${crew[config.copilot].label}. ${crew[config.copilot].text}`,['crm'],refs.crew),
 event(2,'Meteoroloji','Seçilen hava şartları',weather.effects.map(e=>e.text).join(' '),['faa','crm','met'],'Seçilen değerler: kullanıcı girdisi. Bileşenler: geometrik hesap; kuvvet modeli değil.'),
 event(4,'Sistem','Güç kaybı ve belirtilerin birlikte değerlendirilmesi','Tam güç kaybı. Belirtiler: tork, N1 ve motor yağ basıncı düşer, motor sesi değişir, burun sola sapar. Tek bir RPM ışığı veya ikaz sesi tek başına teşhis için yeterli değildir; göstergeler birlikte okunur.',['tr'],refs.engine),
 event(6,'Aerodinamik','Seyir koşulu ile alçak havırı ayır','Kaynak, ilk kollektif uygulamasını arızanın oluştuğu yükseklik ve süratle ilişkilendirir. Bu senaryo düz uçuş örneğidir. Rotor devrinin limitler içinde yönetilmesi tartışılır; alçak havırın ilk kumanda yaklaşımı buraya kopyalanmaz.',['tr'],refs.engine),
 event(12,'Aerodinamik','Otorotatif alçalışın enerji ilişkisi','Motor tahriki olmadan alçalıştaki hava akımı rotorun dönüşünü sürdürmeye katkı sağlar. Yükseklik, sürat ve rotor enerjisi birlikte ele alınır. Görüntüdeki dönüş bir RPM ölçümü; çizilen yol ise süzülüş menzili hesabı değildir.',['tr','faa'],'TR §9.1.9; FAA Helicopter Flying Handbook, Autorotation.'),
 event(18,'Sistem','Motor kaybı bütün sistemlerin aniden durması değildir','Serbest bırakma kavraması motoru rotordan ayırır. Kuyruk rotoru, hidrolik pompa ve ana DC jeneratörü transmisyondan hareket alır; rotor döndükçe çalışmaya devam eder.',['tr'],refs.systems),
 event(20,'Saha','1 ve 2: değerlendirme adayları','Sahnede 1 ve 2 işaretleri belirdi. 1 daha yakın açık alanı, 2 daha uzakta düzgün görünen alanı temsil eder. İşaretler gerçek arazi keşfi veya erişim hesabı değildir. Engel, eğim, yüzey ve rüzgâr birlikte değerlendirilmeli; yalnız görünüşe göre karar verilmemelidir.',['tr','crm'],refs.engine+'; '+refs.crew),
 event(30,'Meteoroloji','Saha kararına hava bilgisini yeniden kat',`${Math.abs(weather.headwind).toFixed(1)} kt ${weather.headwind>=0?'karşı':'arka'} ve ${Math.abs(weather.crosswind).toFixed(1)} kt yan rüzgâr bileşeni mevcut başa göredir; 1 veya 2’ye yaklaşma doğrultusuna göre hesaplanmış değildir. Görüş ${config.visibilityKm} km; ${config.turbulence==='none'?'türbülans seçilmedi':config.turbulence==='light'?'hafif türbülans seçildi':'orta türbülans seçildi'}. Sıcaklık ve basınç irtifası, ağırlık ve kaynak performans koşullarından ayrı yorumlanmaz.`,['faa','met','crm'],'Rüzgâr bileşenleri: geometrik hesap. Saha ve hava bağlantısı: nitel eğitim değerlendirmesi.'),
 event(34,'Mürettebat','Zaman kalırsa ikincil görevleri değerlendir','Türkçe kaynak, otorotatif süzülüşte zaman izin verirse haberleşme ve emercensi hazırlıkları ele alır. Bu görevler uçuş kontrolünün önüne konulmaz. Harici yük bu örnekte yoktur; otomatik yük atma veya motoru yeniden çalıştırma işlemi uygulanmaz.',['tr','crm'],'TR §9.1.9 notu ve §9.1.12; '+refs.crew),
 event(40,'Aerodinamik','Son yaklaşma ve temas öncesi değerlendirme','Sürat, rotor enerjisi, yer açıklığı ve seçilen yüzeyin ilişkisi tartışılır. Alçak açıklıkta yavaşlama imkânı ve kuyruk açıklığı önemlidir. Bu aşamada belirli flare yüksekliği, kumanda miktarı veya temas hızı verilmez; animasyon yere temas göstermeden durur.',['tr'],refs.engine),
 event(48,'Değerlendirme','Seçimlerinin bir arada etkisi',`${first==='diagnose'?'İlk kararda dikkat arızaya toplandı; kontrol ve dış çevre izleme boşluğu riski tartışmaya eklendi.':'İlk kararda kontrol ve çapraz izleme ayrıldı.'} ${second==='distant'?'İkinci kararda 2’ye odaklanıldı; erişim ve alternatif saha değerlendirmesinin ihmal edilmesi riski eklendi.':'İkinci kararda iki adayın karşılaştırılması ve görev paylaşımı korundu.'} Bunlar nitel sonuçlardır; hasar veya iniş başarısı hesaplanmadı.`,['tr','crm'],refs.engine+'; '+refs.crew),
 event(55,'Sonuç','S01 değerlendirmesi · iniş sonucu hesaplanmadı',outcome(first,second),['tr','crm'],refs.engine+'; '+refs.crew)
 ];
 for(const a of choices){const d=SAFE_DECISIONS.find(d=>d.id===a.id),o=d?.options.find(o=>o.id===a.option);if(o)initial.push({...event(d.at+.1,'Karar',o.label,o.text,d.source,refs.engine+'; '+refs.crew),risk:o.risk});}
 return initial.sort((a,b)=>a.at-b.at);
}
function outcome(first,second){
 const messages={
 'control/shared':'Kontrol ve çapraz izleme paylaşılırken iki saha adayı da değerlendirmede tutuldu. Bu dalın tartışma kazanımı, ilk öncelik ile saha kararının birlikte korunmasıdır; hasarsız iniş garantisi değildir.',
 'control/distant':'İlk kontrol önceliği korundu; daha sonra 2’nin görünüşüne odaklanılması bu kazanımı zayıflatabilecek bir karar zinciri oluşturdu. İyi bir ilk karar, sonraki saha kararını otomatik olarak doğru yapmaz.',
 'diagnose/shared':'İlk anda iki pilotun arızaya odaklanması izleme boşluğu riski yarattı. Sonraki görev paylaşımı ve saha karşılaştırması yön değişikliğidir; önceki gecikmenin etkisini otomatik olarak silmez.',
 'diagnose/distant':'Arızaya ortak odaklanmanın ardından 2’ye takılma seçildi. Kontrol/dış çevre izlemesi ve saha seçenekleri açısından biriken riskler tartışılır; buradan kesin kaza veya sayısal hasar sonucu çıkarılmaz.'
 };
 return messages[`${first}/${second}`]||'Kararlar tamamlanmadan değerlendirme sonucu oluşturulmaz.';
}
