# Fizik kontrol kaydı — v0.18.0 / energy-0.7

Üretim: `node scripts/physics-audit.mjs`. Sayılar bu deneysel modelin sonuçlarıdır; bağımsız AB-205 uçuş doğrulaması veya iniş güvenliği onayı değildir. Standart senaryo: S01, uygulamanın varsayılan koşulları.

| Dal | Süre s | Min rotor RPM | Temas düşey m/s | Temas yer kt |
|---|---:|---:|---:|---:|
| Zamanında | 18.50 | 293.8 | 10.26 | 17.3 |
| Gecikmiş | 18.08 | 266.3 | 8.64 | 23.7 |
| Muhafaza yok | 12.05 | 165.4 | 41.64 | 52.4 |
| Erken son kolektif | 17.03 | 234.6 | 18.31 | 22.0 |
| Geç son kolektif | 18.50 | 293.8 | 10.42 | 17.3 |

## Sayısal ve mantıksal kontroller

- 80 başlangıç/rüzgâr/ağırlık/hedef birleşimi: sonlu sonuç, temas sonrası duran süre/konum, sıralı sabit A/B hedefleri ve mevcut kararlarla tahmin edilen temasın hesaplanan temasla eşleşmesi. Hedefe erişim garantisi değildir.
- 0,02 → 0,01 s adım karşılaştırması: en büyük rotor farkı 0.0288 RPM; yükseklik farkı 0.0108 ft (temastan önce, en geç 8 s).
- Muhafaza edilmeyen dalda 0 örnekte pasif RPM artışı: yüksek kolektifte otomatik toparlanma yok. Türev net güç/atalet/açısal hız ile uyumlu; kayıp enerji wakeLoss içinde izleniyor. Bu, ölçülmüş AB-205 tork eğrisi değildir.
- Son kolektif sırasında 9 örnekte yukarı yönlü net ivme hesaplanıyor; alçalış azalması modelde mevcut. Başarılı iniş anlamına gelmez.
- 72 rejim bileşimi: tam güç kaybında VRS etiketi yok; güç/IAS/alçalış koşulları ve overspeed eşiği ayrı. VRS katsayıları ve 339 RPM uygulanabilirliği bağımsız uçuş verisiyle doğrulanmadı.

## Kaynak ve kapsam

- Türkçe operatör dokümanı §9.1.9, Şekil 5-1.2; Türkçe Uçuş Hareketleri (önceki inceleme: PDF 94–110). Kaynak hükümleri ile kontrol kazançları aynı şey değildir.
- FAA HFH Bölüm 11: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf
- FAA HFH Bölüm 3: kolektif, saykılık ve pedalın işlevleri; yerel kaynak PDF mevcut. Görseller şematiktir, gerçek kokpit kol açısı/mesafesi değildir.
- VRS düşük rotor devrinden ayrı tutulur. Bu sürümde otorotatif enerji aktarımı gerçek kolektif azalmasına bağlıdır. Kurulmuş otorotasyon ve kısmi güç, müdahalesiz yüksek kolektif dalından ayrıdır.
- Yeni düzeltme: saha yönlendirmesinde 80 KIAS sınırı rüzgâr eklenmiş yer hızına değil hava hız vektörüne uygulanır.
- Pedal/tork/yaw için deneysel moment modeli eklendi; baş sapması aynı fizik durumuyla WebGL/Canvas yönüne aktarılır. Tam 6-DOF kuyruk rotoru çözümü değildir. Saykılık gövde eksenlerine dönüştürülmüş mevcut disk eğimi kumandasıdır; bağlantı oranı modellenmemiştir.
- Hasar/kaza-kırım sınıflandırması yapılmadı. Tam pal elemanı, dinamik inflow, motor haritası ve yapısal temas modeli bekliyor.
