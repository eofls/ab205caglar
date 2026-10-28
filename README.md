# AB-205 Senaryo Laboratuvarı — v0.40.0-validation

Önce `docs/VALIDATION-REPORT.md` dosyasını okuyun. Bu bir doğrulama altyapısı/düzeltme sürümüdür; gerçek uçuş veya yapısal doğrulama onayı değildir. Canlı siteye otomatik yayımlanmadı.

## Çalıştırma

Statik web sunucusunda bu klasörü sunun (index.html kökte). ES modülleri nedeniyle file:// ile açmayın. Yerel örnek:

```bash
python -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. Model, doku ve arazi dosyaları pakettedir.

## Testler

Proje kökünde modern Node.js ile:

```bash
node tests/regression.mjs
node tests/autorotation-bench.mjs
node tests/structural-bench.mjs
node tests/recording-test.mjs
node tests/core.mjs /tam/yol/proje
node tests/programs.mjs /tam/yol/proje
```

core setinde zemin eğimi kontrolü hâlâ başarısızdır; bilinen model sınırlaması. JSON sonuçları `tests` klasörüne yazılır. Eski sürümle karşılaştırmak için ilk argüman olarak o sürümün mutlak klasörünü verin. Tarayıcı testleri bu ortamda çalıştırılamadı.

## Ölçüm karşılaştırması

```bash
node tests/export-trace.mjs oturum.json model.csv
node tests/compare-recordings.mjs olculmus.csv model.csv docs/comparison-template.json sonuc.json
```

Şablonları gerçek kaynak ve konfigürasyonla doldurun. Ölçülmüş kumanda açısı ile uygulamanın boyutsuz kollektif alanını eşitlemeyin. Veri yokken örnek değer uydurmayın. Tolerans yoksa karşılaştırıcı başarı onayı vermez.
