> Güncel v0.19.0 ekleri: LANDING-REVIEW-v019.md. Önceki sürümler tarihsel bağlamdır.

> Güncel v0.18.0 denklemleri ve değişen varsayımlar: EMERGENCY-REVIEW-v018.md. Aşağıdaki önceki sürüm açıklamaları tarihsel bağlamdır; güncel kolektif aktarımı/yaw için yeni inceleme esas alınır.

# v0.16.0 / energy-0.5 / şema5 — 15 Ekim 2026

IAS bütün başlangıçlarda tutarlı; düşük sürat yer referansı istisnası kaldırıldı. Kolektif kayıp gücü ve açık RPM yönetimi geliştirildi; erken/durum tabanlı/geç son kolektif kararı. Tam güç kaybı dışında seçilebilir deneysel kısmi güç dalı; VRS eğilimi, düşük RPM/hatve riski, yüksek devir/overspeed birbirinden ayrı. Kararlar aynı fizik ve WebGL/Canvas görüntüsünü değiştiriyor. VRS/overspeed için şematik rotor halkası ve mevcut bildirim kutusunda açıklamalar var.

Senaryo sonu tablo ve karşılaştırma: süre, min/max RPM, alçalma, temas süratleri, karar zamanı, rejim bulguları, temas öncesi enerji. Hasar/kaza-kırım için alanlar eklendi fakat kaynak yetersiz olduğundan sınıf uydurulmadı. Ayrıntılı denklemler, yeni açık kaynaklar, tüm deneysel katsayılar: AERODYNAMIC-REVIEW.md.

89 otomatik test (önceki80 güncel akışa uyarlandı +9 yeni); 30KIAS/30kt, rüzgâr değişmezliği, VRS/güç ayrımı, son kolektif farkı, overspeed, şaft enerjisi, temas enerjisi ve 16 serbest başlangıç/güç/rüzgâr birleşimi. HTML ve JS kontrolü başarılı. Tarayıcı görsel doğrulaması ve bağımsız uçuş testi yapılmadı.

Tam BEM/dinamik inflow, doğrulanmış AB-205 atalet/polar/motor geçişi ve yapısal darbe modeli bekliyor. Bu sürüm deneysel eğitim senaryosu altyapısıdır; gerçek AB-205 performansı veya kaza sonucu doğrulanmış değildir.

---

# v0.15.0 / energy-0.4 — 15 Ekim 2026

## Tamamlananlar

- Türkçe Uçuş Hareketleri PDF 94–110 ile nitel evre eşleştirmesi: docs/MOVEMENT-MAPPING.md. Havırda çöküş görülmeden son kolektif devreye girmiyor.
- Rotor devri yönetimi artık saha seçiminin gizli yan etkisi değil. İlk karar veya açık gecikmiş müdahale etkinleştiriyor. Net rotor gücü/devir türevi kanıt verisine eklendi; pasif toparlanma mevcut bildirim alanında açıklanıyor.
- İlk müdahale ihmal edilmişse, başlangıç devrinin %94 altına düşen ve hâlâ düşmekte olan rotor, >60 ft ve >5 s tahmini yer zamanı koşullarında tek ek karar açıyor. Bunlar arayüz/model eşikleri, uçuş limitleri değil. Geç müdahale veya tutmaya devam et seçenekleri; tekrar, atlama ve temas sonrası karar yok.
- Saha seçimi girişten sonra alçalma gelişirken (t>=5.2 s ve >200 ft/dk) veya daha önce düşük yükseklik/yer zamanı eşiğinde açılıyor. Önceki son yaklaşma kapısı saha planlaması için geç kalıyordu.
- A/B başlangıçtan türetilen sabit yakın/uzak hedef koordinatları; artık keyfî .015 rad/s dönüş yok. Yer hızı hedef vektörüne kuvvet/ivme sınırlarıyla yöneliyor; hedef geçilince geriye dönmüyor. Sentetik hedefler ve kontrol katsayıları uçuş verisi değil.
- T mevcut andaki kararlarla hesaplanan temas tahmini; gelecekteki cevaplar geri sarılan zamana sızmıyor. Gerçek hedefler hareket etmiyor. Hedef sapması açık gösteriliyor; erişilemeyen saha için yapay başarı üretilmiyor.
- Her senaryo ve serbest noktada, güç kesilmiş ve alçalma başlamışken göreli akış okları. WebGL ve Canvas aynı durumdan yön, hedef, tahmin kullanıyor. Disk indüklenmiş akışı/CFD değil.
- Mevcut değerlendirme/karşılaştırma alanı: süre, örneklenmiş minimum rotor ve maksimum alçalma, temas öncesi yatay/düşey sürat, karar zamanları, aynı başlangıç/koşullar kontrolü. Gelecekteki sonuçlar geri sarınca saklanıyor.
- Şema4; şema1/2/3 eski kayıtlar yeni kapılara taşınıyor. Eski kayıtta hiç sorulmamış ek devir kararı gerekiyorsa açık `hold` kaydı eklenerek kumanda tutulması korunuyor; eski uçuş sonucu korunmuş gibi sunulmuyor.

