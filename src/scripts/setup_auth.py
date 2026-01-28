import sqlite3
import pandas as pd
import bcrypt
import os

# Setup
DB_PATH = os.path.join("src", "data", "users.db")
PROPS_PATH = os.path.join("src", "data", "synthetic", "calibrated_properties.csv")

def get_password_hash(password):
    # Generating a salt and hashing the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def init_db():
    # Ensure directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL,
            property_id TEXT
        )
    ''')
    conn.commit()
    return conn

def create_users():
    conn = init_db()
    cursor = conn.cursor()
    
    # Clear existing
    cursor.execute("DELETE FROM users")
    
    users_list = []
    
    # 1. Superadmin
    admin_user = "admin"
    admin_pass = "superadmin123"
    cursor.execute(
        "INSERT INTO users (username, hashed_password, role, property_id) VALUES (?, ?, ?, ?)",
        (admin_user, get_password_hash(admin_pass), "admin", None)
    )
    users_list.append({"username": admin_user, "password": admin_pass, "role": "admin", "property_id": "ALL"})
    
    # 2. Property Owners
    if os.path.exists(PROPS_PATH):
        df = pd.read_csv(PROPS_PATH)
        for _, row in df.iterrows():
            pid = row['property_id']
            username = f"owner_{pid.lower()}"
            password = f"pass_{pid}"
            
            cursor.execute(
                "INSERT INTO users (username, hashed_password, role, property_id) VALUES (?, ?, ?, ?)",
                (username, get_password_hash(password), "owner", pid)
            )
            users_list.append({"username": username, "password": password, "role": "owner", "property_id": pid})
    else:
        print(f"Warning: {PROPS_PATH} not found. Only creating admin.")
        
    conn.commit()
    conn.close()
    
    return users_list

if __name__ == "__main__":
    generated_users = create_users()
    print("✅ Users Created Successfully!")
    print("\n--- CREDENTIALS ---")
    print(f"{'Username':<20} {'Password':<20} {'Role':<10} {'Property Access'}")
    print("-" * 70)
    for u in generated_users:
        print(f"{u['username']:<20} {u['password']:<20} {u['role']:<10} {u['property_id']}")
