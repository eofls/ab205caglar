# v0.30.0 kaynak taraması (20 Ekim 2026)

Kullanıcı bilgisayarındaki AB-205, FAA, gpt doküman ve KARIŞIK klasörleri tarandı. Metne çevrilen yeni belgeler: BellUH1HMM (UH-1H bakım el kitabı, 1608 s.), DCS UH-1H Flight Manual, NASA TM-86925, Drivetrain, Synchronized Elevator, Ana Rotor 2, Güvercinlik Meydan Talimatı 2021, EHEST HE2, AB-205 limit. Rotor kutup ataleti hiçbirinde yok. Açık kaynak: DTIC ADA173707 (ARL Aero TM-377, UH-1H hover: R=24 ft, 315/325 RPM), DTIC ADA071648 (OH-58 HERS ataletli rotor deneyi, nitel). Kalibrasyon dayanakları DCS UH-1H Flight Manual §9.7 (ticari simülatör kılavuzu, resmî değil) ve TR Uçuş Hareketleri Standart/Alçak İrtifa Otorotasyonu (öncelikli kaynak). Ayrıntı: REVISION-v030.md.

# 15 Ekim ek inceleme

FAA HFH Bölüm11, NASA kaldırma bağıntısı, NASA/TP-2005-213477 ve NASA TRACT darbe test özeti incelendi. Kaynak URL ve uygulama sınırları AERODYNAMIC-REVIEW.md içinde. Türkçe §2.13.10 yüksek devir ikaz bandı yeniden okundu.

# 15 Ekim 2026 ek kaynak incelemesi

Uçuş Hareketleri(2).pdf (libfile_c390ef0b8fec819198ccaaeaca393c9d), PDF94–110 metni incelendi. Eşleştirme ve uygulanabilirlik sınırları: MOVEMENT-MAPPING.md. Yeni motor sönüm/AB-205 atalet ölçümü bulunmadı.

# v0.14.0 kaynak kontrolü

FAA Helicopter Flying Handbook, Chapter 02 — Aerodynamics of Flight: “In Ground Effect (IGE)”, “Out of Ground Effect (OGE)” ve autorotation/collective bölümleri yerel PDF metninden incelendi. Nitel mekanizma için kullanıldı; uygulamadaki katsayılar bu kaynaktan alınmış değildir. Chapter03 PDF de indirildi; bu tur uçuş hareketleri dokümanıyla eşleştirme yapılmadı.

- https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook
- https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch02.pdf

Türkçe operatör kitabı §9.1.9 önceliği korunur. AB-205 atalet ve gerçek motor coast-down verisi bu incelemede yeni bir doğrulama kazanmadı; önceki belirsizlikler geçerlidir.

# v0.12.0 — Deneysel fizik hesabı

Diyagramdan seçilen başlangıç için sabit adımlı enerji/hareket çekirdeği eklendi. Alçalma, IAS/TAS/yer sürati, rotor ve motor RPM; WebGL ve Canvas görünümüyle aynı durumu kullanır. Arayüz öğesi eklenmedi/çıkarılmadı. Temasta hesap dondurulur, anlatım incelemesi devam eder. Ağırlık boşsa 2800 kg varsayımı görünürdür. Modelin varsayımları, kaynakları ve eksikleri: docs/PHYSICS.md. Uçuş doğrulaması yapılmadı.

Sonraki adım: düşük hız/yer etkisi ve flare; gerçek kumanda girdileri ve fizik olaylarına bağlı karar zamanları. İlk olarak AB-205 rotor ataleti, motor geçiş eğrisi ve kaynak performans koşulları netleştirilmeli.

# Güncel durum — v0.9 — 14 Ekim 2026

