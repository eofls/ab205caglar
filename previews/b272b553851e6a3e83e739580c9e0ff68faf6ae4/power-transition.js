import {flightState} from './flight-dynamics.js';
import {POWERED_FLIGHT_REFERENCE} from './aircraft-data.js';
// Narration timing is separate from the experimental physical clock; no measured AB-205 coast-down curve.
export const TRANSITION_REFS={powered:'TR §7.5.1 · PDF 118 / 7-5',failure:'TR §9.1.9 · PDF 185–186 / 9-2–9-3',drive:'TR §2.7.1 · PDF 24 / 2-11'};
export function powerTransition(time,config,scenario,choices=[]){
 const active=choices.filter(a=>a.at<=time),priority=active.find(a=>a.id==='priority')?.option;
 const physical=flightState(time,scenario,config,choices);
 const powered=time<4;
 const rotorInput=config.initialRotorRpm??POWERED_FLIGHT_REFERENCE.rotorRpm;
 const engineInput=config.initialEngineRpm??POWERED_FLIGHT_REFERENCE.engineRpm;
 const phase=powered?'Motor gücü mevcut':time<8?'Güç kaybı / belirtiler':time<12?'İlk müdahale / değerlendirme':scenario.lesson==='S01'?'Otorotasyon değerlendirmesi':'Rotor enerjisi değerlendirmesi';
 const crew=config.mode==='watch'?'Yerel uyarlanabilir pilot anlık uçuş durumundan kumanda hedefi üretiyor.':priority==='control'?'Kontrol ve gösterge izleme paylaşıldı.':priority==='diagnose'?'İki pilotun dikkati arızada; uçuş izleme boşluğu riski.':'İş bölümü kararı bekleniyor.';
 return {
  phase:physical.ground?.phase??physical.controls?.phase??phase,powered,physicalState:physical,
  rotor:{rpm:physical.rotorRpm,quality:powered?(config.initialRotorRpm==null?'reference':'declared'):'experimental',text:`${physical.rotorRpm.toFixed(1)} RPM`},
  engine:{rpm:physical.engineRpm,quality:powered?(config.initialEngineRpm==null?'reference':'declared'):'experimental',text:`${physical.engineRpm.toFixed(0)} RPM`},
  note:`${physical.quality==='unsupported'?'Hesap kapsamı dışı':'Deneysel hesap'}${physical.assumedMass?' · varsayılan 2800 kg':''}${physical.contact?' · temas öncesi kayıt ve yer hareketi ayrı':''}${!physical.chartCovered?' · eğri kapsamı dışı':''}`,
  explanation:config.powerLossMode==='partial'&&!powered?'Kısmi güç: hesaplanan başlangıç şaft gücünün %35’i deneysel artık güç kapasitesi. Bu oran kitap verisi veya N2 yüzdesi değildir. Düzenli düşük güç dalıdır; serbest dönüş nedeniyle rotora aktarılan güç kapasitenin altında kalabilir.':powered?'Değerler başlangıç girdisi veya 324 / 6600 normal uçuş referansıdır; canlı ölçüm değildir.':`Tam güç kaybı senaryo girdisidir; motorun aniden 0 RPM olduğu anlamına gelmez. Ayrı transmisyon arızası yok varsayımıyla serbest dönüş ele alınır. Rotor enerji dengesiyle; motor ise doğrulanmamış 3 s yavaşlama sabitiyle hesaplanır. Motor ve rotor devri sabit bir oranla birbirinden türetilmez. ${crew}`,
  reference:powered?TRANSITION_REFS.powered:TRANSITION_REFS.failure+'; '+TRANSITION_REFS.drive
 };
}
export function transitionEvents(config={}){return [
 {at:5,kind:'Güç aktarımı',title:config.powerLossMode==='partial'?'Artık motor gücü ve rotor yükü':'Motor tahriki ve rotor dönüşü ayrılıyor',text:config.powerLossMode==='partial'?'Bu dalda rotor hâlâ sınırlı motor gücü alabilir. N2 değeri kullanılabilir güç yüzdesi değildir. Tam güç kaybı ve VRS koşulları ayrı izlenir.':'Senaryoda ayrı transmisyon arızası bulunmadığı varsayılıyor. Serbest bırakma mekanizması motorun rotordan ayrılmasına imkân verir; motor gücü kaybı, rotorun durması veya motor devrinin aniden sıfır olması demek değildir. Bu olayın çizelgedeki yeri anlatım içindir; mekanizmanın ölçülmüş açılma süresi değildir.',source:['tr'],reference:TRANSITION_REFS.drive},
 {at:10,kind:'Gösterge',title:'RPM ve hareket ortak hesap durumunu izliyor',text:'Rotor devri enerji dengesiyle, motor devri ayrı deneysel yavaşlama modeliyle hesaplanır. 3 saniyelik motor zaman sabiti ve 2711 kg m² rotor ataleti AB-205 için doğrulanmış değildir. Fiziksel temas gerçekleşirse hesap o andaki değerlerde dondurulur; senaryo süresi ve oynatma sona erer. Karar seçenekleri kumanda konumları değildir ve başarılı iniş anlamına gelmez.',source:['tr'],reference:TRANSITION_REFS.failure+'; Şekil 9-2'}
];}
