"""
═══════════════════════════════════════════════════════════════
PHASE 2 — TRAIN YOUR FIRST MACHINE LEARNING MODEL
Student Dropout Predictor — Random Forest Classifier

EVERY LINE EXPLAINED — Learn what each line actually does!
═══════════════════════════════════════════════════════════════
"""

# ============================================================
# SECTION 1: IMPORTS — Bringing in the tools we need
# ============================================================

# pandas = "Python Data Analysis Library"
# It lets us work with tables of data (like Excel spreadsheets in Python)
# We use 'pd' as a shorter name to type
import pandas as pd

# numpy = "Numerical Python"
# It gives us fast math operations on large arrays of numbers
# We use 'np' as a shorter name
import numpy as np

# train_test_split = a function that splits our data into two parts:
#   1. Training data (to teach the model)
#   2. Testing data (to check if the model learned correctly)
# Think of it like: 80% of questions to study, 20% for the final exam
from sklearn.model_selection import train_test_split

# StandardScaler = makes all numbers in the same range (0 to 1 or similar)
# Why? Because "age=20" and "grade=140" are on completely different scales
# The model gets confused if one number is 20 and another is 140
# Scaler makes them comparable — like converting everything to percentages
from sklearn.preprocessing import StandardScaler

# RandomForestClassifier = our ML model
# "Random Forest" = A collection of decision trees that vote on the answer
# Imagine 100 teachers each giving their opinion, then taking the majority vote
from sklearn.ensemble import RandomForestClassifier

# These are our "report card" functions — they tell us how well the model did
# accuracy_score = what percentage did we get right?
# classification_report = detailed breakdown (like a school report card)
# confusion_matrix = shows what we got right AND wrong
# f1_score = balance between "catching all dropouts" and "not crying wolf"
from sklearn.metrics import (
    accuracy_score,           # How many predictions were correct?
    classification_report,    # Detailed report per class
    confusion_matrix,         # True vs False, Positive vs Negative
    f1_score                  # Balance of precision and recall
)

# joblib = saves our trained model to a file so we can use it later
# Without this, we'd have to retrain every single time!
import joblib

# os = Operating System — lets us check if files exist
import os


# ============================================================
# SECTION 2: LOAD THE DATA
# ============================================================

print("=" * 65)
print("🤖 PHASE 2 — TRAINING DROPOUT PREDICTION MODEL")
print("=" * 65)

# Load the CSV file we created in Phase 1
# pd.read_csv() = "pandas, read this CSV file and turn it into a table"
# Think of it like opening an Excel file in Python
csv_path = 'datasets/processed_dropout_data.csv'

# Check if the file exists before trying to load it
if not os.path.exists(csv_path):
    print("❌ Processed data not found! Run Phase 1 first.")
    print("   python phase1_explore.py")
    exit(1)

# Load the data
# df = DataFrame = a table with rows and columns
# Each row = one student, Each column = one feature (like age, grade, etc.)
df = pd.read_csv(csv_path)
print(f"\n✅ Loaded {len(df):,} students")
print(f"   Features: {len(df.columns)} columns")


# ============================================================
# SECTION 3: CHOOSE OUR FEATURES AND TARGET
# ============================================================

# ── What is a "Feature"? ──
# Features = the INPUT data the model looks at to make predictions
# Like: "If I know a student's age, grades, and fee status, 
#        can I predict if they'll drop out?"

# ── What is a "Target"? ──
# Target = the OUTPUT we want to predict
# In our case: "Will this student drop out? (Yes=1, No=0)"

# Select the features (columns) we want to use
# We pick the most important ones based on Phase 1 correlation analysis
feature_columns = [
    'Admission grade',                          # How well they did on entry
    'Age at enrollment',                        # How old when they started
    'Tuition fees up to date',                  # Are fees paid?
    'Scholarship holder',                       # Do they have scholarship?
    'Debtor',                                   # Do they have debt?
    'Gender',                                   # Male/Female
    'Curricular units 1st sem (approved)',      # Courses passed in 1st semester
    'Curricular units 1st sem (grade)',         # Average grade in 1st semester
    'Curricular units 2nd sem (approved)',      # Courses passed in 2nd semester
    'Curricular units 2nd sem (grade)',         # Average grade in 2nd semester
]

print(f"\n📊 Selected {len(feature_columns)} features:")
for i, feat in enumerate(feature_columns, 1):
    print(f"   {i:2d}. {feat}")

# ── Create X (features matrix) and y (target vector) ──
# X = all the input data (10 columns × 4,424 rows)
#    This is what the model LOOKS AT
# y = the answers (1 column × 4,424 rows)
#    This is what the model TRIES TO PREDICT