- Sağ kenarda kutusuz rotor/motor RPM metni; tam ekranda bildirim kutusunun altında aynı DOM düğümü taşınır, çıkışta yerine döner. Metin gölgeli, kamera etkileşimini engellemez.
- Başlangıçta girilen devirler; boşsa açık referans etiketiyle 324/6600 gösterilir. Bu, boş konfigürasyon alanını değiştirmez. Güç kaybından sonra sayısal RPM null / — gösterilir. Gerçek zamanlı sayısal RPM talebinin bu kısmı henüz tamamlanmadı: rotor ataleti, aerodinamik tork/kolektif etkisi ve motor yavaşlama verisi eksik. Uydurma devir eğrisi veya güç kaybı=0 RPM yok.
- Motor arızası/serbest dönüş kaynak sayfaları PDF24,185,186 tekrar okundu. Kaynaklı güç aktarımı ve gösterge olayları 5/10 anlatım saniyesine eklendi; bunlar fiziksel tepki süreleri değildir.
- Güç durumu, mevcut oturum saatinden türetilir; durdurma, geri sarma, kararlar ve kayıt yükleme ile tutarlıdır. Tam ekran kontrolleri ve sol H/V seçimi korunur.
- Kontroller: 45 Node testi, HTML yapı kontrolü ve JS sözdizimi kontrolü. Tarayıcıda görsel/native tam ekran QA bu ortamda yapılamadı.
- Sonraki iş: doğrulanmış rotor/motor geçiş verisi edinme ve dinamik modele bağlama. Gösterge altyapısı hazır; gerçeğe dayalı anlık sayısal değişim henüz hazır değil.

---

# Güncel durum — v0.8 — 14 Ekim 2026

- 324 rotor / 6600 motor RPM: kullanıcı girdisi Türkçe operatör kitabı §7.5.1, PDF118 / basılı7-5 seyahat tavsiyesiyle metin ve görüntü üzerinden eşleştirildi. PDF90 §5.2.2 metal pal koşulu korunur. Eski seyahat kartlarının 314/6400 temeli ve tork düzeltmesi ayrı bağlamdır.
- Şekil9-2 PDF197 / basılı9-14 yeniden incelendi. Alçalma ve süzülüş oranı: 284/314 RPM 40–80 çatı KIAS, 339 RPM 50–80 çatı KIAS. 339/40 üst grafik dışında; sonuç üretilmez. Değerler yaklaşık, RPM'ler arasında enterpolasyon yok.
- 314 RPM ara kontroller:55 kt görsel~1620 / enterpolasyon1640;75 kt görsel~1660 / enterpolasyon1670 ft/dk. Bunlar tüm aralık için hata sınırı değildir. Aynı kaynağa tekrar bakıldı; bağımsız uzman kontrolü yapılmadı.
- Kaynak checksum, kapsam, sayfa, yuvarlama, kalibrasyon ve veri tablosu dist/curve-audit.json içinde. Kaynak sayfaları uygulamada açılabilir.
- 41 test geçti: serbest H/V, eski kayıtlar, kararlar, sarma, tam ekran kontrol yapısı, grafik kapsamı ve veri tutarlılığı. HTML/yapı ve JS sözdizimi kontrolleri geçti. Tarayıcı görsel testi bu ortamda kullanılamıyor.
- Fizik hâlâ etkin değil. Sıradaki iş: mevcut kaynaktaki motor kaybı/serbest dönüş/rotor enerjisi koşullarını kaynaklı durum geçişlerine dönüştürmek; rotor ataleti ve geçiş denklemleri için veri açıklarını belirlemek. Ağırlık/yoğunluk/rüzgâr düzeltmesi veya iniş sonucu uydurulmayacak.

---

# Kaynak ve doğrulama kaydı

Kaynak önceliği: kullanıcıya ait geçerli uçak kitabı/çeklist ve konfigürasyon tespiti tamamlanacak. Mevcut inceleme, gönderilmiş kaynakların belirli bölümlerine dayanır; operasyonel onay değildir.

