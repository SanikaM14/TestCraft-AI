# TestCraft AI — Requirements to QA Engine

TestCraft AI is an automated Quality Assurance engineering platform that ingests software requirements specifications (PDF, DOCX, CSV) or raw user stories and compiles them into production-ready test matrices and BDD Gherkin scenarios.

---

## Overview and Core Capabilities

- Multi-Format Specification Ingestion: Direct stream parsing for PDF documents, Microsoft Word files (.docx), and CSV tables, alongside free-text input.
- Selective Test Domain Scoping: Strict filtering across user-selected focus areas (Functional, UI/UX & Accessibility, Security, Performance, Edge Cases).
- Dual Strategy Formatting:
  - Standard Tabular Matrices: Comprehensive tables including Test ID, Description, Steps to Execute, and Expected Results.
  - BDD Scenarios: Structured Gherkin syntax (Feature, Scenario, Given, When, Then).
- Bring Your Own Key (BYOK) Architecture: Local client storage for custom Groq API keys with seamless server-side fallback.
- Export and Reporting: Real-time markdown preview with GitHub Flavored Markdown (GFM) table rendering and direct-to-PDF compilation.
- Authentication & Quotas: OAuth2 Password Bearer authentication with JWT sessions, Bcrypt password hashing, and token usage accounting.

---

## Directory and File Structure

```text
WebsiteTester/
├── backend/
│   ├── .env                       # Environment variables (API keys, JWT secret)
│   ├── main.py                    # FastAPI application, authentication, parsers & AI routes
│   ├── qa_app.db                  # SQLite database for user accounts and token tracking
│   ├── requirements.txt           # Python backend dependencies
│   └── test_features.py           # Automated backend integration test suite
├── frontend/
│   ├── public/                    # Static web assets
│   ├── src/
│   │   ├── assets/                # Images and graphic components
│   │   ├── App.css                # Global styling overrides
│   │   ├── App.jsx                # React Router v7 root & theme setup
│   │   ├── index.css              # Baseline CSS resets
│   │   ├── Login.jsx              # Sign-In and Sign-Up authentication views
│   │   ├── main.jsx               # React entrypoint
│   │   └── MainPage.jsx           # Main dashboard, upload form, GFM preview & export
│   ├── index.html                 # Main HTML template
│   ├── package.json               # Node.js dependencies and build scripts
│   └── vite.config.js             # Vite configuration
├── app.py                         # Standalone Streamlit interface
├── REQUIREMENTS.md                # Full Software Requirements Specification (SRS)
├── LICENSE                        # MIT License
├── README.md                      # Project documentation
└── requirements.txt               # Root level Python dependencies
```

---

## Technology Stack

### Frontend
- Framework: React 19
- Build Tool: Vite 8
- UI Component Library: Material UI (MUI v9)
- Styling & Icons: Emotion, Material Icons
- Markdown Engine: React Markdown with Remark GFM
- Routing & HTTP: React Router v7, Axios

### Backend
- Web Framework: FastAPI (Python 3.12)
- Server: Uvicorn (ASGI)
- Database ORM: SQLAlchemy with SQLite
- Authentication & Security: JSON Web Tokens (python-jose), Bcrypt password hashing
- Validation: Pydantic v2

### AI Inference & Document Processing
- Inference Engine: Groq Cloud API (Llama 3.3 70B, GPT-OSS 20B, Llama 3.1 8B)
- PDF Engine & Document Parsers: PyMuPDF (fitz), python-docx, pandas
- PDF Compiler: markdown-pdf

---

## Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher and npm
- Groq Cloud API Key (available at console.groq.com)

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Configure environment variables in backend/.env:
# GROQ_API_KEY=gsk_your_groq_api_key_here
# JWT_SECRET_KEY=your_secure_random_jwt_key_here

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install node dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## REST API Specification

| HTTP Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/signup` | Create new user account with 10 free credits | No |
| `POST` | `/api/login` | Authenticate credentials and receive JWT | No |
| `GET` | `/api/me` | Retrieve authenticated user profile and remaining credits | Yes |
| `POST` | `/api/extract-text` | Extract raw text from PDF, DOCX, or CSV file | Yes |
| `POST` | `/api/generate-tests` | Synthesize QA test scenarios based on requirements | Yes |
| `POST` | `/api/download-pdf` | Compile structured markdown test suite to PDF document | No |

---

## Author & Contact

- Author: Sanika Mordekar
- GitHub: [SanikaM14](https://github.com/SanikaM14)
- Repository: [TestCraft-AI](https://github.com/SanikaM14/TestCraft-AI)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
