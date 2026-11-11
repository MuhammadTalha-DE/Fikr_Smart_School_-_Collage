"""
═══════════════════════════════════════════════════════════════
PHASE 3 — COMPARE MULTIPLE ML MODELS
Trains 5 models, compares performance, picks the winner

Models:
  1. Logistic Regression — Simple baseline
  2. Support Vector Machine (SVM) — Finds best boundary
  3. Random Forest — 100 trees voting
  4. Gradient Boosting — Trees that learn from mistakes
  5. K‑Nearest Neighbors (KNN) — Looks at similar students
═══════════════════════════════════════════════════════════════
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import os
import time

print("=" * 65)
print("🔬 PHASE 3 — MULTI‑MODEL COMPARISON")
print("=" * 65)

# ═══════════════════════════════════════════════════
# 1. LOAD DATA (same as Phase 2)
# ═══════════════════════════════════════════════════
csv_path = 'datasets/processed_dropout_data.csv'
if not os.path.exists(csv_path):
    print("❌ Run Phase 1 first: python phase1_explore.py")
    exit(1)

df = pd.read_csv(csv_path)
print(f"\n✅ Loaded {len(df):,} students")

# Same 10 features from Phase 2
feature_columns = [
    'Admission grade', 'Age at enrollment', 'Tuition fees up to date',
    'Scholarship holder', 'Debtor', 'Gender',
    'Curricular units 1st sem (approved)', 'Curricular units 1st sem (grade)',
    'Curricular units 2nd sem (approved)', 'Curricular units 2nd sem (grade)',
]

X = df[feature_columns].values
y = df['dropout'].values

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Scale
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"   Training: {X_train.shape[0]} | Testing: {X_test.shape[0]}")

# ═══════════════════════════════════════════════════
# 2. DEFINE THE 5 MODELS
# ═══════════════════════════════════════════════════

models = {
    # ── Model 1: Logistic Regression ──────────────
    # What it does: Draws a straight line to separate dropout from safe.
    # Simple, fast, and often surprisingly good.
    # max_iter=2000 = "Try up to 2000 times to find the best line"
    # class_weight='balanced' = "Pay attention to dropout even though there are fewer"
    'Logistic Regression': LogisticRegression(
        max_iter=2000,
        class_weight='balanced',
        random_state=42
    ),

    # ── Model 2: Support Vector Machine ───────────
    # What it does: Finds the "widest street" that separates dropout from safe.
    # kernel='rbf' = uses curves, not just straight lines
    # probability=True = can tell us HOW confident it is (needed for risk scores)
    # class_weight='balanced' = handles imbalanced data
    'SVM': SVC(
        kernel='rbf',
        probability=True,
        class_weight='balanced',
        random_state=42
    ),

    # ── Model 3: Random Forest ────────────────────
    # What it does: 100 decision trees voting together.
    # Same as Phase 2 — our baseline for comparison.
    'Random Forest': RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight='balanced',
        random_state=42
    ),

    # ── Model 4: Gradient Boosting ────────────────
    # What it does: Trees that learn from the mistakes of previous trees.
    # Each new tree focuses on what earlier trees got wrong.
    # Often the most accurate model for tabular data.
    # learning_rate=0.1 = "Take small steps to avoid overshooting"
    'Gradient Boosting': GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    ),

    # ── Model 5: K‑Nearest Neighbors ──────────────
    # What it does: "Show me the 5 most similar students, and I'll predict
    #               the same outcome as the majority of them."
    # n_neighbors=5 = look at the 5 closest students
    # Simple and intuitive — like asking your neighbors for advice.
    'KNN': KNeighborsClassifier(
        n_neighbors=5,
        weights='distance'  # Closer neighbors matter more
    ),
}

print(f"\n🤖 Models to compare: {len(models)}")
for name in models:
    print(f"   • {name}")

# ═══════════════════════════════════════════════════
# 3. TRAIN & EVALUATE EACH MODEL
# ═══════════════════════════════════════════════════
print(f"\n⏳ Training and evaluating all models...")
print(f"   {'─'*55}")

results = {}
best_model = None
best_f1 = 0

for name, model in models.items():
    # ── Train ─────────────────────────────────────
    start_time = time.time()
    model.fit(X_train_scaled, y_train)
    train_time = time.time() - start_time

    # ── Predict ────────────────────────────────────
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]  # Probability of dropout

    # ── Calculate ALL metrics ──────────────────────
    results[name] = {
        'model': model,
        'accuracy':  accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'recall':    recall_score(y_test, y_pred, zero_division=0),
        'f1':        f1_score(y_test, y_pred, zero_division=0),
        'roc_auc':   roc_auc_score(y_test, y_proba),
        'train_time': train_time,
    }

    # ── Print results ──────────────────────────────
    r = results[name]
    print(f"\n   📊 {name}:")
    print(f"      Accuracy:  {r['accuracy']:.2%}")
    print(f"      Precision: {r['precision']:.2%}")
    print(f"      Recall:    {r['recall']:.2%} (how many actual dropouts caught)")
    print(f"      F1 Score:  {r['f1']:.2%} ⭐")
    print(f"      ROC AUC:   {r['roc_auc']:.2%}")
    print(f"      Train Time: {train_time:.2f}s")

    # ── Track the best model (by F1 score) ─────────
    if r['f1'] > best_f1:
        best_f1 = r['f1']
        best_model = name

# ═══════════════════════════════════════════════════
# 4. COMPARISON TABLE
# ═══════════════════════════════════════════════════
print(f"\n" + "=" * 65)
print(f"🏆 MODEL COMPARISON TABLE")
print(f"=" * 65)
print(f"{'Model':25s} {'Accuracy':>10s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s} {'ROC AUC':>10s}")
print(f"{'─'*25} {'─'*10} {'─'*10} {'─'*10} {'─'*10} {'─'*10}")

# Sort by F1 score (best first)
sorted_results = sorted(results.items(), key=lambda x: x[1]['f1'], reverse=True)

for name, r in sorted_results:
    marker = ' 👑' if name == best_model else ''
    print(f"{name+marker:25s} {r['accuracy']:>9.2%} {r['precision']:>9.2%} {r['recall']:>9.2%} {r['f1']:>9.2%} {r['roc_auc']:>9.2%}")

# ═══════════════════════════════════════════════════
# 5. CROSS‑VALIDATION (the real test!)
# ═══════════════════════════════════════════════════
print(f"\n📊 5‑Fold Cross‑Validation (more reliable than single test):")
print(f"   {'─'*55}")

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for name, model in models.items():
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring='f1')
    print(f"   {name:25s} → F1 scores: {[f'{s:.2%}' for s in cv_scores]}")
    print(f"   {'':25s}   Mean: {cv_scores.mean():.2%} (±{cv_scores.std()*2:.2%})")

# ═══════════════════════════════════════════════════
# 6. SAVE THE BEST MODEL
# ═══════════════════════════════════════════════════
print(f"\n💾 Saving the best model...")

winner_model = results[best_model]['model']
os.makedirs('models', exist_ok=True)

joblib.dump(winner_model, 'models/best_dropout_model.pkl')
joblib.dump(scaler, 'models/best_dropout_scaler.pkl')
joblib.dump(feature_columns, 'models/best_dropout_features.pkl')

print(f"   🏆 Winner: {best_model}")
print(f"   F1 Score: {best_f1:.2%}")
print(f"   ✅ models/best_dropout_model.pkl")
print(f"   ✅ models/best_dropout_scaler.pkl")
print(f"   ✅ models/best_dropout_features.pkl")

# ═══════════════════════════════════════════════════
# 7. WHAT EACH MODEL IS BEST AT
# ═══════════════════════════════════════════════════
print(f"\n📋 Model Selection Guide:")
print(f"   {'─'*55}")

# Find the model with the highest recall
best_recall_model = max(results, key=lambda k: results[k]['recall'])
best_precision_model = max(results, key=lambda k: results[k]['precision'])
best_fast_model = min(results, key=lambda k: results[k]['train_time'])

print(f"   🎯 Best at catching dropouts (recall): {best_recall_model}")
print(f"      → Use this when you can't afford to miss anyone")
print(f"   🎯 Best at avoiding false alarms (precision): {best_precision_model}")
print(f"      → Use this when you want to minimize unnecessary interventions")
print(f"   ⚡ Fastest to train: {best_fast_model}")
print(f"      → Use this when you need quick results on large data")
print(f"   ⭐ Best overall (F1 score): {best_model}")
print(f"      → Best balance — use this for general purpose")

print(f"\n" + "=" * 65)
print(f"🎉 PHASE 3 COMPLETE!")
print(f"   Winner: {best_model} (F1={best_f1:.2%})")
print(f"   Ready for Phase 4: Hyperparameter Tuning!")
print("=" * 65)