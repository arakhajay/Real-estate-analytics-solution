import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# 1. Load Data
# We use the synthetic 'calibrated' units as our "Internal" data
# We use the scraped real listings as our "Competitor" data
internal_df = pd.read_csv(r"d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic/calibrated_units.csv")
props_df = pd.read_csv(r"d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic/calibrated_properties.csv")
# Join property details (neighborhood/class) to units
df = internal_df.merge(props_df, on='property_id', how='left')

# 2. Competitor Data Analysis
real_df = pd.read_csv(r"d:/Python-2025/Antigravity/Beekin_Analysis/src/data/scrapers/real_listings.csv")
# Simple standardization of competitor data to match our schema for comparison
real_df['neighborhood'] = 'Competitor_Market' # We simplify for now as precise mapping is complex
# Calculate Competitor Avg per Bedroom Type
competitor_stats = real_df.groupby('beds')['price'].mean().to_dict()
print("Competitor Benchmarks (Real Craigslist Data):")
print(competitor_stats)

# 3. Feature Engineering for Valuation Model
# We want to predict 'market_rent' based on these features:
features = ['neighborhood', 'class', 'type', 'sqft'] 
target = 'market_rent'

X = df[features]
y = df[target]

# 4. Model Selection & Training
# Comparing Random Forest vs Gradient Boosting
print("\n--- Training Models ---")

# Preprocessing Pipeline
categorical_features = ['neighborhood', 'class', 'type']
numeric_features = ['sqft']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numeric_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ])

# Model A: Random Forest (Good for robustness, handles non-linearities well)
rf_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                              ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))])

# Model B: XGBoost/GradientBoosting (Often higher accuracy for tabular data)
gb_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                              ('regressor', GradientBoostingRegressor(n_estimators=100, random_state=42))])

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Evaluate A
rf_pipeline.fit(X_train, y_train)
y_pred_rf = rf_pipeline.predict(X_test)
mae_rf = mean_absolute_error(y_test, y_pred_rf)
print(f"Random Forest MAE: ${mae_rf:.2f}")

# Evaluate B
gb_pipeline.fit(X_train, y_train)
y_pred_gb = gb_pipeline.predict(X_test)
mae_gb = mean_absolute_error(y_test, y_pred_gb)
print(f"Gradient Boosting MAE: ${mae_gb:.2f}")

# 5. Selection
best_model = rf_pipeline if mae_rf < mae_gb else gb_pipeline
model_name = "RandomForest" if mae_rf < mae_gb else "GradientBoosting"
print(f"\nWinner: {model_name}")

# 6. Save the Best Model
model_path = r"d:/Python-2025/Antigravity/Beekin_Analysis/src/models/valuation/rent_valuation_model.pkl"
joblib.dump(best_model, model_path)
print(f"Model saved to {model_path}")

# 7. Example Inference
sample = pd.DataFrame([{
    'neighborhood': 'Tribeca', 
    'class': 'A', 
    'type': '2BD', 
    'sqft': 1100
}])
prediction = best_model.predict(sample)[0]
print(f"\nPrediction for New Tribeca Luxury 2BD (1100sqft): ${prediction:.0f}")
