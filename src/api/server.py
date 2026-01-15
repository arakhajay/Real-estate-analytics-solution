from fastapi import FastAPI, HTTPException, Response, UploadFile, File, Form
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import sys
import requests
import pypdf
import io
import json
from typing import TypedDict, List, Dict, Annotated, Optional
from dotenv import load_dotenv

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
        lease_agent
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
        lease_agent
    )

load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="ASA Real Estate Engines")

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
            results.append({"title": row.get('title'), "location": row.get('location'), "price": price, "ai_value": ai_val, "delta": delta, "verdict": verdict, "sqft": sqft, "type": "1BD"})
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
def get_analytics_data():
    return {"rent_growth": [{"year": "2023", "portfolio": 2.5, "market": 1.8}, {"year": "2024", "portfolio": 3.2, "market": 2.1}, {"year": "2025", "portfolio": 4.5, "market": 3.0}, {"year": "2026", "portfolio": 5.1, "market": 3.1}], "occupancy": [{"quarter": "Q1 25", "value": 94}, {"quarter": "Q2 25", "value": 95}, {"quarter": "Q3 25", "value": 96}, {"quarter": "Q4 25", "value": 93}]}

# --- 7. UTILS ---
@app.get("/properties") 
def get_props(): 
    if props_df.empty: return [{"id": "P1", "name": "Rodriguez Towers (Mock)", "neighborhood": "Harlem", "class": "B", "units": 65, "occupancy": 94, "noi": 1200000, "avg_rent": 3800}]
    try:
        if not units_df.empty:
            stats = units_df.groupby('property_id').agg({'unit_id': 'count', 'market_rent': 'mean'}).reset_index()
            stats.columns = ['property_id', 'units', 'avg_rent']
            merged = pd.merge(props_df, stats, on='property_id', how='left')
            merged['units'] = merged['units'].fillna(0).astype(int)
            merged['avg_rent'] = merged['avg_rent'].fillna(0).astype(int)
        else:
            merged = props_df.copy(); merged['units'] = 0; merged['avg_rent'] = 0
        merged['occupancy'] = 94; merged['noi'] = (merged['units'] * merged['avg_rent'] * 12 * 0.65).astype(int) 
        result = []
        for _, row in merged.iterrows():
            result.append({"id": str(row['property_id']), "name": str(row['name']), "neighborhood": str(row['neighborhood']), "class": str(row['class']), "units": int(row['units']), "occupancy": int(row['occupancy']), "noi": int(row['noi']), "avg_rent": int(row['avg_rent'])})
        return result
    except: return [{"id": "P_ERR", "name": "Error Loading Properties", "neighborhood": "N/A", "class": "N/A", "units": 0, "occupancy": 0, "noi": 0, "avg_rent": 0}]

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
