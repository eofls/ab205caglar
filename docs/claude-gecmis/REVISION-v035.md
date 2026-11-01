# v0.35 · Kokpit, anlatım, yeni senaryo listeleri, meydan

## Emercensiler
- **Liste:** İstenen 31 emercensi, kitap sırasıyla, alt başlıksız.
  - Kısmi güç kaybı ve tam güç kaybı.
  - Motor arızası: havırda, alçak irtifa düşük süratte.
  - Uçuşta motoru tekrar çalıştırma.
  - Drop kompensatör, kompresör stolü, oynak giriş yön kanatçıkları (kapalı / açık), motor overspeed.
  - Kuyruk rotor arızalarının hepsi ve ana sürücü şaft arızası.
  - Yangınlar (motor çalıştırma sırasındaki hariç).
  - Hidrolik, kumanda sertleşmesi, servo sıkışmaları, ana rotor sistemi, mast vurması.
  - Ana jeneratör arızası, ağaçlara iniş, suya iniş.
- **Otomatik saha:**
  - havırdaki ve yerdeki emercensiler: meydan;
  - ağaçlara iniş: orman;
  - suya iniş: su;
  - diğerleri: arazi.
- **Uçuşta motoru tekrar çalıştırma:**
  - 3000 ft, 70 kt'tan başlar.
  - 1500 ft üzerinde referans karar "tekrar çalıştır"dır.
  - Motor ≈55 s'de çalışır; ardından güçlü uçuşla en kısa zamanda iniş yapılır.
  - Alçakta referans karar otorotasyondur.
- **Kompresör stolü:** Patlama (bang) ve titreşim sesi var. Usul uygulanınca ≈2,5 s sonra kesilir.
- **Dağlık saha:**
  - Otorotasyon fleyırı, yükselen araziye ve sahanın kotuna göre başlar.
  - Ruleli bitiş yerine rulesiz bitiş seçilir.
  - Saha seçiminde sahanın kendi yüksekliği de hesaba katılır.

## Uçuş hareketleri (33)
- **Liste:** İstenen sırayla.
  - Temel: dönüşler, tırmanış / süzülüş, tırmanışlı ve süzülüşlü dönüşler.
  - Havır, kalkış ve meydan turu: havır hareketleri, havırdan kalkış, yerden kalkış, benzetilmiş azami performans, meydan turu.
  - Yaklaşmalar: havıra kadar, yere kadar, derin, alçak yaklaşma ve ruleli iniş.
  - Yer tesiri dışında havır kontrolü.
  - Tekamül: keşifler (yüksek – alçak – yer), tepe ve sırt, kapalı bölge, yamaç.
  - Yavaşlama – hızlanma.
  - Otorotasyon ve mecburi iniş: havırdan ve taksiden otorotasyon; mecburi iniş çalışması (güçlü kurtarma, pas geçme, yere kadar); standart ve 180° dönüşlü otorotasyon.
  - Benzetilmiş arızalar: sağ ve sol pedal kuyruk rotor arızası, hidrolik sistem, GOV EMER.
  - Taktik: ilerleme teknikleri, gizlenme ve açığa çıkma, arazi uçuşu (alçak – direk yalama – yalama), kol uçuşu.
- **Anlatım:** Kitabın görev, başlangıç esasları ve anlatım bölümlerinden kısaltıldı. Her hareketin kendi kararları var. Standart dışı seçim uçulur ve açıklanır.
- **Saha ve başlangıç noktası:**
  - Meydan işleri Güvercinlik pistinde.
  - Tepe, sırt ve yamaç dağlıkta.
  - Kapalı bölge ve gizlenme ormanda.
  - Diğerleri arazide.
- **Otorotasyonlar:**
  - Giriş, 80 kt sabit süzülüş ve 200 ft'te sabit durum kontrolü. Karşılanmazsa pas geçilir.
  - 100 ft'te fleyır, 15 ft'te ilk kollektif.
  - Pistte ≈0,9 m/s ve ≈4 kt ile temas; bir helikopter boyu rule.
  - Uzak sahada S dönüşleri ile süzülüş uzatılır.
