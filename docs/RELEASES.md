# Önizleme, koruma ve onaylı yayın

## Bir defalık yönetici ayarları

Bu dosyanın varlığı ayarların açıldığı anlamına gelmez. GitHub bağlantısı yönetim API'lerini değiştiremediği için aşağıdaki iki ayar depo sahibi tarafından yapılmalıdır:

1. https://github.com/eofls/ab205caglar/settings/pages → Build and deployment → Source: **GitHub Actions**.
2. https://github.com/eofls/ab205caglar/settings/rules → New ruleset → Import a ruleset → `docs/main-ruleset.json` dosyasını içe aktar. Enforcement **Active** olmalı. Üç kontrol adını koru.

Koruma etkinleşince main'e doğrudan yazmak yerine PR kullanılacak. Tek geliştiricili çalışma için zorunlu insan onayı sayısı 0; testler ve görüşme çözümü zorunludur. Yönetici ayrıca insan onayı ekleyebilir.

## Otomatik önizleme
`AB-205 automatic tests` başarılı olduğunda `AB-205 previews and approved releases` test edilen site paketini indirir. Paket kodunu çalıştırmaz; güvenilir main sürümündeki yayıncı kullanılır. Fork önizlemeleri desteklenmez.

Pages açıkken bağlantılar:
- Sürüm dizini: https://eofls.github.io/ab205caglar/
- Önizleme: `https://eofls.github.io/ab205caglar/previews/<tam-commit-sha>/`
- Karar raporu: aynı önizleme adresinin sonuna `reports/`.
- Onaylı uygulama: https://eofls.github.io/ab205caglar/live/

Son 10 önizleme saklanır. Her önizlemenin `build-info.json` dosyası test edilen commit'i içerir. PR testleri geçici merge commit'i üzerinde çalışabilir; önizleme dizini PR head SHA'sını kullanır. Bunlar farklı olabilir.

Pages henüz etkin değilse yayın adımı başarısız olabilir; test raporları ve site-preview paketi Actions Artifacts altında indirilebilir kalır. Pages açıldıktan sonra başarısız yayın işini yeniden çalıştır. Eski ChatGPT Sites adresi bu sistemden otomatik değişmez.

## Canlı sürümün onaylanması
1. main dalındaki başarılı test çalışmasını seç ve önizlemesini incele.
2. Çalışma adresinin sonundaki sayıyı (run ID) kopyala.
3. Actions → **AB-205 previews and approved releases** → Run workflow → main → source_run alanına bu sayıyı yaz.
4. Yayıncı yalnızca başarılı main çalışmasını ve main geçmişindeki commit'i kabul eder; o paketi `live/` olarak yayımlar.

Bu elle başlatma yayın onayıdır. main'e merge tek başına canlı sürümü güncellemez. Önceki başarılı main çalışmasının ID'si ile aynı işlem geri dönüş sağlar. Kaynak artifact'ı 14 gün sonra silinmişse o sürüm için yeniden test ve paket üretmek gerekir.

## Kontrollerin sınırı
Chromium/SwiftShader WebGL2 testi gerçek modelin yüklenmesini ve çizim yapılmasını kontrol eder; gerçek kullanıcı GPU'sunun FPS veya görsel kalite garantisi değildir. Diyagram, oynatım, tam ekran, karar tıklaması ve WebGL olmayan durumda temel kullanım test edilir. Karar raporları simülasyon çıktısıdır, bağımsız uçuş doğrulaması değildir.
