# v0.27.0 — 19 Ekim 2026
Beş uçuş sahası; Güvercinlik kaynaklı pist/OSM yerleşim taslağı; yüzeye göre temas ve ikincil hasar; gerideki hedefe kavisli yönlendirme; ön cam/çatı düzeltmesi; hazır akışta yüzey ve enerji değerlendirmesi. Ayrıntı: docs/REVISION-v027.md. Hazır akışta tüm sert temaslar giderilmedi; fotogerçekçi modelleme tamamlanmadı.

# v0.26.0 — görsel ayrıntı güncellemesi
Kokpit/cam/silecek/kaporta ayrıntıları ve arazide yol geometrisi geliştirildi. Yeni videolar referansa eklendi. Ayrıntı: docs/REVISION-v026.md.

# v0.25.1 — 19 Ekim 2026
Gönderilen Jandarma FBX entegre; koordinata dayalı Gölbaşı DEM/OSM arazisi, rotor/kumanda bağlantıları ve bileşen hasar görselleri. Ayrıntılar: docs/REVISION-v025.md. Google Earth WebGL açılamadı; uydu görüntüsü kullanılmadı.

v0.24.2: Canlı görsel kontrolde boya kesişmesi/Canvas arka yüzleri düzeltildi; rotor temasında dönüş ve ilk temas parça bildirimi eklendi.

# v0.24.0 — 19 Ekim 2026
Kısmi güç referansı ve isim düzeltildi; başlangıç saykılık hareketi giderildi; yeni koşu saha numaraları sıfırlandı; açık son kollektif kararı eklendi. Fotoğraf referanslı model/bozkır geliştirildi; 13 parça grubu hasar taraması ve ilk parça teması/görsel deformasyon eklendi. 140 test geçti. Ayrıntı: docs/REVISION-v024.md. Birebir CAD/fotogerçekçilik ve doğrulanmış kırılma modeli iddiası yok.

v0.23.1: Tarayıcı QA sonrası saha kamerası bütün adayları kapsayacak şekilde düzeltildi. Bulut tarayıcı Canvas uyumluluk modunda; WebGL bu ortamda kullanılamıyor.

# v0.23.0 / energy-1.2 / şema13 — 16 Ekim 2026

Aday sahalar 1–2 olarak gösterilir; araziye sol tıklama 3, 4, 5… ekler. Saha üzerinde sağ tıklama kaldırır; sürükleme kamera hareketidir ve saha eklemez/silmez. Üzerine gelince helikopterden yatay, dikey ve doğrudan mesafe (metre) ile temsili zemin açıklaması görünür. Yeni sahalar saha kararına, kayda ve geri sarmaya dahil edilir. Seçilmiş saha kaldırılırsa ona bağlı kararlar temizlenir ve saha kararına dönülür. Saha ekleme/silme oynatımı duraklatır. Saha konumları oturumun arazi tanımıdır; ekleme zamanı uçuş olayı değildir.

Normal fleyır yaklaşık 100 ft, ertelenmiş dal yaklaşık 75 ft başlangıcına düzenlendi. Hareket tepkisiyle birlikte test edilir; zaten alçaktan başlayan veya hareketi engelleyen seçimler varsa irtifa yapay yükseltilmez. Son kollektif tepki/uzanım süresi ve kullanılabilir hatve talebi düzenlendi. Overspeed “mevcut kumandaları koru” kararı kollektif/saykılık/pedalı sabitler; yeni karar olmadan gizli düzeltme yapılmaz. Temas yaklaşınca gerekliyse yeni son kollektif kararı sunulur.

134 test, 80 koşul, 72 rejim ve HTML/tam ekran yapı denetimi geçti. 12 hazır akış karşılaştırmasında yeni öngörülü pilot düşey temas hızını 7, yatay temas hızını 6 durumda azalttı; her ölçüt/her koşul iyileşmedi. Raporlar: docs/PHYSICS-AUDIT-v023.md, docs/PREDICTIVE-AUDIT-v023.md, docs/CONTROL-SITES-v023.md.

Sonraki adım: kullanıcı görsel geri bildirimi, pilot yetkinliğine bağlı kumanda becerisi ve overspeed kaynaklı yapısal sonuç/animasyon. Bu son ikisi henüz eklenmedi. Mevcut deneysel fizik ve hasar çıktıları gerçek AB-205 uçuş veya dayanım doğrulaması değildir.

---

# v0.22.0 / energy-1.1 / şema12 — 16 Ekim 2026

Hazır akışta iki saniyelik aynı fizik hesabıyla aday kumandaları karşılaştıran yerel öngörülü pilot eklendi. Öğrenilmiş model veya LLM değildir. Seçim gerekçesi mevcut olay günlüğüne yansır; öngörü gerçek uçuş durumunu değiştirmez.

Ufkiyete geçiş kararı artık gerçekleşmiş fleyır, tutum, yavaşlama ve kalan zaman ister. Gecikmiş fleyır dalında kumanda sırası düzeltildi; erken kollektif veya fleyırı atlama halinde gerçekleşmeyen hareketten çıkış sorulmaz. Uzak hedefte mesafe ve durma payına bağlı yaklaşma kararı, ardından uygun fleyır/son kollektif akışı vardır. Değişiklikler ortak çekirdekte, tüm senaryolar ve serbest başlangıçlar içindir.

126 test, 80 koşul, 72 rejim ve HTML/tam ekran yapı kontrolü geçti. Tarayıcı görsel kontrolü bu ortamda yapılamadı. Eski pilotla 12 başlangıç karşılaştırmasında düşey temas hızı 5, yatay temas hızı 8 durumda azaldı; diğer ölçütler aynı kaldı veya kötüleşti. Her durumda daha iyi/yumuşak iniş garantisi yoktur.

Kaynak: Uçuş Hareketleri(2).pdf 104–106. Ayrıntı: docs/PREDICTIVE-REVIEW-v022.md, docs/PREDICTIVE-AUDIT-v022.md, docs/PHYSICS-AUDIT-v022.md. Sayısal katsayılar deneysel; uçuş performansı doğrulanmış değildir.

Sonraki adım: kullanıcı tarafında normal/gecikmiş fleyır ve uzak hedef dallarının görsel değerlendirmesi; öngörü maliyetinin düşey/yatay temas ve rotor rezervi dengesini daha geniş koşullarda kalibre etme. Aşağıdaki eski kayıtlar tarihçedir; eski “henüz uygulanmadı” notları bu sürümde tamamlanan işleri anlatır.

---

# Çalışma arası kaydı — 16 Ekim 2026, 11:43 Türkiye saati

Canlı uygulama v0.21.0 / energy-1.0 / şema11. Son uygulama commit: 77f7a5959697af15677699f6247ca2be7bab84f4. Bu kayıt yalnız devam planıdır; aşağıdaki işler HENÜZ UYGULANMADI. Kullanıcı daha sonra devam etmek istiyor.

## Yeniden başlanınca çalışma sırası

1. Önceden önerilen ileriye dönük hesap yapan hazır akış pilotu: kollektif/saykılık seçeneklerini birkaç saniyelik fizik öngörüsüyle karşılaştır; rotor enerjisi, düşey/yatay temas ve tutumu birlikte değerlendir; seçim gerekçesini bildir; mevcut pilotla aynı başlangıçlarda karşılaştır. Arayüz korunacak. Mevcut pilot yerel durum kurallarıdır; eğitilmiş yapay zekâ değildir.
2. Ardından aşağıdaki kullanıcı gözlemlerini yeniden üret ve düzelt. Temel karar uygulanabilirliği, yeni pilotun da aynı hatayı kullanmasını önleyecek şekilde değerlendirilmelidir.

## Kullanıcı gözlemleri — açık işler

