# v0.40.0-validation — 28 Ekim 2026

Ortak IAS/TAS/rüzgâr ve kütle başlangıcı, program RPM/önbellek anahtarı, uzun/büyük kayıt yükleme, güvenli çevrimdışı kurulum ve ortak temas sonrası gösterge durumu düzeltildi. 42/42 regresyon kontrolü geçti. Ana kabul seti 32/33: eğimli zemin kayması açık. 64 program sayısal taramadan geçti. Otorotasyon için 17 kalibrasyon ve 7 aynı grafik ara noktası denge karşılaştırması; bağımsız uçuş doğrulaması değildir. Gerçek kayıt karşılaştırma araçları ve kaynak/sınır raporu docs/VALIDATION-REPORT.md içinde. Tarayıcı/WebGL doğrulanmadı. Bu sürüm canlı yayımlanmadı.

Aşağıdakiler eski sürüm notlarıdır; eski test sayıları güncel sürüm sonucu değildir.

# v0.31.0 — 21 Ekim 2026 (gece turu)
Pal elemanı rotor modeli (energy-2.0, seçilebilir, deneysel; şekil alçalışına %6 içinde) ve enerji modeline pal stall itki sınırı (energy-1.7). Uçuş sonrası değerlendirme: zaman çizelgesi, karar işaretleri, TR Uçuş Hareketleri standartlarına göre puan, yazdırma. Elle uçuş (klavye/oyun kumandası/dokunmatik) kayıt-tekrar ve hazır akış hayaleti. Kokpit görünümü ve göstergeler. Mürettebat profiline bağlı tepki süresi ve zamanlama. Enerji hatları (çarpışmalı), gece/iniş farı, yağmur. Çevrimdışı uygulama (PWA) altyapısı. Değerlendirmede hazır akış kıyas izi, HTML rapor indirme, elle uçuşta eğitmen ipuçları. 177 test geçti. Ayrıntı: docs/REVISION-v031.md.

# v0.30.0 / energy-1.6 — 20 Ekim 2026
Saha kararı hataları giderildi (iniş sorusu açıkken seçilen saha artık o soruya katılır; seçilen sahaya gidilir; tıklama toleransı ve otomatik devam). Büyütülmüş H-V diyagramından irtifa/sürat seçimi. Rotor devri benzetilmiş kalibrasyonla kapatıldı (fleyır tepesi ~360 → ≤341 RPM; atalet 2711 kg·m² korunur). Pilot: TR alçak irtifa tekniğine göre dalışsız süzülüş girişi, irtifa aldırmayan fleyır, süzülmeyen son kollektif, alçak-süratli akışta fleyır kararı, enerji yönetimli yaklaşma planlayıcısı (63–80 KIAS, yükseklik fazlasında spiral). Fizik: yüzey tabakası rüzgârı, deterministik türbülans, dağ yamaç akımı, tutum komutlu disk eğimi. Görsel: gökyüzü, bulut, zemin dokusu, dalgalı su, iki tip orman, karlı dağlar, meydan donanımı ve rüzgâr tulumu, ufuk arazisi, rotor aşağı akımı. 168 test geçti. Ayrıntı: docs/REVISION-v030.md.

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

Sonraki çalışma: S01 fleyır/tutum ve sonuç akışına kullanıcı geri bildirimi; ağırlık/rüzgâr/yoğunluk kapsamını genişletme ve elde edilirse AB-205 kapasite kalibrasyonu. Veri araması geliştirmeyi bekletmiyor.
