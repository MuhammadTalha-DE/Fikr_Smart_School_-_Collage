"""
═══════════════════════════════════════════════════════════════
PHASE 5 — DROPOUT PREDICTION API
FastAPI service that loads the trained model and serves predictions
═══════════════════════════════════════════════════════════════
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

# ── Initialize FastAPI ─────────────────────────────
app = FastAPI(
    title="Fikr Smart — Dropout Risk Predictor",
    description="ML-powered student dropout risk prediction API",
    version="1.0.0"
)

# ── Allow requests from React frontend ─────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load the trained model ─────────────────────────
MODEL_PATH = 'models/optimized_dropout_model.pkl'
SCALER_PATH = 'models/optimized_dropout_scaler.pkl'
FEATURES_PATH = 'models/optimized_dropout_features.pkl'

if not os.path.exists(MODEL_PATH):
    print("❌ Model not found! Run Phase 4 first.")
    exit(1)

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
feature_columns = joblib.load(FEATURES_PATH)

print(f"✅ Model loaded: {MODEL_PATH}")
print(f"   Features: {len(feature_columns)}")

# ── Define the input data structure ────────────────
class StudentData(BaseModel):
    """
    The 10 features the model needs to make a prediction.
    Each field has a description and example value.
    """
    admission_grade: float = Field(
        default=120.0,
        description="Admission grade (95-190). Higher = better performance on entry exam.",
        ge=95, le=190
    )
    age_at_enrollment: int = Field(
        default=20,
        description="Age when student enrolled (17-70). Older students have higher dropout risk.",
        ge=17, le=70
    )
    tuition_fees_up_to_date: int = Field(
        default=1,
        description="Are tuition fees paid? 1=Yes, 0=No. Unpaid fees = 86.6% dropout rate!",
        ge=0, le=1
    )
    scholarship_holder: int = Field(
        default=0,
        description="Does student have a scholarship? 1=Yes, 0=No. Scholarship holders have 12.2% dropout vs 38.7%.",
        ge=0, le=1
    )
    debtor: int = Field(
        default=0,
        description="Does student have debt? 1=Yes, 0=No. Debtors have 62% dropout rate.",
        ge=0, le=1
    )
    gender: int = Field(
        default=1,
        description="Gender: 1=Male, 0=Female. Males have higher dropout risk.",
        ge=0, le=1
    )
    curricular_units_1st_sem_approved: int = Field(
        default=5,
        description="Number of courses passed in 1st semester (0-20). More = better.",
        ge=0, le=20
    )
    curricular_units_1st_sem_grade: float = Field(
        default=12.0,
        description="Average grade in 1st semester (0-20). Higher = lower dropout risk.",
        ge=0, le=20
    )
    curricular_units_2nd_sem_approved: int = Field(
        default=4,
        description="Number of courses passed in 2nd semester (0-20). THIS IS THE #1 PREDICTOR!",
        ge=0, le=20
    )
    curricular_units_2nd_sem_grade: float = Field(
        default=11.0,
        description="Average grade in 2nd semester (0-20). Current performance matters most.",
        ge=0, le=20
    )

# ── Define the response structure ──────────────────
class PredictionResponse(BaseModel):
    dropout_probability: float
    risk_score: int
    risk_level: str
    risk_color: str
    recommendation: str
    confidence: float
    feature_contributions: dict

# ─── Helper Functions ──────────────────────────────

def get_risk_level(probability: float) -> dict:
    """Convert dropout probability to a human-readable risk level."""
    score = round(probability * 100)
    
    if score >= 70:
        return {
            'risk_score': score,
            'risk_level': '🔴 HIGH',
            'risk_color': '#ef4444',
            'recommendation': (
                'Immediate intervention required! '
                'Schedule parent meeting, assign academic counsellor, '
                'create personalized improvement plan, and monitor weekly.'
            )
        }
    elif score >= 40:
        return {
            'risk_score': score,
            'risk_level': '🟡 MEDIUM',
            'risk_color': '#f59e0b',
            'recommendation': (
                'Monitor closely. Increase teacher check-ins, '
                'offer extra tutoring sessions, send parent notification, '
                'and review progress in 2 weeks.'
            )
        }
    else:
        return {
            'risk_score': score,
            'risk_level': '🟢 LOW',
            'risk_color': '#10b981',
            'recommendation': (
                'Student is on track. Continue regular monitoring, '
                'encourage participation in extracurricular activities, '
                'and maintain positive reinforcement.'
            )
        }

def get_feature_contributions(features_dict: dict) -> dict:
    """
    Analyze which features are pushing the risk score up or down.
    This helps explain WHY the model made its prediction.
    """
    contributions = {}
    
    # Fee status (strongest single indicator)
    if features_dict.get('tuition_fees_up_to_date') == 0:
        contributions['Unpaid Fees'] = '🔴 +25% risk (86.6% of students with unpaid fees drop out)'
    else:
        contributions['Fees Paid'] = '🟢 -25% risk (fees are up to date)'
    
    # Scholarship
    if features_dict.get('scholarship_holder') == 0:
        contributions['No Scholarship'] = '🟡 +10% risk (non-scholarship students have 3x higher dropout)'
    else:
        contributions['Has Scholarship'] = '🟢 -10% risk'
    
    # Debt
    if features_dict.get('debtor') == 1:
        contributions['Has Debt'] = '🔴 +15% risk (62% of debtors drop out)'
    
    # 2nd Semester Grades (strongest academic predictor)
    grade_2nd = features_dict.get('curricular_units_2nd_sem_grade', 10)
    if grade_2nd < 10:
        contributions['Low 2nd Sem Grade'] = f'🔴 +20% risk (grade={grade_2nd}/20 — below passing)'
    else:
        contributions['Good 2nd Sem Grade'] = f'🟢 -15% risk (grade={grade_2nd}/20)'
    
    # 2nd Semester Credits
    credits_2nd = features_dict.get('curricular_units_2nd_sem_approved', 5)
    if credits_2nd < 4:
        contributions['Low Credits Passed'] = f'🔴 +15% risk (only {credits_2nd} courses passed)'
    
    # Age
    age = features_dict.get('age_at_enrollment', 20)
    if age > 25:
        contributions['Older Student'] = f'🟡 +8% risk (age={age} — older students at higher risk)'
    
    return contributions


# ═══════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════

@app.get("/")
def root():
    """Welcome endpoint"""
    return {
        "service": "Fikr Smart Dropout Predictor",
        "version": "1.0.0",
        "model": "Optimized Random Forest",
        "features": len(feature_columns),
        "endpoints": {
            "/predict": "POST — Get dropout prediction",
            "/health": "GET — Health check",
            "/docs": "GET — Interactive API documentation"
        }
    }

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict", response_model=PredictionResponse)
def predict(student: StudentData):
    """
    Predict dropout risk for a student.
    
    Provide the 10 features and get back:
    - Dropout probability (0-100%)
    - Risk level (LOW/MEDIUM/HIGH)
    - Color-coded risk indicator
    - Personalized recommendation
    - Feature-by-feature analysis
    
    Example request:
    {
        "admission_grade": 120,
        "age_at_enrollment": 20,
        "tuition_fees_up_to_date": 1,
        "scholarship_holder": 0,
        "debtor": 0,
        "gender": 1,
        "curricular_units_1st_sem_approved": 5,
        "curricular_units_1st_sem_grade": 12.0,
        "curricular_units_2nd_sem_approved": 4,
        "curricular_units_2nd_sem_grade": 11.0
    }
    """
    
    # ── Convert student data to feature array ──────
    # The order MUST match the order used during training!
    features = np.array([[
        student.admission_grade,
        student.age_at_enrollment,
        student.tuition_fees_up_to_date,
        student.scholarship_holder,
        student.debtor,
        student.gender,
        student.curricular_units_1st_sem_approved,
        student.curricular_units_1st_sem_grade,
        student.curricular_units_2nd_sem_approved,
        student.curricular_units_2nd_sem_grade,
    ]])
    
    # ── Scale the features ─────────────────────────
    features_scaled = scaler.transform(features)
    
    # ── Make prediction ────────────────────────────
    dropout_prob = float(model.predict_proba(features_scaled)[0][1])
    prediction = int(model.predict(features_scaled)[0])
    confidence = float(max(model.predict_proba(features_scaled)[0]) * 100)
    
    # ── Get risk assessment ────────────────────────
    risk = get_risk_level(dropout_prob)
    
    # ── Get feature contributions ──────────────────
    features_dict = {
        'admission_grade': student.admission_grade,
        'age_at_enrollment': student.age_at_enrollment,
        'tuition_fees_up_to_date': student.tuition_fees_up_to_date,
        'scholarship_holder': student.scholarship_holder,
        'debtor': student.debtor,
        'gender': student.gender,
        'curricular_units_1st_sem_approved': student.curricular_units_1st_sem_approved,
        'curricular_units_1st_sem_grade': student.curricular_units_1st_sem_grade,
        'curricular_units_2nd_sem_approved': student.curricular_units_2nd_sem_approved,
        'curricular_units_2nd_sem_grade': student.curricular_units_2nd_sem_grade,
    }
    contributions = get_feature_contributions(features_dict)
    
    return {
        "dropout_probability": round(dropout_prob, 4),
        "risk_score": risk['risk_score'],
        "risk_level": risk['risk_level'],
        "risk_color": risk['risk_color'],
        "recommendation": risk['recommendation'],
        "confidence": round(confidence, 1),
        "feature_contributions": contributions
    }


# ═══════════════════════════════════════════════════
# RUN THE SERVER
# ═══════════════════════════════════════════════════
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Dropout Prediction API...")
    print("   API Docs: http://localhost:8000/docs")
    print("   Predict:  POST http://localhost:8000/predict")
    uvicorn.run(app, host="0.0.0.0", port=8000)