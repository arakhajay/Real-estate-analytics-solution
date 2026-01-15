# Data Strategy: Scrape & Synthetic Generation

## 1. The Challenge
Real estate models require massive datasets. Beekin has millions of proprietary data points. We are starting from scratch. To build competitive models, we need a **Hybrid Data Strategy**.

## 2. Public Data Scraping (The "Real" Layer)
We will build a modular scraping engine to ingest data from public sources.
*   **Listing Sites:** Zillow, Apartments.com, Realtor.com.
    *   *Extract:* Rent prices, square footage, amenities (pool, gym), photos, descriptions, and "days on market".
*   **Government Records:** County Accessor APIs.
    *   *Extract:* Tax assessments, last sale price, year built, zoning codes.
*   **Location Data:** Google Places API / OpenStreetMap.
    *   *Extract:* Distance to transit, coffee shops, parks, schools (Walkability & "Vibe" scores).

## 3. Synthetic Data Generation (The "Training" Layer)
To train robust models (especially specific behaviors like "Late Payments" or "Churn"), we cannot wait for years of history. We will generate statistically accurate synthetic data.

### A. Synthetic Tenant Profiles
*   **Goal:** Create 10,000+ synthetic tenant identities.
*   **Attributes:** Income, Credit Score Tier, Family Size, Job Stability, Commute Time.
*   **Method:** Use Faker + Numpy distributions based on Census demographics.

### B. Synthetic Lease Ledgers
*   **Goal:** Simulate payment histories.
*   **Features:** On-time payments, late fees, partial payments, evictions.
*   **Logic:** Correlate "Job Stability" with "Payment Reliability" to train risk models.

### C. Synthetic Maintenance Logs
*   **Goal:** Train NLP models for sentiment analysis.
*   **Content:** Generate thousands of maintenance requests ("Leaky faucet", "AC broken") with varying tones (angry, neutral, urgent).

## 4. Data Pipeline Architecture
1.  **Ingest:** Scrapy/Selenium Scripts & GenAI Generators.
2.  **Process:** Clean text, normalize addresses, geocode lat/long.
3.  **Store:**
    *   *Structured:* PostgreSQL (Property/Unit/Tenant tables).
    *   *Unstructured:* Vector DB (Listing descriptions, reviews).
4.  **Serve:** API endpoints for the ML models to consume.
