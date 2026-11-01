# AB-205 Senaryo Laboratuvarı — yapay zekâ asistanları için çalışma notu

Bu depo hem Claude hem ChatGPT/Codex tarafından düzenlenir. Tek doğru kaynak `main` dalıdır. Çalışmaya başlamadan önce `main`'i çek, `docs/WORKING-AGREEMENT.md` dosyasını oku.

## Kullanıcıya karşı kurallar
- Türkçe yaz. Hitapta "komutanım" / "emredersin" kullanma; düz ve sade konuş.
- Uygulamada ve anlatımda nirengi (landmark) adları gösterilmez, söylenmez.
- Arayüzde "saykılık" yazılır. Sonuçlar gerçek uçuş onayı ya da sertifikalı limit gibi sunulmaz.

## Yapı
- Kök klasör uygulamanın kendisidir (statik site, ES modülleri, Three.js r170). `index.html` kökte; `python3 -m http.server` ile sunulur.
- Program uçuşları (manevra / emercensi hazır akışı): `program-flight.js`, `maneuver-catalog.js`, `emergency-catalog.js`.
- Gerçek uçuş sahaları: `real-area.js` + `assets/terrain/*-real.js` (Tepeler = mountain, Gölbaşı = terrain). Yerel metre çerçevesi: x doğu, z güney.
- Telefon modu: `device-profile.js` (`LITE`). Telefonda `*-lite` model ve dokular kullanılır; yeni büyük doku eklerken lite karşılığını da üret. `?lite=0/1` zorlar.
- Ortak hız / rüzgâr / atmosfer tanımları: `flight-reference.js`.
- `sw.js` içindeki `CACHE` adı ve `flight-reference.js` içindeki `APP_VERSION` her sürümde birlikte artırılır; yeni dosya eklenirse `sw.js` SHELL listesine de eklenir.

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
