import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

df = pd.read_csv(ROOT / 'ml/data/kidney_disease.csv')

df = df.rename(columns={
    'age': 'yas',
    'bp': 'kan_basinci',
    'sg': 'ozgul_agirlik',
    'al': 'albumin',
    'su': 'seker',
    'rbc': 'kirmizi_kan_hucresi',
    'pc': 'irin_hucresi',
    'pcc': 'irin_hucresi_kumesi',
    'ba': 'bakteri',
    'bgr': 'rastgele_kan_sekeri',
    'bu': 'kan_ure',
    'sc': 'serum_kreatinin',
    'sod': 'sodyum',
    'pot': 'potasyum',
    'hemo': 'hemoglobin',
    'pcv': 'paketli_hucre_hacmi',
    'wc': 'beyaz_kan_hucresi_sayisi',
    'rc': 'kirmizi_kan_hucresi_sayisi',
    'htn': 'hipertansiyon',
    'dm': 'diyabet',
    'cad': 'koroner_arter_hastaligi',
    'appet': 'istah',
    'pe': 'ayak_ödemi',
    'ane': 'anemi',
    'classification': 'siniflandirma'
})

df.to_csv(ROOT / 'ml/data/kidney_disease_turkce.csv', index=False)
print(df.columns.tolist())