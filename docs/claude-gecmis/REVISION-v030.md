# v0.30.0 / energy-1.6 — 20 Ekim 2026

Bu sürüm, kullanıcı talebiyle karar mekanizması, uçuş fiziği ve uçuş sahalarına odaklanan en kapsamlı turdur. Altyapı (Session, karar zinciri, kayıt şeması, arayüz düzeni, logolar, 1 ft/1 kt H-V seçimi) korunmuştur. Bütün sayısal katsayılar deneysel mühendislik ayarıdır; AB-205 uçuş doğrulaması değildir.

## 1. Hata düzeltmeleri

### Saha kararı (kullanıcı bildirimi)
- **Kök neden:** İniş sahası sorusu açıkken araziye tıklanan saha "senaryo ortası yönlendirme" (redirect) olarak kaydediliyordu. Önce yönlendirme kararı, ardından yeniden 1/2 otomatik sahaları soran iniş kararı geliyor; bu ikinci cevap yönlendirmeyi geçersiz kılıyordu. Sonuç: seçilen sahaya gidilmiyordu.
- **Düzeltme:** İniş sahası sorusu cevaplanmadan eklenen saha o sorunun seçeneklerine katılır. Soru açıksa yeni seçenekle hemen yeniden gösterilir. İniş cevabından sonra eklenen saha kendi karar anını açar. Aynı anda bekleyen başka karar varsa önce saha kararı gösterilir. Aynı andaki cevaplar birbirini silmez.
- Seçilen sahada "Uzak hedef" başlığı yerine "N. aday saha" başlığı ve hesaplanan süzülüş oranı notu gösterilir.

### Harici saha tıklaması
- Tıklama, 25 px içindeki her işarette (T dahil) yok sayılıyordu. Artık yalnız gerçek saha işaretleri ekleme yapmayı engeller; yarıçap 14 px. T üzerine sol tık o noktaya saha ekler.
- Sürükleme eşiği 5 px'ten 8–12 px'e çıkarıldı (dokunmatik ve hassas fare).
- Gökyüzüne tıklanınca "Zemin bulunamadı" bilgisi gösterilir. Her ekleme ve kaldırma kısa bir bildirimle doğrulanır.
- **Akışın devam etmemesi:** Kararla duran oynatım, karar cevaplanınca kendiliğinden sürer. Karar öncesi eklenen saha oynatımı durdurmaz.
- Kayıt yükleme sınırı 16'dan 64 karara çıkarıldı; çok sayıda yönlendirme yapılan kayıtlar artık yüklenebilir.

### H-V diyagramı
- Görseli büyüt artık arayüz içinde açılır, yeni sekme açmaz.
- Büyük görünümde artı imleç ve canlı okuma vardır. Tıklayınca o irtifa/sürat seçilir. Ok tuşları 1 ft/1 kt değiştirir. Yakınlaştırma, uzaklaştırma ve sığdırma düğmeleri vardır. Dokunmatikte de çalışır.
- Geliştirme notu artık indirme bağlantısı değil, sayfa içinde açılan metindir.

## 2. Rotor devri kalibrasyonu (konu kapatıldı)

**Aranan kaynaklar:**
- Kullanıcının bilgisayarındaki AB-205, FAA, gpt doküman ve KARIŞIK klasörleri tarandı. Bunlar arasında UH-1H bakım el kitabı (1608 s.), DCS UH-1H uçuş el kitabı, NASA TM-86925, Drivetrain/Main Rotor notları ve Uçuş Hareketleri vardı.
- Açık kaynakta DTIC/NASA aramaları yapıldı. ARL TM-377 UH-1H hover analizi rotor yarıçapını ve devri veriyor, atalet vermiyor.

**Sonuç:** Doğrudan AB-205/UH-1H rotor kutup ataleti bulunamadı. Bu nedenle mevcut veriyle benzetilmiş kalibrasyon yapıldı.

