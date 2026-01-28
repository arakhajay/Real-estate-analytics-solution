from fastapi import FastAPI, HTTPException, Response, UploadFile, File, Form, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
import pypdf
import io
import json
import sqlite3
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import TypedDict, List, Dict, Annotated, Optional
from dotenv import load_dotenv

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# --- LANGGRAPH IMPORTS ---
from langgraph.graph import StateGraph, END

# --- AGENT IMPORTS ---
try:
    from src.api.agents import (
        AgentState, 
        macro_agent, 
        market_agent, 
        legal_agent, 
        chief_editor, 
        risk_agent, 
        lease_agent,
        listing_analyst_agent
    )
except ImportError:
    # Fallback for running directly from folder
    sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
    from src.api.agents import (
        AgentState, 
        macro_agent, 
        market_agent, 
        legal_agent, 
        chief_editor, 
        risk_agent, 
        lease_agent,
        listing_analyst_agent
    )

load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="ASA Real Estate Engines")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev; lock down in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH CONFIG ---
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-dev-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 Hours
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "users.db")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- AUTH MODELS ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    property_id: Optional[str] = None
    username: str

class UserData(BaseModel):
    username: str
    role: str
    property_id: Optional[str] = None

# --- AUTH UTILS ---
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        property_id: str = payload.get("pid")
        print(f"AUTH DEBUG: Decoded Token for {username}, PID={property_id}, Role={role}")
        
        if username is None:
            raise credentials_exception
        return UserData(username=username, role=role, property_id=property_id)
    except jwt.PyJWTError as e:
        print(f"AUTH FAIL: JWT Error {e}")
        raise credentials_exception

# --- 1. LOAD ML MODELS ---
MODELS = {}
def load_models_local():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    val_path = os.path.join(base_path, "models", "rent_valuation_model", "v4", "model.pkl")
    churn_path = os.path.join(base_path, "models", "churn", "churn_risk_model_v2.pkl")
    try: MODELS['valuation'] = joblib.load(val_path); print(f"✅ Loaded Valuation")
    except Exception as e: print(f"❌ Failed Valuation Load: {e}")
    try: MODELS['churn'] = joblib.load(churn_path); print(f"✅ Loaded Churn")
    except Exception as e: print(f"❌ Failed Churn Load: {e}")

load_models_local()

# --- 2. DATA LOADING ---
try:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    props_df = pd.read_csv(os.path.join(BASE_DIR, "data", "synthetic", "calibrated_properties.csv"))
    units_df = pd.read_csv(os.path.join(BASE_DIR, "data", "synthetic", "calibrated_units.csv"))
    real_listings_path = os.path.join(BASE_DIR, "data", "scrapers", "real_listings.csv")
    real_listings_df = pd.read_csv(real_listings_path)
    print(f"✅ Loaded {len(real_listings_df)} listings")
except Exception as e:
    print(f"❌ Failed Data Load: {e}")
    props_df, units_df, real_listings_df = pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

# --- 3. SCHEMAS ---
class PropertyFeatures(BaseModel):
    neighborhood: str = "Tribeca"
    property_class: str = "Class A (Luxury)"
    unit_type: str = "Studio"
    sqft: int = 850
    def to_df(self): return pd.DataFrame([self.dict(by_alias=True)])

class TenantFeatures(BaseModel):
    income: int
    credit_score: int
    market_rent: int
    # Optional fields with defaults for partial UI
    sqft: int = 800
    unit_type: str = "1BD"
    property_class: str = "B"
    neighborhood: str = "Harlem"
    
    def to_df(self):
        d = self.dict()
        d['rent_burden'] = d['market_rent'] / (d['income']/12) if d['income'] else 0
        d['type'] = d.pop('unit_type')
        d['class'] = d.pop('property_class')
        return pd.DataFrame([d])

class AnalyzeRequest(BaseModel):
    query: str
    location: str

class ScenarioRequest(BaseModel):
    rent_change_pct: float
    occupancy_change_pct: float

# --- 4. CORE ROUTES ---

