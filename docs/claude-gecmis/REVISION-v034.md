# v0.34 · Senaryolar: Emercensiler ve Uçuş hareketleri (2. tur)

## v0.34.0 · yapı
- **Koşullar:** "Güç kaybı modeli" seçimi kaldırıldı. Tam ve kısmi güç kaybı artık Emercensiler listesinde.
- **Senaryolar sekmesi:** Eski 5 hazır senaryo kaldırıldı. Yerine iki seçenek var:
  - **Emercensiler:** Operatör talimnamesi 9. bölümün tamamı (55 kayıt). Kaynaklar: 9.1.8–9.1.44 ve Tablo 9-1 ikaz segmentleri; anlatım için Uçuş Hareketleri emercensi usulleri.
  - **Uçuş hareketleri:** Uçuş Hareketleri 1. bölüm, temel ve tekamül hareketleri (27 hareket). Emercensi yok; normal güçlü uçuş, anlatım ve görselleştirme.
- **Fizik ayrımı:**
  - Motor gücü kaybı türleri enerji / pal fiziğinde kalır: tam ve kısmi güç kaybı, havırda, alçak irtifada, şaft, kavrama tekrar birleşmiyor, güçsüz suya iniş.
  - Diğer emercensiler ve tüm hareketler program uçuş modelinde uçulur (kinematik, trimli).
- **Kararlar:**
  - Emercensi: ilk eylem (usul / hata / gecikme), iniş aciliyeti, son yaklaşma tekniği.
  - Hareket: kendi teknik kararları. Standart dışı seçim uçulur ve açıklanır.
- **Değerlendirme:** Emercensi için kararlar usule göre, uyarılar, temas değerleri ve usul. Hareket için standartlar.

## v0.34.1 · gözden geçirme (gece)

### Hazır akış otopilotu
- **Saha seçimi zamana göre:** "Mümkün olan en kısa zamanda" en çabuk inilebilecek sahayı seçer. Hesapta inişin gerektirdiği alçalma mesafesi ve dönüşün yayı da var.
  - Önceden yakın ama yüksekte kalınan sahalar uzun dönüşler doğuruyordu. Bu yüzden "en kısa zamanda", "en uygun şekilde"den yavaş çıkıyordu (85 s / 56 s).
  - Şimdi ikisi de yaklaşık 55 s.
- **Koordineli dönüşler:**
  - İleri uçuşta iz, yatış sınırlı bir hızla döner (emercensi 25°, otorotasyon 30°).
  - Ters yöne dönüşte sürat 50 knot'a düşürülür.
  - Eski hız-vektörü denetleyicisi dönüş yerine yavaşlayıp duruyordu.
  - Yatış açısı iki kez sayılıyordu; düzeltildi.
- **Yaklaşma:**
  - Saha seçilirken son yaklaşma yönü de seçilir: ağaç, bina ve yükselen arazi açısı (ruleli ≤ 8°, normal ≤ 15°) ve ruleli için 80 m boş rule mesafesi aranır.
  - Uçak önce o hattın uzantısındaki kapıya gider.
  - Yaklaşma açısı engelleri 4 m aşacak kadar dikleştirilir.
  - Yükseklik saha kotuna göre tutulur (yamaç / vadi).
  - Süzülüş yolu ileri beslemelidir: önceden sahaya ~10 ft yüksek varılıyordu.
- **Ruleli iniş:**
  - Son 30 ft'te yuvarlama: temas alçalışı ~0,5 m/s.
  - Biraz yüksek varılırsa düz devam edilir; geri dönülmez.
  - Rule mesafesi gerçek final yönünde kontrol edilir, kapalıysa kısa nişan alınır.
- **Otorotasyon:**
  - Süzülüş planı fleyır kapısına göre yapılır (75 ft, fleyır mesafesi).
  - Uzak sahaya 75 knot, yakına 55 knot; çok yakına 45 knot ile dik süzülüş.
  - Yüksekte kalınırsa saha etrafında dönüşlü süzülüş yapılır; dönüşten çıkış, dönüşte kaybedilecek yükseklik hesaba katılarak yapılır.
  - Fleyır daha güçlü (≈0,55 g).
  - Fleyır başında, fleyırın bittiği yer saha değilse önündeki en iyi inilebilir ve engelsiz nokta seçilir ("İniş noktası düzeltildi").
- **Engel teması:**
  - Rotor / gövde ağaç veya binaya girerse temas olarak sayılır; önceden içinden geçiliyordu.
  - Dağlık alanda en-route yükseklik, önündeki 7 s'lik arazinin 25 m üstünde tutulur.
