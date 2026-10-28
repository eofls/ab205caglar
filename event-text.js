// v0.32.2: "Şu anda ne oluyor?" shows short technical statements. Meta disclaimers (model status, validation, assumptions)
// are dropped at display time; the full text stays in the stored events and the report.
const META=/deneysel|doğrulan|varsayı|garanti|güvence|şematik|tasarım(ı|dır| tercihi)|onayı değil|modellenme|modellenmedi|modellenmez|temsil|benzetim|kapsam|bu aşamada|taşınmıyor|yalnız geometrik|mevzuat|olasılığı değil|anlamına gelmez|en iyi sonucu|simüle edilmiyor|animasyon|komut değil|sıfırlanmadı|kesin temas|enjekte|hesabına uygulanıyor|geçmiş teması|eğitim tasarımı|kalibrasyon|anlatım|kopyalanmaz|uygulama tasarımı|rapora alındı|ölçülmüş|ayrıca doğrulanmalı|senaryo süresi|dondurulur|öngörüsünde|seçilen öngörü|karşılaştırıldı|erişim taraması|hesabına taşıyor|kaynakla henüz|kuvvet modeli değil|değerler deneysel/i;
export function cleanEventText(text=''){
 const parts=String(text).replace(/\s·\s(benzetim tahmini|deneysel)/gi,'').split(/(?<=[.!?])\s+/).map(t=>t.trim()).filter(Boolean);
 const kept=parts.filter(t=>!META.test(t)&&t!=='.');
 return kept.join(' ').replace(/\s+\.\s*/g,' ').replace(/\.\s*\./g,'.').trim();
}
// v0.33: the same rule applied to everything shown in the workspace (model-status / validation / licence wording is kept
// for a separate section later). Text nodes are rewritten in place; scripts keep writing their full strings.
const quick=/deneysel|doğrulan|varsayı|garanti|güvence|şematik|tasarım|onay|modellen|temsil|benzetim|kapsam|aşamada|taşınmıyor|geometrik|mevzuat|olasılığı|anlamına|en iyi sonucu|simüle|animasyon|komut değil|sıfırlanmadı|kesin temas|enjekte|uygulanıyor|geçmiş temas|kalibrasyon|anlatım|kopyalanmaz|rapora alındı|ölçülmüş|senaryo süresi|dondurulur|öngörüsünde|karşılaştırıldı|erişim tarama|hesabına taşıyor/i;
function fixNode(n){const v=n.nodeValue;if(!v||!quick.test(v)||!META.test(v))return;const lead=v.match(/^\s*/)[0],trail=v.match(/\s*$/)[0],c=cleanEventText(v);const next=c?lead+c+trail:'';if(next!==v)n.nodeValue=next;}
export function sanitizeTree(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,svg,.data-credits')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let n;while((n=w.nextNode()))fixNode(n);}
export function watchSanitize(...roots){for(const root of roots){if(!root)continue;sanitizeTree(root);new MutationObserver(list=>{for(const m of list){if(m.type==='characterData')fixNode(m.target);else for(const a of m.addedNodes){if(a.nodeType===3)fixNode(a);else if(a.nodeType===1)sanitizeTree(a);}}}).observe(root,{subtree:true,childList:true,characterData:true});}}
