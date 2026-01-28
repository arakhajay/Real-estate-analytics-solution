import pandas as pd
import os
from typing import Dict, Any, List, Optional

from src.api.agents import call_perplexity, MODEL_FAST, MODEL_SMART

# --- DATA PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

class RAGEngine:
    """
    Comprehensive RAG Engine with access to ALL application data sources:
    - Properties (calibrated_properties.csv)
    - Units (calibrated_units.csv)
    - Tenants (calibrated_tenants.csv + mock runtime data)
    - Real Listings (real_listings.csv from scrapers)
    """
    
    def __init__(
        self, 
        property_df: pd.DataFrame, 
        unit_df: pd.DataFrame, 
        tenant_data: List[Dict],
        listings_df: Optional[pd.DataFrame] = None,
        calibrated_tenants_df: Optional[pd.DataFrame] = None
    ):
        self.props = property_df
        self.units = unit_df
        self.tenants = pd.DataFrame(tenant_data) if tenant_data else pd.DataFrame()
        
        # Load additional data sources if not provided
        self.listings = listings_df if listings_df is not None else self._load_listings()
        self.cal_tenants = calibrated_tenants_df if calibrated_tenants_df is not None else self._load_calibrated_tenants()
        
    def _load_listings(self) -> pd.DataFrame:
        """Load real estate listings from scraper data."""
        path = os.path.join(DATA_DIR, "scrapers", "real_listings.csv")
        try:
            return pd.read_csv(path)
        except Exception as e:
            print(f"[RAG] Could not load listings: {e}")
            return pd.DataFrame()
    
    def _load_calibrated_tenants(self) -> pd.DataFrame:
        """Load calibrated tenant data for deeper analysis."""
        path = os.path.join(DATA_DIR, "synthetic", "calibrated_tenants.csv")
        try:
            return pd.read_csv(path)
        except Exception as e:
            print(f"[RAG] Could not load calibrated tenants: {e}")
            return pd.DataFrame()
        
    def _get_schema_summary(self) -> str:
        """Helper to give the LLM context about what columns exist."""
        schemas = []
        if not self.props.empty:
            schemas.append(f"Properties ({len(self.props)} rows): {list(self.props.columns)}")
        if not self.units.empty:
            schemas.append(f"Units ({len(self.units)} rows): {list(self.units.columns)}")
        if not self.tenants.empty:
            schemas.append(f"Tenants ({len(self.tenants)} rows): {list(self.tenants.columns)}")
        if not self.cal_tenants.empty:
            schemas.append(f"Calibrated Tenants ({len(self.cal_tenants)} rows): {list(self.cal_tenants.columns)}")
        if not self.listings.empty:
            schemas.append(f"Market Listings ({len(self.listings)} rows): {list(self.listings.columns)}")
            
        return "\n".join(schemas)

    def query(self, user_query: str) -> str:
        """
        Main entry point. 
        1. Analyzes query to decide which table to look at.
        2. Filters data.
        3. Generates natural language response.
        """
        
        subset_context = ""
        query_lower = user_query.lower()
        
        # --- INTENT ROUTING ---
        
        # 1. TENANT QUERIES
        if any(k in query_lower for k in ["tenant", "who", "occupant", "lease", "churn", "risk"]):
            if not self.tenants.empty:
                # Try name match first
                matches = []
                for term in user_query.split():
                    if len(term) > 2 and term[0].isupper():
                         match = self.tenants[self.tenants['name'].str.contains(term, case=False, na=False)]
                         if not match.empty:
                             matches.append(match)
                
                if matches:
                    subset = pd.concat(matches).drop_duplicates().head(10)
                    subset_context = f"Matching Tenant Records:\n{subset.to_markdown(index=False)}"
                else:
                    # Show high-risk tenants if asking about risk
                    if "risk" in query_lower or "churn" in query_lower:
                        high_risk = self.tenants[self.tenants['riskLevel'] == 'High'].head(10)
                        if not high_risk.empty:
                            subset_context = f"High Risk Tenants:\n{high_risk.to_markdown(index=False)}"
                        else:
                            subset_context = f"Sample Tenant Data:\n{self.tenants.head(10).to_markdown(index=False)}"
                    else:
                        subset_context = f"Tenant Data ({len(self.tenants)} total):\n{self.tenants.head(15).to_markdown(index=False)}"
            
            # Also include calibrated tenant data for deeper stats
            if not self.cal_tenants.empty and ("income" in query_lower or "credit" in query_lower or "detail" in query_lower):
                subset_context += f"\n\nDetailed Tenant Analytics (Calibrated Data):\n{self.cal_tenants.head(10).to_markdown(index=False)}"

        # 2. PROPERTY/UNIT QUERIES
        elif any(k in query_lower for k in ["property", "building", "unit", "portfolio", "noi", "occupancy"]):
            if not self.props.empty:
                # Try to filter by property name if mentioned
                for term in user_query.split():
                    if len(term) > 3:
                         match = self.props[self.props['name'].str.contains(term, case=False, na=False)]
                         if not match.empty:
                             subset_context += f"Matching Property:\n{match.to_markdown(index=False)}\n"
                             break
                
                if not subset_context:
                    subset_context = f"Portfolio Properties ({len(self.props)} total):\n{self.props.to_markdown(index=False)}\n"
             
            if not self.units.empty and any(k in query_lower for k in ["unit", "rent", "sqft", "type"]):
                # Show unit breakdown
                unit_stats = self.units.groupby('property_id').agg({
                    'unit_id': 'count',
                    'market_rent': 'mean',
                    'sqft': 'mean'
                }).reset_index()
                unit_stats.columns = ['Property', 'Units', 'Avg Rent', 'Avg Sqft']
                subset_context += f"\nUnit Summary by Property:\n{unit_stats.to_markdown(index=False)}"
        
        # 3. MARKET/LISTING QUERIES
        elif any(k in query_lower for k in ["listing", "market", "available", "for rent", "find", "search"]):
            if not self.listings.empty:
                # Filter by location if mentioned
                location_matches = self.listings.copy()
                for term in user_query.split():
                    if len(term) > 3:
                        m = self.listings[self.listings['location'].str.contains(term, case=False, na=False)]
                        if not m.empty:
                            location_matches = m
                            break
                
                subset_context = f"Market Listings ({len(location_matches)} found):\n{location_matches.head(15)[['title', 'location', 'price', 'beds', 'sqft']].to_markdown(index=False)}"
            else:
                subset_context = "No market listing data available."
        
        # 4. ANALYTICS/STATS QUERIES
        elif any(k in query_lower for k in ["total", "count", "how many", "average", "sum", "stats", "overview"]):
            stats = []
            if not self.props.empty:
                stats.append(f"Total Properties: {len(self.props)}")
            if not self.units.empty:
                stats.append(f"Total Units: {len(self.units)}")
                stats.append(f"Average Rent: ${self.units['market_rent'].mean():,.0f}")
            if not self.tenants.empty:
                stats.append(f"Active Tenants: {len(self.tenants)}")
                by_risk = self.tenants['riskLevel'].value_counts().to_dict()
                stats.append(f"Risk Breakdown: {by_risk}")
            if not self.listings.empty:
                stats.append(f"Market Listings Tracked: {len(self.listings)}")
                stats.append(f"Avg Listing Price: ${self.listings['price'].mean():,.0f}")
            
            subset_context = "Portfolio Overview:\n" + "\n".join(stats)
        
        # 5. FALLBACK - General context
        else:
            subset_context = f"Available Data Schema:\n{self._get_schema_summary()}"
            if not self.props.empty:
                subset_context += f"\n\nSample Properties:\n{self.props.head(5).to_markdown(index=False)}"

        # --- SYNTHESIS ---
        prompt = f"""
        You are an AI Data Analyst for ASA Real Estate Portfolio Management.
        
        User Query: "{user_query}"
        
        Data Context (Internal Database):
        {subset_context}
        
        Instructions:
        - Answer the user's question based strictly on the data above
        - If specific records are found, reference them by name/ID
        - Provide numbers and statistics when relevant
        - If the data doesn't contain the answer, clearly state what's missing
        - Keep the answer professional and concise (2-3 paragraphs max)
        """
        
        try:
            response = call_perplexity(prompt, model=MODEL_FAST, role="Data Analyst")
            return response
        except Exception as e:
            return f"Error processing data query: {str(e)}"
