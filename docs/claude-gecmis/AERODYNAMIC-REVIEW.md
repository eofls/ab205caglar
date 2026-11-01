> Güncel v0.18.0 denklemleri ve değişen varsayımlar: EMERGENCY-REVIEW-v018.md. Aşağıdaki önceki sürüm açıklamaları tarihsel bağlamdır; güncel kolektif aktarımı/yaw için yeni inceleme esas alınır.

# IAS, rotor dinamiği ve sonuç incelemesi — 15 Ekim 2026

## Kaynaklar ve çıkarımlar

- FAA HFH, Bölüm11, basılı11-2–11-4, 11-9–11-10, 11-15–11-16: otorotasyon enerji akışı, kolektif/devir ilişkisi, erken kolektif, güç altında düşük süratli alçalma ve düşük RPM ayrı konular. VRS, düşük RPM ile eşanlamlı değil. Genel anlatımlar AB-205 pal açısı/tork eğrisi sağlamaz. https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf
- NASA Lift Equation: L=Cl ρV²A/2. Rotor için yerel pal sürati, dönme ve akış bileşenlerini içerir; gövde IAS'ı tek başına yeterli değildir. https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-equation/
- NASA/TP-2005-213477 (Wayne Johnson): VRS için momentum teorisinin deney verisiyle genişletilmesi gerekir. Bu uygulama raporun tam modelini uygulamıyor. İdeal havır akış ölçeği sqrt(T/(2ρA)) kullanılıyor; VRS bölgesinde ideal momentum teorisi tek başına çözüm sayılmıyor. https://ntrs.nasa.gov/citations/20060024029 ; denklem/notasyon incelemesi: https://rotorcraft.arc.nasa.gov/Publications/files/Johnson_AHS-SF2004.pdf
- NASA TRACT CH-46E darbe testleri: yapı/koltuk/zemin farklılıkları darbe sonucunu değiştiriyor. Bu başka hava aracının deney hızları AB-205 hasar sınırı yapılmadı. Hasar tahmini için deformasyon, yük, temas ve doğrulama verisi gerekir. https://ntrs.nasa.gov/citations/20160006501
- Türkçe operatör kitabı §2.13.10: 329–339 yüksek devir ikaz bandı; Şekil5-1.2: 294–324 devamlı işaret ve 339 maksimum. Gösterge işaretleri, her konfigürasyonda doğrulanmış otorotasyon hedefi sayılmıyor. Önceki Türkçe Uçuş Hareketleri eşleştirmesi korunuyor.

## IAS ve rüzgâr

Tüm 0–80 seçimler artık KIAS. IAS≈EAS kabulüyle TAS=IAS sqrt(ρ0/ρ). Ground vector = air vector + wind. Sabit rüzgâr kaldırma hesabına iki kez eklenmez. Standart deniz seviyesinde 30 KIAS, 30 kt baş rüzgârında yaklaşık sıfır GS verir. Aynı KIAS sıcak/yüksek ortamda daha yüksek TAS ve sıfırdan farklı GS verir.

Eski 0–5 yer referansı istisnası kaldırıldı. 0 IAS ve sıfır olmayan rüzgâr fiziksel yer sürüklenmesi yaratır; bunu yapayca kilitlemek IAS girdisiyle çelişirdi. Rüzgârsız düşük süratte istemsiz geri hareket eklenmedi. `groundHold` değişken adı geçmiş uyumluluk için duruyor fakat artık yer hızını sıfırlamaz; yalnız düşük hava sürati kontrol evresini seçer.

## Denklemler ve model sınırları

E_rotor=JΩ²/2; Ωdot=P_net/(JΩ). P_net=P_shaft+Lw−Tx VairX−Tz VairZ−P_loss. Toplam mekanik enerjinin değişimi, şaft girişi eksi rotor ve gövde kayıplarıyla test edildi. İdeal havır akış ölçeği, q=ρ TAS²/2 ve kuvvet çıktıları kanıt verisinde tutuluyor.

