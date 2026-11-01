# energy-1.4 — Hazır akışta sert iniş incelemesi (20 Ekim 2026)

**Durum:** Deneysel. Gerçek AB-205/UH-1H uçuş verisiyle doğrulanmış değildir. Tarayıcıda görsel kontrol yapılmadı; 153 otomatik test ve `scripts/physics-audit.mjs` (80 koşul, 72 rejim) geçti.

## Sorun
v0.27 hazır akışı (izleme modu) denenen 9 başlangıcın hepsinde sert temasla bitiyordu: düşey temas hızı 5,2–12,6 m/s (ortalama 7,62), temas anında rotor 196–245 RPM. S01 (400 ft / 60 KIAS) örneği 5,93 m/s. Sorun S01'e özel değildi.

## Bulgu (9 başlangıç: 400/60, 300/70, 200/60, 500/80, 150/50, 600/60, 250/40, 350/75, 100/60)
Ortak çekirdekte dört etken ayrı ayrı ve birlikte ölçüldü:

| Değişiklik | Dosya | Neden |
|---|---|---|
| A. `anticipateFlare` ("erken frenleme") adayı kaldırıldı | `predictive-pilot.js` | Öngörülü pilot flare'i ~148 ft altında erken başlatıyordu. En büyük tek etken: yalnız bunu çıkarmak ortalamayı yaklaşık 6,8'den 2,7 m/s'ye indirdi (üs 1,5 ile ölçüldü). |
| B. Hedef işaretine yönlendirme yalnız flare/yastıklama evresinde uygulanır | `flight-controls.js` | Yönlendirme sürati "mesafe ÷ yere kalan süre" ile hesaplıyor; alçalış başlarken bu süre uzun göründüğü için yüksekteyken hızı düşürüyor, ileri kinetik rezerv harcanıyordu. Karar modundaki dal zaten aynı şeyi yapıyor. |
| C. Flare yavaşlama yetkisi, kalan sürate göre | `adaptive-pilot.js` | Flare yetkisi alçalma "hedef eğrinin" altına inince 1,2–2 m/s²'ye düşüyor, yerde ~33 kt ileri sürat kalıyordu (Türkçe kaynak: 15 ft'te sıfıra yakın ileri sürat). Yetki artık `max(eski, (sürat−3)/kalan flare süresi)`, 5 m/s² üst sınırlı. |
| D. Profil gücünün kollektife bağlı büyümesi | `flight-dynamics.js` | Eski `.4+.6·c²` biçimi kollektif 2,1'de profil kaybını 4,4 kat yapıyordu; yastıklamada rotor devri çok düşüyordu. Yeni biçim `.4+.294·(c/.7)^n`, `n = 1,25` (`PARAMETERS.profilePowerCollectiveExponent`). c = 0,7'de değer eskisiyle aynı (kararlı otorotasyon alçalışı kılavuz grafiğine oturur). `trimPower` aynı fonksiyonla tutarlı tutuldu. |

**Önemli:** D bir mühendislik varsayımıdır, AB-205 verisi değildir. Üs 1,0 → daha yumuşak (ort. 1,82 m/s), 1,25 → ort. 1,96, 1,5 → ort. 2,74 m/s. Gerçek AB-205 rotor verisi gelince yeniden kalibre edilmeli.

## Sonuç (hazır akış, üs 1,25)
| Başlangıç | Eski düşey (m/s) | Yeni düşey (m/s) | Yeni yatay (kt) | Yeni rotor (RPM) |
|---|---|---|---|---|
| 400/60 | 5,9 | 2,8 | 3 | 227 |
| 300/70 | 6,0 | 2,8 | 4 | 229 |
| 200/60 | 8,0 | 1,7 | 3 | 232 |
| 500/80 | 5,2 | 2,0 | 5 | 230 |
| 150/50 | 9,7 | 0,5 | 9 | 247 |
| 600/60 | 7,6 | 2,4 | 4 | 229 |
| 250/40 | 6,1 | 0,9 | 44 | 242 |
| 350/75 | 7,5 | 2,4 | 4 | 229 |
| 100/60 | 12,6 | 2,2 | 5 | 228 |
| **Ortalama** | **7,62** | **1,96** | | |

Karar modu, S01, onaylı referans kararlar, tam güç kaybı: düşey 2,36 → 2,39 m/s, temas yatay hızı ~33 kt → ~4 kt. Kısmi güç: 0,74 → 0,58 m/s.

## Açık kalanlar
- **250 ft / 40 KIAS** başlangıcında temasta 44 kt yer sürati kalıyor: alçalma 2700 ft/dk'ya çıkıyor, yastıklama flare'den önce başlıyor. Bu başlangıç H-V diyagramının kaçınılacak bölgesine yakın olabilir; ayrı incelenmeli.
- Temas anında rotor hâlâ ~227–247 RPM (nominal 324'ün ~%70–75'i). Gerçek AB-205 yastıklamasında devir kaybının daha az olması beklenir; bu D varsayımına ve rotor ataletine (2711 kg·m², başka hava aracından) bağlı.
- Yoğunluk ve brüt ağırlığın alçalışa etkisi modelde korunuyor (kullanıcı kararı); el kitabındaki "esasen etkilenmez" notu uygulanmadı.
- Test değişikliği: `tests/s01-adaptive.test.mjs` — kısmi güçte fleyırsız inişte artık düşey hız artışı beklenmiyor (0,58 = 0,58 m/s); cezası yatay enerjide (≈1,29 MJ'e karşı 1,9 kJ) sürüyor. Tam güçte düşey ceza testi korunuyor.
- Arayüz, sahne ve kayıt şeması değiştirilmedi.
