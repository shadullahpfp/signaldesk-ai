from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# For asyncpg, we need to ensure the dialect is postgresql+asyncpg
# If the URL is just postgresql://, we replace it.
DB_URL = settings.DATABASE_URL
if DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DB_URL,
    echo=False,  # Set to True for SQL query logging in development
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    """
    Dependency to get the database session.
    Yields an AsyncSession that is closed after the request.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