@app.get("/")
def health_check(): return {"status": "ASA Neural Core Online"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (form_data.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        print(f"LOGIN FAIL: User {form_data.username} not found")
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    print(f"LOGIN DEBUG: Found user {user['username']}, Role={user['role']}, PID={user['property_id']}")

    if not verify_password(form_data.password, user['hashed_password']):
        print("LOGIN FAIL: Password mismatch")
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username'], "role": user['role'], "pid": user['property_id']}, 
        expires_delta=access_token_expires
    )
    print(f"LOGIN DEBUG: Generated Token, PID in payload: {user['property_id']}")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user['role'],
        "property_id": user['property_id'],
        "username": user['username']
    }

# Gmail / Google Login Mock
@app.post("/auth/google/login")
async def google_login_mock():
    # In a real app, this would verify the Google Token ID sent from frontend
    # For now, we simulate a login for a specific user to test the flow
    # This requires a valid 'mock' user to be in the DB or we just mock success
    return {"message": "Google Login Verified", "token": "mock_google_jwt_token_123"}

@app.get("/users/me", response_model=UserData)
async def read_users_me(current_user: UserData = Depends(get_current_user)):
    return current_user

@app.post("/predict/rent")
def predict_rent(features: PropertyFeatures):
    """
    Endpoint for Dashboard Rent Estimator Widget
    """
    # Defensive Default
    val = 4500
    
    if 'valuation' in MODELS:
        try:
            # Map nice UI names to Model codes
            p_class = "A" if "A" in features.property_class else ("B" if "B" in features.property_class else "C")
            u_type = "1BD" if "1" in features.unit_type else ("2BD" if "2" in features.unit_type else "Studio")
            
            df = pd.DataFrame([{
                'neighborhood': features.neighborhood,
                'class': p_class, 
                'type': u_type,
                'sqft': features.sqft
            }])
            
            val = int(MODELS['valuation'].predict(df)[0])
        except Exception as e:
            print(f"Rent Pred Model Error: {e}")
            # Fallback based on logic if model crashes
            base = 3500
            if features.neighborhood == "Tribeca": base += 1500
            if features.property_class == "Class A (Luxury)": base += 1000
            val = base
    else:
        print("Model Valuation not loaded")

    # Multi-field return to satisfy any frontend expectation
    return {
        "estimated_rent": val,
        "valuation": val,
        "rent": val,
        "value": val,
        "formatted_rent": f"${val:,}",
        "currency": "USD"
    }

@app.post("/predict/churn")
def predict_churn(features: TenantFeatures):
    """
    Endpoint for Dashboard Churn Riskometer
    """
    if 'churn' not in MODELS:
        return {"churn_probability": 0.45, "risk_level": "Medium"}
        
    try:
        df = features.to_df()
        # Churn model usage
        pred_prob = MODELS['churn'].predict_proba(df)[0][1]
        return {"churn_probability": float(pred_prob), "risk_level": "High" if pred_prob > 0.5 else "Low"}
    except Exception as e:
        print(f"Churn Pred Error: {e}")
        # Fallback calculation
        risk = 0.2
        if features.credit_score < 650: risk += 0.4
        rent_burden = features.market_rent / (features.income/12)
        if rent_burden > 0.4: risk += 0.3
        return {"churn_probability": min(0.95, risk), "risk_level": "High" if risk > 0.5 else "Low"}

