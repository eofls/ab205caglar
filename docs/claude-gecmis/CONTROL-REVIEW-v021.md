# v0.21.0 — karar, kumanda ve sonuç incelemesi

16 Ekim 2026. Ortak motor energy-1.0, kayıt şeması 11. S01 geliştirme vakasıdır; senaryo adına göre başarılı/başarısız iniş atanmaz.

## Bulunan yazılım sorunları

- “Alçalışa göre uygula” sabit 4.8 m kapısına ağırlık veriyordu; kollektifin hız sınırı ve yüksek alçalışta yol ihtiyacı zamanlamada kullanılmıyordu.
- “Son ana ertele” ayrı son uygulama sorusu olmadan 1.2 m'de otomatik komut veriyordu. Entegrasyonun kollektif hareket hızı sınırlı olduğundan, komut verilse bile temasa kadar çok az kol hareketi görülebiliyordu.
- Sonuç satırları temas kaydı yerine yerleşme sonundaki örneği okuyordu; yatay/düşey sürat sıfır görünebiliyordu. Minimum rotor, yerdeki devir sönümünü de içeriyordu.

## Hareket ve karar değişiklikleri

- Dinamik son kollektif zamanlaması: kollektif hareket mesafesi/hız sınırı, tepki gecikmesi, düşey hız ve RPM ile hesaplanan yaklaşık durdurma ihtiyacı. Talep edilen yukarı ivme kalan mesafeden türetilir. Kinetik/rotor enerji hesabı değiştirilmeden aynı kuvvet denklemlerine uygulanır.
- Erteleme dalı: normal talep bölgesinin geçilmesinden sonra ve temas yaklaşınca tek `finalPull` sorusu. “Şimdi” kollektifi entegre tepki süresiyle artırır; “uygulamadan devam” mevcut kollektifi korur. Karar için simülasyon durur. Fiziksel zaman yetmiyorsa bir karar başarı yaratmaz.
- Rehberli akışta ilk son kollektif kararı verilmeden seçilmiş gibi otomatik yumuşatma yapılmaz; yer tesirinde havırın kaynaklı ayrı hareket sırası korunur.
- Saykılık: önce geri saykılıkla fleyır tercihi; uygun yaklaşmada koordineli ufkiyet / şimdi ufkiyet / mevcut saykılık konumunu tut kararı. Ufkiyet disk hedefini nötre getirir; gerçek kumanda hız sınırlayıcısı, kuvvet, rotor enerjisi, gövde tutumu ve 3B görünüm aynı durumu kullanır. Yerde geri saykılık frenleme talebi eklenmedi.
- Koordineli dal dışında “saykılığı tut” seçimi gizli ufkiyet komutuyla değiştirilmez. Eski VRS talebi son kollektifin üstüne yazılmaz. Otomatik pedal varsayılanı korunur.

## Kaynak kontrolü

Uçuş Hareketleri(2).pdf (libfile_c390ef0b8fec819198ccaaeaca393c9d), PDF 104–106, bu çalışmada yeniden okundu. Geri saykılıkla fleyır; ileri hız ve çöküşe göre sürekli düzenleme; ilk kollektifle koordineli ileri saykılık/ufkiyet; çöküşe göre kalan kollektif kullanımı; erken kollektifte rotor enerjisi kaybı ve geç kollektifte yetersiz durdurma temel hareket sırasını destekler. Kaynaktaki eğitim rölantisi ve sonradan motor devri tamamlama, gerçek tam güç kaybına motor yeniden çalışması olarak aktarılmaz. Kaynaktaki eğitim irtifaları modelin evrensel işletme sınırı değildir.

## Deneysel tasarım değerleri ve sınırlar

- Tepki zamanı: 0.35 s + (1.25 − mevcut normalize kollektif)/1.2; negatif hareket süresi sıfır. 1.2/s mevcut model hız sınırıdır.
- Kalan mesafeye göre durdurma hesabı, 1.5 m/s hedef düşey hız ve yaklaşık 0.5–5 m/s² üst kuvvet talebi kullanır. Başlangıç kapısı 4.8–18 m aralığında sınırlandırılmıştır. Rotor oranından türetilen bu öngörü tam aerodinamik ileri tahmin değildir.
- Ertelenmiş son soru, yaklaşık temas zamanı 1.8 s altında ve normal kapı yüksekliğinin %65'i geçildikten sonra etkinleşir. Soru aralığı bu acil dalda en az 0.35 s; diğer kararlar normal aralığı korur.
- Bu katsayılar AB-205 test verisi değil, deneysel denetleyici ayarlarıdır. Erken kullanım fazla enerji tüketebilir; geç fakat hâlâ etkili bir müdahale bazı koşullarda nominal daldan düşük düşey temas verebilir. Sonuç sıralaması zorlanmaz.
- Tam 6-DOF, rotor pal elemanı, kalibre edilmiş dinamik inflow ve doğrulanmış iniş takımı eğrileri hâlâ yok. Sert sonuçların gerçek hava aracında kaçınılmaz olduğu iddia edilmez.

## Sonuç ve alternatif raporu

- Temas öncesi hız/RPM doğrudan ilk temas kaydından; uçuş RPM uç değerleri yalnız ilk temasa kadarki örneklerden gelir.
- Son kollektifin başladığı irtifa, alçalış ve kalan zaman; fleyır/ufkiyet varlığı, durdurma payı ve model sınırları açıklanır.
- Aynı koşulda alternatif hesap: tek seçim değiştirilir; öncesindeki seçimler korunur. Sonraki mevcut seçenekler korunur, karar zamanları yeniden hesaplanır; yeni bir karar doğarsa referans durum yönetimi seçeneği kullanılır ve raporda belirtilir. Bu, tüm sonraki kumandaların zamanının sabit tutulduğu izole bir fizik deneyi değildir.
- Alternatifler ancak rehberli koşu tamamlandıktan sonra kullanıcının düğmesine basmasıyla hesaplanır. Ana oturum değiştirilmez; geri sarınca gelecekteki sonuç gizlenir.

## Kontrol kapsamı

`tests/decision-report.test.mjs`: erteleme sonrası gerçek kol hareketi, son kararın tekliği, dinamik zamanlama, saykılık kararından önce aynı yörünge ve sonra farklı disk/gövde tutumu, gerçek temas raporu, alternatifte koşul/önceki karar korunması, oturuma yazmama, 0.02/0.01 s adımla son manevra yakınsaması.

`docs/PHYSICS-AUDIT-v021.md`: 80 koşul, 72 rejim, yönetimsiz yüksek kollektifte pasif RPM toparlanmaması ve güç/enerji denklemi kontrolleri. Tarayıcı becerisi bulunmadığından görsel QA yapılmadı; HTML/tam ekran yapı kontrolleri uygulandı.

Son doğrulama: 119/119 test geçti. Varsayılan S01 koordineli toplam güç kaybı düşey temas 1.68 m/s, kısmi güç 0.64 m/s; deneysel çıktılar, uçuş doğrulaması değil.