- Fleyır 3B'de belirgin değil, hız/alçalış/rotor değerlerinde etkisi zayıf görünüyor. Kumanda talebi, gerçek disk eğimi, gövde tutumu ve kuvvet/enerji değişimini beraber incele. Görsel hareketi fiziği değiştirmeden yapay olarak büyütme.
- Gerçekleşmiş bir fleyır/yavaşlama yokken “fleyırdan ufkiyete geç” sorusu çıkıyor. Özellikle fleyırı erteleme ve erken kollektif artırma dalları kontrol edilecek. Geçmiş karar etiketi veya cushion bayrağı, gerçekleşmiş fleyırın kanıtı sayılmamalı.
- Kararlar anlık duruma göre uygulanabilir olmalı. Önceki karar hareketi engellemiş, değiştirmiş veya zamanı tüketmişse anlamsız sonraki soru gösterilmemeli. Kalan yükseklik/zaman, gerçek tutum, hız ve enerji koşulları ile kapılar kurulmalı; gereksiz tekrar olmamalı.
- Uzak hedef seçilince erişim için süratin korunması anlaşılır, ancak sonraki yavaşlama/iniş geçişi eksik. Hedefe erişim, yavaşlamaya kalan mesafe ve enerjiye göre yaklaşma/fleyır/ufkiyet/son kollektif geçişleri incelenecek. Hedefe varış veya yumuşak temas zorlanmayacak.
- Uçuş Hareketleri belgesi yeniden analiz edilip bu hareketlerle eşleştirilecek; eksik veride açık kaynak kullanılabilir. Kaynak hükümleriyle deneysel katsayılar ayrılacak.

## İlk teknik inceleme noktaları

- dist/decision-timing.js içindeki cyclic kapısı (flare kararı görülmüş olması ve controls.flare VEYA controls.cushion koşulu) gerçek fleyır önkoşulunu yanlış temsil ediyor olabilir. Henüz bu gözleme yönelik düzeltme yapılmadı.
- dist/flight-controls.js uzak hedef dalı speed=63 ve flareMode=omit kullanıyor; durum tabanlı yaklaşma geçişinin bulunmaması araştırılacak.
- dist/adaptive-pilot.js, dist/flight-dynamics.js ve sahne tutum aktarımı birlikte izlenecek. Görsel tarayıcı QA önceki ortamda yapılamadı; 119 testin geçmesi bu görsel/bağlamsal sorunları dışlamaz.

---

# v0.21.0 / energy-1.0 / şema11 — 16 Ekim 2026

Son kollektif zamanlaması alçalış, RPM, kalan mesafe ve kumanda tepki süresine bağlandı. Erteleme sonrasında tek son uygulama kararı; saykılıkta koordineli ufkiyet / erken ufkiyet / konumu tut seçenekleri. Ortak fizik, kumanda göstergesi ve sahne aynı durumu kullanır.

Sonuç raporunda ilk temas hızlarının yanlışlıkla yerde duruş değerinden alınması düzeltildi. Uçuş RPM uç değerleri yerdeki sönümü içermez. Hareket sırası ve sonucun gerekçesi raporlanır. Rehberli akış sonunda aynı koşullarda alternatif kararları hesaplayan düğme eklendi; ana oturum değişmez. Şema1–10 kayıtları yeni karar zamanlarına taşınır.

119 test, 80 koşul ve 72 rejim kontrolü geçti. HTML/tam ekran yapı kontrolü geçti; tarayıcı görsel QA yapılamadı.

Kaynak: Uçuş Hareketleri(2).pdf 104–106 yeniden okundu. Sayısal katsayılar deneysel kalır. İnceleme: docs/CONTROL-REVIEW-v021.md; sayısal kontrol: docs/PHYSICS-AUDIT-v021.md. Sonraki adım kullanıcı görsel geri bildirimi ve daha geniş konfigürasyonda kalibrasyon; öğrenilmiş yapay zekâ/ileri tahminli pilot bu paketin kapsamında değil.

---

# v0.20.1 / energy-0.9.1 / şema10 — 16 Ekim 2026

- Yere yakın son kollektif, eski kritik rotor/VRS yük azaltma komutları tarafından geçersiz kılınmaz. Kritik devir kurtarma yalnız yeterli yükseklik/zaman varken sürer.
- Son temas safhasında, 4.8 m altındaki devam eden alçalışta otomatik kollektif talebi mevcut konumun altına dönmez. Açıkça seçilen gecikmiş uygulama dalı korunur. Bu bir deneysel kontrol kuralıdır; AB-205 işletme eşiği değildir.
- Son kollektif kararı uzak hedef dalında da sunulur. Yakın temas için 0.35 s asgari aralık istisnası yalnız saha/son kollektif kararlarına uygulanır; diğer kararlar 1.25 s aralığını korur.
- Gecikmiş kurtarma seçiminde fiziksel durum sürekliliği test edildi: devir, konum ve düşey hız sıfırlanmaz. Toparlanmış RPM tek başına yumuşak iniş sağlamaz. Mevcut durdurma payı bildirimi korunur.
- Değişiklikler ortak motor üzerindedir; S01 ile sınırlı değildir. 18 serbest başlangıç/güç birleşiminde son alçalış taraması ve 54 terminal komut birleşimi test edildi.
- 113 test ve HTML/tam ekran yapı kontrolü geçti. Tarayıcı görsel QA yapılamadı. Şema9 kayıtları yeni karar zamanlarına taşınır; geçmiş sonuçlar yeni modelle yeniden hesaplanır.
- Karşılaştırma: S01 gecikmiş rotor yönetimi + uzak hedef dalında artık son kollektif sorulur; örnek temas düşey hızı 10.00 m/s yerine 8.34 m/s. Bu hâlâ sert temastır. Yakın hedef örneği yaklaşık 2.08 m/s. Bunlar model çıktılarıdır, doğrulanmış uçuş verisi değildir.

---

# v0.20.0 / energy-0.9 / şema9 — 15 Ekim 2026

S01 ana geliştirme vakası. Hazır akış sabit cevap listesinden çıkarıldı: yerel durum geri beslemeli uyarlanabilir pilot (LLM değil). Fleyır/ufkiyet/son kolektif ve dinamik akış hafızası; kaynak tekrar incelemesi Uçuş Hareketleri PDF94–96,104–106. Kullanıcı akışında fleyır tercihi eklendi.

İlk temas, sekme/kayma ve yerleşme ayrı. Süre yerleşmede durur. Sonuçta gerekçeli benzetilmiş hasar sınıfı, kuvvet talebi duyarlılığı, tutuma bağlı yük payları; gerçek AB-205 kapasitesi veya resmi kaza sınıflaması değil. Tam ekran üstte son temas yüzdesi. Geri sarma ve eski kayıt göçü korunur.

109 test +80 koşul +72 rejim geçti. Tarayıcı görsel QA yok. Ayrıntı: docs/S01-REVIEW-v020.md, docs/PHYSICS-AUDIT-v020.md. Önceki kayıtlar aşağıda tarihçedir; güncel davranış bu başlıktır.

---

# v0.19.0 / energy-0.8 / şema8 — 15 Ekim 2026

- Otomatik pedal Koşullar bölümünde açık/kapalı; varsayılan açık. Kapalıda başlangıç pedalı tutulur; manuel pedal soruları sonraya bırakıldı.
- Kuyruk yan kuvveti ve deneysel roll etkisi aynı fizik/sahne durumuna bağlandı. Disk eğiminin düşey kuvvet kaybı eklendi. Tam 6-DOF değil.
- Son kolektif zamanlaması rotor rezervi ve kalan yükseklikle sınırlanıyor. Yetersiz durdurma payı mevcut bildirimde açıklanıyor; alçalma zorla sıfırlanmıyor.
- Mevcut sonuç tablosunda renkli %0–100 temas sertliği, 1–2 kelimelik derece. %100=5 m/s tasarım referansı; hasar olasılığı/AB-205 limiti değil.
- Kaynaklı kuvvet–deformasyon eğrisi kabul eden yapısal hesap altyapısı; gerçek AB-205 eğrisi yok, hasar sınıfı uydurulmadı.
- Kaynaklar, varsayımlar ve 2000 ft/dk geç tepki hesabı: LANDING-REVIEW-v019.md. Sayısal kayıt: PHYSICS-AUDIT-v019.md.
- Şema1–7 yeni modele taşınır; eksik pedal ayarı otomatik olur. Eski sonuçlar yeniden hesaplanır.
- 105/105 test,80 koşul ve72 rejim kontrolü geçti. HTML/renderer/JS kontrolleri geçti; tarayıcı görsel QA yok.

