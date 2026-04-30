"""
Veri Temizleme + Model Yeniden Eğitim Scripti
-----------------------------------------------
Bu script kirli veriyi temizler, modeli yeniden eğitir ve model.pt kaydeder.
Çalıştırma: python retrain_model.py
"""

import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, accuracy_score

# ─── 1. Veri Yükleme ve Temizleme ───
print("=" * 60)
print("1. VERİ TEMİZLEME")
print("=" * 60)

df = pd.read_csv("kidney_disease_turkce.csv")
if "id" in df.columns:
    df = df.drop("id", axis=1)

# Tüm string değerlerden tab ve boşluk temizle
for col in df.columns:
    if df[col].dtype == "object":
        df[col] = df[col].str.strip()

# "?" değerlerini NaN yap
df = df.replace("?", np.nan)

# siniflandirma hedef değişkenini encode et (ckd=0, notckd=1)
df["siniflandirma"] = df["siniflandirma"].map({"ckd": 0, "notckd": 1})

# Sayısal olması gereken ama string kalan sütunları dönüştür
numeric_should_be = [
    "paketli_hucre_hacmi", "beyaz_kan_hucresi_sayisi", "kirmizi_kan_hucresi_sayisi"
]
for col in numeric_should_be:
    df[col] = pd.to_numeric(df[col], errors="coerce")
    print(f"  {col}: dtype={df[col].dtype}, NaN={df[col].isna().sum()}")

# Kategorik sütunları binary encode et (temiz mapping)
cat_mappings = {
    "kirmizi_kan_hucresi": {"abnormal": 0, "normal": 1},
    "irin_hucresi": {"abnormal": 0, "normal": 1},
    "irin_hucresi_kumesi": {"notpresent": 0, "present": 1},
    "bakteri": {"notpresent": 0, "present": 1},
    "hipertansiyon": {"no": 0, "yes": 1},
    "diyabet": {"no": 0, "yes": 1},
    "koroner_arter_hastaligi": {"no": 0, "yes": 1},
    "istah": {"good": 0, "poor": 1},
    "ayak_odemi": {"no": 0, "yes": 1},
    "ayak_ödemi": {"no": 0, "yes": 1},
    "anemi": {"no": 0, "yes": 1},
}

for col, mapping in cat_mappings.items():
    if col in df.columns:
        df[col] = df[col].map(mapping)
        nan_count = df[col].isna().sum()
        if nan_count > 0:
            df[col] = df[col].fillna(df[col].mode()[0])
        print(f"  {col}: {mapping} -> NaN={nan_count}")

# Sayısal NaN'ları medyan ile doldur
for col in df.select_dtypes(include=[np.number]).columns:
    if df[col].isna().sum() > 0:
        median = df[col].median()
        df[col] = df[col].fillna(median)
        print(f"  {col}: NaN dolduruldu (median={median:.2f})")

print(f"\nTemiz veri boyutu: {df.shape}")
print(f"Sınıf dağılımı:\n{df['siniflandirma'].value_counts()}")

# ─── 2. Feature & Target ───
X = df.drop("siniflandirma", axis=1)
y = df["siniflandirma"]

feature_order = list(X.columns)
print(f"\nFeature sırası ({len(feature_order)}):")
for i, f in enumerate(feature_order):
    print(f"  [{i}] {f}")

# ─── 3. StandardScaler ───
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print(f"\n{'='*60}")
print("2. SCALER PARAMETRELERİ (main.py'ye kopyalanacak)")
print(f"{'='*60}")
print("\nscaler_mean = {")
for col, mean in zip(feature_order, scaler.mean_):
    print(f'    "{col}": {mean:.6f},')
print("}")
print("\nscaler_std = {")
for col, std in zip(feature_order, scaler.scale_):
    print(f'    "{col}": {std:.6f},')
print("}")

# ─── 4. Train/Val/Test Split ───
X_train, X_temp, y_train, y_temp = train_test_split(
    X_scaled, y, test_size=0.3, random_state=42, stratify=y
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
)

print(f"\nEğitim: {X_train.shape[0]}, Doğrulama: {X_val.shape[0]}, Test: {X_test.shape[0]}")

# ─── 5. PyTorch Tensörleri ───
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
X_train_t = torch.tensor(X_train, dtype=torch.float32).to(device)
y_train_t = torch.tensor(y_train.values, dtype=torch.long).to(device)
X_val_t = torch.tensor(X_val, dtype=torch.float32).to(device)
y_val_t = torch.tensor(y_val.values, dtype=torch.long).to(device)
X_test_t = torch.tensor(X_test, dtype=torch.float32).to(device)
y_test_t = torch.tensor(y_test.values, dtype=torch.long).to(device)

