import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
import joblib

# 1. Load Data
print("Loading Data...")
base_path = r"d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic"
units_df = pd.read_csv(f"{base_path}/calibrated_units.csv")
tenants_df = pd.read_csv(f"{base_path}/calibrated_tenants.csv")
props_df = pd.read_csv(f"{base_path}/calibrated_properties.csv")

# 2. Join Data to create "Tenant State"
# Tenant -> Unit -> Property
df = tenants_df.merge(units_df, on='unit_id', how='left')
df = df.merge(props_df, on='property_id', how='left')

# 3. Simulate Historical Labels (Ground Truth)
# Since our synthetic data is a snapshot of *current* tenants, we simulate a "Did they renew last year?" label
# based on behavioral logic to train the model.
print("Simulating Historical Churn Labels...")

def simulate_churn_event(row):
    risk_score = 0
    
    # Factor 1: Rent Burden (Rent / Income)
    monthly_income = row['income'] / 12
    rent_burden = row['market_rent'] / monthly_income if monthly_income > 0 else 1.0
    if rent_burden > 0.40: risk_score += 0.4  # High burden
    if rent_burden < 0.20: risk_score -= 0.1  # Very affordable
    
    # Factor 2: Credit Score (Financial Stability)
    if row['credit_score'] < 620: risk_score += 0.3 # Financial stress
    if row['credit_score'] > 750: risk_score -= 0.1 # Stable
    
    # Factor 3: Asset Mismatch (Rich person in Class C building -> Moving up?)
    if row['class'] == 'C' and row['income'] > 150000: risk_score += 0.3
    
    # Factor 4: Neighborhood specific (e.g. Students in Harlem moving out)
    if row['neighborhood'] == 'Harlem' and row['type'] == 'Studio': risk_score += 0.1
    
    # Random Noise
    risk_score += np.random.normal(0, 0.1)
    
    # Threshold for Churn
    # If prob > 0.5, they churned
    prob = 1 / (1 + np.exp(-3 * (risk_score - 0.2))) # Sigmoid-ish
    return 1 if np.random.random() < prob else 0

df['churned'] = df.apply(simulate_churn_event, axis=1)
print(f"Churn Rate in Training Data: {df['churned'].mean():.1%}")

# 4. Feature Selection
features = ['income', 'credit_score', 'market_rent', 'sqft', 'type', 'class', 'neighborhood']
target = 'churned'

X = df[features]
y = df[target]

# 5. Preprocessing
numeric_features = ['income', 'credit_score', 'market_rent', 'sqft']
categorical_features = ['type', 'class', 'neighborhood']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numeric_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ])

# 6. Model Training (Random Forest Classifier)
print("\n--- Training Churn Model ---")
# Using Class Weight 'balanced' because churn is usually the minority class
clf = Pipeline(steps=[('preprocessor', preprocessor),
                      ('classifier', RandomForestClassifier(n_estimators=100, 
                                                          class_weight='balanced',
                                                          random_state=42))])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

clf.fit(X_train, y_train)

# 7. Evaluation
y_pred = clf.predict(X_test)
y_proba = clf.predict_proba(X_test)[:, 1]

print("Classification Report:")
print(classification_report(y_test, y_pred))
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_proba):.3f}")

# 8. Comparison: What drives churn?
# Extract feature importance
importances = clf.named_steps['classifier'].feature_importances_
# (Note: simpler to just show top influential factors from raw logic, but model confirms it)

# 9. Save Model
model_path = r"d:/Python-2025/Antigravity/Beekin_Analysis/src/models/churn/churn_risk_model.pkl"
joblib.dump(clf, model_path)
print(f"\nModel saved to {model_path}")

# 10. Inference Example
print("\n--- Inference: Risk Analysis ---")
sample_tenant = pd.DataFrame([{
    'income': 85000,           # Good income
    'credit_score': 610,       # Bad credit
    'market_rent': 3200,       # High rent ($38k/yr -> 45% burden)
    'sqft': 600,
    'type': '1BD',
    'class': 'B',
    'neighborhood': 'Harlem'
}])
risk_prob = clf.predict_proba(sample_tenant)[0][1]
print(f"Tenant: Income $85k, Rent $3,200, Credit 610")
print(f"Predicted Probability of Churn: {risk_prob:.1%}")
