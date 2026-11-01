import {profileDecisions} from './scenario-profiles.js';
import {DEFAULT_AIRCRAFT} from './aircraft-data.js';
import {SAFE_DECISIONS} from './scenario-lesson.js';
export const SOURCES = {
  dynamics:{title:'FAA / NASA · rotor dinamiği',file:'FAA HFH Bölüm 11; NASA TP-2005-213477; NASA Lift Equation',pages:'HFH 11-2–11-4, 11-9–11-10, 11-15–11-16',printed:'Açık kaynak incelemesi',status:'VRS, düşük rotor devri ve overspeed ayrı olgular; deneysel katsayılar AB-205 verisi değildir'},
  movements:{title:'Uçuş Hareketleri',file:'Uçuş Hareketleri(2).pdf',id:'libfile_c390ef0b8fec819198ccaaeaca393c9d',pages:'PDF 94–98, 99–110',printed:'2-2–2-18',status:'Havır, giriş, flare, düzeltme ve son kollektif nitel eşleştirmesi; UH-1 eğitim usulleri AB-205 sayısal katsayısı değildir'},
  tr: {title:'UH-1 / AB-205 Operatör Kitabı',file:'2-UH-1-AB-205-Operator-Manual.pdf',id:'libfile_8bed0326f6bc8191b7e4ac118f4754fb',pages:'PDF 16, 24, 28, 90–95, 185–187, 197–198',printed:'2-3, 2-11, 2-15, 5-1–5-6, 9-2–9-4, 9-14–9-15',status:'İlgili bölümler incelendi; yürürlük ve hava aracı konfigürasyonu teyit bekliyor'},
  tm: {title:'TM 55-1520-210-10',file:'2.TM 55-1520-210-10 UH-1 OPERATOR MANUAL.pdf',id:'libfile_ce2ec0d705e88191a06aef329d2b746e',pages:'PDF 403–405, 416',printed:'9-1–9-3; Şekil 9-3, 9-13',status:'Karşılaştırma kaynağı; UH-1 hükümleri otomatik AB-205 limiti değildir'},
  faa:{title:'Helicopter Flying Handbook',file:'HELICOPTER FLYING HANDBOOK.pdf',id:'libfile_468e45c1568881919213b7d29d88327e',pages:'PDF 90–92',printed:'7-2–7-4',status:'Genel aerodinamik; örnek R44 ve S-300 değerleri AB-205’e taşınmadı'},
  crm:{title:'Uçuş Mürettebat Eğitimi',file:'9-UÇUŞ MÜRETTEBAT EĞİTİMİ.pdf',id:'libfile_943e460ec59c81919e85f1dcf0f2d855',pages:'PDF 14–16',printed:'2-7–2-9',status:'Durumsal farkındalık, görev paylaşımı ve dikkat daralması'},
  met:{title:'Meteoroloji',file:'METEOROLOJİ.pdf',id:'libfile_60bb192480ac8191bb0d7a3a575cdc42',pages:'PDF 23, 49–51',printed:'Dağ sirkülasyonları, 10-1–10-3',status:'Yalnız nitel etkiler; tartışmalı ifadeler ve sayısal genellemeler modele alınmadı'},
  chart:{title:'Gönderdiğin H/V diyagramı',file:'Ekran görüntüsü 2026-10-13 225631.png',id:'libfile_85b25953c5ec8191b917ac957bf11c5c',pages:'Tek görsel',printed:'Figure 9-3 • Change 8 • 9-13',status:'Çatı/burun IAS ölçekleri ve ağırlık eğrileri var; sayısallaştırma bekliyor'}
};
export const CREW = {
  developing:{label:'Gelişmekte',text:'Yapılandırılmış görev paylaşımı ve açık hatırlatmalar gösterilir.'},
  proficient:{label:'Yetkin',text:'Standart çağrılar ve karşılıklı teyit vurgulanır.'},
  experienced:{label:'Deneyimli',text:'Kısa çağrılar ve bağımsız çapraz kontrol vurgulanır.'}
};
export const genericDecisions = (low=false) => [
  {id:'priority',at:8,title:'İlk dikkat önceliğin ne?',options:[
    {id:'control',label:low?'Kontrol ve havır koşuluna uygun rotor enerjisi yönetimi':'Uçuş kontrolü ve koşula uygun rotor devri yönetimi',text:low?'Yer tesirindeki havır için seyir uçuşundaki kollektif azaltma kalıbı genellenmez.':'Kontrol önceliği korunur; kollektif hareketi başlangıç koşuluna ve rotor devrine bağlıdır.',risk:false},
    {id:'diagnose',label:'Önce iki pilot da arıza nedenini çözmeye odaklansın',text:'İki pilotun aynı anda arızaya odaklanması uçuş ve dış çevre izlemesini zayıflatabilir; gecikme mevcut payı tüketebilir.',risk:true}
  ],source:['tr','tm','crm']},
  {id:'landing',at:25,title:'İniş sahası ve iş bölümü nasıl ele alınsın?',options:[
    {id:'shared',label:'Erişilebilir sahayı değerlendir; kontrol ve izleme görevlerini paylaş',text:'Uçuşu sürdüren pilot ile saha, engel ve gösterge kontrolünü yapan pilotun görevleri ayrılır. Sahanın uygunluğu ayrıca değerlendirilir.',risk:false},
    {id:'distant',label:'Daha düzgün görünen uzak sahaya ulaşmaya odaklan',text:'Uzak sahaya takılmak ve aşırı manevra, mevcut zaman ve enerji payını azaltabilir. Bu dal uzak sahaya erişildiğini varsaymaz.',risk:true}
  ],source:['tr','crm']}
];
export const SCENARIOS = [
  {id:'caution',name:'İkazlı saha',subtitle:'Alçak uçuşta güç kaybı',zone:'caution',zoneLabel:'İkazlı',height:40,ias:70,duration:48,decisions:profileDecisions('caution'),
    context:'İleri sürat mevcut; yerden yükseklik sınırlı. Koordinata dayalı eğim kullanılır; zemin uygunluğu ayrıca değerlendirilir.',
    aero:'Alçak yükseklik, yavaşlama ve iniş hazırlığı için kullanılabilen payı daraltır. İleri sürat tek başına emniyet sağlamaz.',
    outcome:'Kaynak, ikazlı sahadaki tam güç kaybında pilotun gayretine rağmen hasar olasılığının yüksek olduğunu belirtir. Temas hızı ve benzetilmiş sertlik endeksi hesaplanır; gerçek hasar olasılığı değildir.'},
  {id:'avoid-low',name:'Kaçınılacak saha',subtitle:'Düşük sürat / yerden ayrılmış uçuş',zone:'avoid',zoneLabel:'Kaçınılacak',height:200,ias:10,duration:54,decisions:profileDecisions('avoid-low'),
    context:'Düşük süratli uçuş; otorotatif akışı geliştirmek için gereken zaman ve irtifa önemli.',
    aero:'Düşük ileri süratte alçalışa geçiş ve hava akımının kurulması önem kazanır. Yükseklik–sürat bileşimi, rotor enerjisini yönetme payını sınırlayabilir.',
    outcome:'Bu konumda kontrolün korunması bile hasarsız inişi garanti etmez. Kaçınılacak bölge, kesin kaza sonucu anlamına da gelmez.'},
  {id:'safe',name:'Güvenli saha',subtitle:'S01 · Ayrıntılı motor arızası · 400 ft / 60 kt',zone:'safe',zoneLabel:'Güvenli',height:400,ias:60,duration:60,decisions:SAFE_DECISIONS,lesson:'S01',
    context:'Diyagramda güvenli olarak işaretlenen bölümden örnek başlangıç; saha ve hava şartları yine belirleyici.',
    aero:'İrtifa ve ileri sürat, otorotatif alçalışın kurulmasına daha fazla imkân verebilir. Enerji yönetimi, saha seçimi ve doğru teknik hâlâ gereklidir.',
    outcome:'Güvenli bölge ifadesi, test koşullarına bağlı imkânı tarif eder. Engel, zemin, hava ve uygulama hataları uygun başlangıç payını ortadan kaldırabilir.'},
  {id:'avoid-fast',name:'Yere yakın / yüksek sürat',subtitle:'Alt kaçınma bölgesinin ayrı örneği',zone:'avoid',zoneLabel:'Kaçınılacak',height:5,ias:75,duration:42,decisions:profileDecisions('avoid-fast'),
    context:'Çok sınırlı yer açıklığı ve yüksek ileri sürat. Düşük süratli kaçınma senaryosundan ayrı ele alınır.',
    aero:'Yüksek ileri sürate rağmen yer açıklığı yavaşlama için yetersiz kalabilir. Kuyruk ve arazi açıklığı ayrıca değerlendirilir.',
    outcome:'Rotor enerjisi, yer açıklığı ve ileri sürat birlikte değerlendirilmelidir. Fleyır, temas tutumu ve duruş mesafesi deneysel olarak hesaplanır.'},
  {id:'hover',name:'Yer tesirinde havır',subtitle:'Kumanda genellemesine karşı kontrol senaryosu',zone:'context',zoneLabel:'Özel koşul',height:3,ias:0,duration:40,decisions:profileDecisions('hover'),
    context:'Düz zeminde, yer tesirinde alçak havır. Bu örneğin bölgesi otomatik sınıflandırılmıyor.',
    aero:'Yer tesirindeki havırda rotorun depolanmış enerjisi ve çok kısa yer açıklığı birlikte ele alınır; seyirdeki tepki aynen kopyalanmaz.',
    outcome:'Kaynaklar yer tesirindeki havır ile seyir koşullarında ilk kollektif uygulamasını ayırır. Bu dalın amacı bu farkı görünür kılmaktır; kumanda miktarı deneysel olarak hesaplanır.'}
];
export const DEFAULT_CONFIG = {...DEFAULT_AIRCRAFT,flightArea:'terrain',customSites:[],hiddenSites:[],nextSiteNumber:3,scenario:'caution',customStart:false,startHeightFt:40,startIasKt:70,mode:'guided',powerLossMode:'total',pedalMode:'auto',temperatureC:20,pressureAltitudeFt:3000,windKt:5,windFromDeg:0,headingDeg:0,startX:0,startZ:0,visibilityKm:10,cloudCover:'clear',lighting:'day',turbulence:'none',pilot:'proficient',copilot:'proficient',physicsModel:'energy',manualRunId:'',precipitation:'none',program:'emergency',emergencyId:'engine-total',maneuverId:'hover'};
export function getScenario(id){return SCENARIOS.find(s=>s.id===id);}
export const APPROVED_REFERENCE_CHOICES = {obstacle:'climb',approach:'brake',cyclic:'coordinated',finalPull:'now',flare:'adaptive',priority:'control',landing:'shared',recovery:'recover',cushion:'timed',vrs:'exit',overspeed:'load',yaw:'correct',criticalRotor:'unload'};
