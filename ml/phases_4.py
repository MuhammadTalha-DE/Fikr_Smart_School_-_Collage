"""
═══════════════════════════════════════════════════════════════
PHASE 4 — HYPERPARAMETER TUNING
Fine‑tunes the winning Random Forest model for maximum accuracy

What are hyperparameters?
  - Settings we choose BEFORE training (not learned from data)
  - Like: number of trees, tree depth, samples per leaf
  - Tuning = trying different combinations to find the best

We'll use GridSearchCV:
  - "Try EVERY combination of these settings"
  - Tests hundreds of combinations automatically
  - Picks the one with the best cross‑validation score
═══════════════════════════════════════════════════════════════
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
import joblib
import os
import time

print("=" * 65)
print("🔧 PHASE 4 — HYPERPARAMETER TUNING")
print("=" * 65)

# ═══════════════════════════════════════════════════
# 1. LOAD DATA
# ═══════════════════════════════════════════════════
csv_path = 'datasets/processed_dropout_data.csv'
if not os.path.exists(csv_path):
    print("❌ Run Phase 1 first: python phase1_explore.py")
    exit(1)

df = pd.read_csv(csv_path)
print(f"\n✅ Loaded {len(df):,} students")

feature_columns = [
    'Admission grade', 'Age at enrollment', 'Tuition fees up to date',
    'Scholarship holder', 'Debtor', 'Gender',
    'Curricular units 1st sem (approved)', 'Curricular units 1st sem (grade)',
    'Curricular units 2nd sem (approved)', 'Curricular units 2nd sem (grade)',
]

X = df[feature_columns].values
y = df['dropout'].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ═══════════════════════════════════════════════════
# 2. BASELINE (before tuning)
# ═══════════════════════════════════════════════════
print(f"\n📊 BASELINE (before tuning)...")

baseline = RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=42)
baseline.fit(X_train_scaled, y_train)
baseline_pred = baseline.predict(X_test_scaled)
baseline_f1 = f1_score(y_test, baseline_pred)

print(f"   Baseline F1 Score: {baseline_f1:.2%}")
print(f"   Goal: Beat this!")

# ═══════════════════════════════════════════════════
# 3. DEFINE THE PARAMETER GRID
# ═══════════════════════════════════════════════════
print(f"\n🔧 Defining parameter grid...")

# ── What each parameter means ─────────────────────
# n_estimators    = number of trees (more = better but slower)
# max_depth       = how deep each tree can go (deeper = more complex patterns)
# min_samples_split = minimum students to ask another question
# min_samples_leaf  = minimum students in final group
# max_features    = how many features each tree looks at

param_grid = {
    'n_estimators': [100, 200, 300],                    # Try 100, 200, or 300 trees
    'max_depth': [5, 10, 15, 20],                       # Try different depths
    'min_samples_split': [2, 5, 10],                    # How many to split
    'min_samples_leaf': [1, 2, 4],                      # Minimum group size
    'max_features': ['sqrt', 'log2', None],              # Features per tree
}

# Calculate total combinations
total_combos = 1
for values in param_grid.values():
    total_combos *= len(values)
print(f"   Total combinations to test: {total_combos}")

# ═══════════════════════════════════════════════════
# 4. RUN GRID SEARCH
# ═══════════════════════════════════════════════════
print(f"\n⏳ Running Grid Search (this may take a few minutes)...")
print(f"   Testing {total_combos} combinations with 5‑fold cross‑validation...")

start_time = time.time()

# GridSearchCV does ALL the work:
#   1. Takes one combination of parameters
#   2. Trains a model with 5‑fold cross‑validation
#   3. Records the average F1 score
#   4. Repeats for ALL combinations
#   5. Returns the best one

grid_search = GridSearchCV(
    RandomForestClassifier(class_weight='balanced', random_state=42),
    param_grid,
    cv=5,                    # 5‑fold cross‑validation
    scoring='f1',            # Optimize for F1 score
    n_jobs=-1,               # Use ALL CPU cores
    verbose=1                # Show progress
)

grid_search.fit(X_train_scaled, y_train)

elapsed = time.time() - start_time
print(f"\n   ✅ Grid Search complete! ({elapsed:.0f} seconds)")

# ═══════════════════════════════════════════════════
# 5. RESULTS
# ═══════════════════════════════════════════════════
print(f"\n🏆 BEST PARAMETERS FOUND:")
print(f"   " + "─"*45)
for param, value in grid_search.best_params_.items():
    print(f"   {param:25s} = {value}")

print(f"\n   Best Cross‑Validation F1: {grid_search.best_score_:.2%}")
print(f"   (This is the average F1 across all 5 validation folds)")

# ═══════════════════════════════════════════════════
# 6. EVALUATE ON TEST DATA
# ═══════════════════════════════════════════════════
print(f"\n📊 Testing optimized model on unseen data...")

best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test_scaled)

accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"\n   📈 Before tuning: F1 = {baseline_f1:.2%}")
print(f"   📈 After tuning:  F1 = {f1:.2%}")
print(f"   📈 Improvement:   +{(f1 - baseline_f1)*100:.1f} percentage points!")

print(f"\n📊 Detailed Report:")
print(classification_report(y_test, y_pred, target_names=['Safe', 'Dropout']))

cm = confusion_matrix(y_test, y_pred)
print(f"\n📊 Confusion Matrix:")
print(f"   True Negatives  (Safe → Safe):         {cm[0][0]:4d} ✅")
print(f"   False Positives (Safe → Dropout):      {cm[0][1]:4d} ❌")
print(f"   False Negatives (Dropout → Safe):      {cm[1][0]:4d} ❌")
print(f"   True Positives  (Dropout → Dropout):   {cm[1][1]:4d} ✅")

# ═══════════════════════════════════════════════════
# 7. TOP 3 BEST COMBINATIONS
# ═══════════════════════════════════════════════════
print(f"\n📊 Top 3 Parameter Combinations:")
results_df = pd.DataFrame(grid_search.cv_results_)
top3 = results_df.nlargest(3, 'mean_test_score')

for i, (_, row) in enumerate(top3.iterrows(), 1):
    print(f"\n   #{i} — F1: {row['mean_test_score']:.2%}")
    params = row['params']
    print(f"      n_estimators={params['n_estimators']}, max_depth={params['max_depth']}")
    print(f"      min_samples_split={params['min_samples_split']}, min_samples_leaf={params['min_samples_leaf']}")

# ═══════════════════════════════════════════════════
# 8. SAVE THE OPTIMIZED MODEL
# ═══════════════════════════════════════════════════
print(f"\n💾 Saving optimized model...")
os.makedirs('models', exist_ok=True)

joblib.dump(best_model, 'models/optimized_dropout_model.pkl')
joblib.dump(scaler, 'models/optimized_dropout_scaler.pkl')
joblib.dump(feature_columns, 'models/optimized_dropout_features.pkl')

print(f"   ✅ models/optimized_dropout_model.pkl")
print(f"   ✅ models/optimized_dropout_scaler.pkl")
print(f"   ✅ models/optimized_dropout_features.pkl")

print(f"\n" + "=" * 65)
print(f"🎉 PHASE 4 COMPLETE!")
print(f"   Baseline F1: {baseline_f1:.2%}")
print(f"   Optimized F1: {f1:.2%}")
print(f"   Improvement: +{(f1 - baseline_f1)*100:.1f} percentage points!")
print(f"   Ready for Phase 5: Prediction API!")
print("=" * 65)