| Kaynak | Kalıcı kimlik | Okunan bölüm | Kullanım |
|---|---|---|---|
| Gönderilen ekran görüntüsü | libfile_85b25953c5ec8191b917ac957bf11c5c | Görselin tamamı | Özgün H/V; roof/nose; ağırlık eğrileri; Figure 9-3 |
| 2-UH-1-AB-205-Operator-Manual.pdf | libfile_8bed0326f6bc8191b7e4ac118f4754fb | PDF 24, 28, 93, 185–187, 198 | Transmisyon/ana jeneratör; §5.8; motor güç kaybı; H/V görsel karşılaştırması |
| 2.TM 55-1520-210-10 UH-1 OPERATOR MANUAL.pdf | libfile_ce2ec0d705e88191a06aef329d2b746e | PDF 403–405, 416 | §9-2, 9-9, 9-11/12; Figure 9-3 bağlamı |
| HELICOPTER FLYING HANDBOOK.pdf | libfile_468e45c1568881919213b7d29d88327e | PDF 90–92, basılı 7-2–7-4 | Genel H/V, ağırlık/DA ve otorotasyon ilişkileri; örnek hava araçlarının sayıları alınmadı |
| 9-UÇUŞ MÜRETTEBAT EĞİTİMİ.pdf | libfile_943e460ec59c81919e85f1dcf0f2d855 | PDF 14–16 | Durumsal farkındalık, odaklanma, koordinasyon |
| METEOROLOJİ.pdf | libfile_60bb192480ac8191bb0d7a3a575cdc42 | PDF 23, 48–51 | Nitel çevre bağlamı; tartışmalı ifadeler modele dahil edilmedi |
| AB-205 SİSTEMLER.pdf | libfile_9c2e93b3cc5c81919edaa560fea9cf61 | Taranmış belge olarak tespit edildi | Ayrıntılı görsel okuma bekliyor; bundan teknik kural çıkarılmadı |

## Kurallar

- **R01:** Tam güç kaybında tanı gecikmesi/uygunsuz teknik/aşırı manevra olumsuz etki eder. TR PDF186 §9.1.9 ç; TM PDF404 §9-9d. Sayısal olasılık yok.
- **R02:** IGE hover ile cruise initial collective ayrılır. Aynı yerler. Kontrol seçeneği bu nedenle “koşula uygun” ifadesini taşır; kumanda miktarı verilmez.
- **R03:** RPM ikazı tek başına tanı değil. TR PDF186 dikkat; TM PDF404 warning.
- **R04:** Transmisyon serbest bırakma, rotor/aksesuar ilişkileri. TR PDF24 §2.7.1; main generator TR PDF28 §2.11.5. Devir eşiği bilinmediğinden on/off threshold yok.
- **R05:** H/V ilişkisi, weight/DA applicability. FAA basılı7-2–7-4; TR PDF93 §5.8. Otomatik bölge sınıflandırıcısı henüz yok.
- **R06:** Durumsal farkındalık ve iş bölümü. CRM PDF14–16. Üç deneyim etiketi uygulama tasarımıdır; kaynakta validasyonlu tepki süreleri değildir.
- **R07:** Rüzgâr bileşeni yalnız trigonometridir. İrtifa/IAS/ground track conversion uygulanmaz. Görüş 5km eğitim koşulu ayrımı uygulama tasarımıdır; yasal limit değil.

## Açık çelişkiler

TR PDF186 son collective cümlesi ile TM PDF404 metni aynı anlam kapsamına sahip değil. Uygulama alt normal rotor devrine düşürmeyi veya süzülüş için belirli kolektif komutunu önermiyor. Exact variant/current manual confirmation gerekli.

Meteoroloji PDF50 dağ dalgası kararlılık ifadesi ve sabit düşey akım sayısı ile PDF48 bazı genellemeler ek doğrulama gerektiriyor. Bunları kaynakta var diye uçuş modeline dönüştürme.

## Henüz karşılaştırılmayan arşiv

