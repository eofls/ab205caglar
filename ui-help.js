// v0.32 decluttering: explanatory notes are folded behind a small circled "?" next to the option they explain.
// The note nodes are kept (scripts still write to them); only their display changes.
const NOTES=['label > small:not([id])','#setup-conditions .micro:not([role])','#setup-aircraft .micro:not([role])','#setup-chart .start-form > div > p','.chart-note','#selection-status',
 '.scenario-brief small','.scene-help:first-of-type','#playback-note','#review-panel > .micro','#scenario-book > .micro','.lesson-limit','#review-progress'];
export function foldNotes(root=document){
 for(const note of root.querySelectorAll(NOTES.join(','))){
  if(note.dataset.helpFolded)continue;if(!note.id&&!note.textContent.trim()){note.remove();continue;} /* nothing left to explain */note.dataset.helpFolded='1';note.classList.add('help-note');
  const prev=note.previousElementSibling;
  if(prev?._helpBtn){prev._helpBtn._notes.push(note);note._helpBtn=prev._helpBtn;continue;} // consecutive notes share one "?"
  const reuse=(el)=>{const q=el?.querySelector(':scope > .help-q');if(q){q._notes.push(note);note._helpBtn=q;return true;}return false;};
  {let h=prev;while(h&&(h.hidden||h.classList.contains('help-row')))h=h.previousElementSibling;const ey=note.parentElement?.querySelector(':scope > .eyebrow, :scope > div > .eyebrow');if(!note.parentElement||note.parentElement.tagName!=='LABEL'){if(h&&(/^H[1-4]$/.test(h.tagName)||h.classList.contains('eyebrow'))&&reuse(h))continue;if(ey&&reuse(ey))continue;}}
  const b=document.createElement('button');b.type='button';b.className='help-q';b.textContent='?';b.setAttribute('aria-label','Açıklamayı göster');b.setAttribute('aria-expanded','false');b._notes=[note];note._helpBtn=b;
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showTip(b,e);});
  const label=note.parentElement?.tagName==='LABEL'?note.parentElement:null;
  if(label){const field=label.querySelector('select,input');(field?field:note).before(b);continue;} // "?" right after the option name
  let head=prev;while(head&&(head.hidden||head.classList.contains('help-row')))head=head.previousElementSibling;
  if(head&&(/^H[1-4]$/.test(head.tagName)||head.classList.contains('eyebrow'))){head.append(b);continue;} // "?" beside the section title
  const host=note.parentElement?.querySelector(':scope > .eyebrow, :scope > div > .eyebrow');if(host&&host!==note){host.append(b);continue;}
  const row=document.createElement('div');row.className='help-row';note.before(row);row.append(b);
 }
}

// v0.32.2: the note opens as a small box at the pointer's upper-right, not inline below.
let tip=null,tipOwner=null;
function closeTip(){if(tip){tip.remove();tip=null;tipOwner?.setAttribute('aria-expanded','false');tipOwner=null;}}
function showTip(b,e){
 if(tipOwner===b){closeTip();return;}closeTip();
 const text=[...(b._help??[]),...b._notes.map(n=>n.textContent.trim()).filter(Boolean)];if(!text.length)return;
 tip=document.createElement('div');tip.className='help-tip';tip.setAttribute('role','tooltip');tip.innerHTML=text.map(t=>`<p>${t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p>`).join('');
 (document.fullscreenElement??document.body).appendChild(tip);tipOwner=b;b.setAttribute('aria-expanded','true');
 const r=b.getBoundingClientRect(),x=e.clientX||r.right,y=e.clientY||r.top,w=tip.offsetWidth,h=tip.offsetHeight,W=innerWidth,H=innerHeight;
 tip.style.left=Math.max(8,Math.min(W-w-8,x+10))+'px';tip.style.top=Math.max(8,Math.min(H-h-8,y-h-10))+'px';
}
addEventListener('pointerdown',e=>{if(tip&&!tip.contains(e.target)&&!e.target.closest?.('.help-q'))closeTip();},true);
addEventListener('keydown',e=>{if(e.key==='Escape')closeTip();});addEventListener('scroll',closeTip,true);addEventListener('resize',closeTip);

/* v0.43 kullanıcı: yuvarlak içindeki “?” her yerde; her biri ayrıntılı ve açık açıklama. HELP: seçici → paragraflar.
   Var olan katlanmış notların “?” düğmesi aynı öğedeyse açıklama ona eklenir; yoksa yeni “?” konur. Dinamik bölümler
   (karar kutusu, değerlendirme, senaryo listesi) yeniden çizildikçe “?” tekrar yerleştirilir. */
