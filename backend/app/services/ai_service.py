import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.ai.agent import SignalDeskAI
from app.models.ticket import Ticket, TicketUrgency
from app.models.ai_response import AIResponse
from app.models.activity_log import ActivityLog

async def run_ticket_ai_triage(ticket_id: uuid.UUID):
    """
    Asynchronous background task that performs AI operations on a ticket:
    1. Classifies urgency using GPT
    2. Summarizes the ticket
    3. Generates a professional draft response
    4. Saves the results to the database and updates ticket urgency
    """
    ai_agent = SignalDeskAI()
    
    # Create an independent database session for background processing
    async with AsyncSessionLocal() as db:
        try:
            # 1. Fetch the ticket
            result = await db.execute(select(Ticket).filter(Ticket.id == ticket_id))
            ticket = result.scalars().first()
            if not ticket:
                print(f"Background AI Triage: Ticket {ticket_id} not found.")
                return

            print(f"Background AI Triage starting for Ticket {ticket.id} - '{ticket.subject}'")

            # 2. Run AI operations concurrently/sequentially
            urgency_str = await ai_agent.classify_urgency(ticket.subject, ticket.description)
            summary = await ai_agent.summarize_ticket(ticket.subject, ticket.description)
            suggested_reply = await ai_agent.generate_reply(ticket.subject, ticket.description)

            # Map urgency string to Enum
            try:
                urgency_enum = TicketUrgency(urgency_str)
            except ValueError:
                urgency_enum = TicketUrgency.LOW

            # 3. Update the ticket's urgency
            ticket.urgency = urgency_enum
            
            # 4. Save the AI analysis in the ai_responses table
            ai_response = AIResponse(
                ticket_id=ticket.id,
                summary=summary,
                suggested_reply=suggested_reply,
                tokens_used=0  # Mock/Placeholder or calculate if desired
            )
            db.add(ai_response)

            # 5. Create an activity log for AI processing
            activity_log = ActivityLog(
                user_id=None,  # Null represents a system action
                action="AI_TRIAGE_COMPLETED",
                resource_id=ticket.id,
                metadata_data={
                    "urgency": urgency_str,
                    "summary_preview": summary[:100] + "..." if len(summary) > 100 else summary
                }
            )
            db.add(activity_log)

            # 6. Commit the transaction
            await db.commit()
            print(f"Background AI Triage successfully completed for Ticket {ticket.id}. Urgency={urgency_str}")

        except Exception as e:
            await db.rollback()
            print(f"Error in background AI Triage for Ticket {ticket_id}: {e}")
