# v0.26.0 — 19 Ekim 2026 · Fotoğraf/video ayrıntı geçişi

Yeni gönderilen üç JPEG referansı ve M.T. - Google Drive.mp4 (455 s, 640×360) örnek kareleri incelendi. IMG_2445(18batı).MOV (494 s, 1920×1080) erişildi; 30. saniye kokpit/zemin karesi incelendi. Videoların tamamı kare kare analiz edilmiş değildir; görüntülerden uçuş katsayısı çıkarılmadı.

- Görsel analog gösterge yüzleri, üst konsol anahtarları, silecekler ve kaporta tutamakları eklendi. Bunlar çalışan/kalibre kokpit enstrümanları değil, dış görünüm ayrıntısıdır. Ölçülü CAD değildir.
- Yeşil/normal cam malzemelerine geçirgenlik eklendi. CPU çizicide opak ve saydam yüzeyler ayrı sırada, derinlik denetimli alfa birleşimiyle çiziliyor.
- Yol çizgileri her iki çizicide en fazla 12 m aralıkla DEM'e oturtuldu; uzun yol parçalarının araziden kopması azaltıldı.
- Ek parçalar ilgili kokpit/motor gruplarında; mevcut parça hasarı ve geri sarma dönüşümleriyle taşınırlar. Hasar eşikleri ve uçuş hesabı değiştirilmedi.

Doğrulama: ana değişikliklerle 144/144 test; son CPU alfa/yol değişikliğinden sonra ilgili 6/6 görsel/geri sarma testi. Yerel CPU sahne görüntüsü üretildi ve incelendi. Bu tur etkileşimli tarayıcı/WebGL görsel kontrolü yapılmadı.

Sınırlar: FBX tabanlı model fotoğrafların birebir kopyası değildir; mevcut livery yüzeylerinde küçük kesişmeler kalabilir. Arazi DEM/OSM tabanlıdır, Google Earth fotogrametrisi değildir. Ayrıntılı dış yüzey topolojisi/UV ve gerçek doku çalışması sürüyor.
