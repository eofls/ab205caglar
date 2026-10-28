# Otomatik kontroller
GitHub Actions, her push ve pull request için `node tests/ci.mjs` çalıştırır. Actions sayfasındaki Run workflow düğmesiyle elle de başlatılabilir. Node.js 24 kullanılır; ek paket kurulumu gerekmez.

## Kapsam
- JavaScript / MJS sözdizimi
- Regresyon: IAS/TAS/rüzgâr, başlangıç RPM, ağırlık önbelleği, kayıt ve offline kaynaklar
- Sentetik yapısal iş-enerji ve ölçüm karşılaştırıcısı kontrolleri
- Otorotasyon referans eğrisi tutarlılığı (bağımsız uçuş doğrulaması değildir)
- H/V seçimleri, hazır/kararlı senaryo akışları, geri sarma ve kayıt geri yükleme
- Manevra ve emercensi programlarında sonlu sayılar ve artan zaman

Eski sonuç JSON dosyaları çalıştırmadan önce silinir. İşlem hataları, zaman aşımı, eksik rapor veya beklenmeyen başarısız test kırmızı sonuç verir. Diğer testler rapor toplamak için devam eder.

## Bilinen eksik
`Ground stopping responds to slope` kontrolü, mevcut model eğimi hesaba katmadığı için başarısızdır. Yalnızca bu isimdeki kontrol açık bir uyarı olarak ayrılır; geçmiş veya yeni diğer hatalar gizlenmez. Bu, eğim fiziğinin doğrulandığı anlamına gelmez. Model düzeltildiğinde uyarı kalkar; ardından bu istisna da kaldırılmalıdır.

## Sonuçlar
Actions çalışmasının Summary bölümünde özet; Artifacts altında `ab205-test-results` içinde yeni JSON sonuçları ve loglar bulunur. Raporlar 14 gün saklanır. Yerelde:
```bash
node tests/ci.mjs
```
Sonuçlar `ci-results/` dizinine yazılır. Test çıktıları uygulama kodu olarak commit edilmemelidir.

Bu akış görsel tarayıcı/WebGL testi, gerçek uçuş doğrulaması veya otomatik site yayını yapmaz. Başarısız testlerin birleştirmeyi zorunlu olarak engellemesi ayrıca GitHub branch rules ayarı gerektirir.
