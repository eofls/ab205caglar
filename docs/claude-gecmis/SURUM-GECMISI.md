# v0.33.0 — 21–22 Ekim 2026 (gece turu)
Uçuş sahası dünya modeli (rölyef, bitki örtüsü, binalar, kayalar, zemin türleri), yapay zekâ iniş yeri seçimi, başlangıç konumu haritası, havırdan/ağır ağırlıkta otorotasyon düzeltmeleri, 80 KIAS TR süzülüşü, kuyruk bumu ayrılması, ikaz paneli, sade değerlendirme, kumanda ayarları, tablet tam ekran. Ayrıntı: docs/REVISION-v033.md

# v0.32.0 — 21 Ekim 2026 (hızlı güncelleme)
Tek fizik modeli (energy-1.7), 3 seviyeli pilot tecrübesi seçimi, fotoğraflara göre kokpit kumandaları ve göstergeler, eğitmen odası iskeleti. Ayrıntı: docs/REVISION-v032.md

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

# Güncel: v0.19.0

Otomatik pedal, rotor rezervine bağlı son kolektif, renkli temas endeksi ve yapısal kuvvet–strok altyapısı. Kaynak/varsayım ayrımı: docs/LANDING-REVIEW-v019.md. Devam notu: docs/NEXT-SESSION.md.

# Güncel: v0.18.0

Yüksek kolektifte hatalı RPM toparlanması düzeltildi; pedal–yön hesabı ve kritik durum kararları eklendi. Kaynak/varsayım ayrımı: docs/EMERGENCY-REVIEW-v018.md. Tekrarlanabilir kontrol: node scripts/physics-audit.mjs.

# Güncel: v0.17.0

Kumanda görselleri, hava süratine göre saha yönlendirme sınırı, karar–sonuç farkı açıklaması. Kontrol kaydı: docs/PHYSICS-AUDIT-v017.md. Pedal fiziği ve gerçek uçuş kalibrasyonu açık işlerdir.

# Güncel: v0.16.0

IAS/rüzgâr, koşullu aerodinamik kararlar ve temas öncesi sonuç özeti. Kaynak ve deneysel katsayılar: docs/AERODYNAMIC-REVIEW.md.

# Güncel: v0.15.0

Koşullu rotor kararı, sabit hedef izleme, hareketli temas tahmini, ortak akış göstergeleri ve sayısal karşılaştırma. Devam: docs/NEXT-SESSION.md.

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

# AB-205 Senaryo Laboratuvarı — 0.2

İlk aşama: kaynak izlenebilir senaryo motoru ve geri alınabilir oynatım. **3B sahne ve uçuş fiziği henüz yok.** Kullanıcının “önce yazılımsal işleri, ardından 3B” sıralaması esas alındı.

## Çalıştırma

Statik dosyalar `dist/` altında. ES modules için HTTP üzerinden sunun. Bağımlılık ve derleme adımı yok. Test: `npm test` veya `node --test tests/*.test.mjs`.

## Mimari

- `catalog.js`: 5 senaryo, karar seçenekleri, kaynak kayıtları, mürettebat profilleri.
- `engine.js`: doğrulanan konfigürasyon, saf olay üretimi, deterministik seek/replay, dal değişikliği, sürümlü oturum kaydı.
- `scene-contract.js`: gelecek 3B sahnenin birimleri, boyutları, kamera ve durum sözleşmesi.
- `app.js`: arayüz, yerel kayıt, dışa/içe aktarma. Kullanıcı metni HTML olarak çalıştırılmaz.
- `docs/`: kaynak inceleme ve devam etme kaydı.

Zaman çizelgesi **sunum zamanı**dır. Sayısal uçuş, hasar, başarı veya pilot tepki süresi hesaplanmaz. Başlangıç noktaları görsel okumaya dayalı tasarım girdileridir; otomatik H/V sınıflandırması yoktur. Meteoroloji, kaynaklı nitel değerlendirmeyi etkiler; uçuş yolunu henüz etkilemez.

## Kalıcılık

Kaynak kodu Sites tarafından yönetilen Git deposunda sürümlenir. Oturum `localStorage` ve JSON dışa aktarma ile saklanır. Kayıtlar bulutta cihazlar arası eşitlenmez. Kaynak belgelerin tamamı repoya konulmadı; Library kimlikleri `docs/SOURCES.md` içindedir. Kullanıcının diyagramı ve karşılaştırılan tek PDF sayfası özel sitede gösterilir.

## Durum

İşlev testleri `tests/engine.test.mjs` içindedir. Tarayıcı kontrol aracı bu ortamda yoksa görsel/etkileşimli browser QA yapılmış sayılmaz. Windows paketi üretilmedi. Sonraki adımlar: `docs/RESUME.md`.


0.2: Serbest H/V başlangıç seçimi (1 ft / 1 kt), tıklama ve klavye, Çağlar Filo logosu ve kaynak dili tercihi. Kaynak görseli aralığının dışına genişletme sonraya bırakıldı.


v0.3: Yerel Three.js ile 3B referans modeli, temsili arazi ve deterministik zaman çizelgesi animasyonu eklendi. Uçuş fiziği değildir. Ayrıntılar docs/RESUME.md.


v0.4: S01 (400 ft/60 KIAS) ayrıntılı olay akışı, iki karar/dört değerlendirme dalı, kaynak bölümleri ve 3B anlatım işaretleri. `npm test` ve `python tests/check_layout.py`.


v0.5: Tam ekranda ortak bildirim/oynatım/karar kontrolleri ve S01 için karar duyarlı temsilî hareket aşamaları. 28 otomatik test; tarayıcı QA henüz yapılmadı.


v0.6: Hava aracı sekmesi, opsiyonel ağırlık/RPM ve konfigürasyon girdileri, kaynak değerleri tablosu ve model veri eksikleri. 35 test. Sayısal uçuş modeli henüz etkin değil.
