# Fizik kontrol kaydı — energy-1.4 (script başlığı v0.24.0 yazıyordu; bu kayıt energy-1.4 çıktısıdır)

Üretim: `node scripts/physics-audit.mjs`. Sayılar bu deneysel modelin sonuçlarıdır; bağımsız AB-205 uçuş doğrulaması veya iniş güvenliği onayı değildir. Standart senaryo: S01, uygulamanın varsayılan koşulları.

| Dal | Süre s | Min rotor RPM | Temas düşey m/s | Temas yer kt |
|---|---:|---:|---:|---:|
| Zamanında | 26.57 | 228.6 | 2.39 | 3.8 |
| Gecikmiş | 25.30 | 228.2 | 2.53 | 4.0 |
| Muhafaza yok | 14.57 | 178.6 | 41.19 | 60.4 |
| Erken son kolektif | 17.64 | 160.1 | 30.03 | 57.7 |
| Geç son kolektif | 25.67 | 280.6 | 4.59 | 2.6 |

## Sayısal ve mantıksal kontroller

- 80 başlangıç/rüzgâr/ağırlık/hedef birleşimi: sonlu sonuç, temas sonrası duran süre/konum, sıralı sabit 1/2 hedefleri ve mevcut kararlarla tahmin edilen temasın hesaplanan temasla eşleşmesi. Hedefe erişim garantisi değildir.
- Dış örnekleme 0,02 → 0,01 s karşılaştırması (ikisi de içeride en fazla 0,01 s adım kullanır; bağımsız yakınsama kanıtı değildir): en büyük rotor farkı 0.0000 RPM; yükseklik farkı 0.0000 ft (temastan önce, en geç 8 s).
- Muhafaza edilmeyen dalda 0 örnekte pasif RPM artışı: yüksek kolektifte otomatik toparlanma yok. Türev net güç/atalet/açısal hız ile uyumlu; kayıp enerji wakeLoss içinde izleniyor. Bu, ölçülmüş AB-205 tork eğrisi değildir.
- Son kolektif sırasında 53 örnekte yukarı yönlü net ivme hesaplanıyor; alçalış azalması modelde mevcut. Başarılı iniş anlamına gelmez.
- 72 rejim bileşimi: tam güç kaybında VRS etiketi yok; güç/IAS/alçalış koşulları ve overspeed eşiği ayrı. VRS katsayıları ve 339 RPM uygulanabilirliği bağımsız uçuş verisiyle doğrulanmadı.

## Kaynak ve kapsam

- Türkçe operatör dokümanı §9.1.9, Şekil 5-1.2; Türkçe Uçuş Hareketleri (önceki inceleme: PDF 94–110). Kaynak hükümleri ile kontrol kazançları aynı şey değildir.
- FAA HFH Bölüm 11: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf
- FAA HFH Bölüm 3: kolektif, saykılık ve pedalın işlevleri; yerel kaynak PDF mevcut. Görseller şematiktir, gerçek kokpit kol açısı/mesafesi değildir.
- VRS düşük rotor devrinden ayrı tutulur. Bu sürümde otorotatif enerji aktarımı gerçek kolektif azalmasına bağlıdır. Kurulmuş otorotasyon ve kısmi güç, müdahalesiz yüksek kolektif dalından ayrıdır.
- Yeni düzeltme: saha yönlendirmesinde 80 KIAS sınırı rüzgâr eklenmiş yer hızına değil hava hız vektörüne uygulanır.
- Pedal/tork/yaw için deneysel moment modeli eklendi; baş sapması aynı fizik durumuyla WebGL/Canvas yönüne aktarılır. Tam 6-DOF kuyruk rotoru çözümü değildir. Saykılık gövde eksenlerine dönüştürülmüş mevcut disk eğimi kumandasıdır; bağlantı oranı modellenmemiştir.
- Benzetilmiş hasar taraması eklendi; resmi kaza-kırım veya ölçülmüş AB-205 kapasitesi değildir. Dinamik inflow hafızası indirgenmiş ve katsayıları varsayımsaldır. Tam pal elemanı/motor haritası yok.
