from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse

router = APIRouter()

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_in: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = Ticket(
        customer_id=current_user.id,
        subject=ticket_in.subject,
        description=ticket_in.description
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    # Background Task: trigger AI classification here
    return ticket

@router.get("/", response_model=List[TicketResponse])
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.CUSTOMER:
        query = select(Ticket).filter(Ticket.customer_id == current_user.id)
    else:
        query = select(Ticket) # Agents see all
        
    result = await db.execute(query)
    return result.scalars().all()
