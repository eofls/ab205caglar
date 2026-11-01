# energy-1.5 (Tur 1–4)
- RPM ikaz ışığı (üst orta, yalnız rotor <294 veya >339 RPM).
- Procedural UH-1H sesi (heli-audio.js): pal vuruşu 2×Nr/60, kuyruk rotoru, türbin, hava gürültüsü, temas sesi, düşük/yüksek RPM alarmı; "Ses" düğmesi.
- Meydan: baş 065° (06), pist numaraları 06/24.
- Helikopter: düz ön cam panelleri, geniş orta dikme, yan cam üst kenarları sınırlı ve gövde kavisine yatık.
- Hasar: crosstube, cam, ana rotor palleri eklendi; sönümlü animasyon; parça bazlı değerlendirme tablosu.
- Hazır akış: yüksek yer süratinde flare tutumu korunur (250 ft/40 KIAS: 44 kt → 16 kt temas).
- Sahalar: mountain/water/forest renkleri (yalnız görsel).
Açık: temas anında rotor devri ~%70–75 (atalet varsayımı doğrulanmadı).

## Tur 5 değişiklikleri
- Rehber hız sınırı: Math.max(63,Math.min(70,ias)); uzak hedef/3. saha seçiminde yavaşlama sağlandı.
- Sağa sapma kök nedeni: eksen bazlı ivme/eğim kıstı yönü döndürüyordu; vektör ölçekleme ile düzeltildi. Meydanda pist yönüne kilit (crab/heading snap).
- Senaryo sırasında yeni saha seçimi: karar anı eklenir; sağ tık veya "hayır" ile kaldırılır, akış devam eder.
- Hasar değerlendirmesinden onarım/parça değişimi metni kaldırıldı.
- Ses: motor sesi azaltıldı, pal sesi öne çıkarıldı.
- T noktası üzerine gelince bilgi; H-V diyagramı arayüzde büyütme (lightbox).
- Alçak irtifa/yüksek hız: yumuşak flare adayı ve uzun ufuk ile kurtarma.
- Model: çatı camı geri eklendi, ön cam düz, yan camlar taşmıyor, orta direk.
- Açık: rotor devri kalibrasyonu, gerçek ses kayıtları, hava alanı detayları, YZ karar günlüğü.