- **İkinci helikopter:** Kol uçuşunda lider, ilerleme tekniklerinde destek unsuru uçar. Kendi uçuş izinin zamanda kaydırılmış ve yana alınmış kopyasıdır. Sıçramalı ilerlemede biri ilerlerken diğeri bekler.
- **Arazi uçuşu:**
  - İrtifa, önündeki en yüksek engelden (ağaç, bina, tel) değerlendirilir.
  - Yalama uçuşunda vadiler takip edilir.
  - Önde enerji hattı varsa "tel engeli" anlatılır.

## Kokpit ve anlatım
- **Hazır akışta anlatım:**
  - Her adım ekranda yazılır ve istenirse Türkçe seslendirilir (Anlatım sesi düğmesi).
  - Akış durmaz.
  - Aynı anda gelen adımlar sırayla okunur.
- **Kokpit görünümünde:**
  - Kafa o adımın anahtarına, sigortasına, aletine, kumandasına, iniş sahasına ya da lider helikoptere döner.
  - Ok ve halka ile gösterilir; anahtar yeni konumuna geçer.
  - Yazı üstte durur, ok aşağı uzanır.
  - Kafa dönüşü kare hızından bağımsızdır.
- **Diğer görünümler:** Sadece yazı ve ses var.
- **Ana rotor:** Kokpitte gizlendi. Göbek ve paller ön camı kaplayıp dış görüşü griye boğuyordu.

## Uçuş sahaları
- **Saha adları:** Seçimde "Gölbaşı" ve "Güvercinlik" yazıları kaldırıldı.
- **Meydan:**
  - Çevre çiti içinde biçilmiş çim (pist boyunca şeritler); dışarıda tarla parselleri.
  - Bina çevrelerinde yerleşim zemini.
  - Taksi yolları koyu asfalt ve sarı orta çizgili.
- **Binalar (OSM):**
  - Türüne göre yükseklik ve renk: apartmanlar 4–10 kat, sanayi yapıları, hangarlar.
  - Pencereli ya da oluklu cephe dokusu.
  - Çarpışma modeliyle aynı yükseklik kullanılır. Önceden çizim 3 m, çarpışma 6–15 m idi.
  - Malzeme başına tek ağ; çizim yükü azaldı.
- **Arazi:**
  - Parsel kenarlarında tarla yolları. Fizikte "Tarla yolu" zemini; kavak sıraları yolun yanında.
  - Köye ve çiftliklere 9 m ahşap direkli dağıtım hatları. Fizikte tel engeli olarak sayılır.

## Testler
- `tests/v035-scenarios.test.mjs` (6 test):
  - liste ve sıra;
  - motoru tekrar çalıştırma;
  - tüm hareketler biter, temaslar yumuşak ve engelsiz;
  - otorotasyonlar pistte;
  - her karar seçeneği uçulur;
  - anlatım hedefleri ve lider helikopter.
- `v0341-program` ve `terrain-startup` testleri yeni kataloğa / birleşik bina ağına uyarlandı.
- Başlangıç yüksekliği / sürat sınırı (600 ft / 80 kt) yalnız fizik senaryolarında. Program uçuşlarında 4000 ft / 120 kt.

## v0.35.1 – v0.35.2 (sabah)
- **Anlatım notları:** Uzun bölümlerin ortasına kitaptan notlar eklendi (dönüş, tırmanış, keşif paterni, rüzgâraltı raporu, tepe kalkışı, pas geçme, ilerleme teknikleri). Böylece 30 s'den uzun sessizlik kalmadı.
- **Yaklaşma anlatımı:** Emercensi yaklaşmalarına da eklendi: yaklaşma oranı, temas öncesi, yer hızı analizi.
- **İkaz ışıkları:** Otorotasyon çalışmalarında gaz rölantideyken ENGINE OIL PRESS / ENG FUEL PUMP / DC GENERATOR artık yanmıyor; bunlar yalnız motor gerçekten durunca yanar. MASTER CAUTION resetlenince söner.
- **Anlatım düğmesi:** Tam ekranda boş görünüyordu; etiketi artık her durumda görünür.
- **Dağlık saha:** Daha koyu ve doğal renkler; kar yalnız en tepelerde.
- **Hava taksisi:** Uzun mesafede 14 kt.
- **Yamaç pedi:** Daha yakından seçiliyor.
- **Önbellek:** Sürüm ab205-v0.35.2.