Bu sürümde rotor kaldırması hâlâ mg(RPM/RPM_initial)²×normalize kolektif×rejim etkinliği şeklinde indirgenmiştir. Tam pal elemanı, C_L(α)/C_D(α) poları veya dinamik inflow çözümü **değildir**. Aşağıdaki sayılar tasarım varsayımıdır; FAA/NASA'dan AB-205 katsayısı diye alınmadı:

| Bileşen | Deneysel uygulama |
| --- | --- |
| Kolektif kaybı | Eski yalnız >1 hatvede etki yerine 0.4+0.6 kolektif²+0.1 disk_eğimi²; yükselen hatvede kayıp gücü daha fazla artar |
| Devir yönetimi | Açık kontrol kararı varsa mevcut kolektif hedefinde RPM geri bildirimi; yönetim seçilmediyse gizli kontrol yok |
| Düşük RPM / hatve | Başlangıç RPM oranı .8 altı, .15 genişlik ve yüksek kolektif üzerinden sürekli risk vekili; gerçek stall RPM sınırı değil |
| Stall vekili etkisi | En çok %60 lift azaltımı ve ek kayıp. Tam rotor stall/kopma geometrisi veya kesin geri kazanılamazlık iddiası yok |
| VRS vekili | Gerçek pozitif şaft girişi, düşük TAS, alçalma/ideal havır akışı ve yer açıklığından sürekli eğilim; en çok %25 lift azaltımı ve %30 ek kayıp |
| VRS güç oranı | Şaft gücü/başlangıç trim ihtiyacı kullanılır; FAA'daki kullanılabilir motor gücü yüzdesi değildir. .35 normalizasyon tasarım tercihidir |
| Kısmi güç dalı | Başlangıç trim ihtiyacı vekilinin %35'i kadar artık güç kapasitesi; N2'nin %35'i değil, ölçülmüş T53 arıza haritası değil |
| Motor geçişi | Tam arızada eski3s sönüm; kısmi güçte basitleştirilmiş yük/RPM eşleşmesi. Gerçek serbest bırakma/governor tork modeli değil |
| Son kolektif | Erken: karar anı; durum tabanlı: alçak havır veya4.572m altında; geç:1.2m altında. Rotor rezerviyle hedef sınırı. Serbest noktaların hepsine gerçek uçuş talimatı sayılmaz |

J=2711 kg m² ve pal yarıçapı=7.35584m (mevcut geometrinin yarıçapı) kullanılır. Atalet, kayıp/etkinlik katsayıları ve motor geçişi AB-205 uçuş verisiyle doğrulanmadı. Bu tur parametre duyarlılık/model davranışı geliştirmesidir; gerçekçilik sertifikası değil. Erken/standart/geç seçeneğinin üstünlüğü başlangıç koşuluna göre değişebilir; sonuç etiketi kodla zorlanmaz.

## Kararlar ve kayıt

Rotor muhafaza, saha, geç muhafaza yanında yüksek devir, VRS eğilimi ve son kolektif kararları. Bir koşullu karar en fazla bir kez açılır. Eşikler yalnız durum ve önceki cevaplarla belirlenir; temas sonrası soru yok. Güncel şema5; önceki şemalar güncel hesapta yeniden yürütülür. Eski kayıtlar için yeni kararların varsayımları açık kaydedilir (devir/VRS için mevcut kumandayı tut; son kolektif durum tabanlı). Eski fizik sonuçları aynı kalmış gibi sunulmaz; özellikle eski0–5 kayıtları artık IAS anlamındadır.

## Sonuç ve hasar

Süre, min/max RPM, azami alçalma, temas süratleri, karar zamanları, rejim bulguları. Temas öncesi E_vertical=mw²/2, E_horizontal=mv_ground²/2 ve eşdeğer düşme yüksekliği w²/(2g) hesaplanır. Bunlar darbe yükü, hasar veya yaralanma değildir. Hasar ve kaza-kırım alanları hazır; `belirlenemedi / sınıflandırılmadı` döner. Skid deformasyon eğrisi, temas yüzeyi, sürtünme, durma mesafesi/süresi, gövde/koltuk yükleri ve tipe özgü doğrulama gelmeden hasar seviyeleri atanmaz.
