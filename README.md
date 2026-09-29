# 🤖 Autonomous AI Incident Response Agent with Long-Term Memory, RAG & Autonomous Remediation

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange.svg)](https://www.trychroma.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **CRITICAL ARCHITECTURE PRINCIPLE**: This is an **AUTONOMOUS AI SRE AGENT**, not a chatbot. It implements an actual closed-loop agent lifecycle:  
> `OBSERVE` $\rightarrow$ `UNDERSTAND` $\rightarrow$ `PLAN` $\rightarrow$ `RETRIEVE MEMORY (RAG)` $\rightarrow$ `REASON` $\rightarrow$ `SELECT TOOLS` $\rightarrow$ `EXECUTE TOOLS` $\rightarrow$ `OBSERVE RESULTS` $\rightarrow$ `REASON AGAIN` $\rightarrow$ `ROOT CAUSE & REMEDIATION` $\rightarrow$ `HUMAN APPROVAL` $\rightarrow$ `EXECUTE ACTION` $\rightarrow$ `VERIFY` $\rightarrow$ `LEARN & UPDATE LONG-TERM MEMORY`.

---

## 🏛️ System Architecture

```
                                USER / SRE ON-CALL ENGINEER
                                             │
                                             ▼
                                  REACT SRE CONSOLE (13 Pages)
                                             │
                                             ▼
                                     FASTAPI BACKEND API
                                             │
                                             ▼
                             AUTONOMOUS INCIDENT AGENT LOOP
                                             │
              ┌──────────────────────────────┼─────────────────────────────┐
              ▼                              ▼                             ▼
       EPISODIC MEMORY               PROCEDURAL MEMORY              SEMANTIC MEMORY
   (Historical Incidents)            (SRE Runbooks)              (Blameless Postmortems)
              │                              │                             │
              └──────────────────────────────┼─────────────────────────────┘
                                             ▼
                                    CHROMADB VECTOR STORE
                                  (384-Dim Dense Embeddings)
                                             │
                                             ▼
                                       RAG PIPELINE
                             (Top-K Similarity & Context Assembly)
                                             │
                                             ▼
                                      LLM REASONING
                          (OpenAI / Gemini / Anthropic / SRE Brain)
                                             │
                                             ▼
                                  DIAGNOSTIC TOOL LOOP
                       (get_logs, check_health, check_db_connections)
                                             │
                                             ▼
                                  ROOT CAUSE DETERMINATION
                                             │
                                             ▼
                                 HUMAN APPROVAL SAFETY GATE
                                (Required for Risky Actions)
                                             │
                                             ▼
                                    REMEDIATION EXECUTION
                            (restart_service, rollback_deployment)
                                             │
                                             ▼
                                   TELEMETRY VERIFICATION
                         (Error Rate < 1%, Latency Normalization)
                                             │
                                             ▼
                             CONTINUOUS LEARNING & MEMORY UPDATE
                        (Writes newly resolved incident to ChromaDB)
                                             │
                                             ▼
                                 FUTURE INCIDENT RETRIEVAL
```

---

## 🚀 Key Features

1. **Closed-Loop Multi-Step Agent State Machine**:
   - Executes multi-step diagnostic reasoning, gathers evidence via tools, evaluates hypotheses, halts for human approval before disruptive actions, executes remediation, verifies health metrics, and stores experience in memory.
2. **Real ChromaDB Vector Database**:
   - Real vector store collections for `incidents`, `runbooks`, `postmortems`, and `learned_memories` with real cosine distance calculation.
3. **Continuous Learning & Memory Update**:
   - When an incident is resolved and verified, its signature and resolution are vectorized and written back to ChromaDB. Subsequent incidents with matching symptoms immediately retrieve the newly learned incident as ground truth!
4. **Human-in-the-Loop Safety Gate**:
   - Read-only tools (`get_logs`, `check_service_health`, `check_database_connections`) execute automatically.
   - Destructive/risky tools (`restart_service`, `rollback_deployment`, `scale_service`) require explicit engineer sign-off.
5. **Realistic Simulated Infrastructure**:
   - 5 simulated services (`payment-api`, `auth-service`, `order-service`, `user-service`, `database-service`) with live states (`HEALTHY`, `DEGRADED`, `DOWN`), error rates, latencies, database connection pool gauges, and interactive failure injection.
6. **Zero-Lockin AI Provider Model**:
   - Configurable for **OpenAI**, **Anthropic**, **Google Gemini**, plus an offline **Intelligent SRE Brain (Demo Mode)** that performs full multi-step reasoning and semantic retrieval without external API keys out of the box.
7. **13-Page React SRE Console**:
   - Dashboard, Create Incident, Active Incidents, Incident Details (main SRE workspace), AI Analysis Hub, Similar Incidents, Runbook Library, Postmortems, Memory Explorer, Agent Actions Audit, Execution History, SRE Analytics, and Settings.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, Requests, NumPy.
- **Vector Database**: ChromaDB (Persistent client with cosine metric space).
- **Structured Database**: SQLite (`incident_agent.db`).
- **AI / Embeddings**: OpenAI (`gpt-4o`, `text-embedding-3-small`), Gemini 1.5, Anthropic Claude 3.5, and deterministic SRE Brain vectorizer.

---

## 📦 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```powershell
# Navigate to project root
cd recallopps

# Install Python requirements
py -3.10 -m pip install -r backend/requirements.txt

# Seed Database & ChromaDB with historical incidents, runbooks, and postmortems
py -3.10 scripts/seed_data.py

# Start FastAPI Backend (Runs on http://127.0.0.1:8000)
py -3.10 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```powershell
# In a new terminal, navigate to frontend
cd recallopps/frontend

# Install dependencies
npm install

# Start Vite Development Server (Runs on http://127.0.0.1:5173)
npm run dev
```

Open your browser at `http://127.0.0.1:5173`.

---

## 🧪 Automated Verification & Tests

### Run Backend Unit & Integration Tests:
```powershell
py -3.10 -m pytest backend/tests -v
```

### Run End-to-End Closed-Loop Verification:
```powershell
py -3.10 scripts/run_e2e_verification.py
```
*This test executes the full lifecycle: Ingests `INC-1024` $\rightarrow$ Vector Search $\rightarrow$ RAG $\rightarrow$ Diagnostic Tools $\rightarrow$ Root Cause $\rightarrow$ Safety Approval $\rightarrow$ Remediation $\rightarrow$ Verification $\rightarrow$ Memory Learning $\rightarrow$ Ingests `INC-1025` and confirms `INC-1024` is retrieved as prior experience!*

---

## 🎬 Presentation Demo Walkthrough

1. **Step 1: Open Dashboard**:
   - Observe the 5 cluster services (`payment-api`, `auth-service`, `order-service`, `user-service`, `database-service`) and live SRE telemetry metrics.
2. **Step 2: Inject Test Failure or Create Incident**:
   - Click **Inject Test Failure** or navigate to **Create Incident**.
   - Select **INC-1024: Payment API 500 DB Pool Exhaustion**.
   - Click **Ingest & Run AI Agent Investigation**.
3. **Step 3: Watch Autonomous Agent State Loop**:
   - Observe the live flow in the **Agent State Machine Visualizer**:
     `Observe` $\rightarrow$ `Understand` $\rightarrow$ `Retrieve RAG` $\rightarrow$ `Plan` $\rightarrow$ `Tools (get_logs, check_health)` $\rightarrow$ `Reason` $\rightarrow$ `Approval Gate`.
   - Inspect the **Agent Activity Stream** showing real events from the backend.
4. **Step 4: Human-in-the-Loop Safety Approval**:
   - Review the **Approval Card**:
     - Action: *Restart payment-api Connection Pool & Services*
     - Risk: *MEDIUM RISK*
     - Grounded Reasoning: *Similar incident INC-782 was resolved using service restart.*
   - Click **Approve & Execute Remediation**.
5. **Step 5: Automated Verification & Learning**:
   - Watch the agent call `restart_service()` and `verify_resolution()`.
   - Telemetry normalization: Error Rate drops from `42.5%` $\rightarrow$ `0.05%`, Latency normalizes to `48ms`, Cluster Status returns to `HEALTHY`.
   - **Continuous Learning**: Incident `INC-1024` is automatically embedded and indexed into ChromaDB.
6. **Step 6: Submit Engineer Feedback**:
   - Click **Worked (100%)** and add operational notes.
7. **Step 7: Verify Long-Term Memory in Memory Explorer**:
   - Navigate to **Memory Explorer** and search `"payment connection timeout"`.
   - Notice that `INC-1024` is now indexed and returned as high-similarity evidence for all future incidents!
