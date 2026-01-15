
print("Importing modules...")
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import sys
import os

print("Modules imported.")
# Add src to path to import registry
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from src.models.registry import ModelRegistry

def train_valuation_model():
    print("🚀 Starting Model Training Pipeline...")
    
    # 1. Load Data
    data_path = 'd:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic/units.csv'
    if not os.path.exists(data_path):
        print(f"Error: Data file not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records.")

    # 2. Preprocess Definition
    # We want to predict market_rent based on sqft and type
    features = ['sqft', 'type']
    target = 'market_rent'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Create a pipeline that handles preprocessing and modeling
    # categorical_features: ['type']
    # numeric_features: ['sqft'] (passthrough)
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['type']),
            ('num', 'passthrough', ['sqft'])
        ]
    )
    
    params = {
        'regressor__n_estimators': 100,
        'regressor__random_state': 42,
        'regressor__max_depth': 10
    }
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10))
    ])
    
    # 3. Train
    print("Training pipeline...")
    pipeline.fit(X_train, y_train)
    
    # 4. Evaluate
    predictions = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    metrics = {
        'mae': round(mae, 2),
        'r2': round(r2, 4)
    }
    
    print(f"Model Performance: MAE=${mae:.2f}, R2={r2:.4f}")
    
    # 5. Save to Registry
    registry = ModelRegistry()
    registry.save_model(
        model=pipeline, # Saving the ENTIRE pipeline
        name='rent_valuation_model',
        metrics=metrics,
        params=params
    )
    
    print("Training complete.")

if __name__ == "__main__":
    train_valuation_model()
