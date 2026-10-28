# Ortak geliştirme düzeni

Kodun güncel kaynağı `eofls/ab205caglar` deposudur. Claude ve Codex sohbetleri otomatik paylaşılmaz. Her çalışma öncesi main dalı, açık issue'lar ve bu dosya okunur.

1. Yapılacak işi issue ile ilişkilendir; ayrı bir dal aç.
2. İlgisiz fizik, arayüz veya kaynak değişikliklerini aynı işe katma.
3. Commit mesajında sorunu ve değişikliği belirt; test kapsamını PR açıklamasına yaz.
4. Üç zorunlu kontrolün tamamını bekle. Yeşil test gerçek uçuş onayı değildir.
5. Önizleme ve karar raporunu incele. Aynı koşullarda neden farklı sonuç oluştuğunu açıkla.
6. PR birleştirildikten sonra canlı yayın için ayrı onay gerekir.

Türkçe ve İngilizce kaynak çatışmasında kullanıcının tercihi Türkçe metindir; belge konfigürasyonları karıştırılmaz. Arayüzde “saykılık” kullanılır. Pilot kararlarına gizli otomatik müdahale eklenmez. Eğitim benzetimi sonuçları gerçek AB-205 hasar olasılığı veya sertifikalı limit gibi sunulmaz.

## Sürüm durumu
Bu kurulum mevcut uçuş fiziği ve ürün arayüzünü değiştirmez. S01 karar karşılaştırması geliştirme ölçümüdür. Zemin eğiminin duruş mesafesine etkisi hâlâ eksiktir ve testte görünür uyarı olarak kalır. Program uçuşu ve motor arızası dinamiği farklı hesap yolları kullanır. Gerçek uçuş veri setiyle bağımsız doğrulama tamamlanmadı.

## Devretme notu
İş bittiğinde ilgili issue/PR'a şu bilgileri yaz: değişen dosyalar, test çalışması bağlantısı, kalan eksikler, sonraki adım. Çalışma sırasında oluşan henüz commit edilmemiş değişiklikler diğer asistana görünmez.