---

# v0.18.0 / energy-0.7 / şema7 — 15 Ekim 2026

- Türkçe operatör Bölüm 9 (PDF 184–198) ve sistem notlarının rotor/kuyruk rotoru sayfaları incelendi; FAA HFH Bölüm 2/3/11 ile karşılaştırıldı. Kaynak eşleştirmesi ve tüm yeni varsayımlar: EMERGENCY-REVIEW-v018.md.
- Yüksek kolektifte pozitif alçalma işinin bütünü rotora dönmüyor. Kolektife bağlı enerji aktarımı ve wake kaybı eklendi; müdahalesiz tam güç kaybı dalında devir yeniden yükselmiyor. IGE havırda kolektif başlangıçta korunabilir fakat rotor rezervi tüketilir. Kurulmuş otorotasyon/kısmi güç ayrı.
- Yönetilen otorotasyon kolektifi arıza öncesi trim konumunun altında; son kolektif ve overspeed talepleri ayrı. Görsel hem kol konumunu hem gerçek hareket yönünü gösterir. Aşağı konumda küçük yukarı düzeltme, başlangıç konumuna geri dönmüş gibi anlatılmaz.
- Pedal/yaw moment hesabı eklendi. Sola sapma, sağ pedal düzeltmesi ve düşük RPM'de azalan yön otoritesi hesaplanır. Aynı heading WebGL ve Canvas animasyonunda kullanılır. Kuyruk rotoru ana rotorla dönmeye devam eder; ayrı kuyruk rotor arızası uydurulmadı.
- Yeni koşullu pedal ve kritik rotor kararları; aynı tür bir kez, normal aralık 1.25 s. Yönetim zaten etkinse gereksiz tekrar yok. Yakın temas saha sorusu istisnası .35 s.
- Şema1–6 kayıtları yeni kapılara taşınır; yeni geçmiş kararları hold ile açık kaydedilir. Sayısal sonuçlar yeni modelle hesaplanır.
- 100/100 test; 64 yüksek kolektif koşulunda sürekli RPM düşüşü, 80 hedef/rüzgâr/ağırlık birleşimi ve 72 rejim birleşimi. Yeni sayısal kayıt: PHYSICS-AUDIT-v018.md. 0.02/0.01 s adım farkı: en fazla 0.0289 RPM / 0.0109 ft (8 s öncesi kontrol).
- HTML yapısı, SVG renderer bağlantısı ve JS sözdizimi kontrol edildi. Tarayıcı becerisi yok; görsel QA yapılmadı.
- Fizik katsayıları deneysel. Yaw tam 6-DOF değildir; kuyruk yan kuvveti/roll kuplajı, gerçek pedal bağlantısı, pal poları, dinamik inflow ve yapısal darbe eksik. Hasar sınıfı uydurulmadı.

---

# v0.17.0 / energy-0.6 / şema6 — 15 Ekim 2026

- RPM/alçalış dalları, 80 rüzgâr/ağırlık/sürat/hedef birleşimi ve 72 rejim birleşimi kontrol edildi. Tekrarlanabilir kayıt: PHYSICS-AUDIT-v017.md; komut: node scripts/physics-audit.mjs. Bu kontroller gerçek AB-205 performans doğrulaması değildir.
- Saha yönlendirmesinin 80 KIAS sınırı hava hız vektörüne taşındı. Kuvvet ve rotor enerji katsayıları bu sürümde yeniden ayarlanmadı; mevcut modelin sınırlamaları korundu/açıklandı.
- İki tamamlanmış koşuda karar/zaman farkı ve rotor, süre, temas sürati farkları mevcut rapora eklendi. Koşullar farklıysa yalnız karara nedensellik atfedilmez; birden çok karar farklıysa toplu etki olduğu belirtilir. Geri sarınca sonuç gizlenir.
- Sahnenin solunda kutusuz küçük SVG kumandalar: yandan kolektif, üstten saykılık ve pedal. İlk ikisinin konumu ve hareket oku entegre fizik durumundan gelir; ileri/geri sarma ve tam ekran aynı durumu kullanır. Temas sonrası hareket oku yok.
- Pedal için tork/kuyruk rotoru/yaw hesabı bulunmadığından hareket uydurulmadı; görselde “hesaplanmıyor” yazıyor. Bu istek kısmen açık: pedalın gerçek senkron hareketi sonraki fizik geliştirmesine bağlıdır.
- Şema1–5 kayıtları güncel karar kapılarına taşınır; eski uçuş sonucu korunmuş gibi gösterilmez. v0.17.0 kayıtları şema6.
- 94/94 otomatik test geçti. 80 örnekte 0,02/0,01 s adım farkı en fazla 0,0764 RPM / 0,0148 ft. Tarayıcı kontrol becerisi bulunmadığı için görsel QA yapılmadı; HTML, kaynak bağlantıları ve JS sözdizimi denetlendi.

---

# Duraklama kaydı — 15 Ekim 2026

v0.16.0 kaydedildi; çalışma kullanıcı isteğiyle durduruldu. Sonraki sıra: RPM/alçalış kontrolü → VRS/overspeed doğrulaması → iniş hedefi/animasyon tutarlılığı → karar-sonuç karşılaştırma raporu. Ayrıntılı kabul edilen sıra NEXT-SESSION.md dosyasındadır. Hasar sınıflandırması ek yapısal veri bekler. Bu kayıt yalnızca devam notlarını günceller; yayındaki davranış değişmez.

---

# v0.16.0 / energy-0.5 / şema5 — 15 Ekim 2026

IAS bütün başlangıçlarda tutarlı; düşük sürat yer referansı istisnası kaldırıldı. Kolektif kayıp gücü ve açık RPM yönetimi geliştirildi; erken/durum tabanlı/geç son kolektif kararı. Tam güç kaybı dışında seçilebilir deneysel kısmi güç dalı; VRS eğilimi, düşük RPM/hatve riski, yüksek devir/overspeed birbirinden ayrı. Kararlar aynı fizik ve WebGL/Canvas görüntüsünü değiştiriyor. VRS/overspeed için şematik rotor halkası ve mevcut bildirim kutusunda açıklamalar var.

Senaryo sonu tablo ve karşılaştırma: süre, min/max RPM, alçalma, temas süratleri, karar zamanı, rejim bulguları, temas öncesi enerji. Hasar/kaza-kırım için alanlar eklendi fakat kaynak yetersiz olduğundan sınıf uydurulmadı. Ayrıntılı denklemler, yeni açık kaynaklar, tüm deneysel katsayılar: AERODYNAMIC-REVIEW.md.

89 otomatik test (önceki80 güncel akışa uyarlandı +9 yeni); 30KIAS/30kt, rüzgâr değişmezliği, VRS/güç ayrımı, son kolektif farkı, overspeed, şaft enerjisi, temas enerjisi ve 16 serbest başlangıç/güç/rüzgâr birleşimi. HTML ve JS kontrolü başarılı. Tarayıcı görsel doğrulaması ve bağımsız uçuş testi yapılmadı.

Tam BEM/dinamik inflow, doğrulanmış AB-205 atalet/polar/motor geçişi ve yapısal darbe modeli bekliyor. Bu sürüm deneysel eğitim senaryosu altyapısıdır; gerçek AB-205 performansı veya kaza sonucu doğrulanmış değildir.

---

# v0.15.0 / energy-0.4 — 15 Ekim 2026

## Tamamlananlar