## Kalan teknik sınırlar

RPM'nin koşulsuz hiç yükselmemesi zorlanmadı. Enerji modeli tutulmuş kolektifle yeterli alçalış geliştiğinde pasif toparlanma üretebilir. Gizli otomatik kontrol düzeltildi; **bu toparlanmanın gerçek AB-205 miktarı/süresi doğrulanmadı**. Mevcut kararlı alçalma/başlangıç RPM kalibrasyonu ve yüksek hatve rotor aerodinamiği sonraki fizik işi. Atalet, motor durma eğrisi, yer etkisi, normalize kolektif kazançları ve 0–5 yer referanslı başlangıç istisnası hâlâ deneysel.

Model gövde geometrisi bu tur değiştirilmedi. Önceki kuyruk/gövde/rotor referans ayrıntıları ve tam gövde tutum dinamiği sonraki geliştirme. Uçuş hareketlerinin sayısal eşikleri otomatik gerçek uçuş usulü olarak uygulanmadı.

## Doğrulama

80 otomatik test: önceki 75 kontrol yeni koşullu akışa uyarlandı; ek karar, gecikmiş müdahale enerjisi, dört baş yönünde S01 yakın/uzak izleri, tüm durumlarda akış/temas tahmini, eski şema ve sonuç raporu. Sayısal enerji, adım yakınsaması, temas bitişi, kayıt/geri sarma, tam ekran düğümleri ve Canvas çalıştırma testleri korundu. Tarayıcı görsel doğrulaması mevcut ortamda yapılamadı. Uçuş testiyle bağımsız fizik doğrulaması yapılmadı.

---

# v0.14.0 / energy-0.3 — Güncel hesap

Önceki bölümler tarihsel kayıttır. Bu bölüm onları aşağıdaki noktalarda günceller.

## Yatay kuvvet ve rüzgâr

Yer hızının X/Z bileşenleri ayrı integre edilir. Hava hızı = yer hızı - sabit rüzgâr vektörü; IAS yaklaşık EAS kabulü sürer. Sürükleme iki bileşende hava hızından hesaplanır. Siklik hedefleri sınırlandırılır ve .3 s geçişle uygulanır; rotor kuvvetinin yatay bileşenleriyle rüzgâr sürüklemesi dengelenir. Artık düşük hız konumu doğrudan kilitlenmez; kumanda cevabından dolayı küçük, fiziksel sürüklenmeler oluşabilir. Test edilen 0–5 / 0–40 kt rüzgâr havır koşullarında kısa uçuş boyunca fark 1 cm altında kalır; gerçek performans garantisi değildir.