const HELP=[
 ['#setup-tab-chart',['Yükseklik–hız (H/V) diyagramı (Operatör talimnamesi Şekil 9-3).','Diyagramda bir noktaya dokunarak ya da skid yüksekliği ve sürati yazarak motor arızasının başlayacağı yeri seçersin. Taralı alan “kaçınılacak bölge”dir: orada motor arızası otorotasyonla emniyetle kurtarılamayabilir.','“Bu noktadan başla” seçilen noktadan enerji (rotor devri) modeliyle uçuşu baştan hesaplar.']],
 ['#setup-tab-presets',['Hazır uçuşlar: Uçuş Hareketleri kitabındaki 39 hareket ve Operatör talimnamesi 9. bölümdeki 30 emercensi.','Bir satıra dokununca helikopter o harekete / emercensiye özgü başlangıç noktasına, irtifasına ve istikametine konur.','Nasıl uçulacağı “Koşullar” sekmesindeki “Çalışma biçimi”ne bağlıdır: karar vererek, izleyerek ya da elle.']],
 ['#setup-tab-conditions',['Uçuş sahası, çalışma biçimi, pilot tecrübesi, meteoroloji ve mürettebat.','Değişiklikler hemen uygulanmaz: “Koşulları uygula ve başa dön” düğmesine basınca uçuş baştan hesaplanır.']],
 ['#setup-tab-aircraft',['Gros ağırlık, başlangıç rotor / motor devri ve konfigürasyon.','Ağırlık arttıkça havır gücü, tork ve otorotasyonda alçalma oranı artar. 324 / 6600 RPM normal uçuş değeridir.','“Hava aracını uygula ve başa dön” ile uçuşa aktarılır.']],
 ['#start-form .eyebrow',['Arızanın başlayacağı noktayı iki sayı belirler: skid yüksekliği (ft AGL) ve gösterge sürati (KIAS).','Diyagramda nokta seçmek bu kutuları doldurur; kutulara yazmak da diyagramdaki noktayı taşır.','“Bu noktadan başla” bu iki değerle uçuşu baştan kurar; önceki kararlar silinir.']],
 ['label:has(#start-height)',['Skid ile yer arasındaki yükseklik, ft AGL. Deniz seviyesine göre irtifa (MSL) değildir.','Örnek: 40 ft, yerden 12 metre demektir. Yükseklik–hız diyagramının dikey ekseni budur.']],
 ['label:has(#start-ias)',['Gösterge sürati (KIAS), çatı pitotundan okunan değer.','Yer sürati değildir: 10 kt önden rüzgârda 70 KIAS, yere göre ≈60 kt eder. Yüksek irtifada / sıcakta gerçek hava sürati (TAS) KIAS’tan büyüktür.']],
 ['label:has([name="flightArea"])',['Uçuşun yapılacağı saha:','Arazi — Gölbaşı çevresi, gerçek yükseklik ve uydu verisi (±4,5 km).','Meydan — Güvercinlik, 06 / 24 pisti, paneller ve meydan turu.','Ormanlık ve Su üstü — temsilî sahalar.','Tepeler — gerçek yükseklik verisi (±6,5 km), 2–6 nolu tepeler ve kapalı bölgeler, MT paternleriyle.']],
 ['label:has([name="pedalMode"])',['Açık: motor gücü kesildiğinde tork kalkar, burun sola kaçmak ister; pilot bunu pedalla otomatik düzeltir.','Kapalı: düzeltme yapılmaz; baş sapması ve yan kayış ekranda görülür. Pedal hatasının sonucunu görmek için eğitim amaçlıdır.']],
 ['label:has([name="mode"])',['Karar vererek ilerle: karar noktalarında akış durur; seçimine göre uçuş devam eder. Seçenekler karışık sıradadır, her birinin sonucu farklıdır; uçuş sonunda seçenekleri yan yana karşılaştırabilirsin.','Hazır akışı izle: helikopter talimnameye ve kitaba göre uçar; sen anlatımı, bakışları ve göstergeleri izlersin.','Elle uçur: helikopteri klavye, fare ya da oyun kolu ile sen uçurursun.']],
 ['label:has([name="pilot"])',['Pilotun fark etme ve tepki süresi:','Gelişmekte — arızayı ≈1,4 saniye geç fark eder, fleyırı alçakta yapar.','Yetkin — standart tepki.','Deneyimli — daha erken fark eder, düzeltmeleri daha küçüktür.','Kararları değiştirmez; kararın uygulanma zamanlamasını değiştirir.']],
 ['#config-form summary',['Hava yoğunluğu ve görüş koşulları.','Sıcaklık ve basınç irtifası yoğunluk irtifasını belirler: yoğunluk azaldıkça havır gücü ve tork artar, aynı KIAS’ta gerçek hava sürati (TAS) büyür.','Rüzgâr hızı ve geldiği yön yer süratini, iniş istikametini ve tepe üstündeki akımı değiştirir.','Bulutluluk, aydınlatma, yağış ve görüş yalnız görüntüyü değiştirir; türbülans uçuşa küçük sarsıntılar ekler.']],
 ['label:has([name="headingDeg"])',['Başlangıçta helikopterin burnunun baktığı istikamet (°, harita kuzeyinden saat yönünde).','Hazır hareket ve emercensilerde kendi istikametleri kullanılır.']],
 ['#aircraft-form .eyebrow',['Ağırlık ve konfigürasyon güç ihtiyacını ve otorotasyon davranışını değiştirir.','Gros ağırlık lb girilir; kg karşılığı yanında yazılır. Devirler, arızanın başladığı andaki rotor ve motor devridir.','Tip, motor, pal, pitot ve harici yük bilgileri kayıt amaçlıdır; doğrulanmış katsayı yoksa hesaba girmez.']],
 ['#scene-panel .scene-heading .eyebrow',['3B sahne. Fareyle sürükle: döndür · tekerlek: yakınlaş · iki parmak: kaydır / yakınlaş.','Helikoptere dön: takip kamerası. Kokpit: pilot koltuğundan bakış. Yan / Üst görünüm. Araziyi gör: sahanın tamamı. Saha adaylarını gör: iniş sahası adayları.','Tam ekran: sahne ekranı kaplar; H tuşu alttaki kumanda çubuğunu gizler / gösterir.']],
 ['#scene-panel button:is([data-view="cockpit"],[data-camera="cockpit"])',['Kokpit görünümü: sağ pilot koltuğundan bakış.','Anlatım bir göstergeyi ya da tarafı gösterdiğinde baş o yöne döner; göstergeye bakışta görüntü yakınlaşır.','Sağ alttaki “Göstergeler” düğmesi (ya da 1 tuşu) alet panosunu ekrana sığdırır; 2 pedestal, 3 tavan paneli, 4 sigorta paneli, 0 tekrar dışarı.','Sağ tık / tek parmakla sürükleyerek etrafına bakarsın; çift tık bakışı sıfırlar. Anahtarlara tıklayınca adı ve işlevi görünür.']],
 ['#lesson-panel .eyebrow',['Seçili senaryonun olay ve karar akışı: hangi aşamada olduğun ve sıradaki adım.','Karar vererek ilerle biçiminde karar noktaları burada da işaretlenir.']],
 ['#manual-panel .eyebrow',['Elle uçuş kumandaları.','Klavye: W/S saykılık ileri / geri, A/D saykılık sol / sağ, ↑/↓ kollektif, Q/E pedal. Fare ve oyun kolu da desteklenir.','“Hazır akış hayaleti” aynı koşullarda talimnameye göre uçan saydam helikopteri gösterir: kendi uçuşunu onunla karşılaştırırsın.']],
 ['#transport-panel .eyebrow',['Akış kontrolleri: ▶ Başlat / Ⅱ Duraklat, ↺ Başa, ±5 saniye sarma ve oynatım hızı (0,5×–2×).','Zaman çizelgesindeki işaretler karar ve önemli olay anlarıdır; çizelgeye dokunarak o ana gidersin.','Karar noktasında akış durur; yanıtlanmamış bir karar ileri sarılarak atlanamaz.']],
 ['#review-panel .eyebrow',['Uçuş bitince her kararın usule uygun olup olmadığı, gerekçesi ve kaynağı burada listelenir.','“Karar anına dön” o kararın sorulduğu ana götürür: başka bir seçenek seçip uçuşu oradan değiştirebilirsin.','Hazır hareket ve emercensilerde değerlendirme kutusundaki “Seçenekleri karşılaştır” her seçenekle uçuşu baştan hesaplar ve sonuçları (süre, temas, hasar, ne oldu) yan yana gösterir.']],
 ['#scenario-book .eyebrow',['Senaryo kitaplığı: uçuşu adlandırıp bu tarayıcıya kaydedersin; aynı koşulları sonra yeniden açar ya da iki uçuşu karşılaştırırsın.','Kayıtlar yalnız bu cihazdadır. “Kitaplık yedeğini indir” ile dosya olarak saklar, “Yedek yükle” ile başka cihaza taşırsın.']],
 ['#aircraft-summary .eyebrow',['Sayısal modelin hangi verilere dayandığı ve hangi verilerin eksik olduğu.','Eksik ya da doğrulanmamış değerler modelde varsayım olarak kalır; sonuçlar bu ölçüde yaklaşıktır.']],
 ['#event-panel .eyebrow',['Uçuşun o anki durumu ve olay günlüğü.','Anlatım: çağrılar ve açıklamalar. Karar: verilen kararlar. Standart dışı / Hata: kitaptan sapmalar. Sonuç: hatanın uçuştaki sonucu.','Göstergeler: rotor ve motor devri, sürat (KIAS), irtifa, tork (PSI), varyo (ft/dk) ve yer sürati.']],
 ['#decision .eyebrow',['Karar noktası: akış seçimini bekliyor.','Soru kokpitte gördüğün ve duyduğun belirtiyle sorulur; seçenekler karışık sıradadır ve hepsi makul görünür. Talimnameye ve Uçuş Hareketleri kitabına uygun olanı seç.','Seçimin uçuşu gerçekten değiştirir: hatalı eylemin sonucu (sert temas, kontrol kaybı, gecikme…) uçuşta görülür. Uçuş sonunda bütün seçenekleri karşılaştırabilirsin.']],
 ['.pp-switch',['Emercensiler: Operatör talimnamesi 9. bölüm (Emercensi Usuller); başlıktaki numara talimname paragrafıdır.','Uçuş hareketleri: Uçuş Hareketleri kitabı; tekamül, meydan turu, arazi hareketleri, otorotasyonlar, benzetilmiş arızalar ve taktik hareketler.','Arama kutusu ad ve numarada arar. Seçince ayrıntı kutusunda amaç, standartlar ve uçuş sahası görünür.']],
 ['.pd-head .eyebrow',['Hazır uçuşun değerlendirmesi: sonuç, temas değerleri ve süre.','Kararlar tablosu her kararın usule uygun olup olmadığını gösterir; uygun değilse usulün ne olduğu altında yazılır.','“Dikkat edilecekler” uçuştaki standart dışı noktalar ve hataların sonuçlarıdır.']],
 ['.pd-cmp h4',['Her kararın her seçeneği için uçuş baştan hesaplanır; diğer kararlar senin seçtiğin gibi kalır.','Süre: uçuşun toplam süresi. Temas: yere değerken düşey hız (m/s) ve yer sürati (kt). Hasar: en çok etkilenen parçanın benzetim tahmini. Ne oldu: o seçenekle ortaya çıkan hata, standart dışı durum ya da sonuç.','“usul” etiketi kitaba uygun seçenek, “seçimin” etiketi senin seçtiğin seçenektir.']],
 ['#start-map',['Uçuş sahasının haritası: helikopterin başlangıç yeri ve uçuş bitince izlenen iz.','Sahaya dokunarak özel iniş sahası ekleyebilirsin (Karar vererek ilerle biçiminde).']],
];
export function installHelp(root=document){
 for(const [sel,paras] of HELP){let els;try{els=root.querySelectorAll(sel);}catch{continue;}
  for(const el of els){if(el.closest('.help-tip'))continue;
   let b=el.querySelector(':scope > .help-q')??(el.tagName==='LABEL'?el.querySelector('.help-q'):null);
   if(b){b._help=paras;continue;}
   b=document.createElement('button');b.type='button';b.className='help-q help-x';b.textContent='?';b.setAttribute('aria-label','Açıklamayı göster');b.setAttribute('aria-expanded','false');b._notes=[];b._help=paras;
   b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showTip(b,e);});b.addEventListener('pointerdown',e=>e.stopPropagation());
   if(el.tagName==='LABEL'){const f=el.querySelector('select,input,textarea');(f??el.firstChild)?f.before(b):el.append(b);}
   else if(el.tagName==='SUMMARY'||el.tagName==='BUTTON'||/^H[1-6]$/.test(el.tagName)||el.classList.contains('eyebrow'))el.append(b);
   else el.prepend(b);}}}
let helpTimer=null;
export function watchHelp(){installHelp();try{new MutationObserver(()=>{clearTimeout(helpTimer);helpTimer=setTimeout(()=>installHelp(),250);}).observe(document.body,{childList:true,subtree:true});}catch{}}