@app.get("/listings")
def get_listings(query: str = None):
    # Same as before...
    df = real_listings_df.copy()
    if df.empty: return {"error": "No data available in system"}
    if query:
        q = query.lower()
        if '1' in q: df = df[df['beds'].astype(str).str.contains('1')]
        elif '2' in q: df = df[df['beds'].astype(str).str.contains('2')]
        keywords = [k for k in q.split() if k not in ['in', 'for', 'rent']]
        for k in keywords:
            mask = df['location'].str.contains(k, case=False) | df['title'].str.contains(k, case=False)
            df = df[mask]
    results = []
    failures = 0
    for i, row in df.head(50).iterrows():
        try:
            price_val = row.get('price'); 
            if pd.isna(price_val): price_val = '0'
            sqft_val = row.get('sqft'); 
            if pd.isna(sqft_val): sqft_val = '800'
            price = int(float(str(price_val).replace('$','').replace(',','')))
            sqft = int(float(str(sqft_val).replace(',','')))
            ai_val = price
            if 'valuation' in MODELS:
                try:
                    input_df = pd.DataFrame([{'neighborhood': 'Northside', 'class': 'B', 'type': '1BD', 'sqft': sqft}])
                    ai_val = int(MODELS['valuation'].predict(input_df)[0])
                except: ai_val = price 
            delta = ai_val - price
            verdict = "Undervalued" if delta > 150 else ("Overvalued" if delta < -150 else "Fair")
            if query and 'undervalued' in query.lower() and verdict != 'Undervalued': continue
            results.append({"title": row.get('title'), "location": row.get('location'), "price": price, "ai_value": ai_val, "delta": delta, "verdict": verdict, "sqft": sqft, "type": "1BD", "link": f"https://www.zillow.com/homes/{str(row.get('location', '')).replace(' ', '-').lower()}_rb/"})
        except: 
            failures += 1; continue
    if failures > 0: print(f"WARNING: Skipped {failures} listings.")
    return results

# --- 5. AGENT GRAPH ---
workflow = StateGraph(AgentState)
workflow.add_node("macro", macro_agent)
workflow.add_node("market", market_agent)
workflow.add_node("legal", legal_agent)
workflow.add_node("editor", chief_editor)
workflow.set_entry_point("macro") 
workflow.add_edge("macro", "market")
workflow.add_edge("market", "legal")
workflow.add_edge("legal", "editor")
workflow.add_edge("editor", END)
app_graph = workflow.compile()

@app.post("/analytics/report")
def run_deep_report():
    print("🚀 Starting Deep Research Graph...")
    result = app_graph.invoke({"objective": "Write Q1 2026 Report", "location": "NYC", "year": "2026"})
    return {"report": result['final_report']}

# --- 6. SCENARIO ---
@app.post("/analytics/scenario")
def run_scenario(req: ScenarioRequest):
    avg_rent = 4100
    baseline_revenue = 1836 * avg_rent * 0.94 * 12
    new_rent = avg_rent * (1 + req.rent_change_pct/100)
    new_occ = max(0, min(1, 0.94 + req.occupancy_change_pct/100))
    new_revenue = 1836 * new_rent * new_occ * 12
    result = risk_agent({"rent_change_pct": req.rent_change_pct, "occupancy_change_pct": req.occupancy_change_pct, "location": "NYC", "year": "2026"})
    return {"baseline_revenue": int(baseline_revenue), "new_revenue": int(new_revenue), "delta": int(new_revenue - baseline_revenue), "ai_analysis": result.get("risk_analysis", "Analysis Failed")}

@app.get("/analytics/data")
def get_analytics_data(current_user: UserData = Depends(get_current_user)):
    # 1. Determine Scope
    target_df = props_df.copy()
    if current_user.property_id and current_user.property_id != "ALL":
         target_df = target_df[target_df['property_id'] == current_user.property_id]
    
    # 2. Calculate Real-ish Metrics
    # Growth (Mocked logic but consistent with subset)
    base_growth = 2.5
    if not target_df.empty and 'class' in target_df.columns:
        if 'A' in target_df['class'].iloc[0]: base_growth += 1.5
    
    # Occupancy (Mocked but based on subset avg)
    avg_occ = 94
    if not target_df.empty and 'occupancy' in target_df.columns:
        # If we had real occupancy in props_df, use it. currently it's synthetic.
        pass

    return {
        "rent_growth": [
            {"year": "2023", "portfolio": base_growth, "market": 1.8}, 
            {"year": "2024", "portfolio": base_growth + 0.7, "market": 2.1}, 
            {"year": "2025", "portfolio": base_growth + 1.5, "market": 3.0}, 
            {"year": "2026", "portfolio": base_growth + 2.1, "market": 3.1}
        ], 
        "occupancy": [
            {"quarter": "Q1 25", "value": avg_occ}, 
            {"quarter": "Q2 25", "value": avg_occ + 1}, 
            {"quarter": "Q3 25", "value": avg_occ + 2}, 
            {"quarter": "Q4 25", "value": avg_occ - 1}
        ]
    }

