import httpx

data_sick = {"yas":60,"kan_basinci":100,"ozgul_agirlik":1.005,"albumin":4,"seker":3,"rastgele_kan_sekeri":250,"kan_ure":120,"serum_kreatinin":8.0,"sodyum":125,"potasyum":5.5,"hemoglobin":8.0,"paketli_hucre_hacmi":25,"beyaz_kan_hucresi_sayisi":12000,"kirmizi_kan_hucresi_sayisi":3.0,"kirmizi_kan_hucresi":1,"irin_hucresi":1,"irin_hucresi_kumesi":1,"bakteri":1,"hipertansiyon":1,"diyabet":1,"koroner_arter_hastaligi":1,"istah":1,"ayak_odemi":1,"anemi":1}

data_healthy = {"yas":46,"kan_basinci":70,"ozgul_agirlik":1.025,"albumin":0,"seker":0,"rastgele_kan_sekeri":100,"kan_ure":30,"serum_kreatinin":0.8,"sodyum":142,"potasyum":4.0,"hemoglobin":15.5,"paketli_hucre_hacmi":44,"beyaz_kan_hucresi_sayisi":7500,"kirmizi_kan_hucresi_sayisi":5.0,"kirmizi_kan_hucresi":0,"irin_hucresi":0,"irin_hucresi_kumesi":0,"bakteri":0,"hipertansiyon":0,"diyabet":0,"koroner_arter_hastaligi":0,"istah":0,"ayak_odemi":0,"anemi":0}

for name, data in [("HASTA", data_sick), ("SAGLIKLI", data_healthy)]:
    r = httpx.post("http://localhost:8000/predict", json=data, timeout=30)
    resp = r.json()
    pred = resp["prediction"]
    conf = resp["confidence"]
    label = resp["prediction_label"]
    print(f"{name}: prediction={pred}, label={label}, confidence={conf:.1f}%")
