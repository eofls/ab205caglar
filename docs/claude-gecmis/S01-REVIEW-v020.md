# S01 geliştirme ve kaynak kaydı — v0.20.0 / energy-0.9 / şema 9

15 Ekim 2026. S01 ana geliştirme ve karşılaştırma vakasıdır; fizik senaryo adına göre başarı atamaz. Diyagramdan seçilen noktalar aynı hesap çekirdeğini kullanır.

## Yeniden üretilen sorun

v019 varsayılan S01 hazır akışında tam güç kaybı teması 10,02 m/s, kısmi güç 9,70 m/s idi. Saha yönlendirmesi fleyır öncesi hava süratini gereksiz erken düşürüyordu. Disk normalindeki akışın fleyır sırasında artışı kaldırma kapanışında yoktu; yüksek son kolektif otorotatif akışı anında sıfırlıyordu.

## Değişiklikler

- Düz uçuşta ileri enerji korunur; yaklaşma/fleyır/ufkiyet/son kolektif durumdan seçilir. Fleyırda disk eğimi ve ileri hareketten gelen akış birlikte ele alınır; kuvvet işi aynı rotor enerji denklemine girer. Enerji ekleyen ayrı bir animasyon yoktur.
- İndirgenmiş akış hafızası: kolektif azaltılınca aktarım kurulur; son kolektifle akış anında sıfırlanmaz. Hiç azaltılmayan kolektifte aktarım başlangıçtan sıfır kalır. Tam güç kaybında yönetilmeyen rotorun sürekli devir kaybı regresyon testi korunur.
- Hazır akış statik cevap listesini kullanmaz. `adaptive-pilot.js` durum geri beslemeli yerel karar modelidir; öğrenilmiş yapay zekâ veya harici LLM değildir. Yükseklik, düşey hız, hava sürati, RPM ve artık güçten hareket evresi/rotor kurtarma/yüksek devir/düşük süratli güçlü alçalış kararları üretir. Gerekçeleri olay kutusuna ve karar geçmişine yazılır. Başarı garantisi yoktur.
- Kullanıcı karar akışına uygun koşullarda fleyır: uyarlanabilir / gecikmiş / uygulama yok seçeneği eklendi. Soru aralıkları ve tekilleştirme korunur. Son kolektif kararı ayrı kalır.
- İlk temasın kaydı ayrı; kayma ve sınırlı sekme ardından yerleşme sonunda saat durur. İlk temas sonrası gösterilen hareket ve RPM, aynı temas kaydından tekrar üretilebilir. Temas öncesi değerler raporda saklanır.
- Hasar sonucu artık gerekçeli benzetim tahmini. Düşey/yatay enerji ve tutumdan eğitim sınıfı üretilir; gerçek AB-205 kırılma olasılığı veya resmi kaza sınıflaması değildir. Orijinal doğrulanmış eğri çözücüsü korunur, sahte AB-205 eğrisi eklenmez.
- Tam ekranın üstünde yalnız senaryo sonunda renkli temas sertliği ve kısa hasar tahmini görünür; geri sarınca kaybolur. Normal arayüzün düzeni korunur.

## Kaynakların yeniden incelenmesi

Uçuş Hareketleri.pdf PDF 94–96: 3 ft havır, sürüklenme/baş kontrolü, çöküş görüldükten sonra uygun son kolektif; erken kullanımın enerji tüketimi. PDF 104–106: standart otorotasyon; geri saykılıkla fleyır, ileri sürat ve çöküşü birlikte izleme, ufkiyet, çöküşe göre ilk/son kolektif. Kitaptaki yaklaşık 100 ft fleyır ve 15 ft ilk kolektif eğitim bağlamındadır; simülasyonun evrensel sabit başlangıç noktaları değildir. Eğitim rölantisi/güçlü kurtarma, gerçek tam güç kaybında otomatik motor geri dönüşü olarak uygulanmadı.

Ek hasar kaynakları: BellUH1HMM PDF 100–103,260 (UH-1H-II; farklı varyant); Skid Landing PDF 5,7,9–14 (ANSAT/ön deney; AB-205 değil); Session_14-2 PDF 4–5 (kiriş eğrisi, sekme/ikinci temas); Design_and_drop_test_simulation_of_a_hel PDF 8–13 (genel, ısı işlemsiz model; deney doğrulaması değil). Bu kaynaklar mekanizma ve model mimarisini destekler, aşağıdaki katsayıları AB-205 için doğrulamaz. NASA 19850007393 buzlanma kaynağıdır; bu sürüm hasar katsayısına aktarılmadı.