## Bilinen sınırlar
- Program uçuşları kinematik modeldir.
- Dağlıkta kuyruk rotor kaybı yaklaşmasında saha kısa kalabilir.
- Hareket kendi sahasında başladığı için bu durum varsayılan seçimde görülmez.

## v0.35.8
- **Kokpit:** Panel 1,5 cm aşağıda; sağ ucu dar bir düzlükle bitiyor. Yedek pusula panelin sağ kenarında, orta yükseklikte. Kapı alt kısmı, burun bölmesi, tavan ve geri kabin (arka duvar, asker koltuğu, kargo kapısı penceresi) kapalı. Ön cam, tavan pencereleri, kapı üst penceresi ve alt (chin) bubble'lar açık; bubble'dan yer görünür.
- **Helikopter panelleri:** Pistin kuzeyindeki yol üzerinde 4 beton panel (H ve numaralı). 1. panel kalkış, 2. panel yaklaşma paneli. Pist emercensiler, mecburi iniş, ruleli iniş ve otorotasyonlar için.
- **Meydan turu:** 06 pisti için sağdan (ODP nirengileri). 24 pistinde soldan yapılır.
- **Yaklaşmalar:** Doğrudan (straight-in); dönüş yok. Anlatımda "Yaklaşma açısı kesildi" noktası, ardından alçalış başlar.
- **Havırdan kalkış:** GKK'ya kadar 3 ft'te hızlanma; tırmanış GKK ile başlar. GKK titreşimi daha kısa ve hafif.
- **Yüksek keşif:** Yaklaşma ile değil, rüzgâraltı–esas bacak kesişim noktasında biter.