**Dayanak noktaları:**
- **Atalet:** 2711 kg·m² korunmuştur. Bu, otorotatif indeks ≈ 23 ft³/lb'ye karşılık gelir; UH-1 sınıfı için yüksek ataletli rotor tanımıyla uyumludur. DCS kılavuzundaki "güç kesik, 4 ft havıra çık, dön, otur" anlatısı da yer etkisinde yaklaşık 3 s'lik rotor enerjisiyle tutarlıdır.
- **Giriş düşüşü:** DCS §9.7A'ya göre seyirde 2–5 s tepki gecikmesi devri ~280'e düşürür. Modelde 80 KIAS'ta 2 s sonra ~287 RPM; uyumlu.
- **Fleyır tepesi:** DCS §9.7C ve TR Standart Otorotasyon'a göre fleyırda devir ~330–340'a çıkar ve kollektifle yeşilde tutulur. Eski modelde rehberli akışta 359–360 RPM'e çıkıyordu. Yeni durumda:
  - Hazır akışta pilot devri hatve yüklemesiyle ≤340'ta tutar.
  - Rehberli akışta "Rotor devri yüksek" kararı devir yükselirken sorulur, tepeden sonra değil.
  - Ölçülen tepe 338–341 RPM.
- **Temas devri:** ~%70–72 (225–235 RPM). Bu, TR'nin "geri kalan kollektif tam olarak kullanılırken" tekniğinin sonucudur: kalan rotor enerjisi temas yumuşatmaya harcanır. Hata olarak değil, model davranışı olarak kabul edilmiştir. DCS uyarısıyla da tutarlıdır: kollektif tümden çekilirse 15–20 ft'te havır ve ardından devir ~200'e düşer.
- Bu konu bu sürümle kapatılmıştır. Gerçek atalet verisi gelirse tek parametre (PARAMETERS.inertiaKgM2) değiştirilir.

## 3. Pilot ve karar mekanizması

**Süzülüşe giriş (TR Alçak İrtifa Otorotasyonu):**
- Alçak ve süratli durumda pilot artık süzülüş süratine ulaşmak için burun aşağı dalış yapmaz.
- 150 ft altında mevcut sürati korur veya geri saykılıkla azaltır. 350 ft üzerinde 63 KIAS'a yerleşir; arada geçişlidir.
- Örnek, 200 ft/50 kt: eski hâlde 2700 ft/dk alçalış ve 53 kt temas; yeni hâlde 0.8–1.0 m/s ve ~5 kt.

**Fleyır:**
- Helikopter alçalmayı kesip irtifa almaya başlarsa yavaşlama talebi yumuşatılır (TR hata b: "irtifa aldırmak").
- Örnek, 40 ft/70 kt hazır akış: 464 ft/dk tırmanma 116 ft/dk'ya indi.

**Son kollektif:**
- Alçalış hedeften yavaşsa veya helikopter yükseliyorsa kollektif ağırlığın altına inebilir. Eski hâlde ileri süratte 15–20 ft'te süzülüp rotor enerjisi tükeniyordu.
- Hedef alçalış eğrisi 1.2·√h olarak yeniden ayarlandı; üst sınır 2.2 m/s.

**Alçak-süratli rehberli akış:** Fleyır kararı artık son kollektiften önce sunulur. Eskiden 40 ft/70 kt'ta fleyır seçeneği hiç çıkmıyordu.

**Yaklaşma planlayıcısı (enerji yönetimi):** Seçilen saha veya uzak hedef için fleyır kapısına gereken süzülüş oranı, şekil süzülüş eğrisinden hesaplanır.
- Uzak hedefte 63→80 KIAS arası en ekonomik sürat seçilir. Hızlanma sınırlıdır; dalış yoktur.
- Yükseklik fazlası varsa sürat düşürülmez. Bunun yerine sahanın üzerinde alçalan spiral ile yol uzatılır; glide süratinin altına yavaşlamak alçalışı artırır.
- Erişilemeyen hedefte karar metni bunu bildirir.
- 20 saha senaryosunda sert/hızlı temas sayısı 8'den 2'ye indi. Erişim dışındaki hedeflerde kısa kalış fiziksel olarak kaçınılmazdır.

**Mevcut YZ karar günlüğü:** Öngörülü pilotun her eylem değişimi gerekçesiyle olay listesinde gösterilmeye devam eder.

## 4. Uçuş fiziği (energy-1.6)

