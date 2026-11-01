# Fizik kontrol kaydı — v0.17.0 / energy-0.6

Üretim: `node scripts/physics-audit.mjs`. Sayılar bu deneysel modelin sonuçlarıdır; bağımsız AB-205 uçuş doğrulaması veya iniş güvenliği onayı değildir. Standart senaryo: S01, uygulamanın varsayılan koşulları.

| Dal | Süre s | Min rotor RPM | Temas düşey m/s | Temas yer kt |
|---|---:|---:|---:|---:|
| Zamanında | 20.37 | 298.1 | 10.60 | 12.1 |
| Gecikmiş | 20.46 | 293.7 | 10.44 | 13.2 |
| Muhafaza yok | 22.39 | 291.4 | 11.02 | 10.1 |
| Erken son kolektif | 22.61 | 155.7 | 24.94 | 6.6 |
| Geç son kolektif | 20.36 | 298.1 | 11.09 | 12.2 |

## Sayısal ve mantıksal kontroller

- 80 başlangıç/rüzgâr/ağırlık/hedef birleşimi: sonlu sonuç, temas sonrası duran süre/konum, sıralı sabit A/B hedefleri ve mevcut kararlarla tahmin edilen temasın hesaplanan temasla eşleşmesi. Hedefe erişim garantisi değildir.
- 0,02 → 0,01 s adım karşılaştırması: en büyük rotor farkı 0.0763 RPM; yükseklik farkı 0.0147 ft (temastan önce, en geç 8 s).
- Muhafaza edilmeyen dalda 66 örnekte pozitif net güçle pasif RPM artışı var. Rotor türevi net güç/atalet/açısal hız ile uyumlu; artış silinmedi veya başlangıç RPM değerine zorlanmadı. Toparlanmanın gerçek büyüklüğü doğrulanmadı.
- Son kolektif sırasında 14 örnekte yukarı yönlü net ivme hesaplanıyor; alçalış azalması modelde mevcut. Başarılı iniş anlamına gelmez.
- 72 rejim bileşimi: tam güç kaybında VRS etiketi yok; güç/IAS/alçalış koşulları ve overspeed eşiği ayrı. VRS katsayıları ve 339 RPM uygulanabilirliği bağımsız uçuş verisiyle doğrulanmadı.

## Kaynak ve kapsam

- Türkçe operatör dokümanı §9.1.9, Şekil 5-1.2; Türkçe Uçuş Hareketleri (önceki inceleme: PDF 94–110). Kaynak hükümleri ile kontrol kazançları aynı şey değildir.
- FAA HFH Bölüm 11: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf
- FAA HFH Bölüm 3: kolektif, saykılık ve pedalın işlevleri; yerel kaynak PDF mevcut. Görseller şematiktir, gerçek kokpit kol açısı/mesafesi değildir.
- VRS düşük rotor devrinden ayrı tutulur. Tam motor kaybında net aerodinamik iş rotor devrini artırabilir; bunu şartlardan bağımsız yasaklamak doğru bir doğrulama değildir.
- Yeni düzeltme: saha yönlendirmesinde 80 KIAS sınırı rüzgâr eklenmiş yer hızına değil hava hız vektörüne uygulanır.
- Pedal/tork/yaw modeli henüz yok; pedal resmi yanında “hesaplanmıyor” gösterilir. Saykılık gövde eksenlerine dönüştürülmüş mevcut disk eğimi kumandasıdır; bağlantı oranı modellenmemiştir.
- Hasar/kaza-kırım sınıflandırması yapılmadı. Tam pal elemanı, dinamik inflow, motor haritası ve yapısal temas modeli bekliyor.
