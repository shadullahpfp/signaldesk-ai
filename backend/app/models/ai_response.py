import uuid
from datetime import datetime
from sqlalchemy import Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class AIResponse(Base):
    __tablename__ = "ai_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id"), index=True, nullable=False)
    
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    suggested_reply: Mapped[str] = mapped_column(Text, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