## v0.35.9
- **Kokpit:** Kapı tarafı yeniden açık; tavan ve geri kabin kapalı kaldı. Panelin sağ ucu kırmızı çizgiye göre kavisli bitiyor, dışı açık. Yedek pusula kırmızı kutudaki yerde. Alt bubble'lar burnun sağ ve sol köşesinde, oval.
- **Helikopter panelleri:** Meydan Talimatı md.2-c koordinatlarına göre panel hattı yolunda (060'a göre 1. panel en doğuda, ≈127 m ara). Asfalt, yol ile aynı renk.
- **Meydan turu:** 06 (sağdan) ve 24 (soldan) alt başlıkları. Dönüş noktaları talimat 5-11'deki koordinatlar; 3500 ft MSL rüzgâraltı. Ana başlık 06 + 24'ü sırayla uçar. Nirengi adları anlatımdan çıkarıldı.
- **Liste:** Emercensi ve uçuş hareketi listelerindeki alt satırlar kaldırıldı.
- **Google Earth:** Meydan turu ayrıntısında "Google Earth'te uç": uçuş hesabı KML tura (kokpit + takip) ve 3B AB-205 modeline çevrilir; ZIP/KMZ olarak indirilir.

## v0.35.10
- Google Earth'te kullanılacak bağlantılar ve KML indirme düğmesi uygulamadan kaldırıldı (istek: Google Earth uygulamanın içinde kullanılacak).
- claude.ai sayfası dış sunuculara bağlantıya ve gömmeye izin vermiyor; Google 3B verisi için uygulamanın claude.ai dışında yayınlanması ve Google Maps Platform anahtarı gerekiyor.

## v0.36.0
- **Google 3B (meydan turu):** Sahne araç çubuğunda "Google 3B" düğmesi (yalnız meydan turu). Google Maps Platform anahtarı (Map Tiles API) girilince Google'ın Photorealistic 3D Tiles verisi canlı akıtılır, bizim meydan zemini gizlenir. Karolar ECEF'ten sahneye doğrudan dönüştürülür (pist orta noktası, talimat EK-3), yükseklik pist ortasında ışınla oturtulur. Google atıfları sahnede gösterilir.
- claude.ai sayfası dış bağlantıya izin vermediği için özellik uygulamanın dış yayınında (Netlify) çalışır; claude.ai'de açıklayıcı uyarı verir.

## v0.36.1
- Dış uygulama bağlantıları kaldırıldı: Google 3B (Map Tiles API), Google Earth bağlantıları ve KML/3B model çıktısı, Netlify paketi. Uygulama yalnız claude.ai'de, dış bağlantısız çalışır.

## v0.37.0 · Güvercinlik gerçek saha (açık veri, uygulamaya gömülü)
- **Arazi:** Copernicus DEM GLO-30 (±4 km 30 m, ±7 km 100 m). Bina/ağaç izi açma filtresiyle bastırıldı. Meydan çekirdeği (çit içi) eski düz pist yüzeyi; dışarıda 450 m'de gerçek araziye geçiş. Pist ortası DEM'de 817.9 m (talimat 818.8 m).
- **Zemin görüntüsü:** Sentinel-2 cloudless 2023 (EOX, CC BY-NC-SA 4.0; Copernicus Sentinel verisi) — zeminde ±3 km, ufukta ±7 km.
- **Yapılar:** OpenStreetMap'ten ±4.3 km: 14 273 bina, 5 869 yol, 105 apron/taksi yolu; pist çerçevesine hizalandı (boyuna −9 m, enine +3.7 m). Ağaçlar OSM orman/çalılık/park alanlarında.
- **Panel hattı:** OSM'ye göre pistten −159 m (önceki veri 27 m kaymıştı; talimat ≈ −157 m).
- **Meydan turu:** Dönüş noktası geride kaldıysa daire çizilmez, sonraki bacağa geçilir. Temsili meydan elektrik hattı kaldırıldı.

## v0.38.0 · Kullanıcının helikopter modeli
- Helikopter artık kullanıcının verdiği Jandarma UH-1/AB-205 modeli (UH1_Jandarma_Iki_Pilot). Geometri, UV ve dokular olduğu gibi; yalnız kaynakta tekrarlanan köşeler birleştirildi (görüntü aynı, dosya 13,5 → 6,3 MB).
- Modelin basit saykılıkları ve sağ kollektifi kaldırıldı, yerlerine AB205_Saykilik_Kollektif paketindeki sağ/sol saykılık ve sağ/sol kollektif kondu (sol kollektif sol koltuk ile kapı arasına). Kumandalar ve pedallar uçuştaki kumanda konumunu izler.
- Kazalı model (UH1_Crashed_Jandarma) yalnız en sert temasta görünür: kuyruk bumu ayrılan sert darbe ya da kabini ezecek kadar sert darbe. Daha hafif temaslarda kademeli deformasyon sürer.
- Kokpit görünümü modelin kendi kokpitidir. Göz sağ pilotun göz noktasındadır. Kendi canlı aletlerimiz fotoğraftaki düzenle modelin panel yüzüne yerleştirildi. FIRE ve RPM ışıkları modelin kendi ışık yuvalarına, misc paneli panelin sol altına, pedestal fotoğrafı ve ikaz paneli modelin pedestal üstüne kondu. Başüstü konsol tavanın eğimiyle yerleştirildi; kollektif anahtar kutusu sağ kollektifin başına takıldı. Dış görünümde model hiç değişmeden görünür.
- Uçuş fiziği ve temas noktaları değişmedi (rotor mili fizik referansındaki x=-0,3'te).

## v0.38.1–0.38.2 · Kokpit düzeltmeleri
- Panel siperi kokpit görünümünde gizli; MASTER CAUTION RPM/FIRE hizasında. Panel kokpitte siyah (saten).
- Pedestal: modelin kutusu kokpitte fotoğraf genişliğine daraltıldı; misc paneli (CHIP DET / FORCE TRIM / HYD CONT) pedestalın önünde, ardından telsizler ve ikaz paneli. Fotoğraf yüzeyleri model yüzeyinin üstüne alındı (önceden yer yer gömülüyordu).
- Pedestal, başüstü ve sigorta panelinin köşesinde sarı yuvarlak odak düğmesi: tıklayınca panel ekranı doldurur, tekrar tıklayınca (veya çift tıkla) geri döner.
- Bakış 8 cm aşağı, 1,5 cm geri; pedallar pilota 13 cm yaklaştırıldı (panel değişmedi). Saykılıklar tabanından %85.
- İkili takometre: uzun ince MOTOR ibresi, kısa geniş ROTOR ibresi; ayrıldıklarında ikisi ayrı okunur. Alet yüzleri iki kat çözünürlükte.
- Anahtarlar panelden dışarı çıkar ve seçili etikete doğru yatar (ilk etiket = üst).
- Kollektif anahtar kutusu sağ kollektif başını tamamen kaplar; yüzünde fotoğraf.
- Pusula VSI'nın sağına alındı. Kumanda göstergesi kokpitte küçük olarak görünür. Sağdaki ALÇALIŞ → VARYO (+ tırmanış, − alçalış).
- Kokpitte tıklama artık araziden saha seçmez. Karar paneli açıkken anlatım kutusu gizlenir.
- Kokpitten rotor düzlemi: dönen rotor disk olarak, yavaş/duran rotor palleriyle görünür.
- Ana model artık kullanıcının kendi GLB dışa aktarımı (geometri birebir aynı doğrulandı).

## v0.38.3 · Görüntü
- Gökyüzü ışığı (çevre haritası): boya, metal ve kokpit yüzeylerinde yumuşak yansıma; helikopter yakınında daha keskin güneş gölgesi; kokpit içi de gölge alır; tüm dokularda anizotropik süzme.
- Fotoğraf panelleri ışıkla aydınlanır, gölgede okunur kalır. Meydan uydu görüntüsü renkleri dengelendi.
- Panel odak düğmeleri küçüldü; tıklayınca kamera panelin tam karşısına geçer ve paneli ekrana sığdırır (pedestal görünümü misc paneliyle birlikte). Tekrar tıklama / çift tık: geri.
- Tam ekranda ikaz kutusu sol alt köşede küçük; kokpitte de görünür. Kumanda göstergesi kokpitte görünür.

## v0.38.4 · Kokpit işlevleri
- Yanan ikaz lambaları parlar; alet camlarında yansıma; ibreler kısa gecikmeyle süzülür.
- INST LTG düğmeleri gün batımı / gecede alet, panel ve pusula ışığını açıp kısar; kokpitte tavan ışığı.
- Saat yüzüne tıkla: kronometre başlat / durdur / sıfırla. Alet üzerine gelince anlık değer.
- LOW RPM AUDIO açıkken düşük rotor devrinde korna; yüksek devirde ikaz sesi. Anahtar tıklama sesi.
- LANDING LIGHT / EXT-RETR, SEARCH LIGHT, POSITION (STEADY/FLASH, DIM/BRIGHT), ANTI COLL (dönen kırmızı ışık), WIPERS + WIPER SEL (modelin silecekleri), VOLTMETER SEL (DC voltmetre) çalışır.
- Kısayollar (kokpit): 1 panel, 2 pedestal, 3 başüstü, 4 sigortalar, 0 ileri; H kontrol çubuğunu gizler/gösterir.
- Rotor diski devir düştükçe belirginleşir.

## v0.38.5 · Uçuş hareketleri kitabıyla karşılaştırma
- Yüksek sesle söylenecekler eklendi: tırmanış / süzülüş “… FİT TERK”, “SON 100 FİT”, 50 ft’te tork +2; tırmanışlı / süzülüşlü dönüşte irtifa ve dönüş istikameti temiz; havırda her hareketin ikazı ve “TAMAM”; meydan turunda “YAN BACAK TEMİZ”, “KAPI TEMİZ”, rüzgâraltı raporu, “DÜZ UÇUŞ TORKUM … DUR”, “ESAS BACAK TEMİZ”, “SON YAKLAŞMA HATTI TEMİZ”; mecburi inişte 400 ft’ten önce “ROTOR YEŞİLDE, SÜRAT …, N1 …, TRİMDE, İNİŞ YERİM …”, “GAZ KOLU TAM AÇIK, PAS GEÇİYORUM / GÜÇLÜ KURTARIYORUM”, MAYDAY ve transponder/gavırnır EMER; otorotasyonlarda “ROTOR YEŞİLDE, N1 RÖLANTİDE, TRİMDE”.
- Eksik hareket eklendi: Alçak irtifa otorotasyonu (100 ft, 90 kt, pist üzerinde yere kadar).

## v0.39 · Gerçek sahalar, aerodinamik ve karar noktaları (gece güncellemesi)
- Dağlık saha kaldırıldı, yerine **Tepeler** sahası: Alagöz – Ballıkuyumcu – Hisarlıkaya (merkez K39.762 D32.523, 9×9 km). Copernicus GLO-30 yükseklik, Sentinel-2 2023 uydu zemini, OSM yapı / yol / hat; ağaçlar uydu görüntüsünden tespit edildi (meşe çalılığı, dere boyu kavak/söğüt, meyve bahçesi). 2, 3, 4, 5, 6 nolu tepeler, Doğu kapalı ve diğer kapalılar KML'den; MT paternleri (R/A–E/B kesişimi, S/Y noktası, irtifalar) veri olarak.
- **Arazi** sahası 39°42'41.52"N 32°46'29.70"E merkezli gerçek Gölbaşı verisiyle yeniden kuruldu (9×9 km): temsili teller ve tarla/çiftlik dokusu kaldırıldı, yalnız OSM'deki 5 hat; ağaç kümeleri uydudan, OSM ormanları sık çam.
- Keşifler / tepe-sırt: 2 nolu tepe ve 2 nolu MT hattı (rüzgâra göre patern), yüksek keşif dairevi paternde (iniş yeri sağda, R/A irtifası, 70 kt), EK-B maddeleri gerçek değerlerle (engeller, mecburi iniş sahaları, rüzgâr, güneş, iniş-kalkış ve pas geçme istikameti, temas noktası, R/A–E/B), 90 kt rüzgâraltı, esas bacak, son yaklaşma, alçak keşif, yer keşfi + PPC, sabit irtifada hızlanarak kalkış. Kapalı bölge Doğu kapalıya (DK MT paterni). İlerleme, gizlenme, arazi uçuşu, kol uçuşu Tepeler'de.
- Kokpitte baş: “… TEMİZ” ikazlarında dönüş tarafına, yüksek keşifte iniş yerine bakıp çapraz kontrol için öne döner.
- İkazlarda gerçek değerler: {TQ}, {ALT}, {FUEL}, {WIND}, PPC (ör. “DÜZ UÇUŞ TORKUM 34, YAKIT 920 LİBRE”). Altimetre arazinin MSL yüksekliğini gösterir.
- Tüm hareketlerde karar noktası var; seçilen karar uçulur. Düz uçuşta dönüşlerde elle uçuş (“Elle uç” düğmesi).
- S dönüşleri ve irtifa kaybı daireleri kaldırıldı (otorotasyonda sürat ile süzülüş açısı, güçlüde düz hatta süzülüş). Adımlar takılırsa zaman aşımıyla geçilir; taksi yolu ağaç/kaya üstünden.
- Saha seçimi son yaklaşma hattındaki telleri engel sayar (tel önüne iniş yok); ağaçlara iniş emercensisi en kısa ve seyrek ağaçlı bölgeyi seçer.
- Meydan: kule talimattaki koordinata (K39°56'20" D032°44'26"), iki pist arasındaki temsili yol kaldırıldı, meydan turu kalkış bacağı yarıya indi; kapı ikazları DUMAN / BEYSUKENT.
- Aerodinamik (program uçuşları): hamle, tepe/sırt rüzgârı (yamaçta yukarı, rüzgâraltında aşağı akım), GKK + geriye savrulma + enine akım saykılık düzeltmesi, öteleme eğilimi (sol kızak alçak), girdap halkası, rüzgârgülü/LTE pedal yükü, gavırnır düşmesi (droop), otorotasyonda rotor devri (kollektif, fleyır, ilk kollektif), motor tahriki yokken sağ pedal. PPC modülü (yoğunluk irtifası, IGE/OGE havır torku, azami tork, güç payı, azami havır ağırlığı).
- Pedal animasyonu yönü anlatımla aynı; otorotasyonda ilk kollektifte sağ pedal (kitap).
- Suya inişte kapılar: güçlüde kokpit kapıları atılır, kabin kapıları açılır; güçsüzde suya girmeden açılır.
- Anahtar fiziği: HYD CONT OFF → HYD PRESSURE, GOV EMER → GOV EMER ikazı, FUEL OFF → yakıt basıncı düşer / pompa ikazları. “DE-ICE / MAIN GEN / BLEED AIR” adımları artık kumandada gösterilip uygulanır (Türkçe ı/i eşleşme hatası).
- Kokpit anlatım kutusu üst ortada; ufuk halkası z-titremesi giderildi; ses otomasyon birikimi (çatırtı) ve yerde düşük RPM kornası susturuldu. Orman ve su sahaları da 8 km.

## v0.39.1 — Tepeler sahası, gerçek Gölbaşı, aerodinamik etkiler, karar her senaryoda
- Dağlık saha kaldırıldı, **Tepeler** (Alagöz–Ballıkuyumcu–Hisarlıkaya, ±4.5 km gerçek arazi, ±9.5 km ufuk): Copernicus GLO-30, Sentinel-2 2023 zemin, OSM yapı/yol/hat, uydu görüntüsünden ağaç tespiti (10 m ızgara: meşelik, dere boyu kavak/söğüt, meyve bahçesi). KML iniş yerleri ve MT paternleri (tepeler-sites.js).
- Keşifler / tepe-sırt: 2 nolu tepe, 2 nolu MT hattı (rüzgâra göre patern); kapalı bölge: Doğu kapalı (DK MT). EK-B yüksek keşif maddeleri gerçek verilerle (engeller, mecburi iniş sahaları, rüzgâr, güneş, iniş/pas geçme istikameti, R/A–E/B); keşifte baş iniş yerine döner, çapraz kontrolde öne.
- Arazi sahası 39°42'41.52"K 32°46'29.70"D merkezli gerçek Gölbaşı; uydurma enerji hatları ve tarla ızgarası kaldırıldı.
- Saha seçiminde son yaklaşma hattındaki tel elenir; ağaçlara iniş en kısa/seyrek ağaçlara; S dönüşü ve irtifa kaybı dönüşleri kaldırıldı; adım zaman aşımı (takılma yok).
- Meydan: kule talimattaki koordinatta; pistler arası temsili yol kaldırıldı; tırmanış bacağı yarıya indi; kapılar DUMAN / BEYSUKENT.
- Pedal yönü (sağ = ileri), otorotasyonda sağ pedal; ı/i eşleşme hatası (DE-ICE, MAIN GEN…) giderildi.
- Karar noktası olmayan 9 harekete karar eklendi. Elle uçuş: Düz uçuşta dönüşler.
- İkaz metinlerinde gerçek değerler ({TQ}, {ALT}, {WIND}, {PPC}); altimetre MSL; PPC (TM 55-1520-210-10 bölüm 7 yaklaşımı).
- Aerodinamik: hamle, sırt rüzgârı, GKK/blowback/enine akım, öteleme eğilimi, girdap halkası, rüzgârgülü, gavırnır droop, otorotasyon RPM.
- Anahtar fiziği: HYD CONT, GOV EMER, FUEL ikaz ve göstergeleri. Suya inişte kapı animasyonu. Su yüzeyi kumlanması, ufuk titremesi, ses otomasyonu birikmesi giderildi.
