import pandas as pd
import numpy as np
from faker import Faker
import random
import re

# 1. Load and Calibrate from Real Data
def calibrate_parameters(real_data_path):
    print(f"Loading real data from {real_data_path}...")
    df = pd.read_csv(real_data_path)
    
    # Clean text to find bedrooms
    def parse_beds(text):
        if not isinstance(text, str): return None
        text = text.lower()
        if 'studio' in text: return 0
        match = re.search(r'(\d+)\s*(?:br|bed|bd)', text)
        if match: return int(match.group(1))
        return None

    # Apply parsing to Title (usually richer descriptive text in CL)
    df['parsed_beds'] = df['title'].apply(parse_beds)
    
    # Calculate distributions
    stats = {}
    
    # Filter for reasonable rents (remove outliers like $200 or $50k)
    df = df[(df['price'] > 500) & (df['price'] < 20000)]
    
    categories = {
        'Studio': df[df['parsed_beds'] == 0]['price'],
        '1BD': df[df['parsed_beds'] == 1]['price'],
        '2BD': df[df['parsed_beds'] == 2]['price'],
        '3BD': df[df['parsed_beds'] == 3]['price'],
        '4BD': df[df['parsed_beds'] >= 4]['price']
    }
    
    print("\n--- Calibration (Real Market Stats) ---")
    for cat, prices in categories.items():
        if len(prices) > 5:
            mu = prices.mean()
            sigma = prices.std()
            stats[cat] = (mu, sigma)
            print(f"{cat}: avg=${mu:.0f}, std=${sigma:.0f} (n={len(prices)})")
        else:
            # Fallbacks if scrape missed some categories
            print(f"{cat}: Not enough data, using heuristics.")
            if cat == 'Studio': stats[cat] = (2500, 500)
            elif cat == '1BD': stats[cat] = (3200, 600)
            elif cat == '2BD': stats[cat] = (4500, 1000)
            elif cat == '3BD': stats[cat] = (6000, 1500)
            else: stats[cat] = (8000, 2000)
            
    return stats

# 2. Generate Synthetic Data matching Calibration
def generate_calibrated_data(stats, n_properties=30):
    fake = Faker()
    properties = []
    units = []
    tenants = []
    
    neighborhoods = ['Tribeca', 'Financial District', 'Upper East Side', 'Harlem', 'East Village']
    
    print("\n--- Generating Digital Twin Data ---")
    
    for i in range(n_properties):
        p_id = f"PROP_{i:03d}"
        neighborhood = random.choice(neighborhoods)
        # Neighborhood multiplier (Tribeca is pricier than Harlem)
        loc_mult = 1.0
        if neighborhood == 'Tribeca': loc_mult = 1.4
        elif neighborhood == 'Harlem': loc_mult = 0.7
        
        properties.append({
            'property_id': p_id,
            'name': f"{fake.last_name()} {random.choice(['Towers', 'Court', 'Lofts'])}",
            'neighborhood': neighborhood,
            'class': random.choice(['A', 'B', 'B', 'C'])
        })
        
        # Create Units for this building
        n_units = random.randint(20, 100)
        for u in range(n_units):
            # Select unit type based on simple weights
            u_type = np.random.choice(['Studio', '1BD', '2BD', '3BD'], p=[0.2, 0.4, 0.3, 0.1])
            mu, sigma = stats.get(u_type, (3000, 500))
            
            # Adjust for location
            base_rent = np.random.normal(mu, sigma) * loc_mult
            market_rent = int(max(base_rent, 500)) # Floor at $500
            
            sqft_base = {'Studio': 500, '1BD': 750, '2BD': 1000, '3BD': 1400}
            sqft = int(np.random.normal(sqft_base[u_type], 50))
            
            u_id = f"{p_id}_U{u:03d}"
            units.append({
                'unit_id': u_id,
                'property_id': p_id,
                'type': u_type,
                'amenities': random.sample(['View', 'Doorman', 'Gym', 'Laundry'], k=random.randint(0,4)),
                'sqft': sqft,
                'market_rent': market_rent
            })
            
            # Create Tenant (if occupied)
            if random.random() < 0.92: # 92% Occupancy
                income = market_rent * 40 # 40x rent rule generally
                income = int(np.random.normal(income, income * 0.2))
                tenants.append({
                    'tenant_id': fake.uuid4()[:8],
                    'unit_id': u_id,
                    'name': fake.name(),
                    'income': income,
                    'credit_score': int(np.random.normal(700, 50)),
                    'lease_start': fake.date_between(start_date='-2y', end_date='today')
                })

    return pd.DataFrame(properties), pd.DataFrame(units), pd.DataFrame(tenants)

if __name__ == "__main__":
    # Path to the real data we just scraped
    real_csv = "d:/Python-2025/Antigravity/Beekin_Analysis/src/data/scrapers/real_listings.csv"
    
    # 1. Get Stats from Real World
    stats = calibrate_parameters(real_csv)
    
    # 2. Generate Synthetic World
    props_df, units_df, tenants_df = generate_calibrated_data(stats)
    
    # 3. Save
    out_dir = "d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic/"
    props_df.to_csv(f"{out_dir}calibrated_properties.csv", index=False)
    units_df.to_csv(f"{out_dir}calibrated_units.csv", index=False)
    tenants_df.to_csv(f"{out_dir}calibrated_tenants.csv", index=False)
    
    print(f"Success! Generated {len(units_df)} units based on real NYC rent distributions.")
