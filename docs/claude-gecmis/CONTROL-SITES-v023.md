# Aday sahalar ve son yaklaşma — v0.23

## Kaynak
Uçuş Hareketleri(2).pdf PDF104–106 yeniden okundu: yaklaşık100 ft fleyır; oran sürat, alçalış, rüzgâr, rotor devri, yük ve yoğunluğa göre düzenlenir. İlk kollektif fleyırla azalan çöküş tekrar artmaya başladığında; kalan kollektif çöküşe göre ve ufkiyet ile koordineli kullanılır. Erken/geç kollektifin enerji/zaman kaybı açıkça anlatılır. Eğitimde rölanti/güçlü kurtarma anlatımı gerçek motor gücü geri geldi sayılmadı. Kullanıcı 75–100ft aralığı istedi; normal100, bilinçli erteleme75 referansı kullanıldı. Bunlar her acil durumda uygulanabilir yeni işletme limitleri değildir.

## Kontrol ve fizik
Önceki erteleme eşiği12m (~39ft) idi. Normal dalın sınırsız büyüyen dinamik başlangıç yüksekliği de kaldırıldı; yeni eşiklerde kumanda cevap süresi için kısa mesafe payı var. Asıl fleyırın gerçekleşmesi hala entegre tutum, disk eğimi ve yavaşlamayla doğrulanır. Otomatik fleyır frenleme talebinin alt sınırı1.2m/s²; kontrol kazancı deneysel. Yetersiz enerji veya alçak başlangıçta hareket/başarı zorlanmaz.

Son kollektif erişimi için hedef uzanım1.6, hız1.2 birim/s ve .35s tepki payı kullanılır. Son talep2.2 normalize birime kadar çıkabilir; bu bir pal açısı, AB-205 mekanik kol sınırı veya ölçülmüş hatve değildir. Kaynak nitel hareket sırasını destekler; sayısal katsayılar kalibrasyon bekler. Enerji denklemi/RPM kaybı korunur. Kollektif göstergesinin normalize aralığı buna uyarlandı. Gerekli kuvvet kalmadığında alçalış yeniden artabilir; türev veya sonuç zorla monotonlaştırılmaz.

Overspeed hold son kararsa gerçek kollektiv konumu sabittir, saykılık gövde eksenlerinde korunur, pedal hareketi sıfırdır. RPM serbest enerji hesabını izler. Yeni açık kumanda kararı tutmayı sonlandırır. Son temas için koşula bağlı yeni uygulama seçeneği vardır. Aynı seçim sonrası yüklemeye otomatik geçiş yoktur.

Öngörülü pilotun temas düşey hız maliyet ağırlığı12’den24’e çıkarıldı; yatay hız/rotor rezervi yine hesapta. Daha geniş karşılaştırma tüm iyi ve kötü sonuçları gösterir; kısa ufuk her inişi optimize etmez.

Entegrasyon iç adımı en fazla10ms; daha kaba örnek/öngörü adımları alt adımlanır. Saykılık tutma dalında20ms kaynaklı temas zaman farkını gidermek için yapıldı. Ayrı10ms/5ms son temas testi aynı0.03s ve0.15m/s eşikleriyle geçer; tolerans gevşetilmedi.

## Arazi etkileşimi
1–2 varsayılan sahaları,3+ kullanıcı sahaları. Tek sol tık ekler; 5pikselden büyük sürükleme ekleme sayılmaz. Sağ tık aday üstündeyse kaldırır; sağ sürükleme kameradır. Uçuş başlamadan da adaylar gösterilir. Yeni sahalar fizik yönlendirmesine bağlanır; yaklaşmada yavaşlama/fleyır kararları mevcut enerji ve zamana bağlıdır. Hedefi geçtikten sonra otomatik geri dönüş yoktur.

Yatay mesafe x/z düzleminde; dikey mesafe helikopterin dünya yüksekliği ile sahanın arazi yüksekliği arasındaki mutlak fark; hipotenüs bu iki bileşenin kareler toplamının karekökü. Metre cinsinden anlık değerler. Zemin etiketi koordinat, yol ve eğime bağlı temsili sınıftır; ölçülmüş saha keşfi veya hasar hesabına yeni zemin katsayısı değildir. Mevcut temas zemini modeli değiştirilmedi.

Sahalar config içinde saklanır; stable kimlikler, artan numara, en fazla100özel saha ve koordinat doğrulaması vardır. Silinen numara yeniden kullanılmaz. Seçilmiş sahayı silme o karar ve devamını geçersiz kılar. Otomatik oynatım durur. Eski şema12 kayıtları13’e yeniden zamanlanır; iç shared/distant kimlikleri uyumluluk için korunur, ekranda1/2 görünür.

## Doğrulama
134test: numara/ekleme/silme, saha kararı, kayıt/geri sarma, karar öncesi fizik aynı kalması, seçilen özel hedefin hareketi değiştirmesi, hover araç ipucu, sürükleme ile tıklama ayrımı, overspeed kumandalarının gerçek değerlerde sabitliği ve yeni kararla serbest bırakılması, normal/gecikmiş fleyır başlangıcı, S01 tam/kısmi güçte10ft→5ft alçalış azalması,10ms/5ms yakınsama.80koşul/72rejim taraması ve12hazır akış karşılaştırması ayrı raporlarda.

Tarayıcı: mevcut canlı sürüme kullanıcı hesabıyla erişildi. Bulut ortamında WebGL bağlamı açılamadı; Canvas uyumluluk görünümü çalışıyor. Yeni sürüm yayımlandıktan sonra fare/tam ekran/karar etkileşim kontrolü yapılacak. WebGL ışık ve gölge kalitesi burada doğrulanamaz.

## v0.23.1 görsel kontrol düzeltmesi
Canlı Canvas kontrolünde saha kamerası yalnız tahmini temasa bakıyordu; iki çizici için ortak sınırlayıcı küre kadrajı eklendi. A/B kalan açıklamaları 1/2 olarak düzeltildi. İlgili 10 test tekrar geçti.
