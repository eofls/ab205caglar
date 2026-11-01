# v0.33.0 — 21–22 Ekim 2026 gece turu

## 1. Uçuş sahası dünya modeli (fizik, yapay zekâ, harita ve sahne aynı modeli kullanır)
- **Mikro rölyef:** DEM ve dağ rölyefinin üstüne ±1 m dalgalanma ve kuru dere yatakları.
- **Bitki örtüsü:**
  - Ormanda açıklıklar, 8 çayır ve yangın yolu.
  - Arazide tarla kenarlarında kavak sıraları, köy bahçeleri, sulak alan kenarında ağaçlar, tek ağaçlar.
  - Dağda çam kümeleri; adada ağaçlar.
- **Binalar:** OSM binaları (meydan çevresinde ~1000) yükseklikleriyle çarpışma hacmidir. Arazide 8 çiftlik (ev, ahır, depo) eklendi.
- **Kaya blokları:** Dağın kayalık yamaçlarında (eğime göre), arazide seyrek.
- **Zemin türleri:**
  - Asfalt/beton, sürülmüş tarla (yumuşak), anız, çayır, toprak yol.
  - Sulak alan (yumuşak), kayalık yamaç, kum, orman tabanı, su.
  - Sürtünme ve pürüzlülük temas mekaniğine gider.
- **Arazi tarlaları:** Parsel deseni zemin dokusunda ve haritada da aynıdır.
- **Performans:** Ağaç ve kaya sorguları 64 m karolarda önbelleklenir.

## 2. Yapay zekâ iniş yeri seçimi (hazır akış) — `landing-zone.js`
- **Bir noktanın değerlendirilmesi:**
  - Kızak izinde eğim (sınır 7°, TM 55-1520-210-10 §5-17: burun aşağı 7°, yan / burun yukarı 10°).
  - Rotor diski için engel açıklığı (en az 11 m, iyi 24 m).
  - Zemin türü; enerji hattına mesafe (40 m).
  - Su.
  - Son yaklaşma hattının engel durumu (230 m geriye, 6.5° profil).
- **Pilotun seçimi:**
  - Düz süzülüşün doğal olarak ulaşacağı noktayı (ölçülmüş tablo) merkeze alır, çevresindeki en iyi yeri seçer.
  - Orada uygun yer yoksa dönüşlü yelpazede arar. Arazi yüksekliğini ve aradaki engebeyi de hesaba katar.
- **Süzülüşte yönlendirme:** Seçilen yere baş yönlendirilir. Ormanda yükseklik referansı ağaç tepeleridir.
- **Rehberli 1/2 hedefler:** 60 m içindeki en uygun zemine taşınır.
- **Ölçüm (28 başlangıç, 4 saha):**
  - Hedef sapması medyanı 150 m'den 39 m'ye indi.
  - Uygun zemine iniş 15'ten 20'ye çıktı.
  - Yumuşak ve temiz iniş 11'den 17'ye çıktı.

## 3. Başlangıç konumu haritası (Yükseklik–hız sekmesi)
- Seçilen sahanın kuşbakışı görünümü: rölyef gölgesi, zemin türleri, yollar, binalar, ağaçlar, kayalar, enerji hatları.
- Dokununca helikopter oraya konur. Helikopterden sürükleyince yönü ayarlanır.
- Yakınlaştırma ve uzaklaştırma, ölçek çubuğu ve kuzey oku var.
- "Uygun iniş yerlerini göster" katmanı: yeşil uygun, sarı sınırda, kırmızı uygunsuz.
- Seçilen nokta arıza noktasıdır. Öncesindeki 4 sn güçlü uçuşta seçilen yükseklik arazi ve engel üstünden korunur; ormanda ağaç tepeleri esas alınır.

