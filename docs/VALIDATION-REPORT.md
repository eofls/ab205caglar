# v0.40.0-validation — Doğrulama ve düzeltme raporu

28 Ekim 2026. Bu paket önceki ZIP'in ayrı bir geliştirme kopyasıdır. Canlı site yayımlanmadı. Tam kaynaklar, model/terrain varlıkları, testler ve sonuçlar birlikte verilir.

## Sonuç

Yazılımsal tutarlılık ve referans karşılaştırma altyapısı geliştirildi. Gerçek uçuş fiziğinin tamamı doğrulanmadı. Mevcut fizik modeli deneysel kalır. Özellikle program hareketleri hâlâ hedef izleyen kinematik model; motor arızaları ise enerji modeli kullanır. Başlangıç sözleşmesi ortaklaştırıldı, iki model birleştirilmedi.

## Düzeltilenler

- Ortak yoğunluk, IAS/TAS, rüzgâr ve varsayılan kütle tanımları `flight-reference.js` içinde.
- Program başlangıcı IAS'tan TAS'a, ardından yer hızına dönüşür. 30 KIAS ve 30 kt baş rüzgârı, deniz seviyesi/15 °C şartlarında iki modelde de yaklaşık 0 kt yer hızı üretir.
- 10.000 ft ve 35 °C, rüzgârsız 30 KIAS başlangıcı iki modelde de yaklaşık 37,41 KTAS verir.
- Programın speedKt hedefleri hava sürati olarak çevrilir; vel hedefleri arazi üzerindeki konuma yaklaşma için yer hızlarıdır. Kuvvetli rüzgârda tüm hareketlerin saha erişimi bu turda görsel olarak doğrulanmadı.
- Program başlangıç RPM girdileri uygulanır. Gavırnır ve hareket direktörünün daha sonraki normal RPM hedefleri ayrı davranıştır.
- Program önbellek anahtarı gerçek grossWeightLb, başlangıç RPM, türbülans ve yardımcı pilot alanlarını içerir. Kinematik modelin ağırlığa dinamik tepkisinin yetersizliği bundan ayrı, açık bir sınırlamadır.
- Varsayılan PPC ağırlığı ana fizikteki 2800 kg ile eşleştirildi. Bu ağırlık gerçek kullanıcının helikopterinin ağırlığı kabul edilmez; mühendislik varsayımıdır.
- Program kayıtlarının desteklenen zaman aralığı 900 s; ana model 600 s sınırını korur. Meydan turu 626,2 s sonunda dışa aktarılıp tekrar yüklendi.
- Oturum dosyası içe aktarma limiti 8 MiB oldu; 40.000 örneklik veri doğrulaması korunur. Yaklaşık 60 saniyelik değişken elle uçuş kaydı artık boyut kapısından geçer.
- Önbellekte eksik caglar-filo.jpeg girdisi kaldırıldı; yeni ortak modül listeye eklendi. Kurulum başarısızsa hata yutulmaz; başka uygulamaların önbellekleri silinmez.
- Temas sonrası canlı hesap yardımcı fonksiyonu kokpit ve dış RPM/sürat/irtifa alanlarında ortak kullanılır. Temas öncesi değerler rapor için saklanır.
- Çizim hatası sonraki animasyon karesinin planlanmasını kesmez. Gerçek GPU bağlamı/hata enjeksiyonu bu ortamda sınanmadı.
- Kayıt uygulama sürümü ve durum belgesi bu sürümle eşlendi; bazı eski “hesaplanmıyor” metinleri düzeltildi.

## Önceki rapora düzeltme

Dış sağ gösterge alanında temas sonrası ayrı güncelleme zaten vardı. Önceki rapordaki “bütün canlı göstergeler donuyor” çıkarımı fazla genişti. Kokpit ve ortak durum sağlayıcısında ayrışma vardı; dış alanın AGL hesabı da temas konumunu zemin referansı gibi kullanıyordu. Bu sürüm arazi yüksekliğini referans alır. Bu düzeltme önceki raporun yerine geçer.

## Test sonuçları ve sınırları

| Kontrol | Sonuç | Anlamı |
|---|---|---|
| Sözdizimi | 83 JS dosyası, hata yok | Yalnız parse kontrolü |
| Düzeltme regresyonları | 42/42 geçti | Başlangıç çerçeveleri, kayıt, cache ve canlı durum |
| Ana kabul seti | 32/33 geçti | Tek başarısız kontrol: temas kaymasının eğime duyarsızlığı |
| Hazır akış | 18 koşu | Sonlu sayılar, süre, geri sarma, kayıt |
| S01 karar politikaları | 8 koşu | Farklı karar akışları, kayıt geri yükleme |
| Programlar | 64/64 sonlu durum/zaman kontrolü | Gerçek uçuş doğrulaması değildir |
| H/V dönüşümü | 48.681 nokta | 1 ft / 1 kt arayüz koordinat dönüşümü |
| Yapısal enerji hesabı | 4 sentetik analitik örnek | Gerçek AB-205 malzeme/kırılma doğrulaması değildir |
| Kayıt karşılaştırıcı | 4 sentetik kontrol | Hata ölçümü/interpolasyon yazılımı kontrolü |
| Tarayıcı/WebGL/FPS/mobil | Yapılamadı | Tarayıcı aracı/ikilisi kullanılamadı; önceki kurulum denemesi başarısız |

