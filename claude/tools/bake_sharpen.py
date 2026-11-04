"""v0.43.1 uydu görüntülerini önceden keskinleştirir (eskiden her açılışta JavaScript ile yapılıyordu: açılışı ≈15 s uzatıyordu).
Kaynak: assets/terrain/<ad>-s2.jpg (değişmez). Çıktı: assets/terrain/<ad>-s2k.jpg. Gauss sigması, eski çalışma anı
keskinleştirmesinin (4096/2048 px tuvalde 7 px kutu bulanıklığı) kaynak piksele çevrilmiş karşılığıdır."""
from PIL import Image, ImageFilter
import sys, os
D = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'terrain')
for name, sigma, pct in [('golbasi', 1.0, 100), ('tepeler', 1.4, 100), ('guvercinlik', 0.95, 110)]:
    im = Image.open(os.path.join(D, name + '-s2.jpg')).convert('RGB')
    out = im.filter(ImageFilter.UnsharpMask(radius=sigma, percent=pct, threshold=0))
    out.save(os.path.join(D, name + '-s2k.jpg'), quality=90, optimize=True)
    print(name, im.size, os.path.getsize(os.path.join(D, name + '-s2k.jpg')))
