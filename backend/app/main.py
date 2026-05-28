from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, tickets

from app.core.config import settings

app = FastAPI(
    title="SignalDesk AI",
    description="AI-powered customer workflow and intelligence platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "SignalDesk AI Backend is running"}
