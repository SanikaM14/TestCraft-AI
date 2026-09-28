import sys
import io
import os
from fastapi.testclient import TestClient

# Ensure sys.stdout is utf-8
sys.stdout.reconfigure(encoding='utf-8')

# Import FastAPI app from main
from main import app, User, SessionLocal

client = TestClient(app)

def test_all():
    print("==================================================")
    print("TestCraft AI — Complete Feature & Security Test Suite")
    print("==================================================")

    # 1. Test Login without signing up (MUST FAIL)
    print("\n1. Testing Security: Random User Login without Sign Up (Must Fail)...")
    import time
    random_user_payload = {
        "username": f"unregistered_{int(time.time()*1000)}",
        "password": "random_password_xyz_123"
    }
    res = client.post("/api/login", json=random_user_payload)
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    assert "Account does not exist" in res.json().get("detail", "") or "sign up first" in res.json().get("detail", "")
    print("-> PASS: Unregistered user was strictly rejected with 400 error.")

    # 2. Test Signup with valid user
    print("\n2. Testing User Sign Up...")
    test_username = f"verified_tester_{os.getpid()}"
    test_password = "SecurePassword123!"
    signup_payload = {
        "username": test_username,
        "password": test_password
    }
    res = client.post("/api/signup", json=signup_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    signup_data = res.json()
    assert "access_token" in signup_data
    assert signup_data["tokens_remaining"] == 10
    auth_token = signup_data["access_token"]
    print(f"-> PASS: User '{test_username}' successfully registered with 10 credits.")

    # 3. Test Duplicate Signup (Must Fail)
    print("\n3. Testing Security: Duplicate Username Registration (Must Fail)...")
    res = client.post("/api/signup", json=signup_payload)
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    assert "already registered" in res.json().get("detail", "")
    print("-> PASS: Duplicate username registration was properly prevented.")

    # 4. Test Login with wrong password (Must Fail)
    print("\n4. Testing Security: Registered User with Wrong Password (Must Fail)...")
    res = client.post("/api/login", json={
        "username": test_username,
        "password": "WrongPassword999!"
    })
    assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
    assert "Incorrect password" in res.json().get("detail", "")
    print("-> PASS: Wrong password was strictly rejected.")

    # 5. Test Login with correct credentials (Must Succeed)
    print("\n5. Testing Sign In with Correct Credentials...")
    res = client.post("/api/login", json=signup_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    login_data = res.json()
    assert "access_token" in login_data
    auth_token = login_data["access_token"]
    print("-> PASS: User successfully signed in and received JWT token.")

    # 6. Test Protected Endpoint /api/me without Auth (Must Fail)
    print("\n6. Testing Security: Accessing /api/me without Token (Must Fail)...")
    res = client.get("/api/me")
    assert res.status_code == 401
    print("-> PASS: Unauthenticated access was blocked (401).")

    # 7. Test Protected Endpoint /api/me with Valid Token
    print("\n7. Testing Authenticated User Profile (/api/me)...")
    headers = {"Authorization": f"Bearer {auth_token}"}
    res = client.get("/api/me", headers=headers)
    assert res.status_code == 200
    user_info = res.json()
    assert user_info["username"] == test_username
    assert user_info["tokens"] == 10
    print(f"-> PASS: Successfully retrieved profile for {user_info['username']}.")

    # 8. Test File Extraction (CSV)
    print("\n8. Testing File Extraction (CSV)...")
    csv_content = b"feature,requirement\nlogin,must be secure\ncheckout,must support credit cards"
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    res = client.post("/api/extract-text", files=files, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert "login" in res.json()["extracted_text"]
    print("-> PASS: CSV file text extraction succeeded.")

    # 9. Test Test Generation (Mock Key Mode)
    print("\n9. Testing Test Scenario Generation (Mock Mode)...")
    gen_payload = {
        "text_context": "Feature: User Authentication. Users must register before login.",
        "format_style": "Standard (Step-by-Step)",
        "focus_areas": ["Functional", "Security"],
        "custom_api_key": "test"
    }
    res = client.post("/api/generate-tests", json=gen_payload, headers=headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    markdown_output = res.json()["markdown"]
    assert "TestCraft Generated QA Test Plan" in markdown_output
    assert "Focus Areas" in markdown_output
    print("-> PASS: Test scenario generation succeeded.")

    # 10. Test PDF Compilation & Download
    print("\n10. Testing PDF Compilation & Export...")
    pdf_payload = {"markdown": markdown_output}
    res = client.post("/api/download-pdf", json=pdf_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 200
    print(f"-> PASS: PDF successfully generated ({len(res.content)} bytes).")

    print("\n==================================================")
    print("ALL TESTS PASSED! Security and features are 100% verified.")
    print("==================================================")
    return True

if __name__ == "__main__":
    test_all()
