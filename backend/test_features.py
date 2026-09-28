import requests
import io
import time
import sys
# Set default encoding to utf-8 just in case
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"

def test_all():
    print("Running QA Engine automated tests...")
    
    # 1. Test Extract CSV
    print("1. Testing File Extraction (CSV)...")
    csv_content = b"feature,requirement\nlogin,must be secure\ncheckout,must support credit cards"
    files = {"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    try:
        res = requests.post(f"{BASE_URL}/api/extract-text", files=files)
        res.raise_for_status()
        assert "login" in res.json()["extracted_text"]
        print("-> File extraction passed.")
    except Exception as e:
        print(f"-> File extraction failed: {e}")
        return False

    # 2. Test Generation API (with mock key)
    print("2. Testing Generation API (Mock Mode)...")
    payload = {
        "api_key": "test",
        "text_context": "Test context",
        "format_style": "BDD (Given-When-Then)",
        "focus_areas": ["Functional", "Security"]
    }
    try:
        res = requests.post(f"{BASE_URL}/api/generate-tests", json=payload)
        res.raise_for_status()
        markdown = res.json()["markdown"]
        assert "Mock Generated Test Cases" in markdown
        assert "Security" in markdown
        print("-> Generation API passed.")
    except Exception as e:
        print(f"-> Generation API failed: {e}")
        return False

    # 3. Test PDF Download
    print("3. Testing PDF Generation...")
    try:
        pdf_payload = {"markdown": markdown}
        res = requests.post(f"{BASE_URL}/api/download-pdf", json=pdf_payload)
        res.raise_for_status()
        assert res.headers["content-type"] == "application/pdf"
        assert len(res.content) > 100 # Should be a valid PDF size
        print("-> PDF Generation passed.")
    except Exception as e:
        print(f"-> PDF Generation failed: {e}")
        return False

    print("\nAll backend features are working 100%!")
    return True

if __name__ == "__main__":
    time.sleep(1) # wait a sec for backend to reload
    test_all()
