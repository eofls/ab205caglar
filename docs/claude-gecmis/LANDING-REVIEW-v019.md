# v0.19.0 / energy-0.8 — 15 Ekim 2026

## Kaynak incelemesi ve kapsam

Türkçe operatör §9.1.9 / Bölüm 9 ve Türkçe Uçuş Hareketleri PDF 104–106 için önceki sayfa incelemesi EMERGENCY-REVIEW-v018.md ve MOVEMENT-MAPPING.md dosyalarında korunur. Türkçe kaynak önceliklidir. Bu sürüm yeni AB-205 limiti üretmez.

FAA Helicopter Flying Handbook, Bölüm 11, basılı 11-2/11-3: alçalma hızının inişte gerekli rotor enerjisini etkilemesi; son kolektifin erken/uzun uygulanmasında rotor devrinin tükenmesi. Kaynak nitel dayanak sağlar, aşağıdaki .35 s / 4 m/s² / rezerv katsayılarını sağlamaz.
https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf

NASA 20080017012, WASP iniş takımı testleri ve sayısal model karşılaştırması: iniş takımı kuvvet/deformasyon davranışının deneyle karşılaştırılması gerekir. Bu BAŞKA hava aracıdır; test sürati veya yapısal eşikleri AB-205'e aktarılmadı.
https://ntrs.nasa.gov/citations/20080017012
https://ntrs.nasa.gov/api/citations/20080017012/downloads/20080017012.pdf

## Geç tepki: örnek hesap ve uygulama

2000 ft/dk = 10.16 m/s. Sabit net yukarı ivme a ve tepki süresi τ için iyimser durdurma mesafesi `wτ + w²/(2a)` olur. Bu tanısal hesapta tepki sırasında hız sabit varsayılır; rotor/kuvvetin zamanla azalması dahil değildir. Gerçek zaman serisini sabit ivme formülü değil, mevcut .02 s hareket/enerji integratörü üretir.

Örnek: τ=.35 s ve a=4 m/s² için 16.4592 m gerekir. Kalan açıklık 5 m ise tepki sonrası 1.444 m kalır; gerekli net yukarı ivme yaklaşık 35.74 m/s², iyimser kalan düşey sürat yaklaşık 9.575 m/s olur. Aynı ivme varsayımında 20 m açıklık kinematik olarak yeterli görünür; rotor enerjisinin bunu sürdürebileceği anlamına gelmez. Bu sayılar AB-205 performans verisi veya kumanda talimatı değildir.

- Son kolektif için yalnız kinematik durdurma yüksekliği kullanıldığında erken enerji tüketimi görüldü. Deneysel denetleyicide eldeki rotor rezervinden tahmini yüksek hatve süresi hesaplanıyor.
- Rezerv `J/2 × max(0,Ω²−(.85Ωref)²)`; tahmini kayıp `mg × sink × max(.1,r³) × (.4+.6×1.5²)/.694`. Süre rezerv/kayıp ile sınırlandırılır; komut başlangıcı `w × (.35 + min(w/4, rezerv/kayıp)) +1.2 m` (en az1.2 m). .85,1.5 ve1.2 m deneysel denetleyici değerleridir; rotor limitleri değildir. Ground-effect, kısmi güç ve değişen akış bu öngörüde tam çözülmez; gerçek entegrasyonda mevcut modeller uygulanır.
- Kolektif sınırlı hızla hareket eder; kaldırma/rotor kaybı entegre edilir. Alçalma aniden sıfırlanmaz. Rotor rezervi azalırsa ilk yavaşlamadan sonra yeniden hızlanan çöküş mümkündür.
- Flare hava sürati hedefi kalan AGL yanında tahmini yer zamanına bağlıdır. Disk eğimi arttıkça düşey kuvvet bileşeni azalır.
- Bildirim, son kolektif etkin ve iyimser durdurma payı yetersizken bir kez açılır. Kayıt, geri sarma ve sahne aynı fizik durumunu kullanır.
- Genel “zamanında seçim daima en iyi sonuçtur” kuralı yok. S01 varsayılan örneğinde erken/zamanlı/geç dal karşılaştırması PHYSICS-AUDIT-v019.md dosyasında; farklı sahalar arasındaki düşey sürat tek başına iniş başarısı değildir.

## Pedal ve yan hareket

Koşullar > Otomatik pedal varsayılan açık. Kapalı mod başlangıç pedalını tutar; yeni manuel pedal kararları şu an kapalıdır. Eski şema1–7 kayıtları şema8'e taşınır, eksik pedalMode otomatik olur. Eski sayısal sonuçlar yeni fizik modeliyle yeniden hesaplanır; eski yaw kararları yeni akışta yeniden sorulmaz.

