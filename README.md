# TestCraft AI — Intelligent Requirements-to-Test-Cases Engine

> Transform software specification documents (PDF, DOCX, CSV) or user stories into production-grade QA test matrices and BDD Gherkin scenarios in seconds.

[![React](https://img.shields.io/badge/Frontend-React%2019-blue)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![Groq](https://img.shields.io/badge/AI%20Inference-Groq%20Cloud-f55036)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Key Features

- **Multi-Format Ingestion:** Parse requirements directly from PDF, Word (`.docx`), CSV, or paste raw user stories.
- **Customizable QA Strategy:**
  - **Standard Tables:** Generates test matrices with `Test ID`, `Description`, `Steps to Execute`, and `Expected Result`.
  - **BDD (Given-When-Then):** Generates structured Gherkin syntax scenarios.
- **Multi-Domain Focus Area Toggles:** Functional, UI/UX & Accessibility, Security, Performance, and Edge Cases.
- **BYOK (Bring Your Own Groq Key):** Built-in support for users to provide their own free Groq API key for unlimited generations, with automatic fallback to server credentials.
- **One-Click Export:** Download formatted PDFs (`TestCraft_Generated_Test_Cases.pdf`) or copy markdown for Jira/TestRail.
- **Secure Authentication:** JWT-based user authentication, Bcrypt password hashing, and token quota tracking.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React 19, Vite, Material UI (MUI v9), React Markdown, Remark GFM, Axios.
- **Backend:** FastAPI, Python 3.12, Uvicorn, SQLAlchemy ORM, Pydantic v2.
- **AI Core:** Groq Cloud API (`llama-3.3-70b-versatile`, `openai/gpt-oss-20b`, `llama-3.1-8b-instant`).
- **File Parsing & PDF:** PyMuPDF (`fitz`), `python-docx`, `pandas`, `markdown-pdf`.
- **Database:** SQLite (`qa_app.db`).

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Free Groq API Key from [console.groq.com](https://console.groq.com/keys)

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

pip install fastapi uvicorn python-jose[cryptography] passlib bcrypt python-multipart fitz docx pandas groq markdown-pdf python-dotenv

# Create .env file:
echo GROQ_API_KEY=your_groq_api_key_here > .env
echo JWT_SECRET_KEY=your_jwt_secret_key_here >> .env

# Run FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Visit **[http://localhost:5173/](http://localhost:5173/)** to access TestCraft AI.

---

## 📄 License & Credits

- Created with ❤️ by [**Sanika** (SanikaM14)](https://github.com/SanikaM14)
- Licensed under the [MIT License](LICENSE).
