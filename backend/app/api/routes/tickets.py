from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, desc
from typing import List, Optional
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.ticket import Ticket, TicketStatus, TicketUrgency
from app.models.ai_response import AIResponse
from app.models.activity_log import ActivityLog
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse, AIResponseSchema, ActivityLogResponse
from app.services.ai_service import run_ticket_ai_triage
from app.services.audit_service import log_activity

router = APIRouter()

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = Ticket(
        customer_id=current_user.id,
        subject=ticket_in.subject,
        description=ticket_in.description,
        status=TicketStatus.OPEN,
        urgency=TicketUrgency.LOW
    )
    db.add(ticket)
    await db.flush() # Flush to generate ticket.id for the log
    await log_activity(
        db=db,
        action="TICKET_CREATED",
        user_id=current_user.id,
        resource_id=ticket.id,
        metadata_data={"subject": ticket.subject}
    )
    await db.commit()
    await db.refresh(ticket)
    
    # Trigger background AI classification and response draft
    background_tasks.add_task(run_ticket_ai_triage, ticket.id)
    return ticket

@router.get("/", response_model=List[TicketResponse])
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[TicketStatus] = Query(None, description="Filter by ticket status"),
    urgency: Optional[TicketUrgency] = Query(None, description="Filter by ticket urgency"),
    q: Optional[str] = Query(None, description="Text search on subject or description"),
    limit: int = Query(10, ge=1, le=100, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    # Role-based scoping
    if current_user.role == UserRole.CUSTOMER:
        filters = [Ticket.customer_id == current_user.id]
    else:
        filters = []

    # Apply filters
    if status:
        filters.append(Ticket.status == status)
    if urgency:
        filters.append(Ticket.urgency == urgency)
    if q:
        filters.append(or_(
            Ticket.subject.ilike(f"%{q}%"),
            Ticket.description.ilike(f"%{q}%")
        ))

    query = select(Ticket).filter(and_(*filters)).order_by(desc(Ticket.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Ticket).filter(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        
    # Security check: Customers can only see their own tickets
    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    return ticket

@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: uuid.UUID,
    ticket_update: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Ticket).filter(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        
    # Security check: Customers can only modify status to CLOSE their own tickets
    if current_user.role == UserRole.CUSTOMER:
        if ticket.customer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        # Customers can only close their own tickets
        if ticket_update.status and ticket_update.status != TicketStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customers can only change ticket status to CLOSED")
        if ticket_update.urgency or ticket_update.agent_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customers cannot change urgency or assign agents")

    # If assigning an agent, verify the assigned user is an AGENT or ADMIN
    if ticket_update.agent_id:
        agent_result = await db.execute(select(User).filter(User.id == ticket_update.agent_id))
        agent = agent_result.scalars().first()
        if not agent or agent.role not in [UserRole.AGENT, UserRole.ADMIN]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only assign tickets to Agents or Admins")

    # Calculate updates and log them transactionally
    metadata_data = {}
    if ticket_update.status is not None and ticket_update.status != ticket.status:
        metadata_data["old_status"] = ticket.status.value
        metadata_data["new_status"] = ticket_update.status.value
        ticket.status = ticket_update.status
    if ticket_update.urgency is not None and ticket_update.urgency != ticket.urgency:
        metadata_data["old_urgency"] = ticket.urgency.value
        metadata_data["new_urgency"] = ticket_update.urgency.value
        ticket.urgency = ticket_update.urgency
    if ticket_update.agent_id is not None and ticket_update.agent_id != ticket.agent_id:
        metadata_data["old_agent_id"] = str(ticket.agent_id) if ticket.agent_id else None
        metadata_data["new_agent_id"] = str(ticket_update.agent_id)
        ticket.agent_id = ticket_update.agent_id
        
    if metadata_data:
        await log_activity(
            db=db,
            action="TICKET_UPDATED",
            user_id=current_user.id,
            resource_id=ticket.id,
            metadata_data=metadata_data
        )
        
    await db.commit()
    await db.refresh(ticket)
    
    # Background Task: Trigger audit log here
    return ticket

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Ticket).filter(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        
    # Security check: Only Admin or the creator customer can delete a ticket
    if current_user.role != UserRole.ADMIN and (current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Log deletion before actual removal
    await log_activity(
        db=db,
        action="TICKET_DELETED",
        user_id=current_user.id,
        resource_id=ticket.id,
        metadata_data={"subject": ticket.subject}
    )
    await db.delete(ticket)
    await db.commit()
    return None

@router.get("/{ticket_id}/ai-response", response_model=AIResponseSchema)
async def get_ticket_ai_response(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Ticket).filter(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        
    # Security check: Customers can only see AI responses for their own tickets
    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    ai_result = await db.execute(select(AIResponse).filter(AIResponse.ticket_id == ticket_id))
    ai_resp = ai_result.scalars().first()
    
    if not ai_resp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI response not generated yet")
        
    return ai_resp

@router.get("/{ticket_id}/activity", response_model=List[ActivityLogResponse])
async def get_ticket_activity_log(
    ticket_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify ticket exists
    result = await db.execute(select(Ticket).filter(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        
    # Security check: Customers can only see activity for their own tickets
    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    activity_result = await db.execute(
        select(ActivityLog)
        .filter(ActivityLog.resource_id == ticket_id)
        .order_by(desc(ActivityLog.created_at))
    )
    return activity_result.scalars().all()