## Açık tasarım varsayımları

- Akış hafızası açılma 0,2 s / kapanma 0,8 s; fleyır akış kaldırması ek katsayısı 0,6. Ölçülmüş dinamik inflow veya pal poları değil.
- Fleyır disk eğimi sınırı 0,42 rad; yatay fren ivmesi talebi 0,25–5 m/s². Normal yönlendirme 2 m/s². Kumanda cevabı mevcut hız sınırlayıcılarıyla entegre edilir.
- Fleyır kapısı yükseklik, düşey ve ileri sürat ilişkisi; temel 30,48 m. Son kolektif temel kapısı 4,8 m; geç seçimi 1,2 m. Bunlar kaynak örneğinden esinlenen deneysel denetleyici değerleridir, pilot talimatı değildir. Kuvvet hedefi rotor oranına bağlı, kolektif en çok 1,65 normalize; erken dal 1,8.
- Zemin: düz/sert yüzey yaklaşımı; sürtünme 0,35 ve geri sıçrama 0,10 varsayılır. Yatay kayma Coulomb yavaşlaması; çok küçük ilk sekme balistik, sonraki temas tam sönümlü. Gövde açısı 3/s, rotor 8 s zaman ölçeğinde azalır. Kısmi güçte motor 8 s, tam güçte 3 s ölçeğiyle sönümlenir. Bu, gerçek yerde motor işletme prosedürü değildir. Eğimli arazide tam temas normali/6DOF çözülmez.
- Hasar puanı: `100*(m/2800)*(w/5)^2 + 25*(m/2800)*(v/12)^2 + 2*max(|pitchDeg|-8,0)^2 + 3*max(|rollDeg|-5,0)^2`. Sınıf sınırları 25/80/180; mühendislik ölçümü veya olasılık değil. Sonuçlar hafif/önemli/ağır hasar olasılığını nitel olarak açıklar; ilk sınıf kesin hasarsızlık iddiası değildir.
- Gerekli ortalama zemin kuvveti `m*(g+w²/(2s))-L`, 0,10–0,30 m varsayımsal durma mesafesinde duyarlılık olarak verilir. Kapasite değildir. Ön/arka ve sağ/sol yük payları tutumdan türetilen sınırlı heuristiktir; gerçek CG/atalet/4 nokta kuvvet çözümü değildir.
- Temas sertliği mevcut düşey enerji endeksi olarak kalır; hasar olasılığı değildir. Hasar taraması yatay/tutum etkilerini ayrıca içerir.

## Kabul sonuçları

Varsayılan S01, kullanıcı karar modu: tam güç kaybı uygun fleyır/kollektif 2,13 m/s; geç son kolektif 5,69; fleyır yok 8,41. Kısmi güç aynı dallar 1,09 / 5,39 / 8,23 m/s. Bunlar eğitim modelinin ölçümleri, uçuş testi değildir. Uygun dalda yer sürati yaklaşık 10,3 m/s olduğu için hafif düşey temas otomatik hasarsız iniş demek değildir.

109 otomatik test geçti. Aynı koşulda dal ayrımı, geri sarma, şema göçü, yüksek kolektifte yönetimsiz RPM kaybı, enerji dengesi, sekme enerji sınırı, zaman sonunda durma ve yeni hasar etiketleri kontrol edildi. `PHYSICS-AUDIT-v020.md`: 80 koşul,72 rejim; 0,02→0,01 s adımda en fazla 0,05788 RPM /0,01677 ft fark (en geç 8 s örneklemesi). HTML yerleşim yapısı kontrol edildi. Tarayıcı kontrol becerisi yok; gerçek tarayıcıda tam ekran/görsel QA yapılmadı.

Yakın/uzak işaretlerin sırası korunur. Başarısız uzak saha teşebbüsü fizik gereği yakına düşebilir; sonuç uzakta bitsin diye konum zorlanmaz. T işareti gerçekleşen kumandaların temas tahminidir, hedefe ulaşma garantisi değildir.

## Sonraki kalibrasyon

S01 kullanıcı gözlemiyle fleyır tutumu ve temas akışı; farklı ağırlık/rüzgâr/yoğunlukta davranış; gerçek AB-205 parça/atalet/kuvvet–strok verisi gelirse katsayı kalibrasyonu. Kaynak eksikliği geliştirmeyi durdurmaz, ancak benzetim etiketleri korunur.
