import os
import requests
from typing import TypedDict, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
PERPLEXITY_KEY = os.getenv("PERPLEXITY_API_KEY")
MODEL_SMART = "sonar-pro"  # High reasoning, expensive
MODEL_FAST = "sonar"       # Fast, cheaper, adequate for lookup

# --- SHARED STATE DEFINITION ---
class AgentState(TypedDict):
    """
    Standard Logic/Context object passed between agents.
    Everything is optional to allow flexibility across different workflows.
    """
    objective: Optional[str]
    location: Optional[str]
    year: Optional[str]
    
    # Data Slots (Agents write here)
    macro_data: Optional[str]
    market_data: Optional[str]
    legal_data: Optional[str]
    risk_analysis: Optional[str]
    lease_analysis: Optional[str]
    
    # Scenario Inputs (for Risk Agent)
    rent_change_pct: Optional[float]
    occupancy_change_pct: Optional[float]
    
    # PDF/Text Content (for RAG Agents)
    document_text: Optional[str]
    user_query: Optional[str]
    
    # Final Output
    final_report: Optional[str]


# --- CORE UTILITY: MODEL CALL ---
def call_perplexity(prompt: str, model: str = MODEL_FAST, role: str = "Research Assistant") -> str:
    """
    Generic wrapper to call Perplexity API.
    """
    if not PERPLEXITY_KEY:
        return "Mock Data: System in Offline/Demo Mode (No API Key found)."
    
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_KEY}", 
        "Content-Type": "application/json"
    }
    payload = {
        "model": model, 
        "messages": [
            {"role": "system", "content": f"You are a expert {role}."}, 
            {"role": "user", "content": prompt}
        ]
    }
    try:
        res = requests.post("https://api.perplexity.ai/chat/completions", json=payload, headers=headers)
        if res.status_code == 200:
            return res.json()['choices'][0]['message']['content']
        return f"Error {res.status_code}: {res.text}"
    except Exception as e:
        return f"Connection Error: {str(e)}"


# --- AGENT SKILLS ---

def macro_agent(state: AgentState) -> dict:
    """
    Role: Macro Economist
    Skill: Researches high-level economic trends for a specific location and year.
    """
    loc = state.get("location", "NYC")
    year = state.get("year", "2026")
    
    print(f"🤖 Agent: Macro Economist (Target: {loc} {year})")
    
    prompt = f"Find specific {loc} macroeconomic forecasts for {year}: Interest Rates, Unemployment Rate, and Inflation impact on real estate."
    response = call_perplexity(prompt, MODEL_FAST, "Macroeconomist")
    
    return {"macro_data": response}


def market_agent(state: AgentState) -> dict:
    """
    Role: Market Specialist
    Skill: Analyzes residential market trends (vacancy, rent growth) for a location.
    """
    loc = state.get("location", "NYC")
    year = state.get("year", "2026")
    
    print(f"🤖 Agent: Market Specialist (Target: {loc} {year})")
    
    prompt = f"Find {loc} Residential Rental Market trends for {year}: Vacancy rates, and luxury vs mid-market rent growth projections."
    response = call_perplexity(prompt, MODEL_FAST, "Market Analyst")
    
    return {"market_data": response}


def legal_agent(state: AgentState) -> dict:
    """
    Role: Legal Scholar
    Skill: Checks broad legislation and compliance risks.
    """
    loc = state.get("location", "NYC")
    year = state.get("year", "2026")
    
    print(f"🤖 Agent: Legal Counsel (Target: {loc} {year})")
    
    prompt = f"Summarize the latest status of eviction laws (like 'Good Cause') and compliance requirements for landlords in {loc} for {year}."
    response = call_perplexity(prompt, MODEL_FAST, "Legal Scholar")
    
    return {"legal_data": response}


def risk_agent(state: AgentState) -> dict:
    """
    Role: Risk Manager
    Skill: Validates if a proposed scenario (rent hike/occupancy) is realistic given market trends.
    """
    rent_change = state.get("rent_change_pct", 0)
    occ_change = state.get("occupancy_change_pct", 0)
    loc = state.get("location", "NYC")
    year = state.get("year", "2026")
    
    print(f"🤖 Agent: Risk Manager (Analyzing Scenario for {loc})")
    
    prompt = f"""
    Verify this real estate scenario for {loc} {year} compatibility:
    Proposed Rent Increase: {rent_change}%
    Projected Occ Change: {occ_change}%
    
    Is this realistic given {year} market vacancy trends? 
    Be critical. If rent hike is >5%, warn about churn.
    Output a single paragraph risk assessment.
    """
    response = call_perplexity(prompt, MODEL_FAST, "Risk Manager")
    
    return {"risk_analysis": response}


def lease_agent(state: AgentState) -> dict:
    """
    Role: Lease Lawyer
    Skill: Analyzes specific text/clauses from a lease document against a user query.
    """
    text = state.get("document_text", "")
    query = state.get("user_query", "Analyze risks")
    
    print(f"🤖 Agent: Lease Lawyer (Analyzing Document)")
    
    prompt = f"Analyze this Lease clause regarding: {query}\n\nText:\n{text[:10000]}" # Truncate to avoid context limit
    response = call_perplexity(prompt, MODEL_SMART, "Lease Lawyer")
    
    return {"lease_analysis": response}


def chief_editor(state: AgentState) -> dict:
    """
    Role: Chief Editor / CIO
    Skill: Synthesizes gathered data into a cohesive executive report.
    """
    print("🤖 Agent: Chief Editor (Synthesizing Report)")
    
    prompt = f"""
    You are the Chief Investment Officer. Write a Quarterly Executive Report using the data below.
    
    CONTEXT:
    Objective: {state.get('objective', 'General Report')}
    Location: {state.get('location', 'Unknown')}
    Year: {state.get('year', '2026')}
    
    DATA STREAMS:
    [MACRO]: {state.get('macro_data', 'N/A')}
    [MARKET]: {state.get('market_data', 'N/A')}
    [LEGAL]: {state.get('legal_data', 'N/A')}
    
    FORMAT:
    # Executive Report
    
    ## 1. Macro Outlook
    (Synthesis of macro data)
    
    ## 2. Rental Market Dynamics
    (Synthesis of market data)
    
    ## 3. Regulatory Watch
    (Synthesis of legal data)
    
    ## 4. Strategic Recommendation
    (Buy/Hold/Sell advice based on the above)
    """
    response = call_perplexity(prompt, MODEL_SMART, "Chief Editor")
    
    return {"final_report": response}
