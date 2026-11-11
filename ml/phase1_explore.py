"""
═══════════════════════════════════════════════════════════════
PHASE 1 — DATA COLLECTION & EXPLORATION
Student Dropout Prediction Dataset (UCI)
4,424 students · 37 features · Target: Dropout/Enrolled/Graduate
═══════════════════════════════════════════════════════════════
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

# ── Settings ──────────────────────────────────────
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 120)
plt.style.use('ggplot')
print("=" * 65)
print("🎓 PHASE 1 — STUDENT DROPOUT DATA EXPLORATION")
print("=" * 65)

# ═══════════════════════════════════════════════════
# 1. LOAD THE DATA
# ═══════════════════════════════════════════════════
print("\n📥 1. Loading dataset...")
csv_path = 'datasets/data.csv'

if not os.path.exists(csv_path):
    print("❌ Dataset not found! Download it first:")
    print("   cd datasets")
    print("   curl -L -o dropout_dataset.zip https://archive.ics.uci.edu/static/public/697/predict+students+dropout+and+academic+success.zip")
    print("   powershell -Command \"Expand-Archive -Path dropout_dataset.zip -DestinationPath . -Force\"")
    print("   cd ..")
    exit(1)

df = pd.read_csv(csv_path, sep=';')
print(f"   ✅ Loaded {len(df):,} student records")
print(f"   ✅ {len(df.columns)} features")

# ═══════════════════════════════════════════════════
# 2. FIRST LOOK
# ═══════════════════════════════════════════════════
print(f"\n📊 2. First 5 rows:")
print(df.head().to_string())

print(f"\n📊 Column names:")
for i, col in enumerate(df.columns, 1):
    print(f"   {i:2d}. {col}")

# ═══════════════════════════════════════════════════
# 3. DATA TYPES & MISSING VALUES
# ═══════════════════════════════════════════════════
print(f"\n🔍 3. Data types & missing values:")
print(df.dtypes.value_counts().to_string())

missing = df.isnull().sum()
missing = missing[missing > 0]
if len(missing) > 0:
    print(f"\n   ⚠️ Missing values found:")
    print(missing.to_string())
else:
    print(f"   ✅ No missing values!")

# ═══════════════════════════════════════════════════
# 4. TARGET VARIABLE ANALYSIS
# ═══════════════════════════════════════════════════
print(f"\n🎯 4. Target variable: 'Target'")
print(df['Target'].value_counts().to_string())
print(f"\n   Distribution:")
for label, count in df['Target'].value_counts().items():
    pct = count / len(df) * 100
    bar = '█' * int(pct / 2)
    print(f"   {label:12s}: {count:5d} ({pct:5.1f}%) {bar}")

# Create binary target for dropout (1=Dropout, 0=Not Dropout)
df['dropout'] = (df['Target'] == 'Dropout').astype(int)
dropout_count = df['dropout'].sum()
print(f"\n   Binary target 'dropout':")
print(f"   Dropout (1): {dropout_count} ({dropout_count/len(df)*100:.1f}%)")
print(f"   Safe (0):    {len(df)-dropout_count} ({(len(df)-dropout_count)/len(df)*100:.1f}%)")

# ═══════════════════════════════════════════════════
# 5. NUMERICAL FEATURES STATISTICS
# ═══════════════════════════════════════════════════
print(f"\n📈 5. Numerical features summary:")
numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
print(f"   {len(numerical_cols)} numerical features")

# Show key features - auto-detect column names
all_cols = df.columns.tolist()

# Helper to find column by partial name
def find_col(possible_names):
    for name in possible_names:
        if name in all_cols:
            return name
    # Try case-insensitive
    for name in possible_names:
        for col in all_cols:
            if col.lower() == name.lower():
                return col
    return None

age_col = find_col(['Age at enrollment', 'Age_at_enrollment'])
grade_col = find_col(['Admission grade', 'Admission_grade'])
fee_col = find_col(['Tuition fees up to date', 'Tuition_fees_up_to_date'])
scholar_col = find_col(['Scholarship holder', 'Scholarship_holder'])
debtor_col = find_col(['Debtor'])
gender_col = find_col(['Gender'])

print(f"\n   Detected columns:")
print(f"   Age column: '{age_col}'")
print(f"   Grade column: '{grade_col}'")
print(f"   Fee column: '{fee_col}'")
print(f"   Scholarship column: '{scholar_col}'")

# Show stats for key numerical features
key_features = [c for c in [age_col, grade_col] if c]
if key_features:
    print(f"\n   Key feature statistics:")
    print(df[key_features].describe().round(2).to_string())

# ═══════════════════════════════════════════════════
# 6. CATEGORICAL FEATURES
# ═══════════════════════════════════════════════════
print(f"\n📊 6. Categorical features:")
categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
if 'Target' in categorical_cols:
    categorical_cols.remove('Target')
print(f"   {len(categorical_cols)} categorical features")

for col in categorical_cols[:5]:
    print(f"\n   {col}:")
    print(df[col].value_counts().head().to_string())

# ═══════════════════════════════════════════════════
# 7. CORRELATION WITH DROPOUT
# ═══════════════════════════════════════════════════
print(f"\n🔗 7. Correlation with dropout:")
correlations = df[numerical_cols].corr()['dropout'].drop('dropout').sort_values(key=abs, ascending=False)
print(f"\n   Top 15 features correlated with dropout:")
for feat, corr in correlations.head(15).items():
    direction = '⬆️  more dropout' if corr > 0 else '⬇️  less dropout'
    print(f"   {feat:45s}: {corr:+.3f}  {direction}")

# ═══════════════════════════════════════════════════
# 8. KEY INSIGHTS
# ═══════════════════════════════════════════════════
print(f"\n📋 8. Key Insights:")

if fee_col:
    fee_up = df[df[fee_col] == 1]['dropout'].mean() * 100
    fee_not = df[df[fee_col] == 0]['dropout'].mean() * 100
    print(f"\n   💰 Fee Payment:")
    print(f"   Up-to-date fees dropout rate:   {fee_up:.1f}%")
    print(f"   Not up-to-date dropout rate:    {fee_not:.1f}%")
    print(f"   Risk difference: {fee_not - fee_up:.1f} percentage points")

if scholar_col:
    scholar = df[df[scholar_col] == 1]['dropout'].mean() * 100
    noscholar = df[df[scholar_col] == 0]['dropout'].mean() * 100
    print(f"\n   🎓 Scholarship:")
    print(f"   Scholarship holders dropout:    {scholar:.1f}%")
    print(f"   Non-scholarship dropout:       {noscholar:.1f}%")

if grade_col:
    median_grade = df[grade_col].median()
    high_grade = df[df[grade_col] > median_grade]['dropout'].mean() * 100
    low_grade = df[df[grade_col] <= median_grade]['dropout'].mean() * 100
    print(f"\n   📝 Admission Grade (median={median_grade}):")
    print(f"   Above-median grade dropout: {high_grade:.1f}%")
    print(f"   Below-median grade dropout: {low_grade:.1f}%")

if age_col:
    young = df[df[age_col] <= 20]['dropout'].mean() * 100
    older = df[df[age_col] > 20]['dropout'].mean() * 100
    print(f"\n   👤 Age:")
    print(f"   Age ≤ 20 dropout rate: {young:.1f}%")
    print(f"   Age > 20 dropout rate: {older:.1f}%")

if debtor_col:
    debtor_yes = df[df[debtor_col] == 1]['dropout'].mean() * 100
    debtor_no = df[df[debtor_col] == 0]['dropout'].mean() * 100
    print(f"\n   💳 Debtor Status:")
    print(f"   Debtors dropout rate:    {debtor_yes:.1f}%")
    print(f"   Non-debtors dropout rate: {debtor_no:.1f}%")

if gender_col:
    male_dropout = df[df[gender_col] == 1]['dropout'].mean() * 100 if df[gender_col].nunique() <= 2 else df[df[gender_col] == df[gender_col].mode()[0]]['dropout'].mean() * 100
    female_dropout = df[df[gender_col] == 0]['dropout'].mean() * 100 if df[gender_col].nunique() <= 2 else df[df[gender_col] != df[gender_col].mode()[0]]['dropout'].mean() * 100
    print(f"\n   ⚧ Gender:")
    print(f"   Male dropout rate:   {male_dropout:.1f}%")
    print(f"   Female dropout rate: {female_dropout:.1f}%")

# ═══════════════════════════════════════════════════
# 9. CREATE VISUALIZATIONS
# ═══════════════════════════════════════════════════
print(f"\n📈 9. Creating visualizations...")

fig, axes = plt.subplots(2, 3, figsize=(16, 10))
fig.suptitle('Student Dropout Dataset Analysis', fontsize=16, fontweight='bold')

# Plot 1: Target Distribution
dropout_counts = df['Target'].value_counts()
axes[0, 0].bar(dropout_counts.index, dropout_counts.values, color=['#e74c3c', '#f39c12', '#2ecc71'], edgecolor='white')
axes[0, 0].set_title('Target Distribution (Dropout/Enrolled/Graduate)')
axes[0, 0].set_ylabel('Number of Students')
for i, (label, count) in enumerate(dropout_counts.items()):
    axes[0, 0].text(i, count + 30, f'{count}\n({count/len(df)*100:.1f}%)', ha='center', fontweight='bold')

# Plot 2: Age vs Dropout
if age_col:
    axes[0, 1].hist([df[df['dropout']==0][age_col], df[df['dropout']==1][age_col]],
                    label=['Safe', 'Dropout'], bins=15, alpha=0.7, color=['#2ecc71', '#e74c3c'])
    axes[0, 1].set_title(f'{age_col} vs Dropout')
    axes[0, 1].set_xlabel(age_col)
    axes[0, 1].legend()

# Plot 3: Grade vs Dropout
if grade_col:
    axes[0, 2].hist([df[df['dropout']==0][grade_col], df[df['dropout']==1][grade_col]],
                    label=['Safe', 'Dropout'], bins=15, alpha=0.7, color=['#2ecc71', '#e74c3c'])
    axes[0, 2].set_title(f'{grade_col} vs Dropout')
    axes[0, 2].set_xlabel(grade_col)
    axes[0, 2].legend()

# Plot 4: Fee Status vs Dropout
if fee_col:
    fee_dropout = df.groupby(fee_col)['dropout'].mean() * 100
    axes[1, 0].bar(['Not Up to Date', 'Up to Date'], fee_dropout.values, color=['#e74c3c', '#2ecc71'])
    axes[1, 0].set_title(f'{fee_col} vs Dropout Rate')
    axes[1, 0].set_ylabel('Dropout Rate (%)')
    for i, v in enumerate(fee_dropout.values):
        axes[1, 0].text(i, v + 1, f'{v:.1f}%', ha='center', fontweight='bold')

# Plot 5: Scholarship vs Dropout
if scholar_col:
    sch_dropout = df.groupby(scholar_col)['dropout'].mean() * 100
    axes[1, 1].bar(['No Scholarship', 'Scholarship'], sch_dropout.values, color=['#e74c3c', '#2ecc71'])
    axes[1, 1].set_title(f'{scholar_col} vs Dropout Rate')
    axes[1, 1].set_ylabel('Dropout Rate (%)')
    for i, v in enumerate(sch_dropout.values):
        axes[1, 1].text(i, v + 1, f'{v:.1f}%', ha='center', fontweight='bold')

# Plot 6: Correlation Heatmap
top_features = correlations.head(8).index.tolist()
corr_matrix = df[top_features + ['dropout']].corr()
sns.heatmap(corr_matrix, annot=True, cmap='RdBu_r', center=0, fmt='.2f',
            ax=axes[1, 2], cbar_kws={'shrink': 0.8})
axes[1, 2].set_title('Top Feature Correlations')

plt.tight_layout()
plt.savefig('datasets/phase1_exploration.png', dpi=150, bbox_inches='tight')
print(f"   ✅ Saved to datasets/phase1_exploration.png")

# ═══════════════════════════════════════════════════
# 10. SAVE PROCESSED DATA
# ═══════════════════════════════════════════════════
print(f"\n💾 10. Saving processed data...")
df.to_csv('datasets/processed_dropout_data.csv', index=False)
print(f"   ✅ Saved to datasets/processed_dropout_data.csv")

# ═══════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════
print(f"\n" + "=" * 65)
print(f"✅ PHASE 1 COMPLETE!")
print(f"   Dataset: {len(df):,} students, {len(df.columns)} features")
print(f"   Target: Dropout (1,421) vs Safe (3,003)")
print(f"   Output: datasets/processed_dropout_data.csv")
print(f"   Visualization: datasets/phase1_exploration.png")
print(f"   Ready for Phase 2: Model Training!")
print("=" * 65)