**Başlangıç kısıtı korunuyor:** 0–5 seçimi konum tutma/yer referanslı başlangıç komutudur; rüzgârlı sabit havırda gerçek KIAS sıfır olamaz. Seçili sıfır KIAS, sıfır yer hızı ve sıfır olmayan rüzgârı aynı anda doğru saymak mümkün değildir. Mevcut seçim ve gösterge notları bu istisnayı açıklar. >5 seçimde başlangıç KIAS korunur. İleride başlangıç türü arayüzü netleştirilmeli; bu sürüm yeni seçim paneli eklemez.

Rotor enerji iş terimi, hava hızı vektörüyle Tx*VairX + Tz*VairZ üzerinden hesaplanır. Potansiyel + hava kütlesine göre öteleme + rotor enerjisinin değişimi, toplam kayıp güçle karşılaştırılmıştır; sabit rüzgâr ve serbest uçuş varsayımı altında test edilmiştir. Tam gövde/yaw dinamiği, pal elemanı, dinamik inflow ve türbülans yoktur.

## Yer etkisi ve kumanda

FAA HFH Bölüm2, In Ground Effect / Out of Ground Effect: yer yakınında rotor verimi ve indüklenmiş güç gereksiniminin değişimi nitel dayanak. Uygulamadaki `1 - .18*exp(-(AGL+3.5)/7.35)*exp(-(TAS/12)^2)` çarpanı **FAA formülü veya AB-205 ölçümü değildir**. Düzgün yüzey için deneysel, sınırlı bir düzeltmedir; kayıp gücün varsayılan %60'lık bileşenine uygulanır. +3.5 m disk/skid farkı varsayımıdır. Türbülanslı yüzey/engebe/bitki etkisi çözülmez.

Yüksek kolektif ve disk eğiminin kayıp gücüne katkısı eklenmiştir: `1 + .3*max(collective-1,0)^2 + .1*tanTilt^2`. Katsayılar doğrulanmamıştır. Kaynak eğrisinin kararlı koşul kalibrasyon kontrolü sürer.

Son kolektif hedefi artık sadece `.18*w` eklemesi değildir: kalan yüksekliğe bağlı deneysel hedef düşey hız, mevcut rotor RPM ve istenen düşey ivmeden gerekli normalize kolektif türetilir; hedef 1–1.8, ivme 0–4 m/s² aralığında sınırlandırılır. Kolektif oran limiti ve zaman sabiti korunur. Son kolektif/flare evreleri bir kez başladığında geri dönmez; böylece eşik etrafında aç-kapa salınımı önlenir. Bu değerler eğitim usulü, gerçek pal açısı veya uçak limiti değildir. Gecikmiş ilk müdahaleden sonra yakın yaklaşma seçimi yapılırsa kontrol yeniden devralınabilir; önceden harcanmış rotor enerjisi geri yüklenmez.

Alçalışın azalması düşey kuvvet denkleminden çıkar. Sonuç her başlangıçta aynı olmak zorunda değildir: özellikle alçak havırda kolektif uygulaması alçalışı diğer dala göre sınırlayabilir ama mutlaka önce yükselip sonra düşen bir düşey hız eğrisi yaratmaz. Böyle bir eğri görsel olarak zorlanmaz. Hoverdaki control/diagnose ilk kararları aynı kolektifi koruduğunda aynı fizik sonucu verebilir; raporlama bunun farklıymış gibi görünmesini sağlamamalıdır.

## Süre, temas ve kayıt

Bitiş `flightEnd` ile mevcut kumanda geçmişinden tahmin edilir. 20 ms integrasyon adımındaki arazi kesişimi doğrusal bulunur; senaryo süresi o temas zamanıdır. Timeline, ileri sarma ve 0.5/1/1.5/2x oynatma bu zamanı aşamaz. Temas anına tam sarınca da aynı terminal konum/RPM/düşey hız elde edilir. Temas sonrası çarpışma modeli olmadığı için göstergeler temas öncesi ölçütleri saklar; bunlar yerde devam eden gerçek hız değildir. Çarpışma yükü, hasar ve başarılı iniş puanı hesaplanmaz.

