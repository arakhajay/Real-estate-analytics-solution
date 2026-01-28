import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_chat(message):
    print(f"\n--- Testing: '{message}' ---")
    try:
        # 1. Login
        login_data = {"username": "admin", "password": "superadmin123"}
        token_res = requests.post(f"{BASE_URL}/token", data=login_data)
        if token_res.status_code != 200:
             print("Login Failed.")
             print(f"Login Response: {token_res.text}")
             return

        token = token_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Chat
        res = requests.post(f"{BASE_URL}/chat", json={"message": message}, headers=headers)
        if res.status_code == 200:
            data = res.json()
            print(f"[OK] Status: {res.status_code}")
            print(f"SOURCE: {data.get('source')}")
            response_text = data.get('response', '')
            print(f"RESPONSE: {response_text[:100] if response_text else 'Empty'}...")
        else:
            print(f"[FAIL] Status: {res.status_code}")
            print(f"Error: {res.text}")
            
    except Exception as e:
        print(f"[FAIL] Connection Error: {e}")

if __name__ == "__main__":
    test_chat("Who is the tenant in unit 1A?") # RAG
    test_chat("What is the detailed market forecast for 2026?") # Agent