- Türkçe Uçuş Hareketleri PDF 94–110 ile nitel evre eşleştirmesi: docs/MOVEMENT-MAPPING.md. Havırda çöküş görülmeden son kolektif devreye girmiyor.
- Rotor devri yönetimi artık saha seçiminin gizli yan etkisi değil. İlk karar veya açık gecikmiş müdahale etkinleştiriyor. Net rotor gücü/devir türevi kanıt verisine eklendi; pasif toparlanma mevcut bildirim alanında açıklanıyor.
- İlk müdahale ihmal edilmişse, başlangıç devrinin %94 altına düşen ve hâlâ düşmekte olan rotor, >60 ft ve >5 s tahmini yer zamanı koşullarında tek ek karar açıyor. Bunlar arayüz/model eşikleri, uçuş limitleri değil. Geç müdahale veya tutmaya devam et seçenekleri; tekrar, atlama ve temas sonrası karar yok.
- Saha seçimi girişten sonra alçalma gelişirken (t>=5.2 s ve >200 ft/dk) veya daha önce düşük yükseklik/yer zamanı eşiğinde açılıyor. Önceki son yaklaşma kapısı saha planlaması için geç kalıyordu.
- A/B başlangıçtan türetilen sabit yakın/uzak hedef koordinatları; artık keyfî .015 rad/s dönüş yok. Yer hızı hedef vektörüne kuvvet/ivme sınırlarıyla yöneliyor; hedef geçilince geriye dönmüyor. Sentetik hedefler ve kontrol katsayıları uçuş verisi değil.
- T mevcut andaki kararlarla hesaplanan temas tahmini; gelecekteki cevaplar geri sarılan zamana sızmıyor. Gerçek hedefler hareket etmiyor. Hedef sapması açık gösteriliyor; erişilemeyen saha için yapay başarı üretilmiyor.
- Her senaryo ve serbest noktada, güç kesilmiş ve alçalma başlamışken göreli akış okları. WebGL ve Canvas aynı durumdan yön, hedef, tahmin kullanıyor. Disk indüklenmiş akışı/CFD değil.
- Mevcut değerlendirme/karşılaştırma alanı: süre, örneklenmiş minimum rotor ve maksimum alçalma, temas öncesi yatay/düşey sürat, karar zamanları, aynı başlangıç/koşullar kontrolü. Gelecekteki sonuçlar geri sarınca saklanıyor.
- Şema4; şema1/2/3 eski kayıtlar yeni kapılara taşınıyor. Eski kayıtta hiç sorulmamış ek devir kararı gerekiyorsa açık `hold` kaydı eklenerek kumanda tutulması korunuyor; eski uçuş sonucu korunmuş gibi sunulmuyor.

## Kalan teknik sınırlar

RPM'nin koşulsuz hiç yükselmemesi zorlanmadı. Enerji modeli tutulmuş kolektifle yeterli alçalış geliştiğinde pasif toparlanma üretebilir. Gizli otomatik kontrol düzeltildi; **bu toparlanmanın gerçek AB-205 miktarı/süresi doğrulanmadı**. Mevcut kararlı alçalma/başlangıç RPM kalibrasyonu ve yüksek hatve rotor aerodinamiği sonraki fizik işi. Atalet, motor durma eğrisi, yer etkisi, normalize kolektif kazançları ve 0–5 yer referanslı başlangıç istisnası hâlâ deneysel.

Model gövde geometrisi bu tur değiştirilmedi. Önceki kuyruk/gövde/rotor referans ayrıntıları ve tam gövde tutum dinamiği sonraki geliştirme. Uçuş hareketlerinin sayısal eşikleri otomatik gerçek uçuş usulü olarak uygulanmadı.

## Doğrulama

80 otomatik test: önceki 75 kontrol yeni koşullu akışa uyarlandı; ek karar, gecikmiş müdahale enerjisi, dört baş yönünde S01 yakın/uzak izleri, tüm durumlarda akış/temas tahmini, eski şema ve sonuç raporu. Sayısal enerji, adım yakınsaması, temas bitişi, kayıt/geri sarma, tam ekran düğümleri ve Canvas çalıştırma testleri korundu. Tarayıcı görsel doğrulaması mevcut ortamda yapılamadı. Uçuş testiyle bağımsız fizik doğrulaması yapılmadı.

---

# DURAKLATILDI — 14 Ekim 2026, 17:10 (Türkiye)

Kullanıcı tüm çalışmaların kaydedilmesini ve sonraki oturumda devam edilmesini istedi. Çalışan uygulama v0.14.0 olarak korunuyor; yeni davranış değişikliği yapılmadı.

**Yeniden başlarken önce docs/NEXT-SESSION.md dosyasını oku.** Kabul edilen 5 aşamalı sıra ve kullanıcının henüz giderilmemiş gözlemleri orada ayrıntılıdır: yakın/uzak saha ile animasyon uyumu, tutulmuş kumandada RPM'nin yapay toparlanması, koşullu rotor muhafaza kararı, tüm senaryolarda otorotasyon akışı ve karara göre güncellenen tahmini iniş bölgesi. Önce mevcut sıra uygulanacak, bu sırada çözülmemiş gözlemler ardından giderilecek. Kullanıcı yeniden başlatana kadar geliştirme duracak.

# v0.14.0 — Fiziksel bitiş, alçalış göstergesi ve karar farkları

Süre artık fizik hesabındaki temas anında biter; oynatma durur ve terminal durum otomatik kaydedilir. Sonradan devam eden anlatım kuyruğu kaldırıldı. Karar değişince bitiş zamanı yeniden hesaplanır. Sağdaki mevcut göstergeye anlık alçalış (ft/dk; pozitif aşağı) eklendi; temas sonrası son uçuş değerleri açıkça dondurulur. Kolektif, siklik, rüzgâra göre hava hızı ve rotor enerjisi ortak kuvvet hesabını kullanır. Son yaklaşma evreleri kilitlenerek kontrolün flare/son kolektif arasında gidip gelmesi önlendi.

Yer etkisi için sınırlı deneysel güç-kaybı düzeltmesi eklendi; FAA nitel dayanağı kaynak kaydında. AB-205'e ait nicel katsayı doğrulaması değildir. Rotor ataleti ve motor yavaşlama sabiti halen varsayımdır.

İlerideki raporlama için Session.evidence(): zaman serisi, kararlar, model sürümü ve temas ölçütleri. Yeni rapor ekranı eklenmedi. 75 otomatik test ve HTML/sözdizimi kontrolleri geçti; tarayıcı görsel testi yok. Eski şema1/2 kayıtları karar kimlikleri korunarak güncel kapılara taşınır, eski anlatım süresi yeni bitişe kırpılır; eski sürümün sayısal sonucuyla eşitlik iddiası yoktur.

Sonraki adım: kullanıcı istediğinde uçuş hareketleriyle eşleştirme. Bu turda o dokümanla eşleştirme yapılmadı.

# v0.13.0 — Duruma bağlı kararlar, kumanda geçişleri ve canlı göstergeler

İlk karar güç kaybında (4 s), ikinci karar hesaplanan AGL ve alçalma durumuyla açılır. Yeni kayıtlar şema 2; şema 1 kayıtlarında eski karar zamanları korunur. Kolektif/siklik hedefleri sınırlı hızla uygulanır; alçak havırda otomatik kolektif azaltma kaldırıldı. Deneysel flare/yavaşlama ve son kolektif bağlantısı eklendi. 0–5 başlangıç seçiminde yer referanslı konum tutma uygulanır: rüzgârın salt konuma eklenmesinden kaynaklanan geri/yan kayma kaldırıldı. Bu aralıkta seçilen değer yer referanslı başlangıç olarak yorumlanır, canlı KIAS rüzgâra göre farklı olabilir; mevcut seçim/RPM notlarında açıkça belirtilir.

RPM altında canlı KIAS, ft AGL ve küçük yer sürati satırı; normal/tam ekran aynı düğümleri kullanır. 67 otomatik test ve HTML kontrolleri geçti; tarayıcı görsel testi yapılmadı. Model hâlâ deneysel: havır konum tutma ideal kontrol varsayımıdır, rüzgâr kuvvetleri ve gerçek yer etkisi çözümü değildir.

Sonraki adım: uçuş hareketleri dokümanıyla kumanda, flare ve yere yaklaşma evrelerini eşleştir; AB-205'e özgü kuvvet/atalet ve motor geçiş verilerini doğrula.

