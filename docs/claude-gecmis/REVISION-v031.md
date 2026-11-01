# v0.31.0 / energy-1.7 + energy-2.0 (deneysel) — 21 Ekim 2026 gece turu

Bu tur yedi madde içeriyor. Altyapı (Session, karar zinciri, kayıt şeması, logolar, 1 ft/1 kt H-V seçimi) korunmuştur.

## 1. Pal elemanı rotor modeli (energy-2.0, seçilebilir, deneysel)

`rotor-bemt.js` UH-1H geometrisiyle (R = 7.315 m, veter 0.533 m, 2 pal, −10° burulma, NACA 0012 sınıfı polar) bir rotor modeli kurar. Bileşenleri:
- **İtki:** Kapalı formda pal elemanı denklemi.
- **Giriş akışı:**
  - İleri uçuşta Glauert giriş akışı.
  - VRS ve türbülanslı iz bölgesinde Leishman'ın ampirik indüklenmiş hız eğrisi.
- **Yer etkisi:** Cheeseman–Bennett.
- **Pal stall sınırı:** Ct/σ ≈ 0.14 − 0.12 μ, yumuşak diz.

Kalibrasyonu ayar yapılmadan kontrol edildi:
- 63 KIAS / 324 RPM sabit otorotasyonda alçalış 1894 ft/dk; şekil yaklaşık 1840 ft/dk. 50 ve 80 kt'ta da %6 içinde.
- Devirle alçalış eğilimi şekille aynı yöndedir.
- 2800 kg deniz seviyesi havır gücü 415 kW.
- Kollektif tam aşağıdayken (θ.75 = 0°) devir 335–339'a çıkar (DCS §9.7B: 320–340).

**Neden varsayılan değil:** Hazır akış ve rehberli karar dallarının kumanda yasaları enerji modeline göre ayarlıdır. Pal elemanı modelinde yaptığım fleyır yasası denemeleri bu gece temas hızını enerji modelinin altına indiremedi. Ortalama düşey temas ~4 m/s, enerji modelinde 2.3 m/s. Bu nedenle:
- Varsayılan model **enerji (energy-1.7)** kalır.
- Pal elemanı modeli Koşullar sekmesinden seçilir. **Elle uçuşta önerilir:** orada pilot yasası yoktur; kumanda kolu doğrudan pal hatvesidir.

## 2. Enerji modeline itki sınırı (energy-1.7)

Enerji modelindeki kaldırma, aynı pal stall sınırıyla yumuşak bir dizle sınırlanır.
- Normal koşullarda etkisizdir (tüm eski testler aynı).
- Yüksek ağırlık, yüksek yoğunluk irtifası veya düşük devirde son kollektifin sınırsız kaldırma üretmesini engeller.
- Sonuç: H-V diyagramının ağırlıkla genişleyen kaçınma bölgesiyle aynı yönde bir eğilim.
- HUD ve değerlendirme için `thrustMargin` (itki payı) çıktısı eklendi.

## 3. Uçuş sonrası değerlendirme

Temasla biten her uçuşta karar panelinin başında açılır.
- **Zaman çizelgesi:** Yükseklik, sürat, alçalış ve rotor devri; yeşil devir bandı, fleyır ve son kollektif bölgeleri, numaralı karar anları. Üzerine gelince değerleri okur, tıklayınca o ana gider.
- **TR standart tablosu:** Uçuş Hareketleri 2-12 ve 2-15/16 standartlarından ölçütler; her biri uygun/sınırda/uygun değil olarak puanlanır ve 0–100 toplam puan verilir.
  - Devrin yeşilde kalması.
  - 100 ft öncesi sabit süzülüş.
  - Fleyırın ≈100 ft'te başlaması.
  - İrtifa aldırmama.
  - İlk kollektifin 15 ft ±3'te uygulanması.
  - Temas düşey hızı ve yer sürati.
  - Rule mesafesinin bir helikopter boyunu aşmaması.
  - Baş istikametinin ±5° içinde kalması.
  - Seçilen sahaya mesafe.
  - Tel çarpması.
- **Rapor yazdırma:** Yalnız değerlendirme kısmı basılır.

## 4. Elle uçuş ve hazır akış hayaleti

Çalışma biçimine "Elle uçur" eklendi.
- **Kumandalar:**
  - Klavye: W/S kollektif, oklar saykılık, A/D pedal, C saykılığı ortala.
  - Oyun kumandası: sol çubuk kollektif/pedal, sağ çubuk saykılık.
  - Ekrandaki kollektif çubuğu, sürüklenebilir saykılık pedi ve pedal çubuğu.
