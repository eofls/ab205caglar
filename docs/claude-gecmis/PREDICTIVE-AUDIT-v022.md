# Öngörülü pilot karşılaştırması — v0.22

Aynı başlangıçta eski durum pilotu / 2 saniyelik öngörülü pilot. Sayılar deneysel model çıktılarıdır. Daha düşük düşey hız tek başına daha düşük toplam temas enerjisi anlamına gelmez. Tam iniş optimizasyonu garanti edilmez.

| AGL ft | IAS kt | Güç kaybı | Düşey m/s eski → yeni | Yer kt eski → yeni | Rotor RPM eski → yeni |
|---|---|---|---|---|---|
| 100 | 0 | total | 13.09 → 12.74 | 3.5 → 3.5 | 212.7 → 212.6 |
| 100 | 0 | partial | 10.33 → 9.98 | 0.6 → 0.6 | 259.0 → 253.0 |
| 100 | 30 | total | 6.03 → 5.99 | 7.0 → 6.3 | 226.4 → 224.9 |
| 100 | 30 | partial | 2.62 → 2.84 | 5.4 → 5.4 | 245.1 → 237.2 |
| 100 | 60 | total | 1.76 → 2.65 | 37.4 → 33.1 | 246.4 → 231.3 |
| 100 | 60 | partial | 0.64 → 0.77 | 38.3 → 34.1 | 261.7 → 244.9 |
| 400 | 0 | total | 10.46 → 9.94 | 5.0 → 5.0 | 269.5 → 263.5 |
| 400 | 0 | partial | 9.39 → 8.76 | 4.8 → 4.8 | 291.2 → 285.8 |
| 400 | 30 | total | 3.58 → 4.10 | 9.2 → 7.5 | 235.8 → 226.6 |
| 400 | 30 | partial | 0.75 → 0.98 | 18.6 → 10.6 | 253.5 → 250.3 |
| 400 | 60 | total | 1.64 → 1.99 | 26.1 → 19.8 | 246.6 → 238.5 |
| 400 | 60 | partial | 0.65 → 0.68 | 28.1 → 22.0 | 259.3 → 255.1 |

12 koşuldan 5 tanesinde düşey temas hızı, 8 tanesinde yatay temas hızı azaldı. Eşit veya kötüleşen ölçüler saklanmadı; tablo her koşulu gösterir. Bir ölçünün iyileşmesi diğerinin iyileştiği anlamına gelmez.
