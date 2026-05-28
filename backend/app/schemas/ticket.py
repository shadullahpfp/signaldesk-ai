from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.ticket import TicketStatus, TicketUrgency

class TicketBase(BaseModel):
    subject: str
    description: str

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    urgency: Optional[TicketUrgency] = None
    agent_id: Optional[UUID] = None

class TicketResponse(TicketBase):
    id: UUID
    customer_id: UUID
    agent_id: Optional[UUID]
    status: TicketStatus
    urgency: TicketUrgency
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AIResponseSchema(BaseModel):
    id: UUID
    ticket_id: UUID
    summary: Optional[str]
    suggested_reply: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    action: str
    resource_id: Optional[UUID]
    metadata_data: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