# v0.12.0 — Deneysel fizik hesabı

Diyagramdan seçilen başlangıç için sabit adımlı enerji/hareket çekirdeği eklendi. Alçalma, IAS/TAS/yer sürati, rotor ve motor RPM; WebGL ve Canvas görünümüyle aynı durumu kullanır. Arayüz öğesi eklenmedi/çıkarılmadı. Temasta hesap dondurulur, anlatım incelemesi devam eder. Ağırlık boşsa 2800 kg varsayımı görünürdür. Modelin varsayımları, kaynakları ve eksikleri: docs/PHYSICS.md. Uçuş doğrulaması yapılmadı.

Sonraki adım: düşük hız/yer etkisi ve flare; gerçek kumanda girdileri ve fizik olaylarına bağlı karar zamanları. İlk olarak AB-205 rotor ataleti, motor geçiş eğrisi ve kaynak performans koşulları netleştirilmeli.

# Güncel durum — v0.11.1 — 14 Ekim 2026

- Kullanıcı WebGL2 başlatma hatasını bildirdi. Kesin donanım/sürücü nedeni uzaktan doğrulanamadı; önceki mesaj tek bir genel catch yolundan geliyordu.
- WebGL çizici önce normal, sonra antialias kapalı/düşük güç seçenekleriyle denenir. İki deneme de başarısızsa Canvas2D üzerinde CPU ile perspektif 3B geometri çizimi devreye girer. WebGL2 zorunluluğu kaldırıldı; 2D canvas da engelliyse açık hata korunur.
- Uyumluluk görünümü aynı createHelicopter geometrisini ve sampleScene zaman çizelgesini kullanır. Sol sürükle döndürme, tekerlek yakınlaştırma, sağ sürükle kaydırma ve kamera presetleri; ResizeObserver ile tam ekran boyutlandırma. Arazi/ışık sade, doku yazıları ve bulut geometrisi bu görünümde yok. Normal WebGL görünümünde korunur.
- Çalışma sırasında WebGL bağlamı kaybolursa mevcut senaryo aynı uyumluluk çizicisine aktarılır. Diyagram/RPM/oynatma düğümleri silinmez.
- 54 otomatik test ve HTML/JS kontrolleri; Canvas mock testi projeksiyon, çizim çağrıları, kamera ve geri sarma kontrolü içerir. Kullanıcının tarayıcısı ve gerçek görsel çıktı bu ortamda test edilemedi.

---

# Güncel durum — v0.11 — 14 Ekim 2026

- S01 düz uçuş korunur. S02 alçak havır, S03 düşük sürat, S04 alçak ileri uçuş, S05 yere çok yakın yüksek sürat için ayrı amaçlar, iki bağlama özgü karar, ilave olaylar ve dört birleşik değerlendirme sonucu eklendi.
- Karar kimlikleri/niyetleri (control/diagnose, shared/distant) korundu; eski kayıtlar açılır. Ayrıntılı açıklamalar güncel sürümde başlangıç bağlamına göre gösterilir. Serbest H/V noktası hazır örnekle aynı olsa da o örneğin koşullarını otomatik almaz.
- Dört örneğe ayrı temsilî hareket ve karar sonrası yön/dikkat gösterimi; temas öncesinde hareket donar. Yol, süre, sapma ve tutum değerleri tasarımdır, aerodinamik hesap değildir. RPM dinamiği eklenmedi.
- Tek düğmeyle karşılaştırmalı tekrar: önce mevcut deneme kitaplığa kaydedilir; başarılı kayıttan sonra aynı başlangıç/hava/mürettebatla karar modunda başa dönülür. Önceki deneme karşılaştırmada kalır. Kayıt başarısızsa akış sıfırlanmaz.
- Kaynak dayanağı önceki turda incelenen TR §9.1.9–9.1.11 PDF185–186 ve CRM §2.4. Yeni sayısal uçuş/hasar sonucu üretilmedi.
- 52 test ve HTML/JS kontrolleri geçti. Dalların ayrışması, süreklilik, geri sarma ve arazi üstünde kalma kontrol edildi. Tarayıcı görsel QA bu ortamda yapılamadı.
- Sonraki teknik iş: kararlı otorotasyon referans koşullarını netleştirme; gerçek dinamik RPM için eksik verileri kaynaklarda arama. Deneysel hareketi doğrulanmış uçuş fiziği diye sunmama sınırı korunur.

---

# Güncel durum — v0.10 — 14 Ekim 2026

- Model: gönderilen yan/üst referanslar yeniden incelendi; kesitli kabin, çerçeveli ön/yan camlar, yeşil üst camlar, kapı rayı, basamak, kaporta havalandırma yarıkları, rotor başı bağlantıları, anten ve JANDARMA yazısı eklendi. Kuyruk konisinin ters daralması düzeltildi. Hâlâ yaklaşık görsel model; detaylar sertifikalı teknik çizim değildir.
- Atmosfer: açık/parçalı/kapalı görsel bulutlar ve gündüz/gün batımı aydınlatması. Görüş sis mesafesini etkiler; rüzgâr bilgisi sahnede okunur. Görsel atmosfer seçimi uçuş fiziğini değiştirmez. Bulut tabanı hesabı yok.
- Senaryo kitaplığı: adlandırılmış en fazla40 kayıt; başlangıç/hava/mürettebat/kararlar/zaman saklanır. Tarayıcı-localStorage; cihazlar arası kendiliğinden senkron yok. JSON yedek indir/yükle, silme/yedek değiştirme için geri alma. Bozuk yedekler tümden reddedilir, mevcut kitaplık korunur.
- Karar değerlendirme: yalnız geçerli oynatım zamanına kadar verilen kararlar, gerekçeleri, karar anına dönüş. Kayıtlı denemeyle karşılaştırma; farklar işaretlenir, başarı/hasar puanı yok.
- Eski oturumlar açık/gündüz varsayılanıyla açılır. H/V1ft/1kt, RPM alanı, tam ekran kontrolleri korunur.
- 49 Node testi ve HTML yapı/sözdizimi kontrolleri geçti. Model için yerel ortografik geometri görünüşü incelendi. Tarayıcı/WebGL görsel ve etkileşim QA bu ortamda yapılamadı.
- RPM dinamiği henüz hazır değil; arıza sonrası — gösterimi korunur. Sonraki aşama: kullanıcı görsel geri bildirimi, diğer senaryolara özgü karar dalları ve kaynaklı dinamik veri çalışması.

---

# Güncel durum — v0.9 — 14 Ekim 2026

- Sağ kenarda kutusuz rotor/motor RPM metni; tam ekranda bildirim kutusunun altında aynı DOM düğümü taşınır, çıkışta yerine döner. Metin gölgeli, kamera etkileşimini engellemez.
- Başlangıçta girilen devirler; boşsa açık referans etiketiyle 324/6600 gösterilir. Bu, boş konfigürasyon alanını değiştirmez. Güç kaybından sonra sayısal RPM null / — gösterilir. Gerçek zamanlı sayısal RPM talebinin bu kısmı henüz tamamlanmadı: rotor ataleti, aerodinamik tork/kolektif etkisi ve motor yavaşlama verisi eksik. Uydurma devir eğrisi veya güç kaybı=0 RPM yok.
- Motor arızası/serbest dönüş kaynak sayfaları PDF24,185,186 tekrar okundu. Kaynaklı güç aktarımı ve gösterge olayları 5/10 anlatım saniyesine eklendi; bunlar fiziksel tepki süreleri değildir.
- Güç durumu, mevcut oturum saatinden türetilir; durdurma, geri sarma, kararlar ve kayıt yükleme ile tutarlıdır. Tam ekran kontrolleri ve sol H/V seçimi korunur.
- Kontroller: 45 Node testi, HTML yapı kontrolü ve JS sözdizimi kontrolü. Tarayıcıda görsel/native tam ekran QA bu ortamda yapılamadı.
- Sonraki iş: doğrulanmış rotor/motor geçiş verisi edinme ve dinamik modele bağlama. Gösterge altyapısı hazır; gerçeğe dayalı anlık sayısal değişim henüz hazır değil.

