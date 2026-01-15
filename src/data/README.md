# Data Engine Strategy

## Overview
Our data strategy combines **Synthetic Data** (to simulate proprietary internal data like lease history and churn) and **Scraped Data** (to capture real-time market conditions).

## 1. Synthetic Data Engine (The "Internal" Dataset)
We use `Faker` and `NumPy` to generate a relational dataset representing a property management company's internal database.

### Core Modules:
1.  **Property Persona Generator (`properties.py`)**:
    *   Generates "Assets" (Buildings) in specific clusters (Neighborhoods).
    *   Assigns "Class" (A, B, C) and "Amenities" based on Class.
    *   *Output:* `properties.csv`, `units.csv`

2.  **Tenant Persona Generator (`tenants.py`)**:
    *   Generates comprehensive tenant profiles: Income, Credit Score, Age, Occupation.
    *   *Logic:* Correlates Income to acceptable Rent ranges (typically 3x rule).
    *   *Output:* `tenants.csv`

3.  **Lease Simulator (`history.py`)**:
    *   **The Time Machine:** Simulates the last 3-5 years.
    *   **Events:**
        *   *Lease Sign:* Tenant X signs Unit Y at Price Z.
        *   *Payment Behavior:* Randomly assigns "Late" status based on Credit Score.
        *   *Renewal Decision:* At lease end, decides "Stay" or "Go" based on a `churn_probability` function (e.g., if Rent Increase > 5% and Market is cheaper -> Churn).
    *   *Output:* `leases.csv`, `move_outs.csv`

## 2. Scraping Engine (The "External" Dataset)
We use `Selenium` or `Playwright` to fetch live market comps.

### Strategy:
1.  **Target Selection:** Focus on one geo-market first (e.g., "Austin, TX 78701").
2.  **Field Extraction:**
    *   Price, SqFt, Bed/Bath.
    *   **Unstructured:** "One month free", "Renovated kitchen" (Text).
3.  **Mapping:** Map scraped "Comps" to our Synthetic "Subject Properties" to test our Valuation Models.

## 3. Tech Stack
- **Python**: Core logic.
- **Pandas**: Data manipulation.
- **Faker**: Identity generation.
- **Scikit-Learn**: Simple probabilistic distributions for generating "realistic" noise in data.
