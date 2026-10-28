// Contextual discussion branches; no timed emergency procedure or flight solution.
const source=['tr','crm'];
const reference='TR §9.1.9–9.1.11, PDF 185–186 / basılı 9-2–9-3; CRM §2.4. Anlatım zamanları uygulama tasarımıdır.';
export const PROFILES={
 hover:{code:'S02',title:'Yer tesirinde havır',goal:'Alçak havır ile düz uçuşun ilk kumanda yaklaşımını ayır.',
  first:'3 ft / 0 kt: ilk dikkat ve görev paylaşımı nasıl olsun?',control:'Alçak havır koşuluna odaklan; kontrol ve rotor izlemeyi paylaş',controlText:'Yer tesirindeki havırda seyir uçuşunun kollektif azaltma yaklaşımı aynen uygulanmaz. Kontrol, rotor enerjisi ve hemen altındaki yüzey birlikte izlenir; kumanda miktarı bu uygulamada hesaplanmaz.',
  second:'Hemen altındaki yüzey ve çevre nasıl değerlendirilsin?',shared:'Altındaki yüzeyi, kızak hizasını ve yakın engelleri birlikte değerlendir',sharedText:'Öncelik yakın çevreyi ve yer açıklığını birlikte değerlendirmede tutuldu. Yakın yüzeyin düz görünmesi emniyetli temas garantisi değildir.',
  middle:'İleri sürat yok: bu örneğe seyir süzülüş grafiğinden alçalma değeri atanmaz. Rotor enerjisi ile yer açıklığı tartışılır.',
  environment:'Rüzgârın yönü ve yanal bileşeni, yer üzerindeki hizayı izleme ihtiyacına eklenir. Temsili sahne gerçek sürüklenme hesabı üretmez.',
  summary:'Bu dalın kazanımı alçak havırın ayrı değerlendirilmesidir. Temas ve sonrasındaki sonuç deneysel hesapla üretilir.'},
 'avoid-low':{code:'S03',title:'Düşük süratli uçuş',goal:'Mevcut yüksekliği, düşük ileri sürati ve saha erişimini birlikte değerlendir.',
  first:'200 ft / 10 kt: ilk görev paylaşımı nasıl yapılsın?',control:'Kontrol ve rotor devrini izle; ikinci pilot başlangıç koşulunu çapraz kontrol etsin',controlText:'Düşük ileri sürat ile yüksekliğin birlikte ele alınması seçildi. Bu başlangıç, kararlı otorotasyonun kurulmuş olduğunu göstermez; kontrol ve izleme görevleri ayrılır.',
  second:'Bir alan daha düzgün görünüyor. Saha kararı neye dayansın?',shared:'Görünüşün yanında erişim, engel ve rüzgârı değerlendir',sharedText:'Daha düzgün yüzey ile ulaşılabilir yüzey aynı şey değildir. Seçenekler değerlendirmede tutuldu; bu sürüm bir erişim zarfı hesaplamaz.',
  middle:'10 KIAS, inceleyicide sayısallaştırılan 40–80 KIAS bölümünün dışındadır. Grafikten uzatma yapılarak alçalma veya rotor devri üretilmez.',
  environment:'Görüş azaldığında saha ve engel değerlendirmesi güçleşebilir. Sıcaklık, basınç irtifası ve ağırlık ayrıca değerlendirilir; etki için sabit katsayı atanmaz.',
  summary:'Kontrolün korunması, düşük süratli bu başlangıçtan hasarsız inişi kanıtlamaz. Kullanılabilir pay ve saha seçimi birlikte tartışılır.'},
 caution:{code:'S04',title:'Alçak uçuş / ileri sürat',goal:'İleri sürat varken sınırlı yer açıklığını değerlendirmede tut.',
  first:'40 ft / 70 kt: ilk dikkat önceliği nasıl kurulsun?',control:'Kontrol, rotor devri ve yer açıklığını paylaşarak izle',controlText:'İleri sürat, yavaşlama için yeterli yer açıklığı bulunduğunu tek başına göstermez. Uçuş kontrolü ve yakın çevre izlemesi birlikte tutuldu.',
  second:'İleri sürat varken saha seçimini nasıl yaparsın?',shared:'Yakın yüzey, engel ve yavaşlama için mevcut açıklığı birlikte değerlendir',sharedText:'Saha kararı yalnız uzak yüzeyin görünüşüne bağlanmadı. Yerden açıklık ve kuyruk açıklığı değerlendirmede kaldı; duruş mesafesi hesaplanmadı.',
  middle:'Bu başlangıçta ileri sürat bulunması güvence değildir. Kaynak, alçak açıklıkta yavaşlama imkânını ve kuyruk açıklığını ayrı değerlendirmeyi gerektirir.',
  environment:'Rüzgâr bileşeni mevcut başa göredir. Görüşteki azalma, yakın engellerin fark edilmesini etkileyebilir; animasyon engel çarpışması hesabı yapmaz.',
  summary:'İkazlı saha başlangıcında nitel karar değerlendirmesi yapılır. Hasar olasılığına sayısal yüzde veya temas hızı atanmaz.'},
 'avoid-fast':{code:'S05',title:'Yere çok yakın / yüksek sürat',goal:'Yüksek sürati, yavaşlama için kullanılabilir yükseklikle karıştırma.',
  first:'5 ft / 75 kt: ilk değerlendirmede ne öne çıksın?',control:'Kontrol ve çok sınırlı yer açıklığını birlikte izle',controlText:'Süratin yüksek olması yer açıklığı sorununu ortadan kaldırmaz. Kontrol ve yakın yüzey birlikte izlenir; belirli flare açısı veya kumanda miktarı verilmez.',
  second:'Çok düşük açıklıkta hangi saha değerlendirmesi korunsun?',shared:'Yakın yüzey ve engelleri izle; uzak sahanın erişilebilir olduğunu varsayma',sharedText:'Yalnız daha düzgün görünen uzak yüzeye odaklanılmadı. Bu seçim güvenli yavaşlama mesafesi bulunduğunu göstermez.',
  middle:'5 ft başlangıcı, 200 ft / 10 kt düşük sürat örneğinden farklıdır. Aynı görsel alçalış ve karar gerekçesi her iki duruma kopyalanmaz.',
  environment:'Yer açıklığı ve görüş birlikte ele alınır. Rüzgâr göstergesi yön bilgisidir; yer sürati veya duruş mesafesi hesabı değildir.',
  summary:'Bu dal çok sınırlı açıklıkta saha değerlendirmesine odaklanır. Temas açısı, çarpışma veya duruş mesafesi üretilmez.'}
};
export function profileDecisions(id){const p=PROFILES[id];return [
 {id:'priority',at:8,title:p.first,source,options:[{id:'control',label:p.control,text:p.controlText,risk:false},{id:'diagnose',label:'İki pilot da önce arızanın nedenini çözmeye odaklansın',text:`${p.title}: ortak dikkatin arızaya yönelmesi uçuş ve çevre izlemesinde boşluk oluşturabilir. Gecikmenin saniyesi veya sayısal RPM kaybı hesaplanmaz.`,risk:true}]},
 {id:'landing',at:25,title:p.second,source,options:[{id:'shared',label:p.shared,text:p.sharedText,risk:false},{id:'distant',label:'Daha düzgün görünen uzak sahaya odaklan; diğer değerlendirmeleri bırak',text:`${p.title}: uzak yüzeyin görünüşüne odaklanmak, mevcut açıklık ve erişim kısıtlarını gözden kaçırabilir. Sahaya ulaşıldığı varsayılmaz.`,risk:true}]}
];}
export function profileEvents(s,choices){const p=PROFILES[s.id];if(!p)return [];
 const first=choices.find(a=>a.id==='priority'),second=choices.find(a=>a.id==='landing');
 const selected=[first,second].map(a=>{const d=s.decisions.find(d=>d.id===a?.id);return d?.options.find(o=>o.id===a?.option)?.text;}).filter(Boolean);
 return [{at:12,title:p.code+' · Başlangıca özgü enerji değerlendirmesi',text:p.middle},{at:20,title:p.code+' · Saha değerlendirmesine hazırlık',text:p.second+' Karar zamanı kalan yükseklik ve alçalma hesabına bağlıdır.'},{at:30,title:p.code+' · Çevre koşullarını karara kat',text:p.environment},{at:s.duration-5,title:p.code+' · Seçimlerinin birlikte değerlendirilmesi',text:selected.length===2?selected.join(' ')+' '+p.summary:'Kararlar tamamlanmadan dal sonucu oluşturulmaz.'}].map((e,i)=>({...e,kind:i===3?'Sonuç':'Senaryo',source,reference}));
}
