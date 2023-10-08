from fastapi import APIRouter
from composable.api.routes.edgar import router as edgar_router

router = APIRouter()

router.include_router(edgar_router, prefix="/api/edgar", tags=["edgar"])


@router.get("/api")
async def root():
    return "Hello World"
