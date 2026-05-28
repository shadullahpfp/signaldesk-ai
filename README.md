# SignalDesk AI 🚀

SignalDesk AI is an enterprise-grade AI-powered customer workflow and intelligence platform. It acts as an intelligent ticketing system (similar to Zendesk or Intercom) that autonomously categorizes urgency and generates AI-driven replies to customer queries.

Built as a flagship portfolio project, it demonstrates deep expertise in **Backend Engineering, Scalable Architecture, and AI Orchestration**.

## 🏗 System Architecture

![Architecture](docs/architecture_design.md)
*For a detailed system breakdown, view our [Architecture Design Document](docs/architecture_design.md).*

### Tech Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, ShadCN UI
- **Backend:** FastAPI, Async Python, Pydantic, Dependency Injection
- **Database:** PostgreSQL (via Supabase), SQLAlchemy (async), Alembic
- **AI Core:** OpenAI GPT-4 Turbo
- **Auth:** JWT (Supabase Auth + FastAPI Role Based Access)
- **Deployment:** Docker, docker-compose

## 🚀 Key Features

1. **AI Urgency Classification:** Automatically tags incoming tickets as LOW, MEDIUM, HIGH, or CRITICAL using LLMs.
2. **AI Reply Generation:** Drafts professional, context-aware responses to support tickets instantly.
3. **Decoupled Architecture:** A strictly layered N-Tier backend (API -> Service -> Repository) allowing high maintainability.
4. **Audit Logging:** Employs a robust `activity_logs` architecture with PostgreSQL `JSONB` for an immutable enterprise audit trail.
5. **Async Workflows:** Fast, non-blocking I/O operations via `psycopg` and FastAPI background tasks.

## 💻 Local Development

### 1. Database & Environment
1. Clone the repository: `git clone https://github.com/shadullahpfp/signaldesk-ai.git`
2. Configure `.env` in the `backend/` and `frontend/` directories (see `.env.example`).
3. Ensure you have your `DATABASE_URL` pointing to your PostgreSQL instance.

### 2. Run Backend (FastAPI) via Docker
Because the backend relies on specific Python C-extensions for async DB drivers, we strongly recommend using Docker to ensure a pristine Python 3.11 environment.
```bash
docker compose up --build
```
*API will be available at http://localhost:8000*

### 3. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Dashboard will be available at http://localhost:3000*

## 📦 Database Migrations
To run Alembic migrations against your database via Docker:
```bash
docker compose run --rm backend alembic revision --autogenerate -m "Update schema"
docker compose run --rm backend alembic upgrade head
```

---
*Built with ❤️ focusing on startup engineering principles.*