180 saniye içinde temas çıkmazsa açıkça “hesap zaman sınırı” sonucu verilir; temas olmuş gibi gösterilmez. Kapsam dışı başlangıçta süre0 ve hesap-kapsamı sonucu. Eski anlatım olayları fiziksel bitişin ötesinde gösterilmez. Süre gösterimi saniyenin yüzde birine yuvarlanır; bu hassasiyet modelin uçuş doğruluğu anlamına gelmez.

Şema3 kayıtları aynı modelde tam tekrar üretir. Şema1/2 kararları ID/seçenekle yeni kapılara göç ettirilir; artık uçuşta bulunmayan kapı uygulanmaz ve eski anlatım kuyruğu kırpılır. Bilinmeyen/tekrarlı kararlar reddedilir. Önceki versiyonun sonucu korunmuş gibi sunulmaz.

## Raporlama altyapısı ve kontroller

`flight-evidence.js`: 0.1 s aralık, karar zamanları ve tam temas anını içeren örnekler; seçili başlangıç/konfigürasyon, model sürümü, kararlar, konum, KIAS, yer hızı, alçalma, rotor/motor RPM, kolektif ve temas ölçütleri. Maksimum alçalma/minimum RPM örneklenmiş yaklaşık ekstremumlardır. Bu tur rapor arayüzü eklenmedi. Son kolektif evresi ve alçalışın azalmaya başlaması mevcut bildirim alanına hesap olayları olarak gelir.

75 test: önceki testler + tüm oynatma hızlarında tam bitiş, tekrar oynatma/geri sarma, karar değişince süre, kararlar arası ayrı izler, son kolektifle azalan alçalma, rüzgârlı enerji dengesi, temas zamanı adım yakınsaması, yer etkisi sınırı ve eski kayıt göçü. HTML düzeni/sözdizimi de kontrol edildi. Bağımsız AB-205 uçuş doğrulaması yapılmadı; tarayıcı görsel kontrolü mevcut değil.

# v0.13.0 / energy-0.2 — Güncel değişiklikler

Aşağıdaki v0.12 bölümü tarihsel model kaydıdır. Bu bölüm onun kumanda, havır ve karar zamanlaması açıklamalarını günceller.

