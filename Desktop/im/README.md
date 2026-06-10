# Inventory Reconciliation Agent

A production-quality, Dockerized, AI-powered Inventory Reconciliation Tool. This application compares an intended asset registry (uploaded via CSV) against actual live infrastructure state (provided by a mock JSON API), programmatically detects discrepancies, and leverages multiple Gemini 2.5 Flash agents to classify issues, determine operational severity levels, and generate actionable remediation recommendations. It also features a fully secure natural language chat interface to query database reconciliation outputs.

---

## Folder Structure

```
/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy database schemas
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── routes/            # FastAPI routers (auth, inventory, reconcile, reports, chat)
│   │   ├── services/          # Reconciliation engine, CSV parsing, PDF/CSV report builders
│   │   ├── agents/            # Gemini agent configurations (Agent 1, Agent 2, Agent 3)
│   │   ├── database.py        # SQLAlchemy connections
│   │   └── main.py            # FastAPI entry point
│   ├── tests/                 # Unit & integration testing suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout navigation wrappers
│   │   ├── pages/             # Login, Dashboard, Upload, Results, Reports, Chat
│   │   ├── context/           # AuthContext (JWT verification)
│   │   ├── App.jsx            # Routing and login guards
│   │   ├── main.jsx
│   │   └── index.css          # Styling (Tailwind directives)
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── index.html
│   ├── Dockerfile
│   └── package.json
├── data/                      # Sample datasets for CSV uploads
├── docker-compose.yml
├── README.md
├── architecture_diagram.md
└── prompt_documentation.md
```

---

## Features

1. **JWT Authentication**: Secure login portal with default credentials `admin / admin123`.
2. **Interactive Dashboard**: Modern glassmorphic overview containing total items, missing nodes, unexpected assets, config drifts, and severity charts powered by Recharts.
3. **Registry Upload**: Validates intended inventories from CSV spreadsheets.
4. **Reconciliation Core**: Programmatic engine linking golden states against mock live infrastructure.
5. **AI Classification & Remediation**: Employs multiple Gemini 2.5 Flash agents to assign risk ratings (Critical, High, Medium, Low), map issues to drift vectors, and write recommendations.
6. **AI Chat Assistant**: Talk directly to the reconciled dataset.
7. **Report Exports**: Download signed audit PDFs (built with ReportLab) or spreadsheet CSVs.

---

## Quick Setup & Run (Docker Compose)

The easiest way to boot the entire stack (both backend database server and frontend React app) is using Docker Compose.

### Prerequisites

1. Install **Docker** and **Docker Compose**.
2. Set your Gemini API token as a local environment variable.

### Commands

1. **Set Gemini API Key**:
   - **Windows PowerShell**:
     ```powershell
     $env:GEMINI_API_KEY="your-api-key-here"
     ```
   - **Mac/Linux Bash**:
     ```bash
     export GEMINI_API_KEY="your-api-key-here"
     ```

2. **Boot Service Containers**:
   ```bash
   docker-compose up --build
   ```

3. **Access Application**:
   - Web Client: [http://localhost:5173](http://localhost:5173)
   - API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Local Development (Without Docker)

If you prefer to run the applications natively for debugging:

### 1. Backend Server Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
Runs at [http://localhost:8000](http://localhost:8000)

### 2. Frontend client Setup
```bash
cd frontend
npm install
npm run dev
```
Runs at [http://localhost:5173](http://localhost:5173) (Proxies `/api/*` requests automatically to `localhost:8000`)