- **Hareketler:**
  - Yamaç pedine uzun taksi, ağaç ve kayaları ~10 ft aşan hava taksisi olarak yapılır.
  - Derin yaklaşmada geç yavaşlama seçeneği pede yaklaşırken artık durmuyor.

### Karar vererek ilerle
- **İlk eylem hataları:** Ruleli iniş gerektiren emercensilerde hata seçeneği artık "havıra kadar yaklaşma" değil; o seçim son yaklaşma tekniği kararında. Her hatanın kendi uçuş sonucu var:
  - **Drop kompensatör:** büyük ve seri kollektif → RPM limit dışı dalgalanır (RPM ikazı).
  - **IGV kapalı:** gücü artır → tork limit üstü, rotor devri düşer, helikopter alçalır.
  - **Sabit pedal düşük / yüksek güç:** gücü artır / azalt → burun sağa / sola kaçar, yana kayış.
  - **Hidrolik / kumanda sertleşmesi:** yavaşla ya da zorla → kumanda salınımı (PIO).
  - **Servo sıkışması:** anahtarı geç kullan → saykılık sağ ileri (sürat artar, dalış, sağa dönüş) ya da kollektif tam yukarı (tırmanış, rotor devri düşer) 8 s sürer.
- "Uçuşa devam" türü hatalar iniş kararını ~20 s geciktirir. Arıza gerçekten ilerleyebilir: motor durur, otorotasyon.
- Kuyruk rotoru emercensilerinde (güç kaybı, parça kopması) otorotasyonu bitirme kararı (ruleli / 75 ft'te yavaşla) artık soruluyor.
- **Seçenek yazıları:** Usul seçenekleri kısa eylem adıyla gösterilir (≤ 72 karakter).
- **Değerlendirme:**
  - Usule uygun olmayan ama riskli de olmayan seçim "Kabul edilebilir" olarak işaretlenir.
  - Uygun olmayan seçimin altında usulün seçeneği yazılır.

### Görünüm
- **Kumanda görünümü (emercensiye göre):**
  - Sabit pedal kilitli kalır.
  - Kuyruk rotor etkinliği kaybında tam sol pedal görünür.
  - Kuyruk rotoru kayıplarında pedal "etkisiz" yazar.
  - Servo sıkışmasında saykılık ya da kollektif sıkışık görünür.
  - Overspeed'de kollektif "artırıldı" yazar.
  - Kollektif titreşimi gösterilir.
  - Hidroliksizlikte "ağır" yazar.
  - Gaz kolu durumu not satırında: tam açık / elle kontrol / tam kapalı / susturma.
- **Duman ve alev:**
  - Motor yangınında egzozdan koyu duman izi ve egzozda titreyen alev görünür (motor çalışırken).
  - Elektrik yangını ve dumanda kabinden açık renkli duman çıkar.
  - Zaman çubuğuyla bir ana gidildiğinde duman izi uçuş geçmişinden yeniden kurulur.
- **Titreşim:** Kokpit görünümünde titreşimli emercensilerde göz noktası sarsılır.
- **Çevrimdışı önbellek:** Sürüm v0.34.1'e yükseltildi; yeni modüller listeye eklendi. Önceden eski önbellek eski dosyaları sunabiliyordu.

## Testler
- `tests/v0341-program.test.mjs` (6 test):
  - Tüm emercensiler hazır akışta biter; güçlü inişler yumuşak ve engelsiz.
  - Her kararın her seçeneği sonuna kadar uçulur.
  - Kısa etiketler.
  - Kumanda görünümü.
  - "En kısa zamanda" ≤ "en uygun".
  - Tüm hareketler biter.
- Tam test takımı: 194 test.

## Doğrulama taramaları
- **Tüm seçenekler:** 211 karar varyantı; takılan ya da bitmeyen yok.
- **Referans iniş, dört sahada (arazi / meydan / dağlık / orman):** güçlü inişlerin hepsi ≤ 0,8 m/s.
- **İstisnalar:**
  - Dağlıkta kuyruk rotor kaybı ruleli otorotasyonu: 2,5 m/s / 44 kt.
  - Ormanda 500 ft'te kuyruk rotorundan parça kopması: açıklığa yetişemiyor, ağaç teması.
- **Kasıtlı hatalar:** Tekrar çalıştırma denemesi ve kuyruk rotorunda yavaşlama gibi hatalar beklenen sert sonucu verir.

## Bilinen sınırlar
- Program uçuşları kinematik (trimli) modeldir. Elle uçuş yalnızca enerji fiziğindeki güç kaybı türlerinde var.
- Dağlık sahada ruleli otorotasyon sert, ormanda alçak irtifada otorotasyon açıklığa yetişemeyebilir.
- Köy enerji hatları ve tarla yolları (1. turdan) henüz eklenmedi.