---

# Güncel durum — v0.8 — 14 Ekim 2026

- 324 rotor / 6600 motor RPM: kullanıcı girdisi Türkçe operatör kitabı §7.5.1, PDF118 / basılı7-5 seyahat tavsiyesiyle metin ve görüntü üzerinden eşleştirildi. PDF90 §5.2.2 metal pal koşulu korunur. Eski seyahat kartlarının 314/6400 temeli ve tork düzeltmesi ayrı bağlamdır.
- Şekil9-2 PDF197 / basılı9-14 yeniden incelendi. Alçalma ve süzülüş oranı: 284/314 RPM 40–80 çatı KIAS, 339 RPM 50–80 çatı KIAS. 339/40 üst grafik dışında; sonuç üretilmez. Değerler yaklaşık, RPM'ler arasında enterpolasyon yok.
- 314 RPM ara kontroller:55 kt görsel~1620 / enterpolasyon1640;75 kt görsel~1660 / enterpolasyon1670 ft/dk. Bunlar tüm aralık için hata sınırı değildir. Aynı kaynağa tekrar bakıldı; bağımsız uzman kontrolü yapılmadı.
- Kaynak checksum, kapsam, sayfa, yuvarlama, kalibrasyon ve veri tablosu dist/curve-audit.json içinde. Kaynak sayfaları uygulamada açılabilir.
- 41 test geçti: serbest H/V, eski kayıtlar, kararlar, sarma, tam ekran kontrol yapısı, grafik kapsamı ve veri tutarlılığı. HTML/yapı ve JS sözdizimi kontrolleri geçti. Tarayıcı görsel testi bu ortamda kullanılamıyor.
- Fizik hâlâ etkin değil. Sıradaki iş: mevcut kaynaktaki motor kaybı/serbest dönüş/rotor enerjisi koşullarını kaynaklı durum geçişlerine dönüştürmek; rotor ataleti ve geçiş denklemleri için veri açıklarını belirlemek. Ağırlık/yoğunluk/rüzgâr düzeltmesi veya iniş sonucu uydurulmayacak.

---

# Devam kaydı — 13 Ekim 2026 — Aşama 01

## Kullanıcı talebi

- Türkçe, “Emredersin kom” hitabı.
- AB-205, Ankara coğrafyasına uygun 3B senaryo sahnesi; fare ile helikopter çevresinde serbest kamera.
- Gönderilen H/V diyagramını esas alma. İkaz, kaçınma ve güvenli alanlarda motor arızası; hazır animasyon veya karar dalları.
- Sağ üstte anlık açıklama; duraklatma, ileri/geri sarma; hava ve iki pilot deneyimi seçimi.
- Önce yazılım altyapısı, sonra 3B. Parça parça ilerleme; ilk sürüm hedefi 19 Ekim 2026. Windows tercih, web kabul.
- Önceki demo beğenilmişti; bu proje ayrı bir çalışma alanı olarak açıldı, önceki demo değiştirilmedi.

## Yapılan

Kaynak görseli incelendi. Türkçe H/V sayfasıyla karşılaştırıldı. Operatör kitabının motor kaybı, transmisyon, elektrik, H/V limitleri; TM karşılaştırması; FAA H/V bölümü; seçili meteoroloji ve CRM bölümleri okundu. Tüm 16 PDF’nin bütünü incelenmedi.

Beş senaryo ve her birinde iki karar noktası. Hazır izleme/etkileşimli mod. İleri arama kararları atlayamaz. Geri sarma olayları o ana göre yeniden kurar. Eski bir kararı değiştirmek sonraki seçimleri siler. Yerel otomatik kayıt, JSON yükleme/indirme, veri doğrulaması. Hava ve iki pilot profili anlatımı etkiler. 3B için birimler ve renderer sözleşmesi ayrıdır.

## Bilerek henüz yapılmayan

- 3B render, helikopter modeli, gerçek/temsili terrain geometrisi.
- Gerçek uçuş fiziği, rotor enerji integrasyonu, flare/temas/hasar hesabı.
- Sayısal H/V sınıflandırma; chart digitization.
- Windows exe, offline PWA, cloud session sync.
- Tüm dokümanlar arasında revizyon ve konfigürasyon karşılaştırması.

## Sonraki somut iş sırası

1. Mevcut projenin `.openai/hosting.json` kimliğiyle Sites kaynağını aç; yeni proje yaratma. Kaynaklar `docs/SOURCES.md`.
2. H/V chart için weight/pitot/rotor RPM/limit bağlamını netleştir. Charter içindeki ağırlık eğrilerini fizik modelinden ayrı tut. Exact airframe yetkilendirilmiş kitap ve revizyon bilgisi kullanıcıdan gerekebilir.
3. Ankara esintili 609,6 × 2438,4 m arazi: yatay boyut varsayımı. Kesin Ankara arazi verisi gibi sunma.
4. Kaynak görsellerinden AB-205 görünümü; kullanıcı kontrolünde orbit camera. Tam rotor/livery ayrıntılarından önce silhouette ve rotor dönüşü.
5. Engine snapshot -> renderer adapter. İlk 3B hareketler temsiliyse açık etiketle; gerçek aerodinamik hesap diye sunma. Rewind için durumu zaman/karar/config üzerinden tekrar üret; physics’i geriye entegre etme.
6. Kullanıcı feedback ve kaynak doğrulamasıyla meteoroloji/sistem/CRM dallarını genişlet; her etkiye kaynak ve doğrulama durumu ekle.
7. Browser QA mümkün olduğunda desktop ve mobile kontrol; engine tests hazır.

## Kritik teknik korumalar

- Hover IGE ve cruise initial collective aynı şablonla değerlendirilmez.
- Tek RPM ikazı engine failure teşhisi değildir.
- Engine loss tüm rotor, hydraulic ve main generator sistemlerinin aniden durması değildir; transmission-driven ayrımı korunur.
- Güvenli alan garanti, avoid alan kesin kaza diye sunulmaz.
- IAS roof/nose ve skid AGL ayrımı korunur. Metres vs ft dönüşümü explicit.
- Deneyim başarı yüzdesi veya uydurma tepki süresine çevrilmez.
- Hava ayarı mevcut chart sınırını keyfi değiştirmez.
- Kaynak çelişkileri: Türkçe kolektif/süzülüş cümlesi ile TM ifadesi farklı; meteoroloji bazı genellemeler şüpheli. Çözümlenmeden executable uçuş kuralı yapılmaz.

Kullanıcı bilgisayarı kapatabilir; kesintisiz arka plan çalışması taahhüt edilmedi. Bu kayıt ve Git sürümüyle devam edilir.


## 13 Ekim 2026 gece güncellemesi — v0.2, yarına bırakılan işler

Kullanıcı bu gece yalnız küçük değişiklikleri istedi; büyük geliştirme 14 Ekim 2026'da devam edecek.
- Türkçe ve İngilizce çelişirse Türkçe metin esas alınacak; konfigürasyon farkları ve çelişki kaydı korunacak.
- Başlangıçlar sabit örneklerle sınırlı değil: mevcut görselin çatı ölçeğinde 0–600 ft ve 0–80 kt; 1 ft / 1 kt tamsayı giriş. Diyagrama tıklama, ok tuşları, sayısal giriş eklendi.
- Serbest nokta kaydediliyor ve genel karar akışı bu başlangıcı kullanıyor. Otomatik H/V bölge sınıflandırması henüz yok; görüntüdeki eğriler için teknik doğrulama devam edecek. Başlangıç giriş çözünürlüğü kaynak doğruluğu gibi sunulmayacak.
- 1000 ft / 50 kt gibi görsel dışına genişletme KULLANICI TARAFINDAN SONRAYA BIRAKILDI. Şimdilik 600 ft üstü reddediliyor.
- Sol üst arma, çağlar filo.jpeg (libfile_b04b4f92f77c8191aca0f0705f9739b6) ile değişti; AB-205 altındaki aynı fontlu yazı “çağlar filo”. Orijinal görsel değiştirilmeden kullanıldı.
- 3B ve daha uzun kaynak/fizik çalışması bu turda yapılmadı.
- schemaVersion 1 kayıtları geriye uyumlu; önceki kayıtlarda yeni başlangıç alanları hazır senaryodan tamamlanır.