# df[feature_columns] = "from the DataFrame, give me only these columns"
# .values = "convert from pandas table to numpy array (numbers only)"
X = df[feature_columns].values

# df['dropout'] = "give me just the dropout column"
# .values = "convert to numpy array"
y = df['dropout'].values

print(f"\n📐 Data shapes:")
print(f"   X (features): {X.shape} — {X.shape[0]} students × {X.shape[1]} features")
print(f"   y (target):   {y.shape} — {y.shape[0]} labels (0=safe, 1=dropout)")

# Show how many of each class we have
unique, counts = np.unique(y, return_counts=True)
for label, count in zip(unique, counts):
    name = "Dropout" if label == 1 else "Safe"
    print(f"   {name}: {count} students ({count/len(y)*100:.1f}%)")


# ============================================================
# SECTION 4: SPLIT INTO TRAINING AND TESTING DATA
# ============================================================

# ── Why do we split the data? ──
# Imagine studying for an exam:
# - Training set = the practice questions you study with
# - Testing set = the actual exam questions (you've NEVER seen these)
# 
# If we tested on the same data we trained on, 
# the model would just memorize answers instead of actually learning.
# That's called "overfitting" — like a student who memorized the textbook
# but can't solve new problems.

# test_size=0.2 = "use 20% for testing, 80% for training"
# So: 3,539 students for training, 885 students for testing
# 
# random_state=42 = "shuffle the same way every time"
# Why 42? It's a tradition from "The Hitchhiker's Guide to the Galaxy"
# Any number works — it just ensures we get the same split every run
# 
# stratify=y = "keep the same dropout/safe ratio in both sets"
# Without this, training might get 50% dropout and testing 10% — unfair!

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # 20% for testing
    random_state=42,      # Reproducible results
    stratify=y            # Keep class balance
)

print(f"\n✂️ Data split:")
print(f"   Training set: {X_train.shape[0]} students (80%)")
print(f"   Testing set:  {X_test.shape[0]} students (20%)")

# Show that the split preserved the dropout ratio
train_dropout_pct = y_train.mean() * 100
test_dropout_pct = y_test.mean() * 100
print(f"   Training dropout rate: {train_dropout_pct:.1f}%")
print(f"   Testing dropout rate:  {test_dropout_pct:.1f}%")
print(f"   (Both should be ~32.1% — the original ratio)")


# ============================================================
# SECTION 5: SCALE THE FEATURES
# ============================================================

# ── Why do we need to scale? ──
# Look at our features:
#   - Age: 17 to 70 (range of 53)
#   - Admission grade: 95 to 190 (range of 95)
#   - Tuition fees up to date: 0 or 1 (range of 1)
# 
# If we don't scale, the model thinks "Admission grade=150" is WAY more
# important than "Age=20" just because the number is bigger.
# That's wrong — they should be equally important until proven otherwise.
# 
# StandardScaler transforms each feature to have:
#   - Mean = 0 (centered around zero)
#   - Standard deviation = 1 (spread out evenly)
# 
# After scaling, all features are on the same "playing field"

print(f"\n📏 Scaling features...")

# Create the scaler
scaler = StandardScaler()

# fit_transform = "learn the scaling rules AND apply them"
# fit = "look at the training data and figure out the mean/std"
# transform = "apply the scaling formula to the data"
# 
# We ONLY fit on training data — we don't want to "peek" at test data
X_train_scaled = scaler.fit_transform(X_train)

# transform (only) = "apply the SAME scaling we learned from training"
# We use the training mean/std, not the test mean/std
X_test_scaled = scaler.transform(X_test)

print(f"   ✅ Features scaled")
print(f"   Before scaling (first student): {X_train[0][:3]}")  # Show first 3 features
print(f"   After scaling (first student):  {X_train_scaled[0][:3].round(3)}")


# ============================================================
# SECTION 6: TRAIN THE MODEL
# ============================================================

# ── What is a Random Forest? ──
# It's like having 100 teachers each looking at a student.
# Each teacher makes a prediction: "Dropout" or "Safe"
# The final answer is the MAJORITY VOTE.
# 
# Why is it good?
# - Single teachers can be wrong (biased)
# - 100 teachers voting = much more reliable
# - Each teacher looks at different information (random subsets)
# - This prevents overfitting

