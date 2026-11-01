# Emercensi, kolektif ve yön hesabı — v0.18.0

15 Ekim 2026. Türkçe operatör kitabının Dokuzuncu Bölümü (PDF 184–198 / basılı 9-1–9-15) metin olarak incelendi; PDF 186 görselden de doğrulandı. AB-205 SİSTEMLER tarama notlarının 19 sayfalık genel görünümü ve rotor/kuyruk rotoru sayfaları 6–7 görselden incelendi. Bu notlarda ölçülmüş pal poları, kuyruk rotoru itki haritası veya yaw atalet değeri yok. FAA HFH Bölüm 2 (basılı 2-25–2-27), Bölüm 3 (3-2–3-5) yerel PDF metinleri ve Bölüm 11 çevrimiçi resmi kaynakla karşılaştırıldı. Türkçe kaynak öncelikli tutuldu.

## Bölüm 9 kapsam ve uygulama ayrımı

| Bölüm | İnceleme sonucu / uygulamada karşılığı |
|---|---|
| 9.1.1–3 | Kontrol önceliği, otorotasyonda kolektif/pedal/hava sürati ayarı. Sorular kritik duruma bağlı, aynı tür en fazla bir kez. |
| 9.1.4–8 | Çıkış, teçhizat, minimum alçalma/süzülüş ve yağ harareti: bunlara ait yeni arıza enjekte edilmedi. Grafik önceki sürümde incelenmişti. |
| 9.1.9–11 | Tam/kısmi güç kaybı ayrı. Motor arızasında sola sapma, motor/rotor devri kaybı; tek RPM ikazı yeterli teşhis değil. Alçak IGE havır kolektif istisnası korunur. Yüksek kolektifte otomatik enerji geri kazanımı düzeltildi. |
| 9.1.12 | Havada tekrar çalıştırma zaman/irtifa/arıza sebebine bağlı; yaklaşık bir dakikalık uçuş gücüne dönüş açıklaması var. 0–600 ft için anında motor kurtarma seçeneği uydurulmadı. |
| 9.1.13–16 | Droop kompensatörü, kompresör stolu, giriş yön kanatçığı ve motor overspeed farklı arızalar. Mevcut rotor overspeed izleme motor governor arızası olarak gösterilmez. Bu dört arıza ayrı güç/EGT/N1 modelleri olmadan otomatik eklenmedi. |
| 9.1.17 | Transmisyon yağ ikazı tüm motor kayıplarında kendiliğinden oluşmuş sayılmaz. |
| 9.1.18–22 | Kuyruk rotoru güç kaybı, sabit pedal, parça kaybı ve etkinlik kaybı ayrı durumlar. Normal motor kaybına kuyruk rotorunun durması eklenmedi. Pedal, kalan rotor devri ve tork dengesi yönelme hesabına bağlandı. Düşük devir yön otoritesini azaltır; LTE'nin rüzgâr bölgeleri ayrıca çözülmüyor. |
| 9.1.23–26 | Ana şaft, ayrılmayan/birleşmeyen kavrama ve kolektif titreşimi ayrı arızalardır; serbest bırakma normal varsayımı geçerlidir. |
| 9.1.27–33 | Yangın, elektrik ve batarya emercensileri: ayrı ısıl/elektrik model olmadan motor arızasına otomatik eklenmedi. |
| 9.1.34–39 | Hidrolik, servo, kumanda/ana rotor ve mast vurması: bu sürümün kuvvet modeli bunları çözmez; varsayımsal başarısızlık animasyonu üretilmedi. |
| 9.1.40–44 | Yakıt pompası/jeneratör, ağaç ve suya iniş usulleri: yeni arıza veya yüzey fiziği olarak uygulanmadı. |
| Tablo 9-1, Şekil 9-2/3 | İkaz sebepleri ve diyagram uygulanabilirliği ayrı tutulur. Mevcut H/V seçim aralığı değişmedi. |

## Kaynak hükmü ile hesap varsayımı

