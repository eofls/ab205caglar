# v0.32.0 — 21 Ekim 2026 hızlı güncelleme

## 1. Tek fizik modeli
- "Fizik modeli" seçeneği kaldırıldı. Tüm uçuşlar kalibre **enerji modeliyle (energy-1.7)** hesaplanır.
- Bu model, pal elemanı çalışmasından gelen pal stall itki sınırını içerir.
- Eski kayıtlarda `physicsModel:'blade'` varsa, yükleme sırasında enerji modeline çevrilir.
- `rotor-bemt.js` kodda kalır. Tam pal elemanı entegrasyonu, iniş sonuçları enerji modeline eşitlenince yeniden açılacak.

## 2. Pilot tecrübesi (3 seviye)
Koşullar sekmesinde "Fizik modeli" yerinde artık **Pilot tecrübesi** var. Hazır akış ve rehberli dallarda etkisi şöyle:

| Seviye | Etkisi |
|---|---|
| Gelişmekte | Arızayı geç fark eder (≈1.4 s). Fleyırı alçakta, son kollektifi erken uygular. |
| Yetkin | Temel ayar. |
| Deneyimli | Son kollektifi 15 ft'e daha yakın uygular. |

İkinci pilot ayarı Mürettebat bölümünde kaldı.

## 3. Kokpit (gönderilen fotoğraflara göre)
- **Gösterge paneli:** Koyu yeşil-gri panel ve parlama siperi.
- **Orta konsol:** Telsiz kutularıyla eklendi.
- **Saykılık:** Siyah tutamak ve kırmızı düğmeler. Uçuştaki ileri/yan saykılığa göre hareket eder.
- **Kollektif:** Sol tarafta, anahtar kutulu başlık ve sürtünme bileziği. Kollektif konumuna göre kalkar ve iner.
- **Göstergeler:** Panel diliyle İngilizce etiketler (RPM, AIRSPEED, RADAR ALT, VERTICAL SPEED), siyah çerçeveler.

## 4. Altyapı (bekleyen H ve I maddeleri)
- **H – Eğitmen–öğrenci:** `instructor-room.js` iskeleti eklendi.
  - Paylaşılan oda üzerinden senaryo ve arıza tetiklemesi taşınacak.
  - Henüz arayüze bağlı değil.
- **I – Paketleme:** PWA dosyaları (manifest, servis çalışanı, ikonlar) hazır. Önbellek sürümü v0.32.0.

## Testler
- Bir test güncellendi: "pal modeli seçilebilir" testinin yerine "tek modele çevrilir" testi geldi.

## Akşam güncellemesine kalanlar
- Tüm acil durumlar ve uçuş hareketleri.
- İlave arızalar.
- Çevrimdışı uygulama.
- Tam pal elemanı entegrasyonu.

# v0.32.1 — 21 Ekim 2026 (geri bildirim düzeltmeleri)

## Tam ekran kokpit
- Göstergeler artık kontrol çubuğunun üstünde duruyor.
- Kontrol çubuğu küçültüldü: zaman etiketleri ve not satırı gizli.
- Kokpitte göstergelerle aynı bilgiyi veren devir/sürat yazıları, hava şeridi ve pusula gizlendi.
- "Şu anda ne oluyor?" kutusunda metin 4 satırla sınırlı; üzerine gelince tamamı açılıyor.

## Kokpit bakışı
- Ön cam, cam çerçevesi, orta dikme, sızdırmazlık şeritleri ve silecekler kokpit bakışında gizleniyor.
- Dış bakışlarda bu parçalar duruyor.

## Elle uçuş
- Aday saha ekleme ve "Saha adaylarını gör" düğmesi kapalı.
- Zaman çizelgesindeki karar etiketleri gizli.
- T noktası anlık hız ve alçalış oranına göre canlı hesaplanıyor; yalnız alçalırken görünüyor ve kalan saniyeyi gösteriyor.

## Arayüz sadeleştirme
- **Kaldırılanlar:**
  - Giriş başlığı ve uyarı şeridi.
  - "İlk ayrıntılı senaryo" kartı.
  - "Sonraki aşama" kartı.
  - "Sayısal model veri durumu" kartı (aynı girdiler Hava aracı sekmesinde).
  - Sahne başlığı ve "deneysel hesap" etiketleri.
  - Koordinat satırı, "Dünya ekseni" yazısı.
  - Bekleyen (henüz verilmemiş) karar satırları.
- **Açıklamalar:** Seçeneklerin ve bölüm başlıklarının yanındaki küçük yuvarlak "?" düğmesine taşındı; tıklayınca açılıyor.
- **Arazi/harita atfı:** Lisans gereği görünür kaldı.
- **Sürüm etiketi:** v0.32.1.

# v0.32.2 — 21 Ekim 2026 (geri bildirim düzeltmeleri 2)

## Karar akışı
- Seçeneğe tıklamak akışı başlatmıyor.
- Seçim yapılınca T ve sahne güncelleniyor, panelde **Devam ▶** düğmesi çıkıyor.
- Seçim Devam'dan önce değiştirilebilir.

## Açıklamalar ("?")
- Açıklama, farenin sağ üstünde küçük bir kutuda açılıyor; sayfanın içinde yer kaplamıyor.
- Kutu dışarı tıklayınca, Esc ile veya kaydırınca kapanıyor.

## "Şu anda ne oluyor?"
- Metinler kısa ve teknik.
  - Meteoroloji: rüzgâr bileşenleri, yoğunluk irtifası ve etkisi, görüş.
  - Arıza belirtileri ve ilk tepki, tahrik yolu, saha seçimi ölçütleri.
  - Temas anı değerleri.
- Model durumu ve doğrulama çekinceleri bu kutuda gösterilmiyor; rapor ve kaynak sayfası değişmedi.

## Arayüz
- Kumanda şemalarında yalnız KOLLEKTİF / SAYKILIK / PEDAL adları kaldı.
- Kaynak ve Geliştirme kaydı sayfalarının başlıkları küçültüldü.
- Telefon görünümünde (390 px) yatay taşma yok.
- Pilot tecrübesi seçimi elle uçuşta gizleniyor.

## Elle uçuş
- Tam ekranda ekran kumandaları (kollektif, saykılık pedi, pedal) sağ altta duruyor.
- Kokpit bakışında hazır akış hayaleti gizleniyor; görüşü kapatıyordu.

## Uçuş
- **Alçak ve süratli girişler (≤90 ft):** Saykılıkla girişten itibaren sürat azaltılıyor.
  - Rehberli 40 ft / 70 kt temas: 2.0 m/s düşey ve 48 kt yer süratinden → 1.6 m/s ve 7 kt'a.
- **Hazır akış iniş sahası:** Saha artık sürati düşürmek için gereken mesafenin içinden seçilmiyor.
  - 40/70'te saha aşımı 219 m'den 6 m'ye, 100/70'te 170 m'den 55 m'ye indi.
- **Ağır koşul notu:** Ağırlık ≥ 9000 lb veya yoğunluk irtifası ≥ 6000 ft olduğunda değerlendirmede gösteriliyor.
- **Bilinen sınır:** 9500 lb ile 8000 ft / 30 °C birlikte (yoğunluk irtifası ≈ 11 700 ft) temas hâlâ çok sert (≈10 m/s).
  - Sebep: rotor devri girişte 277'ye düşüyor ve fleyırda itki pal stall sınırında kalıyor.
  - Bu koşul uçuş zarfının dışında. Model tarafı akşam ele alınacak.

## Testler
- 180 test: 177 eski ve 3 yeni (tests/v032.test.mjs).
