# v0.20.0 / energy-0.9 / şema9 — 15 Ekim 2026

S01 ana geliştirme vakası. Hazır akış sabit cevap listesinden çıkarıldı: yerel durum geri beslemeli uyarlanabilir pilot (LLM değil). Fleyır/ufkiyet/son kolektif ve dinamik akış hafızası; kaynak tekrar incelemesi Uçuş Hareketleri PDF94–96,104–106. Kullanıcı akışında fleyır tercihi eklendi.

İlk temas, sekme/kayma ve yerleşme ayrı. Süre yerleşmede durur. Sonuçta gerekçeli benzetilmiş hasar sınıfı, kuvvet talebi duyarlılığı, tutuma bağlı yük payları; gerçek AB-205 kapasitesi veya resmi kaza sınıflaması değil. Tam ekran üstte son temas yüzdesi. Geri sarma ve eski kayıt göçü korunur.

109 test +80 koşul +72 rejim geçti. Tarayıcı görsel QA yok. Ayrıntı: docs/S01-REVIEW-v020.md, docs/PHYSICS-AUDIT-v020.md. Önceki kayıtlar aşağıda tarihçedir; güncel davranış bu başlıktır.

---

## Sonraki sıra

1. Kullanıcının S01 tam/kısmi güç, hazır/karar modu, fleyır ve son kolektif karşılaştırmalarını değerlendir.
2. Aynı modeli diğer başlangıç noktalarında geliştir; sabit başarı sonuçları atama.
3. Kayma/sekme ve çok noktalı yapısal model şu an indirgenmiş. Varsayımsal katsayıları gerçek AB-205 verisi gibi sunma.
4. Yakın/uzak hedefler sentetik; başarısız uzak teşebbüs daha kısa menzilde bitebilir. Gerçek sahaya erişim/engel çözümü henüz yok.

Korunacaklar: 1ft/1kt seçim, sol diyagram, mevcut logo/arka plan, tam ekran bildirim/karar/oynatma, RPM/IAS/AGL/alçalma, sol kumandalar; otomatik pedal varsayılan açık. UI genel düzenini izinsiz değiştirme. Kullanıcı Türkçe kaynak önceliği istiyor. Kaynak çelişkileri varyant/revizyonla ayrılmalı.

Kayıt şema9; önceki şemalar yeni fizik/karar kapılarıyla yeniden hesaplanır. Hazır akış cevapları boş, karar geçmişi fizik evrelerinin olaylarından üretilir.