Kaynak, düz uçuşta kolektifin gerektiği kadar azaltılmasını; yer tesirinde havırda ise azaltmanın gerekmeyebileceğini ayırır. Bu istisna rotorun motor gücü olmadan sabit tutulması anlamına getirilmedi. FAA'nın sürücü/sürülen/stall bölgeleri açıklaması, yüksek hatvenin sürücü bölgeyi küçülttüğünü ve devir kaybını açıklar. Kaynaklar **her koşulda 600 ft kesin bir toparlanma sınırıdır** şeklinde sayısal bir hüküm vermiyor. 600 ft uygulamanın mevcut seçim sınırıdır.

Eski model `L*w` pozitif işinin tamamını kolektiften bağımsız rotora aktarabiliyordu. Bu yüzden yüksek kolektif korunurken yapay bir toparlanma ortaya çıkıyordu. Yeni model bunu ortadan kaldıran, açıkça deneysel bir enerji aktarım bağıntısı kullanır. Bu bağıntı ölçülmüş AB-205 tork/pal eğrisi değildir; “dokümandan çıkarılan kesin katsayı” olarak sunulamaz.

`c` normalize kumandadır: 1 arıza öncesi trim konumu; .3 alt tasarım sınırı; 1.8 üst tasarım sınırı. Gerçek kokpit kol derecesi veya pal açısı değildir.

- Hatve penceresi: `f_pitch = clamp((1-c)/.22, 0, 1)`.
- Düşük devir otoritesi: `f_rpm = clamp((RPM/RPM0-.55)/.3, 0, 1)`.
- Pozitif iş yakalama: `eta = f_pitch*f_rpm`.
- `W_air = L*w - Tx*VairX - Tz*VairZ`.
- Yakalanmayan pozitif iş: `P_wake = max(0,W_air)*(1-eta)`; kayıp hanesine eklenir.
- `P_rotor = P_shaft + W_air - P_profile - P_wake - P_tail`.
- `Omega_dot = P_rotor/(J*max(1,Omega))`; RPM doğrudan azaltılmaz, taban bir RPM'e sıfırlanmaz, karar kimliğiyle devir değiştirilmez.
- Akıştan kaldırma vekili `.3*eta*clamp(w/sink,0,1.5)`; kaldırma `mg*(RPM/RPM0)^2*(c+inflowLift)*aero.liftFactor`.
- Profil kaybı `(0.4+0.6*c²+0.1*tilt²)/.694`; .694, c=.7 referansının normalizasyonudur.
- Yönetilen otorotasyon kolektifi `.45+.25*w/sink+.8*(RPM/RPM0-1)`, .3–.85 arasında. IGE havır istisnası, son kolektif, VRS ve overspeed talepleri ayrıca değerlendirilir.
- Overspeed yüklemesi .70+.025*(RPM−324), .70–1.25 aralığıyla kademeli uygulanır; sürekli aynı büyük adımın açılıp kapanması azaltıldı.

Bu sınırlar/rakamlar **model tasarım katsayılarıdır**. Yüksek trim kolektifinde eta=0 varsayımı mevcut eğitim zarfında muhafazakâr bir kapatma bağıntısıdır; yüksek irtifada tüm rotor rejimlerini açıklamaz. Kurulmuş otorotasyonda azaltılmış konumdan küçük yukarı kolektif, kısmi güç ve flare aynı “ilk kolektifi hiç azaltmama” durumu sayılmaz. Tam stall sonrası iyileşme/kopma için doğrulanmış dinamik model yok.

## Pedal ve yön

Sağ yönelme pozitif. Motor torkunun kaybı ve kalan kuyruk rotor momenti ilk sola sapmayı oluşturur. Sağ pedal kuyruk rotorunun sola çeviren momentini azaltır/tersine çevirebilir. Kuyruk rotoru ana rotorla dönmeye devam eder; ayrı kuyruk rotor arızası varsayılmaz.

