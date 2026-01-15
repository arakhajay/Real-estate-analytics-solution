# Features & Brainstorming Log

This document captures the feature ideas, design concepts, and strategic discussions for the ASA Real Estate platform.

---

## 1. Tenants & Risk Page (`/tenants`)
**Goal:** Proactive Retention. Stop asking "Who left?" and start asking "Who *might* leave?"

### Core Features (Agreed):
*   **Unified Tenant Table:** Columns for Name, Unit, Lease End Date, Current Rent.
*   **Smart Filters:** 
    *   *By Property* (e.g., Rodriguez Towers)
    *   *By Risk Level* (High/Medium/Low)
    *   *By Lease Expiry* (Upcoming 90 Days)
*   **Status Indicators:** Visual tags for 'Active', 'Notice Given', 'Renewal Pending'.

### GenAI & ML Enhancements (Proposed):
*   **The "Why" Context:** Simply listing "High Risk" isn't enough. We need a column explaining the *drivers*:
    *   *"Rent Burden > 40%"*
    *   *"Credit Score Trend: Down"*
*   **One-Click "Retention Copilot":** Action button next to high-risk tenants.
    *   *Function:* Generates a personalized renewal email/offer.
    *   *Logic:* "Hi [Name], we value you... offering flat renewal rate if signed by [Date]."
*   **Sentiment Score:** (Future) "Happiness Meter" based on maintenance request sentiment analysis.

---

## 2. Market Search Page (`/search`)
**Goal:** Acquisition Consultant. Finding undervalued assets using our scraped data.

### Core Features:
*   **Map Interface:** Google Maps style view of scraped listings.
*   **Listing Cards:** Photo, Price, Bed/Bath, Address.

### GenAI & ML Enhancements:
*   **"The Oracle" Search:** Natural Language Processing (NLP) search bar.
    *   *Query:* "Show me undervalued 2-bedrooms in Harlem with high yield potential."
*   **"Deal Score":** Real-time comparison using our **Valuation Model**.
    *   *Listing:* $4,000 | *AI Value:* $4,500 | *Verdict:* **"Undervalued (Buy!)"**
*   **Investment Memo Generator:** One-click PDF summary for investment committees detailing pros/cons.

---

## 3. Properties Page (`/properties`)
**Goal:** Asset Optimization. Maximizing value of current holdings.

### Core Features:
*   **Building Cards:** Visual list of assets (e.g., "Rodriguez Towers").
*   **Key Metrics:** Occupancy %, Net Operating Income (NOI), Total Units.

### GenAI & ML Enhancements:
*   **"Yield Hunter":** An anomaly detection widget.
    *   *Insight:* "Unit 4B is renting for $3,800, but comps are $4,100. Potential +$3,600/yr."
*   **"Lease Lawyer Lite":** RAG (Retrieval Augmented Generation) on Master Lease PDFs.
    *   *Query:* "Does our lease allow Airbnb subletting?" -> *Answer:* Citations from specific clauses.

---

## 4. Analytics Page (`/analytics`)
**Goal:** Executive Reporting. The "CFO" view.

### Core Features:
*   **Trend Charts:** Rent Growth YoY, Occupancy vs. Market, Expense Breakdown.

### GenAI & ML Enhancements:
*   **"Scenario Simulator":** "What-If" Calculator.
    *   *Query:* "Impact of +5% rent hike vs -2% occupancy?" -> *Result:* Net Profit projection.
*   **"Quarterly Report Writer":** Auto-generates text summaries of charts for investor emails.