# --- 7. UTILS ---
@app.get("/properties") 
def get_props(models_only: bool = False, current_user: UserData = Depends(get_current_user)): 
    # If DB load failed
    if props_df.empty: 
        return [{"id": "P1", "name": "Rodriguez Towers (Mock)", "neighborhood": "Harlem", "class": "B", "units": 65, "occupancy": 94, "noi": 1200000, "avg_rent": 3800}]
    
    try:
        # FILTER DATA BASED ON ROLE
        print(f"DEBUG: User={current_user.username}, Role={current_user.role}, PID={current_user.property_id}")
        target_df = props_df.copy()
        
        # Explicit check for specific property access
        if current_user.property_id and current_user.property_id != "ALL":
             # Ensure we are filtering by the exact string stored in the CSV
             target_df = target_df[target_df['property_id'] == current_user.property_id]
             print(f"DEBUG: Filtered to {len(target_df)} properties for {current_user.property_id}")

        if not units_df.empty:
            stats = units_df.groupby('property_id').agg({'unit_id': 'count', 'market_rent': 'mean'}).reset_index()
            stats.columns = ['property_id', 'units', 'avg_rent']
            merged = pd.merge(target_df, stats, on='property_id', how='left')
            merged['units'] = merged['units'].fillna(0).astype(int)
            merged['avg_rent'] = merged['avg_rent'].fillna(0).astype(int)
        else:
            merged = target_df.copy(); merged['units'] = 0; merged['avg_rent'] = 0
            
        merged['occupancy'] = 94; merged['noi'] = (merged['units'] * merged['avg_rent'] * 12 * 0.65).astype(int) 
        
        result = []
        for _, row in merged.iterrows():
            result.append({"id": str(row['property_id']), "name": str(row['name']), "neighborhood": str(row['neighborhood']), "class": str(row['class']), "units": int(row['units']), "occupancy": int(row['occupancy']), "noi": int(row['noi']), "avg_rent": int(row['avg_rent'])})
        return result
    except Exception as e: 
        print(f"Error serving properties: {e}")
        # Return empty list on error so map doesn't crash frontend
        return []

@app.get("/properties/{id}/yield")
def get_yield(id: str):
    if units_df.empty: return {"opportunities": []}
    prop_units = units_df[units_df['property_id'] == id].copy()
    if prop_units.empty: return {"opportunities": []}
    opportunities = []
    for _, unit in prop_units.head(100).iterrows():
        try:
            m_rent = int(unit['market_rent'])
            seed = sum(ord(c) for c in str(unit['unit_id']))
            discount = 0.80 + (seed % 15) / 100.0  
            current_rent = int(m_rent * discount)
            gain = (m_rent - current_rent) * 12
            if gain > 3000:
                opportunities.append({"unit_id": str(unit['unit_id']), "type": str(unit.get('type', '1BD')), "current_rent": current_rent, "market_rent": m_rent, "gain": gain, "sqft": int(unit.get('sqft', 800))})
        except: continue
    opportunities.sort(key=lambda x: x['gain'], reverse=True)
    return {"opportunities": opportunities[:3]}

@app.post("/legal/analyze")
async def analyze_legal(file: UploadFile = File(...), query: str = Form(...)):
    pdf = pypdf.PdfReader(file.file)
    text = "".join([p.extract_text() for p in pdf.pages])[:10000]
    result = lease_agent({"document_text": text, "user_query": query})
    return {"result": result.get("lease_analysis", "Analysis Failed")}

