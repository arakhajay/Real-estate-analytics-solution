import os
import requests
from dotenv import load_dotenv

load_dotenv()

PERPLEXITY_KEY = os.getenv("PERPLEXITY_API_KEY")

print(f"Testing API Key: {PERPLEXITY_KEY[:5]}...  (Length: {len(PERPLEXITY_KEY) if PERPLEXITY_KEY else 0})")

if not PERPLEXITY_KEY:
    print("❌ Error: PERPLEXITY_API_KEY not found in environment.")
    exit(1)

url = "https://api.perplexity.ai/chat/completions"
payload = {
    "model": "sonar",
    "messages": [
        {"role": "system", "content": "Be concise."},
        {"role": "user", "content": "Test connection. Say 'Connected'."}
    ]
}
headers = {
    "Authorization": f"Bearer {PERPLEXITY_KEY}",
    "Content-Type": "application/json"
}

try:
    print("Sending request...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"✅ Success! Response: {response.json()['choices'][0]['message']['content']}")
    else:
        print(f"❌ Failed. Response: {response.text}")
except Exception as e:
    print(f"❌ Connection Error: {e}")
