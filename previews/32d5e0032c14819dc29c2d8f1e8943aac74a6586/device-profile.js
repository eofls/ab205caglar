/* v0.39.2 telefon profili: dokunmatik ve küçük ekranlı (veya ≤4 GB bellekli) cihazlarda doku, ağaç penceresi, gölge ve
   piksel oranı küçültülür — iOS/Android tarayıcısının bellek sınırını aşınca sekme yeniden yükleniyordu. */
export const LITE=(()=>{try{const w=globalThis.window;if(!w?.matchMedia)return false;if(/[?&]lite=0\b/.test(w.location?.search??''))return false;if(/[?&]lite=1\b/.test(w.location?.search??''))return true;
 const coarse=w.matchMedia('(pointer:coarse)').matches,small=Math.min(w.screen?.width??9999,w.screen?.height??9999)<=900,mem=navigator.deviceMemory??8;return (coarse&&small)||mem<=4;}catch{return false;}})();
