# v0.27.0 — Uçuş sahaları, zemin teması ve hedef yönetimi

## Uygulananlar
- Koşullarda Arazi / Meydan / Ormanlık / Dağlık / Su üstü. Kayıt şeması 15; eski kayıtlar varsayılan Gölbaşı arazisine geçirilir. Aynı oturum verisi fizik, çizim, AGL, aday saha seçimi ve raporu besler; global değişkenle arazi değiştirilmez.
- Gölbaşı DEM korunur. Orman aynı gerçek zemin üzerinde temsili ağaçlar; canopy ayrı engel yüksekliğidir. Dağlar ve kıyılı su sahası prosedürel taslaktır. Orman nokta teması sınırlı geometrik taramadır, dal/esneme çözümü değildir.
- Güvercinlik pistinin 06/24 doğrultusu, 2017×36 m ölçüsü, ARP ve eşik kot farkı DHMİ LTAB belgesinden alınır. OpenStreetMap sınır kutusundan 1086 bina/taksi yolu/apron özelliği alınmıştır. Bina izleri gerçek harita tabanlıdır; yükseklikler etiket yoksa 3 m varsayılır. Havalimanının birebir fotogerçekçi kopyası tamamlanmadı. Taksi yolu genişliklerinde eksik etiketler temsili 15 m; AIP ayrıntılarıyla tek tek eşleme henüz yok.
- Pist/apron/taksi yolu sert yüzey, arazi toprak/taşlı, su ayrı temas modeli. Deneysel sürtünme, yatay enerji ve pürüzlülüğe göre takılma/devrilme; izleyen rotor/mast/kuyruk hasarı görünür. 5–10 m yapay mesafe sınırı ve otomatik patlama yok. Hasar eşikleri AB-205 yapısal limitleri değildir; ikincil temaslar basitleştirilmiş kurallardır, tam çoklu cisim çözümü değildir. Binalarla çarpışma henüz yok.
- Su temasında toz yerine halka/sıçrama görseli ve temsili batma; yüzdürme/su dinamiği doğrulanmadı.
- Gerideki aday saha, anlık ters hız yerine sınırlı yatışa karşılık gelen kavisli yönlendirme ister. Yetersiz irtifada hedefe ulaşma garanti edilmez. Fizik çekirdeğinin kaldırma/RPM katsayıları değiştirilmedi; dönüş kumandası sınırı ayrı genişletildi.
- Hazır akışta zemin, engel ve yaklaşık erişimle aday taraması; P işareti seçilen otomatik hedef. Mevcut yerel öngörülü yöneticiye 2–3 saniye ufuk, erken frenleme, ölçülü son kollektif ve enerjiyi saklama adayları eklendi. Öğrenilmiş yapay zekâ/LLM değildir; küresel optimum veya her durumda yumuşak iniş iddiası yok.
- Ön cam boşluğu daraltıldı, çatıdaki yeşil cam/panel öğeleri kullanıcı isteğiyle kaldırıldı. Gövde renk şeritleri yüzeyden az ayrılarak kesişmeler azaltıldı. FBX kaynak dosyası korunur; değişiklikler uygulama modelinde.
- Uyumluluk çizicisinde arazi ve nesneler aynı piksel derinlik sınamasına alındı; pistin zemin altında parça parça kaybolması düzeltildi.

## Kaynak incelemesi
Uçuş Hareketleri(2).pdf, PDF 96–106 okundu. Özellikle 99–100: saha/yükseklik/rüzgâr değerlendirmesi; 101–105: fleyır, son kollektif ve ruleli inişin düzgün pist/şerit bağlamı. PDF 99'daki 180° dönüşlü saha seçimi 700–1000 ft; 360° ise 1000 ft üzeri bağlamındadır. Uygulamanın mevcut 0–600 ft başlangıç aralığı için bunlar başarılı dönüş garantisi oluşturmaz. Eğitimde güçlü kurtarma/gaz açma adımları gerçek tam güç kaybında kullanılabilir güç olarak aktarılmadı.

Türkçe operatör §9.1.9, PDF 185–186 tekrar okundu: kısmi güç sabit bir yüzde değildir; havırdaki güç kaybı ile yüksek/süratli uçuşta ilk kollektif uygulaması aynı değildir. Kaynaktaki ayırım korunur. Tüm emercensi kitabının yeniden eksiksiz denetimi tamamlanmış değildir.

Kaynaklar:
- https://www.dhmi.gov.tr/AIPDocuments/LT_AD_2_LTAB_en.pdf — 19 MAR 26 revizyon bilgisi; pist ve meydan ölçüleri.
- https://api.openstreetmap.org/api/0.6/map?bbox=32.720,39.923,32.758,39.947 — 19 Ekim 2026 veri alımı; © OpenStreetMap contributors, ODbL.
- https://www.openstreetmap.org/copyright
- FAA AC 61-140A / Helicopter Flying Handbook — ek çapraz kaynak; Türkçe uçuş hareketleri ve operatör metni esas.

## Kontrol ve açık sınırlar
150/150 test geçti. Yeni testler: beş saha kaydı, canopy/AGL ayrımı, su/karanın ayrılması, yüzeye göre takılma ve ikincil hasar, rotor fazının sürekliliği, gerideki hedef ve model çatı/cam kontrolü.
Beş sahanın CPU çizimleri üretildi ve incelendi. Etkileşimli tarayıcı/WebGL kontrolü bu tur yapılamadı. Taslak ağaç/dağ/su görünümü fotogerçekçi değildir.

400 ft / 60 KIAS hazır akışta ek son kollektif adayları öncesi/sonrası düşey temas hızı (m/s): arazi 6.33 → 5.93; meydan 6.53 → 5.99; orman 6.50 → 6.50; dağ 4.77 → 4.77; su 6.22 → 5.89. Bu yalnız bu sürüm içindeki aday genişletme karşılaştırmasıdır; v0.26 ile kontrol grubu veya gerçek uçuş doğrulaması değildir. Sert temas sorunu tüm koşullarda çözülmedi. Ayrıntılı koşu çıktısı: AUDIT-v027.json.

Öncelikli devam: gerçek dokulu gövde/kaplama, harita-fotoğraf eşleştirmeli meydan detayları; hazırlı akışta uzun vadeli enerji/iniş değerlendirmesi; ağaç/bina/zemin için daha ayrıntılı temas ve doğrulanmış materyal verisi.

## 19 Ekim açılış düzeltmesi
- WebGL sahnesinde gerçek bina verileri yüklenirken `height is not a function` hatası yeniden üretildi. Bina yüksekliği, zemin yüksekliği fonksiyonunu gölgeliyordu; değişken `buildingHeight` olarak ayrıldı.
- Bu hata SceneView oluşturulurken app.js yürütmesini kesiyor, arayüz olaylarının bağlanmasını engelliyordu.
- Gerçek arazi ve Güvercinlik bina verileriyle sahne ayrıntısı oluşturma ve bina/zemin yüksekliği ayrımı için 3 regresyon testi geçti.
- Tarayıcı/WebGL görüntüsü bu düzeltmede doğrulanmadı; gerçek Three.js nesne oluşturma yolu Node üzerinde çalıştırıldı.
