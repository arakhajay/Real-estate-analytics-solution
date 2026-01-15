# Module: Market Search (The Acquisition Engine)

## Vision: "The Deep Investment Analyst"
We are moving beyond simple "Search & Filter". This module is an autonomous **Investment Consultant** that actively finds deals and justifies them with deep, multi-modal research.

## Core Features

### 1. Smart Inventory (The Data Layer)
*   **Source:** `src/data/scrapers/real_listings.csv` (999 Real Listings from NYC).
*   **Visualization:** Interactive Grid/Map of available units.
*   **Standard Metadata:** Price, Bed, Bath, SqFt, Neighborhood.

### 2. The AI Valuation Layer (The "Alpha")
We don't just show price; we show **Value**.
*   **Mechanism:** For every listing, we run our proprietary `Rent Valuation Model (v4)`.
*   **The "Deal Score":**
    *   `Delta = AI_Predicted_Rent - Actual_List_Rent`
    *   If `Delta > +$200` → 🟢 **Undervalued (Strong Buy)** - The landlord doesn't know what they have.
    *   If `Delta < -$200` → 🔴 **Overvalued (Pass)** - Asking too much.
    *   Else → 🟡 **Fair Market Value**.

### 3. Deep Agent "Oracle" (The Researcher)
This is the GenAI upgrade using **Perplexity & Groq**.
Instead of static data, the Agent performs active research on demand.

#### Workflow:
1.  **User Query:** "Analyze this 2-bed in Harlem."
2.  **Agent Action (Perplexity API):**
    *   *Search 1:* "Recent zoning changes in Harlem 2024"
    *   *Search 2:* "Crime rate trends and new coffee shops in Harlem near [Address]"
    *   *Search 3:* "Comparable rentals in radius"
3.  **Synthesis (Groq/LLM):**
    *   Combines the **Quantitative** (our Valuation Model) with the **Qualitative** (Perplexity's findings).
4.  **Output:** A 1-Page **"Investment Memo"** covering:
    *   *Financials:* Cap Rate, Projected Yield.
    *   *Macro:* Neighborhood Tailwinds/Headwinds.
    *   *Verdict:* "Proceed with Offer at $3,800."

## Technical Stack
*   **Frontend:** Next.js, Tailwind (Purple Glass), Framer Motion.
*   **Backend:** Python (`api/search/route.ts`), Pandas, Joblib (Model Loading).
*   **AI Integration:**
    *   `Perplexity API` for real-time web context.
    *   `Groq/OpenAI` for fast text generation.