@app.get("/tenants")
def get_tenants(current_user: UserData = Depends(get_current_user)):
    print(f"DEBUG TENANTS: User={current_user.username} PID={current_user.property_id}")
    
    # Mock tenant data generation based on accessible units
    tenants = []
    
    # 1. Determine which properties this user can see
    visible_props = []
    if not current_user.property_id or current_user.property_id == "ALL":
        visible_props = props_df['property_id'].unique().tolist()
    else:
        visible_props = [current_user.property_id]
        
    # 2. Get units for these properties
    relevant_units = units_df[units_df['property_id'].isin(visible_props)]
    
    # If it's a single owner, show all their units (up to 500). If Admin, cap at 50 to avoid massive lists.
    if current_user.property_id and current_user.property_id != "ALL":
        relevant_units = relevant_units.head(200)
    else:
        relevant_units = relevant_units.head(50)
    
    if relevant_units.empty:
        return []

    for _, unit in relevant_units.iterrows():
         # Deterministic mock data based on unit ID
         seed = sum(ord(c) for c in str(unit['unit_id']))
         
         names = ["Lori Perez", "Kathryn Jimenez", "Shawn Johnson", "James Ortiz", "Michael Smith", "Sarah Wilson", "David Brown", "Emily Davis"]
         name = names[seed % len(names)]
         
         risk_val = (seed % 100) / 100.0
         if risk_val > 0.8: risk = "High"
         elif risk_val > 0.5: risk = "Medium" 
         else: risk = "Low"
         
         sentiment_opts = ["Happy", "Neutral", "Unhappy"]
         sentiment = sentiment_opts[seed % 3]

         tenants.append({
             "id": str(unit['unit_id']),
             "name": name,
             "unit": f"{unit['property_id']}_{unit['unit_id']}", # Make it clear which property
             "rent": int(unit['market_rent']),
             "income": int(unit['market_rent'] * 3.2),
             "credit": 600 + (seed % 250),
             "leaseEnd": "2026-06-30",
             "riskLevel": risk,
             "riskReason": "Stable Financials" if risk == "Low" else ("Late Payment History" if risk == "Medium" else " lease violation and noise complaints"),
             "sentiment": sentiment
         })
         
    print(f"DEBUG: Returning {len(tenants)} tenants for {current_user.username}")
    return tenants

@app.get("/search")
def search_listings(query: str = None, current_user: UserData = Depends(get_current_user)):
    return get_listings(query)

@app.post("/analyze")
def analyze_listing(req: AnalyzeRequest, current_user: UserData = Depends(get_current_user)):
    try:
        # Use the specialized agent
        analysis = listing_analyst_agent(req.query, req.location)
        return {"result": analysis}
    except Exception as e:
        print(f"Analysis Agent Error: {e}")
        return {"result": f"Analysis failed: {str(e)}"}

@app.post("/generate-memo")
async def generate_memo(request: dict, current_user: UserData = Depends(get_current_user)):
    title = request.get('title', 'Investment Memo')
    content = request.get('content', 'No content provided.')
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, spaceAfter=24, textColor='#4B0082') # Indigo
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=16, spaceBefore=18, spaceAfter=12, textColor='#333333')
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=11, leading=14, spaceAfter=10)
    
    flowables = []
    
    # Header
    flowables.append(Paragraph("ASA REAL ESTATE INVESTMENTS", styles['Normal']))
    flowables.append(Spacer(1, 12))
    flowables.append(Paragraph(f"MEMO: {title}", title_style))
    flowables.append(Paragraph(f"DATE: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
    flowables.append(Spacer(1, 24))
    
    # Content Processing (Handle Markdown-ish text from LLM)
    # Simple markdown to flowable converter for basic structure
    for line in content.split('\n'):
        line = line.strip()
        if not line:
            continue
        if line.startswith('###') or line.startswith('##') or line.startswith('**'):
             clean_line = line.replace('#', '').replace('*', '').strip()
             flowables.append(Paragraph(clean_line, h2_style))
        elif line.startswith('- '):
             flowables.append(Paragraph(f"• {line[2:]}", body_style))
        else:
             flowables.append(Paragraph(line, body_style))
            
    doc.build(flowables)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return Response(content=pdf_bytes, media_type="application/pdf")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