- **Hesap:** Girdiler zaman damgalı kaydedilir ve hesap artımlı ilerler. Geri sarıp oynatmak kaydı birebir tekrarlar. Geri sarılan bir anda kumanda değiştirilirse o andan sonrası yeniden uçulur. Kayıt oturumla saklanır ve dosyaya da aktarılır.
- **Başlangıç durumu:** Pedal, arıza anında güçlü uçuş tork konumundadır. Motor durunca sağ pedal pilotun işidir.
- **Hayalet:** Aynı başlangıçtaki hazır akış, yarı saydam ikinci helikopter olarak gösterilir.

## 5. Kokpit görünümü

"Kokpit" kamerası, sağ pilot koltuğundan bakış verir. Ön cam çerçeveleri, orta dikme ve silecek görünür kalır.

Alt göstergeler:
- Çift devir saati (rotor/motor %; yeşil 294–324, sarı 324–339, kırmızı 339).
- Hava sürati, radar irtifa, dikey sürat, yapay ufuk ve kollektif konumu.
- DÜŞÜK RPM / YÜKSEK RPM uyarısı.

Kokpit bakışında gövde kabuğu gizlenir, böylece dışarı görülebilir.

## 6. Mürettebat profili (hazır akış)

- **Gelişmekte olan pilot:** 1.4 s tanıma/tepki süresi boyunca kumandaları arıza anındaki konumda tutar. Gelişmekte olan ikinci pilot +0.4 s ekler. Fleyırı daha alçakta, son kollektifi daha erken uygular.
- **Deneyimli pilot:** Son kollektifi 15 ft'e daha yakın uygular.
- **Temel ayar:** Ölçülen iyileşmeyle son kollektif zamanlaması TR 15 ft hedefine yaklaştırıldı (×0.82). 10 başlangıçlık hazır akış ortalamasında düşey temas 2.57 → 1.83 m/s.
- **Örnek, safe senaryosu:** gelişmekte 2.6, yetkin 2.1, deneyimli 1.6 m/s.

## 7. Ortam

- **Enerji hatları:** Arazi, dağ, meydan ve orman sahalarında. Kafes direkler, sarkan üç iletken, turuncu ikaz küreleri.
  - Tel çarpması gerçek çarpışma geometrisidir: rotor uçları, kızak ve dikey stabilize ile iletken arası ≤0.45 m.
  - Olay listesine ve değerlendirmeye düşer.
  - Hatlar varsayılan kuzey giriş koridorunun dışındadır.
- **Gece:** Yıldızlı gökyüzü, ay ışığı, helikopter iniş farı (spot ışık). Gün batımında da kısık far.
- **Yağmur:** Kameranın çevresinde rüzgârla eğilen yağmur çizgileri; görüş ve sis yağışla kısalır. Yalnız görseldir, uçuş fiziğini değiştirmez.
- **Çevrimdışı uygulama (PWA):** manifest, ikonlar (Çağlar Filo arması) ve servis çalışanı (önbellek). Artifact görüntüleyicisinde etkin olmaz; dosyalar kendi alan adında yayımlandığında kurulabilir uygulama olur.

## Ek geliştirmeler (aynı tur, kendi önerilerim)
- **Değerlendirmede kıyas:** Aynı başlangıçtaki hazır akışın yükseklik ve devir izi kesikli çizgiyle gösterilir (rehberli ve elle uçuşta).
- **Rapor indirme:** "Raporu indir (HTML)" ile tek dosyalık değerlendirme raporu indirilir. claude.ai içinde dosya kaydı, görüntüleyicinin indirme izniyle (downloads yeteneği) yapılır. "Oturumu indir" ve "Kitaplığı indir" de aynı yoldan çalışır; önceden görüntüleyicide çalışmıyordu.
- **Elle uçuşta eğitmen ipuçları:** Sahnenin üstünde TR otorotasyon sırasına göre kısa yönlendirmeler çıkar:
  - Kollektifi indir / sağ pedal.
  - Devir düşük / yüksek.
  - Sürat kazan.
  - Fleyır ≈100 ft.
  - İlk kollektif ≈15 ft.
  - Temas/rule.

  Yalnız tavsiye metnidir; kumandaya dokunmaz.

## Testler
- 177 test geçti: 168 eski test (biri gece seçeneği nedeniyle güncellendi) ve 9 yeni test (tests/v031.test.mjs).
- **Enerji modeli varsayılan ölçümü:** Rehberli + hazır 20 başlangıçta ortalama düşey temas 2.28 m/s, yer sürati 4.0 m/s, fleyır devir tepesi ≤341.

## Bilinen sınırlar
- Pal elemanı modeli (deneysel) ile hazır akış ve rehberli dallarda temas sert ve hızlıdır. Pilot yasası yeniden ayarlanmalı.
- Ağır (9500 lb) ve yüksek yoğunluk irtifalı (8000 ft) inişler serttir; eğilim fiziksel, büyüklüğü doğrulanmamış.
- Kokpit iç mekânı temsilidir.
- Elle uçuşta karar kartı ve T tahmini yoktur.
