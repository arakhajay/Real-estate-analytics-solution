import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()
Faker.seed(42)
np.random.seed(42)

def generate_properties(num_properties=50):
    """
    Generates a list of properties (apartment buildings).
    """
    properties = []
    classes = ['A', 'B', 'B', 'C'] # Weighted towards B class
    neighborhoods = ['Downtown', 'Northside', 'East End', 'Suburbs']
    
    for i in range(num_properties):
        p_class = random.choice(classes)
        neighborhood = random.choice(neighborhoods)
        
        # Base rent modifier based on neighborhood and class
        base_rent_mod = 1.0
        if neighborhood == 'Downtown': base_rent_mod *= 1.5
        if p_class == 'A': base_rent_mod *= 1.4
        elif p_class == 'C': base_rent_mod *= 0.8
        
        properties.append({
            'property_id': f'PROP_{i:03d}',
            'name': f"{fake.last_name()} {random.choice(['Lofts', 'Residences', 'Apartments', 'Manor'])}",
            'address': fake.address(),
            'neighborhood': neighborhood,
            'class': p_class,
            'base_rent_mod': base_rent_mod,
            'total_units': random.randint(10, 100),
            'built_year': random.randint(1980, 2024)
        })
    
    return pd.DataFrame(properties)

def generate_units(properties_df):
    """
    Explodes properites into individual units.
    """
    units = []
    unit_types = ['Studio', '1B1B', '2B1B', '2B2B', '3B2B']
    
    for _, prop in properties_df.iterrows():
        for u in range(prop['total_units']):
            u_type = random.choice(unit_types)
            sqft = 0
            base_price = 1000 * prop['base_rent_mod'] # Base baseline
            
            if u_type == 'Studio':
                sqft = random.randint(400, 600)
                base_price *= 0.8
            elif u_type == '1B1B':
                sqft = random.randint(600, 800)
                base_price *= 1.0
            elif u_type == '2B1B':
                sqft = random.randint(800, 1000)
                base_price *= 1.3
            elif u_type == '2B2B':
                sqft = random.randint(950, 1200)
                base_price *= 1.4
            elif u_type == '3B2B':
                sqft = random.randint(1100, 1500)
                base_price *= 1.7
                
            # Add some noise
            market_rent = int(base_price * random.uniform(0.9, 1.1))
            
            units.append({
                'unit_id': f"{prop['property_id']}_U{u:03d}",
                'property_id': prop['property_id'],
                'unit_number': f"{random.randint(1,10)}{u:02d}",
                'type': u_type,
                'sqft': sqft,
                'market_rent': market_rent,
                'status': 'Vacant' # Initial state
            })
            
    return pd.DataFrame(units)

def generate_tenants(num_tenants=5000):
    """
    Generates a pool of potential tenants.
    """
    tenants = []
    for i in range(num_tenants):
        # Determine income tier based on a skewed distribution
        income = int(np.random.lognormal(mean=10.8, sigma=0.6)) # rough approx for 40k-100k mainly
        credit_score = int(np.random.normal(680, 50))
        credit_score = max(300, min(850, credit_score))
        
        tenants.append({
            'tenant_id': f'TEN_{i:05d}',
            'name': fake.name(),
            'email': fake.email(),
            'annual_income': income,
            'credit_score': credit_score,
            'job': fake.job(),
            'move_in_reason': random.choice(['Relocation', 'Upsizing', 'Downsizing', 'New Job', 'Relationship'])
        })
    return pd.DataFrame(tenants)

if __name__ == "__main__":
    print("Generating Synthetic Data...")
    
    # 1. Properties
    props = generate_properties(20) # 20 Buildings
    print(f"Generated {len(props)} Properties")
    props.to_csv('d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic/properties.csv', index=False)
    
    # 2. Units
    units = generate_units(props)
    print(f"Generated {len(units)} Units")
    units.to_csv('d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic/units.csv', index=False)
    
    # 3. Tenants
    tenants = generate_tenants(len(units) * 2) # More tenants than units for turnover
    print(f"Generated {len(tenants)} Tenants")
    tenants.to_csv('d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic/tenants.csv', index=False)
    
    print("Done! Data saved to src/data/synthetic/")
