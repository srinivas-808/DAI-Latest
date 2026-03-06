import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_check_key():
    print("Testing /api/check-key...")
    try:
        res = requests.get(f"{BASE_URL}/api/check-key")
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_set_key_invalid():
    print("\nTesting /api/set-key with invalid key...")
    try:
        res = requests.post(f"{BASE_URL}/api/set-key", json={"api_key": "dummy_key_invalid"})
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_check_key()
    test_set_key_invalid()
