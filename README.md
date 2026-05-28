# SignalDesk AI

SignalDesk AI is an enterprise-grade AI-powered customer workflow and intelligence platform. It acts as an intelligent ticketing system that autonomously categorizes urgency, provides summaries, and generates AI-driven draft replies to customer support queries.

Built as a flagship portfolio project, it demonstrates backend engineering practices, scalable system architectures, and AI API orchestration.

---

## System Architecture

Detailed system layout:
* Next.js 15 Client Frontend: Interfaces with users and makes authenticated requests.
* FastAPI Backend API Router: Protects routes, processes requests, and handles authentication.
* Service Layer: Decouples business logic from frameworks (user validation, ticket updates, activity logging).
* AI Orchestration Layer: Interacts with the OpenAI API for urgency classification, summaries, and reply drafts.
* Database Layer: PostgreSQL (via Supabase) with SQLAlchemy for async execution and Alembic for migrations.
* Async Workflows: Employs FastAPI background tasks to run triage without blocking user response times.

### Tech Stack
* Frontend: Next.js 15, TypeScript, Tailwind CSS
* Backend: FastAPI, Async Python, Pydantic, Dependency Injection
* Database: PostgreSQL (via Supabase), SQLAlchemy (async), Alembic
* AI Core: OpenAI API (GPT-3.5)
* Auth: JWT Access and Refresh Tokens with Role-Based Access Control (RBAC)
* Deployment: Docker, Docker Compose

---

## Key Features

1. AI Urgency Classification: Automatically triages incoming support requests as LOW, MEDIUM, HIGH, or CRITICAL.
2. AI Summarization and Drafts: Generates brief one-sentence summaries and empathetic draft replies.
3. Transactional Audit Trail: Records every ticket status update, assignee shift, and AI generation into a secure activity log database using PostgreSQL JSONB.
4. Robust Session Management: Implements standard signup, login, refresh tokens, and logout via FastAPI.
5. Search and Filters: Enables server-side search, status filtering, urgency filtering, and pagination on ticket queues.

---

## Local Development

### 1. Configure Environment Variables
Ensure you copy `.env.example` to `.env` in the `backend/` directory, and verify your credentials:

* Database URL: If your password contains special characters (like @), make sure to URL-encode them (e.g. use %40 for @) to allow proper URI parsing.
* OpenAI API: Provide your `OPENAI_API_KEY` for AI features. If omitted or invalid, the backend will automatically fallback to default values without crashing.

### 2. Run Backend (FastAPI) via Docker
Because standard Supabase database hosts are IPv6-only, we have configured a custom IPv6 subnet inside our Docker Compose environment to allow the container network to connect successfully:

```bash
docker compose up --build -d
```

The API will be available at http://localhost:8000.
Interactive Swagger API documentation is available at http://localhost:8000/docs.

### 3. Run Database Migrations
To apply database migrations to your Supabase instance:

```bash
docker compose exec backend alembic upgrade head
```

### 4. Run Frontend (Next.js)
To start the Next.js development server:

```bash
cd frontend
npm install
npm run dev
```

The console will be available at http://localhost:3000.

---

## Database Migrations (Alembic)
To generate new migration files after modifying SQLAlchemy models:
```bash
docker compose exec backend alembic revision --autogenerate -m "describe_changes"
docker compose exec backend alembic upgrade head
```
