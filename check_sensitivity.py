"""
Model Sensitivity Analizi — Görseldeki korelasyon tablosuyla karşılaştırma.
Her özellik tek tek artırılıp/azaltılıp model çıktısındaki değişim ölçülüyor.
Pozitif = arttırınca hasta yapıyor (düz etkileyen)
Negatif = arttırınca sağlıklı yapıyor (ters etkileyen)
"""
import torch, torch.nn.functional as F
import sys; sys.path.insert(0, 'backend')
from model import KidneyDiseaseClassifier

m = KidneyDiseaseClassifier()
m.load_state_dict(torch.load('backend/model.pt', map_location='cpu', weights_only=True))
m.eval()

means = [51.5625,76.575,1.017712,0.9,0.395,0.8825,0.81,0.105,0.055,
         145.0625,56.693,2.997125,137.63125,4.57725,12.5425,39.0825,
         8298.5,4.73775,0.3675,0.3425,0.085,0.205,0.19,0.15]
stds  = [16.961754,13.472913,0.005427,1.311488,1.038737,0.322015,0.392301,
         0.306553,0.22798,75.166639,49.333475,5.621846,9.194816,2.817828,
         2.713092,8.152036,2526.429843,0.840387,0.482124,0.474546,0.278882,
         0.403702,0.392301,0.357071]
names = ['yas','kan_basinci','ozgul_agirlik','albumin','seker',
         'kirmizi_kan_hucresi','irin_hucresi','irin_hucresi_kumesi','bakteri',
         'rastgele_kan_sekeri','kan_ure','serum_kreatinin','sodyum','potasyum',
         'hemoglobin','paketli_hucre_hacmi','beyaz_kan_hucresi_sayisi',
         'kirmizi_kan_hucresi_sayisi','hipertansiyon','diyabet',
         'koroner_arter_hastaligi','istah','ayak_odemi','anemi']

# Ortalama noktasından başla
base = list(means)
base_scaled = [(v-m)/s for v,m,s in zip(base, means, stds)]  # all zeros
with torch.no_grad():
    base_prob = F.softmax(m(torch.tensor([base_scaled], dtype=torch.float32))[0], dim=0)[0].item()

print(f"Baseline CKD olasılığı (ortalama değerler): {base_prob*100:.1f}%\n")

# Her özelliği +2 std kaydır ve CKD olasılık değişimini ölç
sensitivity = {}
for i in range(24):
    perturbed = base.copy()
    perturbed[i] = means[i] + 2 * stds[i]  # +2 std sapma
    p_scaled = [(v-m)/s for v,m,s in zip(perturbed, means, stds)]
    with torch.no_grad():
        high_prob = F.softmax(m(torch.tensor([p_scaled], dtype=torch.float32))[0], dim=0)[0].item()
    
    # Yön: pozitif = artırınca CKD artıyor (düz etkileyen)
    #       negatif = artırınca CKD azalıyor (ters etkileyen / koruyucu)
    sensitivity[names[i]] = high_prob - base_prob

# Korelasyon tablosundaki beklenen yönler (siniflandirma: ckd=0, notckd=1)
# Negatif korelasyon = feature arttıkça sınıf(notckd) azalır = CKD artar = DÜZ ETKİLEYEN
# Pozitif korelasyon = feature arttıkça sınıf(notckd) artar = CKD azalır = TERS ETKİLEYEN
expected_direction = {
    'hemoglobin': 'TERS',      # +0.75
    'ozgul_agirlik': 'TERS',   # +0.70
    'paketli_hucre_hacmi': 'TERS', # +0.65
    'kirmizi_kan_hucresi_sayisi': 'TERS', # +0.42
    'sodyum': 'TERS',          # +0.33
    'kirmizi_kan_hucresi': 'TERS', # +0.28 (normal=0, high=healthy)
    'irin_hucresi': 'TERS',    # +0.38
    'albumin': 'DÜZ',          # -0.65
    'hipertansiyon': 'DÜZ',    # -0.55
    'rastgele_kan_sekeri': 'DÜZ', # -0.40
    'diyabet': 'DÜZ',          # -0.38
    'istah': 'DÜZ',            # -0.35
    'ayak_odemi': 'DÜZ',       # -0.33
    'kan_ure': 'DÜZ',          # -0.30
    'seker': 'DÜZ',            # -0.28
    'anemi': 'DÜZ',            # -0.25
    'serum_kreatinin': 'DÜZ',  # -0.22
    'kan_basinci': 'DÜZ',      # -0.18
    'bakteri': 'DÜZ',          # -0.15
    'irin_hucresi_kumesi': 'DÜZ', # -0.13
    'koroner_arter_hastaligi': 'DÜZ', # -0.12
    'yas': 'DÜZ',              # -0.10
    'potasyum': 'DÜZ',         # -0.05
    'beyaz_kan_hucresi_sayisi': 'DÜZ', # -0.07
}

# Sırala (büyükten küçüğe mutlak değer)
sorted_sens = sorted(sensitivity.items(), key=lambda x: abs(x[1]), reverse=True)

print(f"{'Özellik':32s} {'Etki':>8s} {'Yön':>6s} {'Beklenen':>9s} {'Uyum':>5s}")
print("=" * 70)

match_count = 0
total = 0
for name, val in sorted_sens:
    actual_dir = "DÜZ" if val > 0 else "TERS"
    expected = expected_direction.get(name, "?")
    ok = "OK" if actual_dir == expected else "XX"
    if expected != "?":
        total += 1
        if ok == "OK":
            match_count += 1
    bar_len = int(abs(val) * 50)
    bar = ("+" if val > 0 else "-") * bar_len
    print(f"  {name:30s} {val:>+.4f} {actual_dir:>6s} {expected:>9s} {ok:>5s}  {bar}")

print(f"\nYön Uyumu: {match_count}/{total} ({match_count/total*100:.0f}%)")
