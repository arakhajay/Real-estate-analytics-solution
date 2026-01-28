import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")

print(f"Testing Groq Key: {GROQ_KEY[:5]}...  (Length: {len(GROQ_KEY) if GROQ_KEY else 0})")

if not GROQ_KEY:
    print("❌ Error: GROQ_API_KEY not found in environment.")
    exit(1)

url = "https://api.groq.com/openai/v1/chat/completions"
payload = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "system", "content": "Be concise."},
        {"role": "user", "content": "Test connection. Say 'Connected'."}
    ]
}
headers = {
    "Authorization": f"Bearer {GROQ_KEY}",
    "Content-Type": "application/json"
}

try:
    print("Sending request to Groq...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Success! Response: {response.json()['choices'][0]['message']['content']}")
    else:
        print(f"❌ Failed. Response: {response.text}")
except Exception as e:
    print(f"❌ Connection Error: {e}")