Deneysel kuyruk momentinden `Fyan = −Mtail / 6 m` yan kuvvet türetilir, baş açısıyla dünya eksenlerine aktarılır. 6 m doğrulanmış moment kolu değil, açık model varsayımıdır. Saykılık hedefi yan kuvveti telafi etmeye çalışır. Roll görseli mevcut yanal rotor kuvveti ve .25×kuyruk yan kuvvetinin kuvvet/tutum yaklaşımını kullanır; tam roll atalet çözümü değildir. Kuyruk yan kuvvetinin öteleme işi rotor enerji bilançosuna katılır. Yaw enerjisi ayrı izlenir; tam 6-DOF enerji/akış çözümü iddia edilmez. Gerçek moment kolu, CG, kuyruk haritası ve ataletler ek belge bekliyor.

## Temas sertliği endeksi

`Praw = 100 × (max(0,w)/5 m/s)²`; görünen P,0–100'e sınırlanıp tam sayıya yuvarlanır. Aynı kütlede düşey kinetik enerji oranıdır; kütleden bağımsız normalize edilmiştir. Örneğin .5 m/s → %1,5 m/s → %100. 5 m/s yalnız TASARIM REFERANSIDIR; iniş sınırı veya NASA/AB-205 eşiği değildir. Üstünde “ölçek üstü” ve gerçek temas sürati/enerjisi raporda kalır.

| Gösterilen yüzde | Kısa derece |
|---|---|
| 0–19 | Hafif temas |
| 20–44 | Orta sert |
| 45–69 | Sert |
| 70–100 | Çok sert |

Metin rengi HSL hue120→0 (yeşil→kırmızı),%75 doygunluk,%30 açıklık. Derece renk olmadan da yazıyla okunur. Başlangıç zaten yerdeyse veya temas yoksa puan verilmez. Yatay hız/tutum/zemin etkisi bu endeksin içinde değildir; ilgili fizik ölçüleri ayrı raporlanır. Hasar olasılığı, yaralanma veya kaza-kırım derecesi değildir.

## Yapısal hesap altyapısı

`structuralContact` kaynak kimliği, kütle aralığı, tutum sınırı ve sıralı kuvvet–deformasyon noktaları alır. Düşey başlangıç enerjisine karşı `∫(Fskid + Frotor − mg) ds` işini hesaplar. Parçalı doğrusal eğride ilk enerji kesişimi, kullanılan strok, en yüksek kuvvet ve strok bittiğinde kalan enerji döner. Yumuşayan eğrinin ilk kökü de değerlendirilir. Düşey enerji sıfırsa darbe stroku0; statik denge çözülmüş sayılmaz.

Varsayılan AB-205 eğrisi YOKTUR. Rapor bunu açıkça belirtir. Zemin eğimi/tutum/kütle kapsam dışındaysa sonuç üretilmez. Rotor desteği strok boyunca sabit; tek eksenli enerji yaklaşımıdır. Sürtünme, yatay yük, skid kopması, sekme, sönüm, işgalci yükleri ve gerçek hasar sınıfları ek model/veri bekler. Sentetik test eğrileri yalnız matematik kontrolü içindir, uygulamaya hava aracı verisi olarak yüklenmez.

## Kontroller ve açık sınırlar

Sayısal testler: geç tepki birim dönüşümü ve durdurma mesafesi; endeks sınırları/renkleri/monotonluğu; analitik kuvvet–strok ve yumuşayan eğri; otomatik pedal kayıt/migrasyon/kapalı konum; koşullu bildirim/geri sarma. Önceki enerji bilançosu, yüksek kolektifte devir düşüşü, WebGL/Canvas ortak durum, süre/temas, VRS/overspeed ayrımı korundu.

Disk eğimi ve kuyruk yan kuvveti eklenince uzun süreli kalibrasyon sapması 1–2 ft/dk oldu; test toleransı 3 ft/dk (önceden1). Bu bağımsız uçuş doğrulaması değildir. Son kolektif testinin “son .1 saniyede mutlaka azalır” varsayımı kaldırıldı: yavaşlama aralığının oluşması, sürekli değerler ve sonunda tekrar hızlanabilen çöküş denetleniyor.

Tarayıcı görsel QA mevcut ortamda yapılamadı. HTML/form/tam ekran yerleşim bağlantıları ve renderer testleri çalıştırılır. Yeni belgelerle özellikle rotor ataleti, final hatve/lift-tork haritası ve iniş takımı kuvvet–deformasyon eğrisi kalibre edilmelidir.