**Hava kütlesi modeli (localAir):**
- **Yüzey tabakası:** 10 m altında rüzgâr logaritmik olarak azalır. Pürüzlülük: su 0.0002, meydan 0.03, arazi 0.1, dağ 0.3, orman 0.8 m. Fleyır ve temasta karşı rüzgâr etkisi bu yüzden azalır.
- **Türbülans:** Hafif seçimde yatay σ 0.7, düşey σ 0.35 m/s; orta seçimde 1.8 ve 0.9 m/s. Deterministik bir esinti alanıdır; aynı koşul her seferinde aynı sonucu verir. Düşey bileşen yere yaklaştıkça azalır. Önceden yalnız metin olarak gösteriliyordu.
- **Dağlık sahada yamaç akımı:** Rüzgârüstü yamaçta yükselen, rüzgâraltında çöken hava hesaplanır (±5 m/s sınırlı, yükseklikle söner). HUD'da "hava kütlesi ±x m/s" olarak gösterilir.
- **Kapsam:** Motor arızasından önceki güçlü uçuş, yapılandırılmış trim durumu kabul edilir; o sırada hava kütlesi seçilen rüzgârdır.
- **Dağlık arazi:** Ridged fraktal gürültülü masifler ve rotanın geçtiği vadi tabanı. Başlangıç şeridi düzdür; alçak güçlü başlangıç AGL'sini kaybetmez. Fizik, çarpışma ve görüntü aynı fonksiyonu kullanır.

## 5. Görselleştirme (yalnız görüntü; fizik sonucunu değiştirmez)
- **Gökyüzü:** Analitik gradyan kubbe, güneş diski ve halesi, ince sirrus. Gündüz, gün batımı ve kapalı havaya göre değişir. Güneş ışığı yönü de buna bağlıdır.
- **Bulutlar:** Yumuşak katmanlı bulutlar, örtüye göre 0/16/46 adet.
- **Zemin:** Dünya koordinatlı çok ölçekli doku. Dağda eğime göre kaya, yüksekte kar çizgisi. Pistte asfalt dokusu.
- **Su üstü:** Dalga normalli su yüzeyi, gökyüzü yansıması (fresnel), güneş parıltısı, adalarda kıyı köpüğü. Rotor aşağı akımı dairesel dalga ve serpinti oluşturur.
- **Orman:** İki ağaç tipi (kat kat iğne yapraklı ve geniş yapraklı), renk çeşitliliği, rüzgârda salınım. Konum, yükseklik ve yarıçap çarpışma modeliyle aynıdır.
- **Meydan:**
  - Kesintisiz pist kenar çizgileri ve temas bölgesi işaretleri.
  - Yeşil eşik ve kırmızı pist sonu ışıkları, PAPI.
  - Kule ve dönen ikaz ışığı.
  - Rüzgâr tulumu: seçilen rüzgâr yönüne bakar, 15 kt'ta tam açılır, dalgalanır.
  - OSM binaları tek parça çizime birleştirildi; ~1000 ayrı çizim çağrısı birkaç taneye indi.
- **Ufuk:** 3–9 km arası uzak arazi halkası (dağlarda karlı tepeler, su üstünde uzak kıyı) ve sise karışma.
- **Aşağı akım parçacıkları:** 16 m altında, yüzeye göre toz, serpinti veya yaprak. Temasta darbe bulutu.
- **Işık:** Daha düşük ortam ışığı, daha güçlü güneş. Sahne daha kontrastlı ve derinlikli.

## 6. Ölçümler
- **Testler:** 168 test geçti (157 eski + 11 yeni: tests/v030.test.mjs).
- **20 başlangıçlık iniş ölçümü** (rehberli + hazır):
  - Ortalama düşey temas eski 2.53 m/s, yeni 2.38 m/s.
  - Fleyır devir tepesi eski 360, yeni 341 RPM.
  - Rehberli 200/50: eski 52 kt, yeni ~10 kt temas.
- **Ağırlık/yoğunluk taraması:** docs/SWEEP-v030.txt.
- **Bilinen sınır:** 9500 lb rehberli akışta temas ~3.4 m/s. Seçilen düşük yüzey rüzgârı da etkili oluyor.

## Kaynaklar (bu tur)
- **TR Uçuş Hareketleri:** Standart Otorotasyon (2-12) ve Alçak İrtifa Otorotasyonu (2-15/16).
  - Fleyır ~100 ft'te başlar.
  - Amaç 15 ft'te en az alçalış ve sürat; ilk kollektif 15 ft ±3.
  - Alçakta irtifa saykılıkla korunur; aşırı geri saykılık irtifa aldırır (hata).
- **DCS UH-1H Flight Manual §9.7:** Ticari simülatör kılavuzudur, resmî değildir. Yalnız kalibrasyon dayanağı olarak kullanıldı.
- **ARL Aero TM-377 (DTIC ADA173707):** UH-1H rotor yarıçapı 24 ft; 315/325 RPM.
- **DTIC ADA071648 (OH-58 HERS):** Ataletin hover kesintisinde devir düşüşüne etkisi; nitel karşılaştırma için kullanıldı.
