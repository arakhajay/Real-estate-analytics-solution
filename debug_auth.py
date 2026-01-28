import sqlite3
import jwt
import os
from datetime import datetime, timedelta

# Mock Config
SECRET_KEY = "your-secret-key-for-dev-only"
ALGORITHM = "HS256"
DB_PATH = os.path.join("src", "data", "users.db")

def verify_flow():
    print(f"Checking DB at {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("DB NOT FOUND!")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    username = "owner_prop_000"
    print(f"Fetching user: {username}")
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        print("User not found!")
        return
        
    print(f"DB Row Keys: {user.keys()}")
    print(f"DB Property ID: '{user['property_id']}' (Type: {type(user['property_id'])})")
    
    # Simulate Token Creation
    pid = user['property_id']
    data = {"sub": user['username'], "role": user['role'], "pid": pid}
    encoded_jwt = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Encoded JWT: {encoded_jwt[:20]}...")
    
    # Simulate Token Decoding
    decoded = jwt.decode(encoded_jwt, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"Decoded Payload PID: '{decoded.get('pid')}'")
    
    # Check Logic
    token_pid = decoded.get('pid')
    if not token_pid or token_pid == "ALL":
        print("FILTERING WOULD BE SKIPPED (Visible = ALL)")
    else:
        print(f"FILTERING WOULD APPLY (Visible = [{token_pid}])")

if __name__ == "__main__":
    verify_flow()