Test sonuçları tests/ içindeki JSON ve log dosyalarında. Kontroller her karar ve hava kombinasyonunu tüketmez. Bu paket görsel kalite veya uçuş eğitimi onayı değildir.

## Otorotasyon grafiği karşılaştırması

Kaynak: kullanıcının Türkçe operatör kitabı Şekil 9-2, PDF 197 / basılı 9-14; pakette autorotation-reference.png. Grafik görseli tekrar incelendi. Kitaptaki bütün performans sayfaları sayısallaştırılmadı.

Üretimdeki kuvvet/rotor güç denklemleri, pilot yönlendirmesinden ayrılmış denge tezgâhında değerlendirildi. Kolektif ve alçalış, düşey ivme ve rotor güç artığı yaklaşık sıfır olacak şekilde çözüldü. Bu yalnız sabit sürat/RPM denge kesitidir; serbest altı serbestlik dereceli uçuş veya geçiş dinamiği testi değildir.

Mühendislik karşılaştırması: 2800 kg, deniz seviyesi, 15 °C, rüzgâr yok, yer tesirinden uzakta, çatı IAS. Grafik üzerindeki ağırlık/atmosfer/konfigürasyon koşullarının tamamı doğrulanamadığı için bu değerler “grafiğin kesin test şartları” diye sunulmaz.

- Kalibrasyonda kullanılan 17 noktanın kuvvet/enerji dengesi sonuçları tabloya alındı.
- Eski tabloya doğrudan girilmemiş 7 ara nokta görselden yeniden yaklaşık okundu.
- ±50 ft/dk, okumadan kaynaklı mühendislik aralığı olarak koşudan önce belirlendi; kabul edilmiş simülatör toleransı değildir.
- 7 ara noktanın tamamı bu okuma aralığında kaldı.
- Model aynı grafikten beslendiği için küçük hata bağımsız doğrulama değildir. Bu turda fizik katsayıları grafiğe uysun diye yeniden ayarlanmadı.

Ayrıntılar: tests/autorotation-results.csv ve tests/autorotation-results.json. Kontrol senaryosu ve çözücü autorotation-bench.mjs içinde.

## Gerçek uçuş kaydına dayalı doğrulama

Birincil açık kaynak incelendi: NASA TM-73254, *A Mathematical Force and Moment Model of a UH-1H Helicopter for Flight Dynamics Simulations*.
https://ntrs.nasa.gov/api/citations/19770024231/downloads/19770024231.pdf

Raporun basılı 10–12. sayfaları, 2800 kg UH-1H için deniz seviyesinde havır ve 60 kt kumanda basamaklarını anlatır. Model ile uçuş tepkileri Şekil 2–9'da karşılaştırılır. Kumanda girdileri fiziksel yer değiştirmedir; uygulamanın boyutsuz kumandasıyla doğrudan eşit değildir. Raporda düşey ivme filtresi ve varyometre gecikmesi sınırlamaları da belirtilir. Bu nedenle alçalış/fleyır için doğrudan kesin kabul verisi olarak kullanılmadı. Bu kaynaktan yeni aerodinamik katsayı üretime aktarılmadı.

Hazırlananlar:

1. validation-profile.json: bilinenler ve henüz doğrulanmamış CG/motor/pal/revizyon alanları ayrı.
2. flight-recording-template.csv: zaman, IAS/TAS, AGL, alçalış, rotor/motor RPM, tutum ve fiziksel kumanda alanları.
3. comparison-template.json: veri kaynağı, koşullar, zaman eşleme ve önceden belirlenmesi gereken toleranslar.
4. tests/export-trace.mjs: bir uygulama oturumunu 20 Hz model kayıt CSV'sine dönüştürür. Kollektif çıktısı model birimidir; pal açısı değildir.
5. tests/compare-recordings.mjs: ortak zaman aralığında bias, RMSE, azami fark; boş/veri dışı noktaları dışarıda bırakır; büyük boşluklardan veya kayıt dışına ekstrapolasyon yapmaz. Tolerans verilmezse pass üretmez.

Ölçülmüş ve konfigürasyonu eşleşen uçuş CSV'si bu pakette yok. NASA grafikleri sayısal zaman kaydına dönüştürülmedi; fiziksel kumanda dönüşümü uygulanmadı. Bunlar tamamlanmadan gerçek uçuşa göre sayısal kabul sonucu verilemez. Gerçek uçuş için riskli deney yapılması önerilmiyor; mevcut yetkili test kayıtları kullanılabilir.

## Açık kalan model işleri

- Programların kinematik hedef takip modeli; kütle, rotor enerjisi ve kumandalarla ortak kuvvet/moment çözücüsüne henüz taşınmadı.
- Temas kaymasında eğim yönü, değişen yüzey ve gerçek parça geometrisiyle ikincil temaslar eksik. Bu bilinen başarısız test gizlenmedi.
- Gerçek skid kuvvet–deformasyon ve pal/kuyruk kırılma verisi yok. Sentetik hasar yüzdesi gerçek kırılma olasılığı değildir.
- Rotor çapı / gerçek mesh ölçeği ve görsel kalite bu turda yeniden modellenmedi.
- Powered kumanda basamakları, fleyır ve son kollektif geçişleri ölçülmüş zaman serileriyle doğrulanmadı.
- Güncel hava aracı konfigürasyonu ve kaynak uygulanabilirliği henüz onaylanmadı.

Bu paket bu açık işleri tamamlanmış gibi göstermez. Sonraki fizik geliştirmesinin kontrol tabanı ve düzeltme sürümüdür.