input_size = X_train.shape[1]
num_classes = len(y.unique())
print(f"Input size: {input_size}, Classes: {num_classes}")

# ─── 6. Model Tanımı ───
class DynamicMLPModel(nn.Module):
    def __init__(self, input_size, hidden_layers, num_classes):
        super().__init__()
        self.layers = nn.ModuleList()
        self.act = nn.ReLU()
        in_features = input_size
        for out_features in hidden_layers:
            self.layers.append(nn.Linear(in_features, out_features))
            in_features = out_features
        self.output_layer = nn.Linear(in_features, num_classes)

    def forward(self, x):
        for layer in self.layers:
            x = self.act(layer(x))
        return self.output_layer(x)

model = DynamicMLPModel(input_size, (64, 32), num_classes).to(device)

# Xavier init
def init_weights(m):
    if isinstance(m, nn.Linear):
        torch.nn.init.xavier_uniform_(m.weight)
        m.bias.data.fill_(0.01)
model.apply(init_weights)

# Class weights
class_weights = compute_class_weight("balanced", classes=np.unique(y_train), y=y_train)
tensor_weights = torch.tensor(class_weights, dtype=torch.float32).to(device)
criterion = nn.CrossEntropyLoss(weight=tensor_weights)
optimizer = optim.Adam(model.parameters(), lr=0.001)

# ─── 7. Eğitim ───
print(f"\n{'='*60}")
print("3. EĞİTİM")
print(f"{'='*60}")

epochs = 100
best_val_acc = 0
best_model_state = None

for epoch in range(epochs):
    model.train()
    optimizer.zero_grad()
    outputs = model(X_train_t)
    loss = criterion(outputs, y_train_t)
    loss.backward()
    optimizer.step()

    # Validation
    model.eval()
    with torch.no_grad():
        val_out = model(X_val_t)
        val_preds = torch.argmax(val_out, dim=1)
        val_acc = (val_preds == y_val_t).float().mean().item()

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        best_model_state = model.state_dict().copy()

    if (epoch + 1) % 10 == 0:
        print(f"  Epoch {epoch+1:3d} | Loss: {loss.item():.4f} | Val Acc: {val_acc*100:.1f}%")

# En iyi modeli yükle
model.load_state_dict(best_model_state)
print(f"\nEn iyi validation accuracy: {best_val_acc*100:.1f}%")

# ─── 8. Test ───
model.eval()
with torch.no_grad():
    test_out = model(X_test_t)
    test_preds = torch.argmax(test_out, dim=1).cpu().numpy()

print(f"\n{'='*60}")
print("4. TEST SONUÇLARI")
print(f"{'='*60}")
print(f"Test Accuracy: {accuracy_score(y_test, test_preds)*100:.1f}%")
print(classification_report(y_test, test_preds, target_names=["CKD (Hasta)", "NotCKD (Sağlıklı)"]))
print(f"Vall Acc: {best_val_acc*100:.1f}%")

from sklearn.metrics import precision_recall_fscore_support

# Test setinde precision/recall/f1 al
precision, recall, f1, _ = precision_recall_fscore_support(y_test, test_preds, average=None, labels=[0, 1])

print(f"\n{'='*60}")
print("5. PRECISION / RECALL / F1")
print(f"{'='*60}")
print(f"CKD (Hasta): Precision={precision[0]:.3f} | Recall={recall[0]:.3f} | F1={f1[0]:.3f}")
print(f"NotCKD:      Precision={precision[1]:.3f} | Recall={recall[1]:.3f} | F1={f1[1]:.3f}")

# ─── 9. Modeli Kaydet ───
save_path = "backend/model.pt"
torch.save(best_model_state, save_path)
print(f"\nModel kaydedildi: {save_path}")
print(f"Keys: {list(best_model_state.keys())}")
for k, v in best_model_state.items():
    print(f"  {k}: {v.shape}")

print(f"\n{'='*60}")
print("5. YAPILACAKLAR")
print(f"{'='*60}")
print("1. Yukarıdaki scaler_mean ve scaler_std değerlerini backend/main.py'ye kopyala")
print("2. backend/model.py'deki num_classes'ı 2 olarak güncelle")
print("3. main.py'deki feature_order'ı yukarıdaki sıraya göre güncelle")
print("4. main.py'deki disease_pct hesabını düzelt: probabilities[0] = CKD (hasta)")
print("5. Frontend'teki dropdown value'larını 0/1 binary olarak güncelle")