- 1.UH-1 Operatör Talimnamesi.pdf — libfile_d15b358b1bc4819199dd422771d5a99f
- UH-1-AB-205JM-Çeklist.pdf — libfile_ac545c280c40819181d1f5942893e91f
- UH-1H_Flight_Manual.pdf — libfile_d92165f9067481918f96c006c0cb9f85
- EMERCENSİ ESKİ KİTAP.pdf — libfile_15e6063ad15481919c72eb1688a51c45
- İNGİLİZCE EMERCENSİ BÖLÜMÜ UH-1.pdf — libfile_76cb4515367c81919fbcd0a1194ef7f6
- Surviving an Antitorque Malfunction.pdf — libfile_899e0f7f3b948191bb1fbbc8cb088d89
- Helicopter Emercencies And Hazards.pdf — libfile_73f9614708fc819184314053bcb8c13e
- Türbinli Motor.pdf — libfile_40dd700186b08191a59bf7c3c79b64a3
- Shawn COYLE - Cyclic and Collective.pdf — libfile_b0d3f6a5d13c81918e2f30988d23c3a3
- UH-1 EMERCENSİ USULLER NOT ALINMIŞ VERSİYON…pdf — libfile_540c7a2a37e481918ad599cc7c368850

Kimlikler önceki yükleme kayıtlarından; yeniden çalışırken Library read ile güncel içerik alınmalı. Yerel scratch kopyalarının kalıcılığı varsayılmamalı.


## Kullanıcı kaynak tercihi — 13 Ekim 2026
Türkçe ile İngilizce arasında zıtlık varsa Türkçe metin esas alınacak. Önceki “kullanıcı tercihine ihtiyaç” notu bu tercihle giderildi. Çelişki kaydını ve konfigürasyon bağlamını koru; Türkçe metinde olmayan sayısal değer üretme.


### S01 / v0.4 kural eşlemesi
| Anlatım | Kaynak | Yazılım sınırı |
|---|---|---|
| Güç kaybı belirtileri; RPM ikazına tek başına tanı koymama | TR §9.1.9 PDF185–186 | Gösterge sayıları simüle edilmez |
| İlk kolektif uygulamasının başlangıca bağlılığı | TR §9.1.9 ç PDF186 | Belirli miktar veya zaman üretilmez |
| Serbest bırakma ve transmisyon aksesuarları | TR §2.7.1 PDF24 | Sistemler otomatik arızalı/normal ilan edilmez |
| Fiks olma / kontrol / seçenekleri değerlendirme | CRM §2.4.1–2.4.4 PDF14–16 | İki karar ve dört sonuç eğitim tasarımıdır |
| İkincil görevler zaman izin verirse | TR §9.1.9 notu, §9.1.12 | Otomatik yeniden çalıştırma/harici yük atma yok |
| Otorotatif hava akımının nitel görselleştirmesi | TR §9.1.9; FAA Helicopter Flying Handbook Autorotation | Oklar ölçülen akım vektörü değildir |

FAA resmi çapraz kontrol: https://www.faa.gov/sites/faa.gov/files/helicopter_flying_handbook.pdf ve https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch04.pdf (14 Ekim 2026). Türkçe kaynak önceliği korunmuştur.

A/B adaylarının şekli, konumu, zamanları, nitel dal metinleri ve 400/60 başlangıcı yazılım tasarımıdır; kaynakta verilmiş senaryo veya doğrulanmış menzil sonucu değildir. Ağırlık/konfigürasyon beklediği için safe hazır örnek etiketi otomatik bölge hesabı sayılmaz.


v0.5 hareket notu: S01 anahtar pozisyonları, tutum açıları, kısa sapma ve B yönüne dönüş birer görsel anlatım tasarımıdır. Kaynaklardan türetilmiş sayısal uçuş modeli değildir. Nitel karar riskleri önceki S01 kaynak eşlemesine dayanır. 55 saniyedeki sabitlenme gerçek uçuşta rotor durması anlamına gelmez; anlatım sonudur.


