# AB-205 Senaryo Laboratuvarı — yapay zekâ asistanları için çalışma notu

Bu depo hem Claude hem ChatGPT/Codex tarafından düzenlenir. Tek doğru kaynak `main` dalıdır. Çalışmaya başlamadan önce `main`'i çek, `docs/WORKING-AGREEMENT.md` dosyasını oku.

## Kullanıcıya karşı kurallar
- Türkçe yaz. Hitapta "komutanım" / "emredersin" kullanma; düz ve sade konuş.
- Uygulamada ve anlatımda nirengi (landmark) adları gösterilmez, söylenmez.
- Arayüzde "saykılık" yazılır. Sonuçlar gerçek uçuş onayı ya da sertifikalı limit gibi sunulmaz.

## Yapı
- Kök klasör uygulamanın kendisidir (statik site, ES modülleri, Three.js r170). `index.html` kökte; `python3 -m http.server` ile sunulur.
- Program uçuşları (manevra / emercensi hazır akışı): `program-flight.js`, `maneuver-catalog.js`, `emergency-catalog.js`.
- Gerçek uçuş sahaları: `real-area.js` + `assets/terrain/*-real.js` (Tepeler = mountain ±6,5 km, Gölbaşı = terrain ±4,5 km). Yerel metre çerçevesi: x doğu, z güney. Saha yarıçapı `environment.js` (REAL_GROUND), `area-scene.js`, `start-map.js` ve `program-flight.js` (saha arama sınırı) içinde birlikte değişir; veri paketi `claude/tools/build_real.py` ile `RI` / `NI` ortam değişkenleriyle üretilir.
- Telefon modu: `device-profile.js` (`LITE`). Telefonda `*-lite` model ve dokular kullanılır; yeni büyük doku eklerken lite karşılığını da üret. `?lite=0/1` zorlar.
- Ortak hız / rüzgâr / atmosfer tanımları: `flight-reference.js`.
- `sw.js` içindeki `CACHE` adı ve `flight-reference.js` içindeki `APP_VERSION` her sürümde birlikte artırılır; yeni dosya eklenirse `sw.js` SHELL listesine de eklenir.

## Kararlar, yardım, görsellik (v0.43)
- Emercensi soruları `emergency-catalog.js` sonundaki `Q` tablosunda (belirti, doğru ilk eylem, iki makul hata ve sonuçları). Seçenek sırası `mixOptions` / `mix` ile karar başına sabit ama karışık; doğru seçeneği ilk sıraya koyma. Her seçeneğin uçuştaki sonucu farklı olmalı (`claude/tests/v043.test.mjs`).
- Arayüzdeki “?” açıklamaları `ui-help.js` içindeki `HELP` listesinde (seçici → paragraflar); yeni bölüm eklenirse oraya da açıklama yaz.
- Zemin malzemesi `environment.js` `enhanceSurface` (ayrıntı dokusu, kabartı, bulut gölgesi; ortak uniform `SURFACE_U`). Telefonda (`LITE`) kabartı kapalı.

## Kare süresi ve görsellik (v0.44)
- Orman `environment.js` `createForest`: ≈250 m hücreler, her hücrede yakın / orta / uzak taç geometrisi (aynı örnek matrisleri); `group.userData.updateLOD(kamera)` her karede `scene-view.js` `animateEnvironment` içinden çağrılır. Ağaçlar gölge haritasına girmez; gölgeleri güneşe göre yatırılmış yumuşak elips (`placeShade`, `setSun`).
- `scene-view.js` `precompile`: ısıtma çiziminde her geometriden tek üçgen çizilir; paylaşılan geometri bir kez kaydedilip geri yüklenir (aksi halde kokpit panosu ve ağaçlar kırpık kalır).
- Uydu görüntüleri önceden keskinleştirilir: `claude/tools/bake_sharpen.py` → `assets/terrain/*-s2k.jpg` (kaynak `*-s2.jpg` değişmez). Çalışma anında görüntü işleme ekleme: açılış telefonda uzar.
- Zemin gölgelendiricisinde (`enhanceSurface`, `canopy:true`) uydu görüntüsündeki koyu ağaç tepeleri gölgeli toprağa çevrilir (3B ağaçların altı yeşil halı gibi görünmez); kuzey yamaçlar koyu / yeşil, güney yamaçlar kuru.
- Küçük dikdörtgen evlerde kiremit kırma çatı: `terrain-detail.js` `hipRoof`.
- Görsel kontrol: sahne tam pencere ekran görüntüsü için scratchpad'deki `vshot.py` benzeri bir betik (`?lite=0`, `#scene-host` sabit tam ekran) kullan; yazılım WebGL'de kare süresini `renderer.render` + `readPixels` ile ölç.

## Testler
- `node tests/ci.mjs` — ChatGPT/Codex test seti (sözdizimi, regresyon, otorotasyon tezgâhı, programlar). Sonuçları `ci-results/` altına yazar; `tests/*-results.json` dosyalarını commit etme.
- `npm run test:claude` — Claude test seti (`claude/tests`, 200 test: manevralar, emercensiler, sahalar, kokpit, sahne).
- `claude/sweeps/k31.mjs` (manevralar), `k32.mjs` (emercensiler × saha), `k33.mjs` (riskli kararlar) — `claude/sweeps` içinden `node k31.mjs` ile çalışır; sonuç tablosu verir, değişiklik öncesi/sonrası karşılaştırmak için kullan.
- Tarayıcı açılış kontrolü: `claude/tools/tarayici-acilis.py` (Playwright, telefon + masaüstü; yerel sunucu 8801 portunda).

## İş bölümü önerisi
- Codex: geniş kod düzenlemeleri, test altyapısı, belge ve kaynak tutarlılığı.
- Claude: tarayıcıda görsel / telefon / kare hızı kontrolü, manevra ve saha davranışı, canlı yayın.
- Her iş ayrı dal + PR. Aynı anda aynı dosyada iki asistan çalışmaz. PR açıklamasına değişen dosyaları, çalıştırılan testleri ve kalan eksikleri yaz.

## Geçmiş
Eski sürüm notları ve incelemeler: `docs/claude-gecmis/` (sürüm geçmişi: `SURUM-GECMISI.md`). Veri üretim araçları (arazi paketleri, model dönüştürme): `claude/tools/`.