## 4. Fizik ve pilot yasaları
- **Havırdan arıza:** Yüksek havırda (≈300 ft üstü) burun indirilip sürat kazanılır. 400–500 ft / 0 kt temas 8–10 m/s'den 1.5–2.7 m/s'ye indi.
- **Ağır ağırlıkta devir çöküşü:** Düşük devirde iç akış bağlantısı düzeltildi. 9500 lb ortalama temas 10.1 m/s'den ≈7.5–8.5 m/s'ye indi; düşük süratli başlangıçlar H-V kaçınma bölgesindedir.
- **Kuyruk açıklığı:** Yere yakınken burun yukarı açısı sınırlandı (kızaklar yerdeyken ≈16°); ufkiyet tutulursa sınır uygulanmaz, kuyruk vurabilir.
- **Süzülüş sürati:** TR Standart Otorotasyon gereği 80 KIAS (100 ft'e gelmeden). Değerlendirmede ölçüt 75–90 KIAS.
- **Düşük devirde ivmelenme:** Devir düşükken burun aşağı ivmelenme yumuşatıldı; disk boşalmıyor.
- **Fleyır devri:** Devir regülasyonu sıkılaştırıldı; tepe ≤ 342 RPM.
- **Alçak ve süratli girişte:** Seviye korunarak yavaşlama yapılır, son kollektif sonra gelir.

## 5. Helikopter modeli
- **Kuyruk bumu ayrılması:**
  - Sert kuyruk teması (fazla fleyır).
  - Ya da düşük devirde sert inişte sarkan palların bumu kesmesi.
  - Bum menteşe gibi aşağı döner, kopar, yana savrulur; kuyruk rotoru durur, parçalar saçılır.
- **Ana rotor:** Konik açı itki ile büyür; devir düşünce paller sarkar.

## 6. Kokpit ve ikazlar
- İkaz paneli: RPM, MASTER CAUTION, ENG OIL PRESS, DC GENERATOR.
- **Düşük devir sesli ikazı (TM 55-1520-210-10 §2-85):**
  - Rotor 300–310 ve motor 6100–6300 RPM birlikte düştüğünde çalar.
  - Yüksek devir (329–339) yalnız ışıktır.

## 7. Arayüz
- **Uçuş sonu değerlendirmesi:**
  - Üç ana değer (düşey ft/dk, yer sürati, temas devri).
  - "Çalışılacak / Uygun" özeti ve sade puan tablosu.
  - Parça bazlı hasar dökümü kaldırıldı.
- **Deneme karşılaştırması:** Kitaplıktan seçilen kayıtlı deneme grafikte kesikli mor çizgiyle gösterilir.
- **Karar akışı:** Karar seçilir, alttaki Devam ile sürer; seçimden sonra Devam düğmesi kısa süre vurgulanır.
- **Yazılar:** Doğrulama, model durumu ve lisans yazıları çalışma alanından kaldırıldı. Veri ve harita kaynakları "Kaynak ve doğrulama" sayfasında.
- **Terim birliği:** "kollektif" (TR Uçuş Hareketleri yazımı).
- **Elle uçuş kumanda ayarları:**
  - Hassasiyet, ölü bölge, yumuşatma, ters eksen, oyun kumandası eksen eşleme.
  - Saykılık trimi: T tuşu veya omuz tuşu.
- **Tablet:** Tam ekran izni olmayan ortamlarda (gömülü görüntüleyici, iPhone) sayfa içi tam ekran kullanılır. Dokunmatik harita, karar ve kokpit iPad dikey/yatayda denendi.
- **Hata düzeltmesi:** Zaman çubuğu sona çekildiğinde 0.01 sn yuvarlaması yüzünden değerlendirme açılmıyordu; düzeltildi.

## Testler
- 180 test geçti. Davranış değişen beklentiler güncellendi: 80 KIAS süzülüş, havırdan otorotasyon, rapor satırları, yeni zemin türleri.

## Bilinen sınırlar
- 9500 lb ile 8000 ft / 30 °C birlikte uçuş zarfı dışında; temaslar sert.
- Ormanda açıklığa iniş hassasiyeti sınırlı; çoğu durumda ağaç tepesine yumuşak çökme yapılır.
- Çok uzak ya da çok dönüş gerektiren sahalarda isabet düşer (p80 sapma ≈280 m).
- 10 ft / 60 kt gibi çok alçak ve süratli girişlerde mikro rölyef sonucu sertleştirebilir.

## v0.33.0 · son ara kayıt (gece sonu)
- Başlangıç haritası: başlıkta uçuş sahası seçici; uçuş bitince iz, arıza noktası, seçilen saha (P / 1 / 2) ve temas noktası haritada çizilir, bilgi satırında temas hızı ve sahaya sapma yazılır.
- Haritadan konumlanan başlangıçta arızaya kadar olan motorlu uçuş ağaçların, binaların ve kayaların en az 6 m üzerinden geçer (önceden kavak sırasına çarpabiliyordu).
- Hazır akış saha seçimi: yolda arazi, ağaç, çatı ve enerji hattı kontrolü; dönüş yarıçapıyla erişilebilirlik; eğimli arazide süzülme mesafesi zemin yüksekliğine göre yinelenir; uygun saha yoksa ağaçların en alçak ve en seyrek olduğu yer seçilir; yüksek başlangıçta uzak saha yerine kısa saha tercih edilir.
- Yönlendirme: sahaya dönüşte yatış önceliği (önce dönüş, sonra sürat), fleyır sırasında yanal sapma düzeltmesi, son 40 ft'te yanal kayma sıfırlanır.
- Orman sahası: bölmeler, kesim sahaları (kütüklü), genç ağaçlandırma (2–5 m), aralanmış meşcere, orman yolları ve 30 m yangın emniyet şeridi; zemin dokusu ve harita aynı modelden.
- Rastgele 40 harita başlangıcı (alan başına): arazi 29/40 yumuşak-temiz, meydan 26/40, dağlık 16/40, orman 7/40 (önce 2/30).

## v0.33.1 · düzeltmeler
- Donma / cızırtı: temas anında ilk kez görünen toz, enkaz ve sıçrama gölgelendiricileri uçuş sırasında derleniyordu (2–3 s donma; ses iş parçacığı aç kalınca cızırtı). Tüm gölgelendiriciler sahne kurulurken derleniyor ve ısıtılıyor. Yerde yavaşlayan rotorun pal sesi devirle sönümleniyor.
- Pikselleşme: WebGL bağlamı kaybolunca (tablette uygulama değişimi, GPU sıfırlama) kalıcı olarak basit tuval görünümüne düşülüyordu. Artık bağlamın geri gelmesi bekleniyor ve sahne aynen geri yükleniyor.
- İkaz paneli: TM 55-1520-210-10 Şekil 2-9'daki 20 segment + MASTER CAUTION + RPM; yalnızca masaüstü tam ekranda, sol altta, küçük.
- Akış sırasında saha seçimi: soru saat yuvarlaması nedeniyle görünüp beklemede sayılmıyordu; panel de bekleyen soru yerine başka kararı gösterebiliyordu. Yönelme cevabı zamandan bağımsız alındığı için önceki kararlar kayıyordu. Üçü düzeltildi; Evet / Hayır sonrası Devam çalışıyor.
- Uçuşta seçilen her sahaya kendi yavaşlama kararı (approach-N) sunulur; sorulmadıysa yavaşlama varsayılır (önceden 63 KIAS ile ruleli temas).
- Engel kaçınma: sahaya giden çizgide tel / ağaç / yapı varsa "engel" kararı (saykılıkla tırman · hemen yavaşla · sürdür) gereken ve kazanılabilir yükseklikle sunulur; hazır akışta pilot süratle yetiyorsa tırmanır, yetmiyorsa yavaşlar.
