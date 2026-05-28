import uuid
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog

async def log_activity(
    db: AsyncSession,
    action: str,
    user_id: Optional[uuid.UUID] = None,
    resource_id: Optional[uuid.UUID] = None,
    metadata_data: Optional[dict[str, Any]] = None
) -> ActivityLog:
    """
    Utility function to write audit/activity log events into the database.
    Does not commit the transaction, relying on the calling route's session lifecycle.
    """
    log_entry = ActivityLog(
        user_id=user_id,
        action=action,
        resource_id=resource_id,
        metadata_data=metadata_data
    )
    db.add(log_entry)
    # We use db.add() but don't commit. This keeps the write transactional and tied to the main operation.
    return log_entry
