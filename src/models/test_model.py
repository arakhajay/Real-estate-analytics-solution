
import pandas as pd
import sys
import os

# Add src to path to import registry
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from src.models.registry import ModelRegistry

def run_tests():
    print("🧪 Running Model Test Suite...")
    
    # 1. Load Model
    registry = ModelRegistry()
    try:
        model = registry.load_model('rent_valuation_model') # Loads latest (v4+)
        print(f"Loaded model successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    # 2. Define Test Cases
    # These represent real-world inputs we might receive from a user API
    test_cases = [
        {'case': 'Small Studio', 'sqft': 450, 'type': 'Studio'},
        {'case': 'Large Studio', 'sqft': 600, 'type': 'Studio'},
        {'case': 'Standard 1B',  'sqft': 700, 'type': '1B1B'},
        {'case': 'Luxury 2B',    'sqft': 1100, 'type': '2B2B'},
        {'case': 'Penthouse 3B', 'sqft': 1400, 'type': '3B2B'},
        {'case': 'Extreme Small', 'sqft': 200, 'type': 'Studio'}, # Boundary case
    ]
    
    df_test = pd.DataFrame(test_cases)
    
    print("\n📋 Test Inputs:")
    print(df_test[['case', 'type', 'sqft']])
    
    # 3. Predict
    try:
        # The pipeline expects a DataFrame with columns ['type', 'sqft']
        predictions = model.predict(df_test[['type', 'sqft']])
        
        # 4. Display Results
        df_test['predicted_rent'] = predictions
        df_test['predicted_rent'] = df_test['predicted_rent'].apply(lambda x: f"${x:,.2f}")
        
        print("\n✅ Prediction Results:")
        print(df_test[['case', 'type', 'sqft', 'predicted_rent']])
        
        # Simple sanity checks
        print("\n🔍 Sanity Checks:")
        # Check if larger sqft generally means higher rent within same type?
        # (Not strictly enforced, but good for visual verification)
        studio_small = float(df_test.loc[0, 'predicted_rent'].replace('$','').replace(',',''))
        studio_large = float(df_test.loc[1, 'predicted_rent'].replace('$','').replace(',',''))
        
        if studio_large > studio_small:
            print(f"PASS: Larger Studio (${studio_large}) > Smaller Studio (${studio_small})")
        else:
            print(f"WARN: Larger Studio (${studio_large}) <= Smaller Studio (${studio_small}) - Model might be noisy")
            
    except Exception as e:
        print(f"❌ Prediction failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_tests()