### v0.6 sayısal referans çıkarımı (14 Ekim 2026)
Kaynak: aynı Türkçe PDF (libfile_8bed0326f6bc8191b7e4ac118f4754fb). PDF95 ve197 render edilip görsel okundu. Revizyon/güncellik ve hava aracına uygulanabilirlik bilinmiyor.

| Veri | Okunan değer | Dayanak | Kullanım sınırı |
|---|---|---|---|
| Azami gros |9500 lb|PDF91 §5.4.2|Gerçek hava aracına limit onayı değildir; performans/CG ayrıca|
| H/V ağırlık kapsamı|9500 lb ve altı|PDF93 §5.8|Eğrilerin ağırlık/konfigürasyon kontrolünün yerine geçmez|
| Rotor gösterge açıklaması|294–324 RPM devamlı; 339 maksimum|PDF95 Şekil5-1.2|Güçsüz uçuş hedefi gibi uygulanmaz|
| Metal pal seyir|319–324 RPM|PDF90 §5.2.2|Kompozit için aynı kısıt aktarılmaz|
| Minimum alçalma sürati etiketi|63 kt çatı /52 kt burun|PDF197 Şekil9-2|Grafik etiketi; koşullardan bağımsız hedef değil|
| Maksimum süzülüş mesafesi sürati etiketi|98 kt çatı /82 kt burun|PDF197 Şekil9-2|Başlangıç sürat aralığı genişletilmedi|
| RPM eğri etiketleri|284,314,339|PDF197 Şekil9-2|Eğriler limit değil; sayılaştırma bekliyor|
| Motor ayrımı|T53-L-13; 703 limitleri EK-C|PDF16 ve91|703 ek verisi bu turda çıkarılmadı|

Çapraz kontrol: FAA HFH Chapter11 https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf hava aracına özgü hız/RPM için RFM'ye yönlendirir. Genel FAA örnekleri AB205 sayısal modeli yapılmadı.

284 RPM grafiği ile 294 RPM devamlı gösterge alt sınırı otomatik birleştirilmedi; farklı çalışma bağlamlarının doğrulanması gerekir. Başlangıç RPM alanı referansla sınırlı karşılaştırma içindir. Rotor ataleti/enerji, CG, geçiş davranışı, sayısallaştırılmış eğriler ve kaynak uygulanabilirliği eksik olduğundan fizik hesabı hiçbir seçimle aktif olmaz.


## v0.7 — 14 Ekim 2026
- Kullanıcının motor gücü mevcutken normal uçuş referansı: rotor 324 RPM, motor 6600 RPM. Formda tek düğmeyle doldurulur; uygulamayla kayıt edilir. Eski kayıtların bilinmeyen değerleri korunur. Canlı devir ölçümü veya arıza sonrası hedef değildir.
- Şekil 9-2 / PDF197 / basılı9-14: 314 RPM güçsüz uçuş eğrisinin 40–80 çatı KIAS bölümü elle ön sayısallaştırıldı. 40/50/60/63/70/80 kt için yaklaşık 1900/1670/1600/1600/1620/1720 ft/dk. Noktalar arası doğrusal yaklaşım; dışarı taşırma yok. Kaynak görsel üzerinde işaretli inceleyici eklendi.
- Grafik okumaları 10 ft/dk yuvarlanır; bu gösterim hassasiyet garantisi değildir. Bağımsız doğrulama henüz yok. H/V başlangıcı, fizik ve 3B hareket değiştirilmedi.
- Sonraki iş: nokta okumalarının bağımsız kontrolü, kalan RPM eğrileri ve süzülüş oranının çıkarılması; ardından konfigürasyon uygulanabilirliği.
- Doğrulama: 38 otomatik test ve HTML/yapı kontrolü. Tarayıcı görsel kontrolü bu ortamda yapılamadı.