# ── Parameters explained ──
# n_estimators = number of trees (teachers)
#   100 = good starting point. More = slightly better but slower
# 
# max_depth = how many questions each tree can ask
#   10 = "Ask at most 10 questions before making a decision"
#   Prevents trees from getting too specific (overfitting)
# 
# min_samples_split = minimum students needed to ask another question
#   5 = "Don't split if there are fewer than 5 students in this group"
# 
# class_weight = 'balanced' = "Pay extra attention to the minority class"
#   Without this: model says "everyone is safe" = 68% accuracy (useless!)
#   With this: model actually tries to find the 32% who might dropout
# 
# random_state = 42 = reproducible results

print(f"\n🤖 Training Random Forest model...")

model = RandomForestClassifier(
    n_estimators=100,          # 100 decision trees
    max_depth=10,              # Each tree can ask 10 questions
    min_samples_split=5,       # Minimum 5 students to split a group
    class_weight='balanced',   # Handle imbalanced data (32% dropout)
    random_state=42            # Reproducible results
)

# .fit() = "Hey model, here's the training data. Learn from it!"
# The model looks at X_train (features) and y_train (answers)
# and tries to find patterns: "Students with low grades AND unpaid fees = dropout"
model.fit(X_train_scaled, y_train)

print(f"   ✅ Model trained successfully!")
print(f"   Number of trees: {model.n_estimators}")
print(f"   Max tree depth: {model.max_depth}")


# ============================================================
# SECTION 7: MAKE PREDICTIONS & EVALUATE
# ============================================================

# ── Now the real test! ──
# We show the model students it has NEVER seen before (X_test)
# and check if its predictions match reality (y_test)

print(f"\n📊 Making predictions on test data...")

# .predict() = "For each student in X_test, tell me: dropout or safe?"
y_pred = model.predict(X_test_scaled)

# .predict_proba() = "For each student, give me the PROBABILITY"
# Returns: [[prob_safe, prob_dropout], [prob_safe, prob_dropout], ...]
# This is MORE useful than just yes/no — we can say "87% chance of dropout"
y_pred_proba = model.predict_proba(X_test_scaled)

# ── Calculate Accuracy ──
# Accuracy = "What percentage did we get right?"
# Formula: (correct predictions) / (total predictions) × 100
accuracy = accuracy_score(y_test, y_pred)
print(f"\n   📈 Accuracy: {accuracy:.2%}")
print(f"   ({accuracy*100:.1f}% of test students were predicted correctly)")

# ── Calculate F1 Score ──
# F1 Score balances two things:
#   Precision = "When we say 'dropout', how often are we right?"
#   Recall = "How many actual dropouts did we catch?"
# 
# Example: If there are 100 dropouts and we catch 85 of them,
# but we also wrongly flagged 20 safe students as dropout:
#   Recall = 85/100 = 85% (good — we caught most dropouts)
#   Precision = 85/105 = 81% (okay — some false alarms)
#   F1 = balance of both
f1 = f1_score(y_test, y_pred)
print(f"   📈 F1 Score: {f1:.2%}")
print(f"   (Balance between catching dropouts and avoiding false alarms)")

# ── Classification Report ──
# This shows per-class metrics
print(f"\n📊 Detailed Report:")
print(classification_report(y_test, y_pred, target_names=['Safe (0)', 'Dropout (1)']))

# ── Confusion Matrix ──
# This shows EXACTLY what we got right and wrong:
#
#                    PREDICTED
#                    Safe    Dropout
# ACTUAL  Safe       TN      FP
#         Dropout    FN      TP
#
# TN = True Negative = "Safe student, correctly predicted safe" ✅
# FP = False Positive = "Safe student, wrongly predicted dropout" ❌ (false alarm)
# FN = False Negative = "Dropout student, wrongly predicted safe" ❌ (MISSED — dangerous!)
# TP = True Positive = "Dropout student, correctly predicted dropout" ✅
cm = confusion_matrix(y_test, y_pred)
print(f"\n📊 Confusion Matrix:")
print(f"   True Negatives  (Safe → Safe):       {cm[0][0]:4d} ✅")
print(f"   False Positives (Safe → Dropout):    {cm[0][1]:4d} ❌ (false alarm)")
print(f"   False Negatives (Dropout → Safe):    {cm[1][0]:4d} ❌ (MISSED — dangerous!)")
print(f"   True Positives  (Dropout → Dropout): {cm[1][1]:4d} ✅")
print(f"\n   Total correct: {cm[0][0] + cm[1][1]} out of {cm.sum()}")


# ============================================================
# SECTION 8: FEATURE IMPORTANCE
# ============================================================

# ── Which features matter most? ──
# Random Forest can tell us which features were most useful
# for making predictions. This is GOLD for understanding WHY
# students dropout.

print(f"\n🔍 Feature Importance (what the model learned):")

# .feature_importances_ = "How much did each feature help?"
# Higher number = more important for prediction
importances = model.feature_importances_