## 14 Ekim 2026 — v0.2.1 görsel düzenleme
Kullanıcı 3B çalışmasına geçmeden yalnız görsel düzenleme istedi. Sol üstte sırasıyla havacılık, okul ve şeffaf Çağlar Filo peçi eklendi (60px; mobil 56px; önceki logo 50px). Alt başlık “Çağlar Filo”. Atatürk fotoğrafı yüzde 9 opaklıkla sabit sayfa arka planında; kutular ve metinlerin arkasında, etkileşimi engellemez. Görseller değiştirilmeden kullanıldı. Senaryo mantığına dokunulmadı.
Varlık kaynakları: havacılık.png libfile_9b58ba660a30819190efa0971e74a0b4; okul (2).png libfile_4f569270a2c0819188e75d9b334c14a7; Şeffaf Çağlar Filo arması.png libfile_07285fac57988191a94f0bdf16e8969a; atatürk.jpg libfile_8a36553d97608191af78a86b6d4778d9.


## 14 Ekim 2026 — v0.3: 3B ilk sürüm
- Yerel Three.js r170 / OrbitControls (MIT); harici CDN gerektirmez.
- 609,6 × 2438,4 m Ankara esintili prosedürel bozkır; gerçek topoğrafya değildir.
- Kullanıcının 10 WhatsApp referans görüntüsü esas alınarak ilk AB-205 gövde/cam/kızak/kuyruk/çift palli rotor modeli. CAD kopyası değildir; ince kaplama ve arma ayrıntıları sonraki revizyon.
- Türkçe operatör kitabı PDF s.44 / basılı 2-31 / Şekil 2-3: ana rotor 48 ft 3.2 in (14,71168 m), gövde 41 ft 5 in (12,6238 m). İlk geometri bu ölçeklere yaklaştırıldı.
- Fare/dokunmatik orbit kamera, yan/üst/arazi görünümü, tam ekran. Kamera oynatım dururken kullanılabilir.
- Seçili skid yüksekliği metreye çevrilir. Anlatım zamanından deterministik temsilî yol ve rotor açısı üretilir; ileri/geri sarma aynı görüntüyü üretir. Bu bir uçuş/iniş hesabı değildir. Kararlar anlatımı değiştirir, henüz doğrulanmış 3B uçuş dalı üretmez.
- Görüş sis uzaklığını; rüzgâr yön okunu etkiler. Meteorolojik kuvvet hesabı yoktur.
- Eski oturum formatı korunur. Önceki ‘3B henüz yapılmadı’ kayıtları bu güncellemeyle aşılmıştır.
- Sonraki iş: kullanıcıyla model görünümünü değerlendirme, ince livery ayrıntıları, ardından kaynaklı rotor/enerji ve senaryo dalları. 1000 ft genişletmesi hâlâ ertelenmiştir.
- Test: 17 otomatik test; geometri, kaynak rotor çapı, geri sarma, başlangıç yüksekliği, tüm başlarda zemin açıklığı ve eski çekirdek testleri. Bu ortamda tarayıcı/görsel QA yapılamadı.


## 14 Ekim 2026 — v0.3.1 başlangıç seçimi düzeltmesi
Diyagramın 3B sahne altındaki kapalı bölümde kalması kullanım hatasıydı. Diyagram, sayı alanları ve seçim işareti sol panelde varsayılan açık Yükseklik–hız sekmesine taşındı. Hazır senaryolar ve Koşullar ayrı sol sekmelerde. Sekmeler klavyeyle (oklar/Home/End) kullanılabilir. 1 ft / 1 kt ve 0–600 ft / 0–80 kt korunur. 3B/model geliştirmesine bu düzeltme turunda devam edilmedi.
Doğrulama: 17 çekirdek/geometri testi geçti; HTML dengesi, benzersiz ID'ler, diyagramın gizli olmayan sol panelde bulunması, sayı sınırları, sekme ilişkileri, oynatıcı yerleşimi ve yerel varlıklar kontrol edildi. Tarayıcı görsel/etkileşim QA bu ortamda kullanılamadı; görsel test yapılmış gibi raporlanmamalı.


## 14 Ekim 2026 11:37 Türkiye — öğle arası kayıt noktası
- Kullanıcı tüm çalışmayı kaydetmemizi ve öğleden sonra devam etmemizi istedi. Canlı sürüm v0.3.1; kod commit'i f2eaeb984e18153edbd298b97f93689b2092402c.
- Kullanıcı WebGL uyarısının düzeldiğini 11:34'te bildirdi. Sebep belirlenmedi. Önerilen hafif grafik modu/hata tanılama değişikliği UYGULANMADI; gerekmediği için durduruldu.
- Mevcut AB-205 geometrisi deneysel ilk taslak; kullanıcı bunun farkında. Gönderilen fotoğraflara yakın ayrıntılı modelleme zamanla yapılacak. Hazır GLB/glTF/FBX/OBJ sağlanırsa değerlendirilebilir; şu anda sağlanmış bir 3B dosya yok.
- Öğleden sonraki sıradaki iş: önce tek bir motor arızası senaryosunu kaynaklarla baştan sona ayrıntılandırmak; olay sırası, pilot seçenekleri ve olası sonuçlar, aerodinamik/meteoroloji/sistem etkileri. Ardından açıklama ve 3B animasyonu eşlemek. Doğrulanmamış uçuş fiziğini gerçek sonuç diye sunmamak.
- Sol panelde varsayılan açık yükseklik–hız sekmesi ve 1 ft/1 kt seçimi korunmalı. Kullanıcı bu kontrollerin kaybolmasına özellikle itiraz etti; sonraki düzenlemelerde görünürlük ve erişim kontrol edilmeli.
- Bu kayıt yalnız devam notudur; çalışan uygulamanın davranışı değiştirilmedi. Kullanıcının tarayıcı içindeki son oturumu uzak ortamdan okunmadı; mevcut otomatik yerel kayıt ve Oturumu indir işlevi geçerli.


## 14 Ekim 2026 öğleden sonra — v0.4 / S01
- Hazır 400 ft / 60 KIAS başlangıcına S01 ayrıntılı motor güç kaybı anlatımı eklendi. Başlangıç ekranındaki S01 düğmesi veya Hazır senaryolar > Güvenli saha ile seçilir; başlangıç otomatik değiştirilmez.
- Aynı iki karar kimliği ve zamanları (priority/8, landing/25) korunarak dört ayrı birleşik değerlendirme metni oluşturuldu. 60 saniye gerçek uçuş zamanı değildir.
- Kaynak: TR §9.1.9 PDF185–186; §2.7.1 PDF24; CRM §2.4 PDF14–16. PDF186 görsel olarak yeniden kontrol edildi. FAA resmi Handbook ile genel serbest dönüş/otorotasyon tanımı çapraz kontrol edildi.
- İkaz tek başına teşhis değildir; transmisyonla tahrik edilen sistemler motor gücü kaybıyla otomatik kapatılmaz. Jeneratör/hidrolik sayısal çıkışı da normal ilan edilmez.
- Olay kartlarında sayfa/bölüm dayanakları; S01 aşama şeridi, motor/rotor/ekip/saha durum paneli, varsayımlar açıklaması.
- 3B akış: 12–40 anlatım saniyesinde yukarı hava akımı okları; 20'den itibaren A/B aday işaretleri; distant dalında B sarı vurgulanır. İşaretler erişim onayı değildir. Saha adaylarını gör kamerası eklendi. İniş/flare/hasar fiziği veya sayısal RPM eklenmedi; yol temsilî, temas gösterilmiyor.
- Diyagramdan serbest nokta seçimi S01'i otomatik uygulamaz; genel akışa döner (400/60 dahi serbest seçildiğinde). Sol varsayılan açık sekme ve 1 ft / 1 kt giriş korunur.
- Eski schemaVersion1 kayıtları korunur. Önceki safe kayıtları aynı karar kimlikleriyle yeni açıklamaları kullanır.
- Kontrol: 22 Node testi (17 mevcut +5 S01), ayrıca tests/check_layout.py ile gerçek HTML'de sol diyagram görünürlüğü, tekil ID, alan sınırları, sekme bağlantıları ve oyuncu yerleşimi. Tarayıcı QA bu ortamda yok; kullanıcı ekranında görünüm doğrulanmalı.
- Sonraki: S01 üzerinde kullanıcı geri bildirimi; doğrulanmış konfigürasyon/ağırlık ve performans verileriyle sayısal modele geçiş. Diğer dört hazır senaryo henüz eski genel akıştır.


