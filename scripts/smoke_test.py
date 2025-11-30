import requests
import sys
import time

BASE_URL = "http://localhost:8000/api"

def run_test():
    print("Starting Smoke Test...")
    
    # 1. Register
    email = f"smoke_{int(time.time())}@test.com"
    print(f"Registering {email}...")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": "password123",
        "full_name": "Smoke User",
        "family_name": "Smoke Family"
    })
    if res.status_code != 200:
        print(f"❌ Register failed: {res.text}")
        return False
    
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Register OK")
    
    # 2. Get Me
    print("Getting User Info...")
    res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if res.status_code != 200:
        print(f"❌ Get Me failed: {res.text}")
        return False
    user_id = res.json()["id"]
    print(f"✅ Get Me OK (ID: {user_id})")
    
    # 3. Create Event
    print("Creating Event...")
    res = requests.post(f"{BASE_URL}/events/", headers=headers, json={
        "title": "Smoke Event",
        "start_time": "2025-12-01T10:00:00",
        "end_time": "2025-12-01T11:00:00",
        "category": "work"
    })
    if res.status_code != 201: # Created
        print(f"❌ Create Event failed: {res.text}")
        # Check if 200 is returned instead of 201
        if res.status_code != 200:
             return False
    event_id = res.json()["id"]
    print(f"✅ Create Event OK (ID: {event_id})")
    
    # 4. Get Metrics
    print("Getting Metrics...")
    res = requests.get(f"{BASE_URL}/events/metrics", headers=headers)
    if res.status_code != 200:
        print(f"❌ Get Metrics failed: {res.text}")
        return False
    print("✅ Get Metrics OK")
    
    print("🎉 All Smoke Tests Passed!")
    return True

if __name__ == "__main__":
    try:
        success = run_test()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        sys.exit(1)
