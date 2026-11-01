# Fizik kontrol kaydı — v0.22.0 / energy-1.1

Üretim: `node scripts/physics-audit.mjs`. Sayılar bu deneysel modelin sonuçlarıdır; bağımsız AB-205 uçuş doğrulaması veya iniş güvenliği onayı değildir. Standart senaryo: S01, uygulamanın varsayılan koşulları.

| Dal | Süre s | Min rotor RPM | Temas düşey m/s | Temas yer kt |
|---|---:|---:|---:|---:|
| Zamanında | 26.77 | 246.4 | 1.68 | 25.9 |
| Gecikmiş | 25.23 | 240.8 | 2.50 | 16.3 |
| Muhafaza yok | 20.43 | 166.0 | 41.67 | 55.4 |
| Erken son kolektif | 23.05 | 127.9 | 32.72 | 58.4 |
| Geç son kolektif | 25.86 | 282.0 | 1.47 | 22.9 |

## Sayısal ve mantıksal kontroller

- 80 başlangıç/rüzgâr/ağırlık/hedef birleşimi: sonlu sonuç, temas sonrası duran süre/konum, sıralı sabit A/B hedefleri ve mevcut kararlarla tahmin edilen temasın hesaplanan temasla eşleşmesi. Hedefe erişim garantisi değildir.
- 0,02 → 0,01 s adım karşılaştırması: en büyük rotor farkı 0.0520 RPM; yükseklik farkı 0.0161 ft (temastan önce, en geç 8 s).
- Muhafaza edilmeyen dalda 0 örnekte pasif RPM artışı: yüksek kolektifte otomatik toparlanma yok. Türev net güç/atalet/açısal hız ile uyumlu; kayıp enerji wakeLoss içinde izleniyor. Bu, ölçülmüş AB-205 tork eğrisi değildir.
- Son kolektif sırasında 129 örnekte yukarı yönlü net ivme hesaplanıyor; alçalış azalması modelde mevcut. Başarılı iniş anlamına gelmez.
- 72 rejim bileşimi: tam güç kaybında VRS etiketi yok; güç/IAS/alçalış koşulları ve overspeed eşiği ayrı. VRS katsayıları ve 339 RPM uygulanabilirliği bağımsız uçuş verisiyle doğrulanmadı.

## Kaynak ve kapsam

- Türkçe operatör dokümanı §9.1.9, Şekil 5-1.2; Türkçe Uçuş Hareketleri (önceki inceleme: PDF 94–110). Kaynak hükümleri ile kontrol kazançları aynı şey değildir.
- FAA HFH Bölüm 11: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf
- FAA HFH Bölüm 3: kolektif, saykılık ve pedalın işlevleri; yerel kaynak PDF mevcut. Görseller şematiktir, gerçek kokpit kol açısı/mesafesi değildir.
- VRS düşük rotor devrinden ayrı tutulur. Bu sürümde otorotatif enerji aktarımı gerçek kolektif azalmasına bağlıdır. Kurulmuş otorotasyon ve kısmi güç, müdahalesiz yüksek kolektif dalından ayrıdır.
- Yeni düzeltme: saha yönlendirmesinde 80 KIAS sınırı rüzgâr eklenmiş yer hızına değil hava hız vektörüne uygulanır.
- Pedal/tork/yaw için deneysel moment modeli eklendi; baş sapması aynı fizik durumuyla WebGL/Canvas yönüne aktarılır. Tam 6-DOF kuyruk rotoru çözümü değildir. Saykılık gövde eksenlerine dönüştürülmüş mevcut disk eğimi kumandasıdır; bağlantı oranı modellenmemiştir.
- Benzetilmiş hasar taraması eklendi; resmi kaza-kırım veya ölçülmüş AB-205 kapasitesi değildir. Dinamik inflow hafızası indirgenmiş ve katsayıları varsayımsaldır. Tam pal elemanı/motor haritası yok.
