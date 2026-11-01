# v0.22 teknik inceleme

## Kaynak ve uygulama
Uçuş Hareketleri(2).pdf 104–106 yeniden incelendi. Geri saykılık ile fleyır ileri sürati ve alçalışı azaltır; kollektif ve ufkiyete geçiş rüzgâr, devir, yük ve alçalışa göre koordine edilir. Erken kollektif rotor enerjisini tüketebilir; geç uygulama kalan alçalışı durduramayabilir. Eğitimdeki irtifa/sürat referansları evrensel kontrol eşiklerine çevrilmedi; eğitimde motor toparlama anlatımı gerçek tam güç kaybında güç geri gelmesi olarak uygulanmadı.

## Gerçek hareket ve karar kapıları
Kumanda etiketi gerçekleşmiş fleyır sayılmaz. Entegre durumdan temas öncesi TAS>3 m/s, gövdeye göre disk eğimi<-0.04 rad, burun yukarı>0.025 rad ve hava hızı doğrultusunda yavaşlama>0.2 m/s² aranır. Ufkiyet ayrıca yükseklik>1.2 m ve kalan zaman>0.6 s ister. Bunlar deneysel algılama eşikleridir, işletme limitleri değildir. Sahne gerçek tutumu kullanır; görsel açı yapay büyütülmez. Gecikmiş fleyırda kısa hareket penceresi açılır, zamanlı kollektif sırf görsel için ertelenmez. Yüksek dikey başlangıçlar fleyır uydurulmadan son kollektif kararı alır.

Uzak hedefte deneysel fren mesafesi GS*0.8+GS²/(2*2.5) ile kalan mesafe ve temas zamanı değerlendirilir. Yaklaşma kararı görülmeden sonraki fleyır seçimi etkili olmaz. Yavaşlamaya geç veya sürati koru dalları fiziksel sonuç bakımından ayrıdır. Temsili hedefe erişim ve yumuşak temas zorlanmaz; kesin iniş noktası navigasyonu henüz sınırlıdır.

## Öngörülü pilot
Her 0.5 saniyede 2 saniyelik, 0.05 saniye adımlı ortak fizik hesabı yapılır. Mevcut kural pilotu adayı her zaman korunur; duruma göre daha güçlü/yumuşak fleyır, kollektif veya rotor yük azaltma adayları denenir. Temas düşey/yatay hızı, tutum, düşük rotor devri ve havada kalırken alçalış/enerji maliyeti birlikte değerlendirilir. İç öngörüler yeniden öngörü çağırmaz. Yere yakın son yumuşatma sırasında kollektif tersine aşağı dönmez. Durum sıçratılmaz, yalnız uygulanacak kumanda seçilir. Bu sınırlı ufuklu aday aramasıdır; eğitilmiş yapay zekâ veya küresel en iyi çözüm değildir.

## Doğrulama ve sınırlar
126 test geçti: deterministik geri sarma/kayıt, eski kayıt göçü, gerçek fleyır önkoşulu, gecikmiş hareket sırası, uzak hedef dalları ve karar öncesi aynı durum, yüksek dikey başlangıç, adım küçültme yakınsaması. Ortak fizik denetimi 80 koşul/72 rejimi geçti; rotor hata üst değeri yaklaşık 0.052 RPM, irtifa 0.0161 ft; pasif rotor toparlanması 0. HTML/tam ekran yapı kontrolü geçti. Tarayıcı görsel QA yapılamadı.

12 başlangıçta eski kural pilotu ve yeni pilot karşılaştırıldı: düşey temas hızı 5/12, yatay temas hızı 8/12 durumda düştü. Bazı durumlarda yatay hız azalırken düşey hız yükseldi ve rotor rezervi azaldı. Ayrıntılar PREDICTIVE-AUDIT-v022.md içinde; maliyet ağırlıkları henüz kalibre edilmemiştir. Yumuşak iniş veya gerçek AB-205 performansı iddiası yoktur. Tüm değişiklikler ortak çekirdektedir; S01 yalnız temel geliştirme/test vakasıdır.