- `flight-controls.js`: gerçek pal açısı yerine normalize kolektif hedefi ve siklik disk eğimi vekili. Kolektif .25 s zaman sabiti ve ±1.2/s oran, siklik .3 s ve ±.3 rad/s ile hedefe gider. Bu değerler mühendislik varsayımıdır, AB-205 ölçümü değildir. Gövde görüntüsü burun ekseni +X olduğundan, ileri itki için burun aşağı ve frenleme için burun yukarı olacak şekilde eğim işareti düzeltildi.
- Kontrol kararı yoksa/diagnose seçildiyse başlangıç kolektifi tutulur; önceki keyfî +.12 dikkat katsayısı kaldırıldı. Control seçimi normal uçuşta rotor enerjisine bağlı hedefi, başlangıç <=5 ve <=20 ft ise kolektifi korumayı seçer. Türkçe operatör kitabı PDF186 §9.1.9 ç(2), yer tesirinde havır ile ileri uçuş kolektif uygulamasını ayırır. **20 ft ve 5 eşikleri kaynaktan alınmış yer etkisi sınırları değildir**, yalnız mevcut yazılımın deneysel düşük havır sınıflamasıdır.
- Shared dalında tahmini yer zamanı <6 s iken yavaşlama hedefi, <2.5 s iken/başlangıç alçak havırda son kolektif vekili eklenir. Bu eşikler, açı ve kumanda miktarları gerçek usul değildir. Flare'in enerji aktarımı mevcut kuvvet/enerji denklemine girer, sonuç hasar veya iniş başarısı sayılmaz. Ayrıntılı gerçek yer etkisi, pal aerodinamiği ve temas kuvveti yoktur.
- Karar kapıları: ilk t=4 güç kaybı; ikinci AGL <=min(60 ft, başlangıcın %65'i) veya AGL/alçalma <=6 s. Tarama .1 s; ilk iki karar arasında en az .02 s. Bunlar arayüz duraklatma eşikleridir; pilot tepki süresi veya işletme limitleri değildir. Başlangıçta yerde veya sayısal kapsam dışında ise uçuş kararı üretilmez. Temas sonrası karar planlaması yapılmaz.
- 0–5 seçimlerinde ideal yatay konum/sürat tutucu kullanılır. Skaler hareket durumu bu modda yer süratidir, rüzgâr konuma tekrar eklenmez. Hava sürati yer hızından rüzgâr vektörü çıkarılarak raporlanır. Örneğin yer sürati 0 ve karşı rüzgâr 5 kt olduğunda KIAS yoğunluğa göre yaklaşık 5 kt olabilir. Bu yüzden bu aralıkta diagramın seçili sürati **yer referanslı başlangıç komutu** olarak yorumlanır; bu istisna mevcut seçim ve gösterge notlarında belirtilir. Kesin IAS başlangıcını koruyan, gerçek yanal kuvvetlerle rüzgâr dengeleyen hover trim çözümü sonraki geliştirmedir. Yatay konum tutma ideal olduğundan mevcut düşük hızlı güç/drag kapanışı tam rüzgâr enerjisi hesabı değildir; rüzgâr/performans doğrulaması yapılamaz.
- Sayısal geri hız sınırı düşük sürat kontrolünün ileri hız hedefinde aşımı önler. >5 başlangıçlarda fiziksel rüzgâr sürüklenmesi korunur; distant dalındaki yön değiştirme açık kullanıcı seçimidir.
- Şema2 oturumlar dinamik zamanları tekrar hesaplar; eski şema1 zamanları legacyTiming ile korunur. Eski kayıtlar eski fizik uygulamasını paketlemez; güncel deneysel çekirdekle oynatılır. Aynı sürümde geri sarma ve kayıt açma deterministiktir.

Doğrulama: 67 test; yeni testler tüm başlarda/düşük süratlerde rüzgârla istemsiz geri/yan kayma olmaması, kararların temastan önce çıkması, farklı başlangıçlarda farklı ikinci karar zamanı, kumanda geçişleri, alçak havır kolektif koruma, flare yönü/enerji etkisi ve eski kayıtların zamanlarını korumasını kapsar. Kararlı eğri tekrar üretimi kalibrasyon kontrolüdür; bağımsız uçuş doğrulaması değildir. Tarayıcı görsel QA bu ortamda mevcut değil.

# v0.12.0 — Deneysel enerji ve hareket çekirdeği

Bu sürüm uçuş testiyle doğrulanmış AB-205 modeli değildir. Eski anahtar kare hareketinin yerine deterministik indirgenmiş bir hesap geçmiştir. Arayüz yapısı ve seçim aralıkları değişmemiştir. Model kimliği `energy-0.1`.

## Kaynak ve varsayım ayrımı

- Türkçe UH-1/AB-205 operatör kitabı §7.5.1, PDF 118: motor gücü mevcutken 324 rotor / 6600 motor RPM referansı. Boş girişler bu referansı kullanır, kullanıcı kaydı doldurulmuş gibi değiştirilmez.
- Aynı kitap §2.7.1, PDF 24: serbest bırakma / transmisyon. Motor ve rotor arıza sonrasında birbirinden ayrı durum değişkenleridir.
- Şekil 9-2, PDF 197: `curve-reference.js` içindeki yaklaşık alçalma eğrisi okumaları. Ortak 50–80 çatı KIAS, 284–339 rotor RPM dikdörtgeninde çift doğrusal enterpolasyon yapılır. 324 RPM değeri kaynak üzerinde ayrı ölçüm değil enterpolasyondur. Bu işaret yalnız eğri kapsamını gösterir; uçuş doğrulaması değildir.
- NASA TM-84281, Ek G, basılı s.35–36: rotorun dönme serbestliği, net tork / atalet yaklaşımı. https://ntrs.nasa.gov/api/citations/19830001781/downloads/19830001781.pdf . NASA'nın tam 10 serbestlik dereceli modeli uygulanmamıştır.
- NASA TM-73254, basılı s.13 / PDF 18: UH-1H çalışmasının 2800 kg uçuş koşulu. https://ntrs.nasa.gov/api/citations/19770024231/downloads/19770024231.pdf . Ağırlık belirtilmezse bu deneysel varsayım kullanılır ve mevcut RPM notunda yazılır. AB-205'in varsayılan gerçek ağırlığı olduğu iddia edilmez.
- NASA NTRS 19840001967: XT-53 / UH-1C rotor-transmisyon incelemesindeki 2711 kg m² örnek rotor ataleti, geçici model parametresidir. AB-205'e aktarımı doğrulanmamıştır. https://ntrs.nasa.gov/api/citations/19840001967/downloads/19840001967.pdf
- Motor RPM: dN/dt = -N/3 s. **3 saniye ölçülmüş T53 arıza yavaşlama sabiti değildir; açık deneysel varsayımdır.** NASA'nın governor zaman sabiti motor durma eğrisi olarak kullanılmadı. N1/N2 ayrı motor modeli, windmilling ve engine seizure yok.

## Uygulanan denklemler

SI birimleri. `w` aşağı pozitif, `v` hava kütlesine göre yatay sürat, `L` düşey rotor kuvveti, `Tx` yatay rotor kuvveti, `D` sürükleme:

- dy/dt = -w; dv/dt = (Tx-D)/m; dw/dt = g-L/m.
- E_rotor = J Ω² / 2; dE_rotor/dt = Lw - Tx v - P_loss (tam güç kaybından sonra).
- Böylece temas öncesinde d(E_potansiyel + E_kinetik + E_rotor)/dt = -P_loss - Dv. Motor RPM, rotor RPM oranından türetilmez.
- D = 0.5 rho 1.5 m² v|v|. Eşdeğer sürükleme alanı 1.5 m² tasarım varsayımıdır.
- Düşey kuvvet: mg (RPM / başlangıç RPM)² çarpı sınırlı kolektif vekili. Vekil `.65 + .35*w/sink` biçimindedir; gerçek pal açısı veya aerodinamik pal elemanı hesabı değildir.
- Kayıp gücü, eğriden elde edilen kararlı alçalma referansına kalibre edilir. Başlangıç RPM'ye göre kübik ölçek kullanılır. Bu bir enerji kapanış modeli; indüklenmiş akış veya vortex-ring çözümü değildir.
- 50 KIAS altı ve 80 üstü alçalma uzatması sırasıyla .0015*(50-KIAS)² ve .003*(KIAS-80)² m/s ekler. Bunlar **kaynak verisi değil deneysel matematiksel uzatma**dır; mevcut RPM notunda eğri kapsamı dışı uyarısı çıkar.
- Eğrinin ağırlık/atmosfer uygulanabilirliği henüz tam belirlenmediğinden, 2800 kg / standart deniz seviyesi deneysel kalibrasyon temeli seçildi. Sink sqrt(m/2800)*sqrt(1.225/rho) ile ölçeklenir; bu, kitaptan çıkarılmış AB-205 düzeltme kanunu değildir.
- Standart basınç irtifası ve seçilen sıcaklıktan ideal gaz yoğunluğu. IAS yaklaşık EAS kabul edilir; pitot/CAS hatası ve sıkıştırılabilirlik düzeltilmez. H/V başlangıç ekseni çatı KIAS kalır. Basınç irtifası kısa alçalma boyunca sabit atmosfer girdisidir; AGL ile karıştırılmaz.
- Sabit rüzgâr vektörü hava hızına eklenerek yer hızı/konum bulunur. Türbülans, bulut, görüş, pilot deneyimi sayısal kuvvet/tepki süresi üretmez.

## Otomatik kontrol ve kararların sınırı

Motor gücü ilk 4 saniye trimde kabul edilir; t=4 s tam güç kaybı enjekte edilir. Başlangıç noktası herhangi bir seçili 1 ft / 1 kt değeridir, senaryo kimliği fizik denklemini seçmez.

Fizik çekirdeği henüz pilotun gerçek kumanda hareketlerini almadığı için otomatik bir kontrol varsayımı kullanır. Başlangıç sürati 10 KIAS altındaysa sürat korunmaya çalışılır, aksi durumda 63 çatı KIAS'a sınırlı yatay ivme uygulanır. Bu bir uçuş talimatı veya her koşulda uygun hedef değildir. Düşey kuvvet vekili güç kesilince azaltılır; hover/IGE için ayrı doğru kolektif kanunu henüz yoktur. Bu yüzden özellikle alçak havır sonuçları nicel eğitim doğrulaması taşımaz.

`diagnose` kararı kendi zamanından itibaren kolektif vekiline +.12 ekleyen deneysel duyarlılık dalıdır; gerçek insan davranışından türetilmemiştir. `distant` kararı temas öncesinde .015 rad/s yön değişimi uygular; tam yatış/yaw ve indüklenmiş dönüş kaybı modeli değildir. Karar açıklamaları nitel değerlendirme olmaya devam eder. Pilot deneyimi için uydurma tepki katsayısı eklenmedi.

## Zaman, temas ve görünüm

Sabit 20 ms orta nokta integrasyonu, zaman ve girişlerle anahtarlanan sınırlı önbellek. Kare hızı sonucu değiştirmez. Geri/ileri sarma aynı adımları kullanır. Sonradan verilmiş karar geçmişe sızmaz. 1x oynatma saniyesi bir fizik saniyesidir.

Arazi kesişimi küçük adım içinde doğrusal bulunur; skid AGL sıfırda durur. Temas hızı/konumu/RPM kaydedilip dondurulur. Temas sonrası hareket, rotor yavaşlaması veya çarpışma hesaplanmaz. Eski 8/25 saniye karar noktaları ve anlatım süresi korunmuştur; erken temas sonrası kararlar sadece anlatım incelemesidir. Mevcut bildirim ve oynatma notu bunu açıklar. Sonraki aşamada kararlar fizik olaylarına bağlanmalıdır.

WebGL ve Canvas uyumluluk görünümü aynı fizik durumunu kullanır. Rotor görsel açısı Ω integrali, kuyruk görsel oranı geçici 5.55'tir. Ekran kare hızında stroboskopik görünüm olabilir; pal görüntüsünden RPM okunmaz. Pitch görseli .3 s yumuşatılır; tam gövde moment hesabı değildir.

Sayısal çalışma koruması: 1000–5000 kg ve 250–360 başlangıç rotor RPM dışında hesap durdurulup mevcut durum alanında açıklanır. Bunlar **işletme limitleri değildir**. Konfigürasyon girişlerinin daha geniş kayıt aralığı korunur.

## Doğrulama ve sonraki iş

Testler: kaynak enterpolasyonu, standart yoğunluk, rüzgâr hava/yer ayrımı, ortak 3B/RPM durumu, dt yarılama yakınsaması, mekanik enerji kaybı, kütle etkisi, serbest nokta/temas, deterministik geri sarma, karar nedenselliği ve kapsam dışı koruma. 63 KIAS / standart atmosferde uzun süreli 284/314/324/339 RPM kalibrasyon koşulları eğriyi yeniden üretir. **Kalibrasyon kontrolü bağımsız uçuş doğrulaması değildir.**

Eksikler: gerçek AB-205 atalet ve motor geçiş verisi, eğri koşullarının tamamlanması, düşük hız/IGE/OGE, pal elemanı ve dinamik inflow, flare, kolektif/siklik/pedal komutları, 6-DOF gövde hareketi, temas kuvveti/hasar, rüzgâr profili ve türbülans. Bu eksikler nedeniyle hesap gerçek uçuş/emercensi kararına esas alınamaz.

Tarayıcı görsel testi bu ortamda çalıştırılmadı; modül, sayısal ve HTML yerleşim kontrolleri yapıldı.
