# v0.19.0 — 15 Ekim 2026

105/105 otomatik test geçti. HTML/form/tam ekran düğümleri ve tüm JS sözdizimi kontrol edildi. PHYSICS-AUDIT-v019.md:80 koşul ve72 rejim; .02/.01 s adım farkı en fazla .0290 RPM/.0112 ft; müdahalesiz yüksek kolektifte pasif RPM artışı0. Son kolektifte13 örnek yukarı net ivme; her koşulda güvenli temas iddiası yok. LANDING-REVIEW-v019.md kaynaklar, 2000 ft/dk hesabı ve deneysel katsayıları açıklar.

Yeni testler: pedal varsayılan/kayıt/eski şema/kapalı mod; temas endeksi sınırları/renkleri; kuvvet–strok analitik kontrolü ve kapsam retleri; geç tepki ve geri sarma. Yapısal model veri bekler. Tarayıcı görsel QA ve bağımsız AB-205 uçuş doğrulaması yapılmadı.

---

# v0.18.0 kontrol eki

100 test geçti. 64 yüksek kolektif uçuş birleşimi, 80 saha/rüzgâr/ağırlık ve 72 rejim birleşimi; pedal SVG, baş yönü, geçmiş kayıt ve karar aralığı kontrolleri. Kaynak/varsayım ayrımı EMERGENCY-REVIEW-v018.md; sayısal sonuçlar PHYSICS-AUDIT-v018.md. Tarayıcı görsel QA ve gerçek uçuş doğrulaması yok.

# v0.17.0 kontrol eki

94 otomatik test; 80 hedef/rüzgâr/ağırlık/sürat ve 72 rejim birleşimi. PHYSICS-AUDIT-v017.md tekrar üretilebilir sayısal kayıttır. HTML/JS kontrolleri tamamlandı; tarayıcı görsel QA yok. Kumanda görselleri fizik durumundan türetilir, pedal hesabı henüz yok. Gerçek AB-205 doğrulaması tamamlanmadı.

# v0.16.0 / energy-0.5 / şema5 — 15 Ekim 2026

IAS bütün başlangıçlarda tutarlı; düşük sürat yer referansı istisnası kaldırıldı. Kolektif kayıp gücü ve açık RPM yönetimi geliştirildi; erken/durum tabanlı/geç son kolektif kararı. Tam güç kaybı dışında seçilebilir deneysel kısmi güç dalı; VRS eğilimi, düşük RPM/hatve riski, yüksek devir/overspeed birbirinden ayrı. Kararlar aynı fizik ve WebGL/Canvas görüntüsünü değiştiriyor. VRS/overspeed için şematik rotor halkası ve mevcut bildirim kutusunda açıklamalar var.

Senaryo sonu tablo ve karşılaştırma: süre, min/max RPM, alçalma, temas süratleri, karar zamanı, rejim bulguları, temas öncesi enerji. Hasar/kaza-kırım için alanlar eklendi fakat kaynak yetersiz olduğundan sınıf uydurulmadı. Ayrıntılı denklemler, yeni açık kaynaklar, tüm deneysel katsayılar: AERODYNAMIC-REVIEW.md.

89 otomatik test (önceki80 güncel akışa uyarlandı +9 yeni); 30KIAS/30kt, rüzgâr değişmezliği, VRS/güç ayrımı, son kolektif farkı, overspeed, şaft enerjisi, temas enerjisi ve 16 serbest başlangıç/güç/rüzgâr birleşimi. HTML ve JS kontrolü başarılı. Tarayıcı görsel doğrulaması ve bağımsız uçuş testi yapılmadı.

Tam BEM/dinamik inflow, doğrulanmış AB-205 atalet/polar/motor geçişi ve yapısal darbe modeli bekliyor. Bu sürüm deneysel eğitim senaryosu altyapısıdır; gerçek AB-205 performansı veya kaza sonucu doğrulanmış değildir.

---

# v0.15.0 — 15 Ekim 2026

80/80 otomatik test geçti; HTML yerleşim, tüm uygulama JS sözdizimi kontrolü geçti. Ek kanıtlar tests/conditional-guidance.test.mjs. Tarayıcı görsel QA ve bağımsız AB-205 uçuş doğrulaması yapılmadı. Nicel pasif RPM toparlanması açık teknik konu olarak korundu.

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

61/61 otomatik test ve HTML yerleşim kontrolü geçti. Tarayıcı görsel testi yapılamadı.

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

# Validation — 0.1

11 Node tests passed. Includes all 5 scenarios × 4 decision combinations, causal rewind, branch invalidation, pause/rate, import validation, source keys and weather vectors.

No browser automation skill is available in this managed environment. No screenshot, browser interaction or responsive visual QA performed. HTML asset paths, element IDs and JS syntax checked locally.

Flight model validation: NOT APPLICABLE; numeric flight dynamics not implemented.
3D: not implemented.
Windows packaging: not implemented.

## v0.2
14 tests passed. Exhaustive roundtrip of 48,681 integer chart positions; custom start persistence; old-session compatibility; bounds and fractional input rejection. Browser visual QA remains unavailable. Logo inspected as supplied and embedded unchanged.


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
