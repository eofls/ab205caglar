# Öngörülü pilot karşılaştırması — v0.23

Aynı başlangıçta eski durum pilotu / 2 saniyelik öngörülü pilot. Sayılar deneysel model çıktılarıdır. Daha düşük düşey hız tek başına daha düşük toplam temas enerjisi anlamına gelmez. Tam iniş optimizasyonu garanti edilmez.

| AGL ft | IAS kt | Güç kaybı | Düşey m/s eski → yeni | Yer kt eski → yeni | Rotor RPM eski → yeni |
|---|---|---|---|---|---|
| 100 | 0 | total | 13.18 → 12.44 | 3.5 → 3.6 | 186.2 → 202.9 |
| 100 | 0 | partial | 9.56 → 9.44 | 0.6 → 0.6 | 238.5 → 247.3 |
| 100 | 30 | total | 8.93 → 9.19 | 7.6 → 8.5 | 173.5 → 176.7 |
| 100 | 30 | partial | 4.38 → 3.99 | 4.9 → 5.4 | 205.8 → 217.1 |
| 100 | 60 | total | 1.74 → 1.76 | 32.7 → 23.6 | 228.5 → 228.2 |
| 100 | 60 | partial | 0.71 → 3.56 | 32.1 → 20.6 | 256.2 → 204.9 |
| 400 | 0 | total | 9.82 → 9.31 | 5.0 → 5.0 | 262.6 → 255.6 |
| 400 | 0 | partial | 9.12 → 8.44 | 4.3 → 4.3 | 287.6 → 281.4 |
| 400 | 30 | total | 5.67 → 5.66 | 47.1 → 47.1 | 201.9 → 206.0 |
| 400 | 30 | partial | 0.67 → 0.78 | 35.6 → 31.4 | 261.2 → 249.6 |
| 400 | 60 | total | 1.70 → 1.81 | 36.8 → 32.1 | 229.6 → 229.5 |
| 400 | 60 | partial | 0.69 → 0.61 | 36.8 → 32.2 | 257.6 → 247.1 |

12 koşuldan 7 tanesinde düşey temas hızı, 6 tanesinde yatay temas hızı azaldı. Eşit veya kötüleşen ölçüler saklanmadı; tablo her koşulu gösterir. Bir ölçünün iyileşmesi diğerinin iyileştiği anlamına gelmez.
