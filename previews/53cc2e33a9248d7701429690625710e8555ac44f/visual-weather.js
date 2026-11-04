export const CLOUD_LABELS={clear:'Açık',scattered:'Parçalı bulutlu',overcast:'Kapalı'};
export const LIGHT_LABELS={day:'Gündüz',dusk:'Gün batımı',night:'Gece'};
export function visualWeather(c){
 const covered=c.cloudCover==='overcast',dusk=c.lighting==='dusk',night=c.lighting==='night',rain=c.precipitation==='rain';
 if(night)return {sky:covered?'#0d1218':'#0e1626',fogNear:Math.min(c.visibilityKm,rain?3:30)*1000*.03,fogFar:Math.min(c.visibilityKm,rain?3:30)*1000*.8,cloudCount:c.cloudCover==='clear'?0:covered?28:10,cloudColor:'#2b3340',sunIntensity:.22,sunColor:'#9fb4d8',ambient:.55,night:true,rain,label:`${CLOUD_LABELS[c.cloudCover]} · Gece${rain?' · Yağmur':''} · Görüş ${c.visibilityKm} km · Rüzgâr ${c.windFromDeg}°’den ${c.windKt} kt`,visualOnly:true};
 return {rain,sky:rain?'#9aa5ab':dusk?'#b99283':covered?'#a7b2b8':'#bdd5df',fogNear:Math.min(c.visibilityKm,rain?4:99)*1000*.05,fogFar:Math.min(c.visibilityKm,rain?4:99)*1000,
  cloudCount:c.cloudCover==='clear'?0:covered?28:10,cloudColor:dusk?'#d9b8aa':covered?'#bdc5cb':'#eff2f1',sunIntensity:dusk?1.0:covered?.9:3,sunColor:dusk?'#ffb782':'#fff0cf',ambient:covered?2:2.4,
  label:`${CLOUD_LABELS[c.cloudCover]} · ${LIGHT_LABELS[c.lighting]}${rain?' · Yağmur':''} · Görüş ${c.visibilityKm} km · Rüzgâr ${c.windFromDeg}°’den ${c.windKt} kt`,visualOnly:true};
}