- Yaw atalet varsayımı `I_yaw = mass*3.5²`.
- Başlangıç moment ölçeği `Qtrim = Ptrim/Omega0`; kalan otorite `A=Qtrim*(RPM/RPM0)²`.
- Pedal normalize `u`: başlangıç triminde 0; sağ +, sol −. `M_tail=A*(2*u−1)`, aralık −.5…1. Gerçek pedal/hatve bağlantısı değildir.
- `Qshaft=Pshaft/Omega`; güç kaybında aktarım sürtünmesi `.02*Qtrim*(RPM/RPM0)²`.
- Hızla artan sönüm `I_yaw*(.35+.025*TAS)`; düşey stabilize vekili `I_yaw*.018*TAS*sin(yön hatası)`.
- Net moment / `I_yaw` yön ivmesini verir. Pedal cevabı .25 s ve 1.5 normalize birim/s ile sınırlı.
- Referans: düşük süratte başlangıç istikameti, TAS>5 m/s iken hava hız vektörü yönü. Bu 5 m/s bir model geçişidir, uçuş limiti değildir.
- Basit kuyruk güç gideri `.04*Ptrim*(RPM/RPM0)³*abs(2*u−1)^1.5` rotor kayıplarına eklenir.

Yaw bileşeni indirgenmiş moment modelidir. Tam kuyruk rotoru yan kuvveti, roll kuplajı, LTE haritası ve 6-DOF çözüm yok. Önceki `totalEnergyJ` hesabı öteleme+ana rotor enerjisini denetler; yaw enerjisi ayrı `yaw.energyJ` alanıdır. Bu test, tüm hava aracının kapalı enerji/momentum doğrulaması olarak sunulmaz.

3B ve Canvas aynı heading değerini kullanır; baş sapması dekoratif salınım değildir. Pedal görselleri gerçek entegre `u` ve türevini izler. Temas sonrası oklar ve yön durur. Saykılık gövde eksenlerine dönüştürülür; kumanda tutma dalında gizli sürat koruma hareketi engellendi.

## Karar kuralları

- İlk karar, koşullu erken rotor uyarısı ve son kolektif/VRS/overspeed korunur.
- Yeni kritik rotor sorusu: daha önce rotor/saha kararı verilmiş, RPM başlangıcın .85 altına düşmüş ve hâlâ azalıyor, yönetim yok veya yüksek kolektif var, >20 ft ve >2 s tahmini yer zamanı. Bu eşikler operasyonel limit değildir.
- Yeni pedal sorusu: yönetilmeyen baş sapması >.14 rad ve yönelme >.05 rad/s, >10 ft ve >2 s tahmini yer zamanı; önceki rotor/saha kararı sonrası. Sapma yoksa sorulmaz.
- Aynı tür en fazla bir kez. Normal sorular arasında en az 1.25 s simülasyon zamanı; yakın temas için saha seçimi en az .35 s sonra açılabilir. Eşikler kullanıcı arayüzü tasarımıdır; mürettebat tepki süresi ölçümü değildir.
- Kritik müdahale seçilmiş veya rotor zaten yönetiliyorsa gereksiz yeniden “yönet” sorusu açılmaz. İlk kararı geri dönüp değiştirmek sonraki kararları yeniden hesaplar.
- Şema7: 1–6 kayıtları yeni kapılara taşınır. Yeni pedal/kritik sorularda eski kayıt için `hold` açıkça kaydedilir; eski sayısal uçuş sonuçları aynı kalmış gibi sunulmaz.

## Açık kaynak bağlantıları

- https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch02.pdf
- https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch03.pdf
- https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook/hfh_ch11.pdf

## Açık işler

Gerçek atalet/polar/hatve ve kuyruk rotoru haritasıyla katsayı kalibrasyonu, tam dinamik inflow, çok eksenli moment/yan kuvvet hesabı ve yapısal temas modeli gerekiyor. Tamamlanan şey kaynakla çelişen belirli model davranışının düzeltilmesi ve yazılım tutarlılık kontrolleridir; uçuş eğitim cihazı doğrulaması değildir.
