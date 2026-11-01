# v0.24.0 — 19 Ekim 2026

## Kaynak incelemesi
- 2-UH-1-AB-205-Operator-Manual.pdf, libfile_8bed0326f6bc8191b7e4ac118f4754fb, PDF185–187: §9.1.9c düzenli veya dalgalı kısmi güç; evrensel yüzde yok. §9.1.9ç kuyruk rotoru temasından kaçınma ve IGE havırda kolektif azaltmama istisnası. PDF116 §7.2 tork kartları, çevre/konfigürasyon ve kalibrasyon faktörü; psi→güç dönüşümü kalibrasyonsuz yapılmadı.
- Uçuş Hareketleri(2).pdf, libfile_c390ef0b8fec819198ccaaeaca393c9d, PDF104–106: yaklaşık100ft fleyır, yaklaşık15ft/azalan çöküşün tekrar artmasıyla ilk kolektif, kalan kolektifle koordineli ufkiyet; erken/geç kullanım ve kuyruk temas riski. Eğitim rölanti dönüşü gerçek motor arızası toparlanması olarak kullanılmadı.
- TM55-1520-210-23-1D.01, libfile_fffda310e7b081919e457fbe5192d537, PDF158: sert iniş sonrası skid/crosstube, kapı/kaporta uyumu, motor/transmisyon bağlantıları, kuyruk bumu, kumandalar, mast ve rotor temas incelemeleri. Bu liste kırılma eşiği değildir.
- Önceki AB205_Hasar_Verisi_Kapanis_2026-10-15.md güncel içeriği tekrar okundu: doğrulanmış AB205 kuvvet-strok/kırılma kalibrasyonu hâlâ yok.
- 14 Ekim WhatsApp model referansları yeniden bulundu; çok açılı 10.49.37(1), arka10.49.00(1), ön10.49.15(2) görselleri doğrudan incelendi. Kaynak GLB/CAD değildir. Birebir kopya iddiası yok.

## Düzeltmeler
- Kısmi dal adı: Kısmi güç kaybı / sabit artık güç. %35, kitap değeri değil deneysel senaryo kapasitesi. Başlangıç dengeli uçuş kayıp hesabı (sürükleme, yer etkisi, disk eğimi dahil) tek referenceShaftPowerW; artık kapasite=.35*referans. Serbest dönüş kapısı aktarılan gücü azaltabilir. N2 yüzdesi ve azami T53 gücü yüzdesi değildir. Dalgalı motor modeli eklenmedi.
- Başlangıç sabit uçuşunda saykılık integrasyonu artık yan tork düzeltmesine yürümüyor; başlangıç dengesi korunuyor. Önceki sabit uçuş / hareket eden kumanda uyumsuzluğu giderildi. Bu, gerçek helikopterde hiçbir yan trim gerekmediği iddiası değildir.
- Yeni senaryo/başa dön/reset: customSites ve hiddenSites temiz, sayaç3. Kayıt yükleme ve zamanda geri sarma sahaları korur.
- Uygulama metinleri saykılık olarak standartlaştırıldı; kaynak PDF metinleri değiştirilmedi.
- Kararlı son kollektif seçimi artık pending: eşik geldiğinde finalPull sorusu açılır, otomatik uygulama yok. Kullanıcının erken/şimdi komutu veya hazır izleme modu ayrı tutulur. Alçak havırda da finalPull sorusu; soru sırasında simülasyon durur.

## Görsel ve hasar modeli
- Yuvarlatılmış gövde kesitleri, yan desenler, daha geniş iki ana pal, yüksek kuyruk rotoru, fin ay-yıldız, ayrı motor/mast/transmisyon/kumanda/skid grupları.
- Prosedürel bozkır dokusu, taş/çalılık, uzak sırtlar ve ışık; Canvas için yüzey renkleri/gölgeleme. Fotogrametri, gerçek Ankara DEM veya orijinal model değildir. Uzak tepeler/dekor bitki kaya geometrileri çarpışma engeli değil; seçilebilir zemin ve temas ortak terrainHeight kullanır.
- Temas: skid, kokpit/taban, kuyruk bumu, stabilize ve rotor süpürme zarflarının zemine açıklığıyla ilk temas. Yükseklik tek bir gövde merkezine indirgenmez. Rotor elastik flapping/pal-ağaç etkileşimi çözülmez.
- Parça değerlendirmesi13 grupta: sol/sağskid, kabin, kokpit, motor, transmisyon, mast, kumandalar, kuyruk bumu/rotoru, ana rotor, yatay/dikey stabilize. İç parçalar yük aktarımıyla taranır, gerçek malzeme simülasyonu yok.
- Görsel deformasyon ve sınırlı parça ayrılması ilk temas parçası/enerji/rotor devrine bağlı, deterministik ve geri sarılabilir. %100 temas endeksi parçalanma komutu değildir. Rastgele patlama/yangın eklenmedi.
- İlk parça teması sonrasında indirgenmiş kayma/sekme/yerleşme modeli devralır; tam 6DOF çarpışma sonrası uçuş ve zincirleme çarpışma çözümü değildir. Parça hasar eşikleri eğitim benzetimidir.

## Kontrol
140 Node testi geçti. Önceki testlerde son kararın düşük havırda saha kararı yerine finalPull olması güncellendi. Kısmi güçte fleyır yapılmaması için yalnız düşey hız cezası dayatılmadı: kötü dal daha büyük düşey hız ve en az2kat yatay enerji taşıyor. Testi geçirmek için hasar/çöküş eklenmedi.
Bulut tarayıcıda WebGL başlatılamıyor; Canvas kontrolü yayın sonrasında yapılacak. WebGL materyal/gölge görünümü bu ortamda doğrulanmış sayılmayacak.

## Devam
Özgün model dosyası edinilirse fotoğraftan üretilmiş gövdeyle değiştirilebilir. Hasar sonrası zincirleme temas/rotor esnekliği, saha dekor engelleri ve pilot becerisine bağlı kumanda profilleri ileriki adımlar.

## v0.24.1 canlı kontrol
Başlangıç saykılık göstergesi konum korunuyor olarak gözlendi. Canvas yakın görünümünde uzun boya üçgenleri gövdeyi kesiyordu: şeritler gövde kesitini izleyen küçük yüzeylere bölündü; arka yüzler ayıklandı ve çizim kenar boşlukları kapatıldı. Ana rotor yere çarparsa yer sonrası dönüşün sönümü hızlandırıldı; kuyruk rotoru temasında kuyruk dönüşü temas açısında durur. İlk temas bildirimi parçanın adını gösterir.
Bu bulut tarayıcıda WebGL ve native tam ekran açılmadı; normal Canvas görünümü incelendi. Önceki140test ve düzeltme sonrası ilgili17test başarılı.

### v0.24.2 — Uyumluluk çizicisi
Yakın planda boya/cam/gövde üçgenlerinin ortalama derinlikle yanlış sıralanması, helikopter için piksel bazlı derinlik tamponuyla giderildi.