## 14 Ekim 2026 — v0.5 / tam ekran ve S01 hareketleri
- Tam ekran kökü scene-panel. Mevcut event-panel sağ üste, transport-panel alta, decision uygun üst katmana taşınır. Kopya kontrol veya ayrı oturum yok; fullscreenchange ile Esc/çıkışta yorum işaretlerine geri yerleşir. İstek reddedilirse normal yerleşim değişmez.
- Bildirim ve karar panellerinde kaydırma; küçük ekranda karar alt bölgede. Kamera boş alanları etkileşime açık. Tam ekrandan çık düğmesi ve Esc kullanılır. Kaynak düğmesi oynatımı durdurur, tam ekrandan çıkar ve kaynak sayfasını açar.
- Karar noktasında tam ekran klavye odağı ilk seçeneğe; seçimden sonra Devam düğmesine geçer. Aynı ana ait bildirim, karar ve oynatım tek Session ile yürür.
- S01 temsilî hareketi zaman anahtarlarına ayrıldı: başlangıç, güç kaybı işareti, alçalış, yaklaşma tartışması, temas öncesi sabit değerlendirme. Diagnose dalı kısa süreli temsilî tutum sapması; distant dalı B yönüne temsilî yönelme gösterir. Bu açılar, konumlar ve zamanlar tamamen storyboard tasarımıdır; performans/tepki ölçüsü değildir.
- S01'de 55. anlatım saniyesinden sonra konum ve rotor gösterimi sabitlenir; yere temas/başarılı iniş hesaplanmaz. Diğer senaryoların genel hareketi korunur. Geçmiş duruma dönüş salt zaman/karar/config örneklemesidir.
- 28 Node testi geçti (22 önceki +3 tam ekran controller ve +3 hareket testi). Tam ekran testleri küçük DOM fikstürü üzerinde mantık testidir; yerel tarayıcı fullscreen/GPU veya görsel test değildir. tests/check_layout.py sol diyagramı, sayı sınırlarını, tekil ID'leri ve fullscreen slotlarının konumunu doğruladı.
- Tarayıcı QA bu ortamda kullanılamadı. Kullanıcı ekranında sağ üst bildirim, alt kontrol ve karar kutusunun görünümü özellikle gözden geçirilmeli.
- Devam: kullanıcı geri bildirimi; fizik ve kesin kumanda/flare sonuçlarından önce ağırlık/konfigürasyon/performans kaynakları.


## 14 Ekim 2026 — v0.6 / ağırlık-konfigürasyon ve kaynak verisi
- Sol panelde dördüncü Hava aracı sekmesi: toplam gros lb (kg karşılığı), başlangıç rotor RPM, tip/motor/pal/pitot/harici yük seçimi ve kitap-revizyon beyanı. Tüm yeni alanlar varsayılan belirsiz; ağırlık/devir null. Başlangıç RPM canlı rotor ölçümü veya animasyon hızı değildir.
- Form sınırları lb 1–20000, RPM 1–1000 yalnız girdi doğrulama sınırlarıdır; işletme limiti değildir. Referans kapsamını aşan girdiler nitel karşılaştırma notuyla saklanır; fizik ve H/V sınıflandırma etkinleşmez.
- Türkçe kaynak PDF90 §5.2.2: metal pal seyir 319–324 RPM; kompozit ayrımı. PDF91 §5.4.2: 9500 lb; §5.3 703 için EK-C. PDF93 §5.8 H/V kapsamı. PDF95 Şekil5-1.2 görselde rotor 294–324 devamlı/339 maksimum. PDF197 Şekil9-2 görselde min alçalma 63kt çatı/52kt burun; azami süzülüş mesafesi 98kt çatı/82kt burun etiketleri ve 284/314/339 RPM eğrileri.
- Grafik RPM eğrileri ile gösterge limitleri farklı bağlamlar; uçuş hedefi gibi otomatik uygulanmaz. Eğriler henüz sayısallaştırılmadı. Görselden alçalma ft/dk veya glide ratio sayısı çıkarılıp kullanılmadı.
- Kaynak ve doğrulama sayfasında 8 satırlı veri tablosu, sayfa/bölüm ve kapsam; iki kaynak sayfa PNG'si açılabilir. Gerçek hava aracına uygulanabilirlik her durumda unverified. Tüm girdi alanları dolu olsa bile physicsReady=false.
- Motor703, kompozit pal, burun pitot, harici yük ve referans ağırlık/devir aralığı dışı girdiler ayrı not üretir. Burun seçimi diyagram eksenini değiştirmez; çatı ölçeğinde kaldığı hem sekmede hem başlangıçta gösterilir. 600ft/80kt sınırı korunur.
- Merkezde model veri durumu, eksik girdiler/kalan işler; 0.5 anlatım saniyesinde konfigürasyon olayı. S01 kaynakla teyit edilmemiş ağırlık/konfigürasyon ifadesi güncellendi.
- Eski schemaVersion1 kayıtları yeni alanları belirsiz olarak doldurur; mevcut başlangıç/kararlar/süre korunur. Serialize çıktısı config/answers kopyalarını döndürür; dışarı aktarılan nesne üzerinde değişiklik canlı oturumu bozmaz.
- 35 Node testi (28 önceki +7 hava aracı testi) geçti; HTML yapı testi sol diyagram, yeni form alanları ve fullscreen slotlarını kontrol etti. Tarayıcı görsel QA yapılmadı.
- Sonraki somut iş: gerçek kullanılacak konfigürasyon/kitap revizyonu ve yükleme bilgisi; kaynak eğrilerini sayısallaştırıp bağımsız noktalarla doğrulama. Ardından model kapsamı ve rotor enerji parametreleri; henüz gerçek uçuş fiziği yok.


## v0.7 — 14 Ekim 2026
- Kullanıcının motor gücü mevcutken normal uçuş referansı: rotor 324 RPM, motor 6600 RPM. Formda tek düğmeyle doldurulur; uygulamayla kayıt edilir. Eski kayıtların bilinmeyen değerleri korunur. Canlı devir ölçümü veya arıza sonrası hedef değildir.
- Şekil 9-2 / PDF197 / basılı9-14: 314 RPM güçsüz uçuş eğrisinin 40–80 çatı KIAS bölümü elle ön sayısallaştırıldı. 40/50/60/63/70/80 kt için yaklaşık 1900/1670/1600/1600/1620/1720 ft/dk. Noktalar arası doğrusal yaklaşım; dışarı taşırma yok. Kaynak görsel üzerinde işaretli inceleyici eklendi.
- Grafik okumaları 10 ft/dk yuvarlanır; bu gösterim hassasiyet garantisi değildir. Bağımsız doğrulama henüz yok. H/V başlangıcı, fizik ve 3B hareket değiştirilmedi.
- Sonraki iş: nokta okumalarının bağımsız kontrolü, kalan RPM eğrileri ve süzülüş oranının çıkarılması; ardından konfigürasyon uygulanabilirliği.
- Doğrulama: 38 otomatik test ve HTML/yapı kontrolü. Tarayıcı görsel kontrolü bu ortamda yapılamadı.
