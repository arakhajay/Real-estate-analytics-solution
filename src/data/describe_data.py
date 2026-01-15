import pandas as pd
import os

# Define paths
base_path = r"d:/Python-2025/Antigravity/Beekin_Analysis/src/data/synthetic"
props_path = os.path.join(base_path, "calibrated_properties.csv")
units_path = os.path.join(base_path, "calibrated_units.csv")
tenants_path = os.path.join(base_path, "calibrated_tenants.csv")

# Load Data
print("Loading Data...")
props = pd.read_csv(props_path)
units = pd.read_csv(units_path)
tenants = pd.read_csv(tenants_path)

print(f"Properties: {props.shape}")
print(f"Units: {units.shape}")
print(f"Tenants: {tenants.shape}")

# Merge Data (The Relational Part)
# 1. Join Units to Properties
units_wide = units.merge(props, on='property_id', how='left')
# 2. Join Tenants to Units (Inner join = only occupied units)
master_df = tenants.merge(units_wide, on='unit_id', how='left')

print("\n--- Relational Schema ---")
print("Properties Table Columns:", list(props.columns))
print("Units Table Columns:     ", list(units.columns))
print("Tenants Table Columns:   ", list(tenants.columns))

print("\n--- Master DataFrame (Merged) ---")
print(master_df.info())

print("\n--- Sample Rows ---")
print(master_df.head(3).T)

print("\n--- Insights ---")
print("Avg Rent by Building Class:")
print(units_wide.groupby('class')['market_rent'].mean())

print("\nAvg Rent by Neighborhood:")
print(units_wide.groupby('neighborhood')['market_rent'].mean())

print("\nAvg Income by Unit Type Occupied:")
print(master_df.groupby('type')['income'].mean())