# Sort features by importance (highest first)
indices = np.argsort(importances)[::-1]  # [::-1] means "reverse order"

print(f"\n   Ranking (most important → least important):")
for i, idx in enumerate(indices):
    # Create a simple bar using # characters
    bar = '█' * int(importances[idx] * 50)
    print(f"   {i+1:2d}. {feature_columns[idx]:40s} = {importances[idx]:.3f}  {bar}")


# ============================================================
# SECTION 9: EXAMPLE PREDICTIONS
# ============================================================

# Let's see the model in action with real test students!

print(f"\n🧪 Example Predictions (on unseen test data):")
print(f"   {'─'*55}")

# Take 5 random students from the test set
np.random.seed(123)
test_indices = np.random.choice(len(X_test), min(5, len(X_test)), replace=False)

for i, idx in enumerate(test_indices):
    # Get one student's data
    student = X_test[idx].reshape(1, -1)       # Reshape to 2D array
    student_scaled = scaler.transform(student)  # Scale it
    
    # Predict
    prediction = model.predict(student_scaled)[0]     # 0 or 1
    probability = model.predict_proba(student_scaled)[0]  # [safe_prob, dropout_prob]
    
    # Results
    predicted_label = "🔴 DROPOUT" if prediction == 1 else "🟢 SAFE"
    actual_label = "🔴 DROPOUT" if y_test[idx] == 1 else "🟢 SAFE"
    dropout_prob = probability[1] * 100  # Convert to percentage
    
    print(f"\n   Student {i+1}:")
    print(f"      Predicted: {predicted_label} ({dropout_prob:.1f}% dropout risk)")
    print(f"      Actual:    {actual_label}")
    print(f"      Correct?   {'✅ YES' if prediction == y_test[idx] else '❌ NO'}")


# ============================================================
# SECTION 10: SAVE THE MODEL
# ============================================================

# Now we save the trained model to disk so our ERP can use it!
# Without this, we'd have to retrain every time — which takes minutes.

print(f"\n💾 Saving model for ERP integration...")

# Create models folder if it doesn't exist
os.makedirs('models', exist_ok=True)

# Save the model
# joblib.dump() = "save this Python object to a file"
joblib.dump(model, 'models/dropout_model.pkl')
print(f"   ✅ Model saved: models/dropout_model.pkl")

# Save the scaler (we need this to scale new data the same way)
joblib.dump(scaler, 'models/dropout_scaler.pkl')
print(f"   ✅ Scaler saved: models/dropout_scaler.pkl")

# Save the feature columns (so we know what order to feed data)
joblib.dump(feature_columns, 'models/dropout_features.pkl')
print(f"   ✅ Features saved: models/dropout_features.pkl")


# ============================================================
# SECTION 11: HOW TO USE IN YOUR ERP
# ============================================================

print(f"\n🔌 How to use this model in your ERP:")
print(f"   " + "="*55)
print(f"   from your Express backend:")
print(f"")
print(f"   // Call Python prediction service")
print(f"   const prediction = await axios.post('http://localhost:8000/predict', {{")
print(f"     'Admission grade': 120,")
print(f"     'Age at enrollment': 20,")
print(f"     'Tuition fees up to date': 0,")
print(f"     'Scholarship holder': 0,")
print(f"     'Debtor': 1,")
print(f"     'Gender': 1,")
print(f"     'Curricular units 1st sem (approved)': 2,")
print(f"     'Curricular units 1st sem (grade)': 8.5,")
print(f"     'Curricular units 2nd sem (approved)': 1,")
print(f"     'Curricular units 2nd sem (grade)': 6.0")
print(f"   }});")
print(f"")
print(f"   // Response: {{ dropout_probability: 0.87, risk_level: 'HIGH' }}")


# ============================================================
# SECTION 12: FINAL SUMMARY
# ============================================================

print(f"\n" + "=" * 65)
print(f"🎉 PHASE 2 COMPLETE!")
print(f"   Model: Random Forest (100 trees)")
print(f"   Accuracy: {accuracy:.2%}")
print(f"   F1 Score: {f1:.2%}")
print(f"   Features used: {len(feature_columns)}")
print(f"   Training data: {X_train.shape[0]} students")
print(f"   Testing data: {X_test.shape[0]} students")
print(f"")
print(f"   📁 Saved files:")
print(f"      models/dropout_model.pkl — The trained model")
print(f"      models/dropout_scaler.pkl — Feature scaler")
print(f"      models/dropout_features.pkl — Feature names")
print(f"")
print(f"   🚀 Ready for Phase 3: Compare Multiple Models!")
print("=" * 65)